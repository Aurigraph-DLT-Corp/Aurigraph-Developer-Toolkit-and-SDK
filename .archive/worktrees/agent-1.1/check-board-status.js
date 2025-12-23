#!/usr/bin/env node

const axios = require('axios');

// JIRA Configuration
const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_USER = 'subbu@aurigraph.io';
const JIRA_TOKEN = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const PROJECT_KEY = 'AV11';

const jira = axios.create({
  baseURL: `${JIRA_BASE_URL}/rest/api/3`,
  auth: {
    username: JIRA_USER,
    password: JIRA_TOKEN
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function checkBoardStatus() {
  console.log('🔍 Checking AV11 Board Status...\n');
  
  try {
    // Get all issues in the project
    const response = await jira.get('/search', {
      params: {
        jql: `project = ${PROJECT_KEY} ORDER BY key ASC`,
        maxResults: 100,
        fields: 'key,summary,status,issuetype'
      }
    });
    
    const issues = response.data.issues || [];
    console.log(`📊 Found ${issues.length} tickets in project ${PROJECT_KEY}\n`);
    
    // Group by status
    const statusGroups = {};
    issues.forEach(issue => {
      const status = issue.fields.status.name;
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(issue);
    });
    
    // Display by status
    console.log('📈 Tickets by Status:');
    console.log('====================');
    Object.keys(statusGroups).forEach(status => {
      console.log(`\n${status}: ${statusGroups[status].length} tickets`);
      statusGroups[status].slice(0, 5).forEach(issue => {
        const type = issue.fields.issuetype.name;
        console.log(`  - ${issue.key} [${type}]: ${issue.fields.summary}`);
      });
      if (statusGroups[status].length > 5) {
        console.log(`  ... and ${statusGroups[status].length - 5} more`);
      }
    });
    
    // Summary statistics
    const epics = issues.filter(i => i.fields.issuetype.name === 'Epic');
    const stories = issues.filter(i => i.fields.issuetype.name === 'Story');
    const done = issues.filter(i => i.fields.status.name === 'Done');
    
    console.log('\n📊 Summary Statistics:');
    console.log('=====================');
    console.log(`Total Tickets: ${issues.length}`);
    console.log(`Epics: ${epics.length}`);
    console.log(`Stories: ${stories.length}`);
    console.log(`Completed (Done): ${done.length}`);
    console.log(`Completion Rate: ${Math.round((done.length / issues.length) * 100)}%`);
    
    console.log('\n✅ Board Status Check Complete!');
    console.log(`View board: ${JIRA_BASE_URL}/jira/software/projects/${PROJECT_KEY}/boards/789`);
    
  } catch (error) {
    console.error('❌ Error checking board:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

checkBoardStatus();