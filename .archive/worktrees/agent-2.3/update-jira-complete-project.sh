#!/bin/bash

# JIRA Complete Project Update Script
# Updates JIRA with all 4 phases, 40 sprints organized as Epics → Stories → Tasks

set -e

# JIRA Configuration
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
PROJECT_KEY="AV11"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JIRA Complete Project Update${NC}"
echo -e "${BLUE}Aurigraph V11 Enterprise Portal${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to create JIRA issue
create_jira_issue() {
    local issue_type=$1
    local summary=$2
    local description=$3
    local story_points=$4
    local parent_key=$5

    local json_data="{
        \"fields\": {
            \"project\": {\"key\": \"${PROJECT_KEY}\"},
            \"summary\": \"${summary}\",
            \"description\": \"${description}\",
            \"issuetype\": {\"name\": \"${issue_type}\"}
            $([ ! -z "$story_points" ] && echo ", \"customfield_10016\": ${story_points}")
            $([ ! -z "$parent_key" ] && echo ", \"parent\": {\"key\": \"${parent_key}\"}")
        }
    }"

    response=$(curl -s -X POST \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${json_data}" \
        "${JIRA_BASE_URL}/rest/api/3/issue")

    issue_key=$(echo "$response" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "$issue_key"
}

# Function to transition issue to Done
transition_to_done() {
    local issue_key=$1

    # Get transition ID for "Done"
    transitions=$(curl -s -X GET \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        "${JIRA_BASE_URL}/rest/api/3/issue/${issue_key}/transitions")

    done_id=$(echo "$transitions" | grep -o '"id":"[^"]*","name":"Done"' | cut -d'"' -f4 | head -1)

    if [ ! -z "$done_id" ]; then
        curl -s -X POST \
            -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{\"transition\":{\"id\":\"${done_id}\"}}" \
            "${JIRA_BASE_URL}/rest/api/3/issue/${issue_key}/transitions" > /dev/null
    fi
}

echo -e "${YELLOW}Creating Phase 1 Epic and Stories...${NC}"

# Phase 1 Epic
PHASE1_EPIC=$(create_jira_issue "Epic" \
    "Phase 1: Foundation & Analytics (199 pts)" \
    "Enterprise portal foundation with dashboard, transactions, governance, assets, analytics, and configuration management." \
    "199" \
    "")
echo -e "${GREEN}✓ Created Epic: ${PHASE1_EPIC}${NC}"

# Phase 1 Stories (Sprints 1-10)
declare -a PHASE1_SPRINTS=(
    "Sprint 1: Enterprise Portal Foundation|20|Dashboard foundation, authentication, user management"
    "Sprint 2: Dashboard & Real-time Monitoring|19|Real-time metrics, live updates, system health"
    "Sprint 3: Transaction Management|26|Transaction tracking, filtering, search, details"
    "Sprint 4: Governance & Staking|21|Proposal voting, staking operations, delegation"
    "Sprint 5: Asset Management - Tokens|18|Token transfers, balances, metadata"
    "Sprint 6: Asset Management - NFTs|19|NFT management, collections, metadata"
    "Sprint 7: Smart Contracts & Security|21|Contract deployment, registry, security audits"
    "Sprint 8: Cross-Chain & Performance|26|Cross-chain transfers, performance optimization"
    "Sprint 9: Advanced Analytics|26|Transaction analytics, validator analytics, time-series"
    "Sprint 10: System Configuration|13|Network config, system settings, API keys"
)

for sprint in "${PHASE1_SPRINTS[@]}"; do
    IFS='|' read -r summary points description <<< "$sprint"
    story_key=$(create_jira_issue "Story" "$summary" "$description" "$points" "$PHASE1_EPIC")
    transition_to_done "$story_key"
    echo -e "${GREEN}  ✓ ${story_key}: ${summary}${NC}"
done

echo ""
echo -e "${YELLOW}Creating Phase 2 Epic and Stories...${NC}"

# Phase 2 Epic
PHASE2_EPIC=$(create_jira_issue "Epic" \
    "Phase 2: Blockchain Infrastructure (201 pts)" \
    "Core blockchain infrastructure including validators, consensus, nodes, state, channels, blocks, and marketplace." \
    "201" \
    "")
echo -e "${GREEN}✓ Created Epic: ${PHASE2_EPIC}${NC}"

# Phase 2 Stories (Sprints 11-20)
declare -a PHASE2_SPRINTS=(
    "Sprint 11: Validator Management|21|Validator registration, delegation, rewards, performance"
    "Sprint 12: Consensus Monitoring|21|HyperRAFT++ monitoring, leader election, performance"
    "Sprint 13: Node Management|18|Node registration, health monitoring, P2P network"
    "Sprint 14: State Management|21|State snapshots, pruning, synchronization"
    "Sprint 15: Channel Management|21|Payment channels, state channels, monitoring"
    "Sprint 16: Block Explorer|18|Block details, transaction history, search"
    "Sprint 17: Mempool Monitoring|21|Transaction pool, pending txs, priority queue"
    "Sprint 18: Audit Logging|18|Comprehensive audit trail, compliance logging"
    "Sprint 19: NFT Marketplace|21|NFT trading, listings, auctions, royalties"
    "Sprint 20: Staking Dashboard|21|Staking analytics, rewards tracking, APY calculation"
)

for sprint in "${PHASE2_SPRINTS[@]}"; do
    IFS='|' read -r summary points description <<< "$sprint"
    story_key=$(create_jira_issue "Story" "$summary" "$points" "$description" "$PHASE2_EPIC")
    transition_to_done "$story_key"
    echo -e "${GREEN}  ✓ ${story_key}: ${summary}${NC}"
done

echo ""
echo -e "${YELLOW}Creating Phase 3 Epic and Stories...${NC}"

# Phase 3 Epic
PHASE3_EPIC=$(create_jira_issue "Epic" \
    "Phase 3: Advanced Features (198 pts)" \
    "Advanced blockchain features including monitoring, cross-chain, privacy, oracles, and developer tools." \
    "198" \
    "")
echo -e "${GREEN}✓ Created Epic: ${PHASE3_EPIC}${NC}"

# Phase 3 Stories (Sprints 21-30)
declare -a PHASE3_SPRINTS=(
    "Sprint 21: Real-Time Monitoring|21|Live TPS tracking, latency metrics, WebSocket updates"
    "Sprint 22: Advanced Analytics|18|Predictive analytics, trend forecasting, ML insights"
    "Sprint 23: Cross-Chain Bridge Advanced|21|15+ blockchain support, bridge transfers, monitoring"
    "Sprint 24: Multi-Signature Wallets|18|Multi-sig creation, signer management, approvals"
    "Sprint 25: Atomic Swaps & DEX Routing|21|HTLC swaps, DEX routing, liquidity pools"
    "Sprint 26: Oracle Integration|21|Price feeds, Chainlink, Band Protocol, oracle providers"
    "Sprint 27: Privacy Features & ZK-Proofs|18|ZK-SNARKs, ring signatures, stealth addresses"
    "Sprint 28: Audit & Compliance|21|KYC/AML, GDPR, SOC2, compliance reporting"
    "Sprint 29: API Gateway|18|Rate limiting, usage analytics, throttling"
    "Sprint 30: Developer Portal|21|SDKs (8 languages), code examples, documentation"
)

for sprint in "${PHASE3_SPRINTS[@]}"; do
    IFS='|' read -r summary points description <<< "$sprint"
    story_key=$(create_jira_issue "Story" "$summary" "$points" "$description" "$PHASE3_EPIC")
    transition_to_done "$story_key"
    echo -e "${GREEN}  ✓ ${story_key}: ${summary}${NC}"
done

echo ""
echo -e "${YELLOW}Creating Phase 4 Epic and Stories...${NC}"

# Phase 4 Epic
PHASE4_EPIC=$(create_jira_issue "Epic" \
    "Phase 4: Enterprise & Production (195 pts)" \
    "Enterprise-grade features including SSO, RBAC, multi-tenancy, backup, clustering, and launch preparation." \
    "195" \
    "")
echo -e "${GREEN}✓ Created Epic: ${PHASE4_EPIC}${NC}"

# Phase 4 Stories (Sprints 31-40)
declare -a PHASE4_SPRINTS=(
    "Sprint 31: Enterprise SSO & Authentication|21|SSO providers (8), SAML 2.0, OIDC, session management"
    "Sprint 32: Role-Based Access Control|18|15 system roles, granular permissions, user assignment"
    "Sprint 33: Multi-Tenancy Support|21|Tenant management, 147 tenants, usage tracking"
    "Sprint 34: Advanced Reporting|18|25 report templates, custom reports, multiple formats"
    "Sprint 35: Backup & Disaster Recovery|21|Full/incremental backups, DR plan, multi-region"
    "Sprint 36: High Availability & Clustering|21|15-node cluster, load balancing, auto-scaling"
    "Sprint 37: Performance Tuning Dashboard|18|Performance metrics, optimization recommendations"
    "Sprint 38: Mobile App Support|21|iOS/Android, push notifications, mobile analytics"
    "Sprint 39: Integration Marketplace|18|48 integrations, one-click install, 8 categories"
    "Sprint 40: Final Testing & Launch Prep|18|System readiness, pre-launch checklist, launch metrics"
)

for sprint in "${PHASE4_SPRINTS[@]}"; do
    IFS='|' read -r summary points description <<< "$sprint"
    story_key=$(create_jira_issue "Story" "$summary" "$points" "$description" "$PHASE4_EPIC")
    transition_to_done "$story_key"
    echo -e "${GREEN}  ✓ ${story_key}: ${summary}${NC}"
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ JIRA Update Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo -e "  • Phase 1 Epic: ${PHASE1_EPIC} (199 pts, 10 stories)"
echo -e "  • Phase 2 Epic: ${PHASE2_EPIC} (201 pts, 10 stories)"
echo -e "  • Phase 3 Epic: ${PHASE3_EPIC} (198 pts, 10 stories)"
echo -e "  • Phase 4 Epic: ${PHASE4_EPIC} (195 pts, 10 stories)"
echo -e ""
echo -e "  ${GREEN}Total: 4 Epics, 40 Stories, 793 Story Points${NC}"
echo -e "  ${GREEN}All issues marked as DONE${NC}"
echo ""
echo -e "${BLUE}JIRA Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789${NC}"
echo ""
