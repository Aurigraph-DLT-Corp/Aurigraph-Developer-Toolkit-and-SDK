#!/usr/bin/env node

const https = require('https');

const JIRA_CONFIG = {
  email: 'subbu@aurigraph.io',
  apiToken: process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5'
};

const auth = Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');

console.log('\n🔐 Testing JIRA Authentication...\n');

// Test 1: Get current user
const options1 = {
  hostname: 'aurigraphdlt.atlassian.net',
  path: '/rest/api/3/myself',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
};

const req1 = https.request(options1, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
      const user = JSON.parse(data);
      console.log(`✅ Authenticated as: ${user.displayName} (${user.emailAddress})`);
      console.log(`   Account ID: ${user.accountId}`);

      // Test 2: Get projects with pagination
      console.log('\n📋 Fetching projects...\n');
      const options2 = {
        hostname: 'aurigraphdlt.atlassian.net',
        path: '/rest/api/3/project/search?maxResults=100',
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      };

      const req2 = https.request(options2, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          console.log(`Status Code: ${res2.statusCode}`);
          if (res2.statusCode === 200) {
            const result = JSON.parse(data2);
            console.log(`Total projects: ${result.total}`);
            if (result.values && result.values.length > 0) {
              console.log('\nAvailable Projects:');
              result.values.forEach(p => {
                console.log(`  • ${p.key} - ${p.name}`);
              });
            } else {
              console.log('\n⚠️  No projects found in this JIRA instance.');
              console.log('   You may need to create a project first.');
            }
          } else {
            console.error('Error:', data2);
          }
        });
      });
      req2.end();

    } else {
      console.error('❌ Authentication failed');
      console.error('Response:', data);
    }
  });
});

req1.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req1.end();
