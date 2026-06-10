import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '../lib/supabase'
import { Button, Input, Field, Card } from '../components/ui'
import { todayISO } from '../utils'
import { ACTIVITY, ActivityKey, computeTargets } from '../lib/tdee'

type Unit = 'lb' | 'kg'
type Sex = 'Male' | 'Female' | 'Other'
type Goal = 'cut' | 'maintain' | 'bulk'

const GOALS: { key: Goal; label: string }[] = [
  { key: 'cut', label: 'Lose fat' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'bulk', label: 'Build muscle' },
]

export default function Onboarding() {
  const { session, profile, refreshProfile, signOut } = useAuth()
  const userId = session?.user.id

  const [unit, setUnit] = useState<Unit>('lb')
  const [sex, setSex] = useState<Sex | ''>('')
  const [age, setAge] = useState('')
  const [ft, setFt] = useState('')
  const [inch, setInch] = useState('')
  const [cm, setCm] = useState('')
  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState<Goal>('cut')
  const [goalWeight, setGoalWeight] = useState('')
  const [activity, setActivity] = useState<ActivityKey>('moderate')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const heightCm = unit === 'kg'
    ? num(cm)
    : Math.round((num(ft) * 12 + num(inch)) * 2.54)

  const valid = sex && num(age) > 0 && heightCm > 0 && num(weight) > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !valid) { setError('Please fill in all your stats.'); return }
    setBusy(true); setError('')

    const w = num(weight)
    // Auto-calculate starting calories/macros (coach can adjust later).
    const t = computeTargets({ sex: sex as Sex, age: num(age), heightCm, weightLb: unit === 'kg' ? w * 2.2046226218 : w, activity, goal })
    const [p1, p2, p3] = await Promise.all([
      supabase.from('profiles').update({
        unit, sex, age: num(age), height_cm: heightCm, start_weight: w, activity_level: activity, onboarded: true,
      }).eq('id', userId),
      supabase.from('plans').update({
        goal, goal_weight: goalWeight ? num(goalWeight) : w,
        calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat, water: t.water,
      }).eq('user_id', userId),
      supabase.from('weight_logs').upsert(
        { user_id: userId, date: todayISO(), weight: w }, { onConflict: 'user_id,date' },
      ),
    ])
    setBusy(false)
    const err = p1.error || p2.error || p3.error
    if (err) { setError(err.message); return }
    await refreshProfile()
  }

  return (
    <div className="min-h-full max-w-sm mx-auto px-6 py-10 pt-safe">
      <div className="text-[11px] uppercase tracking-widest text-accent font-semibold mb-1">Welcome{profile?.name ? `, ${profile.name}` : ''}</div>
      <h1 className="text-3xl font-bold mb-1">Your stats</h1>
      <p className="text-sm text-muted mb-6">A few details so your coach can build your plan.</p>

      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-4">
          <div>
            <span className="text-xs text-muted mb-1.5 block">Units</span>
            <div className="flex gap-2">
              {(['lb', 'kg'] as Unit[]).map(u => (
                <Toggle key={u} active={unit === u} onClick={() => setUnit(u)}>{u.toUpperCase()}</Toggle>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted mb-1.5 block">Gender</span>
            <div className="flex gap-2">
              {(['Male', 'Female', 'Other'] as Sex[]).map(s => (
                <Toggle key={s} active={sex === s} onClick={() => setSex(s)}>{s}</Toggle>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age"><Input inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} placeholder="years" /></Field>
            <Field label={`Current weight (${unit})`}><Input inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0" /></Field>
          </div>

          {unit === 'lb' ? (
            <div>
              <span className="text-xs text-muted mb-1.5 block">Height</span>
              <div className="grid grid-cols-2 gap-3">
                <Input inputMode="numeric" value={ft} onChange={e => setFt(e.target.value)} placeholder="ft" />
                <Input inputMode="numeric" value={inch} onChange={e => setInch(e.target.value)} placeholder="in" />
              </div>
            </div>
          ) : (
            <Field label="Height (cm)"><Input inputMode="numeric" value={cm} onChange={e => setCm(e.target.value)} placeholder="cm" /></Field>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <span className="text-xs text-muted mb-1.5 block">Your goal</span>
            <div className="flex gap-2">
              {GOALS.map(g => (
                <Toggle key={g.key} active={goal === g.key} onClick={() => setGoal(g.key)}>{g.label}</Toggle>
              ))}
            </div>
          </div>
          <Field label={`Goal weight (${unit}) — optional`}>
            <Input inputMode="decimal" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} placeholder="0" />
          </Field>
          <div>
            <span className="text-xs text-muted mb-1.5 block">Activity level</span>
            <div className="space-y-2">
              {ACTIVITY.map(a => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setActivity(a.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition flex items-center justify-between ${activity === a.key ? 'bg-accent text-ink-900' : 'bg-ink-700 text-white'}`}
                >
                  <span className="text-sm font-semibold">{a.label}</span>
                  <span className={`text-[11px] ${activity === a.key ? 'text-ink-900/70' : 'text-muted'}`}>{a.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        <p className="text-[11px] text-muted text-center">We’ll set your starting calories &amp; macros from this — your coach can fine-tune them.</p>
        <Button type="submit" className="w-full" disabled={busy || !valid}>
          {busy ? 'Saving…' : 'Continue'}
        </Button>
      </form>

      <button onClick={() => signOut()} className="text-xs text-muted underline mt-6 block mx-auto">Sign out</button>
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${active ? 'bg-accent text-ink-900' : 'bg-ink-700 text-muted'}`}
    >
      {children}
    </button>
  )
}

function num(s: string): number {
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}
