# 📋 Manual Test Checklist - VitaNudge Production

**Test on:** https://vitanudge.onrender.com  
**Before final deployment**

---

## ✅ **Current Automated Test Results**

- ✅ **7/8 tests passing** (88%)
- ⚠️ Bug #3 will pass after redeploy (improved date validation committed)
- ✅ All other fixes verified working

---

## 🧪 **Manual Testing Required**

### **1. Registration & Authentication** (5 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Register new user | Click "Create account" → Fill form → Submit | Account created, redirected to Goals | [ ] |
| Invalid email | Enter "badmail" → Submit | Error: "Valid email required" | [ ] |
| Weak password | Enter "123" → Submit | Error: Password validation | [ ] |
| Login | Enter credentials → Submit | Logged in, dashboard shown | [ ] |
| Logout | Click profile → Logout | Redirected to login | [ ] |

---

### **2. Goals Page** (5 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Set valid goal | Goal type: Fat loss → Target: 70kg → Date: 2026-08-01 → Save | Goal saved, timeline shown | [ ] |
| Invalid date (Feb 31) | Change target_date to "2026-02-31" | ❌ Error: "not a valid calendar date" | [ ] |
| Invalid date (June 31) | Change target_date to "2026-06-31" | ❌ Error: "not a valid calendar date" | [ ] |
| Timeline matches preview | Check "weeks remaining" before/after save | Numbers match (e.g., both say "8 weeks") | [ ] |
| Progress percentage | Check Dashboard % vs Goals page % | Both show same % (e.g., both 0% or both 23%) | [ ] |

---

### **3. Food Logging** (10 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Add from library | Today → Add Food → Search "Chicken" → Select → Log | Meal appears in list | [ ] |
| Add manual meal | Add Food → Manual → "Rice" 100g, 200cal → Save | Manual meal logged | [ ] |
| Edit manual meal qty | Click edit on manual meal → Change 100g to 200g → Save | Calories double (200→400), protein doubles | [ ] |
| Try negative qty | Edit meal → Enter -50g → Save | ❌ Error: "qty must be greater than 0" | [ ] |
| Delete meal | Click delete on any meal → Confirm | Meal removed from list | [ ] |
| Copy yesterday | If yesterday has meals → Click "Copy yesterday" | Meals appear for selection | [ ] |

---

### **4. Tier Enforcement** (5 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Free user → Coach | Navigate to Coach → Try to ask question | ❌ Upgrade modal shown: "AI Coach is a Pro feature" | [ ] |
| Free user → Recipes | Navigate to Recipes → Try to save recipe | ❌ Upgrade modal shown: "Recipe Builder is a Pro feature" | [ ] |
| Upgrade modal pricing | Check prices in modal | Pro: $4.99/mo, Clinical: $9.99/mo | [ ] |
| Click "Upgrade to Pro" | Click button in modal | 💳 "Payment processing coming soon! Email support@..." | [ ] |
| Terms page pricing | Navigate to More → Terms | Same pricing: Pro $4.99, Clinical $9.99 | [ ] |

---

### **5. Plate Scan** (AI feature - 5 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Upload clear photo | Scan → Upload food photo → Analyze | Items identified OR clear error shown | [ ] |
| Scan failure | If scan fails | Error shows "Try Again" + "Choose Different Photo" buttons | [ ] |
| Try Again button | Click "Try Again" | Retries same image | [ ] |
| Choose Different | Click "Choose Different Photo" | Can pick new image | [ ] |
| Manual entry fallback | Close scan → Add Food manually | Manual entry works | [ ] |

---

### **6. Dashboard & UI** (5 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Sticky summary visible | Scroll down Today page | Summary stays at top, doesn't overlap meal cards | [ ] |
| Macro cards readable | Check calories/protein/fiber/carbs cards | All percentages visible, no overlap | [ ] |
| Quick recommendations | Look for "Next Action" panel (desktop) | Shows suggestions like "Log breakfast" | [ ] |
| Date navigation | Click ← → arrows to change date | Changes to previous/next day | [ ] |
| Empty state | Navigate to future date with no meals | Shows helpful empty state message | [ ] |

---

### **7. Mobile Testing** (if possible - 5 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Add Food modal tabs | Open Add Food → Check tabs | "Add manually", "Scan label", "AI estimate" all readable | [ ] |
| Sticky summary | Scroll on mobile | Summary stays sticky, doesn't cover content | [ ] |
| Forms usable | Try to log meal on mobile | All inputs tappable, keyboard works | [ ] |
| Navigation | Use bottom nav or menu | All pages accessible | [ ] |

---

### **8. PWA Installation** (optional - 2 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Install prompt | Visit site → Check for install option | Browser shows "Add to Home Screen" or install icon | [ ] |
| Install app | Click install → Open installed app | Opens as standalone app, no browser UI | [ ] |
| Icons load | Check installed app icon | Icon shows (not broken/default) | [ ] |

---

### **9. Edge Cases** (5 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Negative calories | Try to log manual meal with -100 calories | Rejected (already validated in backend) | [ ] |
| Future date meals | Log meal for tomorrow | Works, appears on correct date | [ ] |
| Past date meals | Log meal for yesterday | Works, appears on correct date | [ ] |
| Very long food name | Enter 200+ character food name | Either accepted or clear length limit | [ ] |
| Special characters | Food name: "Rice & Beans (500g)" | Saved correctly with special chars | [ ] |

---

### **10. Backend Health** (2 min)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| API responding | Visit https://vitanudge-api.onrender.com | Shows error (normal - no health endpoint) | [ ] |
| Registration works | Try to register new unique email | 201 status, returns token | [ ] |
| Auth required | Try API call without token | 401 Unauthorized | [ ] |

---

## 📊 **Testing Summary**

**Total Tests:** ~50 manual checks  
**Estimated Time:** 40-50 minutes  
**Priority:** High impact tests in sections 1-6  

---

## ✅ **Pass Criteria**

To approve for production:
- ✅ All critical tests pass (sections 1-4)
- ✅ No major UI bugs found
- ✅ Tier enforcement working correctly
- ⚠️ Minor issues acceptable if workarounds exist

---

## 🐛 **If You Find Bugs**

**Document:**
1. What you did (steps to reproduce)
2. What you expected
3. What actually happened
4. Screenshot/video if possible

**Then:**
- Tell me the bug details
- I'll fix it immediately
- We'll retest

---

## 🚀 **After All Tests Pass**

1. ✅ Mark all checkboxes complete
2. 🎉 Approve for production deployment
3. 📝 Final deploy with improved date validation
4. 🌐 Public launch!

---

**Ready to start testing?** Open https://vitanudge.onrender.com and work through the checklist!
