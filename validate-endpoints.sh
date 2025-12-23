#!/bin/bash

# Endpoint Validation Script
# Tests all 26 V11 endpoints for accessibility
# Requires V11 backend running on http://localhost:9003

set -e

BACKEND_URL="http://localhost:9003"
API_PREFIX="/api/v11"
TIMEOUT=5

echo "==============================================="
echo "Aurigraph V11 Endpoint Validation"
echo "==============================================="
echo ""
echo "Testing backend: $BACKEND_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Function to test an endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3

  echo -n "Testing $description... "

  if [ "$method" = "GET" ]; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$BACKEND_URL$API_PREFIX$endpoint")
  else
    http_code=$(curl -s -X $method -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT -H "Content-Type: application/json" "$BACKEND_URL$API_PREFIX$endpoint")
  fi

  if [[ "$http_code" =~ ^(200|201|400|404|405)$ ]]; then
    if [[ "$http_code" =~ ^(200|201)$ ]]; then
      echo "✅ $http_code"
    else
      echo "⚠️ $http_code (expected but not data)"
    fi
  else
    echo "❌ $http_code (ERROR)"
  fi
}

# Health check first
echo "--- HEALTH CHECKS ---"
test_endpoint "GET" "/health" "Health endpoint"
test_endpoint "GET" "" "Info endpoint"
echo ""

# Phase 1: Network, Blocks, Validators, AI, Audit, RWA (15 endpoints)
echo "--- PHASE 1: Core Endpoints (15 endpoints) ---"

echo ""
echo "Network Topology:"
test_endpoint "GET" "/network/topology" "Network topology visualization"

echo ""
echo "Blockchain:"
test_endpoint "GET" "/blockchain/blocks/search" "Block search"
test_endpoint "GET" "/blockchain/blocks/0" "Get specific block"
test_endpoint "GET" "/blockchain/validators" "List validators"

echo ""
echo "Validators:"
test_endpoint "GET" "/validators" "Validators list"
test_endpoint "GET" "/validators/metrics" "Validator metrics"
test_endpoint "GET" "/validators/node-1/details" "Specific validator"

echo ""
echo "AI/ML:"
test_endpoint "GET" "/ai/metrics" "AI metrics"
test_endpoint "GET" "/ai/models/model-1" "ML model performance"
test_endpoint "GET" "/ai/optimization/recommendations" "ML recommendations"

echo ""
echo "Audit:"
test_endpoint "GET" "/audit/logs" "Audit logs"
test_endpoint "GET" "/audit/summary" "Audit summary"
test_endpoint "GET" "/audit/security/events" "Specific audit events"

echo ""
echo "RWA:"
test_endpoint "GET" "/rwa/assets" "RWA assets"
test_endpoint "GET" "/rwa/assets/asset-1" "Specific RWA asset"
test_endpoint "GET" "/rwa/verification" "RWA verification"

# Phase 2: Analytics, Gateway, Contracts, Tokens (11 endpoints)
echo ""
echo "--- PHASE 2: Analytics & Integration (11 endpoints) ---"

echo ""
echo "Analytics:"
test_endpoint "GET" "/analytics/dashboard" "Analytics dashboard"
test_endpoint "GET" "/analytics/performance" "Performance metrics"

echo ""
echo "Governance:"
test_endpoint "GET" "/blockchain/governance/stats" "Voting statistics"

echo ""
echo "Network Health:"
test_endpoint "GET" "/network/health" "Network health"
test_endpoint "GET" "/network/peers" "Network peers"

echo ""
echo "Live Data:"
test_endpoint "GET" "/live/network" "Real-time network"

echo ""
echo "Bridge:"
test_endpoint "GET" "/bridge/status" "Bridge status"
test_endpoint "GET" "/bridge/history" "Bridge history"

echo ""
echo "Enterprise:"
test_endpoint "GET" "/enterprise/status" "Enterprise status"

echo ""
echo "Data Feeds:"
test_endpoint "GET" "/datafeeds/prices" "Price feeds"

echo ""
echo "Oracles:"
test_endpoint "GET" "/oracles/status" "Oracle status"

# Summary
echo ""
echo "==============================================="
echo "Validation complete!"
echo "==============================================="
echo ""
echo "If you see ❌ errors, the backend may not be running."
echo "Start it with: cd aurigraph-v11-standalone && ./mvnw quarkus:dev"
echo ""
