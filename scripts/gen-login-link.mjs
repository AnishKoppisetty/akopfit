// Generates a one-time magic-link login URL for any user — no email needed.
// Calls the GoTrue admin endpoint directly (no supabase-js / websocket).
//
// Usage (key stays on your machine, hidden from shell history):
//   read -s SUPABASE_SERVICE_ROLE   # paste key, press Enter (input hidden)
//   export SUPABASE_SERVICE_ROLE
//   node scripts/gen-login-link.mjs anishkoppisetty@icloud.com
//
// Get the key from: Supabase → Project Settings → API → "service_role" (secret).

const URL = 'https://unrrjfibvusjdkuwfwnk.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE
const email = process.argv[2] || 'anishkoppisetty@icloud.com'
const redirectTo = process.argv[3] || 'https://akopfit.vercel.app'

if (!key) {
  console.error('Missing SUPABASE_SERVICE_ROLE env var. See usage at top of this file.')
  process.exit(1)
}

const res = await fetch(`${URL}/auth/v1/admin/generate_link`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'magiclink', email, redirect_to: redirectTo }),
})

const data = await res.json()
if (!res.ok) {
  console.error('Error:', data.msg || data.error_description || JSON.stringify(data))
  process.exit(1)
}

const link = data.action_link || data.properties?.action_link
console.log('\n✅ Login link for ' + email + ':\n')
console.log(link)
console.log('\nOpen it in a PRIVATE / INCOGNITO window to sign in as this user.\n')
