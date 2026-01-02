#!/bin/bash
# End-to-End Deployment Verification Tests
# Run this after deployment to verify everything is working

set -e

FRONTEND_URL="https://eta-simulator-2026.web.app"
BACKEND_URL="https://eta-simulator-api-194990387864.us-central1.run.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    printf "Testing: %-50s " "$test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "=========================================="
echo "ETA-Simulator Deployment Verification"
echo "=========================================="
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""

# ==========================================
# Backend API Tests
# ==========================================
echo -e "${YELLOW}=== Backend API Tests ===${NC}"

run_test "Backend health check" "curl -sf $BACKEND_URL/health | grep -q healthy"
run_test "Backend root endpoint" "curl -sf $BACKEND_URL/ | grep -q 'SludgeSim API'"
run_test "API default config endpoint" "curl -sf $BACKEND_URL/api/default-config | grep -q flow_m3_h"
run_test "API returns JSON" "curl -sf -I $BACKEND_URL/health | grep -qi 'application/json'"

# ==========================================
# Frontend Tests
# ==========================================
echo ""
echo -e "${YELLOW}=== Frontend Tests ===${NC}"

run_test "Frontend serves index.html" "curl -sf $FRONTEND_URL/ | grep -q '</html>'"
run_test "Frontend has JS assets" "curl -sf $FRONTEND_URL/ | grep -q 'assets/index'"
run_test "Frontend SPA routing works" "curl -sf $FRONTEND_URL/nonexistent | grep -q '</html>'"

# ==========================================
# CORS Tests
# ==========================================
echo ""
echo -e "${YELLOW}=== CORS Configuration ===${NC}"

# Check if backend accepts requests from frontend origin
CORS_RESPONSE=$(curl -sf -I -X OPTIONS \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" \
    "$BACKEND_URL/health" 2>/dev/null || echo "")

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo -e "Testing: CORS headers present                             ${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: CORS headers present                             ${YELLOW}WARN${NC} (may still work)"
fi

# ==========================================
# Database Connectivity (via API)
# ==========================================
echo ""
echo -e "${YELLOW}=== Database Connectivity ===${NC}"

# The projects endpoint requires database access
DB_RESPONSE=$(curl -sf "$BACKEND_URL/api/projects" 2>/dev/null || echo "error")
if [ "$DB_RESPONSE" != "error" ]; then
    echo -e "Testing: Database connection (via projects API)           ${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: Database connection (via projects API)           ${RED}FAIL${NC}"
    ((FAILED++))
fi

# ==========================================
# Summary
# ==========================================
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Deployment is working correctly.${NC}"
    echo ""
    echo "Access your application at:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend API: $BACKEND_URL"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the logs above for details.${NC}"
    exit 1
fi
