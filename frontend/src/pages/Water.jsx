import { useState, useEffect, useCallback } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import api from '../utils/api'
import { today, addDays, formatDate, shortDate, last7Days } from '../utils/calc'
import PageHero from '../components/PageHero'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

function r1(n) { return Math.round(n * 10) / 10 }

export default function Water() {
  const [date, setDate]   = useState(today())
  const [logs, setLogs]   = useState([])
  const [total, setTotal] = useState(0)
  const [goal, setGoal]   = useState(3000)
  const [custom, setCustom] = useState('')
  const [weekly, setWeekly] = useState([])

  const load = useCallback(async () => {
    const [w, g, wkData] = await Promise.all([
      api.get(`/health/water?date=${date}`),
      api.get('/health/goals'),
      api.get(`/health/water/range?from=${last7Days()[0]}&to=${last7Days()[6]}`),
    ])
    setLogs(w.logs)
    setTotal(w.total_ml)
    setGoal(g.goals?.water_ml || 3000)
    setWeekly(wkData.data)
  }, [date])

  useEffect(() => { load() }, [load])

  async function add(ml) {
    await api.post('/health/water', { ml, log_date: date })
    load()
  }
  async function del(id) {
    await api.delete(`/health/water/${id}`)
    load()
  }
  async function addCustom() {
    const v = parseInt(custom); if (!v || v < 50) return
    await add(v); setCustom('')
  }

  const filled = Math.floor(total / 250)
  const pct = Math.min(100, Math.round((total / goal) * 100))

  const days7   = last7Days()
  const wkMap   = Object.fromEntries(weekly.map(d => [d.log_date, d.total_ml]))
  const wkData  = days7.map(d => wkMap[d] || 0)
  const wkLabels= days7.map(d => { const dt = new Date(d + 'T00:00:00'); return ['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getDay()] })

  return (
    <div>
      <PageHero
        eyebrow="Hydration"
        title="Build steady hydration habits."
        copy="Log water quickly and see whether today is keeping pace with your weekly pattern."
        metric={`${pct}%`}
        metricLabel="today's goal"
      />

      <div className="day-bar">
        <h2>{formatDate(date)}</h2>
        <div className="day-nav">
          <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
          <span>{shortDate(date)}</span>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Input card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Daily intake</h3>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--blue)', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{total.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>ml / {goal.toLocaleString()}ml goal · {r1(total / 250)} glasses</div>
          </div>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, marginBottom: 11, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--blue)', borderRadius: 5, width: pct + '%', transition: 'width .5s' }} />
          </div>
          <div className="cups-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className={`cup${i < filled ? ' filled' : ''}`} onClick={() => add(250)} title="+250ml">
                <svg viewBox="0 0 16 16"><path d="M3 2h10l-1.5 11H4.5L3 2z" /></svg>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[150, 250, 500].map(ml => (
              <button key={ml} className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => add(ml)}>+{ml}ml</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <input
              type="number" placeholder="Custom ml" min="50" max="2000" step="50"
              value={custom} onChange={e => setCustom(e.target.value)}
              style={{ flex: 1, height: 36, padding: '0 10px', border: '1px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 12, background: 'var(--surface)', color: 'var(--text)' }}
            />
            <button className="btn btn-blue" style={{ height: 36, fontSize: 12 }} onClick={addCustom}>Add</button>
          </div>
        </div>

        {/* Log card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Today's log</h3>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No entries yet</div>
            ) : [...logs].reverse().map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{e.ml}ml</span>
                <span style={{ color: 'var(--hint)' }}>{new Date(e.logged_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                <button style={{ border: 'none', background: 'none', color: 'var(--hint)', cursor: 'pointer', fontSize: 13 }} onClick={() => del(e.id)}>&#215;</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="card">
        <div className="card-title">7-day water trend</div>
        <div style={{ position: 'relative', height: 140 }}>
          <Bar data={{ labels: wkLabels, datasets: [{ label: 'ml', data: wkData, backgroundColor: 'var(--blue)', borderRadius: 4 }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }, y: { beginAtZero: true, ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } } } }}
          />
        </div>
      </div>
    </div>
  )
}
