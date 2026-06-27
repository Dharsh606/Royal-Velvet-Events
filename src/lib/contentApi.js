import { supabase, isSupabaseConfigured } from './supabase'

export { isSupabaseConfigured }

const membershipStorageKey = 'trv-membership-settings'

const defaultStorySettings = {
  id: 'main',
  storyImageUrl: '',
  founderImageUrl: '',
  founderName: 'VIJAYA H REDDY',
  founderRole: 'Founder & Creative Director',
  founderQuote: 'Luxury is not noise. It is the confidence that every guest, every ritual, and every detail is already taken care of.',
  eventsCompleted: 150,
  citiesServed: 10,
  specializedServices: 70,
  clientSatisfaction: 100,
}

export function cleanDisplayName(value = '') {
  return String(value || '')
    .replace(/^.*[\\/]/, '')
    .replace(/\.(jpe?g|png|webp|gif|avif|mp4|webm|mov|m4v|ogg)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeOffer(row = {}, fallback = {}, index = 0) {
  return {
    id: row.id || fallback.id || `offer-${index + 1}`,
    active: row.active ?? fallback.active ?? true,
    title: row.title || fallback.title || 'Royal Velvet Privilege Membership',
    discountLabel: row.discount_label || row.discountLabel || fallback.discountLabel || '',
    description: row.description || fallback.description || '',
    note: row.note || fallback.note || '',
    startDate: row.start_date || row.startDate || fallback.startDate || '',
    endDate: row.end_date || row.endDate || fallback.endDate || '',
  }
}

function normalizeOfferList(value, fallback = []) {
  const fallbackList = Array.isArray(fallback) ? fallback : fallback ? [fallback] : []
  const rawList = Array.isArray(value) ? value : value ? [value] : fallbackList
  return rawList
    .map((item, index) => normalizeOffer(item, fallbackList[index] || fallbackList[0] || {}, index))
    .filter((item) => item.title || item.description || item.discountLabel)
    .slice(0, 3)
}

export function readLocalMembershipSettings(fallback = []) {
  if (typeof localStorage === 'undefined') return normalizeOfferList(fallback, fallback)
  try {
    const saved = localStorage.getItem(membershipStorageKey)
    return saved ? normalizeOfferList(JSON.parse(saved), fallback) : normalizeOfferList(fallback, fallback)
  } catch {
    return normalizeOfferList(fallback, fallback)
  }
}

export function writeLocalMembershipSettings(settings) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(membershipStorageKey, JSON.stringify(normalizeOfferList(settings, settings)))
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
  const label = cleanDisplayName(row.alt || row.title || row.name) || 'Event photo'
  return {
    id: row.id,
    src: row.url || row.src,
    url: row.url || row.src,
    alt: label,
    name: label,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    isFeatured: row.is_featured ?? row.isFeatured ?? false,
  }
}

export function normalizeStorySettings(row = {}) {
  return {
    ...defaultStorySettings,
    id: row.id || defaultStorySettings.id,
    storyImageUrl: row.story_image_url || row.storyImageUrl || defaultStorySettings.storyImageUrl,
    founderImageUrl: row.founder_image_url || row.founderImageUrl || defaultStorySettings.founderImageUrl,
    founderName: row.founder_name || row.founderName || defaultStorySettings.founderName,
    founderRole: row.founder_role || row.founderRole || defaultStorySettings.founderRole,
    founderQuote: row.founder_quote || row.founderQuote || defaultStorySettings.founderQuote,
    eventsCompleted: Number(row.events_completed ?? row.eventsCompleted ?? defaultStorySettings.eventsCompleted) || defaultStorySettings.eventsCompleted,
    citiesServed: Number(row.cities_served ?? row.citiesServed ?? defaultStorySettings.citiesServed) || defaultStorySettings.citiesServed,
    specializedServices: Number(row.specialized_services ?? row.specializedServices ?? defaultStorySettings.specializedServices) || defaultStorySettings.specializedServices,
    clientSatisfaction: Number(row.client_satisfaction ?? row.clientSatisfaction ?? defaultStorySettings.clientSatisfaction) || defaultStorySettings.clientSatisfaction,
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

  return merged.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || (a.sortOrder || 0) - (b.sortOrder || 0))
}

export function mapReelItem(row) {
  if (!row) return null
  if (typeof row === 'string') {
    return { id: row, title: row, url: null, isVideo: false }
  }

  const url = row.cover_url || row.coverUrl || row.url || null
  const reelUrl = row.instagram_url || row.instagramUrl || row.reel_url || row.reelUrl || row.link_url || row.linkUrl || row.link || null
  const isVideo =
    Boolean(url && /\.(mp4|webm|mov|m4v|ogg)$/i.test(url)) ||
    String(row.media_type || '').toLowerCase().includes('video')

  return {
    id: row.id || url || row.title || row.name,
    title: cleanDisplayName(row.title || row.name) || 'Reel',
    url,
    reelUrl,
    isVideo,
  }
}

export function mapServiceItem(row) {
  if (!row) return null
  return {
    id: row.id,
    categoryId: row.category_id || row.categoryId || 'management',
    cardTitle: row.card_title || row.cardTitle || '',
    title: cleanDisplayName(row.title || row.name) || 'Curated Service',
    text: row.description || row.text || '',
    isPublished: row.is_published ?? row.isPublished ?? true,
    source: 'admin',
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
  }
}

export function mergeServiceCategories(staticCategories = [], remoteItems = []) {
  const categories = staticCategories.map((category) => ({
    ...category,
    items: [...category.items],
  }))

  const fallbackCategory = {
    id: 'admin-curated',
    icon: '',
    title: 'Admin Curated Services',
    subtitle: 'Freshly published bespoke services from The Royal Velvet concierge desk.',
    items: [],
  }

  ;(remoteItems || [])
    .map(mapServiceItem)
    .filter((item) => item && item.isPublished !== false && item.title)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
    .forEach((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId) || fallbackCategory
      const exists = category.items.some((existing) => existing.title.toLowerCase() === item.title.toLowerCase())
      if (!exists) category.items.push(item)
    })

  if (fallbackCategory.items.length) categories.push(fallbackCategory)
  return categories
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

export async function fetchMembershipSettings(fallback = []) {
  const localSettings = readLocalMembershipSettings(fallback)
  if (!supabase) return localSettings

  const { data, error } = await supabase
    .from('membership_settings')
    .select('*')
    .order('updated_at', { ascending: true })

  if (error || !data?.length) return localSettings

  const remoteOffers = normalizeOfferList(data, localSettings)
  const visibleRemoteOffers = remoteOffers.filter((offer) => offer.title || offer.description || offer.discountLabel)
  return visibleRemoteOffers.length ? visibleRemoteOffers : localSettings
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
  const ordered = await supabase
    .from('gallery')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (!ordered.error) return ordered.data.map(mapGalleryItem)

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

export async function fetchStorySettings() {
  if (!supabase) return normalizeStorySettings()
  const { data, error } = await supabase
    .from('our_story_settings')
    .select('*')
    .eq('id', 'main')
    .maybeSingle()
  if (error || !data) return normalizeStorySettings()
  return normalizeStorySettings(data)
}

export async function fetchPublishedServices() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) return []
  return data.map(mapServiceItem).filter(Boolean)
}

export async function submitBooking(form) {
  if (!supabase) return null
  const payload = {
    name: form.name,
    phone: form.phone,
    email: form.email,
    type: form.type,
    date: form.date || null,
    budget: form.budget,
    location: form.location,
    vision: form.vision,
    status: 'new inquiry',
  }
  const { error } = await supabase.from('bookings').insert(payload)
  if (error && /status/i.test(error.message || '')) {
    const retry = await supabase.from('bookings').insert({ ...payload, status: 'new' })
    if (retry.error) throw retry.error
    return true
  }
  if (error) throw error
  return true
}

export async function fetchAdminContent() {
  if (!supabase) return null
  const galleryQuery = await supabase
    .from('gallery')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const safeGallery = galleryQuery.error
    ? await supabase.from('gallery').select('*').order('created_at', { ascending: false })
    : galleryQuery

  const [bookings, testimonials, reels, membership, services, story] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
    supabase.from('reels').select('*').order('created_at', { ascending: false }),
    supabase.from('membership_settings').select('*').order('updated_at', { ascending: true }),
    supabase.from('services').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('our_story_settings').select('*').eq('id', 'main').maybeSingle(),
  ])

  const tables = [bookings, safeGallery, testimonials, reels]
  const failed = tables.find((result) => result.error)
  if (failed?.error) throw failed.error

  const localMembership = readLocalMembershipSettings([])
  const membershipData = membership.error || !membership.data?.length
    ? localMembership
    : normalizeOfferList(membership.data, localMembership)

  return {
    bookings: bookings.data,
    gallery: safeGallery.data,
    testimonials: testimonials.data,
    reels: reels.data,
    membership: membershipData,
    services: services.error ? [] : services.data.map(mapServiceItem).filter(Boolean),
    story: story.error || !story.data ? normalizeStorySettings() : normalizeStorySettings(story.data),
  }
}

export async function uploadMedia(bucket, file, displayName = '', options = {}) {
  if (!supabase) return null
  const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  const url = data.publicUrl
  const label = cleanDisplayName(displayName) || cleanDisplayName(file.name)

  const row =
    bucket === 'gallery'
      ? { name: label, url, alt: label, sort_order: Number(options.sortOrder) || 0, is_featured: Boolean(options.isFeatured) }
      : { name: label, url, title: label }

  const { data: inserted, error } = await supabase.from(bucket).insert(row).select().single()
  if (!error) return inserted

  if (bucket === 'gallery' && /(sort_order|is_featured)/i.test(error.message || '')) {
    const fallbackRow = { name: label, url, alt: label }
    const retry = await supabase.from(bucket).insert(fallbackRow).select().single()
    if (retry.error) throw retry.error
    return retry.data
  }

  throw error
}

export async function updateBooking(id, changes = {}) {
  if (!supabase || !id) return null
  const payload = {}
  if (changes.status !== undefined) payload.status = changes.status
  if (changes.adminNotes !== undefined) payload.admin_notes = changes.adminNotes
  if (changes.followUpDate !== undefined) payload.follow_up_date = changes.followUpDate || null
  if (changes.proposalTier !== undefined) payload.proposal_tier = changes.proposalTier
  if (changes.estimatedQuoteRange !== undefined) payload.estimated_quote_range = changes.estimatedQuoteRange
  if (changes.proposalNotes !== undefined) payload.proposal_notes = changes.proposalNotes
  if (changes.nextAction !== undefined) payload.next_action = changes.nextAction
  if (changes.advanceStatus !== undefined) payload.advance_status = changes.advanceStatus

  const { data, error } = await supabase.from('bookings').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function updateGalleryItem(id, changes = {}) {
  if (!supabase || !id) return null
  const label = cleanDisplayName(changes.name || changes.alt || '')
  const payload = {}
  if (label) {
    payload.name = label
    payload.alt = label
  }
  if (changes.sortOrder !== undefined) payload.sort_order = Number(changes.sortOrder) || 0
  if (changes.isFeatured !== undefined) payload.is_featured = Boolean(changes.isFeatured)

  const { data, error } = await supabase.from('gallery').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function insertReel({ title, instagramUrl, coverFile }) {
  if (!supabase) return null
  if (!coverFile) throw new Error('Please choose a reel cover image.')
  if (!instagramUrl) throw new Error('Please paste the Instagram reel link.')

  const path = `${Date.now()}-${coverFile.name.replace(/\s+/g, '-')}`
  const { error: uploadError } = await supabase.storage.from('reels').upload(path, coverFile, { upsert: false })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('reels').getPublicUrl(path)
  const coverUrl = data.publicUrl
  const label = cleanDisplayName(title) || cleanDisplayName(coverFile.name)
  const payload = {
    title: label,
    name: label,
    url: coverUrl,
    instagram_url: instagramUrl,
    media_type: 'instagram-reel-cover',
  }

  const { data: inserted, error } = await supabase.from('reels').insert(payload).select().single()
  if (error) throw error
  return inserted
}

export async function insertService(service) {
  if (!supabase) return null
  const payload = {
    title: cleanDisplayName(service.title),
    description: service.description,
    category_id: service.categoryId,
    card_title: cleanDisplayName(service.cardTitle),
    is_published: service.isPublished ?? true,
    sort_order: Number(service.sortOrder) || 0,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('services').insert(payload).select().single()
  if (error) throw error
  return mapServiceItem(data)
}

export async function uploadStoryImage(file, label = 'our-story') {
  if (!supabase || !file) return ''
  const safeName = file.name.replace(/\s+/g, '-')
  const path = `our-story/${Date.now()}-${label}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('gallery').getPublicUrl(path)
  return data.publicUrl
}

export async function saveStorySettings(settings) {
  const payload = {
    id: 'main',
    story_image_url: settings.storyImageUrl || '',
    founder_image_url: settings.founderImageUrl || '',
    founder_name: settings.founderName || defaultStorySettings.founderName,
    founder_role: settings.founderRole || defaultStorySettings.founderRole,
    founder_quote: settings.founderQuote || defaultStorySettings.founderQuote,
    events_completed: Number(settings.eventsCompleted) || defaultStorySettings.eventsCompleted,
    cities_served: Number(settings.citiesServed) || defaultStorySettings.citiesServed,
    specialized_services: Number(settings.specializedServices) || defaultStorySettings.specializedServices,
    client_satisfaction: Number(settings.clientSatisfaction) || defaultStorySettings.clientSatisfaction,
    updated_at: new Date().toISOString(),
  }

  if (!supabase) return normalizeStorySettings(payload)
  const { data, error } = await supabase.from('our_story_settings').upsert(payload).select().single()
  if (error) throw error
  return normalizeStorySettings(data)
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
  const offers = normalizeOfferList(settings, settings).slice(0, 3)
  writeLocalMembershipSettings(offers)
  if (!supabase) return { remote: false }

  const rows = [0, 1, 2].map((index) => {
    const offer = offers[index]
    return {
      id: offer?.id || `offer-${index + 1}`,
      active: Boolean(offer?.active && offer?.title),
      title: offer?.title || '',
      discount_label: offer?.discountLabel || '',
      description: offer?.description || '',
      note: offer?.note || '',
      start_date: offer?.startDate || null,
      end_date: offer?.endDate || null,
      updated_at: new Date().toISOString(),
    }
  })

  const { error } = await supabase.from('membership_settings').upsert(rows)

  if (error && /(start_date|end_date)/i.test(error.message || '')) {
    const legacyRows = rows.map(({ start_date, end_date, ...row }) => row)
    const retry = await supabase.from('membership_settings').upsert(legacyRows)
    if (retry.error) return { remote: false, error: retry.error }
    return { remote: true, scheduleUnavailable: true }
  }

  if (error) return { remote: false, error }
  return { remote: true }
}
