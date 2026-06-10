# Critical Blockers - Fix Plan

**Date**: 2026-06-09 23:10 CST  
**Reporter**: User  
**Status**: 🔴 **BLOCKERS** - Need immediate fixes

---

## 1. Barcode Serving Accuracy 🔴 **CRITICAL**

### Issue
Coca-Cola barcode shows "1 can (330 ml)" but saves/logs as **100g**, producing incorrect nutrition totals.

### Root Cause
Backend barcode.js (line 10-45) `mapProduct()` function:
```javascript
function mapProduct(product, barcode) {
  const nutriments = product.nutriments || {};
  const quantity = product.serving_quantity || 100;  // <-- Defaults to 100
  const unit = String(product.serving_quantity_unit || product.product_quantity_unit || 'g').toLowerCase();
  const baseUnit = unit.includes('ml') ? 'ml' : 'g';

  return {
    barcode,
    name: product.product_name || product.generic_name || `Barcode ${barcode}`,
    food: {
      name: product.product_name || `Barcode ${barcode}`,
      category: 'custom',
      base_unit: baseUnit,
      base_amount: 100,  // <-- HARDCODED to 100
      serving: product.serving_size || `100${baseUnit}`,
      cal: Math.round(n(nutriments, 'energy-kcal_100g') || n(nutriments, 'energy-kcal')),
      protein_g: Math.round(n(nutriments, 'proteins_100g') * 10) / 10,
      ...
    }
  };
}
```

**Problem**: `base_amount` is hardcoded to 100 instead of using `product.serving_quantity`.

### Example
- **Open Food Facts**: Coca-Cola 330ml can
- **Expected**: `base_amount: 330, base_unit: 'ml'`
- **Actual**: `base_amount: 100, base_unit: 'ml'`
- **Result**: Nutrition values are for 330ml but logged as 100ml → 3.3x error

### Fix
```javascript
function mapProduct(product, barcode) {
  const nutriments = product.nutriments || {};
  const quantity = product.serving_quantity || 100;
  const unit = String(product.serving_quantity_unit || product.product_quantity_unit || 'g').toLowerCase();
  const baseUnit = unit.includes('ml') ? 'ml' : 'g';
  
  // Use actual serving quantity or default to 100
  const baseAmount = quantity || 100;

  return {
    barcode,
    name: product.product_name || product.generic_name || `Barcode ${barcode}`,
    food: {
      name: product.product_name || `Barcode ${barcode}`,
      category: 'custom',
      base_unit: baseUnit,
      base_amount: baseAmount,  // <-- FIX: Use actual quantity
      serving: product.serving_size || `${baseAmount}${baseUnit}`,
      cal: Math.round(n(nutriments, 'energy-kcal_100g') || n(nutriments, 'energy-kcal')),
      ...
    }
  };
}
```

### Impact
- ⚠️ **High**: Incorrect calorie/macro totals
- ⚠️ **User Trust**: Breaks nutrition tracking accuracy
- ⚠️ **Data Quality**: Historical logs may be incorrect

---

## 2. Long Product Names 🔴 **BLOCKER**

### Issue
Barcode 737628064502 identified but saving failed: "Food name must be 100 characters or fewer"

### Root Cause
Backend validation in `routes/foods.js` (line 232):
```javascript
if (String(name).trim().length > 100) 
  return res.status(400).json({ error: 'Food name must be 100 characters or fewer' });
```

Open Food Facts often returns very long product names like:
```
"Coca-Cola Zero Sugar Cherry Vanilla Flavored Carbonated Soft Drink 12 Fl Oz Cans (Pack of 12)"
```

### Fix Option 1: Truncate with Ellipsis
```javascript
// Truncate name to 100 chars
let name = String(req.body.name || '').trim();
if (name.length > 100) {
  name = name.substring(0, 97) + '...';
  console.log(`[foods] Truncated long name: ${req.body.name} -> ${name}`);
}
```

### Fix Option 2: Increase Limit
```javascript
// Increase limit to 200 characters
if (String(name).trim().length > 200) 
  return res.status(400).json({ error: 'Food name must be 200 characters or fewer' });
```

### Fix Option 3: Store Full Name in Notes
```javascript
let name = String(req.body.name || '').trim();
let notes = String(req.body.notes || '');

if (name.length > 100) {
  // Store full name in notes if not already there
  if (!notes.includes('Full name:')) {
    notes = `Full name: ${name}\n${notes}`.trim();
  }
  // Truncate display name
  name = name.substring(0, 97) + '...';
}
```

### Recommended: **Option 3** (Preserve data + UX)

---

## 3. Duplicate Barcode UI 🟡 **MEDIUM**

### Issue
"Saved to library!" and "Already in your library" messages appear together.

### Root Cause
Frontend not clearing success message before showing duplicate error, or backend returning both success and duplicate flags.

### Investigation Needed
1. Check frontend PackagedFood.jsx save flow
2. Check backend foods.js POST /foods duplicate handling
3. Verify message state management

### Fix (Likely)
```javascript
// Frontend: Clear previous messages
async function saveFromBarcode() {
  if (!product?.food) return
  setMsg('')  // Clear previous success
  setError('')  // Clear previous errors
  await onSaveToLibrary(product.food)
}

// Backend: Ensure only one message returned
// Check if food already exists BEFORE saving
const existing = db.prepare('SELECT id FROM foods WHERE user_id = ? AND name = ?').get(req.userId, name);
if (existing) {
  return res.status(409).json({ 
    error: 'Already in your library',
    food_id: existing.id 
  });
}
```

---

## 4. Plate Scan Food Matching 🟡 **MEDIUM**

### Issue
Plate scan parsed 10 foods in 4.2s, but only 4/10 matched the food library.

### Analysis
**Success Rate**: 40% (4/10 matched)  
**Expected**: 70-80% for common foods

### Root Cause
Food alias matching may not cover enough variations, or detected names don't match library entries.

### Example Mismatches (Hypothetical)
```javascript
// AI detected: "cooked rice" 
// Library has: "rice"
// Status: ✅ Should match (alias exists)

// AI detected: "grilled chicken breast"
// Library has: "chicken"  
// Status: ❌ Might not match (no alias for "grilled chicken breast")

// AI detected: "dal makhani"
// Library has: "dal"
// Status: ❌ Might not match (no alias for "dal makhani")
```

### Fix: Expand Aliases
```javascript
const FOOD_ALIASES = {
  'rice': ['cooked rice', 'brown rice', 'white rice', 'basmati', 'jeera rice', 'steamed rice', 'boiled rice'],
  'roti': ['chapati', 'phulka', 'wheat roti', 'whole wheat roti', 'indian bread'],
  'dal': ['lentils', 'daal', 'yellow dal', 'masoor dal', 'dal makhani', 'dal tadka', 'dal fry'],
  'yogurt': ['curd', 'dahi', 'greek yogurt', 'plain yogurt'],
  'paneer': ['cottage cheese', 'paneer cubes', 'paneer tikka', 'grilled paneer'],
  'broccoli': ['broccoli florets', 'steamed broccoli', 'roasted broccoli'],
  'quinoa': ['cooked quinoa', 'boiled quinoa'],
  'chicken': ['chicken breast', 'grilled chicken', 'chicken curry', 'roasted chicken', 'chicken tikka', 'tandoori chicken'],
  'egg': ['eggs', 'boiled egg', 'scrambled eggs', 'omelette', 'fried egg'],
  'potato': ['potatoes', 'boiled potato', 'mashed potato', 'roasted potato'],
  'spinach': ['palak', 'spinach leaves', 'cooked spinach'],
  'tomato': ['tomatoes', 'cherry tomatoes', 'sliced tomato'],
  'cucumber': ['sliced cucumber', 'cucumber slices'],
  'carrot': ['carrots', 'sliced carrot', 'boiled carrot'],
}
```

### Fix: Fuzzy Matching Improvement
```javascript
function matchFoodByName(detectedName, foodLibrary) {
  const detected = detectedName.toLowerCase().trim();
  
  // 1. Exact match
  let match = foodLibrary.find(f => f.name.toLowerCase() === detected);
  if (match) return match;

  // 2. Starts with match (e.g., "grilled chicken" matches "chicken")
  match = foodLibrary.find(f => 
    detected.startsWith(f.name.toLowerCase()) ||
    f.name.toLowerCase().startsWith(detected)
  );
  if (match) return match;

  // 3. Contains match
  match = foodLibrary.find(f => 
    detected.includes(f.name.toLowerCase()) ||
    f.name.toLowerCase().includes(detected)
  );
  if (match) return match;

  // 4. Alias match
  for (const [canonical, aliases] of Object.entries(FOOD_ALIASES)) {
    if (aliases.some(alias => alias.toLowerCase() === detected)) {
      match = foodLibrary.find(f => f.name.toLowerCase().includes(canonical));
      if (match) return match;
    }
    // Check if detected name contains any alias
    if (aliases.some(alias => detected.includes(alias.toLowerCase()))) {
      match = foodLibrary.find(f => f.name.toLowerCase().includes(canonical));
      if (match) return match;
    }
  }

  // 5. Word-by-word match (e.g., "dal makhani" matches "dal")
  const detectedWords = detected.split(/\s+/);
  for (const word of detectedWords) {
    if (word.length < 3) continue;  // Skip short words like "of", "in"
    match = foodLibrary.find(f => f.name.toLowerCase().includes(word));
    if (match) return match;
  }

  return null;
}
```

---

## 5. Security Headers 🟡 **MEDIUM**

### Issue
Frontend lacks CSP (Content Security Policy) and clickjacking protection.

### Missing Headers
```
Content-Security-Policy
X-Frame-Options
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

### Current Implementation
Backend has helmet.js with basic settings (from backend/server.js).

### Fix: Add Security Headers
**File**: `backend/server.js`

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // React needs unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],  // Allow base64 and external images
      connectSrc: ["'self'", "https://vitanudge-api.onrender.com"],
      frameSrc: ["'none'"],  // Prevent embedding
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  frameguard: { action: 'deny' },  // Prevent clickjacking
  noSniff: true,  // X-Content-Type-Options: nosniff
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      camera: ["'self'"],  // Allow camera for food scanning
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"],
    },
  },
}));
```

### Note
CSP with React can be tricky due to inline scripts/styles. May need `'unsafe-inline'` or nonce-based CSP.

---

## Priority Summary

| Issue | Severity | Impact | Fix Complexity | Priority |
|-------|----------|--------|----------------|----------|
| **Barcode serving accuracy** | 🔴 Critical | Data corruption | Low (1 line) | **P0** |
| **Long product names** | 🔴 Blocker | Save failures | Low (5 lines) | **P0** |
| **Duplicate barcode UI** | 🟡 Medium | UX confusion | Low (2 lines) | **P1** |
| **Plate scan matching** | 🟡 Medium | User experience | Medium (expand aliases) | **P1** |
| **Security headers** | 🟡 Medium | Security posture | Medium (test CSP) | **P2** |

---

## Recommended Action Plan

### Phase 1: Immediate Fixes (P0)
1. **Fix barcode `base_amount`** - 1 line change in barcode.js
2. **Fix long product names** - Truncate with full name in notes
3. **Test barcode flow** - Verify Coca-Cola saves correctly

### Phase 2: UX Polish (P1)
4. **Fix duplicate message** - Clear state before save
5. **Expand food aliases** - Add 20+ common food variations
6. **Test plate scan matching** - Verify 70%+ match rate

### Phase 3: Security (P2)
7. **Add security headers** - Configure helmet.js properly
8. **Test CSP** - Ensure React app works with strict CSP

---

## Testing Checklist

### Barcode Accuracy
- [ ] Scan Coca-Cola barcode (330ml can)
- [ ] Verify `base_amount: 330, base_unit: 'ml'`
- [ ] Log 1 can to meal → Verify calories match label
- [ ] Test other serving sizes (bottles, packages)

### Long Names
- [ ] Scan barcode 737628064502
- [ ] Verify name truncates to 100 chars
- [ ] Verify full name stored in notes
- [ ] Verify save succeeds

### Duplicate Detection
- [ ] Scan same barcode twice
- [ ] Verify only "Already in library" shows (no "Saved" message)
- [ ] Verify no duplicate entries in library

### Plate Scan Matching
- [ ] Scan plate with 10 foods
- [ ] Verify 7+ foods match library (70% target)
- [ ] Check unmatched foods for common variations
- [ ] Add missing aliases

### Security Headers
- [ ] Deploy with new headers
- [ ] Test app functionality (no CSP blocks)
- [ ] Verify headers in browser DevTools
- [ ] Test frame embedding (should be blocked)

---

## Files to Modify

1. `backend/routes/barcode.js` (line 28: `base_amount`)
2. `backend/routes/foods.js` (line 230-235: name validation)
3. `backend/routes/scan.js` (line 478-528: expand aliases)
4. `backend/server.js` (helmet configuration)
5. `frontend/src/components/PackagedFood.jsx` (duplicate message handling)

---

## Estimated Time
- **Phase 1**: 30 minutes (code) + 30 minutes (testing) = 1 hour
- **Phase 2**: 1 hour (aliases + testing)
- **Phase 3**: 1 hour (CSP configuration + testing)
- **Total**: ~3 hours

---

## Risk Assessment

**Barcode Fix**: ⚠️ **High Risk** if existing foods already saved with wrong `base_amount`
- **Mitigation**: Add migration script to fix existing barcode foods
- **Alternative**: Only fix new scans (document as known issue for old data)

**Long Name Fix**: ✅ **Low Risk** - Backward compatible (truncation doesn't break existing data)

**Security Headers**: ⚠️ **Medium Risk** - CSP may break React if too strict
- **Mitigation**: Start permissive, gradually tighten
- **Testing**: Test all pages (scan, coach, recipes) for CSP violations
