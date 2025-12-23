#!/usr/bin/env python3
"""
Create new JIRA tickets for missing API endpoints
"""

import requests
import json

# JIRA Configuration
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
PROJECT_KEY = "AV11"

# Define tickets to create
TICKETS = [
    {
        "summary": "Implement Bridge Status Monitor API",
        "description": """Implement the Bridge Status Monitor API to provide real-time cross-chain bridge health visibility.

**Component**: Cross-Chain Bridge Status
**API Endpoint**: `/api/v11/bridge/status`
**Priority**: Low (P2)

**Requirements**:
- Return bridge health status
- Show active bridges for each chain
- Display transfer statistics
- Include error rates and latency

**Acceptance Criteria**:
- Endpoint returns 200 OK with bridge status data
- JSON response with health metrics
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 3 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "bridge", "monitoring", "p2"]
    },
    {
        "summary": "Implement Bridge Transaction History API",
        "description": """Implement the Bridge Transaction History API to provide historical cross-chain transfer data.

**Component**: Cross-Chain TX History
**API Endpoint**: `/api/v11/bridge/history`
**Priority**: Low (P2)

**Requirements**:
- Paginated transaction history
- Filter by chain, status, date range
- Show transfer details (source, dest, amount, status)
- Include timestamps and transaction IDs

**Acceptance Criteria**:
- Endpoint returns 200 OK with transaction history
- Pagination support (limit, offset)
- Filter query parameters working
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 4 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "bridge", "history", "p2"]
    },
    {
        "summary": "Implement Enterprise Dashboard API",
        "description": """Implement the Enterprise Dashboard API to provide comprehensive enterprise features overview.

**Component**: Enterprise Features Overview
**API Endpoint**: `/api/v11/enterprise/status`
**Priority**: Low (P2)

**Requirements**:
- Enterprise license status
- Multi-tenancy statistics
- Resource usage by tenant
- Feature usage metrics
- Billing/usage summary

**Acceptance Criteria**:
- Endpoint returns 200 OK with enterprise metrics
- JSON response with tenant data
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 3 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "enterprise", "dashboard", "p2"]
    },
    {
        "summary": "Implement Price Feed Display API",
        "description": """Implement the Price Feed Display API to provide real-time cryptocurrency price data.

**Component**: Real-time Price Data Widget
**API Endpoint**: `/api/v11/datafeeds/prices`
**Priority**: Low (P2)

**Requirements**:
- Real-time price data for major tokens
- Historical price data (24h, 7d, 30d)
- Price change percentages
- Market cap and volume
- Integration with external price oracles

**Acceptance Criteria**:
- Endpoint returns 200 OK with price data
- Support for multiple tokens
- Historical data queries
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 4 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "oracle", "prices", "p2"]
    },
    {
        "summary": "Implement Oracle Status API",
        "description": """Implement the Oracle Status API to monitor oracle service health and data feeds.

**Component**: Oracle Service Monitor
**API Endpoint**: `/api/v11/oracles/status`
**Priority**: Low (P2)

**Requirements**:
- Oracle service health status
- Active data feeds list
- Update frequency and latency
- Error rates and reliability metrics
- Data source information

**Acceptance Criteria**:
- Endpoint returns 200 OK with oracle status
- JSON response with feed data
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 3 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "oracle", "monitoring", "p2"]
    },
    {
        "summary": "Implement Quantum Cryptography Status API",
        "description": """Implement the Quantum Cryptography Status API to expose post-quantum security details.

**Component**: Quantum Crypto Status
**API Endpoint**: `/api/v11/security/quantum`
**Priority**: Low (P2)

**Requirements**:
- Quantum algorithm status (Kyber, Dilithium)
- Key generation statistics
- Signature verification stats
- Security level information
- Performance metrics

**Acceptance Criteria**:
- Endpoint returns 200 OK with quantum crypto status
- JSON response with algorithm details
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 2 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "security", "quantum", "p2"]
    },
    {
        "summary": "Implement HSM Status API",
        "description": """Implement the Hardware Security Module (HSM) Status API for HSM health monitoring.

**Component**: Hardware Security Module Monitor
**API Endpoint**: `/api/v11/security/hsm/status`
**Priority**: Low (P2)

**Requirements**:
- HSM connection status
- Available HSM modules
- Key storage statistics
- Operation throughput
- Error rates and alerts

**Acceptance Criteria**:
- Endpoint returns 200 OK with HSM status
- JSON response with HSM metrics
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 2 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "security", "hsm", "p2"]
    },
    {
        "summary": "Implement Ricardian Contracts List API",
        "description": """Implement the Ricardian Contracts List API to enable browsing all contracts.

**Component**: Contracts List View
**API Endpoint**: `/api/v11/contracts/ricardian`
**Priority**: Low (P2)

**Requirements**:
- Paginated contract listing
- Filter by status, type, date
- Search by contract ID or content
- Sort options (date, status, type)
- Contract metadata display

**Acceptance Criteria**:
- Endpoint returns 200 OK with contract list
- Pagination support (limit, offset)
- Filter and search working
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 4 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "contracts", "ricardian", "p2"]
    },
    {
        "summary": "Test and Document Contract Upload API",
        "description": """Test and document the existing Contract Upload API for production readiness.

**Component**: Document Upload Form
**API Endpoint**: `/api/v11/contracts/ricardian/upload`
**Priority**: Low (P2)

**Requirements**:
- Validate upload endpoint functionality
- Test file size limits
- Test supported formats
- Document API contract
- Add validation error responses

**Acceptance Criteria**:
- Upload endpoint tested and working
- Validation errors properly handled
- Complete API documentation
- Integration tests added
- User guide documentation

**Estimated Effort**: 2 hours""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "contracts", "upload", "testing", "p2"]
    },
    {
        "summary": "Implement System Information API",
        "description": """Implement the System Information API to expose platform version and configuration details.

**Component**: System Info Widget
**API Endpoint**: `/api/v11/info`
**Priority**: Low (P2)

**Requirements**:
- Platform version information
- Build timestamp and commit hash
- Configuration summary (non-sensitive)
- Runtime environment details
- Enabled features/modules

**Acceptance Criteria**:
- Endpoint returns 200 OK with system info
- JSON response with version/config data
- No sensitive information exposed
- OpenAPI documentation
- Unit tests with 95% coverage

**Estimated Effort**: 1 hour""",
        "issuetype": "Task",
        "priority": "Low",
        "labels": ["api", "system", "info", "p2"]
    }
]

def create_jira_ticket(ticket_data):
    """Create a single JIRA ticket"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue"

    # Map priority names to JIRA IDs
    priority_map = {
        "Highest": "1",
        "High": "2",
        "Medium": "3",
        "Low": "4",
        "Lowest": "5"
    }

    payload = {
        "fields": {
            "project": {
                "key": PROJECT_KEY
            },
            "summary": ticket_data["summary"],
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": ticket_data["description"]
                            }
                        ]
                    }
                ]
            },
            "issuetype": {
                "name": ticket_data["issuetype"]
            },
            "labels": ticket_data.get("labels", [])
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

def main():
    print(f"Creating {len(TICKETS)} new JIRA tickets...\n")
    print("="*60)

    created_tickets = []
    failed_tickets = []

    for i, ticket in enumerate(TICKETS, 1):
        print(f"\n[{i}/{len(TICKETS)}] Creating: {ticket['summary']}")

        response = create_jira_ticket(ticket)

        if response.status_code == 201:
            ticket_data = response.json()
            ticket_key = ticket_data.get("key")
            print(f"  ✅ SUCCESS: {ticket_key}")
            print(f"  URL: {JIRA_BASE_URL}/browse/{ticket_key}")
            created_tickets.append(ticket_key)
        else:
            print(f"  ❌ FAILED: {response.status_code}")
            print(f"  Error: {response.text[:200]}")
            failed_tickets.append(ticket['summary'])

    # Summary
    print("\n" + "="*60)
    print("JIRA TICKET CREATION SUMMARY")
    print("="*60)
    print(f"Total Tickets: {len(TICKETS)}")
    print(f"Created Successfully: {len(created_tickets)}")
    print(f"Failed: {len(failed_tickets)}")

    if created_tickets:
        print("\n✅ Successfully Created Tickets:")
        for ticket_key in created_tickets:
            print(f"  - {ticket_key}: {JIRA_BASE_URL}/browse/{ticket_key}")

    if failed_tickets:
        print("\n❌ Failed Tickets:")
        for summary in failed_tickets:
            print(f"  - {summary}")

    print("\n" + "="*60)
    print()

if __name__ == "__main__":
    main()
