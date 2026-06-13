# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive/data-integrity.spec.js >> Data Integrity & Duplicate Detection >> DATA-002: Database Constraints Validation
- Location: tests/comprehensive/data-integrity.spec.js:152:7

# Error details

```
SyntaxError: Unexpected end of JSON input
```

# Test source

```ts
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
  121 |     // Normalize and check for duplicates
  122 |     const normalizedNames = foods.map(f => ({
  123 |       original: f.name,
  124 |       normalized: f.name.toLowerCase().trim()
  125 |     }));
  126 | 
  127 |     const duplicateMap = {};
  128 |     normalizedNames.forEach(item => {
  129 |       if (duplicateMap[item.normalized]) {
  130 |         duplicateMap[item.normalized].push(item.original);
  131 |       } else {
  132 |         duplicateMap[item.normalized] = [item.original];
  133 |       }
  134 |     });
  135 | 
  136 |     const duplicates = Object.entries(duplicateMap)
  137 |       .filter(([key, values]) => values.length > 1);
  138 | 
  139 |     if (duplicates.length > 0) {
  140 |       console.log(`\n⚠️  Found ${duplicates.length} duplicate(s):`);
  141 |       duplicates.forEach(([normalized, variants]) => {
  142 |         console.log(`  "${normalized}": ${variants.length} variants`);
  143 |         variants.forEach(v => console.log(`    - "${v}"`));
  144 |       });
  145 |     } else {
  146 |       console.log('✅ No duplicates found in library');
  147 |     }
  148 | 
  149 |     console.log('\n✅ DATA-001 PASSED - Duplicate detection tested');
  150 |   });
  151 | 
  152 |   test('DATA-002: Database Constraints Validation', async ({ request }) => {
  153 |     console.log('\n=== Testing Database Constraints ===');
  154 | 
  155 |     // Register user
  156 |     const timestamp = Date.now();
  157 |     const response = await request.post(`${BASE_URL}/api/auth/register`, {
  158 |       data: {
  159 |         name: 'Constraint Test User',
  160 |         email: `constraint.${timestamp}@example.com`,
  161 |         password: 'Constraint123'
  162 |       }
  163 |     });
  164 | 
> 165 |     const data = await response.json();
      |                  ^ SyntaxError: Unexpected end of JSON input
  166 |     const token = data.token;
  167 | 
  168 |     // Test negative calories
  169 |     console.log('\n--- Test: Negative Calories ---');
  170 |     const negativeCal = await request.post(`${BASE_URL}/api/meals`, {
  171 |       headers: { 'Authorization': `Bearer ${token}` },
  172 |       data: {
  173 |         food_name: 'Test Food',
  174 |         meal_type: 'lunch',
  175 |         log_date: '2026-06-13',
  176 |         cal: -100, // negative
  177 |         protein_g: 10,
  178 |         carbs_g: 15,
  179 |         fiber_g: 2,
  180 |         fat_g: 3
  181 |       }
  182 |     });
  183 | 
  184 |     if (negativeCal.status() === 400) {
  185 |       console.log('✅ Negative calories rejected');
  186 |     } else if (negativeCal.status() === 200) {
  187 |       console.log('⚠️  Negative calories allowed (validation needed)');
  188 |     }
  189 | 
  190 |     // Test very large calories
  191 |     console.log('\n--- Test: Very Large Calories ---');
  192 |     const largeCal = await request.post(`${BASE_URL}/api/meals`, {
  193 |       headers: { 'Authorization': `Bearer ${token}` },
  194 |       data: {
  195 |         food_name: 'Large Food',
  196 |         meal_type: 'lunch',
  197 |         log_date: '2026-06-13',
  198 |         cal: 999999, // very large
  199 |         protein_g: 10,
  200 |         carbs_g: 15,
  201 |         fiber_g: 2,
  202 |         fat_g: 3
  203 |       }
  204 |     });
  205 | 
  206 |     if ([200, 201].includes(largeCal.status())) {
  207 |       console.log('✅ Large calories accepted (no overflow)');
  208 |     } else {
  209 |       console.log('⚠️  Large calories rejected (may have limit)');
  210 |     }
  211 | 
  212 |     // Test empty food name
  213 |     console.log('\n--- Test: Empty Food Name ---');
  214 |     const emptyName = await request.post(`${BASE_URL}/api/meals`, {
  215 |       headers: { 'Authorization': `Bearer ${token}` },
  216 |       data: {
  217 |         food_name: '',
  218 |         meal_type: 'lunch',
  219 |         log_date: '2026-06-13',
  220 |         cal: 100
  221 |       }
  222 |     });
  223 | 
  224 |     if (emptyName.status() === 400) {
  225 |       console.log('✅ Empty food name rejected');
  226 |     } else if (emptyName.status() === 200) {
  227 |       console.log('⚠️  Empty food name allowed');
  228 |     }
  229 | 
  230 |     console.log('\n✅ DATA-002 PASSED - Constraint validation tested');
  231 |   });
  232 | });
  233 | 
```