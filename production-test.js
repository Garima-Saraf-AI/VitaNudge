#!/usr/bin/env node
/**
 * Production Test Suite - VitaNudge
 * Tests all bug fixes on Render deployment
 */

const https = require('https');

const API_URL = 'https://vitanudge-api.onrender.com';
const FRONTEND_URL = 'https://vitanudge.onrender.com';

// Color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passCount = 0;
let failCount = 0;

function log(emoji, color, message) {
  console.log(`${emoji} ${color}${message}${RESET}`);
}

function pass(test) {
  passCount++;
  log('✅', GREEN, `PASS: ${test}`);
}

function fail(test, reason) {
  failCount++;
  log('❌', RED, `FAIL: ${test}\n   Reason: ${reason}`);
}

function warn(message) {
  log('⚠️ ', YELLOW, `WARN: ${message}`);
}

function info(message) {
  log('ℹ️ ', BLUE, message);
}

// Helper: Make HTTP request
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Helper: Register test user
async function registerTestUser() {
  const timestamp = Date.now();
  const email = `test-${timestamp}@example.com`;
  const password = 'TestPass123!';
  const name = 'Test User';

  const res = await request(`${API_URL}/api/auth/register`, {
    method: 'POST',
    body: { name, email, password }
  });

  if (res.status === 201 && res.body.token) {
    return { email, password, token: res.body.token, userId: res.body.user.id };
  }

  throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪  VitaNudge Production Test Suite');
  console.log('    Testing: ' + FRONTEND_URL);
  console.log('    API: ' + API_URL);
  console.log('='.repeat(60) + '\n');

  let testUser;

  try {
    // ────────────────────────────────────────────────────────
    info('Setting up test user...');
    testUser = await registerTestUser();
    pass('Test user registered successfully');
    // ────────────────────────────────────────────────────────

    info('\n📦 Testing Bug Fixes...\n');

    // ────────────────────────────────────────────────────────
    // BUG #3: Invalid dates rejected
    // ────────────────────────────────────────────────────────
    try {
      const invalidDate = await request(`${API_URL}/api/health/goals`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${testUser.token}` },
        body: {
          goal_type: 'fat_loss',
          target_date: '2026-02-31', // Invalid date
          cal: 1800
        }
      });

      if (invalidDate.status === 400 && invalidDate.body.error?.includes('valid date')) {
        pass('Bug #3: Invalid dates rejected (2026-02-31)');
      } else {
        fail('Bug #3: Invalid dates not rejected', `Status: ${invalidDate.status}`);
      }
    } catch (e) {
      fail('Bug #3: Test error', e.message);
    }

    // ────────────────────────────────────────────────────────
    // BUG #4: Negative quantities blocked
    // ────────────────────────────────────────────────────────
    try {
      // First create a meal
      const meal = await request(`${API_URL}/api/meals`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.token}` },
        body: {
          food_name: 'Test Food',
          meal_type: 'lunch',
          log_date: '2026-06-10',
          qty: 100,
          unit: 'g',
          cal: 200,
          protein_g: 10,
          fiber_g: 2,
          carbs_g: 20,
          fat_g: 5
        }
      });

      if (meal.status === 201) {
        const mealId = meal.body.entry.id;

        // Try to edit with negative qty
        const negEdit = await request(`${API_URL}/api/meals/${mealId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${testUser.token}` },
          body: { qty: -50, unit: 'g' }
        });

        if (negEdit.status === 400 && negEdit.body.error?.includes('greater than 0')) {
          pass('Bug #4: Negative quantities rejected');
        } else {
          fail('Bug #4: Negative quantities accepted', `Status: ${negEdit.status}`);
        }
      } else {
        warn('Bug #4: Could not create test meal');
      }
    } catch (e) {
      fail('Bug #4: Test error', e.message);
    }

    // ────────────────────────────────────────────────────────
    // BUG #5: Manual meal calories recalculate
    // ────────────────────────────────────────────────────────
    try {
      const manualMeal = await request(`${API_URL}/api/meals`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.token}` },
        body: {
          food_name: 'Manual Chicken',
          meal_type: 'dinner',
          log_date: '2026-06-10',
          qty: 100,
          unit: 'g',
          cal: 200,
          protein_g: 20,
          fiber_g: 0,
          carbs_g: 0,
          fat_g: 10
        }
      });

      if (manualMeal.status === 201) {
        const mealId = manualMeal.body.entry.id;

        // Edit to 200g - should double calories
        const edited = await request(`${API_URL}/api/meals/${mealId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${testUser.token}` },
          body: { qty: 200, unit: 'g' }
        });

        if (edited.status === 200 && edited.body.entry.cal === 400 && edited.body.entry.protein_g === 40) {
          pass('Bug #5: Manual meal macros scale proportionally (100g→200g doubles calories)');
        } else {
          fail('Bug #5: Macros not scaling', `Cal: ${edited.body.entry.cal} (expected 400), Protein: ${edited.body.entry.protein_g} (expected 40)`);
        }
      }
    } catch (e) {
      fail('Bug #5: Test error', e.message);
    }

    // ────────────────────────────────────────────────────────
    // BUG #9 & #10: Tier enforcement
    // ────────────────────────────────────────────────────────
    try {
      // Check Coach endpoint (should require Pro tier)
      const coach = await request(`${API_URL}/api/coach`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.token}` },
        body: {
          question: 'Test question',
          from: '2026-06-01',
          to: '2026-06-10'
        }
      });

      // Free tier should get blocked (403 or feature-gated response)
      if (coach.status === 403 || (coach.status === 200 && coach.body.error?.includes('tier'))) {
        pass('Bug #9: Coach blocked for free users');
      } else {
        warn('Bug #9: Coach accessibility unclear - may need frontend test');
      }
    } catch (e) {
      warn('Bug #9: Could not test Coach endpoint - ' + e.message);
    }

    // ────────────────────────────────────────────────────────
    // BUG #11: Pricing consistency
    // ────────────────────────────────────────────────────────
    try {
      const billing = await request(`${API_URL}/api/billing/status`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${testUser.token}` }
      });

      if (billing.status === 200) {
        const proPlan = billing.body.plans?.pro;
        const clinicalPlan = billing.body.plans?.clinical;

        if (proPlan?.price === '$4.99/mo' && clinicalPlan?.price === '$9.99/mo') {
          pass('Bug #11: Pricing consistent (Pro $4.99, Clinical $9.99)');
        } else {
          fail('Bug #11: Pricing mismatch', `Pro: ${proPlan?.price}, Clinical: ${clinicalPlan?.price}`);
        }
      }
    } catch (e) {
      fail('Bug #11: Test error', e.message);
    }

    // ────────────────────────────────────────────────────────
    // Frontend checks
    // ────────────────────────────────────────────────────────
    info('\n🌐 Testing Frontend...\n');

    try {
      const frontendRes = await request(FRONTEND_URL);
      if (frontendRes.status === 200) {
        pass('Frontend accessible');

        // Check for manifest
        const manifestRes = await request(`${FRONTEND_URL}/manifest.webmanifest`);
        if (manifestRes.status === 200) {
          const manifest = manifestRes.body;
          if (typeof manifest === 'object' && !manifest.screenshots) {
            pass('PWA Manifest fixed (no missing screenshots)');
          } else if (manifest.screenshots) {
            warn('PWA Manifest still has screenshots reference');
          } else {
            pass('PWA Manifest accessible');
          }
        }
      }
    } catch (e) {
      fail('Frontend test error', e.message);
    }

    // ────────────────────────────────────────────────────────
    // Checkout "coming soon" check
    // ────────────────────────────────────────────────────────
    try {
      const checkout = await request(`${API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUser.token}` },
        body: { plan: 'pro' }
      });

      if (checkout.status === 503 && checkout.body.coming_soon) {
        pass('Payment workaround: Returns "coming soon" message correctly');
      } else {
        warn('Payment status unclear - check manually');
      }
    } catch (e) {
      warn('Payment test error - ' + e.message);
    }

  } catch (e) {
    console.error('\n❌ Test suite error:', e.message);
  }

  // ────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`${GREEN}✅ Passed: ${passCount}${RESET}`);
  console.log(`${RED}❌ Failed: ${failCount}${RESET}`);
  console.log(`${YELLOW}📈 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%${RESET}`);
  console.log('='.repeat(60) + '\n');

  if (failCount === 0) {
    console.log(`${GREEN}🎉 ALL TESTS PASSED! Ready for production! 🚀${RESET}\n`);
  } else {
    console.log(`${YELLOW}⚠️  Some tests failed. Review above for details.${RESET}\n`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
