import { useCallback, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import api from '../utils/api'
import { addDays, formatDate, shortDate, today } from '../utils/calc'
import PageHero from '../components/PageHero'
import { useAuth } from '../hooks/useAuth'
import UpgradeModal from '../components/UpgradeModal'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

function daysBack(n, to = today()) {
  const days = []
  for (let i = n - 1; i >= 0; i--) days.push(addDays(to, -i))
  return days
}

export default function Vitals() {
  const { user } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Pro tier check
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'clinical'

  const [date, setDate] = useState(today())
  const [bp, setBp] = useState({ systolic: '', diastolic: '', pulse: '', notes: '' })
  const [a1c, setA1c] = useState({ value_pct: '', notes: '' })
  const [bpLogs, setBpLogs] = useState([])
  const [bpRange, setBpRange] = useState([])
  const [a1cLogs, setA1cLogs] = useState([])
  const [msg, setMsg] = useState('')

  // Show upgrade prompt for free users
  if (!isPro) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>❤️ Vitals</h1>
          <p className="page-subtitle">Pro Feature</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">❤️</div>
            <h3>Vitals tracking is a Pro feature</h3>
            <p>Track blood pressure, pulse, and HbA1c levels. Visualize trends over time and monitor your cardiovascular health.</p>
            <button
              className="btn btn-green"
              type="button"
              onClick={() => setShowUpgrade(true)}
              style={{ marginTop: '16px' }}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
        {showUpgrade && (
          <UpgradeModal
            feature="vitals"
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    )
  }

  const load = useCallback(async () => {
    const days = daysBack(30, date)
    const [dayBp, rangeBp, rangeA1c] = await Promise.all([
      api.get(`/health/bp?date=${date}`),
      api.get(`/health/bp/range?from=${days[0]}&to=${days[days.length - 1]}`),
      api.get(`/health/a1c/range?from=${addDays(date, -365)}&to=${date}`),
    ])
    setBpLogs(dayBp.logs)
    setBpRange(rangeBp.data)
    setA1cLogs(rangeA1c.data)
  }, [date])

  useEffect(() => { load() }, [load])

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 1800)
  }

  async function saveBp() {
    if (!bp.systolic || !bp.diastolic) return
    await api.post('/health/bp', { ...bp, log_date: date })
    setBp({ systolic: '', diastolic: '', pulse: '', notes: '' })
    flash('Blood pressure saved')
    load()
  }

  async function saveA1c() {
    if (!a1c.value_pct) return
    await api.post('/health/a1c', { ...a1c, log_date: date })
    setA1c({ value_pct: '', notes: '' })
    flash('HbA1c saved')
    load()
  }

  async function delBp(id) { await api.delete(`/health/bp/${id}`); load() }
  async function delA1c(id) { await api.delete(`/health/a1c/${id}`); load() }

  const days = daysBack(30, date)
  const bpMap = Object.fromEntries(bpRange.map(d => [d.log_date, d]))
  const latestA1c = a1cLogs[a1cLogs.length - 1]

  return (
    <div>
      {msg && <div className="success-box">{msg}</div>}

      <PageHero
        eyebrow="Vitals"
        title="Keep clinical markers visible."
        copy="Track blood pressure, pulse, and HbA1c trends for clearer doctor conversations."
        metric={latestA1c ? `${latestA1c.value_pct}%` : 'No lab'}
        metricLabel="latest HbA1c"
      />

      <div className="day-bar">
        <h2>{formatDate(date)}</h2>
        <div className="day-nav">
          <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
          <span>{shortDate(date)}</span>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
        </div>
      </div>

      <div className="week-stat-grid">
        <div className="week-stat"><div className="sv" style={{ color: 'var(--red)' }}>{bpLogs[0] ? `${bpLogs[0].systolic}/${bpLogs[0].diastolic}` : '–'}</div><div className="sl">today BP</div></div>
        <div className="week-stat"><div className="sv" style={{ color: 'var(--blue)' }}>{bpLogs[0]?.pulse || '–'}</div><div className="sl">pulse</div></div>
        <div className="week-stat"><div className="sv" style={{ color: 'var(--amber)' }}>{latestA1c ? `${latestA1c.value_pct}%` : '–'}</div><div className="sl">latest HbA1c</div></div>
      </div>

      <div className="card">
        <div className="card-title">Blood pressure</div>
        <div className="form-grid">
          <div className="form-group"><label>Systolic</label><input type="number" value={bp.systolic} onChange={e => setBp(b => ({ ...b, systolic: e.target.value }))} placeholder="120" /></div>
          <div className="form-group"><label>Diastolic</label><input type="number" value={bp.diastolic} onChange={e => setBp(b => ({ ...b, diastolic: e.target.value }))} placeholder="80" /></div>
        </div>
        <div className="form-grid">
          <div className="form-group"><label>Pulse</label><input type="number" value={bp.pulse} onChange={e => setBp(b => ({ ...b, pulse: e.target.value }))} placeholder="72" /></div>
          <div className="form-group"><label>Notes</label><input value={bp.notes} onChange={e => setBp(b => ({ ...b, notes: e.target.value }))} placeholder="optional" /></div>
        </div>
        <button className="btn btn-green btn-full" onClick={saveBp}>Save blood pressure</button>

        {bpLogs.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {bpLogs.map(log => (
              <div key={log.id} className="log-entry">
                <div style={{ flex: 1 }}><div className="log-name">{log.systolic}/{log.diastolic}</div><div className="log-amt">{log.notes || 'Blood pressure reading'}</div></div>
                {log.pulse && <span className="tag tag-p">P {log.pulse}</span>}
                <button className="btn-del" onClick={() => delBp(log.id)}>&#215;</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">30-day BP trend</div>
        <div style={{ position: 'relative', height: 190 }}>
          <Line
            data={{
              labels: days.map(d => d.slice(5)),
              datasets: [
                { label: 'Systolic', data: days.map(d => bpMap[d]?.avg_systolic ? Math.round(bpMap[d].avg_systolic) : null), borderColor: '#b91c1c', backgroundColor: 'rgba(185,28,28,.06)', tension: .3, spanGaps: true },
                { label: 'Diastolic', data: days.map(d => bpMap[d]?.avg_diastolic ? Math.round(bpMap[d].avg_diastolic) : null), borderColor: '#2563a8', backgroundColor: 'rgba(37,99,168,.06)', tension: .3, spanGaps: true },
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } } }, scales: { x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }, y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } } } }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">HbA1c blood test</div>
        <div className="form-grid">
          <div className="form-group"><label>HbA1c (%)</label><input type="number" min="3" max="16" step="0.1" value={a1c.value_pct} onChange={e => setA1c(a => ({ ...a, value_pct: e.target.value }))} placeholder="6.8" /></div>
          <div className="form-group"><label>Notes</label><input value={a1c.notes} onChange={e => setA1c(a => ({ ...a, notes: e.target.value }))} placeholder="lab / fasting notes" /></div>
        </div>
        <button className="btn btn-green btn-full" onClick={saveA1c}>Save HbA1c</button>
        <div style={{ marginTop: 12 }}>
          {a1cLogs.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No HbA1c logs yet</div>
          ) : [...a1cLogs].reverse().map(log => (
            <div key={log.id} className="log-entry">
              <div style={{ flex: 1 }}><div className="log-name">{shortDate(log.log_date)}</div><div className="log-amt">{log.notes || 'HbA1c result'}</div></div>
              <span className="tag tag-k">{log.value_pct}%</span>
              <button className="btn-del" onClick={() => delA1c(log.id)}>&#215;</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
