import { useEffect, useMemo, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import {
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
  FaYoutube,
  FaWhatsapp,
} from 'react-icons/fa'
import {
  about,
  bookingEventTypes,
  categoryToEventType,
  counters,
  customPackageOptions,
  defaultOfferSettings,
  destinations,
  gallery as defaultGallery,
  founder,
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
  fetchMembershipSettings,
  fetchPublishedTestimonials,
  fetchReels,
  isSupabaseConfigured,
  mergeGallery,
  mergeReels,
  submitBooking,
} from '../lib/contentApi'

const brandTitle = 'The Royal Velvet'
const brandTagline = 'Effortlessly Lavish'
const contactEmail = 'royalvelveteventstudio@gmail.com'
const contactPhone = '+91 98805 41336'
const contactPhoneHref = '+919880541336'
const instagramUrl = 'https://www.instagram.com/the_royal_velvet?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='
const introStorageKey = 'trv-intro-seen-at'
const introCooldownMs = 15 * 60 * 1000
const shouldSkipIntro = () => {
  if (typeof sessionStorage === 'undefined') return false
  const lastSeen = Number(sessionStorage.getItem(introStorageKey) || 0)
  return lastSeen && Date.now() - lastSeen < introCooldownMs
}

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
  const [loaded, setLoaded] = useState(() => shouldSkipIntro())
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [navHidden, setNavHidden] = useState(false)
  const [liveTestimonials, setLiveTestimonials] = useState(defaultTestimonials)
  const [liveGallery, setLiveGallery] = useState(defaultGallery)
  const [liveReels, setLiveReels] = useState(defaultReels)
  const [offers, setOffers] = useState(defaultOfferSettings)
  const [offerPopupIndex, setOfferPopupIndex] = useState(0)
  const [offerPopupVisible, setOfferPopupVisible] = useState(true)
  const [offerPopupDismissed, setOfferPopupDismissed] = useState(false)
  const [expandedEvent, setExpandedEvent] = useState(packages[0]?.id || '')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const getPageFromPath = () => window.location.pathname.replace('/', '') || 'home'
  const [activeSection, setActiveSection] = useState(getPageFromPath)
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
    customServices: [],
    offerInterests: [],
  }
  const [form, setForm] = useState(emptyForm)
  const [bookingPrefill, setBookingPrefill] = useState(null)

  useEffect(() => {
    AOS.init({ duration: 900, once: true, offset: 80 })
    const timer = loaded
      ? null
      : setTimeout(() => {
          sessionStorage.setItem(introStorageKey, String(Date.now()))
          setLoaded(true)
        }, 5000)
    const hydrateContent = async () => {
      if (isSupabaseConfigured) {
        try {
          const [testimonialsData, galleryData, reelsData, membershipData] = await Promise.all([
            fetchPublishedTestimonials(),
            fetchGallery(),
            fetchReels(),
            fetchMembershipSettings(defaultOfferSettings),
          ])
          if (membershipData?.length) setOffers(membershipData)
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
          setLiveGallery(mergeGallery(defaultGallery, galleryData || []))
          setLiveReels(mergeReels(defaultReels, reelsData || []))
          return
        } catch {
          /* fall back to static content */
        }
      }

      const localMembership = await fetchMembershipSettings(defaultOfferSettings)
      if (localMembership?.length) setOffers(localMembership)
    }
    hydrateContent()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [loaded])

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

  const activeOffers = useMemo(
    () => offers.filter((offer) => offer.active && (offer.title || offer.description || offer.discountLabel)).slice(0, 3),
    [offers],
  )
  const currentPopupOffer = activeOffers[offerPopupIndex]
  const customOptionsByCategory = useMemo(() => {
    return customPackageOptions.reduce((groups, item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
      return groups
    }, {})
  }, [])

  useEffect(() => {
    if (!loaded || activeSection !== 'home' || !activeOffers.length || offerPopupDismissed) return undefined
    setOfferPopupVisible(true)
    setOfferPopupIndex(0)
    return undefined
  }, [loaded, activeSection, activeOffers.length, offerPopupDismissed])

  useEffect(() => {
    if (!loaded || activeSection !== 'home' || offerPopupDismissed || !offerPopupVisible || !activeOffers.length) return undefined
    const timer = window.setTimeout(() => {
      if (offerPopupIndex < activeOffers.length - 1) {
        setOfferPopupIndex((index) => index + 1)
      } else {
        setOfferPopupVisible(false)
      }
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [loaded, activeSection, activeOffers.length, offerPopupDismissed, offerPopupIndex, offerPopupVisible])

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

  const buildBookingPayload = (currentForm) => {
    const additions = []
    if (currentForm.customServices.length) {
      additions.push(`Custom package selections: ${currentForm.customServices.join(', ')}`)
    }
    if (currentForm.offerInterests.length) {
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
    setSubmitError('')
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
    }
  }

  return (
    <>
      {!loaded && (
        <div className="loader">
          <img className="intro-logo" src="/assets/the-royal-velvet-main-logo-web.png" alt="The Royal Velvet logo" />
          <div className="loader-frame">
            <i />
            <i />
            <i />
            <i />
            <div className="intro-frame-copy">
              <span>{brandTitle}</span>
            </div>
          </div>
          <img className="intro-tagline-img" src="/assets/effortlessly-lavish-lettering.png" alt={brandTagline} />
        </div>
      )}

      <div className="cursor-ring" />
      <div className="cursor-dot" />

      <header className={navHidden ? 'site-header nav-hidden' : 'site-header'}>
        <div className="navbar">
          <button className="nav-logo" onClick={() => setActiveSection('home')} aria-label="The Royal Velvet home">
            <img src="/assets/the-royal-velvet-sub-logo-bgless.png" alt="The Royal Velvet logo" />
          </button>
          <div className="nav-group nav-primary">
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
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" />
          <div className="particles" />
          <div className="hero-content" data-aos="fade-up">
            <h1 className="hero-brand-title hero-brand-image-title" aria-label={brandTitle}>
              <img src={homepageTitleImage} alt={brandTitle} />
            </h1>
            <img className="hero-tagline-img" src="/assets/effortlessly-lavish-lettering.png" alt={brandTagline} />
            <p className="hero-positioning">Curators of Extraordinary Celebrations for India's Most Distinguished Families & Brands.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => openBooking()}>Book Private Consultation</button>
              <button className="btn btn-ghost" onClick={() => setActiveSection('gallery')}>View Portfolio</button>
            </div>
            <div className="hero-trust-bar">Serving Bangalore | Hyderabad | Chennai | Mumbai | Delhi | PAN India</div>
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
                <div className="testimonial-rating" aria-label={`${item.rating || 5} star rating`}>
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
              <a
                className={`reel-card${item.url ? ' reel-card-has-media' : ''}`}
                key={`${item.id || item.title}-${index}`}
                href={item.reelUrl || item.url || instagramUrl}
                target="_blank"
                rel="noreferrer"
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
              </a>
            ))}
          </div>
        </section>
        <LuxuryFooter setActiveSection={setActiveSection} />
        </>
        )}

        {activeSection === 'about' && (
        <section id="about" className="section page-stage story-luxury-section">
          <div className="story-hero-panel glass-card">
            <div className="story-image-stack" aria-label="Luxury celebration image placeholders">
              <div className="story-image-card story-image-primary">
                <span>Future Founder / Signature Event Image</span>
              </div>
            </div>
            <div className="story-copy-panel">
              <p className="eyebrow">Our Story</p>
              <h2>{about.title}</h2>
              <p>{about.text}</p>
              <p>{about.philosophy}</p>
            </div>
          </div>

          <div className="founder-section glass-card">
            <div className="founder-portrait">
              <span className="founder-initials">VHR</span>
              <small>Founder Portrait Space</small>
            </div>
            <div className="founder-content">
              <p className="eyebrow">Founder</p>
              <h3>{founder.name}</h3>
              <span>{founder.role}</span>
              <blockquote>“{founder.quote}”</blockquote>
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
          </div>

          <div className="story-counter-strip">
            {counters.map((counter) => (
              <article className="glass-card" key={counter.label}>
                <strong>{counter.value}{counter.suffix}</strong>
                <span>{counter.label}</span>
              </article>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'events' && (
        <section id="events" className="section page-stage events-page">
          <p className="eyebrow" data-aos="fade-up">Events</p>
          <h2 data-aos="fade-up">Choose your celebration architecture.</h2>
          <p className="section-lead" data-aos="fade-up">
            Begin with a curated event package. Open any event to view what is included, then continue to Services to add bespoke extras before booking your consultation.
          </p>

          <div className="event-accordion" data-aos="fade-up">
            {packages.map((pkg) => {
              const isOpen = expandedEvent === pkg.id
              return (
                <article className={isOpen ? 'glass-card event-package open' : 'glass-card event-package'} key={pkg.id}>
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
                    <p className="package-ideal">
                      <strong>Ideal for:</strong> {pkg.idealFor}
                    </p>
                    <button className="btn btn-primary" type="button" onClick={() => chooseEventPackage(pkg)}>
                      Choose Package & Add Services <FaArrowRight />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {activeOffers.length > 0 && (
            <div className="offer-service-grid">
              {activeOffers.map((offer) => (
                <article className="glass-card membership-service-card" data-aos="fade-up" key={offer.id || offer.title}>
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
        </section>
        )}

        {activeSection === 'services' && (
        <section id="services" className="section page-stage services-page">
          <p className="eyebrow" data-aos="fade-up">Services</p>
          <h2 data-aos="fade-up">Enhance your selected package with bespoke services.</h2>
          <p className="section-lead" data-aos="fade-up">
            Services are the luxury details inside your event package ? d?cor, hospitality, talent, rituals, media, logistics, wellness, and custom production support.
          </p>

          {selectedPackage && (
            <div className="selected-package-banner glass-card" data-aos="fade-up">
              <div>
                <p className="eyebrow">Selected Event</p>
                <h3>{selectedPackage.name}</h3>
                <p>{selectedPackage.tagline}</p>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => setActiveSection('events')}>
                Change Event
              </button>
            </div>
          )}

          <div className="service-catalog">
            {serviceCategories.map((category) => (
              <div className="service-category" key={category.id} data-aos="fade-up">
                <div className="service-category-head">
                  <span className="service-category-icon" aria-hidden="true"><FaCrown /></span>
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
                        className={form.customServices.includes(item.title) ? 'btn btn-primary service-request-btn' : 'btn btn-ghost service-request-btn'}
                        type="button"
                        onClick={() => toggleCustomService(item.title)}
                      >
                        {form.customServices.includes(item.title) ? 'Added' : 'Add Service'} <FaArrowRight />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {activeOffers.length > 0 && (
            <div className="offer-service-grid">
              {activeOffers.map((offer) => (
                <article className="glass-card membership-service-card" data-aos="fade-up" key={offer.id || offer.title}>
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

          <div className="services-cta glass-card" data-aos="fade-up">
            <p className="eyebrow">Custom Planning</p>
            <h3>{form.customServices.length ? `${form.customServices.length} extra service${form.customServices.length > 1 ? 's' : ''} selected.` : 'Need a bespoke combination?'}</h3>
            <p>Mix any services across categories ? we will build a tailored proposal for your celebration.</p>
            <button className="btn btn-primary" type="button" onClick={() => openBooking({ eventType: selectedPackage ? 'Curated Package Inquiry' : 'Custom Package Builder', detail: selectedPackage ? `Package: ${selectedPackage.name}` : 'Custom service package' })}>
              Continue to Book Consultation <FaArrowRight />
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
          <p className="eyebrow" data-aos="fade-up">Artists & Talent</p>
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
          <p className="eyebrow" data-aos="fade-up">Legacy</p>
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
            <h2>Request a private consultation.</h2>
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
                    <p className="form-step-label"><span>{activeOffers.length ? '05' : '04'}</span> Your Vision</p>
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
          </div>

          <div className="contact-map-panel glass-card" data-aos="fade-up">
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
          </div>

          <LuxuryFooter setActiveSection={setActiveSection} />
        </section>
        )}
      </main>

      {loaded && activeSection === 'home' && currentPopupOffer && offerPopupVisible && !offerPopupDismissed && (
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

      <a className="floating-contact whatsapp" href={`https://wa.me/${contactPhoneHref.replace('+', '')}`} aria-label="WhatsApp"><FaWhatsapp /></a>
      <a className="floating-contact call" href={`tel:${contactPhoneHref}`} aria-label="Call"><FaPhoneAlt /></a>
      <div className="mobile-bottom-bar" aria-label="Quick consultation actions">
        <a href={`tel:${contactPhoneHref}`}><FaPhoneAlt /> Call</a>
        <a href={`https://wa.me/${contactPhoneHref.replace('+', '')}?text=Hello%20Royal%20Velvet%2C%20I%27d%20like%20to%20discuss%20my%20event.`}><FaWhatsapp /> WhatsApp</a>
        <button type="button" onClick={() => openBooking()}>Book Consultation</button>
      </div>

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
          <img src="/assets/the-royal-velvet-main-logo-web.png" alt="The Royal Velvet logo" />
        </div>
        <strong>The Royal Velvet</strong>
        <img className="footer-tagline-img" src="/assets/effortlessly-lavish-lettering.png" alt="Effortlessly Lavish" />
        <p>Curators of Extraordinary Celebrations for India's Most Distinguished Families & Brands.</p>
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
            ['about', 'Our Story'],
            ['events', 'Events'],
            ['services', 'Services'],
            ['gallery', 'Gallery'],
            ['artists', 'Artists & Talent'],
            ['milestone', 'Legacy'],
            ['contact', 'Contact'],
            ['booking', 'Book Consultation'],
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
          <a href="/why-choose-us.html">Why Choose Us</a>
          <a href="/faq.html">FAQ</a>
          <a href="/cancellation-policy.html">Cancellation Policy</a>
          <a href="/privacy-policy.html">Privacy Policy</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} The Royal Velvet. All rights reserved.</span>
        <span>Crafted for celebrations that deserve permanence.</span>
      </div>
      <button className="footer-contact-tab" onClick={() => setActiveSection('contact')}>Contact Us</button>
    </footer>
  )
}



