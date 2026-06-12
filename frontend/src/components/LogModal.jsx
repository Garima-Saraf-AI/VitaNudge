import { useState } from 'react'
import { calcMacros, availableUnits, defaultUnit, defaultQty, amtLabel } from '../utils/calc'
import ModalPortal from './ModalPortal'

export default function LogModal({ food, onConfirm, onClose }) {
  const [meal, setMeal] = useState('breakfast')
  const [unit, setUnit] = useState(defaultUnit(food))
  const [qty, setQty] = useState(defaultQty(food))

  const units  = availableUnits(food)
  const macros = calcMacros(food, qty, unit)

  function handleUnitChange(u) {
    setUnit(u)
    if (u === 'piece') setQty(1)
    else if (u === 'g' || u === 'ml') setQty(food.base_amount)
    else setQty(1)
  }

  return (
    <ModalPortal onClose={onClose}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="log-food-title">
        <div className="modal-title" id="log-food-title">Log — {food.name}</div>
        <div className="modal-sub">Base: {food.cal}kcal · P{food.protein_g}g · F{food.fiber_g}g per {food.base_amount}{food.base_unit}</div>

        <div className="form-grid">
          <div className="form-group">
            <label>Meal</label>
            <select value={meal} onChange={e => setMeal(e.target.value)}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div className="form-group">
            <label>Unit</label>
            <select value={unit} onChange={e => handleUnitChange(e.target.value)}>
              {units.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid full">
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number" min="0.1" step="0.5"
              value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)}
              className="qty-input"
              style={{ height: 54, fontSize: 28, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textAlign: 'center' }}
            />
          </div>
        </div>

        <div className="macro-preview">
          <div className="mp-item"><div className="mp-val" style={{ color: 'var(--amber)' }}>{macros.cal}</div><div className="mp-lbl">kcal</div></div>
          <div className="mp-item"><div className="mp-val" style={{ color: 'var(--blue)' }}>{macros.protein_g}g</div><div className="mp-lbl">protein</div></div>
          <div className="mp-item"><div className="mp-val" style={{ color: 'var(--green)' }}>{macros.fiber_g}g</div><div className="mp-lbl">fibre</div></div>
          <div className="mp-item"><div className="mp-val" style={{ color: 'var(--red)' }}>{macros.carbs_g}g</div><div className="mp-lbl">carbs</div></div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--hint)', textAlign: 'center', marginBottom: 4 }}>
          {amtLabel(qty, unit, food)} · multiplier ×{macros.mult}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-green" onClick={() => onConfirm({
            food_id: food.id, food_name: food.name, meal_type: meal,
            qty, unit, amt_label: amtLabel(qty, unit, food), ...macros
          })}>Add to log</button>
        </div>
      </div>
    </ModalPortal>
  )
}
