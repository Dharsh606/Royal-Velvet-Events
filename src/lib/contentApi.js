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
  specializedServices: 80,
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

export function slugifyProject(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
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
  const mediaUrl = row.url || row.src || row.image_url || row.imageUrl || row.image || row.public_url || row.publicUrl || row.photo_url || row.photoUrl
  return {
    id: row.id,
    src: mediaUrl,
    url: mediaUrl,
    alt: label,
    name: label,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    isFeatured: row.is_featured ?? row.isFeatured ?? false,
  }
}

export function mapGalleryProject(row = {}) {
  const images = (row.gallery_project_images || row.images || [])
    .map((image) => ({
      id: image.id,
      projectId: image.project_id || image.projectId || row.id,
      url: image.url || image.src || image.image_url || image.public_url,
      src: image.url || image.src || image.image_url || image.public_url,
      alt: cleanDisplayName(image.alt || image.name) || 'The Royal Velvet project image',
      name: cleanDisplayName(image.name || image.alt) || 'Project image',
      caption: String(image.caption || image.alt || image.name || '').trim(),
      sortOrder: Number(image.sort_order ?? image.sortOrder ?? 0),
    }))
    .filter((image) => image.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    id: row.id,
    title: cleanDisplayName(row.title || row.name) || 'Untitled Project',
    slug: slugifyProject(row.slug || row.title || row.name) || `project-${String(row.id || '').slice(0, 8)}`,
    description: row.description || '',
    location: row.location || '',
    category: row.category || 'Luxury Celebration',
    seoTitle: row.seo_title || row.seoTitle || '',
    seoDescription: row.seo_description || row.seoDescription || '',
    projectDate: row.project_date || row.projectDate || '',
    isFeatured: Boolean(row.is_featured ?? row.isFeatured),
    isPublished: row.is_published ?? row.isPublished ?? true,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    createdAt: row.created_at || row.createdAt || '',
    updatedAt: row.updated_at || row.updatedAt || '',
    publishedAt: row.published_at || row.publishedAt || '',
    images,
  }
}

export function destinationKey(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function mapDestinationImage(row) {
  if (!row) return null
  const destinationName = row.destination_name || row.destinationName || row.name || ''
  const key = row.destination_key || row.destinationKey || destinationKey(destinationName)
  const mediaUrl = row.url || row.src || row.image_url || row.imageUrl || row.image || row.public_url || row.publicUrl
  if (!key || !mediaUrl) return null
  const label = cleanDisplayName(row.alt || row.title || destinationName) || destinationName || 'Destination image'
  return {
    id: row.id || key,
    destinationKey: key,
    destinationName,
    url: mediaUrl,
    src: mediaUrl,
    alt: label,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    updatedAt: row.updated_at || row.updatedAt || '',
  }
}

export function mergeDestinationImages(staticDestinations = [], remoteItems = []) {
  const imageMap = new Map(
    (remoteItems || [])
      .map((item) => (item?.destinationKey ? item : mapDestinationImage(item)))
      .filter(Boolean)
      .map((item) => [item.destinationKey, item]),
  )

  return staticDestinations.map((destination) => {
    const key = destinationKey(destination.name)
    const remoteImage = imageMap.get(key)
    return {
      ...destination,
      image: remoteImage ? (remoteImage.url || remoteImage.src || '') : '',
      imageAlt: remoteImage?.alt || destination.name,
      imageSource: remoteImage ? 'admin' : 'admin-pending',
    }
  })
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
  const remote = (remoteItems || [])
    .map((item) => (item.src || item.url ? item : mapGalleryItem(item)))
    .filter((item) => item?.src || item?.url)
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

export async function fetchGalleryProjects() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('gallery_projects')
    .select('*, gallery_project_images(*)')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('project_date', { ascending: false })

  if (error) return []
  return data.map(mapGalleryProject).filter((project) => project.images.length)
}

export async function fetchDestinationImages() {
  if (!supabase) return []
  const ordered = await supabase
    .from('destination_images')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (ordered.error && /sort_order/i.test(ordered.error.message || '')) {
    const retry = await supabase.from('destination_images').select('*').order('updated_at', { ascending: false })
    if (retry.error) return []
    return retry.data.map(mapDestinationImage).filter(Boolean)
  }

  if (ordered.error) return []
  return ordered.data.map(mapDestinationImage).filter(Boolean)
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

export async function submitPrivateInquiry(form) {
  if (!supabase) return null
  const payload = {
    name: form.name,
    phone: form.phone,
    email: form.email,
    date: form.date || null,
    type: form.type,
    child_name: form.childName || null,
    child_age: form.childAge || null,
    gender: form.gender || null,
    bride_groom: form.brideGroom || null,
    venue_name: form.venueName || null,
    venue_address: form.venueAddress || null,
    venue_setting: form.venueSetting || null,
    venue_booked: form.venueBooked || null,
    event_timing: form.eventTiming || null,
    setup_time: form.setupTime || null,
    venue_contact: form.venueContact || null,
    guests: form.guests || null,
    adults_count: form.adultsCount || null,
    kids_0to3: form.kids0to3 || null,
    kids_4to8: form.kids4to8 || null,
    kids_9plus: form.kids9plus || null,
    theme: form.theme || null,
    colours: form.colours || null,
    inspiration_photo: form.inspirationPhoto || null,
    decor_elements: form.decorElements || [],
    custom_name_logo: form.customNameLogo || null,
    entertainment_options: form.entertainmentOptions || [],
    entertainment_other: form.entertainmentOther || null,
    meal_type: form.mealType || null,
    dietary_type: form.dietaryType || null,
    catering_count: form.cateringCount || null,
    catering_addons: form.cateringAddons || [],
    catering_other: form.cateringOther || null,
    cake_status: form.cakeStatus || null,
    cake_flavour: form.cakeFlavour || null,
    cake_weight: form.cakeWeight || null,
    cake_reference: form.cakeReference || null,
    media_options: form.mediaOptions || [],
    gifts_needed: form.giftsNeeded || null,
    gift_budget: form.giftBudget || null,
    budget: form.budget || null,
    decision_maker: form.decisionMaker || null,
    confirmation_timeline: form.confirmationTimeline || null,
    spoken_other_planners: form.spokenOtherPlanners || null,
    special_requests: form.specialRequests || null,
    full_summary: form.vision || null,
    status: 'new inquiry',
  }
  
  const { error } = await supabase.from('private_inquiries').insert(payload)
  if (error) {
    console.warn('Could not insert to private_inquiries table, trying fallback to bookings table:', error.message)
    const fallbackPayload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      type: `Private Questionnaire: ${form.type}`,
      date: form.date || null,
      budget: form.budget || 'Not specified',
      location: form.venueAddress || form.venueName || 'Not specified',
      vision: form.vision || 'Private Questionnaire Submission',
      status: 'new inquiry',
    }
    const fallback = await supabase.from('bookings').insert(fallbackPayload)
    if (fallback.error) throw fallback.error
  }
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

  const destinationImagesQuery = await supabase
    .from('destination_images')
    .select('*')
    .order('updated_at', { ascending: false })

  const galleryProjectsQuery = await supabase
    .from('gallery_projects')
    .select('*, gallery_project_images(*)')
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('project_date', { ascending: false })

  const [bookings, testimonials, reels, membership, services, story, privateInquiries] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
    supabase.from('reels').select('*').order('created_at', { ascending: false }),
    supabase.from('membership_settings').select('*').order('updated_at', { ascending: true }),
    supabase.from('services').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('our_story_settings').select('*').eq('id', 'main').maybeSingle(),
    supabase.from('private_inquiries').select('*').order('created_at', { ascending: false }).catch(() => ({ data: [] })),
  ])

  const tables = [bookings, safeGallery, testimonials, reels]
  const failed = tables.find((result) => result.error)
  if (failed?.error) throw failed.error

  const localMembership = readLocalMembershipSettings([])
  const membershipData = membership.error || !membership.data?.length
    ? localMembership
    : normalizeOfferList(membership.data, localMembership)

  const mappedPrivateInquiries = (privateInquiries?.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    date: p.date,
    type: `Private Questionnaire: ${p.type}`,
    location: p.venue_address || p.venue_name || 'Not specified',
    budget: p.budget || 'Not specified',
    vision: p.full_summary || p.special_requests || 'Private Questionnaire Submission',
    status: p.status || 'new inquiry',
    created_at: p.created_at,
  }))

  const allBookings = [...(bookings.data || []), ...mappedPrivateInquiries].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  )

  return {
    bookings: allBookings,
    gallery: safeGallery.data,
    galleryProjects: galleryProjectsQuery.error ? [] : galleryProjectsQuery.data.map(mapGalleryProject),
    testimonials: testimonials.data,
    reels: reels.data,
    membership: membershipData,
    services: services.error ? [] : services.data.map(mapServiceItem).filter(Boolean),
    story: story.error || !story.data ? normalizeStorySettings() : normalizeStorySettings(story.data),
    destinationImages: destinationImagesQuery.error ? [] : destinationImagesQuery.data.map(mapDestinationImage).filter(Boolean),
  }
}

async function uploadGalleryProjectImage(projectId, file, imageName = '', sortOrder = 0, caption = '') {
  const safeName = file.name.replace(/\s+/g, '-')
  const path = `projects/${projectId}/${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('gallery').getPublicUrl(path)
  const label = cleanDisplayName(imageName) || cleanDisplayName(file.name)
  const { data: image, error } = await supabase
    .from('gallery_project_images')
    .insert({
      project_id: projectId,
      name: label,
      alt: label,
      caption: String(caption || label).trim(),
      url: data.publicUrl,
      sort_order: Number(sortOrder) || 0,
    })
    .select()
    .single()
  if (error) throw error
  return image
}

export async function insertGalleryProject(project = {}) {
  if (!supabase) return null
  if (!project.title?.trim()) throw new Error('Please enter a project name.')
  if (!project.files?.length) throw new Error('Please add at least one project image.')

  const shouldPublish = project.isPublished !== false
  const shouldFeature = Boolean(project.isFeatured)
  const payload = {
    title: cleanDisplayName(project.title),
    slug: slugifyProject(project.slug || project.title),
    description: String(project.description || '').trim(),
    location: String(project.location || '').trim(),
    category: String(project.category || 'Luxury Celebration').trim(),
    seo_title: String(project.seoTitle || '').trim(),
    seo_description: String(project.seoDescription || '').trim(),
    project_date: project.projectDate || null,
    // The record remains private until every image has completed uploading. This
    // ensures the publication webhook never rebuilds a half-finished project.
    is_featured: false,
    is_published: false,
    sort_order: Number(project.sortOrder) || 0,
    updated_at: new Date().toISOString(),
  }
  const { data: created, error } = await supabase.from('gallery_projects').insert(payload).select().single()
  if (error) throw error

  const imageRows = []
  for (const [index, item] of project.files.entries()) {
    imageRows.push(await uploadGalleryProjectImage(
      created.id,
      item.file || item,
      item.name || '',
      item.sortOrder ?? index,
      item.caption || item.name || '',
    ))
  }

  if (shouldFeature) {
    const { error: featureError } = await supabase
      .from('gallery_projects')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .neq('id', created.id)
    if (featureError) {
      await supabase.from('gallery_projects').update({ is_featured: false }).eq('id', created.id)
      throw featureError
    }
  }

  const { data: published, error: publishError } = await supabase
    .from('gallery_projects')
    .update({
      is_featured: shouldFeature,
      is_published: shouldPublish,
      updated_at: new Date().toISOString(),
    })
    .eq('id', created.id)
    .select('*, gallery_project_images(*)')
    .single()
  if (publishError) throw publishError

  return mapGalleryProject(published || { ...created, is_featured: shouldFeature, is_published: shouldPublish, gallery_project_images: imageRows })
}

export async function addGalleryProjectImages(projectId, files = []) {
  if (!supabase || !projectId || !files.length) return []
  const rows = []
  for (const [index, item] of files.entries()) {
    rows.push(await uploadGalleryProjectImage(
      projectId,
      item.file || item,
      item.name || '',
      item.sortOrder ?? index,
      item.caption || item.name || '',
    ))
  }
  const { error: touchError } = await supabase
    .from('gallery_projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)
  if (touchError) throw touchError
  return rows
}

function getPublicStoragePath(url = '', bucket = 'gallery') {
  const marker = `/storage/v1/object/public/${bucket}/`
  const markerIndex = String(url || '').indexOf(marker)
  if (markerIndex < 0) return ''

  try {
    return decodeURIComponent(String(url).slice(markerIndex + marker.length).split('?')[0])
  } catch {
    return String(url).slice(markerIndex + marker.length).split('?')[0]
  }
}

export async function deleteGalleryProjectImage(image = {}) {
  if (!supabase || !image?.id) return false

  const { error } = await supabase
    .from('gallery_project_images')
    .delete()
    .eq('id', image.id)
  if (error) throw error

  // The database row is the source of truth. Storage cleanup is best-effort so a
  // temporary storage failure never leaves a deleted image visible in the project.
  const storagePath = getPublicStoragePath(image.url || image.src, 'gallery')
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from('gallery').remove([storagePath])
    if (storageError && import.meta.env.DEV) console.warn('Project image storage cleanup failed', storageError)
  }

  if (image.projectId || image.project_id) {
    const { error: touchError } = await supabase
      .from('gallery_projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', image.projectId || image.project_id)
    if (touchError) throw touchError
  }

  return true
}

export async function updateGalleryProject(id, changes = {}) {
  if (!supabase || !id) return null
  const payload = {}
  if (changes.title !== undefined) payload.title = cleanDisplayName(changes.title) || 'Untitled Project'
  if (changes.slug !== undefined) {
    const nextSlug = slugifyProject(changes.slug || changes.title)
    if (nextSlug) payload.slug = nextSlug
  }
  if (changes.description !== undefined) payload.description = String(changes.description || '').trim()
  if (changes.location !== undefined) payload.location = String(changes.location || '').trim()
  if (changes.category !== undefined) payload.category = String(changes.category || 'Luxury Celebration').trim()
  if (changes.seoTitle !== undefined) payload.seo_title = String(changes.seoTitle || '').trim()
  if (changes.seoDescription !== undefined) payload.seo_description = String(changes.seoDescription || '').trim()
  if (changes.projectDate !== undefined) payload.project_date = changes.projectDate || null
  if (changes.isFeatured !== undefined) payload.is_featured = Boolean(changes.isFeatured)
  if (changes.isPublished !== undefined) payload.is_published = Boolean(changes.isPublished)
  if (changes.sortOrder !== undefined) payload.sort_order = Number(changes.sortOrder) || 0
  payload.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from('gallery_projects').update(payload).eq('id', id).select('*, gallery_project_images(*)').single()
  if (error) throw error

  if (changes.isFeatured === true) {
    const { error: featureError } = await supabase
      .from('gallery_projects')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .neq('id', id)
    if (featureError) {
      await supabase.from('gallery_projects').update({ is_featured: false }).eq('id', id)
      throw featureError
    }
  }
  return mapGalleryProject(data)
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

export async function uploadDestinationImage({ destinationName, file, displayName = '', sortOrder = 0 }) {
  if (!supabase || !file) return null
  const key = destinationKey(destinationName)
  if (!key) throw new Error('Please choose a destination.')

  const safeName = file.name.replace(/\s+/g, '-')
  const path = `destinations/${key}-${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('gallery').getPublicUrl(path)
  const url = data.publicUrl
  const label = cleanDisplayName(displayName) || destinationName
  const payload = {
    destination_key: key,
    destination_name: destinationName,
    url,
    alt: label,
    sort_order: Number(sortOrder) || 0,
    updated_at: new Date().toISOString(),
  }

  const { data: inserted, error } = await supabase
    .from('destination_images')
    .upsert(payload, { onConflict: 'destination_key' })
    .select()
    .single()
  if (error) throw error
  return mapDestinationImage(inserted)
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
