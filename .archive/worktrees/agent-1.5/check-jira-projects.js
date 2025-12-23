#!/usr/bin/env node

const axios = require('axios');

// JIRA Configuration
const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_USER = 'admin@aurigraph.io';
const JIRA_TOKEN = process.env.JIRA_TOKEN;

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

async function checkProjects() {
  console.log('🔍 Checking available JIRA projects...\n');
  
  try {
    // Get all projects
    const response = await jira.get('/project');
    
    if (response.data && response.data.length > 0) {
      console.log(`Found ${response.data.length} project(s):\n`);
      
      response.data.forEach(project => {
        console.log(`📁 Project: ${project.name}`);
        console.log(`   Key: ${project.key}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Type: ${project.projectTypeKey}`);
        console.log('');
      });
      
      // For each project, get recent issues
      for (const project of response.data) {
        try {
          const issuesResponse = await jira.get('/search', {
            params: {
              jql: `project = ${project.key} ORDER BY created DESC`,
              maxResults: 5,
              fields: 'key,summary,status,created'
            }
          });
          
          if (issuesResponse.data.total > 0) {
            console.log(`\n📋 Recent issues in ${project.key}:`);
            console.log(`   Total issues: ${issuesResponse.data.total}`);
            
            issuesResponse.data.issues.forEach(issue => {
              const created = new Date(issue.fields.created).toLocaleDateString();
              console.log(`   - ${issue.key}: ${issue.fields.summary}`);
              console.log(`     Status: ${issue.fields.status.name}, Created: ${created}`);
            });
          } else {
            console.log(`\n   No issues found in ${project.key}`);
          }
        } catch (e) {
          console.log(`   Could not fetch issues for ${project.key}: ${e.message}`);
        }
      }
    } else {
      console.log('No projects found.');
    }
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.data) {
        console.error('Details:', error.response.data);
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

if (!JIRA_TOKEN) {
  console.error('❌ JIRA_TOKEN not set!');
  process.exit(1);
}

checkProjects();