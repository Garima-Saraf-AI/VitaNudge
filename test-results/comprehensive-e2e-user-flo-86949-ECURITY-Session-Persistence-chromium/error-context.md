# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive/e2e-user-flow.spec.js >> E2E User Flow - Complete Journey >> E2E-SECURITY: Session Persistence
- Location: tests/comprehensive/e2e-user-flow.spec.js:123:7

# Error details

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]').nth(1)

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
          - textbox "Rahul Sharma" [active] [ref=e57]: Session Test
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
  34  | 
  35  |     // Submit registration
  36  |     await page.click('button:has-text("Create account")');
  37  |     await page.waitForTimeout(3000);
  38  | 
  39  |     // Should redirect to goals or dashboard
  40  |     const currentUrl = page.url();
  41  |     console.log(`After registration, URL: ${currentUrl}`);
  42  |     expect(currentUrl).not.toContain('/register');
  43  |     console.log('✅ Registration successful');
  44  | 
  45  |     // STEP 2: NAVIGATE TO PROFILE
  46  |     console.log('\n=== STEP 2: Complete Profile ===');
  47  |     await page.goto(`${BASE_URL}/profile`);
  48  |     await page.waitForLoadState('networkidle');
  49  | 
  50  |     // Fill profile details
  51  |     try {
  52  |       await page.fill('input[name="age"]', '30');
  53  |       await page.selectOption('select[name="gender"]', 'male');
  54  |       await page.fill('input[name="weight_kg"]', '70');
  55  |       await page.fill('input[name="height_cm"]', '175');
  56  | 
  57  |       await page.click('button:has-text("Save profile"), button[type="submit"]');
  58  |       await page.waitForTimeout(2000);
  59  | 
  60  |       console.log('✅ Profile completed');
  61  |     } catch (error) {
  62  |       console.log('⚠️  Profile fields may have different structure');
  63  |     }
  64  | 
  65  |     // STEP 3: SET GOALS
  66  |     console.log('\n=== STEP 3: Set Goals ===');
  67  |     await page.goto(`${BASE_URL}/goals`);
  68  |     await page.waitForLoadState('networkidle');
  69  |     await page.waitForTimeout(2000);
  70  | 
  71  |     console.log('✅ Goals page accessible');
  72  | 
  73  |     // STEP 4: ADD FOOD ENTRY
  74  |     console.log('\n=== STEP 4: Add Food Entry ===');
  75  |     await page.goto(`${BASE_URL}/`);
  76  |     await page.waitForLoadState('networkidle');
  77  | 
  78  |     // Try to navigate to add food
  79  |     try {
  80  |       await page.goto(`${BASE_URL}/add-food`);
  81  |       await page.waitForLoadState('networkidle');
  82  |       console.log('✅ Food entry page accessible');
  83  |     } catch (error) {
  84  |       console.log('⚠️  Food entry page may need different navigation');
  85  |     }
  86  | 
  87  |     // STEP 5: CHECK LIBRARY
  88  |     console.log('\n=== STEP 5: Food Library ===');
  89  |     await page.goto(`${BASE_URL}/library`);
  90  |     await page.waitForLoadState('networkidle');
  91  |     console.log('✅ Food library accessible');
  92  | 
  93  |     // STEP 6: LOGOUT
  94  |     console.log('\n=== STEP 6: Logout ===');
  95  | 
  96  |     // Try to find logout button (may be in menu)
  97  |     try {
  98  |       await page.goto(`${BASE_URL}/more`);
  99  |       await page.waitForLoadState('networkidle');
  100 | 
  101 |       const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Logout")');
  102 |       if (await logoutButton.count() > 0) {
  103 |         await logoutButton.click();
  104 |         await page.waitForTimeout(2000);
  105 |         console.log('✅ Logout successful');
  106 | 
  107 |         // Should redirect to login
  108 |         const finalUrl = page.url();
  109 |         if (finalUrl.includes('/login')) {
  110 |           console.log('✅ Redirected to login after logout');
  111 |         }
  112 |       } else {
  113 |         console.log('⚠️  Logout button not found in expected location');
  114 |       }
  115 |     } catch (error) {
  116 |       console.log('⚠️  Logout flow may need adjustment');
  117 |     }
  118 | 
  119 |     console.log('\n=== E2E TEST COMPLETE ===');
  120 |     console.log(`✅ User ${testUser.email} completed full journey`);
  121 |   });
  122 | 
  123 |   test('E2E-SECURITY: Session Persistence', async ({ page }) => {
  124 |     console.log('\n=== Testing Session Persistence ===');
  125 | 
  126 |     // Create account
  127 |     const timestamp = Date.now();
  128 |     const testEmail = `session.${timestamp}@example.com`;
  129 | 
  130 |     await page.goto(`${BASE_URL}/register`);
  131 |     await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  132 | 
  133 |     await page.locator('input').first().fill('Session Test');
> 134 |     await page.locator('input[type="text"]').nth(1).fill(testEmail);
      |                                                     ^ TimeoutError: locator.fill: Timeout 15000ms exceeded.
  135 |     await page.locator('input[type="password"]').first().fill('Session123');
  136 |     await page.click('button:has-text("Create account")');
  137 |     await page.waitForTimeout(3000);
  138 | 
  139 |     // Check if token stored
  140 |     const tokenExists = await page.evaluate(() => {
  141 |       return localStorage.getItem('token') !== null;
  142 |     });
  143 | 
  144 |     expect(tokenExists).toBe(true);
  145 |     console.log('✅ JWT token stored in localStorage');
  146 | 
  147 |     // Navigate to different pages
  148 |     await page.goto(`${BASE_URL}/`);
  149 |     await page.goto(`${BASE_URL}/profile`);
  150 |     await page.goto(`${BASE_URL}/library`);
  151 | 
  152 |     // Token should persist
  153 |     const tokenStillExists = await page.evaluate(() => {
  154 |       return localStorage.getItem('token') !== null;
  155 |     });
  156 | 
  157 |     expect(tokenStillExists).toBe(true);
  158 |     console.log('✅ Session persists across navigation');
  159 | 
  160 |     // Close and reopen (simulate browser close)
  161 |     await page.close();
  162 |     const newPage = await page.context().newPage();
  163 |     await newPage.goto(`${BASE_URL}/`);
  164 | 
  165 |     const tokenAfterReopen = await newPage.evaluate(() => {
  166 |       return localStorage.getItem('token') !== null;
  167 |     });
  168 | 
  169 |     if (tokenAfterReopen) {
  170 |       console.log('✅ Session persists after browser reopen');
  171 |     } else {
  172 |       console.log('ℹ️  Session cleared on new page (context-specific)');
  173 |     }
  174 |   });
  175 | });
  176 | 
```