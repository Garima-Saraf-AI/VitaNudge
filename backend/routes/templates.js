const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { requireTier } = require('../middleware/tier');

function loadTemplate(db, userId, id) {
  const template = db.prepare('SELECT * FROM meal_templates WHERE id = ? AND user_id = ?').get(id, userId);
  if (!template) return null;
  const items = db.prepare('SELECT * FROM meal_template_items WHERE template_id = ? ORDER BY rowid').all(id);
  const totals = items.reduce((t, i) => ({
    cal: t.cal + (i.cal || 0),
    protein_g: t.protein_g + (i.protein_g || 0),
    fiber_g: t.fiber_g + (i.fiber_g || 0),
    carbs_g: t.carbs_g + (i.carbs_g || 0),
    fat_g: t.fat_g + (i.fat_g || 0),
  }), { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0, fat_g: 0 });
  return { ...template, items, totals };
}

function insertTemplate(db, userId, { name, meal_type, items }) {
  const templateId = uuidv4();
  db.prepare('INSERT INTO meal_templates (id, user_id, name, meal_type) VALUES (?, ?, ?, ?)')
    .run(templateId, userId, name.trim(), meal_type || 'lunch');

  const insertItem = db.prepare(`
    INSERT INTO meal_template_items
      (id, template_id, food_id, food_name, qty, unit, cal, protein_g, fiber_g, carbs_g, fat_g, amt_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of items) {
    insertItem.run(
      uuidv4(),
      templateId,
      item.food_id || null,
      item.food_name || 'Unknown',
      item.qty || 1,
      item.unit || 'g',
      item.cal || 0,
      item.protein_g || 0,
      item.fiber_g || 0,
      item.carbs_g || 0,
      item.fat_g || 0,
      item.amt_label || ''
    );
  }
  return templateId;
}

router.get('/', authMiddleware, requireTier('pro'), (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT id FROM meal_templates WHERE user_id = ? ORDER BY updated_at DESC, created_at DESC').all(req.userId);
  res.json({ templates: rows.map(r => loadTemplate(db, req.userId, r.id)).filter(Boolean) });
});

router.post('/', authMiddleware, requireTier('pro'), (req, res) => {
  const { name, meal_type, items } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Template name required' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'At least one item required' });

  const db = getDb();
  const templateId = db.transaction(() => insertTemplate(db, req.userId, { name, meal_type, items }))();
  res.status(201).json({ template: loadTemplate(db, req.userId, templateId) });
});

router.post('/from-date', authMiddleware, requireTier('pro'), (req, res) => {
  const { name, date, meal_type } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'name and date required' });

  const db = getDb();
  const logs = db.prepare(`
    SELECT * FROM meal_logs
    WHERE user_id = ? AND log_date = ? AND (? IS NULL OR meal_type = ?)
    ORDER BY logged_at
  `).all(req.userId, date, meal_type || null, meal_type || null);

  if (logs.length === 0) return res.status(404).json({ error: 'No meal logs found for template' });
  const templateId = db.transaction(() => insertTemplate(db, req.userId, {
    name,
    meal_type: meal_type || logs[0]?.meal_type || 'lunch',
    items: logs,
  }))();

  res.status(201).json({ template: loadTemplate(db, req.userId, templateId) });
});

router.post('/:id/log', authMiddleware, requireTier('pro'), (req, res) => {
  const { date, meal_type } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  const db = getDb();
  const template = loadTemplate(db, req.userId, req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const insert = db.prepare(`
    INSERT INTO meal_logs (id, user_id, food_id, food_name, meal_type, log_date, qty, unit, cal, protein_g, fiber_g, carbs_g, fat_g, amt_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const logged = db.transaction(() => template.items.map(item => {
    const id = uuidv4();
    insert.run(
      id,
      req.userId,
      item.food_id || null,
      item.food_name,
      meal_type || template.meal_type || 'lunch',
      date,
      item.qty,
      item.unit,
      item.cal,
      item.protein_g,
      item.fiber_g,
      item.carbs_g,
      item.fat_g,
      item.amt_label || ''
    );
    return db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(id);
  }))();

  res.status(201).json({ logged, template });
});

router.delete('/:id', authMiddleware, requireTier('pro'), (req, res) => {
  const db = getDb();
  const template = db.prepare('SELECT * FROM meal_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  if (template.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM meal_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
