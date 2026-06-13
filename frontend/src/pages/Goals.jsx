import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { addDays, dateKey, today } from '../utils/calc'

const DEFAULT_GOALS = {
  goal_type: 'glucose',
  activity_level: 'light',
  pace: 'steady',
  carb_style: 'balanced',
  diabetes_status: 'type2',
  target_weight_kg: '',
  target_muscle_gain_kg: 0,
  target_date: '',
  target_summary: '',
  cal: 1700,
  protein_g: 110,
  fiber_g: 35,
  carbs_g: 150,
  water_ml: 3000,
}

const DEFAULT_PROFILE = {
  name: '',
  age: null,
  gender: 'male',
  weight_kg: null,
  height_cm: null,
  condition: '',
}

const GOAL_OPTIONS = [
  { value: 'fat_loss', label: 'Reduce weight / fat loss', desc: 'Lose body fat with higher protein and controlled calories.' },
  { value: 'muscle', label: 'Build muscle', desc: 'Small surplus, high protein, and lean-mass target.' },
  { value: 'gain', label: 'Gain weight', desc: 'A steady calorie surplus for healthy weight gain.' },
  { value: 'maintain', label: 'Maintain weight', desc: 'Keep weight stable while improving consistency.' },
  { value: 'glucose', label: 'Improve glucose control', desc: 'Glucose-aware carbs, higher fibre, and steady meals.' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, no exercise', factor: 1.2 },
  { value: 'light', label: 'Light', desc: 'Walks or light exercise 1-2x/week', factor: 1.375 },
  { value: 'moderate', label: 'Moderate', desc: 'Gym or training 3-4x/week', factor: 1.55 },
  { value: 'active', label: 'Active', desc: 'Hard training 5-6x/week', factor: 1.725 },
]

const PACE_OPTIONS = [
  { value: 'conservative', label: 'Conservative', desc: 'Slow and sustainable' },
  { value: 'steady', label: 'Steady', desc: 'Balanced pace' },
  { value: 'aggressive', label: 'Aggressive', desc: 'Fastest results' },
]

const CARB_OPTIONS = [
  { value: 'balanced', label: 'Balanced', desc: 'Standard mixed diet, 40-45% calories from carbs' },
  { value: 'low_carb', label: 'Low-carb', desc: 'Lower carbs, higher fat; diabetic caps apply' },
  { value: 'high_protein', label: 'High-protein', desc: 'Extra protein focus with moderate carbs' },
]

const DIABETES_OPTIONS = [
  { value: 'type2', label: 'Type 2 diabetic', desc: 'Strict glucose control and higher fibre' },
  { value: 'prediabetic', label: 'Pre-diabetic', desc: 'Moderate control with glucose-aware targets' },
  { value: 'none', label: 'No diabetes', desc: 'General health targets' },
]

const WIZARD_STEPS = [
  { key: 'goal', label: 'Goal', title: 'What should VitaNudge optimize for?', copy: 'Choose the main outcome. Glucose control stays as a first-class goal.' },
  { key: 'stats', label: 'Stats', title: 'Confirm your current stats.', copy: 'These are pulled from Profile when available and used for BMR, BMI, and target dates.' },
  { key: 'activity', label: 'Activity', title: 'How active are you right now?', copy: 'This sets the TDEE multiplier for daily calories.' },
  { key: 'pace', label: 'Pace', title: 'How fast should the plan move?', copy: 'Steady is usually best for long-term adherence.' },
  { key: 'carbs', label: 'Carbs', title: 'Pick your carb preference.', copy: 'Glucose-aware caps can override this for safer carb targets.' },
  { key: 'diabetes', label: 'Diabetes', title: 'Set the glucose-control level.', copy: 'This adjusts carbs, fibre, and hydration recommendations.' },
  { key: 'preview', label: 'Preview', title: 'Review the plan before saving.', copy: 'Confirm the target, timeline, macros, hydration, and the reason behind each number.' },
]

const PREVIEW_STEP_INDEX = WIZARD_STEPS.length - 1

const PLAN_NUMBER_FIELDS = [
  { k: 'cal', l: 'Calories', unit: 'kcal', min: 1200, max: 3800, step: 50 },
  { k: 'protein_g', l: 'Protein', unit: 'g', min: 60, max: 260, step: 5 },
  { k: 'carbs_g', l: 'Carbs limit', unit: 'g', min: 50, max: 380, step: 5 },
  { k: 'fiber_g', l: 'Fibre', unit: 'g', min: 20, max: 60, step: 1 },
  { k: 'water_ml', l: 'Water', unit: 'ml', min: 1000, max: 6000, step: 100 },
]

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function roundTo(n, step) {
  return Math.round(n / step) * step
}

function getOption(list, value) {
  return list.find(item => item.value === value) || list[0]
}

function normalizeActivity(value) {
  if (value === 'low') return 'sedentary'
  if (value === 'high') return 'active'
  return ACTIVITY_OPTIONS.some(item => item.value === value) ? value : 'light'
}

function normalizeCarbStyle(value) {
  if (value === 'lower') return 'low_carb'
  if (value === 'performance') return 'high_protein'
  return CARB_OPTIONS.some(item => item.value === value) ? value : 'balanced'
}

function normalizeDiabetesStatus(value, condition = '') {
  if (DIABETES_OPTIONS.some(item => item.value === value)) return value
  const text = String(condition || '').toLowerCase()
  if (text.includes('pre')) return 'prediabetic'
  if (text.includes('diabet')) return 'type2'
  return 'none'
}

function normalizeGender(value) {
  return value === 'female' ? 'female' : 'male'
}

function dateAfterWeeks(weeks) {
  const d = new Date()
  d.setDate(d.getDate() + Math.max(0, Math.round(weeks * 7)))
  return dateKey(d)
}

function paceWeeklyLoss(pace) {
  return { conservative: 0.25, steady: 0.5, aggressive: 0.75 }[pace] || 0.5
}

function paceMonthlyMuscle(pace) {
  return { conservative: 0.5, steady: 0.8, aggressive: 1 }[pace] || 0.8
}

function paceWeeklyGain(pace) {
  return { conservative: 0.25, steady: 0.4, aggressive: 0.5 }[pace] || 0.4
}

function buildQuantitativeTarget(profile, answers) {
  const weight = Number(profile.weight_kg) || 75
  const height = Number(profile.height_cm) || 170
  const heightM = height / 100
  const upperHealthyWeight = 24.9 * heightM * heightM
  const goal = answers.primaryGoal
  const planningWeeks = 12
  const lossRate = paceWeeklyLoss(answers.pace)
  const gainRate = paceWeeklyGain(answers.pace)
  const muscleMonthlyRate = paceMonthlyMuscle(answers.pace)

  let targetWeight = weight
  let targetMuscleGain = 0
  let targetSummary = 'Maintain current body weight while improving meal consistency.'
  let weeklyRate = 0.1
  let weeks = 12

  if (goal === 'fat_loss') {
    targetWeight = Math.max(40, weight - (lossRate * planningWeeks))
    if (weight > upperHealthyWeight) targetWeight = Math.max(upperHealthyWeight, targetWeight)
    targetSummary = 'Aim for a controlled weight reduction while protecting protein intake.'
    weeklyRate = lossRate
  } else if (goal === 'glucose') {
    targetWeight = weight > upperHealthyWeight ? Math.max(upperHealthyWeight, weight * 0.95) : weight
    targetSummary = 'Use a modest body-weight target with higher fibre and steadier carb distribution.'
    weeklyRate = { conservative: 0.2, steady: 0.35, aggressive: 0.5 }[answers.pace] || 0.35
  } else if (goal === 'gain') {
    targetWeight = weight + (gainRate * planningWeeks)
    targetSummary = 'Gain weight gradually with enough protein and carbs to support training.'
    weeklyRate = gainRate
  } else if (goal === 'muscle') {
    targetMuscleGain = muscleMonthlyRate * 3
    targetWeight = weight + targetMuscleGain
    targetSummary = 'Build lean mass with a small calorie surplus and high protein consistency.'
    weeks = clamp((targetMuscleGain / muscleMonthlyRate) * 4.345, 8, 26)
    weeklyRate = muscleMonthlyRate / 4.345
  }

  if (goal !== 'muscle') {
    const weightDiff = Math.abs(targetWeight - weight)
    weeks = weightDiff < 0.1 ? 12 : clamp(Math.ceil(weightDiff / Math.max(weeklyRate, 0.1)), 8, 52)
  }

  return {
    target_weight_kg: Number(roundTo(targetWeight, 0.1).toFixed(1)),
    target_muscle_gain_kg: Number(roundTo(targetMuscleGain, 0.1).toFixed(1)),
    target_date: dateAfterWeeks(weeks),
    target_weeks: Math.round(weeks),
    target_summary: targetSummary,
    weekly_rate_kg: Number(roundTo(weeklyRate, 0.01).toFixed(2)),
  }
}

function buildGoalRecommendation(profile, answers) {
  const weight = Number(profile.weight_kg) || 0
  const height = Number(profile.height_cm) || 0
  const age = Number(profile.age) || 0
  const gender = normalizeGender(profile.gender)
  const activity = getOption(ACTIVITY_OPTIONS, normalizeActivity(answers.activity))
  const diabetesStatus = normalizeDiabetesStatus(answers.diabetesStatus)
  const isDiabetic = diabetesStatus === 'type2' || diabetesStatus === 'prediabetic'

  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5)
  const maintenance = bmr * activity.factor

  const calorieDelta = {
    fat_loss: { conservative: -300, steady: -500, aggressive: -700 }[answers.pace] || -500,
    muscle: { conservative: 200, steady: 350, aggressive: 500 }[answers.pace] || 350,
    gain: 500,
    maintain: 0,
    glucose: -200,
  }[answers.primaryGoal] ?? 0

  const proteinFactor = {
    fat_loss: { conservative: 1.8, steady: 2, aggressive: 2.2 },
    muscle: { conservative: 2, steady: 2.2, aggressive: 2.4 },
    gain: { conservative: 1.6, steady: 1.8, aggressive: 2 },
    maintain: { conservative: 1.4, steady: 1.6, aggressive: 1.8 },
    glucose: { conservative: 1.6, steady: 1.8, aggressive: 2 },
  }[answers.primaryGoal]?.[answers.pace] || 1.8

  const carbStyle = normalizeCarbStyle(answers.carbStyle)
  const carbRatio = carbStyle === 'low_carb' ? 0.28 : carbStyle === 'high_protein' ? 0.35 : 0.43
  const calories = clamp(roundTo(maintenance + calorieDelta, 50), 1200, 3800)
  const protein = clamp(roundTo(weight * proteinFactor, 5), 60, 260)
  let carbs = clamp(roundTo((calories * carbRatio) / 4, 5), 60, 380)

  if (answers.primaryGoal === 'glucose') carbs = Math.min(carbs, 120)
  if (diabetesStatus === 'type2' && carbStyle === 'low_carb') carbs = Math.min(carbs, 110)
  if (diabetesStatus === 'prediabetic' && carbStyle === 'low_carb') carbs = Math.min(carbs, 130)

  let fiber = 25
  if (diabetesStatus === 'type2' || answers.primaryGoal === 'glucose') fiber = 38
  else if (diabetesStatus === 'prediabetic') fiber = 35
  else if (answers.primaryGoal === 'fat_loss') fiber = 32
  else if (answers.primaryGoal === 'muscle') fiber = 28

  let water = weight * (answers.activity === 'active' ? 35 : 30)
  if (diabetesStatus === 'type2') water += 500
  if (diabetesStatus === 'prediabetic') water += 300
  water = clamp(roundTo(water, 100), 1800, 6000)

  const target = buildQuantitativeTarget(profile, answers)

  const headline = {
    fat_loss: 'Calorie deficit with higher protein for satiety.',
    glucose: 'Slight calorie deficit, higher fibre, and capped carbs for glucose control.',
    muscle: 'Protein-forward targets with a training surplus.',
    gain: 'A calorie surplus with enough carbs and protein to gain weight.',
    maintain: 'Maintenance calories with steady protein, fibre, and hydration.',
  }[answers.primaryGoal]

  const carbReason = answers.primaryGoal === 'glucose'
    ? 'Glucose control caps carbs at 120g regardless of preference.'
    : diabetesStatus === 'type2' && carbStyle === 'low_carb'
      ? 'Low-carb Type 2 setting caps carbs near 110g.'
      : `${getOption(CARB_OPTIONS, carbStyle).label} uses about ${Math.round(carbRatio * 100)}% of calories from carbs.`

  return {
    goals: {
      goal_type: answers.primaryGoal,
      activity_level: answers.activity,
      pace: answers.pace,
      carb_style: carbStyle,
      diabetes_status: diabetesStatus,
      ...target,
      cal: calories,
      protein_g: protein,
      fiber_g: fiber,
      carbs_g: carbs,
      water_ml: water,
    },
    headline,
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    target,
    reasons: {
      calories: `BMR ${Math.round(bmr)} x ${activity.label.toLowerCase()} activity, then ${calorieDelta >= 0 ? '+' : ''}${calorieDelta} kcal for ${getOption(GOAL_OPTIONS, answers.primaryGoal).label.toLowerCase()}.`,
      protein: `${proteinFactor}g/kg body weight for this goal and pace.`,
      carbs: carbReason,
      fiber: isDiabetic || answers.primaryGoal === 'glucose' ? 'Higher fibre supports steadier glucose response.' : 'Fibre target supports fullness and digestion.',
      water: `${answers.activity === 'active' ? '35' : '30'}ml/kg${isDiabetic ? ' plus glucose-control hydration buffer' : ''}.`,
      target: `${target.target_weeks} week estimate using ${target.weekly_rate_kg}kg/week pace.`,
    },
  }
}

export default function Goals() {
  const { user, setUser } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isOnboarding = searchParams.get('setup') === '1'
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [answers, setAnswers] = useState({
    primaryGoal: 'glucose',
    activity: 'light',
    pace: 'steady',
    carbStyle: 'balanced',
    diabetesStatus: 'type2',
  })
  const [wizardStep, setWizardStep] = useState(0)
  const [maxStepReached, setMaxStepReached] = useState(0)
  const [hasPreviewed, setHasPreviewed] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const [targetsEditable, setTargetsEditable] = useState(false)
  const [weightPrompt, setWeightPrompt] = useState(null)
  const [msg, setMsg] = useState('')
  const [latestWeightLog, setLatestWeightLog] = useState(null)
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [wizardOpen, setWizardOpen] = useState(false)  // collapsed when goal already saved

  useEffect(() => {
    api.get('/health/goals').then(d => {
      const nextGoals = { ...DEFAULT_GOALS, ...(d.goals || {}) }
      const hasConfirmedTarget = Boolean(d.goals?.target_weight_kg || d.goals?.target_date || d.goals?.target_summary)
      setGoals(nextGoals)
      setAnswers(a => ({
        ...a,
        primaryGoal: nextGoals.goal_type || 'glucose',
        activity: normalizeActivity(nextGoals.activity_level),
        pace: nextGoals.pace || 'steady',
        carbStyle: normalizeCarbStyle(nextGoals.carb_style),
        diabetesStatus: normalizeDiabetesStatus(nextGoals.diabetes_status, user?.condition),
      }))
      setHasPreviewed(hasConfirmedTarget)
      setPlanSaved(hasConfirmedTarget)
      setTargetsEditable(false)
      setWizardStep(hasConfirmedTarget ? PREVIEW_STEP_INDEX : 0)
      setMaxStepReached(hasConfirmedTarget ? PREVIEW_STEP_INDEX : 0)
      // Collapse wizard when returning to a saved plan; open it for first-time setup
      setWizardOpen(!hasConfirmedTarget)
    })
  }, [user?.condition])

  useEffect(() => {
    if (!user) return
    setProfile({
      name: user.name || '',
      age: user.age || null,
      gender: normalizeGender(user.gender),
      weight_kg: user.weight_kg || null,
      height_cm: user.height_cm || null,
      condition: user.condition || '',
    })
    setAnswers(a => ({
      ...a,
      diabetesStatus: normalizeDiabetesStatus(a.diabetesStatus, user.condition),
    }))
  }, [user])

  useEffect(() => {
    if (!user?.weight_kg) return undefined
    api.get(`/health/weight/range?from=${addDays(today(), -90)}&to=${today()}`)
      .then(data => {
        const sorted = [...(data.data || [])].sort((a, b) => b.log_date.localeCompare(a.log_date))
        const latest = sorted[0] || null
        setLatestWeightLog(latest)
        setWeeklyLogs(sorted.slice(0, 12).reverse()) // last 12 entries for sparkline
        if (latest && Math.abs(Number(latest.weight_kg) - Number(user.weight_kg)) >= 2) setWeightPrompt(latest)
      })
      .catch(() => {})
    return undefined
  }, [user?.weight_kg])

  async function saveGoals() {
    try {
      const payload = {
        ...goals,
        target_weight_kg: goals.target_weight_kg === '' ? null : Number(goals.target_weight_kg),
        target_muscle_gain_kg: Number(goals.target_muscle_gain_kg) || 0,
      }

      if (user) {
        const profileData = await api.put('/auth/profile', {
          name: user.name || profile.name || 'User',
          age: Number(profile.age),
          gender: normalizeGender(profile.gender),
          weight_kg: Number(profile.weight_kg),
          height_cm: Number(profile.height_cm),
          condition: profile.condition || user.condition || '',
          diet_preference: user.diet_preference || '',
          country: user.country || '',
          state_region: user.state_region || '',
          city: user.city || '',
          timezone: user.timezone || '',
        })
        setUser(profileData.user)
      }

      const d = await api.put('/health/goals', payload)
      setGoals({ ...DEFAULT_GOALS, ...(d.goals || {}) })
      setHasPreviewed(true)
      setPlanSaved(true)
      setTargetsEditable(false)
      setWizardOpen(false)   // collapse wizard after saving

      // Remove onboarding banner by clearing setup parameter
      if (searchParams.get('setup') === '1') {
        navigate('/goals', { replace: true })
      }

      flash('✓ Goal targets saved successfully!')
    } catch (err) {
      const errorMsg = err.error || err.message || 'Failed to save goals. Please check your inputs and try again.'
      flash('⚠️ ' + errorMsg)
      console.error('Goals save error:', err)
    }
  }

  function flash(m) {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }

  const bmi = profile.weight_kg && profile.height_cm ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1) : '-'
  const recommendation = useMemo(() => buildGoalRecommendation(profile, answers), [profile, answers])
  const goalLabel = getOption(GOAL_OPTIONS, goals.goal_type).label
  const selectedGoalLabel = getOption(GOAL_OPTIONS, answers.primaryGoal).label
  const targetInputsDisabled = !hasPreviewed || !targetsEditable
  const targetPlanStatus = !hasPreviewed ? 'Preview needed' : targetsEditable ? 'Editing' : planSaved ? 'Saved' : 'Ready to save'
  const planGoalLabel = hasPreviewed ? goalLabel : selectedGoalLabel
  const visibleTargetWeight = hasPreviewed ? (goals.target_weight_kg ?? '') : ''
  const visibleMuscleTarget = hasPreviewed ? (goals.target_muscle_gain_kg ?? '') : ''
  const visibleTargetDate = hasPreviewed ? (goals.target_date || '') : ''
  const visibleTargetSummary = hasPreviewed ? (goals.target_summary || '') : ''
  const muscleTargetNumber = Number(visibleMuscleTarget) || 0
  const showMuscleNumberField = hasPreviewed && (goals.goal_type === 'muscle' || muscleTargetNumber > 0)

  // ── Goal Progress (live, from weight logs) ──────────────────────────────
  const startWeight   = Number(profile.weight_kg) || 0
  const targetWeight  = hasPreviewed && goals.target_weight_kg ? Number(goals.target_weight_kg) : startWeight
  const currentWeight = latestWeightLog ? Number(latestWeightLog.weight_kg) : startWeight
  const weightGap     = Math.abs(currentWeight - targetWeight)
  const totalWeightChange = Math.abs(startWeight - targetWeight)
  const isWeightGoal  = ['fat_loss','gain','muscle'].includes(goals.goal_type)

  // Real progress: how much of the total change has been covered
  let progressPercent = 0
  if (planSaved && isWeightGoal && totalWeightChange > 0.1) {
    const changeNeeded  = targetWeight - startWeight   // negative for loss, positive for gain
    const actualChange  = currentWeight - startWeight
    progressPercent = clamp(Math.round((actualChange / changeNeeded) * 100), 0, 100)
  } else if (planSaved && goals.target_date) {
    // For glucose/maintain: time elapsed vs total duration
    const updatedAt  = goals.updated_at ? new Date(goals.updated_at) : new Date()
    const targetDate = new Date(goals.target_date)
    const now        = new Date()
    const totalMs    = Math.max(1, targetDate - updatedAt)
    const elapsedMs  = Math.max(0, now - updatedAt)
    progressPercent  = clamp(Math.round((elapsedMs / totalMs) * 100), 0, 100)
  }

  // Days remaining
  const daysRemaining = goals.target_date
    ? Math.max(0, Math.round((new Date(goals.target_date) - new Date()) / 86400000))
    : null

  // BUG-07 fix: Calculate weeks from target_date, not from recalculated weight gap
  // This ensures the timeline shown matches the original preview (e.g., 8 weeks, not 5)
  const weeksRemaining = goals.target_date
    ? Math.max(0, Math.ceil(daysRemaining / 7))
    : (weightGap > 0.1 ? Math.ceil(weightGap / Math.max(Number(recommendation.target.weekly_rate_kg) || 0.1, 0.1)) : 0)

  // On-track: compare current weight to expected weight at this point in time
  // Works for ANY goal type that has a weight target (glucose, fat_loss, gain, muscle, maintain)
  let trackStatus = 'on-track'
  if (planSaved && goals.target_date && totalWeightChange > 0.1 && latestWeightLog) {
    const updatedAt      = goals.updated_at ? new Date(goals.updated_at) : new Date()
    const targetDate     = new Date(goals.target_date)
    const totalDays      = Math.max(1, (targetDate - updatedAt) / 86400000)
    const elapsedDays    = Math.max(0, (new Date() - updatedAt) / 86400000)
    const expectedProgress = elapsedDays / totalDays
    const expectedWeight = startWeight + (targetWeight - startWeight) * expectedProgress
    const delta = currentWeight - expectedWeight
    const isLoss = targetWeight < startWeight
    trackStatus = Math.abs(delta) < 1 ? 'on-track' : (isLoss ? delta < 0 : delta > 0) ? 'ahead' : 'behind'
  }

  const showGlucoseWarning = answers.primaryGoal === 'glucose'
    && answers.pace === 'aggressive'
    && answers.diabetesStatus !== 'none'

  // ── GoalTracker section (shown when plan is saved) ────────────────────
  function renderGoalTracker() {
    if (!planSaved) return null
    const hasWeightTarget = totalWeightChange > 0.1
    const hasWeightLog    = !!latestWeightLog
    const kgToGo         = weightGap.toFixed(1)
    const ringDeg         = `${progressPercent * 3.6}deg`
    // Use actual hex values so they work correctly inside CSS custom properties in conic-gradient
    const TRACK_COLORS = {
      'on-track': { fill: '#2f7a42', bg: '#e7f4ea', border: '#acd7b5', text: '#2f7a42' },
      ahead:      { fill: '#245f9f', bg: '#e8f0fb', border: '#b8ccec', text: '#245f9f' },
      behind:     { fill: '#b45309', bg: '#fef3c7', border: '#f5d888', text: '#b45309' },
    }
    const tc            = TRACK_COLORS[trackStatus] || TRACK_COLORS['on-track']
    const trackLabel    = { 'on-track': 'On track', ahead: 'Ahead of schedule', behind: 'Behind schedule' }[trackStatus]
    const goalTypeLabel = getOption(GOAL_OPTIONS, goals.goal_type).label

    return (
      <div className="goal-tracker-card">
        <div className="goal-tracker-head">
          <div>
            <div className="goal-tracker-kicker">Goal progress</div>
            <h2>{goalTypeLabel}</h2>
            {goals.target_summary && <p>{goals.target_summary}</p>}
          </div>
          <div className="goal-tracker-badge" style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
            {trackLabel}
          </div>
        </div>

        <div className="goal-tracker-body">
          {/* Progress ring */}
          <div className="goal-tracker-ring-wrap">
            <div className="goal-tracker-ring" style={{ '--ring-deg': ringDeg, '--ring-color': tc.fill }}>
              <div className="goal-tracker-ring-inner">
                <span style={{ color: tc.fill }}>{progressPercent}%</span>
                <small>complete</small>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="goal-tracker-stats">
            {hasWeightTarget && (
              <>
                <div className="goal-tracker-stat">
                  <span>Start weight</span>
                  <strong>{startWeight.toFixed(1)} kg</strong>
                </div>
                <div className="goal-tracker-stat">
                  <span>Current weight</span>
                  <strong style={{ color: hasWeightLog ? 'var(--text)' : 'var(--hint)' }}>
                    {hasWeightLog ? `${currentWeight.toFixed(1)} kg` : 'Not logged yet'}
                  </strong>
                </div>
                <div className="goal-tracker-stat">
                  <span>Target weight</span>
                  <strong style={{ color: 'var(--green)' }}>{targetWeight.toFixed(1)} kg</strong>
                </div>
                <div className="goal-tracker-stat">
                  <span>{weightGap < 0.5 ? 'Reached!' : `${goals.goal_type === 'gain' || goals.goal_type === 'muscle' ? 'Still to gain' : 'Still to lose'}`}</span>
                  <strong style={{ color: weightGap < 0.5 ? 'var(--green)' : 'var(--text)' }}>
                    {weightGap < 0.5 ? '🎉 Goal reached' : `${kgToGo} kg`}
                  </strong>
                </div>
              </>
            )}
            <div className="goal-tracker-stat">
              <span>Target date</span>
              <strong>{goals.target_date ? new Date(goals.target_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}</strong>
            </div>
            <div className="goal-tracker-stat">
              <span>Days remaining</span>
              <strong style={{ color: daysRemaining === 0 ? 'var(--amber)' : 'var(--text)' }}>
                {daysRemaining !== null ? (daysRemaining === 0 ? 'Today!' : `${daysRemaining} days`) : '–'}
              </strong>
            </div>
            <div className="goal-tracker-stat">
              <span>Weeks to target</span>
              <strong>{weeksRemaining > 0 ? `${weeksRemaining} wks at current pace` : 'On target'}</strong>
            </div>
            <div className="goal-tracker-stat">
              <span>Daily calories</span>
              <strong>{goals.cal} kcal</strong>
            </div>
            <div className="goal-tracker-stat">
              <span>Protein target</span>
              <strong>{goals.protein_g}g / day</strong>
            </div>
            <div className="goal-tracker-stat">
              <span>Carbs limit</span>
              <strong>{goals.carbs_g}g / day</strong>
            </div>
          </div>
        </div>

        {/* Visual progress bar */}
        {hasWeightTarget && (
          <div className="goal-tracker-progress-section">
            <div className="goal-tracker-progress-labels">
              <span>{startWeight.toFixed(1)} kg <em>(start)</em></span>
              <span style={{ color: tc.fill, fontWeight: 800 }}>
                {hasWeightLog ? `${currentWeight.toFixed(1)} kg now` : 'Log your weight to track'}
              </span>
              <span>{targetWeight.toFixed(1)} kg <em>(goal)</em></span>
            </div>
            <div className="goal-tracker-progress-bar">
              <div className="goal-tracker-progress-fill" style={{ width: `${progressPercent}%`, background: tc.fill }} />
              {hasWeightLog && (
                <div className="goal-tracker-progress-marker" style={{ left: `${progressPercent}%`, borderColor: tc.fill }} />
              )}
            </div>
          </div>
        )}

        {/* Sparkline if data exists */}
        {weeklyLogs.length > 1 && (
          <div className="goal-tracker-trend">
            <div className="goal-tracker-trend-label">Recent weight trend</div>
            <div className="goal-tracker-sparkline">
              {weeklyLogs.map((log, i) => {
                const minW = Math.min(...weeklyLogs.map(l => Number(l.weight_kg)))
                const maxW = Math.max(...weeklyLogs.map(l => Number(l.weight_kg)))
                const range = Math.max(maxW - minW, 1)
                const pct   = ((Number(log.weight_kg) - minW) / range) * 100
                const heightPct = 100 - pct
                return (
                  <div key={log.id} className="goal-tracker-spark-bar-wrap" title={`${log.log_date}: ${log.weight_kg}kg`}>
                    <div className="goal-tracker-spark-bar" style={{ height: `${Math.max(10, heightPct)}%` }} />
                    <span>{log.log_date.slice(5)}</span>
                  </div>
                )
              })}
              {targetWeight && (
                <div className="goal-tracker-target-line" style={{
                  bottom: `${Math.min(90, Math.max(5, ((targetWeight - Math.min(...weeklyLogs.map(l => Number(l.weight_kg)))) / Math.max(1, Math.max(...weeklyLogs.map(l => Number(l.weight_kg))) - Math.min(...weeklyLogs.map(l => Number(l.weight_kg))))) * 100))}%`
                }} title={`Target: ${targetWeight}kg`} />
              )}
            </div>
          </div>
        )}

        {!hasWeightLog && isWeightGoal && (
          <div className="info-box" style={{ marginTop: 12 }}>
            Log your current weight in the <button className="btn-link" style={{ display: 'inline', fontSize: 'inherit' }} onClick={() => navigate('/body')}>Weight tracker</button> to see live progress here.
          </div>
        )}

        <div className="goal-tracker-actions">
          <button className="btn btn-ghost btn-compact" onClick={() => navigate('/body')}>Log weight</button>
          <button className="btn btn-ghost btn-compact" onClick={() => navigate('/report')}>View reports</button>
          <button className="btn btn-ghost btn-compact" onClick={() => navigate('/coach')}>Ask coach</button>
        </div>
      </div>
    )
  }

  function resetRecommendationState() {
    setHasPreviewed(false)
    setPlanSaved(false)
    setTargetsEditable(false)
    setMaxStepReached(current => Math.min(current, PREVIEW_STEP_INDEX - 1))
  }

  function updateAnswer(key, value) {
    setAnswers(a => ({ ...a, [key]: value }))
    resetRecommendationState()
  }

  function updateProfileField(key, value) {
    setProfile(p => ({ ...p, [key]: value }))
    resetRecommendationState()
  }

  function previewRecommendation() {
    setGoals(g => ({ ...g, ...recommendation.goals }))
    setAnswers({
      primaryGoal: recommendation.goals.goal_type,
      activity: recommendation.goals.activity_level,
      pace: recommendation.goals.pace,
      carbStyle: recommendation.goals.carb_style,
      diabetesStatus: recommendation.goals.diabetes_status,
    })
    setHasPreviewed(true)
    setPlanSaved(false)
    setTargetsEditable(true)  // Allow editing recommended targets immediately
    setWizardStep(PREVIEW_STEP_INDEX)
    setMaxStepReached(PREVIEW_STEP_INDEX)
    flash('Recommended targets are ready to review. You can edit any number before saving.')
  }

  function updateGoal(key, value) {
    setGoals(g => ({ ...g, [key]: value }))
    setPlanSaved(false)
  }

  function applyLatestWeight() {
    if (!weightPrompt) return
    updateProfileField('weight_kg', Number(weightPrompt.weight_kg))
    setWeightPrompt(null)
    setWizardStep(1)
    setMaxStepReached(current => Math.max(current, 1))
  }

  function goToStep(index) {
    if (index <= maxStepReached) setWizardStep(index)
  }

  function goNextStep() {
    if (wizardStep === PREVIEW_STEP_INDEX - 1) {
      previewRecommendation()
      return
    }
    setWizardStep(step => {
      const next = Math.min(PREVIEW_STEP_INDEX, step + 1)
      setMaxStepReached(current => Math.max(current, next))
      return next
    })
  }

  function renderOptionCards(options, value, onChange) {
    return (
      <div className="goal-option-grid">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            className={`goal-option-card${value === option.value ? ' active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            <strong>{option.label}</strong>
            <span>{option.desc}</span>
          </button>
        ))}
      </div>
    )
  }

  function renderWizardStep() {
    const stepKey = WIZARD_STEPS[wizardStep].key

    if (stepKey === 'goal') {
      return renderOptionCards(GOAL_OPTIONS, answers.primaryGoal, value => updateAnswer('primaryGoal', value))
    }

    if (stepKey === 'stats') {
      return (
        <div className="form-grid goal-stats-grid">
          <div className="form-group">
            <label>Current weight (kg)</label>
            <input type="number" min="20" max="400" step="0.1" value={profile.weight_kg} onChange={e => updateProfileField('weight_kg', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Height (cm)</label>
            <input type="number" min="80" max="250" step="1" value={profile.height_cm} onChange={e => updateProfileField('height_cm', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" min="13" max="100" step="1" value={profile.age} onChange={e => updateProfileField('age', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={profile.gender} onChange={e => updateProfileField('gender', e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      )
    }

    if (stepKey === 'activity') {
      return renderOptionCards(ACTIVITY_OPTIONS, answers.activity, value => updateAnswer('activity', value))
    }

    if (stepKey === 'pace') {
      return renderOptionCards(PACE_OPTIONS, answers.pace, value => updateAnswer('pace', value))
    }

    if (stepKey === 'carbs') {
      return renderOptionCards(CARB_OPTIONS, answers.carbStyle, value => updateAnswer('carbStyle', value))
    }

    if (stepKey === 'diabetes') {
      return renderOptionCards(DIABETES_OPTIONS, answers.diabetesStatus, value => updateAnswer('diabetesStatus', value))
    }

    return renderPlanPreview()
  }

  const dailyTargetReasons = {
    cal: recommendation.reasons.calories,
    protein_g: recommendation.reasons.protein,
    carbs_g: recommendation.reasons.carbs,
    fiber_g: recommendation.reasons.fiber,
    water_ml: recommendation.reasons.water,
  }

  function editedTargetTip(field) {
    if (!targetsEditable) return ''
    const recommended = Number(recommendation.goals[field.k]) || 0
    const current = Number(goals[field.k]) || 0
    if (!recommended || Math.abs(current - recommended) / recommended < 0.12) return ''
    if (current < recommended) {
      return {
        cal: 'Lower calories may feel faster, but can increase hunger and make adherence harder.',
        protein_g: 'Lower protein can reduce fullness and make muscle retention harder.',
        carbs_g: 'Lower carbs may be fine, but watch energy and glucose patterns after activity.',
        fiber_g: 'Lower fibre may reduce fullness and glucose stability after meals.',
        water_ml: 'Lower water can make hunger, training, and glucose readings harder to interpret.',
      }[field.k]
    }
    return {
      cal: 'Higher calories may slow weight or glucose progress compared with the preview.',
      protein_g: 'Higher protein is usually safe for many users, but confirm with a clinician if kidney health is a concern.',
      carbs_g: 'Higher carbs may increase post-meal glucose; pair with protein, fibre, and walking.',
      fiber_g: 'Higher fibre is helpful, but increase gradually to avoid digestion discomfort.',
      water_ml: 'Higher water is usually fine, but avoid forcing intake if your clinician limits fluids.',
    }[field.k]
  }

  function renderPlanNumberField(field) {
    const tip = editedTargetTip(field)
    return (
      <label key={field.k} className="goal-plan-input">
        <span>{field.l}</span>
        <div>
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={goals[field.k]}
            disabled={targetInputsDisabled}
            onChange={e => updateGoal(field.k, +e.target.value)}
          />
          <em>{field.unit}</em>
        </div>
        <small>{dailyTargetReasons[field.k]}</small>
        {tip && <b>{tip}</b>}
      </label>
    )
  }

  function renderPlanPreview() {
    if (!hasPreviewed) {
      return (
        <div className="goal-plan-preview-card empty">
          <div className="goal-lock-note">Complete the Diabetes step and select Preview plan. Your editable target, timeline, macros, and explanation will appear here.</div>
        </div>
      )
    }

    return (
      <div className={`goal-plan-preview-card${targetsEditable ? ' editing' : ' locked'}`}>
        <div className="target-plan-head">
          <div>
            <div className="card-title">Recommended target plan</div>
            <p>{recommendation.headline} {visibleTargetSummary}</p>
          </div>
          <span>{targetPlanStatus}</span>
        </div>

        <div className="goal-target-summary premium">
          <div>
            <span>Goal category</span>
            <strong>{planGoalLabel}</strong>
          </div>
          <div>
            <span>Current weight</span>
            <strong>{profile.weight_kg ? Number(profile.weight_kg).toFixed(1) + 'kg' : 'Not set'}</strong>
          </div>
          <div>
            <span>Target weight</span>
            <strong>{visibleTargetWeight ? `${visibleTargetWeight}kg` : '-'}</strong>
          </div>
          <div>
            <span>Timeline</span>
            <strong>{weightGap < 0.1 ? 'Maintain' : `${weeksRemaining} weeks`}</strong>
          </div>
          <div>
            <span>Target date</span>
            <strong>{visibleTargetDate || '-'}</strong>
          </div>
          <div>
            <span>Progress</span>
            <strong>{weightGap < 0.1 ? 'On target' : `${Math.round(progressPercent)}%`}</strong>
          </div>
        </div>

        <div className="goal-progress-track">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        {new Date().getDay() === 0 && planSaved && (
          <div className="info-box goal-weekly-checkin">
            Sunday check-in: you are moving toward {goals.target_weight_kg}kg. Review your weekly report to see whether you are on track.
          </div>
        )}

        <div className="target-plan-section-title">Editable target</div>
        <div className="goal-target-grid">
          <div className="form-group">
            <label>Target weight (kg)</label>
            <input
              type="number"
              min="20"
              max="400"
              step="0.1"
              value={visibleTargetWeight}
              disabled={targetInputsDisabled}
              onChange={e => updateGoal('target_weight_kg', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{showMuscleNumberField ? 'Lean muscle target (kg)' : 'Lean muscle plan'}</label>
            {showMuscleNumberField ? (
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={visibleMuscleTarget}
                disabled={targetInputsDisabled}
                onChange={e => updateGoal('target_muscle_gain_kg', e.target.value)}
              />
            ) : (
              <input type="text" value="Maintain lean mass" disabled readOnly />
            )}
          </div>
          <div className="form-group">
            <label>Target date</label>
            <input type="date" value={visibleTargetDate} disabled={targetInputsDisabled} onChange={e => updateGoal('target_date', e.target.value)} />
          </div>
        </div>

        <div className="target-plan-section-title">Daily targets</div>
        <div className="goal-plan-number-grid">
          {PLAN_NUMBER_FIELDS.map(renderPlanNumberField)}
        </div>

        <div className="form-grid full">
          <div className="form-group">
            <label>Plan note</label>
            <textarea
              className="goal-target-note"
              value={visibleTargetSummary}
              disabled={targetInputsDisabled}
              onChange={e => updateGoal('target_summary', e.target.value)}
              placeholder="Why this target matters"
            />
          </div>
        </div>

        <div className="goal-confirm-actions premium">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setWizardOpen(false);
              setTargetsEditable(false);
              setPlanSaved(true);
              // Reload original values
              api.get('/health/goals').then(d => {
                setGoals({ ...DEFAULT_GOALS, ...(d.goals || {}) })
              })
            }}
          >
            Cancel changes
          </button>
          <button className="btn btn-green" type="button" disabled={planSaved && !targetsEditable} onClick={async () => {
            await saveGoals();
            setWizardOpen(false);  // Close wizard after successful save
          }}>
            {planSaved && !targetsEditable ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="goals-page">
      {isOnboarding && (
        <div className="onboarding-banner">
          <div className="onboarding-banner-copy">
            <strong>Welcome to VitaNudge!</strong>
            <span>Set up your health goal below — it takes 2 minutes and personalizes everything: macros, coach advice, and reports.</span>
          </div>
          <button className="btn-link" type="button" onClick={() => navigate('/')}>Skip for now</button>
        </div>
      )}

      {msg && (
        <div className="success-box" style={{
          padding: '16px 20px',
          fontSize: '15px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {msg}
        </div>
      )}

      {renderGoalTracker()}

      {/* Show full hero header only on first-time setup — hidden once a goal is active */}
      {!planSaved && (
        <div className="goals-premium-head">
          <div>
            <span>Goals</span>
            <h1>Build a measurable goal plan.</h1>
            <p>Answer a few focused questions, review the target and timeline, then save the plan VitaNudge should guide every recommendation toward.</p>
          </div>
          <div className="goals-head-metrics">
            <div>
              <span>BMI</span>
              <strong>{bmi || '–'}</strong>
            </div>
            <div>
              <span>{hasPreviewed && goals.target_weight_kg ? 'Target' : 'Weight'}</span>
              <strong>{hasPreviewed && goals.target_weight_kg ? `${goals.target_weight_kg}kg` : (profile.weight_kg ? `${profile.weight_kg}kg` : '–')}</strong>
            </div>
          </div>
        </div>
      )}

      {weightPrompt && (
        <div className="warn-box goal-recalc-banner">
          Your latest logged weight is {weightPrompt.weight_kg}kg, which is more than 2kg away from Profile. Recalculate targets with the newer weight?
          <button className="btn btn-ghost btn-compact" type="button" onClick={applyLatestWeight}>Use latest weight</button>
        </div>
      )}

      {/* Collapsible wizard — collapsed by default when a goal is already saved */}
      <div className="card goal-recommender">
        {planSaved && !wizardOpen ? (
          /* ── Collapsed state: just a "Modify goal" trigger row ── */
          <div className="goal-wizard-collapsed">
            <div className="goal-wizard-collapsed-copy">
              <div className="goal-wizard-collapsed-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Goal saved
              </div>
              <span>
                {getOption(GOAL_OPTIONS, goals.goal_type).label} · {goals.cal} kcal · {goals.protein_g}g protein · {goals.carbs_g}g carbs
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-ghost btn-compact"
                type="button"
                onClick={() => {
                  setWizardOpen(true);
                  setWizardStep(PREVIEW_STEP_INDEX);
                  setTargetsEditable(true);  // Enable editing immediately
                  setPlanSaved(false);
                }}
              >
                Modify goal
              </button>
              <button
                className="btn btn-ghost btn-compact"
                type="button"
                style={{ color: 'var(--red, #dc2626)' }}
                onClick={() => {
                  if (window.confirm('Delete this goal? This action cannot be undone.')) {
                    api.delete('/health/goals').then(() => {
                      setGoals(DEFAULT_GOALS)
                      setPlanSaved(false)
                      setHasPreviewed(false)
                      setWizardOpen(true)
                      setWizardStep(0)
                      flash('Goal deleted successfully.')
                    }).catch(() => {
                      flash('Failed to delete goal. Please try again.')
                    })
                  }
                }}
              >
                Delete goal
              </button>
            </div>
          </div>
        ) : (
          /* ── Expanded wizard ── */
          <>
            <div className="target-plan-head">
              <div>
                <div className="card-title">
                  {planSaved ? 'Modifying your goal' : 'Goal setup'}
                </div>
                {profile.age && profile.weight_kg && profile.height_cm ? (
                  <p>{profile.age} yrs · {profile.gender} · {profile.weight_kg}kg · {profile.height_cm}cm · BMI {bmi}. These are planning targets, not medical advice.</p>
                ) : (
                  <p style={{ color: 'var(--amber)', fontSize: '13px' }}>⚠️ Complete your profile (age, weight, height) for personalized recommendations.</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {planSaved && (
                  <button className="btn btn-ghost btn-compact" type="button" onClick={() => setWizardOpen(false)}>
                    Cancel
                  </button>
                )}
                <span>Step {wizardStep + 1} / {WIZARD_STEPS.length}</span>
              </div>
            </div>

            <div className="goal-step-meter" aria-hidden="true">
              <span style={{ width: `${(wizardStep / PREVIEW_STEP_INDEX) * 100}%` }} />
            </div>

            <div className="goal-wizard-progress" aria-label="Goal recommender progress">
              {WIZARD_STEPS.map((step, index) => {
                const isFuture = index > maxStepReached
                return (
                  <button
                    key={step.key}
                    type="button"
                    className={`${index === wizardStep ? 'active' : ''}${index < wizardStep ? ' complete' : ''}${isFuture ? ' locked' : ''}`}
                    disabled={isFuture}
                    onClick={() => goToStep(index)}
                  >
                    <i>{index + 1}</i>
                    <span>{step.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="goal-wizard-step">
              <span>{WIZARD_STEPS[wizardStep].label}</span>
              <h2>{WIZARD_STEPS[wizardStep].title}</h2>
              <p>{WIZARD_STEPS[wizardStep].copy}</p>
            </div>

            {/* Profile completion requirement */}
            {(!profile.age || !profile.weight_kg || !profile.height_cm) ? (
              <div className="warn-box" style={{ marginTop: '20px' }}>
                <strong>⚠️ Profile Required</strong>
                <p>Please complete your profile (age, weight, height) before setting up goals. This ensures accurate calorie and macro calculations.</p>
                <button
                  className="btn btn-green"
                  type="button"
                  onClick={() => navigate('/profile')}
                  style={{ marginTop: '16px', width: '100%' }}
                >
                  Complete your profile →
                </button>
              </div>
            ) : (
              renderWizardStep()
            )}

            {WIZARD_STEPS[wizardStep].key === 'pace' && showGlucoseWarning && (
              <div className="warn-box goal-inline-warning">
                Aggressive deficits can cause glucose variability. Steady pace is usually safer for diabetes-focused plans.
              </div>
            )}
          </>
        )}

        {(!planSaved || wizardOpen) && (
          <div className="goal-wizard-actions">
            {wizardStep < PREVIEW_STEP_INDEX && (() => {
              // Disable Next button if profile is incomplete (age, weight, height, gender required)
              const isProfileComplete = profile.age && profile.weight_kg && profile.height_cm && profile.gender
              const isStatsStep = WIZARD_STEPS[wizardStep].key === 'stats'
              // Disable on ALL steps if profile incomplete, or on Stats step if fields empty
              const isNextDisabled = !isProfileComplete

              return (
                <button
                  className="btn btn-green"
                  type="button"
                  onClick={goNextStep}
                  disabled={isNextDisabled}
                  title={isNextDisabled ? 'Please complete your profile first (Age, Weight, Height, Gender). Click the button above to go to Profile.' : ''}
                >
                  {wizardStep === PREVIEW_STEP_INDEX - 1 ? 'Preview plan →' : 'Next →'}
                </button>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
