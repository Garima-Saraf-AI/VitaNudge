const router = require('express').Router();
const { getDb } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { addDays, today } = require('../utils/date');

function buildContext(db, userId, from, to) {
  const user = db.prepare('SELECT age, weight_kg, height_cm, condition FROM users WHERE id = ?').get(userId);
  const meals = db.prepare(`
    SELECT log_date, meal_type, food_name, qty, unit, cal, protein_g, fiber_g, carbs_g, fat_g
    FROM meal_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date, logged_at
  `).all(userId, from, to);
  const glucose = db.prepare(`
    SELECT log_date, timing, value_mgdl
    FROM glucose_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date, logged_at
  `).all(userId, from, to);
  const bp = db.prepare(`
    SELECT log_date, systolic, diastolic, pulse
    FROM bp_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date, logged_at
  `).all(userId, from, to);
  const weight = db.prepare(`
    SELECT log_date, weight_kg
    FROM weight_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    ORDER BY log_date
  `).all(userId, from, to);
  return { user, meals, glucose, bp, weight };
}

function localCoachAnswer(question, ctx) {
  const q = question.toLowerCase();
  const highGlucose = ctx.glucose.filter(g => g.value_mgdl >= 180);
  const highCarbDays = ctx.meals.reduce((acc, m) => {
    acc[m.log_date] = (acc[m.log_date] || 0) + (m.carbs_g || 0);
    return acc;
  }, {});
  const topCarbDay = Object.entries(highCarbDays).sort((a, b) => b[1] - a[1])[0];

  if (q.includes('glucose') || q.includes('sugar') || q.includes('high')) {
    return [
      highGlucose.length
        ? `I found ${highGlucose.length} high glucose reading(s), with the highest at ${Math.max(...highGlucose.map(g => g.value_mgdl))} mg/dL.`
        : 'I do not see high glucose readings in the selected range.',
      topCarbDay
        ? `Your highest-carb day was ${topCarbDay[0]} at about ${Math.round(topCarbDay[1])}g carbs. Check meals on that day for rice, roti, packaged snacks, or low-fiber portions.`
        : 'There are not enough meal logs to connect glucose with meals yet.',
      'Try logging meal timing, post-meal glucose at 2 hours, fiber, and walking/activity after meals for a better pattern. This is not medical advice; use it as a discussion aid for your clinician.',
    ].join(' ');
  }

  return [
    `I reviewed ${ctx.meals.length} meal entries and ${ctx.glucose.length} glucose readings in this range.`,
    topCarbDay ? `The most carb-heavy logged day was ${topCarbDay[0]} with about ${Math.round(topCarbDay[1])}g carbs.` : 'Add more meal logs for a stronger pattern.',
    'Ask about a specific meal or day for a sharper answer.',
  ].join(' ');
}

async function callGemini(question, ctx) {
  if (!process.env.GEMINI_API_KEY) return null;
  const model = process.env.GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const prompt = `You are a careful nutrition coach for a diabetic-friendly vegetarian tracker.
Use the user's logs only as clues. Do not diagnose or replace medical advice.
Answer in 4-6 concise bullet points with practical next steps.

User question: ${question}

Logs JSON:
${JSON.stringify(ctx).slice(0, 20000)}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || 'AI coach error');
  return body?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n').trim() || null;
}

router.post('/', authMiddleware, async (req, res) => {
  const { question, from, to } = req.body;
  if (!question || !question.trim()) return res.status(400).json({ error: 'question required' });

  const db = getDb();
  const user = db.prepare('SELECT timezone FROM users WHERE id = ?').get(req.userId);
  const end = to || today(user?.timezone);
  const start = from || addDays(end, -13);
  const context = buildContext(db, req.userId, start, end);

  try {
    const aiAnswer = await callGemini(question.trim(), context);
    if (aiAnswer) return res.json({ answer: aiAnswer, provider: 'gemini', range: { from: start, to: end } });
  } catch (e) {
    console.error('[coach]', e.message);
  }

  res.json({ answer: localCoachAnswer(question.trim(), context), provider: 'local', range: { from: start, to: end } });
});

module.exports = router;
