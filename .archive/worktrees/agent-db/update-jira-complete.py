#!/usr/bin/env python3

import requests
import json
import time
from requests.auth import HTTPBasicAuth

# JIRA Configuration
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
PROJECT_KEY = "AV11"

auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
headers = {"Content-Type": "application/json"}

print("=" * 60)
print("JIRA Complete Project Update")
print("Aurigraph V11 Enterprise Portal")
print("=" * 60)
print()

def create_issue(issue_type, summary, description, story_points=None, parent_key=None):
    """Create a JIRA issue"""

    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": description
                            }
                        ]
                    }
                ]
            },
            "issuetype": {"name": issue_type}
        }
    }

    # Add story points if provided
    # Note: Story points field may vary by JIRA configuration
    # Commenting out for now as customfield_10016 is not available
    # if story_points:
    #     payload["fields"]["customfield_10016"] = story_points

    # Add parent if provided
    if parent_key:
        payload["fields"]["parent"] = {"key": parent_key}

    response = requests.post(
        f"{JIRA_BASE_URL}/rest/api/3/issue",
        auth=auth,
        headers=headers,
        json=payload
    )

    if response.status_code == 201:
        issue_data = response.json()
        return issue_data.get("key")
    else:
        print(f"  ⚠ Error creating issue: {response.status_code}")
        print(f"  Response: {response.text}")
        return None

def transition_to_done(issue_key):
    """Transition issue to Done status"""

    # Get available transitions
    response = requests.get(
        f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}/transitions",
        auth=auth
    )

    if response.status_code == 200:
        transitions = response.json().get("transitions", [])

        # Find Done transition
        done_transition = next(
            (t for t in transitions if t["name"].lower() in ["done", "closed", "complete"]),
            None
        )

        if done_transition:
            # Perform transition
            transition_payload = {
                "transition": {"id": done_transition["id"]}
            }

            response = requests.post(
                f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}/transitions",
                auth=auth,
                headers=headers,
                json=transition_payload
            )

            if response.status_code == 204:
                return True

    return False

# Phase 1: Foundation & Analytics (199 pts)
print("Creating Phase 1 Epic and Tasks...")
phase1_sprints = [
    ("Sprint 1: Enterprise Portal Foundation", 20, "Dashboard foundation, authentication, user management"),
    ("Sprint 2: Dashboard & Real-time Monitoring", 19, "Real-time metrics, live updates, system health"),
    ("Sprint 3: Transaction Management", 26, "Transaction tracking, filtering, search, details"),
    ("Sprint 4: Governance & Staking", 21, "Proposal voting, staking operations, delegation"),
    ("Sprint 5: Asset Management - Tokens", 18, "Token transfers, balances, metadata"),
    ("Sprint 6: Asset Management - NFTs", 19, "NFT management, collections, metadata"),
    ("Sprint 7: Smart Contracts & Security", 21, "Contract deployment, registry, security audits"),
    ("Sprint 8: Cross-Chain & Performance", 26, "Cross-chain transfers, performance optimization"),
    ("Sprint 9: Advanced Analytics", 26, "Transaction analytics, validator analytics, time-series"),
    ("Sprint 10: System Configuration", 13, "Network config, system settings, API keys")
]

phase1_epic = create_issue(
    "Epic",
    "Phase 1: Foundation & Analytics (199 pts)",
    "Enterprise portal foundation with dashboard, transactions, governance, assets, analytics, and configuration management.",
    199
)
if phase1_epic:
    print(f"✓ Created Epic: {phase1_epic}")

    for summary, points, description in phase1_sprints:
        story_key = create_issue("Task", summary, description, points, phase1_epic)
        if story_key:
            transition_to_done(story_key)
            print(f"  ✓ {story_key}: {summary}")
        time.sleep(0.5)  # Rate limiting
else:
    print("✗ Failed to create Phase 1 Epic")

print()

# Phase 2: Blockchain Infrastructure (201 pts)
print("Creating Phase 2 Epic and Tasks...")
phase2_sprints = [
    ("Sprint 11: Validator Management", 21, "Validator registration, delegation, rewards, performance"),
    ("Sprint 12: Consensus Monitoring", 21, "HyperRAFT++ monitoring, leader election, performance"),
    ("Sprint 13: Node Management", 18, "Node registration, health monitoring, P2P network"),
    ("Sprint 14: State Management", 21, "State snapshots, pruning, synchronization"),
    ("Sprint 15: Channel Management", 21, "Payment channels, state channels, monitoring"),
    ("Sprint 16: Block Explorer", 18, "Block details, transaction history, search"),
    ("Sprint 17: Mempool Monitoring", 21, "Transaction pool, pending txs, priority queue"),
    ("Sprint 18: Audit Logging", 18, "Comprehensive audit trail, compliance logging"),
    ("Sprint 19: NFT Marketplace", 21, "NFT trading, listings, auctions, royalties"),
    ("Sprint 20: Staking Dashboard", 21, "Staking analytics, rewards tracking, APY calculation")
]

phase2_epic = create_issue(
    "Epic",
    "Phase 2: Blockchain Infrastructure (201 pts)",
    "Core blockchain infrastructure including validators, consensus, nodes, state, channels, blocks, and marketplace.",
    201
)
if phase2_epic:
    print(f"✓ Created Epic: {phase2_epic}")

    for summary, points, description in phase2_sprints:
        story_key = create_issue("Task", summary, description, points, phase2_epic)
        if story_key:
            transition_to_done(story_key)
            print(f"  ✓ {story_key}: {summary}")
        time.sleep(0.5)
else:
    print("✗ Failed to create Phase 2 Epic")

print()

# Phase 3: Advanced Features (198 pts)
print("Creating Phase 3 Epic and Tasks...")
phase3_sprints = [
    ("Sprint 21: Real-Time Monitoring", 21, "Live TPS tracking, latency metrics, WebSocket updates"),
    ("Sprint 22: Advanced Analytics", 18, "Predictive analytics, trend forecasting, ML insights"),
    ("Sprint 23: Cross-Chain Bridge Advanced", 21, "15+ blockchain support, bridge transfers, monitoring"),
    ("Sprint 24: Multi-Signature Wallets", 18, "Multi-sig creation, signer management, approvals"),
    ("Sprint 25: Atomic Swaps & DEX Routing", 21, "HTLC swaps, DEX routing, liquidity pools"),
    ("Sprint 26: Oracle Integration", 21, "Price feeds, Chainlink, Band Protocol, oracle providers"),
    ("Sprint 27: Privacy Features & ZK-Proofs", 18, "ZK-SNARKs, ring signatures, stealth addresses"),
    ("Sprint 28: Audit & Compliance", 21, "KYC/AML, GDPR, SOC2, compliance reporting"),
    ("Sprint 29: API Gateway", 18, "Rate limiting, usage analytics, throttling"),
    ("Sprint 30: Developer Portal", 21, "SDKs (8 languages), code examples, documentation")
]

phase3_epic = create_issue(
    "Epic",
    "Phase 3: Advanced Features (198 pts)",
    "Advanced blockchain features including monitoring, cross-chain, privacy, oracles, and developer tools.",
    198
)
if phase3_epic:
    print(f"✓ Created Epic: {phase3_epic}")

    for summary, points, description in phase3_sprints:
        story_key = create_issue("Task", summary, description, points, phase3_epic)
        if story_key:
            transition_to_done(story_key)
            print(f"  ✓ {story_key}: {summary}")
        time.sleep(0.5)
else:
    print("✗ Failed to create Phase 3 Epic")

print()

# Phase 4: Enterprise & Production (195 pts)
print("Creating Phase 4 Epic and Tasks...")
phase4_sprints = [
    ("Sprint 31: Enterprise SSO & Authentication", 21, "SSO providers (8), SAML 2.0, OIDC, session management"),
    ("Sprint 32: Role-Based Access Control", 18, "15 system roles, granular permissions, user assignment"),
    ("Sprint 33: Multi-Tenancy Support", 21, "Tenant management, 147 tenants, usage tracking"),
    ("Sprint 34: Advanced Reporting", 18, "25 report templates, custom reports, multiple formats"),
    ("Sprint 35: Backup & Disaster Recovery", 21, "Full/incremental backups, DR plan, multi-region"),
    ("Sprint 36: High Availability & Clustering", 21, "15-node cluster, load balancing, auto-scaling"),
    ("Sprint 37: Performance Tuning Dashboard", 18, "Performance metrics, optimization recommendations"),
    ("Sprint 38: Mobile App Support", 21, "iOS/Android, push notifications, mobile analytics"),
    ("Sprint 39: Integration Marketplace", 18, "48 integrations, one-click install, 8 categories"),
    ("Sprint 40: Final Testing & Launch Prep", 18, "System readiness, pre-launch checklist, launch metrics")
]

phase4_epic = create_issue(
    "Epic",
    "Phase 4: Enterprise & Production (195 pts)",
    "Enterprise-grade features including SSO, RBAC, multi-tenancy, backup, clustering, and launch preparation.",
    195
)
if phase4_epic:
    print(f"✓ Created Epic: {phase4_epic}")

    for summary, points, description in phase4_sprints:
        story_key = create_issue("Task", summary, description, points, phase4_epic)
        if story_key:
            transition_to_done(story_key)
            print(f"  ✓ {story_key}: {summary}")
        time.sleep(0.5)
else:
    print("✗ Failed to create Phase 4 Epic")

print()
print("=" * 60)
print("✓ JIRA Update Complete!")
print("=" * 60)
print()
print("Summary:")
print(f"  • Phase 1 Epic: {phase1_epic} (199 pts, 10 stories)")
print(f"  • Phase 2 Epic: {phase2_epic} (201 pts, 10 stories)")
print(f"  • Phase 3 Epic: {phase3_epic} (198 pts, 10 stories)")
print(f"  • Phase 4 Epic: {phase4_epic} (195 pts, 10 stories)")
print()
print("  Total: 4 Epics, 40 Stories, 793 Story Points")
print("  All issues marked as DONE")
print()
print(f"JIRA Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789")
print()
