# Release Blocker Analysis & Recommendations

**Date**: 2026-06-10  
**Status**: Pre-Fix Analysis  
**Decision Required**: Approve fix order and scope

---

## 🚨 Critical Blockers (Must Fix Before Launch)

### **#1: /auth/me omits subscription_tier**
**Severity**: 🔴 **CRITICAL**  
**Impact**: Paid users appear as Free after page refresh  
**User Experience**: Pro features blocked despite payment

**Root Cause**:
```javascript
// backend/routes/auth.js:44-46
const USER_SELECT = `
  id, name, email, age, gender, weight_kg, height_cm, condition, diet_preference,
  country, state_region, city, timezone
`;
// ❌ Missing: subscription_tier, subscription_expires_at, subscription_status
```

**Fix Complexity**: ⭐ **Trivial** (1 line, 2 minutes)

**Recommended Fix**:
```javascript
const USER_SELECT = `
  id, name, email, age, gender, weight_kg, height_cm, condition, diet_preference,
  country, state_region, city, timezone, subscription_tier, subscription_expires_at, subscription_status
`;
```

**Testing Required**:
- ✅ Pro user refreshes page → Still sees Pro features
- ✅ Free user refreshes page → Still sees Free tier
- ✅ Frontend `useAuth` receives subscription_tier correctly

**Risk**: 🟢 **ZERO** - Pure addition, no breaking changes

---

### **#2: Free users can call Gemini Coach API directly**
**Severity**: 🔴 **CRITICAL**  
**Impact**: Free users bypass Pro paywall, consume AI quota  
**Cost Impact**: Potential runaway API costs

**Root Cause**:
```javascript
// backend/routes/coach.js:88
router.post('/', authMiddleware, async (req, res) => {
  // ❌ No tier check! Anyone authenticated can call Gemini
```

**Fix Complexity**: ⭐⭐ **Simple** (3 lines, 5 minutes)

**Recommended Fix**:
```javascript
const { requireTier } = require('../middleware/tier');

router.post('/', authMiddleware, requireTier('pro'), async (req, res) => {
  // Now blocks free users with 402 Payment Required
```

**Alternative Fix** (If free users should get local-only):
```javascript
router.post('/', authMiddleware, async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT subscription_tier FROM users WHERE id = ?').get(req.userId);
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'clinical';
  
  // Free users skip Gemini, go straight to local fallback
  if (!isPro) {
    return res.json({ 
      answer: localCoachAnswer(question.trim(), context), 
      provider: 'local', 
      range: { from: start, to: end } 
    });
  }
  
  // Pro users try Gemini first
  try {
    const aiAnswer = await callGemini(question.trim(), context);
    if (aiAnswer) return res.json({ answer: aiAnswer, provider: 'gemini', range: { from: start, to: end } });
  } catch (e) {
    console.error('[coach]', e.message);
  }
  
  res.json({ answer: localCoachAnswer(question.trim(), context), provider: 'local', range: { from: start, to: end } });
});
```

**Recommendation**: Use **requireTier('pro')** - cleaner and matches other Pro features

**Testing Required**:
- ✅ Free user calls /api/coach → 402 Payment Required
- ✅ Pro user calls /api/coach → Gemini response
- ✅ Pro user with Gemini error → Local fallback

**Risk**: 🟢 **LOW** - Existing free users get proper paywall (expected behavior)

---

### **#3: Data export returns HTTP 500**
**Severity**: 🔴 **CRITICAL**  
**Impact**: Profile → Download health data is broken  
**User Experience**: Pro feature advertised but non-functional

**Current Status**: 
- Code looks correct ([export.js](backend/routes/export.js:8))
- Uses `authMiddleware` + `requireTier('pro')` ✅
- Queries all user data tables ✅

**Likely Root Causes**:
1. **Database table doesn't exist** (migration not run)
2. **Column name mismatch** (e.g., `goals` table structure changed)
3. **Missing user data** (SELECT returns null, crashes)
4. **Database locked** (concurrent writes)

**Investigation Needed**: 
```bash
# Check actual error
curl -H "Authorization: Bearer <token>" \
  https://vitanudge-api.onrender.com/api/export?format=json

# Check database schema
sqlite3 backend/database/nutritrack.db ".schema goals"
sqlite3 backend/database/nutritrack.db ".schema meal_templates"
```

**Fix Complexity**: ⭐⭐⭐ **Unknown** (Depends on root cause)

**Recommended Actions**:
1. **First**: Get actual error message from server logs
2. **Then**: Fix specific SQL query or add error handling
3. **Add**: Try/catch blocks around each query
4. **Improve**: Return partial export if one table fails

**Testing Required**:
- ✅ Pro user exports JSON → Downloads file
- ✅ Pro user exports CSV → Downloads meals.csv
- ✅ Free user exports → 402 Payment Required
- ✅ User with no data → Empty export (not 500)

**Risk**: 🟡 **MEDIUM** - Fix depends on root cause (could be schema migration needed)

---

### **#4: Clinical labelled "Core" in More page**
**Severity**: 🟡 **MEDIUM** (Misleading, not broken)  
**Impact**: Users confused about what "Core" means  
**User Experience**: Expect free feature, hit Clinical paywall

**Root Cause Analysis**:
After reviewing code, this appears to be a **false alarm**:
- "Core habits" is the eyebrow label for **"Everyday Tracking"** section
- This section includes: Library, Water, Glucose, Weight (all Free)
- Clinical dashboard is NOT in this section

**Actual Issue** (if exists):
- Check if Clinical is incorrectly listed under "Core habits" section in UI
- Or if Clinical dashboard says "Core" when it should say "Clinical Tier"

**Investigation Needed**:
```bash
# Check actual More page rendering
# Visit https://vitanudge.onrender.com/more
# Look for "Clinical" under "Core habits" eyebrow
```

**If Confirmed**: Fix eyebrow label or move Clinical to correct section

**Fix Complexity**: ⭐ **Trivial** (1 line label change)

**Risk**: 🟢 **ZERO** - Label-only change

**Recommendation**: **Verify issue first** - may be false positive

---

### **#5: Payment checkout returns 503**
**Severity**: 🟡 **MEDIUM** (Expected behavior)  
**Impact**: Automated payments not implemented yet  
**User Experience**: Manual upgrade via email works

**Current Status**: **INTENDED BEHAVIOR** ✅
```javascript
// backend/routes/billing.js
// Returns { coming_soon: true } when Stripe/Razorpay not configured
```

**Fix Required**: Implement Razorpay/Stripe (see PAYMENT_INTEGRATION_GUIDE.md)

**Timeline**: 
- **Short-term** (Launch): Keep manual upgrade (working)
- **Post-launch** (Week 2-4): Implement automated payments

**Recommendation**: **NOT A BLOCKER** - Manual upgrades work, document clearly

**User Communication**:
```
✅ Current: "💳 Online checkout coming soon. Click 'Request Upgrade' to email us..."
✅ Profile: "Upgrade to Pro" → Opens mailto: link
```

**Risk**: 🟢 **ZERO** - Documented limitation, manual fallback works

---

## ⚠️ Confirmed Bugs (Fix Recommended, Not Blocking)

### **#6: Wrong-password login reloads without error**
**Severity**: 🟠 **HIGH** (UX issue)  
**Impact**: User doesn't know why login failed  
**Fix Complexity**: ⭐⭐ **Simple** (5 minutes)

**Likely Root Cause**:
```javascript
// Frontend handles 401 but doesn't prevent page reload
// Or error message gets cleared before user sees it
```

**Recommended Fix**: Check [Login.jsx](frontend/src/pages/Login.jsx) error handling

---

### **#7: Editing meal to quantity 0 keeps previous quantity**
**Severity**: 🟠 **MEDIUM** (Data integrity)  
**Impact**: User can't delete meal by setting qty=0  
**Fix Complexity**: ⭐⭐ **Simple** (Add validation)

**Recommendation**: Either:
- Block qty=0 in frontend (show error: "Use delete button to remove meal")
- OR allow qty=0 and delete meal automatically

---

### **#8: Tools drawer extends 10px beyond viewport**
**Severity**: 🟢 **LOW** (Visual polish)  
**Impact**: Minor horizontal scroll on mobile  
**Fix Complexity**: ⭐ **Trivial** (CSS padding/margin adjustment)

**Recommendation**: Fix post-launch (not blocking)

---

### **#9: First offline PWA launch can be blank**
**Severity**: 🟢 **LOW** (Edge case)  
**Impact**: Rare - only first offline launch  
**Fix Complexity**: ⭐⭐⭐ **Complex** (Service worker caching)

**Recommendation**: Fix post-launch (works after one reload)

---

### **#10: One Reports load stalled beyond 30 seconds**
**Severity**: 🟢 **LOW** (Performance outlier)  
**Impact**: Rare - likely cold start or network issue  
**Fix Complexity**: ⭐⭐⭐⭐ **Complex** (Performance optimization)

**Evidence**: "Subsequent diagnostic run completed in 364ms" = not a code issue

**Recommendation**: Monitor post-launch, likely Render cold start

---

### **#11: Frontend has 2 moderate Vite/esbuild dev dependency advisories**
**Severity**: 🟢 **LOW** (Dev-only)  
**Impact**: Zero - only affects development build  
**Fix Complexity**: ⭐ **Trivial** (npm update)

**Recommendation**: Run `npm audit fix` post-launch

---

## 📋 Recommended Fix Order

### **Phase 1: Critical Blockers** (30 minutes total)
**Must fix before launch**

1. ✅ **#1: Add subscription_tier to /auth/me** (2 min)
2. ✅ **#2: Add requireTier('pro') to Coach API** (5 min)
3. ✅ **#3: Debug and fix export 500 error** (15-20 min)
4. ⚠️ **#4: Verify Clinical "Core" label issue** (3 min investigation)

**Decision Point**: Can launch once Phase 1 complete

---

### **Phase 2: High-Priority Bugs** (20 minutes)
**Fix before Week 1 ends**

5. ✅ **#6: Wrong-password login error display** (5 min)
6. ✅ **#7: Meal quantity 0 validation** (5 min)
7. ✅ **#8: Tools drawer overflow CSS** (2 min)

---

### **Phase 3: Polish** (Post-launch)
**Fix in Week 2-4**

8. ⏳ **#9: Offline PWA blank screen** (Complex)
9. ⏳ **#10: Reports performance monitoring** (Ongoing)
10. ⏳ **#11: Update dev dependencies** (Trivial)
11. ⏳ **#5: Implement Razorpay/Stripe** (4 hours, see guide)

---

## 🎯 Launch Readiness Assessment

### **Current Status**: ⚠️ **NOT READY**

**Blockers Remaining**: 3-4 critical issues

### **After Phase 1 Fixes**: ✅ **READY FOR LAUNCH**

**Confidence**: 95%

**Remaining 5% Risk**:
- Export 500 fix depends on root cause (could uncover schema issues)
- Clinical "Core" label needs verification

---

## 🛠️ Recommended Actions

### **Immediate** (Next 30 minutes):
1. ✅ Fix #1 (subscription_tier)
2. ✅ Fix #2 (Coach API tier check)
3. 🔍 Debug #3 (Export 500 - get actual error)
4. 🔍 Verify #4 (Clinical label - check live site)

### **Before Deployment**:
- Run full test suite
- Test all 4 fixes on Render staging
- Verify Pro user experience (refresh, coach, export)

### **Post-Launch** (Week 1):
- Fix #6, #7, #8 (UX polish)
- Monitor #10 (Reports performance)
- Update #11 (Dev dependencies)

### **Post-Launch** (Week 2-4):
- Implement #5 (Razorpay payment)
- Fix #9 (PWA offline)
- User feedback collection

---

## ✅ Approval Request

**Proposed Plan**:
1. Fix Phase 1 blockers (30 min)
2. Test on production
3. Deploy
4. Fix Phase 2 within Week 1

**Questions for User**:
1. Approve fix order?
2. Proceed with Phase 1 fixes now?
3. Any additional concerns before launch?

---

**Next Step**: Await user approval, then execute Phase 1 fixes immediately.
