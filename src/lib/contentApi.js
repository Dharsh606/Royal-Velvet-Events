import { supabase, isSupabaseConfigured } from './supabase'

export { isSupabaseConfigured }

const membershipStorageKey = 'trv-membership-settings'

export function readLocalMembershipSettings(fallback = null) {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const saved = localStorage.getItem(membershipStorageKey)
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback
  } catch {
    return fallback
  }
}

export function writeLocalMembershipSettings(settings) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(membershipStorageKey, JSON.stringify(settings))
}

export function mapTestimonial(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    city: row.city,
    quote: row.quote,
    rating: Number(row.rating) || 5,
  }
}

export function mapGalleryItem(row) {
  return {
    id: row.id,
    src: row.url || row.src,
    alt: row.alt || row.name || 'Event photo',
  }
}

export function mergeGallery(staticGallery = [], remoteItems = []) {
  const remote = (remoteItems || []).map((item) => (item.src ? item : mapGalleryItem(item)))
  const seen = new Set(remote.map((item) => item.src).filter(Boolean))
  const merged = [...remote]

  staticGallery.forEach((item) => {
    const src = item.src || item.url
    if (!src || seen.has(src)) return
    seen.add(src)
    merged.push({
      id: item.id || `static-${item.alt}`,
      src,
      alt: item.alt || 'Event photo',
    })
  })

  return merged
}

export function mapReelItem(row) {
  if (!row) return null
  if (typeof row === 'string') {
    return { id: row, title: row, url: null, isVideo: false }
  }

  const url = row.url || null
  const isVideo =
    Boolean(url && /\.(mp4|webm|mov|m4v|ogg)$/i.test(url)) ||
    String(row.media_type || '').toLowerCase().includes('video')

  return {
    id: row.id || url || row.title || row.name,
    title: row.title || row.name || 'Reel',
    url,
    isVideo,
  }
}

export function mergeReels(staticReels = [], remoteItems = []) {
  const remote = (remoteItems || []).map(mapReelItem).filter(Boolean)
  const seen = new Set(remote.map((item) => item.id).filter(Boolean))
  const merged = [...remote]

  staticReels.forEach((item) => {
    const reel = mapReelItem(item)
    if (!reel) return
    const key = reel.id || reel.title
    if (seen.has(key)) return
    seen.add(key)
    merged.push(reel)
  })

  return merged
}

export async function fetchHomepage() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('site_settings')
    .select('hero_title, hero_subtitle')
    .eq('id', 'homepage')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    heroTitle: data.hero_title || 'The Royal Velvet',
    heroSubtitle: data.hero_subtitle || 'Effortlessly Lavish',
  }
}

export async function fetchMembershipSettings(fallback = null) {
  const localSettings = readLocalMembershipSettings(fallback)
  if (!supabase) return localSettings

  const { data, error } = await supabase
    .from('membership_settings')
    .select('*')
    .eq('id', 'active')
    .maybeSingle()

  if (error || !data) return localSettings

  return {
    active: data.active ?? localSettings?.active ?? true,
    title: data.title || localSettings?.title,
    discountLabel: data.discount_label || localSettings?.discountLabel,
    description: data.description || localSettings?.description,
    note: data.note || localSettings?.note,
  }
}

export async function fetchPublishedTestimonials() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapTestimonial)
}

export async function fetchGallery() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapGalleryItem)
}

export async function fetchReels() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('reels')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapReelItem)
}

export async function submitBooking(form) {
  if (!supabase) return null
  const { error } = await supabase.from('bookings').insert({
    name: form.name,
    phone: form.phone,
    email: form.email,
    type: form.type,
    date: form.date || null,
    budget: form.budget,
    location: form.location,
    vision: form.vision,
    status: 'new',
  })
  if (error) throw error
  return true
}

export async function fetchAdminContent() {
  if (!supabase) return null
  const [bookings, gallery, testimonials, reels, homepage, membership] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('gallery').select('*').order('created_at', { ascending: false }),
    supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
    supabase.from('reels').select('*').order('created_at', { ascending: false }),
    supabase.from('site_settings').select('hero_title, hero_subtitle').eq('id', 'homepage').maybeSingle(),
    supabase.from('membership_settings').select('*').eq('id', 'active').maybeSingle(),
  ])

  const tables = [bookings, gallery, testimonials, reels]
  const failed = tables.find((result) => result.error)
  if (failed?.error) throw failed.error
  if (homepage.error) throw homepage.error

  const localMembership = readLocalMembershipSettings(null)
  const membershipData = membership.error || !membership.data
    ? localMembership
    : {
        active: membership.data.active ?? true,
        title: membership.data.title,
        discountLabel: membership.data.discount_label,
        description: membership.data.description,
        note: membership.data.note,
      }

  return {
    bookings: bookings.data,
    gallery: gallery.data,
    testimonials: testimonials.data,
    reels: reels.data,
    homepage: homepage.data
      ? {
          heroTitle: homepage.data.hero_title || 'The Royal Velvet',
          heroSubtitle: homepage.data.hero_subtitle || 'Effortlessly Lavish',
        }
      : null,
    membership: membershipData,
  }
}

export async function uploadMedia(bucket, file) {
  if (!supabase) return null
  const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  const url = data.publicUrl

  const row =
    bucket === 'gallery'
      ? { name: file.name, url, alt: file.name }
      : { name: file.name, url, title: file.name }

  const { data: inserted, error } = await supabase.from(bucket).insert(row).select().single()
  if (error) throw error
  return inserted
}

export async function deleteRow(table, id) {
  if (!supabase) return null
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function insertTestimonial(testimonial) {
  if (!supabase) return null
  const payload = {
    name: testimonial.name,
    role: testimonial.role,
    city: testimonial.city,
    quote: testimonial.quote,
    rating: Number(testimonial.rating) || 5,
    is_published: true,
  }

  const { error } = await supabase.from('testimonials').insert(payload)

  // Older Supabase tables may not have a rating column yet. In that case, publish the story
  // without blocking the admin, and the website will display a default 5-star rating.
  if (error && /rating/i.test(error.message || '')) {
    const { rating, ...fallbackPayload } = payload
    const retry = await supabase.from('testimonials').insert(fallbackPayload)
    if (retry.error) throw retry.error
    return true
  }

  if (error) throw error
  return true
}

export async function saveHomepageSettings({ heroTitle, heroSubtitle }) {
  if (!supabase) return null
  const { error } = await supabase.from('site_settings').upsert({
    id: 'homepage',
    hero_title: heroTitle,
    hero_subtitle: heroSubtitle,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function saveMembershipSettings(settings) {
  writeLocalMembershipSettings(settings)
  if (!supabase) return { remote: false }

  const { error } = await supabase.from('membership_settings').upsert({
    id: 'active',
    active: Boolean(settings.active),
    title: settings.title,
    discount_label: settings.discountLabel,
    description: settings.description,
    note: settings.note,
    updated_at: new Date().toISOString(),
  })

  if (error) return { remote: false, error }
  return { remote: true }
}
