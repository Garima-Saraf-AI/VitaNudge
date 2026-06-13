import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const DEFAULT_TITLES = {
  success: 'Done',
  error: '',
  warning: 'Check this',
  info: 'Update',
}

function inferredTone(message, tone) {
  if (tone) return tone
  const text = String(message || '').toLowerCase()
  if (text.includes('failed') || text.includes('could not') || text.includes('error')) return 'error'
  if (text.includes('required') || text.includes('must be') || text.includes('already') || text.includes('⚠')) return 'warning'
  return 'success'
}

function cleanMessage(message) {
  return String(message || '').replace(/^[✓✅⚠️ℹ️]+\s*/u, '').trim()
}

export default function StatusToast({
  message,
  tone,
  title,
  actionLabel,
  onAction,
  onClose,
}) {
  const [dismissed, setDismissed] = useState(false)
  const resolvedTone = inferredTone(message, tone)
  const resolvedTitle = title ?? DEFAULT_TITLES[resolvedTone]

  useEffect(() => {
    setDismissed(false)
  }, [message])

  if (!message || dismissed || typeof document === 'undefined') return null

  function close() {
    setDismissed(true)
    onClose?.()
  }

  return createPortal(
    <div
      className={`status-toast ${resolvedTone}`}
      role={resolvedTone === 'error' || resolvedTone === 'warning' ? 'alert' : 'status'}
      aria-live={resolvedTone === 'error' ? 'assertive' : 'polite'}
    >
      <span className="status-toast-mark" aria-hidden="true" />
      <span className="status-toast-copy">
        {resolvedTitle && <strong>{resolvedTitle}</strong>}
        <em>{cleanMessage(message)}</em>
      </span>
      {actionLabel && onAction && (
        <button
          className="status-toast-action"
          type="button"
          onClick={() => {
            onAction()
            close()
          }}
        >
          {actionLabel}
        </button>
      )}
      <button className="status-toast-close" type="button" aria-label="Dismiss message" onClick={close}>
        &times;
      </button>
    </div>,
    document.body
  )
}
