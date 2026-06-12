import { useState, useEffect, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend } from 'chart.js'
import api from '../utils/api'
import { today, addDays, formatDate, shortDate, last7Days, glucoseZone } from '../utils/calc'
import PageHero from '../components/PageHero'
import StatusToast from '../components/StatusToast'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend)

export default function Glucose() {
  const [date, setDate]   = useState(today())
  const [logs, setLogs]   = useState([])
  const [val, setVal]     = useState('')
  const [timing, setTiming] = useState('fasting')
  const [weekly, setWeekly] = useState([])
  const [msg, setMsg] = useState('')

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2200)
  }

  const load = useCallback(async () => {
    const [g, wk] = await Promise.all([
      api.get(`/health/glucose?date=${date}`),
      api.get(`/health/glucose/range?from=${last7Days()[0]}&to=${last7Days()[6]}`),
    ])
    setLogs(g.logs)
    setWeekly(wk.data)
  }, [date])

  useEffect(() => { load() }, [load])

  async function addReading() {
    const v = parseInt(val)
    if (!v || v < 40 || v > 600) {
      flash('⚠️ Enter a glucose value between 40 and 600 mg/dL')
      return
    }
    await api.post('/health/glucose', { value_mgdl: v, timing, log_date: date })
    setVal('')
    flash('Glucose reading saved')
    load()
  }
  async function del(id) { await api.delete(`/health/glucose/${id}`); load() }

  const days7  = last7Days()
  const wkMap  = Object.fromEntries(weekly.map(d => [d.log_date, d]))
  const labels = days7.map(d => { const dt = new Date(d + 'T00:00:00'); return ['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getDay()] })
  const fasting = days7.map(d => wkMap[d]?.avg_fasting ? Math.round(wkMap[d].avg_fasting) : null)
  const postMeal= days7.map(d => wkMap[d]?.avg_post_meal ? Math.round(wkMap[d].avg_post_meal) : null)

  return (
    <div>
      <StatusToast message={msg} />

      <PageHero
        eyebrow="Glucose"
        title="Track readings beside meals."
        copy="Spot fasting and post-meal patterns across the week with cleaner clinical context."
        metric={logs.length}
        metricLabel="readings today"
      />

      <div className="day-bar">
        <h2>{formatDate(date)}</h2>
        <div className="day-nav">
          <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
          <span>{shortDate(date)}</span>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
        </div>
      </div>

      {/* Zones */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {[['Normal fasting: 70–99 mg/dL','zone-normal'],['Pre-diabetic: 100–125','zone-pre'],['High: 126+','zone-high']].map(([l,c]) => (
          <span key={l} className={`tag ${c}`}>{l}</span>
        ))}
      </div>

      {/* Log */}
      <div className="card">
        <div className="card-title">Log blood glucose</div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            type="number" placeholder="mg/dL" min="40" max="600"
            value={val} onChange={e => setVal(e.target.value)}
            style={{ width: 90, padding: '0 11px', height: 38, border: '1px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}
          />
          <select value={timing} onChange={e => setTiming(e.target.value)}
            style={{ flex: 1, minWidth: 120, padding: '0 10px', height: 38, border: '1px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 12, background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Sora,sans-serif' }}>
            <option value="fasting">Fasting</option>
            <option value="pre-breakfast">Pre-breakfast</option>
            <option value="post-breakfast">Post-breakfast (2hr)</option>
            <option value="pre-lunch">Pre-lunch</option>
            <option value="post-lunch">Post-lunch (2hr)</option>
            <option value="pre-dinner">Pre-dinner</option>
            <option value="post-dinner">Post-dinner (2hr)</option>
            <option value="bedtime">Bedtime</option>
          </select>
          <button className="btn btn-green" onClick={addReading}>+ Log</button>
        </div>

        {logs.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No readings logged yet</div>
        ) : [...logs].reverse().map(e => {
          const z = glucoseZone(e.value_mgdl)
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, minWidth: 52, fontFamily: "'JetBrains Mono',monospace", color: e.value_mgdl <= 99 ? 'var(--green)' : e.value_mgdl <= 125 ? 'var(--amber)' : 'var(--red)' }}>{e.value_mgdl}</span>
              <span style={{ fontSize: 10, color: 'var(--hint)' }}>mg/dL</span>
              <span style={{ flex: 1, color: 'var(--muted)' }}>{e.timing.replace(/-/g, ' ')} · {new Date(e.logged_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className={`tag ${z.cls}`}>{z.label}</span>
              <button style={{ border: 'none', background: 'none', color: 'var(--hint)', cursor: 'pointer', fontSize: 13 }} onClick={() => del(e.id)}>&#215;</button>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-title">7-day glucose trend</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: 'var(--blue)', display: 'inline-block', borderRadius: 2 }} /> Fasting avg</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: 'var(--red)', display: 'inline-block', borderRadius: 2 }} /> Post-meal avg</span>
        </div>
        <div style={{ position: 'relative', height: 190 }}>
          <Line data={{ labels, datasets: [
            { label: 'Fasting', data: fasting, borderColor: '#2563a8', backgroundColor: 'rgba(37,99,168,.08)', tension: .3, pointRadius: 4, spanGaps: true, fill: true },
            { label: 'Post-meal', data: postMeal, borderColor: '#b91c1c', backgroundColor: 'rgba(185,28,28,.06)', tension: .3, pointRadius: 4, spanGaps: true, borderDash: [4, 3], fill: true },
          ]}}
          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }, y: { beginAtZero: false, ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } } } }}
          />
        </div>
      </div>
    </div>
  )
}
