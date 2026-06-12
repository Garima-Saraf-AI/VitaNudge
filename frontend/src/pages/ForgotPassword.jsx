import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import AuthFrame from '../components/AuthFrame'
import StatusToast from '../components/StatusToast'

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
      <AuthFrame
        eyebrow="Password Reset"
        title="Check Your Email"
        subtitle={`We've sent a password reset link to ${email}`}
        note="The reset link is valid for 1 hour. Check your spam folder if you don't see it."
        footer={(
          <p className="auth-switch">
            <Link to="/login">← Back to Login</Link>
          </p>
        )}
      >
        <div style={{
          padding: 16,
          background: 'var(--green-l)',
          border: '1px solid var(--green-b)',
          borderRadius: 14,
          marginBottom: 24
        }}>
          <p style={{ fontSize: 13, margin: 0, color: 'var(--green)', fontWeight: 600 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Next steps:</strong>
            1. Check your email inbox<br />
            2. Click the reset link (valid for 1 hour)<br />
            3. Create a new password
          </p>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, textAlign: 'center' }}>
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
              font: 'inherit',
              fontWeight: 700
            }}
          >
            try again
          </button>
        </p>

        <Link to="/login" className="btn btn-ghost btn-full">
          Back to Login
        </Link>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame
      eyebrow="Forgot Password?"
      title="Reset Your Password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
      note="You'll receive an email with instructions to create a new password."
      footer={(
        <p className="auth-switch">
          Remember your password? <Link to="/login">Log in</Link>
        </p>
      )}
    >
      <StatusToast message={error} tone="error" />

      <form onSubmit={handleSubmit}>
        <div className="form-grid full" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-green btn-full"
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthFrame>
  )
}
