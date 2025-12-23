#!/usr/bin/env node

const axios = require('axios');

// JIRA Configuration
const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_USER = 'admin@aurigraph.io'; // Your email
const JIRA_TOKEN = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';

console.log('🔌 Testing JIRA Connection...');
console.log('================================\n');

// Test basic authentication
async function testConnection() {
  try {
    // Method 1: Using axios with basic auth
    console.log('Testing Method 1: Basic Auth with axios...');
    const response1 = await axios.get(`${JIRA_BASE_URL}/rest/api/3/myself`, {
      auth: {
        username: JIRA_USER,
        password: JIRA_TOKEN
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connection successful!');
    console.log('User:', response1.data.displayName);
    console.log('Email:', response1.data.emailAddress);
    console.log('Account ID:', response1.data.accountId);
    console.log('');
    
    return true;
  } catch (error) {
    console.log('❌ Method 1 failed:', error.message);
  }
  
  try {
    // Method 2: Using Authorization header
    console.log('\nTesting Method 2: Authorization Header...');
    const auth = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');
    const response2 = await axios.get(`${JIRA_BASE_URL}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connection successful!');
    console.log('User:', response2.data.displayName);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Method 2 failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
  
  return false;
}

// Get available projects
async function getProjects() {
  console.log('\n📁 Fetching available projects...');
  
  try {
    const response = await axios.get(`${JIRA_BASE_URL}/rest/api/3/project`, {
      auth: {
        username: JIRA_USER,
        password: JIRA_TOKEN
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.data && response.data.length > 0) {
      console.log(`\nFound ${response.data.length} project(s):\n`);
      response.data.forEach(project => {
        console.log(`📂 ${project.key} - ${project.name}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Type: ${project.projectTypeKey}`);
        console.log(`   Style: ${project.style || 'classic'}`);
        console.log('');
      });
      return response.data;
    } else {
      console.log('No projects found.');
      return [];
    }
  } catch (error) {
    console.log('❌ Failed to fetch projects:', error.message);
    return [];
  }
}

// Search for issues
async function searchIssues() {
  console.log('\n🔍 Searching for issues...');
  
  const queries = [
    'project = AV11',
    'project = AV10', 
    'text ~ "Aurigraph"',
    'summary ~ "V11"',
    'created >= -30d'
  ];
  
  for (const jql of queries) {
    try {
      console.log(`\nQuery: ${jql}`);
      const response = await axios.get(`${JIRA_BASE_URL}/rest/api/3/search`, {
        params: {
          jql: jql,
          maxResults: 5
        },
        auth: {
          username: JIRA_USER,
          password: JIRA_TOKEN
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.data.total > 0) {
        console.log(`Found ${response.data.total} issue(s)`);
        response.data.issues.forEach(issue => {
          console.log(`  - ${issue.key}: ${issue.fields.summary}`);
        });
      } else {
        console.log('No issues found for this query.');
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('JIRA URL:', JIRA_BASE_URL);
  console.log('User:', JIRA_USER);
  console.log('Token:', JIRA_TOKEN.substring(0, 20) + '...');
  console.log('');
  
  // Test connection
  const connected = await testConnection();
  
  if (connected) {
    // Get projects
    const projects = await getProjects();
    
    // Search for issues
    await searchIssues();
    
    console.log('\n================================');
    console.log('✅ JIRA connection test complete!');
    
    if (projects.length === 0) {
      console.log('\n⚠️  No projects found. You may need to:');
      console.log('1. Create a project in JIRA first');
      console.log('2. Check your permissions');
      console.log('3. Verify the API token is valid');
    }
  } else {
    console.log('\n================================');
    console.log('❌ Could not connect to JIRA');
    console.log('\nPossible issues:');
    console.log('1. API token may be invalid or expired');
    console.log('2. Email address may be incorrect');
    console.log('3. JIRA instance URL may be wrong');
    console.log('4. Network/firewall blocking connection');
    
    console.log('\nTo generate a new API token:');
    console.log('1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens');
    console.log('2. Click "Create API token"');
    console.log('3. Name it "Aurigraph V11"');
    console.log('4. Copy the token and update the script');
  }
}

// Run the test
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});