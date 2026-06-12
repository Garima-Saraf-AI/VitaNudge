import { useCallback, useEffect, useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip } from 'chart.js'
import api from '../utils/api'
import { addDays, formatDate, shortDate, today, last7Days } from '../utils/calc'
import { useAuth } from '../hooks/useAuth'
import PageHero from '../components/PageHero'
import StatusToast from '../components/StatusToast'

ChartJS.register(LineElement, BarElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip)

function daysBack(n, to = today()) {
  const days = []
  for (let i = n - 1; i >= 0; i--) days.push(addDays(to, -i))
  return days
}
function r1(n) { return Math.round((Number(n) || 0) * 10) / 10 }

const TABS = [
  { key: 'weight', label: 'Body weight', icon: '⚖️' },
  { key: 'water',  label: 'Hydration',   icon: '💧' },
  { key: 'steps',  label: 'Steps',       icon: '👟' },
]

const CHART_OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }, y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } } } }

export default function Body() {
  const { user } = useAuth()
  const [tab, setTab]   = useState('weight')
  const [date, setDate] = useState(today())
  const [msg, setMsg]   = useState('')

  // Weight state
  const [weight, setWeight] = useState('')
  const [wNotes, setWNotes] = useState('')
  const [weightLogs, setWeightLogs] = useState([])

  // Water state
  const [waterLogs, setWaterLogs]   = useState([])
  const [waterTotal, setWaterTotal] = useState(0)
  const [waterGoal, setWaterGoal]   = useState(3000)
  const [waterCustom, setWaterCustom] = useState('')
  const [waterWeekly, setWaterWeekly] = useState([])

  // Steps state
  const [steps, setSteps]           = useState('')
  const [stepsLog, setStepsLog]     = useState(null)
  const [stepsWeekly, setStepsWeekly] = useState([])

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 1800) }

  const load = useCallback(async () => {
    const days30 = daysBack(30, date)
    const week   = last7Days()
    const [wt, wa, g, waW, st, stW] = await Promise.all([
      api.get(`/health/weight/range?from=${days30[0]}&to=${days30[days30.length-1]}`),
      api.get(`/health/water?date=${date}`),
      api.get('/health/goals'),
      api.get(`/health/water/range?from=${week[0]}&to=${week[6]}`),
      api.get(`/health/steps?date=${date}`),
      api.get(`/health/steps/range?from=${week[0]}&to=${week[6]}`),
    ])
    setWeightLogs(wt.data)
    const cur = wt.data.find(d => d.log_date === date)
    setWeight(cur?.weight_kg || '')
    setWNotes(cur?.notes || '')
    setWaterLogs(wa.logs)
    setWaterTotal(wa.total_ml)
    setWaterGoal(g.goals?.water_ml || 3000)
    setWaterWeekly(waW.data)
    setStepsLog(st.log)
    setSteps(st.log?.steps || '')
    setStepsWeekly(stW.data)
  }, [date])

  useEffect(() => { load() }, [load])

  // Weight actions
  async function saveWeight() {
    const v = parseFloat(weight)
    if (!v || v < 20 || v > 400) {
      flash('⚠️ Weight must be between 20-400 kg')
      return
    }
    await api.post('/health/weight', { weight_kg: v, log_date: date, notes: wNotes })
    flash('Weight saved'); load()
  }
  async function delWeight(id) { await api.delete(`/health/weight/${id}`); load() }

  // Water actions
  async function addWater(ml) { await api.post('/health/water', { ml, log_date: date }); load() }
  async function delWater(id) { await api.delete(`/health/water/${id}`); load() }
  async function addCustomWater() {
    const v = parseInt(waterCustom)
    if (!v || v < 50) return
    await addWater(v); setWaterCustom('')
  }

  // Steps actions
  async function saveSteps() {
    const v = parseInt(steps)
    if (!v || v < 0 || v > 100000) {
      flash('⚠️ Steps must be between 0-100,000')
      return
    }
    await api.post('/health/steps', { steps: v, log_date: date })
    flash('Steps saved'); load()
  }
  async function delSteps() {
    await api.delete(`/health/steps/${date}`)
    setSteps(''); setStepsLog(null); flash('Steps removed')
  }

  // Derived
  const latest  = weightLogs[weightLogs.length - 1]
  const first   = weightLogs[0]
  const heightM = (user?.height_cm || 0) / 100
  const bmi     = latest?.weight_kg && heightM ? r1(latest.weight_kg / (heightM * heightM)) : null
  const delta   = latest && first ? latest.weight_kg - first.weight_kg : 0
  const days30  = daysBack(30, date)
  const wMap    = Object.fromEntries(weightLogs.map(l => [l.log_date, l.weight_kg]))
  const waterPct= Math.min(100, Math.round((waterTotal / waterGoal) * 100))
  const filledCups = Math.floor(waterTotal / 250)
  const week    = last7Days()
  const wkLabels= week.map(d => ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d+'T00:00:00').getDay()])
  const waterWkMap = Object.fromEntries(waterWeekly.map(d => [d.log_date, d.total_ml]))
  const stepsWkMap = Object.fromEntries(stepsWeekly.map(d => [d.log_date, d.steps]))
  const avgSteps   = stepsWeekly.length ? Math.round(stepsWeekly.reduce((s,d) => s + d.steps, 0) / stepsWeekly.length) : 0
  const STEP_GOAL  = 8000

  const heroMetric = tab === 'weight'
    ? (latest ? `${r1(latest.weight_kg)}kg` : 'No log')
    : tab === 'water' ? `${waterPct}%`
    : (stepsLog ? stepsLog.steps.toLocaleString() : 'No log')
  const heroLabel = tab === 'weight' ? 'latest weight' : tab === 'water' ? "today's goal" : 'steps today'

  return (
    <div>
      <StatusToast message={msg} />

      <PageHero
        eyebrow="Body"
        title="Weight, hydration, and steps in one view."
        copy="Three daily habits — logged together for a complete picture of how your body is doing."
        metric={heroMetric}
        metricLabel={heroLabel}
      />

      {/* Tab bar */}
      <div className="body-tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`body-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="day-bar">
        <h2>{formatDate(date)}</h2>
        <div className="day-nav">
          <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
          <span>{shortDate(date)}</span>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
        </div>
      </div>

      {/* ── WEIGHT TAB ── */}
      {tab === 'weight' && (
        <>
          <div className="week-stat-grid">
            <div className="week-stat"><div className="sv" style={{ color: 'var(--blue)' }}>{latest ? r1(latest.weight_kg)+'kg' : '–'}</div><div className="sl">latest</div></div>
            <div className="week-stat"><div className="sv" style={{ color: 'var(--green)' }}>{bmi ?? '–'}</div><div className="sl">BMI</div></div>
            <div className="week-stat"><div className="sv" style={{ color: delta <= 0 ? 'var(--green)' : 'var(--amber)' }}>{delta ? `${delta>0?'+':''}${r1(delta)}kg` : '0kg'}</div><div className="sl">30-day change</div></div>
          </div>

          <div className="card">
            <div className="card-title">Log weight</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" min="20" max="400" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 85.5" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={wNotes} onChange={e => setWNotes(e.target.value)} placeholder="optional" />
              </div>
            </div>
            <button className="btn btn-green btn-full" onClick={saveWeight}>Save weight</button>
          </div>

          <div className="card">
            <div className="card-title">30-day trend</div>
            <div style={{ position: 'relative', height: 180 }}>
              <Line
                data={{ labels: days30.map(d => d.slice(8)), datasets: [{ data: days30.map(d => wMap[d] || null), borderColor: 'var(--blue)', backgroundColor: 'rgba(29,90,158,.07)', pointRadius: 3, spanGaps: true, tension: .35, fill: true }] }}
                options={CHART_OPTS}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Recent logs</div>
            {weightLogs.length === 0
              ? <p style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No weight logs yet — start today.</p>
              : [...weightLogs].reverse().slice(0, 10).map(log => (
                <div key={log.id} className="log-entry">
                  <div style={{ flex: 1 }}>
                    <div className="log-name">{shortDate(log.log_date)}</div>
                    <div className="log-amt">{log.notes || 'No notes'}</div>
                  </div>
                  <span className="tag tag-p">{r1(log.weight_kg)}kg</span>
                  <button className="btn-del" onClick={() => delWeight(log.id)}>&#215;</button>
                </div>
              ))
            }
          </div>
        </>
      )}

      {/* ── WATER TAB ── */}
      {tab === 'water' && (
        <>
          <div className="two-col-grid">
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">Daily intake</div>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue)', fontFamily: "'Sora',sans-serif", letterSpacing: '-.5px', lineHeight: 1 }}>{waterTotal.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  ml / {waterGoal.toLocaleString()}ml goal · {(() => {
                    const glasses = r1(waterTotal/250);
                    return glasses === 1 ? '1 glass' : `${glasses} glasses`;
                  })()}
                </div>
              </div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, marginBottom: 11, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--blue)', borderRadius: 5, width: waterPct+'%', transition: 'width .5s' }} />
              </div>
              <div className="cups-grid">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className={`cup${i < filledCups ? ' filled' : ''}`} onClick={() => addWater(250)} title="+250ml">
                    <svg viewBox="0 0 16 16"><path d="M3 2h10l-1.5 11H4.5L3 2z" /></svg>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {[150, 250, 500].map(ml => (
                  <button key={ml} className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => addWater(ml)}>+{ml}ml</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <input type="number" placeholder="Custom ml" min="50" max="2000" step="50"
                  value={waterCustom} onChange={e => setWaterCustom(e.target.value)}
                  style={{ flex: 1, height: 36, padding: '0 10px', border: '1.5px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 12, background: 'var(--surface)', color: 'var(--text)' }} />
                <button className="btn btn-blue" style={{ height: 36, fontSize: 12 }} onClick={addCustomWater}>Add</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">Today's log</div>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {waterLogs.length === 0
                  ? <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No entries yet — tap a cup or add ml above.</div>
                  : [...waterLogs].reverse().map(e => {
                      const time = e.logged_at ? new Date(e.logged_at.replace(' ', 'T')) : new Date()
                      const isValid = !isNaN(time.getTime())
                      return (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                          <span style={{ fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--text)' }}>{e.ml}ml</span>
                          <span style={{ color: 'var(--hint)' }}>
                            {isValid ? time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                          <button style={{ border: 'none', background: 'none', color: 'var(--hint)', cursor: 'pointer', fontSize: 13 }} onClick={() => delWater(e.id)}>&#215;</button>
                        </div>
                      )
                    })
                }
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">7-day water trend</div>
            <div style={{ position: 'relative', height: 140 }}>
              <Bar data={{ labels: wkLabels, datasets: [{ data: week.map(d => waterWkMap[d] || 0), backgroundColor: 'var(--blue)', borderRadius: 4 }] }}
                options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, beginAtZero: true } } }} />
            </div>
          </div>
        </>
      )}

      {/* ── STEPS TAB ── */}
      {tab === 'steps' && (
        <>
          <div className="week-stat-grid">
            <div className="week-stat"><div className="sv" style={{ color: stepsLog ? 'var(--green)' : 'var(--hint)' }}>{stepsLog ? stepsLog.steps.toLocaleString() : '–'}</div><div className="sl">today</div></div>
            <div className="week-stat"><div className="sv" style={{ color: 'var(--blue)' }}>{avgSteps ? avgSteps.toLocaleString() : '–'}</div><div className="sl">7-day avg</div></div>
            <div className="week-stat">
              <div className="sv" style={{ color: stepsLog && stepsLog.steps >= STEP_GOAL ? 'var(--green)' : 'var(--amber)' }}>
                {stepsLog ? (stepsLog.steps >= STEP_GOAL ? 'Done!' : `${Math.max(0, STEP_GOAL - stepsLog.steps).toLocaleString()} left`) : `${STEP_GOAL.toLocaleString()} goal`}
              </div>
              <div className="sl">to 8k goal</div>
            </div>
          </div>

          {stepsLog && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)', letterSpacing: '-.5px', lineHeight: 1 }}>{stepsLog.steps.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>steps logged · goal {STEP_GOAL.toLocaleString()}</div>
                </div>
                <button className="btn btn-ghost btn-compact" onClick={delSteps}>Remove</button>
              </div>
              <div style={{ height: 8, background: 'rgba(194,206,187,.4)', borderRadius: 999, overflow: 'hidden', marginTop: 14 }}>
                <div style={{ height: '100%', background: 'var(--green)', borderRadius: 999, width: Math.min(100, (stepsLog.steps/STEP_GOAL)*100)+'%', transition: 'width .5s' }} />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title">Log steps</div>
            <div className="form-grid full">
              <div className="form-group">
                <label>Steps today</label>
                <input type="number" min="0" max="100000" step="100" value={steps} onChange={e => setSteps(e.target.value)} placeholder="e.g. 6500" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
              {[2000, 5000, 8000, 10000].map(v => (
                <button key={v} className="btn btn-ghost btn-compact" onClick={() => setSteps(String(v))}>{(v/1000).toFixed(0)}k</button>
              ))}
            </div>
            <button className="btn btn-green btn-full" onClick={saveSteps}>Save steps</button>
          </div>

          <div className="card">
            <div className="card-title">7-day step trend</div>
            <div style={{ position: 'relative', height: 160 }}>
              <Bar data={{ labels: wkLabels, datasets: [{ data: week.map(d => stepsWkMap[d] || 0), backgroundColor: week.map(d => stepsWkMap[d] >= STEP_GOAL ? 'var(--green)' : 'rgba(26,102,50,.35)'), borderRadius: 4 }] }}
                options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, beginAtZero: true } } }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} />
              Days where you hit 8,000 steps
            </div>
          </div>
        </>
      )}
    </div>
  )
}
