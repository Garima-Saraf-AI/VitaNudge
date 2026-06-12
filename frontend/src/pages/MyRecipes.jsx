import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { today } from '../utils/calc'
import LogModal from '../components/LogModal'
import PageHero from '../components/PageHero'
import StatusToast from '../components/StatusToast'

function parseRecipeNotes(notes = '') {
  const ingredientsLabel = 'Ingredients:'
  const methodLabel = 'Method:'
  const timeLabel = 'Time:'
  const ingredientsStart = notes.indexOf(ingredientsLabel)
  const methodStart = notes.indexOf(methodLabel)
  const timeStart = notes.indexOf(timeLabel)

  const introEnd = [timeStart, ingredientsStart, methodStart].filter(i => i >= 0).sort((a, b) => a - b)[0] ?? notes.length
  const intro = notes.slice(0, introEnd).trim().replace(/\s*Diet:\s*[^.]+\.?$/i, '').trim()

  const time = timeStart >= 0
    ? notes
        .slice(timeStart + timeLabel.length, ingredientsStart >= 0 ? ingredientsStart : methodStart >= 0 ? methodStart : notes.length)
        .trim()
        .replace(/\.$/, '')
    : ''

  const ingredients = ingredientsStart >= 0
    ? notes
        .slice(ingredientsStart + ingredientsLabel.length, methodStart >= 0 ? methodStart : notes.length)
        .replace(/\.$/, '')
        .split(';')
        .map(item => item.trim())
        .filter(Boolean)
    : []

  const methodText = methodStart >= 0 ? notes.slice(methodStart + methodLabel.length).trim() : ''
  const numberedSteps = methodText.match(/\d+\.\s.*?(?=\s\d+\.|$)/g)
  const steps = numberedSteps
    ? numberedSteps.map(step => step.replace(/^\d+\.\s*/, '').trim())
    : methodText.split(/\n|;/).map(step => step.trim()).filter(Boolean)

  return { intro, time, ingredients, steps }
}

export default function MyRecipes() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [modalRecipe, setModalRecipe] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadRecipes()
  }, [])

  async function loadRecipes() {
    const data = await api.get('/foods?category=recipe&sort=name')
    const saved = (data.foods || []).filter(food => !food.is_default)
    setRecipes(saved)
    setSelectedId(current => current || saved[0]?.id || '')
  }

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return recipes
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(q) ||
      (recipe.notes || '').toLowerCase().includes(q)
    )
  }, [recipes, search])

  const selectedRecipe = useMemo(
    () => filteredRecipes.find(recipe => recipe.id === selectedId) || filteredRecipes[0] || null,
    [filteredRecipes, selectedId]
  )
  const details = selectedRecipe ? parseRecipeNotes(selectedRecipe.notes || '') : { intro: '', time: '', ingredients: [], steps: [] }

  async function handleLog(data) {
    await api.post('/meals', { ...data, log_date: today() })
    setModalRecipe(null)
    setMsg('Recipe added to today\'s log.')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div>
      <StatusToast message={msg} />

      <PageHero
        eyebrow="My recipes"
        title="Cook from your saved recipes."
        copy="Open a saved recipe, follow the ingredients and method, then log one serving when you eat it."
        metric={recipes.length}
        metricLabel="saved recipes"
      />

      <div className="premium-toolbar">
        <input
          className="search-input"
          placeholder="Search saved recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-green" type="button" onClick={() => navigate('/recipes')}>Create recipe</button>
      </div>

      {recipes.length === 0 ? (
        <div className="card saved-recipes-empty">
          No saved recipes yet. Create one from the recipe calculator or add a suggested recipe.
        </div>
      ) : (
        <div className="my-recipes-layout">
          <section className="my-recipes-list" aria-label="Saved recipe list">
            {filteredRecipes.map(recipe => (
              <button
                className={`my-recipe-list-item${selectedRecipe?.id === recipe.id ? ' active' : ''}`}
                key={recipe.id}
                type="button"
                onClick={() => setSelectedId(recipe.id)}
              >
                <span>{recipe.name}</span>
                <small>{recipe.cal} kcal · P {recipe.protein_g}g · C {recipe.carbs_g}g</small>
              </button>
            ))}
            {filteredRecipes.length === 0 && (
              <div className="saved-recipes-empty">No recipes match your search.</div>
            )}
          </section>

          {selectedRecipe && (
            <section className="card my-recipe-detail">
              <div className="my-recipe-detail-head">
                <div>
                  <span className="recipe-fit">{selectedRecipe.serving || '1 serving'}</span>
                  <h2>{selectedRecipe.name}</h2>
                  {details.intro && <p>{details.intro}</p>}
                </div>
                <button className="btn btn-green" type="button" onClick={() => setModalRecipe(selectedRecipe)}>Log serving</button>
              </div>

              <div className="recipe-macro-grid my-recipe-macros">
                {details.time && <div><span>Time</span><strong>{details.time}</strong></div>}
                <div><span>Calories</span><strong>{selectedRecipe.cal}</strong></div>
                <div><span>Protein</span><strong>{selectedRecipe.protein_g}g</strong></div>
                <div><span>Fiber</span><strong>{selectedRecipe.fiber_g}g</strong></div>
                <div><span>Carbs</span><strong>{selectedRecipe.carbs_g}g</strong></div>
              </div>

              <div className="my-recipe-follow-grid">
                <div>
                  <span>Ingredients</span>
                  {details.ingredients.length > 0 ? (
                    <ul>{details.ingredients.map(item => <li key={item}>{item}</li>)}</ul>
                  ) : (
                    <p>No ingredient list was saved for this recipe.</p>
                  )}
                </div>
                <div>
                  <span>How to make</span>
                  {details.steps.length > 0 ? (
                    <ol>{details.steps.map(step => <li key={step}>{step}</li>)}</ol>
                  ) : (
                    <p>No method was saved for this recipe.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {modalRecipe && <LogModal food={modalRecipe} onConfirm={handleLog} onClose={() => setModalRecipe(null)} />}
    </div>
  )
}
