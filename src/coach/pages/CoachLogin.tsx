import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCoach, DEMO_PASSCODE } from '../coachStore'
import { Button, Input } from '../../components/ui'
import { DumbbellIcon } from '../../components/icons'

export default function CoachLogin() {
  const { login } = useCoach()
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!login(code)) setError(true)
  }

  return (
    <div className="min-h-full max-w-sm mx-auto px-6 flex flex-col justify-center pt-safe">
      <div className="h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center mb-6">
        <DumbbellIcon className="text-accent" width={32} height={32} />
      </div>
      <div className="text-[11px] uppercase tracking-widest text-accent font-semibold mb-1">Coach Portal</div>
      <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
      <p className="text-sm text-muted mb-8">Sign in to manage your clients and review check-ins.</p>

      <form onSubmit={submit} className="space-y-3">
        <Input
          type="password"
          placeholder="Passcode"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false) }}
          autoFocus
        />
        {error && <p className="text-sm text-rose-400">Incorrect passcode. Try again.</p>}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>

      <p className="text-xs text-muted mt-6 text-center">
        Demo passcode: <span className="text-white font-mono">{DEMO_PASSCODE}</span>
      </p>
      <Link to="/" className="text-xs text-muted text-center mt-4 underline">← Back to client app</Link>
    </div>
  )
}
