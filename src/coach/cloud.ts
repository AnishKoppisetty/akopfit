import { supabase } from '../lib/supabase'
import { CoachData, CoachClient } from './types'
import { Targets, CheckIn } from '../types'
import { todayISO, daysBetween, toISO } from '../utils'

// ---- DB row shapes ----
interface ProfileRow { id: string; name: string | null; email: string | null; unit: 'lb' | 'kg'; start_weight: number | null; created_at: string }
interface PlanRow { user_id: string; goal: 'cut' | 'maintain' | 'bulk'; goal_weight: number | null; split_name: string; calories: number; protein: number; carbs: number; fat: number; steps: number; cardio_minutes: number; water: number }
interface WeightRow { user_id: string; date: string; weight: number }
interface CheckInRow { id: string; user_id: string; date: string; weight: number | null; message: string | null; energy: number | null; sleep: number | null; hunger: number | null; adherence: number | null; coach_reply: string | null; photo_paths: string[] }
interface DailyRow { user_id: string; date: string; steps: number | null; cardio_minutes: number | null; water: number | null; workout_done: boolean | null }
interface FoodRow { user_id: string; calories: number | null; protein: number | null }

const DEFAULT_TARGETS: Targets = { calories: 2200, protein: 180, carbs: 200, fat: 60, steps: 10000, cardioMinutes: 30, water: 8 }

async function signPhotos(paths: string[]): Promise<string[]> {
  if (!paths || paths.length === 0) return []
  const { data } = await supabase.storage.from('check-in-photos').createSignedUrls(paths, 3600)
  return (data ?? []).map(d => d.signedUrl).filter(Boolean) as string[]
}

export async function fetchCoachData(coachName: string): Promise<CoachData> {
  const today = todayISO()
  const [profiles, plans, weights, checkIns, daily, foods] = await Promise.all([
    supabase.from('profiles').select('id, name, email, unit, start_weight, created_at').eq('role', 'client'),
    supabase.from('plans').select('*'),
    supabase.from('weight_logs').select('user_id, date, weight').order('date', { ascending: true }),
    supabase.from('check_ins').select('*').order('date', { ascending: false }),
    supabase.from('daily_logs').select('user_id, date, steps, cardio_minutes, water, workout_done').eq('date', today),
    supabase.from('food_entries').select('user_id, calories, protein').eq('date', today),
  ])

  const planBy = new Map<string, PlanRow>()
  ;(plans.data as PlanRow[] | null)?.forEach(p => planBy.set(p.user_id, p))

  const weightsBy = new Map<string, WeightRow[]>()
  ;(weights.data as WeightRow[] | null)?.forEach(w => {
    const arr = weightsBy.get(w.user_id) ?? []
    arr.push(w); weightsBy.set(w.user_id, arr)
  })

  const checkInsBy = new Map<string, CheckInRow[]>()
  ;(checkIns.data as CheckInRow[] | null)?.forEach(c => {
    const arr = checkInsBy.get(c.user_id) ?? []
    arr.push(c); checkInsBy.set(c.user_id, arr)
  })

  const dailyBy = new Map<string, DailyRow>()
  ;(daily.data as DailyRow[] | null)?.forEach(d => dailyBy.set(d.user_id, d))

  const foodBy = new Map<string, { calories: number; protein: number }>()
  ;(foods.data as FoodRow[] | null)?.forEach(f => {
    const cur = foodBy.get(f.user_id) ?? { calories: 0, protein: 0 }
    cur.calories += f.calories ?? 0
    cur.protein += f.protein ?? 0
    foodBy.set(f.user_id, cur)
  })

  const profileRows = (profiles.data as ProfileRow[] | null) ?? []

  const clients: CoachClient[] = await Promise.all(profileRows.map(async (p): Promise<CoachClient> => {
    const plan = planBy.get(p.id)
    const targets: Targets = plan
      ? { calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fat: plan.fat, steps: plan.steps, cardioMinutes: plan.cardio_minutes, water: plan.water }
      : { ...DEFAULT_TARGETS }
    const wlogs = (weightsBy.get(p.id) ?? []).map(w => ({ date: w.date, weight: Number(w.weight) }))
    const startWeight = p.start_weight ?? wlogs[0]?.weight ?? 0
    const food = foodBy.get(p.id)
    const d = dailyBy.get(p.id)

    const cins: CheckIn[] = await Promise.all((checkInsBy.get(p.id) ?? []).map(async (c): Promise<CheckIn> => ({
      id: c.id,
      date: c.date,
      weight: c.weight ?? undefined,
      message: c.message ?? '',
      photos: await signPhotos(c.photo_paths),
      energy: c.energy ?? undefined,
      sleep: c.sleep ?? undefined,
      hunger: c.hunger ?? undefined,
      adherence: c.adherence ?? undefined,
      coachReply: c.coach_reply ?? undefined,
    })))

    return {
      id: p.id,
      name: p.name || p.email || 'Client',
      goal: plan?.goal ?? 'maintain',
      unit: p.unit ?? 'lb',
      startWeight,
      goalWeight: plan?.goal_weight ?? startWeight,
      joinedDaysAgo: Math.max(0, daysBetween(toISO(new Date(p.created_at)), today)),
      splitName: plan?.split_name ?? 'Push / Pull / Legs',
      targets,
      weightLogs: wlogs,
      checkIns: cins,
      today: {
        calories: food?.calories ?? 0,
        protein: food?.protein ?? 0,
        steps: d?.steps ?? 0,
        cardioMinutes: d?.cardio_minutes ?? 0,
        water: d?.water ?? 0,
        workoutDone: d?.workout_done ?? false,
      },
    }
  }))

  return { coachName, clients }
}

// ---- writes ----

export async function cloudUpdatePlan(userId: string, patch: Partial<Targets & { goal: string; goalWeight: number; splitName: string }>) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.calories != null) row.calories = patch.calories
  if (patch.protein != null) row.protein = patch.protein
  if (patch.carbs != null) row.carbs = patch.carbs
  if (patch.fat != null) row.fat = patch.fat
  if (patch.steps != null) row.steps = patch.steps
  if (patch.cardioMinutes != null) row.cardio_minutes = patch.cardioMinutes
  if (patch.water != null) row.water = patch.water
  if (patch.goal != null) row.goal = patch.goal
  if (patch.goalWeight != null) row.goal_weight = patch.goalWeight
  if (patch.splitName != null) row.split_name = patch.splitName
  const { error } = await supabase.from('plans').update(row).eq('user_id', userId)
  if (error) throw error
}

export async function cloudReplyToCheckIn(checkInId: string, reply: string) {
  const { error } = await supabase.from('check_ins').update({ coach_reply: reply }).eq('id', checkInId)
  if (error) throw error
}
