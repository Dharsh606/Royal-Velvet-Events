type BookingRecord = {
  id?: string
  name?: string
  phone?: string
  email?: string
  type?: string
  date?: string | null
  budget?: string
  location?: string
  vision?: string
  status?: string
  created_at?: string
}

type BookingWebhook = {
  type?: string
  table?: string
  schema?: string
  record?: BookingRecord
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_ADMIN_EMAIL = 'royalvelveteventstudio@gmail.com'
const DEFAULT_FROM_EMAIL = 'The Royal Velvet <concierge@royalvelveteventz.com>'
const DEFAULT_PUBLIC_CONTACT_EMAIL = 'royalvelveteventstudio@gmail.com'
const DEFAULT_REPLY_TO_EMAIL = 'royalvelveteventstudio@gmail.com'
const DEFAULT_SITE_URL = 'https://www.royalvelveteventz.com'
const DEFAULT_WHATSAPP_URL = 'https://wa.me/919880541336?text=Hello%20The%20Royal%20Velvet%2C%20I%20recently%20submitted%20a%20consultation%20request.'

const jsonHeaders = { 'Content-Type': 'application/json' }

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function displayValue(value: unknown, fallback = 'Not provided') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function formatEventDate(value?: string | null) {
  if (!value) return 'To be privately confirmed'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(parsed)
}

function formatVision(value?: string) {
  return escapeHtml(displayValue(value, 'The client has not added a detailed vision brief.')).replaceAll('\n', '<br />')
}

function emailShell({ preview, content }: { preview: string; content: string }) {
  const siteUrl = Deno.env.get('SITE_URL') || DEFAULT_SITE_URL
  const publicContactEmail = Deno.env.get('PUBLIC_CONTACT_EMAIL') || DEFAULT_PUBLIC_CONTACT_EMAIL
  const logoUrl = `${siteUrl.replace(/\/$/, '')}/assets/the-royal-velvet-main-logo-web.png`

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(preview)}</title>
    </head>
    <body style="margin:0;padding:0;background:#160004;color:#f7f4ef;font-family:Arial,Helvetica,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(145deg,#160004,#090909);padding:34px 14px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#240007;border:1px solid #8f7427;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.45);">
              <tr>
                <td align="center" style="padding:30px 30px 18px;background:radial-gradient(circle at top,#4a000a,#240007 68%);border-bottom:1px solid rgba(212,175,55,.45);">
                  <img src="${logoUrl}" width="150" alt="The Royal Velvet" style="display:block;width:150px;max-width:48%;height:auto;border:0;border-radius:14px;" />
                  <p style="margin:18px 0 0;color:#e6c88d;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;">Luxury Celebration Architects</p>
                </td>
              </tr>
              <tr>
                <td style="padding:38px 38px 34px;">${content}</td>
              </tr>
              <tr>
                <td align="center" style="padding:22px 28px 28px;border-top:1px solid rgba(212,175,55,.28);color:#c9c1bd;font-size:12px;line-height:1.8;">
                  The Royal Velvet · Bangalore · Celebrations across India<br />
                  <a href="mailto:${publicContactEmail}" style="color:#e6c88d;text-decoration:none;">${publicContactEmail}</a>
                  &nbsp;·&nbsp; +91 98805 41336
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

function detailRow(label: string, value: unknown) {
  return `<tr>
    <td style="width:38%;padding:11px 12px;color:#d4af37;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;border-bottom:1px solid rgba(230,200,141,.16);vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:11px 12px;color:#f7f4ef;font-size:14px;line-height:1.55;border-bottom:1px solid rgba(230,200,141,.16);vertical-align:top;">${escapeHtml(displayValue(value))}</td>
  </tr>`
}

function adminEmail(booking: BookingRecord) {
  const customerEmail = displayValue(booking.email)
  const content = `
    <p style="margin:0 0 10px;color:#d4af37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">New Private Consultation</p>
    <h1 style="margin:0 0 14px;color:#f7f4ef;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;line-height:1.25;">A new celebration brief has arrived.</h1>
    <p style="margin:0 0 26px;color:#cfc7c3;font-size:15px;line-height:1.75;">${escapeHtml(displayValue(booking.name, 'A prospective client'))} has requested a private consultation. The complete inquiry is preserved below and in the admin dashboard.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid rgba(212,175,55,.35);border-radius:14px;border-collapse:separate;overflow:hidden;background:#190004;">
      ${detailRow('Client', booking.name)}
      ${detailRow('Phone', booking.phone)}
      ${detailRow('Email', booking.email)}
      ${detailRow('Event', booking.type)}
      ${detailRow('Event date', formatEventDate(booking.date))}
      ${detailRow('Budget', booking.budget)}
      ${detailRow('Location', booking.location)}
      ${detailRow('Booking reference', booking.id)}
    </table>
    <div style="margin:24px 0 0;padding:20px;border-left:2px solid #d4af37;background:#190004;border-radius:0 12px 12px 0;">
      <p style="margin:0 0 8px;color:#d4af37;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Vision Brief</p>
      <p style="margin:0;color:#eee8e2;font-size:14px;line-height:1.8;">${formatVision(booking.vision)}</p>
    </div>
    <p style="margin:28px 0 0;text-align:center;">
      <a href="mailto:${escapeHtml(customerEmail)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:linear-gradient(135deg,#d4af37,#e6c88d);color:#210005;font-size:12px;font-weight:700;letter-spacing:1.3px;text-decoration:none;text-transform:uppercase;">Reply to Client</a>
    </p>`

  return emailShell({ preview: `New booking from ${displayValue(booking.name)}`, content })
}

function customerEmail(booking: BookingRecord) {
  const content = `
    <p style="margin:0 0 10px;color:#d4af37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Private Consultation Received</p>
    <h1 style="margin:0 0 16px;color:#f7f4ef;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;line-height:1.25;">Thank you, ${escapeHtml(displayValue(booking.name, 'Esteemed Guest'))}.</h1>
    <p style="margin:0 0 18px;color:#d8d0cc;font-size:15px;line-height:1.85;">Your vision has reached The Royal Velvet. Our celebration concierge will review every detail and connect with you personally to shape the next chapter.</p>
    <div style="margin:24px 0;padding:22px;border:1px solid rgba(212,175,55,.38);border-radius:14px;background:#190004;">
      <p style="margin:0 0 10px;color:#e6c88d;font-family:Georgia,'Times New Roman',serif;font-size:19px;">${escapeHtml(displayValue(booking.type, 'Bespoke Celebration'))}</p>
      <p style="margin:0;color:#cfc7c3;font-size:13px;line-height:1.8;">${escapeHtml(formatEventDate(booking.date))} · ${escapeHtml(displayValue(booking.location, 'Location to be confirmed'))}</p>
    </div>
    <p style="margin:0 0 26px;color:#cfc7c3;font-size:14px;line-height:1.8;">A member of our team will contact you using the phone number or email shared in your inquiry. If your celebration is time-sensitive, you may reach our concierge directly.</p>
    <p style="margin:0;text-align:center;">
      <a href="${DEFAULT_WHATSAPP_URL}" style="display:inline-block;padding:15px 25px;border-radius:999px;background:linear-gradient(135deg,#d4af37,#e6c88d);color:#210005;font-size:12px;font-weight:700;letter-spacing:1.2px;text-decoration:none;text-transform:uppercase;">Speak With Our Concierge</a>
    </p>
    <p style="margin:30px 0 0;color:#e6c88d;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-style:italic;line-height:1.6;text-align:center;">Effortlessly Lavish.</p>`

  return emailShell({ preview: 'Your private consultation request is with The Royal Velvet.', content })
}

function adminText(booking: BookingRecord) {
  return [
    'NEW PRIVATE CONSULTATION — THE ROYAL VELVET',
    '',
    `Client: ${displayValue(booking.name)}`,
    `Phone: ${displayValue(booking.phone)}`,
    `Email: ${displayValue(booking.email)}`,
    `Event: ${displayValue(booking.type)}`,
    `Event date: ${formatEventDate(booking.date)}`,
    `Budget: ${displayValue(booking.budget)}`,
    `Location: ${displayValue(booking.location)}`,
    `Reference: ${displayValue(booking.id)}`,
    '',
    'Vision brief:',
    displayValue(booking.vision),
  ].join('\n')
}

function customerText(booking: BookingRecord) {
  return [
    `Thank you, ${displayValue(booking.name, 'Esteemed Guest')}.`,
    '',
    'Your private consultation request has reached The Royal Velvet.',
    `Event: ${displayValue(booking.type, 'Bespoke Celebration')}`,
    `Date: ${formatEventDate(booking.date)}`,
    `Location: ${displayValue(booking.location, 'To be confirmed')}`,
    '',
    'Our celebration concierge will review your vision and contact you personally.',
    '',
    'The Royal Velvet — Effortlessly Lavish',
    '+91 98805 41336',
  ].join('\n')
}

async function sendEmail({
  apiKey,
  from,
  to,
  replyTo,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  apiKey: string
  from: string
  to: string
  replyTo: string
  subject: string
  html: string
  text: string
  idempotencyKey: string
}) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      html,
      text,
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}: ${result?.message || 'Unknown error'}`)
  }
  return result
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders })
  }

  const webhookSecret = Deno.env.get('BOOKING_WEBHOOK_SECRET')
  const suppliedSecret = request.headers.get('x-webhook-secret')
  if (!webhookSecret || suppliedSecret !== webhookSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), { status: 500, headers: jsonHeaders })
  }

  let payload: BookingWebhook
  try {
    payload = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: jsonHeaders })
  }

  if (payload.type && payload.type !== 'INSERT') {
    return new Response(JSON.stringify({ skipped: true, reason: 'Only INSERT events send booking emails' }), { status: 200, headers: jsonHeaders })
  }

  const booking = payload.record
  if (!booking?.email || !booking?.name) {
    return new Response(JSON.stringify({ error: 'Booking name and email are required' }), { status: 422, headers: jsonHeaders })
  }

  const from = Deno.env.get('BOOKING_FROM_EMAIL') || DEFAULT_FROM_EMAIL
  const adminEmailAddress = Deno.env.get('BOOKING_ADMIN_EMAIL') || DEFAULT_ADMIN_EMAIL
  const businessReplyTo = Deno.env.get('BOOKING_REPLY_TO') || DEFAULT_REPLY_TO_EMAIL
  const reference = String(booking.id || crypto.randomUUID()).replaceAll(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)

  try {
    const adminResult = await sendEmail({
      apiKey: resendApiKey,
      from,
      to: adminEmailAddress,
      replyTo: booking.email,
      subject: `New private consultation — ${displayValue(booking.name)} · ${displayValue(booking.type, 'Bespoke Event')}`,
      html: adminEmail(booking),
      text: adminText(booking),
      idempotencyKey: `booking-${reference}-admin`,
    })

    const customerResult = await sendEmail({
      apiKey: resendApiKey,
      from,
      to: booking.email,
      replyTo: businessReplyTo,
      subject: 'Your private consultation is received | The Royal Velvet',
      html: customerEmail(booking),
      text: customerText(booking),
      idempotencyKey: `booking-${reference}-customer`,
    })

    return new Response(
      JSON.stringify({ ok: true, adminEmailId: adminResult?.id, customerEmailId: customerResult?.id }),
      { status: 200, headers: jsonHeaders },
    )
  } catch (error) {
    console.error('Booking email delivery failed:', error instanceof Error ? error.message : 'Unknown error')
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), { status: 502, headers: jsonHeaders })
  }
})
