/**
 * ACTUAL COMPREHENSIVE TESTS
 * Real tests executed against live API.
 * Categories: Positive, Negative, Boundary, Edge Cases, Real Workflows
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const Database = require('better-sqlite3')

process.env.NODE_ENV = 'test'
process.env.FRONTEND_URL = 'http://localhost:3000'
process.env.GEMINI_API_KEY = ''
process.env.RESEND_API_KEY = ''

const app = require('../server')

let server, baseUrl, token, token2
const email  = `actual-test-${Date.now()}@nutritrack.test`
const email2 = `actual-test2-${Date.now()}@nutritrack.test`
const password = 'Test1234!'
const today     = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

function cleanupUsers() {
  const db = new Database(path.join(__dirname, '../database/nutritrack.db'))
  db.pragma('foreign_keys = ON')
  db.prepare("DELETE FROM users WHERE email LIKE 'actual-test%@nutritrack.test'").run()
  db.close()
}

function startServer() {
  return new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/api`
      resolve()
    })
    server.on('error', reject)
  })
}

function stopServer() {
  return new Promise(resolve => server ? server.close(resolve) : resolve())
}

async function api(method, endpoint, body, expectedStatus = 200, authToken = token) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
  assert.ok(
    expected.includes(res.status),
    `${method} ${endpoint} → expected [${expected}] got ${res.status}: ${JSON.stringify(data)}`
  )
  return { status: res.status, data }
}

test.before(async () => { cleanupUsers(); await startServer() })
test.after(async ()  => { cleanupUsers(); await stopServer()  })

// ── AUTH POSITIVE ────────────────────────────
test('AUTH - POSITIVE', async t => {
  await t.test('register new user returns token + email', async () => {
    const { data } = await api('POST', '/auth/register', { name: 'Test User', email, password }, 201, null)
    assert.ok(data.token)
    assert.equal(data.user.email, email)
    token = data.token
  })

  await t.test('login with correct credentials → token', async () => {
    const { data } = await api('POST', '/auth/login', { email, password }, 200, null)
    assert.ok(data.token)
    token = data.token
  })

  await t.test('GET /auth/me returns current user', async () => {
    const { data } = await api('GET', '/auth/me')
    assert.equal(data.user.email, email)
  })

  await t.test('email stored lowercase', async () => {
    const up = `ACTUAL-UPPER-${Date.now()}@nutritrack.test`
    const { data } = await api('POST', '/auth/register', { name: 'Upper', email: up, password }, 201, null)
    assert.equal(data.user.email, up.toLowerCase())
  })
})

// ── AUTH NEGATIVE ────────────────────────────
test('AUTH - NEGATIVE', async t => {
  await t.test('register missing name → 400', async () => {
    const { data } = await api('POST', '/auth/register', { email: `x${Date.now()}@t.com`, password }, 400, null)
    assert.ok(data.error)
  })

  await t.test('register missing email → 400', async () => {
    const { data } = await api('POST', '/auth/register', { name: 'X', password }, 400, null)
    assert.ok(data.error)
  })

  await t.test('register missing password → 400', async () => {
    const { data } = await api('POST', '/auth/register', { name: 'X', email: `x${Date.now()}@t.com` }, 400, null)
    assert.ok(data.error)
  })

  await t.test('register short password (5 chars) → 400', async () => {
    const { data } = await api('POST', '/auth/register', { name: 'X', email: `x${Date.now()}@t.com`, password: 'ab123' }, 400, null)
    assert.ok(data.error)
  })

  await t.test('register duplicate email → 409', async () => {
    const { data } = await api('POST', '/auth/register', { name: 'Dup', email, password }, 409, null)
    assert.ok(data.error)
  })

  await t.test('login wrong password → 401', async () => {
    const { data } = await api('POST', '/auth/login', { email, password: 'wrongpassword' }, 401, null)
    assert.ok(data.error)
  })

  await t.test('login non-existent email → 401', async () => {
    const { data } = await api('POST', '/auth/login', { email: 'nobody@nowhere.com', password }, 401, null)
    assert.ok(data.error)
  })

  await t.test('protected route without token → 401', async () => {
    await api('GET', '/auth/me', undefined, 401, null)
  })

  await t.test('protected route invalid token → 401', async () => {
    await api('GET', '/auth/me', undefined, 401, 'bad.token.here')
  })
})

// ── AUTH EDGE / BOUNDARY ─────────────────────
test('AUTH - EDGE & BOUNDARY', async t => {
  await t.test('password exactly 6 chars (min boundary) → 201', async () => {
    const { data } = await api('POST', '/auth/register', { name: 'MinPass', email: `min-${Date.now()}@t.com`, password: 'abc123' }, 201, null)
    assert.ok(data.token)
  })

  await t.test('SQL injection in login email → 400 or 401 (no 500)', async () => {
    const { status } = await api('POST', '/auth/login', { email: "'; DROP TABLE users;--", password: 'x' }, [400, 401], null)
    assert.ok([400, 401].includes(status))
  })

  await t.test('SQL injection in register name → 201 (stored safely)', async () => {
    const { status } = await api('POST', '/auth/register', { name: "Robert'); DROP TABLE users;--", email: `sqli-${Date.now()}@t.com`, password: 'secure123' }, 201, null)
    assert.equal(status, 201)
  })
})

// ── MEALS POSITIVE ───────────────────────────
test('MEALS - POSITIVE', async t => {
  let foodId, mealId

  await t.test('get food list', async () => {
    const { data } = await api('GET', '/foods')
    foodId = data.foods[0].id
    assert.ok(foodId)
  })

  await t.test('log food to breakfast → 201', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'breakfast', log_date: today, qty: 100, unit: 'g' }, 201)
    mealId = data.entry.id
    assert.ok(mealId)
    assert.equal(data.entry.meal_type, 'breakfast')
  })

  await t.test('read meals for today shows breakfast', async () => {
    const { data } = await api('GET', `/meals?date=${today}`)
    assert.ok(data.logs.breakfast.length >= 1)
  })

  await t.test('edit meal qty=200 doubles calories', async () => {
    const before = (await api('GET', `/meals?date=${today}`)).data.logs.breakfast.find(e => e.id === mealId)
    const calBefore = before.cal
    const { data } = await api('PUT', `/meals/${mealId}`, { qty: 200, unit: 'g' })
    assert.equal(data.entry.qty, 200)
    assert.equal(data.entry.cal, calBefore * 2)
  })

  await t.test('food_name auto-filled when only food_id sent (no "Unknown")', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'snack', log_date: today, qty: 50, unit: 'g' }, 201)
    assert.ok(data.entry.food_name)
    assert.notEqual(data.entry.food_name, 'Unknown')
    await api('DELETE', `/meals/${data.entry.id}`)
  })

  await t.test('delete meal → success:true', async () => {
    const { data } = await api('DELETE', `/meals/${mealId}`)
    assert.equal(data.success, true)
  })

  await t.test('deleted entry absent from log', async () => {
    const { data } = await api('GET', `/meals?date=${today}`)
    assert.equal(data.logs.breakfast.find(e => e.id === mealId), undefined)
  })
})

// ── MEALS NEGATIVE ───────────────────────────
test('MEALS - NEGATIVE', async t => {
  await t.test('log meal missing meal_type → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: 'x', log_date: today, qty: 1 }, 400)
    assert.ok(data.error)
  })

  await t.test('log meal missing log_date → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: 'x', meal_type: 'lunch', qty: 1 }, 400)
    assert.ok(data.error)
  })

  await t.test('log meal missing qty → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: 'x', meal_type: 'lunch', log_date: today }, 400)
    assert.ok(data.error)
  })

  await t.test('edit non-existent meal → 404', async () => {
    await api('PUT', '/meals/does-not-exist', { qty: 1 }, 404)
  })

  await t.test('delete non-existent meal → 404', async () => {
    await api('DELETE', '/meals/does-not-exist', undefined, 404)
  })

  await t.test('cross-user: user2 cannot delete user1 meal → 403', async () => {
    const { data: reg } = await api('POST', '/auth/register', { name: 'User2', email: email2, password }, 201, null)
    token2 = reg.token
    const { data: foods } = await api('GET', '/foods')
    const { data: meal } = await api('POST', '/meals', { food_id: foods.foods[0].id, meal_type: 'lunch', log_date: today, qty: 1, unit: 'g' }, 201)
    await api('DELETE', `/meals/${meal.entry.id}`, undefined, 403, token2)
    await api('DELETE', `/meals/${meal.entry.id}`) // cleanup with user1
  })
})

// ── MEALS BOUNDARY / EDGE ────────────────────
test('MEALS - BOUNDARY & EDGE', async t => {
  let foodId
  await t.test('setup: get food', async () => {
    const { data } = await api('GET', '/foods')
    foodId = data.foods[0].id
  })

  await t.test('qty=0.1 (very small decimal) → 201', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'snack', log_date: today, qty: 0.1, unit: 'g' }, 201)
    assert.equal(data.entry.qty, 0.1)
    await api('DELETE', `/meals/${data.entry.id}`)
  })

  await t.test('qty=9999 (very large) → 201 with calories > 0', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'snack', log_date: today, qty: 9999, unit: 'g' }, 201)
    assert.ok(data.entry.cal > 0)
    await api('DELETE', `/meals/${data.entry.id}`)
  })

  await t.test('date range same from=to → 200', async () => {
    const { data } = await api('GET', `/meals/range?from=${today}&to=${today}`)
    assert.ok(Array.isArray(data.logs))
  })

  await t.test('GET /meals missing date → 400', async () => {
    await api('GET', '/meals', undefined, 400)
  })

  await t.test('GET /meals/range missing from → 400', async () => {
    await api('GET', `/meals/range?to=${today}`, undefined, 400)
  })

  await t.test('GET /meals/range missing to → 400', async () => {
    await api('GET', `/meals/range?from=${today}`, undefined, 400)
  })
})

// ── COPY YESTERDAY EDGE ──────────────────────
test('MEALS - copy-yesterday edge cases', async t => {
  await t.test('copy from empty day → 404', async () => {
    const { data } = await api('POST', '/meals/copy-yesterday', { date: today, source_date: '2019-01-01' }, 404)
    assert.ok(data.error)
  })

  await t.test('copy with empty entry_ids array → 400', async () => {
    const { data } = await api('POST', '/meals/copy-yesterday', { date: today, entry_ids: [] }, 400)
    assert.ok(data.error)
  })

  await t.test('copy missing date → 400', async () => {
    await api('POST', '/meals/copy-yesterday', {}, 400)
  })
})

// ── FOOD LIBRARY NEGATIVE & EDGE ─────────────
test('FOOD LIBRARY - NEGATIVE & EDGE', async t => {
  let createdId

  await t.test('create food missing cal → 400', async () => {
    const { data } = await api('POST', '/foods', { name: 'IncompleteFood', category: 'custom', base_unit: 'g', base_amount: 100, serving: '100g', protein_g: 5, fiber_g: 2, carbs_g: 10, fat_g: 1 }, 400)
    assert.ok(data.error)
  })

  await t.test('create food with all fields → 201', async () => {
    const { data } = await api('POST', '/foods', { name: `EdgeFood${Date.now()}`, category: 'custom', base_unit: 'g', base_amount: 100, serving: '100g', cal: 200, protein_g: 10, fiber_g: 3, carbs_g: 25, fat_g: 5 }, 201)
    createdId = data.food.id
    assert.ok(createdId)
  })

  await t.test('duplicate food name → 409', async () => {
    const { data: existing } = await api('GET', '/foods')
    const name = existing.foods[0].name
    const { data } = await api('POST', '/foods', { name, category: 'custom', base_unit: 'g', base_amount: 100, serving: '100g', cal: 200, protein_g: 10, fiber_g: 3, carbs_g: 25, fat_g: 5 }, 409)
    assert.ok(data.error)
  })

  await t.test('search=egg returns only matching foods', async () => {
    const { data } = await api('GET', '/foods?search=egg')
    assert.ok(data.foods.length >= 1)
    assert.ok(data.foods.every(f => f.name.toLowerCase().includes('egg') || f.category === 'recipe'))
  })

  await t.test('search with no match returns empty array', async () => {
    const { data } = await api('GET', '/foods?search=xyzNeverExists99999')
    assert.equal(data.foods.length, 0)
  })

  await t.test('update non-existent food → 404', async () => {
    await api('PUT', '/foods/non-existent-id', { name: 'Ghost', cal: 100, protein_g: 5, fiber_g: 1, carbs_g: 10, fat_g: 2, base_unit: 'g', base_amount: 100, serving: '100g', category: 'custom' }, 404)
  })

  await t.test('delete non-existent food → 404', async () => {
    await api('DELETE', '/foods/non-existent-id', undefined, 404)
  })

  await t.test('cleanup: delete created food', async () => {
    if (createdId) {
      const { data } = await api('DELETE', `/foods/${createdId}`)
      assert.equal(data.success, true)
    }
  })
})

// ── WATER NEGATIVE & BOUNDARY ────────────────
test('WATER - NEGATIVE & BOUNDARY', async t => {
  await t.test('log water missing ml → 400', async () => {
    const { data } = await api('POST', '/health/water', { log_date: today }, 400)
    assert.ok(data.error)
  })

  await t.test('log water missing log_date → 400', async () => {
    const { data } = await api('POST', '/health/water', { ml: 250 }, 400)
    assert.ok(data.error)
  })

  await t.test('log ml=1 (boundary min) → 201', async () => {
    const { data } = await api('POST', '/health/water', { ml: 1, log_date: today }, 201)
    assert.equal(data.entry.ml, 1)
    await api('DELETE', `/health/water/${data.entry.id}`)
  })

  await t.test('log ml=5000 (high boundary) → 201', async () => {
    const { data } = await api('POST', '/health/water', { ml: 5000, log_date: today }, 201)
    assert.equal(data.entry.ml, 5000)
    await api('DELETE', `/health/water/${data.entry.id}`)
  })

  await t.test('delete non-existent entry → 404', async () => {
    await api('DELETE', '/health/water/non-existent', undefined, 404)
  })
})

// ── GLUCOSE NEGATIVE & BOUNDARY ──────────────
test('GLUCOSE - NEGATIVE & BOUNDARY', async t => {
  await t.test('log glucose missing value_mgdl → 400', async () => {
    const { data } = await api('POST', '/health/glucose', { timing: 'fasting', log_date: today }, 400)
    assert.ok(data.error)
  })

  await t.test('log glucose=40 (hypoglycemia boundary) → 201', async () => {
    const { data } = await api('POST', '/health/glucose', { value_mgdl: 40, timing: 'fasting', log_date: today }, 201)
    assert.equal(data.entry.value_mgdl, 40)
    await api('DELETE', `/health/glucose/${data.entry.id}`)
  })

  await t.test('log glucose=400 (extreme high) → 201', async () => {
    const { data } = await api('POST', '/health/glucose', { value_mgdl: 400, timing: 'post_meal', log_date: today }, 201)
    assert.equal(data.entry.value_mgdl, 400)
    await api('DELETE', `/health/glucose/${data.entry.id}`)
  })

  await t.test('delete non-existent → 404', async () => {
    await api('DELETE', '/health/glucose/non-existent', undefined, 404)
  })
})

// ── WEIGHT NEGATIVE & BOUNDARY ───────────────
test('WEIGHT - NEGATIVE & BOUNDARY', async t => {
  await t.test('log weight missing weight_kg → 400', async () => {
    const { data } = await api('POST', '/health/weight', { log_date: today }, 400)
    assert.ok(data.error)
  })

  await t.test('log weight=300 (extreme high) → 201', async () => {
    const { data } = await api('POST', '/health/weight', { weight_kg: 300, log_date: today }, 201)
    assert.equal(data.entry.weight_kg, 300)
    await api('DELETE', `/health/weight/${data.entry.id}`)
  })

  await t.test('log weight=72.3 (decimal) stored correctly', async () => {
    const { data } = await api('POST', '/health/weight', { weight_kg: 72.3, log_date: today }, 201)
    assert.equal(data.entry.weight_kg, 72.3)
    await api('DELETE', `/health/weight/${data.entry.id}`)
  })
})

// ── VITALS BP NEGATIVE & BOUNDARY ────────────
test('VITALS BP - NEGATIVE & BOUNDARY', async t => {
  await t.test('log BP missing systolic → 400', async () => {
    const { data } = await api('POST', '/health/bp', { diastolic: 80, log_date: today }, 400)
    assert.ok(data.error)
  })

  await t.test('log BP missing diastolic → 400', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 120, log_date: today }, 400)
    assert.ok(data.error)
  })

  await t.test('log BP normal 120/80 → 201', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 120, diastolic: 80, log_date: today }, 201)
    assert.equal(data.entry.systolic, 120)
    await api('DELETE', `/health/bp/${data.entry.id}`)
  })

  await t.test('log BP crisis 180/120 → 201', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 180, diastolic: 120, log_date: today }, 201)
    assert.equal(data.entry.systolic, 180)
    await api('DELETE', `/health/bp/${data.entry.id}`)
  })
})

// ── MEDICATIONS NEGATIVE & EDGE ──────────────
test('MEDICATIONS - NEGATIVE & EDGE', async t => {
  await t.test('create medication missing name → 400', async () => {
    const { data } = await api('POST', '/health/medications', { dose: '500mg', time_of_day: '08:00' }, 400)
    assert.ok(data.error)
  })

  await t.test('create valid medication → 201', async () => {
    const { data } = await api('POST', '/health/medications', { name: 'TestMetformin', dose: '500mg', time_of_day: '08:00' }, 201)
    assert.equal(data.medication.name, 'TestMetformin')
    await api('DELETE', `/health/medications/${data.medication.id}`)
  })

  await t.test('mark taken for non-existent medication → 404', async () => {
    await api('POST', '/health/medications/non-existent/taken', { log_date: today }, 404)
  })
})

// ── GOALS NEGATIVE & BOUNDARY ────────────────
test('GOALS - NEGATIVE & BOUNDARY', async t => {
  await t.test('get current goals → 200', async () => {
    const { data } = await api('GET', '/health/goals')
    assert.ok(data.goals !== undefined)
  })

  await t.test('update goals with very high cal (5000) → 200', async () => {
    const { data } = await api('PUT', '/health/goals', { cal: 5000, protein_g: 200, fiber_g: 40, carbs_g: 600 })
    assert.equal(data.goals.cal, 5000)
  })

  await t.test('fractional macro values stored correctly', async () => {
    const { data } = await api('PUT', '/health/goals', { cal: 2100, protein_g: 131.5, fiber_g: 28.5, carbs_g: 262.5 })
    assert.equal(data.goals.protein_g, 131.5)
  })

  await t.test('restore sane goals', async () => {
    const { data } = await api('PUT', '/health/goals', { cal: 2000, protein_g: 120, fiber_g: 30, carbs_g: 250 })
    assert.equal(data.goals.cal, 2000)
  })
})

// ── TEMPLATES NEGATIVE & EDGE ────────────────
test('TEMPLATES - NEGATIVE & EDGE', async t => {
  let tplId

  await t.test('create valid template → 201', async () => {
    const { data } = await api('POST', '/templates', {
      name: `EdgeTemplate${Date.now()}`, meal_type: 'breakfast',
      items: [{ food_name: 'Oats', qty: 100, unit: 'g', cal: 360, protein_g: 12, fiber_g: 8, carbs_g: 60, fat_g: 7 }]
    }, 201)
    tplId = data.template.id
    assert.ok(tplId)
  })

  await t.test('log template to different meal type → 201', async () => {
    const { data } = await api('POST', `/templates/${tplId}/log`, { date: today, meal_type: 'snack' }, 201)
    assert.ok(data.logged.length >= 1)
  })

  await t.test('log non-existent template → 404', async () => {
    await api('POST', '/templates/non-existent/log', { date: today, meal_type: 'lunch' }, 404)
  })

  await t.test('delete template → success', async () => {
    const { data } = await api('DELETE', `/templates/${tplId}`)
    assert.equal(data.success, true)
  })
})

// ── REPORT EDGE ──────────────────────────────
test('REPORT - EDGE', async t => {
  await t.test('days=7 report has correct structure', async () => {
    const { data } = await api('GET', `/health/report?days=7&to=${today}`)
    assert.equal(data.range.days, 7)
    assert.ok(Array.isArray(data.meals))
    assert.ok(Array.isArray(data.glucose))
    assert.ok(Array.isArray(data.weight))
  })

  await t.test('days=1 (boundary min) → 200', async () => {
    const { data } = await api('GET', `/health/report?days=1&to=${today}`)
    assert.equal(data.range.days, 1)
  })

  await t.test('days=365 (full year) → 200', async () => {
    const { data } = await api('GET', `/health/report?days=365&to=${today}`)
    assert.ok(data.range.days <= 365, "days capped at server max (actual: "+data.range.days+")")
  })
})

// ── REAL WORKFLOW: Full day log ───────────────
test('REAL WORKFLOW: log full day and verify totals', async t => {
  let foods, entryIds = [], waterEntryId, glucoseEntryId

  await t.test('get food library', async () => {
    const { data } = await api('GET', '/foods')
    foods = data.foods.filter(f => f.category !== 'recipe').slice(0, 3)
    assert.ok(foods.length >= 2)
  })

  await t.test('log breakfast, lunch, dinner', async () => {
    const types = ['breakfast', 'lunch', 'dinner']
    for (const [i, food] of foods.entries()) {
      const { data } = await api('POST', '/meals', { food_id: food.id, meal_type: types[i], log_date: today, qty: 100, unit: 'g' }, 201)
      entryIds.push(data.entry.id)
    }
    assert.equal(entryIds.length, 3)
  })

  await t.test('daily log shows all 3 meal types', async () => {
    const { data } = await api('GET', `/meals?date=${today}`)
    assert.ok(data.logs.breakfast.length >= 1)
    assert.ok(data.logs.lunch.length >= 1)
    assert.ok(data.logs.dinner.length >= 1)
  })

  await t.test('log water 2000ml', async () => {
    const { data } = await api('POST', '/health/water', { ml: 2000, log_date: today }, 201)
    waterEntryId = data.entry.id
    assert.equal(data.entry.ml, 2000)
  })

  await t.test('log post-meal glucose 130', async () => {
    const { data } = await api('POST', '/health/glucose', { value_mgdl: 130, timing: 'post_meal', log_date: today }, 201)
    glucoseEntryId = data.entry.id
    assert.equal(data.entry.value_mgdl, 130)
  })

  await t.test('report includes the glucose entry', async () => {
    const { data } = await api('GET', `/health/report?days=1&to=${today}`)
    assert.ok(data.glucose.some(g => g.avg_post_meal === 130 || g.avg_glucose >= 130), "glucose aggregated: "+JSON.stringify(data.glucose[0]))
  })

  await t.test('cleanup all entries', async () => {
    for (const id of entryIds) await api('DELETE', `/meals/${id}`)
    await api('DELETE', `/health/water/${waterEntryId}`)
    await api('DELETE', `/health/glucose/${glucoseEntryId}`)
  })
})

// ── REAL WORKFLOW: user data isolation ───────
test('REAL WORKFLOW: user data isolation', async t => {
  await t.test('user2 sees 0 meals from user1', async () => {
    const { data } = await api('GET', `/meals?date=${today}`, undefined, 200, token2)
    const total = Object.values(data.logs).flat().length
    assert.equal(total, 0)
  })

  await t.test('user2 has own goals object', async () => {
    const { data } = await api('GET', '/health/goals', undefined, 200, token2)
    assert.ok(data.goals !== undefined)
  })
})

// ─────────────────────────────────────────────
// BUG REGRESSION: BUG-01, BUG-02, BUG-03 fixes
// ─────────────────────────────────────────────
test('BUG REGRESSION: BUG-01 invalid date in meals', async t => {
  let foodId
  await t.test('setup: get food', async () => {
    const { data } = await api('GET', '/foods')
    foodId = data.foods[0].id
  })

  await t.test('BUG-01 "not-a-date" → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'lunch', log_date: 'not-a-date', qty: 100, unit: 'g' }, 400)
    assert.ok(data.error, 'error message present')
  })

  await t.test('BUG-01 "2026-13-99" (impossible date) → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'lunch', log_date: '2026-13-99', qty: 100, unit: 'g' }, 400)
    assert.ok(data.error)
  })

  await t.test('BUG-01 "20260603" (no hyphens) → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'lunch', log_date: '20260603', qty: 100, unit: 'g' }, 400)
    assert.ok(data.error)
  })

  await t.test('BUG-01 valid date "2026-06-03" still → 201', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'lunch', log_date: '2026-06-03', qty: 100, unit: 'g' }, 201)
    assert.ok(data.entry.id)
    await api('DELETE', `/meals/${data.entry.id}`)
  })
})

test('BUG REGRESSION: BUG-02 negative / zero qty in meals', async t => {
  let foodId
  await t.test('setup: get food', async () => {
    const { data } = await api('GET', '/foods')
    foodId = data.foods[0].id
  })

  await t.test('BUG-02 qty = -50 → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'lunch', log_date: '2026-06-03', qty: -50, unit: 'g' }, 400)
    assert.ok(data.error)
  })

  await t.test('BUG-02 qty = -1 → 400', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'lunch', log_date: '2026-06-03', qty: -1, unit: 'g' }, 400)
    assert.ok(data.error)
  })

  await t.test('BUG-02 qty = 0.1 (valid minimum) → 201', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'snack', log_date: '2026-06-03', qty: 0.1, unit: 'g' }, 201)
    assert.ok(data.entry.id)
    await api('DELETE', `/meals/${data.entry.id}`)
  })

  await t.test('BUG-02 qty = 100 (normal) → 201', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'snack', log_date: '2026-06-03', qty: 100, unit: 'g' }, 201)
    assert.ok(data.entry.id)
    await api('DELETE', `/meals/${data.entry.id}`)
  })
})

test('BUG REGRESSION: BUG-03 negative / zero ml in water', async t => {
  await t.test('BUG-03 ml = -100 → 400', async () => {
    const { data } = await api('POST', '/health/water', { ml: -100, log_date: '2026-06-03' }, 400)
    assert.ok(data.error)
  })

  await t.test('BUG-03 ml = -1 → 400', async () => {
    const { data } = await api('POST', '/health/water', { ml: -1, log_date: '2026-06-03' }, 400)
    assert.ok(data.error)
  })

  await t.test('BUG-03 ml = 1 (boundary min) → 201', async () => {
    const { data } = await api('POST', '/health/water', { ml: 1, log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.ml, 1)
    await api('DELETE', `/health/water/${data.entry.id}`)
  })

  await t.test('BUG-03 ml = 250 (normal) → 201', async () => {
    const { data } = await api('POST', '/health/water', { ml: 250, log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.ml, 250)
    await api('DELETE', `/health/water/${data.entry.id}`)
  })
})

// ─────────────────────────────────────────────
// BUG REGRESSION: BUG-04, BUG-05, BUG-06 fixes
// ─────────────────────────────────────────────
test('BUG REGRESSION: BUG-06 medication taken twice same day', async t => {
  let medId, firstEntryId

  await t.test('setup: create medication', async () => {
    const { data } = await api('POST', '/health/medications', { name: `Reg-Med-${Date.now()}`, dose: '500mg', time_of_day: '08:00' }, 201)
    medId = data.medication.id
    assert.ok(medId)
  })

  await t.test('first taken → 201', async () => {
    const { data } = await api('POST', `/health/medications/${medId}/taken`, { log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.status, 'taken')
    firstEntryId = data.entry.id
  })

  await t.test('second taken same day → 200 with already_logged:true', async () => {
    const { data } = await api('POST', `/health/medications/${medId}/taken`, { log_date: '2026-06-03' }, 200)
    assert.equal(data.already_logged, true)
    assert.equal(data.entry.id, firstEntryId, 'same entry id — no duplicate created')
  })

  await t.test('different day → 201 (separate log allowed)', async () => {
    await api('POST', `/health/medications/${medId}/taken`, { log_date: '2026-06-04' }, 201)
  })

  await t.test('cleanup', async () => {
    await api('DELETE', `/health/medications/${medId}`)
  })
})

test('BUG REGRESSION: BUG-04 BP diastolic >= systolic', async t => {
  await t.test('diastolic > systolic (80/120) → 400', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 80, diastolic: 120, log_date: '2026-06-03' }, 400)
    assert.ok(data.error)
  })

  await t.test('diastolic = systolic (120/120) → 400', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 120, diastolic: 120, log_date: '2026-06-03' }, 400)
    assert.ok(data.error)
  })

  await t.test('VALID 120/80 → 201', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 120, diastolic: 80, log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.systolic, 120)
    await api('DELETE', `/health/bp/${data.entry.id}`)
  })

  await t.test('VALID 180/120 (crisis, sys > dia) → 201', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 180, diastolic: 120, log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.systolic, 180)
    await api('DELETE', `/health/bp/${data.entry.id}`)
  })

  await t.test('VALID 121/120 (1 apart) → 201', async () => {
    const { data } = await api('POST', '/health/bp', { systolic: 121, diastolic: 120, log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.systolic, 121)
    await api('DELETE', `/health/bp/${data.entry.id}`)
  })
})

test('BUG REGRESSION: BUG-05 food name length limit', async t => {
  const base = { category: 'custom', base_unit: 'g', base_amount: 100, serving: '100g', cal: 100, protein_g: 5, fiber_g: 2, carbs_g: 10, fat_g: 3 }

  await t.test('name = 500 chars → 400', async () => {
    const { data } = await api('POST', '/foods', { ...base, name: 'A'.repeat(500) }, 400)
    assert.ok(data.error)
  })

  await t.test('name = 101 chars → 400', async () => {
    const { data } = await api('POST', '/foods', { ...base, name: 'A'.repeat(101) }, 400)
    assert.ok(data.error)
  })

  await t.test('name = 100 chars (max boundary) → 201', async () => {
    const { data } = await api('POST', '/foods', { ...base, name: 'A'.repeat(100) }, 201)
    assert.equal(data.food.name.length, 100)
    await api('DELETE', `/foods/${data.food.id}`)
  })

  await t.test('normal name → 201', async () => {
    const { data } = await api('POST', '/foods', { ...base, name: `ValidFood${Date.now()}` }, 201)
    assert.ok(data.food.id)
    await api('DELETE', `/foods/${data.food.id}`)
  })
})

// ─────────────────────────────────────────────
// BUG REGRESSION: BUG-07, BUG-08, BUG-09
// ─────────────────────────────────────────────
test('BUG REGRESSION: BUG-07 invalid meal_type returns 400 not 500', async t => {
  let foodId
  await t.test('setup', async () => {
    const { data } = await api('GET', '/foods')
    foodId = data.foods[0].id
  })

  await t.test('"midnight_snack" → 400 (not server crash)', async () => {
    const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: 'midnight_snack', log_date: '2026-06-03', qty: 100, unit: 'g' }, 400)
    assert.ok(data.error)
  })

  await t.test('"LUNCH" uppercase → 400', async () => {
    await api('POST', '/meals', { food_id: foodId, meal_type: 'LUNCH', log_date: '2026-06-03', qty: 100, unit: 'g' }, 400)
  })

  for (const mt of ['breakfast', 'lunch', 'dinner', 'snack']) {
    await t.test(`"${mt}" (valid) → 201`, async () => {
      const { data } = await api('POST', '/meals', { food_id: foodId, meal_type: mt, log_date: '2026-06-03', qty: 50, unit: 'g' }, 201)
      assert.equal(data.entry.meal_type, mt)
      await api('DELETE', `/meals/${data.entry.id}`)
    })
  }
})

test('BUG REGRESSION: BUG-08 invalid glucose timing returns 400', async t => {
  await t.test('"after_dinner" timing → 400', async () => {
    const { data } = await api('POST', '/health/glucose', { value_mgdl: 100, timing: 'after_dinner', log_date: '2026-06-03' }, 400)
    assert.ok(data.error)
  })

  await t.test('"random_junk" timing → 400', async () => {
    await api('POST', '/health/glucose', { value_mgdl: 100, timing: 'random_junk', log_date: '2026-06-03' }, 400)
  })

  await t.test('"fasting" (valid) → 201', async () => {
    const { data } = await api('POST', '/health/glucose', { value_mgdl: 100, timing: 'fasting', log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.timing, 'fasting')
    await api('DELETE', `/health/glucose/${data.entry.id}`)
  })

  await t.test('no timing provided → defaults to fasting', async () => {
    const { data } = await api('POST', '/health/glucose', { value_mgdl: 100, log_date: '2026-06-03' }, 201)
    assert.equal(data.entry.timing, 'fasting')
    await api('DELETE', `/health/glucose/${data.entry.id}`)
  })
})

test('BUG REGRESSION: BUG-09 negative goal values rejected', async t => {
  await t.test('cal = -500 → 400', async () => {
    const { data } = await api('PUT', '/health/goals', { cal: -500, protein_g: 100, fiber_g: 25, carbs_g: 200 }, 400)
    assert.ok(data.error)
  })

  await t.test('protein_g = -50 → 400', async () => {
    const { data } = await api('PUT', '/health/goals', { cal: 100, protein_g: -50, fiber_g: 25, carbs_g: 200 }, 400)
    assert.ok(data.error)
  })

  await t.test('all-zero goals (reset) → 200', async () => {
    await api('PUT', '/health/goals', { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0 })
  })

  await t.test('valid goals → 200 with correct values', async () => {
    const { data } = await api('PUT', '/health/goals', { cal: 2000, protein_g: 120, fiber_g: 30, carbs_g: 250 })
    assert.equal(data.goals.cal, 2000)
  })
})
