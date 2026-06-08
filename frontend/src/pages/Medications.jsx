import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../utils/api'
import { addDays, formatDate, shortDate, today } from '../utils/calc'
import PageHero from '../components/PageHero'
import { useAuth } from '../hooks/useAuth'
import UpgradeModal from '../components/UpgradeModal'

export default function Medications() {
  const { user } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Pro tier check
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'clinical'

  const [date, setDate] = useState(today())
  const [meds, setMeds] = useState([])
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ name: '', dose: '', time_of_day: '', notes: '' })
  const [msg, setMsg] = useState('')

  const [streak, setStreak] = useState(0)

  // Show upgrade prompt for free users
  if (!isPro) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>💊 Medications</h1>
          <p className="page-subtitle">Pro Feature</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">💊</div>
            <h3>Medication tracking is a Pro feature</h3>
            <p>Track medications, set reminders, monitor daily adherence, and build consistency streaks with VitaNudge Pro.</p>
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
            feature="meds"
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    )
  }

  const load = useCallback(async () => {
    const [m, l] = await Promise.all([
      api.get('/health/medications'),
      api.get(`/health/medications/logs?date=${date}`),
    ])
    setMeds(m.medications)
    setLogs(l.logs)

    // Calculate streak: consecutive days where all active meds were taken
    try {
      const activeMeds = m.medications.filter(med => med.active)
      if (activeMeds.length === 0) { setStreak(0); return }
      let s = 0
      for (let i = 0; i < 60; i++) {
        const d = addDays(today(), -i)
        const dayLogs = await api.get(`/health/medications/logs?date=${d}`)
        const takenIds = new Set(dayLogs.logs.map(l => l.medication_id))
        const allTaken = activeMeds.every(med => takenIds.has(med.id))
        if (allTaken) s++
        else break
      }
      setStreak(s)
    } catch (_) {}
  }, [date])

  useEffect(() => { load() }, [load])

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 1800)
  }

  async function addMedication() {
    if (!form.name.trim()) {
      flash('⚠️ Medication name is required')
      return
    }
    await api.post('/health/medications', form)
    setForm({ name: '', dose: '', time_of_day: '', notes: '' })
    flash('Medication added')
    load()
  }

  async function markTaken(id) {
    await api.post(`/health/medications/${id}/taken`, { log_date: date, status: 'taken' })
    load()
  }

  async function undo(logId) {
    await api.delete(`/health/medication-logs/${logId}`)
    load()
  }

  async function removeMed(id) {
    if (!confirm('Remove this medication?')) return
    await api.delete(`/health/medications/${id}`)
    load()
  }

  const logByMed = useMemo(() => Object.fromEntries(logs.map(l => [l.medication_id, l])), [logs])
  const active = meds.filter(m => m.active)

  return (
    <div>
      {msg && <div className="success-box">{msg}</div>}

      <PageHero
        eyebrow="Medications"
        title="Make adherence visible."
        copy="Track daily medication status beside nutrition, vitals, and doctor reports."
        metric={`${logs.length}/${active.length}`}
        metricLabel="taken today"
      />

      <div className="day-bar">
        <h2>{formatDate(date)}</h2>
        <div className="day-nav">
          <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
          <span>{shortDate(date)}</span>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
        </div>
      </div>

      <div className="week-stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="week-stat"><div className="sv" style={{ color: 'var(--green)' }}>{logs.length}/{active.length}</div><div className="sl">taken today</div></div>
        <div className="week-stat"><div className="sv" style={{ color: 'var(--blue)' }}>{active.length}</div><div className="sl">active meds</div></div>
        <div className="week-stat"><div className="sv" style={{ color: 'var(--amber)' }}>{active.filter(m => !logByMed[m.id]).length}</div><div className="sl">remaining</div></div>
        <div className="week-stat">
          <div className="sv" style={{ color: streak >= 7 ? 'var(--green)' : streak >= 3 ? 'var(--amber)' : 'var(--hint)' }}>
            {streak > 0 ? `${streak}🔥` : '0'}
          </div>
          <div className="sl">day streak</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Today's medications</div>
        {active.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>Add a medication below to start daily reminders.</div>
        ) : active.map(med => {
          const log = logByMed[med.id]
          return (
            <div key={med.id} className="log-entry">
              <div style={{ flex: 1 }}>
                <div className="log-name">{med.name}</div>
                <div className="log-amt">{[med.dose, med.time_of_day].filter(Boolean).join(' · ') || 'No dose/time set'}</div>
              </div>
              {log ? (
                <>
                  <span className="tag tag-f">Taken</span>
                  <button className="btn-del" onClick={() => undo(log.id)}>&#215;</button>
                </>
              ) : (
                <button className="btn btn-green" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => markTaken(med.id)}>Mark taken</button>
              )}
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-title">Add medication reminder</div>
        <div className="form-grid">
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Metformin" /></div>
          <div className="form-group"><label>Dose</label><input value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} placeholder="500mg" /></div>
        </div>
        <div className="form-grid">
          <div className="form-group"><label>Time</label><input type="time" value={form.time_of_day} onChange={e => setForm(f => ({ ...f, time_of_day: e.target.value }))} /></div>
          <div className="form-group"><label>Notes</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="after dinner" /></div>
        </div>
        <button className="btn btn-green btn-full" onClick={addMedication}>Add reminder</button>
      </div>

      <div className="card">
        <div className="card-title">Medication list</div>
        {meds.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No medications saved</div>
        ) : meds.map(med => (
          <div key={med.id} className="log-entry">
            <div style={{ flex: 1 }}>
              <div className="log-name">{med.name}</div>
              <div className="log-amt">{[med.dose, med.time_of_day, med.notes].filter(Boolean).join(' · ')}</div>
            </div>
            <button className="btn-del" onClick={() => removeMed(med.id)}>&#215;</button>
          </div>
        ))}
      </div>
    </div>
  )
}
