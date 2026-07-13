# Booking email delivery

This Supabase Edge Function is called by a Database Webhook after a new row is inserted into `public.bookings`.

It sends:

1. A complete new-booking notification to the private business inbox configured in `BOOKING_ADMIN_EMAIL`.
2. A branded thank-you email to the customer who submitted the booking form.

The public website does not expose the private Gmail inbox. Public-facing contact language should use the consultation form, WhatsApp, phone, and the `PUBLIC_CONTACT_LABEL` display text.

## Required Supabase secrets

- `RESEND_API_KEY`
- `BOOKING_WEBHOOK_SECRET`
- `BOOKING_FROM_EMAIL`
- `BOOKING_ADMIN_EMAIL`
- `BOOKING_REPLY_TO`
- `PUBLIC_CONTACT_LABEL`
- `SITE_URL`

Recommended production values while you do not own a Hostinger mailbox:

- `BOOKING_ADMIN_EMAIL=royalvelveteventstudio@gmail.com`
- `BOOKING_REPLY_TO=royalvelveteventstudio@gmail.com`
- `PUBLIC_CONTACT_LABEL=Private Concierge Desk`

For `BOOKING_FROM_EMAIL`, use a Resend-verified sender. If your domain is verified in Resend, a no-reply sender such as `The Royal Velvet <no-reply@royalvelveteventz.com>` can send even if you do not own a mailbox. If the domain is not verified yet, use Resend's test sender only for testing.

Deploy the function without Supabase JWT verification because it is protected by the private `x-webhook-secret` header sent by the Database Webhook.

```bash
npx supabase functions deploy send-booking-emails --no-verify-jwt
```

Never place the Resend API key or webhook secret in a `VITE_` environment variable.
