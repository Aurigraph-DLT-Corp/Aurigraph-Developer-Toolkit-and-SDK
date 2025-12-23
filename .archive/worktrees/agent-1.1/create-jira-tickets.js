#!/usr/bin/env node

/**
 * Create JIRA tickets for Aurigraph V11 project
 */

const axios = require('axios');

// JIRA Configuration
const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_USER = process.env.JIRA_USER || 'admin@aurigraph.io';
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const PROJECT_KEY = 'AV11';

// Create axios instance
const jira = axios.create({
  baseURL: `${JIRA_BASE_URL}/rest/api/3`,
  auth: {
    username: JIRA_USER,
    password: JIRA_TOKEN
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Check if tickets exist
async function checkTickets() {
  console.log('🔍 Checking existing tickets in project AV11...');
  
  try {
    // Search for all issues in project
    const response = await jira.get('/search', {
      params: {
        jql: `project = ${PROJECT_KEY}`,
        maxResults: 100,
        fields: 'key,summary,status'
      }
    });
    
    console.log(`Found ${response.data.total} existing tickets in project ${PROJECT_KEY}`);
    
    if (response.data.issues && response.data.issues.length > 0) {
      console.log('\nExisting tickets:');
      response.data.issues.forEach(issue => {
        console.log(`  - ${issue.key}: ${issue.fields.summary} [${issue.fields.status.name}]`);
      });
    }
    
    return response.data.issues || [];
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('Project AV11 not found. Please create the project first.');
    } else {
      console.error('Error checking tickets:', error.message);
    }
    return [];
  }
}

// Get project ID
async function getProjectId() {
  try {
    const response = await jira.get(`/project/${PROJECT_KEY}`);
    console.log(`✅ Found project ${PROJECT_KEY} with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error(`❌ Project ${PROJECT_KEY} not found. Please create it in JIRA first.`);
    console.log('\nTo create the project:');
    console.log('1. Go to https://aurigraphdlt.atlassian.net');
    console.log('2. Create a new project with key: AV11');
    console.log('3. Name: Aurigraph V11 Migration');
    return null;
  }
}

// Get issue types
async function getIssueTypes(projectId) {
  try {
    const response = await jira.get(`/project/${PROJECT_KEY}`);
    const issueTypes = response.data.issueTypes;
    
    const types = {};
    issueTypes.forEach(type => {
      types[type.name] = type.id;
    });
    
    console.log('\nAvailable issue types:');
    Object.keys(types).forEach(name => {
      console.log(`  - ${name}: ${types[name]}`);
    });
    
    return types;
  } catch (error) {
    console.error('Error getting issue types:', error.message);
    return {};
  }
}

// Main execution
async function main() {
  console.log('🚀 Aurigraph V11 JIRA Ticket Check');
  console.log('===================================\n');
  
  // Check credentials
  if (!JIRA_TOKEN) {
    console.error('❌ JIRA_TOKEN not set!');
    console.log('\nPlease set:');
    console.log('export JIRA_TOKEN="your-api-token"');
    process.exit(1);
  }
  
  // Get project ID
  const projectId = await getProjectId();
  if (!projectId) {
    process.exit(1);
  }
  
  // Check existing tickets
  const existingTickets = await checkTickets();
  
  // Get issue types
  const issueTypes = await getIssueTypes(projectId);
  
  console.log('\n===================================');
  console.log('📊 Summary');
  console.log('===================================');
  console.log(`Project: ${PROJECT_KEY} (ID: ${projectId})`);
  console.log(`Existing tickets: ${existingTickets.length}`);
  console.log(`Issue types available: ${Object.keys(issueTypes).length}`);
  
  if (existingTickets.length === 0) {
    console.log('\n⚠️  No tickets found in project AV11.');
    console.log('\nThe tickets referenced in the update script do not exist yet.');
    console.log('You need to create them in JIRA first, or use a different project key.');
    console.log('\nAlternatively, check if the tickets are in a different project (e.g., AV10).');
  } else {
    console.log('\n✅ Project has existing tickets that can be updated.');
  }
  
  // Check for AV10 project as alternative
  console.log('\n🔍 Checking alternative project AV10...');
  try {
    const av10Response = await jira.get('/search', {
      params: {
        jql: 'project = AV10',
        maxResults: 10,
        fields: 'key,summary'
      }
    });
    
    if (av10Response.data.total > 0) {
      console.log(`Found ${av10Response.data.total} tickets in project AV10`);
      console.log('\nSample AV10 tickets:');
      av10Response.data.issues.slice(0, 5).forEach(issue => {
        console.log(`  - ${issue.key}: ${issue.fields.summary}`);
      });
      console.log('\n💡 Tip: You may want to update AV10 tickets instead of AV11.');
    }
  } catch (error) {
    console.log('No AV10 project found.');
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});