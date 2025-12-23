#!/usr/bin/env node

/**
 * Update AV11-16: Performance Monitoring System Implementation to Done
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

async function updateTicketToDone(ticketKey, transitionId = '31') {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const requestData = JSON.stringify({
      transition: { id: transitionId }
    });
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: `/rest/api/3/issue/${ticketKey}/transitions`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log(`✅ Successfully updated ${ticketKey} to Done`);
          resolve(true);
        } else {
          console.log(`❌ Failed to update ${ticketKey}: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error updating ${ticketKey}:`, error.message);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

async function addCommentToTicket(ticketKey, comment) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const requestData = JSON.stringify({
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: comment
              }
            ]
          }
        ]
      }
    });
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: `/rest/api/3/issue/${ticketKey}/comment`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`✅ Successfully added comment to ${ticketKey}`);
          resolve(true);
        } else {
          console.log(`❌ Failed to add comment to ${ticketKey}: ${res.statusCode}`);
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error adding comment to ${ticketKey}:`, error.message);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

async function main() {
  console.log('📋 Updating AV11-16: Performance Monitoring System Implementation\n');
  
  try {
    // Add completion comment
    const completionComment = `AV11-16 Implementation Complete! 🎉

## Implementation Summary
✅ TypeScript Performance Monitor with AV11-17 compliance validation
✅ Real-time monitoring: TPS, Memory, CPU, Uptime tracking
✅ Event-driven architecture with compliance alerts
✅ REST API integration with AV11-7 platform
✅ Terraform infrastructure-as-code configuration
✅ Complete integration with existing platform services

## Key Features Delivered
- Real-time performance metrics collection (TPS ≥1M, Memory ≤4GB, Uptime ≥99.9%)
- AV11-17 compliance validation and automated reporting
- API endpoints for monitoring and threshold management
- Event-driven alerts for compliance violations
- Terraform infrastructure management for all Aurigraph apps

## Files Created/Modified
- src/monitoring/PerformanceMonitor.ts: Core implementation
- terraform/: Complete infrastructure-as-code configuration
- src/index-av10-comprehensive.ts: Platform integration
- CLAUDE.md: Updated documentation

## Git Commit
Commit: feat(AV11-16): Implement comprehensive Performance Monitoring System and Terraform infrastructure

Status: ✅ COMPLETE - Ready for production deployment`;

    await addCommentToTicket('AV11-16', completionComment);
    
    // Update status to Done
    await updateTicketToDone('AV11-16');
    
    console.log('\n🎉 AV11-16 has been successfully completed and updated in JIRA!');
    
  } catch (error) {
    console.error('Failed to update AV11-16:', error);
    process.exit(1);
  }
}

main().catch(console.error);