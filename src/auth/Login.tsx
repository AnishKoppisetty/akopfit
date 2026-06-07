import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Button, Input } from '../components/ui'
import { DumbbellIcon } from '../components/icons'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    const { error } = await signInWithEmail(email)
    if (error) {
      setError(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-full max-w-sm mx-auto px-6 flex flex-col justify-center pt-safe pb-safe">
      <div className="h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center mb-6">
        <DumbbellIcon className="text-accent" width={32} height={32} />
      </div>
      <h1 className="text-3xl font-bold mb-1">AkopFit</h1>

      {status === 'sent' ? (
        <div className="mt-4">
          <p className="text-lg font-semibold mb-2">Check your email 📬</p>
          <p className="text-sm text-muted leading-relaxed">
            We sent a sign-in link to <span className="text-white">{email}</span>.
            Tap it on this device to log in. You can close this page.
          </p>
          <button
            onClick={() => { setStatus('idle'); setEmail('') }}
            className="text-sm text-accent underline mt-6"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted mb-8">Enter your email and we’ll send you a one-tap sign-in link — no password needed.</p>
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setStatus('idle') }}
              autoFocus
            />
            {status === 'error' && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={status === 'sending' || !email.trim()}>
              {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </Button>
          </form>
          <p className="text-xs text-muted mt-6 text-center">
            New here? Just enter your email — your account is created automatically.
          </p>
        </>
      )}
    </div>
  )
}
