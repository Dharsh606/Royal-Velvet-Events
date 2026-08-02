import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCloudUploadAlt,
  FaCrown,
  FaEnvelope,
  FaFilePdf,
  FaImages,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQuoteLeft,
  FaSignOutAlt,
  FaStar,
  FaTrash,
  FaVideo,
  FaWhatsapp,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCheckCircle,
} from 'react-icons/fa'
import { counters, defaultOfferSettings, destinations, founder, packages, serviceCategories } from '../data/content'
import {
  cleanDisplayName,
  slugifyProject,
  deleteGalleryProjectImage,
  deleteRow,
  deleteBookingInquiry,
  destinationKey,
  fetchAdminContent,
  insertService,
  insertGalleryProject,
  insertReel,
  insertTestimonial,
  isSupabaseConfigured,
  saveMembershipSettings,
  saveStorySettings,
  updateBooking,
  updateGalleryProject,
  updateGalleryItem,
  addGalleryProjectImages,
  uploadDestinationImage,
  uploadMedia,
  uploadStoryImage,
} from '../lib/contentApi'
import { supabase } from '../lib/supabase'
import {
  AdminDashboardEntryLoader,
  ConciergeDataLoader,
  LuxuryImage,
  RoyalTransactionOverlay,
} from './LuxurySystemStates'

const emptyContent = {
  gallery: [],
  galleryProjects: [],
  testimonials: [],
  bookings: [],
  reels: [],
  services: [],
  story: null,
  destinationImages: [],
}

const emptyGalleryProjectDraft = {
  title: '',
  slug: '',
  description: '',
  location: '',
  category: 'Luxury Celebration',
  seoTitle: '',
  seoDescription: '',
  projectDate: '',
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
}

const adminTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'media', label: 'Media' },
  { id: 'destinations', label: 'Destinations' },
  { id: 'services', label: 'Services' },
  { id: 'ourStory', label: 'Our Story' },
  { id: 'stories', label: 'Stories' },
  { id: 'offers', label: 'Offers' },
]

const bookingStatuses = [
  'new inquiry',
  'concierge review',
  'private consultation',
  'bespoke scope design',
  'royal proposal presented',
  'client refinement',
  'celebration confirmed',
]

const proposalTiers = ['Signature', 'Royal', 'Bespoke', 'Ultra Luxury']
const advanceStatuses = ['Pending', 'Requested', 'Received']

function normalizeBookingStatus(value = '') {
  const status = String(value || '').toLowerCase().trim()
  const legacyMap = {
    new: 'new inquiry',
    contacted: 'private consultation',
    'proposal sent': 'royal proposal presented',
    confirmed: 'celebration confirmed',
    closed: 'celebration confirmed',
  }
  return legacyMap[status] || status || 'new inquiry'
}

function titleCase(value = '') {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function statusClass(value = '') {
  return normalizeBookingStatus(value).replace(/[^a-z0-9]+/g, '-')
}

const adminEase = [0.22, 1, 0.36, 1]

const adminSoft = {
  hidden: { opacity: 0, y: 28, scale: 0.975 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.85, ease: adminEase },
  },
}


function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminPanel() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [content, setContent] = useState(emptyContent)
  const [testimonial, setTestimonial] = useState({ name: '', role: '', quote: '', city: '', rating: 5 })
  const [reelDraft, setReelDraft] = useState({ title: '', instagramUrl: '', coverFile: null })
  const [galleryDrafts, setGalleryDrafts] = useState([])
  const [galleryProjectDraft, setGalleryProjectDraft] = useState(emptyGalleryProjectDraft)
  const [destinationDraft, setDestinationDraft] = useState({
    destinationName: destinations[0]?.name || '',
    title: '',
    imageFile: null,
    previewUrl: '',
  })
  const defaultStoryDraft = {
    storyImageUrl: '',
    founderImageUrl: '',
    founderName: founder.name,
    founderRole: founder.role,
    founderQuote: founder.quote,
    eventsCompleted: counters[0]?.value || 150,
    citiesServed: counters[1]?.value || 10,
    specializedServices: counters[2]?.value || 70,
    clientSatisfaction: counters[3]?.value || 100,
  }
  const [storyDraft, setStoryDraft] = useState(defaultStoryDraft)
  const [storyFiles, setStoryFiles] = useState({ storyImage: null, founderImage: null })
  const [storyPreviews, setStoryPreviews] = useState({ storyImage: '', founderImage: '' })
  const [serviceDraft, setServiceDraft] = useState({
    title: '',
    description: '',
    categoryId: serviceCategories[0]?.id || 'management',
    cardTitle: '',
    sortOrder: 0,
    isPublished: true,
  })
  const [offers, setOffers] = useState(defaultOfferSettings)
  const [status, setStatus] = useState('')
  const [authError, setAuthError] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [authenticating, setAuthenticating] = useState(false)
  const [authMinimumComplete, setAuthMinimumComplete] = useState(false)
  const [dashboardDataReady, setDashboardDataReady] = useState(false)
  const [publishingProject, setPublishingProject] = useState(false)
  const [transaction, setTransaction] = useState(null)
  const inactivityTimer = useRef(null)
  const authTransitionTimer = useRef(null)
  const galleryDraftsRef = useRef([])
  const [activeBookingModalId, setActiveBookingModalId] = useState(null)

  const publishedAdminServices = useMemo(
    () => content.services.filter((item) => item.isPublished !== false),
    [content.services],
  )

  const totalServices = useMemo(
    () => serviceCategories.reduce((sum, cat) => sum + cat.items.length, 0) + publishedAdminServices.length,
    [publishedAdminServices],
  )

  const liveCategoryCount = useMemo(() => {
    const categoryIds = new Set(serviceCategories.map((category) => category.id))
    publishedAdminServices.forEach((service) => {
      if (service.categoryId) categoryIds.add(service.categoryId)
    })
    return categoryIds.size
  }, [publishedAdminServices])

  const liveStoryStats = useMemo(() => {
    const story = content.story || storyDraft
    const specializedServices = Math.max(Number(story?.specializedServices) || 0, totalServices)
    return {
      eventsCompleted: Number(story?.eventsCompleted) || counters[0]?.value || 150,
      citiesServed: Number(story?.citiesServed) || counters[1]?.value || 10,
      specializedServices,
      clientSatisfaction: Number(story?.clientSatisfaction) || counters[3]?.value || 100,
    }
  }, [content.story, storyDraft, totalServices])

  const loadContent = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return
    setLoading(true)
    try {
      const data = await fetchAdminContent()
      if (data) {
        setContent({
          bookings: data.bookings,
          gallery: data.gallery,
          galleryProjects: data.galleryProjects || [],
          testimonials: data.testimonials,
          reels: data.reels,
          services: data.services || [],
          story: data.story || null,
          destinationImages: data.destinationImages || [],
        })
        if (data.story) setStoryDraft(data.story)
        if (data.membership?.length) setOffers(data.membership)
      }
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
      setDashboardDataReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadContent()
  }, [user, loadContent])

  useEffect(() => {
    if (!authenticating || !user || !authMinimumComplete || !dashboardDataReady) return undefined
    const revealTimer = window.setTimeout(() => setAuthenticating(false), 320)
    return () => window.clearTimeout(revealTimer)
  }, [authenticating, user, authMinimumComplete, dashboardDataReady])

  useEffect(() => () => window.clearTimeout(authTransitionTimer.current), [])

  useEffect(() => {
    if (!user) return undefined

    const lockAdminSession = async () => {
      window.clearTimeout(inactivityTimer.current)
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut()
      }
      setUser(null)
      setContent(emptyContent)
      setCredentials({ email: '', password: '' })
      setActiveTab('overview')
      setStatus('Admin session locked after 3 minutes of inactivity. Please sign in again.')
    }

    const resetInactivityTimer = () => {
      window.clearTimeout(inactivityTimer.current)
      inactivityTimer.current = window.setTimeout(lockAdminSession, 3 * 60 * 1000)
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer, { passive: true }))
    resetInactivityTimer()

    return () => {
      window.clearTimeout(inactivityTimer.current)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer))
    }
  }, [user])

  useEffect(() => {
    if (!user) return undefined
    const clearAdminOnClose = () => {
      window.clearTimeout(inactivityTimer.current)
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signOut()
      }
    }

    window.addEventListener('pagehide', clearAdminOnClose)
    window.addEventListener('beforeunload', clearAdminOnClose)
    return () => {
      window.removeEventListener('pagehide', clearAdminOnClose)
      window.removeEventListener('beforeunload', clearAdminOnClose)
    }
  }, [user])

  useEffect(() => {
    galleryDraftsRef.current = galleryDrafts
  }, [galleryDrafts])

  useEffect(() => {
    return () => {
      galleryDraftsRef.current.forEach((draft) => draft.previewUrl && URL.revokeObjectURL(draft.previewUrl))
      if (destinationDraft.previewUrl) URL.revokeObjectURL(destinationDraft.previewUrl)
    }
  }, [destinationDraft.previewUrl])

  const localUpload = (file, bucket, displayName = '') => {
    const url = URL.createObjectURL(file)
    const label = cleanDisplayName(displayName) || cleanDisplayName(file.name)
    const entry =
      bucket === 'gallery'
        ? { id: crypto.randomUUID(), url, name: label, alt: label, sort_order: 0, is_featured: false }
        : { id: crypto.randomUUID(), url, name: label, title: label }
    setContent((current) => ({
      ...current,
      [bucket]: [entry, ...current[bucket]],
    }))
  }

  const stageGalleryFiles = (files = []) => {
    const imageFiles = Array.from(files).filter((file) => file?.type?.startsWith('image/'))
    if (!imageFiles.length) return
    const drafts = imageFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      title: cleanDisplayName(file.name),
      sortOrder: 0,
      isFeatured: false,
      previewUrl: URL.createObjectURL(file),
    }))
    setGalleryDrafts((current) => [...current, ...drafts])
    setStatus('')
  }

  const updateGalleryDraft = (id, changes) => {
    setGalleryDrafts((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }

  const removeGalleryDraft = (id) => {
    setGalleryDrafts((current) => {
      const draft = current.find((item) => item.id === id)
      if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl)
      return current.filter((item) => item.id !== id)
    })
  }

  const publishGalleryDrafts = async () => {
    if (publishingProject) return
    if (!galleryDrafts.length) {
      setStatus('Please choose project images before publishing.')
      return
    }
    if (!galleryProjectDraft.title.trim()) {
      setStatus('Please enter the project name before publishing.')
      return
    }
    setStatus('Publishing project and securing its image collection…')
    setPublishingProject(true)
    setTransaction({
      title: 'Publishing the project archive',
      message: 'The project and its curated image collection are being secured in the Royal Velvet archive.',
    })
    try {
      if (isSupabaseConfigured && supabase) {
        const createdProject = await insertGalleryProject({
          ...galleryProjectDraft,
          files: galleryDrafts.map((draft) => ({ ...draft, name: draft.title })),
        })
        if (!createdProject) throw new Error('The project could not be confirmed after upload.')
        setContent((current) => ({
          ...current,
          galleryProjects: [
            createdProject,
            ...current.galleryProjects
              .filter((project) => project.id !== createdProject.id)
              .map((project) => (createdProject.isFeatured ? { ...project, isFeatured: false } : project)),
          ],
        }))
      } else {
        const project = {
          id: crypto.randomUUID(),
          title: galleryProjectDraft.title,
          slug: slugifyProject(galleryProjectDraft.slug || galleryProjectDraft.title),
          description: galleryProjectDraft.description,
          location: galleryProjectDraft.location,
          category: galleryProjectDraft.category,
          seoTitle: galleryProjectDraft.seoTitle,
          seoDescription: galleryProjectDraft.seoDescription,
          projectDate: galleryProjectDraft.projectDate,
          isFeatured: galleryProjectDraft.isFeatured,
          isPublished: galleryProjectDraft.isPublished,
          sortOrder: Number(galleryProjectDraft.sortOrder) || 0,
          images: galleryDrafts.map((draft) => ({ id: draft.id, url: draft.previewUrl, src: draft.previewUrl, name: draft.title, alt: draft.title })),
        }
        setContent((current) => ({
          ...current,
          galleryProjects: [
            project,
            ...current.galleryProjects.map((item) => (project.isFeatured ? { ...item, isFeatured: false } : item)),
          ],
        }))
      }
      galleryDrafts.forEach((draft) => draft.previewUrl && URL.revokeObjectURL(draft.previewUrl))
      setGalleryDrafts([])
      setGalleryProjectDraft(emptyGalleryProjectDraft)
      setStatus(`Project published with ${galleryDrafts.length} image${galleryDrafts.length > 1 ? 's' : ''}. Its SEO page and image sitemap will refresh automatically after deployment.`)
      setActiveTab('media')
    } catch (error) {
      setStatus(error.message || 'Project publish failed. Run the Gallery Projects SQL upgrade first.')
    } finally {
      setPublishingProject(false)
      setTransaction(null)
    }
  }

  const saveGalleryProject = async (id, changes) => {
    setTransaction({ title: 'Saving the project', message: 'The archive details and featured-project direction are being confirmed.' })
    try {
      let updatedProject = null
      if (isSupabaseConfigured && supabase) {
        updatedProject = await updateGalleryProject(id, changes)
      } else {
        const currentProject = content.galleryProjects.find((project) => project.id === id)
        updatedProject = currentProject ? { ...currentProject, ...changes } : null
      }

      if (!updatedProject) throw new Error('The updated project could not be confirmed.')
      setContent((current) => ({
        ...current,
        galleryProjects: current.galleryProjects.map((project) => {
          if (project.id === id) return updatedProject
          return updatedProject.isFeatured ? { ...project, isFeatured: false } : project
        }),
      }))
      setStatus('Project details updated.')
      return updatedProject
    } catch (error) {
      setStatus(error.message || 'Could not update project details.')
      return null
    } finally {
      setTransaction(null)
    }
  }

  const addImagesToGalleryProject = async (projectId, files) => {
    if (!files?.length) return
    setTransaction({ title: 'Expanding the project archive', message: 'The new project visuals are being uploaded and arranged securely.' })
    try {
      if (isSupabaseConfigured && supabase) {
        const currentProject = content.galleryProjects.find((project) => project.id === projectId)
        const nextSortOrder = (currentProject?.images || []).reduce(
          (highest, image) => Math.max(highest, Number(image.sortOrder) || 0),
          -1,
        ) + 1
        await addGalleryProjectImages(projectId, files.map((file, index) => ({
          file,
          name: cleanDisplayName(file.name),
          sortOrder: nextSortOrder + index,
        })))
        await loadContent()
      }
      setStatus(`${files.length} project image${files.length > 1 ? 's' : ''} added.`)
    } catch (error) {
      setStatus(error.message || 'Could not add project images.')
    } finally {
      setTransaction(null)
    }
  }

  const removeImageFromGalleryProject = async (projectId, image) => {
    if (!projectId || !image?.id) return
    setTransaction({
      title: 'Refining the project collection',
      message: 'The selected visual is being removed from this private archive.',
    })
    try {
      if (isSupabaseConfigured && supabase) await deleteGalleryProjectImage(image)
      setContent((current) => ({
        ...current,
        galleryProjects: current.galleryProjects.map((project) => (
          project.id === projectId
            ? { ...project, images: (project.images || []).filter((item) => item.id !== image.id) }
            : project
        )),
      }))
      setStatus('Project image removed.')
    } catch (error) {
      setStatus(error.message || 'Could not remove this project image.')
    } finally {
      setTransaction(null)
    }
  }

  const handleDrop = async (event, bucket) => {
    event.preventDefault()
    if (bucket === 'gallery') stageGalleryFiles(event.dataTransfer.files)
  }

  const handleAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setStatus('')

    if (!isSupabaseConfigured || !supabase) {
      setAuthError('Admin login is unavailable until Supabase is configured.')
      return
    }

    setAuthenticating(true)
    setAuthMinimumComplete(false)
    setDashboardDataReady(false)
    window.clearTimeout(authTransitionTimer.current)
    authTransitionTimer.current = window.setTimeout(() => setAuthMinimumComplete(true), 2500)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      })
      if (error) throw error
      if (data?.user) setUser(data.user)
    } catch (error) {
      window.clearTimeout(authTransitionTimer.current)
      setAuthenticating(false)
      setAuthMinimumComplete(false)
      setDashboardDataReady(false)
      setAuthError('Invalid admin credentials. Access is restricted to the approved admin account.')
    }
  }

  const addTestimonial = async (event) => {
    event.preventDefault()
    setStatus('')
    setTransaction({ title: 'Publishing the client story', message: 'The testimonial is being verified and placed into the public story collection.' })
    try {
      if (isSupabaseConfigured && supabase) {
        await insertTestimonial(testimonial)
        await loadContent()
        setStatus('Testimonial published.')
        setActiveTab('stories')
      } else {
        setContent((current) => ({
          ...current,
          testimonials: [{ id: crypto.randomUUID(), ...testimonial }, ...current.testimonials],
        }))
      }
      setTestimonial({ name: '', role: '', quote: '', city: '', rating: 5 })
    } catch (error) {
      setStatus(error.message || 'Could not publish testimonial.')
    } finally {
      setTransaction(null)
    }
  }

  const addReel = async (event) => {
    event.preventDefault()
    setStatus('')
    setTransaction({ title: 'Publishing the social story', message: 'The reel cover and its private Instagram route are being confirmed.' })
    try {
      if (isSupabaseConfigured && supabase) {
        await insertReel(reelDraft)
        await loadContent()
        setStatus('Instagram reel cover and link published.')
      } else if (reelDraft.coverFile) {
        const url = URL.createObjectURL(reelDraft.coverFile)
        setContent((current) => ({
          ...current,
          reels: [
            {
              id: crypto.randomUUID(),
              title: reelDraft.title || reelDraft.coverFile.name,
              name: reelDraft.title || reelDraft.coverFile.name,
              url,
              instagram_url: reelDraft.instagramUrl,
            },
            ...current.reels,
          ],
        }))
      }
      setReelDraft({ title: '', instagramUrl: '', coverFile: null })
      setPreview(null)
      setActiveTab('media')
    } catch (error) {
      setStatus(error.message || 'Could not publish reel.')
    } finally {
      setTransaction(null)
    }
  }

  const publishDestinationImage = async (event) => {
    event.preventDefault()
    setStatus('')
    if (!destinationDraft.destinationName || !destinationDraft.imageFile) {
      setStatus('Please choose a destination and upload an image.')
      return
    }

    setTransaction({ title: 'Refining the destination collection', message: 'The destination visual is being prepared and published to its state card.' })
    try {
      if (isSupabaseConfigured && supabase) {
        await uploadDestinationImage({
          destinationName: destinationDraft.destinationName,
          file: destinationDraft.imageFile,
          displayName: destinationDraft.title || destinationDraft.destinationName,
        })
        await loadContent()
      } else {
        const key = destinationKey(destinationDraft.destinationName)
        setContent((current) => ({
          ...current,
          destinationImages: [
            {
              id: key,
              destinationKey: key,
              destinationName: destinationDraft.destinationName,
              url: destinationDraft.previewUrl,
              alt: destinationDraft.title || destinationDraft.destinationName,
            },
            ...current.destinationImages.filter((item) => item.destinationKey !== key),
          ],
        }))
      }

      if (destinationDraft.previewUrl) URL.revokeObjectURL(destinationDraft.previewUrl)
      setDestinationDraft({
        destinationName: destinations[0]?.name || '',
        title: '',
        imageFile: null,
        previewUrl: '',
      })
      setStatus('Destination card image updated.')
      setActiveTab('destinations')
    } catch (error) {
      setStatus(error.message || 'Could not publish destination image. Make sure the destination_images table exists.')
    } finally {
      setTransaction(null)
    }
  }

  const addService = async (event) => {
    event.preventDefault()
    setStatus('')
    setTransaction({ title: 'Publishing the service', message: 'The new service is being added to the live Royal Velvet catalogue.' })
    try {
      if (isSupabaseConfigured && supabase) {
        await insertService(serviceDraft)
        await loadContent()
        setStatus('Service published to the website.')
      } else {
        const localService = {
          id: crypto.randomUUID(),
          ...serviceDraft,
          text: serviceDraft.description,
          source: 'admin',
        }
        setContent((current) => ({ ...current, services: [localService, ...current.services] }))
      }
      setServiceDraft({
        title: '',
        description: '',
        categoryId: serviceCategories[0]?.id || 'management',
        cardTitle: '',
        sortOrder: 0,
        isPublished: true,
      })
      setActiveTab('services')
    } catch (error) {
      setStatus(error.message || 'Could not publish service. Make sure the Supabase services table is created.')
    } finally {
      setTransaction(null)
    }
  }

  const handleStoryFile = (key, file) => {
    if (!file) return
    setStoryFiles((current) => ({ ...current, [key]: file }))
    setStoryPreviews((current) => {
      if (current[key]) URL.revokeObjectURL(current[key])
      return { ...current, [key]: URL.createObjectURL(file) }
    })
  }

  const saveOurStory = async (event) => {
    event.preventDefault()
    setStatus('')
    setTransaction({ title: 'Preserving the brand story', message: 'Founder details, imagery, and live milestones are being safely updated.' })
    try {
      let nextSettings = { ...storyDraft }

      if (isSupabaseConfigured && supabase) {
        if (storyFiles.storyImage) {
          nextSettings.storyImageUrl = await uploadStoryImage(storyFiles.storyImage, 'story')
        }
        if (storyFiles.founderImage) {
          nextSettings.founderImageUrl = await uploadStoryImage(storyFiles.founderImage, 'founder')
        }
        const saved = await saveStorySettings(nextSettings)
        nextSettings = saved
      }

      setStoryDraft(nextSettings)
      setContent((current) => ({ ...current, story: nextSettings }))
      Object.values(storyPreviews).forEach((url) => url && URL.revokeObjectURL(url))
      setStoryFiles({ storyImage: null, founderImage: null })
      setStoryPreviews({ storyImage: '', founderImage: '' })
      setStatus(isSupabaseConfigured ? 'Our Story settings saved and published.' : 'Our Story settings saved locally for this session.')
      setActiveTab('ourStory')
    } catch (error) {
      setStatus(error.message || 'Could not save Our Story settings. Make sure the Supabase table is created.')
    } finally {
      setTransaction(null)
    }
  }

  const removeItem = async (table, id, stateKey = table) => {
    setStatus('')
    const targetItem = (content[stateKey] || []).find((item) => item.id === id)

    // Instantly remove card from local React UI state so count and card update in 0ms
    setContent((current) => ({
      ...current,
      [stateKey]: (current[stateKey] || []).filter((item) => item.id !== id),
    }))

    setTransaction({
      title: 'Updating the private archive',
      message: 'The selected item is being removed and the live collection is being synchronised.',
    })

    try {
      if (isSupabaseConfigured && supabase) {
        if (table === 'bookings' || stateKey === 'bookings') {
          await deleteBookingInquiry(targetItem || { id })
        } else {
          await deleteRow(table, id)
        }
        await loadContent()
        setStatus('Item removed.')
      } else {
        setStatus('Item removed.')
      }
    } catch (error) {
      console.warn('Could not remove item from database:', error.message)
      setStatus('Item removed.')
    } finally {
      setTransaction(null)
    }
  }

  const saveBookingDetails = async (id, changes) => {
    setStatus('')
    setTransaction({ title: 'Updating the consultation dossier', message: 'Client status, notes, and follow-up details are being secured.' })
    try {
      if (isSupabaseConfigured && supabase) {
        await updateBooking(id, changes)
        await loadContent()
      } else {
        setContent((current) => ({
          ...current,
          bookings: current.bookings.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: changes.status ?? item.status,
                  admin_notes: changes.adminNotes ?? item.admin_notes,
                  follow_up_date: changes.followUpDate ?? item.follow_up_date,
                  proposal_tier: changes.proposalTier ?? item.proposal_tier,
                  estimated_quote_range: changes.estimatedQuoteRange ?? item.estimated_quote_range,
                  proposal_notes: changes.proposalNotes ?? item.proposal_notes,
                  next_action: changes.nextAction ?? item.next_action,
                  advance_status: changes.advanceStatus ?? item.advance_status,
                }
              : item,
          ),
        }))
      }
      setStatus('Booking inquiry updated.')
    } catch (error) {
      setStatus(error.message || 'Could not update booking inquiry. Run the booking admin SQL upgrade if needed.')
    } finally {
      setTransaction(null)
    }
  }

  const saveGalleryDetails = async (id, changes) => {
    setStatus('')
    setTransaction({ title: 'Refining the gallery display', message: 'Image order and featured presentation are being updated.' })
    try {
      if (isSupabaseConfigured && supabase) {
        await updateGalleryItem(id, changes)
        await loadContent()
      } else {
        setContent((current) => ({
          ...current,
          gallery: current.gallery.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: changes.name ?? item.name,
                  alt: changes.name ?? item.alt,
                  sort_order: changes.sortOrder ?? item.sort_order,
                  is_featured: changes.isFeatured ?? item.is_featured,
                }
              : item,
          ),
        }))
      }
      setStatus('Gallery display settings updated.')
    } catch (error) {
      setStatus(error.message || 'Could not update gallery item. Run the gallery SQL upgrade if needed.')
    } finally {
      setTransaction(null)
    }
  }

  const updateOffer = (index, changes) => {
    setOffers((current) => current.map((offer, offerIndex) => (offerIndex === index ? { ...offer, ...changes } : offer)))
  }

  const addOffer = () => {
    setOffers((current) => {
      if (current.length >= 3) return current
      return [
        ...current,
        {
          id: `offer-${current.length + 1}`,
          active: true,
          title: '',
          discountLabel: '',
          description: '',
          note: '',
          startDate: '',
          endDate: '',
        },
      ]
    })
  }

  const removeOffer = (index) => {
    setOffers((current) => current.filter((_, offerIndex) => offerIndex !== index))
  }

  const saveMembership = async (event) => {
    event.preventDefault()
    setStatus('')
    setTransaction({ title: 'Publishing private privileges', message: 'Offer details and availability windows are being synchronised with the website.' })
    try {
      const result = await saveMembershipSettings(offers)
      setStatus(
        result?.scheduleUnavailable
          ? 'Offers saved. Run the offer scheduling SQL upgrade to activate start/end dates.'
          : result?.remote
            ? 'Offers saved and published.'
            : 'Offers saved locally. Supabase will publish globally when membership_settings is available.',
      )
    } catch (error) {
      setStatus(error.message || 'Could not save membership settings.')
    } finally {
      setTransaction(null)
    }
  }

  const signOutAdmin = async () => {
    window.clearTimeout(inactivityTimer.current)
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setContent(emptyContent)
    setCredentials({ email: '', password: '' })
    window.location.href = '/'
  }

  const metrics = useMemo(() => [
    { id: 'bookings', label: 'New Inquiries', value: content.bookings.length, icon: <FaCalendarAlt />, hint: 'Private consultations' },
    { id: 'services', label: 'Live Services', value: totalServices, icon: <FaCrown />, hint: 'Base catalogue + admin published services' },
    { id: 'gallery', label: 'Gallery Projects', value: content.galleryProjects.length, icon: <FaImages />, hint: 'Published celebration stories' },
    { id: 'destinations', label: 'Destination Images', value: content.destinationImages.length, icon: <FaMapMarkerAlt />, hint: 'State cards controlled by admin' },
    { id: 'reels', label: 'Instagram Reels', value: content.reels.length, icon: <FaVideo />, hint: 'Cover cards linking to Instagram' },
    { id: 'testimonials', label: 'Testimonials', value: content.testimonials.length, icon: <FaQuoteLeft />, hint: 'Published client stories' },
  ], [
    content.bookings.length,
    content.destinationImages.length,
    content.galleryProjects.length,
    content.reels.length,
    content.testimonials.length,
    totalServices,
  ])

  const visibleMetrics = useMemo(() => {
    if (activeTab === 'overview') return metrics
    const metricIdsByTab = {
      bookings: ['bookings'],
      media: ['gallery', 'reels'],
      destinations: ['destinations'],
      services: ['services'],
      stories: ['testimonials'],
    }
    const ids = metricIdsByTab[activeTab] || []
    return metrics.filter((metric) => ids.includes(metric.id))
  }, [activeTab, metrics])

  const analytics = [
    ['Lead Response Readiness', 92],
    ['Content Completeness', Math.min(100, 35 + content.galleryProjects.length * 12 + content.testimonials.length * 12)],
    ['Media Library Strength', Math.min(100, content.galleryProjects.reduce((sum, project) => sum + (project.images?.length || 0), 0) * 7 + content.reels.length * 16)],
  ]

  const categoryLabelById = useMemo(
    () => Object.fromEntries(serviceCategories.map((category) => [category.id, category.title.replace(' Services', '')])),
    [],
  )
  const destinationImageByKey = useMemo(
    () => Object.fromEntries(content.destinationImages.map((item) => [item.destinationKey || destinationKey(item.destinationName), item])),
    [content.destinationImages],
  )

  const liveCategoryCounts = useMemo(() => {
    const counts = Object.fromEntries(serviceCategories.map((category) => [category.id, category.items.length]))
    content.services
      .filter((item) => item.isPublished !== false)
      .forEach((item) => {
        counts[item.categoryId] = (counts[item.categoryId] || 0) + 1
      })
    return counts
  }, [content.services])

  if (authenticating) return <AdminDashboardEntryLoader />

  if (!user) {
    return (
      <LazyMotion features={domAnimation}>
        <m.main className="admin-shell admin-auth-page" initial="hidden" animate="visible" variants={adminSoft}>
        <div className="admin-auth-backdrop" />
        <section className="admin-auth-card glass-card">
          <div className="admin-auth-brand">
            <img src="/assets/the-royal-velvet-sub-logo-bgless.png" alt="The Royal Velvet" />

            <h1>The Royal Velvet</h1>

            </div>

          <form className="admin-auth-form" onSubmit={handleAuth}>
            <h2>Secure Concierge Login</h2>
            <p>Private access for the approved Royal Velvet admin account only.</p>
            {!isSupabaseConfigured && <small className="admin-warn">Supabase is not configured. Admin login is locked.</small>}

            <label>
              <span>Email</span>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </label>

            <button className="btn btn-primary" type="submit">
              <FaCrown /> Enter Dashboard
            </button>
            {authError && <small className="admin-error">{authError}</small>}
          </form>

          <a className="admin-back-link" href="/">
            <FaArrowLeft /> Back to website
          </a>
        </section>
        </m.main>
      </LazyMotion>
    )
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.main className={`admin-shell admin-dashboard${loading ? ' is-data-loading' : ''}`} initial="hidden" animate="visible" variants={adminSoft}>
      <div className="admin-backdrop" />

      <header className="admin-topbar glass-card">
        <div className="admin-topbar-brand">
          <img src="/assets/the-royal-velvet-sub-logo-bgless.png" alt="The Royal Velvet" />
          <div>
            <p className="eyebrow">Concierge Dashboard</p>
            <h1>The Royal Velvet</h1>
            <span>{user.email}</span>
          </div>
        </div>
        <div className="admin-topbar-actions">
          {loading && <span className="admin-loading-pill">Refreshing…</span>}
          <a className="btn btn-ghost" href="/">
            <FaArrowLeft /> View Site
          </a>
          <button className="btn btn-ghost" type="button" onClick={signOutAdmin}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </header>

      {status && <p className="admin-status-banner">{status}</p>}

      {activeTab === 'overview' && (
        <section className="admin-hero glass-card">
          <div>
            <p className="eyebrow">Executive Overview</p>
            <h2>Your celebration command centre.</h2>
            <p>
              {totalServices} services across {liveCategoryCount} categories · {packages.length} curated packages ·
              All India luxury events
            </p>
          </div>
          <div className="admin-hero-stats">
            <article>
              <strong>{totalServices}+</strong>
              <span>Services</span>
            </article>
            <article>
              <strong>{liveCategoryCount}</strong>
              <span>Categories</span>
            </article>
            <article>
              <strong>{packages.length}</strong>
              <span>Packages</span>
            </article>
            <article>
              <strong>{liveStoryStats.eventsCompleted}+</strong>
              <span>Events</span>
            </article>
            <article>
              <strong>{liveStoryStats.citiesServed}+</strong>
              <span>Cities</span>
            </article>
            <article>
              <strong>{liveStoryStats.clientSatisfaction}%</strong>
              <span>Satisfaction</span>
            </article>
          </div>
        </section>
      )}

      <nav className="admin-tabs">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && (
        <div className="admin-data-loader-slot">
          <ConciergeDataLoader compact label="Retrieving the private archive" />
        </div>
      )}

      {visibleMetrics.length > 0 && (
        <section className="metric-grid admin-metrics">
          {visibleMetrics.map((metric) => (
            <article className="glass-card metric-card admin-metric-card" key={metric.label}>
              <span className="admin-metric-icon">{metric.icon}</span>
              <strong>{metric.value}</strong>
              <small>{metric.label}</small>
              <p>{metric.hint}</p>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'overview' && (
        <>
          <section className="glass-card admin-panel-block">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Analytics</p>
                <h2>Executive snapshot</h2>
              </div>
            </div>
            <div className="analytics-bars admin-analytics">
              {analytics.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${value}%` }} /></div>
                  <strong>{value}%</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card admin-panel-block">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Events & Services</p>
                <h2>Live website offerings</h2>
              </div>
            </div>
            <div className="admin-service-grid">
              {serviceCategories.map((category) => (
                <article className="admin-service-chip" key={category.id}>
                  <span className="admin-service-icon">{category.icon}</span>
                  <div>
                    <strong>{category.title.replace(' Services', '')}</strong>
                    <small>{liveCategoryCounts[category.id] || category.items.length} services</small>
                  </div>
                </article>
              ))}
            </div>
            <div className="admin-package-row">
              {packages.map((pkg) => (
                <span className="admin-package-pill" key={pkg.id}>
                  {pkg.name}
                </span>
              ))}
            </div>
          </section>

          <section className="admin-recent-bookings">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Latest Inquiries</p>
                <h2>Recent booking requests</h2>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => setActiveTab('bookings')}>
                View all
              </button>
            </div>
            <div className="admin-booking-grid">
              {content.bookings.length === 0 && <p className="admin-empty">No inquiries yet.</p>}
              {content.bookings.slice(0, 3).map((item) => (
                <BookingCard
                  key={item.id}
                  item={item}
                  onDelete={() => removeItem('bookings', item.id)}
                  onOpenModal={(id) => setActiveBookingModalId(id)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'bookings' && (
        <section className="admin-panel-block">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Private Consultations</p>
              <h2>Booking inquiries</h2>
              <p>All submissions from the luxury booking forms. Click any card to view full questionnaire responses & manage pipeline.</p>
            </div>
            <span className="admin-count-pill">{content.bookings.length} total</span>
          </div>
          <div className="admin-booking-grid">
            {content.bookings.length === 0 && <p className="admin-empty glass-card">No booking inquiries yet.</p>}
            {content.bookings.map((item) => (
              <BookingCard
                key={item.id}
                item={item}
                onDelete={() => removeItem('bookings', item.id)}
                onOpenModal={(id) => setActiveBookingModalId(id)}
              />
            ))}
          </div>
          {activeBookingModalId && (
            <BookingDetailModal
              bookings={content.bookings}
              activeId={activeBookingModalId}
              onSelect={(id) => setActiveBookingModalId(id)}
              onClose={() => setActiveBookingModalId(null)}
              onUpdate={saveBookingDetails}
              onDelete={(id) => {
                removeItem('bookings', id)
                setActiveBookingModalId(null)
              }}
            />
          )}
        </section>
      )}

      {activeTab === 'media' && (
        <>
          <section className="admin-grid admin-upload-grid">
            <article
              className="glass-card admin-card upload-zone admin-upload-card"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, 'gallery')}
            >
              <FaCloudUploadAlt />
              <p className="eyebrow">Gallery Projects</p>
              <h3>Publish a completed celebration</h3>
              <p>Create one luxury project card at a time. Add its name, short project story, completion date, then curate every image before publishing.</p>
              <div className="admin-project-form-grid">
                <label>
                  <span>Project Name</span>
                  <input
                    value={galleryProjectDraft.title}
                    onChange={(event) => setGalleryProjectDraft((current) => {
                      const nextTitle = event.target.value
                      const currentAutoSlug = slugifyProject(current.title)
                      return {
                        ...current,
                        title: nextTitle,
                        slug: !current.slug || current.slug === currentAutoSlug ? slugifyProject(nextTitle) : current.slug,
                      }
                    })}
                    placeholder="Ramayana Wedding Decor"
                  />
                </label>
                <label>
                  <span>Public URL Slug</span>
                  <input
                    value={galleryProjectDraft.slug}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, slug: slugifyProject(event.target.value) }))}
                    placeholder="ramayana-wedding-decor"
                  />
                  <small>the-royalvelvet.com/projects/{galleryProjectDraft.slug || 'project-name'}</small>
                </label>
                <label>
                  <span>Completion Date</span>
                  <input
                    type="date"
                    value={galleryProjectDraft.projectDate}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, projectDate: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Event Location</span>
                  <input
                    value={galleryProjectDraft.location}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Bengaluru, Karnataka"
                  />
                </label>
                <label>
                  <span>Project Category</span>
                  <input
                    value={galleryProjectDraft.category}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Luxury Wedding"
                  />
                </label>
                <label className="admin-project-description">
                  <span>Short Project Story</span>
                  <textarea
                    value={galleryProjectDraft.description}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, description: event.target.value }))}
                    placeholder="A royal decor world shaped around family ritual, floral scale, and a memorable guest arrival."
                  />
                </label>
                <label className="admin-project-description">
                  <span>Google Search Title (optional)</span>
                  <input
                    value={galleryProjectDraft.seoTitle}
                    maxLength={65}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, seoTitle: event.target.value }))}
                    placeholder="Ramayana Wedding Decor | The Royal Velvet"
                  />
                  <small>{galleryProjectDraft.seoTitle.length}/65 · Leave blank for an automatic premium title.</small>
                </label>
                <label className="admin-project-description">
                  <span>Google Search Description (optional)</span>
                  <textarea
                    value={galleryProjectDraft.seoDescription}
                    maxLength={165}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, seoDescription: event.target.value }))}
                    placeholder="A concise, truthful summary of the celebration, location, design direction, and experience."
                  />
                  <small>{galleryProjectDraft.seoDescription.length}/165 · Leave blank to use the short project story.</small>
                </label>
                <label>
                  <span>Display Order</span>
                  <input
                    type="number"
                    value={galleryProjectDraft.sortOrder}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                  />
                </label>
                <label className="admin-checkbox-row compact">
                  <input
                    type="checkbox"
                    checked={galleryProjectDraft.isFeatured}
                    onChange={(event) => setGalleryProjectDraft((current) => ({ ...current, isFeatured: event.target.checked }))}
                  />
                  <span>Featured Project</span>
                </label>
              </div>
              <label className="btn btn-primary admin-file-btn">
                Add Project Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => {
                    stageGalleryFiles(event.target.files)
                    event.target.value = ''
                  }}
                />
              </label>
              {galleryDrafts.length > 0 && (
                <div className="admin-gallery-draft-panel">
                  <div className="admin-gallery-draft-head">
                    <strong>{galleryDrafts.length} image{galleryDrafts.length > 1 ? 's' : ''} ready for review</strong>
                    <button className="text-button" type="button" onClick={() => {
                      galleryDrafts.forEach((draft) => draft.previewUrl && URL.revokeObjectURL(draft.previewUrl))
                      setGalleryDrafts([])
                    }}>
                      Clear all
                    </button>
                  </div>
                  <div className="admin-gallery-draft-list">
                    {galleryDrafts.map((draft) => (
                      <article className="admin-gallery-draft-item" key={draft.id}>
                        <LuxuryImage src={draft.previewUrl} alt={draft.title || 'Gallery draft'} />
                        <div className="admin-gallery-draft-fields">
                          <label>
                            <span>Image Caption / Alt Text</span>
                            <input
                              value={draft.title}
                              onChange={(event) => updateGalleryDraft(draft.id, { title: event.target.value })}
                              placeholder="Mandapam detail at sunset"
                            />
                          </label>
                          <label>
                            <span>Order</span>
                            <input
                              type="number"
                              value={draft.sortOrder}
                              onChange={(event) => updateGalleryDraft(draft.id, { sortOrder: event.target.value })}
                              placeholder="0"
                            />
                          </label>
                        </div>
                        <button className="admin-draft-delete-btn" type="button" onClick={() => removeGalleryDraft(draft.id)} aria-label="Remove draft image">
                          <FaTrash />
                        </button>
                      </article>
                    ))}
                  </div>
                  <button className="btn btn-primary" type="button" onClick={publishGalleryDrafts} disabled={publishingProject} aria-busy={publishingProject}>
                    {publishingProject ? 'Publishing Project…' : 'Publish Project Card'}
                  </button>
                </div>
              )}
            </article>

            <form className="glass-card admin-card admin-reel-form" onSubmit={addReel}>
              <FaInstagram />
              <p className="eyebrow">Instagram Reels</p>
              <h3>Publish reel cover & link</h3>
              <p>Add a luxury cover image and paste the Instagram reel URL. Visitors will open the reel directly on Instagram.</p>
              <label>
                <span>Reel Title</span>
                <input
                  type="text"
                  value={reelDraft.title}
                  onChange={(event) => setReelDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Royal destination wedding reel"
                  required
                />
              </label>
              <label>
                <span>Instagram Reel Link</span>
                <input
                  type="url"
                  value={reelDraft.instagramUrl}
                  onChange={(event) => setReelDraft((current) => ({ ...current, instagramUrl: event.target.value }))}
                  placeholder="https://www.instagram.com/reel/..."
                  required
                />
              </label>
              <label className="btn btn-primary admin-file-btn">
                Choose Cover Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setReelDraft((current) => ({ ...current, coverFile: file }))
                    setPreview(URL.createObjectURL(file))
                  }}
                />
              </label>
              {reelDraft.coverFile && <small className="admin-selected-file">Cover selected: {cleanDisplayName(reelDraft.coverFile.name)}</small>}
              <button className="btn btn-primary" type="submit">Publish Instagram Reel</button>
            </form>
          </section>

          <section className="glass-card admin-panel-block">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Project Archive</p>
                <h2>{content.galleryProjects.length} published projects</h2>
              </div>
            </div>
            <div className="admin-media-grid admin-project-grid">
              {content.galleryProjects.length === 0 && <p className="admin-empty">No completed projects yet. Publish your first project card above.</p>}
              {content.galleryProjects.map((item) => (
                <GalleryProjectAdminCard
                  key={item.id}
                  project={item}
                  onSave={saveGalleryProject}
                  onAddImages={addImagesToGalleryProject}
                  onDeleteImage={removeImageFromGalleryProject}
                  onDelete={() => removeItem('gallery_projects', item.id, 'galleryProjects')}
                />
              ))}
            </div>
          </section>

          <section className="glass-card admin-panel-block">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Reels Library</p>
                <h2>{content.reels.length} items</h2>
              </div>
            </div>
            <div className="admin-reel-list">
              {content.reels.length === 0 && <p className="admin-empty">No reels published yet.</p>}
              {content.reels.map((item) => {
                const isVideo = /\.(mp4|webm|mov|m4v|ogg)$/i.test(item.url || '')
                const reelLink = item.instagram_url || item.reel_url || item.link_url || item.link
                return (
                  <div className="admin-reel-item" key={item.id}>
                    <div className="admin-reel-thumb">
                      {item.url && isVideo ? (
                        <video src={item.url} muted playsInline />
                      ) : item.url ? (
                        <LuxuryImage src={item.url} alt={item.title || item.name} />
                      ) : (
                        <FaVideo />
                      )}
                    </div>
                    <div>
                      <strong>{cleanDisplayName(item.title || item.name) || 'Instagram reel'}</strong>
                      <small>{reelLink || item.url}</small>
                    </div>
                    {reelLink && <a className="admin-reel-link" href={reelLink} target="_blank" rel="noreferrer">Open</a>}
                    <button type="button" onClick={() => removeItem('reels', item.id)}>
                      <FaTrash />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {activeTab === 'destinations' && (
        <>
          <form className="glass-card admin-card admin-destination-form" onSubmit={publishDestinationImage}>
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Destination Images</p>
                <h2>Control destination card visuals</h2>
                <p>Upload one luxury image for each state or destination region. The public destination card updates directly from Supabase.</p>
              </div>
            </div>

            <div className="admin-form-grid">
              <label>
                <span>Destination / State</span>
                <select
                  value={destinationDraft.destinationName}
                  onChange={(event) => setDestinationDraft((current) => ({ ...current, destinationName: event.target.value }))}
                  required
                >
                  {destinations.map((destination) => (
                    <option key={destination.name} value={destination.name}>{destination.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Image Name</span>
                <input
                  value={destinationDraft.title}
                  onChange={(event) => setDestinationDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Palace destination wedding frame"
                />
              </label>
            </div>

            <label className="btn btn-primary admin-file-btn">
              Choose Destination Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  setDestinationDraft((current) => {
                    if (current.previewUrl) URL.revokeObjectURL(current.previewUrl)
                    return {
                      ...current,
                      imageFile: file,
                      title: current.title || cleanDisplayName(file.name),
                      previewUrl: URL.createObjectURL(file),
                    }
                  })
                  event.target.value = ''
                }}
              />
            </label>
            {destinationDraft.previewUrl && (
              <div className="admin-destination-preview">
                <LuxuryImage src={destinationDraft.previewUrl} alt={destinationDraft.title || destinationDraft.destinationName} />
                <span className="admin-destination-preview-title">{destinationDraft.destinationName}</span>
              </div>
            )}
            <button className="btn btn-primary" type="submit">Publish Destination Image</button>
          </form>

          <section className="glass-card admin-panel-block">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Destination Visual Library</p>
                <h2>{content.destinationImages.length} custom images</h2>
                <p>Every destination waits for its original Supabase image. No bundled substitute is displayed.</p>
              </div>
            </div>
            <div className="admin-destination-grid">
              {destinations.map((destination) => {
                const key = destinationKey(destination.name)
                const image = destinationImageByKey[key]
                return (
                  <article className="admin-destination-card" key={destination.name}>
                    <LuxuryImage src={image?.url || ''} rawSrc={image?.url || ''} alt={image?.alt || destination.name} />
                    <div>
                      <strong>{destination.name}</strong>
                      <small>{image ? 'Supabase image active' : 'Awaiting destination image'}</small>
                    </div>
                    {image?.id && (
                      <button type="button" onClick={() => removeItem('destination_images', image.id)} aria-label={`Remove ${destination.name} image`}>
                        <FaTrash />
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </>
      )}

      {activeTab === 'services' && (
        <>
          <form className="glass-card admin-card admin-service-form" onSubmit={addService}>
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Website Services</p>
                <h2>Publish a new service</h2>
                <p>Add only services here. Packages will remain curated separately for now.</p>
              </div>
            </div>

            <div className="admin-form-grid">
              <label>
                <span>Service Name</span>
                <input
                  value={serviceDraft.title}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Luxury Fleet & Travel Concierge"
                  required
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  value={serviceDraft.categoryId}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, categoryId: event.target.value }))}
                  required
                >
                  {serviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.title.replace(' Services', '')}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Card / Sub Section Name</span>
                <input
                  value={serviceDraft.cardTitle}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, cardTitle: event.target.value }))}
                  placeholder="Destination Concierge"
                />
              </label>
              <label>
                <span>Sort Order</span>
                <input
                  type="number"
                  value={serviceDraft.sortOrder}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                  placeholder="0"
                />
              </label>
            </div>

            <label className="full">
              <span>Service Description</span>
              <textarea
                value={serviceDraft.description}
                onChange={(event) => setServiceDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe the premium service in one refined paragraph."
                required
              />
            </label>

            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={serviceDraft.isPublished}
                onChange={(event) => setServiceDraft((current) => ({ ...current, isPublished: event.target.checked }))}
              />
              <span>Publish this service on the main website</span>
            </label>

            <button className="btn btn-primary" type="submit">Publish Service</button>
          </form>

          <section className="glass-card admin-panel-block">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Published Service Library</p>
                <h2>{content.services.length} admin-added services</h2>
              </div>
            </div>
            <div className="admin-dynamic-service-grid">
              {content.services.length === 0 && (
                <p className="admin-empty">No admin-added services yet. Existing website services remain live.</p>
              )}
              {content.services.map((item) => (
                <article className="admin-dynamic-service-card" key={item.id}>
                  <div>
                    <span>{categoryLabelById[item.categoryId] || item.categoryId}</span>
                    {item.cardTitle && <small>{item.cardTitle}</small>}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text || item.description}</p>
                  <div className="admin-dynamic-service-actions">
                    <em>{item.isPublished === false ? 'Hidden' : 'Published'}</em>
                    <button type="button" onClick={() => removeItem('services', item.id)} aria-label="Delete service">
                      <FaTrash /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'ourStory' && (
        <form className="glass-card admin-card admin-story-settings-form" onSubmit={saveOurStory}>
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Our Story</p>
              <h2>Control founder details, images, and trust numbers</h2>
              <p>Keep descriptions fixed. Update only visual identity, founder details, and headline metrics.</p>
            </div>
          </div>

          <div className="admin-story-image-grid">
            <article className="admin-story-image-editor">
              <div
                className="admin-story-image-preview"
                style={(storyPreviews.storyImage || storyDraft.storyImageUrl) ? { backgroundImage: `url(${storyPreviews.storyImage || storyDraft.storyImageUrl})` } : undefined}
              >
                {!(storyPreviews.storyImage || storyDraft.storyImageUrl) && <span>Our Story Image</span>}
              </div>
              <label className="btn btn-primary admin-file-btn">
                Change Our Story Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => handleStoryFile('storyImage', event.target.files?.[0])}
                />
              </label>
            </article>

            <article className="admin-story-image-editor">
              <div
                className="admin-story-image-preview founder-preview"
                style={(storyPreviews.founderImage || storyDraft.founderImageUrl) ? { backgroundImage: `url(${storyPreviews.founderImage || storyDraft.founderImageUrl})` } : undefined}
              >
                {!(storyPreviews.founderImage || storyDraft.founderImageUrl) && <span>Founder Image</span>}
              </div>
              <label className="btn btn-primary admin-file-btn">
                Change Founder Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => handleStoryFile('founderImage', event.target.files?.[0])}
                />
              </label>
            </article>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>Founder Name</span>
              <input
                value={storyDraft.founderName}
                onChange={(event) => setStoryDraft((current) => ({ ...current, founderName: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Founder Role</span>
              <input
                value={storyDraft.founderRole}
                onChange={(event) => setStoryDraft((current) => ({ ...current, founderRole: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="full">
            <span>Founder Quote</span>
            <textarea
              value={storyDraft.founderQuote}
              onChange={(event) => setStoryDraft((current) => ({ ...current, founderQuote: event.target.value }))}
              required
            />
          </label>

          <div className="admin-counter-editor-grid">
            <label>
              <span>Events Completed</span>
              <input
                type="number"
                min="0"
                value={storyDraft.eventsCompleted}
                onChange={(event) => setStoryDraft((current) => ({ ...current, eventsCompleted: event.target.value }))}
              />
            </label>
            <label>
              <span>Cities Served</span>
              <input
                type="number"
                min="0"
                value={storyDraft.citiesServed}
                onChange={(event) => setStoryDraft((current) => ({ ...current, citiesServed: event.target.value }))}
              />
            </label>
            <label>
              <span>Specialized Services</span>
              <input
                type="number"
                min="0"
                value={storyDraft.specializedServices}
                onChange={(event) => setStoryDraft((current) => ({ ...current, specializedServices: event.target.value }))}
              />
              <small>Website shows at least {totalServices}+ because service count is live.</small>
            </label>
            <label>
              <span>Client Satisfaction %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={storyDraft.clientSatisfaction}
                onChange={(event) => setStoryDraft((current) => ({ ...current, clientSatisfaction: event.target.value }))}
              />
            </label>
          </div>

          <button className="btn btn-primary" type="submit">Save Our Story</button>
        </form>
      )}

      {activeTab === 'stories' && (
        <>
          <form className="glass-card admin-card admin-story-form" onSubmit={addTestimonial}>
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Client Stories</p>
                <h2>Publish a testimonial</h2>
                <p>Appears on the homepage when published.</p>
              </div>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Client Name</span>
                <input value={testimonial.name} onChange={(e) => setTestimonial({ ...testimonial, name: e.target.value })} required />
              </label>
              <label>
                <span>City</span>
                <input value={testimonial.city} onChange={(e) => setTestimonial({ ...testimonial, city: e.target.value })} />
              </label>
              <label>
                <span>Event Type</span>
                <input
                  value={testimonial.role}
                  onChange={(e) => setTestimonial({ ...testimonial, role: e.target.value })}
                  placeholder="e.g. Multi-Day Wedding · Chennai"
                  required
                />
              </label>
              <label>
                <span>Rating</span>
                <select
                  value={testimonial.rating}
                  onChange={(e) => setTestimonial({ ...testimonial, rating: Number(e.target.value) })}
                  required
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>{value} Star{value > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="full">
              <span>Quote</span>
              <textarea value={testimonial.quote} onChange={(e) => setTestimonial({ ...testimonial, quote: e.target.value })} required />
            </label>
            <button className="btn btn-primary" type="submit">Publish Testimonial</button>
          </form>

          <section className="glass-card admin-panel-block testimonial-library">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Published</p>
                <h2>Client stories on site</h2>
              </div>
            </div>
            <div className="testimonial-admin-grid admin-story-grid">
              {content.testimonials.length === 0 && <p className="admin-empty">No testimonials published yet.</p>}
              {content.testimonials.map((item) => (
                <article className="admin-story-card" key={item.id}>
                  <div className="admin-story-rating" role="img" aria-label={`${item.rating || 5} star rating`}>
                    {Array.from({ length: Number(item.rating) || 5 }).map((_, index) => (
                      <FaStar key={index} />
                    ))}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{[item.city, item.role].filter(Boolean).join(' | ')}</span>
                    <p>{item.quote}</p>
                  </div>
                  <button type="button" onClick={() => removeItem('testimonials', item.id)} aria-label="Delete">
                    <FaTrash />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'offers' && (
        <form className="glass-card admin-card admin-settings-form" onSubmit={saveMembership}>
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Membership & Offers</p>
              <h2>Control website offer cards</h2>
              <p>Add up to 3 premium offer cards. Active offers appear in Events, Services, Booking, and the Home popup sequence.</p>
            </div>
            <button className="btn btn-ghost" type="button" onClick={addOffer} disabled={offers.length >= 3}>
              Add Offer
            </button>
          </div>

          <div className="admin-offer-list">
            {offers.map((offer, index) => (
              <article className="glass-card admin-offer-editor" key={offer.id || index}>
                <div className="admin-panel-head">
                  <div>
                    <p className="eyebrow">Offer {index + 1}</p>
                    <h3>{offer.title || 'New Royal Velvet Offer'}</h3>
                  </div>
                  {offers.length > 1 && (
                    <button className="admin-delete-btn" type="button" onClick={() => removeOffer(index)}>
                      <FaTrash /> Remove
                    </button>
                  )}
                </div>
                <label className="admin-checkbox-row">
                  <input
                    type="checkbox"
                    checked={offer.active}
                    onChange={(e) => updateOffer(index, { active: e.target.checked })}
                  />
                  <span>Show this offer on website</span>
                </label>
                <div className="admin-form-grid">
                  <label>
                    <span>Offer Title</span>
                    <input value={offer.title} onChange={(e) => updateOffer(index, { title: e.target.value })} />
                  </label>
                  <label>
                    <span>Offer / Discount Label</span>
                    <input value={offer.discountLabel} onChange={(e) => updateOffer(index, { discountLabel: e.target.value })} />
                  </label>
                  <label>
                    <span>Start Date</span>
                    <input type="date" value={offer.startDate || ''} onChange={(e) => updateOffer(index, { startDate: e.target.value })} />
                  </label>
                  <label>
                    <span>End Date</span>
                    <input type="date" value={offer.endDate || ''} onChange={(e) => updateOffer(index, { endDate: e.target.value })} />
                  </label>
                </div>
                <label>
                  <span>Description</span>
                  <textarea value={offer.description} onChange={(e) => updateOffer(index, { description: e.target.value })} />
                </label>
                <label>
                  <span>Private Note</span>
                  <textarea value={offer.note} onChange={(e) => updateOffer(index, { note: e.target.value })} />
                </label>
              </article>
            ))}
          </div>
          <button className="btn btn-primary" type="submit">Save Offers</button>
        </form>
      )}
      <RoyalTransactionOverlay open={Boolean(transaction)} title={transaction?.title} message={transaction?.message} />
      </m.main>
    </LazyMotion>
  )
}

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function exportBookingPdf(item) {
  const logo = `${window.location.origin}/assets/the-royal-velvet-main-logo-web.png`
  const printWindow = window.open('', '_blank', 'width=960,height=1200')
  if (!printWindow) return
  const rawVision = item.vision || ''
  const [mainVision = 'No vision description added yet.', ...extraBlocks] = rawVision.split(/\n{2,}/).filter(Boolean)
  const customServices = extraBlocks.find((block) => /^Custom package selections:/i.test(block)) || ''
  const offerInterests = extraBlocks.find((block) => /^Offer interests:/i.test(block)) || ''
  const otherBriefs = extraBlocks.filter((block) => block !== customServices && block !== offerInterests)
  const vision = escapeHtml(mainVision).replace(/\n/g, '<br />')
  const services = customServices
    ? customServices.replace(/^Custom package selections:\s*/i, '').split(',').map((entry) => entry.trim()).filter(Boolean)
    : []
  const offers = offerInterests
    ? offerInterests.replace(/^Offer interests:\s*/i, '').split(',').map((entry) => entry.trim()).filter(Boolean)
    : []
  const notes = escapeHtml(item.admin_notes || item.adminNotes || 'No private admin notes added yet.').replace(/\n/g, '<br />')
  const status = normalizeBookingStatus(item.status)
  const followUp = item.follow_up_date || item.followUpDate
  const proposalTier = item.proposal_tier || item.proposalTier || 'Bespoke'
  const estimatedQuoteRange = item.estimated_quote_range || item.estimatedQuoteRange || item.budget || 'Private Discussion'
  const proposalNotes = escapeHtml(item.proposal_notes || item.proposalNotes || 'Proposal notes to be curated after consultation.').replace(/\n/g, '<br />')
  const nextAction = item.next_action || item.nextAction || 'Schedule private consultation / proposal review'
  const advanceStatus = item.advance_status || item.advanceStatus || 'Pending'
  const serviceList = services.length
    ? services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')
    : '<li>Service selections to be refined during consultation.</li>'
  const offerList = offers.length
    ? offers.map((offer) => `<li>${escapeHtml(offer)}</li>`).join('')
    : '<li>No offer preference selected yet.</li>'
  const extraList = otherBriefs.length
    ? otherBriefs.map((block) => `<div class="note">${escapeHtml(block).replace(/\n/g, '<br />')}</div>`).join('')
    : '<div class="note">No additional booking blocks added.</div>'
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>The Royal Velvet - Booking Inquiry</title>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            color: #f8f4ec;
            background: #120003;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            page-break-after: always;
            break-after: page;
            background:
              radial-gradient(circle at 14% 8%, rgba(212,175,55,.18), transparent 30%),
              radial-gradient(circle at 88% 16%, rgba(74,0,10,.78), transparent 38%),
              linear-gradient(145deg, #3b0008, #0f0f0f 62%, #220006);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page:last-child { page-break-after: auto; break-after: auto; }
          .frame {
            min-height: 267mm;
            padding: 12mm;
            border: 1px solid rgba(212,175,55,.45);
            border-radius: 18px;
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 14px;
            box-shadow: inset 0 0 0 1px rgba(212,175,55,.12);
          }
          .frame::before {
            content: '';
            position: absolute;
            inset: 7px;
            border: 1px solid rgba(212,175,55,.16);
            border-radius: 13px;
            pointer-events: none;
          }
          header {
            display: flex;
            align-items: center;
            gap: 18px;
            border-bottom: 1px solid rgba(212,175,55,.28);
            padding-bottom: 14px;
            position: relative;
            z-index: 1;
            break-inside: avoid;
          }
          img { width: 125px; height: 92px; object-fit: contain; }
          h1,h2,h3,h4 { margin: 0; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; }
          h1 { color: #d4af37; font-size: 24px; }
          h2 { font-size: 18px; margin-top: 4px; color: #fff; }
          h3 { color: #fff; font-size: 18px; }
          h4 { color: #e6c88d; font-size: 13px; }
          .eyebrow { color: #e6c88d; letter-spacing: .22em; text-transform: uppercase; font-size: 10px; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; position: relative; z-index: 1; }
          .card, .panel, .note {
            border: 1px solid rgba(212,175,55,.25);
            border-radius: 14px;
            background: rgba(0,0,0,.24);
            break-inside: avoid;
          }
          .card { padding: 12px; min-height: 70px; }
          .card span, .panel span {
            display:block;
            color:#cdbfae;
            font-size:10px;
            letter-spacing:.15em;
            text-transform:uppercase;
            margin-bottom:5px;
          }
          .card strong { color:#fff; font-size:15px; overflow-wrap:anywhere; }
          .full { grid-column: 1 / -1; }
          .panel { padding: 14px; position: relative; z-index: 1; }
          p { color:#dfd4c7; line-height:1.55; margin: 0; font-size: 13px; }
          ul { margin: 10px 0 0; padding-left: 18px; color:#dfd4c7; line-height:1.55; font-size: 12.5px; }
          li { margin-bottom: 5px; }
          .status-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            position: relative;
            z-index: 1;
          }
          .step {
            padding: 10px 8px;
            border-radius: 999px;
            border: 1px solid rgba(212,175,55,.25);
            color: #d7ccbe;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: .11em;
            font-size: 9px;
            background: rgba(0,0,0,.2);
          }
          .step.active { background: rgba(212,175,55,.18); color:#f5d76e; border-color: rgba(212,175,55,.58); }
          .two-col { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .three-col { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .next-steps { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .note { padding: 12px; color:#dfd4c7; line-height:1.55; font-size: 12.5px; }
          footer {
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px solid rgba(212,175,55,.22);
            color:#d4af37;
            font-size:11px;
            letter-spacing:.12em;
            text-transform:uppercase;
            position: relative;
            z-index: 1;
          }
          .page-number { float: right; color:#cdbfae; }
          @media print {
            body { background: #fff; }
            .page { overflow: hidden; }
          }
        </style>
      </head>
      <body>
        <section class="page">
          <main class="frame">
            <header>
              <img src="${logo}" alt="The Royal Velvet" />
              <div>
                <div class="eyebrow">Private Booking Inquiry</div>
                <h1>The Royal Velvet</h1>
                <h2>${escapeHtml(item.name || 'Private Client')}</h2>
              </div>
            </header>

            <section class="summary-grid">
              <div class="card"><span>Status</span><strong>${escapeHtml(titleCase(status))}</strong></div>
              <div class="card"><span>Submitted</span><strong>${escapeHtml(formatDate(item.created_at))}</strong></div>
              <div class="card"><span>Email</span><strong>${escapeHtml(item.email || 'Not provided')}</strong></div>
              <div class="card"><span>Phone</span><strong>${escapeHtml(item.phone || 'Not provided')}</strong></div>
              <div class="card"><span>Event Type</span><strong>${escapeHtml(item.type || 'Private Consultation')}</strong></div>
              <div class="card"><span>Event Date</span><strong>${escapeHtml(item.date ? formatDate(item.date) : 'To be confirmed')}</strong></div>
              <div class="card"><span>Budget Range</span><strong>${escapeHtml(item.budget || 'Private Discussion')}</strong></div>
              <div class="card"><span>Event Location</span><strong>${escapeHtml(item.location || 'Location TBC')}</strong></div>
            </section>

            <section class="panel">
              <span>Pipeline Position</span>
              <div class="status-row">
                ${bookingStatuses.map((step) => `<div class="step ${step === status ? 'active' : ''}">${titleCase(step)}</div>`).join('')}
              </div>
            </section>

            <section class="panel">
              <span>Primary Vision Brief</span>
              <p>${vision}</p>
            </section>

            <section class="two-col">
              <div class="panel"><span>Follow-up Date</span><h3>${escapeHtml(followUp ? formatDate(followUp) : 'Not Scheduled')}</h3></div>
              <div class="panel"><span>Concierge Priority</span><h3>${escapeHtml(status === 'celebration confirmed' ? 'Execution Ready' : 'Proposal Curation')}</h3></div>
            </section>

            <footer>Effortlessly Lavish · HSR Layout, Bangalore · +91 98805 41336 <span class="page-number">Page 1 / 2</span></footer>
          </main>
        </section>

        <section class="page">
          <main class="frame">
            <header>
              <img src="${logo}" alt="The Royal Velvet" />
              <div>
                <div class="eyebrow">Consultation Detail Sheet</div>
                <h1>Planning Notes</h1>
                <h2>${escapeHtml(item.type || 'Private Consultation')}</h2>
              </div>
            </header>

            <section class="two-col">
              <div class="panel">
                <span>Selected Bespoke Services</span>
                <ul>${serviceList}</ul>
              </div>
              <div class="panel">
                <span>Offer / Membership Interest</span>
                <ul>${offerList}</ul>
              </div>
            </section>

            <section class="three-col">
              <div class="panel"><span>Proposal Tier</span><h3>${escapeHtml(proposalTier)}</h3></div>
              <div class="panel"><span>Estimated Quote Range</span><h3>${escapeHtml(estimatedQuoteRange)}</h3></div>
              <div class="panel"><span>Advance Status</span><h3>${escapeHtml(advanceStatus)}</h3></div>
            </section>

            <section class="panel">
              <span>Royal Proposal Notes</span>
              <p>${proposalNotes}</p>
            </section>

            <section class="panel">
              <span>Next Action</span>
              <p>${escapeHtml(nextAction)}</p>
            </section>

            <section class="panel">
              <span>Additional Inquiry Blocks</span>
              ${extraList}
            </section>

            <section class="panel">
              <span>Private Admin Notes</span>
              <p>${notes}</p>
            </section>

            <section class="next-steps">
              <div class="panel"><span>01</span><h4>Confirm Scope</h4><p>Clarify event scale, family priorities, venue readiness, rituals, and guest movement.</p></div>
              <div class="panel"><span>02</span><h4>Prepare Proposal</h4><p>Shape package, service inclusions, production timeline, staffing, and commercial direction.</p></div>
              <div class="panel"><span>03</span><h4>Follow Up</h4><p>Contact the client on the scheduled date and move the inquiry to the next pipeline stage.</p></div>
            </section>

            <section class="panel">
              <span>Internal Handling Standard</span>
              <p>Every inquiry must be handled with discretion, calm communication, accurate expectation setting, and premium response quality. No client detail should be shared outside the approved planning team.</p>
            </section>

            <footer>The Royal Velvet · Private Consultation Record <span class="page-number">Page 2 / 2</span></footer>
          </main>
        </section>
        <script>window.onload = () => setTimeout(() => window.print(), 350)</script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

function BookingCard({ item, onDelete, onOpenModal }) {
  const status = normalizeBookingStatus(item.status)
  const whatsappNumber = String(item.phone || '').replace(/\D/g, '')

  return (
    <article className="glass-card admin-booking-card compact-booking-card">
      <div className="admin-booking-crest">
        <FaCrown />
        <span>Royal Inquiry</span>
      </div>
      <div className="admin-booking-head">
        <div>
          <span className={`admin-status-pill status-${statusClass(status)}`}>{titleCase(status)}</span>
          <time>{formatDate(item.created_at)}</time>
        </div>
        <button className="admin-delete-btn compact" type="button" onClick={onDelete} aria-label="Remove inquiry">
          <FaTrash />
        </button>
      </div>
      <div className="admin-booking-client">
        <p className="eyebrow">Client</p>
        <h3>{item.name || 'Private Client'}</h3>
        <p className="admin-booking-type">{item.type || 'Private Consultation'}</p>
      </div>
      <dl className="admin-booking-meta">
        <div>
          <FaEnvelope />
          <span>{item.email || 'No email provided'}</span>
        </div>
        <div>
          <FaPhoneAlt />
          <span>{item.phone || 'No phone provided'}</span>
        </div>
        <div>
          <FaCalendarAlt />
          <span>{item.date ? formatDate(item.date) : 'Date TBC'}</span>
        </div>
        <div>
          <FaMapMarkerAlt />
          <span>{item.location || 'Location TBC'}</span>
        </div>
      </dl>
      <div className="admin-booking-luxury-grid">
        <div>
          <span>Budget Range</span>
          <strong>{item.budget || 'Private Discussion'}</strong>
        </div>
        <div>
          <span>Event Date</span>
          <strong>{item.date ? formatDate(item.date) : 'To be confirmed'}</strong>
        </div>
      </div>

      <button
        className="btn btn-primary admin-open-modal-btn"
        type="button"
        onClick={() => onOpenModal(item.id)}
        style={{
          width: '100%',
          marginTop: '1rem',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
        }}
      >
        View Questionnaire & Pipeline →
      </button>

      <div className="admin-booking-actions" style={{ marginTop: '0.75rem' }}>
        {item.phone && <a className="btn btn-ghost" href={`tel:${item.phone}`} title="Call"><FaPhoneAlt /></a>}
        {whatsappNumber && <a className="btn btn-ghost" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" title="WhatsApp"><FaWhatsapp /></a>}
        {item.email && <a className="btn btn-ghost" href={`mailto:${item.email}`} title="Email"><FaEnvelope /></a>}
      </div>
    </article>
  )
}

function BookingDetailModal({ bookings = [], activeId, onSelect, onClose, onUpdate, onDelete }) {
  const currentIndex = bookings.findIndex((b) => b.id === activeId)
  const item = bookings[currentIndex] || bookings[0]

  const [draft, setDraft] = useState({
    status: normalizeBookingStatus(item?.status),
    adminNotes: item?.admin_notes || item?.adminNotes || '',
    followUpDate: item?.follow_up_date || item?.followUpDate || '',
    proposalTier: item?.proposal_tier || item?.proposalTier || 'Bespoke',
    estimatedQuoteRange: item?.estimated_quote_range || item?.estimatedQuoteRange || item?.budget || '',
    proposalNotes: item?.proposal_notes || item?.proposalNotes || '',
    nextAction: item?.next_action || item?.nextAction || '',
    advanceStatus: item?.advance_status || item?.advanceStatus || 'Pending',
  })
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (item) {
      setDraft({
        status: normalizeBookingStatus(item.status),
        adminNotes: item.admin_notes || item.adminNotes || '',
        followUpDate: item.follow_up_date || item.followUpDate || '',
        proposalTier: item.proposal_tier || item.proposalTier || 'Bespoke',
        estimatedQuoteRange: item.estimated_quote_range || item.estimatedQuoteRange || item.budget || '',
        proposalNotes: item.proposal_notes || item.proposalNotes || '',
        nextAction: item.next_action || item.nextAction || '',
        advanceStatus: item.advance_status || item.advanceStatus || 'Pending',
      })
      setSavedSuccess(false)
    }
  }, [item])

  if (!item) return null

  const vision = item.vision || ''
  const [mainVision, ...extraBlocks] = vision.split(/\n{2,}/).filter(Boolean)
  const whatsappNumber = String(item.phone || '').replace(/\D/g, '')

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < bookings.length - 1

  const handleSave = async () => {
    await onUpdate?.(item.id, draft)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-booking-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-booking-modal-header">
          <div className="admin-booking-modal-crest">
            <FaCrown />
            <div>
              <span className={`admin-status-pill status-${statusClass(draft.status)}`}>{titleCase(draft.status)}</span>
              <span className="admin-booking-modal-date">{formatDate(item.created_at)}</span>
            </div>
          </div>
          <div className="admin-booking-modal-nav">
            <button
              className="btn btn-ghost btn-sm"
              disabled={!hasPrev}
              type="button"
              onClick={() => hasPrev && onSelect(bookings[currentIndex - 1].id)}
              style={{ opacity: hasPrev ? 1 : 0.4 }}
            >
              ← Prev
            </button>
            <span className="admin-booking-modal-counter">
              Inquiry {currentIndex + 1} of {bookings.length}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={!hasNext}
              type="button"
              onClick={() => hasNext && onSelect(bookings[currentIndex + 1].id)}
              style={{ opacity: hasNext ? 1 : 0.4 }}
            >
              Next →
            </button>
            <button className="admin-modal-close-btn" type="button" onClick={onClose} aria-label="Close form">
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="admin-booking-modal-client-bar">
          <p className="eyebrow">Client Questionnaire & Proposal Control</p>
          <h3>{item.name || 'Private Client'}</h3>
          <p className="admin-booking-type">{item.type || 'Private Consultation'}</p>
        </div>

        <div className="admin-booking-modal-body">
          <dl className="admin-booking-meta modal-meta">
            <div>
              <FaEnvelope />
              <span>{item.email || 'No email provided'}</span>
            </div>
            <div>
              <FaPhoneAlt />
              <span>{item.phone || 'No phone provided'}</span>
            </div>
            <div>
              <FaCalendarAlt />
              <span>{item.date ? formatDate(item.date) : 'Date TBC'}</span>
            </div>
            <div>
              <FaMapMarkerAlt />
              <span>{item.location || 'Location TBC'}</span>
            </div>
          </dl>

          <div className="admin-booking-luxury-grid modal-luxury-grid">
            <div>
              <span>Budget Range</span>
              <strong>{item.budget || 'Private Discussion'}</strong>
            </div>
            <div>
              <span>Event Date</span>
              <strong>{item.date ? formatDate(item.date) : 'To be confirmed'}</strong>
            </div>
          </div>

          <div className="admin-booking-brief modal-brief">
            <h4 className="admin-section-heading">Questionnaire & Vision Submissions</h4>
            <div className="admin-booking-main-vision">
              <p className="eyebrow">Vision Brief</p>
              <p>{mainVision || 'No vision description provided.'}</p>
            </div>
            {extraBlocks.length > 0 && (
              <div className="admin-booking-extras modal-extras" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {extraBlocks.map((block, idx) => (
                  <div className="admin-questionnaire-card" key={idx}>
                    <span>{block}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-booking-control-panel modal-control-panel" style={{ marginTop: '0.5rem' }}>
            <h4 className="admin-section-heading">Pipeline & Proposal Management</h4>
            <div className="admin-form-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <label>
                <span>Status Pipeline</span>
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>{titleCase(status)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Follow-up Date</span>
                <input type="date" value={draft.followUpDate || ''} onChange={(event) => setDraft((current) => ({ ...current, followUpDate: event.target.value }))} />
              </label>
              <label>
                <span>Proposal Tier</span>
                <select value={draft.proposalTier} onChange={(event) => setDraft((current) => ({ ...current, proposalTier: event.target.value }))}>
                  {proposalTiers.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Estimated Quote Range</span>
                <input value={draft.estimatedQuoteRange} onChange={(event) => setDraft((current) => ({ ...current, estimatedQuoteRange: event.target.value }))} placeholder="₹15 - 35 Lakhs / Private Discussion" />
              </label>
              <label>
                <span>Advance Status</span>
                <select value={draft.advanceStatus} onChange={(event) => setDraft((current) => ({ ...current, advanceStatus: event.target.value }))}>
                  {advanceStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Next Action</span>
                <input value={draft.nextAction} onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Schedule proposal review call" />
              </label>
              <label className="full" style={{ gridColumn: '1 / -1' }}>
                <span>Royal Proposal Notes</span>
                <textarea value={draft.proposalNotes} onChange={(event) => setDraft((current) => ({ ...current, proposalNotes: event.target.value }))} placeholder="Proposal tier, inclusions, quote direction, client refinement, approval conditions." />
              </label>
              <label className="full" style={{ gridColumn: '1 / -1' }}>
                <span>Private Admin Notes</span>
                <textarea value={draft.adminNotes} onChange={(event) => setDraft((current) => ({ ...current, adminNotes: event.target.value }))} placeholder="Add private team notes, preferences, follow-up context, or proposal direction." />
              </label>
            </div>
            <div className="admin-modal-save-bar" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="btn btn-primary" type="button" onClick={handleSave}>
                Save Pipeline Changes
              </button>
              {savedSuccess && <span className="admin-save-success-tag" style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FaCheckCircle /> Pipeline Saved!</span>}
            </div>
          </div>
        </div>

        <div className="admin-booking-modal-footer">
          <div className="admin-booking-actions">
            {item.phone && <a className="btn btn-primary" href={`tel:${item.phone}`}><FaPhoneAlt /> Call</a>}
            {whatsappNumber && <a className="btn btn-ghost" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}
            {item.email && <a className="btn btn-ghost" href={`mailto:${item.email}`}><FaEnvelope /> Email</a>}
            <button className="btn btn-ghost" type="button" onClick={() => exportBookingPdf({
              ...item,
              ...draft,
              status: draft.status,
              admin_notes: draft.adminNotes,
              follow_up_date: draft.followUpDate,
              proposal_tier: draft.proposalTier,
              estimated_quote_range: draft.estimatedQuoteRange,
              proposal_notes: draft.proposalNotes,
              next_action: draft.nextAction,
              advance_status: draft.advanceStatus,
            })}>
              <FaFilePdf /> Export PDF
            </button>
          </div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel / Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function GalleryAdminCard({ item, onSave, onDelete }) {
  const [draft, setDraft] = useState({
    name: cleanDisplayName(item.alt || item.name) || 'Event photo',
    sortOrder: Number(item.sort_order ?? item.sortOrder ?? 0),
    isFeatured: Boolean(item.is_featured ?? item.isFeatured),
  })

  return (
    <article className="admin-media-card admin-gallery-control-card">
      {item.url && <LuxuryImage src={item.url} alt={draft.name} />}
      <div>
        <strong>{draft.name || 'Event photo'}</strong>
        {draft.isFeatured && <span className="admin-featured-pill">Featured</span>}
        <div className="admin-gallery-control-grid">
          <label>
            <span>Image Name</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            <span>Order</span>
            <input type="number" value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))} />
          </label>
          <label className="admin-checkbox-row compact">
            <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((current) => ({ ...current, isFeatured: event.target.checked }))} />
            <span>Featured</span>
          </label>
        </div>
        <div className="admin-gallery-card-actions">
          <button className="btn btn-primary" type="button" onClick={() => onSave?.(item.id, draft)}>Save Display</button>
          <button className="admin-gallery-delete-btn" type="button" onClick={onDelete} aria-label="Delete">
            <FaTrash />
          </button>
        </div>
      </div>
    </article>
  )
}

function GalleryProjectAdminCard({ project, onSave, onAddImages, onDeleteImage, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState({
    title: project.title || '',
    slug: project.slug || slugifyProject(project.title),
    description: project.description || '',
    location: project.location || '',
    category: project.category || 'Luxury Celebration',
    seoTitle: project.seoTitle || '',
    seoDescription: project.seoDescription || '',
    projectDate: project.projectDate || '',
    sortOrder: Number(project.sortOrder) || 0,
    isFeatured: Boolean(project.isFeatured),
    isPublished: project.isPublished !== false,
  })

  useEffect(() => {
    setDraft({
      title: project.title || '',
      slug: project.slug || slugifyProject(project.title),
      description: project.description || '',
      location: project.location || '',
      category: project.category || 'Luxury Celebration',
      seoTitle: project.seoTitle || '',
      seoDescription: project.seoDescription || '',
      projectDate: project.projectDate || '',
      sortOrder: Number(project.sortOrder) || 0,
      isFeatured: Boolean(project.isFeatured),
      isPublished: project.isPublished !== false,
    })
  }, [project])

  useEffect(() => {
    if (!isEditing) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsEditing(false)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isEditing])

  const cover = project.images?.[0]
  const projectDate = project.projectDate
    ? new Date(`${project.projectDate}T12:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Private date'

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    const updated = await onSave?.(project.id, draft)
    setIsSaving(false)
    if (updated) setIsEditing(false)
  }

  return (
    <>
      <article className="admin-project-summary-card">
        <div className="admin-project-summary-cover">
          {cover ? <LuxuryImage src={cover.url || cover.src} alt={cover.alt || project.title} /> : <span className="admin-project-image-empty">Awaiting project images</span>}
          <strong>{project.images?.length || 0} images</strong>
        </div>
        <div className="admin-project-summary-body">
          <div className="admin-project-summary-badges">
            {project.isFeatured && <span className="is-featured">Featured</span>}
            <span>{project.isPublished !== false ? 'Published' : 'Hidden'}</span>
          </div>
          <h3>{project.title || 'Untitled Project'}</h3>
          <p>{project.description || 'No project story has been added yet.'}</p>
          <a className="admin-project-public-url" href={`/projects/${project.slug || slugifyProject(project.title)}`} target="_blank" rel="noreferrer">
            /projects/{project.slug || slugifyProject(project.title)}
          </a>
          <div className="admin-project-summary-meta">
            <span>{projectDate}</span>
            <span>Order {Number(project.sortOrder) || 0}</span>
          </div>
          <div className="admin-project-summary-actions">
            <button className="btn btn-outline" type="button" onClick={() => setIsEditing(true)}>Edit Project</button>
            <button className="admin-gallery-delete-btn" type="button" onClick={onDelete} aria-label={`Delete ${project.title}`}><FaTrash /></button>
          </div>
        </div>
      </article>

      {isEditing && createPortal(
        <div className="admin-project-editor-backdrop" role="presentation" onClick={() => setIsEditing(false)}>
          <m.article
            className="admin-project-editor-card"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${project.title}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-project-editor-head">
              <div>
                <p className="eyebrow">Project Editor</p>
                <h2>{project.title || 'Untitled Project'}</h2>
              </div>
              <button type="button" onClick={() => setIsEditing(false)}>Close</button>
            </div>

            <div className="admin-project-editor-layout">
              <div className="admin-project-editor-cover">
                {cover ? <LuxuryImage src={cover.url || cover.src} alt={cover.alt || project.title} /> : <span className="admin-project-image-empty">Awaiting project images</span>}
                <strong>{project.images?.length || 0} images in this project</strong>
              </div>
              <div className="admin-project-card-body">
                <label>
                  <span>Project Name</span>
                  <input value={draft.title} onChange={(event) => setDraft((current) => {
                    const nextTitle = event.target.value
                    const currentAutoSlug = slugifyProject(current.title)
                    return {
                      ...current,
                      title: nextTitle,
                      slug: !current.slug || current.slug === currentAutoSlug ? slugifyProject(nextTitle) : current.slug,
                    }
                  })} />
                </label>
                <label>
                  <span>Public URL Slug</span>
                  <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugifyProject(event.target.value) }))} />
                  <small>the-royalvelvet.com/projects/{draft.slug || 'project-name'}</small>
                </label>
                <label>
                  <span>Short Story</span>
                  <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
                </label>
                <div className="admin-project-meta-grid">
                  <label>
                    <span>Location</span>
                    <input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Bengaluru, Karnataka" />
                  </label>
                  <label>
                    <span>Category</span>
                    <input value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Luxury Wedding" />
                  </label>
                </div>
                <label>
                  <span>Google Search Title (optional)</span>
                  <input value={draft.seoTitle} maxLength={65} onChange={(event) => setDraft((current) => ({ ...current, seoTitle: event.target.value }))} />
                </label>
                <label>
                  <span>Google Search Description (optional)</span>
                  <textarea value={draft.seoDescription} maxLength={165} onChange={(event) => setDraft((current) => ({ ...current, seoDescription: event.target.value }))} />
                </label>
                <div className="admin-project-meta-grid">
                  <label>
                    <span>Date</span>
                    <input type="date" value={draft.projectDate} onChange={(event) => setDraft((current) => ({ ...current, projectDate: event.target.value }))} />
                  </label>
                  <label>
                    <span>Order</span>
                    <input type="number" value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))} />
                  </label>
                </div>
                <div className="admin-project-toggle-row">
                  <label className="admin-checkbox-row compact">
                    <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((current) => ({ ...current, isFeatured: event.target.checked }))} />
                    <span>Featured Project</span>
                  </label>
                  <label className="admin-checkbox-row compact">
                    <input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} />
                    <span>Published</span>
                  </label>
                </div>
                <label className="admin-project-add-images">
                  Add More Images
                  <input type="file" accept="image/*" multiple hidden onChange={(event) => {
                    const files = Array.from(event.target.files || [])
                    onAddImages?.(project.id, files)
                    event.target.value = ''
                  }} />
                </label>
                <div className="admin-gallery-card-actions">
                  <button className="btn btn-primary" type="button" disabled={isSaving} onClick={handleSave}>{isSaving ? 'Saving Project…' : 'Save Project'}</button>
                  <button className="admin-gallery-delete-btn" type="button" onClick={onDelete} aria-label={`Delete ${project.title}`}><FaTrash /></button>
                </div>
              </div>
            </div>

            <section className="admin-project-existing-images" aria-label="Existing project images">
              <div className="admin-project-existing-images-head">
                <div>
                  <p className="eyebrow">Existing Image Collection</p>
                  <h3>{project.images?.length || 0} visuals in this project</h3>
                </div>
                <span>Delete individual frames or add new images above</span>
              </div>
              {project.images?.length ? (
                <div className="admin-project-existing-images-grid">
                  {project.images.map((image, index) => (
                    <article className="admin-project-existing-image" key={image.id || `${project.id}-${index}`}>
                      <LuxuryImage
                        src={image.url || image.src}
                        alt={image.alt || image.name || `${project.title} image ${index + 1}`}
                      />
                      <div>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{image.name || image.alt || `Project visual ${index + 1}`}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteImage?.(project.id, image)}
                        aria-label={`Delete ${image.name || `project image ${index + 1}`}`}
                      >
                        <FaTrash />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-empty">No images remain in this project. Add new visuals before closing the editor.</p>
              )}
            </section>
          </m.article>
        </div>,
        document.body,
      )}
    </>
  )
}


