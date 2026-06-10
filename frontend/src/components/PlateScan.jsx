import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { today } from '../utils/calc'

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch',     label: 'Lunch'      },
  { value: 'dinner',    label: 'Dinner'     },
  { value: 'snack',     label: 'Snack'      },
]

const UNIT_OPTIONS = ['g', 'ml', 'piece', 'serving', 'cup', 'tbsp']

const TIPS = [
  'Shoot from directly above the plate',
  'Use good lighting — avoid shadows on food',
  'Make sure all food items are clearly visible',
  'Avoid covering food with hands or utensils',
  'Works best with one clearly framed plate',
]

function normalizeFoodName(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')
}

function calcMacrosFromFood(food, qty, unit) {
  const base = Number(food?.base_amount) || 1
  const amount = Number(qty) || 1
  let mult = 0
  if (unit === 'g' || unit === 'ml') mult = amount / base
  else if (unit === 'piece' || unit === 'serving') mult = amount
  else if (unit === 'cup') mult = (amount * 240) / base
  else if (unit === 'tbsp') mult = (amount * 15) / base
  else mult = amount / base

  return {
    cal: Math.round((Number(food?.cal) || 0) * mult),
    protein_g: Math.round((Number(food?.protein_g) || 0) * mult * 10) / 10,
    fiber_g: Math.round((Number(food?.fiber_g) || 0) * mult * 10) / 10,
    carbs_g: Math.round((Number(food?.carbs_g) || 0) * mult * 10) / 10,
    fat_g: Math.round((Number(food?.fat_g) || 0) * mult * 10) / 10,
  }
}

function defaultQtyForFood(food) {
  if (food?.base_unit === 'piece' || food?.base_unit === 'serving') return 1
  return Number(food?.base_amount) || 100
}

function matchFoodByName(name, foods, exactOnly = false) {
  const normalized = normalizeFoodName(name)
  if (!normalized) return null
  const exact = foods.find(food => normalizeFoodName(food.name) === normalized)
  if (exact || exactOnly || normalized.length < 3) return exact || null

  return foods.find(food => {
    const foodName = normalizeFoodName(food.name)
    if (foodName.length < 3) return false
    return foodName.includes(normalized) || normalized.includes(foodName)
  }) || null
}

function formatAmountLabel(qty, unit) {
  const q = Number(qty) || 1
  const u = String(unit || 'g').trim()

  // For g/ml, no space: "100g" not "100 g"
  if (u === 'g' || u === 'ml') {
    return `${q}${u}`
  }

  // For others, use space: "1 piece", "2 servings"
  return `${q} ${u}`
}

export default function PlateScan({ date, onLogged }) {
  const [searchParams] = useSearchParams()
  const mealParam = searchParams.get('meal') // Read meal from URL
  const [imgSrc,    setImgSrc]    = useState(null)
  const [imgFile,   setImgFile]   = useState(null)
  const [mealType,  setMealType]  = useState(mealParam || 'lunch') // Pre-select from URL
  const [scanning,  setScanning]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [result,    setResult]    = useState(null)
  const [reviewItems, setReviewItems] = useState([])
  const [foods,     setFoods]     = useState([])
  const [recalcIndex, setRecalcIndex] = useState(null)
  const [error,     setError]     = useState('')
  const [tipIndex,  setTipIndex]  = useState(0)
  const fileRef = useRef(null)

  useEffect(() => {
    let active = true
    api.get('/foods')
      .then(data => {
        if (active) setFoods(data.foods || [])
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // ── pick or capture image ──────────────────────────────────
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    setImgSrc(URL.createObjectURL(file))
    setResult(null)
    setReviewItems([])
    setError('')
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag')
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImgFile(file)
      setImgSrc(URL.createObjectURL(file))
      setResult(null)
      setReviewItems([])
      setError('')
    }
  }

  // ── send to backend ────────────────────────────────────────
  async function scanPlate() {
    if (!imgFile) return
    setScanning(true)
    setError('')
    setResult(null)

    try {
      // convert to base64
      const b64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload  = () => res(reader.result.split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(imgFile)
      })

      const data = await api.post('/scan/plate', {
        imageBase64: b64,
        mediaType:   imgFile.type || 'image/jpeg',
        date:        date || today(),
        meal_type:   mealType,
      })

      const items = data.items || data.logged || []
      setResult({ ...data, items })
      setReviewItems(items)

    } catch (e) {
      setError(e.error || e.message || 'Scan failed. Try a clearer photo.')
    } finally {
      setScanning(false)
    }
  }

  function reset() {
    setImgSrc(null)
    setImgFile(null)
    setResult(null)
    setReviewItems([])
    setError('')
    setSaving(false)
  }

  function updateReviewItem(index, key, value) {
    setResult(r => r?.saved ? { ...r, saved: false } : r)
    setReviewItems(items => items.map((item, i) => {
      if (i !== index) return item
      if (key === 'food_name') {
        const exactMatch = matchFoodByName(value, foods, true)
        if (exactMatch) return applyFoodMatch(item, exactMatch)
        return { ...item, food_name: value, food_id: null, matched: false, match_note: 'Name changed. Choose a library match or leave the field to estimate nutrition.' }
      }
      if (key === 'unit') {
        const next = { ...item, unit: value }
        const matchedFood = item.food || foods.find(food => food.id === item.food_id)
        return matchedFood
          ? {
              ...next,
              food: matchedFood,
              ...calcMacrosFromFood(matchedFood, item.qty, value),
              match_note: 'Unit changed. Macros recalculated from the matched food.',
            }
          : next
      }
      if (key !== 'qty') return { ...item, [key]: value }
      const oldQty = Number(item.qty) || 1
      const nextQty = Number(value) || 1
      const ratio = nextQty / oldQty
      return {
        ...item,
        qty: value,
        cal: Math.round((Number(item.cal) || 0) * ratio),
        protein_g: Math.round((Number(item.protein_g) || 0) * ratio * 10) / 10,
        fiber_g: Math.round((Number(item.fiber_g) || 0) * ratio * 10) / 10,
        carbs_g: Math.round((Number(item.carbs_g) || 0) * ratio * 10) / 10,
        fat_g: Math.round((Number(item.fat_g) || 0) * ratio * 10) / 10,
      }
    }))
  }

  function applyFoodMatch(item, food, source = 'library') {
    const nextUnit = food.base_unit || 'g'
    const keepQty = item.unit === nextUnit && Number(item.qty) > 0
    const nextQty = keepQty ? Number(item.qty) : defaultQtyForFood(food)
    const macros = calcMacrosFromFood(food, nextQty, nextUnit)

    return {
      ...item,
      food,
      food_id: source === 'library' ? food.id : null,
      food_name: food.name,
      qty: nextQty,
      unit: nextUnit,
      amt_label: formatAmountLabel(nextQty, nextUnit),
      ...macros,
      matched: source === 'library',
      match_note: source === 'library'
        ? 'Matched food library and recalculated macros.'
        : 'Estimated nutrition from the edited food name. Review before saving.',
    }
  }

  async function recalculateFoodName(index) {
    const item = reviewItems[index]
    const name = String(item?.food_name || '').trim()
    if (!name) return

    const match = matchFoodByName(name, foods)
    if (match) {
      setReviewItems(items => items.map((current, i) => i === index ? applyFoodMatch(current, match) : current))
      return
    }

    setRecalcIndex(index)
    try {
      const serving = `${Number(item.qty) || 1} ${item.unit || 'g'}`
      const data = await api.post('/foods/estimate', { name, serving })
      if (data.food) {
        setReviewItems(items => items.map((current, i) => i === index ? applyFoodMatch(current, data.food, 'estimate') : current))
      }
    } catch (e) {
      setReviewItems(items => items.map((current, i) => (
        i === index ? { ...current, match_note: 'No library match found. Add this food to your library for better macro accuracy.' } : current
      )))
    } finally {
      setRecalcIndex(null)
    }
  }

  function removeReviewItem(index) {
    setReviewItems(items => items.filter((_, i) => i !== index))
  }

  async function saveReviewedItems() {
    if (reviewItems.length === 0) return
    setSaving(true)
    setError('')
    try {
      await Promise.all(reviewItems.map(item => api.post('/meals', {
        food_id: item.food_id || null,
        food_name: item.food_name || 'Identified food',
        meal_type: item.meal_type || mealType,
        log_date: date || today(),
        qty: Number(item.qty) || 1,
        unit: item.unit || 'g',
        amt_label: formatAmountLabel(item.qty, item.unit),
        cal: Number(item.cal) || 0,
        protein_g: Number(item.protein_g) || 0,
        fiber_g: Number(item.fiber_g) || 0,
        carbs_g: Number(item.carbs_g) || 0,
        fat_g: Number(item.fat_g) || 0,
      })))
      setResult(r => ({ ...(r || {}), saved: true }))
      if (onLogged) onLogged()
    } catch (e) {
      setError(e.error || e.message || 'Could not save identified foods.')
    } finally {
      setSaving(false)
    }
  }

  const confidenceColor = c =>
    c === 'high'   ? 'var(--green)' :
    c === 'medium' ? 'var(--amber)' : 'var(--red)'

  const reviewTotals = reviewItems.reduce((t, e) => ({
    cal:       t.cal       + (Number(e.cal) || 0),
    protein_g: t.protein_g + (Number(e.protein_g) || 0),
    fiber_g:   t.fiber_g   + (Number(e.fiber_g) || 0),
    carbs_g:   t.carbs_g   + (Number(e.carbs_g) || 0),
  }), { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0 })

  // ── UI ─────────────────────────────────────────────────────
  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--rl)',
      overflow:     'hidden',
      marginBottom:  14,
    }}>

      {/* ── Header ── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:           10,
        padding:      '12px 16px',
        background:   'var(--surface2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width:          36,
          height:         36,
          borderRadius:   '50%',
          background:    'var(--green-l)',
          border:        '1px solid var(--green-b)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          flexShrink:    0,
          color:         'var(--green)',
        }}>
          <CameraIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>
            Scan plate
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>
            AI identifies food and portions first. Review the list, then save it to your log.
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* ── Meal type selector ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>
            Which meal is this?
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {MEAL_OPTIONS.map(m => (
              <button
                key={m.value}
                onClick={() => setMealType(m.value)}
                style={{
                  minHeight:    36,
                  minWidth:     92,
                  padding:      '0 14px',
                  fontSize:      12,
                  fontWeight:    800,
                  border:       `1px solid ${mealType === m.value ? 'var(--green)' : 'var(--border2)'}`,
                  borderRadius: 'var(--rs)',
                  background:    mealType === m.value ? 'var(--green)' : 'var(--surface2)',
                  color:         mealType === m.value ? '#fff' : 'var(--muted)',
                  cursor:       'pointer',
                  fontFamily:   "'Sora',sans-serif",
                  transition:   'all .15s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Photo upload zone ── */}
        {!imgSrc ? (
          <>
            <div
              style={{
                border:         '2px dashed var(--border2)',
                borderRadius:   'var(--rl)',
                padding:        '28px 20px',
                textAlign:      'center',
                cursor:         'pointer',
                background:    'var(--surface2)',
                transition:    'all .2s',
                marginBottom:   10,
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'var(--green-l)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
              onDrop={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)'; handleDrop(e) }}
            >
              <div style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'var(--green-l)',
                border: '1px solid var(--green-b)',
                color: 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <PlateIcon />
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', marginBottom: 5 }}>
                Tap to photograph your plate
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 12 }}>
                Or drag and drop a photo here
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                  style={{
                    minHeight:    44,
                    minWidth:     152,
                    padding:      '0 16px',
                    fontSize:      13,
                    fontWeight:    800,
                    background:   'var(--green)',
                    border:       'none',
                    borderRadius: 'var(--rs)',
                    color:        '#fff',
                    cursor:       'pointer',
                    fontFamily:   "'Sora',sans-serif",
                    display:      'inline-flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    gap:           8,
                  }}
                >
                  <FolderIcon />
                  Choose photo
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    // on mobile this opens camera
                    const inp = document.createElement('input')
                    inp.type = 'file'
                    inp.accept = 'image/*'
                    inp.capture = 'environment'
                    inp.onchange = handleFile
                    console.log("Opening camera input...")
                    inp.click()
                  }}
                  style={{
                    minHeight:    44,
                    minWidth:     152,
                    padding:      '0 16px',
                    fontSize:      13,
                    fontWeight:    800,
                    background:   'var(--blue)',
                    border:       'none',
                    borderRadius: 'var(--rs)',
                    color:        '#fff',
                    cursor:       'pointer',
                    fontFamily:   "'Sora',sans-serif",
                    display:      'inline-flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    gap:           8,
                  }}
                >
                  <CameraIcon />
                  Take photo
                </button>
              </div>
            </div>

            {/* Tips */}
            <div style={{
              background:   'var(--blue-l)',
              border:       '1px solid var(--blue-b)',
              borderRadius: 'var(--rs)',
              padding:      '9px 13px',
              fontSize:      12,
              color:        'var(--blue)',
              display:      'flex',
              alignItems:   'flex-start',
              gap:           8,
            }}>
              <span style={{ flexShrink: 0, lineHeight: 1 }}>
                <TipIcon />
              </span>
              <div>
                <strong>Tip {tipIndex + 1}/5:</strong> {TIPS[tipIndex]}
                <span
                  onClick={() => setTipIndex(i => (i + 1) % TIPS.length)}
                  style={{ marginLeft: 8, cursor: 'pointer', opacity: .7, fontSize: 11 }}
                >
                  next tip →
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── Image preview + scan button ── */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <img
                src={imgSrc}
                alt="Your plate"
                style={{
                  width:        '100%',
                  maxHeight:     300,
                  objectFit:    'contain',
                  borderRadius: 'var(--rs)',
                  display:      'block',
                  background:   'var(--surface2)',
                  border:       '1px solid var(--border)',
                }}
              />
              {/* overlay while scanning */}
              {scanning && (
                <div style={{
                  position:       'absolute',
                  inset:           0,
                  background:     'rgba(0,0,0,.65)',
                  borderRadius:   'var(--rs)',
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:             12,
                }}>
                  <div style={{
                    width:       42,
                    height:      42,
                    border:     '3px solid rgba(255,255,255,.25)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation:  'spin .7s linear infinite',
                  }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    Identifying food items…
                  </div>
                  <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>
                    AI is analysing your plate
                  </div>
                </div>
              )}

              {/* remove button */}
              {!scanning && (
                <button
                  onClick={reset}
                  style={{
                    position:     'absolute',
                    top:           8,
                    right:         8,
                    width:         30,
                    height:        30,
                    borderRadius: '50%',
                    background:   'rgba(0,0,0,.6)',
                    border:       'none',
                    color:        '#fff',
                    fontSize:      16,
                    cursor:       'pointer',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    lineHeight:    1,
                  }}
                  title="Remove photo"
                >
                  ×
                </button>
              )}
            </div>

            {/* Scan button */}
            {!scanning && !result && (
              <button
                onClick={scanPlate}
                style={{
                  width:        '100%',
                  padding:      '12px 0',
                  fontSize:      14,
                  fontWeight:    700,
                  background:   'var(--green)',
                  border:       'none',
                  borderRadius: 'var(--rs)',
                  color:        '#fff',
                  cursor:       'pointer',
                  fontFamily:   "'Sora',sans-serif",
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent:'center',
                  gap:           8,
                  marginBottom:  4,
                  transition:   'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <SearchIcon />
                Identify food items
              </button>
            )}
          </>
        )}

        {/* hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        {/* ── Error ── */}
        {error && (
          <div style={{
            marginTop:    10,
            padding:      '10px 13px',
            background:   'var(--red-l)',
            border:       '1px solid var(--red-b)',
            borderRadius: 'var(--rs)',
            fontSize:      12,
            color:        'var(--red)',
            lineHeight:    1.6,
          }}>
            <strong>Scan failed:</strong> {error}
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-ghost btn-compact" onClick={scanPlate} style={{ marginRight: 8 }}>
                Try Again
              </button>
              <button className="btn btn-ghost btn-compact" onClick={reset}>
                Choose Different Photo
              </button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && reviewItems.length === 0 && (
          <div style={{
            marginTop:    10,
            padding:      '10px 13px',
            background:   'var(--amber-l)',
            border:       '1px solid var(--amber-b)',
            borderRadius: 'var(--rs)',
            fontSize:      12,
            color:        'var(--amber)',
            lineHeight:    1.6,
          }}>
            {result.message || 'Could not identify food items. Try a clearer, better-lit photo shot from directly above.'}
          </div>
        )}

        {result && reviewItems.length > 0 && (
          <div className="plate-review-panel">
            <div className="plate-review-summary">
              <div>
                <span>Identified items</span>
                <strong>{reviewItems.length} item{reviewItems.length !== 1 ? 's' : ''} ready to review</strong>
              </div>
              <div className="plate-review-totals">
                <span>{reviewTotals.cal} kcal</span>
                <span>P {Math.round(reviewTotals.protein_g * 10) / 10}g</span>
                <span>F {Math.round(reviewTotals.fiber_g * 10) / 10}g</span>
                <span>C {Math.round(reviewTotals.carbs_g * 10) / 10}g</span>
              </div>
            </div>

            <datalist id="plate-food-options">
              {foods.slice(0, 250).map(food => <option key={food.id} value={food.name} />)}
            </datalist>

            <div className="plate-review-list">
              {reviewItems.map((item, i) => (
                <div key={i} className="plate-review-item">
                  <div className={`plate-match-dot ${item.matched ? 'matched' : 'estimated'}`}>
                    {item.matched ? '✓' : '~'}
                  </div>

                  <div className="plate-review-content">
                    <div className="plate-review-fields">
                      <label>
                        <span>Food</span>
                        <input
                          list="plate-food-options"
                          value={item.food_name || ''}
                          onChange={e => updateReviewItem(i, 'food_name', e.target.value)}
                          onBlur={() => recalculateFoodName(i)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') e.currentTarget.blur()
                          }}
                        />
                      </label>
                      <label>
                        <span>Qty</span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={item.qty}
                          onChange={e => updateReviewItem(i, 'qty', e.target.value)}
                        />
                      </label>
                      <label>
                        <span>Unit</span>
                        <select value={item.unit || 'g'} onChange={e => updateReviewItem(i, 'unit', e.target.value)}>
                          {UNIT_OPTIONS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Meal</span>
                        <select value={item.meal_type || mealType} onChange={e => updateReviewItem(i, 'meal_type', e.target.value)}>
                          {MEAL_OPTIONS.map(meal => <option key={meal.value} value={meal.value}>{meal.label}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="plate-review-macros">
                      <span>{item.matched ? 'Library match' : 'Estimate'}</span>
                      <strong>{item.cal} kcal</strong>
                      <strong>P {item.protein_g}g</strong>
                      <strong>F {item.fiber_g}g</strong>
                      <strong>C {item.carbs_g}g</strong>
                    </div>

                    {(item.match_note || item.portion_note || recalcIndex === i) && (
                      <div className="plate-review-note">
                        {recalcIndex === i ? 'Recalculating nutrition...' : item.match_note || item.portion_note}
                      </div>
                    )}
                  </div>

                  <div className="plate-review-side">
                    <span style={{ color: confidenceColor(item.confidence) }}>{item.confidence}</span>
                    <button type="button" onClick={() => removeReviewItem(i)} title="Remove item">×</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="plate-review-warning">
              <strong>Note:</strong> Edit the food name and leave the field to re-match your library or estimate nutrition. Portion estimates are still approximate.
            </div>

            <div className="plate-review-actions">
              <button className="btn btn-ghost" type="button" onClick={reset}>
                <CameraIcon />
                Scan another
              </button>
              <button
                className="btn btn-green"
                type="button"
                onClick={saveReviewedItems}
                disabled={saving || result?.saved || reviewItems.length === 0}
              >
                {saving ? 'Saving...' : result?.saved ? 'Saved to log' : 'Save reviewed items'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function TipIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z" />
    </svg>
  )
}

function PlateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}
