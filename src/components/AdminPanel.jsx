import { useCallback, useEffect, useRef, useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCloudUploadAlt,
  FaCrown,
  FaEnvelope,
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
import { defaultOfferSettings, packages, serviceCategories } from '../data/content'
import {
  deleteRow,
  fetchAdminContent,
  insertReel,
  insertTestimonial,
  isSupabaseConfigured,
  saveMembershipSettings,
  uploadMedia,
} from '../lib/contentApi'
import { supabase } from '../lib/supabase'

const emptyContent = {
  gallery: [],
  testimonials: [],
  bookings: [],
  reels: [],
}

const adminTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'media', label: 'Media' },
  { id: 'stories', label: 'Stories' },
  { id: 'offers', label: 'Offers' },
]

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
  const [offers, setOffers] = useState(defaultOfferSettings)
  const [status, setStatus] = useState('')
  const [authError, setAuthError] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const inactivityTimer = useRef(null)

  const totalServices = serviceCategories.reduce((sum, cat) => sum + cat.items.length, 0)

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
        })
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

  const localUpload = (file, bucket) => {
    const url = URL.createObjectURL(file)
    const entry =
      bucket === 'gallery'
        ? { id: crypto.randomUUID(), url, name: file.name, alt: file.name }
        : { id: crypto.randomUUID(), url, name: file.name, title: file.name }
    setContent((current) => ({
      ...current,
      [bucket]: [entry, ...current[bucket]],
    }))
  }

  const handleFile = async (event, bucket) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('')
    try {
      if (isSupabaseConfigured && supabase) {
        await uploadMedia(bucket, file)
        await loadContent()
        setPreview(null)
        setStatus(`${bucket === 'gallery' ? 'Photo' : 'Reel'} uploaded successfully.`)
        setActiveTab('media')
      } else {
        localUpload(file, bucket)
      }
    } catch (error) {
      setStatus(error.message || 'Upload failed.')
    }
  }

  const handleDrop = async (event, bucket) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    await handleFile({ target: { files: [file] } }, bucket)
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
      setStatus(result?.remote ? 'Offers saved and published.' : 'Offers saved locally. Supabase will publish globally when membership_settings is available.')
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
                    <small>{category.items.length} services</small>
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
                <BookingCard key={item.id} item={item} onDelete={() => removeItem('bookings', item.id)} />
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
              <BookingCard key={item.id} item={item} onDelete={() => removeItem('bookings', item.id)} />
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
              <h3>Upload event photos</h3>
              <p>Weddings, poojas, corporate nights, baby showers — published on the Gallery page.</p>
              <label className="btn btn-primary admin-file-btn">
                Choose Photo
                <input type="file" accept="image/*" hidden onChange={(event) => handleFile(event, 'gallery')} />
              </label>
              {preview && <img src={preview} alt="Preview" className="admin-upload-preview" />}
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
              {reelDraft.coverFile && <small className="admin-selected-file">Cover selected: {reelDraft.coverFile.name}</small>}
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
                <article className="admin-media-card" key={item.id}>
                  {item.url && <img src={item.url} alt={item.alt || item.name} />}
                  <div>
                    <strong>{item.alt || item.name}</strong>
                    <button type="button" onClick={() => removeItem('gallery', item.id)} aria-label="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </article>
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
                      <strong>{item.title || item.name}</strong>
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

function BookingCard({ item, onDelete }) {
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
          <span className={`admin-status-pill status-${(item.status || 'new').toLowerCase()}`}>{item.status || 'new'}</span>
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
      <div className="admin-booking-actions">
        {item.phone && <a className="btn btn-primary" href={`tel:${item.phone}`}><FaPhoneAlt /> Call</a>}
        {whatsappNumber && <a className="btn btn-ghost" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}
        {item.email && <a className="btn btn-ghost" href={`mailto:${item.email}`}><FaEnvelope /> Email</a>}
      </div>
    </article>
  )
}
