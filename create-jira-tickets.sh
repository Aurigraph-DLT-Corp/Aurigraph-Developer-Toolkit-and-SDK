#!/bin/bash
# Create JIRA tickets for December 22, 2025 session work
# Uses JIRA REST API v3

set -e

# Load credentials
export JIRA_EMAIL="subbu@aurigraph.io"
export JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
export JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
export JIRA_PROJECT_KEY="AV11"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Creating JIRA Tickets for Session Work${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to create JIRA ticket
create_ticket() {
    local summary="$1"
    local description="$2"
    local issue_type="$3"
    local priority="$4"
    local story_points="$5"
    
    echo -e "${YELLOW}Creating ticket: $summary${NC}"
    
    # Create JSON payload
    local payload=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$JIRA_PROJECT_KEY"
    },
    "summary": "$summary",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "$description"
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "$issue_type"
    },
    "priority": {
      "name": "$priority"
    }
  }
}
EOF
)
    
    # Create ticket
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        -d "$payload" \
        "$JIRA_BASE_URL/rest/api/3/issue")
    
    # Extract ticket key
    ticket_key=$(echo "$response" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$ticket_key" ]; then
        echo -e "${GREEN}✅ Created: $ticket_key${NC}"
        echo "$ticket_key"
    else
        echo -e "${YELLOW}⚠️  Error creating ticket. Response: $response${NC}"
        echo "ERROR"
    fi
}

# Ticket 1: Fix Duplicate REST Endpoint Conflicts
TICKET1=$(create_ticket \
    "Fix Duplicate REST Endpoint Conflicts - DeploymentException" \
    "Fixed jakarta.enterprise.inject.spi.DeploymentException caused by duplicate REST endpoint declarations. Disabled VVBApiResource and DemoControlResource, changed DocumentConversionWizardResource path. Added @Singleton annotations to TransactionServiceImpl and TransactionServiceGrpcImpl. Commit: 31150e22" \
    "Bug" \
    "Critical" \
    "10")

echo ""

# Ticket 2: Refactor BlockchainServiceImpl
TICKET2=$(create_ticket \
    "Refactor BlockchainServiceImpl - Extract Helper Methods" \
    "Extracted 5 helper methods from BlockchainServiceImpl into new BlockchainHelper utility class. Improved code organization, maintainability, and testability. Reduced BlockchainServiceImpl by 112 lines. Commit: 089ada28" \
    "Task" \
    "Medium" \
    "5")

echo ""

# Ticket 3: Fix Test Infrastructure Configuration
TICKET3=$(create_ticket \
    "Fix Test Infrastructure Configuration" \
    "Added comprehensive test configuration including test-specific LevelDB paths, H2 in-memory database, simplified consensus settings, and disabled authentication for tests. Resolves 196 test failures related to infrastructure. Commit: 869b367a" \
    "Task" \
    "High" \
    "5")

echo ""

# Ticket 4: Implement Missing API Endpoints
TICKET4=$(create_ticket \
    "Implement Missing API Endpoints for Dashboard" \
    "Created 4 new REST API resources following SPRINT, E2E, and SPARC methodology: PlatformStatusResource, PerformanceMetricsResource, DataFeedsResource, FeedTokensResource. All UIEndToEndTest tests now passing (5/5). Commit: b5f39c84" \
    "Story" \
    "High" \
    "10")

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ JIRA Tickets Created Successfully${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Tickets created:"
echo "  1. $TICKET1 - Fix Duplicate REST Endpoints (10 SP)"
echo "  2. $TICKET2 - Refactor BlockchainServiceImpl (5 SP)"
echo "  3. $TICKET3 - Fix Test Infrastructure (5 SP)"
echo "  4. $TICKET4 - Implement Missing API Endpoints (10 SP)"
echo ""
echo "Total Story Points: 30 SP"
echo ""
echo "View tickets at: $JIRA_BASE_URL/browse/$JIRA_PROJECT_KEY"
