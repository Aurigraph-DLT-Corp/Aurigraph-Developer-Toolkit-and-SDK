#!/usr/bin/env node

/**
 * JIRA Sprint 9-15 Synchronization Script (Simplified)
 * Updates summary and description only
 */

const https = require('https');

const JIRA_CONFIG = {
  baseUrl: 'https://aurigraphdlt.atlassian.net',
  email: 'subbu@aurigraph.io',
  apiToken: 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5',
  projectKey: 'AV11'
};

const SPRINTS = [
  {
    name: 'Sprint 9: Core Blockchain APIs',
    startDate: '2025-10-07',
    endDate: '2025-10-18',
    stories: [
      {
        key: 'AV11-051',
        summary: 'Transaction APIs (5 points)',
        description: `**Sprint 9 Story 1**

**Endpoints**:
• GET /api/v11/transactions - List transactions with pagination
• GET /api/v11/transactions/{id} - Get transaction details
• POST /api/v11/transactions - Submit new transaction

**Acceptance Criteria**:
✓ Pagination support (limit, offset)
✓ Filter by status, type, address
✓ Real-time transaction data (no mock data)
✓ Integration with TransactionService.java
✓ 95% test coverage

**Files to Modify**:
• V11ApiResource.java - Add transaction endpoints
• TransactionService.java - Enhance query methods
• Create TransactionQueryService.java for complex queries

**Story Points**: 5
**Sprint**: Sprint 9 (Oct 7-18, 2025)`
      },
      {
        key: 'AV11-052',
        summary: 'Block APIs (3 points)',
        description: `**Sprint 9 Story 2**

**Endpoints**:
• GET /api/v11/blocks - List blocks with pagination
• GET /api/v11/blocks/{height} - Get block by height
• GET /api/v11/blocks/{hash} - Get block by hash

**Acceptance Criteria**:
✓ Block explorer functionality
✓ Transaction list per block
✓ Merkle root verification
✓ Real-time block data

**Files to Create**:
• BlockService.java - Block data service
• Block.java (entity) - Block persistence model
• BlockQueryService.java - Complex block queries

**Story Points**: 3
**Sprint**: Sprint 9 (Oct 7-18, 2025)`
      },
      {
        key: 'AV11-053',
        summary: 'Node Management APIs (5 points)',
        description: `**Sprint 9 Story 3**

**Endpoints**:
• GET /api/v11/nodes - List network nodes
• GET /api/v11/nodes/{id} - Get node details
• POST /api/v11/nodes/register - Register new node
• PUT /api/v11/nodes/{id}/status - Update node status

**Acceptance Criteria**:
✓ Node health monitoring
✓ Validator status tracking
✓ Network topology visualization data
✓ Consensus participation metrics

**Files to Create**:
• NodeManagementService.java - Node lifecycle
• NodeRegistryService.java - Node registry
• Node.java (entity) - Node persistence

**Story Points**: 5
**Sprint**: Sprint 9 (Oct 7-18, 2025)`
      }
    ]
  },
  {
    name: 'Sprint 10: Channel & Multi-Ledger APIs',
    startDate: '2025-10-21',
    endDate: '2025-11-01',
    stories: [
      {
        key: 'AV11-054',
        summary: 'Channel Management APIs (8 points)',
        description: `**Sprint 10 Story 1**

**Endpoints**:
• GET /api/v11/channels - List all channels
• GET /api/v11/channels/{id} - Get channel details
• POST /api/v11/channels - Create new channel
• PUT /api/v11/channels/{id}/config - Update channel configuration
• DELETE /api/v11/channels/{id} - Archive channel
• GET /api/v11/channels/{id}/metrics - Channel performance metrics
• GET /api/v11/channels/{id}/transactions - Channel transactions

**Acceptance Criteria**:
✓ Hyperledger Fabric-style channels
✓ Channel isolation and privacy
✓ Per-channel consensus configuration
✓ Channel member management
✓ Real-time channel metrics

**Files to Create**:
• ChannelManagementService.java
• Channel.java (entity)
• ChannelMember.java (entity)
• ChannelMetricsService.java

**Story Points**: 8
**Sprint**: Sprint 10 (Oct 21 - Nov 1, 2025)`
      },
      {
        key: 'AV11-055',
        summary: 'Portal Channel Dashboard Integration (5 points)',
        description: `**Sprint 10 Story 2**

**Component**: ChannelManagement.tsx

**Tasks**:
• Remove hardcoded channel data (line 22-48)
• Integrate with channel APIs
• Real-time channel metrics display
• Channel creation wizard
• Member management UI

**Acceptance Criteria**:
✓ NO static data (verified)
✓ All data from /api/v11/channels
✓ Auto-refresh every 30 seconds
✓ Error handling for API failures

**Story Points**: 5
**Sprint**: Sprint 10 (Oct 21 - Nov 1, 2025)`
      }
    ]
  },
  {
    name: 'Sprint 11: Smart Contract APIs',
    startDate: '2025-11-04',
    endDate: '2025-11-15',
    stories: [
      {
        key: 'AV11-056',
        summary: 'Contract Deployment & Execution APIs (8 points)',
        description: `**Sprint 11 Story 1**

**Endpoints**:
• GET /api/v11/contracts - List contracts with filters
• GET /api/v11/contracts/{id} - Get contract details
• GET /api/v11/contracts/templates - Contract templates
• POST /api/v11/contracts/deploy - Deploy new contract
• POST /api/v11/contracts/{id}/execute - Execute contract method
• POST /api/v11/contracts/{id}/verify - Verify contract source
• POST /api/v11/contracts/{id}/audit - Security audit
• GET /api/v11/contracts/statistics - Contract statistics

**Acceptance Criteria**:
✓ Integration with SmartContractService.java
✓ Contract compilation and deployment
✓ ABI parsing and method execution
✓ Source code verification
✓ Security audit reports
✓ Gas estimation

**Story Points**: 8
**Sprint**: Sprint 11 (Nov 4-15, 2025)`
      },
      {
        key: 'AV11-057',
        summary: 'Portal Smart Contract Registry (5 points)',
        description: `**Sprint 11 Story 2**

**Component**: SmartContractRegistry.tsx

**Tasks**:
• Remove sample contracts (line 250-358)
• Integrate with /api/v11/contracts endpoints
• Contract deployment wizard
• Source code viewer
• ABI explorer
• Contract interaction UI

**Acceptance Criteria**:
✓ NO static data
✓ Real-time contract data
✓ Template-based deployment
✓ Contract verification flow

**Story Points**: 5
**Sprint**: Sprint 11 (Nov 4-15, 2025)`
      }
    ]
  },
  {
    name: 'Sprint 12: Token & RWA APIs',
    startDate: '2025-11-18',
    endDate: '2025-11-29',
    stories: [
      {
        key: 'AV11-058',
        summary: 'Token Management APIs (8 points)',
        description: `**Sprint 12 Story 1**

**Endpoints**:
• GET /api/v11/tokens - List tokens with type filters
• GET /api/v11/tokens/{id} - Get token details
• GET /api/v11/tokens/templates - Token templates (ERC20, ERC721, ERC1155)
• POST /api/v11/tokens/create - Create new token
• POST /api/v11/tokens/{id}/mint - Mint tokens
• POST /api/v11/tokens/{id}/burn - Burn tokens
• POST /api/v11/tokens/{id}/verify - Verify token contract
• GET /api/v11/tokens/statistics - Token statistics
• GET /api/v11/tokens/rwa - Real-world asset tokens

**Acceptance Criteria**:
✓ ERC20, ERC721, ERC1155 support
✓ RWA tokenization integration
✓ Metadata management (IPFS)
✓ Supply tracking and analytics
✓ Transfer history

**Story Points**: 8
**Sprint**: Sprint 12 (Nov 18-29, 2025)`
      },
      {
        key: 'AV11-059',
        summary: 'Portal Tokenization Registry (5 points)',
        description: `**Sprint 12 Story 2**

**Component**: TokenizationRegistry.tsx

**Tasks**:
• Remove sample tokens (line 168-402)
• Integrate with token APIs
• Token creation wizard
• RWA tokenization flow
• NFT minting interface

**Acceptance Criteria**:
✓ NO static data
✓ Multi-token-standard support
✓ IPFS metadata upload
✓ Real-time token analytics

**Story Points**: 5
**Sprint**: Sprint 12 (Nov 18-29, 2025)`
      }
    ]
  },
  {
    name: 'Sprint 13: Active Contracts & DeFi APIs',
    startDate: '2025-12-02',
    endDate: '2025-12-13',
    stories: [
      {
        key: 'AV11-060',
        summary: 'Active Contracts APIs (8 points)',
        description: `**Sprint 13 Story 1**

**Endpoints**:
• GET /api/v11/activecontracts/contracts - List active contracts
• GET /api/v11/activecontracts/contracts/{id} - Get active contract
• POST /api/v11/activecontracts/create - Create active contract
• POST /api/v11/activecontracts/{contractId}/execute/{actionId} - Execute action
• GET /api/v11/activecontracts/templates - Active contract templates
• POST /api/v11/activecontracts/templates/{templateId}/instantiate - Instantiate

**Acceptance Criteria**:
✓ Legal contract integration
✓ Triple-entry accounting support
✓ Smart contract binding
✓ Workflow automation
✓ Compliance validation

**Story Points**: 8
**Sprint**: Sprint 13 (Dec 2-13, 2025)`
      },
      {
        key: 'AV11-061',
        summary: 'Portal Active Contracts Integration (5 points)',
        description: `**Sprint 13 Story 2**

**Component**: ActiveContracts.tsx

**Tasks**:
• Remove hardcoded contracts (line 35-72)
• Integrate with active contract APIs
• Contract creation wizard
• Action execution UI
• Triple-entry viewer

**Acceptance Criteria**:
✓ NO static data
✓ Real contract data from backend
✓ Multi-step contract creation
✓ Legal document upload

**Story Points**: 5
**Sprint**: Sprint 13 (Dec 2-13, 2025)`
      }
    ]
  },
  {
    name: 'Sprint 14: Analytics, System & Remaining APIs',
    startDate: '2025-12-16',
    endDate: '2025-12-27',
    stories: [
      {
        key: 'AV11-062',
        summary: 'Analytics APIs (5 points)',
        description: `**Sprint 14 Story 1**

**Endpoints**:
• GET /api/v11/analytics/{period} - Analytics data (24h/7d/30d)
• GET /api/v11/analytics/volume - Transaction volume trends
• GET /api/v11/analytics/distribution - Token distribution
• GET /api/v11/analytics/performance - Performance metrics over time

**Acceptance Criteria**:
✓ Time-series data aggregation
✓ Multiple period support
✓ Chart-ready data formats
✓ Real-time metrics

**Story Points**: 5
**Sprint**: Sprint 14 (Dec 16-27, 2025)`
      },
      {
        key: 'AV11-063',
        summary: 'System Status & Configuration APIs (5 points)',
        description: `**Sprint 14 Story 2**

**Endpoints**:
• GET /api/v11/system/status - System health components
• GET /api/v11/system/config - System configuration
• GET /api/v11/system/nodes/consensus - Consensus status
• GET /api/v11/system/storage - Storage metrics

**Acceptance Criteria**:
✓ Component health monitoring
✓ Configuration management
✓ Consensus algorithm status
✓ Storage utilization tracking

**Story Points**: 5
**Sprint**: Sprint 14 (Dec 16-27, 2025)`
      },
      {
        key: 'AV11-064',
        summary: 'Authentication & Authorization APIs (5 points)',
        description: `**Sprint 14 Story 3**

**Endpoints**:
• POST /api/v11/auth/login - User authentication
• POST /api/v11/auth/logout - User logout
• POST /api/v11/auth/refresh - Token refresh
• GET /api/v11/auth/me - Current user profile
• POST /api/v11/auth/register - User registration

**Integration**:
• IAM2 Keycloak server (https://iam2.aurigraph.io/)
• OpenID Connect / OAuth 2.0
• JWT token management
• Multi-realm support (AWD, AurCarbonTrace, AurHydroPulse)

**Story Points**: 5
**Sprint**: Sprint 14 (Dec 16-27, 2025)`
      },
      {
        key: 'AV11-065',
        summary: 'Portal Final Components - Analytics, Settings, Performance (5 points)',
        description: `**Sprint 14 Story 4**

**Components**: Analytics.tsx, Settings.tsx, Performance.tsx, Tokenization.tsx, DemoApp.tsx

**Tasks**:
• Remove all remaining static data
• Integrate with analytics APIs
• System configuration UI
• Performance test dashboard
• User settings management

**Acceptance Criteria**:
✓ 100% API-driven (NO static data)
✓ All dashboards functional
✓ Error handling and loading states
✓ Auto-refresh where applicable

**Story Points**: 5
**Sprint**: Sprint 14 (Dec 16-27, 2025)`
      }
    ]
  },
  {
    name: 'Sprint 15: Production Deployment',
    startDate: '2025-12-30',
    endDate: '2026-01-10',
    stories: [
      {
        key: 'AV11-066',
        summary: 'Production Deployment (8 points)',
        description: `**Sprint 15 Story 1**

**Tasks**:
1. Upload JAR chunks to dlt.aurigraph.io (2 points)
2. Reassemble JAR on remote server (1 point)
3. Deploy backend on port 8443 (2 points)
4. Configure NGINX for HTTPS (1 point)
5. Deploy enterprise portal (1 point)
6. Integration testing (1 point)

**Acceptance Criteria**:
✓ Backend responding on https://dlt.aurigraph.io:8443
✓ Portal accessible at https://dlt.aurigraph.io/portal/
✓ All 44 API endpoints operational
✓ SSL certificate valid
✓ Load balancing configured
✓ Monitoring dashboards live

**Story Points**: 8
**Sprint**: Sprint 15 (Dec 30, 2025 - Jan 10, 2026)`
      }
    ]
  }
];

function jiraRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');

    const options = {
      hostname: 'aurigraphdlt.atlassian.net',
      path: path,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function updateStory(story) {
  const issueData = {
    fields: {
      summary: story.summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: story.description
              }
            ]
          }
        ]
      }
    }
  };

  try {
    await jiraRequest('PUT', `/rest/api/3/issue/${story.key}`, issueData);
    console.log(`  ✅ Updated ${story.key}: ${story.summary}`);
  } catch (error) {
    console.error(`  ❌ Failed ${story.key}: ${error.message}`);
  }
}

async function main() {
  console.log('\n🚀 Aurigraph V11 - JIRA Sprint 9-15 Synchronization (Simplified)\n');
  console.log(`📋 JIRA URL: ${JIRA_CONFIG.baseUrl}`);
  console.log(`🔑 Project: ${JIRA_CONFIG.projectKey}\n`);

  let totalStories = 0;

  for (const sprint of SPRINTS) {
    console.log(`\n📅 ${sprint.name}`);

    for (const story of sprint.stories) {
      await updateStory(story);
      totalStories++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ JIRA Synchronization Complete');
  console.log('='.repeat(70));
  console.log(`📊 Total Stories: ${totalStories}`);
  console.log(`📅 Sprints: ${SPRINTS.length} (Sprint 9-15)`);
  console.log(`⏱️  Duration: 14 weeks (Oct 7, 2025 - Jan 10, 2026)`);
  console.log('\n🔗 View: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
