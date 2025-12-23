#!/usr/bin/env node

/**
 * Move JIRA Tickets - Clone AV11-99 to AV11-105 starting at AV11-137
 * Since JIRA doesn't support renumbering, this script clones tickets to new keys
 */

const https = require('https');

// JIRA Configuration
const JIRA_BASE_URL = 'aurigraphdlt.atlassian.net';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5';
const JIRA_EMAIL = 'subbu@aurigraph.io';
const PROJECT_KEY = 'AV11';

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Tickets to move
const SOURCE_TICKETS = [99, 100, 101, 102, 103, 104, 105];
const TARGET_START = 137;

function makeJiraRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: JIRA_BASE_URL,
            path: `/rest/api/3${path}`,
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(responseData));
                    } catch (e) {
                        resolve(responseData);
                    }
                } else {
                    console.error(`Error: ${res.statusCode} - ${responseData}`);
                    reject(new Error(`Request failed with status ${res.statusCode}: ${responseData}`));
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

async function getTicket(ticketKey) {
    console.log(`📥 Fetching ${ticketKey}...`);
    try {
        const ticket = await makeJiraRequest('GET', `/issue/${ticketKey}`);
        return ticket;
    } catch (error) {
        console.error(`❌ Failed to fetch ${ticketKey}: ${error.message}`);
        return null;
    }
}

async function getProjectIssueTypes() {
    console.log('🔍 Fetching project issue types...');
    try {
        const response = await makeJiraRequest('GET', `/project/${PROJECT_KEY}`);
        return response.issueTypes || [];
    } catch (error) {
        console.error(`❌ Failed to fetch issue types: ${error.message}`);
        return [];
    }
}

async function createTicket(sourceTicket, newNumber) {
    const newKey = `${PROJECT_KEY}-${newNumber}`;
    console.log(`📝 Creating ${newKey} (clone of ${sourceTicket.key})...`);

    try {
        const issueTypes = await getProjectIssueTypes();
        const taskType = issueTypes.find(t => t.name === 'Task');

        if (!taskType) {
            throw new Error('Task issue type not found');
        }

        const createData = {
            fields: {
                project: {
                    key: PROJECT_KEY
                },
                summary: sourceTicket.fields.summary,
                description: sourceTicket.fields.description || {
                    type: "doc",
                    version: 1,
                    content: [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            text: `Moved from ${sourceTicket.key}`
                        }]
                    }]
                },
                issuetype: {
                    id: taskType.id
                }
            }
        };

        // Add story points if present
        if (sourceTicket.fields.customfield_10016) {
            createData.fields.customfield_10016 = sourceTicket.fields.customfield_10016;
        }

        // Add labels
        if (sourceTicket.fields.labels && sourceTicket.fields.labels.length > 0) {
            createData.fields.labels = [...sourceTicket.fields.labels, 'moved-ticket'];
        } else {
            createData.fields.labels = ['moved-ticket'];
        }

        const newTicket = await makeJiraRequest('POST', '/issue', createData);
        console.log(`✅ Created ${newTicket.key}`);

        return newTicket;
    } catch (error) {
        console.error(`❌ Failed to create ${newKey}: ${error.message}`);
        return null;
    }
}

async function addCommentToTicket(ticketKey, comment) {
    console.log(`💬 Adding comment to ${ticketKey}...`);
    try {
        await makeJiraRequest('POST', `/issue/${ticketKey}/comment`, {
            body: {
                type: "doc",
                version: 1,
                content: [{
                    type: "paragraph",
                    content: [{
                        type: "text",
                        text: comment
                    }]
                }]
            }
        });
        console.log(`✅ Comment added to ${ticketKey}`);
    } catch (error) {
        console.error(`❌ Failed to add comment: ${error.message}`);
    }
}

async function transitionTicket(ticketKey, transitionName) {
    console.log(`🔄 Transitioning ${ticketKey} to ${transitionName}...`);
    try {
        // Get available transitions
        const transitions = await makeJiraRequest('GET', `/issue/${ticketKey}/transitions`);
        const transition = transitions.transitions.find(t =>
            t.name.toLowerCase().includes(transitionName.toLowerCase()) ||
            t.to.name.toLowerCase().includes(transitionName.toLowerCase())
        );

        if (!transition) {
            console.log(`⚠️  Transition "${transitionName}" not found for ${ticketKey}`);
            return false;
        }

        await makeJiraRequest('POST', `/issue/${ticketKey}/transitions`, {
            transition: {
                id: transition.id
            }
        });

        console.log(`✅ ${ticketKey} transitioned to ${transition.to.name}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to transition ${ticketKey}: ${error.message}`);
        return false;
    }
}

async function moveTickets() {
    console.log('================================================');
    console.log('  JIRA Ticket Move Operation');
    console.log('  Moving AV11-99 to AV11-105 → Starting at AV11-137');
    console.log('================================================\n');

    // Test connection
    console.log('🔗 Testing JIRA connection...');
    try {
        await makeJiraRequest('GET', '/myself');
        console.log('✅ Connected to JIRA successfully!\n');
    } catch (error) {
        console.error('❌ Failed to connect to JIRA');
        process.exit(1);
    }

    const movedTickets = [];
    let targetNumber = TARGET_START;

    for (const sourceNumber of SOURCE_TICKETS) {
        const sourceKey = `${PROJECT_KEY}-${sourceNumber}`;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`Moving ${sourceKey} → ${PROJECT_KEY}-${targetNumber}`);
        console.log('='.repeat(60));

        // Fetch source ticket
        const sourceTicket = await getTicket(sourceKey);
        if (!sourceTicket) {
            console.log(`⏭️  Skipping ${sourceKey} (not found)`);
            targetNumber++;
            continue;
        }

        console.log(`📋 Source: ${sourceTicket.fields.summary}`);
        console.log(`📊 Type: ${sourceTicket.fields.issuetype.name}`);
        console.log(`📈 Status: ${sourceTicket.fields.status.name}`);

        // Create new ticket
        const newTicket = await createTicket(sourceTicket, targetNumber);
        if (!newTicket) {
            console.log(`❌ Failed to clone ${sourceKey}`);
            targetNumber++;
            continue;
        }

        // Add comment to both tickets
        await addCommentToTicket(
            sourceKey,
            `This ticket has been moved to ${newTicket.key}. Please refer to the new ticket for all updates.`
        );

        await addCommentToTicket(
            newTicket.key,
            `This ticket was moved from ${sourceKey}. Original ticket has been deprecated.`
        );

        // Optionally close/resolve the old ticket
        // Uncomment the line below to automatically close old tickets
        // await transitionTicket(sourceKey, 'done');

        movedTickets.push({
            from: sourceKey,
            to: newTicket.key,
            summary: sourceTicket.fields.summary
        });

        targetNumber++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n\n================================================');
    console.log('  Move Operation Summary');
    console.log('================================================\n');

    if (movedTickets.length === 0) {
        console.log('❌ No tickets were moved');
    } else {
        console.log(`✅ Successfully moved ${movedTickets.length} ticket(s):\n`);
        movedTickets.forEach(ticket => {
            console.log(`  ${ticket.from} → ${ticket.to}`);
            console.log(`  └─ ${ticket.summary}\n`);
        });

        console.log('\n📝 Next Steps:');
        console.log('  1. Review the new tickets in JIRA');
        console.log('  2. Update any external references to use new ticket keys');
        console.log('  3. Consider closing/resolving the old tickets');
        console.log('  4. To close old tickets, uncomment the transition line in the script\n');
    }

    console.log('✅ Move operation complete!');
}

moveTickets().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
