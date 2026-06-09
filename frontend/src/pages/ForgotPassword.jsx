import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)

    try {
      await api.post('/auth/forgot-password', { email }, 200, false)
      setSent(true)
    } catch (err) {
      setError(err.error || 'Failed to send reset email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Check Your Email</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>

          <div style={{
            padding: 16,
            background: 'var(--surface2)',
            borderRadius: 'var(--rm)',
            marginBottom: 24
          }}>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--muted)' }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Next steps:</strong>
              1. Check your email inbox<br />
              2. Click the reset link (valid for 1 hour)<br />
              3. Create a new password
            </p>
          </div>

          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Didn't receive it? Check your spam folder or{' '}
            <button
              onClick={() => setSent(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--green)',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit'
              }}
            >
              try again
            </button>
          </p>

          <Link to="/login" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="error-box" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-green"
            style={{ width: '100%' }}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--green)' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
