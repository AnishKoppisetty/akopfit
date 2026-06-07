import { useStore } from '../store'
import { Card, PageHeader, SectionTitle, Button, Field, Input } from '../components/ui'
import { Goal } from '../types'

const GOALS: { key: Goal; label: string }[] = [
  { key: 'cut', label: 'Cut' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'bulk', label: 'Bulk' },
]

export default function Settings() {
  const { data, updateProfile, updateTargets, resetAll } = useStore()
  const { profile, targets } = data

  return (
    <div>
      <PageHeader subtitle="Account" title="Settings" />

      <SectionTitle>Profile</SectionTitle>
      <Card className="space-y-3">
        <Field label="Your name"><Input value={profile.name} onChange={e => updateProfile({ name: e.target.value })} /></Field>
        <Field label="Coach name"><Input value={profile.coachName} onChange={e => updateProfile({ coachName: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Start weight (${profile.unit})`}>
            <Input inputMode="decimal" value={profile.startWeight} onChange={e => updateProfile({ startWeight: +e.target.value })} />
          </Field>
          <Field label={`Goal weight (${profile.unit})`}>
            <Input inputMode="decimal" value={profile.goalWeight} onChange={e => updateProfile({ goalWeight: +e.target.value })} />
          </Field>
        </div>
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

      <SectionTitle>Daily targets</SectionTitle>
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

      <SectionTitle>Data</SectionTitle>
      <Card>
        <p className="text-sm text-muted mb-3">Your data is saved on this device. Resetting restores the demo data.</p>
        <Button variant="outline" className="w-full" onClick={() => { if (confirm('Reset all data to the demo state?')) resetAll() }}>
          Reset to demo data
        </Button>
      </Card>

      <p className="text-center text-[11px] text-muted mt-6">AkopFit · v0.1 · made for {profile.coachName}</p>
    </div>
  )
}
