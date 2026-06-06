import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthFrame from '../components/AuthFrame'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (e) {
      setErr(e.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Plus preview access"
      title="Continue your premium workspace"
      subtitle="Sign in to review meals, scans, reports, vitals, recipes, and coaching in one place."
      note="No payment is required during preview."
      footer={(
        <p className="auth-switch">
          New to VitaNudge? <Link to="/register">Start free preview</Link>
        </p>
      )}
    >
        {err && <div className="error-box">{err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid full" style={{ marginBottom: 9 }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" required />
            </div>
          </div>
          <div className="form-grid full" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Your password" required />
            </div>
          </div>
          <button className="btn btn-green btn-full" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Continue to dashboard'}
          </button>
        </form>
    </AuthFrame>
  )
}
