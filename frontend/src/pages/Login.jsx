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
      const errorMsg = e.error || e.message || 'Login failed. Please check your credentials.'
      setErr(errorMsg)
      console.error('Login error:', e)
      // Scroll to top to ensure error is visible
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Continue tracking your health"
      subtitle="Sign in to review meals, scans, reports, vitals, recipes, and coaching in one place."
      note="Free tier available. Upgrade to Pro for advanced features."
      footer={(
        <p className="auth-switch">
          New to VitaNudge? <Link to="/register">Create free account</Link>
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
          <div className="form-grid full" style={{ marginBottom: 8 }}>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Your password" required />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ fontSize: 14, color: 'var(--green)' }}>
              Forgot password?
            </Link>
          </div>

          <button className="btn btn-green btn-full" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Continue to dashboard'}
          </button>
        </form>
    </AuthFrame>
  )
}
