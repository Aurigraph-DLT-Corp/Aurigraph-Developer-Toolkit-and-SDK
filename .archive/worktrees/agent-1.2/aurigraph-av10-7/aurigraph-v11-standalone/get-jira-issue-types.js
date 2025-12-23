#!/usr/bin/env node

const https = require('https');

const JIRA_CONFIG = {
  email: 'subbu@aurigraph.io',
  apiToken: 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5',
  projectKey: 'AV11'
};

const auth = Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');

console.log('\n🔍 Fetching Issue Types for AV11 Project...\n');

const options = {
  hostname: 'aurigraphdlt.atlassian.net',
  path: `/rest/api/3/project/${JIRA_CONFIG.projectKey}`,
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
      const project = JSON.parse(data);
      console.log(`✅ Project: ${project.key} - ${project.name}`);

      if (project.issueTypes && project.issueTypes.length > 0) {
        console.log('\n📋 Available Issue Types:\n');
        project.issueTypes.forEach(type => {
          console.log(`  • ${type.name} (ID: ${type.id})`);
          console.log(`    Description: ${type.description || 'N/A'}`);
          console.log(`    Subtask: ${type.subtask}`);
          console.log('');
        });
      } else {
        console.log('\n⚠️  No issue types found for this project.');
      }
    } else {
      console.error('❌ Failed to fetch project');
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
