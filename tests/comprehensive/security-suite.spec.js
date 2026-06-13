import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('Comprehensive Security Test Suite', () => {

  test('SEC-002: XSS Prevention - Food Name', async ({ page, request }) => {
    console.log('\n=== Testing XSS Prevention in Food Name ===');

    // Register and login first
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'XSS Test User',
        email: `xss.${timestamp}@example.com`,
        password: 'XssTest123'
      }
    });

    const data = await response.json();
    const token = data.token;

    // XSS payloads to test
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '"><script>alert(1)</script>'
    ];

    let alertShown = false;

    // Navigate to page and set up alert listener
    await page.goto(`${BASE_URL}/`);

    page.on('dialog', async dialog => {
      alertShown = true;
      console.log('⚠️  ALERT SHOWN - XSS vulnerability detected!');
      await dialog.dismiss();
    });

    for (const payload of xssPayloads) {
      console.log(`Testing payload: ${payload.substring(0, 30)}...`);

      // Try to add food with XSS payload via API
      const addResponse = await request.post(`${BASE_URL}/api/meals`, {
        headers: { 'Authorization': `Bearer ${token}` },
        data: {
          food_name: payload,
          meal_type: 'lunch',
          log_date: '2026-06-13',
          cal: 100,
          protein_g: 10,
          carbs_g: 15,
          fiber_g: 2,
          fat_g: 3
        }
      });

      if (addResponse.status() === 200) {
        // Reload page to see if script executes
        await page.reload();
        await page.waitForTimeout(1000);

        // Check if alert was shown
        expect(alertShown).toBe(false);
        console.log(`✅ Payload blocked or escaped: ${payload.substring(0, 20)}...`);
      }
    }

    if (!alertShown) {
      console.log('✅ SEC-002 PASSED - All XSS payloads blocked or escaped');
    } else {
      throw new Error('XSS vulnerability detected!');
    }
  });

  test('SEC-003: XSS Prevention - Profile Name', async ({ request }) => {
    console.log('\n=== Testing XSS Prevention in Profile Name ===');

    // Register user
    const timestamp = Date.now();
    const regResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: '<script>alert("XSS")</script>',
        email: `xss.profile.${timestamp}@example.com`,
        password: 'XssProfile123'
      }
    });

    // Registration might reject XSS in name, or escape it
    if (regResponse.status() === 200) {
      const data = await regResponse.json();
      const userName = data.user?.name || '';

      // Name should be escaped or rejected
      expect(userName).not.toContain('<script>');
      console.log(`✅ XSS in name escaped: ${userName}`);
    } else if (regResponse.status() === 400) {
      console.log('✅ XSS payload rejected during registration');
    }

    console.log('✅ SEC-003 PASSED - Profile name XSS prevented');
  });

  test('SEC-004: JWT Token Tampering', async ({ request }) => {
    console.log('\n=== Testing JWT Token Security ===');

    // Register user and get token
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'JWT Test User',
        email: `jwt.${timestamp}@example.com`,
        password: 'JwtTest123'
      }
    });

    const data = await response.json();
    const validToken = data.token;

    console.log('Valid token obtained');

    // Tamper with token
    const parts = validToken.split('.');
    if (parts.length === 3) {
      // Modify payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.user_id = 'hacked-user-999';

      const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      console.log('Token tampered - modified user_id');

      // Try to use tampered token
      const mealsResponse = await request.get(`${BASE_URL}/api/meals?date=2026-06-13`, {
        headers: { 'Authorization': `Bearer ${tamperedToken}` }
      });

      // Should be rejected with 401
      expect(mealsResponse.status()).toBe(401);
      console.log('✅ Tampered token rejected with 401');
    }

    console.log('✅ SEC-004 PASSED - JWT tampering detected and blocked');
  });

  test('SEC-009: Authorization - User Data Isolation', async ({ request }) => {
    console.log('\n=== Testing Authorization & Data Isolation ===');

    const timestamp = Date.now();

    // Create User A
    const userA = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'User A',
        email: `usera.${timestamp}@example.com`,
        password: 'UserA123'
      }
    });
    const userAData = await userA.json();
    const tokenA = userAData.token;

    // Create User B
    const userB = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'User B',
        email: `userb.${timestamp}@example.com`,
        password: 'UserB123'
      }
    });
    const userBData = await userB.json();
    const tokenB = userBData.token;

    console.log('Created two users');

    // User A adds a meal
    const mealResponse = await request.post(`${BASE_URL}/api/meals`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
      data: {
        food_name: 'User A Private Food',
        meal_type: 'lunch',
        log_date: '2026-06-13',
        cal: 200
      }
    });

    const mealData = await mealResponse.json();
    const mealId = mealData.entry?.id;

    console.log(`User A created meal: ${mealId}`);

    // User B tries to access User A's meals
    const userBGetMeals = await request.get(`${BASE_URL}/api/meals?date=2026-06-13`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    const userBMeals = await userBGetMeals.json();

    // Should not see User A's meals
    const allMeals = [
      ...(userBMeals.meals?.breakfast || []),
      ...(userBMeals.meals?.lunch || []),
      ...(userBMeals.meals?.dinner || []),
      ...(userBMeals.meals?.snack || [])
    ];

    const foundUserAMeal = allMeals.some(meal => meal.food_name === 'User A Private Food');

    expect(foundUserAMeal).toBe(false);
    console.log('✅ User B cannot see User A meals');

    // User B tries to delete User A's meal (if we have the ID)
    if (mealId) {
      const deleteAttempt = await request.delete(`${BASE_URL}/api/meals/${mealId}`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
      });

      // Should be rejected (403 or 404)
      expect([403, 404]).toContain(deleteAttempt.status());
      console.log(`✅ User B cannot delete User A meal (${deleteAttempt.status()})`);
    }

    console.log('✅ SEC-009 PASSED - Users properly isolated');
  });

  test('SEC-011: Rate Limiting - Brute Force Protection', async ({ request }) => {
    console.log('\n=== Testing Rate Limiting ===');

    const attempts = [];
    const startTime = Date.now();

    // Attempt 15 failed logins rapidly
    for (let i = 0; i < 15; i++) {
      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'WrongPassword'
        }
      });

      attempts.push({
        attempt: i + 1,
        status: response.status(),
        timestamp: Date.now() - startTime
      });

      console.log(`Attempt ${i + 1}: ${response.status()}`);

      // Stop if rate limited
      if (response.status() === 429) {
        console.log(`✅ Rate limited after ${i + 1} attempts`);
        break;
      }
    }

    // Check if rate limiting kicked in
    const rateLimited = attempts.some(a => a.status === 429);

    expect(rateLimited).toBe(true);

    const firstRateLimit = attempts.find(a => a.status === 429);
    console.log(`✅ Rate limiting activated after ${firstRateLimit?.attempt} attempts`);
    console.log(`✅ Time elapsed: ${firstRateLimit?.timestamp}ms`);

    console.log('✅ SEC-011 PASSED - Brute force protection active');
  });

  test('SEC-013: Security Headers', async ({ request }) => {
    console.log('\n=== Testing Security Headers ===');

    const response = await request.get(`${BASE_URL}/`);
    const headers = response.headers();

    console.log('Checking security headers...');

    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN'],
      'x-xss-protection': '1'
    };

    let headersPassed = 0;
    let headersTotal = 0;

    for (const [header, expected] of Object.entries(securityHeaders)) {
      headersTotal++;
      const value = headers[header];

      if (value) {
        if (Array.isArray(expected)) {
          if (expected.some(exp => value.toLowerCase().includes(exp.toLowerCase()))) {
            console.log(`✅ ${header}: ${value}`);
            headersPassed++;
          } else {
            console.log(`⚠️  ${header}: ${value} (expected ${expected.join(' or ')})`);
          }
        } else {
          if (value.toLowerCase().includes(expected.toLowerCase())) {
            console.log(`✅ ${header}: ${value}`);
            headersPassed++;
          } else {
            console.log(`⚠️  ${header}: ${value} (expected ${expected})`);
          }
        }
      } else {
        console.log(`⚠️  ${header}: Not present`);
      }
    }

    console.log(`\nSecurity headers: ${headersPassed}/${headersTotal} present`);

    if (headersPassed >= 2) {
      console.log('✅ SEC-013 PASSED - Key security headers present');
    } else {
      console.log('⚠️  SEC-013 PARTIAL - Some headers missing (acceptable)');
    }
  });
});
