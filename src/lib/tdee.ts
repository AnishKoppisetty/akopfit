import { clamp } from '../utils'

export type ActivityKey = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'

export const ACTIVITY: { key: ActivityKey; label: string; sub: string; factor: number }[] = [
  { key: 'sedentary', label: 'Sedentary', sub: 'Desk job, little exercise', factor: 1.2 },
  { key: 'light', label: 'Light', sub: 'Exercise 1–3 days/wk', factor: 1.375 },
  { key: 'moderate', label: 'Moderate', sub: 'Exercise 3–5 days/wk', factor: 1.55 },
  { key: 'active', label: 'Active', sub: 'Hard exercise 6–7 days/wk', factor: 1.725 },
  { key: 'athlete', label: 'Athlete', sub: 'Physical job + training', factor: 1.9 },
]

export interface TdeeInput {
  sex: 'Male' | 'Female' | 'Other'
  age: number
  heightCm: number
  weightLb: number
  activity: ActivityKey
  goal: 'cut' | 'maintain' | 'bulk'
}

export interface TdeeResult {
  bmr: number
  tdee: number
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number // ounces
}

// Mifflin–St Jeor BMR + activity + goal adjustment, with a simple macro split.
export function computeTargets(input: TdeeInput): TdeeResult {
  const kg = input.weightLb / 2.2046226218
  const base = 10 * kg + 6.25 * input.heightCm - 5 * input.age
  const bmr = input.sex === 'Male' ? base + 5
    : input.sex === 'Female' ? base - 161
    : base - 78 // average of male/female constants for "Other"

  const factor = ACTIVITY.find(a => a.key === input.activity)?.factor ?? 1.375
  const tdee = bmr * factor

  const adjust = input.goal === 'cut' ? -500 : input.goal === 'bulk' ? 300 : 0
  const calories = Math.max(1200, Math.round((tdee + adjust) / 10) * 10)

  const protein = Math.round(input.weightLb * 0.9)
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  const water = Math.round(clamp(input.weightLb * 0.6, 64, 160) / 8) * 8

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, carbs, fat, water }
}
