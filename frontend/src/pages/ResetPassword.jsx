import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../utils/api'

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
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <p style={{ color: 'var(--muted)' }}>Validating reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ marginBottom: 16 }}>Invalid Reset Link</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
              {error || 'This password reset link has expired or is invalid.'}
            </p>
            <Link to="/forgot-password" className="btn btn-green" style={{ width: '100%' }}>
              Request New Reset Link
            </Link>
            <Link to="/login" style={{ display: 'block', marginTop: 16, color: 'var(--green)' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create New Password</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Enter your new password below.
        </p>

        {error && (
          <div className="error-box" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-green"
            style={{ width: '100%' }}
            disabled={resetting}
          >
            {resetting ? 'Resetting...' : 'Reset Password'}
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
