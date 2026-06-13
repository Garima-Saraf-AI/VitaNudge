# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive/data-integrity.spec.js >> Data Integrity & Duplicate Detection >> DATA-001: Food Library - Duplicate Detection
- Location: tests/comprehensive/data-integrity.spec.js:7:7

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
  5   | test.describe('Data Integrity & Duplicate Detection', () => {
  6   | 
  7   |   test('DATA-001: Food Library - Duplicate Detection', async ({ request }) => {
  8   |     console.log('\n=== Testing Food Library Duplicate Detection ===');
  9   | 
  10  |     // Register user
  11  |     const timestamp = Date.now();
  12  |     const response = await request.post(`${BASE_URL}/api/auth/register`, {
  13  |       data: {
  14  |         name: 'Duplicate Test User',
  15  |         email: `dup.${timestamp}@example.com`,
  16  |         password: 'DupTest123'
  17  |       }
  18  |     });
  19  | 
> 20  |     const data = await response.json();
      |                  ^ SyntaxError: Unexpected end of JSON input
  21  |     const token = data.token;
  22  | 
  23  |     console.log('User registered, testing duplicate scenarios...');
  24  | 
  25  |     // Test Case 1: Exact duplicate
  26  |     console.log('\n--- Test 1: Exact Duplicate ---');
  27  |     const food1 = await request.post(`${BASE_URL}/api/foods`, {
  28  |       headers: { 'Authorization': `Bearer ${token}` },
  29  |       data: {
  30  |         name: 'Test Rice',
  31  |         base_amount: 100,
  32  |         base_unit: 'g',
  33  |         cal: 130,
  34  |         protein_g: 2.7,
  35  |         carbs_g: 28,
  36  |         fiber_g: 0.4,
  37  |         fat_g: 0.3
  38  |       }
  39  |     });
  40  | 
  41  |     expect(food1.status()).toBe(200);
  42  |     console.log('✅ First save: "Test Rice" - SUCCESS');
  43  | 
  44  |     const food1Duplicate = await request.post(`${BASE_URL}/api/foods`, {
  45  |       headers: { 'Authorization': `Bearer ${token}` },
  46  |       data: {
  47  |         name: 'Test Rice',
  48  |         base_amount: 100,
  49  |         base_unit: 'g',
  50  |         cal: 130,
  51  |         protein_g: 2.7,
  52  |         carbs_g: 28,
  53  |         fiber_g: 0.4,
  54  |         fat_g: 0.3
  55  |       }
  56  |     });
  57  | 
  58  |     if (food1Duplicate.status() === 409) {
  59  |       console.log('✅ Duplicate rejected with 409 Conflict');
  60  |       const errorData = await food1Duplicate.json();
  61  |       console.log(`   Error message: "${errorData.error}"`);
  62  |     } else if (food1Duplicate.status() === 200) {
  63  |       console.log('⚠️  Duplicate allowed - potential issue');
  64  |     }
  65  | 
  66  |     // Test Case 2: Case-insensitive duplicate
  67  |     console.log('\n--- Test 2: Case Variation ---');
  68  |     const food2 = await request.post(`${BASE_URL}/api/foods`, {
  69  |       headers: { 'Authorization': `Bearer ${token}` },
  70  |       data: {
  71  |         name: 'test rice', // lowercase
  72  |         base_amount: 100,
  73  |         base_unit: 'g',
  74  |         cal: 130,
  75  |         protein_g: 2.7,
  76  |         carbs_g: 28,
  77  |         fiber_g: 0.4,
  78  |         fat_g: 0.3
  79  |       }
  80  |     });
  81  | 
  82  |     if (food2.status() === 409) {
  83  |       console.log('✅ Case-insensitive duplicate blocked');
  84  |     } else if (food2.status() === 200) {
  85  |       console.log('⚠️  Case variation allowed (case-sensitive)');
  86  |     }
  87  | 
  88  |     // Test Case 3: Trailing space duplicate
  89  |     console.log('\n--- Test 3: Trailing Space ---');
  90  |     const food3 = await request.post(`${BASE_URL}/api/foods`, {
  91  |       headers: { 'Authorization': `Bearer ${token}` },
  92  |       data: {
  93  |         name: 'Test Rice ', // trailing space
  94  |         base_amount: 100,
  95  |         base_unit: 'g',
  96  |         cal: 130,
  97  |         protein_g: 2.7,
  98  |         carbs_g: 28,
  99  |         fiber_g: 0.4,
  100 |         fat_g: 0.3
  101 |       }
  102 |     });
  103 | 
  104 |     if (food3.status() === 409) {
  105 |       console.log('✅ Trailing space duplicate blocked');
  106 |     } else if (food3.status() === 200) {
  107 |       console.log('⚠️  Trailing space allowed (not trimmed)');
  108 |     }
  109 | 
  110 |     // Test Case 4: Get all foods and check for duplicates
  111 |     console.log('\n--- Test 4: Library Scan for Duplicates ---');
  112 |     const libraryResponse = await request.get(`${BASE_URL}/api/foods`, {
  113 |       headers: { 'Authorization': `Bearer ${token}` }
  114 |     });
  115 | 
  116 |     const libraryData = await libraryResponse.json();
  117 |     const foods = libraryData.foods || [];
  118 | 
  119 |     console.log(`Total foods in library: ${foods.length}`);
  120 | 
```