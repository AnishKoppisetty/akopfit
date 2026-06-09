import { useEffect, useState } from 'react'
import { Card, Button, SectionTitle } from './ui'
import { useAuth } from '../auth/AuthProvider'
import { getPushState, isPushEnabled, enablePush, disablePush, pushSupported } from '../lib/push'

export function NotificationsCard() {
  const { session } = useAuth()
  const userId = session?.user?.id
  const [enabled, setEnabled] = useState(false)
  const [state] = useState(getPushState())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { isPushEnabled().then(setEnabled) }, [])

  async function toggle() {
    if (!userId) return
    setBusy(true); setMsg('')
    if (enabled) {
      await disablePush()
      setEnabled(false)
    } else {
      const { ok, error } = await enablePush(userId)
      setEnabled(ok)
      if (!ok) setMsg(error ?? '')
    }
    setBusy(false)
  }

  return (
    <>
      <SectionTitle>Notifications</SectionTitle>
      <Card className="space-y-3">
        {!pushSupported() ? (
          <p className="text-sm text-muted">
            Push isn’t available here. On iPhone, <span className="text-white">Add to Home Screen</span> first, then open AkopFit from there to enable notifications.
          </p>
        ) : state === 'denied' ? (
          <p className="text-sm text-muted">Notifications are blocked in your settings. Allow them for AkopFit, then try again.</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {enabled ? 'Push notifications are on for this device.' : 'Get alerts for check-ins, coach replies, and plan updates.'}
            </p>
            {msg && <p className="text-sm text-rose-400">{msg}</p>}
            <Button className="w-full" variant={enabled ? 'outline' : 'primary'} onClick={toggle} disabled={busy}>
              {busy ? 'Please wait…' : enabled ? 'Turn off notifications' : 'Enable notifications'}
            </Button>
          </>
        )}
      </Card>
    </>
  )
}
