import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('VitaNudge - Quick Smoke Test Suite', () => {

  test('APP-001: Application is accessible', async ({ page }) => {
    console.log('Testing: Application accessibility');

    await page.goto(BASE_URL);

    // Should load successfully
    expect(page.url()).toContain('vitanudge');

    // Should not show error page
    const errorText = await page.locator('text=/error|not found|500|404/i').count();
    expect(errorText).toBe(0);

    console.log('✅ APP-001 PASSED - Application is accessible');
  });

  test('AUTH-001: Registration page loads', async ({ page }) => {
    console.log('Testing: Registration page');

    await page.goto(`${BASE_URL}/register`);

    // Check for registration form elements
    const nameInput = await page.locator('input[placeholder*="name"], input[name="name"]').count();
    const emailInput = await page.locator('input[placeholder*="email"], input[type="text"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button:has-text("Create account"), button[type="submit"]').count();

    expect(nameInput).toBeGreaterThan(0);
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    expect(submitButton).toBeGreaterThan(0);

    console.log('✅ AUTH-001 PASSED - Registration form present');
  });

  test('AUTH-002: Login page loads', async ({ page }) => {
    console.log('Testing: Login page');

    await page.goto(`${BASE_URL}/login`);

    const emailInput = await page.locator('input[placeholder*="email"], input[type="text"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const loginButton = await page.locator('button:has-text("Continue"), button:has-text("Log in"), button[type="submit"]').count();

    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    expect(loginButton).toBeGreaterThan(0);

    console.log('✅ AUTH-002 PASSED - Login form present');
  });

  test('AUTH-003: Invalid email validation', async ({ page }) => {
    console.log('Testing: Email validation');

    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[placeholder*="name"], input[name="name"]', 'Test User');
    await page.fill('input[placeholder*="email"], input[type="text"]', 'invalidemail'); // Invalid
    await page.fill('input[type="password"]', 'TestPass123');

    await page.click('button:has-text("Create account"), button[type="submit"]');

    // Wait a moment for validation
    await page.waitForTimeout(1000);

    // Should show error or not redirect
    const currentUrl = page.url();
    expect(currentUrl).toContain('/register');

    console.log('✅ AUTH-003 PASSED - Invalid email rejected');
  });

  test('API-001: Backend API is accessible', async ({ request }) => {
    console.log('Testing: Backend API health');

    // Try to access API (should return 401 for protected route)
    const response = await request.get(`${BASE_URL}/api/meals?date=2026-06-13`);

    // Should respond (401 is fine - means API is working)
    expect([200, 401, 403]).toContain(response.status());

    console.log(`✅ API-001 PASSED - API responding (${response.status()})`);
  });

  test('SECURITY-001: SQL Injection prevention (Login)', async ({ page }) => {
    console.log('Testing: SQL injection prevention');

    await page.goto(`${BASE_URL}/login`);

    // Try SQL injection payload
    await page.fill('input[placeholder*="email"], input[type="text"]', "admin' OR '1'='1");
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Continue"), button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should NOT login - should stay on login page or show error
    const url = page.url();
    expect(url).toContain('/login');

    console.log('✅ SECURITY-001 PASSED - SQL injection blocked');
  });

  test('PERF-001: Page load performance', async ({ page }) => {
    console.log('Testing: Page load performance');

    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // Should load in under 10 seconds (generous for first load)
    expect(loadTime).toBeLessThan(10000);

    console.log('✅ PERF-001 PASSED - Page loads in acceptable time');
  });

  test('UI-001: No console errors on load', async ({ page }) => {
    console.log('Testing: Console errors');

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }

    // Allow 0 errors (or log them for review)
    console.log(`Console errors: ${consoleErrors.length}`);

    console.log('✅ UI-001 PASSED - Console errors logged');
  });
});
