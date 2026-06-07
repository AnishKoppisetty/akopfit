import { CoachClient, ClientStatus, CheckInState } from './types'
import { daysBetween, todayISO } from '../utils'

export function clientStatus(c: CoachClient): ClientStatus {
  const logs = [...c.weightLogs].sort((a, b) => a.date.localeCompare(b.date))
  const currentWeight = logs[logs.length - 1]?.weight ?? c.startWeight
  const totalChange = +(currentWeight - c.startWeight).toFixed(1)

  // weekly change: compare latest vs the entry closest to ~7 days before it
  let weeklyChange = 0
  if (logs.length >= 2) {
    const latest = logs[logs.length - 1]
    const target = logs.filter(l => daysBetween(l.date, latest.date) >= 6)
    const ref = target[target.length - 1] ?? logs[0]
    weeklyChange = +(latest.weight - ref.weight).toFixed(1)
  }

  const latestCheckIn = c.checkIns[0]
  const daysSinceCheckIn = latestCheckIn ? daysBetween(latestCheckIn.date, todayISO()) : null

  let checkInState: CheckInState = 'none'
  if (latestCheckIn) {
    if (!latestCheckIn.coachReply) checkInState = 'needs-reply'
    else if (daysSinceCheckIn != null && daysSinceCheckIn >= 7) checkInState = 'overdue'
    else checkInState = 'reviewed'
  } else {
    checkInState = 'overdue'
  }

  // "on track": moving the right direction for the goal
  let onTrack = true
  if (c.goal === 'cut') onTrack = weeklyChange <= 0.2
  else if (c.goal === 'bulk') onTrack = weeklyChange >= -0.2

  return { currentWeight, weeklyChange, totalChange, daysSinceCheckIn, checkInState, onTrack }
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function goalLabel(goal: CoachClient['goal']): string {
  return goal === 'cut' ? 'Cutting' : goal === 'bulk' ? 'Bulking' : 'Maintaining'
}
