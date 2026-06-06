import { useState } from 'react'
import api from '../utils/api'

const PLAN_FEATURES = {
  pro: [
    'Unlimited AI label scans (vs 5/month free)',
    'Unlimited barcode lookups (vs 10/month free)',
    'Vitals tracking — blood pressure, pulse, HbA1c',
    'Medication log with daily adherence',
    'Unlimited meal templates',
    'Advanced recipes & macro calculator',
    'AI Coach powered by Gemini',
    'Weekly health email digest',
    'Export all your data anytime',
  ],
  clinical: [
    'Everything in Pro',
    'Clinician dashboard — monitor patients',
    'Family/caregiver access sharing',
    'Priority support',
  ],
}

export default function UpgradeModal({ feature, onClose }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const featureMessages = {
    scan: "You've used all 5 free scans this month.",
    barcode: "You've used all 10 free barcode lookups this month.",
    vitals: 'Vitals tracking is a Pro feature.',
    meds: 'Medication logging is a Pro feature.',
    recipes: 'Recipe macros are a Pro feature.',
    templates: 'You\'ve reached the 3-template limit on the free plan.',
    export: 'Data export is a Pro feature.',
    coach_pro: 'Gemini-powered AI coaching is a Pro feature.',
  }

  const message = featureMessages[feature] || 'Upgrade to unlock this feature.'

  async function handleUpgrade(plan) {
    setBusy(true)
    setErr('')
    try {
      const data = await api.post('/billing/checkout', { plan })
      if (data.coming_soon) {
        setErr('Billing is not yet configured. Check back soon!')
        setBusy(false)
        return
      }
      window.location.href = data.checkout_url
    } catch (e) {
      setErr(e.error || 'Could not start checkout. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="modal-bg" role="presentation" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <div className="upgrade-modal-head">
          <div className="upgrade-icon">⚡</div>
          <div>
            <div className="upgrade-kicker">Upgrade to Pro</div>
            <h2 id="upgrade-title">Unlock the full experience</h2>
            <p>{message}</p>
          </div>
          <button className="modal-close-btn" type="button" aria-label="Close" onClick={onClose}>&times;</button>
        </div>

        <div className="upgrade-plans">
          <div className="upgrade-plan upgrade-plan-pro">
            <div className="upgrade-plan-head">
              <div>
                <div className="upgrade-plan-name">Pro</div>
                <div className="upgrade-plan-price">$4.99 <span>/month</span></div>
              </div>
              <button
                className="btn btn-green"
                onClick={() => handleUpgrade('pro')}
                disabled={busy}
              >
                {busy ? 'Loading…' : 'Upgrade to Pro'}
              </button>
            </div>
            <ul className="upgrade-feature-list">
              {PLAN_FEATURES.pro.map(f => (
                <li key={f}><span className="check">✓</span>{f}</li>
              ))}
            </ul>
          </div>

          <div className="upgrade-plan upgrade-plan-clinical">
            <div className="upgrade-plan-head">
              <div>
                <div className="upgrade-plan-name">Clinical</div>
                <div className="upgrade-plan-price">$9.99 <span>/month</span></div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => handleUpgrade('clinical')}
                disabled={busy}
              >
                {busy ? 'Loading…' : 'Get Clinical'}
              </button>
            </div>
            <ul className="upgrade-feature-list">
              {PLAN_FEATURES.clinical.map(f => (
                <li key={f}><span className="check">✓</span>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {err && <div className="error-box" style={{ marginTop: 12 }}>{err}</div>}

        <div className="upgrade-footer">
          <button className="btn-link" type="button" onClick={onClose}>Continue with free plan</button>
          <span>Cancel anytime · Secure payment via Stripe</span>
        </div>
      </div>
    </div>
  )
}
