# RoyalVelvetEvents

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

## Deployment

Build with:

```bash
npm run build
```

Deploy the generated `dist` folder to Netlify or Vercel.
