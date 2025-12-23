#!/usr/bin/env node

/**
 * Get detailed information for specific JIRA ticket
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

async function getTicketDetails(ticketKey) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: `/rest/api/3/issue/${ticketKey}?expand=changelog`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const ticket = JSON.parse(data);
          
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📋 TICKET: ${ticket.key}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📌 Summary: ${ticket.fields.summary}`);
          console.log(`📊 Status: ${ticket.fields.status.name}`);
          console.log(`🏷️ Type: ${ticket.fields.issuetype.name}`);
          console.log(`👤 Assignee: ${ticket.fields.assignee ? ticket.fields.assignee.displayName : 'Unassigned'}`);
          console.log(`📅 Created: ${ticket.fields.created}`);
          console.log(`📅 Updated: ${ticket.fields.updated}`);
          
          if (ticket.fields.description) {
            console.log(`\n📝 Description:`);
            console.log(ticket.fields.description);
          }
          
          if (ticket.fields.labels && ticket.fields.labels.length > 0) {
            console.log(`\n🏷️ Labels: ${ticket.fields.labels.join(', ')}`);
          }
          
          console.log('\n═══════════════════════════════════════════════════════');
          
          resolve(ticket);
        } else {
          console.log(`❌ Failed to get ticket details: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  const ticketKey = process.argv[2] || 'AV11-19';
  console.log(`🔍 Getting details for ticket: ${ticketKey}\n`);
  
  try {
    await getTicketDetails(ticketKey);
  } catch (error) {
    console.error('Failed to get ticket details:', error);
  }
}

main().catch(console.error);