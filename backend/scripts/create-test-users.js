#!/usr/bin/env node

/**
 * Create test accounts for all subscription tiers
 *
 * Usage: node backend/scripts/create-test-users.js
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../database/nutritrack.db');
const db = new Database(dbPath);

// Ensure subscription_tier column exists
try {
  db.exec("ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'");
  console.log('✅ Added subscription_tier column\n');
} catch (e) {
  if (!e.message.includes('duplicate column')) {
    console.log('ℹ️  subscription_tier column already exists\n');
  }
}

const TEST_USERS = [
  {
    email: 'test-free@vitanudge.com',
    password: 'Test123!',
    name: 'Free User',
    subscription_tier: 'free',
    description: 'Free tier - Basic nutrition tracking only'
  },
  {
    email: 'test-pro@vitanudge.com',
    password: 'Test123!',
    name: 'Pro User',
    subscription_tier: 'pro',
    description: 'Pro tier - All features except clinical'
  },
  {
    email: 'test-clinical@vitanudge.com',
    password: 'Test123!',
    name: 'Clinical User',
    subscription_tier: 'clinical',
    description: 'Clinical tier - All features including glucose tracking'
  }
];

console.log('🔧 Creating test accounts...\n');

TEST_USERS.forEach(user => {
  try {
    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);

    if (existing) {
      // Update existing user
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      db.prepare(`
        UPDATE users
        SET password = ?, name = ?, subscription_tier = ?
        WHERE email = ?
      `).run(hashedPassword, user.name, user.subscription_tier, user.email);

      console.log(`✅ Updated: ${user.email}`);
    } else {
      // Create new user
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      const userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, password, name, subscription_tier, diet_preference)
        VALUES (?, ?, ?, ?, ?, 'balanced')
      `).run(userId, user.email, hashedPassword, user.name, user.subscription_tier);

      console.log(`✅ Created: ${user.email}`);
    }

    console.log(`   Password: ${user.password}`);
    console.log(`   Tier: ${user.subscription_tier}`);
    console.log(`   ${user.description}\n`);

  } catch (error) {
    console.error(`❌ Error with ${user.email}:`, error.message);
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 TEST ACCOUNTS SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('FREE TIER (Basic Features)');
console.log('  Email:    test-free@vitanudge.com');
console.log('  Password: Test123!');
console.log('  Access:   ✅ Meals, Goals, Profile, Reports');
console.log('            ❌ Medications, Templates, Vitals, Clinical\n');

console.log('PRO TIER (All Premium Features)');
console.log('  Email:    test-pro@vitanudge.com');
console.log('  Password: Test123!');
console.log('  Access:   ✅ All Free features');
console.log('            ✅ Medications, Templates, Vitals');
console.log('            ❌ Clinical Glucose Tracking\n');

console.log('CLINICAL TIER (All Features)');
console.log('  Email:    test-clinical@vitanudge.com');
console.log('  Password: Test123!');
console.log('  Access:   ✅ All Pro features');
console.log('            ✅ Clinical Glucose Tracking');
console.log('            ✅ Advanced Analytics\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 TESTING GUIDE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('1. Log in with each account to verify tier restrictions');
console.log('2. Free users should see upgrade prompts on:');
console.log('   - /medications');
console.log('   - /templates');
console.log('   - /vitals');
console.log('   - /clinical\n');

console.log('3. Pro users should access everything except:');
console.log('   - /clinical (Clinical tier only)\n');

console.log('4. Clinical users should have full access to all features\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

db.close();
console.log('✅ Done! Database connection closed.\n');
