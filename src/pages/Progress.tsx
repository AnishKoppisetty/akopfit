import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { useStore } from '../store'
import { Card, PageHeader, SectionTitle, Button, Field, Input, ProgressBar } from '../components/ui'
import { FootprintsIcon, HeartIcon } from '../components/icons'
import { shortDate, prettyDate } from '../utils'
import { useSelectedDate } from '../components/SelectedDate'
import { DateNav } from '../components/DateNav'

export default function Progress() {
  const { data, addWeight, getDailyLog, upsertDailyLog } = useStore()
  const { weightLogs, profile, targets } = data
  const { date } = useSelectedDate()
  const log = getDailyLog(date)

  const [w, setW] = useState('')
  const [steps, setSteps] = useState('')
  const [cardio, setCardio] = useState('')
  const [cardioType, setCardioType] = useState('')

  const chartData = weightLogs.map(l => ({ ...l, label: shortDate(l.date) }))
  const current = weightLogs[weightLogs.length - 1]?.weight ?? profile.startWeight
  const start = profile.startWeight
  const changed = +(current - start).toFixed(1)
  // Distance to goal, accounting for whether the goal is to gain or lose.
  const remaining = +Math.abs(profile.goalWeight - current).toFixed(1)
  const goalDir = profile.goalWeight - start // > 0 gaining, < 0 losing
  const reachedGoal = goalDir > 0
    ? current >= profile.goalWeight
    : goalDir < 0
      ? current <= profile.goalWeight
      : remaining < 0.5

  function saveWeight() {
    const n = parseFloat(w)
    if (isNaN(n)) return
    addWeight({ date, weight: n })
    setW('')
  }

  function saveActivity() {
    const patch: any = {}
    if (steps) patch.steps = parseInt(steps, 10)
    if (cardio) patch.cardioMinutes = parseInt(cardio, 10)
    if (cardioType) patch.cardioType = cardioType
    upsertDailyLog(date, patch)
    setSteps(''); setCardio(''); setCardioType('')
  }

  return (
    <div>
      <PageHeader subtitle="Your progress" title="Progress" />

      <Card>
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <div className="text-3xl font-bold tabular-nums">{current}<span className="text-base text-muted font-normal"> {profile.unit}</span></div>
            <div className="text-xs text-muted">current weight</div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-semibold tabular-nums ${(goalDir >= 0 ? changed >= 0 : changed <= 0) ? 'text-accent' : 'text-rose-400'}`}>
              {changed > 0 ? '+' : ''}{changed} {profile.unit}
            </div>
            <div className="text-xs text-muted">since start</div>
          </div>
        </div>

        <div className="h-44 mt-3 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip
                contentStyle={{ background: '#18181d', border: '1px solid #2e2e38', borderRadius: 12, color: '#fff' }}
                labelStyle={{ color: '#8a8a96' }}
              />
              <ReferenceLine y={profile.goalWeight} stroke="#c6ff2e" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="weight" stroke="#c6ff2e" strokeWidth={2.5} dot={{ r: 3, fill: '#c6ff2e' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>Goal: {profile.goalWeight} {profile.unit}</span>
          <span>{reachedGoal ? 'goal reached 🎉' : `${remaining} ${profile.unit} to go`}</span>
        </div>
      </Card>

      <SectionTitle>Log for a day</SectionTitle>
      <DateNav />
      <Card className="flex gap-3 items-end">
        <Field label={`Weight (${profile.unit})`}>
          <Input inputMode="decimal" value={w} onChange={e => setW(e.target.value)} placeholder={`${current}`} />
        </Field>
        <Button onClick={saveWeight} disabled={!w}>Save</Button>
      </Card>

      <SectionTitle>Daily activity</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card>
          <div className="flex items-center gap-2 text-muted mb-2"><FootprintsIcon width={18} height={18} /><span className="text-xs">Steps</span></div>
          <div className="text-2xl font-bold tabular-nums">{(log.steps ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-muted mb-2">/ {targets.steps.toLocaleString()}</div>
          <ProgressBar value={log.steps ?? 0} max={targets.steps} color="bg-emerald-400" />
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-muted mb-2"><HeartIcon width={18} height={18} /><span className="text-xs">Cardio</span></div>
          <div className="text-2xl font-bold tabular-nums">{log.cardioMinutes ?? 0}<span className="text-base font-normal text-muted"> min</span></div>
          <div className="text-[11px] text-muted mb-2">{log.cardioType || `/ ${targets.cardioMinutes} min`}</div>
          <ProgressBar value={log.cardioMinutes ?? 0} max={targets.cardioMinutes} color="bg-rose-400" />
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Steps"><Input inputMode="numeric" value={steps} onChange={e => setSteps(e.target.value)} placeholder={`${log.steps ?? 0}`} /></Field>
          <Field label="Cardio (min)"><Input inputMode="numeric" value={cardio} onChange={e => setCardio(e.target.value)} placeholder={`${log.cardioMinutes ?? 0}`} /></Field>
        </div>
        <Field label="Cardio type">
          <Input value={cardioType} onChange={e => setCardioType(e.target.value)} placeholder="Incline walk, StairMaster…" />
        </Field>
        <Button className="w-full" onClick={saveActivity} disabled={!steps && !cardio && !cardioType}>Save activity</Button>
      </Card>

      <SectionTitle>Weight history</SectionTitle>
      <Card className="divide-y divide-ink-600/60">
        {[...weightLogs].reverse().map(l => (
          <div key={l.date} className="flex justify-between py-2.5 text-sm">
            <span className="text-muted">{prettyDate(l.date)}</span>
            <span className="font-semibold tabular-nums">{l.weight} {profile.unit}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
