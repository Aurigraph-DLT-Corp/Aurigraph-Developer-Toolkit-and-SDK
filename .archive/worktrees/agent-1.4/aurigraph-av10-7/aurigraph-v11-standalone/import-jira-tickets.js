#!/usr/bin/env node

/**
 * JIRA Ticket Import Script for AV11 Enterprise Portal
 * Imports Epic and User Stories from JIRA_TICKETS.json
 */

const fs = require('fs');
const https = require('https');

// JIRA Configuration
const JIRA_CONFIG = {
  baseUrl: 'https://aurigraphdlt.atlassian.net',
  email: 'subbu@aurigraph.io',
  apiToken: process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5',
  projectKey: 'AV11',
  epicKey: 'AV11-176'  // Existing epic created
};

// Create Authorization header
const auth = Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');

/**
 * Make JIRA API request
 */
function jiraRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'aurigraphdlt.atlassian.net',
      path: `/rest/api/3${path}`,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          console.error(`JIRA API Error (${res.statusCode}):`, responseData);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Get project issue types
 */
async function getIssueTypes() {
  try {
    const project = await jiraRequest('GET', `/project/${JIRA_CONFIG.projectKey}`);
    return project.issueTypes;
  } catch (error) {
    console.error('Failed to fetch issue types:', error.message);
    throw error;
  }
}

/**
 * Create Epic
 */
async function createEpic(epicData, issueTypes) {
  const epicType = issueTypes.find(type => type.name === 'Epic');
  if (!epicType) {
    throw new Error('Epic issue type not found in project');
  }

  const epicPayload = {
    fields: {
      project: { key: JIRA_CONFIG.projectKey },
      summary: epicData.summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: epicData.description
              }
            ]
          }
        ]
      },
      issuetype: { id: epicType.id },
      labels: epicData.labels || []
    }
  };

  try {
    console.log('Creating Epic:', epicData.summary);
    const result = await jiraRequest('POST', '/issue', epicPayload);
    console.log(`✅ Epic created: ${result.key}`);
    return result;
  } catch (error) {
    console.error('Failed to create Epic:', error.message);
    throw error;
  }
}

/**
 * Create Story (using Task issue type)
 */
async function createStory(storyData, epicKey, issueTypes) {
  const storyType = issueTypes.find(type => type.name === 'Task' || type.name === 'Story');
  if (!storyType) {
    throw new Error('Task/Story issue type not found in project');
  }

  const storyPayload = {
    fields: {
      project: { key: JIRA_CONFIG.projectKey },
      summary: storyData.summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: storyData.description.substring(0, 32000) // JIRA limit
              }
            ]
          }
        ]
      },
      issuetype: { id: storyType.id },
      labels: storyData.labels || [],
      parent: { key: epicKey }
    }
  };

  // Skip priority - not available in this JIRA project configuration
  // if (storyData.priority) {
  //   const priorities = await jiraRequest('GET', '/priority');
  //   const priority = priorities.find(p => p.name === storyData.priority);
  //   if (priority) {
  //     storyPayload.fields.priority = { id: priority.id };
  //   }
  // }

  // Add story points if customfield exists (varies by JIRA instance)
  // Uncomment if you know your story points field ID
  // if (storyData.storyPoints) {
  //   storyPayload.fields.customfield_10016 = storyData.storyPoints;
  // }

  try {
    console.log(`Creating Task: ${storyData.summary}`);
    const result = await jiraRequest('POST', '/issue', storyPayload);
    console.log(`  ✅ Task created: ${result.key} (${storyData.storyPoints} SP)`);
    return result;
  } catch (error) {
    console.error(`  ❌ Failed to create Task:`, error.message);
    return null;
  }
}

/**
 * Main import function
 */
async function importTickets() {
  console.log('\n🚀 Starting JIRA Ticket Import for AV11 Enterprise Portal\n');
  console.log('=' .repeat(70));

  try {
    // Read tickets JSON
    const ticketsData = JSON.parse(fs.readFileSync(__dirname + '/JIRA_TICKETS.json', 'utf8'));

    // Get issue types
    console.log('\n📋 Fetching JIRA project configuration...');
    const issueTypes = await getIssueTypes();
    console.log(`✅ Found ${issueTypes.length} issue types in project ${JIRA_CONFIG.projectKey}`);

    // Use existing Epic or create new one
    let epicKey = JIRA_CONFIG.epicKey;
    if (!epicKey) {
      console.log('\n📌 Creating Epic...');
      const epic = await createEpic(ticketsData.epic, issueTypes);
      epicKey = epic.key;
    } else {
      console.log(`\n📌 Using existing Epic: ${epicKey}`);
    }

    // Create Tasks (Stories)
    console.log(`\n📝 Creating ${ticketsData.tickets.length} Tasks...\n`);
    const createdStories = [];

    for (let i = 0; i < ticketsData.tickets.length; i++) {
      const story = ticketsData.tickets[i];
      const result = await createStory(story, epicKey, issueTypes);
      if (result) {
        createdStories.push(result);
      }

      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ Import Complete!\n');
    console.log(`Epic: ${epicKey} - ${ticketsData.epic.summary}`);
    console.log(`Stories Created: ${createdStories.length}/${ticketsData.tickets.length}`);
    console.log(`\nView in JIRA: ${JIRA_CONFIG.baseUrl}/browse/${epicKey}`);
    console.log('=' .repeat(70) + '\n');

    // Write summary to file
    const summary = {
      timestamp: new Date().toISOString(),
      epic: epic,
      stories: createdStories,
      totalStoryPoints: ticketsData.tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    };

    fs.writeFileSync('./jira-import-summary.json', JSON.stringify(summary, null, 2));
    console.log('📄 Import summary saved to: jira-import-summary.json\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run import
importTickets();
