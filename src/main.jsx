import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API = 'https://www.themealdb.com/api/json/v1/1'
const aliases = { tomatoes: 'tomato', potatoes: 'potato', onions: 'onion', chillies: 'chili', chilies: 'chili', chilli: 'chili', 'green chilli': 'green chili', 'green chilies': 'green chili', aloo: 'potato', tamatar: 'tomato', pyaaz: 'onion', pyaz: 'onion', dahi: 'yogurt', adrak: 'ginger', lehsan: 'garlic', chicken: 'chicken' }
const pantry = ['Chicken', 'Rice', 'Potatoes', 'Onion', 'Tomatoes', 'Eggs', 'Milk', 'Bread', 'Flour', 'Lentils', 'Garlic', 'Ginger', 'Yogurt', 'Green Chili']
const priceGuide = { chicken: 520, rice: 260, potato: 100, onion: 90, tomato: 120, yogurt: 180, ginger: 70, garlic: 80, spice: 120, flour: 140, egg: 90, milk: 220, bread: 160, lentil: 280, 'green chili': 70 }

const normalize = value => {
  const cleaned = value.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
  return aliases[cleaned] || cleaned.replace(/s$/, '')
}

const extractIngredients = meal => Array.from({ length: 20 }, (_, index) => meal[`strIngredient${index + 1}`]).filter(Boolean).map(normalize).filter(Boolean)

const estimateCost = (meal, people) => {
  const ingredients = extractIngredients(meal)
  const base = ingredients.reduce((total, ingredient) => total + (priceGuide[ingredient] || (ingredient.includes('spice') ? 120 : 95)), 0)
  return Math.max(350, Math.round(base * Math.max(1, people / 4)))
}

const scoreRecipe = (meal, ingredients, budget, people) => {
  const available = ingredients.map(normalize)
  const recipeIngredients = extractIngredients(meal)
  const matched = recipeIngredients.filter(item => available.some(value => value === item || value.includes(item) || item.includes(value)))
  const missing = recipeIngredients.filter(item => !matched.includes(item))
  const matchScore = recipeIngredients.length ? matched.length / recipeIngredients.length : 0
  const estimatedCost = estimateCost(meal, people)
  const budgetScore = budget >= estimatedCost ? 1 : Math.max(0, budget / estimatedCost)
  const score = Math.round(matchScore * 70 + budgetScore * 30)
  return { ...meal, recipeIngredients, matched, missing, match: score, ingredientMatch: Math.round(matchScore * 100), estimatedCost, overBudget: estimatedCost > budget }
}

async function fetchMeals(ingredients) {
  const candidates = new Map()
  for (const ingredient of ingredients.slice(0, 6)) {
    const response = await fetch(`${API}/filter.php?i=${encodeURIComponent(normalize(ingredient).replace(/ /g, '_'))}`)
    if (!response.ok) continue
    const data = await response.json()
    ;(data.meals || []).slice(0, 10).forEach(meal => candidates.set(meal.idMeal, meal))
  }
  const meals = Array.from(candidates.values()).slice(0, 24)
  const details = await Promise.all(meals.map(async meal => {
    const response = await fetch(`${API}/lookup.php?i=${meal.idMeal}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.meals?.[0] || null
  }))
  return details.filter(Boolean)
}

function App() {
  const [people, setPeople] = useState(4)
  const [budget, setBudget] = useState(2000)
  const [ingredients, setIngredients] = useState(['Chicken', 'Rice', 'Potatoes', 'Onion', 'Tomatoes'])
  const [ingredientInput, setIngredientInput] = useState('')
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [budgetOnly, setBudgetOnly] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchMeals(ingredients).then(data => {
      if (!active) return
      setMeals(data)
      setLoading(false)
      if (!data.length) setError('No meals matched those ingredients. Try a broader ingredient such as chicken, rice, potato or onion.')
    }).catch(() => {
      if (!active) return
      setError('Recipe service is temporarily unavailable. Please try again.')
      setLoading(false)
    })
    return () => { active = false }
  }, [ingredients])

  const results = useMemo(() => meals.map(meal => scoreRecipe(meal, ingredients, budget, people)).filter(meal => !budgetOnly || !meal.overBudget).sort((a, b) => b.match - a.match), [meals, ingredients, budget, people, budgetOnly])
  const best = results[0]
  const suggested = pantry.filter(item => !ingredients.some(existing => normalize(existing) === normalize(item))).slice(0, 6)

  const addIngredient = value => {
    const clean = value.trim()
    if (!clean || ingredients.some(item => normalize(item) === normalize(clean))) return
    setIngredients([...ingredients, clean])
    setIngredientInput('')
  }

  const totalMissing = best ? best.missing.slice(0, 8) : []
  const shoppingEstimate = best ? Math.max(0, best.estimatedCost - best.matched.reduce((total, item) => total + (priceGuide[item] || 95), 0)) : 0

  return (
    <main className="app">
      <nav className="nav"><div className="brand"><span>🍳</span> CookTonight</div><div className="nav-link">Real meals · Your ingredients · Your budget</div></nav>
      <section className="hero"><div className="hero-copy"><div className="eyebrow">LESS THINKING · BETTER MEALS</div><h1>What should I<br /><em>cook tonight?</em></h1><p>Tell us what is in your kitchen, how many people you're feeding and what you can spend. We'll find practical meals you can actually make.</p></div><div className="pan">🍳</div></section>
      <section className="planner"><div className="input-card"><label>PEOPLE</label><div className="number-input"><button onClick={() => setPeople(Math.max(1, people - 1))}>−</button><strong>{people}</strong><button onClick={() => setPeople(people + 1)}>+</button></div></div><div className="input-card budget-card"><label>TONIGHT'S BUDGET</label><div className="budget-input"><span>Rs.</span><input type="number" value={budget} onChange={e => setBudget(Math.max(0, Number(e.target.value)))} /></div></div><div className="input-card ingredients-card"><label>WHAT DO YOU HAVE?</label><div className="chips">{ingredients.map(item => <button className="chip" key={item} onClick={() => setIngredients(ingredients.filter(x => x !== item))}>{item} <span>×</span></button>)}<input value={ingredientInput} onChange={e => setIngredientInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIngredient(ingredientInput)} placeholder="Add ingredient..." /></div><div className="quick-add">{suggested.map(item => <button key={item} onClick={() => addIngredient(item)}>+ {item}</button>)}</div></div></section>
      <section className="results"><div className="section-heading"><div><span className="eyebrow">SMART MATCHING</span><h2>Meals that make sense</h2></div><label className="toggle"><input type="checkbox" checked={budgetOnly} onChange={e => setBudgetOnly(e.target.checked)} /><span>Only show within budget</span></label></div>
        {loading && <div className="loading-card"><div className="loader" />Finding meals and comparing your ingredients…</div>}
        {!loading && error && <div className="error-card">{error}</div>}
        {!loading && !error && !best && <div className="error-card">Nothing fits this budget. Try increasing the budget or turn off “Only show within budget”.</div>}
        {!loading && best && <><div className="best-card"><div className="dish-image"><img src={best.strMealThumb} alt={best.strMeal} /></div><div className="best-info"><div className="match">{best.match}% OVERALL MATCH · {best.ingredientMatch}% INGREDIENT MATCH</div><h3>{best.strMeal}</h3><p>{best.strArea || 'International'} · for {people} people · based on your pantry</p><div className="ingredient-row">{best.matched.slice(0, 8).map(item => <span className="have" key={item}>✓ {item}</span>)}</div>{totalMissing.length > 0 && <div className="missing">Shopping list: {totalMissing.join(' · ')}</div>}<button className="primary" onClick={() => setSelectedMeal(best)}>View recipe & shopping list</button></div><div className="price"><small>PLANNING ESTIMATE</small><strong>Rs. {best.estimatedCost.toLocaleString()}</strong><span>~ Rs. {Math.ceil(best.estimatedCost / people)} / person</span>{best.overBudget && <b>Over budget</b>}{!best.overBudget && <i>Within your budget</i>}</div></div>
        <div className="insight"><span>🛒</span><div><strong>What you'll likely need to buy</strong><p>{best.missing.length ? `${best.missing.slice(0, 5).join(', ')}${best.missing.length > 5 ? ' and more' : ''}` : 'Nothing — you have the key ingredients.'}</p></div><strong>~ Rs. {shoppingEstimate.toLocaleString()}</strong></div>
        <div className="recipe-grid">{results.slice(1, 7).map(recipe => <article className="recipe-card" key={recipe.idMeal} onClick={() => setSelectedMeal(recipe)}><div className="recipe-top"><img className="recipe-image" src={recipe.strMealThumb} alt={recipe.strMeal} /><span className="score">{recipe.match}% match</span></div><h3>{recipe.strMeal}</h3><div className="recipe-meta"><span>Rs. {recipe.estimatedCost.toLocaleString()}</span><span>·</span><span>{recipe.ingredientMatch}% ingredients</span></div><div className="missing-list">{recipe.missing.length ? `Buy: ${recipe.missing.slice(0, 3).join(', ')}` : 'You have the key ingredients!'}</div></article>)}</div></>}
      </section>
      <footer>CookTonight · Recipe data by TheMealDB · Prices are planning estimates and should be replaced with local store pricing before purchase.</footer>
      {selectedMeal && <div className="modal-backdrop" onClick={() => setSelectedMeal(null)}><article className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelectedMeal(null)}>×</button><img src={selectedMeal.strMealThumb} alt={selectedMeal.strMeal} /><div className="modal-body"><span className="eyebrow">{selectedMeal.strCategory || 'RECIPE'}</span><h2>{selectedMeal.strMeal}</h2><p>{selectedMeal.strArea || 'International'} cuisine · estimated total Rs. {selectedMeal.estimatedCost.toLocaleString()}</p><h4>Your shopping list</h4><div className="shopping-list">{selectedMeal.missing.map(item => <span key={item}>🛒 {item}</span>)}{!selectedMeal.missing.length && <span>✓ You already have the key ingredients.</span>}</div><h4>Ingredients</h4><div className="modal-ingredients">{selectedMeal.recipeIngredients.map(item => <span key={item}>{selectedMeal.matched.includes(item) ? '✓ ' : ''}{item}</span>)}</div>{selectedMeal.strInstructions && <><h4>How to make it</h4><p className="instructions">{selectedMeal.strInstructions}</p></>}</div></article></div>}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
