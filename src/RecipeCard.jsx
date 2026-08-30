import React from 'react'

export default function RecipeCard({ meal, onOpen }) {
  return <article className="recipe-card" onClick={() => onOpen(meal)} tabIndex="0" onKeyDown={event => event.key === 'Enter' && onOpen(meal)}>
    <div className="recipe-top"><img className="recipe-image" src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" /><span className="score">{meal.score}%</span></div>
    <div className="recipe-card-body">
      <div className="recipe-card-tags"><span>{meal.strArea || 'International'}</span>{meal.strCategory && <span>{meal.strCategory}</span>}</div>
      <h3>{meal.strMeal}</h3>
      <div className="recipe-meta"><strong>Rs. {meal.cost.toLocaleString()}</strong><span>{meal.ingredientScore}% ingredients</span></div>
      <div className="missing-list">{meal.missing.length ? `Buy: ${meal.missing.slice(0, 3).map(item => item.name).join(', ')}` : '✓ You have the key ingredients'}</div>
      <button className="card-action" onClick={event => { event.stopPropagation(); onOpen(meal) }}>View recipe →</button>
    </div>
  </article>
}
