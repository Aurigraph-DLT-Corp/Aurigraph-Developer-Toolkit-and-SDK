#!/usr/bin/env node

/**
 * Create JIRA tickets for Sprint 1 of Aurigraph V11 migration
 * Sprint 1: Jan 13-24, 2025 - "Core Migration Foundation"
 */

const axios = require('axios');
require('dotenv').config();

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const PROJECT_KEY = 'AV11';

// Sprint 1 tickets based on allocation
const sprint1Tickets = [
  // Epic: Complete Consensus Migration (21 pts)
  {
    summary: 'Port HyperRAFT++ consensus to Java',
    description: `Migrate the HyperRAFT++ consensus algorithm from TypeScript to Java/Quarkus.

**Acceptance Criteria:**
- Complete Java implementation of HyperRAFT++ algorithm
- Leader election mechanism working
- Consensus achieved with 3+ nodes
- Performance baseline of 500K+ TPS

**Technical Requirements:**
- Use Quarkus reactive programming model
- Implement with Mutiny for async operations
- Add comprehensive unit tests
- Document migration approach`,
    issueType: 'Story',
    storyPoints: 8,
    priority: 'Highest',
    components: ['Consensus', 'Migration'],
    labels: ['sprint1', 'core-migration', 'consensus']
  },
  {
    summary: 'Implement leader election in Java',
    description: `Implement the leader election mechanism for HyperRAFT++ in Java.

**Acceptance Criteria:**
- Leader election completes in <100ms
- Handles node failures gracefully
- Supports dynamic node addition/removal
- Maintains consistency during elections`,
    issueType: 'Story',
    storyPoints: 5,
    priority: 'High',
    components: ['Consensus'],
    labels: ['sprint1', 'consensus', 'leader-election']
  },
  {
    summary: 'Add Byzantine fault tolerance to consensus',
    description: `Implement Byzantine fault tolerance in the Java consensus module.

**Acceptance Criteria:**
- Tolerates up to 33% malicious nodes
- Validates all consensus messages
- Implements view change protocol
- Adds signature verification`,
    issueType: 'Story',
    storyPoints: 5,
    priority: 'High',
    components: ['Consensus', 'Security'],
    labels: ['sprint1', 'consensus', 'byzantine-fault-tolerance']
  },
  {
    summary: 'Create validator network management',
    description: `Implement validator network management and coordination.

**Acceptance Criteria:**
- Dynamic validator registration
- Health monitoring for validators
- Automatic failover mechanism
- Network topology management`,
    issueType: 'Story',
    storyPoints: 3,
    priority: 'Medium',
    components: ['Consensus', 'Network'],
    labels: ['sprint1', 'validators', 'network']
  },

  // Epic: Core gRPC Services (13 pts)
  {
    summary: 'Implement transaction processing gRPC service',
    description: `Create the core transaction processing service using gRPC.

**Acceptance Criteria:**
- Process 100K+ TPS
- Protocol Buffer definitions complete
- Async/streaming support
- Load balancing ready

**Technical Requirements:**
- Use Quarkus gRPC extension
- Implement with HTTP/2
- Add metrics collection
- Create integration tests`,
    issueType: 'Story',
    storyPoints: 5,
    priority: 'Highest',
    components: ['gRPC', 'Transactions'],
    labels: ['sprint1', 'grpc', 'transactions']
  },
  {
    summary: 'Build consensus coordination gRPC service',
    description: `Implement gRPC service for consensus coordination between nodes.

**Acceptance Criteria:**
- Bi-directional streaming for consensus
- Message ordering guaranteed
- Failure detection implemented
- Reconnection logic working`,
    issueType: 'Story',
    storyPoints: 3,
    priority: 'High',
    components: ['gRPC', 'Consensus'],
    labels: ['sprint1', 'grpc', 'consensus']
  },
  {
    summary: 'Define Protocol Buffer schemas',
    description: `Create comprehensive Protocol Buffer definitions for all services.

**Acceptance Criteria:**
- Transaction messages defined
- Consensus messages defined
- Cross-chain messages defined
- Backward compatibility ensured`,
    issueType: 'Story',
    storyPoints: 2,
    priority: 'High',
    components: ['gRPC', 'Architecture'],
    labels: ['sprint1', 'protobuf', 'schema']
  },
  {
    summary: 'Implement HTTP/2 transport layer',
    description: `Set up HTTP/2 transport with TLS 1.3 for gRPC services.

**Acceptance Criteria:**
- HTTP/2 with multiplexing
- TLS 1.3 encryption
- Connection pooling
- Keep-alive configuration`,
    issueType: 'Story',
    storyPoints: 3,
    priority: 'Medium',
    components: ['gRPC', 'Network'],
    labels: ['sprint1', 'http2', 'transport']
  },

  // Epic: Quantum Crypto Migration (8 pts)
  {
    summary: 'Port CRYSTALS-Dilithium to Java',
    description: `Migrate CRYSTALS-Dilithium quantum-resistant signatures to Java.

**Acceptance Criteria:**
- NIST Level 5 security
- Signature generation <10ms
- Verification <5ms
- BouncyCastle integration complete`,
    issueType: 'Story',
    storyPoints: 3,
    priority: 'High',
    components: ['Cryptography', 'Quantum'],
    labels: ['sprint1', 'quantum-crypto', 'dilithium']
  },
  {
    summary: 'Replace mock signatures with real implementation',
    description: `Replace all mock signature implementations with real BouncyCastle crypto.

**Acceptance Criteria:**
- All mock signatures removed
- Real signature validation working
- Performance benchmarks met
- Security audit passed`,
    issueType: 'Story',
    storyPoints: 3,
    priority: 'High',
    components: ['Cryptography', 'Security'],
    labels: ['sprint1', 'crypto', 'signatures']
  },
  {
    summary: 'Enable hardware acceleration for crypto',
    description: `Implement hardware acceleration for cryptographic operations.

**Acceptance Criteria:**
- AES-NI instructions used
- SHA extensions enabled
- 2x performance improvement
- Fallback to software implementation`,
    issueType: 'Story',
    storyPoints: 2,
    priority: 'Medium',
    components: ['Cryptography', 'Performance'],
    labels: ['sprint1', 'crypto', 'hardware-acceleration']
  },

  // Bug fixes and technical debt
  {
    summary: 'Fix remaining V11 compilation errors',
    description: `Fix all remaining compilation errors in V11 Java codebase.

**Issues to fix:**
- Missing BouncyCastle crypto imports
- ADAM optimizer configuration
- Netty channel options
- Undefined classes and methods

**Acceptance Criteria:**
- Clean compilation with no errors
- All tests passing
- Maven build successful`,
    issueType: 'Bug',
    storyPoints: 5,
    priority: 'Highest',
    components: ['Build', 'Migration'],
    labels: ['sprint1', 'compilation', 'bug-fix']
  },
  {
    summary: 'Set up CI/CD pipeline for V11',
    description: `Create automated CI/CD pipeline for V11 Java/Quarkus project.

**Acceptance Criteria:**
- GitHub Actions workflow
- Automated testing on PR
- Native build validation
- Docker image creation
- Performance regression tests`,
    issueType: 'Task',
    storyPoints: 3,
    priority: 'High',
    components: ['DevOps', 'Build'],
    labels: ['sprint1', 'ci-cd', 'automation']
  }
];

async function createJiraTicket(ticket) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  
  const issueData = {
    fields: {
      project: { key: PROJECT_KEY },
      summary: ticket.summary,
      description: ticket.description,
      issuetype: { name: ticket.issueType },
      priority: { name: ticket.priority },
      labels: ticket.labels,
      components: ticket.components.map(c => ({ name: c })),
      customfield_10016: ticket.storyPoints // Story points field
    }
  };

  try {
    const response = await axios.post(
      `${JIRA_BASE_URL}/rest/api/3/issue`,
      issueData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`✅ Created: ${ticket.summary} - ${response.data.key}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create: ${ticket.summary}`);
    if (error.response) {
      console.error('Error:', error.response.data);
    }
    return null;
  }
}

async function createAllTickets() {
  console.log('🚀 Creating Sprint 1 JIRA tickets for Aurigraph V11...\n');
  console.log(`📋 Total tickets to create: ${sprint1Tickets.length}`);
  console.log(`📊 Total story points: ${sprint1Tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0)}\n`);
  
  const results = [];
  
  for (const ticket of sprint1Tickets) {
    const result = await createJiraTicket(ticket);
    if (result) {
      results.push(result);
    }
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📈 Summary:');
  console.log(`✅ Successfully created: ${results.length}/${sprint1Tickets.length} tickets`);
  
  if (results.length > 0) {
    console.log('\n🔗 Created ticket IDs:');
    results.forEach(r => {
      console.log(`  - ${r.key}: ${r.fields.summary}`);
    });
  }
}

// Check if credentials are configured
if (!JIRA_API_TOKEN || !JIRA_EMAIL) {
  console.error('❌ Error: JIRA credentials not configured');
  console.log('Please set the following environment variables:');
  console.log('  - JIRA_API_TOKEN: Your JIRA API token');
  console.log('  - JIRA_EMAIL: Your JIRA email address');
  console.log('\nYou can create an API token at:');
  console.log('https://id.atlassian.com/manage-profile/security/api-tokens');
  process.exit(1);
}

// Run the script
createAllTickets().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});