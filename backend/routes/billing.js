const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getDb } = require('../database/db');
const { getEffectiveTier, getTierLimits } = require('../middleware/tier');

// ── PAYMENT PROVIDER: Lemon Squeezy (no SSN required) ──
// Sign up free at lemonsqueezy.com, create products, then add these to .env:
//
// LEMONSQUEEZY_API_KEY=your_api_key_here
// LEMONSQUEEZY_STORE_ID=12345
// LEMONSQUEEZY_PRO_VARIANT_ID=11111
// LEMONSQUEEZY_CLINICAL_VARIANT_ID=22222
// LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
//
// ── Optional: Keep Stripe as fallback ──
// STRIPE_SECRET_KEY=sk_live_...
// STRIPE_PRO_PRICE_ID=price_...
// STRIPE_CLINICAL_PRICE_ID=price_...
// STRIPE_WEBHOOK_SECRET=whsec_...

// GET /api/billing/status — returns current tier + usage for frontend
router.get('/status', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT subscription_tier, subscription_expires_at, scan_count_month, barcode_count_month, scan_count_reset_date FROM users WHERE id = ?'
  ).get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const tier = getEffectiveTier(user);
  const limits = getTierLimits(tier);

  // Reset counts if new month
  const thisMonth = new Date().toISOString().slice(0, 7);
  let scanUsed = user.scan_count_month;
  let barcodeUsed = user.barcode_count_month;
  if (user.scan_count_reset_date !== thisMonth) {
    scanUsed = 0; barcodeUsed = 0;
  }

  res.json({
    tier,
    is_pro: tier === 'pro' || tier === 'clinical',
    subscription_expires_at: user.subscription_expires_at || null,
    usage: {
      scans: { used: scanUsed, limit: limits.scan_per_month === Infinity ? null : limits.scan_per_month },
      barcodes: { used: barcodeUsed, limit: limits.barcode_per_month === Infinity ? null : limits.barcode_per_month },
    },
    plans: {
      pro:      { price: '$4.99/mo', features: ['Unlimited scans', 'Vitals & medications', 'Unlimited templates', 'Barcode lookup', 'AI Coach', 'Weekly email digest', 'Data export'] },
      clinical: { price: '$9.99/mo', features: ['Everything in Pro', 'Clinician dashboard', 'Family/caregiver access', 'Priority support'] },
    },
  });
});

// POST /api/billing/checkout — create checkout session (Lemon Squeezy or Stripe)
router.post('/checkout', authMiddleware, async (req, res) => {
  const { plan } = req.body; // 'pro' or 'clinical'
  if (!['pro', 'clinical'].includes(plan))
    return res.status(400).json({ error: 'Invalid plan. Choose pro or clinical.' });

  const db = getDb();
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // ── Lemon Squeezy (preferred — no SSN required) ──────────────
  if (process.env.LEMONSQUEEZY_API_KEY) {
    const variantMap = {
      pro:      process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
      clinical: process.env.LEMONSQUEEZY_CLINICAL_VARIANT_ID,
    };
    const variantId = variantMap[plan];
    if (!variantId) return res.status(503).json({ error: 'Plan variant not configured' });

    try {
      const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              checkout_data: {
                email: user.email,
                name:  user.name,
                custom: { user_id: req.userId, plan },
              },
              product_options: {
                redirect_url:     `${frontendUrl}/?upgraded=1`,
                receipt_link_url: `${frontendUrl}/profile`,
              },
            },
            relationships: {
              store:   { data: { type: 'stores',   id: String(process.env.LEMONSQUEEZY_STORE_ID) } },
              variant: { data: { type: 'variants',  id: String(variantId) } },
            },
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('[billing/checkout/lsq]', JSON.stringify(data));
        return res.status(502).json({ error: 'Could not create Lemon Squeezy checkout' });
      }
      return res.json({ checkout_url: data.data?.attributes?.url });
    } catch (e) {
      console.error('[billing/checkout/lsq]', e.message);
      return res.status(500).json({ error: 'Checkout failed' });
    }
  }

  // ── Stripe fallback ───────────────────────────────────────────
  if (process.env.STRIPE_SECRET_KEY) {
    const priceMap = {
      pro:      process.env.STRIPE_PRO_PRICE_ID,
      clinical: process.env.STRIPE_CLINICAL_PRICE_ID,
    };
    const priceId = priceMap[plan];
    if (!priceId) return res.status(503).json({ error: 'Stripe price not configured' });

    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      let customerId = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.userId)?.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: req.userId } });
        customerId = customer.id;
        db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, req.userId);
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${frontendUrl}/?upgraded=1`,
        cancel_url:  `${frontendUrl}/profile`,
        metadata: { user_id: req.userId, plan },
      });
      return res.json({ checkout_url: session.url });
    } catch (e) {
      console.error('[billing/checkout/stripe]', e.message);
      return res.status(500).json({ error: 'Could not create checkout session' });
    }
  }

  // ── Neither configured ────────────────────────────────────────
  return res.status(503).json({
    error: 'Payment processing not yet configured. Check back soon!',
    coming_soon: true,
  });
});

// POST /api/billing/portal — create Stripe customer portal session
router.post('/portal', authMiddleware, async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: 'Billing not configured', coming_soon: true });

  try {
    const stripe = require('stripe')(stripeKey);
    const db = getDb();
    const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.userId);
    if (!user?.stripe_customer_id) return res.status(400).json({ error: 'No billing account found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile`,
    });

    res.json({ portal_url: session.url });
  } catch (e) {
    console.error('[billing/portal]', e.message);
    res.status(500).json({ error: 'Could not open billing portal' });
  }
});

// POST /api/billing/webhook — handles both Lemon Squeezy and Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const db = getDb();
  const rawBody = req.body.toString('utf8');

  // ── Lemon Squeezy webhook ─────────────────────────────────────
  const lsqSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (lsqSecret && req.headers['x-signature']) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', lsqSecret).update(rawBody).digest('hex');
    if (hmac !== req.headers['x-signature']) {
      console.error('[billing/webhook/lsq] signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    let payload;
    try { payload = JSON.parse(rawBody); } catch { return res.sendStatus(400); }

    const eventName = payload.meta?.event_name;
    const attrs     = payload.data?.attributes;
    const custom    = payload.meta?.custom_data || {};
    const userId    = custom.user_id;
    const plan      = custom.plan || 'pro';
    const subId     = String(payload.data?.id || '');

    console.log(`[billing/lsq] event: ${eventName} user: ${userId} plan: ${plan}`);

    if (eventName === 'order_created' || eventName === 'subscription_created') {
      if (userId) {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        db.prepare(`UPDATE users SET subscription_tier=?, stripe_subscription_id=?, subscription_expires_at=? WHERE id=?`)
          .run(plan, subId, expires.toISOString(), userId);
        console.log(`[billing] ✅ User ${userId} upgraded to ${plan}`);
      }
    }

    if (eventName === 'subscription_expired' || eventName === 'subscription_cancelled') {
      if (userId) {
        db.prepare(`UPDATE users SET subscription_tier='free', stripe_subscription_id='', subscription_expires_at='' WHERE id=?`)
          .run(userId);
        console.log(`[billing] ⬇️  User ${userId} downgraded to free`);
      }
    }

    if (eventName === 'subscription_resumed' || eventName === 'subscription_updated') {
      if (userId && attrs?.status === 'active') {
        const expires = attrs.ends_at ? new Date(attrs.ends_at) : (() => { const d = new Date(); d.setFullYear(d.getFullYear()+1); return d; })();
        db.prepare(`UPDATE users SET subscription_expires_at=? WHERE id=?`)
          .run(expires.toISOString(), userId);
      }
    }

    return res.sendStatus(200);
  }

  // ── Stripe webhook fallback ───────────────────────────────────
  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return res.sendStatus(200);

  let event;
  try {
    const stripe = require('stripe')(stripeKey);
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (e) {
    console.error('[billing/webhook/stripe] signature failed:', e.message);
    return res.status(400).send(`Webhook error: ${e.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId  = session.metadata?.user_id;
    const plan    = session.metadata?.plan || 'pro';
    if (userId) {
      const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
      db.prepare('UPDATE users SET subscription_tier=?, stripe_subscription_id=?, subscription_expires_at=? WHERE id=?')
        .run(plan, session.subscription, expires.toISOString(), userId);
      console.log(`[billing] ✅ User ${userId} upgraded to ${plan} via Stripe`);
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    db.prepare("UPDATE users SET subscription_tier='free', stripe_subscription_id='', subscription_expires_at='' WHERE stripe_subscription_id=?")
      .run(sub.id);
  }
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    if (sub.status === 'active')
      db.prepare('UPDATE users SET subscription_expires_at=? WHERE stripe_subscription_id=?')
        .run(new Date(sub.current_period_end * 1000).toISOString(), sub.id);
  }

  res.sendStatus(200);
});

module.exports = router;
