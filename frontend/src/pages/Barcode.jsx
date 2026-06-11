import { useState } from 'react'
import api from '../utils/api'
import { today } from '../utils/calc'
import PageHero from '../components/PageHero'
import UpgradeModal from '../components/UpgradeModal'

export default function Barcode() {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState(null)
  const [mealType, setMealType] = useState('snack')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedFood, setEditedFood] = useState(null)

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2200)
  }

  async function lookup(code = barcode) {
    const clean = String(code || '').replace(/\D/g, '')
    if (!clean) return
    setLoading(true)
    setErr('')
    setProduct(null)
    setEditMode(false)
    setEditedFood(null)
    setMsg('') // Clear any previous messages
    try {
      const data = await api.get(`/barcode/${clean}`)
      setBarcode(clean)
      setProduct(data.product)
      setEditedFood(data.product.food) // Initialize editable copy
    } catch (e) {
      if (e.upgrade_required) { setShowUpgrade(true); return }
      setErr(e.error || 'Product not found')
    } finally {
      setLoading(false)
    }
  }

  async function handleImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!('BarcodeDetector' in window)) {
      setErr('Barcode image scanning is not supported in this browser. Type the barcode number instead.')
      return
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
      const image = await createImageBitmap(file)
      const codes = await detector.detect(image)
      if (!codes.length) return setErr('No barcode detected. Try a clearer photo.')
      lookup(codes[0].rawValue)
    } catch (e2) {
      setErr('Could not scan barcode image. Type the barcode number instead.')
    }
  }

  async function saveFood() {
    if (!editedFood) return
    setMsg('') // Clear previous messages before saving
    try {
      await api.post('/foods', editedFood)
      flash('✅ Saved to library')
      setEditMode(false) // Exit edit mode after saving
    } catch (e) {
      if (e.status === 409) {
        flash('ℹ️ This food is already in your library')
        return
      }
      setErr(e.error || 'Failed to save food')
      setTimeout(() => setErr(''), 2500)
    }
  }

  async function logFood() {
    if (!editedFood) return
    const f = editedFood
    await api.post('/meals', {
      food_name: f.name,
      meal_type: mealType,
      log_date: today(),
      qty: f.base_amount,
      unit: f.base_unit,
      amt_label: `${f.base_amount}${f.base_unit}`,
      cal: f.cal,
      protein_g: f.protein_g,
      fiber_g: f.fiber_g,
      carbs_g: f.carbs_g,
      fat_g: f.fat_g,
    })
    flash('Logged to today')
    setEditMode(false) // Exit edit mode after logging
  }

  return (
    <div>
      {msg && <div className="success-box">{msg}</div>}
      {err && <div className="error-box">{err}</div>}

      <PageHero
        eyebrow="Barcode"
        title="Log packaged foods faster."
        copy="Use product lookup, review macros, and save or log packaged foods in one flow."
        metric="OFF"
        metricLabel="product lookup"
      />

      <div className="card">
        <div className="card-title">Barcode scanner</div>
        <div className="form-grid full">
          <div className="form-group">
            <label>Barcode number</label>
            <input value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="8901234567890" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button className="btn btn-green" style={{ flex: 1 }} onClick={() => lookup()} disabled={loading}>{loading ? 'Looking up...' : 'Lookup barcode'}</button>
          <label className="btn btn-blue" style={{ flex: 1, textAlign: 'center' }}>
            Scan image
            <input type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="info-box">
          Product data comes from Open Food Facts. Review nutrition values before logging.
        </div>
      </div>

      {showUpgrade && <UpgradeModal feature="barcode" onClose={() => setShowUpgrade(false)} />}

      {product && editedFood && (
        <div className="card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            {product.image_url && <img src={product.image_url} alt="" style={{ width: 74, height: 74, objectFit: 'cover', borderRadius: 'var(--rs)', border: '1px solid var(--border)' }} />}
            <div style={{ flex: 1 }}>
              {editMode ? (
                <input
                  value={editedFood.name}
                  onChange={e => setEditedFood({ ...editedFood, name: e.target.value })}
                  style={{ fontSize: 15, fontWeight: 700, width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 'var(--rs)' }}
                />
              ) : (
                <div style={{ fontSize: 15, fontWeight: 700 }}>{editedFood.name}</div>
              )}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{product.brand || 'Open Food Facts'} · per {editedFood.base_amount}{editedFood.base_unit}</div>
              {!editMode && (
                <div className="food-pills" style={{ marginTop: 8 }}>
                  <span className="tag tag-k">{editedFood.cal}kcal</span>
                  <span className="tag tag-p">P {editedFood.protein_g}g</span>
                  <span className="tag tag-f">F {editedFood.fiber_g}g</span>
                  <span className="tag tag-c">C {editedFood.carbs_g}g</span>
                </div>
              )}
            </div>
            {!editMode && (
              <button
                className="btn btn-ghost btn-compact"
                onClick={() => setEditMode(true)}
                style={{ flexShrink: 0 }}
              >
                Edit
              </button>
            )}
          </div>

          {editMode && (
            <div className="form-grid" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Calories</label>
                <input type="number" value={editedFood.cal} onChange={e => setEditedFood({ ...editedFood, cal: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label>Protein (g)</label>
                <input type="number" value={editedFood.protein_g} onChange={e => setEditedFood({ ...editedFood, protein_g: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label>Fiber (g)</label>
                <input type="number" value={editedFood.fiber_g} onChange={e => setEditedFood({ ...editedFood, fiber_g: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label>Carbs (g)</label>
                <input type="number" value={editedFood.carbs_g} onChange={e => setEditedFood({ ...editedFood, carbs_g: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          )}

          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label>Meal type</label>
              <select value={mealType} onChange={e => setMealType(e.target.value)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div className="form-group">
              <label>Serving</label>
              <input value={editedFood.serving || `${editedFood.base_amount}${editedFood.base_unit}`} readOnly />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {editMode && (
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setEditMode(false); setEditedFood(product.food); }}>Cancel</button>
            )}
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={saveFood}>Save to library</button>
            <button className="btn btn-green" style={{ flex: 1 }} onClick={logFood}>Log today</button>
          </div>
        </div>
      )}
    </div>
  )
}
