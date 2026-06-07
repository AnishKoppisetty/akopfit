import { useState } from 'react'
import { useStore } from '../store'
import { Card, Ring, ProgressBar, PageHeader, SectionTitle, Button, Field, Input, Chip } from '../components/ui'
import { PlusIcon } from '../components/icons'
import { todayISO, dayMacros } from '../utils'
import { Meal, SavedFood } from '../types'

const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export default function Nutrition() {
  const { data, getDailyLog, addFood, removeFood, saveToLibrary } = useStore()
  const { targets, foodLibrary } = data
  const today = todayISO()
  const log = getDailyLog(today)
  const foods = log.foods ?? []

  const [adding, setAdding] = useState<Meal | null>(null)

  const totals = dayMacros(log)
  const calsLeft = Math.max(targets.calories - totals.calories, 0)

  const macros = [
    { key: 'protein', label: 'Protein', val: totals.protein, tgt: targets.protein, color: 'bg-rose-400' },
    { key: 'carbs', label: 'Carbs', val: totals.carbs, tgt: targets.carbs, color: 'bg-sky-400' },
    { key: 'fat', label: 'Fat', val: totals.fat, tgt: targets.fat, color: 'bg-amber-400' },
  ]

  const totalCalFromMacros = targets.protein * 4 + targets.carbs * 4 + targets.fat * 9
  const splitPct = {
    protein: Math.round((targets.protein * 4 / totalCalFromMacros) * 100),
    carbs: Math.round((targets.carbs * 4 / totalCalFromMacros) * 100),
    fat: Math.round((targets.fat * 9 / totalCalFromMacros) * 100),
  }

  return (
    <div>
      <PageHeader subtitle="Today" title="Nutrition" />

      <Card className="flex flex-col items-center py-6">
        <Ring value={totals.calories} max={targets.calories} size={170} stroke={15}>
          <div className="text-4xl font-bold tabular-nums leading-none">{calsLeft}</div>
          <div className="text-xs text-muted mt-1">calories left</div>
          <div className="text-[11px] text-muted mt-0.5">{totals.calories} / {targets.calories}</div>
        </Ring>
        <div className="w-full mt-5 space-y-3">
          {macros.map(m => (
            <div key={m.key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">{m.label}</span>
                <span className="tabular-nums text-muted"><span className="text-white">{m.val}</span> / {m.tgt}g</span>
              </div>
              <ProgressBar value={m.val} max={m.tgt} color={m.color} />
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>Food diary</SectionTitle>
      <div className="space-y-3">
        {MEALS.map(meal => {
          const items = foods.filter(f => f.meal === meal)
          const mealCals = items.reduce((a, f) => a + f.calories, 0)
          return (
            <Card key={meal}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{meal}</span>
                <span className="text-xs text-muted tabular-nums">{mealCals} cal</span>
              </div>
              <div className="divide-y divide-ink-600/50">
                {items.map(f => (
                  <div key={f.id} className="flex items-center justify-between py-2 group">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{f.name}</div>
                      <div className="text-[11px] text-muted">{f.calories} cal · {f.protein}p {f.carbs}c {f.fat}f</div>
                    </div>
                    <button onClick={() => removeFood(today, f.id)} className="text-muted hover:text-rose-400 text-lg px-2 shrink-0">×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setAdding(meal)}
                className="mt-2 flex items-center gap-1.5 text-sm text-accent font-semibold"
              >
                <PlusIcon width={16} height={16} /> Add food
              </button>
            </Card>
          )
        })}
      </div>

      <SectionTitle>Your target split</SectionTitle>
      <Card>
        <div className="flex h-3 rounded-full overflow-hidden mb-3">
          <div style={{ width: `${splitPct.protein}%`, background: '#fb7185' }} />
          <div style={{ width: `${splitPct.carbs}%`, background: '#38bdf8' }} />
          <div style={{ width: `${splitPct.fat}%`, background: '#fbbf24' }} />
        </div>
        <div className="grid grid-cols-3 text-center">
          <SplitLeg color="#fb7185" label="Protein" pct={splitPct.protein} grams={targets.protein} />
          <SplitLeg color="#38bdf8" label="Carbs" pct={splitPct.carbs} grams={targets.carbs} />
          <SplitLeg color="#fbbf24" label="Fat" pct={splitPct.fat} grams={targets.fat} />
        </div>
      </Card>

      {adding && (
        <AddFoodSheet
          meal={adding}
          library={foodLibrary}
          onClose={() => setAdding(null)}
          onAdd={(food, alsoSave) => {
            addFood(today, { ...food, meal: adding })
            if (alsoSave) saveToLibrary(food)
          }}
        />
      )}
    </div>
  )
}

function AddFoodSheet({ meal, library, onClose, onAdd }: {
  meal: Meal
  library: SavedFood[]
  onClose: () => void
  onAdd: (food: { name: string; calories: number; protein: number; carbs: number; fat: number }, alsoSave: boolean) => void
}) {
  const [tab, setTab] = useState<'library' | 'custom'>('library')
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const [cal, setCal] = useState('')
  const [p, setP] = useState('')
  const [c, setC] = useState('')
  const [f, setF] = useState('')
  const [save, setSave] = useState(false)

  const filtered = library.filter(l => l.name.toLowerCase().includes(q.toLowerCase()))

  function addCustom() {
    onAdd({ name: name || 'Food', calories: n(cal), protein: n(p), carbs: n(c), fat: n(f) }, save)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-ink-800 rounded-t-3xl border-t border-ink-600 p-5 pb-8 animate-pop max-h-[85vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Add to {meal}</h3>
          <button onClick={onClose} className="text-muted text-2xl leading-none">×</button>
        </div>

        <div className="flex gap-2 mb-4">
          <Chip active={tab === 'library'} onClick={() => setTab('library')}>Quick add</Chip>
          <Chip active={tab === 'custom'} onClick={() => setTab('custom')}>Custom</Chip>
        </div>

        {tab === 'library' ? (
          <>
            <Input placeholder="Search foods…" value={q} onChange={e => setQ(e.target.value)} className="mb-3" />
            <div className="space-y-2">
              {filtered.map(l => (
                <button
                  key={l.id}
                  onClick={() => { onAdd({ name: l.name, calories: l.calories, protein: l.protein, carbs: l.carbs, fat: l.fat }, false); onClose() }}
                  className="w-full flex items-center justify-between bg-ink-700 rounded-xl px-4 py-3 text-left active:scale-[0.98] transition"
                >
                  <div>
                    <div className="text-sm">{l.name}</div>
                    <div className="text-[11px] text-muted">{l.protein}p {l.carbs}c {l.fat}f</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-accent">{l.calories}</div>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted text-center py-4">No matches. Try the Custom tab.</p>}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Field label="Food name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Protein shake" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Calories"><Input inputMode="numeric" value={cal} onChange={e => setCal(e.target.value)} placeholder="0" /></Field>
              <Field label="Protein (g)"><Input inputMode="numeric" value={p} onChange={e => setP(e.target.value)} placeholder="0" /></Field>
              <Field label="Carbs (g)"><Input inputMode="numeric" value={c} onChange={e => setC(e.target.value)} placeholder="0" /></Field>
              <Field label="Fat (g)"><Input inputMode="numeric" value={f} onChange={e => setF(e.target.value)} placeholder="0" /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)} className="accent-accent h-4 w-4" />
              Save to my food library
            </label>
            <Button className="w-full" onClick={addCustom} disabled={!cal && !p && !c && !f}>Add to {meal}</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function SplitLeg({ color, label, pct, grams }: { color: string; label: string; pct: number; grams: number }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-lg font-bold tabular-nums leading-none">{pct}%</div>
      <div className="text-[11px] text-muted">{grams}g</div>
    </div>
  )
}

function n(s: string): number {
  const x = parseInt(s, 10)
  return isNaN(x) ? 0 : x
}
