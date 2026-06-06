const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const Database = require('better-sqlite3')

process.env.NODE_ENV = 'test'
process.env.FRONTEND_URL = 'http://localhost:3000'

const app = require('../server')

let server
let baseUrl
let token
const email = `goal-scenarios-${Date.now()}@nutritrack.test`
const password = 'goaltest123'

function cleanupUser() {
  const dbPath = path.join(__dirname, '../database/nutritrack.db')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  db.prepare('DELETE FROM users WHERE email = ?').run(email)
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
  assert.equal(res.status, expectedStatus, `${method} ${endpoint}: ${JSON.stringify(data)}`)
  return data
}

const scenarios = [
  {
    name: 'glucose control',
    payload: {
      goal_type: 'glucose',
      activity_level: 'light',
      pace: 'aggressive',
      carb_style: 'balanced',
      diabetes_status: 'type2',
      target_weight_kg: 90.3,
      target_muscle_gain_kg: 0,
      target_date: '2026-08-11',
      target_summary: 'Glucose-aware target',
      cal: 2350,
      protein_g: 190,
      fiber_g: 38,
      carbs_g: 120,
      water_ml: 3400,
    },
  },
  {
    name: 'fat loss',
    payload: {
      goal_type: 'fat_loss',
      activity_level: 'moderate',
      pace: 'steady',
      carb_style: 'high_protein',
      diabetes_status: 'none',
      target_weight_kg: 76,
      target_muscle_gain_kg: 0,
      target_date: '2026-08-25',
      target_summary: 'Controlled fat-loss target',
      cal: 1900,
      protein_g: 165,
      fiber_g: 32,
      carbs_g: 165,
      water_ml: 2500,
    },
  },
  {
    name: 'muscle gain',
    payload: {
      goal_type: 'muscle',
      activity_level: 'active',
      pace: 'aggressive',
      carb_style: 'high_protein',
      diabetes_status: 'none',
      target_weight_kg: 73,
      target_muscle_gain_kg: 3,
      target_date: '2026-09-01',
      target_summary: 'Lean mass target',
      cal: 3400,
      protein_g: 170,
      fiber_g: 28,
      carbs_g: 300,
      water_ml: 2500,
    },
  },
  {
    name: 'weight gain',
    payload: {
      goal_type: 'gain',
      activity_level: 'light',
      pace: 'steady',
      carb_style: 'balanced',
      diabetes_status: 'none',
      target_weight_kg: 54.8,
      target_muscle_gain_kg: 0,
      target_date: '2026-08-25',
      target_summary: 'Gradual gain target',
      cal: 2200,
      protein_g: 90,
      fiber_g: 25,
      carbs_g: 235,
      water_ml: 1800,
    },
  },
]

test.before(async () => {
  cleanupUser()
  await startServer()
  const reg = await api('POST', '/auth/register', { name: 'Goal Scenario User', email, password }, 201, false)
  token = reg.token
})

test.after(async () => {
  cleanupUser()
  await stopServer()
})

test('goal setup persists different saved goal scenarios', async t => {
  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      const saved = await api('PUT', '/health/goals', scenario.payload)
      const read = await api('GET', '/health/goals')
      for (const [key, value] of Object.entries(scenario.payload)) {
        assert.equal(saved.goals[key], value, `${key} should be saved`)
        assert.equal(read.goals[key], value, `${key} should be readable`)
      }
    })
  }
})

test('goal tracker source data includes latest weight range and saved targets', async () => {
  const goal = scenarios.find(s => s.name === 'fat loss').payload
  await api('PUT', '/health/goals', goal)
  const first = await api('POST', '/health/weight', { weight_kg: 82, log_date: '2026-06-01', notes: 'start' }, 201)
  const latest = await api('POST', '/health/weight', { weight_kg: 80, log_date: '2026-06-15', notes: 'progress' }, 201)

  const range = await api('GET', '/health/weight/range?from=2026-06-01&to=2026-06-30')
  assert.equal(range.data.length, 2)
  assert.equal(range.data[0].weight_kg, 82)
  assert.equal(range.data[1].weight_kg, 80)

  const report = await api('GET', '/health/report?from=2026-06-01&to=2026-06-30')
  assert.equal(report.goals.goal_type, 'fat_loss')
  assert.equal(report.goals.target_weight_kg, 76)
  assert.equal(report.weight.length, 2)

  await api('DELETE', `/health/weight/${first.entry.id}`)
  await api('DELETE', `/health/weight/${latest.entry.id}`)
})
