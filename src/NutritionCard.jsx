import React, { useEffect, useMemo, useState } from 'react'

const API = 'https://world.openfoodfacts.org/cgi/search.pl'
const nutrientKeys = ['energy-kcal_100g', 'proteins_100g', 'carbohydrates_100g', 'fat_100g', 'fiber_100g']
const toNumber = value => { const number = Number(value); return Number.isFinite(number) ? number : null }
const normalize = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')

export default function NutritionCard({ ingredients = [], servings = 4 }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const names = useMemo(() => [...new Set(ingredients.map(item => typeof item === 'string' ? item : item.name).map(normalize).filter(Boolean))].slice(0, 8), [ingredients])

  useEffect(() => {
    let active = true
    if (!names.length) { setData(null); return }
    setLoading(true)
    setStatus('')
    const load = async () => {
      try {
        const results = await Promise.allSettled(names.map(name => fetch(`${API}?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=1&fields=product_name,nutriments`).then(response => { if (!response.ok) throw new Error('Nutrition service unavailable'); return response.json() })))
        const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
        let matched = 0
        results.forEach(result => {
          if (result.status !== 'fulfilled') return
          const product = result.value.products?.[0]
          const n = product?.nutriments
          if (!n) return
          const values = nutrientKeys.map(key => toNumber(n[key]))
          if (values.every(value => value === null)) return
          totals.calories += values[0] || 0
          totals.protein += values[1] || 0
          totals.carbs += values[2] || 0
          totals.fat += values[3] || 0
          totals.fiber += values[4] || 0
          matched += 1
        })
        if (!active) return
        if (!matched) { setData(null); setStatus('Nutrition data is not available for these ingredients yet.'); return }
        const divisor = Math.max(1, servings)
        setData({ calories: Math.round(totals.calories / divisor), protein: Math.round(totals.protein / divisor), carbs: Math.round(totals.carbs / divisor), fat: Math.round(totals.fat / divisor), fiber: Math.round(totals.fiber / divisor), matched, total: names.length })
      } catch (error) {
        if (!active) return
        setData(null)
        setStatus('Nutrition data could not be loaded right now.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [names, servings])

  return <section className="nutrition-card" aria-label="Nutrition information">
    <div className="nutrition-heading"><div><span className="eyebrow">NUTRITION</span><h4>Estimated per serving</h4></div><span className="nutrition-serving">{servings} servings</span></div>
    {loading && <div className="nutrition-loading">Calculating nutrition…</div>}
    {!loading && data && <div className="nutrition-grid"><div><strong>{data.calories}</strong><span>kcal</span></div><div><strong>{data.protein}g</strong><span>protein</span></div><div><strong>{data.carbs}g</strong><span>carbs</span></div><div><strong>{data.fat}g</strong><span>fat</span></div><div><strong>{data.fiber}g</strong><span>fiber</span></div></div>}
    {!loading && !data && <p className="nutrition-status">{status || 'Add ingredients to estimate nutrition.'}</p>}
    {!loading && data && <small className="nutrition-note">Estimate based on matched ingredient nutrition data · {data.matched} of {data.total} ingredients matched.</small>}
  </section>
}
