#!/usr/bin/env node

/**
 * Close Old JIRA Tickets - Mark AV11-99 to AV11-105 as Done/Closed
 * These tickets have been moved to AV11-208 to AV11-214
 */

const https = require('https');

// JIRA Configuration
const JIRA_BASE_URL = 'aurigraphdlt.atlassian.net';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5';
const JIRA_EMAIL = 'subbu@aurigraph.io';
const PROJECT_KEY = 'AV11';

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Old tickets to close
const OLD_TICKETS = [99, 100, 101, 102, 103, 104, 105];

// Mapping to new tickets
const TICKET_MAPPING = {
    99: 208,
    100: 209,
    101: 210,
    102: 211,
    103: 212,
    104: 213,
    105: 214
};

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

async function getAvailableTransitions(ticketKey) {
    try {
        const response = await makeJiraRequest('GET', `/issue/${ticketKey}/transitions`);
        return response.transitions || [];
    } catch (error) {
        console.error(`❌ Failed to get transitions for ${ticketKey}: ${error.message}`);
        return [];
    }
}

async function transitionTicket(ticketKey, newTicketKey) {
    console.log(`\n🔄 Closing ${ticketKey} (moved to ${newTicketKey})...`);

    try {
        // Get available transitions
        const transitions = await getAvailableTransitions(ticketKey);

        if (transitions.length === 0) {
            console.log(`⚠️  No transitions available for ${ticketKey}`);
            return false;
        }

        console.log(`   Available transitions: ${transitions.map(t => t.name).join(', ')}`);

        // Try to find Done, Close, or Resolve transition
        const doneTransition = transitions.find(t =>
            t.name.toLowerCase().includes('done') ||
            t.name.toLowerCase().includes('close') ||
            t.name.toLowerCase().includes('resolve') ||
            t.to.name.toLowerCase().includes('done') ||
            t.to.name.toLowerCase().includes('close') ||
            t.to.name.toLowerCase().includes('resolve')
        );

        if (!doneTransition) {
            console.log(`⚠️  No 'Done/Close/Resolve' transition found for ${ticketKey}`);
            console.log(`   Please close ${ticketKey} manually in JIRA`);
            return false;
        }

        // Perform the transition
        await makeJiraRequest('POST', `/issue/${ticketKey}/transitions`, {
            transition: {
                id: doneTransition.id
            }
        });

        console.log(`✅ ${ticketKey} transitioned to "${doneTransition.to.name}"`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to transition ${ticketKey}: ${error.message}`);
        return false;
    }
}

async function addFinalComment(ticketKey, newTicketKey) {
    console.log(`💬 Adding final comment to ${ticketKey}...`);
    try {
        await makeJiraRequest('POST', `/issue/${ticketKey}/comment`, {
            body: {
                type: "doc",
                version: 1,
                content: [{
                    type: "paragraph",
                    content: [{
                        type: "text",
                        text: `TICKET CLOSED: This ticket has been superseded by ${newTicketKey}. All work should be tracked in the new ticket. This ticket is now archived.`,
                        marks: [{
                            type: "strong"
                        }]
                    }]
                }]
            }
        });
        console.log(`✅ Final comment added to ${ticketKey}`);
    } catch (error) {
        console.error(`❌ Failed to add comment: ${error.message}`);
    }
}

async function closeOldTickets() {
    console.log('================================================');
    console.log('  Close Old JIRA Tickets');
    console.log('  Closing AV11-99 to AV11-105 (moved to AV11-208-214)');
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

    const results = {
        closed: [],
        failed: []
    };

    for (const oldNumber of OLD_TICKETS) {
        const oldKey = `${PROJECT_KEY}-${oldNumber}`;
        const newKey = `${PROJECT_KEY}-${TICKET_MAPPING[oldNumber]}`;

        console.log('='.repeat(60));

        // Add final comment
        await addFinalComment(oldKey, newKey);

        // Transition to Done/Closed
        const success = await transitionTicket(oldKey, newKey);

        if (success) {
            results.closed.push({ old: oldKey, new: newKey });
        } else {
            results.failed.push({ old: oldKey, new: newKey });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n\n================================================');
    console.log('  Closure Summary');
    console.log('================================================\n');

    if (results.closed.length > 0) {
        console.log(`✅ Successfully closed ${results.closed.length} ticket(s):\n`);
        results.closed.forEach(ticket => {
            console.log(`  ${ticket.old} → Closed (moved to ${ticket.new})`);
        });
    }

    if (results.failed.length > 0) {
        console.log(`\n⚠️  Failed to close ${results.failed.length} ticket(s):\n`);
        results.failed.forEach(ticket => {
            console.log(`  ${ticket.old} → Requires manual closure (moved to ${ticket.new})`);
        });
        console.log('\nPlease close these tickets manually in JIRA.');
    }

    console.log('\n📝 Summary:');
    console.log(`  Total Processed: ${OLD_TICKETS.length}`);
    console.log(`  Successfully Closed: ${results.closed.length}`);
    console.log(`  Requires Manual Action: ${results.failed.length}`);

    console.log('\n✅ Closure operation complete!');
}

closeOldTickets().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
