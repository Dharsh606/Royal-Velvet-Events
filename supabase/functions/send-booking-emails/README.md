# Booking email delivery

This Supabase Edge Function is called by a Database Webhook after a new row is inserted into `public.bookings`.

It sends:

1. A complete new-booking notification to `royalvelveteventstudio@gmail.com`.
2. A branded thank-you email to the customer who submitted the booking form.

## Required Supabase secrets

- `RESEND_API_KEY`
- `BOOKING_WEBHOOK_SECRET`
- `BOOKING_FROM_EMAIL`
- `BOOKING_ADMIN_EMAIL`
- `BOOKING_REPLY_TO`
- `PUBLIC_CONTACT_EMAIL`
- `SITE_URL`

Deploy the function without Supabase JWT verification because it is protected by the private `x-webhook-secret` header sent by the Database Webhook.

```bash
npx supabase functions deploy send-booking-emails --no-verify-jwt
```

Never place the Resend API key or webhook secret in a `VITE_` environment variable.
