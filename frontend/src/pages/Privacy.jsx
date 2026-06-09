export default function Privacy() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Privacy Policy</h1>
        <p className="page-subtitle">Last updated: June 8, 2026</p>
      </div>

      <div className="card">
        <h2>Your Privacy Matters</h2>
        <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
          VitaNudge is committed to protecting your personal health data. This policy explains how we collect, use, and protect your information.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>1. Information We Collect</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          • Account information (email, name)<br />
          • Health data (meals, weight, glucose, medications)<br />
          • Usage data (features used, timestamps)<br />
          • Device information (browser, OS)
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>2. How We Use Your Data</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          • Provide personalized health insights<br />
          • Generate nutrition and goal recommendations<br />
          • Improve app features and performance<br />
          • Send important account updates
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>3. Data Storage & Security</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          • All data encrypted at rest and in transit<br />
          • Secure cloud infrastructure<br />
          • Regular security audits<br />
          • No selling of personal health data
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4. Third-Party Services</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          • AI nutrition analysis (anonymized data)<br />
          • Payment processing (Stripe)<br />
          • Analytics (usage patterns only)<br />
          • No sharing of identifiable health data
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>5. Your Rights</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          • Access your data anytime<br />
          • Export all your data<br />
          • Delete your account and data<br />
          • Opt out of non-essential communications
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>6. Contact Us</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          For privacy questions or to exercise your rights:<br />
          Email: privacy@vitanudge.com<br />
          We respond within 48 hours.
        </p>

        <div style={{
          marginTop: 32,
          padding: 16,
          background: 'var(--surface2)',
          borderRadius: 'var(--rm)',
          border: '1px solid var(--border)'
        }}>
          <strong style={{ display: 'block', marginBottom: 8 }}>HIPAA Compliance</strong>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            VitaNudge follows HIPAA best practices for health data protection.
            Clinical tier users receive BAA (Business Associate Agreement) for full compliance.
          </p>
        </div>
      </div>
    </div>
  )
}
