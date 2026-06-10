const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { requireTier } = require('../middleware/tier');
const { getDb } = require('../database/db');

// GET /api/export (Pro feature)
// Returns all user data as JSON. Supports ?format=json (default) or ?format=csv
router.get('/', authMiddleware, requireTier('pro'), (req, res) => {
  try {
    const db = getDb();
    const uid = req.userId;

    const user = db.prepare('SELECT id, name, email, age, gender, weight_kg, height_cm, condition, created_at FROM users WHERE id = ?').get(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Safe query helper - returns empty array on error
    const safeQuery = (query, params = []) => {
      try {
        return db.prepare(query).all(...params);
      } catch (e) {
        console.error('[export] Query failed:', query, e.message);
        return [];
      }
    };

    const data = {
      exported_at: new Date().toISOString(),
      user,
      goals:            safeQuery('SELECT * FROM goals WHERE user_id = ?', [uid]),
      meal_logs:        safeQuery('SELECT * FROM meal_logs WHERE user_id = ? ORDER BY log_date, logged_at', [uid]),
      water_logs:       safeQuery('SELECT * FROM water_logs WHERE user_id = ? ORDER BY log_date', [uid]),
      glucose_logs:     safeQuery('SELECT * FROM glucose_logs WHERE user_id = ? ORDER BY log_date, logged_at', [uid]),
      weight_logs:      safeQuery('SELECT * FROM weight_logs WHERE user_id = ? ORDER BY log_date', [uid]),
      bp_logs:          safeQuery('SELECT * FROM bp_logs WHERE user_id = ? ORDER BY log_date', [uid]),
      a1c_logs:         safeQuery('SELECT * FROM a1c_logs WHERE user_id = ? ORDER BY log_date', [uid]),
      medications:      safeQuery('SELECT * FROM medications WHERE user_id = ?', [uid]),
      medication_logs:  safeQuery('SELECT * FROM medication_logs WHERE user_id = ? ORDER BY log_date', [uid]),
      meal_templates:   safeQuery('SELECT * FROM meal_templates WHERE user_id = ?', [uid]),
      custom_foods:     safeQuery('SELECT * FROM foods WHERE user_id = ? AND is_default = 0', [uid]),
    };

    const format = req.query.format || 'json';

    if (format === 'csv') {
    // Simple CSV of meal logs — the most-requested export
    const rows = data.meal_logs;
    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vitanudge-meals.csv"');
      return res.send('date,meal_type,food_name,qty,unit,calories,protein_g,fiber_g,carbs_g,fat_g\n');
    }
    const header = 'date,meal_type,food_name,qty,unit,calories,protein_g,fiber_g,carbs_g,fat_g';
    const csv = [header, ...rows.map(r =>
      [r.log_date, r.meal_type, `"${(r.food_name || '').replace(/"/g, '""')}"`,
       r.qty, r.unit, r.cal, r.protein_g, r.fiber_g, r.carbs_g, r.fat_g].join(',')
    )].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vitanudge-meals.csv"');
    return res.send(csv);
  }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="vitanudge-export.json"');
    res.json(data);
  } catch (error) {
    console.error('[export] Export failed:', error.message, error.stack);
    res.status(500).json({
      error: 'Failed to export data. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
