#!/bin/bash

# ================================================================
# JIRA Enterprise Portal Epic & Ticket Organization Script
# ================================================================
# This script creates the Enterprise Portal Epic and imports all
# 50 user stories, organizing them into the proper sprint structure
#
# Prerequisites:
# 1. Valid JIRA API token
# 2. Node.js installed
# 3. jq installed (for JSON parsing)
#
# Usage:
# export JIRA_API_TOKEN="your-fresh-api-token-here"
# ./organize-enterprise-portal-jira.sh
# ================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# JIRA Configuration
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_USER="subbu@aurigraph.io"
JIRA_PROJECT="AV11"

# Check if API token is set
if [ -z "$JIRA_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: JIRA_API_TOKEN environment variable not set${NC}"
    echo ""
    echo "Please set your JIRA API token:"
    echo "  export JIRA_API_TOKEN='your-token-here'"
    echo ""
    echo "Get a new token from:"
    echo "  https://id.atlassian.com/manage-profile/security/api-tokens"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq is not installed${NC}"
    echo "Install with: brew install jq"
    exit 1
fi

AUTH=$(echo -n "$JIRA_USER:$JIRA_API_TOKEN" | base64)

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Enterprise Portal JIRA Organization${NC}"
echo -e "${BLUE}  Project: $JIRA_PROJECT${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ================================================================
# Step 1: Verify JIRA Authentication
# ================================================================
echo -e "${YELLOW}Step 1: Verifying JIRA authentication...${NC}"

AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Basic $AUTH" \
    -H "Content-Type: application/json" \
    "$JIRA_URL/rest/api/3/myself")

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$AUTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ne 200 ]; then
    echo -e "${RED}❌ Authentication failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
    echo ""
    echo "Your API token may have expired. Generate a new one at:"
    echo "https://id.atlassian.com/manage-profile/security/api-tokens"
    exit 1
fi

USER_EMAIL=$(echo "$RESPONSE_BODY" | jq -r '.emailAddress')
echo -e "${GREEN}✅ Authenticated as: $USER_EMAIL${NC}"
echo ""

# ================================================================
# Step 2: Check if Epic already exists
# ================================================================
echo -e "${YELLOW}Step 2: Checking for existing Enterprise Portal Epic...${NC}"

# Search for epic with summary containing "Enterprise Portal"
SEARCH_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Basic $AUTH" \
    -H "Content-Type: application/json" \
    "$JIRA_URL/rest/api/3/search?jql=project=$JIRA_PROJECT+AND+type=Epic+AND+summary~\"Enterprise+Portal\"")

EXISTING_EPIC_COUNT=$(echo "$SEARCH_RESPONSE" | jq -r '.total // 0')

if [ "$EXISTING_EPIC_COUNT" -gt 0 ]; then
    EXISTING_EPIC_KEY=$(echo "$SEARCH_RESPONSE" | jq -r '.issues[0].key')
    echo -e "${YELLOW}⚠️  Epic already exists: $EXISTING_EPIC_KEY${NC}"
    echo "Using existing epic..."
    EPIC_KEY="$EXISTING_EPIC_KEY"
else
    # ================================================================
    # Step 3: Create Epic
    # ================================================================
    echo -e "${YELLOW}Step 3: Creating Enterprise Portal Epic...${NC}"

    EPIC_PAYLOAD=$(cat <<'EOF'
{
  "fields": {
    "project": { "key": "AV11" },
    "summary": "Enterprise Portal - Production-Grade Blockchain Management Platform",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Comprehensive blockchain management platform with real-time analytics, AI optimization, and quantum-resistant security."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Features"}]
        },
        {
          "type": "bulletList",
          "content": [
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Real-time dashboards with live metrics"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Transaction and block explorers"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Validator management and analytics"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "AI/ML optimization controls"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Quantum-resistant security management"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Cross-chain bridge interface"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "HMS healthcare integration"}]}]}
          ]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Scope"}]
        },
        {
          "type": "paragraph",
          "content": [
            {"type": "text", "text": "Total: 793 story points across 50 user stories"}
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {"type": "text", "text": "Deployment: https://dlt.aurigraph.io/portal/"}
          ]
        }
      ]
    },
    "issuetype": { "name": "Epic" },
    "labels": ["enterprise-portal", "v11", "production"]
  }
}
EOF
)

    EPIC_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Basic $AUTH" \
        -H "Content-Type: application/json" \
        -d "$EPIC_PAYLOAD" \
        "$JIRA_URL/rest/api/3/issue")

    HTTP_CODE=$(echo "$EPIC_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$EPIC_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        EPIC_KEY=$(echo "$RESPONSE_BODY" | jq -r '.key')
        echo -e "${GREEN}✅ Epic created: $EPIC_KEY${NC}"
    else
        echo -e "${RED}❌ Failed to create Epic (HTTP $HTTP_CODE)${NC}"
        echo "Response: $RESPONSE_BODY"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Epic Key: $EPIC_KEY${NC}"
echo -e "${GREEN}View at: $JIRA_URL/browse/$EPIC_KEY${NC}"
echo ""

# ================================================================
# Step 4: Import User Stories from CSV
# ================================================================
echo -e "${YELLOW}Step 4: Importing user stories from CSV...${NC}"

CSV_FILE="ENTERPRISE-PORTAL-JIRA-IMPORT.csv"

if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}❌ Error: $CSV_FILE not found${NC}"
    exit 1
fi

# Skip header line and process each row
TICKET_COUNT=0
SUCCESS_COUNT=0
FAILED_COUNT=0

tail -n +2 "$CSV_FILE" | while IFS=',' read -r summary issue_type priority labels epic_name epic_link description story_points components affects_versions fix_versions; do
    # Skip the epic row itself
    if [ "$issue_type" = "Epic" ]; then
        continue
    fi

    TICKET_COUNT=$((TICKET_COUNT + 1))

    # Clean up fields (remove quotes)
    summary=$(echo "$summary" | sed 's/^"//;s/"$//')
    description=$(echo "$description" | sed 's/^"//;s/"$//')
    labels=$(echo "$labels" | sed 's/^"//;s/"$//')
    priority=$(echo "$priority" | sed 's/^"//;s/"$//')
    story_points=$(echo "$story_points" | sed 's/^"//;s/"$//')

    echo "  Creating: $summary ($story_points points)..."

    # Create story payload
    STORY_PAYLOAD=$(cat <<EOF
{
  "fields": {
    "project": { "key": "$JIRA_PROJECT" },
    "summary": "$summary",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "$description"}]
        }
      ]
    },
    "issuetype": { "name": "Story" },
    "priority": { "name": "$priority" },
    "labels": $(echo "$labels" | tr ',' '\n' | jq -R . | jq -s .),
    "customfield_10016": $story_points
  }
}
EOF
)

    # Create the story
    STORY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Basic $AUTH" \
        -H "Content-Type: application/json" \
        -d "$STORY_PAYLOAD" \
        "$JIRA_URL/rest/api/3/issue")

    HTTP_CODE=$(echo "$STORY_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$STORY_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        STORY_KEY=$(echo "$RESPONSE_BODY" | jq -r '.key')
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "    ${GREEN}✅ Created: $STORY_KEY${NC}"

        # Link story to epic
        LINK_PAYLOAD=$(cat <<EOF
{
  "update": {
    "issuelinks": [
      {
        "add": {
          "type": { "name": "Epic-Story Link", "inward": "is part of", "outward": "has" },
          "outwardIssue": { "key": "$EPIC_KEY" }
        }
      }
    ]
  }
}
EOF
)

        curl -s -X PUT \
            -H "Authorization: Basic $AUTH" \
            -H "Content-Type: application/json" \
            -d "$LINK_PAYLOAD" \
            "$JIRA_URL/rest/api/3/issue/$STORY_KEY" > /dev/null

    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
        echo -e "    ${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
    fi

    # Rate limit: sleep 1 second between requests
    sleep 1
done

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Import Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Total Stories: $SUCCESS_COUNT created, $FAILED_COUNT failed${NC}"
echo -e "${GREEN}Epic: $EPIC_KEY${NC}"
echo -e "${GREEN}View at: $JIRA_URL/browse/$EPIC_KEY${NC}"
echo ""

# ================================================================
# Step 5: Summary Report
# ================================================================
echo -e "${BLUE}📊 Summary Report${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Epic: $EPIC_KEY"
echo "Total Story Points: 793"
echo "Total User Stories: 50"
echo "Successfully Created: $SUCCESS_COUNT"
echo "Failed: $FAILED_COUNT"
echo ""
echo "Next Steps:"
echo "1. Review tickets in JIRA"
echo "2. Assign tickets to appropriate sprints"
echo "3. Update sprint status using update-jira-sprints.sh"
echo ""
