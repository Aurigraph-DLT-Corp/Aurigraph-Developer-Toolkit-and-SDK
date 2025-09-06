#!/usr/bin/env node

/**
 * Test JIRA Connection for Aurigraph V10
 * Tests connection to JIRA instance and retrieves project information
 */

const https = require('https');

// JIRA Configuration
const JIRA_CONFIG = {
    host: 'aurigraphdlt.atlassian.net',
    projectKey: 'AV10',
    email: 'subbu@aurigraph.io', // Update with actual email
    apiToken: process.env.JIRA_API_TOKEN || '', // Set your API token
    boardId: '657'
};

// Base64 encode credentials
const auth = Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');

// Test functions
async function makeJiraRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: JIRA_CONFIG.host,
            path: path,
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject({
                        statusCode: res.statusCode,
                        message: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function testJiraConnection() {
    console.log('🔧 Testing JIRA Connection for Aurigraph V10');
    console.log('═══════════════════════════════════════════════════════\n');

    // Test 1: Check authentication
    console.log('1️⃣ Testing Authentication...');
    try {
        const myself = await makeJiraRequest('/rest/api/3/myself');
        console.log(`✅ Authentication successful!`);
        console.log(`   User: ${myself.displayName} (${myself.emailAddress})`);
        console.log(`   Account ID: ${myself.accountId}\n`);
    } catch (error) {
        console.log(`❌ Authentication failed!`);
        console.log(`   Status: ${error.statusCode}`);
        console.log(`   Message: ${error.message}`);
        console.log('\n⚠️  Please check your JIRA credentials:');
        console.log('   - Email address is correct');
        console.log('   - API token is valid (create at: https://id.atlassian.com/manage-profile/security/api-tokens)');
        console.log('   - Set environment variable: export JIRA_API_TOKEN="your-token-here"');
        return;
    }

    // Test 2: Check project access
    console.log('2️⃣ Checking Project Access...');
    try {
        const project = await makeJiraRequest(`/rest/api/3/project/${JIRA_CONFIG.projectKey}`);
        console.log(`✅ Project access confirmed!`);
        console.log(`   Project: ${project.name} (${project.key})`);
        console.log(`   Description: ${project.description || 'N/A'}`);
        console.log(`   Lead: ${project.lead?.displayName || 'N/A'}\n`);
    } catch (error) {
        console.log(`❌ Cannot access project ${JIRA_CONFIG.projectKey}`);
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 3: Get board information
    console.log('3️⃣ Retrieving Board Information...');
    try {
        const board = await makeJiraRequest(`/rest/agile/1.0/board/${JIRA_CONFIG.boardId}`);
        console.log(`✅ Board access confirmed!`);
        console.log(`   Board: ${board.name}`);
        console.log(`   Type: ${board.type}\n`);
    } catch (error) {
        console.log(`❌ Cannot access board ${JIRA_CONFIG.boardId}`);
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 4: Get epic AV10-7
    console.log('4️⃣ Checking Epic AV10-7...');
    try {
        const epic = await makeJiraRequest('/rest/api/3/issue/AV10-7');
        console.log(`✅ Epic found!`);
        console.log(`   Summary: ${epic.fields.summary}`);
        console.log(`   Status: ${epic.fields.status.name}`);
        console.log(`   Progress: ${epic.fields.progress?.percent || 0}%\n`);
    } catch (error) {
        console.log(`❌ Cannot retrieve epic AV10-7`);
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 5: Search for V10 issues
    console.log('5️⃣ Searching for V10 Issues...');
    try {
        const jql = `project = ${JIRA_CONFIG.projectKey} AND text ~ "V10" ORDER BY created DESC`;
        const search = await makeJiraRequest(`/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=5`);
        
        console.log(`✅ Found ${search.total} V10-related issues`);
        if (search.issues && search.issues.length > 0) {
            console.log('   Recent issues:');
            search.issues.forEach(issue => {
                console.log(`   - ${issue.key}: ${issue.fields.summary}`);
                console.log(`     Status: ${issue.fields.status.name}, Type: ${issue.fields.issuetype.name}`);
            });
        }
        console.log();
    } catch (error) {
        console.log(`❌ Search failed`);
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 6: Get sprint information
    console.log('6️⃣ Getting Active Sprint...');
    try {
        const sprints = await makeJiraRequest(`/rest/agile/1.0/board/${JIRA_CONFIG.boardId}/sprint?state=active`);
        if (sprints.values && sprints.values.length > 0) {
            const activeSprint = sprints.values[0];
            console.log(`✅ Active sprint found!`);
            console.log(`   Sprint: ${activeSprint.name}`);
            console.log(`   State: ${activeSprint.state}`);
            console.log(`   Start: ${new Date(activeSprint.startDate).toLocaleDateString()}`);
            console.log(`   End: ${new Date(activeSprint.endDate).toLocaleDateString()}\n`);
        } else {
            console.log('ℹ️  No active sprint found\n');
        }
    } catch (error) {
        console.log(`❌ Cannot retrieve sprint information`);
        console.log(`   Error: ${error.message}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Connection Test Summary:');
    console.log('   JIRA URL: https://aurigraphdlt.atlassian.net');
    console.log('   Project: AV10');
    console.log('   Board ID: 657');
    console.log('\n✅ JIRA connection test completed!');
    console.log('\nℹ️  To create or update issues programmatically:');
    console.log('   1. Ensure JIRA_API_TOKEN environment variable is set');
    console.log('   2. Use the JIRA REST API endpoints shown above');
    console.log('   3. Reference: https://developer.atlassian.com/cloud/jira/platform/rest/v3/');
}

// Run the test
if (!JIRA_CONFIG.apiToken) {
    console.log('⚠️  WARNING: JIRA_API_TOKEN environment variable not set!');
    console.log('   To test with authentication, run:');
    console.log('   export JIRA_API_TOKEN="your-api-token-here"');
    console.log('   node test-jira-connection.js\n');
    console.log('   Create API token at: https://id.atlassian.com/manage-profile/security/api-tokens\n');
    console.log('═══════════════════════════════════════════════════════\n');
}

testJiraConnection().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});