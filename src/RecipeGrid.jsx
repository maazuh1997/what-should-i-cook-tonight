import React, { useEffect, useState } from 'react'
import RecipeCard from './RecipeCard'

export default function RecipeGrid({ results, onOpen }) {
  const [visibleCount, setVisibleCount] = useState(6)
  useEffect(() => setVisibleCount(6), [results])
  const items = results.slice(1)
  const visible = items.slice(0, visibleCount)
  return <>
    <div className="recipe-grid">{visible.map(meal => <RecipeCard key={meal.idMeal} meal={meal} onOpen={onOpen} />)}</div>
    {items.length > 6 && <div className="show-more-wrap">
      {visibleCount < items.length && <button className="show-more" onClick={() => setVisibleCount(value => Math.min(value + 6, items.length))}>Show more meals <span>↓</span></button>}
      <small>Showing {visible.length} of {items.length} additional meals</small>
      {visibleCount > 6 && <button className="show-less" onClick={() => setVisibleCount(6)}>Show fewer meals ↑</button>}
    </div>}
  </>
}
