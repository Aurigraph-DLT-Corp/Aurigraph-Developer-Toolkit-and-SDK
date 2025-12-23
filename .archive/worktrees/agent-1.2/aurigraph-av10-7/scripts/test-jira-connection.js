#!/usr/bin/env node

/**
 * JIRA Connection Test Script
 * Tests JIRA API connectivity and authentication
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

async function testJiraConnection() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/api/3/myself',
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
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const user = JSON.parse(data);
          console.log(`✅ Authentication successful`);
          console.log(`👤 User: ${user.displayName} (${user.emailAddress})`);
          console.log(`🔑 Account ID: ${user.accountId}`);
          resolve(user);
        } else {
          console.log(`❌ Authentication failed: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(`Auth failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function getProject() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/api/3/project/AV11',
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
        console.log(`\nProject Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const project = JSON.parse(data);
          console.log(`✅ Project found: ${project.name}`);
          console.log(`📁 Project Key: ${project.key}`);
          console.log(`🔗 URL: ${project.self}`);
          resolve(project);
        } else {
          console.log(`❌ Project not found: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(`Project not found: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Project request error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🔧 Testing JIRA API Connection...\n');
  
  try {
    await testJiraConnection();
    await getProject();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ JIRA connection test successful!');
    console.log('Ready to update tickets.');
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('❌ JIRA connection test failed');
    console.log('Please check credentials and project access.');
    console.log('═══════════════════════════════════════════════════════');
  }
}

main().catch(console.error);