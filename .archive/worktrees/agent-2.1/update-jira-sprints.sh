#!/bin/bash

# JIRA Update Script for Completed Sprints
# Updates JIRA tickets to Done status for completed sprints

# JIRA Configuration
# Email: subbu@aurigraph.io (Memorized for authentication)
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_PROJECT="AV11"
JIRA_USER="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C"

# Auth header
AUTH=$(echo -n "$JIRA_USER:$JIRA_API_TOKEN" | base64)

# Function to update ticket status
update_ticket_status() {
    local ticket_id=$1
    local status=$2

    echo "Updating $ticket_id to $status..."

    # Get transition ID for "Done" status
    # First, get available transitions
    TRANSITIONS=$(curl -s -X GET \
        -H "Authorization: Basic $AUTH" \
        -H "Content-Type: application/json" \
        "$JIRA_URL/rest/api/3/issue/$ticket_id/transitions")

    # Find the transition ID for "Done" (usually 31 or 41, but let's find it dynamically)
    DONE_TRANSITION_ID=$(echo $TRANSITIONS | jq -r '.transitions[] | select(.name=="Done") | .id')

    if [ -z "$DONE_TRANSITION_ID" ]; then
        echo "  ⚠️  Could not find 'Done' transition for $ticket_id"
        return 1
    fi

    # Transition the issue
    curl -s -X POST \
        -H "Authorization: Basic $AUTH" \
        -H "Content-Type: application/json" \
        -d "{\"transition\":{\"id\":\"$DONE_TRANSITION_ID\"}}" \
        "$JIRA_URL/rest/api/3/issue/$ticket_id/transitions"

    echo "  ✅ $ticket_id updated to Done"
}

# Function to add comment
add_comment() {
    local ticket_id=$1
    local comment=$2

    curl -s -X POST \
        -H "Authorization: Basic $AUTH" \
        -H "Content-Type: application/json" \
        -d "{\"body\":{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"$comment\"}]}]}}" \
        "$JIRA_URL/rest/api/3/issue/$ticket_id/comment"
}

echo "==================================="
echo "JIRA Sprint Update - Sprints 6-8"
echo "==================================="
echo ""

# Sprint 6: Asset Management (16 points)
echo "📦 Sprint 6: Asset Management"
update_ticket_status "AV11-034" "Done"  # Token Registry
add_comment "AV11-034" "✅ Token Registry completed with search, filtering, sorting, and pagination. Mock data fallback implemented."

update_ticket_status "AV11-035" "Done"  # NFT Gallery
add_comment "AV11-035" "✅ NFT Gallery completed with grid layout, infinite scroll, category filtering, and modal detail view."

echo ""

# Sprint 7: Smart Contracts & Security (21 points)
echo "🔐 Sprint 7: Smart Contracts & Security"
update_ticket_status "AV11-036" "Done"  # Smart Contract Registry
add_comment "AV11-036" "✅ Smart Contract Registry completed with verification status tracking, ABI download, and source code viewing for verified contracts."

update_ticket_status "AV11-041" "Done"  # Quantum Cryptography Dashboard
add_comment "AV11-041" "✅ Quantum Cryptography Dashboard completed with CRYSTALS-Kyber and CRYSTALS-Dilithium monitoring, threat level indicators, and security audit logs."

echo ""

# Sprint 8: Cross-Chain & Performance (26 points)
echo "🌉 Sprint 8: Cross-Chain & Performance"
update_ticket_status "AV11-044" "Done"  # Bridge Statistics
add_comment "AV11-044" "✅ Bridge Statistics Dashboard completed with TVL tracking, multi-chain support (5 chains), success rate monitoring, and transfer analytics."

update_ticket_status "AV11-050" "Done"  # Performance Testing
add_comment "AV11-050" "✅ Performance Test Dashboard completed with live test execution, real-time TPS charting, latency metrics, and regression detection."

echo ""
echo "==================================="
echo "✅ JIRA Update Complete"
echo "==================================="
echo "Sprints 6-8 marked as Done in JIRA"
echo "Total: 63 story points completed"
echo ""
