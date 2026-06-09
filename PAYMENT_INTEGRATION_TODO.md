# Payment Integration TODO

## Current Status

**Issue:** Pro checkout returns 503 (payment processing not configured)

**Root Cause:** Stripe integration requires:
1. Stripe API keys (secret + publishable)
2. Stripe webhook configuration
3. Subscription product IDs
4. Backend payment routes

## Quick Fix for Launch

**Option 1: Manual Billing (Immediate)**
- Accept payments via Stripe dashboard manually
- Manually upgrade users in database:
  ```sql
  UPDATE users SET subscription_tier = 'pro' WHERE email = 'customer@email.com';
  ```
- Good for beta/early customers

**Option 2: Stripe Checkout (1-2 days)**
- Add Stripe API keys to `.env`:
  ```
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_PRO_PRICE_ID=price_...
  STRIPE_CLINICAL_PRICE_ID=price_...
  ```

- Backend routes already exist in `backend/routes/billing.js`
- Frontend UpgradeModal ready at `frontend/src/components/UpgradeModal.jsx`

## Files That Need Stripe Keys

### Backend
- `backend/routes/billing.js` (line 7-8)
  ```js
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  ```

### Frontend  
- Environment variable for publishable key
- UpgradeModal already has Stripe integration code

## Testing Stripe Integration

1. Get test keys from Stripe dashboard
2. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Create products in Stripe:
   - VitaNudge Pro: $9.99/month
   - VitaNudge Clinical: $29.99/month

4. Test with card: `4242 4242 4242 4242`

5. Verify webhook receives `checkout.session.completed`

6. Check user upgraded in database

## Production Deployment

1. Switch to live keys (`sk_live_...`, `pk_live_...`)
2. Configure webhook endpoint: `https://api.vitanudge.com/api/billing/webhook`
3. Add webhook secret to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Test with real card
5. Monitor Stripe dashboard

## Current Workaround

For launch without Stripe:
1. Users see "Contact us" message
2. Manually process payments
3. Manually upgrade users in database
4. Full Stripe integration in Week 2

## Estimated Time

- **Manual approach:** 0 hours (current)
- **Full Stripe integration:** 4-6 hours
- **Testing + QA:** 2 hours

**Total:** 1 day of focused work

## Priority

**Low** - Not blocking for soft launch
- Can manually upgrade beta users
- Most users will be on free tier initially
- Add Stripe in Week 2 after launch
