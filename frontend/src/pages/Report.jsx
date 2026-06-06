import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip } from 'chart.js'
import api from '../utils/api'
import { addDays, dateKey, today } from '../utils/calc'
import PageHero from '../components/PageHero'

ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip)

function avg(rows, key) {
  const values = rows.map(r => Number(r[key])).filter(Boolean)
  if (!values.length) return 0
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
}

function r1(n) { return Math.round((n || 0) * 10) / 10 }

function daysBetween(from, to) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return Math.max(1, Math.round((end - start) / 86400000) + 1)
}

function listDays(from, to) {
  const days = []
  let cursor = from
  while (cursor <= to && days.length < 90) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

function toYmd(date) {
  return dateKey(date)
}

function formatShortDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function makeWeekOptions(count = 12) {
  const now = new Date(`${today()}T00:00:00`)
  const currentStart = startOfWeek(now)
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(currentStart)
    start.setDate(currentStart.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const cappedEnd = end > now ? now : end
    const from = toYmd(start)
    const to = toYmd(cappedEnd)
    return {
      id: `${from}_${to}`,
      from,
      to,
      label: `${formatShortDate(from)} - ${formatShortDate(to)}${i === 0 ? ' (current week)' : ''}`,
    }
  })
}

function makeMonthOptions(count = 12) {
  const now = new Date(`${today()}T00:00:00`)
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const cappedEnd = end > now ? now : end
    const from = toYmd(start)
    const to = toYmd(cappedEnd)
    return {
      id: `${from}_${to}`,
      from,
      to,
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }
  })
}

function reportConfig(mode, customFrom, customTo, selectedWeek, selectedMonth) {
  if (mode === 'weekly') return { label: 'Weekly', days: daysBetween(selectedWeek.from, selectedWeek.to), to: selectedWeek.to, metric: 'week' }
  if (mode === 'monthly') return { label: 'Monthly', days: daysBetween(selectedMonth.from, selectedMonth.to), to: selectedMonth.to, metric: 'month' }
  return {
    label: 'Custom',
    days: daysBetween(customFrom, customTo),
    to: customTo,
    metric: `${daysBetween(customFrom, customTo)}d`,
  }
}

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } },
    y: { beginAtZero: true, ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } },
  },
}

export default function Report() {
  const weekOptions = useMemo(() => makeWeekOptions(), [])
  const monthOptions = useMemo(() => makeMonthOptions(), [])
  const [selectedWeekId, setSelectedWeekId] = useState(() => weekOptions[0].id)
  const [selectedMonthId, setSelectedMonthId] = useState(() => monthOptions[0].id)
  const [report, setReport] = useState(null)
  const [reportMode, setReportMode] = useState('weekly')
  const [customFrom, setCustomFrom] = useState(addDays(today(), -29))
  const [customTo, setCustomTo] = useState(today())
  const [loading, setLoading] = useState(true)
  const selectedWeek = useMemo(() => weekOptions.find(option => option.id === selectedWeekId) || weekOptions[0], [selectedWeekId, weekOptions])
  const selectedMonth = useMemo(() => monthOptions.find(option => option.id === selectedMonthId) || monthOptions[0], [selectedMonthId, monthOptions])

  const load = useCallback(async () => {
    setLoading(true)
    const cfg = reportConfig(reportMode, customFrom, customTo, selectedWeek, selectedMonth)
    const r = await api.get(`/health/report?days=${cfg.days}&to=${cfg.to}`)
    setReport(r)
    setLoading(false)
  }, [customFrom, customTo, reportMode, selectedMonth, selectedWeek])

  useEffect(() => { load() }, [load])

  const cfg = reportConfig(reportMode, customFrom, customTo, selectedWeek, selectedMonth)

  const summary = useMemo(() => {
    if (!report) return null
    const daysLogged = report.meals.filter(m => Number(m.cal) > 0).length
    return {
      avgCal: avg(report.meals, 'cal'),
      avgProtein: avg(report.meals, 'protein_g'),
      avgCarbs: avg(report.meals, 'carbs_g'),
      avgWater: avg(report.water, 'total_ml'),
      avgGlucose: avg(report.glucose, 'avg_glucose'),
      avgBpSys: avg(report.bp, 'avg_systolic'),
      avgBpDia: avg(report.bp, 'avg_diastolic'),
      latestWeight: report.weight[report.weight.length - 1]?.weight_kg || null,
      latestA1c: report.a1c[report.a1c.length - 1]?.value_pct || null,
      daysLogged,
    }
  }, [report])

  const charts = useMemo(() => {
    if (!report) return null
    const days = listDays(report.range.from, report.range.to)
    const mealMap = Object.fromEntries(report.meals.map(d => [d.log_date, d]))
    const waterMap = Object.fromEntries(report.water.map(d => [d.log_date, d]))
    const glucoseMap = Object.fromEntries(report.glucose.map(d => [d.log_date, d]))
    const compact = days.length > 14
    return {
      labels: days.map(d => {
        const dt = new Date(`${d}T00:00:00`)
        return compact ? `${dt.getDate()}/${dt.getMonth() + 1}` : ['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getDay()]
      }),
      protein: days.map(d => r1(mealMap[d]?.protein_g || 0)),
      fiber: days.map(d => r1(mealMap[d]?.fiber_g || 0)),
      calories: days.map(d => Math.round(mealMap[d]?.cal || 0)),
      carbs: days.map(d => r1(mealMap[d]?.carbs_g || 0)),
      water: days.map(d => Math.round(waterMap[d]?.total_ml || 0)),
      glucose: days.map(d => glucoseMap[d]?.avg_glucose ? Math.round(glucoseMap[d].avg_glucose) : null),
    }
  }, [report])

  if (loading) return <div className="spin" />
  if (!report) return <div className="error-box">Could not load report</div>

  return (
    <div>
      <PageHero
        className="no-print"
        eyebrow="Reports"
        title="Turn daily logs into a doctor-ready story."
        copy="Choose a weekly, monthly, or custom window and get a polished health summary with nutrition, glucose, vitals, hydration, weight, and medication context."
        metric={cfg.metric}
        metricLabel="summary window"
        actions={(
          <>
            <button className="btn btn-green" onClick={() => window.print()}>Print / Save PDF</button>
            <button className="btn btn-ghost" onClick={load}>Refresh</button>
          </>
        )}
      />

      <div className="premium-toolbar report-toolbar no-print">
        <div className="form-group report-mode-field">
          <label>Report type</label>
          <select className="toolbar-select" value={reportMode} onChange={e => setReportMode(e.target.value)}>
            <option value="weekly">Weekly report</option>
            <option value="monthly">Monthly report</option>
            <option value="custom">Custom date range</option>
          </select>
        </div>
        {reportMode === 'custom' && (
          <>
            <div className="form-group report-date-field">
              <label>From</label>
              <input type="date" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div className="form-group report-date-field">
              <label>To</label>
              <input type="date" value={customTo} min={customFrom} max={today()} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </>
        )}
        {reportMode === 'weekly' && (
          <div className="form-group report-date-field">
            <label>Which week?</label>
            <select className="toolbar-select" value={selectedWeekId} onChange={e => setSelectedWeekId(e.target.value)}>
              {weekOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </div>
        )}
        {reportMode === 'monthly' && (
          <div className="form-group report-date-field">
            <label>Which month?</label>
            <select className="toolbar-select" value={selectedMonthId} onChange={e => setSelectedMonthId(e.target.value)}>
              {monthOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="doctor-report">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>VitaNudge {cfg.label.toLowerCase()} report</h2>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{report.range.from} to {report.range.to}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
              {report.user?.name}<br />{report.user?.condition}
            </div>
          </div>
        </div>

        <div className="week-stat-grid">
          <div className="week-stat"><div className="sv" style={{ color: 'var(--amber)' }}>{summary.avgCal}</div><div className="sl">avg kcal</div></div>
          <div className="week-stat"><div className="sv" style={{ color: 'var(--blue)' }}>{summary.avgProtein}g</div><div className="sl">avg protein</div></div>
          <div className="week-stat"><div className="sv" style={{ color: 'var(--red)' }}>{summary.avgCarbs}g</div><div className="sl">avg carbs</div></div>
          <div className="week-stat"><div className="sv" style={{ color: 'var(--green)' }}>{summary.avgWater}</div><div className="sl">avg water ml</div></div>
          <div className="week-stat"><div className="sv" style={{ color: 'var(--red)' }}>{summary.avgGlucose || '–'}</div><div className="sl">avg glucose</div></div>
          <div className="week-stat"><div className="sv" style={{ color: 'var(--blue)' }}>{summary.avgBpSys ? `${summary.avgBpSys}/${summary.avgBpDia}` : '–'}</div><div className="sl">avg BP</div></div>
        </div>

        {charts && (
          <div className="charts-grid no-print">
            <div className="chart-card"><h3>Protein &amp; fibre (g)</h3>
              <div style={{ position: 'relative', height: 150 }}>
                <Bar data={{ labels: charts.labels, datasets: [{ label: 'Protein', data: charts.protein, backgroundColor: '#2563a8', borderRadius: 3 }, { label: 'Fibre', data: charts.fiber, backgroundColor: '#3a7d44', borderRadius: 3 }] }} options={CHART_OPTS} />
              </div>
            </div>
            <div className="chart-card"><h3>Calories &amp; carbs</h3>
              <div style={{ position: 'relative', height: 150 }}>
                <Bar data={{ labels: charts.labels, datasets: [{ label: 'Calories', data: charts.calories, backgroundColor: '#b45309', borderRadius: 3 }, { label: 'Carbs', data: charts.carbs, backgroundColor: '#b91c1c', borderRadius: 3 }] }} options={CHART_OPTS} />
              </div>
            </div>
            <div className="chart-card"><h3>Water (ml)</h3>
              <div style={{ position: 'relative', height: 150 }}>
                <Bar data={{ labels: charts.labels, datasets: [{ label: 'Water ml', data: charts.water, backgroundColor: '#2563a8', borderRadius: 3 }] }} options={CHART_OPTS} />
              </div>
            </div>
            <div className="chart-card"><h3>Glucose avg (mg/dL)</h3>
              <div style={{ position: 'relative', height: 150 }}>
                <Line data={{ labels: charts.labels, datasets: [{ label: 'Avg glucose', data: charts.glucose, borderColor: '#b91c1c', backgroundColor: 'rgba(185,28,28,.08)', tension: .3, pointRadius: 4, spanGaps: true, fill: true }] }}
                  options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, beginAtZero: false } } }} />
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title">Clinical markers</div>
          <div className="form-grid">
            <div className="info-box">Latest weight: <strong>{summary.latestWeight ? `${summary.latestWeight}kg` : 'not logged'}</strong></div>
            <div className="info-box">Latest HbA1c: <strong>{summary.latestA1c ? `${summary.latestA1c}%` : 'not logged'}</strong></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Medication adherence</div>
          {report.medication_logs.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--hint)' }}>No medications configured.</div>
          ) : report.medication_logs.map(m => (
            <div key={m.name} className="log-entry">
              <div style={{ flex: 1 }}><div className="log-name">{m.name}</div><div className="log-amt">{m.dose || 'No dose saved'}</div></div>
              <span className="tag tag-f">{m.taken_count} taken</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
