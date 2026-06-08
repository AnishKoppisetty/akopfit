import { Link } from 'react-router-dom'
import { useCoach } from '../coachStore'
import { Card, Button } from '../../components/ui'
import { ChevronRight } from '../../components/icons'
import { clientStatus, initials, goalLabel } from '../derive'
import { CheckInState, CoachClient } from '../types'

export default function Roster() {
  const { data, setClientStatus } = useCoach()
  const pending = data.clients.filter(c => c.status === 'pending')
  const active = data.clients.filter(c => c.status === 'active')
  const removedCount = data.clients.filter(c => c.status === 'removed').length

  const statuses = active.map(c => ({ c, s: clientStatus(c) }))
  const needsReply = statuses.filter(x => x.s.checkInState === 'needs-reply').length

  const order: Record<CheckInState, number> = { 'needs-reply': 0, 'overdue': 1, 'reviewed': 2, 'none': 1 }
  const sorted = [...statuses].sort((a, b) => {
    const d = order[a.s.checkInState] - order[b.s.checkInState]
    return d !== 0 ? d : a.c.name.localeCompare(b.c.name)
  })

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryStat value={active.length} label="Clients" />
        <SummaryStat value={pending.length} label="Pending" accent={pending.length > 0} />
        <SummaryStat value={needsReply} label="Need reply" accent={needsReply > 0} />
      </div>

      {/* Pending approval */}
      {pending.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">Pending approval</h2>
          <div className="space-y-2.5 mb-6">
            {pending.map(c => (
              <Card key={c.id}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={c.name} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/coach/client/${c.id}`} className="font-semibold truncate block">{c.name}</Link>
                    <div className="text-xs text-muted truncate">{statLine(c)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setClientStatus(c.id, 'active')}>Approve</Button>
                  <Button variant="outline" onClick={() => { if (confirm(`Decline ${c.name}?`)) setClientStatus(c.id, 'removed') }}>Decline</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Your clients</h2>
      {active.length === 0 && (
        <Card className="text-center py-10">
          <div className="text-3xl mb-2">👋</div>
          <div className="font-semibold mb-1">No active clients yet</div>
          <p className="text-sm text-muted px-4">
            Share your app link and have clients sign up — they’ll appear in “Pending approval” for you to approve.
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
                <div className="text-xs text-muted truncate">{goalLabel(c.goal)} · {c.splitName}</div>
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

      {removedCount > 0 && (
        <Link to="/coach/removed" className="block text-center text-xs text-muted underline mt-6">
          Removed clients ({removedCount}) →
        </Link>
      )}
    </div>
  )
}

function statLine(c: CoachClient): string {
  const bits: string[] = []
  if (c.sex) bits.push(c.sex)
  if (c.age) bits.push(`${c.age}y`)
  bits.push(`${goalLabel(c.goal)}`)
  return bits.join(' · ')
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
