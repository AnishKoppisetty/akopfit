// AkopFit — coach resets a client's password (Supabase Edge Function, Deno).
// Only the coach may call this; it uses the service-role key to set the
// password directly (no email needed). Invoked via
// supabase.functions.invoke('reset-client-password', { body: { clientId, password } }).
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // Caller must be the coach.
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(jwt)
    const caller = userData.user
    if (!caller) return json({ error: 'unauthorized' }, 401)
    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).maybeSingle()
    if (callerProfile?.role !== 'coach') return json({ error: 'forbidden' }, 403)

    const { clientId, password } = await req.json()
    if (!clientId || typeof password !== 'string' || password.length < 6) {
      return json({ error: 'A client and a 6+ character password are required.' }, 400)
    }

    // Target must be a client (don't allow resetting the coach or arbitrary users).
    const { data: target } = await admin.from('profiles').select('role').eq('id', clientId).maybeSingle()
    if (!target || target.role !== 'client') return json({ error: 'Not a client account.' }, 400)

    const { error } = await admin.auth.admin.updateUserById(clientId, { password })
    if (error) return json({ error: error.message }, 500)

    return json({ ok: true })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
