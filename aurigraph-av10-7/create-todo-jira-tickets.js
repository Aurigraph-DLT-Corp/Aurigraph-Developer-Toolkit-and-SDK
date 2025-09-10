#!/usr/bin/env node

/**
 * Create JIRA tickets for remaining TODO items
 * Updates existing tickets and creates new ones as needed
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.jira' });

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_URL = `${JIRA_BASE_URL}/rest/api/3`;
const PROJECT_KEY = 'AV11';

const config = {
    headers: {
        'Authorization': `Basic ${Buffer.from(
            `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
        ).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};

/**
 * TODO items with their current status
 */
const todoItems = [
    {
        key: 'AV11-5002',
        summary: 'Fix Alpaca API Authentication',
        status: 'DONE',
        resolution: 'Fixed',
        completedDate: new Date().toISOString(),
        notes: 'Created fix-alpaca-auth.ts module with multiple authentication methods and demo mode fallback'
    },
    {
        key: 'AV11-5003',
        summary: 'Implement Real Quantum Signatures',
        status: 'IN_PROGRESS',
        percentComplete: 80,
        notes: 'CRYSTALS-Dilithium interface implemented, awaiting actual library integration',
        subtasks: [
            { summary: 'Create quantum signature interface', status: 'DONE' },
            { summary: 'Implement key generation and rotation', status: 'DONE' },
            { summary: 'Add performance benchmarks', status: 'DONE' },
            { summary: 'Install actual CRYSTALS-Dilithium library', status: 'TODO' },
            { summary: 'Update all mock implementations', status: 'TODO' }
        ]
    },
    {
        key: 'AV11-5004',
        summary: 'Complete gRPC Service Implementation',
        status: 'TODO',
        percentComplete: 20,
        epicLink: 'Network Infrastructure',
        components: ['Network', 'gRPC'],
        storyPoints: 8,
        dueDate: '2025-01-31',
        acceptanceCriteria: [
            'All services migrated to gRPC',
            'Protocol Buffers defined for all messages',
            'Performance targets met (2M+ TPS)',
            'HTTP/2 transport layer configured',
            'TLS 1.3 encryption enabled'
        ]
    },
    {
        key: 'AV11-5005',
        summary: 'Migrate Test Suite to Java',
        status: 'TODO',
        percentComplete: 15,
        epicLink: 'Testing',
        components: ['Testing', 'Quality'],
        storyPoints: 13,
        dueDate: '2025-02-28',
        acceptanceCriteria: [
            '95% code coverage achieved',
            'All TypeScript tests ported to JUnit',
            'Performance tests migrated',
            'Integration tests complete',
            'CI/CD pipeline updated'
        ]
    },
    {
        key: 'AV11-5001',
        summary: 'Achieve 2M+ TPS Performance Target',
        status: 'IN_PROGRESS',
        percentComplete: 38,
        currentPerformance: '776K TPS',
        targetPerformance: '2M+ TPS',
        epicLink: 'Performance Optimization',
        components: ['Performance', 'Core'],
        storyPoints: 13,
        dueDate: '2025-02-28',
        subtasks: [
            { summary: 'Implement lock-free data structures', status: 'DONE' },
            { summary: 'Add ring buffer for transactions', status: 'DONE' },
            { summary: 'Optimize batch processing', status: 'IN_PROGRESS' },
            { summary: 'Enable SIMD vectorization', status: 'TODO' },
            { summary: 'Implement io_uring for networking', status: 'TODO' },
            { summary: 'Add NUMA-aware memory allocation', status: 'TODO' }
        ]
    }
];

/**
 * Additional new tickets to create
 */
const newTickets = [
    {
        summary: 'Integrate Real CRYSTALS-Dilithium Library',
        description: 'Replace simulated quantum signatures with actual NIST-approved CRYSTALS-Dilithium implementation',
        issueType: 'Task',
        priority: 'High',
        epicLink: 'Quantum Security',
        components: ['Security', 'Cryptography'],
        storyPoints: 5,
        dueDate: '2025-02-01',
        acceptanceCriteria: [
            'Official CRYSTALS-Dilithium library integrated',
            'Hardware acceleration enabled where available',
            'NIST Level 5 compliance validated',
            'Performance benchmarks pass (50K+ signatures/sec)'
        ],
        labels: ['quantum', 'security', 'nist', 'crystals-dilithium']
    },
    {
        summary: 'Implement gRPC Transaction Service',
        description: 'Create high-performance gRPC service for transaction processing',
        issueType: 'Story',
        priority: 'Critical',
        epicLink: 'Network Infrastructure',
        components: ['Network', 'gRPC', 'Performance'],
        storyPoints: 8,
        dueDate: '2025-01-20',
        acceptanceCriteria: [
            'Transaction service exposed via gRPC',
            'Protocol Buffers for all transaction types',
            'Streaming support for batch operations',
            'Load balancing configured',
            'Benchmarks show 2M+ TPS capability'
        ],
        labels: ['grpc', 'performance', 'protocol-buffers', 'http2']
    },
    {
        summary: 'Port Consensus Tests to Java',
        description: 'Migrate HyperRAFT++ consensus tests from TypeScript to Java/JUnit',
        issueType: 'Task',
        priority: 'High',
        epicLink: 'Testing',
        components: ['Testing', 'Consensus'],
        storyPoints: 5,
        dueDate: '2025-02-10',
        acceptanceCriteria: [
            'All consensus unit tests ported',
            'Integration tests for multi-node scenarios',
            'Performance regression tests',
            'Fault tolerance tests',
            '95% code coverage maintained'
        ],
        labels: ['testing', 'migration', 'consensus', 'junit']
    },
    {
        summary: 'Optimize JVM for 2M+ TPS',
        description: 'Fine-tune JVM and GraalVM settings for maximum performance',
        issueType: 'Task',
        priority: 'Critical',
        epicLink: 'Performance Optimization',
        components: ['Performance', 'Infrastructure'],
        storyPoints: 8,
        dueDate: '2025-02-05',
        acceptanceCriteria: [
            'GC tuning completed (G1GC or ZGC)',
            'Virtual threads optimized',
            'NUMA binding configured',
            'JIT compilation optimized',
            'Native image performance validated'
        ],
        labels: ['performance', 'jvm', 'graalvm', 'optimization']
    },
    {
        summary: 'Create V11 Performance Dashboard',
        description: 'Build real-time monitoring dashboard for V11 performance metrics',
        issueType: 'Story',
        priority: 'Medium',
        epicLink: 'Monitoring',
        components: ['Monitoring', 'UI'],
        storyPoints: 8,
        dueDate: '2025-02-20',
        acceptanceCriteria: [
            'Real-time TPS monitoring',
            'Latency percentiles (p50, p95, p99)',
            'Resource utilization graphs',
            'Alert configuration',
            'Historical data analysis'
        ],
        labels: ['monitoring', 'dashboard', 'metrics', 'performance']
    }
];

/**
 * Update existing JIRA ticket
 */
async function updateTicket(ticket) {
    try {
        console.log(`📝 Updating ${ticket.key}: ${ticket.summary}`);
        
        // Update ticket status
        if (ticket.status === 'DONE') {
            // Transition to Done
            const transitionUrl = `${JIRA_API_URL}/issue/${ticket.key}/transitions`;
            
            // Get available transitions
            const transitionsResponse = await axios.get(transitionUrl, config);
            const doneTransition = transitionsResponse.data.transitions.find(
                t => t.name.toLowerCase() === 'done' || t.to.name.toLowerCase() === 'done'
            );
            
            if (doneTransition) {
                await axios.post(transitionUrl, {
                    transition: { id: doneTransition.id }
                }, config);
                
                console.log(`   ✅ Marked as DONE`);
            }
            
            // Add resolution comment
            await axios.post(`${JIRA_API_URL}/issue/${ticket.key}/comment`, {
                body: {
                    type: 'doc',
                    version: 1,
                    content: [{
                        type: 'paragraph',
                        content: [{
                            type: 'text',
                            text: `✅ Completed: ${ticket.notes}`
                        }]
                    }]
                }
            }, config);
        }
        
        // Update progress
        if (ticket.percentComplete) {
            await axios.put(`${JIRA_API_URL}/issue/${ticket.key}`, {
                fields: {
                    customfield_10026: ticket.percentComplete // Progress field
                }
            }, config);
            
            console.log(`   📊 Progress: ${ticket.percentComplete}%`);
        }
        
        // Create subtasks if needed
        if (ticket.subtasks) {
            for (const subtask of ticket.subtasks) {
                if (subtask.status === 'TODO') {
                    const subtaskData = {
                        fields: {
                            project: { key: PROJECT_KEY },
                            parent: { key: ticket.key },
                            summary: subtask.summary,
                            issuetype: { name: 'Sub-task' },
                            description: {
                                type: 'doc',
                                version: 1,
                                content: [{
                                    type: 'paragraph',
                                    content: [{
                                        type: 'text',
                                        text: subtask.summary
                                    }]
                                }]
                            }
                        }
                    };
                    
                    const response = await axios.post(`${JIRA_API_URL}/issue`, subtaskData, config);
                    console.log(`   ➕ Created subtask: ${subtask.summary}`);
                }
            }
        }
        
        return { success: true, key: ticket.key };
        
    } catch (error) {
        console.error(`   ❌ Error updating ${ticket.key}:`, error.response?.data || error.message);
        return { success: false, key: ticket.key, error: error.message };
    }
}

/**
 * Create new JIRA ticket
 */
async function createTicket(ticket) {
    try {
        console.log(`🆕 Creating ticket: ${ticket.summary}`);
        
        const ticketData = {
            fields: {
                project: { key: PROJECT_KEY },
                summary: ticket.summary,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [{
                        type: 'paragraph',
                        content: [{
                            type: 'text',
                            text: ticket.description
                        }]
                    }]
                },
                issuetype: { name: ticket.issueType },
                priority: { name: ticket.priority },
                labels: ticket.labels,
                duedate: ticket.dueDate
            }
        };
        
        // Add story points if present
        if (ticket.storyPoints) {
            ticketData.fields.customfield_10016 = ticket.storyPoints;
        }
        
        // Add components
        if (ticket.components) {
            ticketData.fields.components = ticket.components.map(c => ({ name: c }));
        }
        
        // Add acceptance criteria
        if (ticket.acceptanceCriteria) {
            ticketData.fields.customfield_10035 = {
                type: 'doc',
                version: 1,
                content: [{
                    type: 'bulletList',
                    content: ticket.acceptanceCriteria.map(criteria => ({
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: [{
                                type: 'text',
                                text: criteria
                            }]
                        }]
                    }))
                }]
            };
        }
        
        const response = await axios.post(`${JIRA_API_URL}/issue`, ticketData, config);
        console.log(`   ✅ Created: ${response.data.key}`);
        
        return { success: true, key: response.data.key };
        
    } catch (error) {
        console.error(`   ❌ Error creating ticket:`, error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🎫 Creating/Updating JIRA Tickets for TODO Items\n');
    console.log('=' .repeat(50));
    
    const results = {
        updated: [],
        created: [],
        failed: []
    };
    
    // Update existing tickets
    console.log('\n📋 Updating Existing Tickets:\n');
    for (const ticket of todoItems) {
        const result = await updateTicket(ticket);
        if (result.success) {
            results.updated.push(result.key);
        } else {
            results.failed.push(result);
        }
    }
    
    // Create new tickets
    console.log('\n🆕 Creating New Tickets:\n');
    for (const ticket of newTickets) {
        const result = await createTicket(ticket);
        if (result.success) {
            results.created.push(result.key);
        } else {
            results.failed.push(ticket.summary);
        }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Summary:\n');
    console.log(`✅ Updated: ${results.updated.length} tickets`);
    results.updated.forEach(key => console.log(`   - ${key}`));
    
    console.log(`\n🆕 Created: ${results.created.length} tickets`);
    results.created.forEach(key => console.log(`   - ${key}`));
    
    if (results.failed.length > 0) {
        console.log(`\n❌ Failed: ${results.failed.length} operations`);
        results.failed.forEach(f => console.log(`   - ${f.key || f}`));
    }
    
    console.log('\n🔗 View JIRA Board:');
    console.log(`   ${JIRA_BASE_URL}/jira/software/projects/${PROJECT_KEY}/boards/789`);
}

// Run the script
main().catch(console.error);