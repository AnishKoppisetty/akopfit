import { useState } from 'react'
import { Card, Button, Textarea } from '../../components/ui'
import { CheckIn } from '../../types'
import { useCoach } from '../coachStore'
import { prettyDate } from '../../utils'

export function CheckInCard({ clientId, clientName, checkIn, unit, showClient }: {
  clientId: string
  clientName: string
  checkIn: CheckIn
  unit: string
  showClient?: boolean
}) {
  const { replyToCheckIn, data } = useCoach()
  const [reply, setReply] = useState('')
  const [editing, setEditing] = useState(false)

  function send() {
    if (!reply.trim()) return
    replyToCheckIn(clientId, checkIn.id, reply.trim())
    setReply('')
    setEditing(false)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div>
          {showClient && <div className="font-semibold">{clientName}</div>}
          <div className="text-xs text-muted">{prettyDate(checkIn.date)}</div>
        </div>
        {checkIn.weight != null && (
          <div className="text-right">
            <div className="font-semibold tabular-nums">{checkIn.weight} {unit}</div>
            <div className="text-[11px] text-muted">weigh-in</div>
          </div>
        )}
      </div>

      {checkIn.photos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {checkIn.photos.map((src, i) => (
            <img key={i} src={src} className="h-32 w-24 object-cover rounded-lg shrink-0" />
          ))}
        </div>
      )}

      {checkIn.message && <p className="text-sm leading-relaxed text-zinc-200 mb-3">{checkIn.message}</p>}

      <div className="grid grid-cols-4 gap-2 mb-3">
        <Metric label="Adherence" value={checkIn.adherence != null ? `${checkIn.adherence}%` : '—'} />
        <Metric label="Energy" value={rate(checkIn.energy)} />
        <Metric label="Sleep" value={rate(checkIn.sleep)} />
        <Metric label="Hunger" value={rate(checkIn.hunger)} />
      </div>

      {checkIn.coachReply && !editing ? (
        <div className="pl-3 border-l-2 border-accent">
          <div className="flex items-center justify-between mb-0.5">
            <div className="text-[11px] text-accent font-semibold">{data.coachName} replied</div>
            <button onClick={() => { setReply(checkIn.coachReply!); setEditing(true) }} className="text-[11px] text-muted underline">Edit</button>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{checkIn.coachReply}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            rows={3}
            placeholder={`Reply to ${clientName.split(' ')[0]}…`}
            value={reply}
            onChange={e => setReply(e.target.value)}
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={send} disabled={!reply.trim()}>Send reply</Button>
            {editing && <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </div>
      )}
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-700 rounded-lg py-2 text-center">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  )
}

function rate(n?: number): string {
  return n != null ? `${n}/5` : '—'
}
