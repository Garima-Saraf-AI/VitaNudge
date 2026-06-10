# Goals Dashboard Sync Issue - Investigation

**Reported Issue**: Saved goals show 2100 kcal / 135g protein / 110g carbs, but Today dashboard shows 1700 / 110g / 150g

**Date**: 2026-06-09 23:00 CST  
**Status**: ⚠️ **Backend Verified Working** | Frontend Issue Suspected

---

## Backend Verification ✅

### Test 1: Update Goals
```bash
PUT /api/health/goals
{"cal":2100,"protein_g":135,"fiber_g":35,"carbs_g":110}
```

**Response**:
```json
{
  "goals": {
    "cal": 2100,
    "protein_g": 135,
    "fiber_g": 35,
    "carbs_g": 110
  }
}
```

✅ **Backend saves goals correctly**

---

### Test 2: Retrieve Goals via Summary
```bash
GET /api/health/summary?date=2026-06-09
```

**Response**:
```json
{
  "goals": {
    "cal": 2100,
    "protein_g": 135,
    "fiber_g": 35,
    "carbs_g": 110,
    ...
  }
}
```

✅ **Backend returns updated goals correctly**

---

## Frontend Suspected Issue ⚠️

### Code Location
**File**: `frontend/src/pages/Tracker.jsx`  
**Line**: 480

```javascript
const G = summary?.goals  || { cal: 1700, protein_g: 110, fiber_g: 35, carbs_g: 150 }
```

### Problem
Hardcoded fallback values are used when `summary?.goals` is:
- `undefined`
- `null`  
- `false`
- Empty object `{}`

### Potential Root Causes

#### 1. **Race Condition**
Frontend loads before `summary` state is populated:

```javascript
// Line 328: Initial state
const [summary, setSummary] = useState(null)

// Line 344: Load function
const load = useCallback(async () => {
  setLoading(true)
  const [s, m] = await Promise.all([
    api.get(`/health/summary?date=${date}`),
    api.get(`/meals?date=${date}`),
  ])
  setSummary(s)  // <-- If this fails silently, summary stays null
  setLogs(m.logs)
  setLoading(false)
}, [date])
```

If API call fails or returns unexpected format, `summary` stays `null` → fallback values used.

---

#### 2. **API Error Not Handled**
If `/health/summary` returns error, `summary` never gets set:

```javascript
// No try-catch in load function
const load = useCallback(async () => {
  setLoading(true)
  const [s, m] = await Promise.all([
    api.get(`/health/summary?date=${date}`),  // <-- Could throw
    api.get(`/meals?date=${date}`),
  ])
  setSummary(s)  // <-- Never reached if error thrown
  ...
}, [date])
```

---

#### 3. **LocalStorage/Cache**
Frontend might be caching old `summary` data:

```javascript
// Check if api.js has caching logic
// Check if browser localStorage has stale data
```

---

#### 4. **Token Expiration**
If auth token expires, API calls might return 401:
- Frontend doesn't detect auth failure
- `summary` stays null
- Fallback values shown

---

## Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools → Console
2. Look for API errors:
   - `GET /api/health/summary?date=...` - Check status code
   - Look for 401 (auth), 500 (server error), network errors

### Step 2: Check Network Tab
1. DevTools → Network
2. Filter: `summary`
3. Check response:
   ```json
   {
     "goals": {
       "cal": 2100,  // <-- Should match saved goals
       "protein_g": 135,
       ...
     }
   }
   ```

### Step 3: Check React State
1. Install React DevTools extension
2. Find `<Tracker>` component
3. Inspect state:
   ```javascript
   summary: {
     goals: {
       cal: 2100,  // <-- Should be here
       protein_g: 135,
       ...
     }
   }
   ```

### Step 4: Check for Stale Cache
1. Open DevTools → Application → Local Storage
2. Clear all VitaNudge data
3. Refresh page
4. Check if goals load correctly

---

## Recommended Fixes

### Fix 1: Add Error Handling
```javascript
const load = useCallback(async () => {
  setLoading(true)
  try {
    const [s, m] = await Promise.all([
      api.get(`/health/summary?date=${date}`),
      api.get(`/meals?date=${date}`),
    ])
    setSummary(s)
    setLogs(m.logs)
  } catch (e) {
    console.error('[Tracker] Failed to load:', e)
    setErr('Could not load dashboard. Please refresh.')
  } finally {
    setLoading(false)
  }
}, [date])
```

### Fix 2: Add Loading State Check
```javascript
// Don't show fallback while loading
const G = loading 
  ? { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0 }  // Show loading state
  : (summary?.goals || { cal: 1700, protein_g: 110, fiber_g: 35, carbs_g: 150 })
```

### Fix 3: Add Validation
```javascript
const G = (summary?.goals && summary.goals.cal > 0)
  ? summary.goals
  : { cal: 1700, protein_g: 110, fiber_g: 35, carbs_g: 150 }
```

### Fix 4: Force Refresh After Goals Update
In Goals.jsx after saving:
```javascript
async function handleSave() {
  await api.put('/health/goals', formData)
  setSuccess('Goals saved!')
  
  // Force dashboard to reload
  window.dispatchEvent(new Event('goals-updated'))
  // OR navigate to dashboard and trigger reload
  navigate('/tracker', { state: { reload: true } })
}
```

In Tracker.jsx:
```javascript
useEffect(() => {
  const handleGoalsUpdate = () => load()
  window.addEventListener('goals-updated', handleGoalsUpdate)
  return () => window.removeEventListener('goals-updated', handleGoalsUpdate)
}, [load])
```

---

## Testing Procedure

### Manual Test (Browser)
1. Navigate to `/goals`
2. Update goals to 2100/135/110
3. Click "Save Goals"
4. Navigate to `/tracker` (Today dashboard)
5. **Expected**: Dashboard shows 2100/135/110
6. **Reported**: Dashboard shows 1700/110/150 (old defaults)

### API Test (Working)
```bash
# Update goals
curl -X PUT https://vitanudge-api.onrender.com/api/health/goals \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cal":2100,"protein_g":135,"carbs_g":110}'

# Verify via summary
curl https://vitanudge-api.onrender.com/api/health/summary?date=2026-06-09 \
  -H "Authorization: Bearer $TOKEN" | jq '.goals'

# Result: Shows 2100/135/110 ✅
```

---

## Temporary Workaround

User can refresh the page after saving goals:
1. Save goals in Goals wizard
2. Navigate to dashboard
3. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Goals should load correctly

---

## Next Steps

1. ⚠️ **Cannot test in browser** due to cold start blocking page load
2. 🔬 **Requires manual browser testing** to confirm root cause
3. 📊 **Recommended**: Add error logging to track API failures
4. 🐛 **Likely fix**: Add error handling to `load()` function
5. 🔄 **Enhancement**: Add refresh trigger after goals update

---

## Priority

**Severity**: ⚠️ **Medium**  
**Impact**: Users see incorrect goal targets on dashboard  
**Workaround**: Hard refresh page  
**Backend**: ✅ Working correctly  
**Frontend**: ⚠️ Needs investigation

---

## Conclusion

Backend is working correctly - saves and retrieves updated goals. Issue is in frontend:
- Either API call failing silently
- Or race condition causing stale data
- Or caching issue

**Cannot verify root cause** without browser testing due to cold start blocking page interaction.

**Recommendation**: Add error handling to Tracker.jsx `load()` function and test manually when browser testing becomes available.
