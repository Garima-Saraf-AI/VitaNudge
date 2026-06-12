import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import StatusToast from '../components/StatusToast'

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const CONFIRM_TEXT = 'DELETE MY ACCOUNT'

  async function handleExportData() {
    setExporting(true)
    setError('')
    try {
      // Export all user data
      const data = await api.get('/auth/export-data')

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vitanudge-data-${user.email}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      setStep(2)
    } catch (e) {
      setError(e.error || 'Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== CONFIRM_TEXT) {
      setError(`Please type "${CONFIRM_TEXT}" exactly to confirm`)
      return
    }

    setDeleting(true)
    setError('')
    try {
      await api.delete('/auth/account', { reason, feedback })

      // Logout and redirect
      logout()
      navigate('/login?deleted=1')
    } catch (e) {
      setError(e.error || 'Failed to delete account. Please contact support.')
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <StatusToast message={error} tone="error" />

      <div className="page-header">
        <h1>Delete Account</h1>
        <p className="page-subtitle">Permanently remove your VitaNudge account</p>
      </div>

      {step === 1 && (
        <div className="card">
          <div style={{
            padding: 16,
            background: 'var(--red-l)',
            border: '1px solid var(--red-b)',
            borderRadius: 'var(--rm)',
            marginBottom: 24
          }}>
            <strong style={{ display: 'block', marginBottom: 8, color: 'var(--red)' }}>
              ⚠️ Warning: This action is permanent
            </strong>
            <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>
              Deleting your account will permanently remove:
            </p>
            <ul style={{ fontSize: 13, margin: '8px 0 0 20px', color: 'var(--text)' }}>
              <li>All your health data (meals, weight, glucose, etc.)</li>
              <li>Your goals and progress tracking</li>
              <li>Saved recipes and meal templates</li>
              <li>Food library and custom foods</li>
              <li>All reports and coach history</li>
            </ul>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Before you go...
          </h3>

          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            We recommend exporting your data first. You'll receive a JSON file with all your information.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/profile')}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              className="btn btn-blue"
              onClick={handleExportData}
              disabled={exporting}
              style={{ flex: 1 }}
            >
              {exporting ? 'Exporting...' : 'Export Data & Continue'}
            </button>
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => setStep(2)}
            style={{ width: '100%', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}
          >
            Skip export and continue to deletion
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Help us improve
          </h3>

          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            We'd love to know why you're leaving (optional):
          </p>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label htmlFor="delete-reason">Reason for leaving</label>
            <select
              id="delete-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select a reason...</option>
              <option value="not_useful">App not useful for my needs</option>
              <option value="too_complex">Too complex to use</option>
              <option value="privacy">Privacy concerns</option>
              <option value="cost">Subscription cost</option>
              <option value="switching">Switching to another app</option>
              <option value="temporary">Just need a break</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label htmlFor="delete-feedback">Additional feedback (optional)</label>
            <textarea
              id="delete-feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="What could we do better?"
              rows="3"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--red)' }}>
            Final Confirmation
          </h3>

          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            Type <strong>{CONFIRM_TEXT}</strong> to permanently delete your account:
          </p>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TEXT}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: 14
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-ghost"
              onClick={() => setStep(1)}
              style={{ flex: 1 }}
              disabled={deleting}
            >
              Go Back
            </button>
            <button
              className="btn"
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== CONFIRM_TEXT}
              style={{
                flex: 1,
                background: 'var(--red)',
                color: 'white'
              }}
            >
              {deleting ? 'Deleting...' : 'Delete Account Permanently'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
