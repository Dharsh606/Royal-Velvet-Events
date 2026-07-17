type WebhookPayload = {
  type?: 'INSERT' | 'UPDATE' | 'DELETE'
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

const jsonHeaders = { 'Content-Type': 'application/json' }
const supportedTables = new Set([
  'gallery_projects',
  'destination_images',
  'testimonials',
  'services',
  'our_story_settings',
])

function published(record?: Record<string, unknown> | null) {
  if (!record) return false
  if (!Object.hasOwn(record, 'is_published')) return true
  return record.is_published === true
}

function shouldRebuild(payload: WebhookPayload) {
  if (payload.schema && payload.schema !== 'public') return false
  if (!payload.table || !supportedTables.has(payload.table)) return false

  if (payload.table === 'gallery_projects' || payload.table === 'testimonials' || payload.table === 'services') {
    return published(payload.record) || published(payload.old_record)
  }

  return true
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers: jsonHeaders })
  }

  const deployHookUrl = Deno.env.get('VERCEL_DEPLOY_HOOK_URL')
  const expectedWebhookSecret = Deno.env.get('CMS_REBUILD_WEBHOOK_SECRET')
  if (!deployHookUrl || !expectedWebhookSecret) {
    return new Response(JSON.stringify({ ok: false, error: 'Required rebuild secrets are not configured' }), { status: 500, headers: jsonHeaders })
  }

  if (request.headers.get('x-webhook-secret') !== expectedWebhookSecret) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid webhook secret' }), { status: 401, headers: jsonHeaders })
  }

  let payload: WebhookPayload
  try {
    payload = await request.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid webhook JSON' }), { status: 400, headers: jsonHeaders })
  }

  if (!shouldRebuild(payload)) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'No public SEO change detected' }), { status: 200, headers: jsonHeaders })
  }

  const deployResponse = await fetch(deployHookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'supabase-cms',
      table: payload.table,
      operation: payload.type,
      recordId: payload.record?.id || payload.old_record?.id || null,
    }),
  })
  const deployBody = await deployResponse.text()

  if (!deployResponse.ok) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Vercel deploy hook rejected the rebuild',
      status: deployResponse.status,
      response: deployBody.slice(0, 500),
    }), { status: 502, headers: jsonHeaders })
  }

  return new Response(JSON.stringify({
    ok: true,
    rebuildRequested: true,
    table: payload.table,
    operation: payload.type,
  }), { status: 200, headers: jsonHeaders })
})
