export default function AuthFrame({ eyebrow, title, subtitle, note, children, footer }) {
  return (
    <div className="auth-page auth-product-page">
      <div className="auth-shell">
        <section className="auth-brand-panel" aria-label="VitaNudge product overview">
          <div className="auth-brand-top">
            <div className="auth-brand-lockup">
              <span className="brand-mark"><LeafMark /></span>
              <span>VitaNudge</span>
            </div>
            <span className="auth-plan-pill">Plus preview</span>
          </div>

          <div className="auth-hero-stage">
            <div className="auth-product-copy">
              <span className="auth-kicker">VitaNudge Plus Preview</span>
              <h1>Small nudges. Big results.</h1>
              <p>
                Your daily push toward better health, with meals, glucose, water,
                weight, medications, recipes, reports, and coaching in one calm workflow.
              </p>
              <div className="auth-value-row" aria-hidden="true">
                <span>No payment now</span>
                <span>Plus tools preview</span>
                <span>Launch-ready value</span>
              </div>
              <div className="auth-insight-panel" aria-hidden="true">
                <div className="insight-score-card">
                  <span>Meal score</span>
                  <strong>82</strong>
                </div>
                <div className="insight-copy-card">
                  <span>AI insight</span>
                  <strong>Higher carbs detected. Add protein or greens before dinner.</strong>
                </div>
                <div className="insight-metrics">
                  <div><span>Carbs</span><strong>118g</strong></div>
                  <div><span>Protein</span><strong>72g</strong></div>
                  <div><span>Fiber</span><strong>28g</strong></div>
                </div>
              </div>
            </div>

            <div className="auth-photo-card" aria-hidden="true">
              <div className="photo-overlay-card">
                <div className="photo-score">
                  <span>Meal score</span>
                  <strong>82</strong>
                </div>
                <div className="photo-insight">
                  <span>AI insight</span>
                  <strong>Higher carbs detected. Add protein or greens before dinner.</strong>
                </div>
              </div>
              <div className="photo-metric-strip">
                <div><span>Carbs</span><strong>118g</strong></div>
                <div><span>Protein</span><strong>72g</strong></div>
                <div><span>Fiber</span><strong>28g</strong></div>
              </div>
            </div>
          </div>

          <div className="auth-plan-strip">
            <div>
              <span>Plus preview access</span>
              <strong>Premium tools are open now; billing and plan rules can launch next.</strong>
            </div>
            <span className="plan-badge">Preview</span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-card auth-card-pro">
            <div className="auth-card-head">
              <span className="auth-card-mark"><LeafMark /></span>
              <div>
                <div className="auth-eyebrow">{eyebrow}</div>
                <div className="auth-logo">VitaNudge</div>
              </div>
            </div>
            <h2 className="auth-title">{title}</h2>
            <div className="auth-sub">{subtitle}</div>
            {note && <div className="auth-preview-note">{note}</div>}
            {children}
            <div className="auth-trust-row" aria-hidden="true">
              <span>AI scan</span>
              <span>Coach</span>
              <span>Doctor PDF</span>
            </div>
            {footer}
          </div>
        </section>
      </div>
    </div>
  )
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-1 4-2 4-4-3 2-7 3-9 4z" />
    </svg>
  )
}
