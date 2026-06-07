import { supabase } from './lib/supabase'
import { AppData, DailyLog, FoodEntry, CheckIn, SetEntry, Meal } from './types'
import { seedData } from './seed'
import { todayISO } from './utils'

// Default training split + food library reused from the demo seed
// (exercise programming isn't stored per-client in the DB yet).
const SEED = seedData()

interface ProfileRow { id: string; name: string | null; email: string | null; unit: 'lb' | 'kg'; height_cm: number | null; start_weight: number | null }
interface PlanRow { goal: 'cut' | 'maintain' | 'bulk'; goal_weight: number | null; split_name: string; calories: number; protein: number; carbs: number; fat: number; steps: number; cardio_minutes: number; water: number }

async function signPhotos(paths: string[]): Promise<string[]> {
  if (!paths || paths.length === 0) return []
  const { data } = await supabase.storage.from('check-in-photos').createSignedUrls(paths, 3600)
  return (data ?? []).map(d => d.signedUrl).filter(Boolean) as string[]
}

export async function fetchClientData(userId: string): Promise<AppData> {
  const [profileRes, planRes, programRes, weightsRes, dailyRes, foodsRes, setsRes, checkInsRes] = await Promise.all([
    supabase.from('profiles').select('id, name, email, unit, height_cm, start_weight').eq('id', userId).maybeSingle(),
    supabase.from('plans').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('programs').select('days').eq('user_id', userId).maybeSingle(),
    supabase.from('weight_logs').select('date, weight').eq('user_id', userId).order('date'),
    supabase.from('daily_logs').select('*').eq('user_id', userId),
    supabase.from('food_entries').select('*').eq('user_id', userId),
    supabase.from('workout_sets').select('*').eq('user_id', userId),
    supabase.from('check_ins').select('*').eq('user_id', userId).order('date', { ascending: false }),
  ])

  const profile = profileRes.data as ProfileRow | null
  const plan = planRes.data as PlanRow | null
  const programDays = (programRes.data as { days: any[] } | null)?.days
  const split = programDays && programDays.length > 0 ? programDays : SEED.split

  const weightLogs = ((weightsRes.data as any[]) ?? []).map(w => ({ date: w.date, weight: Number(w.weight) }))
  const startWeight = profile?.start_weight ?? weightLogs[0]?.weight ?? 0

  // group foods + sets by date
  const dailyLogs: Record<string, DailyLog> = {}
  for (const d of (dailyRes.data as any[]) ?? []) {
    dailyLogs[d.date] = {
      date: d.date,
      steps: d.steps ?? undefined,
      cardioMinutes: d.cardio_minutes ?? undefined,
      cardioType: d.cardio_type ?? undefined,
      water: d.water ?? undefined,
      workoutDone: d.workout_done ?? undefined,
      trainingDayId: d.training_day_id ?? undefined,
    }
  }
  const ensure = (date: string): DailyLog => (dailyLogs[date] ??= { date })

  for (const f of (foodsRes.data as any[]) ?? []) {
    const log = ensure(f.date)
    ;(log.foods ??= []).push({ id: f.id, name: f.name ?? '', meal: f.meal as Meal, calories: f.calories ?? 0, protein: f.protein ?? 0, carbs: f.carbs ?? 0, fat: f.fat ?? 0 })
  }
  for (const s of (setsRes.data as any[]) ?? []) {
    const log = ensure(s.date)
    const map = (log.sets ??= {})
    ;(map[s.exercise] ??= [])[s.set_index] = { weight: Number(s.weight) || 0, reps: s.reps ?? 0 }
  }
  // compact sparse set arrays
  for (const log of Object.values(dailyLogs)) {
    if (log.sets) for (const k of Object.keys(log.sets)) log.sets[k] = log.sets[k].filter(Boolean)
  }

  const checkIns: CheckIn[] = await Promise.all(((checkInsRes.data as any[]) ?? []).map(async c => ({
    id: c.id, date: c.date, weight: c.weight ?? undefined, message: c.message ?? '',
    photos: await signPhotos(c.photo_paths), energy: c.energy ?? undefined, sleep: c.sleep ?? undefined,
    hunger: c.hunger ?? undefined, adherence: c.adherence ?? undefined, coachReply: c.coach_reply ?? undefined,
  })))

  return {
    profile: {
      name: profile?.name || 'Me',
      coachName: 'Your Coach',
      goal: plan?.goal ?? 'maintain',
      heightCm: profile?.height_cm ?? 0,
      startWeight,
      goalWeight: plan?.goal_weight ?? startWeight,
      unit: profile?.unit ?? 'lb',
    },
    targets: plan
      ? { calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fat: plan.fat, steps: plan.steps, cardioMinutes: plan.cardio_minutes, water: plan.water }
      : { ...SEED.targets },
    split,
    weightLogs,
    dailyLogs,
    checkIns,
    foodLibrary: SEED.foodLibrary,
  }
}

// ---------------- writes ----------------

export async function cloudUpsertDaily(userId: string, date: string, patch: Partial<DailyLog>) {
  const row: Record<string, unknown> = { user_id: userId, date }
  if ('steps' in patch) row.steps = patch.steps
  if ('cardioMinutes' in patch) row.cardio_minutes = patch.cardioMinutes
  if ('cardioType' in patch) row.cardio_type = patch.cardioType
  if ('water' in patch) row.water = patch.water
  if ('workoutDone' in patch) row.workout_done = patch.workoutDone
  if ('trainingDayId' in patch) row.training_day_id = patch.trainingDayId
  const { error } = await supabase.from('daily_logs').upsert(row, { onConflict: 'user_id,date' })
  if (error) throw error
}

export async function cloudAddWeight(userId: string, date: string, weight: number) {
  const { error } = await supabase.from('weight_logs').upsert({ user_id: userId, date, weight }, { onConflict: 'user_id,date' })
  if (error) throw error
}

export async function cloudAddFood(userId: string, date: string, food: Omit<FoodEntry, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('food_entries')
    .insert({ user_id: userId, date, meal: food.meal, name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat })
    .select('id').single()
  if (error) throw error
  return data.id as string
}

export async function cloudRemoveFood(foodId: string) {
  const { error } = await supabase.from('food_entries').delete().eq('id', foodId)
  if (error) throw error
}

export async function cloudSetExerciseSets(userId: string, date: string, exercise: string, sets: SetEntry[]) {
  await supabase.from('workout_sets').delete().eq('user_id', userId).eq('date', date).eq('exercise', exercise)
  const rows = sets.map((s, i) => ({ user_id: userId, date, exercise, set_index: i, weight: s.weight, reps: s.reps }))
  if (rows.length) {
    const { error } = await supabase.from('workout_sets').insert(rows)
    if (error) throw error
  }
}

// data URL -> Blob for storage upload
function dataURLtoBlob(dataURL: string): Blob {
  const [head, body] = dataURL.split(',')
  const mime = head.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export async function cloudAddCheckIn(userId: string, checkIn: Omit<CheckIn, 'id'>): Promise<void> {
  // upload photos to storage first
  const paths: string[] = []
  for (let i = 0; i < checkIn.photos.length; i++) {
    const blob = dataURLtoBlob(checkIn.photos[i])
    const ext = blob.type.split('/')[1] || 'jpg'
    const path = `${userId}/${checkIn.date}-${Date.now()}-${i}.${ext}`
    const { error } = await supabase.storage.from('check-in-photos').upload(path, blob, { contentType: blob.type })
    if (!error) paths.push(path)
    else console.warn('[checkin] photo upload failed', error.message)
  }
  const { error } = await supabase.from('check_ins').insert({
    user_id: userId, date: checkIn.date, weight: checkIn.weight ?? null, message: checkIn.message,
    energy: checkIn.energy ?? null, sleep: checkIn.sleep ?? null, hunger: checkIn.hunger ?? null,
    adherence: checkIn.adherence ?? null, photo_paths: paths,
  })
  if (error) throw error
}

export async function cloudUpdateProfile(userId: string, patch: { name?: string; unit?: string; start_weight?: number; height_cm?: number }) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}
