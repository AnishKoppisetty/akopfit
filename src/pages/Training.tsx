import { useState } from 'react'
import { useStore } from '../store'
import { Card, PageHeader, Chip, Button, Input } from '../components/ui'
import { CheckIcon, DumbbellIcon, ChevronRight } from '../components/icons'
import { todayISO, todaySplitIndex } from '../utils'
import { Exercise, SetEntry } from '../types'

export default function Training() {
  const { data } = useStore()
  const { split } = data
  const todayIdx = todaySplitIndex(split.length)
  const [sel, setSel] = useState(todayIdx)
  const day = split[sel]
  const isToday = sel === todayIdx

  const { getDailyLog, upsertDailyLog } = useStore()
  const today = todayISO()
  const log = getDailyLog(today)
  const done = isToday && !!log.workoutDone

  return (
    <div>
      <PageHeader subtitle="Your split" title="Training" />

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {split.map((d, i) => (
          <Chip key={d.id} active={i === sel} onClick={() => setSel(i)}>
            {i === todayIdx ? '● ' : ''}{d.label}
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
            <div className="text-xs text-muted">{day.label}{isToday ? ' · Today' : ''}</div>
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
              <ExerciseRow key={ex.name} index={i} exercise={ex} loggable={isToday} date={today} />
            ))}
          </div>

          {isToday && (
            <Button
              className="w-full mt-4"
              variant={done ? 'ghost' : 'primary'}
              onClick={() => upsertDailyLog(today, { workoutDone: !done, trainingDayId: day.id })}
            >
              {done ? <><CheckIcon width={18} height={18} /> Workout completed</> : 'Mark workout complete'}
            </Button>
          )}
          {!isToday && <p className="text-center text-xs text-muted mt-4">Switch to today’s day to log your sets.</p>}
        </>
      )}
    </div>
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

  return (
    <Card className="py-3">
      <button className="w-full flex items-center gap-3" onClick={() => loggable && setOpen(o => !o)}>
        <div className="h-8 w-8 rounded-lg bg-ink-700 flex items-center justify-center text-xs font-bold text-muted shrink-0">{index + 1}</div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium truncate">{exercise.name}</div>
          <div className="text-xs text-muted">
            {loggable && loggedCount > 0 ? `${loggedCount}/${exercise.sets} sets logged` : `${exercise.sets} × ${exercise.reps}`}
          </div>
        </div>
        {loggable
          ? <ChevronRight className={`text-muted transition ${open ? 'rotate-90' : ''}`} />
          : <div className="text-right shrink-0"><div className="font-semibold tabular-nums">{exercise.sets} × {exercise.reps}</div><div className="text-[11px] text-muted">sets × reps</div></div>}
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
