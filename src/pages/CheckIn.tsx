import { useState, useRef } from 'react'
import { useStore } from '../store'
import { Card, PageHeader, SectionTitle, Button, Field, Input, Textarea } from '../components/ui'
import { CameraIcon, PlusIcon } from '../components/icons'
import { todayISO, prettyDate } from '../utils'

const RATINGS = [
  { key: 'energy', label: 'Energy' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'hunger', label: 'Hunger' },
] as const

export default function CheckIn() {
  const { data, addCheckIn } = useStore()
  const { checkIns, profile } = data
  const fileRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [weight, setWeight] = useState('')
  const [adherence, setAdherence] = useState(85)
  const [ratings, setRatings] = useState<Record<string, number>>({ energy: 3, sleep: 3, hunger: 3 })
  const [submitted, setSubmitted] = useState(false)

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPhotos(p => [...p, reader.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function submit() {
    addCheckIn({
      date: todayISO(),
      weight: weight ? parseFloat(weight) : undefined,
      message,
      photos,
      energy: ratings.energy,
      sleep: ratings.sleep,
      hunger: ratings.hunger,
      adherence,
    })
    setSubmitted(true)
    setPhotos([]); setMessage(''); setWeight('')
    setTimeout(() => setSubmitted(false), 2500)
  }

  return (
    <div>
      <PageHeader subtitle="Weekly" title="Check-in" />

      {submitted && (
        <Card className="mb-4 border-accent/40 bg-accent/10 animate-pop">
          <p className="text-sm font-medium text-accent">✓ Check-in sent to {profile.coachName}!</p>
        </Card>
      )}

      <Card className="space-y-4">
        <div>
          <span className="text-xs text-muted mb-2 block">Progress photos</span>
          <div className="flex gap-2 flex-wrap">
            {photos.map((src, i) => (
              <div key={i} className="relative h-24 w-20 rounded-xl overflow-hidden">
                <img src={src} className="h-full w-full object-cover" />
                <button
                  onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white text-xs leading-none"
                >×</button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="h-24 w-20 rounded-xl border-2 border-dashed border-ink-500 flex flex-col items-center justify-center text-muted gap-1 active:scale-95 transition"
            >
              <CameraIcon width={22} height={22} />
              <PlusIcon width={14} height={14} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
        </div>

        <Field label={`Weigh-in (${profile.unit})`}>
          <Input inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Optional" />
        </Field>

        <div>
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Plan adherence</span><span className="text-accent font-semibold">{adherence}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={adherence}
            onChange={e => setAdherence(+e.target.value)}
            className="w-full accent-accent"
          />
        </div>

        {RATINGS.map(r => (
          <div key={r.key}>
            <span className="text-xs text-muted mb-1.5 block">{r.label}</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRatings(rs => ({ ...rs, [r.key]: n }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    ratings[r.key] === n ? 'bg-accent text-ink-900' : 'bg-ink-700 text-muted'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>
        ))}

        <Field label="How did the week go?">
          <Textarea
            rows={4} value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Training, nutrition, stress, sleep, wins, struggles…"
          />
        </Field>

        <Button className="w-full" onClick={submit} disabled={!message && photos.length === 0}>
          Send check-in to {profile.coachName}
        </Button>
      </Card>

      <SectionTitle>Past check-ins</SectionTitle>
      <div className="space-y-3">
        {checkIns.length === 0 && <p className="text-sm text-muted">No check-ins yet.</p>}
        {checkIns.map(ci => (
          <Card key={ci.id}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">{prettyDate(ci.date)}</span>
              {ci.weight && <span className="text-sm tabular-nums text-muted">{ci.weight} {profile.unit}</span>}
            </div>
            {ci.photos.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                {ci.photos.map((src, i) => (
                  <img key={i} src={src} className="h-28 w-20 object-cover rounded-lg shrink-0" />
                ))}
              </div>
            )}
            {ci.message && <p className="text-sm leading-relaxed text-zinc-200">{ci.message}</p>}
            <div className="flex gap-3 mt-2 text-[11px] text-muted">
              {ci.adherence != null && <span>Adherence {ci.adherence}%</span>}
              {ci.energy != null && <span>Energy {ci.energy}/5</span>}
              {ci.sleep != null && <span>Sleep {ci.sleep}/5</span>}
            </div>
            {ci.coachReply && (
              <div className="mt-3 pl-3 border-l-2 border-accent">
                <div className="text-[11px] text-accent font-semibold mb-0.5">{profile.coachName}</div>
                <p className="text-sm text-zinc-200 leading-relaxed">{ci.coachReply}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
