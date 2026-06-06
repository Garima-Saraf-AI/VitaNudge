const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use local path - free tier doesn't support persistent disk
// Note: DB will reset on restart (fine for demo/testing)
const DB_PATH = path.join(__dirname, 'nutritrack.db');

function initDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- USERS
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      age         INTEGER DEFAULT 40,
      gender      TEXT DEFAULT 'male',
      weight_kg   REAL DEFAULT 95,
      height_cm   REAL DEFAULT 175,
      condition   TEXT DEFAULT 'Diabetic, vegetarian',
      diet_preference TEXT DEFAULT '',
      country     TEXT DEFAULT '',
      state_region TEXT DEFAULT '',
      city        TEXT DEFAULT '',
      timezone    TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    -- USER GOALS
    CREATE TABLE IF NOT EXISTS goals (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      goal_type   TEXT DEFAULT 'glucose',
      activity_level TEXT DEFAULT 'light',
      pace        TEXT DEFAULT 'steady',
      carb_style  TEXT DEFAULT 'balanced',
      diabetes_status TEXT DEFAULT 'type2',
      target_weight_kg REAL,
      target_muscle_gain_kg REAL DEFAULT 0,
      target_date TEXT,
      target_summary TEXT DEFAULT '',
      cal         INTEGER DEFAULT 1700,
      protein_g   REAL    DEFAULT 110,
      fiber_g     REAL    DEFAULT 35,
      carbs_g     REAL    DEFAULT 150,
      water_ml    INTEGER DEFAULT 3000,
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    -- FOOD LIBRARY (global + user custom)
    CREATE TABLE IF NOT EXISTS foods (
      id          TEXT PRIMARY KEY,
      user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'custom',
      base_unit   TEXT NOT NULL DEFAULT 'g',
      base_amount REAL NOT NULL DEFAULT 100,
      serving     TEXT,
      cal         REAL NOT NULL DEFAULT 0,
      protein_g   REAL NOT NULL DEFAULT 0,
      fiber_g     REAL NOT NULL DEFAULT 0,
      carbs_g     REAL NOT NULL DEFAULT 0,
      fat_g       REAL NOT NULL DEFAULT 0,
      sugar_g     REAL DEFAULT 0,
      sodium_mg   REAL DEFAULT 0,
      gi          TEXT DEFAULT 'unknown',
      notes       TEXT DEFAULT '',
      is_default  INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- MEAL LOGS
    CREATE TABLE IF NOT EXISTS meal_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      food_id     TEXT REFERENCES foods(id),
      food_name   TEXT NOT NULL,
      meal_type   TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
      log_date    TEXT NOT NULL,
      qty         REAL NOT NULL DEFAULT 1,
      unit        TEXT NOT NULL DEFAULT 'g',
      cal         REAL NOT NULL DEFAULT 0,
      protein_g   REAL NOT NULL DEFAULT 0,
      fiber_g     REAL NOT NULL DEFAULT 0,
      carbs_g     REAL NOT NULL DEFAULT 0,
      fat_g       REAL NOT NULL DEFAULT 0,
      amt_label   TEXT DEFAULT '',
      logged_at   TEXT DEFAULT (datetime('now'))
    );

    -- WATER LOGS
    CREATE TABLE IF NOT EXISTS water_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date    TEXT NOT NULL,
      ml          INTEGER NOT NULL,
      logged_at   TEXT DEFAULT (datetime('now'))
    );

    -- GLUCOSE LOGS
    CREATE TABLE IF NOT EXISTS glucose_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date    TEXT NOT NULL,
      value_mgdl  REAL NOT NULL,
      timing      TEXT NOT NULL,
      logged_at   TEXT DEFAULT (datetime('now'))
    );

    -- SCANNED LABELS CACHE
    CREATE TABLE IF NOT EXISTS scan_cache (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      image_hash  TEXT,
      result_json TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- WEIGHT TRACKER
    CREATE TABLE IF NOT EXISTS weight_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date    TEXT NOT NULL,
      weight_kg   REAL NOT NULL,
      notes       TEXT DEFAULT '',
      logged_at   TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, log_date)
    );

    -- HBA1C BLOOD TESTS
    CREATE TABLE IF NOT EXISTS a1c_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date    TEXT NOT NULL,
      value_pct   REAL NOT NULL,
      notes       TEXT DEFAULT '',
      logged_at   TEXT DEFAULT (datetime('now'))
    );

    -- BLOOD PRESSURE
    CREATE TABLE IF NOT EXISTS bp_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date    TEXT NOT NULL,
      systolic    INTEGER NOT NULL,
      diastolic   INTEGER NOT NULL,
      pulse       INTEGER,
      notes       TEXT DEFAULT '',
      logged_at   TEXT DEFAULT (datetime('now'))
    );

    -- MEDICATION REMINDERS + DAILY TAKEN LOGS
    CREATE TABLE IF NOT EXISTS medications (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      dose        TEXT DEFAULT '',
      time_of_day TEXT DEFAULT '',
      notes       TEXT DEFAULT '',
      active      INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
      log_date      TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'taken',
      taken_at      TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, medication_id, log_date)
    );

    -- MEAL TEMPLATES
    CREATE TABLE IF NOT EXISTS meal_templates (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      meal_type   TEXT DEFAULT 'lunch',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_template_items (
      id           TEXT PRIMARY KEY,
      template_id  TEXT NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
      food_id      TEXT REFERENCES foods(id),
      food_name    TEXT NOT NULL,
      qty          REAL NOT NULL DEFAULT 1,
      unit         TEXT NOT NULL DEFAULT 'g',
      cal          REAL NOT NULL DEFAULT 0,
      protein_g    REAL NOT NULL DEFAULT 0,
      fiber_g      REAL NOT NULL DEFAULT 0,
      carbs_g      REAL NOT NULL DEFAULT 0,
      fat_g        REAL NOT NULL DEFAULT 0,
      amt_label    TEXT DEFAULT ''
    );

    -- DAILY STEP LOGS
    CREATE TABLE IF NOT EXISTS steps_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date    TEXT NOT NULL,
      steps       INTEGER NOT NULL,
      source      TEXT DEFAULT 'manual',
      logged_at   TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, log_date)
    );

    -- DAILY WELLBEING FLAG
    CREATE TABLE IF NOT EXISTS wellbeing_logs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'fine',
      notes       TEXT DEFAULT '',
      logged_at   TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, log_date)
    );

    -- WEEKLY EMAIL SUMMARY PREFERENCES
    CREATE TABLE IF NOT EXISTS weekly_email_prefs (
      user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      enabled        INTEGER DEFAULT 0,
      email          TEXT DEFAULT '',
      last_sent_date TEXT,
      updated_at     TEXT DEFAULT (datetime('now'))
    );

    -- INDEXES
    CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date  ON meal_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_glucose_user_date    ON glucose_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_foods_user           ON foods(user_id);
    CREATE INDEX IF NOT EXISTS idx_foods_default        ON foods(is_default);
    CREATE INDEX IF NOT EXISTS idx_weight_user_date     ON weight_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_a1c_user_date        ON a1c_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_bp_user_date         ON bp_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_med_logs_user_date   ON medication_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_templates_user       ON meal_templates(user_id);
  `);

  const goalColumns = new Set(db.prepare('PRAGMA table_info(goals)').all().map(col => col.name));
  const goalMigrations = [
    ['goal_type', "ALTER TABLE goals ADD COLUMN goal_type TEXT DEFAULT 'glucose'"],
    ['activity_level', "ALTER TABLE goals ADD COLUMN activity_level TEXT DEFAULT 'light'"],
    ['pace', "ALTER TABLE goals ADD COLUMN pace TEXT DEFAULT 'steady'"],
    ['carb_style', "ALTER TABLE goals ADD COLUMN carb_style TEXT DEFAULT 'balanced'"],
    ['diabetes_status', "ALTER TABLE goals ADD COLUMN diabetes_status TEXT DEFAULT 'type2'"],
    ['target_weight_kg', 'ALTER TABLE goals ADD COLUMN target_weight_kg REAL'],
    ['target_muscle_gain_kg', 'ALTER TABLE goals ADD COLUMN target_muscle_gain_kg REAL DEFAULT 0'],
    ['target_date', 'ALTER TABLE goals ADD COLUMN target_date TEXT'],
    ['target_summary', "ALTER TABLE goals ADD COLUMN target_summary TEXT DEFAULT ''"],
  ];
  for (const [name, statement] of goalMigrations) {
    if (!goalColumns.has(name)) db.prepare(statement).run();
  }

  const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map(col => col.name));
  const userMigrations = [
    ['diet_preference', "ALTER TABLE users ADD COLUMN diet_preference TEXT DEFAULT ''"],
    ['gender', "ALTER TABLE users ADD COLUMN gender TEXT DEFAULT 'male'"],
    ['country', "ALTER TABLE users ADD COLUMN country TEXT DEFAULT ''"],
    ['state_region', "ALTER TABLE users ADD COLUMN state_region TEXT DEFAULT ''"],
    ['city', "ALTER TABLE users ADD COLUMN city TEXT DEFAULT ''"],
    ['timezone', "ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT ''"],
    // Subscription / monetization columns
    ['subscription_tier', "ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'"],
    ['stripe_customer_id', "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT DEFAULT ''"],
    ['stripe_subscription_id', "ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT DEFAULT ''"],
    ['subscription_expires_at', "ALTER TABLE users ADD COLUMN subscription_expires_at TEXT DEFAULT ''"],
    ['scan_count_month', "ALTER TABLE users ADD COLUMN scan_count_month INTEGER DEFAULT 0"],
    ['scan_count_reset_date', "ALTER TABLE users ADD COLUMN scan_count_reset_date TEXT DEFAULT ''"],
    ['barcode_count_month', "ALTER TABLE users ADD COLUMN barcode_count_month INTEGER DEFAULT 0"],
    ['first_login', "ALTER TABLE users ADD COLUMN first_login INTEGER DEFAULT 1"],
  ];
  for (const [name, statement] of userMigrations) {
    if (!userColumns.has(name)) db.prepare(statement).run();
  }

  db.close();
  console.log('✅ Database initialized at', DB_PATH);
}

module.exports = { initDatabase, DB_PATH };

if (require.main === module) {
  initDatabase();
}
