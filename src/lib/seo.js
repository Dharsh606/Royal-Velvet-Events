export const SITE_URL = 'https://www.royalvelveteventz.com'
export const SEO_IMAGE = `${SITE_URL}/assets/the-royal-velvet-seo-logo-2026.png`

export const SECTION_PATHS = {
  home: '/',
  about: '/our-story',
  events: '/events',
  services: '/services',
  gallery: '/gallery',
  artists: '/artists-and-talent',
  milestone: '/legacy',
  careers: '/careers',
  booking: '/book-consultation',
  contact: '/contact',
}

const PATH_SECTIONS = {
  '/': 'home',
  '/home': 'home',
  '/about': 'about',
  '/our-story': 'about',
  '/events': 'events',
  '/services': 'services',
  '/gallery': 'gallery',
  '/artists': 'artists',
  '/artists-and-talent': 'artists',
  '/milestone': 'milestone',
  '/legacy': 'milestone',
  '/careers': 'careers',
  '/booking': 'booking',
  '/book-consultation': 'booking',
  '/contact': 'contact',
}

export const PUBLIC_SEO = {
  home: {
    title: 'The Royal Velvet | Luxury Event Management in Bangalore',
    description: "The Royal Velvet curates luxury weddings, corporate events, destination celebrations, and bespoke experiences across Bangalore and India.",
    keywords: 'luxury event management Bangalore, luxury wedding planner Bangalore, premium event planner India, The Royal Velvet',
    schemaType: 'WebPage',
  },
  about: {
    title: 'Our Story | Luxury Celebration Architects | The Royal Velvet',
    description: "Discover The Royal Velvet's vision, founder-led approach, cultural sensitivity, and private celebration design philosophy for distinguished families and brands.",
    keywords: 'The Royal Velvet story, luxury celebration architects, luxury event company Bangalore, Vijaya H Reddy',
    schemaType: 'AboutPage',
  },
  events: {
    title: 'Luxury Event Packages Across India | The Royal Velvet',
    description: 'Explore curated wedding, destination, ceremonial, family, corporate, and private celebration packages designed with impeccable detail across India.',
    keywords: 'luxury wedding packages India, destination wedding packages, Indian ceremony planning, corporate event packages',
    schemaType: 'CollectionPage',
  },
  services: {
    title: 'Luxury Event Planning Services | The Royal Velvet',
    description: 'Bespoke event design, hospitality, entertainment, celebrity management, rituals, photography, travel, decor, and end-to-end production across India.',
    keywords: 'luxury event services Bangalore, wedding decor services, celebrity management, event hospitality, premium event production',
    schemaType: 'CollectionPage',
  },
  gallery: {
    title: 'Luxury Event Gallery & Portfolio | The Royal Velvet',
    description: 'Enter The Royal Velvet visual archive of luxury weddings, ceremonial settings, private celebrations, floral worlds, and premium event production.',
    keywords: 'luxury wedding gallery Bangalore, event decor portfolio, Indian wedding inspiration, luxury celebration photography',
    schemaType: 'CollectionPage',
  },
  artists: {
    title: 'Artists, Entertainment & Celebrity Talent | The Royal Velvet',
    description: 'Discover curated artists, hosts, DJs, classical ensembles, choreographers, celebrity talent, and performance direction for luxury events across India.',
    keywords: 'event artists India, celebrity management events, wedding entertainment Bangalore, luxury event performers',
    schemaType: 'CollectionPage',
  },
  milestone: {
    title: 'Our Legacy & Celebration Standards | The Royal Velvet',
    description: 'Explore the values, cultural intelligence, hospitality discipline, design standards, and enduring trust shaping The Royal Velvet celebration house.',
    keywords: 'luxury event legacy India, premium event standards, Indian celebration heritage, trusted event planner Bangalore',
    schemaType: 'AboutPage',
  },
  careers: {
    title: 'Careers in Luxury Event Management | The Royal Velvet',
    description: 'Explore opportunities to join The Royal Velvet across luxury event planning, design, hospitality, production, and celebration operations in India.',
    keywords: 'event management careers Bangalore, wedding planner jobs, luxury events careers India',
    schemaType: 'WebPage',
  },
  booking: {
    title: 'Book a Private Event Consultation | The Royal Velvet',
    description: 'Request a private consultation for a luxury wedding, destination celebration, corporate event, ceremonial occasion, or bespoke experience in India.',
    keywords: 'book luxury event planner Bangalore, wedding consultation, destination wedding inquiry, private event consultation India',
    schemaType: 'ContactPage',
  },
  contact: {
    title: 'Contact The Royal Velvet | Luxury Event Planner Bangalore',
    description: 'Contact The Royal Velvet in Bangalore to discuss luxury weddings, corporate events, destination celebrations, cultural ceremonies, and private occasions.',
    keywords: 'contact luxury event planner Bangalore, event management company HSR Layout, wedding planner contact Bangalore',
    schemaType: 'ContactPage',
  },
}

function normalizedPath(pathname = '/') {
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '')
  return clean || '/'
}

export function getSectionFromPath(pathname = '/') {
  return PATH_SECTIONS[normalizedPath(pathname)] || 'home'
}

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url) {
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
}

function setRouteStructuredData({ title, description, url, schemaType }) {
  let script = document.getElementById('route-structured-data')
  if (!script) {
    script = document.createElement('script')
    script.id = 'route-structured-data'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': schemaType || 'WebPage',
    name: title,
    description,
    url,
    isPartOf: { '@type': 'WebSite', name: 'The Royal Velvet', url: SITE_URL },
    primaryImageOfPage: { '@type': 'ImageObject', url: SEO_IMAGE },
  })
}

export function applyPublicSeo(section = 'home') {
  const key = PUBLIC_SEO[section] ? section : 'home'
  const seo = PUBLIC_SEO[key]
  const url = `${SITE_URL}${SECTION_PATHS[key]}`

  document.title = seo.title
  document.documentElement.lang = 'en-IN'
  setCanonical(url)
  setMeta('name', 'description', seo.description)
  setMeta('name', 'keywords', seo.keywords)
  setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
  setMeta('name', 'googlebot', 'index, follow, max-image-preview:large')
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:site_name', 'The Royal Velvet')
  setMeta('property', 'og:locale', 'en_IN')
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:title', seo.title)
  setMeta('property', 'og:description', seo.description)
  setMeta('property', 'og:image', SEO_IMAGE)
  setMeta('property', 'og:image:alt', 'The Royal Velvet luxury event management logo')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', seo.title)
  setMeta('name', 'twitter:description', seo.description)
  setMeta('name', 'twitter:image', SEO_IMAGE)
  setRouteStructuredData({ ...seo, url })
}

export function applyAdminSeo() {
  const title = 'Secure Admin Portal | The Royal Velvet'
  const description = 'Restricted administration portal for The Royal Velvet authorized team.'
  const url = `${SITE_URL}/admin`
  document.title = title
  setCanonical(url)
  setMeta('name', 'description', description)
  setMeta('name', 'robots', 'noindex, nofollow, noarchive, nosnippet, noimageindex')
  setMeta('name', 'googlebot', 'noindex, nofollow, noarchive, nosnippet, noimageindex')
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  document.getElementById('route-structured-data')?.remove()
}
