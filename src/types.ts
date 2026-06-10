export type Goal = 'cut' | 'maintain' | 'bulk'

export interface Profile {
  name: string
  coachName: string
  goal: Goal
  heightCm: number
  startWeight: number
  goalWeight: number
  unit: 'lb' | 'kg'
}

export interface Targets {
  calories: number
  protein: number // grams
  carbs: number // grams
  fat: number // grams
  steps: number
  cardioMinutes: number // per day
  water: number // glasses per day
}

export interface Exercise {
  id?: string // stable id for reordering (editor-assigned)
  name: string
  sets: number
  reps: string // e.g. "8-10"
  rpe?: number // 0-10
  notes?: string
}

export interface TrainingDay {
  id: string
  label: string // e.g. "Day 1"
  focus: string // e.g. "Push"
  rest: boolean
  exercises: Exercise[]
}

export interface WeightLog {
  date: string // YYYY-MM-DD
  weight: number
}

export interface FoodEntry {
  id: string
  name: string
  meal: Meal
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'

export interface SetEntry {
  weight: number
  reps: number
}

export interface DailyLog {
  date: string // YYYY-MM-DD
  steps?: number
  cardioMinutes?: number
  cardioType?: string
  // legacy/manual macro totals (used when no food entries exist, e.g. seed days)
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  foods?: FoodEntry[]
  water?: number // glasses
  workoutDone?: boolean
  trainingDayId?: string
  // logged sets keyed by exercise name
  sets?: Record<string, SetEntry[]>
}

// Saved foods the client can quick-add (per 1 serving)
export interface SavedFood {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface CheckIn {
  id: string
  date: string // YYYY-MM-DD
  weight?: number
  message: string
  photos: string[] // data URLs
  energy?: number // 1-5
  sleep?: number // 1-5
  hunger?: number // 1-5
  adherence?: number // 0-100 %
  coachReply?: string
}

export interface AppData {
  profile: Profile
  targets: Targets
  split: TrainingDay[]
  weightLogs: WeightLog[]
  dailyLogs: Record<string, DailyLog>
  checkIns: CheckIn[]
  foodLibrary: SavedFood[]
  proposalPending?: boolean
  proposalDays?: TrainingDay[] | null
}
