import { useState, useEffect } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { FaArrowRight, FaCalendarAlt, FaCheckCircle, FaWhatsapp, FaPhoneAlt, FaInstagram, FaDownload, FaPlus, FaTrash, FaStar, FaCrown, FaGem } from 'react-icons/fa'
import { bookingEventTypes } from '../data/content'
import { submitPrivateInquiry, isSupabaseConfigured } from '../lib/contentApi'
import { BRAND_PHONE, BRAND_NAME } from '../lib/seo'

export default function PrivateInquiryPage() {
  const emptyForm = {
    name: '',
    phone: '',
    email: '',
    type: '',
    date: '',
    budget: '',
    location: '',
    vision: '',
    isMultiDay: 'Single Day Event',
    itineraryDays: [
      { dayLabel: 'Day 1: Main Event', date: '', location: '', timing: 'Evening', setting: 'Indoor' },
    ],
    childName: '',
    childAge: '',
    gender: '',
    brideGroom: '',
    coupleEntryStyle: 'Royal Floral Canopy Walkway',
    ceremoniesList: [],
    priestCoordination: 'No',
    companyName: '',
    brandColorPalette: '',
    avTechSpecs: [],
    culturalRitualType: '',
    flowerStylePreference: 'South Indian Jasmine & Lotus Mandap',
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
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedPayload, setSubmittedPayload] = useState(null)
  const [submittedInquiryId, setSubmittedInquiryId] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = 'Private Event Planning Questionnaire | The Royal Velvet'
    let meta = document.querySelector('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'noindex, nofollow')
  }, [])

  useEffect(() => {
    if (submitted) {
      window.scrollTo({ top: 140, behavior: 'smooth' })
    }
  }, [submitted])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
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

  const toggleCeremony = (item) => {
    setForm((current) => {
      const exists = (current.ceremoniesList || []).includes(item)
      return {
        ...current,
        ceremoniesList: exists
          ? current.ceremoniesList.filter((i) => i !== item)
          : [...(current.ceremoniesList || []), item],
      }
    })
  }

  const toggleAvTechSpec = (item) => {
    setForm((current) => {
      const exists = (current.avTechSpecs || []).includes(item)
      return {
        ...current,
        avTechSpecs: exists
          ? current.avTechSpecs.filter((i) => i !== item)
          : [...(current.avTechSpecs || []), item],
      }
    })
  }

  const addItineraryDay = () => {
    setForm((prev) => ({
      ...prev,
      itineraryDays: [
        ...(prev.itineraryDays || []),
        {
          dayLabel: `Day ${(prev.itineraryDays || []).length + 1}: Celebration`,
          date: '',
          location: '',
          timing: 'Evening',
          setting: 'Indoor',
        },
      ],
    }))
  }

  const removeItineraryDay = (index) => {
    setForm((prev) => ({
      ...prev,
      itineraryDays: (prev.itineraryDays || []).filter((_, i) => i !== index),
    }))
  }

  const handleItineraryChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...(prev.itineraryDays || [])]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, itineraryDays: updated }
    })
  }

  const isKidsOrBirthday = Boolean(
    form.type && (
      form.type.toLowerCase().includes('birthday') ||
      form.type.toLowerCase().includes('baby') ||
      form.type.toLowerCase().includes('youth') ||
      form.type.toLowerCase().includes('kid') ||
      form.type.toLowerCase().includes('naming')
    )
  )

  const isWedding = Boolean(
    form.type && (
      form.type.toLowerCase().includes('wedding') ||
      form.type.toLowerCase().includes('marriage') ||
      form.type.toLowerCase().includes('destination')
    )
  )

  const isCorporate = Boolean(
    form.type && (
      form.type.toLowerCase().includes('corporate') ||
      form.type.toLowerCase().includes('company') ||
      form.type.toLowerCase().includes('launch') ||
      form.type.toLowerCase().includes('executive')
    )
  )

  const isCultural = Boolean(
    form.type && (
      form.type.toLowerCase().includes('traditional') ||
      form.type.toLowerCase().includes('cultural') ||
      form.type.toLowerCase().includes('heritage') ||
      form.type.toLowerCase().includes('pooja') ||
      form.type.toLowerCase().includes('ceremony')
    )
  )

  const calculateLuxuryTier = (currentForm) => {
    const decorCount = (currentForm.decorElements || []).length
    const entCount = (currentForm.entertainmentOptions || []).length
    const catCount = (currentForm.cateringAddons || []).length
    const mediaCount = (currentForm.mediaOptions || []).length
    const serviceCount = (currentForm.customServices || []).length
    const ceremonyCount = (currentForm.ceremoniesList || []).length
    const avCount = (currentForm.avTechSpecs || []).length
    const extraDaysCount = currentForm.isMultiDay === 'Multi-Day Celebration (2+ Days)'
      ? Math.max(0, (currentForm.itineraryDays || []).length - 1)
      : 0

    const totalCount = decorCount + entCount + catCount + mediaCount + serviceCount + ceremonyCount + avCount + extraDaysCount

    if (totalCount >= 13) {
      return { name: 'Crown Edition (Full Production)', badge: '👑 Crown Edition', count: totalCount, icon: FaCrown }
    }
    if (totalCount >= 8) {
      return { name: 'Imperia Platinum Edition', badge: '💎 Imperia Platinum', count: totalCount, icon: FaGem }
    }
    if (totalCount >= 4) {
      return { name: 'Royal Velvet Signature', badge: '🌟 Signature Luxury', count: totalCount, icon: FaStar }
    }
    return { name: 'Royal Velvet Classic', badge: '✨ Classic Selection', count: totalCount, icon: FaStar }
  }

  const activeTier = calculateLuxuryTier(form)

  const buildSummaryText = (currentForm) => {
    const additions = []
    additions.push(`Luxury Tier: ${activeTier.name} (${activeTier.count} custom selections)`)
    
    if (currentForm.isMultiDay === 'Multi-Day Celebration (2+ Days)' && (currentForm.itineraryDays || []).length) {
      const schedule = currentForm.itineraryDays.map((d) => `${d.dayLabel}: ${d.date || 'Date TBD'} at ${d.location || 'Venue TBD'} (${d.timing}, ${d.setting})`).join(' | ')
      additions.push(`Multi-Day Schedule: ${schedule}`)
    }

    if (currentForm.childName || currentForm.childAge) {
      additions.push(`Child Details: ${currentForm.childName || ''} (${currentForm.childAge || ''}, ${currentForm.gender || ''})`)
    }
    if (currentForm.brideGroom) {
      additions.push(`Bride & Groom: ${currentForm.brideGroom}`)
    }
    if (currentForm.coupleEntryStyle) {
      additions.push(`Couple Entry Style: ${currentForm.coupleEntryStyle}`)
    }
    if ((currentForm.ceremoniesList || []).length) {
      additions.push(`Ceremonies Included: ${currentForm.ceremoniesList.join(', ')}`)
    }
    if (currentForm.companyName || currentForm.brandColorPalette) {
      additions.push(`Corporate Brand: ${currentForm.companyName || 'N/A'} (Palette: ${currentForm.brandColorPalette || 'N/A'})`)
    }
    if ((currentForm.avTechSpecs || []).length) {
      additions.push(`AV & Stage Specs: ${currentForm.avTechSpecs.join(', ')}`)
    }
    if (currentForm.culturalRitualType || currentForm.flowerStylePreference) {
      additions.push(`Cultural Details: ${currentForm.culturalRitualType || 'Rituals'} (Flowers: ${currentForm.flowerStylePreference || 'Standard'})`)
    }
    if (currentForm.venueName || currentForm.venueAddress) {
      additions.push(`Venue: ${currentForm.venueName || ''} - ${currentForm.venueAddress || ''} (${currentForm.venueSetting || ''}, Booked: ${currentForm.venueBooked || 'No'})`)
    }
    if (currentForm.guests || currentForm.adultsCount || currentForm.kids0to3 || currentForm.kids4to8 || currentForm.kids9plus) {
      additions.push(`Guests: Total ${currentForm.guests || 0} (Adults: ${currentForm.adultsCount || 0}, Kids 0-3: ${currentForm.kids0to3 || 0}, Kids 4-8: ${currentForm.kids4to8 || 0}, Kids 9+: ${currentForm.kids9plus || 0})`)
    }
    if (currentForm.theme || currentForm.colours) {
      additions.push(`Theme & Styling: ${currentForm.theme || 'Default'} | Colours: ${currentForm.colours || 'Default'}`)
    }
    if ((currentForm.decorElements || []).length) {
      additions.push(`Decor Elements: ${currentForm.decorElements.join(', ')}`)
    }
    if ((currentForm.entertainmentOptions || []).length) {
      additions.push(`Entertainment: ${currentForm.entertainmentOptions.join(', ')} ${currentForm.entertainmentOther ? `(${currentForm.entertainmentOther})` : ''}`)
    }
    if (currentForm.mealType || (currentForm.cateringAddons || []).length) {
      additions.push(`Catering: ${currentForm.mealType || ''} (${currentForm.dietaryType || ''}) - Addons: ${(currentForm.cateringAddons || []).join(', ')}`)
    }
    if (currentForm.cakeStatus) {
      additions.push(`Cake: ${currentForm.cakeStatus} (${currentForm.cakeFlavour || ''}, ${currentForm.cakeWeight || ''})`)
    }
    if ((currentForm.mediaOptions || []).length) {
      additions.push(`Media & Photo/Video: ${currentForm.mediaOptions.join(', ')}`)
    }
    if (currentForm.giftsNeeded) {
      additions.push(`Return Gifts: ${currentForm.giftsNeeded} (Budget: ${currentForm.giftBudget || 'N/A'})`)
    }
    if (currentForm.decisionMaker || currentForm.confirmationTimeline) {
      additions.push(`Decision Info: Finalized by ${currentForm.decisionMaker || 'Client'}, Timeline: ${currentForm.confirmationTimeline || 'Exploring'}`)
    }
    if (currentForm.specialRequests) {
      additions.push(`Special Requests / Notes: ${currentForm.specialRequests}`)
    }
    return additions.join('\n\n')
  }

  const handleDownloadPdf = (dataPayload, idRef) => {
    const payloadData = dataPayload || form
    const referenceId = idRef || submittedInquiryId || `RVE-${Math.floor(100000 + Math.random() * 900000)}`
    const printWindow = window.open('', '_blank', 'width=900,height=1000')
    if (!printWindow) return

    const dateStr = payloadData.date || new Date().toISOString().slice(0, 10)

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Private Vision Brief - ${payloadData.name || 'Valued Guest'} | The Royal Velvet</title>
        <style>
          body { font-family: 'Georgia', serif; background: #fff; color: #1a1a1a; padding: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
          .brand-title { font-size: 28px; font-weight: bold; color: #4a000a; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
          .tagline { color: #d4af37; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; font-weight: 600; }
          .ref-box { background: #fdfbf7; border: 1px solid #e6c88d; padding: 16px 20px; border-radius: 8px; margin-bottom: 25px; display: flex; justify-content: space-between; font-size: 14px; }
          .section-title { font-size: 15px; font-weight: bold; color: #4a000a; border-left: 3px solid #d4af37; padding-left: 10px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: top; }
          td.label { font-weight: bold; color: #555; width: 35%; }
          .tier-badge { display: inline-block; background: #4a000a; color: #f4e8c1; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777; }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="brand-title">The Royal Velvet</h1>
          <div class="tagline">Effortlessly Lavish &middot; Luxury Celebration Architecture</div>
        </div>

        <div class="ref-box">
          <div><strong>Client Name:</strong> ${payloadData.name || 'Client'}</div>
          <div><strong>Reference ID:</strong> ${referenceId}</div>
          <div><strong>Target Date:</strong> ${dateStr}</div>
        </div>

        <div class="section-title">01. Occasion & Overview</div>
        <table>
          <tr><td class="label">Occasion Type</td><td>${payloadData.type || 'Bespoke Celebration'}</td></tr>
          <tr><td class="label">Luxury Tier Level</td><td><span class="tier-badge">${calculateLuxuryTier(payloadData).name}</span></td></tr>
          <tr><td class="label">Primary Event Date</td><td>${dateStr}</td></tr>
          <tr><td class="label">Total Guest Count</td><td>${payloadData.guests || 'Not specified'}</td></tr>
          <tr><td class="label">Overall Budget</td><td>${payloadData.budget || 'Not specified'}</td></tr>
          <tr><td class="label">Mobile Number</td><td>${payloadData.phone || 'N/A'}</td></tr>
          <tr><td class="label">Email Address</td><td>${payloadData.email || 'N/A'}</td></tr>
        </table>

        ${payloadData.isMultiDay === 'Multi-Day Celebration (2+ Days)' ? `
          <div class="section-title">Multi-Day Celebration Itinerary</div>
          <table>
            ${(payloadData.itineraryDays || []).map((d) => `
              <tr><td class="label">${d.dayLabel}</td><td>Date: ${d.date || 'TBD'} &middot; Venue: ${d.location || 'Location TBD'} (${d.timing}, ${d.setting})</td></tr>
            `).join('')}
          </table>
        ` : ''}

        <div class="section-title">02. Event Vision & Custom Selections</div>
        <table>
          <tr><td class="label">Preferred Theme</td><td>${payloadData.theme || 'Bespoke Concept'}</td></tr>
          <tr><td class="label">Color Palette</td><td>${payloadData.colours || 'Custom Palette'}</td></tr>
          <tr><td class="label">Decor Elements</td><td>${Array.isArray(payloadData.decorElements) ? payloadData.decorElements.join(', ') : (payloadData.decorElements || 'Standard Styling')}</td></tr>
          <tr><td class="label">Entertainment</td><td>${Array.isArray(payloadData.entertainmentOptions) ? payloadData.entertainmentOptions.join(', ') : (payloadData.entertainmentOptions || 'Background Ambience')}</td></tr>
          <tr><td class="label">Catering & Live Addons</td><td>${Array.isArray(payloadData.cateringAddons) ? payloadData.cateringAddons.join(', ') : (payloadData.cateringAddons || 'Plated Service')}</td></tr>
          <tr><td class="label">Media & Film</td><td>${Array.isArray(payloadData.mediaOptions) ? payloadData.mediaOptions.join(', ') : (payloadData.mediaOptions || 'Photography')}</td></tr>
          <tr><td class="label">Special Requests</td><td>${payloadData.specialRequests || 'None noted'}</td></tr>
        </table>

        <div class="footer">
          <p><strong>The Royal Velvet Concierge Desk</strong> &middot; HSR Layout, Bangalore, India</p>
          <p>Direct Phone: +91 98805 41336 &middot; Email: concierge@the-royalvelvet.com</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitError('')
    setSubmitting(true)

    try {
      const summaryText = buildSummaryText(form)
      const refId = `RVE-${Math.floor(100000 + Math.random() * 900000)}`
      const payload = {
        ...form,
        vision: summaryText,
      }

      if (isSupabaseConfigured) {
        await submitPrivateInquiry(payload)
      } else {
        const { db, isFirebaseConfigured } = await import('../lib/firebase')
        if (isFirebaseConfigured && db) {
          const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
          await addDoc(collection(db, 'private_inquiries'), { ...payload, createdAt: serverTimestamp() })
        } else {
          const existing = JSON.parse(localStorage.getItem('rve-private-inquiries') || '[]')
          localStorage.setItem('rve-private-inquiries', JSON.stringify([{ ...payload, createdAt: new Date().toISOString() }, ...existing]))
        }
      }

      setSubmittedPayload(payload)
      setSubmittedInquiryId(refId)
      setSubmitted(true)
      setForm(emptyForm)
    } catch (error) {
      setSubmitError(error.message || 'Could not submit your questionnaire. Please try again or contact us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="public-site-container private-inquiry-page-wrapper">
        <header className="site-header fixed-header private-header">
          <div className="header-inner private-header-inner">
            <a href="/" className="brand-logo-link private-brand-logo" title="The Royal Velvet - Home">
              <img src="/assets/the-royal-velvet-sub-logo-bgless.png" alt="The Royal Velvet logo" width={1973} height={1973} decoding="async" fetchPriority="high" />
            </a>
          </div>
        </header>

        <main className="main-content" style={{ paddingTop: '105px', paddingBottom: '4rem' }}>
          <section className="section booking-page page-stage private-inquiry-section">
            <m.div
              className="booking-architecture-hero glass-card single-column-hero"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <m.div className="booking-architecture-copy">
                <p className="eyebrow">Private Client Portal</p>
                <h3>Event Planning Questionnaire</h3>
                <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
                  Please share your event preferences below. Every detail helps us curate a bespoke proposal tailored specifically to your vision.
                </p>
              </m.div>
            </m.div>

            <div className="booking-luxury-layout full-width-questionnaire" style={{ marginTop: '2rem' }}>
              <m.form
                className="glass-card booking-form-luxury private-inquiry-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {submitted ? (
                  <div className="booking-success" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{ fontSize: '3.5rem', color: 'var(--gold)', marginBottom: '1rem' }}>
                      <FaCheckCircle />
                    </div>
                    <span className="booking-intro-badge">Inquiry Received &middot; Ref #{submittedInquiryId || 'RVE-2026'}</span>
                    <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', margin: '1rem 0' }}>
                      Thank you for sharing your vision.
                    </h3>
                    <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.7' }}>
                      Our team will curate a personalized concept and proposal based on your requirements and contact you within 24 hours.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" type="button" onClick={() => handleDownloadPdf(submittedPayload, submittedInquiryId)}>
                        <FaDownload /> Download Vision Brief (PDF)
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => setSubmitted(false)}>
                        Submit Another Inquiry
                      </button>
                      <a href="/" className="btn btn-ghost">
                        Return to Homepage
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Live Luxury Tier Bar */}
                    <div className="luxury-tier-indicator-bar">
                      <div className="tier-info">
                        <span className="tier-badge-pill">{activeTier.badge}</span>
                        <span className="tier-title">{activeTier.name}</span>
                      </div>
                      <div className="tier-counter">
                        <span>✨ <strong>{activeTier.count}</strong> Custom Elements Selected</span>
                      </div>
                    </div>

                    {/* 01. Basic Details */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>01</span> Basic Details</p>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Full Name *</span>
                          <input name="name" type="text" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Mobile Number *</span>
                          <input name="phone" type="tel" placeholder="+91 98805 41336" value={form.phone} onChange={handleChange} required />
                        </label>
                      </div>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Email ID *</span>
                          <input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Event Date *</span>
                          <input name="date" type="date" value={form.date} onChange={handleChange} required />
                        </label>
                      </div>
                      <label className="booking-field full">
                        <span className="booking-field-label">Occasion / Event Type *</span>
                        <select name="type" value={form.type} onChange={handleChange} required>
                          <option value="" disabled hidden>Choose occasion</option>
                          {bookingEventTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </label>

                      {/* Smart Occasion-Adaptive Fields */}
                      {isKidsOrBirthday && (
                        <div className="form-fields-row conditional-box" style={{ marginTop: '0.85rem' }}>
                          <label className="booking-field">
                            <span className="booking-field-label">Honoree / Child’s Name</span>
                            <input name="childName" type="text" placeholder="Full name" value={form.childName} onChange={handleChange} />
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Age / Milestone</span>
                            <input name="childAge" type="text" placeholder="e.g. 1st Birthday / 18th Milestone" value={form.childAge} onChange={handleChange} />
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Boy / Girl</span>
                            <select name="gender" value={form.gender} onChange={handleChange}>
                              <option value="">Select gender</option>
                              <option value="Boy">Boy</option>
                              <option value="Girl">Girl</option>
                              <option value="Not applicable">Not applicable</option>
                            </select>
                          </label>
                        </div>
                      )}

                      {isWedding && (
                        <div className="form-fields-row conditional-box" style={{ marginTop: '0.85rem' }}>
                          <label className="booking-field">
                            <span className="booking-field-label">Bride & Groom Names</span>
                            <input name="brideGroom" type="text" placeholder="e.g. Ananya & Vikram" value={form.brideGroom} onChange={handleChange} />
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Couple Entry Preference</span>
                            <select name="coupleEntryStyle" value={form.coupleEntryStyle} onChange={handleChange}>
                              <option value="Royal Floral Canopy Walkway">Royal Floral Canopy Walkway</option>
                              <option value="Cold Pyro Sparkler Aisle">Cold Pyro Sparkler Aisle</option>
                              <option value="Vintage Car / Palki & Dhol">Vintage Car / Palki & Dhol</option>
                              <option value="Grand Fireworks & Smoke Canopy">Grand Fireworks & Smoke Canopy</option>
                            </select>
                          </label>
                          <label className="booking-field full" style={{ marginTop: '0.5rem' }}>
                            <span className="booking-field-label">Ceremonies Included (Select all that apply)</span>
                            <div className="questionnaire-chips-grid">
                              {['Roka / Sagai', 'Haldi Ceremony', 'Mehendi Function', 'Sangeet Night', 'Muhurtham Wedding', 'Grand Reception'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  className={(form.ceremoniesList || []).includes(c) ? 'questionnaire-chip active' : 'questionnaire-chip'}
                                  onClick={() => toggleCeremony(c)}
                                >
                                  {(form.ceremoniesList || []).includes(c) ? '✓ ' : '+ '}{c}
                                </button>
                              ))}
                            </div>
                          </label>
                        </div>
                      )}

                      {isCorporate && (
                        <div className="form-fields-row conditional-box" style={{ marginTop: '0.85rem' }}>
                          <label className="booking-field">
                            <span className="booking-field-label">Company / Organization Name</span>
                            <input name="companyName" type="text" placeholder="e.g. Acme Corp India" value={form.companyName} onChange={handleChange} />
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Brand Color Palette</span>
                            <input name="brandColorPalette" type="text" placeholder="e.g. Navy Blue & Gold" value={form.brandColorPalette} onChange={handleChange} />
                          </label>
                          <label className="booking-field full" style={{ marginTop: '0.5rem' }}>
                            <span className="booking-field-label">Keynote & Stage Specs (Select all that apply)</span>
                            <div className="questionnaire-chips-grid">
                              {['Curved LED Screen Wall', '3D Projection Mapping', 'Concert Sound System', 'Intelligent Stage Lighting', 'VIP Executive Seating'].map((av) => (
                                <button
                                  key={av}
                                  type="button"
                                  className={(form.avTechSpecs || []).includes(av) ? 'questionnaire-chip active' : 'questionnaire-chip'}
                                  onClick={() => toggleAvTechSpec(av)}
                                >
                                  {(form.avTechSpecs || []).includes(av) ? '✓ ' : '+ '}{av}
                                </button>
                              ))}
                            </div>
                          </label>
                        </div>
                      )}

                      {isCultural && (
                        <div className="form-fields-row conditional-box" style={{ marginTop: '0.85rem' }}>
                          <label className="booking-field">
                            <span className="booking-field-label">Ritual Type</span>
                            <input name="culturalRitualType" type="text" placeholder="e.g. Griha Pravesham, Seemantham, Pooja" value={form.culturalRitualType} onChange={handleChange} />
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Traditional Flower Styling</span>
                            <select name="flowerStylePreference" value={form.flowerStylePreference} onChange={handleChange}>
                              <option value="South Indian Jasmine & Lotus Mandap">South Indian Jasmine & Lotus Mandap</option>
                              <option value="Marigold & Mogra Traditional Canopy">Marigold & Mogra Traditional Canopy</option>
                              <option value="Exotic Orchid & Rose Temple Accents">Exotic Orchid & Rose Temple Accents</option>
                            </select>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* 02. Venue & Multi-Day Schedule */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>02</span> Venue & Schedule</p>
                      
                      <label className="booking-field full" style={{ marginBottom: '1rem' }}>
                        <span className="booking-field-label">Event Duration</span>
                        <div className="radio-group-lux">
                          {['Single Day Event', 'Multi-Day Celebration (2+ Days)'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={form.isMultiDay === opt ? 'radio-card-lux active' : 'radio-card-lux'}
                              onClick={() => setForm((c) => ({ ...c, isMultiDay: opt }))}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </label>

                      {form.isMultiDay === 'Multi-Day Celebration (2+ Days)' ? (
                        <div className="multi-day-builder">
                          <p className="builder-subtitle">Customize each day of your celebration:</p>
                          {(form.itineraryDays || []).map((day, idx) => (
                            <div key={idx} className="itinerary-day-card">
                              <div className="day-card-header">
                                <strong>{day.dayLabel}</strong>
                                {(form.itineraryDays || []).length > 1 && (
                                  <button
                                    type="button"
                                    className="btn-remove-day"
                                    onClick={() => removeItineraryDay(idx)}
                                  >
                                    <FaTrash /> Remove
                                  </button>
                                )}
                              </div>
                              <div className="form-fields-row">
                                <label className="booking-field">
                                  <span className="booking-field-label">Sub-Event Title</span>
                                  <input
                                    type="text"
                                    placeholder="e.g. Sangeet Night"
                                    value={day.dayLabel}
                                    onChange={(e) => handleItineraryChange(idx, 'dayLabel', e.target.value)}
                                  />
                                </label>
                                <label className="booking-field">
                                  <span className="booking-field-label">Date</span>
                                  <input
                                    type="date"
                                    value={day.date}
                                    onChange={(e) => handleItineraryChange(idx, 'date', e.target.value)}
                                  />
                                </label>
                                <label className="booking-field">
                                  <span className="booking-field-label">Venue / City</span>
                                  <input
                                    type="text"
                                    placeholder="e.g. Taj West End"
                                    value={day.location}
                                    onChange={(e) => handleItineraryChange(idx, 'location', e.target.value)}
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                          <button type="button" className="btn btn-ghost btn-add-day" onClick={addItineraryDay}>
                            <FaPlus /> Add Another Event Day
                          </button>
                        </div>
                      ) : (
                        <div className="form-fields-row">
                          <label className="booking-field">
                            <span className="booking-field-label">Venue Name</span>
                            <input name="venueName" type="text" placeholder="Resort, Hotel or Hall name" value={form.venueName} onChange={handleChange} />
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Venue Address / City</span>
                            <input name="venueAddress" type="text" placeholder="City or location address" value={form.venueAddress} onChange={handleChange} />
                          </label>
                        </div>
                      )}

                      <div className="form-fields-row" style={{ marginTop: '0.75rem' }}>
                        <label className="booking-field">
                          <span className="booking-field-label">Indoor or Outdoor?</span>
                          <div className="radio-group-lux">
                            {['Indoor', 'Outdoor', 'Both / Multiple Spaces'].map((setting) => (
                              <button
                                key={setting}
                                type="button"
                                className={form.venueSetting === setting ? 'radio-card-lux active' : 'radio-card-lux'}
                                onClick={() => setForm((c) => ({ ...c, venueSetting: setting }))}
                              >
                                {setting}
                              </button>
                            ))}
                          </div>
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Have you booked the venue?</span>
                          <div className="radio-group-lux">
                            {['Yes', 'No', 'In Discussion'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className={form.venueBooked === opt ? 'radio-card-lux active' : 'radio-card-lux'}
                                onClick={() => setForm((c) => ({ ...c, venueBooked: opt }))}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </label>
                      </div>

                      <div className="form-fields-row" style={{ marginTop: '0.75rem' }}>
                        <label className="booking-field">
                          <span className="booking-field-label">Event Timing</span>
                          <select name="eventTiming" value={form.eventTiming} onChange={handleChange}>
                            <option value="">Choose timing</option>
                            <option value="Morning">Morning</option>
                            <option value="Evening / Night">Evening / Night</option>
                            <option value="Full Day">Full Day</option>
                            <option value="Multi-Day">Multi-Day</option>
                          </select>
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Setup Time Available</span>
                          <input name="setupTime" type="text" placeholder="e.g. 4 hours before event" value={form.setupTime} onChange={handleChange} />
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Venue Contact Person (Optional)</span>
                          <input name="venueContact" type="text" placeholder="Name & Phone" value={form.venueContact} onChange={handleChange} />
                        </label>
                      </div>
                    </div>

                    {/* 03. Guest Details */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>03</span> Guest Details</p>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Total Guests *</span>
                          <input name="guests" type="text" placeholder="e.g. 150" value={form.guests} onChange={handleChange} required />
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Adults</span>
                          <input name="adultsCount" type="number" placeholder="Approx. adults" value={form.adultsCount} onChange={handleChange} />
                        </label>
                      </div>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Kids (0–3 years)</span>
                          <input name="kids0to3" type="number" placeholder="Count" value={form.kids0to3} onChange={handleChange} />
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Kids (4–8 years)</span>
                          <input name="kids4to8" type="number" placeholder="Count" value={form.kids4to8} onChange={handleChange} />
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Kids (9+ years)</span>
                          <input name="kids9plus" type="number" placeholder="Count" value={form.kids9plus} onChange={handleChange} />
                        </label>
                      </div>
                    </div>

                    {/* 04. Theme & Decor */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>04</span> Theme & Decor</p>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Preferred Theme</span>
                          <input name="theme" type="text" placeholder="e.g. Royal Gold, Jungle Safari, Vintage Floral" value={form.theme} onChange={handleChange} />
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Preferred Colours</span>
                          <input name="colours" type="text" placeholder="e.g. Pastel Pink, White & Gold, Emerald" value={form.colours} onChange={handleChange} />
                        </label>
                      </div>
                      <div className="form-fields-row">
                        <label className="booking-field full">
                          <span className="booking-field-label">Inspiration Photos / Reference Link</span>
                          <input name="inspirationPhoto" type="text" placeholder="Pinterest link, Drive link, or image reference" value={form.inspirationPhoto} onChange={handleChange} />
                        </label>
                      </div>
                      <label className="booking-field full">
                        <span className="booking-field-label">Decor Elements (Select all that apply)</span>
                        <div className="questionnaire-chips-grid">
                          {[
                            'Balloon Decor', 'Floral Decor', 'Entrance Decor', 'Welcome Board',
                            'Cake Table Decor', 'Stage/Backdrop', 'Ceiling Decor', 'Table Centrepieces',
                            'Photo Booth', 'Custom Name/Logo'
                          ].map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={(form.decorElements || []).includes(item) ? 'questionnaire-chip active' : 'questionnaire-chip'}
                              onClick={() => toggleDecorElement(item)}
                            >
                              {(form.decorElements || []).includes(item) ? '✓ ' : '+ '}{item}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="booking-field full" style={{ marginTop: '0.75rem' }}>
                        <span className="booking-field-label">Custom Name / Logo for Decor?</span>
                        <input name="customNameLogo" type="text" placeholder="e.g. 'Aarav turns 1' or 'S & V Wedding'" value={form.customNameLogo} onChange={handleChange} />
                      </label>
                    </div>

                    {/* 05. Entertainment */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>05</span> Entertainment</p>
                      <label className="booking-field full">
                        <span className="booking-field-label">Select all that apply:</span>
                        <div className="questionnaire-chips-grid">
                          {(isKidsOrBirthday
                            ? [
                                'Mascot', 'Magician', 'Puppet Show', 'Bubble Show', 'Tattoo Artist',
                                'Face Painting', 'Balloon Sculptor', 'Games Host', 'DJ', 'Music System',
                                'Dance Floor', 'Live Music', 'Trampoline', 'Bouncy Castle', 'Soft Play Area',
                                'Art & Craft'
                              ]
                            : [
                                'Games Host', 'DJ', 'Music System', 'Dance Floor', 'Live Music / Band',
                                'Saxophonist / Classical Ensemble', 'Celebrity Talent', 'Tattoo Artist',
                                'Face Painting', 'Photo Booth'
                              ]
                          ).map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={(form.entertainmentOptions || []).includes(item) ? 'questionnaire-chip active' : 'questionnaire-chip'}
                              onClick={() => toggleEntertainment(item)}
                            >
                              {(form.entertainmentOptions || []).includes(item) ? '✓ ' : '+ '}{item}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="booking-field full" style={{ marginTop: '0.75rem' }}>
                        <span className="booking-field-label">Other Entertainment Requests</span>
                        <input name="entertainmentOther" type="text" placeholder="Any specific artist, show or activity" value={form.entertainmentOther} onChange={handleChange} />
                      </label>
                    </div>

                    {/* 06. Food & Beverages */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>06</span> Food & Beverages</p>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Meal Service</span>
                          <div className="radio-group-lux">
                            {['Lunch', 'Dinner', 'High Tea', 'Snacks Only'].map((meal) => (
                              <button
                                key={meal}
                                type="button"
                                className={form.mealType === meal ? 'radio-card-lux active' : 'radio-card-lux'}
                                onClick={() => setForm((c) => ({ ...c, mealType: meal }))}
                              >
                                {meal}
                              </button>
                            ))}
                          </div>
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Dietary Preference</span>
                          <div className="radio-group-lux">
                            {['Pure Veg', 'Non-Veg', 'Both Veg & Non-Veg'].map((diet) => (
                              <button
                                key={diet}
                                type="button"
                                className={form.dietaryType === diet ? 'radio-card-lux active' : 'radio-card-lux'}
                                onClick={() => setForm((c) => ({ ...c, dietaryType: diet }))}
                              >
                                {diet}
                              </button>
                            ))}
                          </div>
                        </label>
                      </div>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Approximate Number for Catering</span>
                          <input name="cateringCount" type="text" placeholder="e.g. 120 plates" value={form.cateringCount} onChange={handleChange} />
                        </label>
                      </div>
                      <label className="booking-field full">
                        <span className="booking-field-label">Live Counters & Add-ons (Select all that apply)</span>
                        <div className="questionnaire-chips-grid">
                          {[
                            'Live Counters', 'Welcome Drinks', 'Starter Counters', 'Dessert Counter',
                            'Candy Cart', 'Popcorn', 'Cotton Candy', 'Ice Cream', 'Chocolate Fountain',
                            'Bar Management'
                          ].map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={(form.cateringAddons || []).includes(item) ? 'questionnaire-chip active' : 'questionnaire-chip'}
                              onClick={() => toggleCateringAddon(item)}
                            >
                              {(form.cateringAddons || []).includes(item) ? '✓ ' : '+ '}{item}
                            </button>
                          ))}
                        </div>
                      </label>
                      <label className="booking-field full" style={{ marginTop: '0.75rem' }}>
                        <span className="booking-field-label">Other Catering Requests</span>
                        <input name="cateringOther" type="text" placeholder="Any specific cuisine or live station" value={form.cateringOther} onChange={handleChange} />
                      </label>
                    </div>

                    {/* 07. Cake */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>07</span> Cake</p>
                      <label className="booking-field full">
                        <span className="booking-field-label">Cake Status</span>
                        <div className="radio-group-lux">
                          {['Already Booked', 'Need Royal Velvet to Arrange', 'Not Required'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={form.cakeStatus === opt ? 'radio-card-lux active' : 'radio-card-lux'}
                              onClick={() => setForm((c) => ({ ...c, cakeStatus: opt }))}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </label>
                      {form.cakeStatus !== 'Not Required' && (
                        <div className="form-fields-row" style={{ marginTop: '0.75rem' }}>
                          <label className="booking-field">
                            <span className="booking-field-label">Flavour</span>
                            <input name="cakeFlavour" type="text" placeholder="e.g. Belgian Chocolate, Vanilla Berry" value={form.cakeFlavour} onChange={handleChange} />
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Weight</span>
                            <select name="cakeWeight" value={form.cakeWeight} onChange={handleChange}>
                              <option value="">Select weight</option>
                              <option value="1 kg">1 kg</option>
                              <option value="2 kg">2 kg</option>
                              <option value="3 kg">3 kg</option>
                              <option value="5 kg+">5 kg+</option>
                              <option value="Custom multi-tier">Custom multi-tier</option>
                            </select>
                          </label>
                          <label className="booking-field">
                            <span className="booking-field-label">Design Reference / Notes</span>
                            <input name="cakeReference" type="text" placeholder="Design details or theme" value={form.cakeReference} onChange={handleChange} />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* 08. Photography & Videography */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>08</span> Photography & Videography</p>
                      <label className="booking-field full">
                        <span className="booking-field-label">Select all that apply:</span>
                        <div className="questionnaire-chips-grid">
                          {[
                            'Traditional Photography', 'Traditional Videography', 'Candid Photography',
                            'Cinematic Film', 'Drone (if permitted)', 'Instant Prints', 'Photo Booth'
                          ].map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={(form.mediaOptions || []).includes(item) ? 'questionnaire-chip active' : 'questionnaire-chip'}
                              onClick={() => toggleMediaOption(item)}
                            >
                              {(form.mediaOptions || []).includes(item) ? '✓ ' : '+ '}{item}
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>

                    {/* 09. Return Gifts */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>09</span> Return Gifts</p>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Need us to arrange return gifts?</span>
                          <div className="radio-group-lux">
                            {['Yes', 'No', 'Exploring Options'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className={form.giftsNeeded === opt ? 'radio-card-lux active' : 'radio-card-lux'}
                                onClick={() => setForm((c) => ({ ...c, giftsNeeded: opt }))}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </label>
                        {form.giftsNeeded !== 'No' && (
                          <label className="booking-field">
                            <span className="booking-field-label">Approximate Budget Per Gift</span>
                            <select name="giftBudget" value={form.giftBudget} onChange={handleChange}>
                              <option value="">Select budget</option>
                              <option value="Under ₹200">Under ₹200</option>
                              <option value="₹200–₹500">₹200–₹500</option>
                              <option value="₹500–₹1,000">₹500–₹1,000</option>
                              <option value="₹1,000+">₹1,000+</option>
                            </select>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* 10. Overall Budget */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>10</span> Overall Budget</p>
                      <label className="booking-field full">
                        <span className="booking-field-label">What is your approximate overall budget for the event?</span>
                        <div className="radio-group-lux">
                          {[
                            'Under ₹50,000', '₹50,000–₹1 lakh', '₹1–2 lakhs',
                            '₹2–5 lakhs', '₹5 lakhs+'
                          ].map((b) => (
                            <button
                              key={b}
                              type="button"
                              className={form.budget === b ? 'radio-card-lux active' : 'radio-card-lux'}
                              onClick={() => setForm((c) => ({ ...c, budget: b }))}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>

                    {/* 11. Decision Making */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>11</span> Decision Making</p>
                      <div className="form-fields-row">
                        <label className="booking-field">
                          <span className="booking-field-label">Who will finalize the event?</span>
                          <select name="decisionMaker" value={form.decisionMaker} onChange={handleChange}>
                            <option value="">Select decision maker</option>
                            <option value="Self">Self</option>
                            <option value="Spouse / Partner">Spouse / Partner</option>
                            <option value="Parents / Family">Parents / Family</option>
                            <option value="Event Committee">Event Committee</option>
                          </select>
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">By when would you like to confirm?</span>
                          <select name="confirmationTimeline" value={form.confirmationTimeline} onChange={handleChange}>
                            <option value="">Select timeline</option>
                            <option value="Immediately">Immediately</option>
                            <option value="Within 1 week">Within 1 week</option>
                            <option value="Within 2 weeks">Within 2 weeks</option>
                            <option value="Just exploring">Just exploring</option>
                          </select>
                        </label>
                        <label className="booking-field">
                          <span className="booking-field-label">Spoken to any other planners?</span>
                          <div className="radio-group-lux">
                            {['Yes', 'No'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className={form.spokenOtherPlanners === opt ? 'radio-card-lux active' : 'radio-card-lux'}
                                onClick={() => setForm((c) => ({ ...c, spokenOtherPlanners: opt }))}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* 12. Additional Information */}
                    <div className="form-section-block">
                      <p className="form-step-label"><span>12</span> Additional Information</p>
                      <label className="booking-field full">
                        <span className="booking-field-label">Special Requests / Dietary Restrictions / Surprise Elements / Notes</span>
                        <textarea
                          name="specialRequests"
                          rows={4}
                          placeholder="Tell us any dietary restrictions, surprise elements, or specific ideas you'd like us to know..."
                          value={form.specialRequests}
                          onChange={handleChange}
                        />
                      </label>
                    </div>

                    {submitError && <p className="booking-form-error">{submitError}</p>}

                    <button className="btn btn-primary booking-submit" type="submit" disabled={submitting} aria-busy={submitting}>
                      {submitting ? 'Submitting Proposal Request…' : 'Submit Inquiry & Proposal Request'} <FaArrowRight />
                    </button>
                    <p className="booking-form-note">Thank you for sharing your vision. Our team will contact you within 24 hours.</p>
                  </>
                )}
              </m.form>
            </div>
          </section>
        </main>

        <footer className="luxury-footer" style={{ marginTop: '4rem' }}>
          <div className="footer-brand">
            <div className="footer-logo-panel">
              <img src="/assets/the-royal-velvet-main-logo-web.png" alt="The Royal Velvet logo" width={900} height={900} loading="lazy" decoding="async" />
            </div>
            <strong>The Royal Velvet</strong>
            <img className="footer-tagline-img" src="/assets/effortlessly-lavish-lettering.png" alt="" aria-hidden="true" width={1277} height={237} loading="lazy" decoding="async" />
            <p>Curators of Extraordinary Celebrations for India's Most Distinguished Families & Brands.</p>
          </div>

          <div>
            <h3>Connect</h3>
            <div className="social-links">
              <a href="https://instagram.com/theroyalvelvet.events" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://wa.me/919880541336" target="_blank" rel="noreferrer" aria-label="WhatsApp"><FaWhatsapp /></a>
              <a href="tel:+919880541336" aria-label="Phone"><FaPhoneAlt /></a>
            </div>
            <div className="footer-contact-lines">
              <a href="tel:+919880541336">+91 98805 41336</a>
            </div>
            <p>HSR Layout, Bangalore, India</p>
          </div>

          <div>
            <h3>Navigate</h3>
            <div className="footer-nav">
              <a href="/">Home</a>
              <a href="/#about">Our Story</a>
              <a href="/#services">Services</a>
              <a href="/booking">Book Consultation</a>
            </div>
          </div>
        </footer>
        <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid rgba(212, 175, 55, 0.15)', color: 'var(--muted)', fontSize: '0.85rem' }}>
          <p>© 2026 {BRAND_NAME}. All rights reserved.</p>
        </div>
      </div>
    </LazyMotion>
  )
}
