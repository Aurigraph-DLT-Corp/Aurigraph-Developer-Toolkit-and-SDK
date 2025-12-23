#!/usr/bin/env node

/**
 * List existing JIRA tickets in AV11 project
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

async function listTickets() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/api/3/search?jql=project=AV11&maxResults=100',
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
          const result = JSON.parse(data);
          console.log(`✅ Found ${result.total} tickets in AV11 project:\n`);
          
          result.issues.forEach(issue => {
            console.log(`📋 ${issue.key}: ${issue.fields.summary}`);
            console.log(`   Status: ${issue.fields.status.name}`);
            console.log(`   Type: ${issue.fields.issuetype.name}`);
            console.log('');
          });
          
          resolve(result.issues);
        } else {
          console.log(`❌ Failed to list tickets: ${res.statusCode}`);
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
  console.log('📋 Listing JIRA Tickets in AV11 Project...\n');
  
  try {
    await listTickets();
  } catch (error) {
    console.error('Failed to list tickets:', error);
  }
}

main().catch(console.error);