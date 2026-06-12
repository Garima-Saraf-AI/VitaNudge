import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../utils/api'
import AuthFrame from '../components/AuthFrame'
import StatusToast from '../components/StatusToast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.')
      setValidatingToken(false)
      return
    }

    // Validate token
    api.post('/auth/validate-reset-token', { token }, 200, false)
      .then(() => {
        setTokenValid(true)
        setValidatingToken(false)
      })
      .catch(() => {
        setError('This reset link has expired or is invalid. Please request a new one.')
        setValidatingToken(false)
      })
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setResetting(true)
    try {
      await api.post('/auth/reset-password', { token, password }, 200, false)
      navigate('/login?reset=success')
    } catch (err) {
      setError(err.error || 'Failed to reset password. Please try again.')
      setResetting(false)
    }
  }

  if (validatingToken) {
    return (
      <AuthFrame
        eyebrow="Password Reset"
        title="Validating Reset Link"
        subtitle="Please wait while we verify your reset link..."
        note="This should only take a moment."
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Validating reset link...</p>
        </div>
      </AuthFrame>
    )
  }

  if (!tokenValid) {
    return (
      <AuthFrame
        eyebrow="Password Reset"
        title="Invalid Reset Link"
        subtitle={error || 'This password reset link has expired or is invalid.'}
        note="Reset links are valid for 1 hour after being sent."
        footer={(
          <p className="auth-switch">
            <Link to="/login">← Back to Login</Link>
          </p>
        )}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        </div>
        <Link to="/forgot-password" className="btn btn-green btn-full">
          Request New Reset Link
        </Link>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame
      eyebrow="Password Reset"
      title="Create New Password"
      subtitle="Enter your new password below. Make sure it's at least 6 characters long."
      note="Choose a strong password to keep your account secure."
      footer={(
        <p className="auth-switch">
          Remember your password? <Link to="/login">Log in</Link>
        </p>
      )}
    >
      <StatusToast message={error} tone="error" />

      <form onSubmit={handleSubmit}>
        <div className="form-grid full" style={{ marginBottom: 9 }}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="form-grid full" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-green btn-full"
          disabled={resetting}
        >
          {resetting ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
    </AuthFrame>
  )
}
