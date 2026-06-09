import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Tracker from './pages/Tracker'
import Scan from './pages/Scan'
import ScanAdd from './pages/ScanAdd'
import Library from './pages/Library'
import Goals from './pages/Goals'
import Profile from './pages/Profile'
import Medications from './pages/Medications'
import Templates from './pages/Templates'
import Recipes from './pages/Recipes'
import MyRecipes from './pages/MyRecipes'
import Report from './pages/Report'
import Coach from './pages/Coach'
// Consolidated health pages
import Body from './pages/Body'
import Clinical from './pages/Clinical'
// Legal pages
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
// Auth flow pages
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import DeleteAccount from './pages/DeleteAccount'
import VerifyEmail from './pages/VerifyEmail'

const PRIMARY_NAV = [
  { path: '/',          label: 'Today',    icon: <TrackerIcon /> },
  { path: '/add-food',  label: 'Add Food', icon: <ScanIcon /> },
  { path: '/coach',     label: 'Coach',    icon: <CoachIcon /> },
  { path: '/report',    label: 'Reports',  icon: <ReportIcon /> },
  { path: '/tools',     label: 'Tools',    icon: <ToolsIcon />, action: 'tools' },
]

const TOOL_PATHS = new Set([
  '/library', '/templates', '/recipes',
  '/body', '/clinical', '/meds',
  // legacy redirects still need to highlight Tools
  '/water', '/weight', '/glucose', '/vitals',
])

const TOOL_SECTIONS = [
  {
    title: 'Track Health',
    items: [
      { path: '/body',     label: 'Body',            desc: 'Weight, hydration, and daily steps in one view.', icon: <BodyIcon />,     tier: 'Core' },
      { path: '/clinical', label: 'Clinical',        desc: 'Glucose, blood pressure, HbA1c, and wellbeing.', icon: <GlucoseIcon />,  tier: 'Core' },
      { path: '/meds',     label: 'Medications',     desc: 'Daily adherence tracking with streak counter.',  icon: <MedsIcon />,     tier: 'Plus' },
    ],
  },
  {
    title: 'Food Tools',
    items: [
      { path: '/library',   label: 'Food Library',    desc: 'Manage foods and portions.',                     icon: <LibraryIcon />,  tier: 'Core' },
      { path: '/recipes',   label: 'Recipes',         desc: 'Calculate recipe macros and goal-fit ideas.',    icon: <RecipeIcon />,   tier: 'Plus' },
      { path: '/templates', label: 'Meal Templates',  desc: 'Log saved meal combos quickly.',                 icon: <TemplateIcon />, tier: 'Plus' },
    ],
  },
]

const PROFILE_MENU_ITEMS = [
  { path: '/profile', label: 'Profile', desc: 'Body details, health notes, and preferences.', icon: <ProfileIcon /> },
  { path: '/goals', label: 'Goals', desc: 'Calories, protein, carbs, fiber, and water.', icon: <GoalsIcon /> },
  { path: '/my-recipes', label: 'My saved recipes', desc: 'Open your cookbook and follow saved methods.', icon: <RecipeBookIcon /> },
]

const PAGE_TITLES = {
  '/': 'Today',
  '/scan': 'Scan',
  '/barcode': 'Barcode',
  '/templates': 'Meal Templates',
  '/recipes': 'Recipes',
  '/my-recipes': 'My Recipes',
  '/library': 'Library',
  '/body': 'Body',
  '/clinical': 'Clinical',
  '/meds': 'Medications',
  '/report': 'Reports',
  '/coach': 'Coach',
  '/goals': 'Goals',
  '/profile': 'Profile',
  // legacy (kept for redirect)
  '/water': 'Body',
  '/weight': 'Body',
  '/glucose': 'Clinical',
  '/vitals': 'Clinical',
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spin" /></div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, logout, loading } = useAuth()
  const [toolsOpen, setToolsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!profileOpen) return undefined

    function handlePointerDown(e) {
      if (!profileMenuRef.current?.contains(e.target)) setProfileOpen(false)
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setProfileOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spin" /></div>

  const isAuth = location.pathname === '/login' || location.pathname === '/register'
  const firstName = user?.name?.split(' ')[0] || 'User'
  const avatarInitial = firstName.slice(0, 1).toUpperCase()
  const pageTitle = PAGE_TITLES[location.pathname] || 'VitaNudge'
  const activePath = toolsOpen
    ? '/tools'
    : TOOL_PATHS.has(location.pathname)
      ? '/tools'
      : location.pathname
  const goTo = path => {
    setToolsOpen(false)
    setProfileOpen(false)
    navigate(path)
  }
  const handlePrimaryNav = item => {
    if (item.action === 'tools') {
      setProfileOpen(false)
      setToolsOpen(open => !open)
      return
    }
    goTo(item.path)
  }
  const handleProfileToggle = () => {
    setToolsOpen(false)
    setProfileOpen(open => !open)
  }
  const handleLogout = () => {
    setProfileOpen(false)
    logout()
  }

  return (
    <div className={`app-layout${user && !isAuth ? ' app-shell' : ''}`}>
      {user && !isAuth && (
        <header className="app-header">
          <div className="header-left">
            <div className="logo">
              <LeafIcon />
              VitaNudge
            </div>
            <div className="header-page">{pageTitle}</div>
          </div>
          <div className="header-right" ref={profileMenuRef}>
            <span className="header-date">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <button
              className={`user-chip${profileOpen ? ' active' : ''}`}
              type="button"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              onClick={handleProfileToggle}
            >
              <span className="user-avatar">{avatarInitial}</span>
              <span className="user-name">{firstName}</span>
              <ChevronDownIcon />
            </button>
            {profileOpen && (
              <ProfileMenu
                activePath={location.pathname}
                onNavigate={goTo}
                onLogout={handleLogout}
              />
            )}
          </div>
        </header>
      )}

      <main className={isAuth ? 'auth-content' : 'main-content'}>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/"          element={<PrivateRoute><Tracker /></PrivateRoute>} />
          <Route path="/scan"      element={<PrivateRoute><Scan /></PrivateRoute>} />
          <Route path="/add-food"  element={<PrivateRoute><ScanAdd /></PrivateRoute>} />
          <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
          <Route path="/recipes"   element={<PrivateRoute><Recipes /></PrivateRoute>} />
          <Route path="/my-recipes" element={<PrivateRoute><MyRecipes /></PrivateRoute>} />
          <Route path="/library"   element={<PrivateRoute><Library /></PrivateRoute>} />
          {/* Consolidated health pages */}
          <Route path="/body"      element={<PrivateRoute><Body /></PrivateRoute>} />
          <Route path="/clinical"  element={<PrivateRoute><Clinical /></PrivateRoute>} />
          <Route path="/meds"      element={<PrivateRoute><Medications /></PrivateRoute>} />
          {/* Legacy redirects — old URLs still work */}
          <Route path="/barcode"   element={<Navigate to="/add-food" replace />} />
          <Route path="/water"     element={<Navigate to="/body" replace />} />
          <Route path="/weight"    element={<Navigate to="/body" replace />} />
          <Route path="/glucose"   element={<Navigate to="/clinical" replace />} />
          <Route path="/vitals"    element={<Navigate to="/clinical" replace />} />
          <Route path="/weekly"   element={<Navigate to="/report" replace />} />
          <Route path="/report"   element={<PrivateRoute><Report /></PrivateRoute>} />
          <Route path="/coach"    element={<PrivateRoute><Coach /></PrivateRoute>} />
          <Route path="/goals"    element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/more"     element={<Navigate to="/" replace />} />

          {/* Legal pages - public access */}
          <Route path="/privacy"  element={<Privacy />} />
          <Route path="/terms"    element={<Terms />} />

          {/* Auth flow - public access */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Account management - requires auth */}
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {user && !isAuth && (
        <nav className="bottom-nav" aria-label="Primary navigation">
          <div className="nav-rail-head">
            <span className="nav-rail-mark"><LeafIcon /></span>
            <span>
              <strong>VitaNudge</strong>
              <small>Daily health</small>
            </span>
          </div>
          <div className="nav-items">
            {PRIMARY_NAV.map(n => (
              <button
                key={n.path}
                className={`nav-btn${n.path === '/scan' ? ' nav-btn-scan' : ''}${n.action === 'tools' ? ' nav-btn-tools' : ''}${activePath === n.path ? ' active' : ''}`}
                onClick={() => handlePrimaryNav(n)}
                aria-current={activePath === n.path ? 'page' : undefined}
                aria-expanded={n.action === 'tools' ? toolsOpen : undefined}
              >
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {user && !isAuth && toolsOpen && (
        <ToolsDrawer
          activePath={location.pathname}
          onClose={() => setToolsOpen(false)}
          onNavigate={goTo}
        />
      )}
    </div>
  )
}

function ToolsDrawer({ activePath, onClose, onNavigate }) {
  return (
    <div className="tools-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <aside className="tools-drawer" aria-label="Tools menu">
        <div className="tools-drawer-head">
          <div>
            <span className="tools-kicker">VitaNudge Tools</span>
            <h2>Everything beyond the daily flow.</h2>
          </div>
          <button className="tools-close" type="button" aria-label="Close tools" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="tools-plus-panel">
          <span>Plus value</span>
          <strong>Templates, barcode lookup, health logs, and smarter capture in one place.</strong>
        </div>

        <div className="tools-section-list">
          {TOOL_SECTIONS.map(section => (
            <section className="tools-section" key={section.title}>
              <h3>{section.title}</h3>
              <div className="tools-grid">
                {section.items.map(item => (
                  <button
                    type="button"
                    key={item.path}
                    className={`tool-card${activePath === item.path ? ' active' : ''}`}
                    onClick={() => onNavigate(item.path)}
                  >
                    <span className="tool-card-icon">{item.icon}</span>
                    <span className="tool-card-copy">
                      <span className="tool-card-title">
                        {item.label}
                        <small>{item.tier}</small>
                      </span>
                      <span className="tool-card-desc">{item.desc}</span>
                    </span>
                    <ArrowRightIcon />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>
    </div>
  )
}

function ProfileMenu({ activePath, onNavigate, onLogout }) {
  return (
    <div className="profile-menu" aria-label="Profile menu">
      <div className="profile-menu-kicker">Profile</div>
      {PROFILE_MENU_ITEMS.map(item => (
        <button
          type="button"
          key={item.path}
          className={`profile-menu-item${activePath === item.path ? ' active' : ''}`}
          onClick={() => onNavigate(item.path)}
        >
          <span className="profile-menu-icon">{item.icon}</span>
          <span>
            <strong>{item.label}</strong>
            <small>{item.desc}</small>
          </span>
        </button>
      ))}
      <button type="button" className="profile-menu-logout" onClick={onLogout}>
        Logout
      </button>
    </div>
  )
}

function LeafIcon()    { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-1 4-2 4-4-3 2-7 3-9 4z"/></svg> }
function TrackerIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17 14v7"/></svg> }
function ScanIcon()    { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> }
function BarcodeIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5v14M8 5v14M12 5v14M17 5v14M20 5v14"/></svg> }
function TemplateIcon(){ return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg> }
function RecipeIcon()  { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v18"/><path d="M10 3v7a4 4 0 0 1-8 0V3"/><path d="M17 3v18"/><path d="M17 3c2.2 1.1 4 3.5 4 6.5S19.2 15 17 16"/></svg> }
function RecipeBookIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M5 3h14a1 1 0 0 1 1 1v17H6.5A2.5 2.5 0 0 1 4 18.5v-14A1.5 1.5 0 0 1 5.5 3"/><path d="M8 7h8M8 11h5"/><path d="M15 15l1 1 2-3"/></svg> }
function LibraryIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
function WaterIcon()   { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> }
function BodyIcon()    { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M9 10h6"/><path d="M9 13l-2 5"/><path d="M15 13l2 5"/></svg> }
function WeightIcon()  { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M9 10a3 3 0 0 1 6 0"/><path d="M12 10l2-2"/></svg> }
function GlucoseIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> }
function VitalsIcon()  { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/><path d="M3 12h5l2-3 3 6 2-3h6"/></svg> }
function MedsIcon()    { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 21a7 7 0 0 1 0-14h4a7 7 0 0 1 0 14h-4z"/><path d="M12 7v14"/><path d="M8 14h8"/></svg> }
function WeeklyIcon()  { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function ReportIcon()  { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg> }
function CoachIcon()   { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/></svg> }
function GoalsIcon()   { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> }
function ProfileIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg> }
function ToolsIcon()   { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> }
function CloseIcon()   { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg> }
function ArrowRightIcon() { return <svg className="tool-card-arrow" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg> }
function ChevronDownIcon() { return <svg className="user-chip-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6"/></svg> }
