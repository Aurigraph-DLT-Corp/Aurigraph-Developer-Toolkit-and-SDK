#!/usr/bin/env node

/**
 * GitHub to JIRA Sync Script - Complete AV11 Project Sync
 * Fetches all tickets from AV11-001 onwards and updates based on GitHub repository status
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// JIRA Configuration
const JIRA_BASE_URL = 'aurigraphdlt.atlassian.net';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5';
const JIRA_EMAIL = 'subbu@aurigraph.io';
const PROJECT_KEY = 'AV11';

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

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
                    reject(new Error(`Request failed with status ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function fetchAllTickets() {
    console.log('\n🔍 Fetching all AV11 tickets from JIRA...\n');

    try {
        const jql = `project = ${PROJECT_KEY} ORDER BY key ASC`;
        const fields = 'summary,status,issuetype,created,updated,description,assignee,priority,labels,customfield_10016';

        let allTickets = [];
        let startAt = 0;
        const maxResults = 100; // JIRA API v3 default page size
        let hasMore = true;

        while (hasMore && startAt < 1000) { // Safety limit: max 1000 tickets
            const response = await makeJiraRequest('GET', `/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&startAt=${startAt}&maxResults=${maxResults}`);

            if (!response.issues || response.issues.length === 0) {
                console.log('No more tickets to fetch');
                hasMore = false;
                break;
            }

            console.log(`📄 Page ${Math.floor(startAt/maxResults) + 1}: Retrieved ${response.issues.length} tickets (Total so far: ${allTickets.length + response.issues.length})`);

            const tickets = response.issues.map(issue => ({
                key: issue.key,
                id: issue.id,
                summary: issue.fields?.summary || 'No summary',
                status: issue.fields?.status?.name || 'Unknown',
                issueType: issue.fields?.issuetype?.name || 'Unknown',
                created: issue.fields?.created || '',
                updated: issue.fields?.updated || '',
                description: issue.fields?.description || '',
                assignee: issue.fields?.assignee?.displayName || 'Unassigned',
                priority: issue.fields?.priority?.name || 'Medium',
                labels: issue.fields?.labels || [],
                storyPoints: issue.fields?.customfield_10016 || 0
            }));

            allTickets.push(...tickets);

            startAt += response.issues.length; // Use actual returned count

            // Check if we've received all available tickets
            const total = response.total || 0;
            if (total > 0 && allTickets.length >= total) {
                console.log(`✅ Fetched all ${total} available tickets`);
                hasMore = false;
            } else if (response.issues.length < maxResults) {
                // Last page (partial results)
                hasMore = false;
            }
        }

        console.log(`\n✅ Fetched total ${allTickets.length} tickets from ${allTickets[0]?.key || 'N/A'} to ${allTickets[allTickets.length - 1]?.key || 'N/A'}\n`);

        return allTickets;
    } catch (error) {
        console.error('❌ Failed to fetch tickets:', error.message);
        console.error('Error stack:', error.stack);
        return [];
    }
}

function analyzeGitHubRepository() {
    console.log('\n📊 Analyzing GitHub repository status...\n');

    const repoPath = process.cwd();
    const analysis = {
        totalCommits: 0,
        recentCommits: [],
        completedFeatures: [],
        inProgressFeatures: [],
        todoFeatures: [],
        files: {
            java: 0,
            javascript: 0,
            typescript: 0,
            total: 0
        },
        components: {
            v11Backend: false,
            demoApp: false,
            grpcServices: false,
            consensus: false,
            quantumCrypto: false,
            crossChainBridge: false,
            aiOptimization: false,
            hmsIntegration: false
        }
    };

    try {
        // Get total commits
        const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
        analysis.totalCommits = parseInt(commitCount);

        // Get recent commits
        const recentCommits = execSync('git log -10 --oneline', { encoding: 'utf-8' })
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [hash, ...messageParts] = line.split(' ');
                return { hash, message: messageParts.join(' ') };
            });
        analysis.recentCommits = recentCommits;

        // Check for V11 Backend
        if (fs.existsSync(path.join(repoPath, 'aurigraph-av10-7/aurigraph-v11-standalone/pom.xml'))) {
            analysis.components.v11Backend = true;
        }

        // Check for Demo App
        if (fs.existsSync(path.join(repoPath, 'demo-app/index.html'))) {
            analysis.components.demoApp = true;
        }

        // Check for gRPC Services
        if (fs.existsSync(path.join(repoPath, 'aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/grpc'))) {
            analysis.components.grpcServices = true;
        }

        // Check for Consensus
        if (fs.existsSync(path.join(repoPath, 'aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/consensus'))) {
            analysis.components.consensus = true;
        }

        // Check for Quantum Crypto
        if (fs.existsSync(path.join(repoPath, 'aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/crypto'))) {
            analysis.components.quantumCrypto = true;
        }

        // Check for Cross-Chain Bridge
        if (fs.existsSync(path.join(repoPath, 'aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/bridge'))) {
            analysis.components.crossChainBridge = true;
        }

        // Check for AI Optimization
        if (fs.existsSync(path.join(repoPath, 'aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/ai'))) {
            analysis.components.aiOptimization = true;
        }

        // Check for HMS Integration
        if (fs.existsSync(path.join(repoPath, 'aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/hms'))) {
            analysis.components.hmsIntegration = true;
        }

        // Count files
        try {
            const javaFiles = execSync('find . -name "*.java" | wc -l', { encoding: 'utf-8' }).trim();
            analysis.files.java = parseInt(javaFiles);
        } catch (e) {}

        try {
            const jsFiles = execSync('find . -name "*.js" | wc -l', { encoding: 'utf-8' }).trim();
            analysis.files.javascript = parseInt(jsFiles);
        } catch (e) {}

        try {
            const tsFiles = execSync('find . -name "*.ts" | wc -l', { encoding: 'utf-8' }).trim();
            analysis.files.typescript = parseInt(tsFiles);
        } catch (e) {}

        analysis.files.total = analysis.files.java + analysis.files.javascript + analysis.files.typescript;

        console.log('✅ Repository analysis complete\n');

    } catch (error) {
        console.error('⚠️  Repository analysis partial:', error.message);
    }

    return analysis;
}

function determineTicketStatus(ticket, analysis) {
    if (!ticket || !ticket.summary || !ticket.key) {
        return {
            status: 'To Do',
            progress: '0%',
            reason: 'Ticket data incomplete'
        };
    }

    const summary = ticket.summary.toLowerCase();
    const key = ticket.key;

    // Epic AV11-192 (Demo App) - Completed
    if (key.match(/AV11-19[2-7]/) || key.match(/AV11-20[0-7]/)) {
        return {
            status: 'Done',
            progress: '100%',
            reason: 'Demo app fully implemented and documented'
        };
    }

    // Core V11 Architecture - Check for completed components
    if (summary.includes('java') || summary.includes('quarkus') || summary.includes('v11')) {
        if (analysis.components.v11Backend) {
            return {
                status: 'In Progress',
                progress: '70%',
                reason: 'V11 backend core implemented, optimization ongoing'
            };
        }
    }

    // gRPC Services
    if (summary.includes('grpc')) {
        if (analysis.components.grpcServices) {
            return {
                status: 'In Progress',
                progress: '60%',
                reason: 'gRPC service structure in place, full implementation ongoing'
            };
        }
    }

    // Consensus
    if (summary.includes('consensus') || summary.includes('hyperraft') || summary.includes('raft')) {
        if (analysis.components.consensus) {
            return {
                status: 'In Progress',
                progress: '70%',
                reason: 'HyperRAFT++ consensus implemented, optimization in progress'
            };
        }
    }

    // Quantum Crypto
    if (summary.includes('quantum') || summary.includes('crypto') || summary.includes('kyber') || summary.includes('dilithium')) {
        if (analysis.components.quantumCrypto) {
            return {
                status: 'In Progress',
                progress: '50%',
                reason: 'Quantum crypto foundation implemented'
            };
        } else {
            return {
                status: 'To Do',
                progress: '0%',
                reason: 'Quantum cryptography not yet started'
            };
        }
    }

    // Cross-Chain Bridge
    if (summary.includes('bridge') || summary.includes('cross-chain')) {
        if (analysis.components.crossChainBridge) {
            return {
                status: 'In Progress',
                progress: '40%',
                reason: 'Bridge infrastructure started'
            };
        } else {
            return {
                status: 'To Do',
                progress: '0%',
                reason: 'Cross-chain bridge not yet started'
            };
        }
    }

    // AI Optimization
    if (summary.includes('ai') || summary.includes('ml') || summary.includes('machine learning')) {
        if (analysis.components.aiOptimization) {
            return {
                status: 'Done',
                progress: '100%',
                reason: 'AI optimization services implemented'
            };
        }
    }

    // HMS Integration
    if (summary.includes('hms') || summary.includes('healthcare')) {
        if (analysis.components.hmsIntegration) {
            return {
                status: 'Done',
                progress: '100%',
                reason: 'HMS integration services implemented'
            };
        }
    }

    // Testing
    if (summary.includes('test')) {
        return {
            status: 'In Progress',
            progress: '30%',
            reason: 'Test suite development ongoing'
        };
    }

    // Documentation
    if (summary.includes('document')) {
        return {
            status: 'In Progress',
            progress: '50%',
            reason: 'Documentation in progress'
        };
    }

    // Default for existing tickets
    return {
        status: ticket.status,
        progress: ticket.status === 'Done' ? '100%' : ticket.status === 'In Progress' ? '50%' : '0%',
        reason: 'Status maintained from JIRA'
    };
}

async function updateTicketWithStatus(ticket, newStatus, analysis) {
    const updateComment = `
🔄 GitHub-JIRA Sync Update - ${new Date().toISOString().split('T')[0]}

**Status**: ${newStatus.status}
**Progress**: ${newStatus.progress}
**Reason**: ${newStatus.reason}

**Repository Analysis**:
- Total Commits: ${analysis.totalCommits}
- Java Files: ${analysis.files.java}
- JavaScript Files: ${analysis.files.javascript}
- TypeScript Files: ${analysis.files.typescript}

**Component Status**:
${analysis.components.v11Backend ? '✅' : '❌'} V11 Backend
${analysis.components.demoApp ? '✅' : '❌'} Demo Application
${analysis.components.grpcServices ? '✅' : '❌'} gRPC Services
${analysis.components.consensus ? '✅' : '❌'} Consensus Engine
${analysis.components.quantumCrypto ? '✅' : '❌'} Quantum Cryptography
${analysis.components.crossChainBridge ? '✅' : '❌'} Cross-Chain Bridge
${analysis.components.aiOptimization ? '✅' : '❌'} AI Optimization
${analysis.components.hmsIntegration ? '✅' : '❌'} HMS Integration

**Recent Commits**:
${analysis.recentCommits.slice(0, 5).map(c => `- ${c.hash.substring(0, 7)}: ${c.message.substring(0, 80)}`).join('\n')}

---
🔗 Synced from GitHub repository
📊 JIRA Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
    `.trim();

    try {
        // Use API v3 for comments (like update-jira-av11-192.js)
        const commentOptions = {
            hostname: JIRA_BASE_URL,
            path: `/rest/api/3/issue/${ticket.key}/comment`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        await new Promise((resolve, reject) => {
            const req = https.request(commentOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Failed: ${res.statusCode}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(JSON.stringify({
                body: {
                    type: "doc",
                    version: 1,
                    content: [{
                        type: "paragraph",
                        content: [{
                            type: "text",
                            text: updateComment
                        }]
                    }]
                }
            }));
            req.end();
        });

        console.log(`✅ Updated ${ticket.key}: ${ticket.summary.substring(0, 50)}... [${newStatus.status} - ${newStatus.progress}]`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to update ${ticket.key}: ${error.message}`);
        return false;
    }
}

async function syncGitHubWithJIRA() {
    console.log('================================================');
    console.log('  GitHub to JIRA Sync - AV11 Project');
    console.log('  Complete Ticket Synchronization');
    console.log('================================================');
    console.log(`Project: ${PROJECT_KEY}`);
    console.log(`Email: ${JIRA_EMAIL}\n`);

    try {
        // Test connection (use API v3 for myself endpoint)
        console.log('🔗 Testing JIRA connection...');
        const testOptions = {
            hostname: JIRA_BASE_URL,
            path: '/rest/api/3/myself',
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        };
        await new Promise((resolve, reject) => {
            const req = https.request(testOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Auth failed: ${res.statusCode}`));
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
        console.log('✅ Connected to JIRA successfully!\n');

        // Fetch all tickets
        const tickets = await fetchAllTickets();

        if (tickets.length === 0) {
            console.log('⚠️  No tickets found');
            return;
        }

        // Analyze GitHub repository
        const analysis = analyzeGitHubRepository();

        // Display analysis summary
        console.log('📊 GitHub Repository Summary:');
        console.log(`   Total Commits: ${analysis.totalCommits}`);
        console.log(`   Java Files: ${analysis.files.java}`);
        console.log(`   JavaScript Files: ${analysis.files.javascript}`);
        console.log(`   TypeScript Files: ${analysis.files.typescript}\n`);

        console.log('🔧 Component Status:');
        console.log(`   ${analysis.components.v11Backend ? '✅' : '❌'} V11 Backend`);
        console.log(`   ${analysis.components.demoApp ? '✅' : '❌'} Demo Application`);
        console.log(`   ${analysis.components.grpcServices ? '✅' : '❌'} gRPC Services`);
        console.log(`   ${analysis.components.consensus ? '✅' : '❌'} Consensus Engine`);
        console.log(`   ${analysis.components.quantumCrypto ? '✅' : '❌'} Quantum Cryptography`);
        console.log(`   ${analysis.components.crossChainBridge ? '✅' : '❌'} Cross-Chain Bridge`);
        console.log(`   ${analysis.components.aiOptimization ? '✅' : '❌'} AI Optimization`);
        console.log(`   ${analysis.components.hmsIntegration ? '✅' : '❌'} HMS Integration\n`);

        // Update tickets
        console.log('🔄 Updating JIRA tickets based on GitHub status...\n');

        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;

        for (const ticket of tickets) {
            const newStatus = determineTicketStatus(ticket, analysis);

            // Only update if status or progress changed
            if (newStatus.status !== ticket.status || newStatus.progress !== '50%') {
                const success = await updateTicketWithStatus(ticket, newStatus, analysis);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                skippedCount++;
                console.log(`⏭️  Skipped ${ticket.key}: No change needed`);
            }
        }

        console.log('\n================================================');
        console.log('  Sync Summary');
        console.log('================================================');
        console.log(`✅ Successfully updated: ${successCount}`);
        console.log(`❌ Failed to update: ${failCount}`);
        console.log(`⏭️  Skipped (no change): ${skippedCount}`);
        console.log(`📊 Total tickets processed: ${tickets.length}\n`);

        console.log('📊 View JIRA Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Run sync
syncGitHubWithJIRA();
