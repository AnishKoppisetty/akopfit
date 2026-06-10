import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Card, PageHeader, Chip, Button, Input } from '../components/ui'
import { CheckIcon, DumbbellIcon, ChevronRight } from '../components/icons'
import { todaySplitIndex, prettyDate } from '../utils'
import { useSelectedDate } from '../components/SelectedDate'
import { DateNav } from '../components/DateNav'
import { Exercise, SetEntry } from '../types'

function presc(ex: Exercise): string {
  return `${ex.sets} × ${ex.reps}${ex.rpe != null ? ` · RPE ${ex.rpe}` : ''}`
}

export default function Training() {
  const { data, getDailyLog, upsertDailyLog } = useStore()
  const { split } = data
  const navigate = useNavigate()
  const { date } = useSelectedDate()
  const suggestedIdx = todaySplitIndex(split.length)
  const [sel, setSel] = useState(suggestedIdx)
  const day = split[sel]
  const isSuggested = sel === suggestedIdx

  const log = getDailyLog(date)
  const done = !!log.workoutDone && log.trainingDayId === day.id

  return (
    <div>
      <PageHeader subtitle="Your split" title="Training" />
      <DateNav />

      {data.proposalPending ? (
        <Card className="mb-3 border-accent/30 bg-accent/[0.05] flex items-center justify-between">
          <span className="text-sm">Plan changes pending coach review ⏳</span>
          <button onClick={() => navigate('/edit-plan')} className="text-xs text-accent font-semibold shrink-0 ml-3">View</button>
        </Card>
      ) : (
        <button onClick={() => navigate('/edit-plan')} className="w-full mb-3 text-left text-sm text-accent font-semibold flex items-center justify-between bg-ink-800 border border-ink-600/60 rounded-xl2 px-4 py-2.5">
          Request plan changes
          <ChevronRight width={16} height={16} />
        </button>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {split.map((d, i) => (
          <Chip key={d.id} active={i === sel} onClick={() => setSel(i)}>
            {i === suggestedIdx ? '● ' : ''}{d.label}
          </Chip>
        ))}
      </div>

      <Card className="mt-4">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${day.rest ? 'bg-ink-600' : 'bg-accent/15'}`}>
            <DumbbellIcon className={day.rest ? 'text-muted' : 'text-accent'} width={22} height={22} />
          </div>
          <div>
            <div className="text-xl font-bold">{day.rest ? 'Rest Day' : day.focus}</div>
            <div className="text-xs text-muted">{day.label}{isSuggested ? ' · Suggested' : ''}</div>
          </div>
        </div>
      </Card>

      {day.rest ? (
        <Card className="mt-3 text-center py-8">
          <p className="text-muted text-sm">Recovery day. Get your steps in, hydrate, and rest up. 💤</p>
        </Card>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {day.exercises.map((ex, i) => (
              <ExerciseRow key={ex.name} index={i} exercise={ex} loggable={!day.rest} date={date} />
            ))}
          </div>

          <Button
            className="w-full mt-4"
            variant={done ? 'ghost' : 'primary'}
            onClick={() => upsertDailyLog(date, { workoutDone: !done, trainingDayId: day.id })}
          >
            {done ? <><CheckIcon width={18} height={18} /> Workout completed</> : 'Mark workout complete'}
          </Button>
        </>
      )}

      <PreviousWorkouts />
    </div>
  )
}

function PreviousWorkouts() {
  const { data } = useStore()
  const [openDate, setOpenDate] = useState<string | null>(null)

  const sessions = Object.values(data.dailyLogs)
    .filter(l => l.workoutDone || (l.sets && Object.values(l.sets).some(s => s.length > 0)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)

  if (sessions.length === 0) return null

  const focusFor = (id?: string) => data.split.find(d => d.id === id)?.focus

  return (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3 mt-8">Previous workouts</h2>
      <div className="space-y-2">
        {sessions.map(s => {
          const entries = Object.entries(s.sets ?? {}).filter(([, sets]) => sets.some(x => x.weight > 0 || x.reps > 0))
          const isOpen = openDate === s.date
          return (
            <Card key={s.date} className="py-3">
              <button className="w-full flex items-center justify-between" onClick={() => setOpenDate(isOpen ? null : s.date)}>
                <div className="text-left">
                  <div className="font-medium">{focusFor(s.trainingDayId) || 'Workout'}</div>
                  <div className="text-xs text-muted">{prettyDate(s.date)} · {entries.length} exercise{entries.length === 1 ? '' : 's'} logged</div>
                </div>
                <ChevronRight className={`text-muted transition ${isOpen ? 'rotate-90' : ''}`} />
              </button>
              {isOpen && entries.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-ink-600/50 pt-3">
                  {entries.map(([name, sets]) => (
                    <div key={name} className="flex justify-between text-sm">
                      <span className="text-muted truncate mr-2">{name}</span>
                      <span className="tabular-nums shrink-0">{sets.filter(x => x.weight > 0 || x.reps > 0).map(x => `${x.weight}×${x.reps}`).join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </>
  )
}

function ExerciseRow({ index, exercise, loggable, date }: { index: number; exercise: Exercise; loggable: boolean; date: string }) {
  const { getDailyLog, setExerciseSets, lastSetsFor } = useStore()
  const [open, setOpen] = useState(false)
  const log = getDailyLog(date)
  const logged = log.sets?.[exercise.name] ?? []
  const last = lastSetsFor(exercise.name, date)

  const loggedCount = logged.filter(s => s.weight > 0 || s.reps > 0).length

  function ensureRows(): SetEntry[] {
    if (logged.length >= exercise.sets) return logged
    const rows = [...logged]
    while (rows.length < exercise.sets) rows.push({ weight: 0, reps: 0 })
    return rows
  }

  function update(i: number, patch: Partial<SetEntry>) {
    const rows = ensureRows().map((s, j) => (j === i ? { ...s, ...patch } : s))
    setExerciseSets(date, exercise.name, rows)
  }

  const filled = loggedCount > 0

  return (
    <Card className={`py-3 transition ${filled ? 'border-accent/50 bg-accent/[0.04]' : ''}`}>
      <button className="w-full flex items-center gap-3" onClick={() => loggable && setOpen(o => !o)}>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${filled ? 'bg-accent text-ink-900' : 'bg-ink-700 text-muted'}`}>
          {filled ? <CheckIcon width={16} height={16} /> : index + 1}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium truncate">{exercise.name}</div>
          <div className="text-xs text-muted">
            {loggable && loggedCount > 0 ? `${loggedCount}/${exercise.sets} sets logged` : presc(exercise)}
          </div>
          {exercise.notes && <div className="text-[11px] text-muted/80 italic truncate mt-0.5">{exercise.notes}</div>}
        </div>
        {loggable
          ? <ChevronRight className={`text-muted transition shrink-0 ${open ? 'rotate-90' : ''}`} />
          : <div className="text-right shrink-0"><div className="font-semibold tabular-nums">{exercise.sets} × {exercise.reps}</div><div className="text-[11px] text-muted">{exercise.rpe != null ? `RPE ${exercise.rpe}` : 'sets × reps'}</div></div>}
      </button>

      {loggable && open && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-[11px] text-muted px-1">
            <span>Set</span><span>Weight</span><span>Reps</span>
          </div>
          {ensureRows().map((s, i) => (
            <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 items-center">
              <span className="text-sm text-muted text-center">{i + 1}</span>
              <Input inputMode="decimal" value={s.weight || ''} placeholder={last?.[i] ? `${last[i].weight}` : '0'} onChange={e => update(i, { weight: +e.target.value || 0 })} className="py-2 text-center" />
              <Input inputMode="numeric" value={s.reps || ''} placeholder={last?.[i] ? `${last[i].reps}` : exercise.reps} onChange={e => update(i, { reps: +e.target.value || 0 })} className="py-2 text-center" />
            </div>
          ))}
          {last && (
            <p className="text-[11px] text-muted pt-1">
              Last time: {last.map(s => `${s.weight}×${s.reps}`).join(', ')}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
