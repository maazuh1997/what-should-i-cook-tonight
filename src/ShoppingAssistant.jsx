import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'cooktonight-shopping-list'

export default function ShoppingAssistant({ items, onToggle, onRemove, onClearPurchased, onClose }) {
  const [localItems, setLocalItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : items
    } catch {
      return items
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems))
    } catch {}
  }, [localItems])

  useEffect(() => {
    if (!localItems.length && items.length) setLocalItems(items)
  }, [items, localItems.length])

  const update = updater => {
    setLocalItems(current => updater(current))
  }
  const toggle = id => update(current => current.map(item => item.id === id ? { ...item, purchased: !item.purchased } : item))
  const remove = id => update(current => current.filter(item => item.id !== id))
  const clearPurchased = () => update(current => current.filter(item => !item.purchased))
  const remaining = localItems.filter(item => !item.purchased)
  const purchased = localItems.filter(item => item.purchased)
  const estimated = remaining.reduce((sum, item) => sum + (item.price || 95), 0)

  return <div className="shopping-backdrop" onClick={onClose}>
    <aside className="shopping-panel" onClick={event => event.stopPropagation()}>
      <button className="shopping-close" onClick={onClose} aria-label="Close shopping list">×</button>
      <div className="shopping-header"><span className="eyebrow">SHOPPING ASSISTANT</span><h2>Your shopping list</h2><p>{remaining.length ? `${remaining.length} item${remaining.length === 1 ? '' : 's'} still to buy` : 'Everything is checked off'}</p></div>
      <div className="shopping-summary"><div><small>EST. REMAINING</small><strong>Rs. {estimated.toLocaleString()}</strong></div><div><small>PURCHASED</small><strong>{purchased.length}</strong></div></div>
      <div className="shopping-items">{localItems.length ? localItems.map(item => <div className={`shopping-item ${item.purchased ? 'purchased' : ''}`} key={item.id}><button className="shopping-check" onClick={() => toggle(item.id)} aria-label={item.purchased ? `Unmark ${item.name}` : `Mark ${item.name} purchased`}>{item.purchased ? '✓' : ''}</button><div><strong>{item.name}</strong><span>{item.measure || 'As needed'} · ~Rs. {(item.price || 95).toLocaleString()}</span></div><button className="shopping-remove" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}>×</button></div>) : <div className="shopping-empty"><span>🛒</span><strong>Your list is empty</strong><p>Add missing ingredients from a recipe.</p></div>}</div>
      <div className="shopping-footer">{purchased.length > 0 && <button className="secondary" onClick={clearPurchased}>Clear purchased</button>}<button className="primary" onClick={onClose}>Done</button></div>
    </aside>
  </div>
}
