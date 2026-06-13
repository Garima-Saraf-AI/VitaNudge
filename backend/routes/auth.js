const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { signToken, authMiddleware } = require('../middleware/auth');
const { normalizeTimeZone } = require('../utils/date');

// Email sending helper using Resend
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[sendEmail] Resend API key not configured, skipping email');
    return { skipped: true };
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
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html: html || text,
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[sendEmail] Resend error:', body);
      return { error: body.message || 'Email send failed' };
    }

    console.log('[sendEmail] Email sent successfully:', body.id);
    return { sent: true, id: body.id };
  } catch (e) {
    console.error('[sendEmail] Error:', e.message);
    return { error: e.message };
  }
}

const USER_SELECT = `
  id, name, email, age, gender, weight_kg, height_cm, condition, diet_preference,
  country, state_region, city, timezone, profile_completed_at,
  subscription_tier, subscription_expires_at
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Invalid email format' });

    // Keep the primary requirement in one clear message.
    if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      return res.status(400).json({
        error: 'Password must be at least 6 characters and include both a letter and a number.'
      });
    if (password.length > 128)
      return res.status(400).json({ error: 'Password must be less than 128 characters' });
    if (password.includes(' '))
      return res.status(400).json({ error: 'Password cannot contain spaces' });
    // Validate name (same rules as profile update)
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2)
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (trimmedName.length > 100)
      return res.status(400).json({ error: 'Name must be less than 100 characters' });
    if (!/^[a-zA-Z\s\-\.]+$/.test(trimmedName))
      return res.status(400).json({ error: 'Name can only contain letters, spaces, hyphens and periods' });

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (
        id, name, email, password, age, weight_kg, height_cm, condition,
        diet_preference, country, state_region, city, timezone, profile_completed_at
      ) VALUES (?, ?, ?, ?, NULL, NULL, NULL, '', '', '', '', '', '', NULL)
    `).run(userId, trimmedName, email.toLowerCase(), hash);

    // Create default goals
    db.prepare(`
      INSERT INTO goals (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), userId);

    const token = signToken(userId);
    const user = db.prepare(`SELECT ${USER_SELECT} FROM users WHERE id = ?`).get(userId);
    res.status(201).json({ token, user });
  } catch (e) {
    console.error('[register] Registration error:', e.message, e.stack);
    // Send detailed error in development, generic in production
    const errorMsg = process.env.NODE_ENV === 'development'
      ? `Registration failed: ${e.message}`
      : 'Registration failed. Please try again or contact support.';
    res.status(500).json({ error: errorMsg });
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
    if (!user) return res.status(401).json({ error: 'We couldn\'t sign you in. Check your details, or create an account if you\'re new.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'We couldn\'t sign you in. Check your details, or create an account if you\'re new.' });

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

  // Validate name
  const trimmedName = String(name || '').trim();
  if (!trimmedName) return res.status(400).json({ error: 'Name is required' });
  if (trimmedName.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
  if (trimmedName.length > 100) return res.status(400).json({ error: 'Name must be less than 100 characters' });
  if (!/^[a-zA-Z\s\-\.]+$/.test(trimmedName)) return res.status(400).json({ error: 'Name can only contain letters, spaces, hyphens and periods' });

  // Validate age
  const numAge = Number(age);
  if (!age || !Number.isInteger(numAge) || numAge < 1 || numAge > 150) return res.status(400).json({ error: 'Age is required and must be between 1 and 150' });

  // Validate weight
  const numWeight = Number(weight_kg);
  if (!weight_kg || isNaN(numWeight) || numWeight < 1 || numWeight > 500) return res.status(400).json({ error: 'Weight is required and must be between 1 and 500 kg' });

  // Validate height
  const numHeight = Number(height_cm);
  if (!height_cm || isNaN(numHeight) || numHeight < 50 || numHeight > 300) return res.status(400).json({ error: 'Height is required and must be between 50 and 300 cm' });

  // Validate condition (optional)
  const safeCondition = condition ? String(condition).trim().slice(0, 500) : '';

  const safeDietPreference = ['', 'vegan', 'veg', 'non_veg'].includes(diet_preference) ? diet_preference : '';
  const safeGender = ['male', 'female'].includes(gender) ? gender : 'male';
  const safeCountry = cleanText(country);
  const safeState = cleanText(state_region);
  const safeCity = cleanText(city);
  const safeTimeZone = cleanTimeZone(timezone);

  const db = getDb();
  db.prepare(`
    UPDATE users SET name=?, age=?, gender=?, weight_kg=?, height_cm=?, condition=?, diet_preference=?,
      country=?, state_region=?, city=?, timezone=?,
      profile_completed_at=datetime('now'), updated_at=datetime('now')
    WHERE id=?
  `).run(trimmedName, numAge, safeGender, numWeight, numHeight, safeCondition, safeDietPreference, safeCountry, safeState, safeCity, safeTimeZone, req.userId);
  const user = db.prepare(`SELECT ${USER_SELECT} FROM users WHERE id = ?`).get(req.userId);
  res.json({ user });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase());

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent' });
  }

  // Create reset token (valid for 1 hour)
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(user.id, token, expiresAt);

  // Send password reset email
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const emailResult = await sendEmail({
    to: user.email,
    subject: 'Reset Your VitaNudge Password',
    text: `Hello,\n\nYou requested to reset your VitaNudge password.\n\nClick here to reset: ${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.\n\nBest,\nVitaNudge Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3a7d44;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested to reset your VitaNudge password.</p>
        <p style="margin: 30px 0;">
          <a href="${resetLink}" style="background: #3a7d44; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">VitaNudge - Small nudges. Big results.</p>
      </div>
    `
  });

  if (emailResult.skipped) {
    console.log(`[forgot-password] Email skipped (no API key). Reset link: ${resetLink}`);
  }

  res.json({ message: 'If that email exists, a reset link has been sent' });
});

// POST /api/auth/validate-reset-token
router.post('/validate-reset-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  const db = getDb();
  const resetToken = db.prepare(`
    SELECT user_id, expires_at FROM password_reset_tokens
    WHERE token = ? AND used = 0
  `).get(token);

  if (!resetToken) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Reset token has expired' });
  }

  res.json({ valid: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const resetToken = db.prepare(`
    SELECT user_id, expires_at FROM password_reset_tokens
    WHERE token = ? AND used = 0
  `).get(token);

  if (!resetToken) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Reset token has expired' });
  }

  // Update password
  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(hash, resetToken.user_id);

  // Mark token as used
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);

  res.json({ message: 'Password reset successful' });
});

// GET /api/auth/export-data - Export all user data
router.get('/export-data', authMiddleware, (req, res) => {
  const db = getDb();

  // Get all user data
  const user = db.prepare(`SELECT ${USER_SELECT} FROM users WHERE id = ?`).get(req.userId);
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').get(req.userId);
  const foods = db.prepare('SELECT * FROM foods WHERE user_id = ?').all(req.userId);
  const meals = db.prepare('SELECT * FROM meal_logs WHERE user_id = ? ORDER BY log_date DESC').all(req.userId);
  const weight = db.prepare('SELECT * FROM weight_logs WHERE user_id = ? ORDER BY log_date DESC').all(req.userId);
  const water = db.prepare('SELECT * FROM water_logs WHERE user_id = ? ORDER BY log_date DESC').all(req.userId);
  const steps = db.prepare('SELECT * FROM steps_logs WHERE user_id = ? ORDER BY log_date DESC').all(req.userId);
  const glucose = db.prepare('SELECT * FROM glucose_logs WHERE user_id = ? ORDER BY log_date DESC').all(req.userId);
  const bp = db.prepare('SELECT * FROM bp_logs WHERE user_id = ? ORDER BY log_date DESC').all(req.userId);
  const a1c = db.prepare('SELECT * FROM a1c_logs WHERE user_id = ? ORDER BY log_date DESC').all(req.userId);
  const medications = db.prepare('SELECT * FROM medications WHERE user_id = ?').all(req.userId);
  const templates = db.prepare('SELECT * FROM meal_templates WHERE user_id = ?').all(req.userId);
  const recipes = db.prepare('SELECT * FROM recipes WHERE user_id = ?').all(req.userId);

  res.json({
    exported_at: new Date().toISOString(),
    user,
    goals,
    foods,
    meals,
    health: {
      weight,
      water,
      steps,
      glucose,
      blood_pressure: bp,
      a1c,
    },
    medications,
    templates,
    recipes
  });
});

// DELETE /api/auth/account - Delete user account
router.delete('/account', authMiddleware, (req, res) => {
  const { reason, feedback } = req.body;
  const db = getDb();

  // Log deletion feedback (optional)
  if (reason || feedback) {
    try {
      db.prepare(`
        INSERT INTO account_deletions (user_id, reason, feedback, deleted_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(req.userId, reason || null, feedback || null);
    } catch (e) {
      // Table might not exist, that's okay
    }
  }

  // Delete user (cascades to all related data via foreign keys)
  db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);

  res.json({ message: 'Account deleted successfully' });
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  const db = getDb();

  // Check if email_verification_tokens table exists
  try {
    const verificationToken = db.prepare(`
      SELECT user_id, expires_at FROM email_verification_tokens
      WHERE token = ? AND used = 0
    `).get(token);

    if (!verificationToken) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (new Date(verificationToken.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Mark email as verified
    db.prepare('UPDATE users SET email_verified = 1, updated_at = datetime(\'now\') WHERE id = ?')
      .run(verificationToken.user_id);

    // Mark token as used
    db.prepare('UPDATE email_verification_tokens SET used = 1 WHERE token = ?').run(token);

    res.json({ message: 'Email verified successfully' });
  } catch (e) {
    // If table doesn't exist, verification is not enabled yet
    console.log('[verify-email] Email verification not enabled:', e.message);
    res.json({ message: 'Email verification not enabled' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authMiddleware, async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, email_verified FROM users WHERE id = ?').get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    if (user.email_verified) {
      return res.json({ message: 'Email already verified' });
    }

    // Create new verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    db.prepare(`
      INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(user.id, token, expiresAt);

    // Send verification email
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Verify Your VitaNudge Email',
      text: `Hello,\n\nWelcome to VitaNudge! Please verify your email address.\n\nClick here to verify: ${verifyLink}\n\nThis link expires in 24 hours.\n\nBest,\nVitaNudge Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3a7d44;">Welcome to VitaNudge!</h2>
          <p>Hello,</p>
          <p>Thanks for signing up! Please verify your email address to get started.</p>
          <p style="margin: 30px 0;">
            <a href="${verifyLink}" style="background: #3a7d44; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">VitaNudge - Small nudges. Big results.</p>
        </div>
      `
    });

    if (emailResult.skipped) {
      console.log(`[resend-verification] Email skipped (no API key). Verify link: ${verifyLink}`);
    }

    res.json({ message: 'Verification email sent' });
  } catch (e) {
    console.log('[resend-verification] Email verification not enabled:', e.message);
    res.json({ message: 'Email verification not enabled' });
  }
});

module.exports = router;
