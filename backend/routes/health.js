const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { addDays, today } = require('../utils/date');

const DEFAULT_GOALS = {
  goal_type: 'glucose',
  activity_level: 'light',
  pace: 'steady',
  carb_style: 'balanced',
  diabetes_status: 'type2',
  target_weight_kg: null,
  target_muscle_gain_kg: 0,
  target_date: '',
  target_summary: '',
  cal: 1700,
  protein_g: 110,
  fiber_g: 35,
  carbs_g: 150,
  water_ml: 3000,
};

function normalizeGoals(goals) {
  return { ...DEFAULT_GOALS, ...(goals || {}) };
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rangeFromDays(days = 30, to = today()) {
  const safeDays = Math.max(1, Math.min(parseInt(days, 10) || 30, 120));
  return { from: addDays(to, -(safeDays - 1)), to, days: safeDays };
}

function buildWeeklyEmailBody(db, userId, to) {
  const user = db.prepare('SELECT name, email, timezone FROM users WHERE id = ?').get(userId);
  const summaryTo = to || today(user?.timezone);
  const { from } = rangeFromDays(7, summaryTo);
  const meals = db.prepare(`
    SELECT COUNT(DISTINCT log_date) as days_logged,
      SUM(cal) as cal, SUM(protein_g) as protein_g, SUM(fiber_g) as fiber_g, SUM(carbs_g) as carbs_g
    FROM meal_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
  `).get(userId, from, summaryTo);
  const water = db.prepare(`
    SELECT AVG(total_ml) as avg_water FROM (
      SELECT log_date, SUM(ml) as total_ml FROM water_logs
      WHERE user_id = ? AND log_date BETWEEN ? AND ?
      GROUP BY log_date
    )
  `).get(userId, from, summaryTo);
  const glucose = db.prepare(`
    SELECT AVG(value_mgdl) as avg_glucose FROM glucose_logs
    WHERE user_id = ? AND log_date BETWEEN ? AND ?
  `).get(userId, from, summaryTo);
  const weight = db.prepare(`
    SELECT weight_kg FROM weight_logs
    WHERE user_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date DESC LIMIT 1
  `).get(userId, from, summaryTo);

  const daysLogged  = meals?.days_logged || 0;
  const divisor     = Math.max(daysLogged, 1);
  const avgCal      = Math.round((meals?.cal       || 0) / divisor);
  const avgProtein  = Math.round(((meals?.protein_g || 0) / divisor) * 10) / 10;
  const avgFiber    = Math.round(((meals?.fiber_g   || 0) / divisor) * 10) / 10;
  const avgCarbs    = Math.round(((meals?.carbs_g   || 0) / divisor) * 10) / 10;
  const avgWater    = Math.round(water?.avg_water   || 0);
  const avgGlucose  = glucose?.avg_glucose ? Math.round(glucose.avg_glucose) : null;
  const latestWeight = weight?.weight_kg || null;
  const firstName   = (user?.name || 'there').split(' ')[0];

  // Consistency score (0–100) based on days logged
  const consistency = Math.round((daysLogged / 7) * 100);
  const consistencyColor  = consistency >= 80 ? '#16a34a' : consistency >= 50 ? '#d97706' : '#dc2626';
  const consistencyLabel  = consistency >= 80 ? '🔥 Great streak!' : consistency >= 50 ? '📈 Keep going!' : '💪 Start fresh this week';

  // Glucose status
  const glucoseStatus = avgGlucose
    ? avgGlucose < 100 ? { label: 'Normal', color: '#16a34a' }
    : avgGlucose < 126 ? { label: 'Pre-diabetic range', color: '#d97706' }
    : { label: 'High — check with doctor', color: '#dc2626' }
    : null;

  const formatDate = (d) => {
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
  };

  const subject = `Your NutriTrack weekly report — ${formatDate(from)} to ${formatDate(summaryTo)}`;

  // ── Plain text fallback ─────────────────────────────────────────
  const text = [
    `Hi ${firstName},`,
    '',
    `Here's your weekly health summary for ${from} to ${summaryTo}.`,
    '',
    `Days tracked      : ${daysLogged}/7  (${consistency}% consistency)`,
    `Avg calories      : ${avgCal} kcal/day`,
    `Avg protein       : ${avgProtein}g/day`,
    `Avg fiber         : ${avgFiber}g/day`,
    `Avg carbs         : ${avgCarbs}g/day`,
    `Avg water         : ${avgWater >= 1000 ? (avgWater/1000).toFixed(1)+'L' : avgWater+'ml'}/day`,
    avgGlucose   ? `Avg glucose       : ${avgGlucose} mg/dL (${glucoseStatus?.label})` : 'Glucose           : not logged this week',
    latestWeight ? `Latest weight     : ${latestWeight} kg`                             : 'Weight            : not logged this week',
    '',
    daysLogged >= 5
      ? 'Excellent consistency this week — keep it up!'
      : daysLogged >= 3
      ? 'Good effort. Tracking 5+ days unlocks better insights.'
      : 'Tip: logging even one meal a day builds the habit.',
    '',
    '— The NutriTrack Team',
    'https://nutritrack.app',
    '',
    'To unsubscribe, turn off email reports in Settings.',
  ].join('\n');

  // ── Inline SVG logo ────────────────────────────────────────────
  // A leaf / heart icon + wordmark — works in all email clients
  const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:10px;">
    <rect width="36" height="36" rx="10" fill="white" fill-opacity="0.2"/>
    <path d="M18 8C18 8 10 13 10 20C10 24.4 13.6 28 18 28C22.4 28 26 24.4 26 20C26 13 18 8 18 8Z" fill="white" fill-opacity="0.9"/>
    <path d="M18 14L18 24M14 19L22 19" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

  // ── Progress bar helper ────────────────────────────────────────
  const progressBar = (pct, color) => {
    const w = Math.min(Math.round(pct), 100);
    return `<div style="background:#e2e8f0;border-radius:999px;height:6px;overflow:hidden;margin-top:6px;">
      <div style="width:${w}%;height:6px;background:${color};border-radius:999px;"></div>
    </div>`;
  };

  // ── Metric row ─────────────────────────────────────────────────
  const metricRow = (icon, label, value, unit, barPct, barColor) => `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="36" style="vertical-align:top;padding-top:2px;">
            <div style="width:32px;height:32px;background:#f8fafc;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">${icon}</div>
          </td>
          <td style="padding-left:12px;vertical-align:top;">
            <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">${label}</div>
            <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-top:1px;">${value}<span style="font-size:13px;font-weight:500;color:#64748b;margin-left:3px;">${unit}</span></div>
            ${barPct !== null ? progressBar(barPct, barColor) : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  // ── HTML email ─────────────────────────────────────────────────
  const motiveLine = daysLogged >= 5
    ? 'Excellent consistency this week. You\'re building a habit that lasts. Keep going! 💪'
    : daysLogged >= 3
    ? 'Good effort this week! Aim for 5+ days next week to unlock deeper insights.'
    : 'Every entry counts. Start with just one meal a day — small steps lead to big results.';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#EEF2F7;-webkit-text-size-adjust:100%;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<!-- OUTER WRAPPER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF2F7;">
<tr><td style="padding:40px 16px 48px;">

  <!-- CARD -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;">

    <!-- ══ LOGO BAR ══ -->
    <tr>
      <td style="padding-bottom:20px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td>
              <!-- Inline SVG icon in a circle -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="width:44px;height:44px;background:linear-gradient(135deg,#10b981,#0ea5e9);border-radius:12px;text-align:center;vertical-align:middle;">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 3C13 3 6 8.5 6 15C6 19.4 9.1 23 13 23C16.9 23 20 19.4 20 15C20 8.5 13 3 13 3Z" fill="white" opacity="0.95"/>
                      <path d="M13 9V18M9 13.5H17" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">NutriTrack</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══ HERO HEADER ══ -->
    <tr>
      <td style="background:linear-gradient(145deg,#0f172a 0%,#1e3a5f 60%,#0e4d3a 100%);border-radius:20px 20px 0 0;padding:40px 36px 36px;text-align:center;">

        <!-- Week badge -->
        <div style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:999px;padding:5px 16px;margin-bottom:20px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500;letter-spacing:0.5px;">WEEKLY REPORT</span>
        </div>

        <!-- Date range -->
        <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
          ${formatDate(from)}
          <span style="font-size:18px;font-weight:400;color:rgba(255,255,255,0.4);margin:0 8px;">→</span>
          ${formatDate(summaryTo)}
        </div>

        <!-- Consistency hero stat -->
        <div style="margin-top:28px;padding:20px;background:rgba(255,255,255,0.07);border-radius:14px;border:1px solid rgba(255,255,255,0.1);">
          <div style="font-size:13px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Days Tracked</div>
          <div style="margin-top:8px;">
            <span style="font-size:52px;font-weight:900;color:#ffffff;letter-spacing:-2px;line-height:1;">${daysLogged}</span>
            <span style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.35);"> / 7</span>
          </div>
          <!-- Day dots -->
          <div style="margin-top:14px;">
            ${Array.from({length:7},(_,i)=>
              `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 3px;background:${i < daysLogged ? '#10b981' : 'rgba(255,255,255,0.15)'};"></span>`
            ).join('')}
          </div>
          <div style="margin-top:10px;font-size:13px;font-weight:600;color:${consistencyColor};">${consistencyLabel}</div>
        </div>

      </td>
    </tr>

    <!-- ══ MAIN BODY ══ -->
    <tr>
      <td style="background:#ffffff;padding:32px 36px 8px;">

        <!-- Greeting -->
        <p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 6px;">Hi ${firstName},</p>
        <p style="font-size:14px;color:#64748b;margin:0 0 28px;line-height:1.7;">
          Here's a full breakdown of your health this week.
          ${daysLogged >= 5 ? 'You\'re on a great streak — your habits are working.' : 'Every day you log is a step in the right direction.'}
        </p>

        <!-- Section label -->
        <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;padding-bottom:10px;border-bottom:2px solid #f1f5f9;">
          Nutrition This Week
        </div>

        <!-- Metrics table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${metricRow('🔥', 'Avg. Daily Calories', avgCal, 'kcal', null, null)}
          ${metricRow('💪', 'Avg. Protein', avgProtein, 'g / day', null, null)}
          ${metricRow('🌾', 'Avg. Fiber', avgFiber, 'g / day', null, null)}
          ${metricRow('🍚', 'Avg. Carbs', avgCarbs, 'g / day', null, null)}
          ${metricRow('💧', 'Avg. Water', avgWater >= 1000 ? (avgWater/1000).toFixed(1) : avgWater, avgWater >= 1000 ? 'L / day' : 'ml / day', null, null)}
        </table>

      </td>
    </tr>

    <!-- ══ HEALTH METRICS ══ -->
    <tr>
      <td style="background:#ffffff;padding:20px 36px 28px;">

        <!-- Section label -->
        <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #f1f5f9;">
          Health Metrics
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <!-- Glucose card -->
            <td style="width:48%;vertical-align:top;padding-right:8px;">
              <div style="background:${avgGlucose ? (glucoseStatus.color === '#16a34a' ? '#f0fdf4' : glucoseStatus.color === '#d97706' ? '#fffbeb' : '#fef2f2') : '#f8fafc'};border-radius:14px;padding:18px 16px;border:1px solid ${avgGlucose ? (glucoseStatus.color === '#16a34a' ? '#bbf7d0' : glucoseStatus.color === '#d97706' ? '#fde68a' : '#fecaca') : '#e2e8f0'};">
                <div style="font-size:20px;margin-bottom:6px;">🩸</div>
                <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;">Avg. Glucose</div>
                <div style="font-size:24px;font-weight:800;color:#0f172a;margin-top:4px;">
                  ${avgGlucose ? avgGlucose : '—'}
                  ${avgGlucose ? '<span style="font-size:13px;font-weight:500;color:#64748b;"> mg/dL</span>' : ''}
                </div>
                ${avgGlucose
                  ? `<div style="font-size:12px;font-weight:600;color:${glucoseStatus.color};margin-top:4px;">${glucoseStatus.label}</div>`
                  : `<div style="font-size:12px;color:#94a3b8;margin-top:4px;">Not logged</div>`}
              </div>
            </td>
            <!-- Weight card -->
            <td style="width:48%;vertical-align:top;padding-left:8px;">
              <div style="background:${latestWeight ? '#f0f9ff' : '#f8fafc'};border-radius:14px;padding:18px 16px;border:1px solid ${latestWeight ? '#bae6fd' : '#e2e8f0'};">
                <div style="font-size:20px;margin-bottom:6px;">⚖️</div>
                <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;">Latest Weight</div>
                <div style="font-size:24px;font-weight:800;color:#0f172a;margin-top:4px;">
                  ${latestWeight ? latestWeight : '—'}
                  ${latestWeight ? '<span style="font-size:13px;font-weight:500;color:#64748b;"> kg</span>' : ''}
                </div>
                <div style="font-size:12px;color:${latestWeight ? '#0284c7' : '#94a3b8'};margin-top:4px;font-weight:600;">
                  ${latestWeight ? 'Logged this week' : 'Not logged'}
                </div>
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- ══ MOTIVATIONAL BANNER ══ -->
    <tr>
      <td style="background:#ffffff;padding:0 36px 32px;">
        <div style="background:linear-gradient(135deg,#ecfdf5 0%,#eff6ff 100%);border-radius:14px;padding:20px 22px;border-left:4px solid #10b981;">
          <p style="font-size:14px;color:#0f4c35;margin:0;line-height:1.7;font-weight:500;">
            ${motiveLine}
          </p>
        </div>
      </td>
    </tr>

    <!-- ══ CTA BUTTON ══ -->
    <tr>
      <td style="background:#ffffff;padding:0 36px 36px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#0ea5e9 100%);border-radius:12px;padding:1px;">
              <a href="https://nutritrack.app"
                 style="display:block;background:linear-gradient(135deg,#10b981 0%,#0ea5e9 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:11px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                Open NutriTrack &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin:14px 0 0;">
          Track your meals, water, and health metrics every day.
        </p>
      </td>
    </tr>

    <!-- ══ DIVIDER ══ -->
    <tr>
      <td style="background:#ffffff;padding:0 36px;">
        <div style="height:1px;background:#f1f5f9;"></div>
      </td>
    </tr>

    <!-- ══ FOOTER ══ -->
    <tr>
      <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:24px 36px 28px;text-align:center;">
        <!-- Footer logo -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
          <tr>
            <td style="width:24px;height:24px;background:linear-gradient(135deg,#10b981,#0ea5e9);border-radius:7px;text-align:center;vertical-align:middle;">
              <svg width="14" height="14" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3C13 3 6 8.5 6 15C6 19.4 9.1 23 13 23C16.9 23 20 19.4 20 15C20 8.5 13 3 13 3Z" fill="white" opacity="0.95"/>
              </svg>
            </td>
            <td style="padding-left:7px;vertical-align:middle;">
              <span style="font-size:13px;font-weight:700;color:#475569;">NutriTrack</span>
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;line-height:1.6;">
          You're receiving this because you enabled weekly reports.
        </p>
        <p style="font-size:12px;color:#94a3b8;margin:0 0 16px;">
          <a href="https://nutritrack.app/profile" style="color:#10b981;text-decoration:none;font-weight:500;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="https://nutritrack.app" style="color:#94a3b8;text-decoration:none;">nutritrack.app</a>
        </p>
        <p style="font-size:11px;color:#cbd5e1;margin:0;">
          © 2026 NutriTrack &nbsp;·&nbsp; Built with care for your health
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>`;

  return { subject, body: text, html, email: user?.email || '' };
}

// ── WATER ──
router.get('/water', authMiddleware, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const db = getDb();
  const logs = db.prepare('SELECT * FROM water_logs WHERE user_id = ? AND log_date = ? ORDER BY logged_at').all(req.userId, date);
  const total = logs.reduce((s, l) => s + l.ml, 0);
  res.json({ date, logs, total_ml: total });
});

router.get('/water/range', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  const db = getDb();
  const data = db.prepare(`
    SELECT log_date, SUM(ml) as total_ml FROM water_logs
    WHERE user_id = ? AND log_date BETWEEN ? AND ? GROUP BY log_date ORDER BY log_date
  `).all(req.userId, from, to);
  res.json({ data });
});

router.post('/water', authMiddleware, (req, res) => {
  const { ml, log_date } = req.body;
  if (!ml || !log_date) return res.status(400).json({ error: 'ml and log_date required' });

  // BUG-03 fix: reject zero or negative ml
  if (parseFloat(ml) <= 0)
    return res.status(400).json({ error: 'ml must be greater than 0' });
  const db = getDb();
  const id = uuidv4();
  const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  db.prepare('INSERT INTO water_logs (id, user_id, log_date, ml) VALUES (?, ?, ?, ?)').run(id, req.userId, log_date, ml);
  const entry = db.prepare('SELECT * FROM water_logs WHERE id = ?').get(id);
  res.status(201).json({ entry });
});

router.delete('/water/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const e = db.prepare('SELECT * FROM water_logs WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  if (e.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM water_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── GLUCOSE ──
router.get('/glucose', authMiddleware, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const db = getDb();
  const logs = db.prepare('SELECT * FROM glucose_logs WHERE user_id = ? AND log_date = ? ORDER BY logged_at').all(req.userId, date);
  res.json({ date, logs });
});

router.get('/glucose/range', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  const db = getDb();
  const data = db.prepare(`
    SELECT log_date, AVG(value_mgdl) as avg_glucose,
      AVG(CASE WHEN timing IN ('fasting','pre-breakfast') THEN value_mgdl END) as avg_fasting,
      AVG(CASE WHEN timing LIKE 'post%' THEN value_mgdl END) as avg_post_meal,
      COUNT(*) as readings
    FROM glucose_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    GROUP BY log_date ORDER BY log_date
  `).all(req.userId, from, to);
  res.json({ data });
});

router.post('/glucose', authMiddleware, (req, res) => {
  const { value_mgdl, timing, log_date } = req.body;
  if (!value_mgdl || !log_date) return res.status(400).json({ error: 'value_mgdl and log_date required' });
  if (value_mgdl < 40 || value_mgdl > 600) return res.status(400).json({ error: 'Value must be 40-600 mg/dL' });
  // BUG-08 fix: validate timing enum
  const VALID_TIMINGS = new Set(['fasting', 'pre-breakfast', 'pre-lunch', 'pre-dinner', 'post_meal', 'post-breakfast', 'post-lunch', 'post-dinner', 'bedtime', 'random']);
  if (timing && !VALID_TIMINGS.has(timing))
    return res.status(400).json({ error: 'timing must be one of: fasting, pre-breakfast, pre-lunch, pre-dinner, post_meal, post-breakfast, post-lunch, post-dinner, bedtime, random' });
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO glucose_logs (id, user_id, log_date, value_mgdl, timing) VALUES (?, ?, ?, ?, ?)').run(id, req.userId, log_date, value_mgdl, timing || 'fasting');
  const entry = db.prepare('SELECT * FROM glucose_logs WHERE id = ?').get(id);
  res.status(201).json({ entry });
});

router.delete('/glucose/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const e = db.prepare('SELECT * FROM glucose_logs WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  if (e.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM glucose_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── WEIGHT ──
router.get('/weight/range', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  const db = getDb();
  const data = db.prepare(`
    SELECT * FROM weight_logs
    WHERE user_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date
  `).all(req.userId, from, to);
  res.json({ data });
});

router.get('/weight', authMiddleware, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const db = getDb();
  const entry = db.prepare('SELECT * FROM weight_logs WHERE user_id = ? AND log_date = ?').get(req.userId, date);
  res.json({ date, entry: entry || null });
});

router.post('/weight', authMiddleware, (req, res) => {
  const { weight_kg, log_date, notes } = req.body;
  const weight = parseFloat(weight_kg);
  if (!weight || !log_date) return res.status(400).json({ error: 'weight_kg and log_date required' });
  if (weight < 20 || weight > 400) return res.status(400).json({ error: 'Weight must be 20-400 kg' });

  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO weight_logs (id, user_id, log_date, weight_kg, notes)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, log_date) DO UPDATE SET
      weight_kg=excluded.weight_kg, notes=excluded.notes, logged_at=datetime('now')
  `).run(id, req.userId, log_date, weight, notes || '');
  const entry = db.prepare('SELECT * FROM weight_logs WHERE user_id = ? AND log_date = ?').get(req.userId, log_date);
  res.status(201).json({ entry });
});

router.delete('/weight/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM weight_logs WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  if (entry.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM weight_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── HBA1C ──
router.get('/a1c/range', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  const db = getDb();
  const data = db.prepare(`
    SELECT * FROM a1c_logs
    WHERE user_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date
  `).all(req.userId, from || '1900-01-01', to || '2999-12-31');
  res.json({ data });
});

router.post('/a1c', authMiddleware, (req, res) => {
  const { value_pct, log_date, notes } = req.body;
  const value = parseFloat(value_pct);
  if (!value || !log_date) return res.status(400).json({ error: 'value_pct and log_date required' });
  if (value < 3 || value > 16) return res.status(400).json({ error: 'HbA1c must be 3-16%' });
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO a1c_logs (id, user_id, log_date, value_pct, notes) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.userId, log_date, value, notes || '');
  const entry = db.prepare('SELECT * FROM a1c_logs WHERE id = ?').get(id);
  res.status(201).json({ entry });
});

router.delete('/a1c/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM a1c_logs WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  if (entry.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM a1c_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── BLOOD PRESSURE ──
router.get('/bp', authMiddleware, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const db = getDb();
  const logs = db.prepare('SELECT * FROM bp_logs WHERE user_id = ? AND log_date = ? ORDER BY logged_at').all(req.userId, date);
  res.json({ date, logs });
});

router.get('/bp/range', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  const db = getDb();
  const data = db.prepare(`
    SELECT log_date, AVG(systolic) as avg_systolic, AVG(diastolic) as avg_diastolic,
      AVG(pulse) as avg_pulse, COUNT(*) as readings
    FROM bp_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    GROUP BY log_date ORDER BY log_date
  `).all(req.userId, from || addDays(today(), -29), to || today());
  res.json({ data });
});

router.post('/bp', authMiddleware, (req, res) => {
  const { systolic, diastolic, pulse, log_date, notes } = req.body;
  const sys = parseInt(systolic, 10);
  const dia = parseInt(diastolic, 10);
  const pls = pulse === '' || pulse === undefined ? null : parseInt(pulse, 10);
  if (!sys || !dia || !log_date) return res.status(400).json({ error: 'systolic, diastolic and log_date required' });
  if (sys < 70 || sys > 260 || dia < 40 || dia > 160) return res.status(400).json({ error: 'Blood pressure value out of range' });
  if (pls && (pls < 30 || pls > 220)) return res.status(400).json({ error: 'Pulse must be 30-220' });
  // BUG-04 fix: diastolic must always be less than systolic
  if (dia >= sys) return res.status(400).json({ error: 'Diastolic pressure must be less than systolic pressure' });
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO bp_logs (id, user_id, log_date, systolic, diastolic, pulse, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.userId, log_date, sys, dia, pls, notes || '');
  const entry = db.prepare('SELECT * FROM bp_logs WHERE id = ?').get(id);
  res.status(201).json({ entry });
});

router.delete('/bp/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM bp_logs WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  if (entry.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM bp_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── MEDICATIONS ──
router.get('/medications', authMiddleware, (req, res) => {
  const db = getDb();
  const meds = db.prepare('SELECT * FROM medications WHERE user_id = ? ORDER BY active DESC, time_of_day, name').all(req.userId);
  res.json({ medications: meds });
});

router.post('/medications', authMiddleware, (req, res) => {
  const { name, dose, time_of_day, notes, active = 1 } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Medication name required' });
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO medications (id, user_id, name, dose, time_of_day, notes, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, name.trim(), dose || '', time_of_day || '', notes || '', active ? 1 : 0);
  const medication = db.prepare('SELECT * FROM medications WHERE id = ?').get(id);
  res.status(201).json({ medication });
});

router.put('/medications/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  const { name, dose, time_of_day, notes, active } = req.body;
  db.prepare(`
    UPDATE medications SET name=?, dose=?, time_of_day=?, notes=?, active=?, updated_at=datetime('now')
    WHERE id=?
  `).run(name || existing.name, dose || '', time_of_day || '', notes || '', active ? 1 : 0, req.params.id);
  const medication = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  res.json({ medication });
});

router.delete('/medications/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM medications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/medications/logs', authMiddleware, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const db = getDb();
  const logs = db.prepare(`
    SELECT ml.*, m.name, m.dose, m.time_of_day
    FROM medication_logs ml
    JOIN medications m ON m.id = ml.medication_id
    WHERE ml.user_id = ? AND ml.log_date = ?
    ORDER BY m.time_of_day, m.name
  `).all(req.userId, date);
  res.json({ date, logs });
});

router.post('/medications/:id/taken', authMiddleware, (req, res) => {
  const { log_date, status = 'taken' } = req.body;
  if (!log_date) return res.status(400).json({ error: 'log_date required' });
  const db = getDb();
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });
  if (med.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  // BUG-06 fix: check for existing log entry first — idempotent (one log per day)
  const existing = db.prepare(`
    SELECT ml.*, m.name, m.dose, m.time_of_day
    FROM medication_logs ml JOIN medications m ON m.id = ml.medication_id
    WHERE ml.user_id = ? AND ml.medication_id = ? AND ml.log_date = ?
  `).get(req.userId, med.id, log_date);
  if (existing) return res.status(200).json({ entry: existing, already_logged: true });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO medication_logs (id, user_id, medication_id, log_date, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.userId, med.id, log_date, status);
  const entry = db.prepare(`
    SELECT ml.*, m.name, m.dose, m.time_of_day
    FROM medication_logs ml JOIN medications m ON m.id = ml.medication_id
    WHERE ml.id = ?
  `).get(id);
  res.status(201).json({ entry });
});

router.delete('/medication-logs/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM medication_logs WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  if (entry.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM medication_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── GOALS ──
router.get('/goals', authMiddleware, (req, res) => {
  const db = getDb();
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').get(req.userId);
  res.json({ goals: normalizeGoals(goals) });
});

router.put('/goals', authMiddleware, (req, res) => {
  // BUG-09 fix: reject negative calorie/macro goals
  const rawCal = req.body.cal, rawProt = req.body.protein_g, rawFib = req.body.fiber_g, rawCarbs = req.body.carbs_g;
  if (rawCal  !== undefined && Number(rawCal)  < 0) return res.status(400).json({ error: 'Calorie goal cannot be negative' });
  if (rawProt !== undefined && Number(rawProt) < 0) return res.status(400).json({ error: 'Protein goal cannot be negative' });
  if (rawFib  !== undefined && Number(rawFib)  < 0) return res.status(400).json({ error: 'Fiber goal cannot be negative' });
  if (rawCarbs!== undefined && Number(rawCarbs)< 0) return res.status(400).json({ error: 'Carbs goal cannot be negative' });

  const current = normalizeGoals(req.body);
  const goal_type = current.goal_type || DEFAULT_GOALS.goal_type;
  const activity_level = current.activity_level || DEFAULT_GOALS.activity_level;
  const pace = current.pace || DEFAULT_GOALS.pace;
  const carb_style = current.carb_style || DEFAULT_GOALS.carb_style;
  const diabetes_status = ['type2', 'prediabetic', 'none'].includes(current.diabetes_status)
    ? current.diabetes_status
    : DEFAULT_GOALS.diabetes_status;
  const target_weight_kg = current.target_weight_kg === '' || current.target_weight_kg == null
    ? null
    : toNumber(current.target_weight_kg, null);
  const target_muscle_gain_kg = toNumber(current.target_muscle_gain_kg, 0);
  const target_date = current.target_date || '';
  const target_summary = current.target_summary || '';
  const cal = Math.round(toNumber(current.cal, DEFAULT_GOALS.cal));
  const protein_g = toNumber(current.protein_g, DEFAULT_GOALS.protein_g);
  const fiber_g = toNumber(current.fiber_g, DEFAULT_GOALS.fiber_g);
  const carbs_g = toNumber(current.carbs_g, DEFAULT_GOALS.carbs_g);
  const water_ml = Math.round(toNumber(current.water_ml, DEFAULT_GOALS.water_ml));
  const db = getDb();
  const existing = db.prepare('SELECT id FROM goals WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare(`
      UPDATE goals SET goal_type=?, activity_level=?, pace=?, carb_style=?, diabetes_status=?,
        target_weight_kg=?, target_muscle_gain_kg=?, target_date=?, target_summary=?,
        cal=?, protein_g=?, fiber_g=?, carbs_g=?, water_ml=?, updated_at=datetime('now')
      WHERE user_id=?
    `).run(goal_type, activity_level, pace, carb_style, diabetes_status, target_weight_kg, target_muscle_gain_kg, target_date, target_summary, cal, protein_g, fiber_g, carbs_g, water_ml, req.userId);
  } else {
    db.prepare(`
      INSERT INTO goals (
        id, user_id, goal_type, activity_level, pace, carb_style, diabetes_status,
        target_weight_kg, target_muscle_gain_kg, target_date, target_summary,
        cal, protein_g, fiber_g, carbs_g, water_ml
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.userId, goal_type, activity_level, pace, carb_style, diabetes_status, target_weight_kg, target_muscle_gain_kg, target_date, target_summary, cal, protein_g, fiber_g, carbs_g, water_ml);
  }
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').get(req.userId);
  res.json({ goals: normalizeGoals(goals) });
});

router.delete('/goals', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM goals WHERE user_id = ?').run(req.userId);
  res.json({ success: true, message: 'Goal deleted successfully' });
});

// ── DASHBOARD SUMMARY ──
router.get('/summary', authMiddleware, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const db = getDb();

  const meals = db.prepare(`
    SELECT SUM(cal) as cal, SUM(protein_g) as protein_g, SUM(fiber_g) as fiber_g, SUM(carbs_g) as carbs_g
    FROM meal_logs WHERE user_id = ? AND log_date = ?
  `).get(req.userId, date);

  const water = db.prepare(`SELECT SUM(ml) as total FROM water_logs WHERE user_id = ? AND log_date = ?`).get(req.userId, date);
  const glucose = db.prepare(`SELECT AVG(value_mgdl) as avg FROM glucose_logs WHERE user_id = ? AND log_date = ?`).get(req.userId, date);
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').get(req.userId);

  res.json({
    date,
    totals: { cal: meals?.cal || 0, protein_g: meals?.protein_g || 0, fiber_g: meals?.fiber_g || 0, carbs_g: meals?.carbs_g || 0 },
    water_ml: water?.total || 0,
    avg_glucose: glucose?.avg ? Math.round(glucose.avg) : null,
    goals: normalizeGoals(goals),
  });
});

// ── 30-DAY DOCTOR REPORT ──
router.get('/report', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, age, weight_kg, height_cm, condition, timezone FROM users WHERE id = ?').get(req.userId);
  const { days, to } = req.query;
  const range = rangeFromDays(days || 30, to || today(user?.timezone));

  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').get(req.userId);
  const meals = db.prepare(`
    SELECT log_date,
      SUM(cal) as cal, SUM(protein_g) as protein_g, SUM(fiber_g) as fiber_g, SUM(carbs_g) as carbs_g,
      COUNT(*) as entries
    FROM meal_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    GROUP BY log_date ORDER BY log_date
  `).all(req.userId, range.from, range.to);
  const water = db.prepare(`
    SELECT log_date, SUM(ml) as total_ml
    FROM water_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    GROUP BY log_date ORDER BY log_date
  `).all(req.userId, range.from, range.to);
  const glucose = db.prepare(`
    SELECT log_date, AVG(value_mgdl) as avg_glucose,
      AVG(CASE WHEN timing IN ('fasting','pre-breakfast') THEN value_mgdl END) as avg_fasting,
      AVG(CASE WHEN timing LIKE 'post%' THEN value_mgdl END) as avg_post_meal,
      COUNT(*) as readings
    FROM glucose_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    GROUP BY log_date ORDER BY log_date
  `).all(req.userId, range.from, range.to);
  const weight = db.prepare(`
    SELECT * FROM weight_logs WHERE user_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date
  `).all(req.userId, range.from, range.to);
  const bp = db.prepare(`
    SELECT log_date, AVG(systolic) as avg_systolic, AVG(diastolic) as avg_diastolic, AVG(pulse) as avg_pulse, COUNT(*) as readings
    FROM bp_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    GROUP BY log_date ORDER BY log_date
  `).all(req.userId, range.from, range.to);
  const a1c = db.prepare(`
    SELECT * FROM a1c_logs WHERE user_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date
  `).all(req.userId, range.from, range.to);
  const medicationLogs = db.prepare(`
    SELECT m.name, m.dose, COUNT(ml.id) as taken_count
    FROM medications m
    LEFT JOIN medication_logs ml ON ml.medication_id = m.id AND ml.log_date BETWEEN ? AND ?
    WHERE m.user_id = ?
    GROUP BY m.id ORDER BY m.name
  `).all(range.from, range.to, req.userId);

  res.json({
    range,
    generated_at: new Date().toISOString(),
    user,
    goals: normalizeGoals(goals),
    meals,
    water,
    glucose,
    weight,
    bp,
    a1c,
    medication_logs: medicationLogs,
  });
});

// ── WEEKLY EMAIL SUMMARY ──
router.get('/weekly-email', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
  const pref = db.prepare('SELECT * FROM weekly_email_prefs WHERE user_id = ?').get(req.userId);
  res.json({ preferences: pref || { enabled: 0, email: user?.email || '', last_sent_date: null } });
});

router.put('/weekly-email', authMiddleware, (req, res) => {
  const { enabled } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
  db.prepare(`
    INSERT INTO weekly_email_prefs (user_id, enabled, email, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      enabled=excluded.enabled, email=excluded.email, updated_at=datetime('now')
  `).run(req.userId, enabled ? 1 : 0, user?.email || '');
  const preferences = db.prepare('SELECT * FROM weekly_email_prefs WHERE user_id = ?').get(req.userId);
  res.json({ preferences });
});

router.post('/weekly-email/send', authMiddleware, async (req, res) => {
  const db = getDb();
  const pref = db.prepare('SELECT * FROM weekly_email_prefs WHERE user_id = ?').get(req.userId);
  const summary = buildWeeklyEmailBody(db, req.userId);
  const email = req.body.email || pref?.email || summary.email;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  if (!process.env.RESEND_API_KEY) {
    return res.json({
      sent: false,
      provider: 'not_configured',
      message: 'Email sending is not connected yet. Configure RESEND_API_KEY to send automatically, or use the subject/body below manually.',
      subject: summary.subject,
      body: summary.body,
      email,
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'VitaNudge <onboarding@resend.dev>',
        to: [email],
        subject: summary.subject,
        text: summary.body,
        html: summary.html,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(502).json({ error: body.message || 'Email provider error' });
    res.json({ sent: true, provider: 'resend', response: body });
  } catch (e) {
    res.status(502).json({ error: e.message || 'Email send failed' });
  }
});

// ── STEPS ─────────────────────────────────────────────
router.get('/steps', authMiddleware, (req, res) => {
  const db = getDb();
  const { date } = req.query;
  const row = date
    ? db.prepare('SELECT * FROM steps_logs WHERE user_id=? AND log_date=?').get(req.userId, date)
    : db.prepare('SELECT * FROM steps_logs WHERE user_id=? ORDER BY log_date DESC LIMIT 1').get(req.userId);
  res.json({ log: row || null, steps: row?.steps || 0 });
});

router.get('/steps/range', authMiddleware, (req, res) => {
  const db = getDb();
  const { from, to } = req.query;
  const rows = db.prepare('SELECT * FROM steps_logs WHERE user_id=? AND log_date BETWEEN ? AND ? ORDER BY log_date').all(req.userId, from, to);
  res.json({ data: rows });
});

router.post('/steps', authMiddleware, (req, res) => {
  const { steps, log_date, source = 'manual' } = req.body;
  const db = getDb();
  const s = Number(steps);
  if (!Number.isInteger(s) || s < 0 || s > 100000) return res.status(400).json({ error: 'Steps must be 0–100000' });
  const date = log_date || today();
  db.prepare(`INSERT INTO steps_logs (id,user_id,log_date,steps,source)
    VALUES (?,?,?,?,?) ON CONFLICT(user_id,log_date) DO UPDATE SET steps=excluded.steps, source=excluded.source, logged_at=datetime('now')`)
    .run(uuidv4(), req.userId, date, s, source);
  res.json({ ok: true });
});

router.delete('/steps/:date', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM steps_logs WHERE user_id=? AND log_date=?').run(req.userId, req.params.date);
  res.json({ ok: true });
});

// ── WELLBEING ──────────────────────────────────────────
router.get('/wellbeing', authMiddleware, (req, res) => {
  const db = getDb();
  const { date } = req.query;
  const row = date
    ? db.prepare('SELECT * FROM wellbeing_logs WHERE user_id=? AND log_date=?').get(req.userId, date)
    : null;
  res.json({ log: row || null });
});

router.get('/wellbeing/range', authMiddleware, (req, res) => {
  const db = getDb();
  const { from, to } = req.query;
  const rows = db.prepare('SELECT * FROM wellbeing_logs WHERE user_id=? AND log_date BETWEEN ? AND ? ORDER BY log_date').all(req.userId, from, to);
  res.json({ data: rows });
});

router.post('/wellbeing', authMiddleware, (req, res) => {
  const { status, notes = '', log_date } = req.body;
  const allowed = ['fine', 'tired', 'unwell', 'hypo', 'sick'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const db = getDb();
  const date = log_date || today();
  db.prepare(`INSERT INTO wellbeing_logs (id,user_id,log_date,status,notes)
    VALUES (?,?,?,?,?) ON CONFLICT(user_id,log_date) DO UPDATE SET status=excluded.status, notes=excluded.notes, logged_at=datetime('now')`)
    .run(uuidv4(), req.userId, date, status, notes);
  res.json({ ok: true });
});

module.exports = router;
module.exports.buildWeeklyReport = buildWeeklyEmailBody;
