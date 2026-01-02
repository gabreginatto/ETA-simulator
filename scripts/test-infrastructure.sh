#!/bin/bash
# Infrastructure Verification Tests for ETA-Simulator GCP Deployment
# Run this script to verify all GCP/Firebase components are properly configured

set -e

PROJECT_ID="eta-simulator-2026"
REGION="us-central1"
CLOUD_SQL_INSTANCE="eta-sim-pg"
SERVICE_ACCOUNT="eta-sim-runner@${PROJECT_ID}.iam.gserviceaccount.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
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

# Test with output
run_test_with_output() {
    local test_name="$1"
    local test_command="$2"
    local expected="$3"

    printf "Testing: %-50s " "$test_name"

    local result=$(eval "$test_command" 2>/dev/null)
    if [[ "$result" == *"$expected"* ]]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC} (got: $result)"
        ((FAILED++))
        return 1
    fi
}

echo "=========================================="
echo "ETA-Simulator Infrastructure Tests"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "=========================================="
echo ""

# ==========================================
# Phase 1: GCP Project Tests
# ==========================================
echo -e "${YELLOW}=== Phase 1: GCP Project ===${NC}"

run_test "GCP CLI installed" "gcloud --version"
run_test "GCP project exists" "gcloud projects describe $PROJECT_ID"
run_test "GCP project is active" "test \$(gcloud config get-value project) = $PROJECT_ID"
run_test "Billing is enabled" "gcloud billing projects describe $PROJECT_ID --format='value(billingEnabled)' | grep -iq true"

# ==========================================
# Phase 2: Required APIs
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 2: Required APIs ===${NC}"

REQUIRED_APIS=(
    "artifactregistry.googleapis.com"
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "secretmanager.googleapis.com"
    "cloudbuild.googleapis.com"
    "firebase.googleapis.com"
    "firebasehosting.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    api_short=$(echo $api | cut -d'.' -f1)
    run_test "API: $api_short" "gcloud services list --enabled --project=$PROJECT_ID --format='value(name)' | grep -q $api"
done

# ==========================================
# Phase 3: Cloud SQL
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 3: Cloud SQL ===${NC}"

run_test "Cloud SQL instance exists" "gcloud sql instances describe $CLOUD_SQL_INSTANCE --project=$PROJECT_ID"
run_test_with_output "Cloud SQL status is RUNNABLE" "gcloud sql instances describe $CLOUD_SQL_INSTANCE --project=$PROJECT_ID --format='value(state)'" "RUNNABLE"
run_test "Database 'sludgesim' exists" "gcloud sql databases list --instance=$CLOUD_SQL_INSTANCE --project=$PROJECT_ID --format='value(name)' | grep -q sludgesim"
run_test "User 'appuser' exists" "gcloud sql users list --instance=$CLOUD_SQL_INSTANCE --project=$PROJECT_ID --format='value(name)' | grep -q appuser"

# ==========================================
# Phase 4: Secret Manager
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 4: Secret Manager ===${NC}"

run_test "Secret 'database-url' exists" "gcloud secrets describe database-url --project=$PROJECT_ID"
run_test "Secret has active version" "gcloud secrets versions list database-url --project=$PROJECT_ID --format='value(state)' | grep -iq enabled"

# ==========================================
# Phase 5: Artifact Registry
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 5: Artifact Registry ===${NC}"

run_test "Artifact Registry repo exists" "gcloud artifacts repositories describe eta-simulator --location=$REGION --project=$PROJECT_ID"
run_test "Docker auth configured" "grep -q 'us-central1-docker.pkg.dev' ~/.docker/config.json"

# ==========================================
# Phase 6: Service Account & IAM
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 6: Service Account & IAM ===${NC}"

run_test "Service account exists" "gcloud iam service-accounts describe $SERVICE_ACCOUNT --project=$PROJECT_ID"

# Check IAM bindings
IAM_POLICY=$(gcloud projects get-iam-policy $PROJECT_ID --format=json 2>/dev/null)
run_test "SA has cloudsql.client role" "echo '$IAM_POLICY' | grep -q 'roles/cloudsql.client'"
run_test "SA has secretmanager.secretAccessor" "echo '$IAM_POLICY' | grep -q 'roles/secretmanager.secretAccessor'"

# ==========================================
# Phase 7: Firebase
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 7: Firebase ===${NC}"

run_test "Firebase CLI installed" "firebase --version"
run_test "firebase.json exists" "test -f firebase.json"
run_test ".firebaserc exists" "test -f .firebaserc"
run_test "Firebase project configured" "grep -q '$PROJECT_ID' .firebaserc"
run_test "Hosting public dir correct" "grep -q 'frontend/dist' firebase.json"

# ==========================================
# Phase 8: Local Files
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 8: Local Files ===${NC}"

run_test "Dockerfile.backend exists" "test -f Dockerfile.backend"
run_test "deploy.sh exists and executable" "test -x deploy.sh"
run_test "frontend/.env.production exists" "test -f frontend/.env.production"
run_test "CORS includes Firebase domain" "grep -q 'eta-simulator-2026.web.app' backend/app/config.py"

# ==========================================
# Phase 9: Docker
# ==========================================
echo ""
echo -e "${YELLOW}=== Phase 9: Docker ===${NC}"

run_test "Docker daemon running" "docker info"
run_test "Docker can pull images" "docker pull hello-world"

# ==========================================
# Summary
# ==========================================
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Infrastructure is ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi
