const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { signToken } = require('../middleware/auth');
const { normalizeTimeZone } = require('../utils/date');

const USER_SELECT = `
  id, name, email, age, gender, weight_kg, height_cm, condition, diet_preference,
  country, state_region, city, timezone
`;

function cleanText(value, max = 80) {
  return String(value || '').trim().slice(0, max);
}

function cleanTimeZone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const normalized = normalizeTimeZone(raw);
  return normalized === raw ? normalized : '';
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, password, diet_preference) VALUES (?, ?, ?, ?, ?)
    `).run(userId, name, email.toLowerCase(), hash, '');

    // Create default goals
    db.prepare(`
      INSERT INTO goals (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), userId);

    const token = signToken(userId);
    const user = db.prepare(`SELECT ${USER_SELECT} FROM users WHERE id = ?`).get(userId);
    res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;
    // Track first login for onboarding flow
    const isFirstLogin = safeUser.first_login === 1 || safeUser.first_login === undefined;
    if (isFirstLogin) {
      db.prepare('UPDATE users SET first_login = 0 WHERE id = ?').run(user.id);
    }
    res.json({ token, user: safeUser, first_login: isFirstLogin });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare(`SELECT ${USER_SELECT} FROM users WHERE id = ?`).get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth').authMiddleware, (req, res) => {
  const { name, age, gender, weight_kg, height_cm, condition, diet_preference, country, state_region, city, timezone } = req.body;
  const safeDietPreference = ['', 'vegan', 'veg', 'non_veg'].includes(diet_preference) ? diet_preference : '';
  const safeGender = ['male', 'female'].includes(gender) ? gender : 'male';
  const safeCountry = cleanText(country);
  const safeState = cleanText(state_region);
  const safeCity = cleanText(city);
  const safeTimeZone = cleanTimeZone(timezone);

  const db = getDb();
  db.prepare(`
    UPDATE users SET name=?, age=?, gender=?, weight_kg=?, height_cm=?, condition=?, diet_preference=?,
      country=?, state_region=?, city=?, timezone=?, updated_at=datetime('now')
    WHERE id=?
  `).run(name, age, safeGender, weight_kg, height_cm, condition, safeDietPreference, safeCountry, safeState, safeCity, safeTimeZone, req.userId);
  const user = db.prepare(`SELECT ${USER_SELECT} FROM users WHERE id = ?`).get(req.userId);
  res.json({ user });
});

module.exports = router;
