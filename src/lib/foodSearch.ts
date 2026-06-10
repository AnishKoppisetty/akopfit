// Free food database search via Open Food Facts (no API key, CORS-friendly).
export interface FoodResult {
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  portion: string // e.g. "1 serving (30 g)" or "per 100 g"
}

export async function searchFoods(query: string): Promise<FoodResult[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=30` +
    `&fields=product_name,brands,nutriments,serving_quantity`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()

  const out: FoodResult[] = []
  for (const p of data.products ?? []) {
    const n = p.nutriments ?? {}
    const kcal100 = n['energy-kcal_100g']
    if (!p.product_name || kcal100 == null) continue
    const servingG = Number(p.serving_quantity) || 0
    const factor = servingG > 0 ? servingG / 100 : 1
    out.push({
      name: String(p.product_name).slice(0, 60),
      brand: p.brands ? String(p.brands).split(',')[0].trim() : undefined,
      calories: Math.round(kcal100 * factor),
      protein: Math.round((n.proteins_100g ?? 0) * factor),
      carbs: Math.round((n.carbohydrates_100g ?? 0) * factor),
      fat: Math.round((n.fat_100g ?? 0) * factor),
      portion: servingG > 0 ? `1 serving (${servingG} g)` : 'per 100 g',
    })
    if (out.length >= 20) break
  }
  return out
}
