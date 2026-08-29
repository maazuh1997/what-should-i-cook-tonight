import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const recipes = [
  { name: 'Chicken Biryani', emoji: '🍛', cost: 1250, time: 55, ingredients: ['chicken', 'rice', 'onion', 'tomato', 'yogurt', 'ginger', 'garlic', 'spices'] },
  { name: 'Chicken Pulao', emoji: '🍚', cost: 950, time: 45, ingredients: ['chicken', 'rice', 'onion', 'ginger', 'garlic', 'spices'] },
  { name: 'Aloo Chicken', emoji: '🥘', cost: 700, time: 40, ingredients: ['chicken', 'potatoes', 'onion', 'tomato', 'ginger', 'garlic', 'spices'] },
  { name: 'Chicken Karahi', emoji: '🍗', cost: 1250, time: 45, ingredients: ['chicken', 'tomato', 'onion', 'ginger', 'garlic', 'green chili', 'spices'] }
]

const normalize = value => value.trim().toLowerCase()

function App() {
  const [people, setPeople] = useState(4)
  const [budget, setBudget] = useState(2000)
  const [ingredients, setIngredients] = useState(['Chicken', 'Rice', 'Potatoes', 'Onion', 'Tomatoes'])
  const [ingredientInput, setIngredientInput] = useState('')

  const results = useMemo(() => recipes.map(recipe => {
    const available = ingredients.map(normalize)
    const matched = recipe.ingredients.filter(item => available.some(value => value === item || value.includes(item) || item.includes(value)))
    const missing = recipe.ingredients.filter(item => !matched.includes(item))
    const match = Math.max(0, Math.round((matched.length / recipe.ingredients.length) * 100))
    const budgetScore = recipe.cost <= budget ? 100 : Math.max(0, Math.round((budget / recipe.cost) * 100))
    const score = Math.round(match * 0.75 + budgetScore * 0.25)
    return { ...recipe, matched, missing, match, score }
  }).sort((a, b) => b.score - a.score), [ingredients, budget])

  const addIngredient = () => {
    const value = ingredientInput.trim()
    if (!value || ingredients.some(item => normalize(item) === normalize(value))) return
    setIngredients([...ingredients, value])
    setIngredientInput('')
  }

  const best = results[0]

  return (
    <main className="app">
      <nav className="nav">
        <div className="brand"><span>🍳</span> CookTonight</div>
        <div className="nav-link">What can I cook?</div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">YOUR KITCHEN → YOUR MEAL</div>
          <h1>What should I<br /><em>cook tonight?</em></h1>
          <p>Tell us what you have, your budget and how many people you're feeding. We'll find your best match.</p>
        </div>
        <div className="pan">🍳</div>
      </section>

      <section className="planner">
        <div className="input-card">
          <label>PEOPLE</label>
          <div className="number-input"><button onClick={() => setPeople(Math.max(1, people - 1))}>−</button><strong>{people}</strong><button onClick={() => setPeople(people + 1)}>+</button></div>
        </div>
        <div className="input-card budget-card">
          <label>BUDGET</label>
          <div className="budget-input"><span>Rs.</span><input type="number" value={budget} onChange={e => setBudget(Math.max(0, Number(e.target.value)))} /></div>
        </div>
        <div className="input-card ingredients-card">
          <label>I HAVE</label>
          <div className="chips">{ingredients.map(item => <button className="chip" key={item} onClick={() => setIngredients(ingredients.filter(x => x !== item))}>{item} <span>×</span></button>)}
            <input value={ingredientInput} onChange={e => setIngredientInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIngredient()} onBlur={addIngredient} placeholder="Add ingredient..." />
          </div>
        </div>
      </section>

      <section className="results">
        <div className="section-heading"><div><span className="eyebrow">YOUR BEST MATCH</span><h2>Tonight's picks</h2></div><span className="count">{results.length} recipes</span></div>
        <div className="best-card">
          <div className="dish-icon">{best.emoji}</div>
          <div className="best-info"><div className="match">{best.match}% MATCH</div><h3>{best.name}</h3><p>Perfect for {people} people · {best.time} min</p><div className="ingredient-row">{best.matched.map(item => <span className="have" key={item}>✓ {item}</span>)}</div>{best.missing.length > 0 && <div className="missing">You need: {best.missing.join(' · ')}</div>}</div>
          <div className="price"><small>EST. COST</small><strong>Rs. {best.cost.toLocaleString()}</strong><span>{Math.ceil(best.cost / people)} / person</span></div>
        </div>
        <div className="recipe-grid">{results.slice(1).map(recipe => <article className="recipe-card" key={recipe.name}><div className="recipe-top"><span className="recipe-emoji">{recipe.emoji}</span><span className="score">{recipe.match}% match</span></div><h3>{recipe.name}</h3><div className="recipe-meta"><span>Rs. {recipe.cost.toLocaleString()}</span><span>·</span><span>{recipe.time} min</span></div><div className="missing-list">{recipe.missing.length ? `Need: ${recipe.missing.slice(0, 3).join(', ')}` : 'You have everything!'}</div></article>)}</div>
      </section>
      <footer>CookTonight · Built around what you already have.</footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
