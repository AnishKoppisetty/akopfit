import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCoach } from '../coachStore'
import { Card, Button, Input } from '../../components/ui'
import { PlusIcon, CheckIcon, GripIcon } from '../../components/icons'
import { TrainingDay, Exercise } from '../../types'
import { uid } from '../../utils'
import { seedData } from '../../seed'

function withIds(days: TrainingDay[]): TrainingDay[] {
  return days.map(d => ({
    ...d,
    id: d.id || uid(),
    exercises: d.exercises.map(e => ({ ...e, id: e.id || uid() })),
  }))
}

export default function ProgramEditor() {
  const { id } = useParams()
  const { getClient, updateProgram } = useCoach()
  const navigate = useNavigate()
  const client = getClient(id ?? '')

  const [days, setDays] = useState<TrainingDay[]>(() => client ? withIds(clone(client.program)) : [])
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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
  const removeDay = (dayId: string) => mutate(d => { const i = d.findIndex(x => x.id === dayId); if (i >= 0) d.splice(i, 1) })
  const setDayField = (dayId: string, patch: Partial<TrainingDay>) => mutate(d => { const day = d.find(x => x.id === dayId); if (day) Object.assign(day, patch) })
  const addExercise = (dayId: string) => mutate(d => { d.find(x => x.id === dayId)?.exercises.push({ id: uid(), name: '', sets: 3, reps: '8-12' }) })
  const removeExercise = (dayId: string, exId: string) => mutate(d => { const day = d.find(x => x.id === dayId); if (day) day.exercises = day.exercises.filter(e => e.id !== exId) })
  const setExercise = (dayId: string, exId: string, patch: Partial<Exercise>) => mutate(d => {
    const ex = d.find(x => x.id === dayId)?.exercises.find(e => e.id === exId)
    if (ex) Object.assign(ex, patch)
  })
  const loadTemplate = () => { if (confirm('Replace the current program with the default Push/Pull/Legs template?')) { setDays(withIds(clone(seedData().split))); setDirty(true); setSaved(false) } }

  const onDaysDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    setDays(d => arrayMove(d, d.findIndex(x => x.id === e.active.id), d.findIndex(x => x.id === e.over!.id)))
    setDirty(true); setSaved(false)
  }
  const onExercisesDragEnd = (dayId: string) => (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    setDays(d => d.map(day => {
      if (day.id !== dayId) return day
      const oldI = day.exercises.findIndex(x => x.id === e.active.id)
      const newI = day.exercises.findIndex(x => x.id === e.over!.id)
      return { ...day, exercises: arrayMove(day.exercises, oldI, newI) }
    }))
    setDirty(true); setSaved(false)
  }

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
      <p className="text-sm text-muted mb-5">Build {client.name.split(' ')[0]}’s split — drag the ⠿ handles to reorder.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDaysDragEnd}>
        <SortableContext items={days.map(d => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {days.map(day => (
              <SortableDay
                key={day.id}
                day={day}
                sensors={sensors}
                onField={patch => setDayField(day.id, patch)}
                onRemove={() => removeDay(day.id)}
                onAddExercise={() => addExercise(day.id)}
                onExerciseChange={(exId, patch) => setExercise(day.id, exId, patch)}
                onExerciseRemove={exId => removeExercise(day.id, exId)}
                onExercisesDragEnd={onExercisesDragEnd(day.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="outline" className="w-full mt-3" onClick={addDay}>
        <PlusIcon width={18} height={18} /> Add training day
      </Button>

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

function SortableDay({ day, sensors, onField, onRemove, onAddExercise, onExerciseChange, onExerciseRemove, onExercisesDragEnd }: {
  day: TrainingDay
  sensors: ReturnType<typeof useSensors>
  onField: (patch: Partial<TrainingDay>) => void
  onRemove: () => void
  onAddExercise: () => void
  onExerciseChange: (exId: string, patch: Partial<Exercise>) => void
  onExerciseRemove: (exId: string) => void
  onExercisesDragEnd: (e: DragEndEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 20 : undefined }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <button className="touch-none cursor-grab text-muted shrink-0 px-0.5" {...attributes} {...listeners} aria-label="Drag day">
            <GripIcon width={18} height={18} />
          </button>
          <Input value={day.label} onChange={e => onField({ label: e.target.value })} className="w-20 py-2 font-semibold px-2" placeholder="Day 1" />
          <Input value={day.focus} onChange={e => onField({ focus: e.target.value })} className="flex-1 py-2" placeholder="Push / Legs…" />
          <button onClick={onRemove} className="text-muted hover:text-rose-400 text-xl px-1 shrink-0">×</button>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={day.rest} onChange={e => onField({ rest: e.target.checked })} className="accent-accent h-4 w-4" />
          Rest day
        </label>

        {!day.rest && (
          <div className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onExercisesDragEnd}>
              <SortableContext items={day.exercises.map(e => e.id!)} strategy={verticalListSortingStrategy}>
                {day.exercises.map(ex => (
                  <SortableExercise key={ex.id} ex={ex} onChange={patch => onExerciseChange(ex.id!, patch)} onRemove={() => onExerciseRemove(ex.id!)} />
                ))}
              </SortableContext>
            </DndContext>
            <button onClick={onAddExercise} className="flex items-center gap-1.5 text-sm text-accent font-semibold pt-1">
              <PlusIcon width={16} height={16} /> Add exercise
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

function SortableExercise({ ex, onChange, onRemove }: { ex: Exercise; onChange: (patch: Partial<Exercise>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id! })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="bg-ink-700 rounded-xl p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <button className="touch-none cursor-grab text-muted shrink-0" {...attributes} {...listeners} aria-label="Drag exercise">
          <GripIcon width={16} height={16} />
        </button>
        <Input value={ex.name} onChange={e => onChange({ name: e.target.value })} className="flex-1 py-2 bg-ink-600" placeholder="Exercise name" />
        <button onClick={onRemove} className="text-muted hover:text-rose-400 text-lg shrink-0">×</button>
      </div>
      <div className="grid grid-cols-3 gap-2 pl-6">
        <Mini label="Sets">
          <Input inputMode="numeric" value={ex.sets} onChange={e => onChange({ sets: +e.target.value || 0 })} className="py-1.5 text-center px-1 bg-ink-600" />
        </Mini>
        <Mini label="Reps">
          <Input value={ex.reps} onChange={e => onChange({ reps: e.target.value })} className="py-1.5 text-center px-1 bg-ink-600" placeholder="8-12" />
        </Mini>
        <Mini label="RPE">
          <select
            value={ex.rpe ?? ''}
            onChange={e => onChange({ rpe: e.target.value === '' ? undefined : +e.target.value })}
            className="w-full bg-ink-600 border border-ink-600 rounded-xl px-2 py-1.5 text-white text-center outline-none focus:border-accent"
          >
            <option value="">—</option>
            {Array.from({ length: 11 }, (_, n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Mini>
      </div>
      <div className="pl-6">
        <Input value={ex.notes ?? ''} onChange={e => onChange({ notes: e.target.value })} className="py-1.5 bg-ink-600 text-sm" placeholder="Notes — tempo, cues…" />
      </div>
    </div>
  )
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-muted mb-1 text-center">{label}</div>
      {children}
    </div>
  )
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}
