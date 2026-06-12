import { useCallback, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import api from '../utils/api'
import { addDays, formatDate, shortDate, today } from '../utils/calc'
import { useAuth } from '../hooks/useAuth'
import PageHero from '../components/PageHero'
import StatusToast from '../components/StatusToast'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip)

function daysBack(n, to = today()) {
  const days = []
  for (let i = n - 1; i >= 0; i--) days.push(addDays(to, -i))
  return days
}

function r1(n) {
  return Math.round((Number(n) || 0) * 10) / 10
}

export default function Weight() {
  const { user } = useAuth()
  const [date, setDate] = useState(today())
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [logs, setLogs] = useState([])
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const days = daysBack(30, date)
    const data = await api.get(`/health/weight/range?from=${days[0]}&to=${days[days.length - 1]}`)
    setLogs(data.data)
    const current = data.data.find(d => d.log_date === date)
    setWeight(current?.weight_kg || '')
    setNotes(current?.notes || '')
  }, [date])

  useEffect(() => { load() }, [load])

  async function save() {
    const value = parseFloat(weight)
    if (!value || value < 20 || value > 400) {
      setMsg('⚠️ Weight must be between 20-400 kg')
      setTimeout(() => setMsg(''), 2500)
      return
    }
    try {
      await api.post('/health/weight', { weight_kg: value, log_date: date, notes })
      setMsg('Weight saved')
      setTimeout(() => setMsg(''), 1800)
      load()
    } catch (err) {
      setMsg(err.error || 'Failed to save weight')
      setTimeout(() => setMsg(''), 2500)
    }
  }

  async function del(id) {
    await api.delete(`/health/weight/${id}`)
    load()
  }

  const latest = logs[logs.length - 1]
  const first = logs[0]
  const heightM = (user?.height_cm || 0) / 100
  const bmi = latest?.weight_kg && heightM ? latest.weight_kg / (heightM * heightM) : null
  const delta = latest && first ? latest.weight_kg - first.weight_kg : 0
  const days = daysBack(30, date)
  const map = Object.fromEntries(logs.map(l => [l.log_date, l.weight_kg]))

  return (
    <div>
      <StatusToast message={msg} />

      <PageHero
        eyebrow="Weight"
        title="Follow body trend, not daily noise."
        copy="Track weight, BMI, and 30-day movement together for a calmer view of progress."
        metric={latest ? `${r1(latest.weight_kg)}kg` : 'No log'}
        metricLabel="latest weight"
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
        <div className="week-stat"><div className="sv" style={{ color: 'var(--blue)' }}>{latest ? r1(latest.weight_kg) + 'kg' : '–'}</div><div className="sl">latest weight</div></div>
        <div className="week-stat"><div className="sv" style={{ color: 'var(--green)' }}>{bmi ? r1(bmi) : '–'}</div><div className="sl">BMI</div></div>
        <div className="week-stat"><div className="sv" style={{ color: delta <= 0 ? 'var(--green)' : 'var(--amber)' }}>{delta ? `${delta > 0 ? '+' : ''}${r1(delta)}kg` : '0kg'}</div><div className="sl">30-day change</div></div>
      </div>

      <div className="card">
        <div className="card-title">Log weight</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" min="20" max="400" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" />
          </div>
        </div>
        <button className="btn btn-green btn-full" onClick={save}>Save weight</button>
      </div>

      <div className="card">
        <div className="card-title">30-day weight trend</div>
        <div style={{ position: 'relative', height: 190 }}>
          <Line
            data={{
              labels: days.map(d => shortDate(d).split(' ')[1] || d.slice(5)),
              datasets: [{
                label: 'Weight',
                data: days.map(d => map[d] || null),
                borderColor: '#2563a8',
                backgroundColor: 'rgba(37,99,168,.08)',
                pointRadius: 4,
                spanGaps: true,
                tension: .3,
                fill: true,
              }],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }, y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } } } }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Recent logs</div>
        {logs.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No weight logs yet</div>
        ) : [...logs].reverse().slice(0, 10).map(log => (
          <div key={log.id} className="log-entry">
            <div style={{ flex: 1 }}>
              <div className="log-name">{shortDate(log.log_date)}</div>
              <div className="log-amt">{log.notes || 'No notes'}</div>
            </div>
            <span className="tag tag-p">{r1(log.weight_kg)}kg</span>
            <button className="btn-del" onClick={() => del(log.id)}>&#215;</button>
          </div>
        ))}
      </div>
    </div>
  )
}
