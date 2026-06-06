const { getDb } = require('../database/db');
const { addDays, today } = require('../utils/date');

function buildSummary(db, userId, to = today()) {
  // Delegate to health.js builder for consistent HTML email output
  // Import lazily to avoid circular dependency
  const { buildWeeklyReport } = require('../routes/health');
  return buildWeeklyReport(db, userId, to);
}

async function sendEmail(to, subject, text, html) {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: 'RESEND_API_KEY missing' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'VitaNudge <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
      html,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Email provider error');
  return { sent: true, body };
}

async function runDueWeeklyEmails() {
  const now = new Date();
  const sendDay = parseInt(process.env.WEEKLY_EMAIL_DAY || '0', 10); // Sunday
  const sendHour = parseInt(process.env.WEEKLY_EMAIL_HOUR || '8', 10);
  if (now.getDay() !== sendDay || now.getHours() !== sendHour) return;

  const currentDate = today();
  const db = getDb();
  const prefs = db.prepare(`
    SELECT * FROM weekly_email_prefs
    WHERE enabled = 1 AND COALESCE(last_sent_date, '') != ?
  `).all(currentDate);

  for (const pref of prefs) {
    const summary = buildSummary(db, pref.user_id, currentDate);
    const email = pref.email || summary.defaultEmail;
    if (!email) continue;
    try {
      await sendEmail(email, summary.subject, summary.body, summary.html);
      db.prepare("UPDATE weekly_email_prefs SET last_sent_date=?, updated_at=datetime('now') WHERE user_id=?")
        .run(currentDate, pref.user_id);
      console.log(`[weekly-email] sent summary to ${email}`);
    } catch (e) {
      console.error('[weekly-email] send failed:', e.message);
    }
  }
}

function startWeeklyEmailScheduler() {
  if (process.env.WEEKLY_EMAIL_SCHEDULER === 'off') return;
  setTimeout(runDueWeeklyEmails, 5000);
  setInterval(runDueWeeklyEmails, 60 * 60 * 1000);
}

module.exports = { startWeeklyEmailScheduler };
