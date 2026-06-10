// AkopFit — food search proxy (Supabase Edge Function, Deno).
// Calls USDA FoodData Central with a private API key and returns
// normalized foods (per-100g macros + optional label serving) so the
// client can offer a serving-size picker. Invoked via
// supabase.functions.invoke('food-search', { body: { query } }).

const USDA_KEY = Deno.env.get('USDA_API_KEY') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } })

interface Nutrient { nutrientNumber?: string; nutrientName?: string; unitName?: string; value?: number }

function macro(nutrients: Nutrient[], number: string, names: string[]): number {
  const byNum = nutrients.find(n => n.nutrientNumber === number)
  if (byNum?.value != null) return byNum.value
  const byName = nutrients.find(n => names.some(nm => (n.nutrientName ?? '').toLowerCase().includes(nm)))
  return byName?.value ?? 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!USDA_KEY) return json({ error: 'USDA_API_KEY not set' }, 500)
  try {
    const { query } = await req.json()
    if (!query || String(query).trim().length < 2) return json({ foods: [] })

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_KEY}` +
      `&query=${encodeURIComponent(String(query))}&pageSize=25` +
      `&dataType=${encodeURIComponent('Foundation,SR Legacy,Branded')}`
    const res = await fetch(url)
    if (!res.ok) return json({ error: `USDA ${res.status}` }, 502)
    const data = await res.json()

    const foods = []
    for (const f of data.foods ?? []) {
      const nuts: Nutrient[] = f.foodNutrients ?? []
      const calories = macro(nuts, '208', ['energy'])
      if (!f.description || !calories) continue
      const per100 = {
        calories: Math.round(calories),
        protein: Math.round(macro(nuts, '203', ['protein'])),
        carbs: Math.round(macro(nuts, '205', ['carbohydrate'])),
        fat: Math.round(macro(nuts, '204', ['total lipid', 'fat'])),
      }
      let serving: { grams: number; label: string } | null = null
      if (f.servingSize && (f.servingSizeUnit === 'g' || f.servingSizeUnit === 'ml')) {
        serving = { grams: f.servingSize, label: f.householdServingFullText || `${f.servingSize} ${f.servingSizeUnit}` }
      }
      foods.push({
        name: String(f.description).toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()).slice(0, 60),
        brand: f.brandName || f.brandOwner || undefined,
        per100,
        serving,
      })
      if (foods.length >= 20) break
    }
    return json({ foods })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
