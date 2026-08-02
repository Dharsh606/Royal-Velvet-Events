import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PUBLIC_SEO, SECTION_PATHS, SITE_URL } from '../src/lib/seo.js'

const distDir = path.resolve('dist')
const errors = []
const seenTitles = new Map()
const seenDescriptions = new Map()
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

function readTag(html, pattern, label, routePath) {
  const match = html.match(pattern)
  if (!match) errors.push(`${routePath}: missing ${label}`)
  return match?.[1]?.trim() || ''
}

function validateJsonLd(html, routePath) {
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  if (!scripts.length) errors.push(`${routePath}: no structured data found`)
  scripts.forEach((match, index) => {
    try {
      JSON.parse(match[1])
    } catch (error) {
      errors.push(`${routePath}: invalid JSON-LD script ${index + 1}: ${error.message}`)
    }
  })
  if (!html.includes('id="static-route-structured-data"')) errors.push(`${routePath}: missing route-specific static JSON-LD`)
}

function ensureNoLegacyDomain(value, label) {
  if (value.includes('royalvelveteventz.com')) errors.push(`${label}: old domain found`)
}

for (const [key, seo] of Object.entries(PUBLIC_SEO)) {
  const routePath = SECTION_PATHS[key]
  const file = routePath === '/' ? path.join(distDir, 'index.html') : path.join(distDir, routePath.slice(1), 'index.html')
  const html = await readFile(file, 'utf8')
  const expectedCanonical = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
  const title = readTag(html, /<title>([\s\S]*?)<\/title>/i, 'title', routePath)
  const description = readTag(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/>/i, 'description', routePath)
  const canonical = readTag(html, /<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']\s*\/>/i, 'canonical', routePath)
  if (title !== escapeHtml(seo.title)) errors.push(`${routePath}: title does not match route configuration`)
  if (description !== escapeHtml(seo.description)) errors.push(`${routePath}: description does not match route configuration`)
  if (canonical !== expectedCanonical) errors.push(`${routePath}: canonical is ${canonical}, expected ${expectedCanonical}`)
  if (seenTitles.has(title)) errors.push(`${routePath}: duplicate title also used by ${seenTitles.get(title)}`)
  if (seenDescriptions.has(description)) errors.push(`${routePath}: duplicate description also used by ${seenDescriptions.get(description)}`)
  seenTitles.set(title, routePath)
  seenDescriptions.set(description, routePath)
  validateJsonLd(html, routePath)
  ensureNoLegacyDomain(html, routePath)
}

const manifest = JSON.parse(await readFile(path.join(distDir, 'seo-manifest.json'), 'utf8'))
const sitemapIndex = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
const pagesSitemap = await readFile(path.join(distDir, 'sitemaps', 'pages.xml'), 'utf8')
const projectsSitemap = await readFile(path.join(distDir, 'sitemaps', 'projects.xml'), 'utf8')
const destinationsSitemap = await readFile(path.join(distDir, 'sitemaps', 'destinations.xml'), 'utf8')
const aiContentFeed = JSON.parse(await readFile(path.join(distDir, 'ai-content-feed.json'), 'utf8'))
const cmsLlms = await readFile(path.join(distDir, 'llms-cms.txt'), 'utf8')
const llms = await readFile(path.join(distDir, 'llms.txt'), 'utf8')

for (const sitemapName of ['pages.xml', 'projects.xml', 'destinations.xml']) {
  const expected = `${SITE_URL}/sitemaps/${sitemapName}`
  if (!sitemapIndex.includes(`<loc>${expected}</loc>`)) errors.push(`sitemap index: missing ${expected}`)
}

for (const key of Object.keys(PUBLIC_SEO)) {
  const routePath = SECTION_PATHS[key]
  const canonical = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
  if (!pagesSitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`pages sitemap: missing ${canonical}`)
}
for (const routePath of manifest.documentationPages || []) {
  const canonical = `${SITE_URL}${routePath}`
  if (!pagesSitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`pages sitemap: missing ${canonical}`)
}

const seenProjectSlugs = new Set()
for (const project of manifest.projects || []) {
  const routePath = `/projects/${project.slug}`
  if (seenProjectSlugs.has(project.slug)) errors.push(`${routePath}: duplicate project slug`)
  seenProjectSlugs.add(project.slug)
  const file = path.join(distDir, 'projects', project.slug, 'index.html')
  const html = await readFile(file, 'utf8')
  const canonical = readTag(html, /<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']\s*\/>/i, 'canonical', routePath)
  if (canonical !== project.url) errors.push(`${routePath}: canonical is ${canonical}, expected ${project.url}`)
  if (!projectsSitemap.includes(`<loc>${project.url}</loc>`)) errors.push(`projects sitemap: missing ${project.url}`)
  for (const imageUrl of project.imageUrls || []) {
    if (!projectsSitemap.includes(`<image:loc>${escapeHtml(imageUrl)}</image:loc>`)) errors.push(`${routePath}: image sitemap missing ${imageUrl}`)
  }
  if (Number(project.imageCount) < 1) errors.push(`${routePath}: project has no indexed images`)
  validateJsonLd(html, routePath)
  ensureNoLegacyDomain(html, routePath)
}

if (!destinationsSitemap.includes(`<loc>${SITE_URL}/destination-weddings</loc>`)) {
  errors.push('destinations sitemap: destination-weddings page missing')
}
if ((destinationsSitemap.match(/<image:loc>/g) || []).length !== Number(manifest.destinationImageCount || 0)) {
  errors.push('destinations sitemap: image count does not match generated manifest')
}

if (aiContentFeed.canonicalWebsite !== `${SITE_URL}/`) errors.push('AI content feed: canonical website is incorrect')
if (Number(aiContentFeed.projects?.length || 0) !== Number(manifest.projects?.length || 0)) errors.push('AI content feed: project count does not match manifest')
if (Number(aiContentFeed.destinationImages?.length || 0) !== Number(manifest.destinationImageCount || 0)) errors.push('AI content feed: destination image count does not match manifest')
if (Number(aiContentFeed.services?.length || 0) !== Number(manifest.serviceCount || 0)) errors.push('AI content feed: service count does not match manifest')
if (Number(aiContentFeed.clientStories?.length || 0) !== Number(manifest.testimonialCount || 0)) errors.push('AI content feed: testimonial count does not match manifest')
if (!cmsLlms.includes('Canonical sitemap')) errors.push('LLM CMS file: canonical sitemap link missing')
if (!llms.includes(`${SITE_URL}/ai-content-feed.json`)) errors.push('llms.txt: live AI content feed link missing')
ensureNoLegacyDomain(JSON.stringify(aiContentFeed), 'AI content feed')
ensureNoLegacyDomain(cmsLlms, 'LLM CMS file')

for (const [label, content] of [
  ['sitemap index', sitemapIndex],
  ['pages sitemap', pagesSitemap],
  ['projects sitemap', projectsSitemap],
  ['destinations sitemap', destinationsSitemap],
]) {
  ensureNoLegacyDomain(content, label)
  if (content.includes('/admin')) errors.push(`${label}: private admin route must not be listed`)
}

const robots = await readFile(path.resolve('public/robots.txt'), 'utf8')
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) errors.push('robots.txt: canonical sitemap declaration missing')
if (!robots.includes('Disallow: /admin')) errors.push('robots.txt: admin exclusion missing')
if (!robots.includes('Allow: /ai-content-feed.json')) errors.push('robots.txt: AI content feed allowance missing')

if (errors.length) {
  console.error(`SEO validation failed with ${errors.length} issue(s):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`SEO validation passed: ${Object.keys(PUBLIC_SEO).length} public routes, ${(manifest.projects || []).length} project pages, ${manifest.destinationImageCount || 0} destination images, ${manifest.serviceCount || 0} live services, and ${manifest.testimonialCount || 0} client stories.`)
