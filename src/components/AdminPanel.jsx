import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
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
} from 'react-icons/fa'
import { counters, defaultOfferSettings, founder, packages, serviceCategories } from '../data/content'
import {
  cleanDisplayName,
  deleteRow,
  fetchAdminContent,
  insertService,
  insertReel,
  insertTestimonial,
  isSupabaseConfigured,
  saveMembershipSettings,
  saveStorySettings,
  updateBooking,
  updateGalleryItem,
  uploadMedia,
  uploadStoryImage,
} from '../lib/contentApi'
import { supabase } from '../lib/supabase'

const emptyContent = {
  gallery: [],
  testimonials: [],
  bookings: [],
  reels: [],
  services: [],
  story: null,
}

const adminTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'media', label: 'Media' },
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
  hidden: { opacity: 0, y: 28, scale: 0.975, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
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
  const inactivityTimer = useRef(null)
  const galleryDraftsRef = useRef([])

  const totalServices =
    serviceCategories.reduce((sum, cat) => sum + cat.items.length, 0) +
    content.services.filter((item) => item.isPublished !== false).length

  const loadContent = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return
    setLoading(true)
    try {
      const data = await fetchAdminContent()
      if (data) {
        setContent({
          bookings: data.bookings,
          gallery: data.gallery,
          testimonials: data.testimonials,
          reels: data.reels,
          services: data.services || [],
          story: data.story || null,
        })
        if (data.story) setStoryDraft(data.story)
        if (data.membership?.length) setOffers(data.membership)
      }
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
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
    }
  }, [])

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
    if (!galleryDrafts.length) {
      setStatus('Please choose gallery photos before publishing.')
      return
    }
    setStatus('')
    try {
      if (isSupabaseConfigured && supabase) {
        for (const draft of galleryDrafts) {
          await uploadMedia('gallery', draft.file, draft.title, {
            sortOrder: draft.sortOrder,
            isFeatured: draft.isFeatured,
          })
        }
        await loadContent()
      } else {
        galleryDrafts.forEach((draft) => localUpload(draft.file, 'gallery', draft.title))
      }
      galleryDrafts.forEach((draft) => draft.previewUrl && URL.revokeObjectURL(draft.previewUrl))
      setGalleryDrafts([])
      setStatus(`${galleryDrafts.length} gallery image${galleryDrafts.length > 1 ? 's' : ''} published successfully.`)
      setActiveTab('media')
    } catch (error) {
      setStatus(error.message || 'Gallery publish failed.')
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

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      })
      if (error) throw error
    } catch (error) {
      setAuthError('Invalid admin credentials. Access is restricted to the approved admin account.')
    }
  }

  const addTestimonial = async (event) => {
    event.preventDefault()
    setStatus('')
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
    }
  }

  const addReel = async (event) => {
    event.preventDefault()
    setStatus('')
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
    }
  }

  const addService = async (event) => {
    event.preventDefault()
    setStatus('')
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
    }
  }

  const removeItem = async (table, id) => {
    setStatus('')
    try {
      if (isSupabaseConfigured && supabase) {
        await deleteRow(table, id)
        await loadContent()
        setStatus('Item removed.')
      } else {
        setContent((current) => ({ ...current, [table]: current[table].filter((item) => item.id !== id) }))
      }
    } catch (error) {
      setStatus(error.message || 'Could not delete item.')
    }
  }

  const saveBookingDetails = async (id, changes) => {
    setStatus('')
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
    }
  }

  const saveGalleryDetails = async (id, changes) => {
    setStatus('')
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

  const metrics = [
    { label: 'New Inquiries', value: content.bookings.length, icon: <FaCalendarAlt />, hint: 'Private consultations' },
    { label: 'Gallery Assets', value: content.gallery.length, icon: <FaImages />, hint: 'Live on website when uploaded' },
    { label: 'Instagram Reels', value: content.reels.length, icon: <FaVideo />, hint: 'Cover cards linking to Instagram' },
    { label: 'Testimonials', value: content.testimonials.length, icon: <FaQuoteLeft />, hint: 'Published client stories' },
  ]

  const analytics = [
    ['Lead Response Readiness', 92],
    ['Content Completeness', Math.min(100, 35 + content.gallery.length * 8 + content.testimonials.length * 12)],
    ['Media Library Strength', Math.min(100, content.gallery.length * 12 + content.reels.length * 16)],
  ]

  const categoryLabelById = useMemo(
    () => Object.fromEntries(serviceCategories.map((category) => [category.id, category.title.replace(' Services', '')])),
    [],
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
      <m.main className="admin-shell admin-dashboard" initial="hidden" animate="visible" variants={adminSoft}>
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

      <section className="admin-hero glass-card">
        <div>
          <p className="eyebrow">Executive Overview</p>
          <h2>Your celebration command centre.</h2>
          <p>
            {totalServices} services across {serviceCategories.length} categories · {packages.length} curated packages ·
            All India luxury events
          </p>
        </div>
        <div className="admin-hero-stats">
          <article>
            <strong>{totalServices}+</strong>
            <span>Services</span>
          </article>
          <article>
            <strong>{serviceCategories.length}</strong>
            <span>Categories</span>
          </article>
          <article>
            <strong>{packages.length}</strong>
            <span>Packages</span>
          </article>
        </div>
      </section>

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

      <section className="metric-grid admin-metrics">
        {metrics.map((metric) => (
          <article className="glass-card metric-card admin-metric-card" key={metric.label}>
            <span className="admin-metric-icon">{metric.icon}</span>
            <strong>{metric.value}</strong>
            <small>{metric.label}</small>
            <p>{metric.hint}</p>
          </article>
        ))}
      </section>

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
                <BookingCard key={item.id} item={item} onDelete={() => removeItem('bookings', item.id)} onUpdate={saveBookingDetails} />
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
              <p>All submissions from the luxury booking form on your website.</p>
            </div>
            <span className="admin-count-pill">{content.bookings.length} total</span>
          </div>
          <div className="admin-booking-grid">
            {content.bookings.length === 0 && <p className="admin-empty glass-card">No booking inquiries yet.</p>}
            {content.bookings.map((item) => (
              <BookingCard key={item.id} item={item} onDelete={() => removeItem('bookings', item.id)} onUpdate={saveBookingDetails} />
            ))}
          </div>
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
              <p className="eyebrow">Gallery</p>
              <h3>Curate gallery photos</h3>
              <p>Select multiple photos, refine each image name, then publish them together to the public Gallery.</p>
              <label className="btn btn-primary admin-file-btn">
                Choose Photos
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
                        <img src={draft.previewUrl} alt={draft.title || 'Gallery draft'} />
                        <label>
                          <span>Image Name</span>
                          <input
                            value={draft.title}
                            onChange={(event) => updateGalleryDraft(draft.id, { title: event.target.value })}
                            placeholder="Luxury wedding entrance"
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
                        <label className="admin-checkbox-row compact">
                          <input
                            type="checkbox"
                            checked={draft.isFeatured}
                            onChange={(event) => updateGalleryDraft(draft.id, { isFeatured: event.target.checked })}
                          />
                          <span>Featured</span>
                        </label>
                        <button type="button" onClick={() => removeGalleryDraft(draft.id)} aria-label="Remove draft image">
                          <FaTrash />
                        </button>
                      </article>
                    ))}
                  </div>
                  <button className="btn btn-primary" type="button" onClick={publishGalleryDrafts}>
                    Publish Images
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
                <p className="eyebrow">Gallery Library</p>
                <h2>{content.gallery.length} assets</h2>
              </div>
            </div>
            <div className="admin-media-grid">
              {content.gallery.length === 0 && <p className="admin-empty">No gallery photos yet.</p>}
              {content.gallery.map((item) => (
                <GalleryAdminCard
                  key={item.id}
                  item={item}
                  onSave={saveGalleryDetails}
                  onDelete={() => removeItem('gallery', item.id)}
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
                        <img src={item.url} alt={item.title || item.name} />
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
                  <div className="admin-story-rating" aria-label={`${item.rating || 5} star rating`}>
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

function BookingCard({ item, onDelete, onUpdate }) {
  const [draft, setDraft] = useState({
    status: normalizeBookingStatus(item.status),
    adminNotes: item.admin_notes || item.adminNotes || '',
    followUpDate: item.follow_up_date || item.followUpDate || '',
    proposalTier: item.proposal_tier || item.proposalTier || 'Bespoke',
    estimatedQuoteRange: item.estimated_quote_range || item.estimatedQuoteRange || item.budget || '',
    proposalNotes: item.proposal_notes || item.proposalNotes || '',
    nextAction: item.next_action || item.nextAction || '',
    advanceStatus: item.advance_status || item.advanceStatus || 'Pending',
  })
  const vision = item.vision || ''
  const [mainVision, ...extraBlocks] = vision.split(/\n{2,}/).filter(Boolean)
  const whatsappNumber = String(item.phone || '').replace(/\D/g, '')
  return (
    <article className="glass-card admin-booking-card">
      <div className="admin-booking-crest">
        <FaCrown />
        <span>Royal Inquiry</span>
      </div>
      <div className="admin-booking-head">
        <div>
          <span className={`admin-status-pill status-${statusClass(draft.status)}`}>{titleCase(draft.status)}</span>
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
      <div className="admin-booking-brief">
        <p className="eyebrow">Vision Brief</p>
        <p>{mainVision || 'No vision description added yet.'}</p>
        {extraBlocks.length > 0 && (
          <div className="admin-booking-extras">
            {extraBlocks.map((block) => (
              <span key={block}>{block}</span>
            ))}
          </div>
        )}
      </div>
      <div className="admin-booking-control-panel">
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
        <label className="full">
          <span>Royal Proposal Notes</span>
          <textarea value={draft.proposalNotes} onChange={(event) => setDraft((current) => ({ ...current, proposalNotes: event.target.value }))} placeholder="Proposal tier, inclusions, quote direction, client refinement, approval conditions." />
        </label>
        <label className="full">
          <span>Private Admin Notes</span>
          <textarea value={draft.adminNotes} onChange={(event) => setDraft((current) => ({ ...current, adminNotes: event.target.value }))} placeholder="Add private team notes, preferences, follow-up context, or proposal direction." />
        </label>
        <button className="btn btn-primary" type="button" onClick={() => onUpdate?.(item.id, draft)}>
          Save Pipeline
        </button>
      </div>
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
    </article>
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
      {item.url && <img src={item.url} alt={draft.name} />}
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


