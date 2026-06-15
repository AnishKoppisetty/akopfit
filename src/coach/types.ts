import { Goal, Targets, WeightLog, CheckIn, TrainingDay, SetEntry } from '../types'

// A past workout the client logged, for the coach to review.
export interface WorkoutSession {
  date: string
  name: string
  exercises: { name: string; sets: SetEntry[] }[]
}

export interface TodaySnapshot {
  calories: number
  protein: number
  carbs: number
  fat: number
  steps: number
  cardioMinutes: number
  water: number
  workoutDone: boolean
}

export interface CoachClient {
  id: string
  name: string
  status: 'pending' | 'active' | 'removed'
  age: number | null
  sex: string | null
  heightCm: number | null
  goal: Goal
  unit: 'lb' | 'kg'
  startWeight: number
  goalWeight: number
  joinedDaysAgo: number
  splitName: string
  targets: Targets
  program: TrainingDay[]
  proposalPending: boolean
  proposedDays: TrainingDay[] | null
  proposalNote: string | null
  weightLogs: WeightLog[]
  checkIns: CheckIn[]
  today: TodaySnapshot
}

export interface CoachData {
  coachName: string
  clients: CoachClient[]
}

// Derived per-client status used across the dashboard.
export type CheckInState = 'needs-reply' | 'reviewed' | 'overdue' | 'none'

export interface ClientStatus {
  currentWeight: number
  weeklyChange: number // negative = lost weight
  totalChange: number
  daysSinceCheckIn: number | null
  checkInState: CheckInState
  onTrack: boolean
}
