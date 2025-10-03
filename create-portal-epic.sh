#!/bin/bash

# Create JIRA Epic and Tickets for Enterprise Portal
# Uses JIRA REST API to create all features systematically

JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_USER="sjoish12@gmail.com"
JIRA_API_TOKEN="${JIRA_API_TOKEN}"
PROJECT_KEY="AV11"

if [ -z "$JIRA_API_TOKEN" ]; then
    echo "❌ Error: JIRA_API_TOKEN environment variable not set"
    echo "Export it: export JIRA_API_TOKEN='your-token-here'"
    exit 1
fi

echo "🚀 Creating Aurigraph Enterprise Portal Epic and Tickets..."
echo ""

# Function to create Epic
create_epic() {
    echo "📋 Creating Epic..."

    EPIC_JSON=$(cat <<'EOF'
{
  "fields": {
    "project": {
      "key": "AV11"
    },
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
          "content": [{"type": "text", "text": "Overview"}]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "The Aurigraph Enterprise Portal is a production-grade web application for managing and monitoring the Aurigraph blockchain platform. It includes:"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Real-time dashboards with Vizro integration"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Transaction and block explorers"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Validator management and analytics"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "AI/ML optimization controls"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Quantum security management"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Cross-chain bridge interface"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "HMS integration for healthcare records"}]}]}
          ]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Goals"}]
        },
        {
          "type": "bulletList",
          "content": [
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Production deployment at https://dlt.aurigraph.io"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Support 2M+ TPS monitoring"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Real-time updates (5-second refresh)"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Mobile-responsive design"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "RBAC with enterprise-grade security"}]}]}
          ]
        }
      ]
    },
    "issuetype": {
      "name": "Epic"
    },
    "customfield_10011": "PORTAL-2025"
  }
}
EOF
)

    EPIC_RESPONSE=$(curl -s -X POST "$JIRA_URL/rest/api/3/issue" \
        -H "Content-Type: application/json" \
        -H "Authorization: Basic $(echo -n "$JIRA_USER:$JIRA_API_TOKEN" | base64)" \
        -d "$EPIC_JSON")

    EPIC_KEY=$(echo "$EPIC_RESPONSE" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$EPIC_KEY" ]; then
        echo "❌ Failed to create Epic"
        echo "Response: $EPIC_RESPONSE"
        exit 1
    fi

    echo "✅ Epic created: $EPIC_KEY"
    echo "$EPIC_KEY"
}

# Create the Epic
EPIC_KEY=$(create_epic)
echo ""
echo "📝 Epic Key: $EPIC_KEY"
echo "🔗 View at: $JIRA_URL/browse/$EPIC_KEY"
echo ""
echo "✅ Epic created successfully!"
echo ""
echo "📌 Next steps:"
echo "1. Create individual feature tickets using the ENTERPRISE-PORTAL-FEATURES.md document"
echo "2. Link tickets to epic: $EPIC_KEY"
echo "3. Assign to sprints based on priority (P0, P1, P2)"
echo ""
echo "Total features to be ticketed:"
echo "  - P0 (Must Have): 22 features"
echo "  - P1 (Should Have): 25 features"
echo "  - P2 (Nice to Have): 4 features"
echo "  Total: 51 features (~793 story points)"
