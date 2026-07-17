import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from 'vite'
import {
  BRAND_DESCRIPTION,
  BRAND_NAME,
  PUBLIC_SEO,
  SECTION_PATHS,
  SEO_IMAGE,
  SITE_LAST_UPDATED,
  SITE_URL,
} from '../src/lib/seo.js'

const distDir = path.resolve('dist')
const sourceHtml = await readFile(path.join(distDir, 'index.html'), 'utf8')
const generatedAt = new Date().toISOString()
const generatedDate = generatedAt.slice(0, 10)
const env = loadEnv('production', process.cwd(), '')
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const escapeXml = (value = '') => escapeHtml(value).replaceAll("'", '&apos;')
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const compactText = (value = '', fallback = '') => String(value || fallback).replace(/\s+/g, ' ').trim()
const asDate = (value = SITE_LAST_UPDATED) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : SITE_LAST_UPDATED
}
const slugify = (value = '') => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 90)

function replaceMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${escapeRegex(key)}["'][\\s\\S]*?>`, 'i')
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`
  if (!pattern.test(html)) throw new Error(`Missing ${attribute} metadata: ${key}`)
  return html.replace(pattern, tag)
}

function replaceCanonical(html, href) {
  const pattern = /<link\s+rel=["']canonical["'][\s\S]*?>/i
  if (!pattern.test(html)) throw new Error('Missing canonical link')
  return html.replace(pattern, `<link rel="canonical" href="${escapeHtml(href)}" />`)
}

function baseSiteSchema(html) {
  const pattern = /<script\s+type=["']application\/ld\+json["']\s+id=["']site-structured-data["']>([\s\S]*?)<\/script>/i
  const match = html.match(pattern)
  if (!match) throw new Error('Missing site-structured-data JSON-LD')
  const schema = JSON.parse(match[1])
  schema['@graph'] = (schema['@graph'] || []).filter((item) => {
    const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
    return !types.some((type) => ['WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ImageGallery'].includes(type))
  })
  const website = schema['@graph'].find((item) => item['@type'] === 'WebSite')
  if (website) website.dateModified = SITE_LAST_UPDATED
  return { pattern, schema }
}

function routeSchema(key, seo, url) {
  const isHome = key === 'home'
  const pageType = seo.schemaType === 'Service' ? 'WebPage' : (seo.schemaType || 'WebPage')
  const pageName = seo.title.split('|')[0].trim()
  const page = {
    '@type': pageType,
    '@id': `${url}#webpage`,
    url,
    name: seo.title,
    headline: pageName,
    description: seo.description,
    abstract: seo.answer || seo.description,
    keywords: seo.keywords,
    inLanguage: 'en-IN',
    datePublished: '2026-03-20',
    dateModified: SITE_LAST_UPDATED,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#business` },
    publisher: { '@id': `${SITE_URL}/#business` },
    primaryImageOfPage: { '@type': 'ImageObject', url: SEO_IMAGE, width: 900, height: 900 },
    spatialCoverage: { '@type': 'Country', name: 'India' },
    audience: { '@type': 'Audience', audienceType: 'Families, founders, corporate teams, luxury clients, and private hosts in India' },
    potentialAction: { '@type': 'CommunicateAction', name: 'Request a private luxury event consultation', target: `${SITE_URL}/book-consultation` },
  }

  const graph = [
    page,
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        ...(isHome ? [] : [{ '@type': 'ListItem', position: 2, name: pageName, item: url }]),
      ],
    },
  ]

  if (seo.schemaType === 'Service') {
    page.mainEntity = { '@id': `${url}#service` }
    graph.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: pageName,
      alternateName: `${BRAND_NAME} ${pageName}`,
      description: seo.description,
      serviceType: pageName,
      url,
      image: SEO_IMAGE,
      provider: { '@id': `${SITE_URL}/#business` },
      areaServed: { '@type': 'Country', name: 'India' },
      availableChannel: { '@type': 'ServiceChannel', serviceUrl: `${SITE_URL}/book-consultation` },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'INR',
          description: 'Bespoke pricing is confirmed privately according to event scale, location, guest profile, service mix, and production requirements.',
        },
      },
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

function renderRoute(key, seo) {
  const routePath = SECTION_PATHS[key]
  const url = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
  let html = sourceHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`)
  html = replaceCanonical(html, url)
  html = replaceMeta(html, 'name', 'description', seo.description)
  html = replaceMeta(html, 'name', 'keywords', seo.keywords)
  html = replaceMeta(html, 'name', 'abstract', `${BRAND_DESCRIPTION} ${seo.answer || seo.description}`)
  html = replaceMeta(html, 'name', 'DC.title', seo.title)
  html = replaceMeta(html, 'name', 'DC.description', seo.description)
  html = replaceMeta(html, 'name', 'date', SITE_LAST_UPDATED)
  html = replaceMeta(html, 'name', 'last-modified', SITE_LAST_UPDATED)
  html = replaceMeta(html, 'name', 'ai-summary', seo.answer || seo.description)
  html = replaceMeta(html, 'property', 'og:url', url)
  html = replaceMeta(html, 'property', 'og:title', seo.title)
  html = replaceMeta(html, 'property', 'og:description', seo.description)
  html = replaceMeta(html, 'property', 'og:updated_time', SITE_LAST_UPDATED)
  html = replaceMeta(html, 'name', 'twitter:title', seo.title)
  html = replaceMeta(html, 'name', 'twitter:description', seo.description)
  html = replaceMeta(html, 'itemprop', 'dateModified', SITE_LAST_UPDATED)
  const { pattern, schema } = baseSiteSchema(html)
  html = html.replace(pattern, `<script type="application/ld+json" id="site-structured-data">${JSON.stringify(schema)}</script>`)
  const data = `<script type="application/ld+json" id="static-route-structured-data">${JSON.stringify(routeSchema(key, seo, url))}</script>`
  return html.replace('</head>', `  ${data}\n  </head>`)
}

function normalizeProject(row = {}) {
  const images = (row.gallery_project_images || row.images || [])
    .map((image) => ({
      id: image.id,
      url: image.url || image.src || image.image_url || image.public_url || '',
      name: compactText(image.name || image.alt, 'Project visual'),
      alt: compactText(image.alt || image.name, 'The Royal Velvet luxury event project visual'),
      caption: compactText(image.caption || image.alt || image.name, 'The Royal Velvet luxury event project visual'),
      sortOrder: Number(image.sort_order ?? image.sortOrder ?? 0),
    }))
    .filter((image) => image.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    id: row.id,
    title: compactText(row.title || row.name, 'The Royal Velvet Project'),
    slug: slugify(row.slug || row.title || row.name) || `project-${String(row.id || '').slice(0, 8)}`,
    description: compactText(row.description, 'A completed luxury celebration curated by The Royal Velvet.'),
    location: compactText(row.location, 'India'),
    category: compactText(row.category, 'Luxury Celebration'),
    seoTitle: compactText(row.seo_title || row.seoTitle),
    seoDescription: compactText(row.seo_description || row.seoDescription),
    projectDate: row.project_date || row.projectDate || '',
    publishedAt: row.published_at || row.publishedAt || row.created_at || '',
    updatedAt: row.updated_at || row.updatedAt || row.published_at || row.created_at || '',
    images,
  }
}

async function fetchSupabaseTable(table, query) {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  })
  if (!response.ok) throw new Error(`${table} returned HTTP ${response.status}`)
  return response.json()
}

async function fetchCmsSeoData() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('CMS SEO generation skipped: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is unavailable.')
    return { projects: [], destinations: [], services: [], testimonials: [], story: null, cmsAvailable: false, errors: ['Supabase environment is unavailable'] }
  }

  const requests = {
    projects: fetchSupabaseTable('gallery_projects', 'select=*,gallery_project_images(*)&is_published=eq.true&order=is_featured.desc,sort_order.asc,project_date.desc'),
    destinations: fetchSupabaseTable('destination_images', 'select=*&order=sort_order.asc,updated_at.desc'),
    services: fetchSupabaseTable('services', 'select=*&is_published=eq.true&order=sort_order.asc,created_at.desc'),
    testimonials: fetchSupabaseTable('testimonials', 'select=*&is_published=eq.true&order=created_at.desc'),
    story: fetchSupabaseTable('our_story_settings', 'select=*&id=eq.main&limit=1'),
  }
  const entries = await Promise.all(Object.entries(requests).map(async ([key, request]) => {
    try {
      return [key, await request, null]
    } catch (error) {
      return [key, [], `${key}: ${error.message}`]
    }
  }))
  const rows = Object.fromEntries(entries.map(([key, value]) => [key, value]))
  const errors = entries.map(([, , error]) => error).filter(Boolean)
  errors.forEach((error) => console.warn(`CMS SEO source skipped: ${error}`))

  return {
    projects: rows.projects.map(normalizeProject).filter((project) => project.slug && project.images.length),
    destinations: rows.destinations.map((row) => ({
      name: compactText(row.destination_name || row.destinationName || row.name, 'Luxury Destination'),
      url: row.url || row.src || row.image_url || row.public_url || '',
      alt: compactText(row.alt || row.title || row.destination_name || row.name, 'The Royal Velvet luxury destination wedding setting'),
      updatedAt: row.updated_at || row.created_at || '',
    })).filter((item) => item.url),
    services: rows.services.map((row) => ({
      name: compactText(row.title || row.name, 'Curated Service'),
      description: compactText(row.description || row.text, 'A bespoke service curated by The Royal Velvet.'),
      category: compactText(row.card_title || row.category_id, 'Luxury Event Services'),
      updatedAt: row.updated_at || row.created_at || '',
    })),
    testimonials: rows.testimonials.map((row) => ({
      name: compactText(row.name, 'Private Client'),
      role: compactText(row.role, 'The Royal Velvet Client'),
      city: compactText(row.city, 'India'),
      quote: compactText(row.quote),
      rating: Math.max(1, Math.min(5, Number(row.rating) || 5)),
      publishedAt: row.created_at || '',
    })).filter((item) => item.quote),
    story: rows.story[0] ? {
      founderName: compactText(rows.story[0].founder_name, 'Vijaya H Reddy'),
      founderRole: compactText(rows.story[0].founder_role, 'Founder & Creative Director'),
      eventsCompleted: Number(rows.story[0].events_completed) || 0,
      citiesServed: Number(rows.story[0].cities_served) || 0,
      specializedServices: Number(rows.story[0].specialized_services) || 0,
      clientSatisfaction: Number(rows.story[0].client_satisfaction) || 0,
      updatedAt: rows.story[0].updated_at || '',
    } : null,
    cmsAvailable: entries.some(([, , error]) => !error),
    errors,
  }
}

function projectSchema(project, url, title, description, image) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['CollectionPage', 'ImageGallery'],
        '@id': `${url}#webpage`,
        url,
        name: title,
        headline: project.title,
        description,
        image: project.images.map((item) => item.url),
        primaryImageOfPage: { '@type': 'ImageObject', contentUrl: image, caption: project.images[0]?.caption || project.title },
        dateCreated: project.projectDate || project.publishedAt || undefined,
        datePublished: project.publishedAt || project.projectDate || undefined,
        dateModified: project.updatedAt || project.publishedAt || SITE_LAST_UPDATED,
        genre: project.category,
        contentLocation: { '@type': 'Place', name: project.location },
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#business` },
        publisher: { '@id': `${SITE_URL}/#business` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: project.images.length,
          itemListElement: project.images.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'ImageObject',
              contentUrl: item.url,
              name: item.name,
              caption: item.caption,
              representativeOfPage: index === 0,
              creator: { '@id': `${SITE_URL}/#business` },
              copyrightHolder: { '@id': `${SITE_URL}/#business` },
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Gallery', item: `${SITE_URL}/gallery` },
          { '@type': 'ListItem', position: 3, name: project.title, item: url },
        ],
      },
    ],
  }
}

function renderProject(project) {
  const url = `${SITE_URL}/projects/${project.slug}`
  const title = compactText(project.seoTitle, `${project.title} | The Royal Velvet Project`).slice(0, 70)
  const description = compactText(project.seoDescription, project.description).slice(0, 170)
  const image = project.images[0]?.url || SEO_IMAGE
  let html = sourceHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  html = replaceCanonical(html, url)
  html = replaceMeta(html, 'name', 'description', description)
  html = replaceMeta(html, 'name', 'keywords', `${project.title}, ${project.category}, ${project.location}, luxury event project India, The Royal Velvet gallery`)
  html = replaceMeta(html, 'name', 'abstract', `${project.description} ${BRAND_DESCRIPTION}`)
  html = replaceMeta(html, 'name', 'DC.title', title)
  html = replaceMeta(html, 'name', 'DC.description', description)
  html = replaceMeta(html, 'name', 'date', asDate(project.publishedAt || project.projectDate))
  html = replaceMeta(html, 'name', 'last-modified', asDate(project.updatedAt))
  html = replaceMeta(html, 'name', 'ai-summary', description)
  html = replaceMeta(html, 'property', 'og:type', 'article')
  html = replaceMeta(html, 'property', 'og:url', url)
  html = replaceMeta(html, 'property', 'og:title', title)
  html = replaceMeta(html, 'property', 'og:description', description)
  html = replaceMeta(html, 'property', 'og:updated_time', project.updatedAt || SITE_LAST_UPDATED)
  html = replaceMeta(html, 'property', 'og:image', image)
  html = replaceMeta(html, 'property', 'og:image:secure_url', image)
  html = replaceMeta(html, 'property', 'og:image:alt', project.images[0]?.alt || project.title)
  html = replaceMeta(html, 'name', 'twitter:title', title)
  html = replaceMeta(html, 'name', 'twitter:description', description)
  html = replaceMeta(html, 'name', 'twitter:image', image)
  html = replaceMeta(html, 'name', 'thumbnail', image)
  html = replaceMeta(html, 'itemprop', 'image', image)
  html = replaceMeta(html, 'itemprop', 'dateModified', asDate(project.updatedAt))
  const { pattern, schema } = baseSiteSchema(html)
  html = html.replace(pattern, `<script type="application/ld+json" id="site-structured-data">${JSON.stringify(schema)}</script>`)
  html = html.replace('</head>', `  <link rel="preload" as="image" href="${escapeHtml(image)}" fetchpriority="high" />\n  <script type="application/ld+json" id="static-route-structured-data">${JSON.stringify(projectSchema(project, url, title, description, image))}</script>\n  </head>`)
  const noscript = `<noscript><article><h1>${escapeHtml(project.title)}</h1><p>${escapeHtml(project.description)}</p><p>${escapeHtml(project.category)} &middot; ${escapeHtml(project.location)}</p>${project.images.map((item) => `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt)}" />`).join('')}</article></noscript>`
  return html.replace('</body>', `${noscript}\n</body>`)
}

function buildAiContentFeed(cms) {
  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    canonicalWebsite: `${SITE_URL}/`,
    brand: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    publicSourceOnly: true,
    importantPages: Object.entries(PUBLIC_SEO).map(([key, seo]) => ({
      name: seo.title.split('|')[0].trim(),
      url: SECTION_PATHS[key] === '/' ? `${SITE_URL}/` : `${SITE_URL}${SECTION_PATHS[key]}`,
      description: seo.answer || seo.description,
    })),
    projects: cms.projects.map((project) => ({
      name: project.title,
      url: `${SITE_URL}/projects/${project.slug}`,
      description: project.description,
      category: project.category,
      location: project.location,
      date: project.projectDate || project.publishedAt || null,
      imageCount: project.images.length,
      images: project.images.map((image) => ({ url: image.url, caption: image.caption, alt: image.alt })),
    })),
    destinationImages: cms.destinations.map((item) => ({ name: item.name, image: item.url, alt: item.alt })),
    services: cms.services,
    clientStories: cms.testimonials,
    publicStoryMetrics: cms.story,
  }
}

function buildCmsLlms(cms) {
  const lines = [
    '# The Royal Velvet - Live Public CMS Knowledge',
    '',
    `> Generated automatically from public, admin-published content on ${new Date().toISOString()}.`,
    '',
    'This file is a discovery aid. Canonical webpages and their structured data remain the authoritative sources.',
    '',
    '## Published project archive',
  ]
  if (!cms.projects.length) lines.push('- No public projects are currently published.')
  cms.projects.forEach((project) => {
    lines.push(`- [${project.title}](${SITE_URL}/projects/${project.slug}) - ${project.description} Category: ${project.category}. Location: ${project.location}. ${project.images.length} curated images.`)
  })
  lines.push('', '## Admin-published services')
  if (!cms.services.length) lines.push('- No additional admin-published services are currently available.')
  cms.services.forEach((service) => lines.push(`- ${service.name} (${service.category}): ${service.description}`))
  lines.push('', '## Destination visual coverage')
  if (!cms.destinations.length) lines.push('- Destination visuals are awaiting publication.')
  cms.destinations.forEach((destination) => lines.push(`- ${destination.name}: ${destination.alt}`))
  lines.push('', '## Published client stories')
  if (!cms.testimonials.length) lines.push('- No additional public client stories are currently published.')
  cms.testimonials.forEach((testimonial) => lines.push(`- ${testimonial.name}, ${testimonial.city} (${testimonial.rating}/5): ${testimonial.quote}`))
  if (cms.story) {
    lines.push('', '## Current public company facts')
    lines.push(`- Founder: ${cms.story.founderName}, ${cms.story.founderRole}`)
    lines.push(`- Celebrations completed: ${cms.story.eventsCompleted}+`)
    lines.push(`- Cities served: ${cms.story.citiesServed}+`)
    lines.push(`- Specialized services: ${cms.story.specializedServices}+`)
    lines.push(`- Client satisfaction: ${cms.story.clientSatisfaction}%`)
  }
  lines.push('', `- [Canonical sitemap](${SITE_URL}/sitemap.xml)`, `- [Machine-readable live content feed](${SITE_URL}/ai-content-feed.json)`, '')
  return `${lines.join('\n')}\n`
}

const documentationPages = [
  ['faq.html', 'monthly', '0.6'],
  ['why-choose-us.html', 'monthly', '0.6'],
  ['service-brochure.html', 'monthly', '0.7'],
  ['privacy-policy.html', 'yearly', '0.3'],
  ['terms.html', 'yearly', '0.3'],
  ['cancellation-policy.html', 'yearly', '0.3'],
]

function sitemapUrl({ loc, lastmod = SITE_LAST_UPDATED, changefreq = 'monthly', priority = '0.7', images = [] }) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(asDate(lastmod))}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>${images.map((image) => `\n    <image:image>\n      <image:loc>${escapeXml(image.url)}</image:loc>\n      <image:title>${escapeXml(image.name || image.alt)}</image:title>\n      <image:caption>${escapeXml(image.caption || image.alt || image.name)}</image:caption>\n    </image:image>`).join('')}\n  </url>`
}

function urlset(entries = []) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join('\n')}\n</urlset>\n`
}

for (const [key, seo] of Object.entries(PUBLIC_SEO)) {
  const routePath = SECTION_PATHS[key]
  if (!routePath) continue
  const target = routePath === '/' ? path.join(distDir, 'index.html') : path.join(distDir, routePath.slice(1), 'index.html')
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, renderRoute(key, seo), 'utf8')
}

const cms = await fetchCmsSeoData()
for (const project of cms.projects) {
  const target = path.join(distDir, 'projects', project.slug, 'index.html')
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, renderProject(project), 'utf8')
}

const aiContentFeed = buildAiContentFeed(cms)
const cmsLlms = buildCmsLlms(cms)
await writeFile(path.join(distDir, 'ai-content-feed.json'), `${JSON.stringify(aiContentFeed, null, 2)}\n`, 'utf8')
await writeFile(path.join(distDir, 'llms-cms.txt'), cmsLlms, 'utf8')
for (const filename of ['llms.txt', 'llms-full.txt']) {
  const target = path.join(distDir, filename)
  const current = await readFile(target, 'utf8')
  const marker = '\n## Live admin-published public content\n'
  const base = current.includes(marker) ? current.split(marker)[0].trimEnd() : current.trimEnd()
  await writeFile(target, `${base}${marker}\n- [Live CMS knowledge file](${SITE_URL}/llms-cms.txt)\n- [Machine-readable live content feed](${SITE_URL}/ai-content-feed.json)\n- [Published project image sitemap](${SITE_URL}/sitemaps/projects.xml)\n`, 'utf8')
}

const pageEntries = Object.entries(PUBLIC_SEO).map(([key]) => {
  const routePath = SECTION_PATHS[key]
  const loc = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
  const images = key === 'home' ? [{ url: SEO_IMAGE, name: `${BRAND_NAME} luxury event management company`, caption: `${BRAND_NAME} full brand logo on a velvet burgundy background` }] : []
  return sitemapUrl({ loc, changefreq: ['home', 'events', 'services', 'gallery'].includes(key) ? 'weekly' : 'monthly', priority: key === 'home' ? '1.0' : '0.8', images })
})
documentationPages.forEach(([file, changefreq, priority]) => pageEntries.push(sitemapUrl({ loc: `${SITE_URL}/${file}`, changefreq, priority })))

const projectEntries = cms.projects.map((project) => sitemapUrl({
  loc: `${SITE_URL}/projects/${project.slug}`,
  lastmod: project.updatedAt || project.publishedAt || project.projectDate,
  changefreq: 'monthly',
  priority: '0.8',
  images: project.images,
}))

const destinationEntries = [sitemapUrl({
  loc: `${SITE_URL}/destination-weddings`,
  lastmod: cms.destinations.reduce((latest, item) => item.updatedAt > latest ? item.updatedAt : latest, SITE_LAST_UPDATED),
  changefreq: 'weekly',
  priority: '0.9',
  images: cms.destinations.map((item) => ({ url: item.url, name: `${item.name} luxury destination`, alt: item.alt, caption: item.alt })),
})]

await mkdir(path.join(distDir, 'sitemaps'), { recursive: true })
await writeFile(path.join(distDir, 'sitemaps', 'pages.xml'), urlset(pageEntries), 'utf8')
await writeFile(path.join(distDir, 'sitemaps', 'projects.xml'), urlset(projectEntries), 'utf8')
await writeFile(path.join(distDir, 'sitemaps', 'destinations.xml'), urlset(destinationEntries), 'utf8')
await writeFile(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${SITE_URL}/sitemaps/pages.xml</loc><lastmod>${generatedDate}</lastmod></sitemap>\n  <sitemap><loc>${SITE_URL}/sitemaps/projects.xml</loc><lastmod>${generatedDate}</lastmod></sitemap>\n  <sitemap><loc>${SITE_URL}/sitemaps/destinations.xml</loc><lastmod>${generatedDate}</lastmod></sitemap>\n</sitemapindex>\n`, 'utf8')

const manifest = {
  siteUrl: SITE_URL,
  generatedAt,
  cmsAvailable: cms.cmsAvailable,
  cmsErrors: cms.errors || [],
  staticRoutes: Object.values(SECTION_PATHS),
  documentationPages: documentationPages.map(([file]) => `/${file}`),
  projects: cms.projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    url: `${SITE_URL}/projects/${project.slug}`,
    imageCount: project.images.length,
    imageUrls: project.images.map((image) => image.url),
  })),
  destinationImageCount: cms.destinations.length,
  serviceCount: cms.services.length,
  testimonialCount: cms.testimonials.length,
  hasStoryMetrics: Boolean(cms.story),
}
await writeFile(path.join(distDir, 'seo-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(`Generated ${Object.keys(PUBLIC_SEO).length} static routes, ${cms.projects.length} project pages, ${cms.destinations.length} destination images, ${cms.services.length} services, and ${cms.testimonials.length} client stories for ${SITE_URL}`)
