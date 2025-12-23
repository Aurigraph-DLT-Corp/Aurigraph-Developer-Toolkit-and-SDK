#!/usr/bin/env node

/**
 * Comprehensive JIRA Ticket Creation for Aurigraph DLT V11
 * Creates all project tickets with proper descriptions and statuses
 */

const https = require('https');

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
                    reject(new Error(`Request failed with status ${res.statusCode}: ${responseData}`));
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

// Comprehensive ticket list covering all project aspects
const projectTickets = [
    // Phase 1: Foundation & Planning (Completed)
    {
        summary: "V11: Project Kickoff and Architecture Planning",
        description: "Initial project setup, architecture decisions, and technology stack selection for V11 migration from TypeScript to Java/Quarkus/GraalVM",
        status: "Done",
        epic: true
    },
    {
        summary: "V11: Setup Java/Quarkus Development Environment",
        description: "Configure Quarkus 3.26.2 framework with Java 21, Maven build system, and development tools",
        status: "Done"
    },
    {
        summary: "V11: Design System Architecture",
        description: "Design microservices architecture with reactive programming patterns using Mutiny",
        status: "Done"
    },
    {
        summary: "V11: Configure GraalVM Native Compilation",
        description: "Setup GraalVM native image compilation with three optimization profiles: native-fast, native, and native-ultra",
        status: "Done"
    },

    // Phase 2: Core Implementation (Completed)
    {
        summary: "V11: Implement REST API Framework",
        description: "Build reactive REST API endpoints using Quarkus with Mutiny for health, info, performance, and stats endpoints",
        status: "Done"
    },
    {
        summary: "V11: Core Transaction Processing Service",
        description: "Implement TransactionService.java with high-throughput transaction processing capabilities",
        status: "Done"
    },
    {
        summary: "V11: Virtual Threads Integration",
        description: "Integrate Java 21 Virtual Threads for massive concurrency without OS thread limitations",
        status: "Done"
    },
    {
        summary: "V11: Native Compilation Pipeline",
        description: "Establish CI/CD pipeline for native compilation with sub-second startup times",
        status: "Done"
    },

    // Phase 3: Advanced Features (In Progress)
    {
        summary: "V11: AI/ML Optimization Framework",
        description: "Implement ML-based consensus optimization using DeepLearning4J, Apache Commons Math, and SMILE ML library for intelligent transaction ordering and anomaly detection",
        status: "Done"
    },
    {
        summary: "V11: HMS Healthcare Integration",
        description: "Integrate Healthcare Management System for real-world asset tokenization of medical records and healthcare data",
        status: "Done"
    },
    {
        summary: "V11: gRPC Service Implementation",
        description: "Implement high-performance gRPC services with Protocol Buffers for internal service communication on port 9004",
        status: "In Progress"
    },
    {
        summary: "V11: HyperRAFT++ Consensus Migration",
        description: "Migrate HyperRAFT++ consensus algorithm from TypeScript to Java, targeting 2M+ TPS with Byzantine fault tolerance",
        status: "In Progress"
    },

    // Phase 4: Performance & Optimization (In Progress)
    {
        summary: "V11: Performance Optimization to 2M+ TPS",
        description: "Optimize platform performance from current 776K TPS to achieve 2 million+ transactions per second using parallel processing, virtual threads, and JVM tuning",
        status: "In Progress"
    },
    {
        summary: "V11: JMeter Load Testing Framework",
        description: "Setup comprehensive JMeter-based load testing framework for performance validation and benchmarking",
        status: "In Progress"
    },
    {
        summary: "V11: Memory Optimization",
        description: "Optimize memory usage to achieve <256MB for native builds and <512MB for JVM mode",
        status: "In Progress"
    },

    // Phase 5: Security & Cryptography (Planned)
    {
        summary: "V11: Quantum-Resistant Cryptography Implementation",
        description: "Implement post-quantum cryptography using CRYSTALS-Kyber for key encapsulation and Dilithium for digital signatures (NIST Level 5 security)",
        status: "To Do"
    },
    {
        summary: "V11: SPHINCS+ Hash-Based Signatures",
        description: "Implement SPHINCS+ stateless hash-based signature scheme for long-term security",
        status: "To Do"
    },
    {
        summary: "V11: HSM Integration",
        description: "Integrate Hardware Security Module support for enterprise key management",
        status: "To Do"
    },

    // Phase 6: Integration & Bridges (Planned)
    {
        summary: "V11: Cross-Chain Bridge Service",
        description: "Implement universal cross-chain bridge supporting LayerZero, Wormhole, and 50+ blockchain networks",
        status: "To Do"
    },
    {
        summary: "V11: Ethereum Integration Adapter",
        description: "Build Ethereum blockchain integration adapter for EVM compatibility",
        status: "To Do"
    },
    {
        summary: "V11: Solana Integration Adapter",
        description: "Build Solana blockchain integration adapter for high-speed cross-chain transfers",
        status: "To Do"
    },

    // Phase 7: Testing & Quality (In Progress)
    {
        summary: "V11: Unit Test Suite Migration",
        description: "Migrate and expand unit tests using JUnit 5 and Mockito to achieve 95% line coverage",
        status: "In Progress"
    },
    {
        summary: "V11: Integration Testing with TestContainers",
        description: "Implement comprehensive integration tests using TestContainers for isolated testing environments",
        status: "In Progress"
    },
    {
        summary: "V11: Security Penetration Testing",
        description: "Conduct thorough security audit and penetration testing of quantum cryptography and consensus mechanisms",
        status: "To Do"
    },

    // Phase 8: DevOps & Deployment (Planned)
    {
        summary: "V11: Kubernetes Deployment Configuration",
        description: "Configure Kubernetes deployment with HPA/VPA auto-scaling, ConfigMaps, and persistent storage",
        status: "To Do"
    },
    {
        summary: "V11: Prometheus & Grafana Monitoring",
        description: "Setup comprehensive monitoring with Prometheus metrics and Grafana dashboards",
        status: "To Do"
    },
    {
        summary: "V11: CI/CD Pipeline with GitHub Actions",
        description: "Establish automated CI/CD pipeline for testing, building, and deploying native and JVM builds",
        status: "To Do"
    },

    // Phase 9: Documentation & Knowledge Transfer
    {
        summary: "V11: Technical Documentation",
        description: "Create comprehensive technical documentation including API specs, architecture diagrams, and deployment guides",
        status: "In Progress"
    },
    {
        summary: "V11: Developer Onboarding Guide",
        description: "Create developer onboarding documentation with setup instructions, coding standards, and best practices",
        status: "To Do"
    },
    {
        summary: "V11: Performance Tuning Guide",
        description: "Document performance tuning parameters, JVM options, and optimization strategies",
        status: "To Do"
    },

    // Phase 10: Production Readiness
    {
        summary: "V11: Production Deployment to AWS",
        description: "Deploy V11 platform to AWS production environment with multi-region support",
        status: "To Do"
    },
    {
        summary: "V11: Disaster Recovery Planning",
        description: "Implement disaster recovery procedures with automated backups and failover mechanisms",
        status: "To Do"
    },
    {
        summary: "V11: SLA & Performance Guarantees",
        description: "Establish Service Level Agreements with 99.999% uptime and <100ms latency guarantees",
        status: "To Do"
    }
];

// Get existing issues to avoid duplicates
async function getExistingIssues() {
    try {
        const jql = `project = ${PROJECT_KEY}`;
        const response = await makeJiraRequest('GET', `/search?jql=${encodeURIComponent(jql)}&maxResults=1000`);
        return response.issues || [];
    } catch (error) {
        console.error('Failed to fetch existing issues:', error.message);
        return [];
    }
}

// Create a single ticket
async function createTicket(ticket) {
    try {
        const issueType = ticket.epic ? "Epic" : "Task";
        
        const data = {
            fields: {
                project: { 
                    key: PROJECT_KEY 
                },
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
                        },
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: `Status: ${ticket.status}`,
                                    marks: [
                                        {
                                            type: "strong"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                issuetype: { 
                    name: issueType 
                }
                // Removed priority field as it's causing issues
            }
        };

        const response = await makeJiraRequest('POST', '/issue', data);
        console.log(`✅ Created ${response.key}: ${ticket.summary}`);
        return response.key;
    } catch (error) {
        console.error(`❌ Failed to create ticket "${ticket.summary}": ${error.message}`);
        return null;
    }
}

// Main execution
async function main() {
    console.log('================================================');
    console.log('  Aurigraph DLT V11 Comprehensive Ticket Creator');
    console.log('================================================');
    console.log(`Project: ${PROJECT_KEY}`);
    console.log(`Email: ${JIRA_EMAIL}`);
    console.log(`Total Tickets to Process: ${projectTickets.length}`);

    try {
        // Test connection
        console.log('\n🔗 Testing JIRA connection...');
        await makeJiraRequest('GET', '/myself');
        console.log('✅ Connected to JIRA successfully!\n');

        // Get existing issues
        console.log('📋 Fetching existing issues...');
        const existingIssues = await getExistingIssues();
        const existingSummaries = new Set(existingIssues.map(i => i.fields.summary.toLowerCase()));
        console.log(`Found ${existingIssues.length} existing issues\n`);

        // Create tickets
        console.log('🎫 Creating comprehensive ticket set...\n');
        let created = 0;
        let skipped = 0;

        for (const ticket of projectTickets) {
            // Check if ticket already exists
            if (existingSummaries.has(ticket.summary.toLowerCase())) {
                console.log(`⏭️  Skipping (already exists): ${ticket.summary}`);
                skipped++;
            } else {
                const key = await createTicket(ticket);
                if (key) created++;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Summary
        console.log('\n================================================');
        console.log('  Creation Complete!');
        console.log('================================================');
        console.log(`✅ Created: ${created} tickets`);
        console.log(`⏭️  Skipped: ${skipped} tickets (already exist)`);
        console.log(`\n📊 View board at: https://${JIRA_BASE_URL}/jira/software/projects/${PROJECT_KEY}/boards/789`);

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