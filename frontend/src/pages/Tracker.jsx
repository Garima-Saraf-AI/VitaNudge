// import { useState, useEffect, useCallback } from 'react'
// import api from '../utils/api'
// import { today, addDays, formatDate, shortDate } from '../utils/calc'
// import FoodSearch from '../components/FoodSearch'

// const MEALS = [
//   { id: 'breakfast', label: 'Breakfast', dot: 'dot-b' },
//   { id: 'lunch',     label: 'Lunch',     dot: 'dot-l' },
//   { id: 'dinner',    label: 'Dinner',    dot: 'dot-d' },
//   { id: 'snack',     label: 'Snack',     dot: 'dot-s' },
// ]

// function pct(v, g) { return Math.min(100, Math.round((v / (g || 1)) * 100)) }
// function r1(n)      { return Math.round((n || 0) * 10) / 10 }

// export default function Tracker() {
//   const [date,    setDate]    = useState(today())
//   const [summary, setSummary] = useState(null)
//   const [logs,    setLogs]    = useState({ breakfast: [], lunch: [], dinner: [], snack: [] })
//   const [foods,   setFoods]   = useState([])
//   const [open,    setOpen]    = useState({ breakfast: true, lunch: true, dinner: true, snack: true })
//   const [loading, setLoading] = useState(true)

//   useEffect(() => { api.get('/foods').then(d => setFoods(d.foods)) }, [])

//   const load = useCallback(async () => {
//     setLoading(true)
//     const [s, m] = await Promise.all([
//       api.get(`/health/summary?date=${date}`),
//       api.get(`/meals?date=${date}`),
//     ])
//     setSummary(s)
//     setLogs(m.logs)
//     setLoading(false)
//   }, [date])

//   useEffect(() => { load() }, [load])

//   async function addEntry(data) {
//     await api.post('/meals', { ...data, log_date: date })
//     load()
//   }

//   async function deleteEntry(id) {
//     await api.delete(`/meals/${id}`)
//     load()
//   }

//   const G = summary?.goals  || { cal: 1700, protein_g: 110, fiber_g: 35, carbs_g: 150 }
//   const T = summary?.totals || { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0 }

//   return (
//     <div>
//       {/* Day navigation */}
//       <div className="day-bar">
//         <h2>{formatDate(date)}</h2>
//         <div className="day-nav">
//           <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
//           <span>{shortDate(date)}</span>
//           <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
//         </div>
//       </div>

//       {/* Macro summary cards */}
//       <div className="macro-row">
//         {[
//           { key: 'cal',       label: `kcal / ${G.cal}`,        cls: 'mc-cal', pfCls: 'pf-cal', val: Math.round(T.cal)         },
//           { key: 'protein_g', label: `prot / ${G.protein_g}g`, cls: 'mc-pro', pfCls: 'pf-pro', val: r1(T.protein_g) + 'g'     },
//           { key: 'fiber_g',   label: `fibre / ${G.fiber_g}g`,  cls: 'mc-fib', pfCls: 'pf-fib', val: r1(T.fiber_g)   + 'g'     },
//           { key: 'carbs_g',   label: `carbs / ${G.carbs_g}g`,  cls: 'mc-crb', pfCls: 'pf-crb', val: r1(T.carbs_g)   + 'g'     },
//         ].map(m => (
//           <div key={m.key} className={`macro-card ${m.cls}`}>
//             <div className="val">{m.val}</div>
//             <div className="lbl">{m.label}</div>
//             <div className="prog-bar">
//               <div className={`prog-fill ${m.pfCls}`} style={{ width: pct(T[m.key], G[m.key]) + '%' }} />
//             </div>
//           </div>
//         ))}
//       </div>

//       {loading && <div className="spin" style={{ margin: '20px auto' }} />}

//       {/* Meal blocks — overflow visible so portal dropdown shows */}
//       {!loading && MEALS.map(m => {
//         const entries = logs[m.id] || []
//         const mc = Math.round(entries.reduce((s, e) => s + (e.cal       || 0), 0))
//         const mp = r1(    entries.reduce((s, e) => s + (e.protein_g || 0), 0))
//         const mf = r1(    entries.reduce((s, e) => s + (e.fiber_g   || 0), 0))

//         return (
//           <div
//             key={m.id}
//             style={{
//               border:       '1px solid var(--border)',
//               borderRadius: 'var(--rl)',
//               marginBottom:  10,
//               /* IMPORTANT: do NOT set overflow:hidden here — it would clip the dropdown */
//             }}
//           >
//             {/* Meal header */}
//             <div
//               className="meal-header"
//               style={{ borderRadius: open[m.id] ? 'var(--rl) var(--rl) 0 0' : 'var(--rl)' }}
//               onClick={() => setOpen(o => ({ ...o, [m.id]: !o[m.id] }))}
//             >
//               <span className={`meal-dot ${m.dot}`} />
//               <span className="meal-title-text">{m.label}</span>
//               <span className="meal-meta">{mc} kcal · P {mp}g · F {mf}g</span>
//               <span className="meal-caret" style={{ transform: open[m.id] ? '' : 'rotate(-90deg)' }}>&#9660;</span>
//             </div>

//             {/* Meal body */}
//             {open[m.id] && (
//               <div style={{ borderTop: '1px solid var(--border)' }}>
//                 {/* Log entries */}
//                 {entries.length === 0 && (
//                   <div style={{ padding: '11px 14px', fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>
//                     Nothing logged yet — search below to add
//                   </div>
//                 )}

//                 {entries.map(e => (
//                   <div key={e.id} className="log-entry">
//                     <div style={{ flex: 1 }}>
//                       <div className="log-name">{e.food_name}</div>
//                       <div className="log-amt">{e.amt_label}</div>
//                     </div>
//                     <span className="tag tag-p">P {e.protein_g}g</span>
//                     <span className="tag tag-f">F {e.fiber_g}g</span>
//                     <span className="tag tag-k">{e.cal} kcal</span>
//                     <button className="btn-del" onClick={() => deleteEntry(e.id)}>&#215;</button>
//                   </div>
//                 ))}

//                 {/* Food search + add — uses portal so dropdown is never clipped */}
//                 <FoodSearch
//                   foods={foods}
//                   onAdd={addEntry}
//                   mealType={m.id}
//                   placeholder={`Search food to add to ${m.label.toLowerCase()}…`}
//                 />
//               </div>
//             )}
//           </div>
//         )
//       })}
//     </div>
//   )
// }


import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { today, addDays, formatDate, shortDate, availableUnits } from '../utils/calc'
import FoodSearch from '../components/FoodSearch'
import { useAuth } from '../hooks/useAuth'

const GOAL_TYPE_LABELS = {
  fat_loss: 'Fat loss', muscle: 'Build muscle', gain: 'Gain weight',
  maintain: 'Maintain', glucose: 'Glucose control',
}

const MEALS = [
  { id: 'breakfast', label: 'Breakfast', dot: 'dot-b' },
  { id: 'lunch',     label: 'Lunch',     dot: 'dot-l' },
  { id: 'dinner',    label: 'Dinner',    dot: 'dot-d' },
  { id: 'snack',     label: 'Snack',     dot: 'dot-s' },
]

function pct(v, g) { return Math.min(100, Math.round((v / (g || 1)) * 100)) }
function actualPct(v, g) { return Math.round((v / (g || 1)) * 100) }
function r1(n)      { return Math.round((n || 0) * 10) / 10 }

// Inline edit row — replaces the normal log-entry display while editing
function EditRow({ entry, foods, onSave, onCancel }) {
  const food = foods.find(f => f.id === entry.food_id)

  const units = food
    ? availableUnits(food).map(u => u.v)
    : ['g', 'ml', 'piece', 'serving', 'cup', 'tbsp']

  const [qty,  setQty]  = useState(String(entry.qty))
  const [unit, setUnit] = useState(entry.unit)
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    const q = parseFloat(qty)
    if (!q || q <= 0) return
    setBusy(true)
    await onSave(entry.id, q, unit)
    setBusy(false)
  }

  return (
    <div className="log-entry" style={{ background: 'var(--surface2)', gap: 6 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="log-name" style={{ marginBottom: 5 }}>{entry.food_name}</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            type="number"
            min="0.1"
            step="any"
            value={qty}
            onChange={e => setQty(e.target.value)}
            style={{
              width: 72, padding: '3px 7px', fontSize: 12,
              border: '1px solid var(--border2)', borderRadius: 'var(--rs)',
              background: 'var(--surface)', color: 'var(--text)',
            }}
            autoFocus
          />
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            style={{
              padding: '3px 6px', fontSize: 12,
              border: '1px solid var(--border2)', borderRadius: 'var(--rs)',
              background: 'var(--surface)', color: 'var(--text)',
            }}
          >
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={busy}
        style={{
          padding: '3px 10px', fontSize: 11, fontWeight: 600,
          border: '1px solid var(--green)', borderRadius: 'var(--rs)',
          background: 'var(--green-l)', color: 'var(--green)', cursor: 'pointer',
        }}
      >
        {busy ? '…' : '✓'}
      </button>
      <button
        onClick={onCancel}
        style={{
          padding: '3px 8px', fontSize: 11,
          border: '1px solid var(--border2)', borderRadius: 'var(--rs)',
          background: 'none', color: 'var(--hint)', cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  )
}

function mealLogsToList(groupedLogs = {}) {
  return MEALS.flatMap(meal => (groupedLogs[meal.id] || []).map(entry => ({
    ...entry,
    meal_label: meal.label,
  })))
}

function CopyYesterdayModal({
  sourceDate,
  targetDate,
  logs,
  selectedIds,
  destinationMeals,
  busy,
  onToggleItem,
  onToggleMeal,
  onSelectAll,
  onClear,
  onCancel,
  onConfirm,
  onSetDestinationMeal,
}) {
  const allEntries = mealLogsToList(logs)
  const selectedCount = allEntries.filter(entry => selectedIds.has(entry.id)).length

  return (
    <div className="modal-bg" role="presentation">
      <div className="modal-box copy-meals-modal" role="dialog" aria-modal="true" aria-labelledby="copy-meals-title">
        <div className="ingredient-modal-head">
          <div>
            <div className="modal-title" id="copy-meals-title">Copy yesterday's meals</div>
            <div className="modal-sub">Choose which meals to copy from {shortDate(sourceDate)} and where they should go on {shortDate(targetDate)}.</div>
          </div>
          <button className="modal-close-btn" type="button" aria-label="Close copy meals" onClick={onCancel}>&times;</button>
        </div>

        <div className="copy-meals-toolbar">
          <span>{selectedCount}/{allEntries.length} selected</span>
          <div>
            <button className="btn btn-ghost btn-compact" type="button" onClick={onSelectAll}>Select all</button>
            <button className="btn btn-ghost btn-compact" type="button" onClick={onClear}>Clear</button>
          </div>
        </div>

        <div className="copy-meals-list">
          {MEALS.map(meal => {
            const entries = logs[meal.id] || []
            if (entries.length === 0) return null
            const selectedInMeal = entries.filter(entry => selectedIds.has(entry.id)).length
            const allMealSelected = selectedInMeal === entries.length
            return (
              <section className="copy-meal-section" key={meal.id}>
                <label className="copy-meal-head">
                  <input type="checkbox" checked={allMealSelected} onChange={() => onToggleMeal(meal.id)} />
                  <span className={`meal-dot ${meal.dot}`} />
                  <strong>{meal.label}</strong>
                  <em>{selectedInMeal}/{entries.length}</em>
                </label>
                <div className="copy-meal-items">
                  {entries.map(entry => (
                    <label className="copy-item-row" key={entry.id}>
                      <input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => onToggleItem(entry.id)} />
                      <span className="copy-item-main">
                        <strong>{entry.food_name}</strong>
                        <em>{entry.amt_label || `${entry.qty}${entry.unit || ''}`}</em>
                      </span>
                      <span className="copy-item-macros">{Math.round(entry.cal || 0)} kcal · P {r1(entry.protein_g)}g</span>
                      <select
                        value={destinationMeals[entry.id] || meal.id}
                        onChange={(e) => onSetDestinationMeal(entry.id, e.target.value)}
                        style={{
                          marginLeft: 8,
                          padding: '4px 8px',
                          fontSize: 11,
                          border: '1px solid var(--border2)',
                          borderRadius: 'var(--rs)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                        }}
                        disabled={!selectedIds.has(entry.id)}
                      >
                        {MEALS.map(m => (
                          <option key={m.id} value={m.id}>→ {m.label}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-green" type="button" onClick={onConfirm} disabled={busy || selectedCount === 0}>
            {busy ? 'Copying...' : `Copy ${selectedCount} item${selectedCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Tracker() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [date,      setDate]      = useState(today())
  const [summary,   setSummary]   = useState(null)
  const [logs,      setLogs]      = useState({ breakfast: [], lunch: [], dinner: [], snack: [] })
  const [foods,     setFoods]     = useState([])
  const [open,      setOpen]      = useState({ breakfast: true, lunch: true, dinner: true, snack: true })
  const [loading,   setLoading]   = useState(true)
  const [editingId, setEditingId] = useState(null)   // id of the entry being edited
  const [msg,       setMsg]       = useState('')
  const [err,       setErr]       = useState('')
  const [copyReview, setCopyReview] = useState(null)
  const [copySelectedIds, setCopySelectedIds] = useState(new Set())
  const [copyDestinationMeals, setCopyDestinationMeals] = useState({}) // { entryId: destinationMealType }
  const [copyBusy, setCopyBusy] = useState(false)
  const [goalData, setGoalData] = useState(null)
  const [latestWeight, setLatestWeight] = useState(null)
  const [firstWeight, setFirstWeight] = useState(null)
  const [showProfileReminder, setShowProfileReminder] = useState(false)

  useEffect(() => { api.get('/foods').then(d => setFoods(d.foods)) }, [])

  useEffect(() => {
    api.get('/health/goals').then(d => { if (d.goals?.target_weight_kg) setGoalData(d.goals) }).catch(() => {})
    api.get(`/health/weight/range?from=${addDays(today(), -365)}&to=${today()}`)
      .then(d => {
        const sorted = [...(d.data || [])].sort((a, b) => b.log_date.localeCompare(a.log_date))
        if (sorted.length > 0) {
          setLatestWeight(Number(sorted[0].weight_kg))
          setFirstWeight(Number(sorted[sorted.length - 1].weight_kg))
        }
      }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const [s, m] = await Promise.all([
      api.get(`/health/summary?date=${date}`),
      api.get(`/meals?date=${date}`),
    ])
    setSummary(s)
    setLogs(m.logs)
    setLoading(false)
  }, [date])

  useEffect(() => { load() }, [load])

  async function addEntry(data) {
    await api.post('/meals', { ...data, log_date: date })
    load()
    // Check if profile is incomplete and show reminder
    const profileIncomplete = !user?.age || !user?.weight_kg || !user?.height_cm || !user?.gender
    if (profileIncomplete && totalEntries >= 0) { // Show after first food logged
      setShowProfileReminder(true)
    }
  }

  function addFoodToList(food) {
    setFoods(list => [...list, food].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function deleteEntry(id) {
    await api.delete(`/meals/${id}`)
    load()
  }

  async function saveEdit(id, qty, unit) {
    await api.put(`/meals/${id}`, { qty, unit })
    setEditingId(null)
    load()
  }

  async function openCopyYesterday() {
    setMsg('')
    setErr('')
    const sourceDate = addDays(date, -1)
    setCopyBusy(true)
    try {
      const data = await api.get(`/meals?date=${sourceDate}`)
      const entries = mealLogsToList(data.logs)
      if (entries.length === 0) {
        setErr(`No meals found on ${shortDate(sourceDate)}`)
        setTimeout(() => setErr(''), 2500)
        return
      }
      setCopyReview({ sourceDate, targetDate: date, logs: data.logs })
      setCopySelectedIds(new Set(entries.map(entry => entry.id)))
    } catch (e) {
      setErr(e.error || 'Could not load yesterday meals')
      setTimeout(() => setErr(''), 2500)
    } finally {
      setCopyBusy(false)
    }
  }

  function toggleCopyItem(id) {
    setCopySelectedIds(ids => {
      const next = new Set(ids)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCopyMeal(mealId) {
    const entries = copyReview?.logs?.[mealId] || []
    setCopySelectedIds(ids => {
      const next = new Set(ids)
      const allSelected = entries.every(entry => next.has(entry.id))
      entries.forEach(entry => {
        if (allSelected) next.delete(entry.id)
        else next.add(entry.id)
      })
      return next
    })
  }

  function selectAllCopyItems() {
    if (!copyReview) return
    setCopySelectedIds(new Set(mealLogsToList(copyReview.logs).map(entry => entry.id)))
  }

  function clearCopyItems() {
    setCopySelectedIds(new Set())
  }

  function setDestinationMeal(entryId, mealType) {
    setCopyDestinationMeals(prev => ({ ...prev, [entryId]: mealType }))
  }

  async function confirmCopyYesterday() {
    if (!copyReview || copySelectedIds.size === 0) return
    setMsg('')
    setErr('')
    setCopyBusy(true)
    try {
      const data = await api.post('/meals/copy-yesterday', {
        date: copyReview.targetDate,
        source_date: copyReview.sourceDate,
        entry_ids: [...copySelectedIds],
        destination_meals: copyDestinationMeals, // Pass destination meal mapping
      })
      setMsg(`Copied ${data.copied.length} item(s) from ${shortDate(data.source_date)}`)
      setTimeout(() => setMsg(''), 2500)
      setCopyReview(null)
      setCopySelectedIds(new Set())
      setCopyDestinationMeals({})
      load()
    } catch (e) {
      setErr(e.error || 'Could not copy selected meals')
      setTimeout(() => setErr(''), 2500)
    } finally {
      setCopyBusy(false)
    }
  }

  const G = summary?.goals  || { cal: 1700, protein_g: 110, fiber_g: 35, carbs_g: 150 }
  const T = summary?.totals || { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0 }
  const totalEntries = Object.values(logs).reduce((sum, items) => sum + (items?.length || 0), 0)
  const calProgress = actualPct(T.cal, G.cal)
  const carbsProgress = actualPct(T.carbs_g, G.carbs_g)
  const proteinProgress = actualPct(T.protein_g, G.protein_g)
  const rawScore = 100 - Math.abs(calProgress - 75) * 0.35 - Math.max(0, carbsProgress - 100) * 0.6 - Math.max(0, 70 - proteinProgress) * 0.2
  const balanceScore = totalEntries ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0
  const remainingCarbs = Math.max(0, r1(G.carbs_g - T.carbs_g))
  const remainingCalories = Math.max(0, Math.round(G.cal - T.cal))
  const remainingProtein = Math.max(0, r1(G.protein_g - T.protein_g))
  const mealsLogged = MEALS.filter(m => (logs[m.id] || []).length > 0).length
  const isToday = date === today()
  const firstName = user?.name?.split(' ')?.[0] || 'there'
  const hour = new Date().getHours()
  const dayPart = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const balanceStatus = totalEntries
    ? balanceScore >= 82 ? 'On track' : balanceScore >= 62 ? 'Needs balance' : 'Needs attention'
    : 'Ready to start'
  const heroGuidance = totalEntries
    ? carbsProgress > 100
      ? 'Carbs are above target. Keep the next meal protein and fiber focused.'
      : `${remainingCarbs}g carbs left. Protein is ${proteinProgress}% of target.`
    : 'Start with a scan or food search to build your daily picture.'
  const nextAction = totalEntries
    ? carbsProgress > 100
      ? {
          title: 'Balance the next meal',
          copy: 'Prioritize protein, vegetables, and a slower carb portion.',
          label: 'Ask coach',
          path: '/coach',
          question: 'My carbs are above target today. How should I balance my next meal with protein, fiber, and slower carbs?',
        }
      : proteinProgress < 70
        ? {
            title: 'Raise protein next',
            copy: `${remainingProtein}g protein left to reach today's goal.`,
            label: 'Find options',
            path: '/coach',
            question: `I still need about ${remainingProtein}g protein today. What are good protein options that keep carbs reasonable?`,
          }
        : {
            title: 'Keep this pattern',
            copy: 'Today is balanced enough to turn into a repeatable meal template.',
            label: 'Save template',
            path: '/templates',
          }
    : {
        title: 'Capture the first meal',
        copy: 'A scan gives the coach enough context for useful guidance.',
        label: 'Scan now',
        path: '/scan',
      }
  const valueSignals = [
    { label: 'Coach context', value: totalEntries ? 'Ready' : 'Waiting' },
    { label: 'Meals today', value: `${mealsLogged}/4` },
    { label: 'Carbs left', value: `${remainingCarbs}g` },
  ]
  const macroCards = [
    {
      key: 'cal',
      title: 'Calories',
      label: `${remainingCalories} kcal left`,
      cls: 'mc-cal',
      pfCls: 'pf-cal',
      val: Math.round(T.cal),
      goal: G.cal,
      percent: pct(T.cal, G.cal),
    },
    {
      key: 'protein_g',
      title: 'Protein',
      label: `${remainingProtein}g left`,
      cls: 'mc-pro',
      pfCls: 'pf-pro',
      val: r1(T.protein_g) + 'g',
      goal: G.protein_g + 'g',
      percent: pct(T.protein_g, G.protein_g),
    },
    {
      key: 'fiber_g',
      title: 'Fiber',
      label: `${Math.max(0, r1(G.fiber_g - T.fiber_g))}g left`,
      cls: 'mc-fib',
      pfCls: 'pf-fib',
      val: r1(T.fiber_g) + 'g',
      goal: G.fiber_g + 'g',
      percent: pct(T.fiber_g, G.fiber_g),
    },
    {
      key: 'carbs_g',
      title: 'Carbs',
      label: carbsProgress > 100 ? 'Above target' : `${remainingCarbs}g left`,
      cls: 'mc-crb',
      pfCls: 'pf-crb',
      val: r1(T.carbs_g) + 'g',
      goal: G.carbs_g + 'g',
      percent: pct(T.carbs_g, G.carbs_g),
    },
  ]
  const goToNextAction = () => {
    navigate(nextAction.path, nextAction.question
      ? { state: { question: nextAction.question, source: 'quick-recommendation' } }
      : undefined)
  }

  const guidanceRail = (
    <aside className="dashboard-side-rail" aria-label="Premium guidance">
      <div className="premium-panel">
        <div className="panel-kicker">Today signals</div>
        <div className="signal-list">
          {valueSignals.map(s => (
            <div key={s.label}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {goalData && (
        <div className="premium-panel goal-mini-panel">
          <div className="panel-kicker">Active goal</div>
          <h3>{GOAL_TYPE_LABELS[goalData.goal_type] || 'Goal'}</h3>
          {goalData.target_weight_kg && (
            <div className="goal-mini-progress">
              <div className="goal-mini-row">
                <span>Target</span>
                <strong>{Number(goalData.target_weight_kg).toFixed(1)} kg</strong>
              </div>
              <div className="goal-mini-row">
                <span>Current</span>
                <strong style={{ color: latestWeight ? 'var(--text)' : 'var(--hint)' }}>
                  {latestWeight ? `${latestWeight.toFixed(1)} kg` : '–'}
                </strong>
              </div>
              {latestWeight && (
                <>
                  <div className="goal-mini-row">
                    <span>To go</span>
                    <strong>{Math.abs(latestWeight - Number(goalData.target_weight_kg)).toFixed(1)} kg</strong>
                  </div>
                  <div className="goal-mini-bar-wrap">
                    {(() => {
                      // BUG-08 fix: Use firstWeight as baseline, fall back to profile weight or latest
                      const start = Number(firstWeight || user?.weight_kg || latestWeight)
                      const target = Number(goalData.target_weight_kg)
                      const current = latestWeight
                      const total = Math.abs(target - start)
                      const covered = Math.abs(start - current)
                      const pct = total > 0 ? Math.min(100, Math.round((covered / total) * 100)) : 0
                      return (
                        <>
                          <div className="goal-mini-bar">
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 'inherit', transition: 'width .4s' }} />
                          </div>
                          <div className="goal-mini-pct">{pct}% complete</div>
                        </>
                      )
                    })()}
                  </div>
                </>
              )}
            </div>
          )}
          {goalData.target_date && (
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
              Target: {new Date(goalData.target_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{Math.max(0, Math.round((new Date(goalData.target_date) - new Date()) / 86400000))} days left
            </p>
          )}
          <button className="panel-link" type="button" onClick={() => navigate('/goals')}>
            Edit goal
          </button>
        </div>
      )}

      <div className="premium-panel report-panel">
        <div className="panel-kicker">Doctor-ready</div>
        <h3>30-day summary</h3>
        <p>Meals, glucose, weight, BP, and medication logs in one report.</p>
        <button className="panel-link" type="button" onClick={() => navigate('/report')}>
          Open report
        </button>
      </div>
    </aside>
  )

  return (
    <div className="dashboard-page">
      <section className="today-hero">
        <div className="today-copy">
          <div className="hero-topline">
            <div>
              <div className="hero-eyebrow">{isToday ? 'Today dashboard' : 'Daily review'}</div>
              <h1>{isToday ? `Good ${dayPart}, ${firstName}.` : formatDate(date)}</h1>
            </div>
            <div className="hero-date-pill">{balanceStatus}</div>
          </div>
          <p>{heroGuidance}</p>
          <div className="hero-focus-card" aria-label="Suggested next step">
            <div>
              <span>Suggested next step</span>
              <strong>{nextAction.title}</strong>
              <p>{nextAction.copy}</p>
            </div>
            <button className="btn btn-green btn-compact" type="button" onClick={goToNextAction}>
              {nextAction.label}
            </button>
          </div>
          <div className="hero-actions">
            {nextAction.path !== '/scan' && (
              <button className="btn btn-green" onClick={() => navigate('/scan')}>Scan meal</button>
            )}
            {nextAction.path !== '/coach' && (
              <button className="btn btn-ghost" onClick={() => {
                const goalContext = goalData ? `My goal is ${GOAL_TYPE_LABELS[goalData.goal_type] || 'general health'}${goalData.target_weight_kg ? ` (target: ${goalData.target_weight_kg}kg)` : ''}. ` : '';
                const macroContext = `Today: ${Math.round(T.cal)}/${G.cal} kcal, ${r1(T.protein_g)}/${G.protein_g}g protein, ${r1(T.carbs_g)}/${G.carbs_g}g carbs. `;
                const contextQuestion = goalContext + macroContext + 'What should I focus on for my next meal?';
                navigate('/coach', { state: { question: contextQuestion, source: 'today-dashboard' } });
              }}>Ask coach</button>
            )}
          </div>
        </div>

        <div className="today-score">
          <div className="score-ring" style={{ '--score-deg': `${balanceScore * 3.6}deg` }}>
            <span>{balanceScore}</span>
            <small>/100</small>
          </div>
          <small>Meal balance</small>
          <b>{totalEntries} items logged</b>
          <em>{totalEntries ? 'Based on calories, carbs, and protein progress.' : 'Log your first item to unlock insight.'}</em>
        </div>
      </section>

      <div className="today-sticky-summary">
        {/* Day navigation */}
        <div className="day-bar dashboard-control-bar">
          <div>
            <span>{isToday ? 'Today summary' : 'Daily review'}</span>
            <h2>{formatDate(date)}</h2>
          </div>
          <div className="dashboard-controls">
            <button className="btn btn-ghost btn-compact" onClick={openCopyYesterday} disabled={copyBusy}>
              Copy yesterday
            </button>
            <div className="day-nav">
              <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
              <span>{shortDate(date)}</span>
              <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
            </div>
          </div>
        </div>

        <div className="macro-row dashboard-macro-row">
          {macroCards.map(m => (
            <div key={m.key} className={`macro-card ${m.cls}`}>
              <div className="macro-card-top">
                <div>
                  <div className="lbl">{m.title}</div>
                  <div className="macro-goal">Goal {m.goal}</div>
                </div>
                <span className="macro-pill">{m.percent}%</span>
              </div>
              <div className="val">{m.val}</div>
              <div className="prog-bar">
                <div className={`prog-fill ${m.pfCls}`} style={{ width: m.percent + '%' }} />
              </div>
              <div className="macro-helper">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Copy-yesterday banner — shown prominently when today has no logs but yesterday likely did */}
      {!loading && totalEntries === 0 && isToday && (
        <div className="copy-yesterday-banner">
          <div className="copy-yesterday-banner-copy">
            <strong>Eating similar to yesterday?</strong>
            <span>Copy yesterday's meals in one tap and adjust as needed.</span>
          </div>
          <button
            className="btn btn-ghost btn-compact"
            type="button"
            onClick={openCopyYesterday}
            disabled={copyBusy}
          >
            {copyBusy ? '…' : 'Copy yesterday'}
          </button>
        </div>
      )}

      {msg && <div className="success-box">{msg}</div>}
      {err && <div className="error-box">{err}</div>}
      {copyReview && (
        <CopyYesterdayModal
          sourceDate={copyReview.sourceDate}
          targetDate={copyReview.targetDate}
          logs={copyReview.logs}
          selectedIds={copySelectedIds}
          destinationMeals={copyDestinationMeals}
          busy={copyBusy}
          onToggleItem={toggleCopyItem}
          onToggleMeal={toggleCopyMeal}
          onSelectAll={selectAllCopyItems}
          onClear={clearCopyItems}
          onCancel={() => { setCopyReview(null); setCopyDestinationMeals({}) }}
          onConfirm={confirmCopyYesterday}
          onSetDestinationMeal={setDestinationMeal}
        />
      )}

      {showProfileReminder && (
        <div className="modal-bg" role="presentation">
          <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: 480 }}>
            <div className="ingredient-modal-head">
              <div>
                <div className="modal-title">Complete your profile for better recommendations</div>
                <div className="modal-sub">Add your age, weight, height, and gender to get personalized calorie and macro targets.</div>
              </div>
              <button className="modal-close-btn" type="button" aria-label="Close reminder" onClick={() => setShowProfileReminder(false)}>&times;</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{
                padding: 16,
                background: 'var(--green-l)',
                border: '1px solid var(--green-b)',
                borderRadius: 14,
                marginBottom: 16
              }}>
                <p style={{ fontSize: 13, margin: 0, color: 'var(--green)', fontWeight: 600 }}>
                  <strong style={{ display: 'block', marginBottom: 8 }}>Why complete your profile?</strong>
                  • Get accurate calorie and macro targets<br />
                  • Personalized recommendations from AI Coach<br />
                  • Track progress toward your health goals<br />
                  • Better meal suggestions and guidance
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShowProfileReminder(false)}
                >
                  Maybe later
                </button>
                <button
                  className="btn btn-green"
                  type="button"
                  onClick={() => {
                    setShowProfileReminder(false)
                    navigate('/profile')
                  }}
                  style={{ flex: 1 }}
                >
                  Complete profile now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-workspace">
        {guidanceRail}

        <section className="dashboard-main-column">
          {loading && <div className="spin" style={{ margin: '20px auto' }} />}

          {/* Meal blocks */}
          {!loading && MEALS.map(m => {
            const entries = logs[m.id] || []
            const mc = Math.round(entries.reduce((s, e) => s + (e.cal       || 0), 0))
            const mp = r1(    entries.reduce((s, e) => s + (e.protein_g || 0), 0))
            const mf = r1(    entries.reduce((s, e) => s + (e.fiber_g   || 0), 0))

            return (
              <div key={m.id} className={`meal-block${entries.length ? ' meal-filled' : ''}`}>
                {/* Meal header */}
                <div
                  className="meal-header"
                  style={{ borderRadius: open[m.id] ? 'var(--rl) var(--rl) 0 0' : 'var(--rl)' }}
                  onClick={() => setOpen(o => ({ ...o, [m.id]: !o[m.id] }))}
                >
                  <span className={`meal-dot ${m.dot}`} />
                  <span className="meal-title-text">{m.label}</span>
                  <button
                    className="meal-scan-btn"
                    onClick={(e) => { e.stopPropagation(); navigate(`/scan?tab=plate&meal=${m.id}`) }}
                    title={`Scan ${m.label.toLowerCase()}`}
                  >
                    📷
                  </button>
                  <span className="meal-meta">{mc} kcal · P {mp}g · F {mf}g</span>
                  <span className="meal-caret" style={{ transform: open[m.id] ? '' : 'rotate(-90deg)' }}>&#9660;</span>
                </div>

                {/* Meal body */}
                {open[m.id] && (
                  <div className="meal-body">
                    {entries.length === 0 && (
                      <div className="empty-meal">
                        Nothing logged yet. Add the first item below.
                      </div>
                    )}

                    {entries.map(e => (
                      editingId === e.id
                        ? (
                          <EditRow
                            key={e.id}
                            entry={e}
                            foods={foods}
                            onSave={saveEdit}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <div key={e.id} className="log-entry">
                            <div style={{ flex: 1 }}>
                              <div className="log-name">{e.food_name}</div>
                              <div className="log-amt">{e.amt_label}</div>
                            </div>
                            <span className="tag tag-p">P {e.protein_g}g</span>
                            <span className="tag tag-f">F {e.fiber_g}g</span>
                            <span className="tag tag-k">{e.cal} kcal</span>
                            {/* Edit button */}
                            <button
                              className="btn-del"
                              title="Edit quantity"
                              onClick={() => setEditingId(e.id)}
                              style={{ color: 'var(--blue)', borderColor: 'var(--blue-b)' }}
                            >
                              ✏
                            </button>
                            <button className="btn-del" onClick={() => deleteEntry(e.id)}>&#215;</button>
                          </div>
                        )
                    ))}

                    {/* Food search + add */}
                    <FoodSearch
                      foods={foods}
                      onAdd={addEntry}
                      onFoodCreated={addFoodToList}
                      mealType={m.id}
                      placeholder={`Search food to add to ${m.label.toLowerCase()}…`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </section>

      </div>
    </div>
  )
}
