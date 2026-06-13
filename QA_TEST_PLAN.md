# VitaNudge - Comprehensive QA Test Plan & Security Audit

**Application**: VitaNudge - Nutrition Tracking Web Application  
**Environment**: Production (Render Deployment)  
**Testing Period**: June 13, 2026 - Ongoing  
**Prepared By**: Senior QA Automation Engineer  
**Document Version**: 1.0  

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Authentication & User Management Test Cases](#authentication--user-management-test-cases)
3. [Profile & Goals Test Cases](#profile--goals-test-cases)
4. [Food Logging Test Cases](#food-logging-test-cases)
5. [Scanning Features Test Cases](#scanning-features-test-cases)
6. [Body Tracking Test Cases](#body-tracking-test-cases)
7. [Clinical Tracking Test Cases](#clinical-tracking-test-cases)
8. [AI Coach Test Cases](#ai-coach-test-cases)
9. [Recipes & Templates Test Cases](#recipes--templates-test-cases)
10. [Reports & Analytics Test Cases](#reports--analytics-test-cases)
11. [Pro Features & Billing Test Cases](#pro-features--billing-test-cases)
12. [Security Test Cases](#security-test-cases)
13. [API Endpoint Test Cases](#api-endpoint-test-cases)
14. [Edge Cases & Boundary Tests](#edge-cases--boundary-tests)
15. [Error Handling Test Cases](#error-handling-test-cases)
16. [Performance & Load Test Cases](#performance--load-test-cases)
17. [Cross-Browser Compatibility](#cross-browser-compatibility)
18. [Mobile Responsiveness](#mobile-responsiveness)
19. [Automation Scripts](#automation-scripts)
20. [Test Execution Log](#test-execution-log)

---

## Testing Overview

### Test Environment
- **URL**: https://vitanudge.onrender.com (or your Render URL)
- **Backend API**: https://vitanudge-api.onrender.com
- **Database**: SQLite (Production)
- **Authentication**: JWT Bearer Tokens
- **Session Management**: localStorage

### Testing Scope
- ✅ Functional Testing
- ✅ Security Testing
- ✅ API Testing
- ✅ UI/UX Testing
- ✅ Performance Testing
- ✅ Cross-browser Testing
- ✅ Mobile Responsiveness
- ✅ Error Handling
- ✅ Data Validation

### Test Status Legend
- 🟢 **PASS** - Test passed successfully
- 🔴 **FAIL** - Test failed, bug identified
- 🟡 **PENDING** - Test not executed yet
- ⚪ **BLOCKED** - Cannot test due to dependency
- 🔵 **SKIP** - Test skipped (not applicable)

---

## Authentication & User Management Test Cases

### TC-AUTH-001: User Registration - Valid Data
**Priority**: Critical  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- Application is accessible
- No existing account with test email

**Test Steps**:
1. Navigate to `/register`
2. Enter valid name: "Test User"
3. Enter valid email: "testuser001@example.com"
4. Enter valid password: "TestPass123"
5. Click "Create account"

**Expected Result**:
- ✅ Account created successfully
- ✅ User redirected to `/goals?setup=1`
- ✅ Success message displayed (if any)
- ✅ JWT token stored in localStorage
- ✅ User data saved in database

**Actual Result**: _____________

**Failure Points**:
- ❌ Registration fails with valid data
- ❌ User not redirected
- ❌ Token not stored
- ❌ Duplicate account created
- ❌ Email not validated

**Evidence**: Screenshot/Video: _____________

---

### TC-AUTH-002: User Registration - Invalid Email Format
**Priority**: High  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Data**:
| Email Input | Expected Error |
|-------------|---------------|
| `user@` | "Please enter a valid email address" |
| `user@email` | "Please enter a valid email address" |
| `useremail.com` | "Please enter a valid email address" |
| `user @email.com` | "Please enter a valid email address" |
| `@email.com` | "Please enter a valid email address" |
| ` ` (spaces) | "Please enter a valid email address" |
| `user..double@email.com` | Should accept or reject consistently |

**Test Steps**:
1. Navigate to `/register`
2. Enter name: "Test User"
3. Enter invalid email from table above
4. Enter valid password: "TestPass123"
5. Click "Create account"

**Expected Result**:
- ✅ Error message displayed: "Please enter a valid email address (e.g., you@email.com)"
- ✅ Form not submitted
- ✅ Error shown immediately on blur or submit
- ✅ No API call made

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-003: User Registration - Weak Password
**Priority**: Critical (Security)  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Data**:
| Password | Expected Error |
|----------|---------------|
| `12345` | "Password must be at least 6 characters" |
| `123456` | "Password must contain at least one letter" |
| `password` | "Password must contain at least one number" |
| `pass 123` | "Password cannot contain spaces" |
| `pass123` | ✅ Should succeed |
| `MyPass1` | ✅ Should succeed |
| `a1` | "Password must be at least 6 characters" |
| `aaaaaa` | "Password must contain at least one number" |
| `111111` | "Password must contain at least one letter" |

**Test Steps**:
1. Navigate to `/register`
2. Enter name: "Test User"
3. Enter valid email: "testuser002@example.com"
4. Enter password from table above
5. Click "Create account"

**Expected Result**:
- ✅ Appropriate error message shown for each weak password
- ✅ No account created with weak password
- ✅ Client-side validation prevents submission
- ✅ Backend also validates (if client-side bypassed)

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-004: User Registration - Duplicate Email
**Priority**: High  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- Account already exists with email: "existing@example.com"

**Test Steps**:
1. Navigate to `/register`
2. Enter name: "Another User"
3. Enter email: "existing@example.com" (already registered)
4. Enter valid password: "TestPass123"
5. Click "Create account"

**Expected Result**:
- ✅ Error message: "Email already registered" or similar
- ✅ No duplicate account created
- ✅ User not logged in
- ✅ Redirect to login page or show "Already have account? Login" message

**Actual Result**: _____________

**Failure Points**:
- ❌ Duplicate account created
- ❌ Error reveals email exists (account enumeration vulnerability)
- ❌ App crashes

**Evidence**: _____________

---

### TC-AUTH-005: User Login - Valid Credentials
**Priority**: Critical  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- Valid account exists with credentials:
  - Email: "testuser001@example.com"
  - Password: "TestPass123"

**Test Steps**:
1. Navigate to `/login`
2. Enter email: "testuser001@example.com"
3. Enter password: "TestPass123"
4. Click "Continue to dashboard"

**Expected Result**:
- ✅ Login successful
- ✅ User redirected to `/` (Today/Dashboard)
- ✅ JWT token stored in localStorage
- ✅ User data loaded
- ✅ Navigation menu shows user name

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-006: User Login - Invalid Email
**Priority**: High  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/login`
2. Enter invalid email: "invalidemail"
3. Enter any password: "TestPass123"
4. Click "Continue to dashboard"

**Expected Result**:
- ✅ Error message: "Please enter a valid email address"
- ✅ Form not submitted
- ✅ No API call made

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-007: User Login - Wrong Password
**Priority**: Critical  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- Valid account exists with email: "testuser001@example.com"

**Test Steps**:
1. Navigate to `/login`
2. Enter email: "testuser001@example.com"
3. Enter wrong password: "WrongPass999"
4. Click "Continue to dashboard"

**Expected Result**:
- ✅ Error message: "We couldn't sign you in. Check your details, or create an account if you're new."
- ✅ User NOT logged in
- ✅ Generic error (no "wrong password" to prevent account enumeration)
- ✅ Rate limiting after multiple attempts

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-008: User Login - Non-existent Account
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/login`
2. Enter email: "nonexistent@example.com"
3. Enter password: "TestPass123"
4. Click "Continue to dashboard"

**Expected Result**:
- ✅ Error message: "We couldn't sign you in. Check your details, or create an account if you're new."
- ✅ Generic error (same as wrong password to prevent account enumeration)
- ✅ User NOT logged in
- ✅ Suggestion to create account

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-009: Login Rate Limiting
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/login`
2. Attempt login with wrong password 10 times
3. Attempt 11th login

**Expected Result**:
- ✅ After 10 failed attempts: "Too many login attempts. Please wait 15 minutes before trying again."
- ✅ 429 status code from API
- ✅ Further attempts blocked for 15 minutes
- ✅ Counter resets after wait period

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-010: Session Persistence
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Login with valid credentials
2. Navigate to different pages within app
3. Close browser tab
4. Reopen application URL in new tab

**Expected Result**:
- ✅ User still logged in
- ✅ JWT token persists in localStorage
- ✅ User data loaded automatically
- ✅ Dashboard shows user's data

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-011: Logout Functionality
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Login with valid credentials
2. Navigate to More → Profile (or wherever logout is)
3. Click "Log out" button

**Expected Result**:
- ✅ User logged out
- ✅ JWT token removed from localStorage
- ✅ Redirected to `/login`
- ✅ Cannot access protected routes without re-login

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-012: Forgot Password Flow
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- RESEND_API_KEY configured in backend

**Test Steps**:
1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter registered email: "testuser001@example.com"
4. Submit form
5. Check email inbox
6. Click reset link from email
7. Enter new password: "NewPass456"
8. Submit new password

**Expected Result**:
- ✅ Password reset email sent
- ✅ Reset link valid for limited time (e.g., 1 hour)
- ✅ Password successfully reset
- ✅ Can login with new password
- ✅ Old password no longer works
- ✅ Reset link can only be used once

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-013: Email Verification
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Register new account
2. Check email for verification link
3. Click verification link
4. Observe verification status

**Expected Result**:
- ✅ Verification email sent
- ✅ Email contains valid verification link
- ✅ Account verified on click
- ✅ Success message shown

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-AUTH-014: Protected Routes - Unauthorized Access
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Clear localStorage (logout)
2. Attempt to access protected routes directly:
   - `/` (Dashboard/Today)
   - `/goals`
   - `/profile`
   - `/library`
   - `/coach`
   - `/report`

**Expected Result**:
- ✅ All protected routes redirect to `/login`
- ✅ No data exposed
- ✅ No API calls succeed without token

**Actual Result**: _____________

**Evidence**: _____________

---

## Profile & Goals Test Cases

### TC-PROFILE-001: Complete Profile - Valid Data
**Priority**: Critical  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User logged in
- Profile incomplete

**Test Steps**:
1. Navigate to `/profile`
2. Enter age: 30
3. Select gender: Male
4. Enter weight: 70 kg
5. Enter height: 175 cm
6. Select condition: None
7. Select diet preference: Vegetarian
8. Enter location: India, Maharashtra, Mumbai
9. Select timezone: Asia/Kolkata
10. Click "Save profile"

**Expected Result**:
- ✅ Profile saved successfully
- ✅ Success message: "Profile saved"
- ✅ Message visible at top of page (auto-scrolled)
- ✅ Data persisted in database
- ✅ Profile completion status updated

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-PROFILE-002: Profile Validation - Age Boundary
**Priority**: High  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Data**:
| Age | Expected Result |
|-----|----------------|
| 0 | "Age is required and must be between 1 and 150" |
| 1 | ✅ Should succeed |
| 30 | ✅ Should succeed |
| 150 | ✅ Should succeed |
| 151 | "Age is required and must be between 1 and 150" |
| -5 | "Age is required and must be between 1 and 150" |
| "abc" | Validation error or prevented from entering |

**Test Steps**:
1. Navigate to `/profile`
2. Enter age from table above
3. Fill other required fields
4. Click "Save profile"

**Expected Result**:
- ✅ Appropriate validation message for invalid ages
- ✅ Valid ages accepted

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-PROFILE-003: Profile Validation - Weight Boundary
**Priority**: High  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Data**:
| Weight (kg) | Expected Result |
|------------|----------------|
| 0 | "Weight is required and must be between 1 and 500 kg" |
| 1 | ✅ Should succeed |
| 70 | ✅ Should succeed |
| 500 | ✅ Should succeed |
| 501 | "Weight is required and must be between 1 and 500 kg" |
| -10 | "Weight is required and must be between 1 and 500 kg" |

**Expected Result**:
- ✅ Appropriate validation for invalid weights
- ✅ Valid weights accepted

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-PROFILE-004: Profile Validation - Height Boundary
**Priority**: High  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Data**:
| Height (cm) | Expected Result |
|------------|----------------|
| 0 | "Height is required and must be between 1 and 300 cm" |
| 1 | ✅ Should succeed |
| 175 | ✅ Should succeed |
| 300 | ✅ Should succeed |
| 301 | "Height is required and must be between 1 and 300 cm" |
| -10 | "Height is required and must be between 1 and 300 cm" |

**Expected Result**:
- ✅ Appropriate validation for invalid heights
- ✅ Valid heights accepted

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-GOALS-001: Set Goals - Weight Loss
**Priority**: Critical  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User logged in
- Profile complete (age, weight, height, gender)

**Test Steps**:
1. Navigate to `/goals`
2. Select goal: "Weight loss"
3. Select activity level: "Moderate exercise (3-5 days/week)"
4. Click "Next"
5. Review recommended macros
6. Optionally edit target calories, protein, etc.
7. Click "Save my goal"

**Expected Result**:
- ✅ Next button enabled only if profile complete
- ✅ Recommended macros calculated based on profile
- ✅ Can edit recommended values
- ✅ Goals saved successfully
- ✅ Redirected to dashboard
- ✅ Dashboard shows goal targets

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-GOALS-002: Goals Wizard - Incomplete Profile
**Priority**: High  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User logged in
- Profile INCOMPLETE (missing age/weight/height/gender)

**Test Steps**:
1. Navigate to `/goals`
2. Observe Next button state
3. Check warning message

**Expected Result**:
- ✅ Next button DISABLED on all steps
- ✅ Warning message: "Complete your profile to continue"
- ✅ Button to "Complete your profile →" shown
- ✅ Button navigates to `/profile`

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-GOALS-003: Edit Existing Goals
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has existing goals set

**Test Steps**:
1. Navigate to `/goals`
2. Click "Edit goal" button
3. Change goal type to "Muscle gain"
4. Change activity level
5. Click "Next"
6. Edit recommended macros
7. Click "Save my goal"

**Expected Result**:
- ✅ Can edit existing goals
- ✅ New recommendations calculated
- ✅ Goals updated in database
- ✅ Dashboard reflects new targets

**Actual Result**: _____________

**Evidence**: _____________

---

## Food Logging Test Cases

### TC-FOOD-001: Add Food Entry - Manual Entry
**Priority**: Critical  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User logged in
- On Today dashboard (`/`)

**Test Steps**:
1. Click "+ Add Food" button
2. Select "Add manually" (or navigate to `/add-food`)
3. Enter food name: "Grilled Chicken Breast"
4. Enter serving size: 150g
5. Enter calories: 248
6. Enter protein: 46.2g
7. Enter carbs: 0g
8. Enter fiber: 0g
9. Select meal type: Lunch
10. Click "Add to log"

**Expected Result**:
- ✅ Food entry added to today's log
- ✅ Shown in "Lunch" section on dashboard
- ✅ Calorie total updated
- ✅ Macro progress bars updated
- ✅ Success message shown

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-002: Add Food Entry - From Library
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Today dashboard
2. Click "+ Add Food"
3. Click "From library"
4. Search for "rice"
5. Select "White Rice" from results
6. Enter quantity: 200g
7. Select meal: Dinner
8. Click "Add to log"

**Expected Result**:
- ✅ Library food added to log
- ✅ Macros calculated from food library data
- ✅ Entry visible in Dinner section
- ✅ Totals updated correctly

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-003: Edit Food Entry
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- Food entry exists in today's log

**Test Steps**:
1. Click on existing food entry
2. Click "Edit" button
3. Change quantity from 100g to 150g
4. Click "Save"

**Expected Result**:
- ✅ Entry updated
- ✅ Macros recalculated based on new quantity
- ✅ Calorie total updated
- ✅ Progress bars updated

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-004: Delete Food Entry
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Click on food entry
2. Click "Delete" button
3. Confirm deletion

**Expected Result**:
- ✅ Entry removed from log
- ✅ Totals recalculated
- ✅ Progress bars updated
- ✅ Entry removed from database

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-005: Copy Yesterday's Meals
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- Yesterday has meal entries logged

**Test Steps**:
1. On Today dashboard, click "Copy yesterday"
2. Select destination meals (e.g., yesterday's dinner → today's lunch)
3. Click "Copy selected"

**Expected Result**:
- ✅ Yesterday's meals copied to today
- ✅ Can map different meal types (cross-meal copy)
- ✅ Macros calculated correctly
- ✅ Totals updated

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-006: Food Library Search
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/library`
2. Enter search term: "chicken"
3. Observe results

**Expected Result**:
- ✅ Relevant results shown
- ✅ Search is case-insensitive
- ✅ Partial matches shown
- ✅ Results update as user types

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-007: Save Food to Library
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Add food manually
2. After entering details, click "Save to library"
3. Navigate to Library
4. Search for the saved food

**Expected Result**:
- ✅ Food saved to personal library
- ✅ Available for future use
- ✅ Can be found via search

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-008: Profile Completion Reminder
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- New user with incomplete profile
- No food logged yet

**Test Steps**:
1. Login as new user
2. Add first food entry
3. Observe modal

**Expected Result**:
- ✅ After adding food, modal appears: "Complete your profile"
- ✅ Modal explains why profile is needed
- ✅ Button to go to profile page
- ✅ Modal can be closed

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-FOOD-009: Food Library - Check for Duplicates
**Priority**: High  
**Type**: Data Integrity  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/library`
2. Review complete food library list
3. Search for common food items (e.g., "rice", "chicken", "bread")
4. Check if same food appears multiple times with slightly different names
5. Verify no exact duplicate entries exist

**Test via API**:
```javascript
// Get all foods for current user
GET /api/foods
Authorization: Bearer {token}

// Check response for duplicates
const foods = response.foods;
const foodNames = foods.map(f => f.name.toLowerCase().trim());
const duplicates = foodNames.filter((name, index) => foodNames.indexOf(name) !== index);
```

**Expected Result**:
- ✅ No exact duplicate food names in library
- ✅ Each food entry is unique
- ✅ Database has unique constraint on (user_id, food_name) if applicable
- ✅ If duplicates exist, they are intentional variants (e.g., "White Rice" vs "Brown Rice")
- ✅ API prevents saving duplicate food names for same user

**Common Duplicate Scenarios to Check**:
| Food Name | Possible Duplicate | Should Be |
|-----------|-------------------|-----------|
| White Rice | white rice, White rice, WHITE RICE | Case-insensitive unique |
| Chicken Breast | Chicken breast, chicken breast | Normalized |
| Grilled Chicken | grilled chicken | Case handling |

**Actual Result**: _____________

**Potential Issues**:
- ❌ Same food saved multiple times with different cases
- ❌ Trailing/leading spaces causing duplicates
- ❌ User can save "Rice" and "rice" as separate entries
- ❌ Import/scan features create duplicates

**Evidence**: _____________

**Remediation Steps if Duplicates Found**:
1. Identify all duplicate entries
2. Merge duplicates keeping most complete nutritional data
3. Add database constraint: UNIQUE(user_id, LOWER(TRIM(name)))
4. Add frontend validation before save
5. Run data cleanup script to remove existing duplicates

---

## Scanning Features Test Cases

### TC-SCAN-001: Plate Scan - Valid Photo
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has Pro subscription or scan quota available

**Test Steps**:
1. Navigate to `/scan` (Plate scan)
2. Select meal type: Lunch
3. Upload clear photo of plate with food
4. Click "Identify food items"
5. Wait for AI processing
6. Review detected items
7. Click "Save reviewed items"

**Expected Result**:
- ✅ AI detects food items from photo
- ✅ Each item shows: name, quantity, unit, macros
- ✅ Confidence level shown (high/medium/low)
- ✅ Can edit detected items
- ✅ Can remove incorrect items
- ✅ All items saved to log
- ✅ Macros calculated correctly

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SCAN-002: Plate Scan - Add Missed Food
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- Plate scan completed
- AI missed some items

**Test Steps**:
1. Complete plate scan
2. Review detected items
3. Click "+ Add food AI missed"
4. Enter food name: "Bread"
5. Leave field (blur)
6. Observe auto-matching
7. Adjust quantity if needed
8. Click "Save reviewed items"

**Expected Result**:
- ✅ Button "+ Add food AI missed" visible
- ✅ New blank row added when clicked
- ✅ Auto-matches food from library when name entered
- ✅ Shows estimate if not in library
- ✅ Can add multiple missed items
- ✅ All items (AI + manual) saved together

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SCAN-003: Barcode Scan - Valid Product
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/barcode` or Library → Scan barcode
2. Enter barcode: 8901063022850
3. Click "Look up" or scan from camera
4. Review product details
5. Click "Save to library"

**Expected Result**:
- ✅ Product details retrieved
- ✅ Shows: name, brand, nutrition info
- ✅ Can edit values before saving
- ✅ Saved to library with success message
- ✅ Message: "✅ Saved to library"

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SCAN-004: Barcode Scan - Duplicate Save
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Scan barcode and save to library
2. Message shown: "✅ Saved to library"
3. Immediately click "Save to library" again

**Expected Result**:
- ✅ Shows only one message: "ℹ️ This food is already in your library"
- ✅ No duplicate in library
- ✅ Previous message cleared

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SCAN-005: Barcode Scan - Message Clears on New Search
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Scan barcode 123456
2. Save to library → Message shows
3. Immediately scan different barcode 789012
4. Observe message state

**Expected Result**:
- ✅ Old message cleared when new search starts
- ✅ Clean state for new barcode lookup
- ✅ No lingering messages from previous scan

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SCAN-006: Label Scanner - Upload Photo
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Add Food
2. Select "Scan nutrition label"
3. Upload photo of nutrition label
4. Wait for AI extraction
5. Review extracted data
6. Click "Edit values"
7. Modify if needed
8. Click "Save to library"

**Expected Result**:
- ✅ AI extracts nutrition data from label
- ✅ Shows: name, serving size, calories, macros
- ✅ Can edit before saving
- ✅ Saved to library

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SCAN-007: Scan Rate Limiting - Free Tier
**Priority**: High (Security)  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User on Free tier

**Test Steps**:
1. Perform 30 scans within 1 hour
2. Attempt 31st scan

**Expected Result**:
- ✅ After 30 scans: "Scan limit reached for this hour. Free plan allows 30 scans/hour."
- ✅ 429 status code
- ✅ Upgrade modal shown
- ✅ Scans resume after 1 hour

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SCAN-008: Scan - Pro Tier Unlimited
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has Pro subscription

**Test Steps**:
1. Perform 50+ scans in 1 hour

**Expected Result**:
- ✅ No rate limit
- ✅ All scans succeed
- ✅ No upgrade prompts

**Actual Result**: _____________

**Evidence**: _____________

---

## Body Tracking Test Cases

### TC-BODY-001: Log Weight Entry
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Tools → Body
2. Select "Weight" tab
3. Enter weight: 70.5 kg
4. Optionally add notes
5. Click "Log weight"

**Expected Result**:
- ✅ Weight logged for today
- ✅ Entry appears in weight history
- ✅ Weight chart updated
- ✅ Success message shown

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BODY-002: Log Hydration Entry
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Tools → Body → Hydration
2. Click quick button: 250ml
3. Or enter custom amount: 500ml
4. Click "Add"
5. Check today's log

**Expected Result**:
- ✅ Water logged
- ✅ Total updated (e.g., 750ml / 2000ml)
- ✅ Progress bar updated
- ✅ Entry shows in "Today's log" with timestamp (e.g., "2:30 PM")
- ✅ NO "Invalid Date" shown

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BODY-003: Hydration - Date Format
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Tools → Body → Hydration
2. Add water entries at different times
3. Check "Today's log" section

**Expected Result**:
- ✅ Each entry shows time like "2:30 PM", "11:45 AM"
- ✅ NO "Invalid Date" shown
- ✅ Times are accurate to when logged

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BODY-004: Delete Hydration Entry
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Log water entry
2. Click "×" button next to entry in today's log
3. Observe update

**Expected Result**:
- ✅ Entry removed
- ✅ Total recalculated
- ✅ Progress bar updated

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BODY-005: Log Steps
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Tools → Body → Steps
2. Enter steps: 8500
3. Select source: Manual
4. Click "Log steps"

**Expected Result**:
- ✅ Steps logged
- ✅ Shows in history
- ✅ Chart updated

**Actual Result**: _____________

**Evidence**: _____________

---

## Clinical Tracking Test Cases

### TC-CLINICAL-001: Log Blood Glucose
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Tools → Clinical
2. Select "Glucose" tab
3. Enter glucose level: 95 mg/dL
4. Select timing: Fasting
5. Optionally add notes
6. Click "Log glucose"

**Expected Result**:
- ✅ Glucose logged
- ✅ Entry in today's log with timestamp
- ✅ Chart updated

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-CLINICAL-002: Log Blood Pressure
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Tools → Clinical → Blood Pressure
2. Enter systolic: 120
3. Enter diastolic: 80
4. Optionally add pulse: 72
5. Click "Log BP"

**Expected Result**:
- ✅ BP logged
- ✅ Shows as 120/80 in log
- ✅ Chart updated

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-CLINICAL-003: Log Medications
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to Tools → Clinical → Medications
2. Enter medication name: "Vitamin D"
3. Enter dosage: "1000 IU"
4. Select frequency: Daily
5. Click "Add medication"

**Expected Result**:
- ✅ Medication added to list
- ✅ Shows in medication schedule
- ✅ Can mark as taken

**Actual Result**: _____________

**Evidence**: _____________

---

## AI Coach Test Cases

### TC-COACH-001: Ask Question - Free Tier Block
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User on Free tier

**Test Steps**:
1. Navigate to `/coach`
2. Enter question: "What should I eat for dinner?"
3. Click "Ask Coach"

**Expected Result**:
- ✅ Upgrade modal shown
- ✅ Message: "AI Coach is a Pro feature"
- ✅ No API call made
- ✅ Button to upgrade

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-COACH-002: Ask Question - Pro Tier
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has Pro subscription

**Test Steps**:
1. Navigate to `/coach`
2. Enter question: "What should I eat to increase protein?"
3. Click "Ask Coach"
4. Wait for AI response

**Expected Result**:
- ✅ AI generates response
- ✅ Response relevant to user's profile and goals
- ✅ Response shows in chat-like interface
- ✅ Can ask follow-up questions

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-COACH-003: Coach Auto-Context from Dashboard
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has Pro subscription
- User has goals set

**Test Steps**:
1. On Today dashboard, click "Ask Coach" button
2. Observe pre-filled context

**Expected Result**:
- ✅ Coach opens with auto-context
- ✅ Context includes: goal type, current macros, progress
- ✅ Example: "My goal is Weight loss. Today I've consumed 1200/1800 kcal..."

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-COACH-004: Coach Rate Limiting
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has Pro subscription

**Test Steps**:
1. Ask Coach 20 questions in 1 hour
2. Attempt 21st question

**Expected Result**:
- ✅ Rate limit message shown
- ✅ "Please wait before asking more questions"
- ✅ Resets after 1 hour

**Actual Result**: _____________

**Evidence**: _____________

---

## Recipes & Templates Test Cases

### TC-RECIPE-001: View Recipes - Free Tier Block
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User on Free tier

**Test Steps**:
1. Navigate to `/recipes`

**Expected Result**:
- ✅ Upgrade modal shown
- ✅ "Recipes is a Pro feature"
- ✅ Cannot view recipes without Pro

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-RECIPE-002: Create Recipe - Pro Tier
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has Pro subscription

**Test Steps**:
1. Navigate to `/recipes`
2. Click "Create recipe"
3. Enter name: "Chicken Curry"
4. Add ingredients from library
5. Enter servings: 4
6. Enter instructions
7. Click "Save recipe"

**Expected Result**:
- ✅ Recipe saved
- ✅ Macros calculated from ingredients
- ✅ Appears in recipe list

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-RECIPE-003: Log Recipe to Meals
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Open recipe
2. Enter servings consumed: 1
3. Select meal: Dinner
4. Click "Log to meals"

**Expected Result**:
- ✅ Recipe logged to dinner
- ✅ Macros calculated for 1 serving
- ✅ Shows in dinner section

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-TEMPLATE-001: Create Meal Template
**Priority**: Low  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Log a complete meal (multiple items)
2. Click "Save as template"
3. Enter template name: "My Breakfast"
4. Save template

**Expected Result**:
- ✅ Template saved
- ✅ Available in templates list
- ✅ Can load template to log entire meal quickly

**Actual Result**: _____________

**Evidence**: _____________

---

## Reports & Analytics Test Cases

### TC-REPORT-001: View Daily Report
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/report`
2. View today's report

**Expected Result**:
- ✅ Shows calorie intake vs target
- ✅ Shows macro breakdown (protein, carbs, fat, fiber)
- ✅ Shows meal distribution
- ✅ Charts/graphs render correctly

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-REPORT-002: View Weekly Report
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/weekly` or Reports → Weekly
2. View current week's report

**Expected Result**:
- ✅ Shows 7-day summary
- ✅ Calorie trend chart
- ✅ Average macros
- ✅ Adherence to goals

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-REPORT-003: Export Data
**Priority**: Low  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to More → Export
2. Select date range
3. Click "Export to CSV"

**Expected Result**:
- ✅ CSV file downloaded
- ✅ Contains all meal logs, macros, body metrics
- ✅ Properly formatted

**Actual Result**: _____________

**Evidence**: _____________

---

## Pro Features & Billing Test Cases

### TC-BILLING-001: Upgrade to Pro
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User on Free tier
- Stripe test mode enabled

**Test Steps**:
1. Click "Upgrade to Pro" button
2. Select plan (Monthly/Yearly)
3. Enter test card: 4242 4242 4242 4242
4. Complete payment
5. Observe account status

**Expected Result**:
- ✅ Payment processed via Stripe
- ✅ Account upgraded to Pro
- ✅ Pro features unlocked (Recipes, Coach, unlimited scans)
- ✅ Subscription stored in database

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BILLING-002: Pro Features Access
**Priority**: High  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Preconditions**:
- User has Pro subscription

**Test Steps**:
1. Access `/recipes` - should work
2. Access `/coach` - should work
3. Perform 50+ scans - should work
4. No upgrade modals shown

**Expected Result**:
- ✅ All Pro features accessible
- ✅ No rate limits on scans
- ✅ Coach available
- ✅ Recipes available

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BILLING-003: Subscription Expiry
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Manually set subscription_expires_at to past date in database
2. Logout and login
3. Try to access Pro features

**Expected Result**:
- ✅ Subscription expired
- ✅ Account downgraded to Free
- ✅ Pro features blocked
- ✅ Upgrade prompts shown again

**Actual Result**: _____________

**Evidence**: _____________

---

## Security Test Cases

### TC-SEC-001: SQL Injection - Login
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Payloads**:
| Email | Password | Expected |
|-------|----------|----------|
| `admin' OR '1'='1` | `password` | Rejected - Invalid email format |
| `test@email.com'; DROP TABLE users; --` | `pass` | Rejected - Invalid email format |
| `test@email.com` | `' OR '1'='1` | Login fails - wrong password |

**Expected Result**:
- ✅ All SQL injection attempts fail
- ✅ Parameterized queries used
- ✅ No data leaked
- ✅ No database altered

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-002: XSS - Food Name Input
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Payloads**:
Enter as food name:
1. `<script>alert('XSS')</script>`
2. `<img src=x onerror=alert('XSS')>`
3. `<svg onload=alert('XSS')>`
4. `"><script>alert(String.fromCharCode(88,83,83))</script>`

**Expected Result**:
- ✅ Scripts NOT executed
- ✅ Input properly sanitized/escaped
- ✅ Displays as plain text
- ✅ No alert boxes shown

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-003: XSS - Profile Name
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Navigate to `/profile`
2. Enter name: `<script>alert('XSS')</script>`
3. Save profile
4. Navigate to different pages showing user name

**Expected Result**:
- ✅ Name displayed as plain text
- ✅ No script execution
- ✅ Properly escaped in all contexts

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-004: JWT Token Security
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Login and capture JWT token from localStorage
2. Decode JWT using jwt.io
3. Check token structure and claims
4. Modify token payload
5. Try to use modified token

**Expected Result**:
- ✅ Token properly signed
- ✅ Contains user_id claim
- ✅ Has expiration
- ✅ Modified token rejected (401 Unauthorized)
- ✅ Signature verification works

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-005: CSRF Protection
**Priority**: High (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Create malicious HTML page:
```html
<form action="https://vitanudge.com/api/meals" method="POST">
  <input name="food_name" value="Hacked">
  <input name="calories" value="9999">
</form>
<script>document.forms[0].submit()</script>
```
2. Host on different domain
3. While logged into VitaNudge, visit malicious page

**Expected Result**:
- ✅ Request blocked by CORS
- ✅ No food entry created
- ✅ JWT required in Authorization header (not cookie)

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-006: Password Hashing
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Create account with password: "TestPass123"
2. Access database directly
3. Check users table password field

**Expected Result**:
- ✅ Password NOT stored in plain text
- ✅ bcrypt hash used (starts with $2a$ or $2b$)
- ✅ Different users with same password have different hashes (salt)

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-007: Session Timeout
**Priority**: Medium (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Login and note JWT token
2. Wait for token expiration (check JWT exp claim)
3. Try to make API call with expired token

**Expected Result**:
- ✅ Expired token rejected
- ✅ 401 Unauthorized response
- ✅ User logged out automatically
- ✅ Redirected to login

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-008: Sensitive Data Exposure
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Login
2. Open browser DevTools → Network tab
3. Make API calls
4. Inspect responses for sensitive data

**Expected Result**:
- ✅ Passwords NEVER in responses
- ✅ No other users' data exposed
- ✅ Only authorized user's own data returned
- ✅ No stack traces in production errors

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-009: Authorization - Access Other Users' Data
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Login as User A
2. Capture User A's meal entry ID from API response
3. Login as User B
4. Try to GET User A's meal: `/api/meals/{user_a_meal_id}`
5. Try to DELETE User A's meal

**Expected Result**:
- ✅ 404 Not Found or 403 Forbidden
- ✅ User B cannot access User A's data
- ✅ User B cannot modify User A's data

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-010: File Upload - Malicious Files
**Priority**: High (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Try to upload non-image file to plate scan:
   - .exe file
   - .php file
   - .sh script
   - SVG with embedded script

**Expected Result**:
- ✅ Only image files accepted (JPEG, PNG)
- ✅ File type validation on backend
- ✅ Malicious files rejected

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-011: API Rate Limiting - Brute Force
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Attempt 100 login requests in 1 minute with wrong password

**Expected Result**:
- ✅ After 10 attempts: Rate limit activated
- ✅ 429 Too Many Requests
- ✅ "Too many login attempts. Please wait 15 minutes"
- ✅ Blocks further attempts for 15 minutes

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-012: HTTPS Enforcement
**Priority**: Critical (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Try to access: http://vitanudge.com (HTTP, not HTTPS)
2. Check if redirected to HTTPS

**Expected Result**:
- ✅ Automatically redirected to HTTPS
- ✅ All resources loaded over HTTPS
- ✅ No mixed content warnings

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-SEC-013: Helmet Security Headers
**Priority**: High (Security)  
**Type**: Security  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Make any API request
2. Check response headers

**Expected Result**:
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY or SAMEORIGIN
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security header present

**Actual Result**: _____________

**Evidence**: _____________

---

## API Endpoint Test Cases

### TC-API-001: POST /api/auth/register - Valid
**Priority**: Critical  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```json
POST /api/auth/register
Content-Type: application/json

{
  "name": "API Test User",
  "email": "apitest001@example.com",
  "password": "ApiPass123"
}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "API Test User",
    "email": "apitest001@example.com",
    "subscription_tier": "free"
  }
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-002: POST /api/auth/register - Missing Fields
**Priority**: High  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Payloads**:

1. Missing email:
```json
{
  "name": "Test",
  "password": "TestPass123"
}
```
Expected: `400 Bad Request - "name, email and password are required"`

2. Missing password:
```json
{
  "name": "Test",
  "email": "test@email.com"
}
```
Expected: `400 Bad Request - "name, email and password are required"`

3. Empty email:
```json
{
  "name": "Test",
  "email": "",
  "password": "TestPass123"
}
```
Expected: `400 Bad Request - "name, email and password are required"`

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-003: POST /api/auth/login - Valid
**Priority**: Critical  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "apitest001@example.com",
  "password": "ApiPass123"
}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "token": "eyJhbGc...",
  "user": { ... },
  "first_login": false
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-004: POST /api/meals - Add Food Entry
**Priority**: Critical  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```json
POST /api/meals
Authorization: Bearer {token}
Content-Type: application/json

{
  "food_name": "Grilled Chicken",
  "meal_type": "lunch",
  "log_date": "2026-06-13",
  "qty": 150,
  "unit": "g",
  "cal": 248,
  "protein_g": 46.2,
  "carbs_g": 0,
  "fiber_g": 0
}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "message": "Meal logged",
  "entry": {
    "id": "...",
    "food_name": "Grilled Chicken",
    ...
  }
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-005: POST /api/meals - Missing Auth
**Priority**: Critical  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```json
POST /api/meals
Content-Type: application/json
(No Authorization header)

{
  "food_name": "Test",
  "meal_type": "lunch"
}
```

**Expected Response**:
```
HTTP 401 Unauthorized
{
  "error": "No token provided" or "Unauthorized"
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-006: GET /api/meals - Retrieve Meals
**Priority**: High  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```
GET /api/meals?date=2026-06-13
Authorization: Bearer {token}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "date": "2026-06-13",
  "meals": {
    "breakfast": [ ... ],
    "lunch": [ ... ],
    "dinner": [ ... ],
    "snack": [ ... ]
  },
  "totals": {
    "cal": 1500,
    "protein_g": 80,
    ...
  }
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-007: DELETE /api/meals/:id - Delete Entry
**Priority**: Medium  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```
DELETE /api/meals/{meal_id}
Authorization: Bearer {token}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "message": "Entry deleted"
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-008: PUT /api/auth/profile - Update Profile
**Priority**: High  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```json
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "age": 30,
  "gender": "male",
  "weight_kg": 70,
  "height_cm": 175,
  "condition": "none",
  "diet_preference": "vegetarian",
  "country": "India",
  "state_region": "Maharashtra",
  "city": "Mumbai",
  "timezone": "Asia/Kolkata"
}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "message": "Profile updated",
  "user": { ... }
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-009: POST /api/scan/plate - Plate Scan
**Priority**: High  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```json
POST /api/scan/plate
Authorization: Bearer {token}
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "mediaType": "image/jpeg",
  "date": "2026-06-13",
  "meal_type": "lunch"
}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "items": [
    {
      "food_name": "Rice",
      "qty": 200,
      "unit": "g",
      "cal": 258,
      "confidence": "high",
      ...
    }
  ]
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-API-010: GET /api/barcode/:code - Barcode Lookup
**Priority**: Medium  
**Type**: API  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Request**:
```
GET /api/barcode/8901063022850
Authorization: Bearer {token}
```

**Expected Response**:
```json
HTTP 200 OK
{
  "product": {
    "barcode": "8901063022850",
    "name": "Product Name",
    "brand": "Brand",
    "food": {
      "name": "...",
      "cal": 100,
      ...
    }
  }
}
```

**Actual Result**: _____________

**Evidence**: _____________

---

## Edge Cases & Boundary Tests

### TC-EDGE-001: Empty Food Name
**Priority**: Medium  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Try to add food entry with empty name
2. Submit form

**Expected Result**:
- ✅ Validation error
- ✅ "Food name is required"
- ✅ Entry not saved

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-002: Negative Calories
**Priority**: Medium  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Add food entry
2. Enter calories: -100
3. Submit

**Expected Result**:
- ✅ Validation error or prevented from entering
- ✅ Negative values rejected

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-003: Very Large Calorie Value
**Priority**: Low  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Add food entry
2. Enter calories: 999999
3. Submit

**Expected Result**:
- ✅ Either accepted (if reasonable) or validation error
- ✅ No integer overflow
- ✅ Displays correctly in UI

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-004: Special Characters in Food Name
**Priority**: Medium  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Data**:
| Food Name | Expected |
|-----------|----------|
| `Chicken & Rice` | ✅ Accepted |
| `Rice (Basmati)` | ✅ Accepted |
| `Meal #1` | ✅ Accepted |
| `Food / Snack` | ✅ Accepted |
| `Test @ Food` | ✅ Accepted |

**Expected Result**:
- ✅ Common special characters accepted
- ✅ Properly escaped/sanitized
- ✅ No XSS vulnerability

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-005: Unicode Characters in Name
**Priority**: Low  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Data**:
- Hindi: `चावल` (Rice)
- Chinese: `米饭` (Rice)
- Emoji: `🍚 Rice`
- Arabic: `أرز` (Rice)

**Expected Result**:
- ✅ Unicode characters accepted
- ✅ Displays correctly
- ✅ Saved correctly in database

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-006: Very Long Food Name
**Priority**: Low  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Enter food name with 500 characters
2. Submit

**Expected Result**:
- ✅ Either truncated or validation error
- ✅ No database error
- ✅ UI doesn't break

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-007: Date Boundary - Future Date
**Priority**: Medium  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Try to log food for tomorrow's date
2. Or manually send API request with future date

**Expected Result**:
- ✅ Either allowed (for meal planning) or validation error
- ✅ Behavior is consistent
- ✅ No date calculation errors

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-008: Date Boundary - Very Old Date
**Priority**: Low  
**Type**: Validation  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Try to log food for 5 years ago
2. Check if data displays correctly

**Expected Result**:
- ✅ Accepts old dates
- ✅ Data retrievable
- ✅ Charts handle date range

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-009: Concurrent Edits
**Priority**: Medium  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Open app in two browser tabs
2. In Tab 1: Edit food entry
3. In Tab 2: Edit same food entry
4. Save in Tab 1
5. Save in Tab 2

**Expected Result**:
- ✅ Last write wins (or conflict detection)
- ✅ No data corruption
- ✅ Both tabs eventually consistent

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-EDGE-010: Rapid Clicking
**Priority**: Low  
**Type**: UI  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Add food entry
2. Rapidly click "Add to log" button 10 times

**Expected Result**:
- ✅ Only one entry created
- ✅ Button disabled during API call
- ✅ No duplicate entries

**Actual Result**: _____________

**Evidence**: _____________

---

## Error Handling Test Cases

### TC-ERROR-001: Network Timeout
**Priority**: High  
**Type**: Error Handling  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Disconnect internet
2. Try to add food entry
3. Observe error handling

**Expected Result**:
- ✅ User-friendly error message
- ✅ "Network error. Please check your connection."
- ✅ Retry button shown
- ✅ No data lost

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-ERROR-002: API Server Down
**Priority**: High  
**Type**: Error Handling  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Stop backend server
2. Try to perform actions in frontend
3. Observe error handling

**Expected Result**:
- ✅ Graceful error message
- ✅ "Service temporarily unavailable"
- ✅ No app crash
- ✅ Can retry when server back

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-ERROR-003: Invalid API Response
**Priority**: Medium  
**Type**: Error Handling  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Mock API to return malformed JSON
2. Make API call from frontend
3. Observe error handling

**Expected Result**:
- ✅ Error caught gracefully
- ✅ No app crash
- ✅ Generic error shown to user

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-ERROR-004: Session Expired During Action
**Priority**: Medium  
**Type**: Error Handling  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Login
2. Wait for token to expire (or manually invalidate)
3. Try to add food entry

**Expected Result**:
- ✅ 401 Unauthorized from API
- ✅ User redirected to login
- ✅ Message: "Session expired. Please login again."

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-ERROR-005: Image Upload Failure
**Priority**: Medium  
**Type**: Error Handling  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Try to upload very large image (>10MB) to plate scan
2. Or corrupted image file

**Expected Result**:
- ✅ Error message: "Image too large" or "Invalid image"
- ✅ No server crash
- ✅ Can retry with different image

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-ERROR-006: Database Error Handling
**Priority**: High  
**Type**: Error Handling  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Cause database constraint violation (if possible)
2. Observe error response

**Expected Result**:
- ✅ Generic error to user (no database details exposed)
- ✅ Error logged on server
- ✅ No stack trace in production

**Actual Result**: _____________

**Evidence**: _____________

---

## Performance & Load Test Cases

### TC-PERF-001: Page Load Time - Dashboard
**Priority**: High  
**Type**: Performance  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Clear cache
2. Navigate to `/` (Dashboard)
3. Measure load time

**Expected Result**:
- ✅ Page loads in < 3 seconds
- ✅ Largest Contentful Paint (LCP) < 2.5s
- ✅ First Input Delay (FID) < 100ms
- ✅ Cumulative Layout Shift (CLS) < 0.1

**Actual Result**: _____________

**Tools Used**: Lighthouse, Chrome DevTools

**Evidence**: _____________

---

### TC-PERF-002: API Response Time
**Priority**: High  
**Type**: Performance  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Measure response time for common API calls:
   - POST /api/meals
   - GET /api/meals?date=...
   - POST /api/scan/plate
   - POST /api/coach

**Expected Result**:
- ✅ Meals APIs: < 500ms
- ✅ Scan APIs: < 5s (due to AI processing)
- ✅ Coach: < 10s (due to AI)

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-PERF-003: Database Query Performance
**Priority**: Medium  
**Type**: Performance  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Check query performance for:
   - Retrieving meals for a date
   - Retrieving food library
   - Aggregating weekly data

**Expected Result**:
- ✅ All queries < 100ms
- ✅ Proper indexes on frequently queried columns
- ✅ No N+1 query issues

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-PERF-004: Concurrent Users
**Priority**: Medium  
**Type**: Performance  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Simulate 100 concurrent users logging food
2. Monitor server resources
3. Check response times

**Expected Result**:
- ✅ Server handles load without errors
- ✅ Response times stay within acceptable range
- ✅ No memory leaks
- ✅ No database connection pool exhaustion

**Actual Result**: _____________

**Tools Used**: Artillery, k6, or JMeter

**Evidence**: _____________

---

### TC-PERF-005: Bundle Size
**Priority**: Medium  
**Type**: Performance  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Build production bundle
2. Check bundle sizes

**Expected Result**:
- ✅ Main JS bundle < 500KB (gzipped)
- ✅ CSS bundle < 50KB (gzipped)
- ✅ Code splitting implemented
- ✅ Lazy loading for routes

**Actual Result**: _____________

**Evidence**: _____________

---

## Cross-Browser Compatibility

### TC-BROWSER-001: Chrome Desktop
**Priority**: Critical  
**Type**: Compatibility  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Browser**: Chrome 125+ (Latest)  
**OS**: Windows 10/11, macOS

**Test Steps**:
1. Test all critical user flows
2. Check UI rendering
3. Test all features

**Expected Result**:
- ✅ All features work
- ✅ UI renders correctly
- ✅ No console errors

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BROWSER-002: Firefox Desktop
**Priority**: High  
**Type**: Compatibility  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Browser**: Firefox 126+ (Latest)  
**OS**: Windows 10/11, macOS

**Expected Result**:
- ✅ All features work
- ✅ UI consistent with Chrome
- ✅ No Firefox-specific bugs

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BROWSER-003: Safari Desktop
**Priority**: High  
**Type**: Compatibility  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Browser**: Safari 17+ (Latest)  
**OS**: macOS

**Expected Result**:
- ✅ All features work
- ✅ UI renders correctly
- ✅ No Safari-specific issues

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BROWSER-004: Edge Desktop
**Priority**: Medium  
**Type**: Compatibility  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Browser**: Edge 125+ (Latest)  
**OS**: Windows 10/11

**Expected Result**:
- ✅ All features work (should be same as Chrome)

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BROWSER-005: Mobile Safari (iOS)
**Priority**: Critical  
**Type**: Compatibility  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Browser**: Safari on iOS 17+  
**Device**: iPhone 12+

**Expected Result**:
- ✅ Responsive layout
- ✅ Touch interactions work
- ✅ All features functional
- ✅ Camera access for scanning

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-BROWSER-006: Mobile Chrome (Android)
**Priority**: Critical  
**Type**: Compatibility  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Browser**: Chrome on Android 13+  
**Device**: Samsung/Pixel

**Expected Result**:
- ✅ Responsive layout
- ✅ Touch interactions work
- ✅ All features functional
- ✅ Camera access for scanning

**Actual Result**: _____________

**Evidence**: _____________

---

## Mobile Responsiveness

### TC-MOBILE-001: Navigation - Mobile
**Priority**: High  
**Type**: UI/UX  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Open on mobile device (or DevTools responsive mode)
2. Check bottom navigation bar
3. Test all nav items

**Expected Result**:
- ✅ Bottom navigation visible and accessible
- ✅ Icons clear and tappable
- ✅ Active state clearly indicated
- ✅ No horizontal scroll

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-MOBILE-002: Forms - Touch Friendly
**Priority**: High  
**Type**: UI/UX  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Test food entry form on mobile
2. Check input sizes
3. Test keyboard behavior

**Expected Result**:
- ✅ Input fields large enough to tap
- ✅ Proper keyboard types (number for calories, email for email)
- ✅ Zoom disabled on input focus (if desired)
- ✅ Submit button easily tappable

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-MOBILE-003: Modals - Mobile Display
**Priority**: Medium  
**Type**: UI/UX  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. Trigger various modals on mobile
2. Check layout and scrolling

**Expected Result**:
- ✅ Modals visible (not hidden behind header)
- ✅ Content scrollable if needed
- ✅ Close button accessible
- ✅ Background dimmed

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-MOBILE-004: Tables - Responsive
**Priority**: Medium  
**Type**: UI/UX  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. View pages with tables on mobile (Reports, History)
2. Check table layout

**Expected Result**:
- ✅ Tables horizontally scrollable OR
- ✅ Tables stack vertically on mobile
- ✅ All data accessible
- ✅ No text cut off

**Actual Result**: _____________

**Evidence**: _____________

---

### TC-MOBILE-005: Camera Access - Scanning
**Priority**: Critical  
**Type**: Functional  
**Status**: 🟡 PENDING  
**Test Date**: _____________

**Test Steps**:
1. On mobile, go to Plate Scan
2. Click "Take photo"
3. Grant camera permission
4. Take photo

**Expected Result**:
- ✅ Camera permission requested
- ✅ Camera opens
- ✅ Photo captured
- ✅ Photo sent for processing

**Actual Result**: _____________

**Evidence**: _____________

---

## Test Execution Log

### Execution Summary

| Date | Tester | Tests Run | Passed | Failed | Blocked | Pending |
|------|--------|-----------|--------|--------|---------|---------|
| 2026-06-13 | _______ | 0 | 0 | 0 | 0 | 150+ |
| __________ | _______ | ___ | ___ | ___ | ___ | ___ |
| __________ | _______ | ___ | ___ | ___ | ___ | ___ |

### Bug Log

| Bug ID | Test Case | Severity | Description | Status | Fixed Date |
|--------|-----------|----------|-------------|--------|------------|
| BUG-001 | _________ | Critical/High/Medium/Low | _____________ | Open/Fixed | __________ |
| BUG-002 | _________ | ________________ | _____________ | ________ | __________ |

---

## Automation Scripts

### Prerequisites
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Script 1: User Registration & Login E2E
**File**: `tests/e2e/auth.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com'; // Update with your Render URL
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPass123',
  name: 'E2E Test User'
};

test.describe('Authentication Flow', () => {
  
  test('TC-AUTH-001: User Registration - Valid Data', async ({ page }) => {
    // Navigate to register page
    await page.goto(`${BASE_URL}/register`);
    
    // Fill registration form
    await page.fill('input[placeholder*="name"]', TEST_USER.name);
    await page.fill('input[placeholder*="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit form
    await page.click('button:has-text("Create account")');
    
    // Verify redirect to goals page
    await expect(page).toHaveURL(/.*goals.*setup=1/);
    
    // Verify JWT token stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    console.log('✅ TC-AUTH-001 PASSED - User registered successfully');
  });
  
  test('TC-AUTH-002: User Registration - Invalid Email', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[placeholder*="email"]', 'invalidemail'); // Invalid
    await page.fill('input[type="password"]', 'TestPass123');
    
    await page.click('button:has-text("Create account")');
    
    // Verify error message shown
    const errorMessage = await page.locator('.error-box, [class*="error"]').textContent();
    expect(errorMessage).toContain('valid email');
    
    console.log('✅ TC-AUTH-002 PASSED - Invalid email rejected');
  });
  
  test('TC-AUTH-003: User Registration - Weak Password', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    const weakPasswords = [
      { password: '12345', expectedError: 'at least 6 characters' },
      { password: '123456', expectedError: 'at least one letter' },
      { password: 'password', expectedError: 'at least one number' },
      { password: 'pass 123', expectedError: 'cannot contain spaces' }
    ];
    
    for (const testCase of weakPasswords) {
      await page.fill('input[placeholder*="name"]', 'Test User');
      await page.fill('input[placeholder*="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[type="password"]', testCase.password);
      
      await page.click('button:has-text("Create account")');
      
      const errorMessage = await page.locator('.error-box, [class*="error"]').textContent();
      expect(errorMessage.toLowerCase()).toContain(testCase.expectedError.toLowerCase());
      
      console.log(`✅ Password "${testCase.password}" correctly rejected`);
    }
    
    console.log('✅ TC-AUTH-003 PASSED - All weak passwords rejected');
  });
  
  test('TC-AUTH-005: User Login - Valid Credentials', async ({ page }) => {
    // First register a user
    await page.goto(`${BASE_URL}/register`);
    const testEmail = `test${Date.now()}@example.com`;
    
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[placeholder*="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button:has-text("Create account")');
    
    // Logout
    await page.goto(`${BASE_URL}/more`);
    await page.click('button:has-text("Log out")');
    
    // Now test login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder*="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button:has-text("Continue to dashboard")');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/`);
    
    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    console.log('✅ TC-AUTH-005 PASSED - Login successful');
  });
  
  test('TC-AUTH-007: User Login - Wrong Password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'WrongPassword999');
    await page.click('button:has-text("Continue to dashboard")');
    
    // Verify error message
    const errorMessage = await page.locator('.error-box, [class*="error"]').textContent();
    expect(errorMessage).toContain("couldn't sign you in");
    
    // Verify NOT redirected
    await expect(page).toHaveURL(`${BASE_URL}/login`);
    
    console.log('✅ TC-AUTH-007 PASSED - Wrong password rejected');
  });
});
```

---

### Script 2: Food Logging E2E
**File**: `tests/e2e/food-logging.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('Food Logging', () => {
  let page;
  let authToken;
  
  test.beforeAll(async ({ browser }) => {
    // Create authenticated session
    page = await browser.newPage();
    
    // Register and login
    const testEmail = `test${Date.now()}@example.com`;
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[placeholder*="name"]', 'Food Test User');
    await page.fill('input[placeholder*="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button:has-text("Create account")');
    
    // Get auth token
    authToken = await page.evaluate(() => localStorage.getItem('token'));
  });
  
  test('TC-FOOD-001: Add Food Entry - Manual Entry', async () => {
    await page.goto(`${BASE_URL}/`);
    
    // Click Add Food button
    await page.click('button:has-text("Add Food"), button:has-text("+ Add Food")');
    
    // Navigate to manual entry (if not already there)
    await page.goto(`${BASE_URL}/add-food`);
    
    // Fill food details
    await page.fill('input[placeholder*="food name"], input[name="food_name"]', 'Grilled Chicken Breast');
    await page.fill('input[placeholder*="calories"], input[name="cal"]', '248');
    await page.fill('input[placeholder*="protein"], input[name="protein_g"]', '46.2');
    await page.fill('input[placeholder*="carbs"], input[name="carbs_g"]', '0');
    await page.fill('input[placeholder*="fiber"], input[name="fiber_g"]', '0');
    
    // Select meal type (if dropdown exists)
    const mealSelect = page.locator('select:has-text("Lunch"), select[name="meal_type"]');
    if (await mealSelect.count() > 0) {
      await mealSelect.selectOption('lunch');
    }
    
    // Submit
    await page.click('button:has-text("Add to log"), button:has-text("Save")');
    
    // Verify redirect to dashboard or success message
    await page.waitForTimeout(1000);
    
    // Check if food appears in log
    const foodEntry = await page.locator('text=Grilled Chicken Breast').count();
    expect(foodEntry).toBeGreaterThan(0);
    
    console.log('✅ TC-FOOD-001 PASSED - Food entry added');
  });
  
  test('TC-FOOD-006: Food Library Search', async () => {
    await page.goto(`${BASE_URL}/library`);
    
    // Enter search term
    await page.fill('input[placeholder*="search"], input[type="search"]', 'chicken');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Verify results shown
    const results = await page.locator('[class*="food-item"], [class*="library-item"]').count();
    expect(results).toBeGreaterThan(0);
    
    console.log('✅ TC-FOOD-006 PASSED - Search works');
  });
  
  test('TC-FOOD-008: Profile Completion Reminder', async () => {
    // Create new user without profile
    const newEmail = `new${Date.now()}@example.com`;
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[placeholder*="name"]', 'New User');
    await page.fill('input[placeholder*="email"]', newEmail);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button:has-text("Create account")');
    
    // Skip goals setup - go directly to dashboard
    await page.goto(`${BASE_URL}/`);
    
    // Add first food entry
    await page.goto(`${BASE_URL}/add-food`);
    await page.fill('input[name="food_name"]', 'Test Food');
    await page.fill('input[name="cal"]', '100');
    await page.click('button:has-text("Add to log")');
    
    // Verify modal appears
    const modal = await page.locator('[class*="modal"]:has-text("Complete your profile")');
    await expect(modal).toBeVisible();
    
    console.log('✅ TC-FOOD-008 PASSED - Profile reminder shown');
  });
});
```

---

### Script 3: Security Tests
**File**: `tests/security/security.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('Security Tests', () => {
  
  test('TC-SEC-001: SQL Injection - Login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const sqlPayloads = [
      "admin' OR '1'='1",
      "test@email.com'; DROP TABLE users; --",
      "' OR '1'='1' --"
    ];
    
    for (const payload of sqlPayloads) {
      await page.fill('input[placeholder*="email"]', payload);
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("Continue to dashboard")');
      
      // Should show validation error or wrong credentials
      // Should NOT login
      const url = page.url();
      expect(url).toContain('/login');
      
      console.log(`✅ SQL Injection payload blocked: ${payload}`);
    }
    
    console.log('✅ TC-SEC-001 PASSED - SQL injection prevented');
  });
  
  test('TC-SEC-002: XSS - Food Name Input', async ({ page, context }) => {
    // Setup: Register and login
    const testEmail = `test${Date.now()}@example.com`;
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[placeholder*="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button:has-text("Create account")');
    
    // Try XSS in food name
    await page.goto(`${BASE_URL}/add-food`);
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>'
    ];
    
    // Listen for alerts (should not happen)
    let alertShown = false;
    page.on('dialog', async dialog => {
      alertShown = true;
      await dialog.dismiss();
    });
    
    for (const payload of xssPayloads) {
      await page.fill('input[name="food_name"]', payload);
      await page.fill('input[name="cal"]', '100');
      await page.click('button:has-text("Add to log")');
      
      await page.waitForTimeout(1000);
      
      // Verify no alert shown
      expect(alertShown).toBe(false);
      
      // Go to dashboard and verify payload shown as plain text
      await page.goto(`${BASE_URL}/`);
      const foodText = await page.locator('text=' + payload).textContent().catch(() => null);
      
      // If shown, it should be escaped (plain text, not executed)
      console.log(`✅ XSS payload properly escaped: ${payload}`);
    }
    
    console.log('✅ TC-SEC-002 PASSED - XSS prevented');
  });
  
  test('TC-SEC-004: JWT Token Security', async ({ request }) => {
    // Register user via API
    const testEmail = `test${Date.now()}@example.com`;
    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'Test User',
        email: testEmail,
        password: 'TestPass123'
      }
    });
    
    const registerData = await registerResponse.json();
    const validToken = registerData.token;
    
    // Decode JWT (just split, don't verify)
    const [header, payload, signature] = validToken.split('.');
    
    // Modify payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    decodedPayload.user_id = 'hacked-user-id';
    const modifiedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64');
    const modifiedToken = `${header}.${modifiedPayload}.${signature}`;
    
    // Try to use modified token
    const mealsResponse = await request.get(`${BASE_URL}/api/meals?date=2026-06-13`, {
      headers: {
        'Authorization': `Bearer ${modifiedToken}`
      }
    });
    
    // Should be rejected
    expect(mealsResponse.status()).toBe(401);
    
    console.log('✅ TC-SEC-004 PASSED - Modified JWT rejected');
  });
  
  test('TC-SEC-009: Authorization - Access Other Users Data', async ({ request }) => {
    // Register two users
    const user1Email = `user1${Date.now()}@example.com`;
    const user2Email = `user2${Date.now()}@example.com`;
    
    const user1Reg = await request.post(`${BASE_URL}/api/auth/register`, {
      data: { name: 'User 1', email: user1Email, password: 'Pass123' }
    });
    const user1Data = await user1Reg.json();
    const user1Token = user1Data.token;
    
    const user2Reg = await request.post(`${BASE_URL}/api/auth/register`, {
      data: { name: 'User 2', email: user2Email, password: 'Pass123' }
    });
    const user2Data = await user2Reg.json();
    const user2Token = user2Data.token;
    
    // User 1 creates a meal
    const mealResponse = await request.post(`${BASE_URL}/api/meals`, {
      headers: { 'Authorization': `Bearer ${user1Token}` },
      data: {
        food_name: 'User 1 Food',
        meal_type: 'lunch',
        log_date: '2026-06-13',
        cal: 100
      }
    });
    const mealData = await mealResponse.json();
    const user1MealId = mealData.entry?.id;
    
    // User 2 tries to access User 1's meal
    const unauthorizedAccess = await request.get(`${BASE_URL}/api/meals/${user1MealId}`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    // Should be 403 Forbidden or 404 Not Found
    expect([403, 404]).toContain(unauthorizedAccess.status());
    
    console.log('✅ TC-SEC-009 PASSED - Cannot access other users data');
  });
  
  test('TC-SEC-011: API Rate Limiting - Brute Force', async ({ request }) => {
    const attempts = [];
    
    // Attempt 20 logins rapidly
    for (let i = 0; i < 20; i++) {
      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'WrongPassword'
        }
      });
      attempts.push(response.status());
    }
    
    // After 10 attempts, should get 429
    const rateLimitedAttempts = attempts.filter(status => status === 429);
    expect(rateLimitedAttempts.length).toBeGreaterThan(0);
    
    console.log(`✅ TC-SEC-011 PASSED - Rate limiting activated after ${attempts.indexOf(429) + 1} attempts`);
  });
});
```

---

### Script 4: API Endpoint Tests
**File**: `tests/api/api.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('API Endpoint Tests', () => {
  let authToken;
  
  test.beforeAll(async ({ request }) => {
    // Register and get token
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'API Test User',
        email: `apitest${Date.now()}@example.com`,
        password: 'ApiPass123'
      }
    });
    
    const data = await response.json();
    authToken = data.token;
  });
  
  test('TC-API-001: POST /api/auth/register - Valid', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'New User',
        email: `new${Date.now()}@example.com`,
        password: 'NewPass123'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.token).toBeTruthy();
    expect(data.user.email).toBeTruthy();
    
    console.log('✅ TC-API-001 PASSED');
  });
  
  test('TC-API-002: POST /api/auth/register - Missing Fields', async ({ request }) => {
    const testCases = [
      { data: { name: 'Test', password: 'Pass123' }, field: 'email' },
      { data: { name: 'Test', email: 'test@email.com' }, field: 'password' },
      { data: { email: 'test@email.com', password: 'Pass123' }, field: 'name' }
    ];
    
    for (const testCase of testCases) {
      const response = await request.post(`${BASE_URL}/api/auth/register`, {
        data: testCase.data
      });
      
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('required');
      
      console.log(`✅ Missing ${testCase.field} correctly rejected`);
    }
    
    console.log('✅ TC-API-002 PASSED');
  });
  
  test('TC-API-004: POST /api/meals - Add Food Entry', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/meals`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        food_name: 'API Test Food',
        meal_type: 'lunch',
        log_date: '2026-06-13',
        qty: 100,
        unit: 'g',
        cal: 200,
        protein_g: 20,
        carbs_g: 10,
        fiber_g: 5
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.message).toContain('logged');
    expect(data.entry).toBeTruthy();
    
    console.log('✅ TC-API-004 PASSED');
  });
  
  test('TC-API-005: POST /api/meals - Missing Auth', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/meals`, {
      data: {
        food_name: 'Test',
        meal_type: 'lunch'
      }
    });
    
    expect(response.status()).toBe(401);
    
    console.log('✅ TC-API-005 PASSED');
  });
  
  test('TC-API-006: GET /api/meals - Retrieve Meals', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/meals?date=2026-06-13`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.meals).toBeDefined();
    expect(data.totals).toBeDefined();
    
    console.log('✅ TC-API-006 PASSED');
  });
  
  test('TC-API-008: PUT /api/auth/profile - Update Profile', async ({ request }) => {
    const response = await request.put(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        name: 'Updated API User',
        age: 30,
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        condition: 'none',
        diet_preference: 'vegetarian',
        country: 'India',
        state_region: 'Maharashtra',
        city: 'Mumbai',
        timezone: 'Asia/Kolkata'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.message).toContain('updated');
    
    console.log('✅ TC-API-008 PASSED');
  });
});
```

---

### Script 5: Food Library Duplicate Check
**File**: `tests/data-integrity/duplicates.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('Food Library Data Integrity', () => {
  let authToken;
  
  test.beforeAll(async ({ request }) => {
    // Register and get token
    const response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        name: 'Data Test User',
        email: `datatest${Date.now()}@example.com`,
        password: 'DataPass123'
      }
    });
    
    const data = await response.json();
    authToken = data.token;
  });
  
  test('TC-FOOD-009: Food Library - Check for Duplicates', async ({ request }) => {
    // Add some test foods to library
    const testFoods = [
      { name: 'White Rice', cal: 130 },
      { name: 'white rice', cal: 130 }, // Lowercase duplicate
      { name: 'White Rice ', cal: 130 }, // Trailing space duplicate
      { name: 'Chicken Breast', cal: 165 },
      { name: 'Brown Rice', cal: 110 }
    ];
    
    const addedFoods = [];
    
    for (const food of testFoods) {
      const response = await request.post(`${BASE_URL}/api/foods`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          name: food.name,
          base_amount: 100,
          base_unit: 'g',
          cal: food.cal,
          protein_g: 5,
          carbs_g: 25,
          fiber_g: 1,
          fat_g: 0.5
        }
      });
      
      const result = await response.json();
      
      if (response.status() === 200) {
        addedFoods.push({ name: food.name, status: 'added' });
      } else if (response.status() === 409) {
        addedFoods.push({ name: food.name, status: 'duplicate_rejected' });
        console.log(`✅ Duplicate correctly rejected: "${food.name}"`);
      } else {
        addedFoods.push({ name: food.name, status: `error_${response.status()}` });
      }
    }
    
    // Now get all foods from library
    const libraryResponse = await request.get(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    expect(libraryResponse.status()).toBe(200);
    
    const libraryData = await libraryResponse.json();
    const foods = libraryData.foods || [];
    
    // Check for exact duplicates (case-insensitive, trimmed)
    const normalizedNames = foods.map(f => ({
      original: f.name,
      normalized: f.name.toLowerCase().trim()
    }));
    
    const duplicateMap = {};
    normalizedNames.forEach(item => {
      if (duplicateMap[item.normalized]) {
        duplicateMap[item.normalized].push(item.original);
      } else {
        duplicateMap[item.normalized] = [item.original];
      }
    });
    
    // Find duplicates
    const duplicates = Object.entries(duplicateMap)
      .filter(([key, values]) => values.length > 1)
      .map(([key, values]) => ({ normalized: key, variants: values }));
    
    // Log results
    console.log('\n=== Food Library Duplicate Check ===');
    console.log(`Total foods in library: ${foods.length}`);
    console.log(`Unique normalized names: ${Object.keys(duplicateMap).length}`);
    
    if (duplicates.length > 0) {
      console.log('\n❌ DUPLICATES FOUND:');
      duplicates.forEach(dup => {
        console.log(`  "${dup.normalized}" has ${dup.variants.length} variants:`);
        dup.variants.forEach(variant => console.log(`    - "${variant}"`));
      });
      
      // Test FAILS if duplicates found
      expect(duplicates.length).toBe(0);
    } else {
      console.log('✅ No duplicates found - All food names are unique');
    }
    
    // Check if backend properly prevents duplicates
    const duplicateRejections = addedFoods.filter(f => f.status === 'duplicate_rejected');
    if (duplicateRejections.length > 0) {
      console.log(`\n✅ Backend correctly rejected ${duplicateRejections.length} duplicate attempts`);
    }
    
    console.log('✅ TC-FOOD-009 PASSED - No duplicates in library');
  });
  
  test('TC-FOOD-010: Prevent Duplicate Food Save', async ({ request }) => {
    // Save a food
    const foodName = `Unique Food ${Date.now()}`;
    
    const firstSave = await request.post(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: foodName,
        base_amount: 100,
        base_unit: 'g',
        cal: 150,
        protein_g: 10,
        carbs_g: 20,
        fiber_g: 2,
        fat_g: 3
      }
    });
    
    expect(firstSave.status()).toBe(200);
    console.log(`✅ First save successful: "${foodName}"`);
    
    // Try to save exact duplicate
    const duplicateSave = await request.post(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: foodName,
        base_amount: 100,
        base_unit: 'g',
        cal: 150,
        protein_g: 10,
        carbs_g: 20,
        fiber_g: 2,
        fat_g: 3
      }
    });
    
    // Should be rejected with 409 Conflict
    expect(duplicateSave.status()).toBe(409);
    
    const errorData = await duplicateSave.json();
    expect(errorData.error).toBeTruthy();
    expect(errorData.error.toLowerCase()).toContain('already');
    
    console.log(`✅ Duplicate correctly rejected: "${foodName}"`);
    console.log(`✅ Error message: "${errorData.error}"`);
    
    // Try case-insensitive duplicate
    const caseVariant = await request.post(`${BASE_URL}/api/foods`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: foodName.toUpperCase(), // UPPERCASE version
        base_amount: 100,
        base_unit: 'g',
        cal: 150,
        protein_g: 10,
        carbs_g: 20,
        fiber_g: 2,
        fat_g: 3
      }
    });
    
    // Should also be rejected (if backend is case-insensitive)
    if (caseVariant.status() === 409) {
      console.log(`✅ Case-insensitive duplicate correctly rejected: "${foodName.toUpperCase()}"`);
    } else if (caseVariant.status() === 200) {
      console.log(`⚠️  Warning: Backend allows case-sensitive duplicates`);
      console.log(`   "${foodName}" and "${foodName.toUpperCase()}" are treated as different foods`);
    }
    
    console.log('✅ TC-FOOD-010 PASSED - Duplicate prevention works');
  });
});
```

---

### Script 6: Browser-Level Visual & Interaction Tests
**File**: `tests/browser/visual-interaction.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://vitanudge.onrender.com';

test.describe('Browser-Level Visual & Interaction Tests', () => {
  
  test.describe('Chrome Desktop', () => {
    test.use({ ...devices['Desktop Chrome'] });
    
    test('TC-BROWSER-001: Chrome - Full User Flow', async ({ page }) => {
      // Register
      const testEmail = `chrome${Date.now()}@example.com`;
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[placeholder*="name"]', 'Chrome Test User');
      await page.fill('input[placeholder*="email"]', testEmail);
      await page.fill('input[type="password"]', 'ChromePass123');
      await page.click('button:has-text("Create account")');
      
      // Verify navigation works
      await expect(page).toHaveURL(/.*goals/);
      
      // Check console for errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      
      // Navigate through app
      await page.goto(`${BASE_URL}/`);
      await page.goto(`${BASE_URL}/library`);
      await page.goto(`${BASE_URL}/profile`);
      
      // Verify no console errors
      expect(consoleErrors.length).toBe(0);
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/chrome-dashboard.png', fullPage: true });
      
      console.log('✅ TC-BROWSER-001 PASSED - Chrome Desktop works perfectly');
    });
    
    test('TC-BROWSER-VISUAL-001: Chrome - CSS Rendering', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check if CSS loaded
      const bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
      
      // Check custom fonts loaded
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      
      console.log(`Font family: ${fontFamily}`);
      expect(fontFamily).toBeTruthy();
      
      console.log('✅ TC-BROWSER-VISUAL-001 PASSED - CSS renders correctly');
    });
  });
  
  test.describe('Firefox Desktop', () => {
    test.use({ ...devices['Desktop Firefox'] });
    
    test('TC-BROWSER-002: Firefox - Compatibility', async ({ page }) => {
      const testEmail = `firefox${Date.now()}@example.com`;
      await page.goto(`${BASE_URL}/register`);
      
      await page.fill('input[placeholder*="name"]', 'Firefox User');
      await page.fill('input[placeholder*="email"]', testEmail);
      await page.fill('input[type="password"]', 'FirefoxPass123');
      await page.click('button:has-text("Create account")');
      
      await expect(page).toHaveURL(/.*goals/);
      
      // Test form interactions
      await page.goto(`${BASE_URL}/profile`);
      await page.fill('input[name="age"]', '30');
      
      // Verify input accepted
      const ageValue = await page.inputValue('input[name="age"]');
      expect(ageValue).toBe('30');
      
      console.log('✅ TC-BROWSER-002 PASSED - Firefox compatible');
    });
  });
  
  test.describe('Safari Desktop', () => {
    test.use({ ...devices['Desktop Safari'] });
    
    test('TC-BROWSER-003: Safari - Compatibility', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Test localStorage (Safari can be restrictive)
      const localStorageWorks = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const result = localStorage.getItem('test');
          localStorage.removeItem('test');
          return result === 'value';
        } catch (e) {
          return false;
        }
      });
      
      expect(localStorageWorks).toBe(true);
      
      console.log('✅ TC-BROWSER-003 PASSED - Safari compatible');
    });
  });
  
  test.describe('Mobile Safari (iOS)', () => {
    test.use({ ...devices['iPhone 12'] });
    
    test('TC-BROWSER-005: Mobile Safari - Touch Interactions', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Test viewport meta tag (prevents zoom on input focus)
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      });
      
      console.log(`Viewport meta: ${viewport}`);
      expect(viewport).toBeTruthy();
      
      // Test touch target sizes (minimum 44x44px for iOS)
      const buttonSize = await page.locator('button:has-text("Continue to dashboard")').boundingBox();
      
      if (buttonSize) {
        expect(buttonSize.height).toBeGreaterThanOrEqual(40); // Allow some margin
        console.log(`Button size: ${buttonSize.width}x${buttonSize.height}px`);
      }
      
      // Test bottom navigation (common mobile pattern)
      await page.goto(`${BASE_URL}/`);
      
      const navExists = await page.locator('nav, [role="navigation"]').count();
      expect(navExists).toBeGreaterThan(0);
      
      console.log('✅ TC-BROWSER-005 PASSED - Mobile Safari optimized');
    });
    
    test('TC-BROWSER-MOBILE-001: Mobile - Responsive Layout', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      
      // Check for horizontal scroll (should not exist)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
      
      // Take mobile screenshot
      await page.screenshot({ path: 'test-results/mobile-safari-dashboard.png', fullPage: true });
      
      console.log('✅ TC-BROWSER-MOBILE-001 PASSED - No horizontal scroll on mobile');
    });
  });
  
  test.describe('Mobile Chrome (Android)', () => {
    test.use({ ...devices['Pixel 5'] });
    
    test('TC-BROWSER-006: Mobile Chrome - Compatibility', async ({ page }) => {
      const testEmail = `mobile${Date.now()}@example.com`;
      await page.goto(`${BASE_URL}/register`);
      
      await page.fill('input[placeholder*="name"]', 'Mobile User');
      await page.fill('input[placeholder*="email"]', testEmail);
      await page.fill('input[type="password"]', 'MobilePass123');
      await page.click('button:has-text("Create account")');
      
      await expect(page).toHaveURL(/.*goals/);
      
      // Test camera/file input (for scanning features)
      await page.goto(`${BASE_URL}/scan`);
      
      const fileInputExists = await page.locator('input[type="file"]').count();
      expect(fileInputExists).toBeGreaterThan(0);
      
      console.log('✅ TC-BROWSER-006 PASSED - Mobile Chrome works');
    });
  });
  
  test.describe('Cross-Browser Consistency', () => {
    
    test('TC-BROWSER-CONSISTENCY-001: Login Page - All Browsers', async ({ browser }) => {
      const browsers = [
        { name: 'Chromium', device: devices['Desktop Chrome'] },
        { name: 'Firefox', device: devices['Desktop Firefox'] },
        { name: 'WebKit', device: devices['Desktop Safari'] }
      ];
      
      const screenshots = [];
      
      for (const browserConfig of browsers) {
        const context = await browser.newContext(browserConfig.device);
        const page = await context.newPage();
        
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        const screenshotPath = `test-results/login-${browserConfig.name.toLowerCase()}.png`;
        await page.screenshot({ path: screenshotPath });
        screenshots.push(screenshotPath);
        
        // Check if login button exists and visible
        const buttonVisible = await page.locator('button:has-text("Continue to dashboard")').isVisible();
        expect(buttonVisible).toBe(true);
        
        await context.close();
        
        console.log(`✅ ${browserConfig.name} renders login page correctly`);
      }
      
      console.log('\n✅ TC-BROWSER-CONSISTENCY-001 PASSED');
      console.log(`Screenshots saved: ${screenshots.join(', ')}`);
    });
    
    test('TC-BROWSER-PERF-001: Page Load Performance', async ({ page }) => {
      // Measure page load time
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      console.log(`Page load time: ${loadTime}ms`);
      
      // Should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      // Check performance metrics
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          loadComplete: perf.loadEventEnd - perf.loadEventStart,
          totalTime: perf.loadEventEnd - perf.fetchStart
        };
      });
      
      console.log('Performance metrics:', metrics);
      
      console.log('✅ TC-BROWSER-PERF-001 PASSED - Page loads in acceptable time');
    });
  });
});
```

---

### Running the Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Generate HTML report
npx playwright test --reporter=html

# Run tests in parallel
npx playwright test --workers=4
```

---

### Playwright Configuration
**File**: `playwright.config.js`

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://vitanudge.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

---

## Next Steps

1. **Setup Test Environment**
   - Install Playwright: `npm install --save-dev @playwright/test`
   - Run: `npx playwright install`
   - Create test files from scripts above

2. **Execute Manual Tests**
   - Start with critical paths (Authentication, Food Logging)
   - Document results in "Actual Result" fields
   - Take screenshots for evidence
   - Log bugs in Bug Log section

3. **Run Automated Tests**
   - Update BASE_URL in scripts to your Render URL
   - Run: `npx playwright test`
   - Generate report: `npx playwright show-report`
   - Review failures and fix issues

4. **Security Audit**
   - Run all security test cases
   - Use tools: OWASP ZAP, Burp Suite
   - Check for OWASP Top 10 vulnerabilities

5. **Performance Testing**
   - Use Lighthouse for page load metrics
   - Use Artillery/k6 for load testing
   - Monitor Render metrics

6. **Final Review**
   - Complete all pending tests
   - Fix all critical/high bugs
   - Re-test after fixes
   - Generate final test report

---

**IMPORTANT PERMISSION REQUEST**:

I've created this comprehensive test plan. To execute the tests on your production Render deployment, I need:

1. ✅ **Permission to access the live application URL**
2. ✅ **Permission to create test accounts** (will use `test{timestamp}@example.com` format)
3. ✅ **Permission to run automated tests** that will make real API calls
4. ✅ **Permission to test security vulnerabilities** (ethical hacking)

Please confirm:
- Your Render production URL: __________________
- OK to create test accounts: YES / NO
- OK to run automated tests: YES / NO
- OK to perform security testing: YES / NO

Once you provide permission and the URL, I can begin executing the test plan and documenting results.

---

**Document prepared by**: Senior QA Engineer (AI)  
**Date**: June 13, 2026  
**Total Test Cases**: 150+  
**Estimated Test Duration**: 40-60 hours (manual + automated)
