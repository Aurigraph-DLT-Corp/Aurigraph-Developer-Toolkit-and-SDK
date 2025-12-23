#!/usr/bin/env node
/**
 * Create JIRA Tickets for Critical Production Issues
 * Date: October 16, 2025
 */

const https = require('https');

const JIRA_EMAIL = 'subbu@aurigraph.io';
const JIRA_API_TOKEN = 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5';
const PROJECT_KEY = 'AV11';
const AUTH_HEADER = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

function jiraRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'aurigraphdlt.atlassian.net',
      path: path,
      method: method,
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            resolve({});
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function createTicket(summary, description, issueType) {
  try {
    const result = await jiraRequest('POST', '/rest/api/3/issue', {
      fields: {
        project: { key: PROJECT_KEY },
        summary: summary,
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: description }]
          }]
        },
        issuetype: { name: issueType }
      }
    });
    console.log(`✅ Created: ${result.key} - ${summary}`);
    return result.key;
  } catch (error) {
    console.error(`❌ Failed to create ticket: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('Creating JIRA Tickets for Critical Production Issues');
  console.log('Investigation Report: BRIDGE-ISSUES-INVESTIGATION-OCT16-2025.md');
  console.log('='.repeat(80));
  console.log('');

  const tickets = [];

  // Ticket 1: Bridge Liquidity Management Issues
  console.log('Creating Ticket 1: Bridge Liquidity Management...');
  const ticket1 = await createTicket(
    '[HIGH] Bridge transfer failures - Max transfer limit exceeded (20% failure rate)',
    'INVESTIGATION COMPLETE - Root cause identified\n\n' +
    'ISSUE: 20% of bridge transfers failing with misleading error message\n\n' +
    'ROOT CAUSE:\n' +
    '- Transfers exceed max_transfer_amount_usd limits\n' +
    '- Ethereum max: $404K (users trying $4.2M)\n' +
    '- BSC max: $101K (users trying $15M)\n' +
    '- Error message says "Insufficient liquidity" but actual cause is max limit\n\n' +
    'IMPACT:\n' +
    '- $24.45M in failed transfers (sample)\n' +
    '- Poor user experience\n' +
    '- Lost transaction fees\n\n' +
    'SOLUTION (Priority Order):\n' +
    '1. Update error messages to be accurate and helpful (1-2 hours)\n' +
    '2. Add pre-flight validation before transaction initiation (2-3 hours)\n' +
    '3. Implement auto-split for large transfers (1-2 days)\n' +
    '4. Increase max transfer limits to $1M-$5M (1 week)\n\n' +
    'EFFORT: 1-2 days for immediate fixes, 1-2 weeks for complete solution\n\n' +
    'REFERENCE:\n' +
    '- Investigation Report: BRIDGE-ISSUES-INVESTIGATION-OCT16-2025.md\n' +
    '- QAA Discovery: API-TESTING-REPORT-OCT16-2025.md\n' +
    '- API Endpoint: /api/v11/bridge/status, /api/v11/bridge/history\n\n' +
    'FAILED TRANSACTIONS:\n' +
    '- btx-04ee71c2: Ethereum → Polygon ($447K)\n' +
    '- btx-91a9080a: Polygon → Ethereum ($4.2M)\n' +
    '- btx-02fd0d96: Aurigraph → BSC ($15M)\n' +
    '- btx-25632df7: Polygon → BSC ($4.8M)\n\n' +
    'VALIDATION:\n' +
    '- Test with various transfer amounts\n' +
    '- Verify error messages user-friendly\n' +
    '- Monitor failure rate reduction to <5%\n\n' +
    'Discovered by: Quality Assurance Agent (QAA) - October 16, 2025',
    'Bug'
  );
  if (ticket1) tickets.push(ticket1);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Ticket 2: Stuck Bridge Transfers
  console.log('Creating Ticket 2: Stuck Bridge Transfers...');
  const ticket2 = await createTicket(
    '[HIGH] Resolve 3 stuck bridge transfers (Avalanche: 1, Polygon: 2)',
    'INVESTIGATION COMPLETE - Transfers identified and located\n\n' +
    'ISSUE: 3 bridge transfers stuck in pending state\n\n' +
    'LOCATION:\n' +
    '- Avalanche bridge (bridge-avax-001): 1 stuck transfer\n' +
    '- Polygon bridge (bridge-matic-001): 2 stuck transfers\n\n' +
    'BRIDGE STATUS:\n' +
    'Avalanche:\n' +
    '- Health: 99.86% success rate\n' +
    '- Pending: 2 transfers\n' +
    '- Stuck: 1 transfer\n' +
    '- Average latency: 15.96s\n\n' +
    'Polygon:\n' +
    '- Health: 99.85% success rate\n' +
    '- Pending: 38 transfers\n' +
    '- Stuck: 2 transfers\n' +
    '- Average latency: 21.64s\n\n' +
    'INVESTIGATION REQUIRED:\n' +
    '1. Identify specific stuck transfer IDs from /api/v11/bridge/history?status=stuck\n' +
    '2. Check blockchain confirmations on both source and target chains\n' +
    '3. Verify validator signatures and quorum\n' +
    '4. Check for:\n' +
    '   - Insufficient gas on target chain\n' +
    '   - Chain reorganizations\n' +
    '   - Validator connectivity issues\n' +
    '   - Smart contract pauses or reverts\n' +
    '   - Nonce management issues\n\n' +
    'MANUAL RESOLUTION STEPS:\n' +
    '1. Verify funds locked on source chain\n' +
    '2. Check validator set and signatures\n' +
    '3. If safe, manually trigger target chain minting\n' +
    '4. Update transfer status in system\n' +
    '5. Notify affected users\n\n' +
    'IMMEDIATE ACTIONS:\n' +
    '- Add stuck transfer detection (alert if pending > 30 minutes)\n' +
    '- Automatic investigation triggers\n' +
    '- Escalation to operations team\n\n' +
    'LONG-TERM IMPROVEMENTS:\n' +
    '- Implement automatic recovery mechanisms\n' +
    '- Gas price bumping for stuck transactions\n' +
    '- Enhanced monitoring dashboard\n' +
    '- User email notifications\n\n' +
    'EFFORT: 4 hours for manual resolution + 1 week for automation\n\n' +
    'REFERENCE:\n' +
    '- Investigation Report: BRIDGE-ISSUES-INVESTIGATION-OCT16-2025.md\n' +
    '- API Alerts: /api/v11/bridge/status (alerts section)\n\n' +
    'Discovered by: Quality Assurance Agent (QAA) - October 16, 2025',
    'Bug'
  );
  if (ticket2) tickets.push(ticket2);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Ticket 3: Degraded Oracles
  console.log('Creating Ticket 3: Degraded Oracles...');
  const ticket3 = await createTicket(
    '[MEDIUM] Investigate and fix 2 degraded oracles (Pyth EU: 63.4%, Tellor: 66.7% error rates)',
    'INVESTIGATION COMPLETE - 2 degraded oracles identified\n\n' +
    'ISSUE: Two oracle services showing high error rates\n\n' +
    'DEGRADED ORACLES:\n\n' +
    '1. Pyth Network - EU Central (oracle-pyth-002)\n' +
    '   - Error Rate: 63.4% (520 errors / 82,000 requests in 24h)\n' +
    '   - Status: DEGRADED\n' +
    '   - Uptime: 96.5%\n' +
    '   - Response Time: 85ms\n' +
    '   - Data Feeds: 195\n' +
    '   - Version: 3.2.0\n' +
    '   - Location: EU-Central-1\n\n' +
    '2. Tellor Oracle - Global (oracle-tellor-001)\n' +
    '   - Error Rate: 66.7% (48 errors / 7,200 requests in 24h)\n' +
    '   - Status: ACTIVE (but high error rate)\n' +
    '   - Uptime: 97.8%\n' +
    '   - Response Time: 78ms\n' +
    '   - Data Feeds: 45\n' +
    '   - Version: 6.1.0\n' +
    '   - Location: Global\n\n' +
    'OVERALL SYSTEM STATUS:\n' +
    '- Total Oracles: 10\n' +
    '- Overall Health Score: 97.07/100 ✅\n' +
    '- Average Uptime: 98.94%\n' +
    '- Other 8 oracles compensating successfully\n\n' +
    'IMPACT:\n' +
    '- Minimal - System remains highly available\n' +
    '- Price feeds continue to function correctly\n' +
    '- Redundancy is working as designed\n\n' +
    'INVESTIGATION STEPS:\n' +
    '1. Check Pyth Network EU endpoint connectivity\n' +
    '2. Review detailed error logs for failure patterns\n' +
    '3. Test connection latency and stability\n' +
    '4. Contact Pyth Network support regarding EU region\n' +
    '5. Check Tellor Oracle API changes or rate limits\n\n' +
    'IMMEDIATE ACTIONS:\n' +
    '1. Reduce oracle weight in price aggregation algorithm\n' +
    '2. Configure automatic failover to other regions\n' +
    '3. Monitor impact on price feed accuracy\n' +
    '4. Set up alerts for oracle health < 95%\n\n' +
    'RESOLUTION OPTIONS:\n' +
    'A. Fix connectivity to EU region (preferred)\n' +
    'B. Failover to Pyth Network US or Asia regions\n' +
    'C. Replace with alternative oracle provider\n\n' +
    'LONG-TERM IMPROVEMENTS:\n' +
    '- Implement circuit breaker for degraded oracles\n' +
    '- Automatic region failover\n' +
    '- Enhanced oracle health monitoring\n' +
    '- Provider redundancy within each oracle type\n\n' +
    'EFFORT: 2-3 hours investigation + 1-2 days for permanent fix\n\n' +
    'REFERENCE:\n' +
    '- Investigation Report: BRIDGE-ISSUES-INVESTIGATION-OCT16-2025.md\n' +
    '- API Endpoint: /api/v11/oracles/status\n' +
    '- QAA Testing: API-TESTING-REPORT-OCT16-2025.md\n\n' +
    'Discovered by: Quality Assurance Agent (QAA) - October 16, 2025',
    'Bug'
  );
  if (ticket3) tickets.push(ticket3);

  // Summary
  console.log('');
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully created: ${tickets.length}/3 tickets`);
  if (tickets.length > 0) {
    console.log('\nCreated Tickets:');
    tickets.forEach((ticket, i) => {
      console.log(`  ${i + 1}. ${ticket}`);
    });
  }
  console.log('');
  console.log('Next Steps:');
  console.log('1. Review tickets in JIRA');
  console.log('2. Assign to appropriate teams');
  console.log('3. Begin implementation of fixes');
  console.log('='.repeat(80));
}

main().catch(console.error);
