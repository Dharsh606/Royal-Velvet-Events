# The Royal Velvet — Automated SEO Publishing Guide

This system turns public admin content into crawlable webpages, structured data, image sitemaps, and AI-readable feeds without a developer updating files every day.

## What is automated

When an admin publishes or changes a public project, destination image, service, testimonial, or Our Story facts:

1. Supabase saves the content.
2. A Supabase Database Webhook calls the protected `trigger-seo-rebuild` Edge Function.
3. The Edge Function securely calls one Vercel Deploy Hook.
4. Vercel rebuilds the current `main` branch.
5. The build reads public content from Supabase.
6. The build generates project pages, metadata, JSON-LD, XML image sitemaps, AI feeds, and validation reports.
7. Vercel publishes the new version atomically.
8. Google can rediscover the updated sitemap already submitted in Search Console.

```text
Admin Publish
     ↓
Supabase public row
     ↓
Database Webhook
     ↓
Protected Edge Function
     ↓
Vercel Deploy Hook
     ↓
SEO build + validation
     ↓
Live project page + sitemaps + AI feeds
```

Google still decides when to crawl and index a page. No legitimate system can guarantee instant ranking or indexing. Google's general Indexing API must not be used for ordinary event/gallery pages; it is restricted to supported job posting and livestream page types.

---

## One-time setup

Complete these steps once, in this order.

### 1. Run the Supabase migration

1. Open the Supabase project `royalvelvetevents`.
2. Open **SQL Editor**.
3. Select **New query**.
4. Open this local file and copy all its SQL:
   `J:\RoyalVelvetEvents\supabase\automated_seo_publishing.sql`
5. Paste it into the Supabase SQL Editor.
6. Click **Run**.
7. Confirm that the result shows success.

This adds stable project slugs, location/category fields, optional SEO fields, publication timestamps, image captions, and database safeguards.

### 2. Verify public-read policies

The website build uses the Supabase anonymous key and must only read rows intended for the public website.

In **Table Editor**, confirm the website can already display:

- published `gallery_projects` and their `gallery_project_images`
- `destination_images`
- published `services`
- published `testimonials`
- the `main` row in `our_story_settings`

Do not make bookings, admin notes, authentication records, or private client records publicly readable. The automated feed never queries those private tables.

### 3. Check Vercel production environment variables

1. Open Vercel.
2. Select the Royal Velvet project.
3. Open **Settings → Environment Variables**.
4. Confirm these variables exist for **Production**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Do not put the Supabase service-role key in the frontend or in any `VITE_` variable.

### 4. Create one Vercel Deploy Hook

1. In Vercel, open **Project → Settings → Git**.
2. Find **Deploy Hooks**.
3. Create a hook with:
   - Name: `Supabase CMS SEO Rebuild`
   - Branch: `main`
4. Copy the generated URL.
5. Treat this URL like a password. Do not paste it into frontend code, GitHub, screenshots, or public documentation.

### 5. Create a private webhook secret

In the Codex PowerShell terminal, run:

```powershell
$webhookSecret = ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'))
$webhookSecret
```

Copy the printed 64-character value into a temporary private note. It will be used in Supabase only.

### 6. Link the Supabase CLI

From `J:\RoyalVelvetEvents`, run:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref oyiijifycxfgntudazfq
```

The browser may open for Supabase authentication. Complete the login and return to the terminal.

### 7. Store the two Edge Function secrets

Replace the two placeholder values below. Keep the quotation marks.

```powershell
npx.cmd supabase secrets set VERCEL_DEPLOY_HOOK_URL="PASTE_YOUR_VERCEL_DEPLOY_HOOK"
npx.cmd supabase secrets set CMS_REBUILD_WEBHOOK_SECRET="PASTE_YOUR_64_CHARACTER_SECRET"
```

These secrets stay server-side in Supabase. They are not shipped to browsers.

### 8. Deploy the Edge Function

Run:

```powershell
npx.cmd supabase functions deploy trigger-seo-rebuild --project-ref oyiijifycxfgntudazfq --no-verify-jwt
```

`--no-verify-jwt` allows the database webhook to reach the function. The function is still protected by the separate `x-webhook-secret` header.

The production function URL is:

```text
https://oyiijifycxfgntudazfq.supabase.co/functions/v1/trigger-seo-rebuild
```

### 9. Create the Database Webhooks

Open **Supabase → Database → Webhooks**. Create five webhooks. For each webhook:

- Schema: `public`
- Events: `Insert`, `Update`, and `Delete`
- Type: `HTTP Request`
- Method: `POST`
- URL: `https://oyiijifycxfgntudazfq.supabase.co/functions/v1/trigger-seo-rebuild`
- Timeout: `5000` ms
- Headers:
  - `Content-Type` = `application/json`
  - `x-webhook-secret` = the same 64-character secret from step 5
- HTTP parameters: leave empty

Create these webhook/table pairs:

| Webhook name | Table |
|---|---|
| `seo-gallery-projects` | `gallery_projects` |
| `seo-destination-images` | `destination_images` |
| `seo-services` | `services` |
| `seo-testimonials` | `testimonials` |
| `seo-our-story` | `our_story_settings` |

Project-image uploads from the admin touch their parent `gallery_projects.updated_at` only after the image batch is complete. That parent update triggers one public rebuild with the finished project.

### 10. Trigger one clean production deployment

After the SQL, function, secrets, and webhooks are ready:

1. Push the implementation to GitHub, or redeploy the latest `main` commit in Vercel.
2. Open the Vercel deployment logs.
3. Confirm the build runs:
   - `vite build`
   - `scripts/generate-seo-pages.mjs`
   - `scripts/validate-seo.mjs`
4. The build must finish successfully. Validation deliberately fails deployment if canonical URLs, structured data, sitemap links, or generated project assets conflict.

---

## Search Console setup — once

After the first successful production deployment:

1. Open the verified Search Console property for `the-royalvelvet.com`.
2. Open **Sitemaps**.
3. Submit only:

```text
sitemap.xml
```

The submitted sitemap index automatically points to:

- `/sitemaps/pages.xml`
- `/sitemaps/projects.xml`
- `/sitemaps/destinations.xml`

Do not manually submit every image and do not resubmit the sitemap every day. The root sitemap stays at the same URL while its contents are regenerated during every CMS deployment. `robots.txt` also declares the canonical sitemap.

For the first launch, use **URL Inspection** on one representative project URL and request indexing once. Routine future projects can be discovered through the sitemap and internal Gallery links.

---

## Daily admin workflow

### Publishing a project

1. Sign in to `/admin`.
2. Open **Media / Project Archive**.
3. Enter a clear project name, for example `Ramayana Wedding Decor`.
4. Review the generated slug, for example `ramayana-wedding-decor`.
5. Add:
   - short factual project story
   - completion date
   - location
   - project category
6. SEO title and description are optional. Leave them blank to use safe automatic versions.
7. Upload all project images.
8. Give every image a concise, truthful caption/alt description.
9. Select **Featured Project** only if this project should occupy the featured position.
10. Select **Published** and save.

Expected result:

- Supabase saves the project and images.
- A Vercel deployment starts automatically.
- In roughly 1–3 minutes, `/projects/project-slug` becomes live.
- The project and all its images appear in `/sitemaps/projects.xml`.
- Project facts appear in `/ai-content-feed.json` and `/llms-cms.txt`.

### Important slug rule

Treat the project slug as permanent after publication. Changing it changes the public URL and can discard ranking signals from the old URL. Change a published slug only when correcting a serious mistake and when a redirect is intentionally added.

### Updating other public content

Publishing/changing any of these also starts the same automatic rebuild:

- destination image
- service
- testimonial
- Our Story public metrics/details

No sitemap editing is required.

---

## What the build creates automatically

### Search-facing assets

- one crawlable static page for every published project
- unique title, description, canonical URL, Open Graph and Twitter metadata
- `CollectionPage`, `ImageGallery`, `ImageObject`, and breadcrumb structured data
- image-aware project and destination XML sitemaps
- stable root sitemap index

### AI/AEO/GEO-facing assets

- `/llms.txt` — stable public brand and intent guide
- `/llms-full.txt` — detailed public brand knowledge
- `/llms-cms.txt` — automatically regenerated public CMS knowledge
- `/ai-content-feed.json` — machine-readable projects, services, destination visuals, testimonials, and public story metrics
- `/brand-facts.json` and `/ai-overview.json` — stable brand/entity facts

These files improve machine readability; they do not force any AI system to cite or recommend the brand.

### Privacy boundaries

The generator does **not** read or publish:

- bookings
- client phone numbers or email addresses
- admin notes
- proposals
- follow-up dates
- authentication users
- unpublished content
- `/admin` content

---

## How to verify a publication

After publishing, check in this order:

1. **Supabase** — project row is published and has a slug.
2. **Supabase Edge Function logs** — `trigger-seo-rebuild` returned success.
3. **Vercel Deployments** — a Deploy Hook deployment started and completed.
4. **Project URL** — `https://the-royalvelvet.com/projects/YOUR-SLUG` opens.
5. **Sitemap** — search the project slug in `https://the-royalvelvet.com/sitemaps/projects.xml`.
6. **Images** — verify every project image appears as `<image:loc>` in that sitemap.
7. **AI feed** — search the project name in `https://the-royalvelvet.com/ai-content-feed.json`.
8. **Build report** — open `https://the-royalvelvet.com/seo-manifest.json` to see generated project/image counts and CMS source errors.

Use an incognito window if the browser appears to show an older cached deployment.

---

## Troubleshooting

### No Vercel deployment starts

- Check Supabase Database Webhook history.
- Confirm the webhook URL is the Edge Function URL, not the Vercel hook.
- Confirm `x-webhook-secret` exactly matches `CMS_REBUILD_WEBHOOK_SECRET`.
- Confirm the Edge Function has both secrets.
- Check Edge Function logs for `401`, `500`, or Vercel rejection errors.

### Edge Function returns 401

The `x-webhook-secret` header is missing or does not match. Re-enter the same secret in the webhook and Edge Function secrets.

### Edge Function succeeds but Vercel fails

- Open the deployment's Build Logs.
- Confirm Vercel Production has the two `VITE_SUPABASE_*` variables.
- Read the exact SEO validation error.
- Check `/seo-manifest.json` on the last successful deployment.

### Project is on the website but absent from the sitemap

- Confirm `is_published = true`.
- Confirm it has at least one project image.
- Confirm the latest Vercel deployment happened after publication.
- Confirm Supabase public-read policies allow the anon build request to read the published row and images.

### Several deployments appear after one edit

Vercel may receive closely timed webhook requests when related public records change. Vercel reduces duplicate work for the same Deploy Hook and publishes only completed deployments. Always wait for the latest deployment to finish.

### Google has not indexed the new project yet

This is normal. Sitemap submission is a crawl hint, not an indexing guarantee. Verify the page is public, canonical, internally linked from Gallery, and listed in the sitemap. Do not use Google's restricted Indexing API for ordinary project pages.

---

## When a developer is still required

Routine content does not require a developer. Call a developer only for:

- a new page/template type such as Journal or Careers listings
- database schema redesigns
- domain migrations
- major visual/interaction changes
- security policy changes
- new integrations or payment systems
- fixing a failed production build that the troubleshooting steps cannot resolve

The everyday content loop is now: **publish in admin → wait for deployment → verify the live URL**.

## Official references

- Supabase Database Webhooks: https://supabase.com/docs/guides/database/webhooks
- Supabase Edge Function deployment: https://supabase.com/docs/guides/functions/deploy
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Vercel Deploy Hooks: https://vercel.com/docs/deploy-hooks
- Google sitemap creation and submission: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Indexing API eligibility: https://developers.google.com/search/apis/indexing-api/v3/using-api
