#!/bin/bash

# VitaNudge Critical Test Execution Script
# Runs most important tests first and generates detailed report

echo "========================================"
echo "VitaNudge Critical Test Execution"
echo "Started: $(date)"
echo "Environment: Production (Render)"
echo "URL: https://vitanudge.onrender.com"
echo "========================================"
echo ""

# Create test results directory
mkdir -p test-results/screenshots
mkdir -p test-results/videos

# Phase 1: Security Tests (CRITICAL)
echo "Phase 1: Security Tests (CRITICAL)"
echo "-----------------------------------"
npx playwright test tests/security/security.spec.js --project=chromium --reporter=list
SECURITY_EXIT=$?

echo ""
echo "Phase 2: Authentication Tests (CRITICAL)"
echo "-----------------------------------------"
npx playwright test tests/e2e/auth.spec.js --project=chromium --reporter=list
AUTH_EXIT=$?

echo ""
echo "Phase 3: API Endpoint Tests (CRITICAL)"
echo "---------------------------------------"
npx playwright test tests/api/api.spec.js --project=chromium --reporter=list
API_EXIT=$?

echo ""
echo "Phase 4: Data Integrity - Duplicate Detection (NEW)"
echo "----------------------------------------------------"
npx playwright test tests/data-integrity/duplicates.spec.js --project=chromium --reporter=list
DUP_EXIT=$?

echo ""
echo "Phase 5: Food Logging Tests"
echo "---------------------------"
npx playwright test tests/e2e/food-logging.spec.js --project=chromium --reporter=list
FOOD_EXIT=$?

echo ""
echo "Phase 6: Browser Compatibility Tests"
echo "-------------------------------------"
npx playwright test tests/browser/visual-interaction.spec.js --project=chromium --reporter=list
BROWSER_EXIT=$?

echo ""
echo "========================================"
echo "Test Execution Summary"
echo "========================================"
echo "Security Tests: $([ $SECURITY_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Authentication Tests: $([ $AUTH_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "API Tests: $([ $API_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Duplicate Detection: $([ $DUP_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Food Logging: $([ $FOOD_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Browser Tests: $([ $BROWSER_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo ""
echo "Completed: $(date)"
echo "========================================"

# Generate HTML report
echo ""
echo "Generating HTML report..."
npx playwright show-report

# Exit with failure if any critical tests failed
if [ $SECURITY_EXIT -ne 0 ] || [ $AUTH_EXIT -ne 0 ] || [ $API_EXIT -ne 0 ]; then
    echo "⚠️  CRITICAL TESTS FAILED - Review report"
    exit 1
else
    echo "✅ All critical tests passed!"
    exit 0
fi
