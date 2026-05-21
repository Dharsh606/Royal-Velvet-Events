import { useEffect, useMemo, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import {
  FaArrowRight,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQuoteLeft,
  FaYoutube,
  FaWhatsapp,
} from 'react-icons/fa'
import {
  about,
  bookingEventTypes,
  categoryToEventType,
  counters,
  destinations,
  gallery as defaultGallery,
  artists,
  milestones,
  careers,
  packages,
  reels as defaultReels,
  sectionCopy,
  serviceCategories,
  testimonials as defaultTestimonials,
  timeline,
} from '../data/content'
import {
  fetchGallery,
  fetchHomepage,
  fetchPublishedTestimonials,
  fetchReels,
  isSupabaseConfigured,
  mergeGallery,
  mergeReels,
  submitBooking,
} from '../lib/contentApi'

const brandTitle = 'Royal Velvet Events'
const brandTagline = 'Effortlessly Lavish'
const brandMotto = ['Rare', 'Redefined', 'Royal']
const contactEmail = 'royalvelveteventstudio@gmail.com'
const contactPhone = '+91 98805 41336'
const contactPhoneHref = '+919880541336'
const instagramUrl = 'https://www.instagram.com/royalvelvet_events?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='

export default function PublicSite() {
  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'artists', label: 'Talent' },
    { id: 'milestone', label: 'Our Milestone' },
    { id: 'careers', label: 'Careers' },
    { id: 'booking', label: 'Booking' },
    { id: 'contact', label: 'Contact' },
  ]
  const leftNav = sections.slice(0, 4)
  const centerNav = sections[4]
  const rightNav = sections.slice(5)
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [navHidden, setNavHidden] = useState(false)
  const [liveTestimonials, setLiveTestimonials] = useState(defaultTestimonials)
  const [liveGallery, setLiveGallery] = useState(defaultGallery)
  const [liveReels, setLiveReels] = useState(defaultReels)
  const getPageFromPath = () => window.location.pathname.replace('/', '') || 'home'
  const [activeSection, setActiveSection] = useState(getPageFromPath)
  const [homepage, setHomepage] = useState({
    heroTitle: brandTitle,
    heroSubtitle: brandTagline,
  })
  const emptyForm = {
    name: '',
    phone: '',
    email: '',
    type: '',
    date: '',
    budget: '',
    location: '',
    vision: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [bookingPrefill, setBookingPrefill] = useState(null)

  useEffect(() => {
    AOS.init({ duration: 900, once: true, offset: 80 })
    const timer = setTimeout(() => setLoaded(true), 5000)
    const hydrateContent = async () => {
      const localDraft = localStorage.getItem('rve-homepage')
      if (localDraft) setHomepage(JSON.parse(localDraft))

      if (isSupabaseConfigured) {
        try {
          const [homepageData, testimonialsData, galleryData, reelsData] = await Promise.all([
            fetchHomepage(),
            fetchPublishedTestimonials(),
            fetchGallery(),
            fetchReels(),
          ])
          if (homepageData) setHomepage(homepageData)
          if (testimonialsData?.length) setLiveTestimonials(testimonialsData)
          setLiveGallery(mergeGallery(defaultGallery, galleryData || []))
          setLiveReels(mergeReels(defaultReels, reelsData || []))
          return
        } catch {
          /* fall back to static content */
        }
      }

      const { db, isFirebaseConfigured } = await import('../lib/firebase')
      if (isFirebaseConfigured && db) {
        const { doc, getDoc } = await import('firebase/firestore')
        const snapshot = await getDoc(doc(db, 'site', 'homepage'))
        if (snapshot.exists()) {
          const data = snapshot.data()
          setHomepage({
            heroTitle: data.heroTitle || data.hero_title || brandTitle,
            heroSubtitle: data.heroSubtitle || data.hero_subtitle || brandTagline,
          })
        }
      }
    }
    hydrateContent()
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const currentY = window.scrollY
      setNavHidden(currentY > lastY && currentY > 120)
      lastY = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const nextPath = activeSection === 'home' ? '/' : `/${activeSection}`
    window.history.pushState(null, '', nextPath)
    AOS.refresh()
  }, [activeSection])

  useEffect(() => {
    const handlePopState = () => setActiveSection(getPageFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const ring = document.querySelector('.cursor-ring')
    const dot = document.querySelector('.cursor-dot')
    const move = (event) => {
      ring?.style.setProperty('--x', `${event.clientX}px`)
      ring?.style.setProperty('--y', `${event.clientY}px`)
      dot?.style.setProperty('--x', `${event.clientX}px`)
      dot?.style.setProperty('--y', `${event.clientY}px`)
    }
    const expand = () => document.body.classList.add('cursor-hover')
    const shrink = () => document.body.classList.remove('cursor-hover')
    window.addEventListener('mousemove', move)
    document.querySelectorAll('a, button, input, textarea, select, .gallery-card').forEach((el) => {
      el.addEventListener('mouseenter', expand)
      el.addEventListener('mouseleave', shrink)
    })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const duplicatedReels = useMemo(() => [...liveReels, ...liveReels], [liveReels])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
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
    openBooking({
      eventType: 'Curated Package Inquiry',
      detail: `Package: ${packageName}`,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    try {
      if (isSupabaseConfigured) {
        await submitBooking(form)
      } else {
        const { db, isFirebaseConfigured } = await import('../lib/firebase')
        if (isFirebaseConfigured && db) {
          const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
          await addDoc(collection(db, 'bookings'), { ...form, createdAt: serverTimestamp() })
        } else {
          const existing = JSON.parse(localStorage.getItem('rve-bookings') || '[]')
          localStorage.setItem('rve-bookings', JSON.stringify([{ ...form, createdAt: new Date().toISOString() }, ...existing]))
        }
      }
      setSubmitted(true)
      setBookingPrefill(null)
      setForm(emptyForm)
    } catch (error) {
      setSubmitError(error.message || 'Could not submit your inquiry. Please try again or contact us directly.')
    }
  }

  return (
    <>
      {!loaded && (
        <div className="loader">
          <img className="intro-logo" src="/assets/royal-velvet-logo.jpeg" alt="Royal Velvet Events logo" />
          <div className="loader-frame">
            <i />
            <i />
            <i />
            <i />
            <div className="intro-frame-copy">
              <span>{brandTitle}</span>
              <em>{brandTagline}</em>
            </div>
          </div>
          <div className="intro-motto" aria-label="Rare. Redefined. Royal">
            {brandMotto.map((word) => <strong key={word}>{word}</strong>)}
          </div>
        </div>
      )}

      <div className="cursor-ring" />
      <div className="cursor-dot" />

      <header className={navHidden ? 'site-header nav-hidden' : 'site-header'}>
        <div className="navbar">
          <div className="nav-group nav-left">
            {leftNav.map((item) => (
              <button
                className={activeSection === item.id ? 'active' : ''}
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id)
                  setMenuOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="nav-logo" onClick={() => setActiveSection('home')} aria-label="Royal Velvet Events home">
            <img src="/assets/royal-velvet-logo-transparent.png" alt="Royal Velvet Events logo" />
          </button>
          <div className="nav-group nav-right">
            <button
              className={activeSection === centerNav.id ? 'active' : ''}
              onClick={() => {
                setActiveSection(centerNav.id)
                setMenuOpen(false)
              }}
            >
              {centerNav.label}
            </button>
            {rightNav.map((item) => (
              <button
                className={activeSection === item.id ? 'active' : ''}
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id)
                  setMenuOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
            <span />
            <span />
          </button>
          <nav className={menuOpen ? 'mobile-nav open' : 'mobile-nav'}>
            {sections.map((item) => (
              <button
                className={activeSection === item.id ? 'active' : ''}
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id)
                  setMenuOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {activeSection === 'home' && (
        <>
        <section id="home" className="hero home-stage">
          <video autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80">
            <source src="https://cdn.coverr.co/videos/coverr-a-luxurious-wedding-ceremony-1579/1080p.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay" />
          <div className="particles" />
          <div className="hero-content" data-aos="fade-up">
            <div className="hero-motto" aria-label="Rare. Redefined. Royal">
              {brandMotto.map((word) => <strong key={word}>{word}</strong>)}
            </div>
            <h1 className="hero-brand-title">{homepage.heroTitle || brandTitle}</h1>
            <span className="hero-tagline">{homepage.heroSubtitle || brandTagline}</span>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => openBooking()}>Plan Your Event</button>
              <button className="btn btn-ghost" onClick={() => setActiveSection('services')}>Explore Experiences</button>
            </div>
          </div>
        </section>
        <section id="experience" className="section content-section timeline-section">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.experience.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.experience.title}</h2>
          <p className="section-lead" data-aos="fade-up">{sectionCopy.experience.subtitle}</p>
          <div className="timeline">
            {timeline.map((step, index) => (
              <article key={step} data-aos="fade-up">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step}</h3>
              </article>
            ))}
          </div>
        </section>

        <section id="testimonials" className="section content-section">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.testimonials.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.testimonials.title}</h2>
          <div className="testimonial-grid">
            {liveTestimonials.map((item) => (
              <article className="glass-card testimonial-card" key={item.id || item.name} data-aos="fade-up">
                <FaQuoteLeft />
                <p>{item.quote}</p>
                <footer>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section id="destinations" className="section content-section">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.destinations.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.destinations.title}</h2>
          <div className="destination-grid">
            {destinations.map((item) => (
              <article className="destination-card" key={item.name} data-aos="fade-up">
                <img src={item.image} alt={item.name} loading="lazy" />
                <span>{item.name}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="reels" className="section content-section reels-section">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.reels.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.reels.title}</h2>
          <div className="reel-track">
            {duplicatedReels.map((item, index) => (
              <article
                className={`reel-card${item.url ? ' reel-card-has-media' : ''}`}
                key={`${item.id || item.title}-${index}`}
                style={
                  item.url && !item.isVideo
                    ? {
                        backgroundImage: `linear-gradient(180deg, transparent, rgba(0,0,0,0.9)), url(${item.url})`,
                      }
                    : undefined
                }
              >
                {item.url && item.isVideo ? (
                  <video src={item.url} muted loop playsInline autoPlay />
                ) : null}
                <FaInstagram />
                <span>{item.title}</span>
              </article>
            ))}
          </div>
        </section>
        <LuxuryFooter setActiveSection={setActiveSection} />
        </>
        )}

        {activeSection === 'about' && (
        <section id="about" className="split-section section page-stage">
          <div className="media-panel" data-aos="fade-right" />
          <div className="copy-panel" data-aos="fade-left">
            <p className="eyebrow">About</p>
            <h2>{about.title}</h2>
            <p>{about.text}</p>
            <div className="counter-grid">
              {counters.map((counter) => (
                <article key={counter.label}>
                  <strong>{counter.value}{counter.suffix}</strong>
                  <span>{counter.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
        )}

        {activeSection === 'services' && (
        <section id="services" className="section page-stage services-page">
          <p className="eyebrow" data-aos="fade-up">Services & Packages</p>
          <h2 data-aos="fade-up">Every celebration category — composed under one royal standard.</h2>
          <p className="section-lead" data-aos="fade-up">
            Explore our full service catalogue across weddings, family milestones, corporate events, and beyond.
            Each package bundles the right expertise for a seamless luxury experience.
          </p>

          <div className="packages-block" data-aos="fade-up">
            <div className="packages-heading">
              <p className="eyebrow">Curated Packages</p>
              <h3>Choose a direction. We shape the rest.</h3>
            </div>
            <div className="package-grid">
              {packages.map((pkg) => (
                <article
                  className={pkg.featured ? 'glass-card package-card featured' : 'glass-card package-card'}
                  key={pkg.id}
                  data-aos="fade-up"
                >
                  <span className="package-tier">{pkg.tier}</span>
                  <h3>{pkg.name}</h3>
                  <p className="package-tagline">{pkg.tagline}</p>
                  <ul className="package-highlights">
                    {pkg.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="package-ideal">
                    <strong>Ideal for:</strong> {pkg.idealFor}
                  </p>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => openBookingForPackage(pkg.name)}
                  >
                    Request This Package <FaArrowRight />
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="service-catalog">
            {serviceCategories.map((category) => (
              <div className="service-category" key={category.id} data-aos="fade-up">
                <div className="service-category-head">
                  <span className="service-category-icon" aria-hidden="true">{category.icon}</span>
                  <div>
                    <h3>{category.title}</h3>
                    <p>{category.subtitle}</p>
                  </div>
                </div>
                <div className="service-item-grid">
                  {category.items.map((item) => (
                    <article className="glass-card service-item-card" key={item.title}>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                      <button
                        className="btn btn-ghost service-request-btn"
                        type="button"
                        onClick={() => openBookingForService(category.id, item.title)}
                      >
                        Request This Service <FaArrowRight />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="services-cta glass-card" data-aos="fade-up">
            <p className="eyebrow">Custom Planning</p>
            <h3>Need a bespoke combination?</h3>
            <p>Mix any services across categories — we will build a tailored proposal for your celebration.</p>
            <button className="btn btn-primary" type="button" onClick={() => openBooking({ eventType: 'Other / Custom' })}>
              Plan a Custom Event <FaArrowRight />
            </button>
          </div>
        </section>
        )}

        {activeSection === 'gallery' && (
        <section id="gallery" className="section gallery-section page-stage">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.gallery.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.gallery.title}</h2>
          <div className="masonry">
            {liveGallery.map((item) => (
              <button
                className="gallery-card"
                key={item.id || item.src || item.alt}
                onClick={() => setPreview(item)}
                data-aos="zoom-in"
              >
                <img src={item.src || item.url} alt={item.alt} loading="lazy" />
                <span>{item.alt}</span>
              </button>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'artists' && (
        <section id="artists" className="section page-stage">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.artists.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.artists.title}</h2>
          <div className="artist-grid">
            {artists.map((artist) => (
              <article className="glass-card artist-card" key={artist.name} data-aos="fade-up">
                <span>{artist.role}</span>
                <h3>{artist.name}</h3>
                <p>{artist.feature}</p>
              </article>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'milestone' && (
        <section id="milestone" className="section page-stage">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.milestone.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.milestone.title}</h2>
          <div className="milestone-grid">
            {milestones.map((item) => (
              <article className="glass-card milestone-card" key={item.label} data-aos="fade-up">
                <strong>{item.value}</strong>
                <h3>{item.label}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'careers' && (
        <section id="careers" className="section page-stage">
          <p className="eyebrow" data-aos="fade-up">{sectionCopy.careers.eyebrow}</p>
          <h2 data-aos="fade-up">{sectionCopy.careers.title}</h2>
          <div className="career-grid">
            {careers.map((job) => (
              <article className="glass-card career-card" key={job.title} data-aos="fade-up">
                <div>
                  <span>{job.type}</span>
                  <h3>{job.title}</h3>
                  <p>{job.text}</p>
                </div>
                <strong>{job.location}</strong>
                <a className="btn btn-ghost" href={`mailto:${contactEmail}?subject=Career Application - ${job.title}`}>Apply Now</a>
              </article>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'booking' && (
        <section id="booking" className="section booking-page page-stage">
          <div className="booking-page-hero" data-aos="fade-up">
            <p className="eyebrow">Private Booking</p>
            <h2>Reserve your consultation.</h2>
            <p className="section-lead">
              Share the first contour of your celebration. Our team responds within 24 hours with clarity,
              discretion, and a tailored luxury planning direction.
            </p>
            {bookingPrefill && (
              <div className="booking-prefill-banner glass-card">
                <p className="eyebrow">Your Selection</p>
                <p>
                  {bookingPrefill.detail && <strong>{bookingPrefill.detail}</strong>}
                  {bookingPrefill.detail && bookingPrefill.eventType && <span> · </span>}
                  {bookingPrefill.eventType && <span>{bookingPrefill.eventType}</span>}
                </p>
                <button className="text-button" type="button" onClick={() => { setBookingPrefill(null); setForm((c) => ({ ...c, type: '', vision: '' })) }}>
                  Clear selection
                </button>
              </div>
            )}
          </div>

          <div className="booking-luxury-layout">
            <aside className="booking-intro-panel" data-aos="fade-right">
              <div className="glass-card booking-intro-card">
                <span className="booking-intro-badge">Concierge Inquiry</span>
                <h3>Every royal celebration begins with a single conversation.</h3>
                <p>
                  Whether you are planning a multi-day wedding, a sacred pooja, a baby naming ceremony, or a corporate
                  product launch — we shape the experience around your vision, not a template.
                </p>
                <ol className="booking-steps">
                  <li><span>01</span><div><strong>Share your vision</strong><p>Tell us the event, date, and atmosphere you imagine.</p></div></li>
                  <li><span>02</span><div><strong>Receive a direction</strong><p>We respond with scope, approach, and next steps.</p></div></li>
                  <li><span>03</span><div><strong>Begin planning</strong><p>Your dedicated coordinator guides every detail calmly.</p></div></li>
                </ol>
                <div className="booking-assurance">
                  <span>70+ services</span>
                  <span>8 curated packages</span>
                  <span>End-to-end production</span>
                </div>
                <button className="btn btn-ghost" type="button" onClick={() => setActiveSection('contact')}>
                  Visit Contact Page <FaArrowRight />
                </button>
              </div>
            </aside>

            <form className="glass-card booking-form-luxury" onSubmit={handleSubmit} data-aos="fade-left">
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

                  <div className="form-section-block">
                    <p className="form-step-label"><span>03</span> Your Vision</p>
                    <label className="booking-field full">
                      <span className="booking-field-label">Your Vision</span>
                      <textarea
                        name="vision"
                        placeholder="Describe the atmosphere, rituals, guest count, and anything sacred to your celebration"
                        value={form.vision}
                        onChange={handleChange}
                        required
                      />
                    </label>
                  </div>

                  <button className="btn btn-primary booking-submit" type="submit">
                    Request Private Consultation <FaArrowRight />
                  </button>
                  {submitError && <p className="booking-form-error">{submitError}</p>}
                  <p className="booking-form-note">By submitting, you agree to a discreet review of your inquiry. We never share your details.</p>
                </>
              )}
            </form>
          </div>
        </section>
        )}

        {activeSection === 'contact' && (
        <section id="contact" className="section contact-page-luxury page-stage">
          <div className="contact-page-hero" data-aos="fade-up">
            <p className="eyebrow">Contact</p>
            <h2>We are here when you are ready.</h2>
            <p className="section-lead">
              Reach our concierge team directly for enquiries, collaborations, or a conversation before you book.
            </p>
          </div>

          <div className="contact-cards-grid" data-aos="fade-up">
            <article className="glass-card contact-card-luxury">
              <FaPhoneAlt />
              <h3>Call Us</h3>
              <p>Speak with our team for immediate assistance.</p>
              <a href={`tel:${contactPhoneHref}`}>{contactPhone}</a>
            </article>
            <article className="glass-card contact-card-luxury">
              <FaWhatsapp />
              <h3>WhatsApp</h3>
              <p>Quick messages for availability and event queries.</p>
              <a href={`https://wa.me/${contactPhoneHref.replace('+', '')}`}>Chat on WhatsApp</a>
            </article>
            <article className="glass-card contact-card-luxury">
              <FaEnvelope />
              <h3>Email</h3>
              <p>For detailed proposals, partnerships, and documentation.</p>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </article>
            <article className="glass-card contact-card-luxury">
              <FaMapMarkerAlt />
              <h3>Studio</h3>
              <p>HSR Layout, Bangalore — serving luxury celebrations across India.</p>
              <span>Mon – Sat · 10:00 AM – 7:00 PM</span>
            </article>
          </div>

          <div className="contact-connect-panel glass-card" data-aos="fade-up">
            <div>
              <p className="eyebrow">Connect</p>
              <h3>Royal Velvet Events</h3>
              <span className="contact-tagline">Effortlessly Lavish</span>
              <p>Follow our latest celebrations, behind-the-scenes moments, and destination work.</p>
              <div className="social-links contact-social">
                <a href={instagramUrl} aria-label="Instagram"><FaInstagram /></a>
                <a href="#" aria-label="Facebook"><FaFacebookF /></a>
                <a href="#" aria-label="YouTube"><FaYoutube /></a>
                <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
              </div>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => openBooking()}>
              Start Your Booking <FaArrowRight />
            </button>
          </div>

          <div className="contact-map-panel glass-card" data-aos="fade-up">
            <div className="contact-map-copy">
              <p className="eyebrow">Visit</p>
              <h3>Find us in Bangalore</h3>
              <p>HSR Layout, Bengaluru, Karnataka, India</p>
            </div>
            <iframe
              title="Royal Velvet Events map"
              src="https://www.google.com/maps?q=HSR%20Layout%20Bangalore&output=embed"
              loading="lazy"
            />
          </div>

          <LuxuryFooter setActiveSection={setActiveSection} />
        </section>
        )}
      </main>

      <a className="floating-contact whatsapp" href={`https://wa.me/${contactPhoneHref.replace('+', '')}`} aria-label="WhatsApp"><FaWhatsapp /></a>
      <a className="floating-contact call" href={`tel:${contactPhoneHref}`} aria-label="Call"><FaPhoneAlt /></a>

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <img src={preview.src || preview.url} alt={preview.alt} />
        </div>
      )}
    </>
  )
}

function LuxuryFooter({ setActiveSection }) {
  return (
    <footer className="luxury-footer">
      <div className="footer-brand">
        <div className="footer-logo-panel">
          <img src="/assets/royal-velvet-logo-transparent.png" alt="Royal Velvet Events logo" />
        </div>
        <strong>Royal Velvet Events</strong>
        <span>Effortlessly Lavish</span>
        <p>Weddings, baby showers, corporate events, traditional poojas, and full production across India.</p>
      </div>

      <div>
        <h3>Connect</h3>
        <div className="social-links">
          <a href={instagramUrl} aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="Facebook"><FaFacebookF /></a>
          <a href="#" aria-label="YouTube"><FaYoutube /></a>
          <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
        </div>
        <div className="footer-contact-lines">
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          <a href={`tel:${contactPhoneHref}`}>{contactPhone}</a>
        </div>
        <p>HSR Layout, Bangalore, India</p>
      </div>

      <div>
        <h3>Navigate</h3>
        <div className="footer-nav">
          {[
            ['home', 'Home'],
            ['about', 'About'],
            ['services', 'Services'],
            ['gallery', 'Gallery'],
            ['artists', 'Talent'],
            ['milestone', 'Our Milestone'],
            ['careers', 'Careers'],
            ['booking', 'Booking'],
            ['contact', 'Contact'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setActiveSection(id)}>{label}</button>
          ))}
        </div>
      </div>

      <div>
        <h3>Documents</h3>
        <div className="footer-nav">
          <a href="/terms.html">Terms & Conditions</a>
          <a href="/service-brochure.html">Service Brochure</a>
          <a href="/cancellation-policy.html">Cancellation Policy</a>
          <a href="/privacy-policy.html">Privacy Policy</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Royal Velvet Events. All rights reserved.</span>
        <span>Crafted for celebrations that deserve permanence.</span>
      </div>
      <button className="footer-contact-tab" onClick={() => setActiveSection('contact')}>Contact Us</button>
    </footer>
  )
}

