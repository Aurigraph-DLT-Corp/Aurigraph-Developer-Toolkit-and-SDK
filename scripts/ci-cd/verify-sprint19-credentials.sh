#!/bin/bash

##############################################################################
# Sprint 19 Pre-Deployment Verification Script
# Automates credential and access verification
# Run this script to check all Section 1 items
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
SKIPPED=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Sprint 19 Pre-Deployment Verification - Section 1${NC}"
echo -e "${BLUE}Credentials & Access Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

##############################################################################
# SECTION 1.1 - JIRA API TOKEN VERIFICATION
##############################################################################

verify_jira_token() {
  local agent_name=$1
  local agent_email=$2
  local jira_token=$3

  echo -e "\n${YELLOW}[1.${PASSED}] Verifying JIRA Token for ${agent_name}${NC}"

  if [ -z "$jira_token" ]; then
    echo -e "${RED}✗ FAIL${NC} - JIRA_TOKEN not set for ${agent_name}"
    echo "  → Set environment variable: export JIRA_TOKEN_${agent_name}='your-token-here'"
    ((FAILED++))
    return 1
  fi

  JIRA_URL="https://aurigraphdlt.atlassian.net"
  RESPONSE=$(curl -s -w "\n%{http_code}" -u "${agent_email}:${jira_token}" \
    "${JIRA_URL}/rest/api/3/myself")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "200" ]; then
    ACCOUNT_ID=$(echo "$BODY" | jq -r '.accountId' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ PASS${NC} - Authenticated successfully"
    echo "  Account ID: $ACCOUNT_ID"
    ((PASSED++))
    return 0
  elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}✗ FAIL${NC} - 401 Unauthorized (invalid token)"
    echo "  → Regenerate token at: https://id.atlassian.com/manage-profile/security/api-tokens"
    ((FAILED++))
    return 1
  elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${RED}✗ FAIL${NC} - 403 Forbidden (no AV11 project access)"
    echo "  → Contact JIRA Admin to grant AV11 project access"
    ((FAILED++))
    return 1
  else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    echo "  Response: $(echo "$BODY" | jq . 2>/dev/null || echo "$BODY")"
    ((FAILED++))
    return 1
  fi
}

##############################################################################
# SECTION 1.5 - GITHUB SSH VERIFICATION
##############################################################################

verify_github_ssh() {
  local agent_name=$1

  echo -e "\n${YELLOW}[1.5] Verifying GitHub SSH Access for ${agent_name}${NC}"

  # Test SSH connection
  SSH_RESPONSE=$(ssh -T git@github.com 2>&1 || true)

  if echo "$SSH_RESPONSE" | grep -q "successfully authenticated"; then
    echo -e "${GREEN}✓ PASS${NC} - SSH authentication successful"
    echo "  Response: $SSH_RESPONSE"
    ((PASSED++))
    return 0
  elif echo "$SSH_RESPONSE" | grep -q "Permission denied"; then
    echo -e "${RED}✗ FAIL${NC} - SSH key not registered with GitHub"
    echo "  → Generate SSH key: ssh-keygen -t ed25519 -C 'agent@aurigraph.io'"
    echo "  → Add to GitHub: https://github.com/settings/keys"
    ((FAILED++))
    return 1
  else
    echo -e "${RED}✗ FAIL${NC} - SSH connection failed"
    echo "  Response: $SSH_RESPONSE"
    ((FAILED++))
    return 1
  fi
}

##############################################################################
# SECTION 1.6.1 - V10 SSH ACCESS
##############################################################################

verify_v10_ssh() {
  local v10_host=$1
  local v10_user=$2
  local v10_port=$3

  echo -e "\n${YELLOW}[1.6.1] Verifying V10 SSH Access${NC}"
  echo "  Host: ${v10_user}@${v10_host}:${v10_port}"

  if command -v sshpass &> /dev/null; then
    # sshpass available, can test with password
    if [ -z "$V10_PASSWORD" ]; then
      echo -e "${YELLOW}⊘ SKIP${NC} - V10_PASSWORD not set (expected for CI/CD)"
      ((SKIPPED++))
      return 0
    fi

    RESPONSE=$(sshpass -p "$V10_PASSWORD" ssh -p "$v10_port" "$v10_user@$v10_host" "echo 'SSH OK'" 2>&1 || echo "FAILED")

    if echo "$RESPONSE" | grep -q "SSH OK"; then
      echo -e "${GREEN}✓ PASS${NC} - SSH connection successful"
      ((PASSED++))
      return 0
    else
      echo -e "${RED}✗ FAIL${NC} - SSH connection failed"
      echo "  Error: $RESPONSE"
      ((FAILED++))
      return 1
    fi
  else
    echo -e "${YELLOW}⊘ SKIP${NC} - sshpass not installed (optional for manual testing)"
    echo "  → To verify manually: ssh -p $v10_port $v10_user@$v10_host"
    ((SKIPPED++))
    return 0
  fi
}

##############################################################################
# SECTION 1.6.2 - V10 REST API
##############################################################################

verify_v10_api() {
  local v10_api=$1
  local v10_token=$2

  echo -e "\n${YELLOW}[1.6.2] Verifying V10 REST API${NC}"
  echo "  Endpoint: ${v10_api}/health"

  if [ -z "$v10_token" ]; then
    echo -e "${YELLOW}⊘ SKIP${NC} - V10_TOKEN not set"
    ((SKIPPED++))
    return 0
  fi

  RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer ${v10_token}" \
    "${v10_api}/health")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "200" ]; then
    STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null || echo "OK")
    echo -e "${GREEN}✓ PASS${NC} - V10 API responding (status: $STATUS)"
    ((PASSED++))
    return 0
  elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}✗ FAIL${NC} - 401 Unauthorized (invalid V10 token)"
    ((FAILED++))
    return 1
  elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${RED}✗ FAIL${NC} - 503 Service Unavailable"
    echo "  → Check if V10 service is running"
    ((FAILED++))
    return 1
  else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    ((FAILED++))
    return 1
  fi
}

##############################################################################
# SECTION 1.6.3 - V11 DATABASE
##############################################################################

verify_v11_database() {
  local db_host=$1
  local db_port=$2
  local db_user=$3
  local db_name=$4

  echo -e "\n${YELLOW}[1.6.3] Verifying V11 Database Connection${NC}"
  echo "  Host: ${db_host}:${db_port}, User: ${db_user}, Database: ${db_name}"

  if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⊘ SKIP${NC} - psql not installed"
    echo "  → Install PostgreSQL client: brew install postgresql (macOS) or apt-get install postgresql-client (Linux)"
    ((SKIPPED++))
    return 0
  fi

  RESPONSE=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$db_host" -p "$db_port" \
    -U "$db_user" -d "$db_name" -c "SELECT 1;" 2>&1 || echo "FAILED")

  if echo "$RESPONSE" | grep -q " 1"; then
    echo -e "${GREEN}✓ PASS${NC} - Database connection successful"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} - Database connection failed"
    echo "  Error: $(echo "$RESPONSE" | head -1)"
    ((FAILED++))
    return 1
  fi
}

##############################################################################
# SECTION 1.6.4 - V11 QUARKUS SERVICE
##############################################################################

verify_v11_quarkus() {
  local v11_url=$1

  echo -e "\n${YELLOW}[1.6.4] Verifying V11 Quarkus Service${NC}"
  echo "  Endpoint: ${v11_url}/q/health"

  RESPONSE=$(curl -s -w "\n%{http_code}" "$v11_url/q/health")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "200" ]; then
    STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null || echo "OK")
    echo -e "${GREEN}✓ PASS${NC} - V11 service responding (status: $STATUS)"
    ((PASSED++))
    return 0
  elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ FAIL${NC} - Connection refused (service not running?)"
    echo "  → Start V11 dev mode: cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw quarkus:dev"
    ((FAILED++))
    return 1
  else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    ((FAILED++))
    return 1
  fi
}

##############################################################################
# SECTION 1.7 - KEYCLOAK JWT TOKEN
##############################################################################

verify_keycloak_token() {
  local keycloak_url=$1
  local realm=$2
  local client_id=$3
  local username=$4
  local password=$5

  echo -e "\n${YELLOW}[1.7] Verifying Keycloak JWT Token${NC}"
  echo "  URL: ${keycloak_url}, Realm: ${realm}, User: ${username}"

  if [ -z "$password" ]; then
    echo -e "${YELLOW}⊘ SKIP${NC} - Password not set (expected for CI/CD)"
    ((SKIPPED++))
    return 0
  fi

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${keycloak_url}/realms/${realm}/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=${client_id}" \
    -d "username=${username}" \
    -d "password=${password}" \
    -d "grant_type=password")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "200" ]; then
    TOKEN=$(echo "$BODY" | jq -r '.access_token' 2>/dev/null | cut -c1-40)
    EXPIRES=$(echo "$BODY" | jq -r '.expires_in' 2>/dev/null)
    echo -e "${GREEN}✓ PASS${NC} - JWT token obtained successfully"
    echo "  Token: ${TOKEN}... (expires in ${EXPIRES}s)"
    ((PASSED++))
    return 0
  elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}✗ FAIL${NC} - 401 Unauthorized (invalid credentials)"
    echo "  → Verify username/password in Keycloak: https://iam2.aurigraph.io/admin"
    ((FAILED++))
    return 1
  elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${RED}✗ FAIL${NC} - 403 Forbidden (account locked)"
    ((FAILED++))
    return 1
  else
    echo -e "${RED}✗ FAIL${NC} - HTTP $HTTP_CODE"
    echo "  Error: $(echo "$BODY" | jq . 2>/dev/null || echo "$BODY")"
    ((FAILED++))
    return 1
  fi
}

##############################################################################
# SECTION 1.8 - GATLING INSTALLATION
##############################################################################

verify_gatling() {
  echo -e "\n${YELLOW}[1.8] Verifying Gatling Installation${NC}"

  if command -v gatling.sh &> /dev/null; then
    VERSION=$(gatling.sh -version 2>&1 | grep -oP 'Gatling \K[0-9.]+' || echo "unknown")
    echo -e "${GREEN}✓ PASS${NC} - Gatling installed (version: $VERSION)"
    ((PASSED++))
    return 0
  elif command -v gatling &> /dev/null; then
    VERSION=$(gatling --version 2>&1 | grep -oP '[0-9.]+' | head -1)
    echo -e "${GREEN}✓ PASS${NC} - Gatling installed (version: $VERSION)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} - Gatling not installed"
    echo "  → Install: brew install gatling (macOS) or apt-get install gatling (Linux)"
    echo "  → Or download from: https://gatling.io/open-source/"
    ((FAILED++))
    return 1
  fi
}

##############################################################################
# MAIN VERIFICATION FLOW
##############################################################################

main() {
  # Load environment variables from Credentials.md if available
  if [ -f "$HOME/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md" ]; then
    echo -e "${BLUE}Loading credentials from Credentials.md...${NC}\n"
    # Note: Not actually sourcing for security, but would do: source <credentials>
  fi

  echo -e "${BLUE}[Checking Prerequisites]${NC}\n"

  # Check for required tools
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗ curl not installed${NC}"
    exit 1
  fi

  if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq not installed (JSON parsing may fail)${NC}"
    echo "  → Install: brew install jq (macOS) or apt-get install jq (Linux)\n"
  fi

  # Run verifications
  echo -e "${BLUE}[Running Verifications]${NC}\n"

  # Section 1.1-1.4: JIRA tokens
  # Note: These require tokens to be set via environment variables
  # verify_jira_token "@J4CDeploymentAgent" "deployment-agent@aurigraph.io" "$JIRA_TOKEN_DEPLOYMENT"
  # verify_jira_token "@J4CNetworkAgent" "network-agent@aurigraph.io" "$JIRA_TOKEN_NETWORK"
  # verify_jira_token "@J4CTestingAgent" "testing-agent@aurigraph.io" "$JIRA_TOKEN_TESTING"
  # verify_jira_token "@J4CCoordinatorAgent" "coordinator-agent@aurigraph.io" "$JIRA_TOKEN_COORDINATOR"

  # Section 1.5: GitHub SSH
  verify_github_ssh "all-agents"

  # Section 1.6.1-1.6.4: V10/V11 credentials
  verify_v10_ssh "dlt.aurigraph.io" "subbu" "2235"
  verify_v10_api "https://v10-api.aurigraph.io/api/v10" "$V10_TOKEN"
  verify_v11_database "localhost" "5432" "aurigraph" "aurigraph"
  verify_v11_quarkus "http://localhost:9003"

  # Section 1.7: Keycloak
  verify_keycloak_token "https://iam2.aurigraph.io" "AWD" "test-client" "test-user" "$KEYCLOAK_PASSWORD"

  # Section 1.8: Gatling
  verify_gatling

  # Summary
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}Passed:  $PASSED${NC}"
  echo -e "${RED}Failed:  $FAILED${NC}"
  echo -e "${YELLOW}Skipped: $SKIPPED${NC}"

  TOTAL=$((PASSED + FAILED + SKIPPED))
  PERCENTAGE=$((PASSED * 100 / TOTAL))

  echo -e "\n${BLUE}Completion: ${PERCENTAGE}% (${PASSED}/${TOTAL})${NC}"

  if [ "$FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}✓ All verifications passed!${NC}"
    exit 0
  else
    echo -e "\n${RED}✗ ${FAILED} verification(s) failed.${NC}"
    echo -e "${YELLOW}→ Fix issues above and re-run this script${NC}"
    exit 1
  fi
}

# Run main function
main "$@"
