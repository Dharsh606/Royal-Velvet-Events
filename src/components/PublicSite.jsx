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
import { destinations, gallery, reels, services, testimonials, timeline } from '../data/content'

const counters = [
  { value: 150, suffix: '+', label: 'Events' },
  { value: 50, suffix: '+', label: 'Luxury Weddings' },
  { value: 100, suffix: '%', label: 'Client Satisfaction' },
  { value: 10, suffix: '+', label: 'Destination Events' },
]

export default function PublicSite() {
  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Booking & Contact' },
  ]
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const getPageFromPath = () => window.location.pathname.replace('/', '') || 'home'
  const [activeSection, setActiveSection] = useState(getPageFromPath)
  const [homepage, setHomepage] = useState({
    heroTitle: 'Effortlessly Lavish Experiences',
    heroSubtitle: 'Luxury Weddings • Royal Celebrations • Elite Events',
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
    const timer = setTimeout(() => setLoaded(true), 900)
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
          <span>RoyalVelvetEvents</span>
        </div>
      )}

      <div className="cursor-ring" />
      <div className="cursor-dot" />

      <header className="navbar">
        <button className="brand" onClick={() => setActiveSection('home')}>RoyalVelvetEvents</button>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
          <span />
          <span />
        </button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
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
            <p>Effortlessly Lavish</p>
            <h1>{homepage.heroTitle}</h1>
            <span>{homepage.heroSubtitle}</span>
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
              RoyalVelvetEvents designs layered celebrations for clients who want elegance without friction:
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

        {activeSection === 'contact' && (
        <section id="contact" className="section contact-page page-stage">
          <div className="booking-section">
          <div data-aos="fade-right">
            <p className="eyebrow">Booking</p>
            <h2>Begin with the feeling you want guests to remember.</h2>
            <p>Share the first contour of your event. We will shape the rest with discretion and detail.</p>
          </div>
          <form className="glass-card booking-form" onSubmit={handleSubmit} data-aos="fade-left">
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
          </div>

          <div className="contact-details glass-card" data-aos="fade-up">
            <div>
              <strong>RoyalVelvetEvents</strong>
              <span>Effortlessly Lavish</span>
            </div>
            <div className="footer-links">
              <a href="tel:+919876543210"><FaPhoneAlt /> Direct Call</a>
              <a href="https://wa.me/919876543210"><FaWhatsapp /> WhatsApp</a>
              <a href="mailto:hello@royalvelvetevents.com">hello@royalvelvetevents.com</a>
            </div>
            <iframe
              title="RoyalVelvetEvents map"
              src="https://www.google.com/maps?q=HSR%20Layout%20Bangalore&output=embed"
              loading="lazy"
            />
          </div>
          <LuxuryFooter setActiveSection={setActiveSection} />
        </section>
        )}
      </main>

      <a className="floating-contact whatsapp" href="https://wa.me/919876543210" aria-label="WhatsApp"><FaWhatsapp /></a>
      <a className="floating-contact call" href="tel:+919876543210" aria-label="Call"><FaPhoneAlt /></a>

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
        <strong>RoyalVelvetEvents</strong>
        <span>Effortlessly Lavish</span>
        <p>Luxury weddings, elite celebrations, and destination experiences across South India.</p>
      </div>

      <div>
        <h3>Connect</h3>
        <div className="social-links">
          <a href="#" aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="Facebook"><FaFacebookF /></a>
          <a href="#" aria-label="YouTube"><FaYoutube /></a>
          <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
        </div>
        <a href="mailto:royalvelveteventstudio@gmail.com">royalvelveteventstudio@gmail.com</a>
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
        <span>© {new Date().getFullYear()} RoyalVelvetEvents. All rights reserved.</span>
        <span>Crafted for celebrations that deserve permanence.</span>
      </div>
    </footer>
  )
}
