export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISO(d)
}

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function prettyDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00').getTime()
  const b = new Date(bISO + 'T00:00:00').getTime()
  return Math.round((b - a) / 86400000)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// Reject if a promise (or thenable, e.g. a Supabase query) doesn't settle in time.
export function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

import type { DailyLog } from './types'

// Total macros for a day: sum of food entries, or fall back to manual totals.
export function dayMacros(log: DailyLog | undefined) {
  if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  if (log.foods && log.foods.length > 0) {
    return log.foods.reduce(
      (a, f) => ({
        calories: a.calories + f.calories,
        protein: a.protein + f.protein,
        carbs: a.carbs + f.carbs,
        fat: a.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }
  return {
    calories: log.calories ?? 0,
    protein: log.protein ?? 0,
    carbs: log.carbs ?? 0,
    fat: log.fat ?? 0,
  }
}

// Which split day is "today" based on a rotating cycle anchored to an epoch.
export function todaySplitIndex(splitLength: number): number {
  if (splitLength === 0) return 0
  const epoch = new Date('2024-01-01T00:00:00').getTime()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.floor((now.getTime() - epoch) / 86400000)
  return ((diff % splitLength) + splitLength) % splitLength
}
