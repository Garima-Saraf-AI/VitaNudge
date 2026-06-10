// const router = require('express').Router();
// const { v4: uuidv4 } = require('uuid');
// const { getDb } = require('../database/db');
// const { authMiddleware } = require('../middleware/auth');

// function calcMacros(food, qty, unit) {
//   let mult = 0;
//   const base = food.base_amount;
//   if (unit === 'g' || unit === 'ml')         mult = qty / base;
//   else if (unit === 'piece' || unit === 'serving') mult = qty;
//   else if (unit === 'cup')                   mult = (qty * 240) / base;
//   else if (unit === 'tbsp')                  mult = (qty * 15) / base;
//   else                                       mult = qty / base;
//   return {
//     cal:       Math.round(food.cal * mult),
//     protein_g: Math.round(food.protein_g * mult * 10) / 10,
//     fiber_g:   Math.round(food.fiber_g * mult * 10) / 10,
//     carbs_g:   Math.round(food.carbs_g * mult * 10) / 10,
//     fat_g:     Math.round(food.fat_g * mult * 10) / 10,
//   };
// }

// // GET /api/meals?date=YYYY-MM-DD
// router.get('/', authMiddleware, (req, res) => {
//   const { date } = req.query;
//   if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
//   const db = getDb();
//   const logs = db.prepare(`
//     SELECT * FROM meal_logs WHERE user_id = ? AND log_date = ? ORDER BY logged_at ASC
//   `).all(req.userId, date);
//   // group by meal type
//   const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
//   for (const log of logs) grouped[log.meal_type].push(log);
//   res.json({ date, logs: grouped });
// });

// // GET /api/meals/range?from=YYYY-MM-DD&to=YYYY-MM-DD
// router.get('/range', authMiddleware, (req, res) => {
//   const { from, to } = req.query;
//   if (!from || !to) return res.status(400).json({ error: 'from and to required' });
//   const db = getDb();
//   const logs = db.prepare(`
//     SELECT log_date,
//       SUM(cal) as total_cal, SUM(protein_g) as total_pro,
//       SUM(fiber_g) as total_fib, SUM(carbs_g) as total_crb
//     FROM meal_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
//     GROUP BY log_date ORDER BY log_date
//   `).all(req.userId, from, to);
//   res.json({ logs });
// });

// // POST /api/meals — log a food
// router.post('/', authMiddleware, (req, res) => {
//   const { food_id, food_name, meal_type, log_date, qty, unit, amt_label } = req.body;
//   if (!meal_type || !log_date || !qty)
//     return res.status(400).json({ error: 'meal_type, log_date, qty are required' });

//   const db = getDb();
//   let macros = { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0, fat_g: 0 };

//   if (food_id) {
//     const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(food_id);
//     if (food) macros = calcMacros(food, qty, unit || food.base_unit);
//   } else {
//     // manual macros passed directly
//     macros = {
//       cal: req.body.cal || 0,
//       protein_g: req.body.protein_g || 0,
//       fiber_g: req.body.fiber_g || 0,
//       carbs_g: req.body.carbs_g || 0,
//       fat_g: req.body.fat_g || 0,
//     };
//   }

//   const id = uuidv4();
//   db.prepare(`
//     INSERT INTO meal_logs (id, user_id, food_id, food_name, meal_type, log_date, qty, unit, cal, protein_g, fiber_g, carbs_g, fat_g, amt_label)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `).run(id, req.userId, food_id || null, food_name || 'Unknown', meal_type, log_date, qty, unit || 'g', macros.cal, macros.protein_g, macros.fiber_g, macros.carbs_g, macros.fat_g, amt_label || '');

//   const entry = db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(id);
//   res.status(201).json({ entry });
// });

// // DELETE /api/meals/:id
// router.delete('/:id', authMiddleware, (req, res) => {
//   const db = getDb();
//   const entry = db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(req.params.id);
//   if (!entry) return res.status(404).json({ error: 'Entry not found' });
//   if (entry.user_id !== req.userId) return res.status(403).json({ error: 'Not your entry' });
//   db.prepare('DELETE FROM meal_logs WHERE id = ?').run(req.params.id);
//   res.json({ success: true });
// });

// module.exports = router;


const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { addDays } = require('../utils/date');

function calcMacros(food, qty, unit) {
  let mult = 0;
  const base = food.base_amount;
  if (unit === 'g' || unit === 'ml')               mult = qty / base;
  else if (unit === 'piece' || unit === 'serving')  mult = qty;
  else if (unit === 'cup')                          mult = (qty * 240) / base;
  else if (unit === 'tbsp')                         mult = (qty * 15) / base;
  else                                              mult = qty / base;
  return {
    cal:       Math.round(food.cal * mult),
    protein_g: Math.round(food.protein_g * mult * 10) / 10,
    fiber_g:   Math.round(food.fiber_g * mult * 10) / 10,
    carbs_g:   Math.round(food.carbs_g * mult * 10) / 10,
    fat_g:     Math.round(food.fat_g * mult * 10) / 10,
  };
}

function amtLabel(qty, unit, food) {
  if (unit === 'g')       return `${qty}g`;
  if (unit === 'ml')      return `${qty}ml`;
  if (unit === 'piece')   return `${qty} ${food?.base_unit || 'piece'}${qty !== 1 ? 's' : ''}`;
  if (unit === 'serving') return `${qty} srv`;
  if (unit === 'cup')     return `${qty} cup`;
  if (unit === 'tbsp')    return `${qty} tbsp`;
  return `${qty}`;
}

// GET /api/meals?date=YYYY-MM-DD
router.get('/', authMiddleware, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
  const db = getDb();
  const logs = db.prepare(`
    SELECT * FROM meal_logs WHERE user_id = ? AND log_date = ? ORDER BY logged_at ASC
  `).all(req.userId, date);
  const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const log of logs) grouped[log.meal_type].push(log);
  res.json({ date, logs: grouped });
});

// GET /api/meals/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/range', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });
  const db = getDb();
  const logs = db.prepare(`
    SELECT log_date,
      SUM(cal) as total_cal, SUM(protein_g) as total_pro,
      SUM(fiber_g) as total_fib, SUM(carbs_g) as total_crb
    FROM meal_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?
    GROUP BY log_date ORDER BY log_date
  `).all(req.userId, from, to);
  res.json({ logs });
});

// POST /api/meals — log a food
router.post('/', authMiddleware, (req, res) => {
  const { food_id, food_name, meal_type, log_date, qty, unit, amt_label } = req.body;
  if (!meal_type || !log_date || !qty)
    return res.status(400).json({ error: 'meal_type, log_date, qty are required' });

  // BUG-07 fix: validate meal_type enum before hitting DB (prevents 500 crash)
  const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack']);
  if (!VALID_MEAL_TYPES.has(meal_type))
    return res.status(400).json({ error: 'meal_type must be one of: breakfast, lunch, dinner, snack' });

  // BUG-01 fix: reject invalid date formats
  if (!/^\d{4}-\d{2}-\d{2}$/.test(log_date) || isNaN(Date.parse(log_date)))
    return res.status(400).json({ error: 'log_date must be a valid date in YYYY-MM-DD format' });

  // BUG-02 fix: reject zero or negative qty
  if (parseFloat(qty) <= 0)
    return res.status(400).json({ error: 'qty must be greater than 0' });

  // Validate food name is not empty
  if (!food_id && (!food_name || String(food_name).trim() === ''))
    return res.status(400).json({ error: 'Food name is required' });

  const db = getDb();
  let macros = { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0, fat_g: 0 };
  let finalFoodName = food_name ? String(food_name).trim() : 'Unknown';

  if (food_id) {
    const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(food_id);
    // CRITICAL FIX: Prevent FOREIGN KEY constraint error
    if (!food) {
      return res.status(404).json({ error: 'Food not found. Please select a valid food from the library.' });
    }
    macros = calcMacros(food, qty, unit || food.base_unit);
    // Auto-fill food name from database if not provided
    if (!food_name) finalFoodName = food.name;
  } else {
    // Validate manual macros (no negative values)
    const cal = Number(req.body.cal) || 0;
    const protein_g = Number(req.body.protein_g) || 0;
    const fiber_g = Number(req.body.fiber_g) || 0;
    const carbs_g = Number(req.body.carbs_g) || 0;
    const fat_g = Number(req.body.fat_g) || 0;

    if (cal < 0) return res.status(400).json({ error: 'Calories cannot be negative' });
    if (protein_g < 0) return res.status(400).json({ error: 'Protein cannot be negative' });
    if (fiber_g < 0) return res.status(400).json({ error: 'Fiber cannot be negative' });
    if (carbs_g < 0) return res.status(400).json({ error: 'Carbs cannot be negative' });
    if (fat_g < 0) return res.status(400).json({ error: 'Fat cannot be negative' });

    macros = { cal, protein_g, fiber_g, carbs_g, fat_g };
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO meal_logs (id, user_id, food_id, food_name, meal_type, log_date, qty, unit, cal, protein_g, fiber_g, carbs_g, fat_g, amt_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, food_id || null, finalFoodName, meal_type, log_date, qty, unit || 'g',
         macros.cal, macros.protein_g, macros.fiber_g, macros.carbs_g, macros.fat_g, amt_label || '');

  const entry = db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(id);
  res.status(201).json({ entry });
});

// POST /api/meals/copy-yesterday — duplicate previous day's selected meals into target date
router.post('/copy-yesterday', authMiddleware, (req, res) => {
  const { date, source_date, entry_ids } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });

  const targetDate = date;
  const sourceDate = source_date || addDays(targetDate, -1);
  const db = getDb();
  const selectedIds = Array.isArray(entry_ids) ? new Set(entry_ids.map(String)) : null;

  if (selectedIds && selectedIds.size === 0) {
    return res.status(400).json({ error: 'Select at least one meal item to copy', source_date: sourceDate });
  }

  let sourceLogs = db.prepare(`
    SELECT * FROM meal_logs
    WHERE user_id = ? AND log_date = ?
    ORDER BY logged_at ASC
  `).all(req.userId, sourceDate);

  if (selectedIds) {
    sourceLogs = sourceLogs.filter(log => selectedIds.has(String(log.id)));
  }

  if (sourceLogs.length === 0) {
    return res.status(404).json({ error: selectedIds ? 'No selected meal items found on previous day' : 'No meals found on previous day', source_date: sourceDate });
  }

  const insert = db.prepare(`
    INSERT INTO meal_logs
      (id, user_id, food_id, food_name, meal_type, log_date, qty, unit, cal, protein_g, fiber_g, carbs_g, fat_g, amt_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const copyMany = db.transaction((logs) => logs.map(log => {
    const id = uuidv4();
    insert.run(
      id,
      req.userId,
      log.food_id || null,
      log.food_name,
      log.meal_type,
      targetDate,
      log.qty,
      log.unit,
      log.cal,
      log.protein_g,
      log.fiber_g,
      log.carbs_g,
      log.fat_g,
      log.amt_label || ''
    );
    return db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(id);
  }));

  const copied = copyMany(sourceLogs);
  res.status(201).json({ copied, source_date: sourceDate, target_date: targetDate });
});

// PUT /api/meals/:id — edit qty/unit of an existing entry, recalculate macros
router.put('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(req.params.id);
  if (!entry)                    return res.status(404).json({ error: 'Entry not found' });
  if (entry.user_id !== req.userId) return res.status(403).json({ error: 'Not your entry' });

  const qty  = parseFloat(req.body.qty)  || entry.qty;
  const unit = req.body.unit             || entry.unit;

  // BUG-04 fix: reject zero or negative qty when editing
  if (qty <= 0)
    return res.status(400).json({ error: 'qty must be greater than 0' });

  let macros = { cal: entry.cal, protein_g: entry.protein_g, fiber_g: entry.fiber_g, carbs_g: entry.carbs_g, fat_g: entry.fat_g };
  let label  = entry.amt_label;

  if (entry.food_id) {
    const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(entry.food_id);
    if (food) {
      macros = calcMacros(food, qty, unit);
      label  = amtLabel(qty, unit, food);
    }
  } else {
    // BUG-05 fix: For manual meals, proportionally scale macros when quantity changes
    const oldQty = parseFloat(entry.qty) || 1;
    const ratio = qty / oldQty;
    macros = {
      cal: Math.round(entry.cal * ratio),
      protein_g: Math.round(entry.protein_g * ratio * 10) / 10,
      fiber_g: Math.round(entry.fiber_g * ratio * 10) / 10,
      carbs_g: Math.round(entry.carbs_g * ratio * 10) / 10,
      fat_g: Math.round(entry.fat_g * ratio * 10) / 10,
    };
    label = `${qty}${unit}`;
  }

  db.prepare(`
    UPDATE meal_logs
    SET qty = ?, unit = ?, cal = ?, protein_g = ?, fiber_g = ?, carbs_g = ?, fat_g = ?, amt_label = ?
    WHERE id = ?
  `).run(qty, unit, macros.cal, macros.protein_g, macros.fiber_g, macros.carbs_g, macros.fat_g, label, req.params.id);

  const updated = db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(req.params.id);
  res.json({ entry: updated });
});

// DELETE /api/meals/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM meal_logs WHERE id = ?').get(req.params.id);
  if (!entry)                    return res.status(404).json({ error: 'Entry not found' });
  if (entry.user_id !== req.userId) return res.status(403).json({ error: 'Not your entry' });
  db.prepare('DELETE FROM meal_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
