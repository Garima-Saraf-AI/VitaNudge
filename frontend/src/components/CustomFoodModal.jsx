import { useState } from 'react'
import api from '../utils/api'
import LabelScan from './LabelScan'

const ADD_FOOD_MODES = [
  { key: 'manual', label: 'Add manually' },
  { key: 'scan', label: 'Scan label' },
  { key: 'estimate', label: 'AI estimate' },
]

const FOOD_CATEGORIES = ['custom', 'protein', 'dairy', 'legume', 'grain', 'veg', 'fruit', 'snack', 'beverage']
const NUTRITION_FIELDS = ['cal', 'protein_g', 'fiber_g', 'carbs_g', 'fat_g']
const MISSING_NUTRITION_MESSAGE = 'Add all before saving. Use AI estimate if you do not know the values.'

const EMPTY_CUSTOM_FOOD = {
  name: '',
  category: 'custom',
  base_unit: 'g',
  base_amount: 100,
  serving: '100g',
  cal: '',
  protein_g: '',
  fiber_g: '',
  carbs_g: '',
  fat_g: '',
  gi: '',
}

function parseServingSize(servingSize = '') {
  const match = String(servingSize).match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|ml|milliliter|milliliters|piece|pieces|serving|servings)?/i)
  if (!match) return {}
  const unitMap = {
    gram: 'g',
    grams: 'g',
    milliliter: 'ml',
    milliliters: 'ml',
    pieces: 'piece',
    servings: 'serving',
  }
  const rawUnit = (match[2] || '').toLowerCase()
  return {
    amount: Number(match[1]) || '',
    unit: unitMap[rawUnit] || rawUnit || '',
  }
}

function hasCompleteNutrition(food) {
  return NUTRITION_FIELDS.every(key => {
    const value = food[key]
    return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0
  })
}

export default function CustomFoodModal({
  title = 'New food',
  subtitle = 'Add nutrition per base amount, then it will be available in your food library.',
  notes = 'Added as a custom food.',
  saveLabel = 'Save food',
  initialName = '',
  onClose,
  onCreated,
}) {
  const [mode, setMode] = useState('manual')
  const [food, setFood] = useState(() => ({ ...EMPTY_CUSTOM_FOOD, name: initialName }))
  const [estimateServing, setEstimateServing] = useState('')
  const [estimateMeta, setEstimateMeta] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function updateFood(key, value) {
    setFood(item => ({ ...item, [key]: value }))
  }

  function applyScannedFood(result) {
    const serving = result.serving_size || ''
    const parsed = parseServingSize(serving)
    setFood(item => ({
      ...item,
      name: result.name || item.name,
      serving: serving || item.serving,
      base_amount: parsed.amount || item.base_amount,
      base_unit: parsed.unit || item.base_unit,
      cal: result.calories ?? item.cal,
      protein_g: result.protein_g ?? item.protein_g,
      fiber_g: result.fiber_g ?? item.fiber_g,
      carbs_g: result.carbs_g ?? item.carbs_g,
      fat_g: result.fat_g ?? item.fat_g,
      gi: result.gi || item.gi,
    }))
    setEstimateMeta(null)
  }

  async function estimateFood() {
    const name = food.name.trim()
    setErr('')
    if (!name) {
      setErr('Food name is required.')
      return
    }

    setEstimating(true)
    try {
      const data = await api.post('/foods/estimate', {
        name,
        serving: estimateServing,
        categoryHint: food.category,
      })
      setFood(item => ({
        ...item,
        ...data.food,
        name: data.food?.name || item.name,
      }))
      setEstimateMeta({
        provider: data.provider,
        confidence: data.confidence,
        assumptions: data.assumptions || [],
      })
    } catch (e) {
      setErr(e.error || e.message || 'Could not estimate nutrition.')
    } finally {
      setEstimating(false)
    }
  }

  async function saveFood() {
    setErr('')
    if (!food.name.trim()) {
      setErr('Food name is required.')
      return
    }
    if (!hasCompleteNutrition(food)) {
      setErr(MISSING_NUTRITION_MESSAGE)
      return
    }

    setSaving(true)
    try {
      const baseAmount = Number(food.base_amount) || 100
      const baseUnit = food.base_unit || 'g'
      const payload = {
        ...food,
        name: food.name.trim(),
        category: food.category || 'custom',
        base_amount: baseAmount,
        base_unit: baseUnit,
        serving: food.serving || `${baseAmount}${baseUnit}`,
        cal: Number(food.cal) || 0,
        protein_g: Number(food.protein_g) || 0,
        fiber_g: Number(food.fiber_g) || 0,
        carbs_g: Number(food.carbs_g) || 0,
        fat_g: Number(food.fat_g) || 0,
        gi: food.gi || 'unknown',
        notes: estimateMeta
          ? `${notes} Estimated nutrition from food name. Provider: ${estimateMeta.provider || 'unknown'}. Confidence: ${estimateMeta.confidence || 'unknown'}. Review before relying on it.`
          : notes,
      }
      const created = await api.post('/foods', payload)
      await onCreated?.(created.food)
      onClose?.()
    } catch (e) {
      setErr(e.error || e.message || 'Could not save this food.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-bg" role="presentation">
      <div className="modal-box ingredient-modal" role="dialog" aria-modal="true" aria-labelledby="custom-food-title">
        <div className="ingredient-modal-head">
          <div>
            <div className="modal-title" id="custom-food-title">{title}</div>
            <div className="modal-sub">{subtitle}</div>
          </div>
          <button className="modal-close-btn" type="button" aria-label="Close custom food" onClick={onClose}>&times;</button>
        </div>

        {err && (
          <div className="error-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span>{err}</span>
            {err === MISSING_NUTRITION_MESSAGE && mode !== 'estimate' && (
              <button className="btn btn-ghost btn-compact" type="button" onClick={() => { setErr(''); setMode('estimate') }}>
                AI estimate
              </button>
            )}
          </div>
        )}

        <div className="ingredient-mode-tabs" role="tablist" aria-label="Add custom food mode">
          {ADD_FOOD_MODES.map(item => (
            <button
              key={item.key}
              className={`ingredient-mode-tab${mode === item.key ? ' active' : ''}`}
              type="button"
              role="tab"
              aria-selected={mode === item.key}
              onClick={() => setMode(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === 'scan' && (
          <div className="ingredient-scan-panel">
            <div className="ingredient-scan-note">Scan a packaged-food label to fill the fields. You can switch back to Manual to adjust anything before saving.</div>
            <LabelScan onResult={applyScannedFood} onSave={applyScannedFood} />
          </div>
        )}

        {mode === 'estimate' && (
          <div className="ingredient-mode-panel">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="estimate-food-name">Food name</label>
                <input id="estimate-food-name" value={food.name} onChange={e => updateFood('name', e.target.value)} placeholder="e.g. Paneer bhurji" />
              </div>
              <div className="form-group">
                <label htmlFor="estimate-portion-hint">Portion hint</label>
                <input id="estimate-portion-hint" value={estimateServing} onChange={e => setEstimateServing(e.target.value)} placeholder="e.g. 1 bowl approx 250g, 100g, 2 pieces" />
              </div>
            </div>
            <div className="estimate-action-row">
              <button className="btn btn-green" type="button" onClick={estimateFood} disabled={estimating}>
                {estimating ? 'Estimating...' : 'Estimate nutrition'}
              </button>
              {estimateMeta && (
                <button className="btn btn-ghost" type="button" onClick={() => setMode('manual')}>
                  Edit values
                </button>
              )}
            </div>
            {estimateMeta && (
              <div className="estimate-result-card">
                <div className="estimate-result-head">
                  <span>Estimated nutrition</span>
                  <strong>{estimateMeta.confidence || 'medium'} confidence</strong>
                </div>
                <div className="estimate-serving-line">
                  <span>Serving used</span>
                  <strong>{food.serving || `${food.base_amount}${food.base_unit}`}</strong>
                </div>
                <div className="estimate-macro-grid">
                  <div><span>Calories</span><strong>{food.cal || 0}</strong></div>
                  <div><span>Protein</span><strong>{food.protein_g || 0}g</strong></div>
                  <div><span>Carbs</span><strong>{food.carbs_g || 0}g</strong></div>
                  <div><span>Fat</span><strong>{food.fat_g || 0}g</strong></div>
                  <div><span>Fiber</span><strong>{food.fiber_g || 0}g</strong></div>
                </div>
                <div className="estimate-review-note">Review before saving. Home recipes, oil, brand, and portion size can change the numbers.</div>
                {estimateMeta.assumptions?.length > 0 && (
                  <ul className="estimate-assumptions">
                    {estimateMeta.assumptions.map(item => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <div className="ingredient-mode-panel">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="manual-food-name">Name</label>
                <input id="manual-food-name" value={food.name} onChange={e => updateFood('name', e.target.value)} placeholder="e.g. Hemp seeds" />
              </div>
              <div className="form-group">
                <label htmlFor="manual-food-category">Category</label>
                <select id="manual-food-category" value={food.category} onChange={e => updateFood('category', e.target.value)}>
                  {FOOD_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="manual-base-amount">Base amount</label>
                <input id="manual-base-amount" type="number" min="1" step="1" value={food.base_amount} onChange={e => updateFood('base_amount', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="manual-base-unit">Base unit</label>
                <select id="manual-base-unit" value={food.base_unit} onChange={e => updateFood('base_unit', e.target.value)}>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="piece">piece</option>
                  <option value="serving">serving</option>
                </select>
              </div>
            </div>

            <div className="recipe-nutrition-grid">
              {[
                ['cal', 'Calories'],
                ['protein_g', 'Protein (g)'],
                ['fiber_g', 'Fiber (g)'],
                ['carbs_g', 'Carbs (g)'],
                ['fat_g', 'Fat (g)'],
              ].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label htmlFor={`manual-${key}`}>{label}</label>
                  <input id={`manual-${key}`} type="number" min="0" step="0.1" value={food[key]} onChange={e => updateFood(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-green" type="button" onClick={saveFood} disabled={saving}>
            {saving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
