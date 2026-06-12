import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Button, Input } from '../components/ui'
import { DumbbellIcon } from '../components/icons'

export default function ResetPassword() {
  const { updatePassword, clearRecovery } = useAuth()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (pw.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (pw !== confirm) { setError('Passwords don’t match.'); return }
    setBusy(true)
    const { error } = await updatePassword(pw)
    setBusy(false)
    if (error) { setError(error); return }
    setDone(true)
    setTimeout(() => clearRecovery(), 1500) // drop back into the app, now signed in
  }

  return (
    <div className="min-h-full max-w-sm mx-auto px-6 flex flex-col justify-center pt-safe pb-safe">
      <div className="h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center mb-6">
        <DumbbellIcon className="text-accent" width={32} height={32} />
      </div>
      <h1 className="text-3xl font-bold mb-1">Set a new password</h1>

      {done ? (
        <p className="text-sm text-accent mt-3">Password updated ✓ — taking you in…</p>
      ) : (
        <>
          <p className="text-sm text-muted mb-7">Choose a new password for your account.</p>
          <form onSubmit={submit} className="space-y-3">
            <Input type="password" autoComplete="new-password" placeholder="New password (6+ characters)" value={pw} onChange={e => { setPw(e.target.value); setError('') }} autoFocus />
            <Input type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }} />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !pw || !confirm}>
              {busy ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
