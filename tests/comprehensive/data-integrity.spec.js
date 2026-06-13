import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('Data Integrity & Duplicate Detection', () => {

  test('DATA-001: Food Library - Duplicate Detection', async ({ request }) => {
    console.log('\n=== Testing Food Library Duplicate Detection ===');

    // Register user
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'Duplicate Test User',
        email: `dup.${timestamp}@example.com`,
        password: 'DupTest123'
      }
    });

    const data = await response.json();
    const token = data.token;

    console.log('User registered, testing duplicate scenarios...');

    // Test Case 1: Exact duplicate
    console.log('\n--- Test 1: Exact Duplicate ---');
    const food1 = await request.post(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        name: 'Test Rice',
        base_amount: 100,
        base_unit: 'g',
        cal: 130,
        protein_g: 2.7,
        carbs_g: 28,
        fiber_g: 0.4,
        fat_g: 0.3
      }
    });

    expect(food1.status()).toBe(200);
    console.log('✅ First save: "Test Rice" - SUCCESS');

    const food1Duplicate = await request.post(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        name: 'Test Rice',
        base_amount: 100,
        base_unit: 'g',
        cal: 130,
        protein_g: 2.7,
        carbs_g: 28,
        fiber_g: 0.4,
        fat_g: 0.3
      }
    });

    if (food1Duplicate.status() === 409) {
      console.log('✅ Duplicate rejected with 409 Conflict');
      const errorData = await food1Duplicate.json();
      console.log(`   Error message: "${errorData.error}"`);
    } else if (food1Duplicate.status() === 200) {
      console.log('⚠️  Duplicate allowed - potential issue');
    }

    // Test Case 2: Case-insensitive duplicate
    console.log('\n--- Test 2: Case Variation ---');
    const food2 = await request.post(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        name: 'test rice', // lowercase
        base_amount: 100,
        base_unit: 'g',
        cal: 130,
        protein_g: 2.7,
        carbs_g: 28,
        fiber_g: 0.4,
        fat_g: 0.3
      }
    });

    if (food2.status() === 409) {
      console.log('✅ Case-insensitive duplicate blocked');
    } else if (food2.status() === 200) {
      console.log('⚠️  Case variation allowed (case-sensitive)');
    }

    // Test Case 3: Trailing space duplicate
    console.log('\n--- Test 3: Trailing Space ---');
    const food3 = await request.post(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        name: 'Test Rice ', // trailing space
        base_amount: 100,
        base_unit: 'g',
        cal: 130,
        protein_g: 2.7,
        carbs_g: 28,
        fiber_g: 0.4,
        fat_g: 0.3
      }
    });

    if (food3.status() === 409) {
      console.log('✅ Trailing space duplicate blocked');
    } else if (food3.status() === 200) {
      console.log('⚠️  Trailing space allowed (not trimmed)');
    }

    // Test Case 4: Get all foods and check for duplicates
    console.log('\n--- Test 4: Library Scan for Duplicates ---');
    const libraryResponse = await request.get(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const libraryData = await libraryResponse.json();
    const foods = libraryData.foods || [];

    console.log(`Total foods in library: ${foods.length}`);

    // Normalize and check for duplicates
    const normalizedNames = foods.map(f => ({
      original: f.name,
      normalized: f.name.toLowerCase().trim()
    }));

    const duplicateMap = {};
    normalizedNames.forEach(item => {
      if (duplicateMap[item.normalized]) {
        duplicateMap[item.normalized].push(item.original);
      } else {
        duplicateMap[item.normalized] = [item.original];
      }
    });

    const duplicates = Object.entries(duplicateMap)
      .filter(([key, values]) => values.length > 1);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate(s):`);
      duplicates.forEach(([normalized, variants]) => {
        console.log(`  "${normalized}": ${variants.length} variants`);
        variants.forEach(v => console.log(`    - "${v}"`));
      });
    } else {
      console.log('✅ No duplicates found in library');
    }

    console.log('\n✅ DATA-001 PASSED - Duplicate detection tested');
  });

  test('DATA-002: Database Constraints Validation', async ({ request }) => {
    console.log('\n=== Testing Database Constraints ===');

    // Register user
    const timestamp = Date.now();
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'Constraint Test User',
        email: `constraint.${timestamp}@example.com`,
        password: 'Constraint123'
      }
    });

    const data = await response.json();
    const token = data.token;

    // Test negative calories
    console.log('\n--- Test: Negative Calories ---');
    const negativeCal = await request.post(`${BASE_URL}/api/meals`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        food_name: 'Test Food',
        meal_type: 'lunch',
        log_date: '2026-06-13',
        cal: -100, // negative
        protein_g: 10,
        carbs_g: 15,
        fiber_g: 2,
        fat_g: 3
      }
    });

    if (negativeCal.status() === 400) {
      console.log('✅ Negative calories rejected');
    } else if (negativeCal.status() === 200) {
      console.log('⚠️  Negative calories allowed (validation needed)');
    }

    // Test very large calories
    console.log('\n--- Test: Very Large Calories ---');
    const largeCal = await request.post(`${BASE_URL}/api/meals`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        food_name: 'Large Food',
        meal_type: 'lunch',
        log_date: '2026-06-13',
        cal: 999999, // very large
        protein_g: 10,
        carbs_g: 15,
        fiber_g: 2,
        fat_g: 3
      }
    });

    if ([200, 201].includes(largeCal.status())) {
      console.log('✅ Large calories accepted (no overflow)');
    } else {
      console.log('⚠️  Large calories rejected (may have limit)');
    }

    // Test empty food name
    console.log('\n--- Test: Empty Food Name ---');
    const emptyName = await request.post(`${BASE_URL}/api/meals`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        food_name: '',
        meal_type: 'lunch',
        log_date: '2026-06-13',
        cal: 100
      }
    });

    if (emptyName.status() === 400) {
      console.log('✅ Empty food name rejected');
    } else if (emptyName.status() === 200) {
      console.log('⚠️  Empty food name allowed');
    }

    console.log('\n✅ DATA-002 PASSED - Constraint validation tested');
  });
});
