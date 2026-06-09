import { useState } from 'react'
import { useStore } from '../store'
import { useAuth } from '../auth/AuthProvider'
import { Card, PageHeader, SectionTitle, Button, Field, Input } from '../components/ui'
import { NotificationsCard } from '../components/NotificationsCard'
import { Goal } from '../types'

const GOALS: { key: Goal; label: string }[] = [
  { key: 'cut', label: 'Cut' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'bulk', label: 'Bulk' },
]

const GOAL_LABEL: Record<Goal, string> = { cut: 'Cutting', maintain: 'Maintaining', bulk: 'Bulking' }

export default function Settings() {
  const { data, updateProfile, updateTargets, resetAll } = useStore()
  const { configured, profile: account, signOut } = useAuth()
  const { profile, targets } = data

  return (
    <div>
      <PageHeader subtitle="Account" title="Settings" />

      <SectionTitle>Profile</SectionTitle>
      <Card className="space-y-3">
        <Field label="Your name"><Input value={profile.name} onChange={e => updateProfile({ name: e.target.value })} /></Field>
        {!configured && (
          <Field label="Coach name"><Input value={profile.coachName} onChange={e => updateProfile({ coachName: e.target.value })} /></Field>
        )}
        <Field label={`Start weight (${profile.unit})`}>
          <Input inputMode="decimal" value={profile.startWeight} onChange={e => updateProfile({ startWeight: +e.target.value })} />
        </Field>
        <div>
          <span className="text-xs text-muted mb-1.5 block">Units</span>
          <div className="flex gap-2">
            {(['lb', 'kg'] as const).map(u => (
              <button
                key={u}
                onClick={() => updateProfile({ unit: u })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  profile.unit === u ? 'bg-accent text-ink-900' : 'bg-ink-700 text-muted'
                }`}
              >{u.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </Card>

      {/* Goal: client-editable in demo mode, coach-owned when signed in */}
      {!configured ? (
        <Card className="mt-3 space-y-3">
          <Field label={`Goal weight (${profile.unit})`}>
            <Input inputMode="decimal" value={profile.goalWeight} onChange={e => updateProfile({ goalWeight: +e.target.value })} />
          </Field>
          <div>
            <span className="text-xs text-muted mb-1.5 block">Goal</span>
            <div className="flex gap-2">
              {GOALS.map(g => (
                <button
                  key={g.key}
                  onClick={() => updateProfile({ goal: g.key })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                    profile.goal === g.key ? 'bg-accent text-ink-900' : 'bg-ink-700 text-muted'
                  }`}
                >{g.label}</button>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      <SectionTitle>{configured ? 'Your plan' : 'Daily targets'}</SectionTitle>
      {configured ? (
        <Card className="space-y-2.5">
          <p className="text-xs text-muted mb-1">Set by your coach 🔒</p>
          <PlanRow label="Goal" value={`${GOAL_LABEL[profile.goal]} · ${profile.goalWeight} ${profile.unit}`} />
          <PlanRow label="Calories" value={`${targets.calories}`} />
          <PlanRow label="Protein / Carbs / Fat" value={`${targets.protein} / ${targets.carbs} / ${targets.fat} g`} />
          <PlanRow label="Steps" value={targets.steps.toLocaleString()} />
          <PlanRow label="Cardio" value={`${targets.cardioMinutes} min`} />
          <PlanRow label="Water" value={`${targets.water} glasses`} />
        </Card>
      ) : (
        <Card className="space-y-3">
          <Field label="Calories"><Input inputMode="numeric" value={targets.calories} onChange={e => updateTargets({ calories: +e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Protein (g)"><Input inputMode="numeric" value={targets.protein} onChange={e => updateTargets({ protein: +e.target.value })} /></Field>
            <Field label="Carbs (g)"><Input inputMode="numeric" value={targets.carbs} onChange={e => updateTargets({ carbs: +e.target.value })} /></Field>
            <Field label="Fat (g)"><Input inputMode="numeric" value={targets.fat} onChange={e => updateTargets({ fat: +e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Steps goal"><Input inputMode="numeric" value={targets.steps} onChange={e => updateTargets({ steps: +e.target.value })} /></Field>
            <Field label="Cardio (min)"><Input inputMode="numeric" value={targets.cardioMinutes} onChange={e => updateTargets({ cardioMinutes: +e.target.value })} /></Field>
            <Field label="Water (glasses)"><Input inputMode="numeric" value={targets.water} onChange={e => updateTargets({ water: +e.target.value })} /></Field>
          </div>
        </Card>
      )}

      {configured ? (
        <>
          <SectionTitle>Account</SectionTitle>
          <Card className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm truncate">{account?.email ?? 'Signed in'}</div>
              <div className="text-[11px] text-muted">Synced to the cloud</div>
            </div>
            <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
          </Card>
          <NotificationsCard />
          <ChangePassword />
        </>
      ) : (
        <>
          <SectionTitle>Data</SectionTitle>
          <Card>
            <p className="text-sm text-muted mb-3">Your data is saved on this device. Resetting restores the demo data.</p>
            <Button variant="outline" className="w-full" onClick={() => { if (confirm('Reset all data to the demo state?')) resetAll() }}>
              Reset to demo data
            </Button>
          </Card>
          <a href="/coach" className="block text-center text-xs text-muted underline mt-6">Coach portal →</a>
        </>
      )}

      <p className="text-center text-[11px] text-muted mt-4">AkopFit · v0.1</p>
    </div>
  )
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function ChangePassword() {
  const { updatePassword } = useAuth()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function save() {
    setMsg(null)
    if (pw.length < 6) { setMsg({ ok: false, text: 'Password must be at least 6 characters.' }); return }
    if (pw !== confirm) { setMsg({ ok: false, text: 'Passwords don’t match.' }); return }
    setBusy(true)
    const { error } = await updatePassword(pw)
    setBusy(false)
    if (error) setMsg({ ok: false, text: error })
    else { setMsg({ ok: true, text: 'Password updated ✓' }); setPw(''); setConfirm('') }
  }

  return (
    <>
      <SectionTitle>Change password</SectionTitle>
      <Card className="space-y-3">
        <Field label="New password"><Input type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="6+ characters" /></Field>
        <Field label="Confirm new password"><Input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" /></Field>
        {msg && <p className={`text-sm ${msg.ok ? 'text-accent' : 'text-rose-400'}`}>{msg.text}</p>}
        <Button className="w-full" onClick={save} disabled={busy || !pw || !confirm}>{busy ? 'Updating…' : 'Update password'}</Button>
      </Card>
    </>
  )
}
