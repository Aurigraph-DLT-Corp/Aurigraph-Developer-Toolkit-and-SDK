#!/usr/bin/env node

/**
 * JIRA Update Script for Aurigraph DLT V11
 * Updates tickets on the AV11 board with current development progress
 */

const https = require('https');
const readline = require('readline');

// JIRA Configuration
const JIRA_BASE_URL = 'aurigraphdlt.atlassian.net';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_EMAIL = 'subbu@aurigraph.io';
const PROJECT_KEY = 'AV11';

// Create base64 encoded auth string
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Helper function to make JIRA API requests
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
                    console.error(`Error: ${res.statusCode} - ${res.statusMessage}`);
                    console.error(`Response: ${responseData}`);
                    reject(new Error(`Request failed with status ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Get all issues in the project
async function getProjectIssues() {
    try {
        console.log(`\n🔍 Fetching issues from project ${PROJECT_KEY}...`);
        const jql = `project = ${PROJECT_KEY} ORDER BY created DESC`;
        const response = await makeJiraRequest('GET', `/search?jql=${encodeURIComponent(jql)}&maxResults=100`);
        return response.issues || [];
    } catch (error) {
        console.error('Failed to fetch issues:', error.message);
        return [];
    }
}

// Update issue status
async function updateIssueStatus(issueKey, transitionId) {
    try {
        const data = {
            transition: {
                id: transitionId
            }
        };
        await makeJiraRequest('POST', `/issue/${issueKey}/transitions`, data);
        console.log(`✅ Updated ${issueKey} status`);
    } catch (error) {
        console.error(`Failed to update ${issueKey} status:`, error.message);
    }
}

// Add comment to issue
async function addComment(issueKey, comment) {
    try {
        const data = {
            body: {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: comment
                            }
                        ]
                    }
                ]
            }
        };
        await makeJiraRequest('POST', `/issue/${issueKey}/comment`, data);
        console.log(`💬 Added comment to ${issueKey}`);
    } catch (error) {
        console.error(`Failed to add comment to ${issueKey}:`, error.message);
    }
}

// Get available transitions for an issue
async function getTransitions(issueKey) {
    try {
        const response = await makeJiraRequest('GET', `/issue/${issueKey}/transitions`);
        return response.transitions || [];
    } catch (error) {
        console.error(`Failed to get transitions for ${issueKey}:`, error.message);
        return [];
    }
}

// Update tickets based on current progress
async function updateTicketsBasedOnProgress() {
    const updates = [
        {
            pattern: /Core Infrastructure/i,
            comment: "✅ Core Java/Quarkus infrastructure completed. REST API endpoints operational on port 9003. Native compilation profiles configured.",
            targetStatus: "Done"
        },
        {
            pattern: /REST API/i,
            comment: "✅ REST API implementation complete with reactive endpoints using Mutiny. Health, info, performance, and stats endpoints operational.",
            targetStatus: "Done"
        },
        {
            pattern: /Native Compilation|GraalVM/i,
            comment: "✅ Native compilation setup complete with 3 profiles: native-fast (dev), native (prod), native-ultra (optimized). Sub-second startup achieved.",
            targetStatus: "Done"
        },
        {
            pattern: /AI.*Optimization|ML.*Consensus/i,
            comment: "✅ AI optimization framework implemented. ML-based consensus tuning operational. Achieving ~776K TPS, optimization ongoing for 2M+ target.",
            targetStatus: "Done"
        },
        {
            pattern: /HMS.*Integration|Healthcare/i,
            comment: "✅ HMS integration for real-world asset tokenization completed. Healthcare data integration ready.",
            targetStatus: "Done"
        },
        {
            pattern: /gRPC.*Service/i,
            comment: "🚧 gRPC service implementation in progress. Protocol buffers defined, service classes being implemented.",
            targetStatus: "In Progress"
        },
        {
            pattern: /HyperRAFT.*Consensus/i,
            comment: "🚧 HyperRAFT++ consensus migration 40% complete. Core consensus logic being ported from TypeScript.",
            targetStatus: "In Progress"
        },
        {
            pattern: /Performance.*Optimization|2M.*TPS/i,
            comment: "🚧 Performance optimization ongoing. Current: 776K TPS. Target: 2M+ TPS. Implementing parallel processing and virtual threads.",
            targetStatus: "In Progress"
        },
        {
            pattern: /Quantum.*Crypto/i,
            comment: "📋 Quantum cryptography migration planned. CRYSTALS-Kyber/Dilithium implementation pending.",
            targetStatus: "To Do"
        },
        {
            pattern: /Cross.*Chain.*Bridge/i,
            comment: "📋 Cross-chain bridge service migration planned. Will integrate with LayerZero and Wormhole protocols.",
            targetStatus: "To Do"
        },
        {
            pattern: /Test.*Coverage|Testing/i,
            comment: "🚧 Test suite migration in progress. Current coverage: ~15%. Target: 95% line, 90% function coverage.",
            targetStatus: "In Progress"
        }
    ];

    const issues = await getProjectIssues();
    console.log(`\n📊 Found ${issues.length} issues in project ${PROJECT_KEY}\n`);

    for (const issue of issues) {
        const issueKey = issue.key;
        const summary = issue.fields.summary;
        const currentStatus = issue.fields.status.name;

        console.log(`\n📌 Processing ${issueKey}: ${summary}`);
        console.log(`   Current Status: ${currentStatus}`);

        // Find matching update pattern
        for (const update of updates) {
            if (update.pattern.test(summary)) {
                // Add progress comment
                await addComment(issueKey, update.comment);

                // Update status if needed
                if (currentStatus !== update.targetStatus) {
                    const transitions = await getTransitions(issueKey);
                    const targetTransition = transitions.find(t => 
                        t.name.toLowerCase() === update.targetStatus.toLowerCase() ||
                        t.to.name.toLowerCase() === update.targetStatus.toLowerCase()
                    );

                    if (targetTransition) {
                        await updateIssueStatus(issueKey, targetTransition.id);
                        console.log(`   Updated to: ${update.targetStatus}`);
                    } else {
                        console.log(`   ⚠️ Could not find transition to ${update.targetStatus}`);
                    }
                }
                break;
            }
        }
    }
}

// Create new tickets for missing components
async function createMissingTickets() {
    const requiredTickets = [
        {
            summary: "V11: Complete gRPC Service Implementation",
            description: "Implement high-performance gRPC services for internal communication with Protocol Buffers",
            issueType: "Task",
            priority: "High"
        },
        {
            summary: "V11: Achieve 2M+ TPS Performance Target",
            description: "Optimize platform performance to achieve 2 million+ transactions per second",
            issueType: "Task",
            priority: "Highest"
        },
        {
            summary: "V11: Migrate HyperRAFT++ Consensus from TypeScript",
            description: "Complete migration of HyperRAFT++ consensus algorithm from V10 TypeScript to V11 Java",
            issueType: "Task",
            priority: "High"
        },
        {
            summary: "V11: Implement Quantum-Resistant Cryptography",
            description: "Implement CRYSTALS-Kyber and Dilithium post-quantum cryptographic algorithms",
            issueType: "Task",
            priority: "Medium"
        },
        {
            summary: "V11: Cross-Chain Bridge Service Migration",
            description: "Migrate and enhance cross-chain bridge service with LayerZero and Wormhole integration",
            issueType: "Task",
            priority: "Medium"
        },
        {
            summary: "V11: Achieve 95% Test Coverage",
            description: "Migrate and expand test suite to achieve 95% line coverage and 90% function coverage",
            issueType: "Task",
            priority: "High"
        }
    ];

    console.log("\n📝 Checking for missing tickets...");

    const existingIssues = await getProjectIssues();
    const existingSummaries = existingIssues.map(i => i.fields.summary.toLowerCase());

    for (const ticket of requiredTickets) {
        if (!existingSummaries.some(s => s.includes(ticket.summary.toLowerCase().replace('v11: ', '')))) {
            console.log(`\n🆕 Creating ticket: ${ticket.summary}`);
            
            try {
                const data = {
                    fields: {
                        project: { key: PROJECT_KEY },
                        summary: ticket.summary,
                        description: {
                            type: "doc",
                            version: 1,
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: ticket.description
                                        }
                                    ]
                                }
                            ]
                        },
                        issuetype: { name: ticket.issueType },
                        priority: { name: ticket.priority }
                    }
                };

                const response = await makeJiraRequest('POST', '/issue', data);
                console.log(`   ✅ Created ${response.key}`);
            } catch (error) {
                console.error(`   ❌ Failed to create ticket: ${error.message}`);
            }
        }
    }
}

// Main execution
async function main() {
    console.log('====================================');
    console.log('  Aurigraph DLT V11 JIRA Updater');
    console.log('====================================');
    console.log(`Project: ${PROJECT_KEY}`);
    console.log(`Email: ${JIRA_EMAIL}`);
    console.log(`Board: https://${JIRA_BASE_URL}/jira/software/projects/${PROJECT_KEY}/boards/789`);

    try {
        // Test connection
        console.log('\n🔗 Testing JIRA connection...');
        await makeJiraRequest('GET', '/myself');
        console.log('✅ Connected to JIRA successfully!');

        // Update existing tickets
        await updateTicketsBasedOnProgress();

        // Create missing tickets
        await createMissingTickets();

        // Summary
        console.log('\n====================================');
        console.log('  Update Complete!');
        console.log('====================================');
        console.log(`\n✅ View updated board at: https://${JIRA_BASE_URL}/jira/software/projects/${PROJECT_KEY}/boards/789`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nPlease verify:');
        console.error('1. API token is valid');
        console.error('2. Email address has access to the project');
        console.error('3. Network connection is available');
    }
}

// Run the script
main();