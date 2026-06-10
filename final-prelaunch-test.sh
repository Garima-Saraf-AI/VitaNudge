#!/bin/bash

# Final Pre-Launch E2E Test Suite
# Runs comprehensive automated tests against production

API="https://vitanudge-api.onrender.com"
FRONTEND="https://vitanudge.onrender.com"
TIMESTAMP=$(date +%s)
EMAIL="prelaunch${TIMESTAMP}@test.com"
PASSWORD="Test1234!"
TOKEN=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0
BLOCKERS=0

log_test() {
    echo -e "\n${YELLOW}[TEST $((TOTAL+1))]${NC} $1"
}

pass() {
    TOTAL=$((TOTAL+1))
    PASSED=$((PASSED+1))
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

fail() {
    TOTAL=$((TOTAL+1))
    FAILED=$((FAILED+1))
    echo -e "${RED}✗ FAIL${NC}: $1"
    if [ "$2" == "BLOCKER" ]; then
        BLOCKERS=$((BLOCKERS+1))
        echo -e "${RED}  🚨 CRITICAL BLOCKER${NC}"
    fi
}

echo "======================================"
echo "  FINAL PRE-LAUNCH E2E TEST SUITE"
echo "======================================"
echo "API: $API"
echo "Frontend: $FRONTEND"
echo "Test User: $EMAIL"
echo "Start Time: $(date)"
echo "======================================"

# ============================================
# PHASE 1: AUTHENTICATION
# ============================================
echo -e "\n${YELLOW}═══ PHASE 1: AUTHENTICATION ═══${NC}"

log_test "Register new user"
REGISTER_RESPONSE=$(curl -s -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    pass "User registered successfully"
else
    fail "Registration failed: $(echo $REGISTER_RESPONSE | jq -r '.error')" "BLOCKER"
    exit 1
fi

log_test "Register duplicate email (should fail)"
DUP_RESPONSE=$(curl -s -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Duplicate\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

DUP_ERROR=$(echo "$DUP_RESPONSE" | jq -r '.error')
if [[ "$DUP_ERROR" == *"already exists"* ]] || [[ "$DUP_ERROR" == *"duplicate"* ]]; then
    pass "Duplicate email rejected"
else
    fail "Should reject duplicate email"
fi

log_test "Login with correct credentials"
LOGIN_RESPONSE=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
if [ -n "$LOGIN_TOKEN" ] && [ "$LOGIN_TOKEN" != "null" ]; then
    pass "Login successful"
    TOKEN="$LOGIN_TOKEN"
else
    fail "Login failed" "BLOCKER"
fi

log_test "Login with wrong password (should fail)"
WRONG_RESPONSE=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPass123!\"}")

WRONG_ERROR=$(echo "$WRONG_RESPONSE" | jq -r '.error')
if [[ "$WRONG_ERROR" == *"Invalid"* ]] || [[ "$WRONG_ERROR" == *"credentials"* ]]; then
    pass "Wrong password rejected"
else
    fail "Should reject wrong password"
fi

# ============================================
# PHASE 2: GOALS & DASHBOARD SYNC
# ============================================
echo -e "\n${YELLOW}═══ PHASE 2: GOALS & DASHBOARD SYNC ═══${NC}"

log_test "Set goals (2100/135/110)"
GOALS_RESPONSE=$(curl -s -X PUT "$API/api/health/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cal":2100,"protein_g":135,"fiber_g":35,"carbs_g":110}')

GOALS_CAL=$(echo "$GOALS_RESPONSE" | jq -r '.goals.cal')
if [ "$GOALS_CAL" == "2100" ]; then
    pass "Goals saved: 2100 kcal"
else
    fail "Goals not saved correctly"
fi

log_test "Verify dashboard shows updated goals"
SUMMARY_RESPONSE=$(curl -s "$API/api/health/summary?date=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN")

SUMMARY_CAL=$(echo "$SUMMARY_RESPONSE" | jq -r '.goals.cal')
SUMMARY_PROTEIN=$(echo "$SUMMARY_RESPONSE" | jq -r '.goals.protein_g')
if [ "$SUMMARY_CAL" == "2100" ] && [ "$SUMMARY_PROTEIN" == "135" ]; then
    pass "Dashboard syncs goals correctly"
else
    fail "Dashboard shows wrong goals: $SUMMARY_CAL/$SUMMARY_PROTEIN (expected 2100/135)"
fi

log_test "Invalid goals (negative calories - should reject)"
NEG_GOALS=$(curl -s -X PUT "$API/api/health/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cal":-500}')

NEG_ERROR=$(echo "$NEG_GOALS" | jq -r '.error')
if [[ "$NEG_ERROR" == *"negative"* ]] || [[ "$NEG_ERROR" == *"cannot be"* ]]; then
    pass "Negative calories rejected"
else
    fail "Should reject negative calories"
fi

# ============================================
# PHASE 3: DATE VALIDATION
# ============================================
echo -e "\n${YELLOW}═══ PHASE 3: DATE VALIDATION ═══${NC}"

log_test "Invalid date 2026-02-31 (should reject)"
INVALID_DATE=$(curl -s -X POST "$API/api/meals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"food_name":"Test","meal_type":"breakfast","log_date":"2026-02-31","qty":100,"unit":"g","cal":100,"protein_g":5,"fiber_g":2,"carbs_g":20,"fat_g":3}')

DATE_ERROR=$(echo "$INVALID_DATE" | jq -r '.error')
if [[ "$DATE_ERROR" == *"valid calendar date"* ]] || [[ "$DATE_ERROR" == *"invalid"* ]]; then
    pass "Invalid date 2026-02-31 rejected"
else
    fail "Should reject invalid date 2026-02-31"
fi

log_test "Valid date logging"
VALID_MEAL=$(curl -s -X POST "$API/api/meals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"food_name\":\"Test Food\",\"meal_type\":\"breakfast\",\"log_date\":\"$(date +%Y-%m-%d)\",\"qty\":100,\"unit\":\"g\",\"cal\":100,\"protein_g\":5,\"fiber_g\":2,\"carbs_g\":20,\"fat_g\":3}")

MEAL_ID=$(echo "$VALID_MEAL" | jq -r '.entry.id // empty')
if [ -n "$MEAL_ID" ] && [ "$MEAL_ID" != "null" ]; then
    pass "Valid date meal logged"
else
    fail "Valid date meal failed: $(echo $VALID_MEAL | jq -r '.error')"
fi

# ============================================
# PHASE 4: WATER TIMEZONE
# ============================================
echo -e "\n${YELLOW}═══ PHASE 4: WATER TIMEZONE ═══${NC}"

log_test "Water log timezone (should use user timezone, not UTC)"
WATER_RESPONSE=$(curl -s -X POST "$API/api/health/water" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"log_date\":\"$(date +%Y-%m-%d)\",\"ml\":250}")

LOGGED_AT=$(echo "$WATER_RESPONSE" | jq -r '.entry.logged_at')
if [[ "$LOGGED_AT" != *"T"* ]] && [ -n "$LOGGED_AT" ]; then
    pass "Water timezone uses local format: $LOGGED_AT"
else
    fail "Water timezone might be UTC: $LOGGED_AT"
fi

# ============================================
# PHASE 5: TIER ENFORCEMENT
# ============================================
echo -e "\n${YELLOW}═══ PHASE 5: TIER ENFORCEMENT ═══${NC}"

log_test "Free user export (should block)"
EXPORT_RESPONSE=$(curl -s "$API/api/export?format=json" \
  -H "Authorization: Bearer $TOKEN")

EXPORT_ERROR=$(echo "$EXPORT_RESPONSE" | jq -r '.error')
if [[ "$EXPORT_ERROR" == *"pro plan"* ]] || [[ "$EXPORT_ERROR" == *"upgrade"* ]]; then
    pass "Export blocked for free users"
else
    fail "Export should require Pro tier"
fi

log_test "Payment checkout (should return coming_soon)"
PAYMENT_RESPONSE=$(curl -s -X POST "$API/api/billing/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"pro"}')

COMING_SOON=$(echo "$PAYMENT_RESPONSE" | jq -r '.coming_soon')
if [ "$COMING_SOON" == "true" ]; then
    pass "Payment returns coming_soon (manual upgrade flow)"
else
    fail "Payment should return coming_soon flag"
fi

# ============================================
# PHASE 6: SECURITY HEADERS
# ============================================
echo -e "\n${YELLOW}═══ PHASE 6: SECURITY HEADERS ═══${NC}"

log_test "Check security headers"
HEADERS=$(curl -sI "$FRONTEND" | grep -i "x-frame-options\|x-content-type\|referrer-policy\|strict-transport")

if echo "$HEADERS" | grep -qi "x-frame-options"; then
    pass "X-Frame-Options header present"
else
    fail "Missing X-Frame-Options header"
fi

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    pass "X-Content-Type-Options header present"
else
    fail "Missing X-Content-Type-Options header"
fi

# ============================================
# SUMMARY
# ============================================
echo -e "\n======================================"
echo "  TEST SUMMARY"
echo "======================================"
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Critical Blockers: ${RED}$BLOCKERS${NC}"
echo "Pass Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")%"
echo "======================================"

if [ $BLOCKERS -gt 0 ]; then
    echo -e "${RED}🚨 DECISION: NO-GO${NC}"
    echo "Reason: $BLOCKERS critical blocker(s) found"
    exit 1
elif [ $PASSED -ge $(awk "BEGIN {printf \"%.0f\", $TOTAL*0.95}") ]; then
    echo -e "${GREEN}✅ DECISION: GO FOR LAUNCH${NC}"
    echo "All critical tests passed"
    exit 0
else
    echo -e "${YELLOW}⚠️  DECISION: CONDITIONAL GO${NC}"
    echo "Pass rate below 95% but no critical blockers"
    echo "Review failed tests before launch"
    exit 0
fi
