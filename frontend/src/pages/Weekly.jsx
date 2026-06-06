import { useState, useEffect } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip } from 'chart.js'
import api from '../utils/api'
import { dateKey, last7Days } from '../utils/calc'
import PageHero from '../components/PageHero'

ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip)

function r1(n) { return Math.round((n || 0) * 10) / 10 }

const OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }, y: { beginAtZero: true, ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } } } }

export default function Weekly() {
  const [meals,   setMeals]   = useState([])
  const [water,   setWater]   = useState([])
  const [glucose, setGlucose] = useState([])
  const [goals,   setGoals]   = useState({ cal: 1700, protein_g: 110, fiber_g: 35, carbs_g: 150 })

  useEffect(() => {
    const [from, to] = [last7Days()[0], last7Days()[6]]
    Promise.all([
      api.get(`/meals/range?from=${from}&to=${to}`),
      api.get(`/health/water/range?from=${from}&to=${to}`),
      api.get(`/health/glucose/range?from=${from}&to=${to}`),
      api.get('/health/goals'),
    ]).then(([m, w, g, gl]) => {
      setMeals(m.logs);  setWater(w.data); setGlucose(g.data)
      setGoals(gl.goals || goals)
    })
  }, [])

  const days  = last7Days()
  const labels= days.map(d => { const dt = new Date(d + 'T00:00:00'); return ['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getDay()] })

  const mealMap = Object.fromEntries(meals.map(d => [d.log_date, d]))
  const wMap    = Object.fromEntries(water.map(d => [d.log_date, d]))
  const gMap    = Object.fromEntries(glucose.map(d => [d.log_date, d]))

  const proArr  = days.map(d => r1(mealMap[d]?.total_pro || 0))
  const fibArr  = days.map(d => r1(mealMap[d]?.total_fib || 0))
  const calArr  = days.map(d => Math.round(mealMap[d]?.total_cal || 0))
  const crbArr  = days.map(d => r1(mealMap[d]?.total_crb || 0))
  const wArr    = days.map(d => Math.round(wMap[d]?.total_ml || 0))
  const gArr    = days.map(d => gMap[d]?.avg_glucose ? Math.round(gMap[d].avg_glucose) : null)

  const daysLogged = days.filter(d => mealMap[d]?.total_cal > 0).length
  const d = Math.max(daysLogged, 1)
  const avgCal = Math.round(meals.reduce((s,m) => s + (m.total_cal||0), 0) / d)
  const avgPro = r1(meals.reduce((s,m) => s + (m.total_pro||0), 0) / d)
  const avgFib = r1(meals.reduce((s,m) => s + (m.total_fib||0), 0) / d)
  const avgCrb = r1(meals.reduce((s,m) => s + (m.total_crb||0), 0) / d)
  const avgWater = r1(water.reduce((s,w) => s + (w.total_ml||0), 0) / Math.max(water.length, 1) / 1000)

  let streak = 0
  for (let i = 0; i < 30; i++) {
    const dk = new Date(); dk.setDate(dk.getDate() - i); const k = dateKey(dk)
    if (mealMap[k]?.total_cal > 0) streak++; else break
  }

  return (
    <div>
      <PageHero
        eyebrow="Trends"
        title="Your week at a glance."
        copy="See nutrition, hydration, and glucose patterns together so progress feels easier to understand."
        metric={`${daysLogged}/7`}
        metricLabel="days logged"
      />

      {/* Streaks */}
      <div className="streak-row">
        {[
          { icon: '🔥', v: streak,       l: 'day logging streak',    bg: '#fef3c7' },
          { icon: '💧', v: water.filter(w=>w.total_ml>1500).length, l: 'days water goal hit', bg: '#eff6ff' },
          { icon: '🌿', v: daysLogged+'/7', l: 'days logged this week', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.l} className="streak-card">
            <div className="streak-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div><div className="streak-val">{s.v}</div><div className="streak-lbl">{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div className="week-stat-grid">
        {[
          { v: avgCal,  l: 'avg kcal/day', c: 'var(--amber)' },
          { v: avgPro+'g', l: 'avg protein', c: 'var(--blue)' },
          { v: avgFib+'g', l: 'avg fibre',   c: 'var(--green)' },
          { v: avgCrb+'g', l: 'avg carbs',   c: 'var(--red)' },
          { v: avgWater+'L', l: 'avg water', c: 'var(--blue)' },
          { v: daysLogged+'/7', l: 'days logged', c: 'var(--green)' },
        ].map(s => (
          <div key={s.l} className="week-stat">
            <div className="sv" style={{ color: s.c }}>{s.v}</div>
            <div className="sl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card"><h3>Protein &amp; fibre (g)</h3>
          <div style={{ position: 'relative', height: 150 }}>
            <Bar data={{ labels, datasets: [{ label: 'Protein', data: proArr, backgroundColor: '#2563a8', borderRadius: 3 }, { label: 'Fibre', data: fibArr, backgroundColor: '#3a7d44', borderRadius: 3 }] }} options={OPTS} />
          </div>
        </div>
        <div className="chart-card"><h3>Calories &amp; carbs</h3>
          <div style={{ position: 'relative', height: 150 }}>
            <Bar data={{ labels, datasets: [{ label: 'Calories', data: calArr, backgroundColor: '#b45309', borderRadius: 3 }, { label: 'Carbs', data: crbArr, backgroundColor: '#b91c1c', borderRadius: 3 }] }} options={OPTS} />
          </div>
        </div>
        <div className="chart-card"><h3>Water (ml)</h3>
          <div style={{ position: 'relative', height: 150 }}>
            <Bar data={{ labels, datasets: [{ label: 'Water ml', data: wArr, backgroundColor: '#2563a8', borderRadius: 3 }] }} options={OPTS} />
          </div>
        </div>
        <div className="chart-card"><h3>Glucose avg (mg/dL)</h3>
          <div style={{ position: 'relative', height: 150 }}>
            <Line data={{ labels, datasets: [{ label: 'Avg glucose', data: gArr, borderColor: '#b91c1c', backgroundColor: 'rgba(185,28,28,.08)', tension: .3, pointRadius: 4, spanGaps: true, fill: true }] }}
              options={{ ...OPTS, scales: { ...OPTS.scales, y: { ...OPTS.scales.y, beginAtZero: false } } }} />
          </div>
        </div>
      </div>
    </div>
  )
}
