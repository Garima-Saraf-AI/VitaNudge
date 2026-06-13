# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quick-smoke-test.spec.js >> VitaNudge - Quick Smoke Test Suite >> AUTH-001: Registration page loads
- Location: tests/quick-smoke-test.spec.js:22:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e6]:
    - region "VitaNudge product overview" [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - img [ref=e11]
          - generic [ref=e13]: VitaNudge
        - generic [ref=e14]: Plus preview
      - generic [ref=e16]:
        - generic [ref=e17]: VitaNudge Plus Preview
        - heading "Small nudges. Big results." [level=1] [ref=e18]
        - paragraph [ref=e19]: Your daily push toward better health, with meals, glucose, water, weight, medications, recipes, reports, and coaching in one calm workflow.
        - generic [ref=e20]:
          - generic [ref=e21]: No payment now
          - generic [ref=e22]: Plus tools preview
          - generic [ref=e23]: Launch-ready value
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: Meal score
            - strong [ref=e27]: "82"
          - generic [ref=e28]:
            - generic [ref=e29]: AI insight
            - strong [ref=e30]: Higher carbs detected. Add protein or greens before dinner.
          - generic [ref=e31]:
            - generic [ref=e32]:
              - generic [ref=e33]: Carbs
              - strong [ref=e34]: 118g
            - generic [ref=e35]:
              - generic [ref=e36]: Protein
              - strong [ref=e37]: 72g
            - generic [ref=e38]:
              - generic [ref=e39]: Fiber
              - strong [ref=e40]: 28g
    - generic [ref=e42]:
      - generic [ref=e43]:
        - img [ref=e45]
        - generic [ref=e47]:
          - generic [ref=e48]: Get started free
          - generic [ref=e49]: VitaNudge
      - heading "Create your VitaNudge account" [level=2] [ref=e50]
      - generic [ref=e51]: Track meals, health metrics, and get AI-powered insights. Start with our free tier.
      - generic [ref=e52]: Free tier includes core features. Upgrade anytime for Pro features.
      - generic [ref=e53]:
        - generic [ref=e55]:
          - generic [ref=e56]: Your name
          - textbox "Rahul Sharma" [ref=e57]
        - generic [ref=e59]:
          - generic [ref=e60]: Email
          - textbox "you@email.com" [ref=e61]
        - generic [ref=e63]:
          - generic [ref=e64]: Password
          - textbox "Min 6 chars, include letter & number" [ref=e65]
          - generic [ref=e66]: At least 6 characters with a letter and a number
        - button "Create account" [ref=e67] [cursor=pointer]
      - paragraph [ref=e68]:
        - text: Already have an account?
        - link "Log in" [ref=e69] [cursor=pointer]:
          - /url: /login
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'https://vitanudge.onrender.com';
  4   | 
  5   | test.describe('VitaNudge - Quick Smoke Test Suite', () => {
  6   | 
  7   |   test('APP-001: Application is accessible', async ({ page }) => {
  8   |     console.log('Testing: Application accessibility');
  9   | 
  10  |     await page.goto(BASE_URL);
  11  | 
  12  |     // Should load successfully
  13  |     expect(page.url()).toContain('vitanudge');
  14  | 
  15  |     // Should not show error page
  16  |     const errorText = await page.locator('text=/error|not found|500|404/i').count();
  17  |     expect(errorText).toBe(0);
  18  | 
  19  |     console.log('✅ APP-001 PASSED - Application is accessible');
  20  |   });
  21  | 
  22  |   test('AUTH-001: Registration page loads', async ({ page }) => {
  23  |     console.log('Testing: Registration page');
  24  | 
  25  |     await page.goto(`${BASE_URL}/register`);
  26  | 
  27  |     // Check for registration form elements
  28  |     const nameInput = await page.locator('input[placeholder*="name"], input[name="name"]').count();
  29  |     const emailInput = await page.locator('input[placeholder*="email"], input[type="text"]').count();
  30  |     const passwordInput = await page.locator('input[type="password"]').count();
  31  |     const submitButton = await page.locator('button:has-text("Create account"), button[type="submit"]').count();
  32  | 
> 33  |     expect(nameInput).toBeGreaterThan(0);
      |                       ^ Error: expect(received).toBeGreaterThan(expected)
  34  |     expect(emailInput).toBeGreaterThan(0);
  35  |     expect(passwordInput).toBeGreaterThan(0);
  36  |     expect(submitButton).toBeGreaterThan(0);
  37  | 
  38  |     console.log('✅ AUTH-001 PASSED - Registration form present');
  39  |   });
  40  | 
  41  |   test('AUTH-002: Login page loads', async ({ page }) => {
  42  |     console.log('Testing: Login page');
  43  | 
  44  |     await page.goto(`${BASE_URL}/login`);
  45  | 
  46  |     const emailInput = await page.locator('input[placeholder*="email"], input[type="text"]').count();
  47  |     const passwordInput = await page.locator('input[type="password"]').count();
  48  |     const loginButton = await page.locator('button:has-text("Continue"), button:has-text("Log in"), button[type="submit"]').count();
  49  | 
  50  |     expect(emailInput).toBeGreaterThan(0);
  51  |     expect(passwordInput).toBeGreaterThan(0);
  52  |     expect(loginButton).toBeGreaterThan(0);
  53  | 
  54  |     console.log('✅ AUTH-002 PASSED - Login form present');
  55  |   });
  56  | 
  57  |   test('AUTH-003: Invalid email validation', async ({ page }) => {
  58  |     console.log('Testing: Email validation');
  59  | 
  60  |     await page.goto(`${BASE_URL}/register`);
  61  | 
  62  |     await page.fill('input[placeholder*="name"], input[name="name"]', 'Test User');
  63  |     await page.fill('input[placeholder*="email"], input[type="text"]', 'invalidemail'); // Invalid
  64  |     await page.fill('input[type="password"]', 'TestPass123');
  65  | 
  66  |     await page.click('button:has-text("Create account"), button[type="submit"]');
  67  | 
  68  |     // Wait a moment for validation
  69  |     await page.waitForTimeout(1000);
  70  | 
  71  |     // Should show error or not redirect
  72  |     const currentUrl = page.url();
  73  |     expect(currentUrl).toContain('/register');
  74  | 
  75  |     console.log('✅ AUTH-003 PASSED - Invalid email rejected');
  76  |   });
  77  | 
  78  |   test('API-001: Backend API is accessible', async ({ request }) => {
  79  |     console.log('Testing: Backend API health');
  80  | 
  81  |     // Try to access API (should return 401 for protected route)
  82  |     const response = await request.get(`${BASE_URL}/api/meals?date=2026-06-13`);
  83  | 
  84  |     // Should respond (401 is fine - means API is working)
  85  |     expect([200, 401, 403]).toContain(response.status());
  86  | 
  87  |     console.log(`✅ API-001 PASSED - API responding (${response.status()})`);
  88  |   });
  89  | 
  90  |   test('SECURITY-001: SQL Injection prevention (Login)', async ({ page }) => {
  91  |     console.log('Testing: SQL injection prevention');
  92  | 
  93  |     await page.goto(`${BASE_URL}/login`);
  94  | 
  95  |     // Try SQL injection payload
  96  |     await page.fill('input[placeholder*="email"], input[type="text"]', "admin' OR '1'='1");
  97  |     await page.fill('input[type="password"]', 'password');
  98  |     await page.click('button:has-text("Continue"), button[type="submit"]');
  99  | 
  100 |     await page.waitForTimeout(2000);
  101 | 
  102 |     // Should NOT login - should stay on login page or show error
  103 |     const url = page.url();
  104 |     expect(url).toContain('/login');
  105 | 
  106 |     console.log('✅ SECURITY-001 PASSED - SQL injection blocked');
  107 |   });
  108 | 
  109 |   test('PERF-001: Page load performance', async ({ page }) => {
  110 |     console.log('Testing: Page load performance');
  111 | 
  112 |     const startTime = Date.now();
  113 |     await page.goto(BASE_URL);
  114 |     await page.waitForLoadState('networkidle');
  115 |     const loadTime = Date.now() - startTime;
  116 | 
  117 |     console.log(`Page load time: ${loadTime}ms`);
  118 | 
  119 |     // Should load in under 10 seconds (generous for first load)
  120 |     expect(loadTime).toBeLessThan(10000);
  121 | 
  122 |     console.log('✅ PERF-001 PASSED - Page loads in acceptable time');
  123 |   });
  124 | 
  125 |   test('UI-001: No console errors on load', async ({ page }) => {
  126 |     console.log('Testing: Console errors');
  127 | 
  128 |     const consoleErrors = [];
  129 |     page.on('console', msg => {
  130 |       if (msg.type() === 'error') {
  131 |         consoleErrors.push(msg.text());
  132 |       }
  133 |     });
```