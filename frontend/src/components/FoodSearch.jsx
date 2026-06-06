import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { calcMacros, availableUnits, defaultUnit, defaultQty, amtLabel } from '../utils/calc'
import CustomFoodModal from './CustomFoodModal'

export default function FoodSearch({ foods, onAdd, onFoodCreated, mealType, placeholder = 'Search food to add...' }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [selected, setSelected] = useState(null)
  const [qty,      setQty]      = useState(100)
  const [unit,     setUnit]     = useState('g')
  const [open,     setOpen]     = useState(false)
  const [ddPos,    setDdPos]    = useState({ top: 0, left: 0, width: 0 })
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false)

  const inputRef     = useRef(null)
  const containerRef = useRef(null)

  /* close on outside click */
  useEffect(() => {
    function handleClick(e) {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !document.getElementById('nt-dd-portal')?.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* filter results */
  useEffect(() => {
    if (!query.trim()) { setResults(foods.slice(0, 20)); return }
    setResults(foods.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 30))
  }, [query, foods])

  /* position dropdown below the input field */
  const positionDropdown = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDdPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  rect.left   + window.scrollX,
      width: rect.width,
    })
  }, [])

  function openDropdown() {
    positionDropdown()
    setOpen(true)
  }

  function selectFood(food) {
    setSelected(food)
    setQuery(food.name)
    setUnit(defaultUnit(food))
    setQty(defaultQty(food))
    setOpen(false)
  }

  function openCustomFoodForm() {
    setOpen(false)
    setShowCustomFoodForm(true)
  }

  async function handleCustomFoodCreated(food) {
    onFoodCreated?.(food)
    selectFood(food)
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
    setQty(100)
    setUnit('g')
  }

  function handleAdd() {
    if (!selected || !qty) return
    const macros = calcMacros(selected, qty, unit)
    onAdd({
      food_id:   selected.id,
      food_name: selected.name,
      meal_type: mealType,
      qty,
      unit,
      amt_label: amtLabel(qty, unit, selected),
      ...macros,
    })
    clearSelection()
  }

  function handleUnitChange(u) {
    setUnit(u)
    if (u === 'piece')                                       setQty(1)
    else if (u === 'g' || u === 'ml')                        setQty(selected?.base_amount || 100)
    else if (u === 'cup' || u === 'serving' || u === 'tbsp') setQty(1)
  }

  const macros = selected ? calcMacros(selected, qty, unit) : null
  const units  = selected ? availableUnits(selected) : []

  /* rendered at document.body level so it is never clipped by overflow:hidden parents */
  const dropdown = open && (results.length > 0 || query.trim()) && createPortal(
    <div
      id="nt-dd-portal"
      style={{
        position:     'absolute',
        top:           ddPos.top,
        left:          ddPos.left,
        width:         ddPos.width,
        zIndex:        9999,
        background:   'var(--surface)',
        border:       '1px solid var(--border2)',
        borderRadius: 'var(--rs)',
        boxShadow:    '0 8px 32px rgba(0,0,0,.2)',
        maxHeight:     260,
        overflowY:    'auto',
        fontFamily:   "'Sora',sans-serif",
      }}
    >
      {results.map(f => (
        <div
          key={f.id}
          onMouseDown={e => { e.preventDefault(); selectFood(f) }}
          style={{
            padding:        '10px 13px',
            cursor:         'pointer',
            fontSize:        13,
            borderBottom:   '1px solid var(--border)',
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-start',
            gap:             8,
            color:          'var(--text)',
            transition:     'background .1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{f.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono',monospace" }}>
              {f.cal} kcal &nbsp;·&nbsp; P {f.protein_g}g &nbsp;·&nbsp; F {f.fiber_g}g &nbsp;·&nbsp; per {f.base_amount}{f.base_unit}
            </div>
          </div>
          <span style={{
            fontSize:     9,
            padding:      '3px 8px',
            borderRadius: 20,
            whiteSpace:   'nowrap',
            fontWeight:   600,
            background:   'var(--green-l)',
            color:        'var(--green)',
            flexShrink:   0,
            marginTop:    2,
          }}>
            {f.category}
          </span>
        </div>
      ))}
      <div
        onMouseDown={e => { e.preventDefault(); openCustomFoodForm() }}
        style={{
          padding:        '12px 13px',
          cursor:         'pointer',
          fontSize:        13,
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          gap:             8,
          color:          'var(--green)',
          background:     'var(--green-l)',
          borderTop:      results.length ? '1px solid var(--green-b)' : 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, marginBottom: 2 }}>Other / add custom food</div>
	          <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: "'JetBrains Mono',monospace" }}>
	            Manual, scan label, or AI estimate
	          </div>
        </div>
        <span style={{
          fontSize:     9,
          padding:      '3px 8px',
          borderRadius: 20,
          whiteSpace:   'nowrap',
          fontWeight:   700,
          background:   'var(--surface)',
          color:        'var(--green)',
          flexShrink:   0,
        }}>
          custom
        </span>
      </div>
    </div>,
    document.body
  )

  return (
    <div ref={containerRef} style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>

      {/* ── Search bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: selected ? 10 : 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value) clearSelection(); else openDropdown() }}
            //onFocus={openDropdown}
            placeholder={placeholder}
            autoComplete="off"
            style={{
              width:        '100%',
              padding:      '10px 36px 10px 12px',
              fontSize:      13,
              border:       '1px solid var(--border2)',
              borderRadius: 'var(--rs)',
              background:   'var(--surface)',
              color:        'var(--text)',
              fontFamily:   "'Sora',sans-serif",
              outline:      'none',
              transition:   'border-color .15s, box-shadow .15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.boxShadow = '0 0 0 3px rgba(58,125,68,.12)'; openDropdown() }}
            onBlur={e  => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }}
          />
          {query && (
            <button
              onMouseDown={e => { e.preventDefault(); clearSelection() }}
              style={{
                position:  'absolute',
                right:      10,
                top:       '50%',
                transform: 'translateY(-50%)',
                background:'none',
                border:    'none',
                color:     'var(--hint)',
                cursor:    'pointer',
                fontSize:   18,
                lineHeight: 1,
                padding:   '0 2px',
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* Portal dropdown — rendered outside all overflow containers */}
      {dropdown}

      {showCustomFoodForm && (
        <CustomFoodModal
          title="Add custom food"
          subtitle="Add nutrition once, then it will be available in Today and your food library."
          notes="Added from Today food search."
          saveLabel="Save food"
          initialName={query.trim()}
          onClose={() => setShowCustomFoodForm(false)}
          onCreated={handleCustomFoodCreated}
        />
      )}

      {/* ── Quantity controls — shown after selecting a food ── */}
      {selected && (
        <div>
          {/* Food info strip */}
          <div style={{
            background:   'var(--green-l)',
            border:       '1px solid var(--green-b)',
            borderRadius: 'var(--rs)',
            padding:      '7px 11px',
            fontSize:      11,
            color:        'var(--green)',
            marginBottom:  10,
            fontFamily:   "'JetBrains Mono',monospace",
            lineHeight:    1.5,
          }}>
            <strong>{selected.name}</strong> — {selected.cal} kcal · P {selected.protein_g}g · F {selected.fiber_g}g · per {selected.base_amount}{selected.base_unit}
          </div>

          {/* Qty / Unit / Calories / Add */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px auto', gap: 8, alignItems: 'end', marginBottom: 10 }}>

            {/* Quantity input — large and easy to tap */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>Quantity</div>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={qty}
                onChange={e => setQty(parseFloat(e.target.value) || 0)}
                style={{
                  width:        '100%',
                  height:        54,
                  fontSize:      28,
                  fontWeight:    700,
                  fontFamily:   "'JetBrains Mono',monospace",
                  textAlign:    'center',
                  border:       '2px solid var(--border2)',
                  borderRadius: 'var(--rs)',
                  background:   'var(--surface)',
                  color:        'var(--text)',
                  outline:      'none',
                  transition:   'border-color .15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.boxShadow = '0 0 0 3px rgba(58,125,68,.12)' }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Unit selector */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>Unit</div>
              <select
                value={unit}
                onChange={e => handleUnitChange(e.target.value)}
                style={{
                  width:        '100%',
                  height:        54,
                  fontSize:      13,
                  border:       '1px solid var(--border2)',
                  borderRadius: 'var(--rs)',
                  background:   'var(--surface)',
                  color:        'var(--text)',
                  fontFamily:   "'Sora',sans-serif",
                  padding:      '0 8px',
                  outline:      'none',
                }}
              >
                {units.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
              </select>
            </div>

            {/* Live calorie display */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>Calories</div>
              <div style={{
                height:         54,
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                justifyContent:'center',
                background:    'var(--amber-l)',
                border:        '1px solid var(--amber-b)',
                borderRadius:  'var(--rs)',
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber)', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{macros?.cal ?? 0}</div>
                <div style={{ fontSize: 9, color: 'var(--amber)', marginTop: 2, opacity: .75, letterSpacing: 1 }}>KCAL</div>
              </div>
            </div>

            {/* Add button */}
            <div>
              <div style={{ fontSize: 10, color: 'transparent', marginBottom: 4 }}>_</div>
              <button
                onClick={handleAdd}
                style={{
                  height:        54,
                  padding:      '0 18px',
                  fontSize:      14,
                  fontWeight:    700,
                  background:   'var(--green)',
                  border:       'none',
                  borderRadius: 'var(--rs)',
                  color:        '#fff',
                  cursor:       'pointer',
                  fontFamily:   "'Sora',sans-serif",
                  whiteSpace:   'nowrap',
                  transition:   'opacity .15s',
                  display:      'flex',
                  alignItems:   'center',
                  gap:           6,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Full macro preview row */}
          {macros && (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap:                  8,
              background:          'var(--surface)',
              border:              '1px solid var(--border)',
              borderRadius:        'var(--rs)',
              padding:             '10px 12px',
              marginBottom:         8,
            }}>
              {[
                { v: macros.cal,          l: 'kcal',    c: 'var(--amber)' },
                { v: macros.protein_g+'g',l: 'protein', c: 'var(--blue)'  },
                { v: macros.fiber_g+'g',  l: 'fibre',   c: 'var(--green)' },
                { v: macros.carbs_g+'g',  l: 'carbs',   c: 'var(--red)'   },
              ].map(m => (
                <div key={m.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: m.c, lineHeight: 1 }}>{m.v}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginTop: 3 }}>{m.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Calc note */}
          {macros && (
            <div style={{ fontSize: 10, color: 'var(--hint)', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace" }}>
              ×{macros.mult} multiplier &nbsp;·&nbsp; {amtLabel(qty, unit, selected)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
