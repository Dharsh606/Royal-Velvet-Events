import { useEffect, useMemo, useRef, useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import {
  FaArrowLeft,
  FaArrowRight,
  FaCrown,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQuoteLeft,
  FaStar,
  FaVolumeMute,
  FaVolumeUp,
  FaYoutube,
  FaWhatsapp,
} from 'react-icons/fa'
import {
  about,
  bookingEventTypes,
  categoryToEventType,
  counters,
  defaultOfferSettings,
  destinations,
  eventFlow,
  eventPhilosophy,
  galleryStandards,
  founder,
  artists,
  artistDirectionPillars,
  artistFootprint,
  artistProductionStandards,
  legacyChapters,
  legacyFootprint,
  legacyStandards,
  careers,
  packages,
  reels as defaultReels,
  sectionCopy,
  serviceFlow,
  servicePhilosophy,
  serviceCategories,
  testimonials as defaultTestimonials,
  timeline,
} from '../data/content'
import {
  fetchGalleryProjects,
  fetchDestinationImages,
  fetchMembershipSettings,
  fetchPublishedTestimonials,
  fetchPublishedServices,
  fetchReels,
  fetchStorySettings,
  isSupabaseConfigured,
  mergeDestinationImages,
  mergeReels,
  mergeServiceCategories,
  submitBooking,
} from '../lib/contentApi'
import {
  applyProjectSeo,
  applyPublicSeo,
  getProjectPath,
  getProjectSlugFromPath,
  getSectionFromPath,
  SECTION_DISPLAY,
  SECTION_PATHS,
} from '../lib/seo'
import { LuxuryImage, RoyalTransactionOverlay } from './LuxurySystemStates'

const brandTitle = 'The Royal Velvet'
const brandTagline = 'Effortlessly Lavish'
const contactDeskLabel = 'Private Concierge Desk'
const contactPhone = '+91 98805 41336'
const contactPhoneHref = '+919880541336'
const instagramUrl = 'https://www.instagram.com/the_royal_velvet?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='
const introStorageKey = 'trv-responsive-intro-seen-at-v1'
const introCooldownMs = 30 * 60 * 1000
const introFallbackMs = 30 * 1000
const introDesktopVideoUrl = 'https://res.cloudinary.com/dqonskecw/video/upload/v1782918241/the-royal-velvet-intro-desktop_trqih7.mp4'
const introMobileVideoUrl = 'https://res.cloudinary.com/dqonskecw/video/upload/v1782918215/the-royal-velvet-intro-mobile_i1a0wb.mp4'
const destinationShells = destinations.map((destination) => ({
  ...destination,
  image: '',
  imageAlt: destination.name,
  imageSource: 'admin-pending',
}))
const getOptimizedSupabaseImage = (url, width = 900, quality = 72) => {
  if (!url || !url.includes('/storage/v1/object/public/')) return url
  const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const separator = transformed.includes('?') ? '&' : '?'
  return `${transformed}${separator}width=${width}&quality=${quality}&resize=cover`
}
const destinationSrcSet = (url) => {
  if (!url || !url.includes('/storage/v1/object/public/')) return undefined
  return [
    `${getOptimizedSupabaseImage(url, 480, 68)} 480w`,
    `${getOptimizedSupabaseImage(url, 760, 70)} 760w`,
    `${getOptimizedSupabaseImage(url, 1100, 74)} 1100w`,
  ].join(', ')
}
const getIntroVideoSource = () => {
  if (typeof window === 'undefined') return introDesktopVideoUrl
  return window.matchMedia('(max-width: 900px)').matches
    ? introMobileVideoUrl
    : introDesktopVideoUrl
}
const shouldSkipIntro = () => {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return true
  if (typeof sessionStorage === 'undefined') return false
  const lastSeen = Number(sessionStorage.getItem(introStorageKey) || 0)
  return lastSeen && Date.now() - lastSeen < introCooldownMs
}

const buildWhatsAppUrl = (message = '') => {
  const fallbackMessage = "Hello The Royal Velvet, I'd like to discuss a private event consultation."
  return `https://wa.me/${contactPhoneHref.replace('+', '')}?text=${encodeURIComponent(message || fallbackMessage)}`
}

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.45, ease: [0.22, 1, 0.36, 1] },
  },
}

const revealSoft = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.95, ease: [0.22, 1, 0.36, 1] },
  },
}

const staggerGroup = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.16, delayChildren: 0.14 },
  },
}

const cardMotion = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.22, ease: [0.22, 1, 0.36, 1] },
  },
}

const serviceCategoryMotion = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
  },
}

const serviceCardMotion = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

const atelierProcessMotion = {
  hidden: { opacity: 0, y: 40, rotateX: 8 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 1.35, ease: [0.22, 1, 0.36, 1], delay: 0.22 + index * 0.18 },
  }),
}

const processDetails = {
  Consultation: 'A private briefing to understand family priorities, guest profile, rituals, scale, and non-negotiables.',
  Discover: 'A private briefing to understand family priorities, guest profile, rituals, scale, and non-negotiables.',
  'Vision Planning': 'A refined direction board where mood, hospitality, venue flow, and experience language are aligned.',
  Design: 'A refined direction board where mood, hospitality, venue flow, and experience language are aligned.',
  'Luxury Design': 'Floral, stage, lighting, tablescape, artist, and guest moments are composed into one visual world.',
  Plan: 'Vendor coordination, timelines, permits, hospitality, production, and rituals are mapped with quiet precision.',
  'Grand Execution': 'On-ground teams move behind the scenes so the celebration feels seamless, calm, and cinematic.',
  Execute: 'On-ground teams move behind the scenes so the celebration feels seamless, calm, and cinematic.',
  'Royal Celebration': 'The family arrives into a finished atmosphere — polished, personal, and ready to be remembered.',
  Celebrate: 'The family arrives into a finished atmosphere — polished, personal, and ready to be remembered.',
}

const navLogoMotion = {
  hidden: { opacity: 0, y: -18, scale: 0.86 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.18 },
  },
}

const navBarMotion = {
  hidden: { opacity: 0, y: -22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.55, ease: [0.22, 1, 0.36, 1] },
  },
  scrolledAway: {
    opacity: 1,
    y: '-112%',
    transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] },
  },
}

const navLinksMotion = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.42, staggerChildren: 0.07 },
  },
}

const navItemMotion = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
}

const viewportOnce = { once: true, amount: 0.22 }

export default function PublicSite() {
  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'Our Story' },
    { id: 'events', label: 'Events' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'artists', label: 'Artists & Talent' },
    { id: 'milestone', label: 'Legacy' },
    { id: 'contact', label: 'Contact' },
    { id: 'booking', label: 'Book Consultation' },
  ]
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [introSkipped] = useState(() => shouldSkipIntro())
  const [loaded, setLoaded] = useState(introSkipped)
  const [introMuted, setIntroMuted] = useState(true)
  const [introVideoSource] = useState(getIntroVideoSource)
  const introVideoRef = useRef(null)
  const [submitted, setSubmitted] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [navHidden, setNavHidden] = useState(false)
  const [liveTestimonials, setLiveTestimonials] = useState(defaultTestimonials)
  const [liveGalleryProjects, setLiveGalleryProjects] = useState([])
  const [galleryProjectPreview, setGalleryProjectPreview] = useState(null)
  const [liveReels, setLiveReels] = useState(defaultReels)
  const [liveDestinations, setLiveDestinations] = useState(destinationShells)
  const [adminServices, setAdminServices] = useState([])
  const [storySettings, setStorySettings] = useState(null)
  const [offers, setOffers] = useState(defaultOfferSettings)
  const [offerPopupIndex, setOfferPopupIndex] = useState(0)
  const [offerPopupVisible, setOfferPopupVisible] = useState(true)
  const [offerPopupDismissed, setOfferPopupDismissed] = useState(false)
  const [expandedEvent, setExpandedEvent] = useState(packages[0]?.id || '')
  const [expandedCategory, setExpandedCategory] = useState('wedding')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedDestination, setSelectedDestination] = useState(null)
  const [activeSection, setActiveSectionState] = useState(() => getSectionFromPath(window.location.pathname))
  const displaySection = SECTION_DISPLAY[activeSection] || activeSection
  const homepageTitleImage = '/assets/royal-velvet-homepage-title.png'
  const emptyForm = {
    name: '',
    phone: '',
    email: '',
    type: '',
    date: '',
    budget: '',
    location: '',
    vision: '',
    childName: '',
    childAge: '',
    gender: '',
    brideGroom: '',
    venueName: '',
    venueAddress: '',
    venueSetting: 'Indoor',
    venueBooked: 'No',
    eventTiming: 'Evening',
    setupTime: '',
    venueContact: '',
    guests: '',
    adultsCount: '',
    kids0to3: '',
    kids4to8: '',
    kids9plus: '',
    theme: '',
    colours: '',
    inspirationPhoto: '',
    decorElements: [],
    customNameLogo: '',
    entertainmentOptions: [],
    entertainmentOther: '',
    mealType: 'Dinner',
    dietaryType: 'Pure Veg',
    cateringCount: '',
    cateringAddons: [],
    cateringOther: '',
    cakeStatus: 'Need Royal Velvet to Arrange',
    cakeFlavour: '',
    cakeWeight: '',
    cakeReference: '',
    mediaOptions: [],
    giftsNeeded: 'Exploring Options',
    giftBudget: '',
    decisionMaker: 'Self',
    confirmationTimeline: 'Within 1 week',
    spokenOtherPlanners: 'No',
    specialRequests: '',
    customServices: [],
    offerInterests: [],
  }
  const [form, setForm] = useState(emptyForm)
  const [bookingPrefill, setBookingPrefill] = useState(null)

  const setActiveSection = (section) => {
    setGalleryProjectPreview(null)
    setActiveSectionState(section)
  }

  const openGalleryProject = (project, { replace = false } = {}) => {
    if (!project?.slug) return
    setGalleryProjectPreview(project)
    setActiveSectionState('gallery')
    const projectPath = getProjectPath(project)
    if (window.location.pathname !== projectPath) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', projectPath)
    }
    applyProjectSeo(project)
  }

  const closeGalleryProject = ({ replace = false } = {}) => {
    setGalleryProjectPreview(null)
    setActiveSectionState('gallery')
    if (window.location.pathname !== SECTION_PATHS.gallery) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', SECTION_PATHS.gallery)
    }
    applyPublicSeo('gallery')
  }

  const completeIntro = () => {
    if (loaded) return
    sessionStorage.setItem(introStorageKey, String(Date.now()))
    setLoaded(true)
  }

  const toggleIntroSound = () => {
    const nextMuted = !introMuted
    const video = introVideoRef.current
    setIntroMuted(nextMuted)
    if (video) {
      video.muted = nextMuted
      if (!nextMuted) video.volume = 1
    }
  }

  useEffect(() => {
    const timer = loaded
      ? null
      : setTimeout(completeIntro, introFallbackMs)
    const hydrateContent = async () => {
      if (isSupabaseConfigured) {
        try {
          const [testimonialsData, galleryProjectsData, reelsData, destinationImagesData, membershipData, servicesData, storyData] = await Promise.all([
            fetchPublishedTestimonials(),
            fetchGalleryProjects(),
            fetchReels(),
            fetchDestinationImages(),
            fetchMembershipSettings(defaultOfferSettings),
            fetchPublishedServices(),
            fetchStorySettings(),
          ])
          if (membershipData?.length) setOffers(membershipData)
          if (servicesData?.length) setAdminServices(servicesData)
          if (storyData) setStorySettings(storyData)
          if (testimonialsData?.length) {
            const seen = new Set()
            const mergedTestimonials = [...testimonialsData, ...defaultTestimonials].filter((item) => {
              const key = `${item.name || ''}-${item.quote || ''}`.toLowerCase()
              if (seen.has(key)) return false
              seen.add(key)
              return true
            })
            setLiveTestimonials(mergedTestimonials)
          }
          const projects = galleryProjectsData || []
          setLiveGalleryProjects(projects)
          const requestedProjectSlug = getProjectSlugFromPath(window.location.pathname)
          const requestedProject = requestedProjectSlug
            ? projects.find((project) => project.slug === requestedProjectSlug)
            : null
          if (requestedProject) {
            setGalleryProjectPreview(requestedProject)
            setActiveSectionState('gallery')
            applyProjectSeo(requestedProject)
          }
          setLiveReels(mergeReels(defaultReels, reelsData || []))
          setLiveDestinations(mergeDestinationImages(destinations, destinationImagesData || []))
          return
        } catch {
          /* fall back to static content */
        }
      }

      const localMembership = await fetchMembershipSettings(defaultOfferSettings)
      if (localMembership?.length) setOffers(localMembership)
      const localStory = await fetchStorySettings()
      if (localStory) setStorySettings(localStory)
    }
    hydrateContent()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [loaded])

  useEffect(() => {
    let lastY = window.scrollY || document.documentElement.scrollTop || 0
    let ticking = false
    const updateNavbar = () => {
      const currentY = window.scrollY || document.documentElement.scrollTop || 0
      const delta = currentY - lastY

      if (currentY < 90) {
        setNavHidden(false)
      } else if (Math.abs(delta) > 6) {
        setNavHidden(false)
      }

      lastY = Math.max(currentY, 0)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (getProjectSlugFromPath(window.location.pathname) && activeSection === 'gallery') return
    const nextPath = SECTION_PATHS[activeSection] || '/'
    if (window.location.pathname !== nextPath) window.history.pushState(null, '', nextPath)
  }, [activeSection])

  useEffect(() => {
    const handlePopState = () => {
      const projectSlug = getProjectSlugFromPath(window.location.pathname)
      const project = projectSlug ? liveGalleryProjects.find((item) => item.slug === projectSlug) : null
      setActiveSectionState(getSectionFromPath(window.location.pathname))
      setGalleryProjectPreview(project || null)
      if (project) applyProjectSeo(project)
      else applyPublicSeo(getSectionFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [liveGalleryProjects])

  useEffect(() => {
    if (getProjectSlugFromPath(window.location.pathname)) return
    applyPublicSeo(activeSection)
  }, [activeSection])

  useEffect(() => {
    if (!loaded) return undefined
    const ring = document.querySelector('.cursor-ring')
    const dot = document.querySelector('.cursor-dot')
    const move = (event) => {
      ring?.style.setProperty('--x', `${event.clientX}px`)
      ring?.style.setProperty('--y', `${event.clientY}px`)
      dot?.style.setProperty('--x', `${event.clientX}px`)
      dot?.style.setProperty('--y', `${event.clientY}px`)
    }
    const interactiveSelector = 'a, button, input, textarea, select, .gallery-card'
    const expand = (event) => {
      if (event.target?.closest?.(interactiveSelector)) document.body.classList.add('cursor-hover')
    }
    const shrink = (event) => {
      if (event.target?.closest?.(interactiveSelector)) document.body.classList.remove('cursor-hover')
    }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseover', expand)
    document.addEventListener('mouseout', shrink)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', expand)
      document.removeEventListener('mouseout', shrink)
    }
  }, [loaded])

  const duplicatedReels = useMemo(() => [...liveReels, ...liveReels], [liveReels])

  const activeOffers = useMemo(
    () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return offers
        .filter((offer) => {
          if (!offer.active || !(offer.title || offer.description || offer.discountLabel)) return false
          const starts = offer.startDate ? new Date(offer.startDate) : null
          const ends = offer.endDate ? new Date(offer.endDate) : null
          if (starts) starts.setHours(0, 0, 0, 0)
          if (ends) ends.setHours(23, 59, 59, 999)
          return (!starts || today >= starts) && (!ends || today <= ends)
        })
        .slice(0, 3)
    },
    [offers],
  )
  const currentPopupOffer = activeOffers[offerPopupIndex]

  const liveServiceCategories = useMemo(
    () => mergeServiceCategories(serviceCategories, adminServices),
    [adminServices],
  )

  const liveServiceCount = useMemo(
    () => liveServiceCategories.reduce((sum, category) => sum + category.items.length, 0),
    [liveServiceCategories],
  )

  const featuredGalleryProject = useMemo(
    () => liveGalleryProjects.find((project) => project.isFeatured) || null,
    [liveGalleryProjects],
  )

  const completedGalleryProjects = useMemo(
    () => liveGalleryProjects.filter((project) => project.id !== featuredGalleryProject?.id),
    [liveGalleryProjects, featuredGalleryProject],
  )

  const storyProfile = useMemo(() => {
    const specializedServices = Math.max(Number(storySettings?.specializedServices) || 0, liveServiceCount)
    return {
      storyImageUrl: storySettings?.storyImageUrl || '',
      founderImageUrl: storySettings?.founderImageUrl || '',
      founderName: storySettings?.founderName || founder.name,
      founderRole: storySettings?.founderRole || founder.role,
      founderQuote: storySettings?.founderQuote || founder.quote,
      counters: [
        { value: Number(storySettings?.eventsCompleted) || counters[0].value, suffix: '+', label: 'Events Completed' },
        { value: Number(storySettings?.citiesServed) || counters[1].value, suffix: '+', label: 'Cities Served' },
        { value: specializedServices || counters[2].value, suffix: '+', label: 'Specialized Services' },
        { value: Number(storySettings?.clientSatisfaction) || counters[3].value, suffix: '%', label: 'Client Satisfaction' },
      ],
    }
  }, [liveServiceCount, storySettings])

  const liveLegacyMilestones = useMemo(() => {
    const eventsCompleted = storyProfile.counters.find((item) => item.label === 'Events Completed')?.value || counters[0].value
    const citiesServed = storyProfile.counters.find((item) => item.label === 'Cities Served')?.value || counters[1].value
    const specializedServices = storyProfile.counters.find((item) => item.label === 'Specialized Services')?.value || liveServiceCount
    const clientSatisfaction = storyProfile.counters.find((item) => item.label === 'Client Satisfaction')?.value || counters[3].value

    return [
      {
        value: `${eventsCompleted}+`,
        label: 'Celebrations Planned',
        text: 'A live count from the admin profile, covering weddings, poojas, baby milestones, corporate launches, anniversaries, and private family occasions.',
      },
      {
        value: `${specializedServices}+`,
        label: 'Live Service Universe',
        text: 'Updated from the active service catalogue across decor, rituals, hospitality, media, artists, logistics, wellness, and production.',
      },
      {
        value: `${packages.length}`,
        label: 'Curated Packages',
        text: 'Structured event worlds for weddings, destination celebrations, family milestones, cultural ceremonies, corporate events, and premium private experiences.',
      },
      {
        value: `${citiesServed}+`,
        label: 'Indian Cities Served',
        text: `${clientSatisfaction}% client satisfaction standard with Bangalore-led planning and event support across India.`,
      },
    ]
  }, [liveServiceCount, storyProfile])

  const customOptionsByCategory = useMemo(() => {
    const liveCustomOptions = liveServiceCategories.flatMap((category) =>
      category.items.map((item) => ({
        id: `${category.id}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: item.title,
        category: category.title.replace(' Services', ''),
      })),
    )

    return liveCustomOptions.reduce((groups, item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
      return groups
    }, {})
  }, [liveServiceCategories])

  useEffect(() => {
    if (!loaded || displaySection !== 'home' || !activeOffers.length || offerPopupDismissed) return undefined
    setOfferPopupVisible(true)
    setOfferPopupIndex(0)
    return undefined
  }, [loaded, displaySection, activeOffers.length, offerPopupDismissed])

  useEffect(() => {
    if (!loaded || displaySection !== 'home' || offerPopupDismissed || !offerPopupVisible || !activeOffers.length) return undefined
    const timer = window.setTimeout(() => {
      if (offerPopupIndex < activeOffers.length - 1) {
        setOfferPopupIndex((index) => index + 1)
      } else {
        setOfferPopupVisible(false)
      }
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [loaded, displaySection, activeOffers.length, offerPopupDismissed, offerPopupIndex, offerPopupVisible])

  const requestOffer = (offer) => {
    setOfferPopupVisible(false)
    setOfferPopupDismissed(true)
    openBooking({ eventType: 'Membership / Offer Inquiry', detail: offer?.title || 'Royal Velvet Offer' })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const toggleCustomService = (serviceTitle) => {
    setForm((current) => {
      const exists = current.customServices.includes(serviceTitle)
      return {
        ...current,
        customServices: exists
          ? current.customServices.filter((item) => item !== serviceTitle)
          : [...current.customServices, serviceTitle],
      }
    })
  }

  const chooseEventPackage = (pkg) => {
    setSelectedPackage(pkg)
    setSubmitted(false)
    setSubmitError('')
    setBookingPrefill({ eventType: 'Curated Package Inquiry', detail: `Package: ${pkg.name}` })
    setForm((current) => ({
      ...current,
      type: 'Curated Package Inquiry',
      vision: `Interested in: Package: ${pkg.name}`,
    }))
    setActiveSection('services')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleOfferInterest = (offerTitle) => {
    setForm((current) => {
      const exists = current.offerInterests.includes(offerTitle)
      return {
        ...current,
        offerInterests: exists
          ? current.offerInterests.filter((item) => item !== offerTitle)
          : [...current.offerInterests, offerTitle],
      }
    })
  }

  const toggleDecorElement = (item) => {
    setForm((current) => {
      const exists = (current.decorElements || []).includes(item)
      return {
        ...current,
        decorElements: exists
          ? current.decorElements.filter((i) => i !== item)
          : [...(current.decorElements || []), item],
      }
    })
  }

  const toggleEntertainment = (item) => {
    setForm((current) => {
      const exists = (current.entertainmentOptions || []).includes(item)
      return {
        ...current,
        entertainmentOptions: exists
          ? current.entertainmentOptions.filter((i) => i !== item)
          : [...(current.entertainmentOptions || []), item],
      }
    })
  }

  const toggleCateringAddon = (item) => {
    setForm((current) => {
      const exists = (current.cateringAddons || []).includes(item)
      return {
        ...current,
        cateringAddons: exists
          ? current.cateringAddons.filter((i) => i !== item)
          : [...(current.cateringAddons || []), item],
      }
    })
  }

  const toggleMediaOption = (item) => {
    setForm((current) => {
      const exists = (current.mediaOptions || []).includes(item)
      return {
        ...current,
        mediaOptions: exists
          ? current.mediaOptions.filter((i) => i !== item)
          : [...(current.mediaOptions || []), item],
      }
    })
  }

  const isKidsOrBirthday = Boolean(
    form.type && (
      form.type.toLowerCase().includes('birthday') ||
      form.type.toLowerCase().includes('baby') ||
      form.type.toLowerCase().includes('youth') ||
      form.type.toLowerCase().includes('kid')
    )
  )

  const isWedding = Boolean(
    form.type && (
      form.type.toLowerCase().includes('wedding') ||
      form.type.toLowerCase().includes('marriage')
    )
  )

  const buildBookingPayload = (currentForm) => {
    const additions = []
    if ((currentForm.customServices || []).length) {
      additions.push(`Custom package selections: ${currentForm.customServices.join(', ')}`)
    }
    if ((currentForm.offerInterests || []).length) {
      additions.push(`Offer interests: ${currentForm.offerInterests.join(', ')}`)
    }
    return {
      ...currentForm,
      vision: [currentForm.vision, ...additions].filter(Boolean).join('\n\n'),
    }
  }

  const openBooking = ({ eventType = '', detail = '' } = {}) => {
    setSubmitted(false)
    setSubmitError('')
    setBookingPrefill(detail || eventType ? { eventType, detail } : null)
    setForm((current) => ({
      ...current,
      type: eventType,
      vision: detail ? `Interested in: ${detail}` : current.vision,
    }))
    setActiveSection('booking')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openBookingForService = (categoryId, serviceTitle) => {
    openBooking({
      eventType: categoryToEventType[categoryId] || 'Other / Custom',
      detail: serviceTitle,
    })
  }

  const openBookingForPackage = (packageName) => {
    const pkg = packages.find((item) => item.name === packageName)
    if (pkg) {
      chooseEventPackage(pkg)
      return
    }
    openBooking({ eventType: 'Curated Package Inquiry', detail: `Package: ${packageName}` })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (bookingSubmitting) return
    setSubmitError('')
    setBookingSubmitting(true)
    try {
      const bookingPayload = buildBookingPayload(form)
      if (isSupabaseConfigured) {
        await submitBooking(bookingPayload)
      } else {
        const { db, isFirebaseConfigured } = await import('../lib/firebase')
        if (isFirebaseConfigured && db) {
          const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
          await addDoc(collection(db, 'bookings'), { ...bookingPayload, createdAt: serverTimestamp() })
        } else {
          const existing = JSON.parse(localStorage.getItem('rve-bookings') || '[]')
          localStorage.setItem('rve-bookings', JSON.stringify([{ ...bookingPayload, createdAt: new Date().toISOString() }, ...existing]))
        }
      }
      setSubmitted(true)
      setBookingPrefill(null)
      setForm(emptyForm)
    } catch (error) {
      setSubmitError(error.message || 'Could not submit your inquiry. Please try again or contact us directly.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
    <>
      {!loaded && (
        <div className="intro-video-screen" role="region" aria-label="The Royal Velvet cinematic introduction">
          <video
            ref={introVideoRef}
            className="intro-video"
            src={introVideoSource}
            autoPlay
            muted={introMuted}
            playsInline
            preload="auto"
            onEnded={completeIntro}
            onError={completeIntro}
          />
          <button
            className="intro-sound-toggle"
            type="button"
            onClick={toggleIntroSound}
            aria-label={introMuted ? 'Turn intro sound on' : 'Mute intro sound'}
            aria-pressed={!introMuted}
          >
            {introMuted ? <FaVolumeMute aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
          </button>
        </div>
      )}

      {loaded && (
      <>
      <div className="cursor-ring" />
      <div className="cursor-dot" />

      <m.header
        className={navHidden ? 'site-header nav-hidden' : 'site-header'}
        variants={navBarMotion}
        initial="hidden"
        animate={navHidden && !menuOpen ? 'scrolledAway' : 'visible'}
      >
        <div className="navbar">
          <m.a
            href={SECTION_PATHS.home}
            className="nav-logo"
            onClick={(event) => {
              event.preventDefault()
              setActiveSection('home')
            }}
            aria-label="The Royal Velvet home"
            variants={navLogoMotion}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.035, transition: { type: 'spring', stiffness: 95, damping: 26 } }}
            whileTap={{ scale: 0.97 }}
          >
            <img src="/assets/the-royal-velvet-sub-logo-bgless.png" alt="The Royal Velvet logo" width={1973} height={1973} decoding="async" fetchPriority="high" />
          </m.a>
          <m.div className="nav-group nav-primary" variants={navLinksMotion} initial="hidden" animate="visible">
            {sections.map((item) => (
              <m.a
                href={SECTION_PATHS[item.id]}
                className={displaySection === item.id ? 'active' : ''}
                key={item.id}
                variants={navItemMotion}
                onClick={(event) => {
                  event.preventDefault()
                  setActiveSection(item.id)
                  setMenuOpen(false)
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                {item.label}
              </m.a>
            ))}
          </m.div>
          <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
            <span />
            <span />
          </button>
          <nav className={menuOpen ? 'mobile-nav open' : 'mobile-nav'}>
            {sections.map((item) => (
              <a
                href={SECTION_PATHS[item.id]}
                className={displaySection === item.id ? 'active' : ''}
                key={item.id}
                onClick={(event) => {
                  event.preventDefault()
                  setActiveSection(item.id)
                  setMenuOpen(false)
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </m.header>

      <main>
        {displaySection === 'home' && (
        <>
        <section id="home" className="hero home-stage">
          <div className="hero-bg" aria-hidden="true" />
          <div className="particles hero-luxury-particles" aria-hidden="true" />
          <m.div className="hero-content" variants={staggerGroup} initial="hidden" animate="visible">
            <m.h1 className="hero-brand-title hero-brand-image-title" aria-label={brandTitle} variants={revealSoft}>
              <m.img src={homepageTitleImage} alt="" aria-hidden="true" width={2048} height={446} decoding="async" fetchPriority="high" whileHover={{ scale: 1.012 }} transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }} />
            </m.h1>
            <m.img className="hero-tagline-img" src="/assets/effortlessly-lavish-lettering.png" alt="" aria-hidden="true" width={1277} height={237} decoding="async" variants={revealUp} />
            <m.p className="hero-positioning" variants={revealUp}>Curators of Extraordinary Celebrations for India's Most Distinguished Families & Brands.</m.p>
            <m.div className="hero-actions" variants={revealUp}>
              <m.button className="btn btn-primary" onClick={() => openBooking()} whileHover={{ y: -3, boxShadow: '0 0 34px rgba(212, 175, 55, 0.34)' }} whileTap={{ scale: 0.98 }}>Book Private Consultation</m.button>
            </m.div>
            <m.div className="hero-trust-bar" variants={revealUp}>Serving Bangalore | Hyderabad | Chennai | Mumbai | Delhi | PAN India</m.div>
          </m.div>
        </section>
        <section id="experience" className="section content-section process-atelier-section">
          <m.div className="process-atelier-head" variants={staggerGroup} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <m.p className="eyebrow" variants={revealUp}>{sectionCopy.experience.eyebrow}</m.p>
            <m.h2 variants={revealUp}>{sectionCopy.experience.title}</m.h2>
            <m.p className="section-lead" variants={revealUp}>{sectionCopy.experience.subtitle}</m.p>
          </m.div>
          <m.div className="process-atelier-grid" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.28 }}>
            {timeline.map((step, index) => (
              <m.article
                className="process-atelier-card"
                key={step}
                custom={index}
                variants={atelierProcessMotion}
                whileHover={{ y: -10, scale: 1.012, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
              >
                <span className="process-atelier-number">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step}</h3>
                  <p>{processDetails[step] || 'A composed stage in the private planning journey, handled with clarity and discretion.'}</p>
                </div>
              </m.article>
            ))}
          </m.div>
        </section>

        <section id="testimonials" className="section content-section">
          <m.p className="eyebrow" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>{sectionCopy.testimonials.eyebrow}</m.p>
          <m.h2 variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>{sectionCopy.testimonials.title}</m.h2>
          <m.div className="testimonial-grid" variants={staggerGroup} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {liveTestimonials.map((item) => (
              <m.article
                className="glass-card testimonial-card"
                key={item.id || item.name}
                variants={cardMotion}
                whileHover={{ y: -8, scale: 1.012 }}
                transition={{ type: 'spring', stiffness: 90, damping: 28 }}
              >
                <FaQuoteLeft />
                <p>{item.quote}</p>
                <div className="testimonial-rating" role="img" aria-label={`${item.rating || 5} star rating`}>
                  {Array.from({ length: Number(item.rating) || 5 }).map((_, index) => (
                    <FaStar key={index} />
                  ))}
                </div>
                <footer>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{[item.city, item.role].filter(Boolean).join(' | ')}</span>
                  </div>
                </footer>
              </m.article>
            ))}
          </m.div>
        </section>

        <section id="destinations" className="section content-section">
          <m.p className="eyebrow" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>{sectionCopy.destinations.eyebrow}</m.p>
          <m.h2 variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>{sectionCopy.destinations.title}</m.h2>
          <m.p className="destination-helper" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            Select a state or destination region to preview elite palace hotels, private resorts, and signature wedding venues curated for royal-scale celebrations.
          </m.p>
          <div className="destination-grid">
            {liveDestinations.map((item, index) => (
              <article
                className="destination-card"
                key={item.name}
                onClick={() => setSelectedDestination(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedDestination(item)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View elite wedding venues in ${item.name}`}
              >
                <LuxuryImage
                  src={getOptimizedSupabaseImage(item.image, 760, 70)}
                  rawSrc={item.image}
                  srcSet={destinationSrcSet(item.image)}
                  sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, 25vw"
                  alt={item.imageAlt || item.name}
                  width={640}
                  height={820}
                  loading={index < 4 ? 'eager' : 'lazy'}
                  fetchPriority={index < 2 ? 'high' : 'low'}
                  decoding="async"
                  fill
                />
                <span className="destination-card-title">{item.name}</span>
              </article>
            ))}
          </div>

        </section>

        <section id="reels" className="section content-section reels-section">
          <p className="eyebrow">{sectionCopy.reels.eyebrow}</p>
          <h2>{sectionCopy.reels.title}</h2>
          <div className="reel-track">
            {duplicatedReels.map((item, index) => (
              <a
                className={`reel-card${item.url ? ' reel-card-has-media' : ''}`}
                key={`${item.id || item.title}-${index}`}
                href={item.reelUrl || item.url || instagramUrl}
                target="_blank"
                rel="noreferrer"
                style={
                  item.url && !item.isVideo
                    ? {
                        backgroundImage: `url(${item.url})`,
                      }
                    : undefined
                }
              >
                {item.url && item.isVideo ? (
                  <video src={item.url} muted loop playsInline autoPlay />
                ) : null}
                <FaInstagram />
                <span>{item.title}</span>
              </a>
            ))}
          </div>
        </section>
        <LuxuryFooter setActiveSection={setActiveSection} />
        </>
        )}

        {displaySection === 'about' && (
        <section id="about" className="section page-stage story-luxury-section">
          <m.div className="story-hero-panel glass-card" variants={revealSoft} initial="hidden" animate="visible">
            <div className="story-image-stack" role="group" aria-label="Luxury celebration image placeholders">
              <div
                className={storyProfile.storyImageUrl ? 'story-image-card story-image-primary has-image' : 'story-image-card story-image-primary'}
                style={storyProfile.storyImageUrl ? { backgroundImage: `url(${storyProfile.storyImageUrl})` } : undefined}
              >
                <span>{storyProfile.storyImageUrl ? 'Signature Story Image' : 'Future Founder / Signature Event Image'}</span>
              </div>
            </div>
            <m.div className="story-copy-panel" variants={staggerGroup} initial="hidden" animate="visible">
              <p className="eyebrow">Our Story</p>
              <m.h2 variants={revealUp}>{about.title}</m.h2>
              <m.p variants={revealUp}>{about.text}</m.p>
              <m.p variants={revealUp}>{about.philosophy}</m.p>
            </m.div>
          </m.div>

          <m.div className="founder-section glass-card" variants={revealSoft} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <div
              className={storyProfile.founderImageUrl ? 'founder-portrait has-image' : 'founder-portrait'}
              style={storyProfile.founderImageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(15,15,15,.08), rgba(15,15,15,.7)), url(${storyProfile.founderImageUrl})` } : undefined}
            >
              {!storyProfile.founderImageUrl && <span className="founder-initials">VHR</span>}
              {!storyProfile.founderImageUrl && <small>Founder Portrait Space</small>}
            </div>
            <div className="founder-content">
              <p className="eyebrow">Founder</p>
              <h3>{storyProfile.founderName}</h3>
              <span>{storyProfile.founderRole}</span>
              <blockquote>“{storyProfile.founderQuote}”</blockquote>
              <p>{founder.text}</p>
              <div className="founder-pillars">
                {founder.pillars.map((item) => (
                  <article key={item}>
                    <FaCrown />
                    <span>{item}</span>
                  </article>
                ))}
              </div>
            </div>
          </m.div>

          <m.div className="story-counter-strip" variants={staggerGroup} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {storyProfile.counters.map((counter) => (
              <m.article className="glass-card" key={counter.label} variants={cardMotion} whileHover={{ y: -5 }}>
                <strong>{counter.value}{counter.suffix}</strong>
                <span>{counter.label}</span>
              </m.article>
            ))}
          </m.div>
        </section>
        )}

        {displaySection === 'events' && (
        <section id="events" className="section page-stage events-page editorial-section">
          <m.div className="events-hero glass-card single-column-hero" variants={staggerGroup} initial="hidden" animate="visible">
            <m.div className="events-hero-copy" variants={revealSoft}>
              <p className="eyebrow">Events</p>
              <h2 className="single-line-title">Choose your celebration architecture.</h2>
            </m.div>
          </m.div>

          <m.div className="event-catalog-head" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <p className="eyebrow">Signature Event Packages</p>
            <h3>Open a package to see what is included.</h3>
          </m.div>

          <m.div className="event-accordion luxury-event-accordion" variants={staggerGroup} initial="hidden" animate="visible">
            {packages.map((pkg) => {
              const isOpen = expandedEvent === pkg.id
              return (
                <m.article className={isOpen ? 'glass-card event-package luxury-event-package open' : 'glass-card event-package luxury-event-package'} key={pkg.id} variants={cardMotion} whileHover={{ y: -4 }}>
                  <button className="event-package-head" type="button" onClick={() => setExpandedEvent(isOpen ? '' : pkg.id)}>
                    <span className="package-tier">{pkg.tier}</span>
                    <div>
                      <h3>{pkg.name}</h3>
                      <p>{pkg.tagline}</p>
                    </div>
                    <FaArrowRight className="event-arrow" />
                  </button>
                  <div className="event-package-body" aria-hidden={!isOpen}>
                    <ul className="package-highlights">
                      {pkg.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="package-ideal"><strong>Ideal for:</strong> {pkg.idealFor}</p>
                    <button className="btn btn-primary" type="button" onClick={() => chooseEventPackage(pkg)}>
                      Choose Package & Add Services <FaArrowRight />
                    </button>
                  </div>
                </m.article>
              )
            })}
          </m.div>

          {activeOffers.length > 0 && (
            <div className="offer-service-grid luxury-offer-grid">
              {activeOffers.map((offer) => (
                <article className="glass-card membership-service-card" key={offer.id || offer.title}>
                  <p className="eyebrow">Membership & Offers</p>
                  <h3>{offer.title}</h3>
                  <strong>{offer.discountLabel}</strong>
                  <p>{offer.description}</p>
                  <small>{offer.note}</small>
                  <button className="btn btn-primary" type="button" onClick={() => openBooking({ eventType: 'Membership / Offer Inquiry', detail: offer.title })}>
                    Request This Offer <FaArrowRight />
                  </button>
                </article>
              ))}
            </div>
          )}

          <m.div className="events-flow-footer" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <div className="event-flow-card">
              <span>Private Planning Flow</span>
              <div className="event-flow-steps">
                {eventFlow.map((step, index) => (
                  <article key={step}>
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                    <p>{step}</p>
                  </article>
                ))}
              </div>
            </div>
          </m.div>
        </section>
        )}

        {displaySection === 'services' && (
        <section id="services" className="section page-stage services-page editorial-section">
          <m.div className="services-hero glass-card single-column-hero" variants={staggerGroup} initial="hidden" animate="visible">
            <m.div className="services-hero-copy" variants={revealSoft}>
              <p className="eyebrow">Services</p>
              <h2 className="single-line-title">Enhance your selected package with bespoke services.</h2>
            </m.div>
          </m.div>

          <div className="services-layout-container">
            <div className="services-main-content">
              <m.div className="event-catalog-head" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
                <p className="eyebrow">Bespoke Service Catalogue</p>
                <h3>Select the refinements you want added to your event proposal.</h3>
              </m.div>

              <div className="service-catalog luxury-service-catalog">
                {liveServiceCategories.map((category) => {
                  const isOpen = expandedCategory === category.id
                  return (
                    <div className={isOpen ? 'service-category luxury-service-category glass-card open' : 'service-category luxury-service-category glass-card'} key={category.id}>
                      <button className="service-category-head-btn" type="button" onClick={() => setExpandedCategory(isOpen ? '' : category.id)}>
                        <span className="service-category-icon" aria-hidden="true"><FaCrown /></span>
                        <div><h3>{category.title}</h3><p>{category.subtitle}</p></div>
                        <FaArrowRight className="service-arrow" />
                      </button>
                      <div className="service-category-body" aria-hidden={!isOpen}>
                        <div className="service-item-grid luxury-service-item-grid">
                          {category.items.map((item) => (
                            <m.article className="glass-card service-item-card luxury-service-item-card" key={item.title} whileHover={{ y: -6, scale: 1.01 }}>
                              <h4>{item.title}</h4>
                              {item.cardTitle && <span className="service-card-label">{item.cardTitle}</span>}
                              <p>{item.text}</p>
                              <button className={form.customServices.includes(item.title) ? 'btn btn-primary service-request-btn' : 'btn btn-ghost service-request-btn'} type="button" onClick={() => toggleCustomService(item.title)}>
                                {form.customServices.includes(item.title) ? 'Added' : 'Add Service'} <FaArrowRight />
                              </button>
                            </m.article>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {activeOffers.length > 0 && (
                <div className="offer-service-grid luxury-offer-grid">
                  {activeOffers.map((offer) => (
                    <article className="glass-card membership-service-card" key={offer.id || offer.title}>
                      <p className="eyebrow">Membership & Offers</p><h3>{offer.title}</h3><strong>{offer.discountLabel}</strong><p>{offer.description}</p><small>{offer.note}</small>
                      <button className="btn btn-primary" type="button" onClick={() => openBooking({ eventType: 'Membership / Offer Inquiry', detail: offer.title })}>Request This Offer <FaArrowRight /></button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="services-sidebar-wrapper">
              <div className="services-sticky-sidebar glass-card">
                <div className="sidebar-header">
                  <p className="eyebrow">Your Celebration Plan</p>
                  <h4 className="sidebar-summary-title">Summary</h4>
                </div>

                <div className="sidebar-section package-section">
                  <span className="section-label">Selected Package</span>
                  {selectedPackage ? (
                    <div className="sidebar-package-card">
                      <h4 style={{ fontFamily: "'Montserrat', sans-serif" }}>{selectedPackage.name}</h4>
                      <p>{selectedPackage.tagline}</p>
                      <button className="btn-link" type="button" onClick={() => setActiveSection('events')}>Change Package</button>
                    </div>
                  ) : (
                    <div className="sidebar-package-card empty">
                      <p>No package selected.</p>
                      <button className="btn-link" type="button" onClick={() => setActiveSection('events')}>Browse Packages</button>
                    </div>
                  )}
                </div>

                <div className="sidebar-section services-section">
                  <span className="section-label">Added Refinements ({form.customServices.length})</span>
                  {form.customServices.length > 0 ? (
                    <ul className="sidebar-services-list">
                      {form.customServices.map((serviceName) => (
                        <li key={serviceName} className="sidebar-service-item">
                          <span>{serviceName}</span>
                          <button className="remove-service-btn" type="button" onClick={() => toggleCustomService(serviceName)} aria-label={`Remove ${serviceName}`}>&times;</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="sidebar-services-empty">
                      <p>No extra services added yet. Customize your proposal by adding services from the catalogue.</p>
                    </div>
                  )}
                </div>

                <div className="sidebar-footer">
                  <button className="btn btn-primary w-full" type="button" onClick={() => openBooking({ eventType: selectedPackage ? 'Curated Package Inquiry' : 'Custom Package Builder', detail: selectedPackage ? ('Package: ' + selectedPackage.name) : 'Custom service package' })}>
                    Continue to Book Consultation <FaArrowRight />
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <m.div className="services-flow-footer" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <div className="service-flow-card">
              <span>Custom Service Flow</span>
              <div className="service-flow-steps">
                {serviceFlow.map((step, index) => (
                  <article key={step}>
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                    <p>{step}</p>
                  </article>
                ))}
              </div>
            </div>
          </m.div>
        </section>
        )}
        {displaySection === 'gallery' && (
        <section id="gallery" className="section gallery-section editorial-section page-stage">
          <m.div className="gallery-hero glass-card" variants={staggerGroup} initial="hidden" animate="visible">
            <m.div className="gallery-hero-copy" variants={revealSoft}>
              <p className="eyebrow">{sectionCopy.gallery.eyebrow}</p>
              <h2>{sectionCopy.gallery.title}</h2>
              <p>
                The gallery is treated as a private visual archive — a record of mandapams, rituals, floral worlds,
                family milestones, corporate stages, and hospitality details designed to feel timeless in memory and cinematic on screen.
              </p>
            </m.div>
            {featuredGalleryProject ? (
              <m.article
                className="gallery-project-feature"
                variants={revealUp}
                whileHover={{ y: -4 }}
              >
                <ProjectImageRail project={featuredGalleryProject} eager />
                <div className="gallery-project-feature-copy">
                  <p className="eyebrow">Featured Project</p>
                  <h3>{featuredGalleryProject.title}</h3>
                  <p>{featuredGalleryProject.description || 'A signature Royal Velvet celebration, composed with detail and atmosphere.'}</p>
                  <span>{formatProjectDate(featuredGalleryProject.projectDate)}</span>
                  <a
                    className="gallery-project-explore"
                    href={getProjectPath(featuredGalleryProject)}
                    onClick={(event) => {
                      event.preventDefault()
                      openGalleryProject(featuredGalleryProject)
                    }}
                  >
                    Explore Project <FaArrowRight />
                  </a>
                </div>
              </m.article>
            ) : (
              <m.div className="gallery-project-feature gallery-empty-frame" variants={revealUp}>
                <span>No Featured Project</span>
                <p>Select one published project as featured from the admin archive to reveal it here.</p>
              </m.div>
            )}
          </m.div>

          <m.div className="gallery-archive-head" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <p className="eyebrow">Completed Projects</p>
            <h3>Designed as complete visual worlds, not isolated photographs.</h3>
          </m.div>

          <m.div className="gallery-project-grid" variants={staggerGroup} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {liveGalleryProjects.length === 0 && (
              <m.div className="glass-card gallery-empty-state" variants={revealSoft}>
                <p className="eyebrow">Private Archive</p>
                <h3>No completed projects are published yet.</h3>
                <p>The gallery will reveal original Royal Velvet productions once published from the admin panel.</p>
              </m.div>
            )}
            {completedGalleryProjects.map((project) => (
              <m.article
                className="gallery-project-card"
                key={project.id}
                variants={cardMotion}
                whileHover={{ y: -7, scale: 1.012 }}
              >
                <p className="gallery-project-title">{project.title}</p>
                <ProjectImageRail project={project} />
                <div className="gallery-project-meta">
                  <p>{project.description || 'A bespoke Royal Velvet celebration, shaped as a complete experience.'}</p>
                  <div>
                    <span>{formatProjectDate(project.projectDate)}</span>
                    <a
                      href={getProjectPath(project)}
                      onClick={(event) => {
                        event.preventDefault()
                        openGalleryProject(project)
                      }}
                    >
                      Explore <FaArrowRight />
                    </a>
                  </div>
                </div>
              </m.article>
            ))}
          </m.div>

          <m.div className="editorial-footprint glass-card" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {galleryStandards.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </m.div>
        </section>
        )}

        {displaySection === 'artists' && (
        <section id="artists" className="section artist-section editorial-section page-stage">
          <m.div className="artist-hero glass-card" variants={staggerGroup} initial="hidden" animate="visible">
            <m.div className="artist-hero-copy" variants={revealSoft}>
              <p className="eyebrow">Artists & Talent</p>
              <h2>{sectionCopy.artists.title}</h2>
            </m.div>
          </m.div>

          <m.div className="artist-standard-panel glass-card" variants={revealSoft} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <div>
              <p className="eyebrow">Production Categories</p>
              <h3>Traditional presence, modern energy, and cinematic memory.</h3>
              <p>
                The Royal Velvet coordinates talent around cultural respect, stage timing, guest mood, sound quality, and final visual output.
              </p>
            </div>
            <div className="artist-standard-grid">
              {artistProductionStandards.map((standard) => (
                <article key={standard.title}>
                  <h4>{standard.title}</h4>
                  <p>{standard.text}</p>
                </article>
              ))}
            </div>
          </m.div>

          <m.div className="gallery-archive-head" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <p className="eyebrow">Talent Universe</p>
            <h3>Specialists we coordinate for premium celebrations.</h3>
          </m.div>

          <m.div className="artist-grid" variants={staggerGroup} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {artists.map((artist) => (
              <m.article className="glass-card artist-card" key={artist.name} variants={cardMotion} whileHover={{ y: -6, scale: 1.01 }}>
                <span>{artist.role}</span>
                <h3>{artist.name}</h3>
                <p>{artist.feature}</p>
              </m.article>
            ))}
          </m.div>

          <m.div className="editorial-footprint glass-card" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {artistFootprint.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </m.div>
        </section>
        )}

        {displaySection === 'milestone' && (
        <section id="milestone" className="section page-stage legacy-section">
          <m.div className="legacy-hero glass-card" variants={staggerGroup} initial="hidden" animate="visible">
            <m.div className="legacy-hero-copy" variants={revealSoft}>
              <p className="eyebrow">Legacy</p>
              <h2>{sectionCopy.milestone.title}</h2>

              <div className="legacy-founder-line">
                <span>Founder Led By</span>
                <strong>{storyProfile.founderName}</strong>
              </div>
            </m.div>
            <m.div className="legacy-crest-panel" variants={revealUp}>
              <img src="/assets/the-royal-velvet-sub-logo-bgless.png" alt="The Royal Velvet crest" width={1973} height={1973} loading="lazy" decoding="async" />
              <span>Luxury Celebration Architects</span>
            </m.div>
          </m.div>

          <m.div className="legacy-stat-grid" variants={staggerGroup} initial="hidden" animate="visible">
            {liveLegacyMilestones.map((item) => (
              <m.article className="glass-card legacy-stat-card" key={item.label} variants={cardMotion} whileHover={{ y: -6, scale: 1.01 }}>
                <strong>{item.value}</strong>
                <h3>{item.label}</h3>
                <p>{item.text}</p>
              </m.article>
            ))}
          </m.div>

          <m.div className="legacy-editorial-grid" variants={staggerGroup} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {legacyChapters.map((chapter) => (
              <m.article className="glass-card legacy-chapter-card" key={chapter.title} variants={cardMotion}>
                <span>{chapter.number}</span>
                <h3>{chapter.title}</h3>
                <p>{chapter.text}</p>
              </m.article>
            ))}
          </m.div>

          <m.div className="legacy-standard-panel glass-card" variants={revealSoft} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <div>
              <p className="eyebrow">Our Standard</p>
              <h3>Indian heritage, handled with hotel-level precision.</h3>
              <p>
                The legacy we are building is not measured only by scale. It is measured by how safely a family can
                trust us with sacred rituals, important guests, complex logistics, and the atmosphere of a once-in-a-lifetime day.
              </p>
            </div>
            <div className="legacy-standard-grid">
              {legacyStandards.map((standard) => (
                <article key={standard.title}>
                  <h4>{standard.title}</h4>
                  <p>{standard.text}</p>
                </article>
              ))}
            </div>
          </m.div>

          <m.div className="legacy-footprint glass-card" variants={revealUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            {legacyFootprint.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </m.div>
        </section>
        )}

        {displaySection === 'careers' && (
        <section id="careers" className="section page-stage">
          <p className="eyebrow">{sectionCopy.careers.eyebrow}</p>
          <h2>{sectionCopy.careers.title}</h2>
          <div className="career-grid">
            {careers.map((job) => (
              <article className="glass-card career-card" key={job.title}>
                <div>
                  <span>{job.type}</span>
                  <h3>{job.title}</h3>
                  <p>{job.text}</p>
                </div>
                <strong>{job.location}</strong>
                <button className="btn btn-ghost" type="button" onClick={() => openBooking({ eventType: 'Career / Collaboration Inquiry', detail: job.title })}>Apply Now</button>
              </article>
            ))}
          </div>
        </section>
        )}

        {displaySection === 'booking' && (
        <section id="booking" className="section booking-page page-stage">
          <m.div className="booking-architecture-hero glass-card single-column-hero" variants={staggerGroup} initial="hidden" animate="visible">
            <m.div className="booking-architecture-copy" variants={revealSoft}>
              <p className="eyebrow">Consultation Desk</p>
              <h3>A private consultation for celebrations that cannot be ordinary.</h3>
            </m.div>
          </m.div>

          {bookingPrefill && (
            <m.div className="booking-prefill-banner glass-card" variants={revealSoft} style={{ marginBottom: '2rem' }}>
              <p className="eyebrow">Your Selection</p>
              <p>
                {bookingPrefill.detail && <strong>{bookingPrefill.detail}</strong>}
                {bookingPrefill.detail && bookingPrefill.eventType && <span> · </span>}
                {bookingPrefill.eventType && <span>{bookingPrefill.eventType}</span>}
              </p>
              <button className="text-button" type="button" onClick={() => { setBookingPrefill(null); setForm((c) => ({ ...c, type: '', vision: '' })) }}>
                Clear selection
              </button>
            </m.div>
          )}

          <m.div className="booking-luxury-layout" variants={staggerGroup} initial="hidden" animate="visible">
            <m.form className="glass-card booking-form-luxury" onSubmit={handleSubmit} variants={revealSoft}>
              {submitted ? (
                <div className="booking-success">
                  <span className="booking-intro-badge">Inquiry Received</span>
                  <h3>Thank you. Your celebration is in trusted hands.</h3>
                  <p>Our concierge team will reach out shortly with a thoughtful planning direction.</p>
                  <button className="btn btn-primary" type="button" onClick={() => setSubmitted(false)}>
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-section-block">
                    <p className="form-step-label"><span>01</span> Your Details</p>
                    <div className="form-fields-row">
                      <label className="booking-field">
                        <span className="booking-field-label">Full Name</span>
                        <input name="name" type="text" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
                      </label>
                      <label className="booking-field">
                        <span className="booking-field-label">Phone Number</span>
                        <input name="phone" type="tel" placeholder="+91 98805 41336" value={form.phone} onChange={handleChange} required />
                      </label>
                    </div>
                    <label className="booking-field full">
                      <span className="booking-field-label">Email Address</span>
                      <input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
                    </label>
                  </div>

                  <div className="form-section-block">
                    <p className="form-step-label"><span>02</span> Event Details</p>
                    <div className="form-fields-row">
                      <label className="booking-field">
                        <span className="booking-field-label">Event Type</span>
                        <select name="type" value={form.type} onChange={handleChange} required>
                          <option value="" disabled hidden>
                            Choose event type
                          </option>
                          {bookingEventTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="booking-field">
                        <span className="booking-field-label">Preferred Date</span>
                        <input name="date" type="date" value={form.date} onChange={handleChange} required />
                      </label>
                    </div>
                    <div className="form-fields-row">
                      <label className="booking-field">
                        <span className="booking-field-label">Budget Range</span>
                        <select name="budget" value={form.budget} onChange={handleChange} required>
                          <option value="" disabled hidden>
                            Choose budget range
                          </option>
                          <option value="Under ₹5 Lakhs">Under ₹5 Lakhs</option>
                          <option value="₹5 – 15 Lakhs">₹5 – 15 Lakhs</option>
                          <option value="₹15 – 35 Lakhs">₹15 – 35 Lakhs</option>
                          <option value="₹35 – 75 Lakhs">₹35 – 75 Lakhs</option>
                          <option value="₹75 Lakhs+">₹75 Lakhs+</option>
                          <option value="Prefer to discuss privately">Prefer to discuss privately</option>
                        </select>
                      </label>
                      <label className="booking-field">
                        <span className="booking-field-label">Event Location</span>
                        <input name="location" type="text" placeholder="City or venue" value={form.location} onChange={handleChange} required />
                      </label>
                    </div>
                  </div>

                  <div className="form-section-block custom-package-booking">
                    <p className="form-step-label"><span>03</span> Customize Package</p>
                    <p className="booking-form-note">Optional: choose services you want combined into one bespoke package.</p>
                    <div className="custom-service-groups">
                      {Object.entries(customOptionsByCategory).map(([category, items]) => (
                        <div className="custom-service-group" key={category}>
                          <h4>{category}</h4>
                          <div className="custom-service-grid">
                            {items.map((item) => (
                              <label className="custom-service-option" key={item.id}>
                                <input
                                  type="checkbox"
                                  checked={form.customServices.includes(item.title)}
                                  onChange={() => toggleCustomService(item.title)}
                                />
                                <span>{item.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeOffers.length > 0 && (
                    <div className="form-section-block membership-booking-block">
                      <p className="form-step-label"><span>04</span> Membership & Offers</p>
                      <div className="membership-booking-list">
                        {activeOffers.map((offer) => (
                          <label className="membership-booking-card" key={offer.id || offer.title}>
                            <input
                              type="checkbox"
                              checked={form.offerInterests.includes(offer.title)}
                              onChange={() => toggleOfferInterest(offer.title)}
                            />
                            <div>
                              <strong>{offer.title}</strong>
                              <span>{offer.discountLabel}</span>
                              <p>{offer.note}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-section-block">
                    <p className="form-step-label"><span>{activeOffers.length ? '05' : '04'}</span> Your Vision (Optional)</p>
                    <label className="booking-field full">
                      <span className="booking-field-label">Your Vision (Optional)</span>
                      <textarea
                        name="vision"
                        placeholder="Describe the atmosphere, rituals, guest count, and anything sacred to your celebration"
                        value={form.vision}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <button className="btn btn-primary booking-submit" type="submit" disabled={bookingSubmitting} aria-busy={bookingSubmitting}>
                    {bookingSubmitting ? 'Securing Consultation…' : 'Request Private Consultation'} <FaArrowRight />
                  </button>
                  {submitError && <p className="booking-form-error">{submitError}</p>}
                  <p className="booking-form-note">By submitting, you agree to a discreet review of your inquiry. We never share your details.</p>
                </>
              )}
            </m.form>

            <m.aside className="booking-intro-panel" variants={revealSoft} style={{ marginTop: '1.5rem' }}>
              <m.div className="glass-card booking-intro-card" whileHover={{ y: -4 }}>
                <span className="booking-intro-badge">Concierge Inquiry</span>
                <h3>Every royal celebration begins with a single conversation.</h3>
                <p>
                  Whether you are planning a multi-day wedding, a sacred pooja, a baby naming ceremony, or a corporate
                  product launch, we shape the experience around your vision, not a template.
                </p>
                <ol className="booking-steps">
                  <li><span>01</span><div><strong>Share your vision</strong><p>Tell us the event, date, and atmosphere you imagine.</p></div></li>
                  <li><span>02</span><div><strong>Receive a direction</strong><p>We respond with scope, approach, and next steps.</p></div></li>
                  <li><span>03</span><div><strong>Begin planning</strong><p>Your dedicated coordinator guides every detail calmly.</p></div></li>
                </ol>
                <div className="booking-assurance">
                  <span>{liveServiceCount}+ services</span>
                  <span>{packages.length} curated packages</span>
                  <span>End-to-end production</span>
                </div>
                <button className="btn btn-ghost" type="button" onClick={() => setActiveSection('contact')}>
                  Visit Contact Page <FaArrowRight />
                </button>
              </m.div>
            </m.aside>
          </m.div>
        </section>
        )}

        {displaySection === 'contact' && (
        <section id="contact" className="section contact-page-luxury page-stage">
          <m.div className="contact-signature-hero glass-card single-column-hero" variants={staggerGroup} initial="hidden" animate="visible">
            <m.div className="contact-signature-copy" variants={revealSoft}>
              <p className="eyebrow">Royal Concierge</p>
              <h3 className="single-line-title">Begin with a discreet conversation.</h3>
            </m.div>
          </m.div>

          <m.div className="contact-cards-grid" variants={staggerGroup} initial="hidden" animate="visible">
            <m.article className="glass-card contact-card-luxury" variants={cardMotion} whileHover={{ y: -6, scale: 1.01 }}>
              <FaPhoneAlt />
              <h3>Private Call</h3>
              <p>Best for urgent dates, venue walkthroughs, and event availability.</p>
              <a href={`tel:${contactPhoneHref}`}>{contactPhone}</a>
            </m.article>
            <m.article className="glass-card contact-card-luxury" variants={cardMotion} whileHover={{ y: -6, scale: 1.01 }}>
              <FaWhatsapp />
              <h3>WhatsApp Concierge</h3>
              <p>Share event basics, reference images, or package interests directly.</p>
              <a href={buildWhatsAppUrl('Hello The Royal Velvet, I would like to discuss availability for a luxury event consultation.')}>Chat on WhatsApp</a>
            </m.article>
            <m.article className="glass-card contact-card-luxury" variants={cardMotion} whileHover={{ y: -6, scale: 1.01 }}>
              <FaEnvelope />
              <h3>Proposal Desk</h3>
              <p>For detailed proposals, partnerships, and documentation, use our private consultation form.</p>
              <button type="button" onClick={() => openBooking({ eventType: 'Proposal Desk Inquiry', detail: 'Detailed proposal, partnership, or documentation request' })}>{contactDeskLabel}</button>
            </m.article>
            <m.article className="glass-card contact-card-luxury" variants={cardMotion} whileHover={{ y: -6, scale: 1.01 }}>
              <FaMapMarkerAlt />
              <h3>Bangalore Studio</h3>
              <p>HSR Layout, Bangalore, serving luxury celebrations across India.</p>
              <span>Mon - Sat · 10:00 AM - 7:00 PM</span>
            </m.article>
          </m.div>

          <m.div className="contact-connect-panel glass-card" variants={revealSoft} initial="hidden" animate="visible">
            <div>
              <p className="eyebrow">Connect</p>
              <h3>The Royal Velvet</h3>
              <p>Curators of Extraordinary Celebrations for India's Most Distinguished Families & Brands.</p>
              <div className="social-links contact-social">
                <a href={instagramUrl} aria-label="Instagram"><FaInstagram /></a>
                <a href="#" aria-label="Facebook"><FaFacebookF /></a>
                <a href="#" aria-label="YouTube"><FaYoutube /></a>
                <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
              </div>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => openBooking()}>
              Request Private Consultation <FaArrowRight />
            </button>
          </m.div>

          <m.div className="contact-map-panel glass-card" variants={revealSoft} initial="hidden" animate="visible">
            <div className="contact-map-copy">
              <p className="eyebrow">Visit</p>
              <h3>Find us in Bangalore</h3>
              <p>HSR Layout, Bengaluru, Karnataka, India</p>
            </div>
            <iframe
              title="The Royal Velvet map"
              src="https://www.google.com/maps?q=HSR%20Layout%20Bangalore&output=embed"
              loading="lazy"
            />
          </m.div>

          <LuxuryFooter setActiveSection={setActiveSection} />
        </section>
        )}
      </main>

      {loaded && displaySection === 'home' && currentPopupOffer && offerPopupVisible && !offerPopupDismissed && (
        <div className="offer-popup-wrap" role="dialog" aria-label="Royal Velvet offer">
          <article className="glass-card offer-popup-card">
            <button className="offer-popup-close" type="button" onClick={() => { setOfferPopupVisible(false); setOfferPopupDismissed(true) }} aria-label="Close offer">
              Close
            </button>
            <p className="eyebrow">Exclusive Offer</p>
            <h3>{currentPopupOffer.title}</h3>
            <strong>{currentPopupOffer.discountLabel}</strong>
            <p>{currentPopupOffer.description}</p>
            <small>{currentPopupOffer.note}</small>
            <div className="offer-popup-actions">
              <button className="btn btn-primary" type="button" onClick={() => requestOffer(currentPopupOffer)}>
                Request Offer <FaArrowRight />
              </button>
              <span>{offerPopupIndex + 1} / {activeOffers.length}</span>
            </div>
          </article>
        </div>
      )}

      <a className="floating-contact whatsapp" href={buildWhatsAppUrl()} aria-label="WhatsApp"><FaWhatsapp /></a>
      <a className="floating-contact call" href={`tel:${contactPhoneHref}`} aria-label="Call"><FaPhoneAlt /></a>
      <div className="mobile-bottom-bar" role="navigation" aria-label="Quick consultation actions">
        <a href={`tel:${contactPhoneHref}`}><FaPhoneAlt /> Call</a>
        <a href={buildWhatsAppUrl()}><FaWhatsapp /> WhatsApp</a>
        <button type="button" onClick={() => openBooking()}>Book Consultation</button>
      </div>

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <LuxuryImage src={preview.src || preview.url} rawSrc={preview.src || preview.url} alt={preview.alt} width={1200} height={900} decoding="async" />
        </div>
      )}

      {galleryProjectPreview && (
        <div className="gallery-project-modal" role="dialog" aria-modal="true" aria-label={`${galleryProjectPreview.title} project gallery`} onClick={() => closeGalleryProject()}>
          <m.article
            className="gallery-project-modal-card"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="gallery-project-modal-close" type="button" onClick={() => closeGalleryProject()}>Close</button>
            <div className="gallery-project-modal-head">
              <p className="eyebrow">The Royal Velvet Project Archive</p>
              <h3>{galleryProjectPreview.title}</h3>
              <p>{galleryProjectPreview.description}</p>
              <span>{formatProjectDate(galleryProjectPreview.projectDate)}</span>
            </div>
            <ProjectImageRail project={galleryProjectPreview} modal />
          </m.article>
        </div>
      )}

      <RoyalTransactionOverlay
        open={bookingSubmitting}
        title="Securing your private consultation"
        message="Your celebration brief is being placed safely with The Royal Velvet concierge desk."
      />

      {selectedDestination && (
        <div className="destination-modal" role="dialog" aria-modal="true" aria-label={`${selectedDestination.name} luxury wedding venues`}>
          <m.article
            className="destination-modal-card glass-card"
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <button className="destination-modal-close" type="button" onClick={() => setSelectedDestination(null)} aria-label="Close destination venues">
              Close
            </button>
            <div className="destination-modal-head">
              <p className="eyebrow">Elite Venue Shortlist</p>
              <h3>{selectedDestination.name}</h3>
              <span>Curated Luxury Venue Archive</span>
              <p>
                Palace hotels, landmark resorts, and private celebration addresses suited for luxury weddings,
                destination vows, and high-profile family celebrations.
              </p>
            </div>
            <div className="destination-venue-list">
              {selectedDestination.venues?.map((venue, index) => (
                <article key={venue}>
                  <strong>{String(index + 1).padStart(2, '0')}</strong>
                  <span>{venue}</span>
                </article>
              ))}
            </div>
            <div className="destination-modal-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setSelectedDestination(null)
                  openBooking({
                    eventType: 'Destination Wedding Package',
                    detail: `Destination shortlist: ${selectedDestination.name}`,
                  })
                }}
              >
                Plan This Destination <FaArrowRight />
              </button>
            </div>
          </m.article>
        </div>
      )}
      </>
      )}
    </>
    </LazyMotion>
  )
}

function formatProjectDate(value) {
  if (!value) return 'Private project archive'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Private project archive'
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function ProjectImageRail({ project, eager = false, modal = false }) {
  const images = project.images || []
  const trackRef = useRef(null)
  const [activeImage, setActiveImage] = useState(0)
  const moveRail = (direction) => {
    const track = trackRef.current
    if (!track) return
    const nextImage = Math.min(Math.max(activeImage + direction, 0), images.length - 1)
    track.scrollTo({ left: nextImage * track.clientWidth, behavior: 'smooth' })
    setActiveImage(nextImage)
  }
  const syncActiveImage = () => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setActiveImage(Math.min(Math.round(track.scrollLeft / track.clientWidth), images.length - 1))
  }
  return (
    <div className={`gallery-project-image-rail${modal ? ' is-modal' : ''}`} aria-label={`${project.title} image collection`}>
      <div className="gallery-project-image-track" ref={trackRef} onScroll={modal ? syncActiveImage : undefined}>
        {images.map((image, index) => (
          <figure key={image.id || image.url || index}>
            <LuxuryImage
              src={getOptimizedSupabaseImage(image.url || image.src, modal ? 1280 : 720, modal ? 78 : 72)}
              rawSrc={image.url || image.src}
              alt={image.alt || `${project.title} image ${index + 1}`}
              width={modal ? 1280 : 720}
              height={modal ? 900 : 760}
              loading={eager && index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </figure>
        ))}
      </div>
      {modal && images.length > 1 && (
        <div className="gallery-project-image-controls" aria-label="Project image navigation">
          <button type="button" className="is-previous" onClick={() => moveRail(-1)} aria-label="Previous project image" disabled={activeImage === 0}><FaArrowLeft /></button>
          <button type="button" className="is-next" onClick={() => moveRail(1)} aria-label="Next project image" disabled={activeImage === images.length - 1}><FaArrowRight /></button>
        </div>
      )}
      {images.length > 1 && (
        <span className="gallery-project-image-count">
          {modal ? `${activeImage + 1} / ${images.length}` : `${images.length} images`}
        </span>
      )}
    </div>
  )
}

function LuxuryFooter({ setActiveSection }) {
  return (
    <m.footer className="luxury-footer" variants={staggerGroup} initial="hidden" whileInView="visible" viewport={viewportOnce}>
      <m.div className="footer-brand" variants={revealUp}>
        <div className="footer-logo-panel">
          <img src="/assets/the-royal-velvet-main-logo-web.png" alt="The Royal Velvet logo" width={900} height={900} loading="lazy" decoding="async" />
        </div>
        <strong>The Royal Velvet</strong>
        <img className="footer-tagline-img" src="/assets/effortlessly-lavish-lettering.png" alt="" aria-hidden="true" width={1277} height={237} loading="lazy" decoding="async" />
        <p>Curators of Extraordinary Celebrations for India's Most Distinguished Families & Brands.</p>
      </m.div>

      <m.div variants={revealUp}>
        <h3>Connect</h3>
        <div className="social-links">
          <a href={instagramUrl} aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="Facebook"><FaFacebookF /></a>
          <a href="#" aria-label="YouTube"><FaYoutube /></a>
          <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
        </div>
        <div className="footer-contact-lines">
          <button type="button" onClick={() => setActiveSection('booking')}>{contactDeskLabel}</button>
          <a href={`tel:${contactPhoneHref}`}>{contactPhone}</a>
        </div>
        <p>HSR Layout, Bangalore, India</p>
      </m.div>

      <m.div variants={revealUp}>
        <h3>Navigate</h3>
        <div className="footer-nav">
          {[
            ['home', 'Home'],
            ['about', 'Our Story'],
            ['events', 'Events'],
            ['services', 'Services'],
            ['gallery', 'Gallery'],
            ['artists', 'Artists & Talent'],
            ['milestone', 'Legacy'],
            ['contact', 'Contact'],
            ['booking', 'Book Consultation'],
          ].map(([id, label]) => (
            <a
              key={id}
              href={SECTION_PATHS[id]}
              onClick={(event) => {
                event.preventDefault()
                setActiveSection(id)
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </m.div>

      <m.div variants={revealUp}>
        <h3>Documents</h3>
        <div className="footer-nav">
          <a href="/terms.html">Terms & Conditions</a>
          <a href="/service-brochure.html">Service Brochure</a>
          <a href="/why-choose-us.html">Why Choose Us</a>
          <a href="/faq.html">FAQ</a>
          <a href="/cancellation-policy.html">Cancellation Policy</a>
          <a href="/privacy-policy.html">Privacy Policy</a>
        </div>
      </m.div>

      <m.div className="footer-bottom" variants={revealUp}>
        <span>© {new Date().getFullYear()} The Royal Velvet. All rights reserved.</span>
        <span>Crafted for celebrations that deserve permanence.</span>
      </m.div>
      <m.button className="footer-contact-tab" onClick={() => setActiveSection('contact')} whileHover={{ x: -4 }} whileTap={{ scale: 0.98 }}>Contact Us</m.button>
    </m.footer>
  )
}
