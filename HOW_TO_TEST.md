# How to Fill the Test Document

## 📝 Step-by-Step Guide

### 1. Open the File in VS Code
```
File → Open → Navigate to:
/Users/uditgupta/Documents/Nutrient project/nutritrack/TEST_DOCUMENT.md
```

---

### 2. How to Mark a Test as PASSED

**Find this:**
```markdown
**Status:** ⬜ Pass / ⬜ Fail
```

**Change it to this:**
```markdown
**Status:** ✅ PASS
```

**Just type:**
1. Delete `⬜ Pass / ⬜ Fail`
2. Type `✅ PASS`

---

### 3. How to Mark a Test as FAILED

**Find this:**
```markdown
**Status:** ⬜ Pass / ⬜ Fail
```

**Change it to this:**
```markdown
**Status:** ❌ FAIL
```

---

### 4. How to Add Actual Results

**Find this:**
```markdown
**Actual Result (Web):**  
**Actual Result (Mobile):**  
```

**Change it to this:**
```markdown
**Actual Result (Web):** User logged in successfully. Redirected to Today page. All macros showing correctly.  
**Actual Result (Mobile):** Not tested yet  
```

---

## ✅ **Example: Completed Test Case**

### BEFORE (Empty):
```markdown
### TC-AUTH-004: User Login (Positive)
**Description:** Registered user can log in  
**Steps:**
1. Navigate to `/login`
2. Enter email: `test@example.com`
3. Enter password: `Test123!@#`
4. Click Login

**Expected Result:** User logged in, redirected to Today page  
**Actual Result (Web):**  
**Actual Result (Mobile):**  
**Status:** ⬜ Pass / ⬜ Fail
```

### AFTER (Completed - PASS):
```markdown
### TC-AUTH-004: User Login (Positive)
**Description:** Registered user can log in  
**Steps:**
1. Navigate to `/login`
2. Enter email: `test@example.com`
3. Enter password: `Test123!@#`
4. Click Login

**Expected Result:** User logged in, redirected to Today page  
**Actual Result (Web):** ✅ Login successful. Redirected to Today page (/). User name shows in header.  
**Actual Result (Mobile):** Not tested yet  
**Status:** ✅ PASS
```

### AFTER (Completed - FAIL):
```markdown
### TC-AUTH-004: User Login (Positive)
**Description:** Registered user can log in  
**Steps:**
1. Navigate to `/login`
2. Enter email: `test@example.com`
3. Enter password: `Test123!@#`
4. Click Login

**Expected Result:** User logged in, redirected to Today page  
**Actual Result (Web):** ❌ Login button does nothing. No error message shown. Stays on login page.  
**Actual Result (Mobile):** Not tested yet  
**Status:** ❌ FAIL
```

---

## 📊 **How to Update the Summary Table**

At the top of TEST_DOCUMENT.md, find this table:

### BEFORE:
```markdown
| Goals | 0/12 | 0 | 0 | 0% |
```

### AFTER (if you tested 3 tests and all passed):
```markdown
| Goals | 3/12 | 3 | 0 | 100% |
```

### AFTER (if you tested 5 tests, 4 passed, 1 failed):
```markdown
| Goals | 5/12 | 4 | 1 | 80% |
```

**Format:**
- `5/12` = 5 tests completed out of 12 total
- `4` = number passed
- `1` = number failed
- `80%` = pass rate (4/5 = 80%)

---

## 🐛 **How to Log an Issue**

If a test FAILS, add it to the "Issues Found" table at the bottom:

### Find this table:
```markdown
## Issues Found

| Issue ID | Severity | Module | Description | Status |
|----------|----------|--------|-------------|--------|
| | | | | |
```

### Add your issue:
```markdown
## Issues Found

| Issue ID | Severity | Module | Description | Status |
|----------|----------|--------|-------------|--------|
| ISS-001 | 🔴 Critical | Login | Login button doesn't work | Open |
| ISS-002 | 🟡 Medium | Barcode | Product name shows as "Unknown" | Fixed |
```

**Severity levels:**
- 🔴 **Critical**: App won't work at all
- 🟠 **High**: Major feature broken
- 🟡 **Medium**: Minor issue
- 🟢 **Low**: Cosmetic only

---

## 💡 **Tips**

### Getting Emojis in VS Code:
**On Mac:**
- Press `Control + Command + Space` = emoji picker
- Search for "check" → ✅
- Search for "x" → ❌

**On Windows:**
- Press `Windows + .` (period) = emoji picker

### Can't Find Emojis?
Just use text:
```markdown
**Status:** [PASS]
**Status:** [FAIL]
```

### Already Tested Cases:
Look for tests I already filled:
- TC-ADD-001: Barcode Lookup ✅
- TC-GOAL-002: On Track ✅
- TC-GOAL-003: Ahead ✅
- TC-GOAL-004: Behind ✅
- TC-LOG-011: Camera Button ✅

Use these as examples!

---

## 🎯 **Testing Order (Recommended)**

1. **Start with easiest:** Authentication (login/logout)
2. **Then core features:** Food Logging (search, add, edit)
3. **Then new features:** Barcode, Label, Plate Scan
4. **Then advanced:** Goals, Reports, Coach

Don't need to test everything in order - jump around!

---

## ✅ **You're Ready!**

1. Open TEST_DOCUMENT.md in VS Code
2. Pick any test case
3. Follow the steps
4. Write what happened
5. Mark ✅ PASS or ❌ FAIL
6. Save the file (Cmd+S)

**Questions? Just ask!** 🚀
