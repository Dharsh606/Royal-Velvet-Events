import { supabase, isSupabaseConfigured } from './supabase'

export { isSupabaseConfigured }

export function mapTestimonial(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    quote: row.quote,
    image: row.image,
  }
}

export function mapGalleryItem(row) {
  return {
    id: row.id,
    src: row.url,
    alt: row.alt || row.name || 'Event photo',
  }
}

export function mapReelLabel(row) {
  return row.title || row.name || 'Reel'
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
    heroTitle: data.hero_title || 'Royal Velvet Events',
    heroSubtitle: data.hero_subtitle || 'Effortlessly Lavish',
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
  return data.map(mapReelLabel)
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
  const [bookings, gallery, testimonials, reels, homepage] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('gallery').select('*').order('created_at', { ascending: false }),
    supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
    supabase.from('reels').select('*').order('created_at', { ascending: false }),
    supabase.from('site_settings').select('hero_title, hero_subtitle').eq('id', 'homepage').maybeSingle(),
  ])

  const tables = [bookings, gallery, testimonials, reels]
  const failed = tables.find((result) => result.error)
  if (failed?.error) throw failed.error
  if (homepage.error) throw homepage.error

  return {
    bookings: bookings.data,
    gallery: gallery.data,
    testimonials: testimonials.data,
    reels: reels.data,
    homepage: homepage.data
      ? {
          heroTitle: homepage.data.hero_title || 'Royal Velvet Events',
          heroSubtitle: homepage.data.hero_subtitle || 'Effortlessly Lavish',
        }
      : null,
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
  const { error } = await supabase.from('testimonials').insert({
    name: testimonial.name,
    role: testimonial.role,
    city: testimonial.city,
    quote: testimonial.quote,
    image: testimonial.image,
    is_published: true,
  })
  if (error) throw error
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
