import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadGoalHelpers() {
  const source = readFileSync(join(__dirname, '../src/pages/Goals.jsx'), 'utf8')
  const start = source.indexOf('const DEFAULT_GOALS')
  const end = source.indexOf('export default function Goals')
  assert.ok(start >= 0 && end > start, 'expected goal helper block in Goals.jsx')

  const helperSource = source.slice(start, end)
  const dateKey = date => {
    const d = new Date(date)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return Function('dateKey', `${helperSource}
    return {
      buildGoalRecommendation,
      buildQuantitativeTarget,
      normalizeActivity,
      normalizeCarbStyle,
      normalizeDiabetesStatus,
    }
  `)(dateKey)
}

const {
  buildGoalRecommendation,
  normalizeActivity,
  normalizeCarbStyle,
  normalizeDiabetesStatus,
} = loadGoalHelpers()

function expectGoal(result, expected) {
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(result.goals[key], value, `${key} should be ${value}`)
  }
}

test('goal recommender: glucose control caps carbs and raises fibre/hydration', () => {
  const result = buildGoalRecommendation(
    { weight_kg: 95, height_cm: 175, age: 40, gender: 'male', condition: 'Type 2 diabetes' },
    { primaryGoal: 'glucose', activity: 'light', pace: 'aggressive', carbStyle: 'balanced', diabetesStatus: 'type2' }
  )

  expectGoal(result, {
    goal_type: 'glucose',
    cal: 2350,
    protein_g: 190,
    carbs_g: 120,
    fiber_g: 38,
    water_ml: 3400,
  })
  assert.equal(result.target.target_weight_kg, 90.3)
  assert.equal(result.target.target_weeks, 10)
  assert.match(result.reasons.carbs, /caps carbs at 120g/)
})

test('goal recommender: fat loss steady creates deficit and weight target', () => {
  const result = buildGoalRecommendation(
    { weight_kg: 82, height_cm: 168, age: 34, gender: 'female', condition: '' },
    { primaryGoal: 'fat_loss', activity: 'moderate', pace: 'steady', carbStyle: 'high_protein', diabetesStatus: 'none' }
  )

  expectGoal(result, {
    goal_type: 'fat_loss',
    cal: 1900,
    protein_g: 165,
    carbs_g: 165,
    fiber_g: 32,
    water_ml: 2500,
  })
  assert.equal(result.target.target_weight_kg, 76)
  assert.equal(result.target.target_weeks, 12)
  assert.match(result.reasons.calories, /-500 kcal/)
})

test('goal recommender: muscle gain uses surplus, high protein, and lean mass target', () => {
  const result = buildGoalRecommendation(
    { weight_kg: 70, height_cm: 178, age: 29, gender: 'male', condition: '' },
    { primaryGoal: 'muscle', activity: 'active', pace: 'aggressive', carbStyle: 'high_protein', diabetesStatus: 'none' }
  )

  expectGoal(result, {
    goal_type: 'muscle',
    cal: 3400,
    protein_g: 170,
    carbs_g: 300,
    fiber_g: 28,
    water_ml: 2500,
  })
  assert.equal(result.target.target_weight_kg, 73)
  assert.equal(result.target.target_muscle_gain_kg, 3)
  assert.equal(result.target.target_weeks, 13)
})

test('goal recommender: weight gain keeps water minimum and adds gradual target', () => {
  const result = buildGoalRecommendation(
    { weight_kg: 50, height_cm: 165, age: 30, gender: 'female', condition: '' },
    { primaryGoal: 'gain', activity: 'light', pace: 'steady', carbStyle: 'balanced', diabetesStatus: 'none' }
  )

  expectGoal(result, {
    goal_type: 'gain',
    cal: 2200,
    protein_g: 90,
    carbs_g: 235,
    fiber_g: 25,
    water_ml: 1800,
  })
  assert.equal(result.target.target_weight_kg, 54.8)
  assert.equal(result.target.target_weeks, 12)
})

test('goal recommender: maintain keeps calories stable and normalizes legacy values', () => {
  assert.equal(normalizeActivity('low'), 'sedentary')
  assert.equal(normalizeActivity('high'), 'active')
  assert.equal(normalizeCarbStyle('lower'), 'low_carb')
  assert.equal(normalizeCarbStyle('performance'), 'high_protein')
  assert.equal(normalizeDiabetesStatus('', 'pre diabetic'), 'prediabetic')

  const result = buildGoalRecommendation(
    { weight_kg: 68, height_cm: 170, age: 45, gender: 'female', condition: '' },
    { primaryGoal: 'maintain', activity: 'sedentary', pace: 'conservative', carbStyle: 'balanced', diabetesStatus: 'none' }
  )

  expectGoal(result, {
    goal_type: 'maintain',
    cal: 1650,
    protein_g: 95,
    carbs_g: 175,
    fiber_g: 25,
    water_ml: 2000,
  })
  assert.equal(result.target.target_weight_kg, 68)
  assert.equal(result.target.target_weeks, 12)
})
