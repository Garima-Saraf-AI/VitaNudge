import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import PageHero from '../components/PageHero'
import CustomFoodModal from '../components/CustomFoodModal'
import UpgradeModal from '../components/UpgradeModal'

const DEFAULT_GOALS = {
  goal_type: 'glucose',
  cal: 1700,
  protein_g: 110,
  fiber_g: 35,
  carbs_g: 150,
}

const DIET_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-veg' },
]

const DIET_LABELS = {
  all: 'All',
  vegan: 'Vegan',
  veg: 'Vegetarian',
  non_veg: 'Non-vegetarian',
}

const SUGGESTED_RECIPES = [
  {
    name: 'Chicken quinoa power bowl',
    diet: 'non_veg',
    tags: ['muscle', 'gain'],
    serving: '1 bowl',
    cal: 520,
    protein_g: 46,
    fiber_g: 8,
    carbs_g: 48,
    fat_g: 16,
    notes: 'Lean protein with slow carbs for training days.',
    time: '25 min',
    ingredients: [
      'Cooked quinoa - 120g',
      'Grilled chicken breast - 140g',
      'Cucumber - 60g',
      'Cherry tomatoes - 60g',
      'Spinach - 40g',
      'Greek yogurt dressing - 2 tbsp',
    ],
    steps: [
      'Cook quinoa and keep it warm.',
      'Season chicken with salt, pepper, garlic, and lemon; grill until cooked through.',
      'Add quinoa, spinach, cucumber, and tomatoes to a bowl.',
      'Slice chicken on top and finish with yogurt dressing.',
    ],
  },
  {
    name: 'Tofu lentil greens bowl',
    diet: 'vegan',
    tags: ['fat_loss', 'glucose', 'muscle'],
    serving: '1 bowl',
    cal: 430,
    protein_g: 32,
    fiber_g: 15,
    carbs_g: 42,
    fat_g: 13,
    notes: 'High fiber, high protein, and steady carbs.',
    time: '30 min',
    ingredients: [
      'Firm tofu - 120g',
      'Cooked lentils - 140g',
      'Mixed greens - 80g',
      'Bell pepper - 60g',
      'Olive oil - 1 tsp',
      'Lemon juice and spices - to taste',
    ],
    steps: [
      'Press tofu for a few minutes, then cube it.',
      'Pan-sear tofu with spices until lightly crisp.',
      'Warm lentils with a little salt, cumin, and lemon.',
      'Serve tofu and lentils over greens with bell pepper.',
    ],
  },
  {
    name: 'Greek yogurt berry protein bowl',
    diet: 'veg',
    tags: ['fat_loss', 'muscle', 'maintain'],
    serving: '1 bowl',
    cal: 310,
    protein_g: 30,
    fiber_g: 7,
    carbs_g: 28,
    fat_g: 8,
    notes: 'Quick breakfast or snack when protein is behind.',
    time: '5 min',
    ingredients: [
      'Greek yogurt - 220g',
      'Mixed berries - 80g',
      'Chia seeds - 10g',
      'Protein powder - 15g',
      'Almonds - 8g',
      'Cinnamon - to taste',
    ],
    steps: [
      'Mix Greek yogurt with protein powder until smooth.',
      'Top with berries, chia seeds, almonds, and cinnamon.',
      'Rest for 3 minutes if you want the chia seeds to soften.',
    ],
  },
  {
    name: 'Salmon sweet potato plate',
    diet: 'non_veg',
    tags: ['glucose', 'maintain', 'muscle'],
    serving: '1 plate',
    cal: 480,
    protein_g: 36,
    fiber_g: 9,
    carbs_g: 38,
    fat_g: 20,
    notes: 'Balanced plate with omega fats and controlled carbs.',
    time: '35 min',
    ingredients: [
      'Salmon fillet - 140g',
      'Sweet potato - 150g',
      'Broccoli - 120g',
      'Olive oil - 1 tsp',
      'Lemon juice - 1 tbsp',
      'Garlic, pepper, herbs - to taste',
    ],
    steps: [
      'Roast sweet potato wedges until tender.',
      'Season salmon with lemon, garlic, and herbs.',
      'Bake or pan-sear salmon until flaky.',
      'Steam broccoli and serve everything together.',
    ],
  },
  {
    name: 'Chickpea vegetable wrap',
    diet: 'vegan',
    tags: ['gain', 'maintain', 'glucose'],
    serving: '1 wrap',
    cal: 390,
    protein_g: 18,
    fiber_g: 12,
    carbs_g: 54,
    fat_g: 11,
    notes: 'Portable meal with fiber and moderate protein.',
    time: '15 min',
    ingredients: [
      'Whole wheat wrap - 1 medium',
      'Boiled chickpeas - 120g',
      'Hummus - 2 tbsp',
      'Lettuce - 40g',
      'Cucumber - 50g',
      'Onion and tomato - 50g',
    ],
    steps: [
      'Mash chickpeas lightly with hummus and spices.',
      'Warm the wrap for 20 seconds.',
      'Layer lettuce, cucumber, onion, tomato, and chickpea filling.',
      'Roll tightly and toast on a pan if preferred.',
    ],
  },
]

function r1(n) {
  return Math.round((Number(n) || 0) * 10) / 10
}

function emptyIngredient(foodId = '') {
  return { food_id: foodId, qty: '' }
}

function normalizeName(name = '') {
  return String(name).trim().toLowerCase()
}

function recipeMatchesDiet(recipe, preference) {
  if (preference === 'vegan') return recipe.diet === 'vegan'
  if (preference === 'veg') return recipe.diet === 'vegan' || recipe.diet === 'veg'
  if (preference === 'non_veg') return recipe.diet === 'non_veg'
  return true
}

function macroForIngredient(ingredient, foods) {
  const food = foods.find(f => f.id === ingredient.food_id)
  if (!food) return null
  const baseAmount = Number(food.base_amount) || 100
  const qty = Number(ingredient.qty) || 0
  const factor = qty / baseAmount
  return {
    food,
    qty,
    cal: r1(food.cal * factor),
    protein_g: r1(food.protein_g * factor),
    fiber_g: r1(food.fiber_g * factor),
    carbs_g: r1(food.carbs_g * factor),
    fat_g: r1((food.fat_g || 0) * factor),
  }
}

function sumMacros(items) {
  return items.reduce((sum, item) => ({
    cal: r1(sum.cal + item.cal),
    protein_g: r1(sum.protein_g + item.protein_g),
    fiber_g: r1(sum.fiber_g + item.fiber_g),
    carbs_g: r1(sum.carbs_g + item.carbs_g),
    fat_g: r1(sum.fat_g + item.fat_g),
  }), { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0, fat_g: 0 })
}

function perServing(total, servings) {
  const safeServings = Math.max(1, Number(servings) || 1)
  return {
    cal: r1(total.cal / safeServings),
    protein_g: r1(total.protein_g / safeServings),
    fiber_g: r1(total.fiber_g / safeServings),
    carbs_g: r1(total.carbs_g / safeServings),
    fat_g: r1(total.fat_g / safeServings),
  }
}

function recipeFitText(recipe, goals) {
  if (goals.goal_type === 'muscle' || Number(goals.protein_g) >= 140) return `${recipe.protein_g}g protein per serving`
  if (goals.goal_type === 'glucose') return `${recipe.fiber_g}g fiber with ${recipe.carbs_g}g carbs`
  if (goals.goal_type === 'fat_loss') return `${recipe.cal} kcal with high satiety`
  return `${recipe.cal} kcal · P ${recipe.protein_g}g · C ${recipe.carbs_g}g`
}

function recipeDetails(recipe) {
  const ingredients = recipe.ingredients?.join('; ') || ''
  const steps = recipe.steps?.map((step, index) => `${index + 1}. ${step}`).join(' ')
  return `${recipe.notes} Diet: ${DIET_LABELS[recipe.diet] || 'All'}. Time: ${recipe.time}. Ingredients: ${ingredients}. Method: ${steps}`
}

export default function Recipes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [foods, setFoods] = useState([])
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [dietPreference, setDietPreference] = useState(user?.diet_preference && user.diet_preference !== 'all' ? user.diet_preference : 'all')
  const [name, setName] = useState('')
  const [servings, setServings] = useState(1)
  const [prepMinutes, setPrepMinutes] = useState('')
  const [cookMinutes, setCookMinutes] = useState('')
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [showIngredientForm, setShowIngredientForm] = useState(false)
  const [newIngredientTargetIndex, setNewIngredientTargetIndex] = useState(null)
  const [method, setMethod] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'clinical'

  async function loadData(resetIngredients = false) {
    const [foodData, goalData] = await Promise.all([
      api.get('/foods'),
      api.get('/health/goals'),
    ])
    const list = foodData.foods || []
    setFoods(list)
    setGoals({ ...DEFAULT_GOALS, ...(goalData.goals || {}) })
    if (resetIngredients) setIngredients([emptyIngredient()])
  }

  useEffect(() => {
    loadData(true)
  }, [])

  useEffect(() => {
    setDietPreference(user?.diet_preference && user.diet_preference !== 'all' ? user.diet_preference : 'all')
  }, [user?.diet_preference])

  const ingredientFoods = useMemo(
    () => foods.filter(food => food.category !== 'recipe'),
    [foods]
  )
  const macroItems = useMemo(
    () => ingredients.map(item => macroForIngredient(item, ingredientFoods)).filter(Boolean),
    [ingredients, ingredientFoods]
  )
  const validMacroItems = useMemo(
    () => macroItems.filter(item => Number(item.qty) > 0),
    [macroItems]
  )
  const total = useMemo(() => sumMacros(validMacroItems), [validMacroItems])
  const servingMacros = useMemo(() => perServing(total, servings), [total, servings])
  const totalRecipeMinutes = Math.max(0, Number(prepMinutes) || 0) + Math.max(0, Number(cookMinutes) || 0)
  const savedRecipes = useMemo(
    () => foods.filter(food => food.category === 'recipe' && !food.is_default),
    [foods]
  )
  const savedRecipeNames = useMemo(
    () => new Set(savedRecipes.map(recipe => normalizeName(recipe.name))),
    [savedRecipes]
  )
  const suggestions = useMemo(() => {
    const currentGoal = goals.goal_type || 'glucose'
    const eligible = SUGGESTED_RECIPES.filter(recipe => recipeMatchesDiet(recipe, dietPreference))
    return [...eligible]
      .sort((a, b) => {
        const dietScore = Number(b.diet === dietPreference) - Number(a.diet === dietPreference)
        const goalScore = Number(b.tags.includes(currentGoal)) - Number(a.tags.includes(currentGoal))
        return dietScore || goalScore
      })
      .slice(0, 4)
  }, [goals.goal_type, dietPreference])

  function flash(message) {
    setMsg(message)
    setTimeout(() => setMsg(''), 2500)
  }

  function updateIngredient(index, key, value) {
    if (key === 'food_id' && value === '__new__') {
      setNewIngredientTargetIndex(index)
      setShowIngredientForm(true)
      return
    }
    setIngredients(rows => rows.map((row, i) => i === index ? { ...row, [key]: value } : row))
  }

  function addIngredient() {
    setIngredients(rows => [...rows, emptyIngredient()])
  }

  function removeIngredient(index) {
    setIngredients(rows => rows.filter((_, i) => i !== index))
  }

  function closeNewIngredientModal() {
    setShowIngredientForm(false)
    setNewIngredientTargetIndex(null)
  }

  function handleNewIngredientCreated(food) {
    setFoods(list => [...list, food].sort((a, b) => a.name.localeCompare(b.name)))
    setIngredients(rows => {
      if (newIngredientTargetIndex == null) return [...rows, emptyIngredient(food.id)]
      return rows.map((row, index) => index === newIngredientTargetIndex ? { ...row, food_id: food.id } : row)
    })
    setNewIngredientTargetIndex(null)
    setShowIngredientForm(false)
    flash('Ingredient added and selected in this recipe.')
  }

  async function saveRecipe(recipe = null) {
    // Enforce Pro tier
    if (!isPro) {
      setShowUpgrade(true)
      return
    }

    setErr('')
    const recipeName = recipe?.name || name.trim()
    const macros = recipe || servingMacros
    const alreadySaved = recipe && savedRecipeNames.has(normalizeName(recipe.name))
    if (alreadySaved) {
      flash('This recipe is already in your library.')
      return
    }
    if (!recipeName) {
      setErr('Recipe name is required.')
      return
    }
    if (!recipe && validMacroItems.length === 0) {
      setErr('Add at least one ingredient with quantity.')
      return
    }

    const timeNote = recipe?.time || `Prep ${Number(prepMinutes) || 0} min; Cook ${Number(cookMinutes) || 0} min; Total ${totalRecipeMinutes} min`

    await api.post('/foods', {
      name: recipeName,
      category: 'recipe',
      base_unit: 'serving',
      base_amount: 1,
      serving: recipe?.serving || `1 of ${Math.max(1, Number(servings) || 1)} servings`,
      cal: macros.cal,
      protein_g: macros.protein_g,
      fiber_g: macros.fiber_g,
      carbs_g: macros.carbs_g,
      fat_g: macros.fat_g || 0,
      gi: goals.goal_type === 'glucose' ? 'low' : 'unknown',
      notes: recipe
        ? recipeDetails(recipe)
        : `Recipe built from ${validMacroItems.length} ingredient${validMacroItems.length === 1 ? '' : 's'}. Time: ${timeNote}. Ingredients: ${validMacroItems.map(item => `${item.food.name} - ${item.qty}${item.food.base_unit || ''}`).join('; ')}. Method: ${method || 'Not added yet.'}`,
    })
    await loadData(false)
    if (!recipe) {
      setName('')
      setMethod('')
      setPrepMinutes('')
      setCookMinutes('')
    }
    flash(recipe ? 'Suggested recipe added to food library.' : 'Recipe saved to food library.')
  }

  return (
    <div>
      {msg && <div className="success-box">{msg}</div>}
      {err && <div className="error-box">{err}</div>}

      <PageHero
        eyebrow="Recipes"
        title="Build meals that match your goals."
        copy="Add ingredients, calculate calories and protein per serving, then save recipes to the food library for one-tap logging."
        metric={`${goals.protein_g || 0}g`}
        metricLabel="protein target"
      />

      <div className="recipe-layout">
        <section className="card recipe-builder">
          <div className="card-title">Recipe calculator</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Recipe name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Protein breakfast bowl" />
            </div>
            <div className="form-group">
              <label>Servings</label>
              <input type="number" min="1" max="20" step="1" value={servings} onChange={e => setServings(e.target.value)} />
            </div>
          </div>

          <div className="recipe-time-grid">
            <div className="form-group">
              <label>Prep time (min)</label>
              <input type="number" min="0" max="300" step="1" value={prepMinutes} onChange={e => setPrepMinutes(e.target.value)} placeholder="10" />
            </div>
            <div className="form-group">
              <label>Cook time (min)</label>
              <input type="number" min="0" max="600" step="1" value={cookMinutes} onChange={e => setCookMinutes(e.target.value)} placeholder="20" />
            </div>
            <div className="recipe-time-total">
              <span>Total time</span>
              <strong>{totalRecipeMinutes} min</strong>
            </div>
          </div>

          <div className="recipe-ingredient-list">
            {ingredients.map((item, index) => {
              const selected = ingredientFoods.find(f => f.id === item.food_id)
              return (
                <div className="recipe-ingredient-row" key={`${item.food_id}-${index}`}>
                  <div className="form-group">
                    <label>Ingredient</label>
                    <select value={item.food_id} onChange={e => updateIngredient(index, 'food_id', e.target.value)}>
                      <option value="" disabled>Choose ingredient</option>
                      {ingredientFoods.map(food => <option key={food.id} value={food.id}>{food.name}</option>)}
                      <option value="__new__">Other / add new ingredient</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Qty ({selected?.base_unit || 'g'})</label>
                    <input type="number" min="0" step="1" value={item.qty} onChange={e => updateIngredient(index, 'qty', e.target.value)} placeholder={selected ? `${selected.base_amount || 100}` : 'Qty'} />
                  </div>
                  <button className="recipe-remove" type="button" aria-label="Remove ingredient" onClick={() => removeIngredient(index)} disabled={ingredients.length === 1}>&times;</button>
                </div>
              )
            })}
          </div>

          <div className="form-grid full">
            <div className="form-group">
              <label>How to make it</label>
              <textarea
                value={method}
                onChange={e => setMethod(e.target.value)}
                placeholder="Example: Boil lentils, saute vegetables, mix spices, simmer for 8 minutes, then portion into 2 servings."
              />
            </div>
          </div>

          <div className="recipe-actions">
            <button className="btn btn-ghost" type="button" onClick={addIngredient} disabled={!ingredientFoods.length}>Add ingredient</button>
            <button className="btn btn-green" type="button" onClick={() => saveRecipe()}>Save recipe</button>
          </div>
        </section>

        <aside className="card recipe-total-card">
          <div className="card-title">Nutrition per serving</div>
          <div className="recipe-macro-grid">
            <div><span>Calories</span><strong>{servingMacros.cal}</strong></div>
            <div><span>Protein</span><strong>{servingMacros.protein_g}g</strong></div>
            <div><span>Fiber</span><strong>{servingMacros.fiber_g}g</strong></div>
            <div><span>Carbs</span><strong>{servingMacros.carbs_g}g</strong></div>
            <div><span>Fat</span><strong>{servingMacros.fat_g}g</strong></div>
          </div>
          <div className="recipe-total-note">
            Total recipe: {total.cal} kcal · P {total.protein_g}g · C {total.carbs_g}g
          </div>
        </aside>
      </div>

      <section className="card">
        <div className="recipe-section-head">
          <div>
            <div className="card-title">My saved recipes</div>
            <p>Quick overview of saved recipes. Open the full cookbook page when you want to follow one while cooking.</p>
          </div>
          <div className="recipe-head-actions">
            <span className="saved-recipe-count">{savedRecipes.length} saved</span>
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/my-recipes')}>View all</button>
          </div>
        </div>
        {savedRecipes.length === 0 ? (
          <div className="saved-recipes-empty">No saved recipes yet. Build one above or add a suggested recipe below.</div>
        ) : (
          <div className="saved-recipe-grid">
            {savedRecipes.slice(0, 4).map(recipe => (
              <article className="saved-recipe-card" key={recipe.id}>
                <div>
                  <span className="recipe-fit">{recipe.serving || '1 serving'}</span>
                  <h3>{recipe.name}</h3>
                  {recipe.notes && <p>{recipe.notes}</p>}
                </div>
                <div className="food-pills">
                  <span className="tag tag-k">{recipe.cal}kcal</span>
                  <span className="tag tag-p">P {recipe.protein_g}g</span>
                  <span className="tag tag-f">F {recipe.fiber_g}g</span>
                  <span className="tag tag-c">C {recipe.carbs_g}g</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="recipe-section-head">
          <div>
            <div className="card-title">Suggested for your confirmed goal</div>
            <p>{user?.diet_preference && user.diet_preference !== 'all' ? `${DIET_LABELS[dietPreference]} preference applied from your profile.` : 'No food preference selected yet, so all suggestions are shown.'} You can preview another set here.</p>
          </div>
          <div className="recipe-diet-switch" aria-label="Recipe diet preference">
            {DIET_OPTIONS.map(option => (
              <button
                key={option.value}
                className={dietPreference === option.value ? 'active' : ''}
                type="button"
                onClick={() => setDietPreference(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="recipe-suggestion-grid">
          {suggestions.map(recipe => {
            const alreadySaved = savedRecipeNames.has(normalizeName(recipe.name))
            return (
            <article className={`recipe-suggestion-card${alreadySaved ? ' saved' : ''}`} key={recipe.name}>
              <div>
                <span className="recipe-fit">{recipeFitText(recipe, goals)}</span>
                <h3>{recipe.name}</h3>
                <p>{recipe.notes}</p>
              </div>
              <div className="food-pills">
                <span className="tag tag-k">{recipe.cal}kcal</span>
                <span className="tag tag-p">P {recipe.protein_g}g</span>
                <span className="tag tag-f">F {recipe.fiber_g}g</span>
                <span className="tag tag-c">C {recipe.carbs_g}g</span>
              </div>
              <div className="recipe-card-detail">
                <div>
                  <span>Ingredients</span>
                  <ul>
                    {recipe.ingredients.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <span>How to make</span>
                  <ol>
                    {recipe.steps.map(step => <li key={step}>{step}</li>)}
                  </ol>
                </div>
              </div>
              <div className="recipe-meta-row">
                <span>{recipe.serving}</span>
                <span>{recipe.time}</span>
                <span>{DIET_LABELS[recipe.diet]}</span>
              </div>
              <button className="btn btn-ghost btn-full" type="button" onClick={() => saveRecipe(recipe)} disabled={alreadySaved}>
                {alreadySaved ? 'Already in library' : 'Add to library'}
              </button>
            </article>
            )
          })}
        </div>
      </section>

      {showIngredientForm && (
        <CustomFoodModal
          title="New ingredient"
          subtitle="Add nutrition per base amount, then it will be selected in this recipe."
          notes="Added from recipe builder."
          saveLabel="Save ingredient"
          onClose={closeNewIngredientModal}
          onCreated={handleNewIngredientCreated}
        />
      )}

      {showUpgrade && (
        <UpgradeModal
          feature="Recipe Builder"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  )
}
