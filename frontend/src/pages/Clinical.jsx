import { useCallback, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend } from 'chart.js'
import api from '../utils/api'
import { addDays, formatDate, shortDate, today, last7Days, glucoseZone } from '../utils/calc'
import PageHero from '../components/PageHero'
import { useAuth } from '../hooks/useAuth'
import UpgradeModal from '../components/UpgradeModal'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend)

function daysBack(n, to = today()) {
  const days = []
  for (let i = n - 1; i >= 0; i--) days.push(addDays(to, -i))
  return days
}

const WELLBEING_OPTIONS = [
  { value: 'fine',   label: 'Feeling fine',        color: 'var(--green)', bg: 'var(--green-l)', border: 'var(--green-b)', icon: '✓' },
  { value: 'tired',  label: 'Tired / low energy',  color: 'var(--blue)',  bg: 'var(--blue-l)',  border: 'var(--blue-b)',  icon: '~' },
  { value: 'unwell', label: 'Unwell',               color: 'var(--amber)', bg: 'var(--amber-l)', border: 'var(--amber-b)', icon: '!' },
  { value: 'hypo',   label: 'Hypo symptoms',        color: 'var(--red)',   bg: 'var(--red-l)',   border: 'var(--red-b)',   icon: '↓' },
  { value: 'sick',   label: 'Sick / fever',         color: 'var(--red)',   bg: 'var(--red-l)',   border: 'var(--red-b)',   icon: '✕' },
]

const CHART_OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }, y: { beginAtZero: false, ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.08)' } } } }

export default function Clinical() {
  const { user } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Clinical tier check (requires Clinical subscription, not just Pro)
  const isClinical = user?.subscription_tier === 'clinical'

  const [date, setDate] = useState(today())
  const [msg,  setMsg]  = useState('')

  // Show upgrade prompt for non-Clinical users
  if (!isClinical) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>🏥 Clinical Dashboard</h1>
          <p className="page-subtitle">Clinical Tier Feature</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏥</div>
            <h3>Clinical dashboard is a Clinical tier feature</h3>
            <p>Advanced health monitoring with glucose tracking, wellbeing logs, medication adherence, and clinician-ready reports.</p>
            <button
              className="btn btn-green"
              type="button"
              onClick={() => setShowUpgrade(true)}
              style={{ marginTop: '16px' }}
            >
              Upgrade to Clinical
            </button>
          </div>
        </div>
        {showUpgrade && (
          <UpgradeModal
            feature="clinical"
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    )
  }

  // Glucose
  const [glucoseLogs, setGlucoseLogs] = useState([])
  const [gVal, setGVal]               = useState('')
  const [gTiming, setGTiming]         = useState('fasting')
  const [glucoseWeekly, setGlucoseWeekly] = useState([])

  // BP / HbA1c
  const [bp, setBp]           = useState({ systolic: '', diastolic: '', pulse: '', notes: '' })
  const [bpLogs, setBpLogs]   = useState([])
  const [bpRange, setBpRange] = useState([])
  const [a1c, setA1c]         = useState({ value_pct: '', notes: '' })
  const [a1cLogs, setA1cLogs] = useState([])

  // Wellbeing
  const [wellbeing, setWellbeing]     = useState(null)
  const [wellbeingNote, setWellbeingNote] = useState('')

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 1800) }

  const load = useCallback(async () => {
    const days30 = daysBack(30, date)
    const week   = last7Days()
    const [g, gW, dayBp, rangeBp, rangeA1c, wb] = await Promise.all([
      api.get(`/health/glucose?date=${date}`),
      api.get(`/health/glucose/range?from=${week[0]}&to=${week[6]}`),
      api.get(`/health/bp?date=${date}`),
      api.get(`/health/bp/range?from=${days30[0]}&to=${days30[days30.length-1]}`),
      api.get(`/health/a1c/range?from=${addDays(date,-365)}&to=${date}`),
      api.get(`/health/wellbeing?date=${date}`),
    ])
    setGlucoseLogs(g.logs)
    setGlucoseWeekly(gW.data)
    setBpLogs(dayBp.logs)
    setBpRange(rangeBp.data)
    setA1cLogs(rangeA1c.data)
    setWellbeing(wb.log?.status || null)
    setWellbeingNote(wb.log?.notes || '')
  }, [date])

  useEffect(() => { load() }, [load])

  // Glucose actions
  async function addGlucose() {
    const v = parseInt(gVal)
    if (!v || v < 40 || v > 600) return alert('Enter 40–600 mg/dL')
    await api.post('/health/glucose', { value_mgdl: v, timing: gTiming, log_date: date })
    setGVal(''); load()
  }
  async function delGlucose(id) { await api.delete(`/health/glucose/${id}`); load() }

  // BP actions
  async function saveBp() {
    if (!bp.systolic || !bp.diastolic) return
    await api.post('/health/bp', { ...bp, log_date: date })
    setBp({ systolic: '', diastolic: '', pulse: '', notes: '' })
    flash('Blood pressure saved'); load()
  }
  async function delBp(id) { await api.delete(`/health/bp/${id}`); load() }

  // HbA1c actions
  async function saveA1c() {
    if (!a1c.value_pct) return
    await api.post('/health/a1c', { ...a1c, log_date: date })
    setA1c({ value_pct: '', notes: '' })
    flash('HbA1c saved'); load()
  }
  async function delA1c(id) { await api.delete(`/health/a1c/${id}`); load() }

  // Wellbeing actions
  async function logWellbeing(status) {
    await api.post('/health/wellbeing', { status, notes: wellbeingNote, log_date: date })
    setWellbeing(status)
    flash('Wellbeing logged')
  }

  // Derived
  const latestA1c = a1cLogs[a1cLogs.length - 1]
  const days30    = daysBack(30, date)
  const bpMap     = Object.fromEntries(bpRange.map(d => [d.log_date, d]))
  const week      = last7Days()
  const wkLabels  = week.map(d => ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d+'T00:00:00').getDay()])
  const fasting   = week.map(d => { const r = glucoseWeekly.find(x => x.log_date === d); return r?.avg_fasting ? Math.round(r.avg_fasting) : null })
  const postMeal  = week.map(d => { const r = glucoseWeekly.find(x => x.log_date === d); return r?.avg_post_meal ? Math.round(r.avg_post_meal) : null })
  const currentWb = WELLBEING_OPTIONS.find(o => o.value === wellbeing)

  return (
    <div>
      {msg && <div className="success-box">{msg}</div>}

      <PageHero
        eyebrow="Clinical readings"
        title="Glucose, BP, and wellbeing together."
        copy="All medically significant readings in one place — exactly what your doctor reviews."
        metric={glucoseLogs.length || latestA1c ? (glucoseLogs.length > 0 ? glucoseLogs.length : `${latestA1c.value_pct}%`) : 'None today'}
        metricLabel={glucoseLogs.length > 0 ? 'glucose readings' : 'latest HbA1c'}
      />

      {/* Date navigation */}
      <div className="day-bar">
        <h2>{formatDate(date)}</h2>
        <div className="day-nav">
          <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
          <span>{shortDate(date)}</span>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="week-stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="week-stat">
          <div className="sv" style={{ color: glucoseLogs[0] ? (glucoseLogs[0].value_mgdl <= 99 ? 'var(--green)' : glucoseLogs[0].value_mgdl <= 125 ? 'var(--amber)' : 'var(--red)') : 'var(--hint)' }}>
            {glucoseLogs[0] ? glucoseLogs[0].value_mgdl : '–'}
          </div>
          <div className="sl">last glucose</div>
        </div>
        <div className="week-stat">
          <div className="sv" style={{ color: 'var(--red)' }}>{bpLogs[0] ? `${bpLogs[0].systolic}/${bpLogs[0].diastolic}` : '–'}</div>
          <div className="sl">today BP</div>
        </div>
        <div className="week-stat">
          <div className="sv" style={{ color: 'var(--amber)' }}>{latestA1c ? `${latestA1c.value_pct}%` : '–'}</div>
          <div className="sl">HbA1c</div>
        </div>
        <div className="week-stat">
          <div className="sv" style={{ color: currentWb?.color || 'var(--hint)', fontSize: 18 }}>{currentWb ? currentWb.icon : '–'}</div>
          <div className="sl">wellbeing</div>
        </div>
      </div>

      {/* ── WELLBEING ── */}
      <div className="card">
        <div className="card-title">How are you feeling today?</div>
        <div className="wellbeing-grid">
          {WELLBEING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`wellbeing-btn${wellbeing === opt.value ? ' active' : ''}`}
              style={wellbeing === opt.value ? { background: opt.bg, borderColor: opt.border, color: opt.color } : {}}
              onClick={() => logWellbeing(opt.value)}
            >
              <span className="wellbeing-icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="form-group" style={{ marginTop: 10 }}>
          <label>Note (optional)</label>
          <input value={wellbeingNote} onChange={e => setWellbeingNote(e.target.value)} placeholder="e.g. skipped breakfast, stressed" />
        </div>
      </div>

      {/* ── GLUCOSE ── */}
      <div className="card">
        <div className="card-title">Blood glucose</div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['Normal fasting: 70–99','zone-normal'],['Pre-diabetic: 100–125','zone-pre'],['High: 126+','zone-high']].map(([l,c]) => (
            <span key={l} className={`tag ${c}`}>{l}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}>
          <input type="number" placeholder="mg/dL" min="40" max="600" value={gVal} onChange={e => setGVal(e.target.value)}
            style={{ width: 90, padding: '0 11px', height: 38, border: '1.5px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
          <select value={gTiming} onChange={e => setGTiming(e.target.value)}
            style={{ flex: 1, minWidth: 120, padding: '0 10px', height: 38, border: '1.5px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 12, background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Sora,sans-serif' }}>
            <option value="fasting">Fasting</option>
            <option value="pre-breakfast">Pre-breakfast</option>
            <option value="post-breakfast">Post-breakfast (2hr)</option>
            <option value="pre-lunch">Pre-lunch</option>
            <option value="post-lunch">Post-lunch (2hr)</option>
            <option value="pre-dinner">Pre-dinner</option>
            <option value="post-dinner">Post-dinner (2hr)</option>
            <option value="bedtime">Bedtime</option>
          </select>
          <button className="btn btn-green" onClick={addGlucose}>+ Log</button>
        </div>

        {glucoseLogs.length === 0
          ? <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No glucose readings today.</div>
          : [...glucoseLogs].reverse().map(e => {
            const z = glucoseZone(e.value_mgdl)
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, minWidth: 52, fontFamily: "'Sora',sans-serif", color: e.value_mgdl <= 99 ? 'var(--green)' : e.value_mgdl <= 125 ? 'var(--amber)' : 'var(--red)' }}>{e.value_mgdl}</span>
                <span style={{ fontSize: 10, color: 'var(--hint)' }}>mg/dL</span>
                <span style={{ flex: 1, color: 'var(--muted)' }}>{e.timing.replace(/-/g,' ')} · {new Date(e.logged_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                <span className={`tag ${z.cls}`}>{z.label}</span>
                <button style={{ border:'none',background:'none',color:'var(--hint)',cursor:'pointer',fontSize:13 }} onClick={() => delGlucose(e.id)}>&#215;</button>
              </div>
            )
          })
        }

        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, fontSize: 11, color: 'var(--muted)' }}>
            <span style={{ display:'flex', alignItems:'center', gap: 4 }}><span style={{ width:10, height:3, background:'var(--blue)', display:'inline-block', borderRadius:2 }}/> Fasting avg</span>
            <span style={{ display:'flex', alignItems:'center', gap: 4 }}><span style={{ width:10, height:3, background:'var(--red)', display:'inline-block', borderRadius:2 }}/> Post-meal avg</span>
          </div>
          <div style={{ position: 'relative', height: 150 }}>
            <Line data={{ labels: wkLabels, datasets: [
              { label:'Fasting',  data: fasting,  borderColor:'var(--blue)', backgroundColor:'rgba(29,90,158,.08)', tension:.3, pointRadius:4, spanGaps:true, fill:true },
              { label:'Post-meal',data: postMeal, borderColor:'var(--red)',  backgroundColor:'rgba(170,26,26,.06)',  tension:.3, pointRadius:4, spanGaps:true, borderDash:[4,3], fill:true },
            ]}} options={CHART_OPTS} />
          </div>
        </div>
      </div>

      {/* ── BLOOD PRESSURE ── */}
      <div className="card">
        <div className="card-title">Blood pressure</div>
        <div className="form-grid">
          <div className="form-group"><label>Systolic</label><input type="number" value={bp.systolic} onChange={e => setBp(b=>({...b,systolic:e.target.value}))} placeholder="120" /></div>
          <div className="form-group"><label>Diastolic</label><input type="number" value={bp.diastolic} onChange={e => setBp(b=>({...b,diastolic:e.target.value}))} placeholder="80" /></div>
          <div className="form-group"><label>Pulse</label><input type="number" value={bp.pulse} onChange={e => setBp(b=>({...b,pulse:e.target.value}))} placeholder="72" /></div>
          <div className="form-group"><label>Notes</label><input value={bp.notes} onChange={e => setBp(b=>({...b,notes:e.target.value}))} placeholder="optional" /></div>
        </div>
        <button className="btn btn-green btn-full" onClick={saveBp}>Save blood pressure</button>
        {bpLogs.length > 0 && bpLogs.map(log => (
          <div key={log.id} className="log-entry" style={{ marginTop: 8 }}>
            <div style={{ flex:1 }}><div className="log-name">{log.systolic}/{log.diastolic}</div><div className="log-amt">{log.notes||'BP reading'}</div></div>
            {log.pulse && <span className="tag tag-p">P {log.pulse}</span>}
            <button className="btn-del" onClick={() => delBp(log.id)}>&#215;</button>
          </div>
        ))}

        <div style={{ marginTop: 14, position: 'relative', height: 150 }}>
          <Line data={{ labels: days30.map(d => d.slice(5)), datasets: [
            { label:'Systolic', data: days30.map(d => bpMap[d]?.avg_systolic ? Math.round(bpMap[d].avg_systolic) : null), borderColor:'var(--red)', tension:.3, spanGaps:true, pointRadius:3 },
            { label:'Diastolic',data: days30.map(d => bpMap[d]?.avg_diastolic ? Math.round(bpMap[d].avg_diastolic) : null), borderColor:'var(--blue)',tension:.3, spanGaps:true, pointRadius:3 },
          ]}} options={{ ...CHART_OPTS, plugins: { legend: { display: true, labels: { boxWidth: 10, font: { size: 10 } } } } }} />
        </div>
      </div>

      {/* ── HbA1c ── */}
      <div className="card">
        <div className="card-title">HbA1c blood test</div>
        <div className="info-box">HbA1c is typically measured every 3 months at a clinic. Enter your lab result when you receive it.</div>
        <div className="form-grid">
          <div className="form-group"><label>HbA1c (%)</label><input type="number" min="3" max="16" step="0.1" value={a1c.value_pct} onChange={e => setA1c(a=>({...a,value_pct:e.target.value}))} placeholder="6.8" /></div>
          <div className="form-group"><label>Notes</label><input value={a1c.notes} onChange={e => setA1c(a=>({...a,notes:e.target.value}))} placeholder="lab / fasting notes" /></div>
        </div>
        <button className="btn btn-green btn-full" onClick={saveA1c}>Save HbA1c</button>
        <div style={{ marginTop: 12 }}>
          {a1cLogs.length === 0
            ? <div style={{ fontSize:12, color:'var(--hint)', fontStyle:'italic' }}>No HbA1c results yet — add your latest lab result.</div>
            : [...a1cLogs].reverse().map(log => (
              <div key={log.id} className="log-entry">
                <div style={{ flex:1 }}><div className="log-name">{shortDate(log.log_date)}</div><div className="log-amt">{log.notes||'HbA1c result'}</div></div>
                <span className="tag tag-k">{log.value_pct}%</span>
                <button className="btn-del" onClick={() => delA1c(log.id)}>&#215;</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
