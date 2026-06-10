import { supabase } from './supabase'

export interface FoodResult {
  name: string
  brand?: string
  per100: { calories: number; protein: number; carbs: number; fat: number }
  serving?: { grams: number; label: string } | null
}

export interface ServingOption {
  label: string
  grams: number
}

// Search USDA FoodData Central via the food-search Edge Function (key stays server-side).
export async function searchFoods(query: string): Promise<FoodResult[]> {
  const { data, error } = await supabase.functions.invoke('food-search', { body: { query } })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return (data?.foods ?? []) as FoodResult[]
}

// Build the serving-size choices for a food (its label serving first, then g/oz).
export function servingOptions(food: FoodResult): ServingOption[] {
  const opts: ServingOption[] = [
    { label: 'gram (g)', grams: 1 },
    { label: 'ounce (oz)', grams: 28.3495 },
  ]
  if (food.serving && food.serving.grams > 0) {
    opts.unshift({ label: food.serving.label || 'serving', grams: food.serving.grams })
  }
  return opts
}

// Macros for a given quantity of a serving option.
export function macrosFor(food: FoodResult, grams: number) {
  const factor = grams / 100
  return {
    calories: Math.round(food.per100.calories * factor),
    protein: Math.round(food.per100.protein * factor),
    carbs: Math.round(food.per100.carbs * factor),
    fat: Math.round(food.per100.fat * factor),
  }
}
