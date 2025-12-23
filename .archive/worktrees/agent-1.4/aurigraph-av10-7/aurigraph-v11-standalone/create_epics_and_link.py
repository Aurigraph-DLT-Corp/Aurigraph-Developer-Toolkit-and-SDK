#!/usr/bin/env python3
"""
Create JIRA Epics and link tickets to them
"""

import requests
import json

# JIRA Configuration
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
PROJECT_KEY = "AV11"

# Define Epics and their child tickets
EPICS = [
    {
        "summary": "Cross-Chain Bridge Integration",
        "description": """Epic for implementing cross-chain bridge monitoring and management features.

**Objectives**:
- Enable real-time bridge status monitoring
- Provide historical transaction tracking
- Support multiple blockchain integrations
- Ensure high availability and reliability

**Business Value**:
- Enhanced visibility into cross-chain operations
- Better user experience for bridge users
- Improved debugging and troubleshooting
- Foundation for future cross-chain features

**Technical Scope**:
- Bridge health status monitoring
- Transaction history and tracking
- Multi-chain support infrastructure
- API endpoints for bridge data""",
        "labels": ["bridge", "cross-chain", "integration", "epic"],
        "child_tickets": ["AV11-281", "AV11-282"]
    },
    {
        "summary": "Enterprise Portal Features",
        "description": """Epic for implementing comprehensive enterprise portal features and improvements.

**Objectives**:
- Deploy Enterprise Portal v4.0.1 and v4.1.0
- Implement enterprise dashboard and monitoring
- Enhance UI/UX for enterprise users
- Complete React/TypeScript infrastructure setup

**Business Value**:
- Professional enterprise-grade portal
- Improved user experience and satisfaction
- Better enterprise feature visibility
- Modern frontend architecture

**Technical Scope**:
- React/Vite/TypeScript setup (AV11-208-211)
- Material-UI theming and components
- Enterprise dashboard API
- Portal versions 4.0.1 and 4.1.0
- UI/UX improvements for missing APIs
- Component testing suite (AV11-212-214)""",
        "labels": ["enterprise", "portal", "frontend", "epic"],
        "child_tickets": ["AV11-208", "AV11-209", "AV11-210", "AV11-211",
                         "AV11-212", "AV11-213", "AV11-214",
                         "AV11-264", "AV11-265", "AV11-276", "AV11-283"]
    },
    {
        "summary": "Oracle & Data Feeds Integration",
        "description": """Epic for implementing oracle services and real-time data feed capabilities.

**Objectives**:
- Implement price feed aggregation
- Enable oracle health monitoring
- Support multiple data sources
- Ensure data reliability and accuracy

**Business Value**:
- Real-time price data for users
- Enhanced oracle transparency
- Better data feed reliability
- Foundation for DeFi features

**Technical Scope**:
- Price feed display API
- Oracle status monitoring
- Data source integration
- Real-time data updates""",
        "labels": ["oracle", "datafeeds", "integration", "epic"],
        "child_tickets": ["AV11-284", "AV11-285"]
    },
    {
        "summary": "Security & Cryptography Infrastructure",
        "description": """Epic for implementing advanced security features and cryptography monitoring.

**Objectives**:
- Expose quantum cryptography details
- Implement HSM status monitoring
- Enhance security visibility
- Support post-quantum security standards

**Business Value**:
- Transparent security posture
- Quantum-resistant infrastructure
- HSM integration confidence
- Regulatory compliance support

**Technical Scope**:
- Quantum cryptography status API (Kyber, Dilithium)
- HSM health monitoring
- Security metrics and dashboards
- Key management visibility""",
        "labels": ["security", "cryptography", "quantum", "hsm", "epic"],
        "child_tickets": ["AV11-286", "AV11-287"]
    },
    {
        "summary": "Smart Contract Management",
        "description": """Epic for implementing Ricardian contract management and validation features.

**Objectives**:
- Enable contract browsing and listing
- Validate contract upload functionality
- Improve contract management UX
- Support contract metadata

**Business Value**:
- Better contract discoverability
- Improved contract upload experience
- Enhanced contract management
- Foundation for contract marketplace

**Technical Scope**:
- Paginated contract listing API
- Contract upload validation
- Search and filter capabilities
- Contract metadata display""",
        "labels": ["contracts", "ricardian", "management", "epic"],
        "child_tickets": ["AV11-288", "AV11-289"]
    },
    {
        "summary": "System Monitoring & Network Analytics",
        "description": """Epic for implementing comprehensive system monitoring and network analytics features.

**Objectives**:
- Provide system information API
- Enable live network monitoring
- Enhance network analytics
- Support real-time metrics

**Business Value**:
- Complete system visibility
- Real-time network insights
- Better troubleshooting capabilities
- Enhanced monitoring dashboards

**Technical Scope**:
- System information API (version, config)
- Live network monitor (implemented in AV11-275)
- Network analytics and metrics
- Real-time monitoring features

**Completed Work**:
- ✅ AV11-275: Live Network Monitor API (Oct 11, 2025)""",
        "labels": ["monitoring", "analytics", "network", "system", "epic"],
        "child_tickets": ["AV11-275", "AV11-290"]
    }
]

def create_epic(epic_data):
    """Create a JIRA Epic"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue"

    payload = {
        "fields": {
            "project": {
                "key": PROJECT_KEY
            },
            "summary": epic_data["summary"],
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": epic_data["description"]
                            }
                        ]
                    }
                ]
            },
            "issuetype": {
                "name": "Epic"
            },
            "labels": epic_data.get("labels", [])
        }
    }

    response = requests.post(
        url,
        auth=(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        data=json.dumps(payload)
    )

    return response

def link_ticket_to_epic(ticket_key, epic_key):
    """Link a ticket to an epic using the parent field"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}"

    payload = {
        "fields": {
            "parent": {
                "key": epic_key
            }
        }
    }

    response = requests.put(
        url,
        auth=(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        data=json.dumps(payload)
    )

    return response

def main():
    print("Creating JIRA Epics and linking child tickets...\n")
    print("="*70)

    created_epics = []
    epic_links = {}

    # Step 1: Create Epics
    print("\n📋 STEP 1: Creating Epics\n")

    for i, epic in enumerate(EPICS, 1):
        print(f"[{i}/{len(EPICS)}] Creating Epic: {epic['summary']}")

        response = create_epic(epic)

        if response.status_code == 201:
            epic_data = response.json()
            epic_key = epic_data.get("key")
            print(f"  ✅ SUCCESS: {epic_key}")
            print(f"  URL: {JIRA_BASE_URL}/browse/{epic_key}")
            print(f"  Child Tickets: {', '.join(epic['child_tickets'])}")

            created_epics.append(epic_key)
            epic_links[epic_key] = epic['child_tickets']
        else:
            print(f"  ❌ FAILED: {response.status_code}")
            print(f"  Error: {response.text[:200]}")

        print()

    # Step 2: Link tickets to Epics
    print("\n" + "="*70)
    print("🔗 STEP 2: Linking Tickets to Epics\n")

    linked_count = 0
    failed_count = 0

    for epic_key, child_tickets in epic_links.items():
        print(f"\nLinking tickets to {epic_key}:")

        for ticket_key in child_tickets:
            print(f"  Linking {ticket_key}...", end=" ")

            response = link_ticket_to_epic(ticket_key, epic_key)

            if response.status_code in [200, 204]:
                print("✅")
                linked_count += 1
            else:
                print(f"❌ ({response.status_code})")
                if response.text:
                    print(f"    Error: {response.text[:100]}")
                failed_count += 1

    # Summary
    print("\n" + "="*70)
    print("EPIC CREATION AND LINKING SUMMARY")
    print("="*70)

    print(f"\n📊 Epic Creation:")
    print(f"  Total Epics: {len(EPICS)}")
    print(f"  Created Successfully: {len(created_epics)}")
    print(f"  Failed: {len(EPICS) - len(created_epics)}")

    print(f"\n🔗 Ticket Linking:")
    total_tickets = sum(len(tickets) for tickets in epic_links.values())
    print(f"  Total Tickets to Link: {total_tickets}")
    print(f"  Linked Successfully: {linked_count}")
    print(f"  Failed: {failed_count}")

    if created_epics:
        print("\n✅ Successfully Created Epics:")
        for epic_key in created_epics:
            print(f"  - {epic_key}: {JIRA_BASE_URL}/browse/{epic_key}")

    print("\n" + "="*70)
    print()

if __name__ == "__main__":
    main()
