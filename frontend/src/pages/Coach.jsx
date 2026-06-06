import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../utils/api'
import { addDays, today } from '../utils/calc'
import PageHero from '../components/PageHero'

const SUGGESTIONS = [
  'Why is my glucose high after lunch?',
  'How can I increase protein without increasing carbs?',
  'Which logged meals look low fiber?',
  'What should I discuss with my doctor from this week?',
]

export default function Coach() {
  const location = useLocation()
  const presetQuestion = location.state?.question || ''
  const [question, setQuestion] = useState(presetQuestion || SUGGESTIONS[0])
  const [answer, setAnswer] = useState('')
  const [provider, setProvider] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!presetQuestion) return
    setQuestion(presetQuestion)
    setAnswer('')
    setProvider('')
    setErr('')
  }, [presetQuestion])

  async function ask(q = question) {
    if (!q.trim()) {
      setErr('Please enter a question for the coach first.')
      return
    }
    setLoading(true)
    setErr('')
    setAnswer('')
    try {
      const data = await api.post('/coach', {
        question: q,
        from: addDays(today(), -13),
        to: today(),
      })
      setAnswer(data.answer)
      setProvider(data.provider)
    } catch (e) {
      setErr(e.error || 'Coach failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHero
        eyebrow="AI coach"
        title="Ask smarter questions about your logs."
        copy="Turn meals, glucose, hydration, and weekly habits into plain-language guidance."
        metric="Plus"
        metricLabel="context aware"
      />

      {err && <div className="error-box">{err}</div>}
      {presetQuestion && (
        <div className="success-box">
          Selected from Today quick recommendation.
        </div>
      )}

      <div className="card">
        <div className="card-title">AI nutrition coach</div>
        <div className="form-grid full">
          <div className="form-group">
            <label>Ask about your logs</label>
            <textarea className="coach-question-input" value={question} onChange={e => setQuestion(e.target.value)} />
          </div>
        </div>
        <div className="coach-form-actions">
          <button className="btn btn-green" disabled={loading} onClick={() => ask()}>
            {loading ? 'Thinking...' : 'Ask coach'}
          </button>
        </div>
      </div>

      <div className="coach-suggestions">
        {SUGGESTIONS.map(s => (
          <button key={s} className="btn btn-ghost btn-compact" onClick={() => { setQuestion(s); ask(s) }}>
            {s}
          </button>
        ))}
      </div>

      {loading && <div className="spin" />}

      {answer && (
        <div className="card">
          <div className="card-title">Coach response <span className="coach-provider">({provider})</span></div>
          <div className="coach-answer">{answer}</div>
          <div className="warn-box" style={{ marginTop: 12, marginBottom: 0 }}>
            Use this as pattern-spotting help, not medical advice. Confirm medication or treatment changes with your clinician.
          </div>
        </div>
      )}
    </div>
  )
}
