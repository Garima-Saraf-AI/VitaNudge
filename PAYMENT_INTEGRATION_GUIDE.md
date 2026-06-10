# Payment Integration Guide for VitaNudge

**Last Updated**: 2026-06-10  
**Current Status**: Manual upgrade (mailto fallback)  
**Goal**: Implement automated online payments for Pro/Clinical tiers

---

## Payment Provider Comparison

### Overview Table

| Provider | Setup Cost | Transaction Fee | Monthly Fee | Best For | India Support |
|----------|------------|-----------------|-------------|----------|---------------|
| **Razorpay** | ₹0 | 2% | ₹0 | India-first apps | ✅ Native |
| **Stripe** | $0 | 2.9% + $0.30 | $0 | Global apps | ✅ Good |
| **Paddle** | $0 | 5% + $0.50 | $0 | SaaS, handles taxes | ✅ Yes |
| **Lemonsqueezy** | $0 | 5% + $0.50 | $0 | Indie devs, simple | ✅ Yes |
| **PayPal** | $0 | 3.49% + fixed | $0 | Consumer trust | ✅ Yes |
| **Instamojo** | ₹0 | 2% + ₹3 | ₹0 | India SMBs | ✅ Native |

---

## Detailed Breakdown

### 🥇 **#1 RECOMMENDED: Razorpay** (Best for India)

**Pros**:
- ✅ **India-first**: Built for Indian market
- ✅ **Low fees**: 2% (no fixed fee per transaction)
- ✅ **UPI integration**: Direct UPI, wallets, cards
- ✅ **Subscriptions**: Built-in recurring billing
- ✅ **Instant activation**: KYC in 24-48 hours
- ✅ **No setup cost**: Free to start
- ✅ **Great docs**: Excellent API documentation
- ✅ **Dashboard**: Real-time analytics
- ✅ **Customer support**: India-based support

**Cons**:
- ⚠️ India-focused (limited global reach)
- ⚠️ Requires Indian business registration

**Pricing Example** (VitaNudge Pro @ ₹399/month):
- Transaction fee: ₹399 × 2% = **₹7.98 per sale**
- You receive: **₹391.02**

**Best For**: 
- Indian startups
- INR pricing
- UPI/wallet payments
- Quick setup

**Setup Time**: 1-2 days (KYC) + 2 hours (integration)

---

### 🥈 **#2 RECOMMENDED: Stripe** (Best Global Solution)

**Pros**:
- ✅ **Global leader**: Most trusted payment platform
- ✅ **Excellent UX**: Best checkout experience
- ✅ **Subscriptions**: Advanced billing features
- ✅ **100+ currencies**: Easy international expansion
- ✅ **No monthly fee**: Pay-as-you-go
- ✅ **Developer-friendly**: Amazing API, webhooks
- ✅ **Stripe Tax**: Automatic tax calculation
- ✅ **Strong security**: PCI-compliant, fraud detection

**Cons**:
- ⚠️ Higher fees: 2.9% + $0.30 per transaction
- ⚠️ International fees: +1% for non-India cards
- ⚠️ Currency conversion: Additional 1% if not USD

**Pricing Example** (VitaNudge Pro @ $4.99):
- Transaction fee: $4.99 × 2.9% + $0.30 = **$0.44**
- You receive: **$4.55** (91%)

**Pricing Example** (Pro @ ₹399 = ~$4.80):
- Transaction fee: $4.80 × 2.9% + $0.30 = **$0.44**
- Currency conversion: $4.80 × 1% = **$0.05**
- Total fees: **$0.49** (~10%)
- You receive: **$4.31** (₹358 approx)

**Best For**:
- Global expansion plans
- USD/multi-currency pricing
- Enterprise features
- International customers

**Setup Time**: 1-3 days (verification) + 3 hours (integration)

---

### 🥉 **#3: Lemonsqueezy** (Best for Indie Devs)

**Pros**:
- ✅ **Merchant of Record**: Handles ALL taxes automatically
- ✅ **No company required**: Can use as individual
- ✅ **Simple**: Easiest integration
- ✅ **Global VAT**: Handles EU VAT, GST automatically
- ✅ **Email invoices**: Automatic customer invoices
- ✅ **No KYC hassle**: Quick activation

**Cons**:
- ⚠️ Higher fees: 5% + $0.50 per transaction
- ⚠️ Limited India payment methods (no UPI)
- ⚠️ Slower payouts: Weekly (vs daily for Stripe/Razorpay)

**Pricing Example** (Pro @ $4.99):
- Transaction fee: ($4.99 × 5%) + $0.50 = **$0.75**
- You receive: **$4.24** (85%)

**Best For**:
- Solo developers
- No business registration yet
- Global customers
- Tax compliance headache avoidance

**Setup Time**: 1 hour (instant approval + integration)

---

### Other Options

#### **Paddle** (Good for SaaS)
- Similar to Lemonsqueezy (Merchant of Record)
- 5% + $0.50 fees
- Better for established SaaS businesses
- Not ideal for small Indian startups

#### **PayPal** (Consumer Trust)
- 3.49% + fixed fee
- High buyer trust
- Clunky integration
- Better as secondary option

#### **Instamojo** (India Budget Option)
- 2% + ₹3 per transaction
- Basic features
- Good for very small businesses
- Limited advanced features

---

## Recommended Strategy

### **Option A: India-First Launch** 💰
**Primary**: Razorpay (2%)  
**Pricing**: ₹399/month Pro, ₹799/month Clinical

**Why**:
- Lowest fees (save ₹8 vs ₹20 per transaction)
- Native UPI (huge in India - 50%+ of transactions)
- Fast KYC and payouts
- Best local support

**When to switch**: Add Stripe when >20% users are international

---

### **Option B: Global-First Launch** 🌍
**Primary**: Stripe (2.9% + $0.30)  
**Pricing**: $4.99/month Pro, $9.99/month Clinical

**Why**:
- Best-in-class checkout UX
- Easy to add more currencies later
- Trusted brand globally
- Better for fundraising (investors recognize Stripe)

**Fallback**: Add Razorpay for India (improves conversion by 15-20%)

---

### **Option C: Solo/Indie** 🚀
**Primary**: Lemonsqueezy (5% + $0.50)  
**Pricing**: $4.99/month Pro, $9.99/month Clinical

**Why**:
- No business registration required
- Handles all tax compliance
- Simplest integration
- Start earning immediately

**Trade-off**: Higher fees (worth it for simplicity at <100 customers)

---

## Implementation Functionality Needed

### Core Payment Features

#### 1. **Checkout Flow**
```
User clicks "Upgrade to Pro"
  ↓
Backend creates checkout session
  ↓
User redirected to payment provider (Stripe/Razorpay hosted page)
  ↓
User completes payment
  ↓
Provider redirects back to app (success URL)
  ↓
Webhook updates user tier in database
  ↓
User sees "You're now Pro!" message
```

#### 2. **Subscription Management**
- Create subscription (new Pro user)
- Cancel subscription (downgrade to free)
- Pause subscription (optional)
- Upgrade subscription (Pro → Clinical)
- View billing history
- Update payment method

#### 3. **Webhook Handling** (Critical!)
- `subscription.created` → Activate Pro tier
- `subscription.updated` → Handle plan changes
- `subscription.canceled` → Downgrade to free
- `payment.failed` → Send reminder email
- `payment.succeeded` → Send receipt

#### 4. **Database Changes**
```sql
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT; -- active, canceled, past_due
ALTER TABLE users ADD COLUMN payment_method TEXT; -- card, upi, wallet
```

---

## Step-by-Step Integration (Stripe Example)

### Phase 1: Setup (30 minutes)

**1.1 Create Stripe Account**
- Sign up at https://stripe.com
- Complete business verification
- Get API keys (test + live)

**1.2 Create Products**
```javascript
// Run once in Stripe Dashboard or via API
Product: "VitaNudge Pro"
  - Price: $4.99/month (recurring)
  - Price ID: price_xxxxx

Product: "VitaNudge Clinical"
  - Price: $9.99/month (recurring)
  - Price ID: price_yyyyy
```

**1.3 Add Environment Variables**
```bash
# backend/.env
STRIPE_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_CLINICAL=price_yyyyy

FRONTEND_URL=https://vitanudge.onrender.com
```

---

### Phase 2: Backend Implementation (2 hours)

**2.1 Install Stripe SDK**
```bash
cd backend
npm install stripe
```

**2.2 Update backend/routes/billing.js**

Replace the current stub with:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { getDb } = require('../database/db');

// Create checkout session
router.post('/checkout', authMiddleware, async (req, res) => {
  const { plan } = req.body; // 'pro' or 'clinical'
  
  if (!['pro', 'clinical'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const priceId = plan === 'pro' 
    ? process.env.STRIPE_PRICE_PRO 
    : process.env.STRIPE_PRICE_CLINICAL;

  try {
    const db = getDb();
    const user = db.prepare('SELECT email, stripe_customer_id FROM users WHERE id = ?').get(req.userId);

    // Create or reuse Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: req.userId }
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, req.userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/upgrade-canceled`,
      metadata: {
        user_id: req.userId,
        plan: plan
      }
    });

    res.json({ checkout_url: session.url });
  } catch (error) {
    console.error('[billing] Checkout error:', error);
    res.status(500).json({ error: 'Could not create checkout session' });
  }
});

// Webhook handler (handles subscription events)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[billing] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = getDb();

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      const userId = subscription.metadata.user_id;
      const tier = subscription.items.data[0].price.id === process.env.STRIPE_PRICE_PRO ? 'pro' : 'clinical';
      const status = subscription.status; // active, past_due, canceled, etc.

      db.prepare(`
        UPDATE users 
        SET subscription_tier = ?, 
            subscription_status = ?,
            stripe_subscription_id = ?,
            subscription_expires_at = datetime(?, 'unixepoch')
        WHERE id = ?
      `).run(tier, status, subscription.id, subscription.current_period_end, userId);

      console.log(`[billing] User ${userId} upgraded to ${tier}`);
      break;

    case 'customer.subscription.deleted':
      const canceledSub = event.data.object;
      const canceledUserId = canceledSub.metadata.user_id;

      db.prepare(`
        UPDATE users 
        SET subscription_tier = 'free',
            subscription_status = 'canceled',
            subscription_expires_at = NULL
        WHERE id = ?
      `).run(canceledUserId);

      console.log(`[billing] User ${canceledUserId} downgraded to free`);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`[billing] Payment failed for customer ${failedInvoice.customer}`);
      // TODO: Send email notification
      break;

    default:
      console.log(`[billing] Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get subscription status
router.get('/subscription', authMiddleware, async (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT subscription_tier, subscription_status, subscription_expires_at, stripe_subscription_id 
    FROM users WHERE id = ?
  `).get(req.userId);

  if (!user.stripe_subscription_id) {
    return res.json({ tier: 'free', status: null });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    res.json({
      tier: user.subscription_tier,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('[billing] Error fetching subscription:', error);
    res.status(500).json({ error: 'Could not fetch subscription' });
  }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT stripe_subscription_id FROM users WHERE id = ?').get(req.userId);

  if (!user.stripe_subscription_id) {
    return res.status(400).json({ error: 'No active subscription' });
  }

  try {
    const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    res.json({ 
      message: 'Subscription will cancel at period end',
      cancel_at: subscription.current_period_end 
    });
  } catch (error) {
    console.error('[billing] Cancel error:', error);
    res.status(500).json({ error: 'Could not cancel subscription' });
  }
});

module.exports = router;
```

**2.3 Update Database Schema**
```bash
# Run migration
sqlite3 backend/database/nutritrack.db << 'EOF'
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN payment_method TEXT;
EOF
```

---

### Phase 3: Frontend Implementation (1 hour)

**3.1 Update UpgradeModal.jsx**

Replace the current mailto flow:

```javascript
import { useState } from 'react'
import api from '../utils/api'

// ... PLAN_FEATURES constant stays the same ...

export default function UpgradeModal({ feature, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade(plan) {
    setLoading(true)
    setError('')
    
    try {
      const data = await api.post('/billing/checkout', { plan })
      
      if (data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url
      } else {
        setError('Could not start checkout. Please try again.')
      }
    } catch (e) {
      setError(e.error || 'Checkout failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box upgrade-modal">
        {/* ... header stays the same ... */}

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
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>
            {/* ... features list ... */}
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
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Get Clinical'}
              </button>
            </div>
            {/* ... features list ... */}
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="upgrade-footer">
          <button className="btn-link" onClick={onClose}>Continue with free plan</button>
          <span>Cancel anytime · Secure payment via Stripe</span>
        </div>
      </div>
    </div>
  )
}
```

**3.2 Add Success/Cancel Pages**

Create `frontend/src/pages/UpgradeSuccess.jsx`:
```javascript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UpgradeSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => navigate('/'), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h1>Welcome to VitaNudge Pro!</h1>
      <p>Your subscription is now active. Redirecting to dashboard...</p>
    </div>
  )
}
```

---

### Phase 4: Testing (1 hour)

**4.1 Test Mode Setup**
1. Use Stripe test mode keys (`sk_test_...`)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date, any CVC

**4.2 Test Checklist**
- [ ] Click "Upgrade to Pro" → redirects to Stripe checkout
- [ ] Complete payment → redirects to success page
- [ ] Check database → `subscription_tier = 'pro'`
- [ ] Verify Pro features unlock
- [ ] Test webhook → trigger from Stripe Dashboard
- [ ] Cancel subscription → tier stays Pro until period end
- [ ] Period expires → tier reverts to free

---

### Phase 5: Go Live (30 minutes)

**5.1 Switch to Live Mode**
```bash
# Update .env
STRIPE_SECRET_KEY=sk_live_xxxxx  # Replace test key
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx  # New webhook secret for live
```

**5.2 Configure Live Webhook**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://vitanudge-api.onrender.com/api/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook secret → update `.env`

**5.3 Deploy**
```bash
git add .
git commit -m "Implement Stripe payment integration"
git push
```

---

## Cost Comparison (Monthly Revenue)

### Scenario: 100 customers/month @ $4.99 Pro

| Provider | Fees per Transaction | Total Fees (100) | Net Revenue |
|----------|---------------------|------------------|-------------|
| **Razorpay** (₹399) | ₹7.98 (2%) | ₹798 | ₹39,102 (98%) |
| **Stripe** ($4.99) | $0.44 (9%) | $44 | $455 (91%) |
| **Lemonsqueezy** | $0.75 (15%) | $75 | $424 (85%) |

**Annual Difference** (100 customers):
- Razorpay vs Stripe: Save ~₹10,000/year
- Razorpay vs Lemonsqueezy: Save ~₹25,000/year

---

## My Recommendation

### **Start with Razorpay** 💰

**Why**:
1. **Lowest fees**: Save 8-13% vs competitors
2. **India-first**: UPI is huge (60% of users will prefer it)
3. **Quick setup**: KYC in 24-48 hours
4. **Better margins**: Keep more revenue in early stage
5. **Local support**: India-based help when you need it

**When to add Stripe**:
- You have >20% international users
- You want to expand to US/Europe
- You're fundraising (investors like Stripe)

**Implementation Order**:
1. **Phase 1** (Week 1): Razorpay integration
2. **Phase 2** (Month 2): Add Stripe for international
3. **Phase 3** (Month 6): Add Lemonsqueezy for EU VAT compliance

---

## Next Steps

1. **Choose provider** (Recommend: Razorpay for India launch)
2. **Sign up** and get API keys
3. **Implement integration** (use code above, ~4 hours)
4. **Test thoroughly** in test mode
5. **Deploy** to production
6. **Monitor** first transactions closely

**Questions?**
- Want me to implement Razorpay integration right now?
- Need help with Indian business registration?
- Want to see Razorpay-specific code examples?

