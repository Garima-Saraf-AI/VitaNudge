import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../utils/api'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No verification token provided')
      setVerifying(false)
      return
    }

    // Verify the token
    api.post('/auth/verify-email', { token }, 200, false)
      .then(() => {
        setSuccess(true)
        setVerifying(false)
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login?verified=1'), 3000)
      })
      .catch((e) => {
        setError(e.error || 'Verification failed. Token may be expired.')
        setVerifying(false)
      })
  }, [token, navigate])

  async function handleResend() {
    setResending(true)
    setError('')
    try {
      await api.post('/auth/resend-verification', {}, 200, false)
      setResent(true)
    } catch (e) {
      setError(e.error || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  if (verifying) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <p style={{ color: 'var(--muted)' }}>Verifying your email...</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ marginBottom: 16 }}>Email Verified!</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
              Your email has been successfully verified. Redirecting to login...
            </p>
            <Link to="/login" className="btn btn-green" style={{ width: '100%' }}>
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 16 }}>Verification Failed</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            {error || 'This verification link is invalid or has expired.'}
          </p>

          {resent ? (
            <div style={{
              padding: 16,
              background: 'var(--green-l)',
              borderRadius: 'var(--rm)',
              marginBottom: 16
            }}>
              <p style={{ margin: 0, color: 'var(--green)' }}>
                ✓ Verification email sent! Check your inbox.
              </p>
            </div>
          ) : (
            <button
              className="btn btn-green"
              onClick={handleResend}
              disabled={resending}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}

          <Link to="/login" style={{ display: 'block', color: 'var(--green)' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
