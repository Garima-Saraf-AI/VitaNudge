import ModalPortal from './ModalPortal'

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

  // Payment provider not yet configured - manual upgrade only
  function requestUpgrade(plan) {
    const subject = encodeURIComponent(`Upgrade Request: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`)
    const body = encodeURIComponent(`Hi VitaNudge team,\n\nI would like to upgrade to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.\n\nPlease let me know the next steps.\n\nThanks!`)
    window.location.href = `mailto:support@vitanudge.com?subject=${subject}&body=${body}`
  }

  return (
    <ModalPortal onClose={onClose}>
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
                onClick={() => requestUpgrade('pro')}
              >
                Request Upgrade
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
                onClick={() => requestUpgrade('clinical')}
              >
                Request Upgrade
              </button>
            </div>
            <ul className="upgrade-feature-list">
              {PLAN_FEATURES.clinical.map(f => (
                <li key={f}><span className="check">✓</span>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="info-box" style={{ margin: '0 22px 16px', fontSize: '0.9rem', flexShrink: 0 }}>
          💳 Online checkout coming soon. Click "Request Upgrade" to email us and we'll activate your plan manually within 24 hours.
        </div>

        <div className="upgrade-footer">
          <button className="btn-link" type="button" onClick={onClose}>Continue with free plan</button>
        </div>
      </div>
    </ModalPortal>
  )
}
