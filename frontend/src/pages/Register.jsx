import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthFrame from '../components/AuthFrame'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      // New users go to Goals for onboarding setup
      navigate('/goals?setup=1')
    } catch (e) {
      const errorMsg = e.error || e.message || 'Registration failed. Please try again.'
      setErr(errorMsg)
      console.error('Registration error:', e)
    } finally {
      setLoading(false)
    }
  }

  const set = k => e => setForm({ ...form, [k]: e.target.value })

  return (
    <AuthFrame
      eyebrow="Get started free"
      title="Create your VitaNudge account"
      subtitle="Track meals, health metrics, and get AI-powered insights. Start with our free tier."
      note="Free tier includes core features. Upgrade anytime for Pro features."
      footer={(
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      )}
    >
        {err && <div className="error-box">{err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid full" style={{ marginBottom: 9 }}>
            <div className="form-group">
              <label>Your name</label>
              <input value={form.name} onChange={set('name')} placeholder="Rahul Sharma" required />
            </div>
          </div>
          <div className="form-grid full" style={{ marginBottom: 9 }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" required />
            </div>
          </div>
          <div className="form-grid full" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Password (min 6 chars)</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Minimum 6 characters" required minLength={6} />
            </div>
          </div>
          <button className="btn btn-green btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
    </AuthFrame>
  )
}
