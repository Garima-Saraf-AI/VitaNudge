const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const FOOD_CATEGORIES = new Set(['custom', 'protein', 'dairy', 'legume', 'grain', 'veg', 'fruit', 'snack', 'beverage']);
const FOOD_UNITS = new Set(['g', 'ml', 'piece', 'serving']);

function extractJSON(text = '') {
  try { return JSON.parse(text); } catch {}
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response did not include JSON');
  return JSON.parse(match[0]);
}

function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function hasCompleteNutrition(food = {}) {
  return ['cal', 'protein_g', 'fiber_g', 'carbs_g', 'fat_g'].every(key => {
    if (!(key in food)) return false;
    if (food[key] === '' || food[key] === null || food[key] === undefined) return false;
    const value = Number(food[key]);
    return Number.isFinite(value) && value >= 0;
  });
}

function findDuplicateFood(db, userId, name, excludeId = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  return db.prepare(`
    SELECT id, name, is_default FROM foods
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
      AND (is_default = 1 OR user_id = ?)
      AND id <> ?
    LIMIT 1
  `).get(trimmed, userId, excludeId || '');
}

function isVagueServing(value = '') {
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  return !normalized || ['1 serving', 'one serving', 'serving', '1 serve', 'one serve', 'not specified'].includes(normalized);
}

function concreteServing(value, baseAmount, baseUnit) {
  const serving = String(value || '').trim();
  if (!isVagueServing(serving)) return serving;
  if (baseUnit === 'g') return `${baseAmount}g`;
  if (baseUnit === 'ml') return `${baseAmount}ml`;
  if (baseUnit === 'piece') return `${baseAmount === 1 ? '1 piece' : `${baseAmount} pieces`}`;
  return '1 portion (approx 250g)';
}

function cleanEstimate(raw, fallbackName, fallbackServing) {
  let baseUnit = FOOD_UNITS.has(raw.base_unit) ? raw.base_unit : 'serving';
  const category = FOOD_CATEGORIES.has(raw.category) ? raw.category : 'custom';
  let baseAmount = Math.max(1, Number(raw.base_amount) || (baseUnit === 'serving' || baseUnit === 'piece' ? 1 : 100));
  const rawServing = raw.serving || fallbackServing;

  if (baseUnit === 'serving' && isVagueServing(rawServing)) {
    baseUnit = 'g';
    baseAmount = 250;
  }

  return {
    name: String(raw.name || fallbackName).trim(),
    category,
    base_unit: baseUnit,
    base_amount: baseAmount,
    serving: concreteServing(rawServing, baseAmount, baseUnit),
    cal: Math.max(0, Math.round(Number(raw.cal) || Number(raw.calories) || 0)),
    protein_g: round1(raw.protein_g),
    fiber_g: round1(raw.fiber_g),
    carbs_g: round1(raw.carbs_g),
    fat_g: round1(raw.fat_g),
    gi: ['low', 'medium', 'high', 'unknown'].includes(raw.gi) ? raw.gi : 'unknown',
  };
}

function localEstimate(name, serving = '') {
  const text = `${name} ${serving}`.toLowerCase();
  const matches = [
    { keys: ['paneer'], food: { category: 'dairy', base_unit: 'g', base_amount: 100, serving: '100g', cal: 265, protein_g: 18, fiber_g: 0, carbs_g: 6, fat_g: 20, gi: 'low' } },
    { keys: ['tofu'], food: { category: 'protein', base_unit: 'g', base_amount: 100, serving: '100g', cal: 95, protein_g: 10, fiber_g: 1, carbs_g: 2, fat_g: 6, gi: 'low' } },
    { keys: ['chicken'], food: { category: 'protein', base_unit: 'g', base_amount: 100, serving: '100g cooked', cal: 165, protein_g: 31, fiber_g: 0, carbs_g: 0, fat_g: 4, gi: 'low' } },
    { keys: ['egg'], food: { category: 'protein', base_unit: 'piece', base_amount: 1, serving: '1 large egg (approx 50g)', cal: 72, protein_g: 6.3, fiber_g: 0, carbs_g: 0.4, fat_g: 4.8, gi: 'low' } },
    { keys: ['rice'], food: { category: 'grain', base_unit: 'g', base_amount: 100, serving: '100g cooked', cal: 130, protein_g: 2.7, fiber_g: 0.4, carbs_g: 28, fat_g: 0.3, gi: 'medium' } },
    { keys: ['roti', 'chapati'], food: { category: 'grain', base_unit: 'piece', base_amount: 1, serving: '1 medium roti (approx 40g)', cal: 120, protein_g: 3.5, fiber_g: 3, carbs_g: 22, fat_g: 3, gi: 'medium' } },
    { keys: ['dal', 'lentil'], food: { category: 'legume', base_unit: 'g', base_amount: 100, serving: '100g cooked', cal: 116, protein_g: 9, fiber_g: 8, carbs_g: 20, fat_g: 0.4, gi: 'low' } },
    { keys: ['oats'], food: { category: 'grain', base_unit: 'g', base_amount: 40, serving: '40g dry oats', cal: 150, protein_g: 5, fiber_g: 4, carbs_g: 27, fat_g: 3, gi: 'medium' } },
    { keys: ['banana'], food: { category: 'fruit', base_unit: 'piece', base_amount: 1, serving: '1 medium banana (approx 118g)', cal: 105, protein_g: 1.3, fiber_g: 3.1, carbs_g: 27, fat_g: 0.4, gi: 'medium' } },
    { keys: ['apple'], food: { category: 'fruit', base_unit: 'piece', base_amount: 1, serving: '1 medium apple (approx 180g)', cal: 95, protein_g: 0.5, fiber_g: 4.4, carbs_g: 25, fat_g: 0.3, gi: 'low' } },
    { keys: ['milk'], food: { category: 'dairy', base_unit: 'ml', base_amount: 240, serving: '1 cup (240ml)', cal: 150, protein_g: 8, fiber_g: 0, carbs_g: 12, fat_g: 8, gi: 'low' } },
    { keys: ['yogurt', 'curd'], food: { category: 'dairy', base_unit: 'g', base_amount: 100, serving: '100g plain', cal: 61, protein_g: 3.5, fiber_g: 0, carbs_g: 4.7, fat_g: 3.3, gi: 'low' } },
  ];

  const found = matches.find(item => item.keys.some(key => text.includes(key)));
  const food = found?.food || {
    category: 'custom',
    base_unit: 'g',
    base_amount: 250,
    serving: isVagueServing(serving) ? '1 portion (approx 250g)' : serving,
    cal: 300,
    protein_g: 10,
    fiber_g: 5,
    carbs_g: 40,
    fat_g: 12,
    gi: 'unknown',
  };

  return {
    food: cleanEstimate({ name, ...food }, name, serving),
    provider: 'local-estimate',
    confidence: found ? 'medium' : 'low',
    assumptions: found
      ? ['Matched a common food profile from the local estimate table.', 'Actual values can vary by recipe, brand, oil, and portion size.']
      : ['Used a generic mixed-meal estimate because no close local match was found.', 'Review and adjust before saving.'],
  };
}

async function callGeminiFoodEstimate({ name, serving, categoryHint }) {
  if (!process.env.GEMINI_API_KEY) return null;

  const model = process.env.GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const prompt = `Estimate nutrition for a food library entry.
Return JSON only. Do not include markdown.

Food name: ${name}
Serving or portion context: ${serving || 'not specified'}
Category hint: ${categoryHint || 'not specified'}

Use common consumer nutrition references and typical home-cooked portions when exact brand data is unavailable.
Values must represent the base amount or serving you return.
Never return a vague serving like "1 serving". If the user gives no clear amount, infer a practical household portion and include an approximate weight or volume, such as "1 bowl (approx 250g)", "1 medium roti (approx 40g)", "1 cup (240ml)", or "100g cooked".
Prefer base_unit g, ml, or piece. Use base_unit serving only when the serving text still includes a clear approximate gram/ml amount.
Allowed category values: custom, protein, dairy, legume, grain, veg, fruit, snack, beverage.
Allowed base_unit values: g, ml, piece, serving.
Allowed gi values: low, medium, high, unknown.

JSON shape:
{
  "name": "normalized food name",
  "category": "custom",
  "base_unit": "g",
  "base_amount": 100,
  "serving": "100g",
  "cal": 0,
  "protein_g": 0,
  "fiber_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "gi": "unknown",
  "confidence": "low|medium|high",
  "assumptions": ["short assumption"]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.15, maxOutputTokens: 500 },
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || 'AI estimate error');

  const text = body?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  const parsed = extractJSON(text);
  return {
    food: cleanEstimate(parsed, name, serving),
    provider: 'gemini',
    confidence: parsed.confidence || 'medium',
    assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.slice(0, 4) : [],
  };
}

// GET /api/foods — all default + user custom
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { search, category, sort = 'name' } = req.query;
  const sortMap = { name: 'f.name', cal: 'f.cal DESC', protein: 'f.protein_g DESC', fiber: 'f.fiber_g DESC' };
  const orderBy = sortMap[sort] || 'f.name';

  let query = `
    SELECT * FROM foods f
    WHERE (f.is_default = 1 OR f.user_id = ?)
  `;
  const params = [req.userId];

  if (search) {
    query += ` AND f.name LIKE ?`;
    params.push(`%${search}%`);
  }
  if (category && category !== 'all') {
    query += ` AND f.category = ?`;
    params.push(category);
  }
  query += ` ORDER BY f.is_default DESC, ${orderBy}`;

  const foods = db.prepare(query).all(...params);
  res.json({ foods });
});

// POST /api/foods/estimate — estimate nutrition from food name
router.post('/estimate', authMiddleware, async (req, res) => {
  const { name, serving, categoryHint } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Food name is required' });

  const request = {
    name: String(name).trim(),
    serving: String(serving || '').trim(),
    categoryHint: String(categoryHint || '').trim(),
  };

  try {
    const aiEstimate = await callGeminiFoodEstimate(request);
    if (aiEstimate) return res.json({ ...aiEstimate, estimated: true });
  } catch (e) {
    console.error('[foods/estimate]', e.message);
  }

  res.json({ ...localEstimate(request.name, request.serving), estimated: true });
});

// POST /api/foods — create custom food
router.post('/', authMiddleware, (req, res) => {
  const { name, category, base_unit, base_amount, serving, cal, protein_g, fiber_g, carbs_g, fat_g, gi, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Food name is required' });
  // BUG-05 fix: enforce maximum food name length
  if (String(name).trim().length > 100) return res.status(400).json({ error: 'Food name must be 100 characters or fewer' });
  if (!hasCompleteNutrition({ cal, protein_g, fiber_g, carbs_g, fat_g })) {
    return res.status(400).json({ error: 'Add all before saving. Use AI estimate if you do not know the values.' });
  }

  const db = getDb();
  const duplicate = findDuplicateFood(db, req.userId, name);
  if (duplicate) return res.status(409).json({ error: 'This food is already in your library' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO foods (id, user_id, name, category, base_unit, base_amount, serving, cal, protein_g, fiber_g, carbs_g, fat_g, gi, notes, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(id, req.userId, name, category||'custom', base_unit||'g', base_amount||100, serving||'', cal||0, protein_g||0, fiber_g||0, carbs_g||0, fat_g||0, gi||'', notes||'');

  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(id);
  res.status(201).json({ food });
});

// PUT /api/foods/:id — update custom food
router.put('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!food) return res.status(404).json({ error: 'Food not found' });
  if (food.is_default) return res.status(403).json({ error: 'Cannot edit default foods' });
  if (food.user_id !== req.userId) return res.status(403).json({ error: 'Not your food' });

  const { name, category, base_unit, base_amount, serving, cal, protein_g, fiber_g, carbs_g, fat_g, gi, notes } = req.body;
  if (!hasCompleteNutrition({ cal, protein_g, fiber_g, carbs_g, fat_g })) {
    return res.status(400).json({ error: 'Add all before saving. Use AI estimate if you do not know the values.' });
  }
  const duplicate = findDuplicateFood(db, req.userId, name, req.params.id);
  if (duplicate) return res.status(409).json({ error: 'This food is already in your library' });

  db.prepare(`
    UPDATE foods SET name=?, category=?, base_unit=?, base_amount=?, serving=?,
    cal=?, protein_g=?, fiber_g=?, carbs_g=?, fat_g=?, gi=?, notes=?
    WHERE id=?
  `).run(name, category, base_unit, base_amount, serving, cal, protein_g, fiber_g, carbs_g, fat_g, gi, notes, req.params.id);

  const updated = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  res.json({ food: updated });
});

// DELETE /api/foods/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  if (!food) return res.status(404).json({ error: 'Food not found' });
  if (food.is_default) return res.status(403).json({ error: 'Cannot delete default foods' });
  if (food.user_id !== req.userId) return res.status(403).json({ error: 'Not your food' });

  db.prepare('DELETE FROM foods WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
