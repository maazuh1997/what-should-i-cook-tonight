import React from 'react'

export default function ShoppingAssistant({ items, onToggle, onRemove, onClearPurchased, onClose }) {
  const remaining = items.filter(item => !item.purchased)
  const purchased = items.filter(item => item.purchased)
  const estimated = remaining.reduce((sum, item) => sum + (item.price || 95), 0)

  return <div className="shopping-backdrop" onClick={onClose}>
    <aside className="shopping-panel" onClick={event => event.stopPropagation()}>
      <button className="shopping-close" onClick={onClose} aria-label="Close shopping list">×</button>
      <div className="shopping-header"><span className="eyebrow">SHOPPING ASSISTANT</span><h2>Your shopping list</h2><p>{remaining.length ? `${remaining.length} item${remaining.length === 1 ? '' : 's'} still to buy` : 'Everything is checked off'}</p></div>
      <div className="shopping-summary"><div><small>EST. REMAINING</small><strong>Rs. {estimated.toLocaleString()}</strong></div><div><small>PURCHASED</small><strong>{purchased.length}</strong></div></div>
      <div className="shopping-items">{items.length ? items.map(item => <div className={`shopping-item ${item.purchased ? 'purchased' : ''}`} key={item.id}><button className="shopping-check" onClick={() => onToggle(item.id)} aria-label={item.purchased ? `Unmark ${item.name}` : `Mark ${item.name} purchased`}>{item.purchased ? '✓' : ''}</button><div><strong>{item.name}</strong><span>{item.measure || 'As needed'} · ~Rs. {(item.price || 95).toLocaleString()}</span></div><button className="shopping-remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>×</button></div>) : <div className="shopping-empty"><span>🛒</span><strong>Your list is empty</strong><p>Add missing ingredients from a recipe.</p></div>}</div>
      <div className="shopping-footer">{purchased.length > 0 && <button className="secondary" onClick={onClearPurchased}>Clear purchased</button>}<button className="primary" onClick={onClose}>Done</button></div>
    </aside>
  </div>
}
