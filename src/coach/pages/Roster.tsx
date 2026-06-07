import { Link } from 'react-router-dom'
import { useCoach } from '../coachStore'
import { Card } from '../../components/ui'
import { ChevronRight } from '../../components/icons'
import { clientStatus, initials, goalLabel } from '../derive'
import { CheckInState } from '../types'

export default function Roster() {
  const { data } = useCoach()
  const clients = data.clients

  const statuses = clients.map(c => ({ c, s: clientStatus(c) }))
  const needsReply = statuses.filter(x => x.s.checkInState === 'needs-reply').length
  const offTrack = statuses.filter(x => !x.s.onTrack).length

  // sort: needs-reply first, then off-track, then by name
  const order: Record<CheckInState, number> = { 'needs-reply': 0, 'overdue': 1, 'reviewed': 2, 'none': 1 }
  const sorted = [...statuses].sort((a, b) => {
    const d = order[a.s.checkInState] - order[b.s.checkInState]
    return d !== 0 ? d : a.c.name.localeCompare(b.c.name)
  })

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryStat value={clients.length} label="Clients" />
        <SummaryStat value={needsReply} label="Need reply" accent={needsReply > 0} />
        <SummaryStat value={offTrack} label="Off track" warn={offTrack > 0} />
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Your clients</h2>
      {clients.length === 0 && (
        <Card className="text-center py-10">
          <div className="text-3xl mb-2">👋</div>
          <div className="font-semibold mb-1">No clients yet</div>
          <p className="text-sm text-muted px-4">
            Share your app link and have clients sign in with their email — they’ll show up here automatically.
          </p>
        </Card>
      )}
      <div className="space-y-2.5">
        {sorted.map(({ c, s }) => (
          <Link key={c.id} to={`/coach/client/${c.id}`}>
            <Card className="flex items-center gap-3 py-3">
              <Avatar name={c.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{c.name}</span>
                  <StatusDot state={s.checkInState} />
                </div>
                <div className="text-xs text-muted truncate">
                  {goalLabel(c.goal)} · {c.splitName}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold tabular-nums leading-tight">{s.currentWeight}<span className="text-xs text-muted font-normal"> {c.unit}</span></div>
                <div className={`text-xs tabular-nums ${changeColor(c.goal, s.weeklyChange)}`}>
                  {s.weeklyChange > 0 ? '+' : ''}{s.weeklyChange}/wk
                </div>
              </div>
              <ChevronRight className="text-muted shrink-0" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SummaryStat({ value, label, accent, warn }: { value: number; label: string; accent?: boolean; warn?: boolean }) {
  return (
    <Card className="text-center py-3">
      <div className={`text-2xl font-bold tabular-nums ${accent ? 'text-accent' : warn ? 'text-rose-400' : ''}`}>{value}</div>
      <div className="text-[11px] text-muted mt-0.5">{label}</div>
    </Card>
  )
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-ink-600 text-white flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  )
}

export function StatusDot({ state }: { state: CheckInState }) {
  const map: Record<CheckInState, { c: string; label: string }> = {
    'needs-reply': { c: 'bg-accent', label: 'Needs reply' },
    'overdue': { c: 'bg-rose-400', label: 'Check-in due' },
    'reviewed': { c: 'bg-emerald-400', label: 'Reviewed' },
    'none': { c: 'bg-ink-500', label: 'New' },
  }
  const { c, label } = map[state]
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted shrink-0">
      <span className={`h-2 w-2 rounded-full ${c}`} />
      {label}
    </span>
  )
}

export function changeColor(goal: string, change: number): string {
  if (goal === 'cut') return change <= 0 ? 'text-accent' : 'text-rose-400'
  if (goal === 'bulk') return change >= 0 ? 'text-accent' : 'text-rose-400'
  return Math.abs(change) <= 0.5 ? 'text-accent' : 'text-amber-400'
}
