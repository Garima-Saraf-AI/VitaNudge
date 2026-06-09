export default function Terms() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Terms of Service</h1>
        <p className="page-subtitle">Last updated: June 8, 2026</p>
      </div>

      <div className="card">
        <h2>Agreement to Terms</h2>
        <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
          By using VitaNudge, you agree to these terms. Please read them carefully.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>1. Service Description</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          VitaNudge provides digital health tracking and nutrition guidance. Our service includes:
          <br />• Meal and nutrition logging
          <br />• Goal setting and tracking
          <br />• Health metric monitoring
          <br />• AI-powered insights and recommendations
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>2. Medical Disclaimer</h3>
        <div style={{
          padding: 16,
          background: 'var(--amber-l)',
          border: '1px solid var(--amber-b)',
          borderRadius: 'var(--rm)',
          marginBottom: 16
        }}>
          <strong style={{ display: 'block', marginBottom: 8, color: 'var(--amber)' }}>⚠️ Important</strong>
          <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>
            VitaNudge is NOT a substitute for professional medical advice, diagnosis, or treatment.
            Always consult your physician before making health decisions. Our AI recommendations are
            informational only and not medical advice.
          </p>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>3. User Responsibilities</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          You agree to:
          <br />• Provide accurate health information
          <br />• Keep your account credentials secure
          <br />• Use the service lawfully
          <br />• Not share your Pro/Clinical subscription
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4. Subscription & Billing</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          • Free tier: No credit card required
          <br />• Pro tier: $9.99/month, billed monthly
          <br />• Clinical tier: $29.99/month, billed monthly
          <br />• Cancel anytime, no refunds for partial months
          <br />• Processed securely through Stripe
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>5. Data Ownership</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          • You own all your health data
          <br />• Export anytime in standard formats
          <br />• Delete your account anytime
          <br />• VitaNudge retains rights to anonymized aggregated data for research
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>6. Limitation of Liability</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          VitaNudge is provided "as is" without warranties. We are not liable for:
          <br />• Health outcomes from using the service
          <br />• Errors in nutrition data or calculations
          <br />• Service interruptions or data loss
          <br />• Third-party integrations
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>7. Termination</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          We may suspend or terminate accounts for:
          <br />• Violation of these terms
          <br />• Fraudulent activity
          <br />• Extended inactivity (1+ year)
          <br />• Non-payment of subscription
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>8. Changes to Terms</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          We may update these terms. We'll notify you 30 days before major changes.
          Continued use after changes means you accept the new terms.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>9. Contact</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          Questions about these terms?<br />
          Email: legal@vitanudge.com<br />
          Address: VitaNudge Inc., San Francisco, CA
        </p>
      </div>
    </div>
  )
}
