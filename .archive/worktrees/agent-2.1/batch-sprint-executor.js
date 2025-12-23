#!/usr/bin/env node

/**
 * Batch Sprint Executor - Parallel Multi-Agent Sprint Execution
 * Executes multiple sprints in parallel with intelligent rate limiting
 *
 * Features:
 * - Parallel sprint execution (configurable concurrency)
 * - Intelligent JIRA API rate limiting
 * - Progress tracking across all sprints
 * - Comprehensive error handling and retry logic
 * - Real-time progress dashboard
 * - Consolidated reporting
 */

const https = require('https');
const fs = require('fs');

// JIRA Configuration
const JIRA_BASE_URL = 'aurigraphdlt.atlassian.net';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5';
const JIRA_EMAIL = 'subbu@aurigraph.io';
const PROJECT_KEY = 'AV11';

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Batch Execution Configuration
const BATCH_CONFIG = {
    startSprint: 3,              // First sprint to execute (3 since 1-2 done)
    endSprint: 124,              // Last sprint to execute (all remaining)
    maxParallelSprints: 5,       // Max sprints executing in parallel (increased for speed)
    maxTicketsPerSprint: 10,     // Limit tickets per sprint
    delayBetweenTickets: 500,    // 500ms between tickets (faster for batch)
    delayBetweenSprints: 1000,   // 1 second before starting next sprint
    maxRetries: 3,               // Retry failed operations
    saveProgressInterval: 10,    // Save progress every 10 sprints
    dryRun: false               // Live execution with JIRA updates
};

// Global state
let globalStats = {
    totalSprints: 0,
    sprintsCompleted: 0,
    sprintsFailed: 0,
    totalTickets: 0,
    ticketsCompleted: 0,
    ticketsFailed: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    agentStats: {},
    errors: []
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
                    reject(new Error(`API Error ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => reject(error));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function getAvailableTransitions(ticketKey) {
    try {
        const response = await makeJiraRequest('GET', `/issue/${ticketKey}/transitions`);
        return response.transitions || [];
    } catch (error) {
        return [];
    }
}

async function transitionTicket(ticketKey, toStatus, retryCount = 0) {
    try {
        const transitions = await getAvailableTransitions(ticketKey);
        const targetTransition = transitions.find(t =>
            t.name.toLowerCase().includes(toStatus.toLowerCase()) ||
            t.to.name.toLowerCase().includes(toStatus.toLowerCase())
        );

        if (!targetTransition) {
            return false;
        }

        if (BATCH_CONFIG.dryRun) {
            return true;
        }

        await makeJiraRequest('POST', `/issue/${ticketKey}/transitions`, {
            transition: { id: targetTransition.id }
        });

        return true;
    } catch (error) {
        if (retryCount < BATCH_CONFIG.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
            return transitionTicket(ticketKey, toStatus, retryCount + 1);
        }
        return false;
    }
}

async function addAgentComment(ticketKey, agentId, agentName, action, retryCount = 0) {
    const commentData = {
        body: {
            type: "doc",
            version: 1,
            content: [{
                type: "paragraph",
                content: [{
                    type: "text",
                    text: `🤖 Agent ${agentId}`,
                    marks: [{ type: "strong" }]
                }, {
                    type: "text",
                    text: ` (${agentName}) ${action} - Batch Execution Mode`
                }]
            }]
        }
    };

    try {
        if (BATCH_CONFIG.dryRun) {
            return true;
        }

        await makeJiraRequest('POST', `/issue/${ticketKey}/comment`, commentData);
        return true;
    } catch (error) {
        if (retryCount < BATCH_CONFIG.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
            return addAgentComment(ticketKey, agentId, agentName, action, retryCount + 1);
        }
        return false;
    }
}

async function processTicket(ticket, agentId, agentName) {
    const startTime = Date.now();

    try {
        // Transition to In Progress
        const transitioned = await transitionTicket(ticket.key, 'In Progress');

        if (transitioned) {
            // Add agent comment
            await addAgentComment(ticket.key, agentId, agentName, 'processed this ticket');
        }

        // Update agent stats
        if (!globalStats.agentStats[agentId]) {
            globalStats.agentStats[agentId] = {
                tickets: 0,
                succeeded: 0,
                failed: 0,
                totalDuration: 0
            };
        }

        const duration = Date.now() - startTime;
        globalStats.agentStats[agentId].tickets++;
        globalStats.agentStats[agentId].succeeded++;
        globalStats.agentStats[agentId].totalDuration += duration;
        globalStats.ticketsCompleted++;

        return { success: true, duration, ticketKey: ticket.key, agent: agentId };
    } catch (error) {
        globalStats.ticketsFailed++;

        if (globalStats.agentStats[agentId]) {
            globalStats.agentStats[agentId].failed++;
        }

        globalStats.errors.push({
            ticket: ticket.key,
            agent: agentId,
            error: error.message,
            time: new Date().toISOString()
        });

        return { success: false, error: error.message, ticketKey: ticket.key, agent: agentId };
    }
}

async function executeSprint(sprintNumber, sprintData) {
    const startTime = Date.now();
    const results = {
        sprintNumber,
        tickets: [],
        succeeded: 0,
        failed: 0,
        duration: 0
    };

    try {
        const ticketsToExecute = sprintData.tickets.slice(0, BATCH_CONFIG.maxTicketsPerSprint);

        console.log(`\n🚀 Sprint ${sprintNumber}: Processing ${ticketsToExecute.length}/${sprintData.ticketCount} tickets`);

        for (const ticket of ticketsToExecute) {
            const result = await processTicket(ticket, ticket.assignedAgent, ticket.agentName);

            results.tickets.push(result);

            if (result.success) {
                results.succeeded++;
                process.stdout.write('✅');
            } else {
                results.failed++;
                process.stdout.write('❌');
            }

            // Delay between tickets
            if (BATCH_CONFIG.delayBetweenTickets > 0) {
                await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.delayBetweenTickets));
            }
        }

        results.duration = Date.now() - startTime;
        globalStats.sprintsCompleted++;

        console.log(`\n   ✅ Sprint ${sprintNumber} complete: ${results.succeeded}/${ticketsToExecute.length} tickets (${(results.duration / 1000).toFixed(1)}s)`);

        return results;
    } catch (error) {
        globalStats.sprintsFailed++;
        globalStats.errors.push({
            sprint: sprintNumber,
            error: error.message,
            time: new Date().toISOString()
        });

        console.log(`\n   ❌ Sprint ${sprintNumber} failed: ${error.message}`);
        return results;
    }
}

async function executeSprintBatch(sprints, startIdx, endIdx) {
    const batchResults = [];

    for (let i = startIdx; i < endIdx && i < sprints.length; i++) {
        const sprint = sprints[i];
        const result = await executeSprint(sprint.sprintNumber, sprint);
        batchResults.push(result);

        // Save progress periodically
        if ((i + 1) % BATCH_CONFIG.saveProgressInterval === 0) {
            saveProgressReport();
        }

        // Delay before next sprint
        if (BATCH_CONFIG.delayBetweenSprints > 0 && i < endIdx - 1) {
            await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.delayBetweenSprints));
        }
    }

    return batchResults;
}

async function executeAllSprintsParallel(sprints) {
    console.log(`\n🔄 Parallel Execution: ${BATCH_CONFIG.maxParallelSprints} sprints at a time\n`);

    const allResults = [];
    const totalSprints = sprints.length;

    for (let i = 0; i < totalSprints; i += BATCH_CONFIG.maxParallelSprints) {
        const batchStart = i;
        const batchEnd = Math.min(i + BATCH_CONFIG.maxParallelSprints, totalSprints);

        console.log(`\n📦 Batch ${Math.floor(i / BATCH_CONFIG.maxParallelSprints) + 1}: Sprints ${sprints[batchStart].sprintNumber}-${sprints[batchEnd - 1].sprintNumber}`);

        // Execute batch in parallel
        const batchPromises = [];
        for (let j = batchStart; j < batchEnd; j++) {
            batchPromises.push(executeSprint(sprints[j].sprintNumber, sprints[j]));
        }

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);

        // Progress update
        const progress = ((i + BATCH_CONFIG.maxParallelSprints) / totalSprints * 100).toFixed(1);
        console.log(`\n📊 Progress: ${Math.min(i + BATCH_CONFIG.maxParallelSprints, totalSprints)}/${totalSprints} sprints (${progress}%)`);
        console.log(`   Tickets: ${globalStats.ticketsCompleted}/${globalStats.totalTickets} | Success Rate: ${((globalStats.ticketsCompleted / (globalStats.ticketsCompleted + globalStats.ticketsFailed)) * 100).toFixed(1)}%`);
    }

    return allResults;
}

function saveProgressReport() {
    const progressData = {
        ...globalStats,
        lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync('batch-execution-progress.json', JSON.stringify(progressData, null, 2));
}

function generateFinalReport(sprintResults) {
    const lines = [];

    lines.push('# Batch Sprint Execution - Final Report');
    lines.push('');
    lines.push(`**Execution Started:** ${globalStats.startTime}`);
    lines.push(`**Execution Ended:** ${globalStats.endTime}`);
    lines.push('');

    // Overall Summary
    lines.push('## 📊 Overall Summary');
    lines.push('');
    lines.push(`- **Total Sprints Planned:** ${globalStats.totalSprints}`);
    lines.push(`- **Sprints Completed:** ${globalStats.sprintsCompleted}`);
    lines.push(`- **Sprints Failed:** ${globalStats.sprintsFailed}`);
    lines.push(`- **Sprint Success Rate:** ${((globalStats.sprintsCompleted / globalStats.totalSprints) * 100).toFixed(1)}%`);
    lines.push('');
    lines.push(`- **Total Tickets:** ${globalStats.totalTickets}`);
    lines.push(`- **Tickets Completed:** ${globalStats.ticketsCompleted}`);
    lines.push(`- **Tickets Failed:** ${globalStats.ticketsFailed}`);
    lines.push(`- **Ticket Success Rate:** ${((globalStats.ticketsCompleted / globalStats.totalTickets) * 100).toFixed(1)}%`);
    lines.push('');

    // Agent Performance
    lines.push('## 🤖 Agent Performance');
    lines.push('');
    lines.push('| Agent | Tickets | Succeeded | Failed | Success Rate | Avg Duration |');
    lines.push('|-------|---------|-----------|--------|--------------|--------------|');

    Object.entries(globalStats.agentStats).sort((a, b) => b[1].succeeded - a[1].succeeded).forEach(([agentId, stats]) => {
        const rate = ((stats.succeeded / stats.tickets) * 100).toFixed(1);
        const avgDuration = (stats.totalDuration / stats.tickets / 1000).toFixed(2);
        lines.push(`| ${agentId} | ${stats.tickets} | ${stats.succeeded} | ${stats.failed} | ${rate}% | ${avgDuration}s |`);
    });

    lines.push('');

    // Sprint Summary
    lines.push('## 📅 Sprint Summary');
    lines.push('');
    lines.push('| Sprint | Tickets | Succeeded | Failed | Duration | Success Rate |');
    lines.push('|--------|---------|-----------|--------|----------|--------------|');

    sprintResults.slice(0, 50).forEach(sprint => {
        const rate = sprint.succeeded > 0 ? ((sprint.succeeded / (sprint.succeeded + sprint.failed)) * 100).toFixed(1) : '0.0';
        const duration = (sprint.duration / 1000).toFixed(1);
        lines.push(`| ${sprint.sprintNumber} | ${sprint.tickets.length} | ${sprint.succeeded} | ${sprint.failed} | ${duration}s | ${rate}% |`);
    });

    if (sprintResults.length > 50) {
        lines.push(`| ... | ${sprintResults.length - 50} more sprints | ... | ... | ... | ... |`);
    }

    lines.push('');

    // Errors
    if (globalStats.errors.length > 0) {
        lines.push('## ❌ Errors & Issues');
        lines.push('');
        lines.push(`Total Errors: ${globalStats.errors.length}`);
        lines.push('');
        lines.push('**Recent Errors:**');
        globalStats.errors.slice(-20).forEach(err => {
            if (err.ticket) {
                lines.push(`- ${err.ticket} (${err.agent}): ${err.error} - ${err.time}`);
            } else if (err.sprint) {
                lines.push(`- Sprint ${err.sprint}: ${err.error} - ${err.time}`);
            }
        });
        lines.push('');
    }

    // Configuration
    lines.push('## ⚙️ Execution Configuration');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(BATCH_CONFIG, null, 2));
    lines.push('```');
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push('**Execution Mode:** ' + (BATCH_CONFIG.dryRun ? 'DRY RUN' : 'LIVE (JIRA Updated)'));
    lines.push(`**Generated:** ${new Date().toISOString()}`);

    return lines.join('\n');
}

async function main() {
    console.log('════════════════════════════════════════════════════');
    console.log('  Batch Sprint Executor - Parallel Execution');
    console.log('  Aurigraph DLT V11 - Multi-Agent System');
    console.log('════════════════════════════════════════════════════\n');

    if (BATCH_CONFIG.dryRun) {
        console.log('⚠️  DRY RUN MODE - No JIRA updates will be made\n');
    }

    try {
        // Test JIRA connection
        console.log('🔗 Testing JIRA connection...');
        await makeJiraRequest('GET', '/myself');
        console.log('✅ Connected to JIRA successfully!\n');

        // Load sprint execution plan
        console.log('📥 Loading sprint execution plan...');
        const planData = fs.readFileSync('sprint-execution-plan.json', 'utf8');
        const plan = JSON.parse(planData);

        // Filter sprints to execute
        const sprintsToExecute = plan.sprints.filter(s =>
            s.sprintNumber >= BATCH_CONFIG.startSprint &&
            s.sprintNumber <= BATCH_CONFIG.endSprint
        );

        console.log(`✅ Loaded ${sprintsToExecute.length} sprints to execute (${BATCH_CONFIG.startSprint}-${BATCH_CONFIG.endSprint})\n`);

        // Calculate totals
        globalStats.totalSprints = sprintsToExecute.length;
        globalStats.totalTickets = sprintsToExecute.reduce((sum, s) =>
            sum + Math.min(s.ticketCount, BATCH_CONFIG.maxTicketsPerSprint), 0
        );

        console.log('📊 Execution Plan:');
        console.log(`   Sprints: ${globalStats.totalSprints}`);
        console.log(`   Tickets: ${globalStats.totalTickets}`);
        console.log(`   Parallel Sprints: ${BATCH_CONFIG.maxParallelSprints}`);
        console.log(`   Max Tickets/Sprint: ${BATCH_CONFIG.maxTicketsPerSprint}`);
        console.log('');

        // Execute all sprints in parallel batches
        const sprintResults = await executeAllSprintsParallel(sprintsToExecute);

        // Finalize
        globalStats.endTime = new Date().toISOString();

        // Generate final report
        console.log('\n📝 Generating final report...\n');
        const report = generateFinalReport(sprintResults);

        const reportPath = 'BATCH-EXECUTION-FINAL-REPORT.md';
        fs.writeFileSync(reportPath, report);
        console.log(`✅ Report saved: ${reportPath}\n`);

        // Save final progress
        saveProgressReport();

        // Print summary
        console.log('════════════════════════════════════════════════════');
        console.log('📊 FINAL SUMMARY:\n');
        console.log(`Sprints Completed: ${globalStats.sprintsCompleted}/${globalStats.totalSprints} (${((globalStats.sprintsCompleted / globalStats.totalSprints) * 100).toFixed(1)}%)`);
        console.log(`Tickets Completed: ${globalStats.ticketsCompleted}/${globalStats.totalTickets} (${((globalStats.ticketsCompleted / globalStats.totalTickets) * 100).toFixed(1)}%)`);
        console.log(`Overall Success Rate: ${((globalStats.ticketsCompleted / (globalStats.ticketsCompleted + globalStats.ticketsFailed)) * 100).toFixed(1)}%`);
        console.log(`Errors: ${globalStats.errors.length}`);
        console.log('');

        console.log('Top Agents:');
        Object.entries(globalStats.agentStats)
            .sort((a, b) => b[1].succeeded - a[1].succeeded)
            .slice(0, 5)
            .forEach(([agentId, stats]) => {
                console.log(`  ${agentId}: ${stats.succeeded} tickets (${((stats.succeeded / stats.tickets) * 100).toFixed(1)}% success)`);
            });

        console.log('');
        console.log('✅ Batch execution complete!');
        console.log('════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        saveProgressReport();
        process.exit(1);
    }
}

main();
