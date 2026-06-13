# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive/security-suite.spec.js >> Comprehensive Security Test Suite >> SEC-002: XSS Prevention - Food Name
- Location: tests/comprehensive/security-suite.spec.js:7:7

# Error details

```
SyntaxError: Unexpected end of JSON input
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'https://vitanudge.onrender.com';
  4   | 
  5   | test.describe('Comprehensive Security Test Suite', () => {
  6   | 
  7   |   test('SEC-002: XSS Prevention - Food Name', async ({ page, request }) => {
  8   |     console.log('\n=== Testing XSS Prevention in Food Name ===');
  9   | 
  10  |     // Register and login first
  11  |     const timestamp = Date.now();
  12  |     const response = await request.post(`${BASE_URL}/api/auth/register`, {
  13  |       data: {
  14  |         name: 'XSS Test User',
  15  |         email: `xss.${timestamp}@example.com`,
  16  |         password: 'XssTest123'
  17  |       }
  18  |     });
  19  | 
> 20  |     const data = await response.json();
      |                  ^ SyntaxError: Unexpected end of JSON input
  21  |     const token = data.token;
  22  | 
  23  |     // XSS payloads to test
  24  |     const xssPayloads = [
  25  |       '<script>alert("XSS")</script>',
  26  |       '<img src=x onerror=alert("XSS")>',
  27  |       '<svg onload=alert("XSS")>',
  28  |       '"><script>alert(1)</script>'
  29  |     ];
  30  | 
  31  |     let alertShown = false;
  32  | 
  33  |     // Navigate to page and set up alert listener
  34  |     await page.goto(`${BASE_URL}/`);
  35  | 
  36  |     page.on('dialog', async dialog => {
  37  |       alertShown = true;
  38  |       console.log('⚠️  ALERT SHOWN - XSS vulnerability detected!');
  39  |       await dialog.dismiss();
  40  |     });
  41  | 
  42  |     for (const payload of xssPayloads) {
  43  |       console.log(`Testing payload: ${payload.substring(0, 30)}...`);
  44  | 
  45  |       // Try to add food with XSS payload via API
  46  |       const addResponse = await request.post(`${BASE_URL}/api/meals`, {
  47  |         headers: { 'Authorization': `Bearer ${token}` },
  48  |         data: {
  49  |           food_name: payload,
  50  |           meal_type: 'lunch',
  51  |           log_date: '2026-06-13',
  52  |           cal: 100,
  53  |           protein_g: 10,
  54  |           carbs_g: 15,
  55  |           fiber_g: 2,
  56  |           fat_g: 3
  57  |         }
  58  |       });
  59  | 
  60  |       if (addResponse.status() === 200) {
  61  |         // Reload page to see if script executes
  62  |         await page.reload();
  63  |         await page.waitForTimeout(1000);
  64  | 
  65  |         // Check if alert was shown
  66  |         expect(alertShown).toBe(false);
  67  |         console.log(`✅ Payload blocked or escaped: ${payload.substring(0, 20)}...`);
  68  |       }
  69  |     }
  70  | 
  71  |     if (!alertShown) {
  72  |       console.log('✅ SEC-002 PASSED - All XSS payloads blocked or escaped');
  73  |     } else {
  74  |       throw new Error('XSS vulnerability detected!');
  75  |     }
  76  |   });
  77  | 
  78  |   test('SEC-003: XSS Prevention - Profile Name', async ({ request }) => {
  79  |     console.log('\n=== Testing XSS Prevention in Profile Name ===');
  80  | 
  81  |     // Register user
  82  |     const timestamp = Date.now();
  83  |     const regResponse = await request.post(`${BASE_URL}/api/auth/register`, {
  84  |       data: {
  85  |         name: '<script>alert("XSS")</script>',
  86  |         email: `xss.profile.${timestamp}@example.com`,
  87  |         password: 'XssProfile123'
  88  |       }
  89  |     });
  90  | 
  91  |     // Registration might reject XSS in name, or escape it
  92  |     if (regResponse.status() === 200) {
  93  |       const data = await regResponse.json();
  94  |       const userName = data.user?.name || '';
  95  | 
  96  |       // Name should be escaped or rejected
  97  |       expect(userName).not.toContain('<script>');
  98  |       console.log(`✅ XSS in name escaped: ${userName}`);
  99  |     } else if (regResponse.status() === 400) {
  100 |       console.log('✅ XSS payload rejected during registration');
  101 |     }
  102 | 
  103 |     console.log('✅ SEC-003 PASSED - Profile name XSS prevented');
  104 |   });
  105 | 
  106 |   test('SEC-004: JWT Token Tampering', async ({ request }) => {
  107 |     console.log('\n=== Testing JWT Token Security ===');
  108 | 
  109 |     // Register user and get token
  110 |     const timestamp = Date.now();
  111 |     const response = await request.post(`${BASE_URL}/api/auth/register`, {
  112 |       data: {
  113 |         name: 'JWT Test User',
  114 |         email: `jwt.${timestamp}@example.com`,
  115 |         password: 'JwtTest123'
  116 |       }
  117 |     });
  118 | 
  119 |     const data = await response.json();
  120 |     const validToken = data.token;
```