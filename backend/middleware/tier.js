const { getDb } = require('../database/db');

// Tier definitions
const TIERS = {
  free: {
    scan_per_month: 5,
    barcode_per_month: 10,
    templates_max: 3,
    features: ['meals', 'water', 'weight', 'glucose', 'library', 'coach_basic', 'report'],
  },
  pro: {
    scan_per_month: Infinity,
    barcode_per_month: Infinity,
    templates_max: Infinity,
    features: ['meals', 'water', 'weight', 'glucose', 'library', 'coach_pro', 'report',
               'vitals', 'meds', 'recipes', 'templates', 'barcode', 'weekly_email', 'export'],
  },
  clinical: {
    scan_per_month: Infinity,
    barcode_per_month: Infinity,
    templates_max: Infinity,
    features: ['*'],
  },
};

function getEffectiveTier(user) {
  if (!user) return 'free';
  const tier = user.subscription_tier || 'free';
  // Check if pro/clinical subscription has expired
  if ((tier === 'pro' || tier === 'clinical') && user.subscription_expires_at) {
    const expires = new Date(user.subscription_expires_at);
    if (expires < new Date()) return 'free';
  }
  return tier;
}

function getTierLimits(tier) {
  return TIERS[tier] || TIERS.free;
}

// Reset monthly counts if a new month has started
function resetMonthlyCountsIfNeeded(db, userId) {
  const user = db.prepare('SELECT scan_count_reset_date, scan_count_month, barcode_count_month FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const thisMonth = new Date().toISOString().slice(0, 7); // "2026-06"
  if (user.scan_count_reset_date !== thisMonth) {
    db.prepare('UPDATE users SET scan_count_month = 0, barcode_count_month = 0, scan_count_reset_date = ? WHERE id = ?')
      .run(thisMonth, userId);
  }
}

// Middleware: check scan limit for free users
function checkScanLimit(req, res, next) {
  const db = getDb();
  resetMonthlyCountsIfNeeded(db, req.userId);
  const user = db.prepare('SELECT subscription_tier, subscription_expires_at, scan_count_month FROM users WHERE id = ?').get(req.userId);
  const tier = getEffectiveTier(user);
  const limits = getTierLimits(tier);
  if (limits.scan_per_month !== Infinity && user.scan_count_month >= limits.scan_per_month) {
    return res.status(402).json({
      error: `You've used all ${limits.scan_per_month} free scans this month.`,
      upgrade_required: true,
      feature: 'scan',
      current_tier: tier,
      limit: limits.scan_per_month,
      used: user.scan_count_month,
    });
  }
  // Increment count after successful scan (attach hook)
  res.on('finish', () => {
    if (res.statusCode === 200) {
      db.prepare('UPDATE users SET scan_count_month = scan_count_month + 1 WHERE id = ?').run(req.userId);
    }
  });
  next();
}

// Middleware: check barcode limit for free users
function checkBarcodeLimit(req, res, next) {
  const db = getDb();
  resetMonthlyCountsIfNeeded(db, req.userId);
  const user = db.prepare('SELECT subscription_tier, subscription_expires_at, barcode_count_month FROM users WHERE id = ?').get(req.userId);
  const tier = getEffectiveTier(user);
  const limits = getTierLimits(tier);
  if (limits.barcode_per_month !== Infinity && user.barcode_count_month >= limits.barcode_per_month) {
    return res.status(402).json({
      error: `You've used all ${limits.barcode_per_month} free barcode lookups this month.`,
      upgrade_required: true,
      feature: 'barcode',
      current_tier: tier,
      limit: limits.barcode_per_month,
      used: user.barcode_count_month,
    });
  }
  res.on('finish', () => {
    if (res.statusCode === 200) {
      db.prepare('UPDATE users SET barcode_count_month = barcode_count_month + 1 WHERE id = ?').run(req.userId);
    }
  });
  next();
}

// Generic feature gate middleware factory
function requireTier(minTier) {
  const tierOrder = { free: 0, pro: 1, clinical: 2 };
  return (req, res, next) => {
    const db = getDb();
    const user = db.prepare('SELECT subscription_tier, subscription_expires_at FROM users WHERE id = ?').get(req.userId);
    const tier = getEffectiveTier(user);
    if ((tierOrder[tier] || 0) < (tierOrder[minTier] || 0)) {
      return res.status(402).json({
        error: `This feature requires a ${minTier} plan.`,
        upgrade_required: true,
        required_tier: minTier,
        current_tier: tier,
      });
    }
    next();
  };
}

module.exports = { checkScanLimit, checkBarcodeLimit, requireTier, getEffectiveTier, getTierLimits, TIERS };
