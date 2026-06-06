import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import LogModal from '../components/LogModal'
import { today } from '../utils/calc'
import PageHero from '../components/PageHero'

const CATS = ['all','protein','dairy','legume','grain','veg','fruit','snack','beverage','recipe','custom']

export default function Library() {
  const navigate = useNavigate()
  const [foods, setFoods]   = useState([])
  const [cat, setCat]       = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState('name')
  const [modal, setModal]   = useState(null)
  const [msg, setMsg]       = useState('')

  useEffect(() => { load() }, [cat, sort, search])

  async function load() {
    const params = new URLSearchParams({ sort })
    if (cat !== 'all') params.set('category', cat)
    if (search) params.set('search', search)
    const d = await api.get(`/foods?${params}`)
    // Filter out recipes when viewing "all" category
    const filteredFoods = cat === 'all'
      ? d.foods.filter(f => f.category !== 'recipe')
      : d.foods
    setFoods(filteredFoods)
  }

  async function deleteFood(id) {
    if (!confirm('Remove from library?')) return
    await api.delete(`/foods/${id}`)
    load()
  }

  async function handleLog(data) {
    await api.post('/meals', { ...data, log_date: today() })
    setModal(null)
    setMsg('✓ Added to today\'s log')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div>
      {msg && <div className="success-box">{msg}</div>}

      <PageHero
        eyebrow="Food library"
        title="Foods ready when you are."
        copy="Search, filter, and reuse trusted foods without slowing down daily tracking."
        metric={foods.length}
        metricLabel="foods visible"
      />

      <div className="premium-toolbar">
        <input
          className="search-input"
          placeholder="Search foods…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <select className="toolbar-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="name">Name</option>
          <option value="cal">Calories</option>
          <option value="protein">Protein</option>
          <option value="fiber">Fibre</option>
        </select>
        <button className="btn btn-green" onClick={() => navigate('/scan')}>+ Add food</button>
      </div>

      <div className="chip-row">
        {CATS.map(c => (
          <span key={c} className={`filter-chip${cat === c ? ' active' : ''}`}
            onClick={() => setCat(c)}>
            {c === 'all' ? 'All' : c}
          </span>
        ))}
      </div>

      {foods.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--hint)', fontSize: 13 }}>No foods found</div>
      ) : (
        <div className="lib-grid">
          {foods.map(f => (
            <div key={f.id} className={`food-card${f.is_default ? '' : ' custom'}`}>
              <div className="food-card-top">
                <div className="food-card-name">{f.name}</div>
                <span className={`catb ct-${f.category}`}>{f.category}</span>
              </div>
              <div className="food-card-srv">per {f.base_amount}{f.base_unit} · {f.serving || ''}</div>
              <div className="food-pills">
                <span className="tag tag-k">{f.cal}kcal</span>
                <span className="tag tag-p">P {f.protein_g}g</span>
                <span className="tag tag-f">F {f.fiber_g}g</span>
                <span className="tag tag-c">C {f.carbs_g}g</span>
              </div>
              {f.gi && <div style={{ fontSize: 10, color: 'var(--hint)', marginBottom: 5 }}>{f.gi === 'low' ? 'Low GI' : f.gi === 'med' ? 'Med GI' : 'High GI'}{f.notes ? ' · ' + f.notes : ''}</div>}
              <div className="food-card-acts">
                <button className="fca log" type="button" onClick={() => setModal(f)}>+ Log</button>
                <button
                  className={`fca${f.is_default ? ' disabled' : ''}`}
                  type="button"
                  title={f.is_default ? 'Default foods cannot be edited' : 'Edit food'}
                  disabled={!!f.is_default}
                  onClick={() => navigate('/scan', { state: { edit: f } })}
                >
                  Edit
                </button>
                <button
                  className={`fca del-act${f.is_default ? ' disabled' : ''}`}
                  type="button"
                  title={f.is_default ? 'Default foods cannot be deleted' : 'Delete food'}
                  disabled={!!f.is_default}
                  onClick={() => deleteFood(f.id)}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <LogModal food={modal} onConfirm={handleLog} onClose={() => setModal(null)} />}
    </div>
  )
}
