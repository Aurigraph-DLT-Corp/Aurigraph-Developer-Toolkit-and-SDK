#!/usr/bin/env node

/**
 * Prioritize Pending Tickets - Analyze and organize 640 pending tickets
 * Suggests priorities, story points, and sprint assignments
 */

const https = require('https');
const fs = require('fs');

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

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function fetchPendingTickets() {
    console.log('\n🔍 Fetching pending tickets (To Do status)...\n');

    const fields = 'summary,status,issuetype,created,updated,description,labels,parent,customfield_10014';
    const jql = encodeURIComponent(`project = ${PROJECT_KEY} AND status = "To Do" ORDER BY created ASC`);

    let allTickets = [];
    let startAt = 0;
    const maxResults = 100;
    let hasMore = true;

    while (hasMore && startAt < 1000) {
        try {
            const response = await makeJiraRequest('GET', `/search/jql?jql=${jql}&fields=${fields}&startAt=${startAt}&maxResults=${maxResults}`);

            if (!response.issues || response.issues.length === 0) {
                hasMore = false;
                break;
            }

            const tickets = response.issues.map(issue => ({
                key: issue.key,
                summary: issue.fields?.summary || 'No summary',
                issueType: issue.fields?.issuetype?.name || 'Unknown',
                status: issue.fields?.status?.name || 'Unknown',
                created: issue.fields?.created || null,
                updated: issue.fields?.updated || null,
                description: issue.fields?.description || null,
                labels: issue.fields?.labels || [],
                parent: issue.fields?.parent?.key || null,
                epicLink: issue.fields?.customfield_10014 || null
            }));

            allTickets.push(...tickets);
            startAt += response.issues.length;

            console.log(`📄 Retrieved ${tickets.length} tickets (Total: ${allTickets.length})`);

            if (response.issues.length < maxResults) {
                hasMore = false;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            hasMore = false;
        }
    }

    console.log(`\n✅ Fetched ${allTickets.length} pending tickets\n`);
    return allTickets;
}

function analyzePriority(ticket) {
    const summary = ticket.summary.toLowerCase();
    const isEpic = ticket.issueType === 'Epic';

    // High Priority Keywords
    const highPriorityKeywords = [
        'production', 'critical', 'security', 'bug', 'fix', 'urgent',
        'deployment', 'launch', 'live', 'migration', 'performance'
    ];

    // Medium Priority Keywords
    const mediumPriorityKeywords = [
        'implementation', 'development', 'integration', 'service',
        'api', 'testing', 'optimization', 'enhancement'
    ];

    // Low Priority Keywords
    const lowPriorityKeywords = [
        'documentation', 'cleanup', 'refactor', 'minor',
        'improvement', 'nice-to-have', 'future'
    ];

    let priority = 'Medium';
    let reason = 'Standard task';

    for (const keyword of highPriorityKeywords) {
        if (summary.includes(keyword)) {
            priority = 'High';
            reason = `Contains critical keyword: ${keyword}`;
            break;
        }
    }

    if (priority === 'Medium') {
        for (const keyword of lowPriorityKeywords) {
            if (summary.includes(keyword)) {
                priority = 'Low';
                reason = `Non-urgent: ${keyword}`;
                break;
            }
        }
    }

    // Epics should generally be higher priority
    if (isEpic && priority === 'Low') {
        priority = 'Medium';
        reason = 'Epic - elevated from Low';
    }

    return { priority, reason };
}

function estimateStoryPoints(ticket) {
    const summary = ticket.summary.toLowerCase();
    const isEpic = ticket.issueType === 'Epic';

    // Epic complexity indicators
    if (isEpic) {
        if (summary.includes('platform') || summary.includes('migration') || summary.includes('deployment')) {
            return { points: 13, reason: 'Large epic - platform/migration work' };
        }
        if (summary.includes('integration') || summary.includes('service') || summary.includes('implementation')) {
            return { points: 8, reason: 'Medium epic - integration/service work' };
        }
        return { points: 5, reason: 'Standard epic' };
    }

    // Task complexity indicators
    const complexKeywords = ['migration', 'deployment', 'infrastructure', 'architecture', 'platform'];
    const mediumKeywords = ['implementation', 'integration', 'development', 'service', 'testing'];
    const simpleKeywords = ['configuration', 'setup', 'documentation', 'update'];

    for (const keyword of complexKeywords) {
        if (summary.includes(keyword)) {
            return { points: 8, reason: `Complex task: ${keyword}` };
        }
    }

    for (const keyword of mediumKeywords) {
        if (summary.includes(keyword)) {
            return { points: 5, reason: `Medium task: ${keyword}` };
        }
    }

    for (const keyword of simpleKeywords) {
        if (summary.includes(keyword)) {
            return { points: 3, reason: `Simple task: ${keyword}` };
        }
    }

    return { points: 5, reason: 'Standard task - default estimate' };
}

function categorizeBySprint(tickets) {
    const categories = {
        immediate: [],     // Next sprint (high priority, foundational)
        nearTerm: [],      // Sprints 2-3 (medium priority, core features)
        midTerm: [],       // Sprints 4-6 (enhancements, integrations)
        longTerm: []       // Future sprints (documentation, improvements)
    };

    tickets.forEach(ticket => {
        const { priority } = analyzePriority(ticket);
        const { points } = estimateStoryPoints(ticket);
        const isEpic = ticket.issueType === 'Epic';

        // Categorize based on priority and type
        if (priority === 'High' || (isEpic && priority === 'Medium')) {
            categories.immediate.push(ticket);
        } else if (priority === 'Medium' && points >= 5) {
            categories.nearTerm.push(ticket);
        } else if (priority === 'Medium') {
            categories.midTerm.push(ticket);
        } else {
            categories.longTerm.push(ticket);
        }
    });

    return categories;
}

function generatePrioritizationReport(tickets) {
    const lines = [];

    lines.push('# AV11 Pending Tickets - Prioritization & Planning');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Total Pending Tickets:** ${tickets.length}`);
    lines.push('');

    // Categorize tickets
    const categories = categorizeBySprint(tickets);

    // Calculate story points
    let totalPoints = 0;
    const ticketsWithEstimates = tickets.map(ticket => {
        const { priority, reason: priorityReason } = analyzePriority(ticket);
        const { points, reason: pointsReason } = estimateStoryPoints(ticket);
        totalPoints += points;
        return { ...ticket, priority, priorityReason, points, pointsReason };
    });

    // Executive Summary
    lines.push('## 📊 Executive Summary');
    lines.push('');
    lines.push(`- **Total Pending Tickets:** ${tickets.length}`);
    lines.push(`- **Estimated Total Story Points:** ${totalPoints}`);
    lines.push(`- **Immediate Priority (Next Sprint):** ${categories.immediate.length} tickets`);
    lines.push(`- **Near-Term (2-3 Sprints):** ${categories.nearTerm.length} tickets`);
    lines.push(`- **Mid-Term (4-6 Sprints):** ${categories.midTerm.length} tickets`);
    lines.push(`- **Long-Term (Future):** ${categories.longTerm.length} tickets`);
    lines.push('');

    // Priority Distribution
    const priorityCount = { High: 0, Medium: 0, Low: 0 };
    ticketsWithEstimates.forEach(t => priorityCount[t.priority]++);

    lines.push('## 🎯 Recommended Priority Distribution');
    lines.push('');
    lines.push(`- **High Priority:** ${priorityCount.High} tickets (${((priorityCount.High/tickets.length)*100).toFixed(1)}%)`);
    lines.push(`- **Medium Priority:** ${priorityCount.Medium} tickets (${((priorityCount.Medium/tickets.length)*100).toFixed(1)}%)`);
    lines.push(`- **Low Priority:** ${priorityCount.Low} tickets (${((priorityCount.Low/tickets.length)*100).toFixed(1)}%)`);
    lines.push('');

    // Immediate Priority Tickets
    lines.push('## 🔥 IMMEDIATE PRIORITY - Next Sprint');
    lines.push('');
    lines.push(`**Tickets:** ${categories.immediate.length}`);
    lines.push('');

    categories.immediate.slice(0, 20).forEach(ticket => {
        const est = ticketsWithEstimates.find(t => t.key === ticket.key);
        const typeIcon = ticket.issueType === 'Epic' ? '📗' : '📙';
        lines.push(`### ${typeIcon} ${ticket.key}: ${ticket.summary}`);
        lines.push(`- **Type:** ${ticket.issueType}`);
        lines.push(`- **Priority:** ${est.priority} (${est.priorityReason})`);
        lines.push(`- **Story Points:** ${est.points} (${est.pointsReason})`);
        lines.push('');
    });

    if (categories.immediate.length > 20) {
        lines.push(`*... and ${categories.immediate.length - 20} more immediate priority tickets*`);
        lines.push('');
    }

    // Near-Term Tickets
    lines.push('## 📅 NEAR-TERM - Sprints 2-3');
    lines.push('');
    lines.push(`**Tickets:** ${categories.nearTerm.length}`);
    lines.push('');

    categories.nearTerm.slice(0, 15).forEach(ticket => {
        const est = ticketsWithEstimates.find(t => t.key === ticket.key);
        const typeIcon = ticket.issueType === 'Epic' ? '📗' : '📙';
        lines.push(`- ${typeIcon} **${ticket.key}**: ${ticket.summary} [${est.priority}, ${est.points} pts]`);
    });

    if (categories.nearTerm.length > 15) {
        lines.push(`- *... and ${categories.nearTerm.length - 15} more*`);
    }
    lines.push('');

    // Story Point Breakdown
    lines.push('## 📈 Story Point Breakdown');
    lines.push('');
    const pointGroups = { '3': 0, '5': 0, '8': 0, '13': 0 };
    ticketsWithEstimates.forEach(t => {
        pointGroups[t.points.toString()] = (pointGroups[t.points.toString()] || 0) + 1;
    });

    lines.push(`- **3 points (Simple):** ${pointGroups['3']} tickets`);
    lines.push(`- **5 points (Medium):** ${pointGroups['5']} tickets`);
    lines.push(`- **8 points (Complex):** ${pointGroups['8']} tickets`);
    lines.push(`- **13 points (Large):** ${pointGroups['13']} tickets`);
    lines.push('');
    lines.push(`**Total Estimated Effort:** ${totalPoints} story points`);
    lines.push(`**Average per Ticket:** ${(totalPoints / tickets.length).toFixed(1)} points`);
    lines.push('');

    // Sprint Planning Recommendations
    lines.push('## 📋 Sprint Planning Recommendations');
    lines.push('');
    lines.push('### Sprint Capacity Assumptions');
    lines.push('- **Team Velocity:** 40-60 points per sprint (adjust based on team size)');
    lines.push('- **Sprint Duration:** 2 weeks');
    lines.push('');

    const sprintsNeeded = Math.ceil(totalPoints / 50);
    lines.push(`### Estimated Timeline`);
    lines.push(`- **Total Story Points:** ${totalPoints}`);
    lines.push(`- **Estimated Sprints:** ${sprintsNeeded} sprints (~${Math.ceil(sprintsNeeded * 2)} weeks)`);
    lines.push('');

    lines.push('### Recommended Sprint 1 (Immediate)');
    let sprint1Points = 0;
    const sprint1Tickets = [];
    for (const ticket of categories.immediate) {
        const est = ticketsWithEstimates.find(t => t.key === ticket.key);
        if (sprint1Points + est.points <= 50) {
            sprint1Points += est.points;
            sprint1Tickets.push({ ...ticket, ...est });
        } else {
            break;
        }
    }

    lines.push(`- **Tickets:** ${sprint1Tickets.length}`);
    lines.push(`- **Story Points:** ${sprint1Points}`);
    lines.push('');
    sprint1Tickets.forEach(t => {
        lines.push(`- **${t.key}**: ${t.summary} [${t.points} pts]`);
    });
    lines.push('');

    // Complete Ticket List with Recommendations
    lines.push('## 📋 Complete Pending Tickets with Recommendations');
    lines.push('');
    lines.push('| Ticket | Type | Summary | Priority | Points | Sprint Category |');
    lines.push('|--------|------|---------|----------|--------|-----------------|');

    ticketsWithEstimates.forEach(ticket => {
        const typeIcon = ticket.issueType === 'Epic' ? '📗' : '📙';
        const summary = ticket.summary.length > 50 ? ticket.summary.substring(0, 47) + '...' : ticket.summary;
        let sprintCat = 'Long-term';
        if (categories.immediate.some(t => t.key === ticket.key)) sprintCat = 'Sprint 1';
        else if (categories.nearTerm.some(t => t.key === ticket.key)) sprintCat = 'Sprint 2-3';
        else if (categories.midTerm.some(t => t.key === ticket.key)) sprintCat = 'Sprint 4-6';

        lines.push(`| ${ticket.key} | ${typeIcon} ${ticket.issueType} | ${summary} | ${ticket.priority} | ${ticket.points} | ${sprintCat} |`);
    });
    lines.push('');

    return { report: lines.join('\n'), ticketsWithEstimates };
}

async function main() {
    console.log('════════════════════════════════════════════════');
    console.log('  Pending Tickets Prioritization & Planning');
    console.log('  Analyzing 640 To Do tickets');
    console.log('════════════════════════════════════════════════\n');

    try {
        // Test connection
        console.log('🔗 Testing JIRA connection...');
        await makeJiraRequest('GET', '/myself');
        console.log('✅ Connected successfully!\n');

        // Fetch pending tickets
        const tickets = await fetchPendingTickets();

        if (tickets.length === 0) {
            console.log('✅ No pending tickets found!');
            return;
        }

        // Generate prioritization report
        console.log('📊 Analyzing and prioritizing tickets...\n');
        const { report, ticketsWithEstimates } = generatePrioritizationReport(tickets);

        // Save report
        const reportPath = 'PENDING-TICKETS-PRIORITIZATION.md';
        fs.writeFileSync(reportPath, report);
        console.log(`✅ Report saved: ${reportPath}`);

        // Save JSON data
        const jsonPath = 'pending-tickets-with-estimates.json';
        fs.writeFileSync(jsonPath, JSON.stringify(ticketsWithEstimates, null, 2));
        console.log(`✅ Data saved: ${jsonPath}`);

        // Summary
        const priorityCount = { High: 0, Medium: 0, Low: 0 };
        let totalPoints = 0;
        ticketsWithEstimates.forEach(t => {
            priorityCount[t.priority]++;
            totalPoints += t.points;
        });

        console.log('\n📊 PRIORITIZATION SUMMARY:\n');
        console.log(`Total Pending: ${tickets.length}`);
        console.log(`Estimated Points: ${totalPoints}`);
        console.log('');
        console.log('Priority Distribution:');
        console.log(`  High:   ${priorityCount.High} tickets`);
        console.log(`  Medium: ${priorityCount.Medium} tickets`);
        console.log(`  Low:    ${priorityCount.Low} tickets`);
        console.log('');
        console.log(`Estimated Sprints: ${Math.ceil(totalPoints / 50)} (@ 50 pts/sprint)`);
        console.log('');

        console.log('✅ Prioritization complete!');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
