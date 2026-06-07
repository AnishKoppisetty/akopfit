import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { useCoach } from '../coachStore'
import { Card, ProgressBar, Button, Field, Input } from '../../components/ui'
import { Avatar, changeColor } from './Roster'
import { CheckInCard } from '../components/CheckInCard'
import { clientStatus, goalLabel } from '../derive'
import { shortDate } from '../../utils'
import { FootprintsIcon, HeartIcon, FlameIcon, DumbbellIcon, CheckIcon } from '../../components/icons'
import { CoachClient } from '../types'
import { Goal } from '../../types'

export default function ClientDetail() {
  const { id } = useParams()
  const { getClient } = useCoach()
  const c = getClient(id ?? '')
  const [editing, setEditing] = useState(false)

  if (!c) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Client not found.</p>
        <Link to="/coach" className="text-accent underline">Back to roster</Link>
      </div>
    )
  }

  const s = clientStatus(c)
  const chart = [...c.weightLogs].sort((a, b) => a.date.localeCompare(b.date)).map(l => ({ ...l, label: shortDate(l.date) }))
  const t = c.today

  return (
    <div>
      <Link to="/coach" className="text-sm text-muted inline-flex items-center gap-1 mb-4">← Roster</Link>

      <div className="flex items-center gap-3 mb-5">
        <Avatar name={c.name} size={56} />
        <div>
          <h1 className="text-2xl font-bold leading-tight">{c.name}</h1>
          <div className="text-sm text-muted">{goalLabel(c.goal)} · joined {c.joinedDaysAgo}d ago</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat value={`${s.currentWeight}`} unit={c.unit} label="Current" />
        <MiniStat value={`${s.weeklyChange > 0 ? '+' : ''}${s.weeklyChange}`} unit="/wk" label="This week" color={changeColor(c.goal, s.weeklyChange)} />
        <MiniStat value={`${s.totalChange > 0 ? '+' : ''}${s.totalChange}`} unit={c.unit} label="Total" color={changeColor(c.goal, s.totalChange)} />
      </div>

      {/* Weight chart */}
      <Card>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold">Weight trend</span>
          <span className="text-xs text-muted">Goal {c.goalWeight} {c.unit}</span>
        </div>
        <div className="h-40 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ background: '#18181d', border: '1px solid #2e2e38', borderRadius: 12, color: '#fff' }} labelStyle={{ color: '#8a8a96' }} />
              <ReferenceLine y={c.goalWeight} stroke="#c6ff2e" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="weight" stroke="#c6ff2e" strokeWidth={2.5} dot={{ r: 3, fill: '#c6ff2e' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Today's adherence */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3 mt-6">Today so far</h2>
      <Card className="space-y-3">
        <AdherenceRow Icon={FlameIcon} label="Calories" value={t.calories} target={c.targets.calories} unit="cal" color="bg-accent" />
        <AdherenceRow Icon={DumbbellIcon} label="Protein" value={t.protein} target={c.targets.protein} unit="g" color="bg-rose-400" />
        <AdherenceRow Icon={FootprintsIcon} label="Steps" value={t.steps} target={c.targets.steps} unit="" color="bg-emerald-400" />
        <AdherenceRow Icon={HeartIcon} label="Cardio" value={t.cardioMinutes} target={c.targets.cardioMinutes} unit="min" color="bg-rose-400" />
        <div className="flex items-center gap-2 pt-1 text-sm">
          <div className={`h-6 w-6 rounded-md flex items-center justify-center ${t.workoutDone ? 'bg-accent text-ink-900' : 'bg-ink-600 text-muted'}`}>
            <CheckIcon width={14} height={14} />
          </div>
          <span className={t.workoutDone ? '' : 'text-muted'}>{t.workoutDone ? 'Workout completed' : 'Workout not logged yet'}</span>
        </div>
      </Card>

      {/* Plan */}
      <div className="flex items-center justify-between mb-3 mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Current plan</h2>
        <button onClick={() => setEditing(true)} className="text-xs text-accent font-semibold">Edit plan</button>
      </div>
      <Card className="space-y-3">
        <div className="flex justify-between text-sm"><span className="text-muted">Goal</span><span className="font-semibold">{goalLabel(c.goal)} · {c.goalWeight} {c.unit}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted">Calories</span><span className="font-semibold tabular-nums">{c.targets.calories}</span></div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Macros (P/C/F)</span>
          <span className="font-semibold tabular-nums">{c.targets.protein} / {c.targets.carbs} / {c.targets.fat}g</span>
        </div>
        <div className="flex justify-between text-sm"><span className="text-muted">Steps · Cardio</span><span className="font-semibold tabular-nums">{c.targets.steps.toLocaleString()} · {c.targets.cardioMinutes}min</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted">Training split</span><span className="font-semibold">{c.splitName}</span></div>
      </Card>

      {/* Training program */}
      <div className="flex items-center justify-between mb-3 mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Training program</h2>
        <Link to={`/coach/client/${c.id}/program`} className="text-xs text-accent font-semibold">Edit program</Link>
      </div>
      <Link to={`/coach/client/${c.id}/program`}>
        <Card className="divide-y divide-ink-600/50">
          {c.program.length === 0 && <p className="text-sm text-muted py-1">No program yet — tap to build one.</p>}
          {c.program.map(day => (
            <div key={day.id} className="flex items-center justify-between py-2.5">
              <div>
                <span className="text-sm font-medium">{day.focus}</span>
                <span className="text-xs text-muted ml-2">{day.label}</span>
              </div>
              <span className="text-xs text-muted">{day.rest ? 'Rest' : `${day.exercises.length} exercises`}</span>
            </div>
          ))}
        </Card>
      </Link>

      {/* Check-ins */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3 mt-6">Check-in history</h2>
      {c.checkIns.length === 0 ? (
        <Card><p className="text-sm text-muted">No check-ins submitted yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {c.checkIns.map(ci => (
            <CheckInCard key={ci.id} clientId={c.id} clientName={c.name} checkIn={ci} unit={c.unit} />
          ))}
        </div>
      )}

      {editing && <EditPlanSheet client={c} onClose={() => setEditing(false)} />}
    </div>
  )
}

const GOALS: { key: Goal; label: string }[] = [
  { key: 'cut', label: 'Cut' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'bulk', label: 'Bulk' },
]

function EditPlanSheet({ client, onClose }: { client: CoachClient; onClose: () => void }) {
  const { updateClient, updateClientTargets } = useCoach()
  const t = client.targets
  const [goal, setGoal] = useState<Goal>(client.goal)
  const [goalWeight, setGoalWeight] = useState(String(client.goalWeight))
  const [splitName, setSplitName] = useState(client.splitName)
  const [calories, setCalories] = useState(String(t.calories))
  const [protein, setProtein] = useState(String(t.protein))
  const [carbs, setCarbs] = useState(String(t.carbs))
  const [fat, setFat] = useState(String(t.fat))
  const [steps, setSteps] = useState(String(t.steps))
  const [cardio, setCardio] = useState(String(t.cardioMinutes))
  const [water, setWater] = useState(String(t.water))

  // live macro calorie cross-check
  const macroCals = num(protein) * 4 + num(carbs) * 4 + num(fat) * 9
  const calMismatch = Math.abs(macroCals - num(calories)) > 75 && num(calories) > 0

  function save() {
    updateClient(client.id, { goal, goalWeight: num(goalWeight), splitName: splitName.trim() || client.splitName })
    updateClientTargets(client.id, {
      calories: num(calories), protein: num(protein), carbs: num(carbs), fat: num(fat),
      steps: num(steps), cardioMinutes: num(cardio), water: num(water),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-lg bg-ink-800 rounded-t-3xl border-t border-ink-600 p-5 pb-8 animate-pop max-h-[88vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Edit {client.name.split(' ')[0]}’s plan</h3>
          <button onClick={onClose} className="text-muted text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs text-muted mb-1.5 block">Goal</span>
            <div className="flex gap-2">
              {GOALS.map(g => (
                <button
                  key={g.key}
                  onClick={() => setGoal(g.key)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${goal === g.key ? 'bg-accent text-ink-900' : 'bg-ink-700 text-muted'}`}
                >{g.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Goal weight (${client.unit})`}><Input inputMode="decimal" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} /></Field>
            <Field label="Training split"><Input value={splitName} onChange={e => setSplitName(e.target.value)} /></Field>
          </div>

          <div>
            <Field label="Calories">
              <Input inputMode="numeric" value={calories} onChange={e => setCalories(e.target.value)} />
            </Field>
            {calMismatch && (
              <p className="text-[11px] text-amber-400 mt-1">
                Heads up: macros add up to ~{macroCals} cal, not {num(calories)}.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Protein (g)"><Input inputMode="numeric" value={protein} onChange={e => setProtein(e.target.value)} /></Field>
            <Field label="Carbs (g)"><Input inputMode="numeric" value={carbs} onChange={e => setCarbs(e.target.value)} /></Field>
            <Field label="Fat (g)"><Input inputMode="numeric" value={fat} onChange={e => setFat(e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Steps"><Input inputMode="numeric" value={steps} onChange={e => setSteps(e.target.value)} /></Field>
            <Field label="Cardio (min)"><Input inputMode="numeric" value={cardio} onChange={e => setCardio(e.target.value)} /></Field>
            <Field label="Water (glasses)"><Input inputMode="numeric" value={water} onChange={e => setWater(e.target.value)} /></Field>
          </div>

          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={save}>Save plan</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function num(s: string): number {
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function MiniStat({ value, unit, label, color }: { value: string; unit: string; label: string; color?: string }) {
  return (
    <Card className="text-center py-3">
      <div className={`text-xl font-bold tabular-nums leading-none ${color ?? ''}`}>{value}<span className="text-xs text-muted font-normal"> {unit}</span></div>
      <div className="text-[11px] text-muted mt-1">{label}</div>
    </Card>
  )
}

function AdherenceRow({ Icon, label, value, target, unit, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="flex items-center gap-1.5 text-muted"><Icon width={15} height={15} /> {label}</span>
        <span className="tabular-nums"><span className="text-white">{value.toLocaleString()}</span> <span className="text-muted">/ {target.toLocaleString()}{unit && ` ${unit}`}</span></span>
      </div>
      <ProgressBar value={value} max={target} color={color} />
    </div>
  )
}
