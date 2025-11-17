#!/bin/bash

###############################################################################
# JIRA Ticket Creation Script for Multi-Agent Sprint 14
# Creates all 15 JIRA tickets automatically from assignment plan
# Requires: jira-cli installed (or uses curl + API)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# JIRA Configuration
JIRA_BASE_URL="${JIRA_BASE_URL:-https://aurigraphdlt.atlassian.net}"
JIRA_PROJECT="${JIRA_PROJECT:-AV11}"
JIRA_USER="${JIRA_USER:-}"
JIRA_TOKEN="${JIRA_TOKEN:-}"
JIRA_BOARD_ID="${JIRA_BOARD_ID:-789}"

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Validate JIRA credentials
check_jira_config() {
  if [ -z "$JIRA_USER" ] || [ -z "$JIRA_TOKEN" ]; then
    print_error "JIRA credentials not configured"
    echo ""
    echo "Set environment variables:"
    echo "  export JIRA_USER=your-email@example.com"
    echo "  export JIRA_TOKEN=your-api-token"
    echo "  export JIRA_BASE_URL=https://aurigraphdlt.atlassian.net"
    echo ""
    echo "Get API token from: https://id.atlassian.com/manage-profile/security/api-tokens"
    exit 1
  fi

  # Test JIRA connection
  response=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/project/$JIRA_PROJECT" 2>/dev/null || echo "")

  if [ -z "$response" ] || echo "$response" | grep -q "errors"; then
    print_error "Cannot connect to JIRA. Check credentials and URL."
    exit 1
  fi

  print_success "JIRA authentication successful"
}

# Create JIRA ticket
create_ticket() {
  local ticket_key="$1"
  local title="$2"
  local description="$3"
  local agent="$4"
  local epic="$5"
  local points="$6"
  local priority="$7"
  local target_date="$8"

  print_info "Creating: $ticket_key - $title"

  # Extract component from title
  local component=$(echo "$title" | cut -d'-' -f2 | xargs)

  # Create issue JSON
  local issue_json=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$JIRA_PROJECT"
    },
    "issuetype": {
      "name": "Task"
    },
    "summary": "$title",
    "description": {
      "version": 3,
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "$description"
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {
            "level": 2
          },
          "content": [
            {
              "type": "text",
              "text": "Agent Assignment"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Agent: $agent"
            }
          ]
        }
      ]
    },
    "priority": {
      "name": "$priority"
    },
    "labels": [
      "agent-system",
      "sprint-14",
      "auto-sync",
      "$agent"
    ],
    "customfield_10016": {
      "value": "$epic"
    }
  }
}
EOF
)

  # Create ticket via API
  response=$(curl -s -X POST \
    -u "$JIRA_USER:$JIRA_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$issue_json" \
    "$JIRA_BASE_URL/rest/api/3/issues" 2>/dev/null || echo "")

  # Check response
  if echo "$response" | grep -q "key"; then
    created_key=$(echo "$response" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
    print_success "Created: $created_key"
    echo "$created_key"
  else
    print_error "Failed to create ticket"
    echo "Response: $response" | head -5
    return 1
  fi
}

# Create all P0 tickets
create_p0_tickets() {
  print_header "P0 CRITICAL - Build Stability"

  create_ticket "AV11-101" "[Agent-1.1] REST/gRPC Bridge - Fix DeFi module compilation" \
    "Fix V11 DeFi module compilation errors blocking baseline build." \
    "Agent-1.1" "V11 Build Stability" "5" "Critical" "2025-11-18"

  create_ticket "AV11-102" "[Agent-db] Composite/Token Modules - Fix incomplete implementations" \
    "Fix composite and token contract modules with missing implementations." \
    "Agent-db" "V11 Build Stability" "8" "Critical" "2025-11-19"
}

# Create all P1 tickets
create_p1_tickets() {
  print_header "P1 HIGH - gRPC Infrastructure"

  create_ticket "AV11-103" "[Agent-1.2] Consensus gRPC - Implement HyperRAFT++ service" \
    "Implement HyperRAFT++ consensus service with gRPC and Protocol Buffers." \
    "Agent-1.2" "gRPC Infrastructure" "8" "High" "2025-11-20"

  create_ticket "AV11-104" "[Agent-1.3] Contracts gRPC - Implement smart contract service" \
    "Implement smart contract gRPC interfaces for deployment and invocation." \
    "Agent-1.3" "gRPC Infrastructure" "8" "High" "2025-11-20"

  create_ticket "AV11-105" "[Agent-1.4] Quantum Crypto gRPC - Expose cryptography service" \
    "Expose quantum cryptography (CRYSTALS-Kyber/Dilithium) via gRPC." \
    "Agent-1.4" "gRPC Infrastructure" "5" "High" "2025-11-19"

  create_ticket "AV11-115" "[Agent-1.5] Storage gRPC - Implement state management service" \
    "Implement storage and state management via gRPC with KV operations." \
    "Agent-1.5" "gRPC Infrastructure" "5" "High" "2025-11-19"
}

# Create all P2 tickets
create_p2_tickets() {
  print_header "P2 MEDIUM - Advanced Features"

  create_ticket "AV11-201" "[Agent-2.1] Traceability - Supply chain tracking service" \
    "Implement supply chain traceability with asset tracking and provenance." \
    "Agent-2.1" "Advanced Features" "8" "Medium" "2025-11-22"

  create_ticket "AV11-202" "[Agent-2.2] Tokens - ERC-20 standard implementation" \
    "Implement ERC-20 token standard for secondary token support." \
    "Agent-2.2" "Advanced Features" "8" "Medium" "2025-11-21"

  create_ticket "AV11-203" "[Agent-2.3] Composite Assets - Multi-token composition" \
    "Implement multi-token composite asset creation and management." \
    "Agent-2.3" "Advanced Features" "8" "Medium" "2025-11-21"

  create_ticket "AV11-204" "[Agent-2.4] Orchestration - Multi-contract coordination" \
    "Implement orchestration framework for coordinating multiple contracts." \
    "Agent-2.4" "Advanced Features" "10" "Medium" "2025-11-23"

  create_ticket "AV11-205" "[Agent-2.5] Merkle Registry - Asset registry with proofs" \
    "Implement Merkle tree-based asset registry for efficient verification." \
    "Agent-2.5" "Advanced Features" "5" "Medium" "2025-11-20"

  create_ticket "AV11-206" "[Agent-2.6] Portal Integration - Sync V11 backend with frontend" \
    "Implement portal sync with V11 backend and WebSocket support." \
    "Agent-2.6" "Advanced Features" "8" "Medium" "2025-11-21"
}

# Create all P3 tickets
create_p3_tickets() {
  print_header "P3 INFRASTRUCTURE - Testing & Support"

  create_ticket "AV11-301" "[Agent-tests] Test Suite - V11 comprehensive coverage" \
    "Implement comprehensive test suite for V11 with 90%+ coverage." \
    "Agent-tests" "Infrastructure" "13" "Medium" "2025-11-24"

  create_ticket "AV11-302" "[Agent-frontend] Portal UI - V11 dashboards and controls" \
    "Implement V11 dashboard and management UI for enterprise portal." \
    "Agent-frontend" "Infrastructure" "10" "Medium" "2025-11-22"

  create_ticket "AV11-303" "[Agent-ws] WebSocket - Real-time communication support" \
    "Implement WebSocket support for real-time updates and live data streaming." \
    "Agent-ws" "Infrastructure" "5" "Medium" "2025-11-20"
}

# Add tickets to sprint
add_to_sprint() {
  print_header "Adding Tickets to Sprint 14"

  local sprint_id="14"  # Adjust based on your JIRA sprint ID

  print_info "Fetching Sprint 14 ID..."

  # Get sprint ID
  local sprint_response=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/board/$JIRA_BOARD_ID/sprint" 2>/dev/null)

  sprint_id=$(echo "$sprint_response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

  if [ -z "$sprint_id" ]; then
    print_error "Could not find Sprint 14 ID"
    return 1
  fi

  print_success "Found Sprint 14 ID: $sprint_id"

  # Add all tickets to sprint
  local tickets=("AV11-101" "AV11-102" "AV11-103" "AV11-104" "AV11-105" "AV11-115" \
                 "AV11-201" "AV11-202" "AV11-203" "AV11-204" "AV11-205" "AV11-206" \
                 "AV11-301" "AV11-302" "AV11-303")

  for ticket in "${tickets[@]}"; do
    print_info "Adding $ticket to sprint..."

    local sprint_json=$(cat <<EOF
{
  "issues": ["$ticket"]
}
EOF
)

    curl -s -X POST \
      -u "$JIRA_USER:$JIRA_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$sprint_json" \
      "$JIRA_BASE_URL/rest/api/3/sprint/$sprint_id/issues" > /dev/null 2>&1

    print_success "Added $ticket"
  done
}

# Main execution
main() {
  print_header "Multi-Agent Sprint 14 JIRA Ticket Creator"

  # Check prerequisites
  if ! command -v curl &> /dev/null; then
    print_error "curl is not installed"
    exit 1
  fi

  # Check JIRA config
  check_jira_config

  echo ""

  # Create all tickets
  create_p0_tickets
  create_p1_tickets
  create_p2_tickets
  create_p3_tickets

  echo ""

  # Add to sprint
  add_to_sprint

  echo ""
  print_header "JIRA Ticket Creation Complete"
  echo "Board URL: $JIRA_BASE_URL/jira/software/projects/$JIRA_PROJECT/boards/$JIRA_BOARD_ID"
}

# Run main
main "$@"
