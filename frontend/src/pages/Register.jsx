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

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      setErr('Please enter a valid email address (e.g., you@email.com)')
      setLoading(false)
      return
    }

    // Keep the primary requirement in one clear message.
    if (
      form.password.length < 6
      || !/[a-zA-Z]/.test(form.password)
      || !/[0-9]/.test(form.password)
    ) {
      setErr('Password must be at least 6 characters and include both a letter and a number.')
      setLoading(false)
      return
    }
    if (form.password.length > 128) {
      setErr('Password must be less than 128 characters')
      setLoading(false)
      return
    }
    if (form.password.includes(' ')) {
      setErr('Password cannot contain spaces')
      setLoading(false)
      return
    }
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
      variant="register"
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
              <input value={form.name} onChange={set('name')} placeholder="Rahul Sharma" autoComplete="name" required />
            </div>
          </div>
          <div className="form-grid full" style={{ marginBottom: 9 }}>
            <div className="form-group">
              <label>Email</label>
              <input type="text" value={form.email} onChange={set('email')} placeholder="you@email.com" autoComplete="email" required />
            </div>
          </div>
          <div className="form-grid full" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 chars, include letter & number" autoComplete="new-password" required />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                At least 6 characters with a letter and a number
              </div>
            </div>
          </div>
          <button className="btn btn-green btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
    </AuthFrame>
  )
}
