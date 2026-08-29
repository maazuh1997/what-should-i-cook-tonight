import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API = 'https://www.themealdb.com/api/json/v1/1'
const aliases = { tomatoes: 'tomato', potatoes: 'potato', chilies: 'chili', 'green chilli': 'green chili', 'green chilies': 'green chili' }

const normalize = value => {
  const cleaned = value.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
  return aliases[cleaned] || cleaned.replace(/s$/, '')
}

const extractIngredients = meal => Array.from({ length: 20 }, (_, index) => meal[`strIngredient${index + 1}`]).filter(Boolean).map(normalize).filter(Boolean)

const scoreRecipe = (meal, ingredients, budget, people) => {
  const available = ingredients.map(normalize)
  const recipeIngredients = extractIngredients(meal)
  const matched = recipeIngredients.filter(item => available.some(value => value === item || value.includes(item) || item.includes(value)))
  const missing = recipeIngredients.filter(item => !matched.includes(item))
  const ingredientScore = recipeIngredients.length ? matched.length / recipeIngredients.length : 0
  const budgetEstimate = Math.max(450, Math.round((recipeIngredients.length * 120) + (people * 110)))
  const budgetScore = budget >= budgetEstimate ? 1 : Math.max(0, budget / budgetEstimate)
  const score = Math.round((ingredientScore * 70 + budgetScore * 30))
  return { ...meal, recipeIngredients, matched, missing, match: score, estimatedCost: budgetEstimate }
}

async function fetchMeals(ingredients) {
  const candidates = new Map()
  for (const ingredient of ingredients.slice(0, 5)) {
    const response = await fetch(`${API}/filter.php?i=${encodeURIComponent(normalize(ingredient).replace(/ /g, '_'))}`)
    if (!response.ok) continue
    const data = await response.json()
    ;(data.meals || []).slice(0, 8).forEach(meal => candidates.set(meal.idMeal, meal))
  }
  const meals = Array.from(candidates.values()).slice(0, 18)
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

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchMeals(ingredients).then(data => {
      if (!active) return
      setMeals(data)
      setLoading(false)
      if (!data.length) setError('We could not find matching meals yet. Try adding another ingredient.')
    }).catch(() => {
      if (!active) return
      setError('Recipe service is temporarily unavailable. Please try again.')
      setLoading(false)
    })
    return () => { active = false }
  }, [ingredients])

  const results = useMemo(() => meals.map(meal => scoreRecipe(meal, ingredients, budget, people)).sort((a, b) => b.match - a.match), [meals, ingredients, budget, people])
  const best = results[0]

  const addIngredient = () => {
    const value = ingredientInput.trim()
    if (!value || ingredients.some(item => normalize(item) === normalize(value))) return
    setIngredients([...ingredients, value])
    setIngredientInput('')
  }

  return (
    <main className="app">
      <nav className="nav"><div className="brand"><span>🍳</span> CookTonight</div><div className="nav-link">Real meals · Real ingredients · Your budget</div></nav>
      <section className="hero"><div className="hero-copy"><div className="eyebrow">YOUR KITCHEN → YOUR MEAL</div><h1>What should I<br /><em>cook tonight?</em></h1><p>Tell us what you have, your budget and how many people you're feeding. We'll turn your kitchen into tonight's meal plan.</p></div><div className="pan">🍳</div></section>
      <section className="planner"><div className="input-card"><label>PEOPLE</label><div className="number-input"><button onClick={() => setPeople(Math.max(1, people - 1))}>−</button><strong>{people}</strong><button onClick={() => setPeople(people + 1)}>+</button></div></div><div className="input-card budget-card"><label>BUDGET</label><div className="budget-input"><span>Rs.</span><input type="number" value={budget} onChange={e => setBudget(Math.max(0, Number(e.target.value)))} /></div></div><div className="input-card ingredients-card"><label>I HAVE</label><div className="chips">{ingredients.map(item => <button className="chip" key={item} onClick={() => setIngredients(ingredients.filter(x => x !== item))}>{item} <span>×</span></button>)}<input value={ingredientInput} onChange={e => setIngredientInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIngredient()} onBlur={addIngredient} placeholder="Add ingredient..." /></div></div></section>
      <section className="results"><div className="section-heading"><div><span className="eyebrow">SMART MATCHING</span><h2>Tonight's picks</h2></div><span className="count">{loading ? 'Finding meals…' : `${results.length} matches`}</span></div>
        {loading && <div className="loading-card"><div className="loader" />Finding meals from the recipe database…</div>}
        {!loading && error && <div className="error-card">{error}</div>}
        {!loading && best && <><div className="best-card"><div className="dish-image"><img src={best.strMealThumb} alt={best.strMeal} /></div><div className="best-info"><div className="match">{best.match}% MATCH</div><h3>{best.strMeal}</h3><p>{best.strArea || 'International'} · {people} people · recipe details available</p><div className="ingredient-row">{best.matched.slice(0, 8).map(item => <span className="have" key={item}>✓ {item}</span>)}</div>{best.missing.length > 0 && <div className="missing">You may need: {best.missing.slice(0, 5).join(' · ')}</div>}<button className="primary" onClick={() => setSelectedMeal(best)}>View recipe</button></div><div className="price"><small>EST. GROCERY COST</small><strong>Rs. {best.estimatedCost.toLocaleString()}</strong><span>planning estimate · {Math.ceil(best.estimatedCost / people)} / person</span></div></div>
        <div className="recipe-grid">{results.slice(1, 7).map(recipe => <article className="recipe-card" key={recipe.idMeal} onClick={() => setSelectedMeal(recipe)}><div className="recipe-top"><img className="recipe-image" src={recipe.strMealThumb} alt={recipe.strMeal} /><span className="score">{recipe.match}% match</span></div><h3>{recipe.strMeal}</h3><div className="recipe-meta"><span>Rs. {recipe.estimatedCost.toLocaleString()}</span><span>·</span><span>{recipe.strArea || 'International'}</span></div><div className="missing-list">{recipe.missing.length ? `You may need: ${recipe.missing.slice(0, 3).join(', ')}` : 'You already have the ingredients!'}</div></article>)}</div></>}
      </section>
      <footer>CookTonight · Powered by TheMealDB · Cost estimates are planning estimates, not store prices.</footer>
      {selectedMeal && <div className="modal-backdrop" onClick={() => setSelectedMeal(null)}><article className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelectedMeal(null)}>×</button><img src={selectedMeal.strMealThumb} alt={selectedMeal.strMeal} /><div className="modal-body"><span className="eyebrow">{selectedMeal.strCategory || 'RECIPE'}</span><h2>{selectedMeal.strMeal}</h2><p>{selectedMeal.strArea || 'International'} cuisine</p><h4>Ingredients</h4><div className="modal-ingredients">{selectedMeal.recipeIngredients.map(item => <span key={item}>{item}</span>)}</div>{selectedMeal.strInstructions && <><h4>How to make it</h4><p className="instructions">{selectedMeal.strInstructions}</p></>}</div></article></div>}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
