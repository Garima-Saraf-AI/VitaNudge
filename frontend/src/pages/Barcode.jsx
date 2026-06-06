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
    try {
      const data = await api.get(`/barcode/${clean}`)
      setBarcode(clean)
      setProduct(data.product)
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
    if (!product?.food) return
    await api.post('/foods', product.food)
    flash('Saved to library')
  }

  async function logFood() {
    if (!product?.food) return
    const f = product.food
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

      {product && (
        <div className="card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {product.image_url && <img src={product.image_url} alt="" style={{ width: 74, height: 74, objectFit: 'cover', borderRadius: 'var(--rs)', border: '1px solid var(--border)' }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{product.food.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{product.brand || 'Open Food Facts'} · per {product.food.base_amount}{product.food.base_unit}</div>
              <div className="food-pills" style={{ marginTop: 8 }}>
                <span className="tag tag-k">{product.food.cal}kcal</span>
                <span className="tag tag-p">P {product.food.protein_g}g</span>
                <span className="tag tag-f">F {product.food.fiber_g}g</span>
                <span className="tag tag-c">C {product.food.carbs_g}g</span>
              </div>
            </div>
          </div>

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
              <input value={product.food.serving} readOnly />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={saveFood}>Save to library</button>
            <button className="btn btn-green" style={{ flex: 1 }} onClick={logFood}>Log today</button>
          </div>
        </div>
      )}
    </div>
  )
}
