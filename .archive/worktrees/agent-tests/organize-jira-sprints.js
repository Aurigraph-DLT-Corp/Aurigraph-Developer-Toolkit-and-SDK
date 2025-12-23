#!/usr/bin/env node

/**
 * JIRA Sprint Organization Script
 * Organizes all tickets into epics and assigns them to sprints
 */

const https = require('https');

// JIRA Configuration
const JIRA_BASE_URL = 'aurigraphdlt.atlassian.net';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
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
                    console.error(`Error: ${res.statusCode}`);
                    reject(new Error(`Request failed with status ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Epic Structure and Sprint Assignment
const epicStructure = [
    {
        name: "[EPIC] Foundation & Architecture",
        description: "Core platform setup, architecture design, and technology stack selection",
        sprint: "Sprint 1 - Foundation",
        status: "Done",
        tickets: [
            "Project Kickoff",
            "Setup Java/Quarkus",
            "Design System Architecture",
            "Configure GraalVM",
            "REST API Framework",
            "Virtual Threads Integration"
        ]
    },
    {
        name: "[EPIC] Core Services Implementation",
        description: "Implementation of core blockchain services and transaction processing",
        sprint: "Sprint 2 - Core Services",
        status: "Done",
        tickets: [
            "Core Transaction Processing",
            "Native Compilation Pipeline",
            "AI/ML Optimization Framework",
            "HMS Healthcare Integration"
        ]
    },
    {
        name: "[EPIC] Consensus & Performance",
        description: "HyperRAFT++ consensus implementation and performance optimization",
        sprint: "Sprint 3 - Consensus",
        status: "In Progress",
        tickets: [
            "HyperRAFT++ Consensus Migration",
            "Performance Optimization to 2M+ TPS",
            "JMeter Load Testing",
            "Memory Optimization",
            "gRPC Service Implementation"
        ]
    },
    {
        name: "[EPIC] Security & Cryptography",
        description: "Quantum-resistant cryptography and security implementation",
        sprint: "Sprint 4 - Security",
        status: "To Do",
        tickets: [
            "Quantum-Resistant Cryptography",
            "SPHINCS+ Hash-Based Signatures",
            "HSM Integration",
            "Security Penetration Testing"
        ]
    },
    {
        name: "[EPIC] Cross-Chain Integration",
        description: "Universal cross-chain bridge and blockchain integrations",
        sprint: "Sprint 5 - Integration",
        status: "To Do",
        tickets: [
            "Cross-Chain Bridge Service",
            "Ethereum Integration Adapter",
            "Solana Integration Adapter"
        ]
    },
    {
        name: "[EPIC] Testing & Quality Assurance",
        description: "Comprehensive testing suite and quality assurance",
        sprint: "Sprint 6 - Testing",
        status: "In Progress",
        tickets: [
            "Unit Test Suite Migration",
            "Integration Testing with TestContainers",
            "Performance Benchmarking Suite"
        ]
    },
    {
        name: "[EPIC] DevOps & Infrastructure",
        description: "CI/CD pipeline, deployment, and infrastructure setup",
        sprint: "Sprint 7 - DevOps",
        status: "To Do",
        tickets: [
            "Kubernetes Deployment Configuration",
            "Prometheus & Grafana Monitoring",
            "CI/CD Pipeline with GitHub Actions",
            "Disaster Recovery Planning"
        ]
    },
    {
        name: "[EPIC] Production Deployment",
        description: "Production environment setup and deployment",
        sprint: "Sprint 8 - Production",
        status: "To Do",
        tickets: [
            "Production Deployment to AWS",
            "SLA & Performance Guarantees",
            "Production Load Testing"
        ]
    },
    {
        name: "[EPIC] Documentation & Knowledge Transfer",
        description: "Technical documentation and knowledge transfer",
        sprint: "Sprint 9 - Documentation",
        status: "In Progress",
        tickets: [
            "Technical Documentation",
            "Developer Onboarding Guide",
            "Performance Tuning Guide",
            "User Documentation"
        ]
    },
    {
        name: "[EPIC] Demo & Visualization Platform",
        description: "Interactive demo platform with real-time visualization",
        sprint: "Sprint 3 - Current",
        status: "In Progress",
        tickets: [
            "Demo: Create Interactive Web UI",
            "Demo: Build FastAPI Backend",
            "Demo: Implement Vizro Dashboard",
            "Demo: WebSocket Real-time Streaming",
            "Demo: Transaction Generation Engine",
            "Demo: Performance Metrics Collection",
            "Demo: Deploy to Production",
            "Demo: Performance Benchmarking"
        ]
    }
];

// Sprint definitions
const sprints = [
    {
        name: "Sprint 1 - Foundation",
        goal: "Establish core architecture and development environment",
        startDate: "2024-01-01",
        endDate: "2024-01-14",
        status: "Completed"
    },
    {
        name: "Sprint 2 - Core Services",
        goal: "Implement core blockchain services and transaction processing",
        startDate: "2024-01-15",
        endDate: "2024-01-28",
        status: "Completed"
    },
    {
        name: "Sprint 3 - Consensus & Demo",
        goal: "Implement consensus mechanism and demo platform",
        startDate: "2024-01-29",
        endDate: "2024-02-11",
        status: "Active"
    },
    {
        name: "Sprint 4 - Security",
        goal: "Implement quantum-resistant cryptography",
        startDate: "2024-02-12",
        endDate: "2024-02-25",
        status: "Planned"
    },
    {
        name: "Sprint 5 - Integration",
        goal: "Build cross-chain bridges and integrations",
        startDate: "2024-02-26",
        endDate: "2024-03-10",
        status: "Planned"
    },
    {
        name: "Sprint 6 - Testing",
        goal: "Comprehensive testing and quality assurance",
        startDate: "2024-03-11",
        endDate: "2024-03-24",
        status: "Planned"
    },
    {
        name: "Sprint 7 - DevOps",
        goal: "Setup CI/CD and infrastructure",
        startDate: "2024-03-25",
        endDate: "2024-04-07",
        status: "Planned"
    },
    {
        name: "Sprint 8 - Production",
        goal: "Deploy to production environment",
        startDate: "2024-04-08",
        endDate: "2024-04-21",
        status: "Planned"
    },
    {
        name: "Sprint 9 - Documentation",
        goal: "Complete documentation and knowledge transfer",
        startDate: "2024-04-22",
        endDate: "2024-05-05",
        status: "Planned"
    }
];

async function getAllIssues() {
    try {
        const jql = `project = ${PROJECT_KEY}`;
        const response = await makeJiraRequest('GET', `/search?jql=${encodeURIComponent(jql)}&maxResults=1000`);
        return response.issues || [];
    } catch (error) {
        console.error('Failed to fetch issues:', error.message);
        return [];
    }
}

async function createEpics() {
    console.log('\n📚 Creating Epic Structure...\n');
    
    const epicKeys = {};
    
    for (const epic of epicStructure) {
        // Check if epic already exists
        const existingEpic = await findEpicByName(epic.name);
        
        if (existingEpic) {
            epicKeys[epic.name] = existingEpic.key;
            console.log(`✅ Found existing epic: ${existingEpic.key} - ${epic.name}`);
        } else {
            try {
                const data = {
                    fields: {
                        project: { key: PROJECT_KEY },
                        summary: epic.name,
                        description: {
                            type: "doc",
                            version: 1,
                            content: [{
                                type: "paragraph",
                                content: [{
                                    type: "text",
                                    text: epic.description
                                }]
                            }]
                        },
                        issuetype: { name: "Epic" }
                    }
                };
                
                const response = await makeJiraRequest('POST', '/issue', data);
                epicKeys[epic.name] = response.key;
                console.log(`✅ Created epic: ${response.key} - ${epic.name}`);
                
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`❌ Failed to create epic "${epic.name}": ${error.message}`);
            }
        }
    }
    
    return epicKeys;
}

async function findEpicByName(name) {
    const issues = await getAllIssues();
    return issues.find(issue => 
        issue.fields.summary === name && 
        issue.fields.issuetype.name === "Epic"
    );
}

async function organizeTicketsIntoEpics(epicKeys) {
    console.log('\n🔗 Organizing tickets into epics...\n');
    
    const issues = await getAllIssues();
    
    for (const epic of epicStructure) {
        const epicKey = epicKeys[epic.name];
        if (!epicKey) continue;
        
        console.log(`\n📁 Epic: ${epic.name} (${epicKey})`);
        
        for (const ticketPattern of epic.tickets) {
            const matchingIssues = issues.filter(issue => {
                const summary = issue.fields.summary.toLowerCase();
                const pattern = ticketPattern.toLowerCase();
                return summary.includes(pattern) && issue.fields.issuetype.name !== "Epic";
            });
            
            for (const issue of matchingIssues) {
                try {
                    // Add comment linking to epic
                    await makeJiraRequest('POST', `/issue/${issue.key}/comment`, {
                        body: {
                            type: "doc",
                            version: 1,
                            content: [{
                                type: "paragraph",
                                content: [
                                    { type: "text", text: "Organized into Epic: " },
                                    { type: "text", text: epicKey, marks: [{ type: "strong" }] },
                                    { type: "text", text: ` - ${epic.name}` },
                                    { type: "text", text: `\nSprint: ${epic.sprint}` },
                                    { type: "text", text: `\nStatus: ${epic.status}` }
                                ]
                            }]
                        }
                    });
                    
                    console.log(`  ✅ Linked ${issue.key}: ${issue.fields.summary}`);
                    
                    // Update labels
                    const labels = issue.fields.labels || [];
                    if (!labels.includes(epic.sprint.replace(/\s+/g, '-'))) {
                        labels.push(epic.sprint.replace(/\s+/g, '-'));
                        
                        await makeJiraRequest('PUT', `/issue/${issue.key}`, {
                            fields: {
                                labels: labels
                            }
                        });
                    }
                    
                } catch (error) {
                    console.error(`  ❌ Failed to link ${issue.key}: ${error.message}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }
}

async function createSprintReport() {
    console.log('\n📊 Creating Sprint Report...\n');
    
    const issues = await getAllIssues();
    const report = {};
    
    for (const sprint of sprints) {
        const sprintLabel = sprint.name.replace(/\s+/g, '-');
        const sprintIssues = issues.filter(issue => 
            issue.fields.labels && issue.fields.labels.includes(sprintLabel)
        );
        
        report[sprint.name] = {
            goal: sprint.goal,
            status: sprint.status,
            dates: `${sprint.startDate} to ${sprint.endDate}`,
            totalIssues: sprintIssues.length,
            completed: sprintIssues.filter(i => i.fields.status.name === "Done").length,
            inProgress: sprintIssues.filter(i => i.fields.status.name === "In Progress").length,
            todo: sprintIssues.filter(i => i.fields.status.name === "To Do").length
        };
    }
    
    console.log('Sprint Summary:');
    console.log('================');
    
    for (const [sprintName, data] of Object.entries(report)) {
        console.log(`\n${sprintName}`);
        console.log(`  Goal: ${data.goal}`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Dates: ${data.dates}`);
        console.log(`  Progress: ${data.completed}/${data.totalIssues} completed`);
        console.log(`  - Done: ${data.completed}`);
        console.log(`  - In Progress: ${data.inProgress}`);
        console.log(`  - To Do: ${data.todo}`);
    }
    
    return report;
}

async function createRoadmapSummary() {
    const summary = `
# Aurigraph DLT V11 - Sprint Roadmap

## 🎯 Project Overview
Building a high-performance blockchain platform with 2M+ TPS capability using Java/Quarkus/GraalVM

## 📅 Sprint Schedule

### ✅ Sprint 1 - Foundation (Jan 1-14, 2024) - COMPLETED
- Core architecture setup
- Java/Quarkus development environment
- GraalVM native compilation
- REST API framework

### ✅ Sprint 2 - Core Services (Jan 15-28, 2024) - COMPLETED
- Transaction processing service
- Native compilation pipeline
- AI/ML optimization framework
- HMS healthcare integration

### 🚧 Sprint 3 - Consensus & Demo (Jan 29 - Feb 11, 2024) - ACTIVE
- HyperRAFT++ consensus migration
- Performance optimization to 2M+ TPS
- Interactive demo platform
- Real-time visualization dashboard

### 📋 Sprint 4 - Security (Feb 12-25, 2024) - PLANNED
- Quantum-resistant cryptography
- SPHINCS+ signatures
- HSM integration
- Security testing

### 📋 Sprint 5 - Integration (Feb 26 - Mar 10, 2024) - PLANNED
- Cross-chain bridge service
- Ethereum integration
- Solana integration

### 📋 Sprint 6 - Testing (Mar 11-24, 2024) - PLANNED
- Unit test suite (95% coverage)
- Integration testing
- Performance benchmarking

### 📋 Sprint 7 - DevOps (Mar 25 - Apr 7, 2024) - PLANNED
- Kubernetes deployment
- CI/CD pipeline
- Monitoring setup

### 📋 Sprint 8 - Production (Apr 8-21, 2024) - PLANNED
- AWS deployment
- Production testing
- SLA implementation

### 📋 Sprint 9 - Documentation (Apr 22 - May 5, 2024) - PLANNED
- Technical documentation
- User guides
- Knowledge transfer

## 📊 Current Status
- **Completed**: 2 sprints
- **Active**: 1 sprint (Sprint 3)
- **Planned**: 6 sprints
- **Overall Progress**: ~35%

## 🎯 Key Milestones
- ✅ Q1 2024: Core platform development
- 🚧 Q2 2024: Production deployment
- 📋 Q2 2024: Public launch
    `;
    
    console.log('\n' + summary);
    return summary;
}

async function main() {
    console.log('================================================');
    console.log('  Aurigraph DLT V11 - Sprint Organization');
    console.log('================================================');
    console.log(`Project: ${PROJECT_KEY}`);
    console.log(`Email: ${JIRA_EMAIL}`);
    
    try {
        // Test connection
        console.log('\n🔗 Testing JIRA connection...');
        await makeJiraRequest('GET', '/myself');
        console.log('✅ Connected to JIRA successfully!');
        
        // Create epics
        const epicKeys = await createEpics();
        
        // Organize tickets into epics
        await organizeTicketsIntoEpics(epicKeys);
        
        // Create sprint report
        await createSprintReport();
        
        // Create roadmap summary
        await createRoadmapSummary();
        
        console.log('\n================================================');
        console.log('  Organization Complete!');
        console.log('================================================');
        console.log(`\n📊 View board: https://${JIRA_BASE_URL}/jira/software/projects/${PROJECT_KEY}/boards/789`);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

main();