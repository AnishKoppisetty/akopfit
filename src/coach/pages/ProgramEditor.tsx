import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCoach } from '../coachStore'
import { Card, Button, Input } from '../../components/ui'
import { PlusIcon, CheckIcon } from '../../components/icons'
import { TrainingDay, Exercise } from '../../types'
import { uid } from '../../utils'
import { seedData } from '../../seed'

export default function ProgramEditor() {
  const { id } = useParams()
  const { getClient, updateProgram } = useCoach()
  const navigate = useNavigate()
  const client = getClient(id ?? '')

  const [days, setDays] = useState<TrainingDay[]>(() => client ? clone(client.program) : [])
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Client not found.</p>
        <Link to="/coach" className="text-accent underline">Back to roster</Link>
      </div>
    )
  }

  function mutate(fn: (draft: TrainingDay[]) => void) {
    setDays(d => { const copy = clone(d); fn(copy); return copy })
    setDirty(true); setSaved(false)
  }

  const addDay = () => mutate(d => d.push({ id: uid(), label: `Day ${d.length + 1}`, focus: 'New day', rest: false, exercises: [] }))
  const removeDay = (i: number) => mutate(d => { d.splice(i, 1) })
  const setDayField = (i: number, patch: Partial<TrainingDay>) => mutate(d => { d[i] = { ...d[i], ...patch } })
  const addExercise = (i: number) => mutate(d => { d[i].exercises.push({ name: '', sets: 3, reps: '8-12' }) })
  const removeExercise = (i: number, j: number) => mutate(d => { d[i].exercises.splice(j, 1) })
  const setExercise = (i: number, j: number, patch: Partial<Exercise>) => mutate(d => { d[i].exercises[j] = { ...d[i].exercises[j], ...patch } })
  const loadTemplate = () => { if (confirm('Replace the current program with the default Push/Pull/Legs template?')) mutate(d => { d.length = 0; clone(seedData().split).forEach(x => d.push(x)) }) }

  function save() {
    updateProgram(client!.id, days)
    setDirty(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="pb-24">
      <Link to={`/coach/client/${client.id}`} className="text-sm text-muted inline-flex items-center gap-1 mb-3">← {client.name.split(' ')[0]}</Link>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Training program</h1>
        <button onClick={loadTemplate} className="text-xs text-accent font-semibold">Load template</button>
      </div>
      <p className="text-sm text-muted mb-5">Build {client.name.split(' ')[0]}’s split — it shows up in their app.</p>

      <div className="space-y-3">
        {days.map((day, i) => (
          <Card key={day.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={day.label} onChange={e => setDayField(i, { label: e.target.value })} className="w-24 py-2 font-semibold" placeholder="Day 1" />
              <Input value={day.focus} onChange={e => setDayField(i, { focus: e.target.value })} className="flex-1 py-2" placeholder="Push / Legs / Rest…" />
              <button onClick={() => removeDay(i)} className="text-muted hover:text-rose-400 text-xl px-1 shrink-0">×</button>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={day.rest} onChange={e => setDayField(i, { rest: e.target.checked })} className="accent-accent h-4 w-4" />
              Rest day
            </label>

            {!day.rest && (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_3rem_3.5rem_1.5rem] gap-2 text-[11px] text-muted px-1">
                  <span>Exercise</span><span className="text-center">Sets</span><span className="text-center">Reps</span><span />
                </div>
                {day.exercises.map((ex, j) => (
                  <div key={j} className="grid grid-cols-[1fr_3rem_3.5rem_1.5rem] gap-2 items-center">
                    <Input value={ex.name} onChange={e => setExercise(i, j, { name: e.target.value })} className="py-2" placeholder="Exercise name" />
                    <Input inputMode="numeric" value={ex.sets} onChange={e => setExercise(i, j, { sets: +e.target.value || 0 })} className="py-2 text-center px-1" />
                    <Input value={ex.reps} onChange={e => setExercise(i, j, { reps: e.target.value })} className="py-2 text-center px-1" placeholder="8-12" />
                    <button onClick={() => removeExercise(i, j)} className="text-muted hover:text-rose-400 text-lg">×</button>
                  </div>
                ))}
                <button onClick={() => addExercise(i)} className="flex items-center gap-1.5 text-sm text-accent font-semibold pt-1">
                  <PlusIcon width={16} height={16} /> Add exercise
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-3" onClick={addDay}>
        <PlusIcon width={18} height={18} /> Add training day
      </Button>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-ink-900/90 backdrop-blur-xl border-t border-ink-600/60 pb-safe">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <Button className="flex-1" onClick={save} disabled={!dirty}>
            {saved ? <><CheckIcon width={18} height={18} /> Saved</> : dirty ? 'Save program' : 'Saved'}
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/coach/client/${client.id}`)}>Done</Button>
        </div>
      </div>
    </div>
  )
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}
