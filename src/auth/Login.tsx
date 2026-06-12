import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Button, Input } from '../components/ui'
import { DumbbellIcon } from '../components/icons'

type Mode = 'signin' | 'signup'

export default function Login() {
  const { signInWithPassword, signUpWithPassword, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Forgot-password sub-flow
  const [forgot, setForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    const { error } = mode === 'signin'
      ? await signInWithPassword(email, password)
      : await signUpWithPassword(email, password, name)
    setBusy(false)
    if (error) setError(prettyError(error, mode))
    // on success, AuthProvider's auth-state listener routes the user
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return
    setBusy(true)
    const { error } = await resetPassword(email)
    setBusy(false)
    if (error) setError(error)
    else setResetSent(true)
  }

  function switchMode(m: Mode) {
    setMode(m); setError('')
  }

  if (forgot) {
    return (
      <div className="min-h-full max-w-sm mx-auto px-6 flex flex-col justify-center pt-safe pb-safe">
        <div className="h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center mb-6">
          <DumbbellIcon className="text-accent" width={32} height={32} />
        </div>
        <h1 className="text-3xl font-bold mb-1">Reset password</h1>
        {resetSent ? (
          <>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              If an account exists for <span className="text-white">{email}</span>, we’ve sent a reset link. Open it on this device to set a new password.
            </p>
            <button onClick={() => { setForgot(false); setResetSent(false) }} className="text-sm text-accent underline mt-6 self-start">← Back to sign in</button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted mb-7">Enter your email and we’ll send you a link to set a new password.</p>
            <form onSubmit={sendReset} className="space-y-3">
              <Input type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e => { setEmail(e.target.value); setError('') }} autoFocus />
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send reset link'}</Button>
            </form>
            <button onClick={() => { setForgot(false); setError('') }} className="text-sm text-muted underline mt-6 self-start">← Back to sign in</button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-full max-w-sm mx-auto px-6 flex flex-col justify-center pt-safe pb-safe">
      <div className="h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center mb-6">
        <DumbbellIcon className="text-accent" width={32} height={32} />
      </div>
      <h1 className="text-3xl font-bold mb-1">AkopFit</h1>
      <p className="text-sm text-muted mb-7">
        {mode === 'signin' ? 'Sign in to your account.' : 'Create your account to get started.'}
      </p>

      {/* Segmented toggle */}
      <div className="flex gap-1 bg-ink-700 rounded-xl p-1 mb-5">
        <TabBtn active={mode === 'signin'} onClick={() => switchMode('signin')}>Sign in</TabBtn>
        <TabBtn active={mode === 'signup'} onClick={() => switchMode('signup')}>Create account</TabBtn>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <Input
            type="text" autoComplete="name" placeholder="Your name"
            value={name} onChange={e => setName(e.target.value)}
          />
        )}
        <Input
          type="email" inputMode="email" autoComplete="email" placeholder="you@email.com"
          value={email} onChange={e => { setEmail(e.target.value); setError('') }}
        />
        <Input
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder={mode === 'signup' ? 'Password (6+ characters)' : 'Password'}
          value={password} onChange={e => { setPassword(e.target.value); setError('') }}
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !email.trim() || !password}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      {mode === 'signin' && (
        <button onClick={() => { setForgot(true); setError('') }} className="text-xs text-muted underline mt-4 text-center">
          Forgot password?
        </button>
      )}

      <p className="text-xs text-muted mt-6 text-center">
        {mode === 'signin' ? (
          <>New here? <button onClick={() => switchMode('signup')} className="text-accent underline">Create an account</button></>
        ) : (
          <>Already have an account? <button onClick={() => switchMode('signin')} className="text-accent underline">Sign in</button></>
        )}
      </p>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${active ? 'bg-accent text-ink-900' : 'text-muted'}`}
    >
      {children}
    </button>
  )
}

function prettyError(msg: string, mode: Mode): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Wrong email or password.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'That email already has an account — try signing in.'
  if (m.includes('weak') || m.includes('at least')) return 'Password must be at least 6 characters.'
  if (m.includes('email') && mode === 'signup' && m.includes('confirm')) return 'Account created — you can now sign in.'
  return msg
}
