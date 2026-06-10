# Final Pre-Launch E2E Test Plan

**Date**: 2026-06-09  
**Target**: Production (Render deployment)  
**Goal**: Final validation before live launch  
**Scope**: Webapp + Mobile, All scenarios (Positive/Negative/Boundary/Edge)

---

## Test Strategy

### Coverage Matrix

| Module | Positive | Negative | Boundary | Edge | Mobile |
|--------|----------|----------|----------|------|--------|
| **Auth** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Profile/Goals** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Food Logging** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Barcode Scan** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Plate Scan** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Label Scan** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Body Tracking** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Water Logging** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Reports** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Tier Enforcement** | ✓ | ✓ | - | ✓ | ✓ |
| **Recent Fixes** | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Phase 1: Critical Path Tests (API)

### 1.1 Authentication Flow
- [ ] Register new user (valid data)
- [ ] Register duplicate email (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Token persistence (24h expiry check)

### 1.2 Profile & Goals
- [ ] Create profile (all required fields)
- [ ] Update profile (partial update)
- [ ] Set goals (2100/135/110 - verify dashboard sync)
- [ ] Invalid goals (negative values - should reject)
- [ ] Boundary: age 0, 150 (should validate)

### 1.3 Food Logging
- [ ] Log meal with library food
- [ ] Log meal with manual nutrition
- [ ] Invalid date 2026-02-31 (should reject)
- [ ] Future date logging (should allow)
- [ ] Delete meal entry

### 1.4 Barcode Scanning
- [ ] Coca-Cola 330ml (should show ~139 kcal, not 42)
- [ ] Long product name >100 chars (should truncate)
- [ ] Invalid barcode (should fail gracefully)
- [ ] Duplicate barcode save (should prevent)

### 1.5 Plate Scanning
- [ ] Scan plate with 10 foods (should return compact JSON)
- [ ] Verify egg white 100g = 51.5 kcal (not 1700)
- [ ] Verify quantity displays 3.03 pieces (not 3.0303...)
- [ ] Unmatched foods (should have AI estimates, not zero)
- [ ] Parse failure retry (should attempt compact prompt)

### 1.6 Label Scanning
- [ ] Actual nutrition label (should parse correctly)
- [ ] Meal photo (should reject as "not a nutrition label")
- [ ] Blurry label (should return low confidence or fail)

### 1.7 Water Logging
- [ ] Log 250ml water
- [ ] Verify timestamp uses user timezone (not UTC)
- [ ] Invalid date (should reject)

### 1.8 Body Tracking
- [ ] Log weight
- [ ] Log multiple vitals (BP, glucose, HbA1c - Pro only)
- [ ] Invalid values (negative weight - should reject)

### 1.9 Reports & Export
- [ ] Generate 30-day report
- [ ] Invalid date range (from > to - should reject)
- [ ] Export JSON (Pro tier required)
- [ ] Export CSV (Pro tier required)

### 1.10 Tier Enforcement
- [ ] Free user: 5 label scans (6th should block)
- [ ] Free user: 10 barcodes (11th should block)
- [ ] Free user: AI Coach (should block)
- [ ] Free user: Recipes (should block)
- [ ] Upgrade modal (manual mailto flow)

---

## Phase 2: Recent Fixes Verification

### 2.1 Barcode Nutrition Scaling ✅
**Test**: Coca-Cola 330ml barcode
- Expected: ~139 kcal, 35g carbs
- Verify: Nutrition scaled from per-100ml to 330ml

### 2.2 Plate Scan Unit Conversion ✅
**Test**: Scan plate with egg white 100g
- Expected: 51.5 kcal, 10.9g protein
- Verify: Correctly converts grams to pieces using serving info

### 2.3 Plate Scan Decimal Precision ✅
**Test**: Egg white quantity display
- Expected: 3.03 pieces
- Verify: No excessive decimals (3.0303030303)

### 2.4 Unmatched Foods AI Estimates ✅
**Test**: Scan plate with foods not in library
- Expected: AI-provided cal/protein/carbs/fiber
- Verify: Not all zeros

### 2.5 Label Scanner Validation ✅
**Test**: Upload meal photo to label scanner
- Expected: {"error": "not a nutrition label"}
- Verify: Rejects non-label images

### 2.6 Serving Text Consistency ✅
**Test**: Barcode with ml serving
- Expected: base_unit='ml', serving='330ml' (consistent)
- Verify: No mismatch (e.g., base_unit='g', serving='330ml')

### 2.7 Long Product Names ✅
**Test**: Barcode with 150-char name
- Expected: Truncated to 97 chars + "..."
- Verify: Full name stored in notes field

### 2.8 Food Alias Matching ✅
**Test**: Scan "hard-boiled egg"
- Expected: Matches "Whole egg" in library
- Verify: Expanded aliases work

---

## Phase 3: Mobile UI Tests (Visual/Manual)

### 3.1 Mobile Login ✅
**Test**: 360px viewport
- [ ] No empty space above form
- [ ] Form immediately visible
- [ ] Brand logo present
- [ ] "Request Upgrade" button works (mailto)

### 3.2 Mobile Helper Text ✅
**Test**: 360px viewport, Add Food flow
- [ ] Helper text fully visible (no truncation)
- [ ] Text wraps instead of showing "..."

### 3.3 Mobile Navigation
- [ ] Bottom nav accessible
- [ ] All pages load correctly
- [ ] Modals display properly

### 3.4 Mobile Scanning
- [ ] Camera access works
- [ ] File upload works
- [ ] Results display correctly

---

## Phase 4: Edge Cases & Error Handling

### 4.1 Network Errors
- [ ] API timeout (graceful error message)
- [ ] 500 server error (user-friendly message)
- [ ] Offline mode (appropriate feedback)

### 4.2 Data Validation
- [ ] XSS attempt in food name (should sanitize)
- [ ] SQL injection in search (should escape)
- [ ] Extremely large numbers (999999 kcal - should handle)
- [ ] Special characters in names (émoji, 中文)

### 4.3 Concurrent Actions
- [ ] Log meal while scan in progress
- [ ] Multiple browser tabs (state sync)
- [ ] Rapid clicking (debouncing works)

### 4.4 Session Management
- [ ] Token expiry (redirect to login)
- [ ] Logout (clears state)
- [ ] Remember me (persistence)

---

## Phase 5: Performance & Security

### 5.1 Performance
- [ ] Page load time <3s (desktop)
- [ ] Page load time <5s (mobile 3G)
- [ ] Image optimization (scan uploads)
- [ ] Bundle size (verify lazy loading)

### 5.2 Security Headers
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy present
- [ ] HSTS enabled
- [ ] CSP configured

### 5.3 Data Privacy
- [ ] Passwords hashed (not visible in DB)
- [ ] Email verification required
- [ ] No sensitive data in URLs
- [ ] HTTPS enforced

---

## Phase 6: Cross-Browser Testing

### 6.1 Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 6.2 Mobile
- [ ] iOS Safari (latest)
- [ ] Android Chrome (latest)
- [ ] Firefox Mobile
- [ ] Samsung Internet

---

## Critical Blockers Checklist

Must be ✅ before launch:

- [ ] All recent fixes deployed and verified
- [ ] No 500 errors on critical paths
- [ ] Authentication works (login/register)
- [ ] Food logging works (manual + scan)
- [ ] Tier enforcement blocks Pro features
- [ ] Mobile UI polish fixes active
- [ ] Security headers present
- [ ] No data corruption issues
- [ ] Payment fallback working (mailto)
- [ ] Database backups enabled

---

## Success Criteria

**GO Decision**: ≥95% of tests pass, 0 critical blockers  
**NO-GO Decision**: <95% pass rate OR any critical blocker

**Critical Blockers**:
- Authentication broken
- Food logging fails
- Data corruption
- Security vulnerability
- Production 500 errors

**Non-Blocking Issues** (can fix post-launch):
- Minor UI polish
- Non-critical feature bugs
- Performance optimizations
- Enhancement requests

---

## Test Execution Log

**Started**: [TIMESTAMP]  
**Completed**: [TIMESTAMP]  
**Duration**: [MINUTES]  
**Pass Rate**: [%]  
**Blockers Found**: [COUNT]  
**Decision**: [GO / NO-GO]

---

## Notes

- All API tests run against: https://vitanudge-api.onrender.com
- Frontend tests run against: https://vitanudge.onrender.com
- Test account: [CREATED DURING TESTING]
- Browser automation: Chrome DevTools Protocol
- Mobile testing: Responsive mode + real device

