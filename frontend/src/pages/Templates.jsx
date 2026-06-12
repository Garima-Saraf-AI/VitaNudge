import { useCallback, useEffect, useState } from 'react'
import api from '../utils/api'
import { addDays, formatDate, shortDate, today } from '../utils/calc'
import PageHero from '../components/PageHero'
import { useAuth } from '../hooks/useAuth'
import UpgradeModal from '../components/UpgradeModal'
import StatusToast from '../components/StatusToast'

const MEALS = ['all', 'breakfast', 'lunch', 'dinner', 'snack']

function r1(n) { return Math.round((n || 0) * 10) / 10 }

export default function Templates() {
  const { user } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Pro tier check
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'clinical'

  const [date, setDate] = useState(today())
  const [templates, setTemplates] = useState([])
  const [logs, setLogs] = useState({ breakfast: [], lunch: [], dinner: [], snack: [] })
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [msg, setMsg] = useState('')

  // Show upgrade prompt for free users
  if (!isPro) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>📋 Meal Templates</h1>
          <p className="page-subtitle">Pro Feature</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Meal templates are a Pro feature</h3>
            <p>Save your favorite meals as templates and log them instantly. Build a library of go-to meals with complete nutrition data.</p>
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
            feature="templates"
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </div>
    )
  }

  const load = useCallback(async () => {
    const [t, m] = await Promise.all([
      api.get('/templates'),
      api.get(`/meals?date=${date}`),
    ])
    setTemplates(t.templates)
    setLogs(m.logs)
  }, [date])

  useEffect(() => { load() }, [load])

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2000)
  }

  async function saveFromDate() {
    if (!name.trim()) {
      flash('⚠️ Template name is required')
      return
    }
    await api.post('/templates/from-date', {
      name,
      date,
      meal_type: mealType === 'all' ? null : mealType,
    })
    setName('')
    flash('Template saved')
    load()
  }

  async function logTemplate(id, type) {
    await api.post(`/templates/${id}/log`, { date, meal_type: type })
    flash('Template logged')
    load()
  }

  async function remove(id) {
    if (!confirm('Delete this template?')) return
    await api.delete(`/templates/${id}`)
    load()
  }

  const selectedEntries = mealType === 'all'
    ? Object.values(logs).flat()
    : logs[mealType] || []

  return (
    <div>
      <StatusToast message={msg} />

      <PageHero
        eyebrow="Meal templates"
        title="Turn repeat meals into one-tap logs."
        copy="Save common meal combos and reuse them on any day without rebuilding the same plate."
        metric={templates.length}
        metricLabel="saved templates"
      />

      <div className="day-bar">
        <h2>{formatDate(date)}</h2>
        <div className="day-nav">
          <button onClick={() => setDate(d => addDays(d, -1))}>&#8592;</button>
          <span>{shortDate(date)}</span>
          <button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today()}>&#8594;</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Save meal combo as template</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Template name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Dal roti lunch" />
          </div>
          <div className="form-group">
            <label>Use logged meal</label>
            <select value={mealType} onChange={e => setMealType(e.target.value)}>
              {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="info-box">
          {selectedEntries.length} item(s) from {mealType === 'all' ? 'the whole day' : mealType} will be saved.
        </div>
        <button className="btn btn-green btn-full" disabled={selectedEntries.length === 0 || !name.trim()} onClick={saveFromDate}>Save template</button>
      </div>

      <div className="card">
        <div className="card-title">Meal templates</div>
        {templates.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--hint)', fontStyle: 'italic' }}>No templates saved yet</div>
        ) : templates.map(t => (
          <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: 11, marginBottom: 10, background: 'var(--surface2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t.meal_type} · {t.items.length} item(s) · {Math.round(t.totals.cal)} kcal · P {r1(t.totals.protein_g)}g
                </div>
              </div>
              <button className="btn-del" onClick={() => remove(t.id)}>&#215;</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--hint)', marginBottom: 8 }}>
              {t.items.map(i => `${i.food_name} (${i.amt_label || i.qty + i.unit})`).join(' · ')}
            </div>
            <button className="btn btn-green btn-full" onClick={() => logTemplate(t.id, t.meal_type)}>Log on selected day</button>
          </div>
        ))}
      </div>
    </div>
  )
}
