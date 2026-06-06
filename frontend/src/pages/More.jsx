import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  {
    title: 'Everyday Tracking',
    eyebrow: 'Core habits',
    items: [
      { path: '/library', label: 'Food Library', desc: 'Manage foods, portions, and favorites.', tier: 'Included' },
      { path: '/water', label: 'Water', desc: 'Track intake and hydration consistency.', tier: 'Included' },
      { path: '/glucose', label: 'Glucose', desc: 'Log readings beside meal history.', tier: 'Included' },
      { path: '/weight', label: 'Weight', desc: 'Follow BMI and weight trend changes.', tier: 'Included' },
    ],
  },
  {
    title: 'Faster Logging',
    eyebrow: 'Less manual work',
    items: [
      { path: '/templates', label: 'Meal Templates', desc: 'Save common meal combos for one-tap logging.', tier: 'Plus value' },
      { path: '/barcode', label: 'Barcode Lookup', desc: 'Scan packaged foods using product databases.', tier: 'Plus value' },
      { path: '/scan', label: 'Smart Scan', desc: 'Scan plates and nutrition labels with AI support.', tier: 'Plus value' },
    ],
  },
  {
    title: 'Premium Health Outcomes',
    eyebrow: 'Advanced care',
    items: [
      { path: '/coach', label: 'AI Nutrition Coach', desc: 'Explain meal patterns, glucose spikes, and next steps.', tier: 'Plus' },
      { path: '/report', label: 'Doctor Report', desc: 'Create a 30-day summary for appointments.', tier: 'Plus' },
      { path: '/vitals', label: 'Vitals', desc: 'Track blood pressure, HbA1c, and pulse trends.', tier: 'Plus' },
      { path: '/meds', label: 'Medication Log', desc: 'Keep daily medication adherence visible.', tier: 'Plus' },
      { path: '/goals', label: 'Goals & Profile', desc: 'Tune targets that make coaching more personal.', tier: 'Setup' },
    ],
  },
]

export default function More() {
  const navigate = useNavigate()

  return (
    <div className="more-page">
      <section className="more-hero product-hero">
        <div>
          <div className="more-kicker">VitaNudge Plus</div>
          <h2 className="more-title">Go beyond tracking with guided insight.</h2>
          <p className="more-copy">
            Daily logging stays simple. Plus tools help you understand patterns,
            prepare doctor-ready reports, and capture meals faster.
          </p>
          <div className="more-actions">
            <button className="btn btn-green" onClick={() => navigate('/coach')}>Try coach</button>
            <button className="btn btn-ghost" onClick={() => navigate('/report')}>View report</button>
          </div>
        </div>

        <div className="plus-card">
          <span className="plus-card-label">Premium bundle</span>
          <strong>Coach + reports + smart scans</strong>
          <p>Advanced support for people who want clearer decisions every week.</p>
        </div>
      </section>

      {SECTIONS.map(section => (
        <section key={section.title} className="more-section">
          <div className="section-heading">
            <span>{section.eyebrow}</span>
            <h3>{section.title}</h3>
          </div>
          <div className="more-grid">
            {section.items.map(item => (
              <button
                key={item.path}
                className="more-card"
                onClick={() => navigate(item.path)}
              >
                <div className="more-card-top">
                  <div className="more-card-title">{item.label}</div>
                  <span className="tier-badge">{item.tier}</span>
                </div>
                <div className="more-card-desc">{item.desc}</div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
