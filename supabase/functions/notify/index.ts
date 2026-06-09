// AkopFit — Web Push sender (Supabase Edge Function, Deno).
// Called by the app via supabase.functions.invoke('notify', { body }).
//   body: { target: 'coach' | 'client', clientId?, title, body, url? }
// A coach may notify any client; a client may notify the coach.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:coach@akopfit.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // Identify the caller from their JWT.
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(jwt)
    const caller = userData.user
    if (!caller) return json({ error: 'unauthorized' }, 401)
    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).maybeSingle()
    const callerRole = callerProfile?.role

    const { target, clientId, title, body, url } = await req.json()

    // Resolve recipient user ids.
    let targetIds: string[] = []
    if (target === 'coach') {
      const { data } = await admin.from('profiles').select('id').eq('role', 'coach')
      targetIds = (data ?? []).map((r: { id: string }) => r.id)
    } else if (target === 'client') {
      if (callerRole !== 'coach') return json({ error: 'forbidden' }, 403)
      if (!clientId) return json({ error: 'clientId required' }, 400)
      targetIds = [clientId]
    } else {
      return json({ error: 'bad target' }, 400)
    }
    if (targetIds.length === 0) return json({ sent: 0 })

    const { data: subs } = await admin.from('push_subscriptions').select('*').in('user_id', targetIds)
    const message = JSON.stringify({ title, body, url: url ?? '/' })

    let sent = 0
    for (const s of subs ?? []) {
      const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
      try {
        await webpush.sendNotification(subscription, message)
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }
    return json({ sent })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
