# Goal Modification - Fix Recommendations

**Date:** June 2, 2026  
**File:** `/frontend/src/pages/Goals.jsx`

---

## 🐛 **Issues Identified in Code:**

### **Issue 1: No Delete Functionality**
**Location:** Entire component  
**Problem:** No delete button or delete function exists  
**Impact:** Users cannot remove unwanted goals

**Recommendation:**
Add a "Delete Goal" button in the collapsed wizard section (around line 1000)

```jsx
// Around line 1000, add after "Modify goal" button:
<button
  className="btn btn-ghost btn-compact btn-danger"
  type="button"
  onClick={() => {
    if (window.confirm('Delete this goal? This cannot be undone.')) {
      api.delete('/health/goals').then(() => {
        setGoals(DEFAULT_GOALS)
        setPlanSaved(false)
        setHasPreviewed(false)
        setWizardOpen(true)
        flash('Goal deleted.')
      })
    }
  }}
>
  Delete goal
</button>
```

**Backend required:** Add `DELETE /health/goals` endpoint

---

### **Issue 2: Confusing Save Workflow**
**Location:** Lines 925-930, Line 999  
**Problem:** Multiple edit entry points with unclear save flow

**Current Flow:**
1. User clicks "Modify goal" (line 999)
2. Opens wizard at Preview step  
3. Shows "Edit plan" and "Save goal plan" buttons
4. "Edit plan" just enables inputs - doesn't save
5. "Save goal plan" actually saves

**Confusing because:**
- "Edit plan" sounds like it might trigger wizard
- Not clear you need to click TWO buttons (Edit plan → Make changes → Save goal plan)

**Recommendation:**

**Option A: Simplify to single "Modify" flow**
```jsx
// Line 999 - When "Modify goal" is clicked:
onClick={() => {
  setWizardOpen(true)
  setTargetsEditable(true)  // <-- Enable editing immediately
  setPlanSaved(false)
  setWizardStep(PREVIEW_STEP_INDEX)
}}
```

Then change button labels at line 925-930:
```jsx
<button 
  className="btn btn-ghost" 
  onClick={() => {
    setWizardOpen(false)  // Cancel - close wizard
    setTargetsEditable(false)
    // Reload original values from API
    api.get('/health/goals').then(d => {
      setGoals({ ...DEFAULT_GOALS, ...(d.goals || {}) })
    })
  }}
>
  Cancel changes
</button>

<button 
  className="btn btn-green" 
  disabled={planSaved}
  onClick={async () => {
    await saveGoals()
    setWizardOpen(false)  // Close wizard after save
  }}
>
  {planSaved ? 'Saved ✓' : 'Save changes'}
</button>
```

---

### **Issue 3: Success Message Too Subtle**
**Location:** Line 395, Lines 398-401  
**Problem:** Flash message appears for only 2.5 seconds and is easy to miss

**Current code:**
```jsx
flash('Confirmed targets saved.')  // Line 395

function flash(m) {
  setMsg(m)
  setTimeout(() => setMsg(''), 2500)  // Disappears after 2.5s
}
```

**Recommendation:**

**Option A: Keep flash but make it more prominent**
```jsx
// Around line 948, update the success message box:
{msg && (
  <div className="success-box" style={{
    padding: '16px',
    fontSize: '15px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    {msg}
  </div>
)}
```

**Option B: Add permanent "Last saved" timestamp**
```jsx
// In state (around line 292):
const [lastSaved, setLastSaved] = useState(null)

// In saveGoals() function (after line 395):
setLastSaved(new Date())
flash('✓ Goal targets saved successfully!')

// In collapsed wizard section (around line 989):
{lastSaved && (
  <small style={{ color: 'var(--hint)', fontSize: '13px' }}>
    Last updated {lastSaved.toLocaleDateString()} at {lastSaved.toLocaleTimeString()}
  </small>
)}
```

---

### **Issue 4: Save Doesn't Close Wizard**
**Location:** Line 393-394  
**Problem:** After saving, wizard stays open at Preview step - confusing

**Current:**
```jsx
setPlanSaved(true)
setTargetsEditable(false)
setWizardOpen(false)   // Line 394 - DOES close wizard!
```

**Actually this is CORRECT!** But users might not notice because:
- No visual feedback besides subtle flash message
- Page doesn't scroll back to top
- Goal tracker doesn't update visibly

**Recommendation:**
Add scroll to top after save:
```jsx
async function saveGoals() {
  // ... existing code ...
  
  setWizardOpen(false)
  flash('✓ Goal targets saved successfully!')
  window.scrollTo({ top: 0, behavior: 'smooth' })  // <-- Add this
}
```

---

## 📝 **Summary of Changes Needed:**

| Issue | Severity | Fix Complexity | Lines Affected |
|-------|----------|----------------|----------------|
| No delete button | MEDIUM | Easy | ~10 lines + backend |
| Confusing save flow | HIGH | Medium | Lines 925-930, 999 |
| Success message subtle | LOW | Easy | Lines 395, 948 |
| No scroll after save | LOW | Trivial | Line 395 |

---

## 🚀 **Quick Wins (15 minutes):**

1. **Add scroll to top** after save (1 line)
2. **Make success message more prominent** (style changes)
3. **Auto-enable editing** when "Modify goal" clicked (1 line)
4. **Add "Last saved" timestamp** (5 lines)

---

## 🔧 **Full Fix (1 hour):**

1. Add delete button + backend endpoint
2. Simplify edit flow (remove "Edit plan" step)
3. Improve button labels
4. Add confirmation dialogs
5. Better visual feedback

---

## ✅ **Testing After Fixes:**

1. Click "Modify goal" → Should open wizard with inputs enabled
2. Change target weight → Should show as edited
3. Click "Save changes" → Should save, show success, close wizard, scroll to top
4. Verify goal tracker updates with new values
5. Click "Delete goal" → Should confirm, delete, reset to empty state
6. Success messages should be visible and clear

---

**Would you like me to implement these fixes now?**

