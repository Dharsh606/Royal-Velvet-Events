# The Royal Velvet

Premium luxury event management website for weddings, family milestones, corporate events, traditional poojas, and 70+ curated services. Built with a lightweight stack:

- React + Vite
- Pure CSS
- AOS
- React Icons
- Firebase-ready admin, bookings, storage, and dynamic homepage content

## Run locally

```bash
npm install
npm run dev
```

## Firebase setup

1. Copy `.env.example` to `.env`
2. Add your Firebase web app credentials
3. Enable Authentication, Firestore, and Storage in Firebase
4. Visit `/admin` to create or sign into an admin account

Without Firebase credentials, the project still runs in local demo mode using browser storage so the interface remains easy to preview.

## Supabase setup

1. Add these to `.env` (see `.env.example`):
   - `VITE_SUPABASE_URL` — project base URL, e.g. `https://your-project.supabase.co` (not `/rest/v1/`)
   - `VITE_SUPABASE_ANON_KEY` — your publishable anon key
2. Create tables: `bookings`, `testimonials`, `gallery`, `reels`, `site_settings`
3. Create storage buckets: `gallery`, `reels` (with read/upload policies)
4. Enable Auth and create an admin user for `/admin`
5. Insert `site_settings` row with `id = homepage`

When configured, the site uses Supabase for bookings, admin content, gallery, testimonials, reels, and homepage hero text. Static `content.js` data remains as fallback.

## Deployment

Build with:

```bash
npm run build
```

Deploy the generated `dist` folder to Netlify or Vercel.

