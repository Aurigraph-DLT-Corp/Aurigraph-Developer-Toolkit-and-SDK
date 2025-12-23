#!/usr/bin/env node
/**
 * JIRA Update Script using Transitions
 * Uses proper JIRA workflow transitions to update ticket status
 * Date: October 16, 2025
 */

const https = require('https');

// JIRA Configuration
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

async function getTransitions(ticketKey) {
  try {
    return await jiraRequest('GET', `/rest/api/3/issue/${ticketKey}/transitions`);
  } catch (error) {
    console.error(`Failed to get transitions for ${ticketKey}:`, error.message);
    return { transitions: [] };
  }
}

async function transitionTo(ticketKey, targetStatus) {
  try {
    const { transitions } = await getTransitions(ticketKey);
    const transition = transitions.find(t => t.name === targetStatus || t.to.name === targetStatus);

    if (!transition) {
      console.log(`   ⚠️  No transition to "${targetStatus}" found for ${ticketKey}`);
      return false;
    }

    await jiraRequest('POST', `/rest/api/3/issue/${ticketKey}/transitions`, {
      transition: { id: transition.id }
    });
    console.log(`✅ ${ticketKey} transitioned to ${targetStatus}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to transition ${ticketKey}:`, error.message);
    return false;
  }
}

async function addComment(ticketKey, comment) {
  try {
    await jiraRequest('POST', `/rest/api/3/issue/${ticketKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: comment }]
        }]
      }
    });
    console.log(`   💬 Comment added to ${ticketKey}`);
    return true;
  } catch (error) {
    console.error(`   ⚠️  Failed to add comment to ${ticketKey}: ${error.message}`);
    return false;
  }
}

async function updateDescription(ticketKey, description) {
  try {
    await jiraRequest('PUT', `/rest/api/3/issue/${ticketKey}`, {
      fields: {
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: description }]
          }]
        }
      }
    });
    console.log(`   📝 Description updated for ${ticketKey}`);
    return true;
  } catch (error) {
    console.error(`   ⚠️  Failed to update description for ${ticketKey}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('JIRA UPDATE VIA TRANSITIONS - October 16, 2025');
  console.log('='.repeat(80));

  const results = { updated: 0, failed: 0 };

  // API tickets to mark as Done
  const apiTickets = [
    'AV11-267', 'AV11-268', 'AV11-269', 'AV11-270', 'AV11-271',
    'AV11-272', 'AV11-273', 'AV11-274', 'AV11-275',
    'AV11-281', 'AV11-282', 'AV11-283', 'AV11-284', 'AV11-285',
    'AV11-286', 'AV11-287', 'AV11-288', 'AV11-289', 'AV11-290'
  ];

  console.log('\n📋 Phase 1: Marking API Implementation Tickets as Done');
  console.log('-'.repeat(80));

  for (const ticket of apiTickets) {
    console.log(`\nProcessing ${ticket}...`);

    const comment = `API endpoint verified as working by Quality Assurance Agent (QAA) on October 16, 2025.\n\n` +
      `Testing: Comprehensive testing completed\n` +
      `Report: API-TESTING-REPORT-OCT16-2025.md\n` +
      `Dashboard readiness: 88.9%`;

    const commentSuccess = await addComment(ticket, comment);
    const transitionSuccess = await transitionTo(ticket, 'Done');

    if (commentSuccess && transitionSuccess) {
      results.updated++;
    } else {
      results.failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Update performance tickets with description only
  console.log('\n📋 Phase 2: Updating Performance Optimization Tickets');
  console.log('-'.repeat(80));

  const perfTickets = [
    {
      key: 'AV11-42',
      comment: 'V11 Performance Optimization - Comprehensive Analysis Complete\n\n' +
        'Backend Development Agent (BDA) Analysis: October 16, 2025\n\n' +
        'CURRENT STATE:\n' +
        '- Achieved: 776K TPS\n' +
        '- Target: 2M+ TPS sustained\n\n' +
        'CRITICAL BOTTLENECKS:\n' +
        '1. Consensus Service Not Implemented\n' +
        '2. Hash Calculation Overhead\n' +
        '3. Lock Contention in Shards\n\n' +
        'OPTIMIZATION ROADMAP:\n' +
        '- Phase 1 (2 days): 1M-1.2M TPS\n' +
        '- Phase 2 (3 days): 1.8M-1.9M TPS\n' +
        '- Phase 3 (5 days): 2.7M-2.8M TPS\n' +
        '- Phase 4 (2 weeks): Maintain 2M+ with consensus\n\n' +
        'Full Report: See COMPREHENSIVE-STATUS-REPORT-OCT16-2025.md'
    },
    {
      key: 'AV11-47',
      comment: 'HSM Integration - Assessment Complete (45% implemented)\n\n' +
        'Integration & Bridge Agent (IBA): October 16, 2025\n\n' +
        'EFFORT: 60 story points, 4-5 sprints (8-10 weeks)\n' +
        'TEAM: 1-2 developers + 1 security specialist\n\n' +
        'MISSING: Real HSM connection, certificate management, multi-vendor support\n\n' +
        'See COMPREHENSIVE-STATUS-REPORT-OCT16-2025.md for full assessment'
    },
    {
      key: 'AV11-49',
      comment: 'Ethereum Adapter - Assessment Complete (50% implemented)\n\n' +
        'Integration & Bridge Agent (IBA): October 16, 2025\n\n' +
        'EFFORT: 65 story points, 3-4 sprints (6-8 weeks)\n' +
        'TEAM: 2 developers\n\n' +
        'MISSING: Real Web3j RPC connection, nonce management, MEV protection\n\n' +
        'See COMPREHENSIVE-STATUS-REPORT-OCT16-2025.md for full assessment'
    },
    {
      key: 'AV11-50',
      comment: 'Solana Adapter - Assessment Complete (40% implemented)\n\n' +
        'Integration & Bridge Agent (IBA): October 16, 2025\n\n' +
        'EFFORT: 73 story points, 4-5 sprints (8-10 weeks)\n' +
        'TEAM: 2 developers (1 with Solana experience)\n\n' +
        'CRITICAL BLOCKER: Solana SDK dependency unresolved\n\n' +
        'See COMPREHENSIVE-STATUS-REPORT-OCT16-2025.md for full assessment'
    },
    {
      key: 'AV11-276',
      comment: 'UI/UX Improvements - COMPLETE\n\n' +
        'Frontend Development Agent (FDA): October 16, 2025\n\n' +
        'DELIVERED:\n' +
        '- 6 new component files created\n' +
        '- 2 components updated\n' +
        '- 2 documentation guides\n' +
        '- 100% NO MOCK DATA compliance\n\n' +
        'FEATURES: Error boundaries, loading skeletons, empty states, feature flags, retry mechanisms\n\n' +
        'Location: enterprise-portal/enterprise-portal/frontend/src/components/common/'
    }
  ];

  for (const ticket of perfTickets) {
    console.log(`\nProcessing ${ticket.key}...`);
    const success = await addComment(ticket.key, ticket.comment);

    if (success) {
      results.updated++;
    } else {
      results.failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully updated: ${results.updated} tickets`);
  console.log(`❌ Failed: ${results.failed} tickets`);
  console.log('='.repeat(80));
}

main().catch(console.error);
