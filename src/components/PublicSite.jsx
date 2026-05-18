import { useEffect, useMemo, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import {
  FaArrowRight,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPhoneAlt,
  FaQuoteLeft,
  FaYoutube,
  FaWhatsapp,
} from 'react-icons/fa'
import {
  destinations,
  gallery,
  artists,
  milestones,
  careers,
  reels,
  services,
  testimonials,
  timeline,
} from '../data/content'

const counters = [
  { value: 150, suffix: '+', label: 'Events' },
  { value: 50, suffix: '+', label: 'Luxury Weddings' },
  { value: 100, suffix: '%', label: 'Client Satisfaction' },
  { value: 10, suffix: '+', label: 'Destination Events' },
]

const brandTitle = 'Royal Velvet Events'
const brandTagline = 'Effortlessly Lavish'
const brandMotto = ['Rare', 'Redefined', 'Royal']
const contactEmail = 'royalvelveteventstudio@gmail.com'
const contactPhone = '+91 6382546285'
const contactPhoneHref = '+916382546285'
const instagramUrl = 'https://www.instagram.com/royalvelvet_events?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='

export default function PublicSite() {
  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'artists', label: 'Artists' },
    { id: 'milestone', label: 'Our Milestone' },
    { id: 'careers', label: 'Careers' },
    { id: 'contact', label: 'Booking & Contact' },
  ]
  const leftNav = sections.slice(0, 4)
  const centerNav = sections[4]
  const rightNav = sections.slice(5)
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const getPageFromPath = () => window.location.pathname.replace('/', '') || 'home'
  const [activeSection, setActiveSection] = useState(getPageFromPath)
  const [homepage, setHomepage] = useState({
    heroTitle: brandTitle,
    heroSubtitle: brandTagline,
  })
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: '',
    date: '',
    budget: '',
    location: '',
    vision: '',
  })

  useEffect(() => {
    AOS.init({ duration: 900, once: true, offset: 80 })
    const timer = setTimeout(() => setLoaded(true), 5000)
    const hydrateHomepage = async () => {
      const localDraft = localStorage.getItem('rve-homepage')
      if (localDraft) setHomepage(JSON.parse(localDraft))
      const { db, isFirebaseConfigured } = await import('../lib/firebase')
      if (isFirebaseConfigured && db) {
        const { doc, getDoc } = await import('firebase/firestore')
        const snapshot = await getDoc(doc(db, 'site', 'homepage'))
        if (snapshot.exists()) setHomepage(snapshot.data())
      }
    }
    hydrateHomepage()
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

  const duplicatedReels = useMemo(() => [...reels, ...reels], [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const { db, isFirebaseConfigured } = await import('../lib/firebase')
    if (isFirebaseConfigured && db) {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
      await addDoc(collection(db, 'bookings'), { ...form, createdAt: serverTimestamp() })
    } else {
      const existing = JSON.parse(localStorage.getItem('rve-bookings') || '[]')
      localStorage.setItem('rve-bookings', JSON.stringify([{ ...form, createdAt: new Date().toISOString() }, ...existing]))
    }
    setSubmitted(true)
    setForm({ name: '', phone: '', email: '', type: '', date: '', budget: '', location: '', vision: '' })
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
            <h1 className="hero-brand-title">{brandTitle}</h1>
            <span className="hero-tagline">{brandTagline}</span>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => setActiveSection('contact')}>Plan Your Event</button>
              <button className="btn btn-ghost" onClick={() => setActiveSection('services')}>Explore Experiences</button>
            </div>
          </div>
        </section>
        <section id="experience" className="section content-section timeline-section">
          <p className="eyebrow" data-aos="fade-up">The Experience</p>
          <h2 data-aos="fade-up">A calm process behind the spectacle.</h2>
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
          <p className="eyebrow" data-aos="fade-up">Testimonials</p>
          <h2 data-aos="fade-up">The finest compliment is disbelief.</h2>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <article className="glass-card testimonial-card" key={item.name} data-aos="fade-up">
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
          <p className="eyebrow" data-aos="fade-up">Destinations</p>
          <h2 data-aos="fade-up">Celebrations across South India’s most distinctive settings.</h2>
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
          <p className="eyebrow" data-aos="fade-up">Instagram Reels</p>
          <h2 data-aos="fade-up">Motion studies from recent nights.</h2>
          <div className="reel-track">
            {duplicatedReels.map((item, index) => (
              <article className="reel-card" key={`${item}-${index}`}>
                <FaInstagram />
                <span>{item}</span>
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
            <h2>Where ceremony becomes cinema.</h2>
            <p>
              Royal Velvet Events designs layered celebrations for clients who want elegance without friction:
              intimate planning, precise production, and rooms that unfold like a story.
            </p>
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
        <section id="services" className="section page-stage">
          <p className="eyebrow" data-aos="fade-up">Services</p>
          <h2 data-aos="fade-up">Curated for grand entrances and quiet perfection.</h2>
          <div className="card-grid">
            {services.map((service) => (
              <article className="glass-card service-card" key={service.title} data-aos="fade-up">
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'gallery' && (
        <section id="gallery" className="section gallery-section page-stage">
          <p className="eyebrow" data-aos="fade-up">Gallery</p>
          <h2 data-aos="fade-up">Rooms that linger after the night ends.</h2>
          <div className="masonry">
            {gallery.map((item) => (
              <button className="gallery-card" key={item.alt} onClick={() => setPreview(item)} data-aos="zoom-in">
                <img src={item.src} alt={item.alt} loading="lazy" />
                <span>{item.alt}</span>
              </button>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'artists' && (
        <section id="artists" className="section page-stage">
          <p className="eyebrow" data-aos="fade-up">Artists</p>
          <h2 data-aos="fade-up">Curated talent for ceremonies, receptions, and elite private nights.</h2>
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
          <p className="eyebrow" data-aos="fade-up">Our Milestone</p>
          <h2 data-aos="fade-up">Built through trust, detail, and South India-first execution.</h2>
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
          <p className="eyebrow" data-aos="fade-up">Careers</p>
          <h2 data-aos="fade-up">Join the team building South India’s next luxury event house.</h2>
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

        {activeSection === 'contact' && (
        <section id="contact" className="section contact-page page-stage">
          <div className="contact-hero" data-aos="fade-up">
            <p className="eyebrow">Booking & Contact</p>
            <h2>Begin with the feeling you want guests to remember.</h2>
            <p>Share the first contour of your celebration. We will respond with clarity, discretion, and a luxury planning direction.</p>
          </div>

          <div className="booking-contact-grid">
          <form className="glass-card booking-form" onSubmit={handleSubmit} data-aos="fade-left">
            <h3>Request a Private Consultation</h3>
            {[
              ['name', 'Full Name', 'text'],
              ['phone', 'Phone Number', 'tel'],
              ['email', 'Email', 'email'],
              ['type', 'Event Type', 'text'],
              ['date', 'Event Date', 'date'],
              ['budget', 'Budget Range', 'text'],
              ['location', 'Location', 'text'],
            ].map(([name, label, type]) => (
              <label key={name}>
                <input name={name} type={type} placeholder=" " value={form[name]} onChange={handleChange} required />
                <span className={type === 'date' ? 'date-label' : ''}>{label}</span>
              </label>
            ))}
            <label className="full">
              <textarea name="vision" placeholder=" " value={form.vision} onChange={handleChange} required />
              <span>Vision Description</span>
            </label>
            <button className="btn btn-primary" type="submit">
              Submit Inquiry <FaArrowRight />
            </button>
            {submitted && <small>Your inquiry has been received with care.</small>}
          </form>

          <div className="contact-details glass-card" data-aos="fade-up">
            <div>
              <strong>Royal Velvet Events</strong>
              <span>Effortlessly Lavish</span>
            </div>
            <div className="footer-links">
              <a href={`tel:${contactPhoneHref}`}><FaPhoneAlt /> {contactPhone}</a>
              <a href={`https://wa.me/${contactPhoneHref.replace('+', '')}`}><FaWhatsapp /> WhatsApp</a>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </div>
            <iframe
              title="Royal Velvet Events map"
              src="https://www.google.com/maps?q=HSR%20Layout%20Bangalore&output=embed"
              loading="lazy"
            />
          </div>
          </div>
          <LuxuryFooter setActiveSection={setActiveSection} />
        </section>
        )}
      </main>

      <a className="floating-contact whatsapp" href={`https://wa.me/${contactPhoneHref.replace('+', '')}`} aria-label="WhatsApp"><FaWhatsapp /></a>
      <a className="floating-contact call" href={`tel:${contactPhoneHref}`} aria-label="Call"><FaPhoneAlt /></a>

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <img src={preview.src} alt={preview.alt} />
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
        <p>Luxury weddings, elite celebrations, and destination experiences across South India.</p>
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
            ['artists', 'Artists'],
            ['milestone', 'Our Milestone'],
            ['careers', 'Careers'],
            ['contact', 'Booking & Contact'],
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

