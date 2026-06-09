const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const Database = require('better-sqlite3')

process.env.NODE_ENV = 'test'
process.env.FRONTEND_URL = 'http://localhost:3000'
process.env.GEMINI_API_KEY = ''
process.env.RESEND_API_KEY = ''

const app = require('../server')

let server
let baseUrl
let token
let defaultFood
const email = `regression-${Date.now()}@nutritrack.test`
const password = 'regression123'
const today = '2026-05-16'
const yesterday = '2026-05-15'

function cleanupUser() {
  const dbPath = path.join(__dirname, '../database/nutritrack.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  db.prepare('DELETE FROM users WHERE email = ?').run(email)
  db.close()
}

function upgradeUserToClinical() {
  const dbPath = path.join(__dirname, '../database/nutritrack.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  db.prepare('UPDATE users SET subscription_tier = ? WHERE email = ?').run('clinical', email)
  db.close()
}

function startServer() {
  return new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      baseUrl = `http://127.0.0.1:${port}/api`
      resolve()
    })
    server.on('error', reject)
  })
}

function stopServer() {
  return new Promise(resolve => {
    if (!server) return resolve()
    server.close(() => resolve())
  })
}

async function api(method, endpoint, body, expectedStatus = 200, useAuth = true) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
  assert.ok(
    expected.includes(res.status),
    `${method} ${endpoint} expected ${expected.join('/')} got ${res.status}: ${JSON.stringify(data)}`
  )
  return data
}

test.before(async () => {
  cleanupUser()
  await startServer()
})

test.after(async () => {
  cleanupUser()
  await stopServer()
})

test('NutriTrack full API regression suite', async t => {
  await t.test('health check', async () => {
    const data = await api('GET', '/ping', undefined, 200, false)
    assert.equal(data.status, 'ok')
  })

  await t.test('auth register, login context, and profile update', async () => {
    const reg = await api('POST', '/auth/register', { name: 'Regression User', email, password }, 201, false)
    assert.ok(reg.token)
    assert.ok(reg.user.id)
    token = reg.token

    // Upgrade to Clinical tier for testing all features
    upgradeUserToClinical()

    const me = await api('GET', '/auth/me')
    assert.equal(me.user.email, email)

    const profile = await api('PUT', '/auth/profile', {
      name: 'Regression User',
      email: 'should-not-change-login@example.com',
      age: 34,
      weight_kg: 82,
      height_cm: 178,
      condition: 'Regression profile',
      diet_preference: 'vegan',
    })
    assert.equal(profile.user.email, email)
    assert.equal(profile.user.weight_kg, 82)
    assert.equal(profile.user.height_cm, 178)
    assert.equal(profile.user.diet_preference, 'vegan')
  })

  await t.test('goals read and update', async () => {
    const before = await api('GET', '/health/goals')
    assert.ok(before.goals)

    const updated = await api('PUT', '/health/goals', {
      goal_type: 'muscle',
      activity_level: 'moderate',
      pace: 'steady',
      carb_style: 'performance',
      target_weight_kg: 86,
      target_muscle_gain_kg: 3,
      target_date: '2026-09-01',
      target_summary: 'Regression quantitative target',
      cal: 2100,
      protein_g: 145,
      fiber_g: 38,
      carbs_g: 190,
      water_ml: 3200,
    })
    assert.equal(updated.goals.cal, 2100)
    assert.equal(updated.goals.protein_g, 145)
    assert.equal(updated.goals.goal_type, 'muscle')
    assert.equal(updated.goals.target_weight_kg, 86)
    assert.equal(updated.goals.target_muscle_gain_kg, 3)
  })

	  await t.test('food library list, create, update, delete', async () => {
	    const foods = await api('GET', '/foods')
	    defaultFood = foods.foods.find(food => food.is_default)
	    assert.ok(defaultFood, 'expected seeded default food')

	    const estimated = await api('POST', '/foods/estimate', {
	      name: 'Regression banana',
	      serving: '1 medium banana',
	    })
	    assert.equal(estimated.estimated, true)
	    assert.equal(estimated.food.base_unit, 'piece')
	    assert.equal(estimated.food.cal > 0, true)
	    assert.notEqual(estimated.food.serving, '1 serving')

	    const vagueEstimated = await api('POST', '/foods/estimate', {
	      name: 'Regression mixed meal',
	      serving: '1 serving',
	    })
	    assert.equal(vagueEstimated.estimated, true)
	    assert.equal(vagueEstimated.food.serving.includes('approx'), true)

	    const nameOnlyFood = await api('POST', '/foods', {
	      name: 'Regression Name Only',
	      category: 'custom',
	      base_unit: 'g',
	      base_amount: 100,
	      serving: '100g',
	    }, 400)
	    assert.equal(nameOnlyFood.error, 'Add all before saving. Use AI estimate if you do not know the values.')

	    const created = await api('POST', '/foods', {
      name: 'Regression Custom Food',
      category: 'custom',
      base_unit: 'g',
      base_amount: 100,
      serving: '100g',
      cal: 120,
      protein_g: 9,
      fiber_g: 4,
      carbs_g: 18,
      fat_g: 2,
    }, 201)
    assert.equal(created.food.name, 'Regression Custom Food')

    const duplicate = await api('POST', '/foods', {
      name: 'Regression Custom Food',
      category: 'custom',
      base_unit: 'g',
      base_amount: 100,
      serving: '100g',
      cal: 120,
      protein_g: 9,
      fiber_g: 4,
      carbs_g: 18,
      fat_g: 2,
    }, 409)
    assert.equal(duplicate.error, 'This food is already in your library')

    const updated = await api('PUT', `/foods/${created.food.id}`, { ...created.food, name: 'Regression Custom Food Updated' })
    assert.equal(updated.food.name, 'Regression Custom Food Updated')

    const deleted = await api('DELETE', `/foods/${created.food.id}`)
    assert.equal(deleted.success, true)

    const recipe = await api('POST', '/foods', {
      name: 'Regression Recipe',
      category: 'recipe',
      base_unit: 'serving',
      base_amount: 1,
      serving: '1 bowl',
      cal: 420,
      protein_g: 31,
      fiber_g: 10,
      carbs_g: 44,
      fat_g: 12,
      notes: 'Regression recipe builder save',
    }, 201)
    assert.equal(recipe.food.category, 'recipe')
    assert.equal(recipe.food.protein_g, 31)
    assert.equal((await api('DELETE', `/foods/${recipe.food.id}`)).success, true)
  })

	  await t.test('meals create, read, edit, range, copy yesterday, delete', async () => {
	    const created = await api('POST', '/meals', {
	      food_id: defaultFood.id,
      food_name: defaultFood.name,
      meal_type: 'lunch',
      log_date: yesterday,
      qty: 1,
      unit: defaultFood.base_unit || 'g',
	    }, 201)
	    assert.ok(created.entry.id)

	    const createdDinner = await api('POST', '/meals', {
	      food_id: defaultFood.id,
	      food_name: defaultFood.name,
	      meal_type: 'dinner',
	      log_date: yesterday,
	      qty: 1,
	      unit: defaultFood.base_unit || 'g',
	    }, 201)
	    assert.ok(createdDinner.entry.id)

	    const day = await api('GET', `/meals?date=${yesterday}`)
	    assert.equal(day.logs.lunch.length >= 1, true)
	    assert.equal(day.logs.dinner.length >= 1, true)

    const edited = await api('PUT', `/meals/${created.entry.id}`, { qty: 2, unit: defaultFood.base_unit || 'g' })
    assert.equal(edited.entry.qty, 2)

    const range = await api('GET', `/meals/range?from=${yesterday}&to=${today}`)
    assert.equal(Array.isArray(range.logs), true)

	    const selectedCopy = await api('POST', '/meals/copy-yesterday', {
	      date: today,
	      source_date: yesterday,
	      entry_ids: [created.entry.id],
	    }, 201)
	    assert.equal(selectedCopy.copied.length, 1)
	    assert.equal(selectedCopy.copied[0].meal_type, 'lunch')

	    const copied = await api('POST', '/meals/copy-yesterday', { date: '2026-05-17', source_date: yesterday }, 201)
	    assert.equal(copied.copied.length >= 2, true)

	    const deleted = await api('DELETE', `/meals/${created.entry.id}`)
	    assert.equal(deleted.success, true)
	    const deletedDinner = await api('DELETE', `/meals/${createdDinner.entry.id}`)
	    assert.equal(deletedDinner.success, true)
	  })

  await t.test('water create, read, range, delete', async () => {
    const created = await api('POST', '/health/water', { ml: 250, log_date: today }, 201)
    assert.equal(created.entry.ml, 250)
    const day = await api('GET', `/health/water?date=${today}`)
    assert.equal(day.total_ml >= 250, true)
    const range = await api('GET', `/health/water/range?from=${yesterday}&to=${today}`)
    assert.equal(Array.isArray(range.data), true)
    const deleted = await api('DELETE', `/health/water/${created.entry.id}`)
    assert.equal(deleted.success, true)
  })

  await t.test('glucose create, read, range, delete', async () => {
    const created = await api('POST', '/health/glucose', { value_mgdl: 118, timing: 'fasting', log_date: today }, 201)
    assert.equal(created.entry.value_mgdl, 118)
    const day = await api('GET', `/health/glucose?date=${today}`)
    assert.equal(day.logs.length >= 1, true)
    const range = await api('GET', `/health/glucose/range?from=${yesterday}&to=${today}`)
    assert.equal(Array.isArray(range.data), true)
    const deleted = await api('DELETE', `/health/glucose/${created.entry.id}`)
    assert.equal(deleted.success, true)
  })

  await t.test('weight create, read, range, delete', async () => {
    const created = await api('POST', '/health/weight', { weight_kg: 82, log_date: today, notes: 'regression' }, 201)
    assert.equal(created.entry.weight_kg, 82)
    const day = await api('GET', `/health/weight?date=${today}`)
    assert.equal(day.entry.weight_kg, 82)
    const range = await api('GET', `/health/weight/range?from=${yesterday}&to=${today}`)
    assert.equal(Array.isArray(range.data), true)
    const deleted = await api('DELETE', `/health/weight/${created.entry.id}`)
    assert.equal(deleted.success, true)
  })

  await t.test('vitals BP and HbA1c create, read, range, delete', async () => {
    const bp = await api('POST', '/health/bp', { systolic: 122, diastolic: 78, pulse: 72, log_date: today, notes: 'regression' }, 201)
    assert.equal(bp.entry.systolic, 122)
    const bpDay = await api('GET', `/health/bp?date=${today}`)
    assert.equal(bpDay.logs.length >= 1, true)
    const bpRange = await api('GET', `/health/bp/range?from=${yesterday}&to=${today}`)
    assert.equal(Array.isArray(bpRange.data), true)
    assert.equal((await api('DELETE', `/health/bp/${bp.entry.id}`)).success, true)

    const a1c = await api('POST', '/health/a1c', { value_pct: 6.4, log_date: today, notes: 'regression' }, 201)
    assert.equal(a1c.entry.value_pct, 6.4)
    const a1cRange = await api('GET', `/health/a1c/range?from=2026-01-01&to=${today}`)
    assert.equal(Array.isArray(a1cRange.data), true)
    assert.equal((await api('DELETE', `/health/a1c/${a1c.entry.id}`)).success, true)
  })

  await t.test('medications create, mark taken, undo, delete', async () => {
    const created = await api('POST', '/health/medications', { name: 'Regression Med', dose: '500mg', time_of_day: '08:00' }, 201)
    assert.equal(created.medication.name, 'Regression Med')
    const meds = await api('GET', '/health/medications')
    assert.equal(meds.medications.some(med => med.id === created.medication.id), true)
    const taken = await api('POST', `/health/medications/${created.medication.id}/taken`, { log_date: today }, 201)
    assert.equal(taken.entry.status, 'taken')
    const logs = await api('GET', `/health/medications/logs?date=${today}`)
    assert.equal(logs.logs.some(log => log.id === taken.entry.id), true)
    assert.equal((await api('DELETE', `/health/medication-logs/${taken.entry.id}`)).success, true)
    assert.equal((await api('DELETE', `/health/medications/${created.medication.id}`)).success, true)
  })

  await t.test('meal templates create, list, log, delete', async () => {
    const created = await api('POST', '/templates', {
      name: 'Regression Template',
      meal_type: 'lunch',
      items: [{ food_name: 'Template Food', qty: 1, unit: 'serving', cal: 300, protein_g: 20, fiber_g: 5, carbs_g: 35, fat_g: 8 }],
    }, 201)
    assert.equal(created.template.name, 'Regression Template')
    const templates = await api('GET', '/templates')
    assert.equal(templates.templates.some(tpl => tpl.id === created.template.id), true)
    const logged = await api('POST', `/templates/${created.template.id}/log`, { date: today, meal_type: 'dinner' }, 201)
    assert.equal(logged.logged.length >= 1, true)
    assert.equal((await api('DELETE', `/templates/${created.template.id}`)).success, true)
  })

  await t.test('weekly, monthly, custom report windows and email preference flow', async () => {
    const weeklyReport = await api('GET', `/health/report?days=7&to=${today}`)
    assert.equal(weeklyReport.range.days, 7)

    const monthlyReport = await api('GET', `/health/report?days=30&to=${today}`)
    assert.equal(monthlyReport.range.days, 30)

    const customReport = await api('GET', `/health/report?days=14&to=${today}`)
    assert.equal(customReport.range.days, 14)
    assert.ok(Array.isArray(customReport.meals))
    assert.ok(Array.isArray(customReport.glucose))

    const prefs = await api('GET', '/health/weekly-email')
    assert.ok(prefs.preferences)
    const updated = await api('PUT', '/health/weekly-email', { enabled: 1, email })
    assert.equal(updated.preferences.enabled, 1)
    const send = await api('POST', '/health/weekly-email/send', { email })
    assert.equal(typeof send.sent, 'boolean')
  })

  await t.test('coach local fallback returns an answer', async () => {
    const answer = await api('POST', '/coach', { question: 'Why is glucose high after lunch?', from: yesterday, to: today })
    assert.ok(answer.answer)
    assert.equal(answer.provider, 'local')
  })

  await t.test('scan and barcode validation without external network', async () => {
    const info = await api('GET', '/scan/info')
    assert.equal(Array.isArray(info.features), true)
    const scanValidation = await api('POST', '/scan', {}, 400)
    assert.equal(scanValidation.error, 'imageBase64 is required')
    const barcodeValidation = await api('GET', '/barcode/123', undefined, 400)
    assert.equal(barcodeValidation.error, 'Valid barcode required')
  })
})
