import { useCallback, useEffect, useState } from 'react'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCloudUploadAlt,
  FaCrown,
  FaEnvelope,
  FaImages,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQuoteLeft,
  FaSignOutAlt,
  FaTrash,
  FaVideo,
} from 'react-icons/fa'
import { packages, serviceCategories } from '../data/content'
import {
  deleteRow,
  fetchAdminContent,
  insertTestimonial,
  isSupabaseConfigured,
  saveHomepageSettings,
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
  { id: 'settings', label: 'Homepage' },
]

const brandMotto = ['Rare', 'Redefined', 'Royal']

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
  const [mode, setMode] = useState('login')
  const [activeTab, setActiveTab] = useState('overview')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [content, setContent] = useState(emptyContent)
  const [testimonial, setTestimonial] = useState({ name: '', role: '', quote: '', city: '', image: '' })
  const [homepage, setHomepage] = useState({
    heroTitle: 'Royal Velvet Events',
    heroSubtitle: 'Weddings • Family Milestones • Corporate • Poojas • 70+ Services',
  })
  const [status, setStatus] = useState('')
  const [authError, setAuthError] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

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
        if (data.homepage) setHomepage(data.homepage)
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

  const localUpload = (file, bucket) => {
    const url = URL.createObjectURL(file)
    setContent((current) => ({
      ...current,
      [bucket]: [{ id: crypto.randomUUID(), url, name: file.name }, ...current[bucket]],
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
    if (!isSupabaseConfigured || !supabase) {
      setUser({ email: credentials.email || 'demo@royalvelvet.local' })
      return
    }
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
        })
        if (error) throw error
        setStatus('Account created. Check your email if confirmation is enabled, then sign in.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
        if (error) throw error
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.')
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
      setTestimonial({ name: '', role: '', quote: '', city: '', image: '' })
    } catch (error) {
      setStatus(error.message || 'Could not publish testimonial.')
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

  const saveHomepage = async (event) => {
    event.preventDefault()
    setStatus('')
    try {
      localStorage.setItem('rve-homepage', JSON.stringify(homepage))
      if (isSupabaseConfigured && supabase) {
        await saveHomepageSettings(homepage)
      }
      setStatus('Homepage content saved.')
    } catch (error) {
      setStatus(error.message || 'Could not save homepage.')
    }
  }

  const signOutAdmin = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    window.location.href = '/'
  }

  const metrics = [
    { label: 'New Inquiries', value: content.bookings.length, icon: <FaCalendarAlt />, hint: 'Private consultations' },
    { label: 'Gallery Assets', value: content.gallery.length, icon: <FaImages />, hint: 'Live on website when uploaded' },
    { label: 'Reels & Media', value: content.reels.length, icon: <FaVideo />, hint: 'Homepage reel marquee' },
    { label: 'Testimonials', value: content.testimonials.length, icon: <FaQuoteLeft />, hint: 'Published client stories' },
  ]

  const analytics = [
    ['Lead Response Readiness', 92],
    ['Content Completeness', Math.min(100, 35 + content.gallery.length * 8 + content.testimonials.length * 12)],
    ['Media Library Strength', Math.min(100, content.gallery.length * 12 + content.reels.length * 16)],
  ]

  if (!user) {
    return (
      <main className="admin-shell admin-auth-page">
        <div className="admin-auth-backdrop" />
        <section className="admin-auth-card glass-card">
          <div className="admin-auth-brand">
            <img src="/assets/royal-velvet-logo-transparent.png" alt="Royal Velvet Events" />
            <p className="eyebrow">Admin Portal</p>
            <h1>Royal Velvet Events</h1>
            <span className="admin-auth-tagline">Effortlessly Lavish</span>
            <div className="admin-auth-motto">
              {brandMotto.map((word) => (
                <strong key={word}>{word}</strong>
              ))}
            </div>
          </div>

          <form className="admin-auth-form" onSubmit={handleAuth}>
            <h2>{mode === 'login' ? 'Secure Concierge Login' : 'Create Admin Access'}</h2>
            <p>Manage bookings, gallery, testimonials, reels, and homepage content.</p>
            {!isSupabaseConfigured && <small className="admin-warn">Supabase is not configured — demo mode only.</small>}

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
              <FaCrown /> {mode === 'login' ? 'Enter Dashboard' : 'Create Account'}
            </button>
            {authError && <small className="admin-error">{authError}</small>}
            <button className="text-button" type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Need an admin account?' : 'Already have access?'}
            </button>
          </form>

          <a className="admin-back-link" href="/">
            <FaArrowLeft /> Back to website
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-shell admin-dashboard">
      <div className="admin-backdrop" />

      <header className="admin-topbar glass-card">
        <div className="admin-topbar-brand">
          <img src="/assets/royal-velvet-logo-transparent.png" alt="Royal Velvet Events" />
          <div>
            <p className="eyebrow">Concierge Dashboard</p>
            <h1>Royal Velvet Events</h1>
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
                <p className="eyebrow">Service Catalogue</p>
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

            <article
              className="glass-card admin-card upload-zone admin-upload-card"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, 'reels')}
            >
              <FaCloudUploadAlt />
              <p className="eyebrow">Reels</p>
              <h3>Upload reels & videos</h3>
              <p>Motion content for the homepage reel marquee.</p>
              <label className="btn btn-primary admin-file-btn">
                Choose Media
                <input type="file" accept="video/*,image/*" hidden onChange={(event) => handleFile(event, 'reels')} />
              </label>
            </article>
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
              {content.reels.length === 0 && <p className="admin-empty">No reels uploaded yet.</p>}
              {content.reels.map((item) => (
                <div className="admin-reel-item" key={item.id}>
                  <FaVideo />
                  <div>
                    <strong>{item.title || item.name}</strong>
                    <small>{item.url}</small>
                  </div>
                  <button type="button" onClick={() => removeItem('reels', item.id)}>
                    <FaTrash />
                  </button>
                </div>
              ))}
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
                <span>Image URL</span>
                <input value={testimonial.image} onChange={(e) => setTestimonial({ ...testimonial, image: e.target.value })} />
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
                  {item.image && <img src={item.image} alt={item.name} />}
                  <div>
                    <strong>{item.name}</strong>
                    <span>{[item.city, item.role].filter(Boolean).join(' • ')}</span>
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

      {activeTab === 'settings' && (
        <form className="glass-card admin-card admin-settings-form" onSubmit={saveHomepage}>
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Homepage</p>
              <h2>Hero content</h2>
              <p>Updates the main hero title and tagline on the public website.</p>
            </div>
          </div>
          <label>
            <span>Hero Title</span>
            <input value={homepage.heroTitle} onChange={(e) => setHomepage({ ...homepage, heroTitle: e.target.value })} />
          </label>
          <label>
            <span>Hero Subtitle</span>
            <input value={homepage.heroSubtitle} onChange={(e) => setHomepage({ ...homepage, heroSubtitle: e.target.value })} />
          </label>
          <div className="admin-hero-preview glass-card">
            <p className="eyebrow">Preview</p>
            <h3>{homepage.heroTitle}</h3>
            <span>{homepage.heroSubtitle}</span>
          </div>
          <button className="btn btn-primary" type="submit">Save Homepage</button>
        </form>
      )}
    </main>
  )
}

function BookingCard({ item, onDelete }) {
  return (
    <article className="glass-card admin-booking-card">
      <div className="admin-booking-head">
        <span className={`admin-status-pill status-${(item.status || 'new').toLowerCase()}`}>{item.status || 'new'}</span>
        <time>{formatDate(item.created_at)}</time>
      </div>
      <h3>{item.name}</h3>
      <p className="admin-booking-type">{item.type}</p>
      <dl className="admin-booking-meta">
        <div>
          <FaEnvelope />
          <span>{item.email}</span>
        </div>
        <div>
          <FaPhoneAlt />
          <span>{item.phone}</span>
        </div>
        <div>
          <FaCalendarAlt />
          <span>{item.date ? formatDate(item.date) : 'Date TBC'}</span>
        </div>
        <div>
          <FaMapMarkerAlt />
          <span>{item.location || '—'}</span>
        </div>
      </dl>
      <p className="admin-booking-budget"><strong>Budget:</strong> {item.budget || '—'}</p>
      <p className="admin-booking-vision">{item.vision}</p>
      <button className="admin-delete-btn" type="button" onClick={onDelete}>
        <FaTrash /> Remove
      </button>
    </article>
  )
}
