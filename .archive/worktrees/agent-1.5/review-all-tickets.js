#!/usr/bin/env node

/**
 * Review All JIRA Tickets - Comprehensive AV11 Project Review
 * Fetches and analyzes all tickets from AV11-001 onwards
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

async function fetchAllTickets() {
    console.log('\n🔍 Fetching all AV11 tickets...\n');

    const fields = 'summary,status,issuetype,created,updated,description,assignee,priority,labels,parent,customfield_10014,customfield_10016,resolution';
    const jql = encodeURIComponent(`project = ${PROJECT_KEY} ORDER BY key ASC`);

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
                id: issue.id,
                summary: issue.fields?.summary || 'No summary',
                issueType: issue.fields?.issuetype?.name || 'Unknown',
                status: issue.fields?.status?.name || 'Unknown',
                resolution: issue.fields?.resolution?.name || null,
                created: issue.fields?.created || null,
                updated: issue.fields?.updated || null,
                assignee: issue.fields?.assignee?.displayName || 'Unassigned',
                parent: issue.fields?.parent?.key || null,
                epicLink: issue.fields?.customfield_10014 || null,
                storyPoints: issue.fields?.customfield_10016 || 0,
                priority: issue.fields?.priority?.name || 'None',
                labels: issue.fields?.labels || []
            }));

            allTickets.push(...tickets);
            startAt += response.issues.length;

            console.log(`📄 Retrieved ${tickets.length} tickets (Total: ${allTickets.length})`);

            const total = response.total || 0;
            if (total > 0 && allTickets.length >= total) {
                hasMore = false;
            } else if (response.issues.length < maxResults) {
                hasMore = false;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`❌ Error fetching tickets at startAt ${startAt}:`, error.message);
            hasMore = false;
        }
    }

    console.log(`\n✅ Fetched ${allTickets.length} total tickets\n`);
    return allTickets;
}

function analyzeTickets(tickets) {
    const analysis = {
        total: tickets.length,
        byStatus: {},
        byType: {},
        byPriority: {},
        epics: [],
        stories: [],
        tasks: [],
        subtasks: [],
        movedTickets: [],
        closedOldTickets: [],
        recentlyUpdated: [],
        unassigned: [],
        withStoryPoints: 0,
        totalStoryPoints: 0
    };

    tickets.forEach(ticket => {
        // By Status
        analysis.byStatus[ticket.status] = (analysis.byStatus[ticket.status] || 0) + 1;

        // By Type
        analysis.byType[ticket.issueType] = (analysis.byType[ticket.issueType] || 0) + 1;

        // By Priority
        analysis.byPriority[ticket.priority] = (analysis.byPriority[ticket.priority] || 0) + 1;

        // Categorize by type
        if (ticket.issueType === 'Epic') {
            analysis.epics.push(ticket);
        } else if (ticket.issueType === 'Story') {
            analysis.stories.push(ticket);
        } else if (ticket.issueType === 'Task') {
            analysis.tasks.push(ticket);
        } else if (ticket.issueType === 'Sub-task') {
            analysis.subtasks.push(ticket);
        }

        // Special categories
        if (ticket.labels.includes('moved-ticket')) {
            analysis.movedTickets.push(ticket);
        }

        // Old closed tickets (99-105)
        const ticketNum = parseInt(ticket.key.split('-')[1]);
        if (ticketNum >= 99 && ticketNum <= 105 && ticket.status === 'Done') {
            analysis.closedOldTickets.push(ticket);
        }

        // Unassigned
        if (ticket.assignee === 'Unassigned') {
            analysis.unassigned.push(ticket);
        }

        // Story points
        if (ticket.storyPoints > 0) {
            analysis.withStoryPoints++;
            analysis.totalStoryPoints += ticket.storyPoints;
        }

        // Recently updated (last 7 days)
        if (ticket.updated) {
            const updatedDate = new Date(ticket.updated);
            const daysSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate <= 7) {
                analysis.recentlyUpdated.push(ticket);
            }
        }
    });

    return analysis;
}

function generateReport(tickets, analysis) {
    const lines = [];

    lines.push('# AV11 Project - Complete Ticket Review');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Total Tickets:** ${analysis.total}`);
    lines.push('');

    // Executive Summary
    lines.push('## 📊 Executive Summary');
    lines.push('');
    lines.push(`- **Total Tickets:** ${analysis.total}`);
    lines.push(`- **Epics:** ${analysis.epics.length}`);
    lines.push(`- **Stories:** ${analysis.stories.length}`);
    lines.push(`- **Tasks:** ${analysis.tasks.length}`);
    lines.push(`- **Sub-tasks:** ${analysis.subtasks.length}`);
    lines.push(`- **Story Points:** ${analysis.totalStoryPoints} (across ${analysis.withStoryPoints} tickets)`);
    lines.push('');

    // Status Breakdown
    lines.push('## 📈 Status Distribution');
    lines.push('');
    Object.entries(analysis.byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
        const percentage = ((count / analysis.total) * 100).toFixed(1);
        lines.push(`- **${status}:** ${count} tickets (${percentage}%)`);
    });
    lines.push('');

    // Priority Breakdown
    lines.push('## 🎯 Priority Distribution');
    lines.push('');
    Object.entries(analysis.byPriority).sort((a, b) => b[1] - a[1]).forEach(([priority, count]) => {
        const percentage = ((count / analysis.total) * 100).toFixed(1);
        lines.push(`- **${priority}:** ${count} tickets (${percentage}%)`);
    });
    lines.push('');

    // Epics Overview
    lines.push('## 📗 Epics Overview');
    lines.push('');
    if (analysis.epics.length > 0) {
        analysis.epics.slice(0, 20).forEach(epic => {
            const statusIcon = epic.status === 'Done' ? '✅' : epic.status === 'In Progress' ? '🚧' : '📋';
            lines.push(`### ${statusIcon} ${epic.key}: ${epic.summary}`);
            lines.push(`- **Status:** ${epic.status}`);
            if (epic.storyPoints > 0) {
                lines.push(`- **Story Points:** ${epic.storyPoints}`);
            }
            lines.push('');
        });

        if (analysis.epics.length > 20) {
            lines.push(`*... and ${analysis.epics.length - 20} more epics*`);
            lines.push('');
        }
    } else {
        lines.push('*No epics found*');
        lines.push('');
    }

    // Recently Updated
    lines.push('## 🔄 Recently Updated (Last 7 Days)');
    lines.push('');
    if (analysis.recentlyUpdated.length > 0) {
        analysis.recentlyUpdated.slice(0, 15).forEach(ticket => {
            const statusIcon = ticket.status === 'Done' ? '✅' : ticket.status === 'In Progress' ? '🚧' : '📋';
            const updatedDate = new Date(ticket.updated).toLocaleDateString();
            lines.push(`- ${statusIcon} **${ticket.key}**: ${ticket.summary} (${updatedDate})`);
        });
        if (analysis.recentlyUpdated.length > 15) {
            lines.push(`- *... and ${analysis.recentlyUpdated.length - 15} more*`);
        }
    } else {
        lines.push('*No tickets updated in the last 7 days*');
    }
    lines.push('');

    // Moved Tickets
    if (analysis.movedTickets.length > 0) {
        lines.push('## 🔀 Moved Tickets');
        lines.push('');
        analysis.movedTickets.forEach(ticket => {
            lines.push(`- **${ticket.key}**: ${ticket.summary} (Status: ${ticket.status})`);
        });
        lines.push('');
    }

    // Closed Old Tickets
    if (analysis.closedOldTickets.length > 0) {
        lines.push('## 🗄️ Archived Tickets (AV11-99 to AV11-105)');
        lines.push('');
        analysis.closedOldTickets.forEach(ticket => {
            lines.push(`- ✅ **${ticket.key}**: ${ticket.summary} (Closed)`);
        });
        lines.push('');
    }

    // Unassigned Tickets
    lines.push('## 👤 Unassigned Tickets');
    lines.push('');
    if (analysis.unassigned.length > 0) {
        lines.push(`**Total Unassigned:** ${analysis.unassigned.length}`);
        lines.push('');
        analysis.unassigned.slice(0, 20).forEach(ticket => {
            const statusIcon = ticket.status === 'Done' ? '✅' : ticket.status === 'In Progress' ? '🚧' : '📋';
            lines.push(`- ${statusIcon} **${ticket.key}**: ${ticket.summary} (${ticket.status})`);
        });
        if (analysis.unassigned.length > 20) {
            lines.push(`- *... and ${analysis.unassigned.length - 20} more*`);
        }
    } else {
        lines.push('*All tickets are assigned*');
    }
    lines.push('');

    // All Tickets List
    lines.push('## 📋 Complete Ticket List');
    lines.push('');
    lines.push('| Ticket | Type | Status | Priority | Summary | Story Points |');
    lines.push('|--------|------|--------|----------|---------|--------------|');

    tickets.forEach(ticket => {
        const statusIcon = ticket.status === 'Done' ? '✅' : ticket.status === 'In Progress' ? '🚧' : '📋';
        const typeIcon = ticket.issueType === 'Epic' ? '📗' : ticket.issueType === 'Story' ? '📘' : ticket.issueType === 'Task' ? '📙' : '📕';
        const points = ticket.storyPoints > 0 ? ticket.storyPoints : '-';
        const summary = ticket.summary.length > 60 ? ticket.summary.substring(0, 57) + '...' : ticket.summary;
        lines.push(`| ${ticket.key} | ${typeIcon} ${ticket.issueType} | ${statusIcon} ${ticket.status} | ${ticket.priority} | ${summary} | ${points} |`);
    });
    lines.push('');

    // Statistics
    lines.push('---');
    lines.push('');
    lines.push('## 📊 Detailed Statistics');
    lines.push('');
    lines.push('### By Issue Type');
    Object.entries(analysis.byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        lines.push(`- ${type}: ${count}`);
    });
    lines.push('');

    lines.push('### By Status');
    Object.entries(analysis.byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
        lines.push(`- ${status}: ${count}`);
    });
    lines.push('');

    lines.push('### Key Metrics');
    lines.push(`- Total Story Points: ${analysis.totalStoryPoints}`);
    lines.push(`- Average Points per Ticket: ${(analysis.totalStoryPoints / analysis.withStoryPoints).toFixed(2)}`);
    lines.push(`- Completion Rate: ${((analysis.byStatus['Done'] || 0) / analysis.total * 100).toFixed(1)}%`);
    lines.push(`- Unassigned Tickets: ${analysis.unassigned.length}`);
    lines.push('');

    return lines.join('\n');
}

async function main() {
    console.log('================================================');
    console.log('  AV11 Project - Complete Ticket Review');
    console.log('  Reviewing all tickets from AV11-001');
    console.log('================================================\n');

    try {
        // Test connection
        console.log('🔗 Testing JIRA connection...');
        await makeJiraRequest('GET', '/myself');
        console.log('✅ Connected to JIRA successfully!\n');

        // Fetch all tickets
        const tickets = await fetchAllTickets();

        if (tickets.length === 0) {
            console.log('❌ No tickets found');
            return;
        }

        // Analyze tickets
        console.log('📊 Analyzing tickets...\n');
        const analysis = analyzeTickets(tickets);

        // Generate report
        console.log('📝 Generating report...\n');
        const report = generateReport(tickets, analysis);

        // Save report
        const reportPath = 'AV11-COMPLETE-TICKET-REVIEW.md';
        fs.writeFileSync(reportPath, report);
        console.log(`✅ Report saved to: ${reportPath}`);

        // Save JSON data
        const jsonPath = 'av11-tickets-data.json';
        fs.writeFileSync(jsonPath, JSON.stringify({ tickets, analysis }, null, 2));
        console.log(`✅ Data saved to: ${jsonPath}`);

        // Print summary
        console.log('\n📊 REVIEW SUMMARY:\n');
        console.log(`Total Tickets: ${analysis.total}`);
        console.log(`Epics: ${analysis.epics.length}`);
        console.log(`Tasks: ${analysis.tasks.length}`);
        console.log(`Stories: ${analysis.stories.length}`);
        console.log(`Sub-tasks: ${analysis.subtasks.length}`);
        console.log('');
        console.log('Status Distribution:');
        Object.entries(analysis.byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
            const percentage = ((count / analysis.total) * 100).toFixed(1);
            console.log(`  ${status}: ${count} (${percentage}%)`);
        });
        console.log('');
        console.log(`Story Points: ${analysis.totalStoryPoints} (${analysis.withStoryPoints} tickets)`);
        console.log(`Unassigned: ${analysis.unassigned.length}`);
        console.log(`Recently Updated: ${analysis.recentlyUpdated.length}`);
        console.log('');

        console.log('✅ Review complete!');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
