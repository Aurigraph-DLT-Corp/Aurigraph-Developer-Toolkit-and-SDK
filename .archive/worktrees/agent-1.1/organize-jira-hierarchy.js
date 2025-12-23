#!/usr/bin/env node

/**
 * JIRA Ticket Hierarchy Organizer
 * Fetches all AV11 tickets and organizes them by Epic > Story > Task > Sub-task
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
    console.log('\n🔍 Fetching all AV11 tickets with hierarchy information...\n');

    const fields = 'summary,status,issuetype,created,updated,description,assignee,priority,labels,parent,customfield_10014,customfield_10016';
    const jql = encodeURIComponent(`project = ${PROJECT_KEY} ORDER BY key ASC`);

    let allTickets = [];
    let startAt = 0;
    const maxResults = 100;
    let hasMore = true;

    while (hasMore && startAt < 500) { // Safety limit
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
                parent: issue.fields?.parent?.key || null,
                epicLink: issue.fields?.customfield_10014 || null,
                storyPoints: issue.fields?.customfield_10016 || 0,
                priority: issue.fields?.priority?.name || 'None'
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

function organizeHierarchy(tickets) {
    console.log('📊 Organizing tickets by hierarchy...\n');

    // Categorize by issue type
    const epics = tickets.filter(t => t.issueType === 'Epic');
    const stories = tickets.filter(t => t.issueType === 'Story');
    const tasks = tickets.filter(t => t.issueType === 'Task');
    const subtasks = tickets.filter(t => t.issueType === 'Sub-task');

    console.log(`Found:
  📗 ${epics.length} Epics
  📘 ${stories.length} Stories
  📙 ${tasks.length} Tasks
  📕 ${subtasks.length} Sub-tasks
  📊 ${tickets.length} Total tickets\n`);

    // Build hierarchy
    const hierarchy = [];

    epics.forEach(epic => {
        const epicNode = {
            key: epic.key,
            summary: epic.summary,
            type: 'Epic',
            status: epic.status,
            storyPoints: epic.storyPoints,
            children: []
        };

        // Find stories linked to this epic
        const epicStories = stories.filter(s => s.epicLink === epic.key || s.parent === epic.key);

        epicStories.forEach(story => {
            const storyNode = {
                key: story.key,
                summary: story.summary,
                type: 'Story',
                status: story.status,
                storyPoints: story.storyPoints,
                children: []
            };

            // Find tasks under this story
            const storyTasks = tasks.filter(t => t.parent === story.key);
            storyTasks.forEach(task => {
                const taskNode = {
                    key: task.key,
                    summary: task.summary,
                    type: 'Task',
                    status: task.status,
                    storyPoints: task.storyPoints,
                    children: []
                };

                // Find subtasks under this task
                const taskSubtasks = subtasks.filter(st => st.parent === task.key);
                taskSubtasks.forEach(subtask => {
                    taskNode.children.push({
                        key: subtask.key,
                        summary: subtask.summary,
                        type: 'Sub-task',
                        status: subtask.status,
                        storyPoints: subtask.storyPoints
                    });
                });

                storyNode.children.push(taskNode);
            });

            // Also check for subtasks directly under story
            const storySubtasks = subtasks.filter(st => st.parent === story.key);
            storySubtasks.forEach(subtask => {
                storyNode.children.push({
                    key: subtask.key,
                    summary: subtask.summary,
                    type: 'Sub-task',
                    status: subtask.status,
                    storyPoints: subtask.storyPoints
                });
            });

            epicNode.children.push(storyNode);
        });

        // Find tasks directly under epic (no story parent)
        const epicTasks = tasks.filter(t => (t.epicLink === epic.key || t.parent === epic.key) && !epicStories.some(s => s.key === t.parent));
        epicTasks.forEach(task => {
            const taskNode = {
                key: task.key,
                summary: task.summary,
                type: 'Task',
                status: task.status,
                storyPoints: task.storyPoints,
                children: []
            };

            // Find subtasks under this task
            const taskSubtasks = subtasks.filter(st => st.parent === task.key);
            taskSubtasks.forEach(subtask => {
                taskNode.children.push({
                    key: subtask.key,
                    summary: subtask.summary,
                    type: 'Sub-task',
                    status: subtask.status,
                    storyPoints: subtask.storyPoints
                });
            });

            epicNode.children.push(taskNode);
        });

        hierarchy.push(epicNode);
    });

    // Add orphan stories (not linked to any epic)
    const orphanStories = stories.filter(s => !s.epicLink && !s.parent);
    orphanStories.forEach(story => {
        const storyNode = {
            key: story.key,
            summary: story.summary,
            type: 'Story (Orphan)',
            status: story.status,
            storyPoints: story.storyPoints,
            children: []
        };

        const storyTasks = tasks.filter(t => t.parent === story.key);
        storyTasks.forEach(task => {
            const taskNode = {
                key: task.key,
                summary: task.summary,
                type: 'Task',
                status: task.status,
                storyPoints: task.storyPoints,
                children: subtasks.filter(st => st.parent === task.key).map(st => ({
                    key: st.key,
                    summary: st.summary,
                    type: 'Sub-task',
                    status: st.status,
                    storyPoints: st.storyPoints
                }))
            };
            storyNode.children.push(taskNode);
        });

        hierarchy.push(storyNode);
    });

    // Add orphan tasks (not linked to any epic or story)
    const orphanTasks = tasks.filter(t => !t.epicLink && !t.parent);
    orphanTasks.forEach(task => {
        const taskNode = {
            key: task.key,
            summary: task.summary,
            type: 'Task (Orphan)',
            status: task.status,
            storyPoints: task.storyPoints,
            children: subtasks.filter(st => st.parent === task.key).map(st => ({
                key: st.key,
                summary: st.summary,
                type: 'Sub-task',
                status: st.status,
                storyPoints: st.storyPoints
            }))
        };
        hierarchy.push(taskNode);
    });

    return hierarchy;
}

function printHierarchy(hierarchy, indent = 0) {
    const output = [];

    hierarchy.forEach((node, index) => {
        const prefix = '  '.repeat(indent);
        const icon = node.type === 'Epic' ? '📗' :
                     node.type === 'Story' || node.type === 'Story (Orphan)' ? '📘' :
                     node.type === 'Task' || node.type === 'Task (Orphan)' ? '📙' : '📕';

        const statusIcon = node.status === 'Done' ? '✅' :
                          node.status === 'In Progress' ? '🚧' : '📋';

        const points = node.storyPoints > 0 ? ` [${node.storyPoints} pts]` : '';

        const line = `${prefix}${icon} ${node.key}: ${node.summary} ${statusIcon} ${points}`;
        output.push(line);
        console.log(line);

        if (node.children && node.children.length > 0) {
            const childOutput = printHierarchy(node.children, indent + 1);
            output.push(...childOutput);
        }
    });

    return output;
}

function generateMarkdownReport(hierarchy) {
    const lines = [];

    lines.push('# AV11 Project Hierarchy');
    lines.push('');
    lines.push('**Generated:** ' + new Date().toISOString());
    lines.push('');
    lines.push('## Ticket Hierarchy');
    lines.push('');

    function processNode(node, level = 0) {
        const indent = '  '.repeat(level);
        const statusIcon = node.status === 'Done' ? '✅' :
                          node.status === 'In Progress' ? '🚧' : '📋';
        const points = node.storyPoints > 0 ? ` *[${node.storyPoints} pts]*` : '';

        lines.push(`${indent}- **${node.key}**: ${node.summary} ${statusIcon}${points}`);
        lines.push(`${indent}  - Type: ${node.type}`);
        lines.push(`${indent}  - Status: ${node.status}`);

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => processNode(child, level + 1));
        }
    }

    hierarchy.forEach(node => processNode(node));

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('### Legend');
    lines.push('- 📗 Epic');
    lines.push('- 📘 Story');
    lines.push('- 📙 Task');
    lines.push('- 📕 Sub-task');
    lines.push('- ✅ Done');
    lines.push('- 🚧 In Progress');
    lines.push('- 📋 To Do');

    return lines.join('\n');
}

async function main() {
    console.log('================================================');
    console.log('  JIRA Ticket Hierarchy Organizer - AV11 Project');
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

        // Organize hierarchy
        const hierarchy = organizeHierarchy(tickets);

        // Print hierarchy
        console.log('\n📋 TICKET HIERARCHY:\n');
        console.log('='.repeat(80));
        const output = printHierarchy(hierarchy);
        console.log('='.repeat(80));

        // Generate markdown report
        const markdown = generateMarkdownReport(hierarchy);
        const reportPath = 'JIRA_HIERARCHY_REPORT.md';
        fs.writeFileSync(reportPath, markdown);
        console.log(`\n✅ Markdown report saved to: ${reportPath}`);

        // Save JSON structure
        const jsonPath = 'jira-hierarchy.json';
        fs.writeFileSync(jsonPath, JSON.stringify(hierarchy, null, 2));
        console.log(`✅ JSON structure saved to: ${jsonPath}`);

        // Print summary statistics
        console.log('\n📊 SUMMARY STATISTICS:\n');

        let epicCount = 0, storyCount = 0, taskCount = 0, subtaskCount = 0;
        let doneCount = 0, inProgressCount = 0, todoCount = 0;
        let totalPoints = 0;

        function countNodes(nodes) {
            nodes.forEach(node => {
                if (node.type === 'Epic') epicCount++;
                else if (node.type.includes('Story')) storyCount++;
                else if (node.type.includes('Task')) taskCount++;
                else if (node.type === 'Sub-task') subtaskCount++;

                if (node.status === 'Done') doneCount++;
                else if (node.status === 'In Progress') inProgressCount++;
                else todoCount++;

                totalPoints += node.storyPoints || 0;

                if (node.children) countNodes(node.children);
            });
        }

        countNodes(hierarchy);

        console.log(`📗 Epics: ${epicCount}`);
        console.log(`📘 Stories: ${storyCount}`);
        console.log(`📙 Tasks: ${taskCount}`);
        console.log(`📕 Sub-tasks: ${subtaskCount}`);
        console.log(`📊 Total: ${epicCount + storyCount + taskCount + subtaskCount}`);
        console.log('');
        console.log(`✅ Done: ${doneCount}`);
        console.log(`🚧 In Progress: ${inProgressCount}`);
        console.log(`📋 To Do: ${todoCount}`);
        console.log('');
        console.log(`🎯 Total Story Points: ${totalPoints}`);
        console.log('');

        console.log('✅ Hierarchy organization complete!');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
