import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import PageHero from '../components/PageHero'
import UpgradeModal from '../components/UpgradeModal'
import StatusToast from '../components/StatusToast'

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non_veg', label: 'Non-vegetarian' },
]

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
]

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const COUNTRY_DEFAULT_TIMEZONES = {
  AU: 'Australia/Sydney',
  BR: 'America/Sao_Paulo',
  CA: 'America/Toronto',
  GB: 'Europe/London',
  IN: 'Asia/Kolkata',
  MX: 'America/Mexico_City',
  RU: 'Europe/Moscow',
  US: 'America/Chicago',
}

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'
}

function normalizeDietPreference(value) {
  return value === 'all' ? '' : (value || '')
}

function optionWithSaved(options, savedValue) {
  const clean = String(savedValue || '').trim()
  return clean && !options.some(option => option.value === clean)
    ? [{ value: clean, label: clean }, ...options]
    : options
}

function uniqueOptions(options) {
  const seen = new Set()
  return options.filter(option => {
    if (!option.value || seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

function preferredTimeZone(country, currentTimeZone) {
  if (!country) return currentTimeZone || browserTimeZone()
  const zones = country.timezones || []
  if (zones.some(zone => zone.zoneName === currentTimeZone)) return currentTimeZone
  return COUNTRY_DEFAULT_TIMEZONES[country.isoCode] || zones[0]?.zoneName || currentTimeZone || browserTimeZone()
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'male',
    weight_kg: '',
    height_cm: '',
    condition: '',
    diet_preference: '',
    country: '',
    state_region: '',
    city: '',
    timezone: browserTimeZone(),
  })
  const [emailPrefs, setEmailPrefs] = useState({ enabled: 0, email: '' })
  const [locationApi, setLocationApi] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [billingStatus, setBillingStatus] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const countries = useMemo(
    () => locationApi ? locationApi.Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name)) : [],
    [locationApi]
  )
  const selectedCountry = countries.find(item => item.name === profile.country)
  const states = useMemo(
    () => selectedCountry && locationApi ? locationApi.State.getStatesOfCountry(selectedCountry.isoCode).sort((a, b) => a.name.localeCompare(b.name)) : [],
    [locationApi, selectedCountry]
  )
  const selectedState = states.find(item => item.name === profile.state_region)
  const cities = useMemo(() => {
    if (!selectedCountry || !locationApi) return []
    if (selectedState) return locationApi.City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) || []
    if (!states.length) return locationApi.City.getCitiesOfCountry(selectedCountry.isoCode) || []
    return []
  }, [locationApi, selectedCountry, selectedState, states.length])
  const countryOptions = optionWithSaved(
    countries.map(item => ({ value: item.name, label: item.name })),
    profile.country
  )
  const stateOptions = optionWithSaved(
    states.map(item => ({ value: item.name, label: item.name })),
    profile.state_region
  )
  const cityOptions = optionWithSaved(
    uniqueOptions(cities.map(city => ({ value: city.name, label: city.name })).sort((a, b) => a.label.localeCompare(b.label))),
    profile.city
  )
  const timezoneOptions = optionWithSaved(uniqueOptions([
    ...TIMEZONE_OPTIONS,
    ...(selectedCountry?.timezones || []).map(zone => ({
      value: zone.zoneName,
      label: `${zone.zoneName} (${zone.gmtOffsetName})`,
    })),
  ]), profile.timezone)
  const needsStateSelection = states.length > 0

  useEffect(() => {
    let active = true
    import('country-state-city').then(module => {
      if (active) setLocationApi({ Country: module.Country, State: module.State, City: module.City })
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!user) return
    setProfile({
      name: user.name || '',
      email: user.email || '',
      age: user.age || '',
      gender: user.gender === 'female' ? 'female' : 'male',
      weight_kg: user.weight_kg || '',
      height_cm: user.height_cm || '',
      condition: user.condition || '',
      diet_preference: normalizeDietPreference(user.diet_preference),
      country: user.country || '',
      state_region: user.state_region || '',
      city: user.city || '',
      timezone: user.timezone || browserTimeZone(),
    })
  }, [user])

  useEffect(() => {
    api.get('/health/weekly-email')
      .then(data => setEmailPrefs(data.preferences))
      .catch(() => {})
    api.get('/billing/status')
      .then(data => setBillingStatus(data))
      .catch(() => {})
  }, [])

  async function saveProfile() {
    setErr('')
    setMsg('')
    setFieldErrors({})

    const errors = {}

    // Frontend validation
    const trimmedName = String(profile.name || '').trim()
    if (!trimmedName) {
      errors.name = 'Name is required'
    } else if (trimmedName.length < 2) {
      errors.name = 'Must be at least 2 characters'
    } else if (trimmedName.length > 100) {
      errors.name = 'Must be less than 100 characters'
    } else if (!/^[a-zA-Z\s\-\.]+$/.test(trimmedName)) {
      errors.name = 'Only letters, spaces, hyphens and periods allowed'
    }

    const age = Number(profile.age)
    if (!profile.age) {
      errors.age = 'Age is required'
    } else if (!Number.isInteger(age) || age < 1 || age > 150) {
      errors.age = 'Must be between 1 and 150'
    }

    const weight = Number(profile.weight_kg)
    if (!profile.weight_kg) {
      errors.weight_kg = 'Weight is required'
    } else if (isNaN(weight) || weight < 1 || weight > 500) {
      errors.weight_kg = 'Must be between 1 and 500 kg'
    }

    const height = Number(profile.height_cm)
    if (!profile.height_cm) {
      errors.height_cm = 'Height is required'
    } else if (isNaN(height) || height < 50 || height > 300) {
      errors.height_cm = 'Must be between 50 and 300 cm'
    }

    // If there are errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      const editableProfile = { ...profile }
      delete editableProfile.email
      const d = await api.put('/auth/profile', editableProfile)
      setUser(d.user)
      const data = await api.put('/health/weekly-email', {
        enabled: emailPrefs.enabled,
      })
      setEmailPrefs(data.preferences)
      flash('Profile saved!')
    } catch (e) {
      flashError(e.error || 'Could not save profile')
    }
  }

  function flash(m) {
    setMsg(m)
    setErr('')
    setTimeout(() => setMsg(''), 3500)
  }

  function flashError(m) {
    setErr(m)
    setMsg('')
    setTimeout(() => setErr(''), 3500)
  }

  function updateCountry(country) {
    const nextCountry = countries.find(item => item.name === country)
    setProfile(p => ({
      ...p,
      country,
      state_region: '',
      city: '',
      timezone: preferredTimeZone(nextCountry, p.timezone),
    }))
  }

  function updateState(stateRegion) {
    setProfile(p => ({
      ...p,
      state_region: stateRegion,
      city: '',
      timezone: preferredTimeZone(selectedCountry, p.timezone),
    }))
  }

  const bmi = user?.weight_kg && user?.height_cm
    ? (user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1)
    : '-'

  return (
    <div>
      <StatusToast
        message={err || msg}
        tone={err ? 'error' : 'success'}
        title={err ? 'Could not save profile' : 'Profile updated'}
      />

      <PageHero
        eyebrow="Profile"
        title="Keep your health profile current."
        copy="These details personalize your goals, coach responses, BMI, and doctor-ready reports."
        metric={bmi}
        metricLabel="current BMI"
      />

      <div className="profile-summary-grid">
        <div>
          <span>Age</span>
          <strong>{user?.age || '-'}</strong>
        </div>
        <div>
          <span>Gender</span>
          <strong>{GENDER_OPTIONS.find(option => option.value === user?.gender)?.label || 'Male'}</strong>
        </div>
        <div>
          <span>Weight</span>
          <strong>{user?.weight_kg ? `${user.weight_kg}kg` : '-'}</strong>
        </div>
        <div>
          <span>Height</span>
          <strong>{user?.height_cm ? `${user.height_cm}cm` : '-'}</strong>
        </div>
        <div>
          <span>Food preference</span>
          <strong>{DIET_OPTIONS.find(option => option.value === user?.diet_preference)?.label || 'Not selected'}</strong>
        </div>
      </div>

      {/* Subscription card */}
      <div className="card">
        <div className="card-title">Subscription</div>
        <div className="billing-status-row">
          <div>
            <div className="billing-tier-badge" data-tier={billingStatus?.tier || 'free'}>
              {billingStatus?.tier === 'pro' ? 'Pro' : billingStatus?.tier === 'clinical' ? 'Clinical' : 'Free Plan'}
            </div>
            {billingStatus?.tier === 'free' && (
              <div className="billing-usage">
                Scans: {billingStatus?.usage?.scans?.used ?? 0}/{billingStatus?.usage?.scans?.limit ?? 5} this month
                &nbsp;·&nbsp;
                Barcodes: {billingStatus?.usage?.barcodes?.used ?? 0}/{billingStatus?.usage?.barcodes?.limit ?? 10} this month
              </div>
            )}
            {billingStatus?.is_pro && billingStatus?.subscription_expires_at && (
              <div className="billing-usage">
                Active until {new Date(billingStatus.subscription_expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!billingStatus?.is_pro && (
              <button className="btn btn-green btn-compact" onClick={() => setShowUpgrade(true)}>
                Upgrade to Pro
              </button>
            )}
            {billingStatus?.is_pro && (
              <button className="btn btn-ghost btn-compact" onClick={async () => {
                try {
                  const d = await api.post('/billing/portal')
                  if (d.portal_url) window.location.href = d.portal_url
                } catch (e) { alert(e.error || 'Could not open billing portal') }
              }}>
                Manage billing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export data card */}
      <div className="card">
        <div className="card-title">Your data</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          Download all your health data — meals, glucose, weight, medications, and more.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            className="btn btn-ghost"
            href={`${(import.meta.env.VITE_API_URL || 'https://vitanudge-api.onrender.com').replace(/\/+$/, '')}/api/export?format=json`}
            download="vitanudge-export.json"
            onClick={e => {
              const token = localStorage.getItem('nt_token')
              if (!token) return
              e.preventDefault()
              // Fetch with auth header for download
              fetch(`${(import.meta.env.VITE_API_URL || 'https://vitanudge-api.onrender.com').replace(/\/+$/, '')}/api/export?format=json`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(r => r.blob()).then(blob => {
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'vitanudge-export.json'
                a.click()
              })
            }}
          >
            Export JSON
          </a>
          <a
            className="btn btn-ghost"
            href="#"
            onClick={e => {
              e.preventDefault()
              const token = localStorage.getItem('nt_token')
              if (!token) return
              fetch(`${(import.meta.env.VITE_API_URL || 'https://vitanudge-api.onrender.com').replace(/\/+$/, '')}/api/export?format=csv`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(r => r.blob()).then(blob => {
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'vitanudge-meals.csv'
                a.click()
              })
            }}
          >
            Export meals CSV
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Profile details</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              value={profile.name}
              onChange={e => {
                setProfile(p => ({ ...p, name: e.target.value }))
                setFieldErrors(e => ({ ...e, name: '' }))
              }}
              placeholder="Your name"
              className={fieldErrors.name ? 'error' : ''}
            />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            <span className="field-hint">Letters, spaces, hyphens and periods only</span>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={profile.email} disabled readOnly placeholder="you@email.com" aria-label="Login email" />
          </div>
        </div>
        <div className="form-grid profile-measure-grid">
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              min="1"
              max="150"
              value={profile.age}
              onChange={e => {
                setProfile(p => ({ ...p, age: +e.target.value }))
                setFieldErrors(e => ({ ...e, age: '' }))
              }}
              className={fieldErrors.age ? 'error' : ''}
            />
            {fieldErrors.age && <span className="field-error">{fieldErrors.age}</span>}
            <span className="field-hint">Enter your age in years</span>
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}>
              {GENDER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              min="1"
              max="500"
              value={profile.weight_kg}
              onChange={e => {
                setProfile(p => ({ ...p, weight_kg: +e.target.value }))
                setFieldErrors(e => ({ ...e, weight_kg: '' }))
              }}
              className={fieldErrors.weight_kg ? 'error' : ''}
            />
            {fieldErrors.weight_kg && <span className="field-error">{fieldErrors.weight_kg}</span>}
            <span className="field-hint">1-500 kg</span>
          </div>
          <div className="form-group">
            <label>Height (cm)</label>
            <input
              type="number"
              min="1"
              max="300"
              value={profile.height_cm}
              onChange={e => {
                setProfile(p => ({ ...p, height_cm: +e.target.value }))
                setFieldErrors(e => ({ ...e, height_cm: '' }))
              }}
              className={fieldErrors.height_cm ? 'error' : ''}
            />
            {fieldErrors.height_cm && <span className="field-error">{fieldErrors.height_cm}</span>}
            <span className="field-hint">50-300 cm</span>
          </div>
        </div>
        <div className="form-grid full">
          <div className="form-group">
            <label>Food preference</label>
            <select value={profile.diet_preference} onChange={e => setProfile(p => ({ ...p, diet_preference: e.target.value }))}>
              <option value="" disabled>Select food preference</option>
              {DIET_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Country</label>
            <select value={profile.country} onChange={e => updateCountry(e.target.value)} disabled={!locationApi}>
              <option value="" disabled>{locationApi ? 'Select country' : 'Loading countries...'}</option>
              {countryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>State / region</label>
            <select value={profile.state_region} onChange={e => updateState(e.target.value)} disabled={!locationApi || !profile.country || !needsStateSelection}>
              <option value="" disabled>
                {needsStateSelection || !profile.country ? 'Select state / region' : 'No state / region needed'}
              </option>
              {stateOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>City</label>
            <select value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} disabled={!locationApi || !profile.country || (needsStateSelection && !profile.state_region)}>
              <option value="" disabled>
                Select city
              </option>
              {cityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Time zone</label>
            <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
              {timezoneOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid full">
          <div className="form-group">
            <label>Condition / notes</label>
            <input value={profile.condition} onChange={e => setProfile(p => ({ ...p, condition: e.target.value }))} placeholder="e.g. Diabetic, vegetarian" />
          </div>
        </div>
        <div className="form-grid full">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={!!emailPrefs.enabled}
              onChange={e => setEmailPrefs(p => ({ ...p, enabled: e.target.checked ? 1 : 0 }))}
            />
            <span>Get a health summary delivered every Sunday</span>
          </label>
        </div>
        {!profile.email && <div className="warn-box">Add your email above before enabling summaries.</div>}
        <button className="btn btn-green btn-full" onClick={saveProfile}>Save profile</button>
      </div>

      {/* Account Management Section */}
      <div className="card">
        <div className="card-title">Account Management</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Manage your account settings and data.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            to="/delete-account"
            style={{
              padding: '12px 16px',
              border: '1px solid var(--red-b)',
              borderRadius: 'var(--rm)',
              background: 'var(--red-l)',
              color: 'var(--red)',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            Delete Account
          </Link>

          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Need help? Email <a href="mailto:support@vitanudge.com" style={{ color: 'var(--green)' }}>support@vitanudge.com</a>
          </div>
        </div>
      </div>

      {showUpgrade && <UpgradeModal feature="export" onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
