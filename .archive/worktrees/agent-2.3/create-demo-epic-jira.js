const https = require('https');

// JIRA credentials from CLAUDE.md (updated with working credentials)
const JIRA_EMAIL = 'subbu@aurigraph.io';
const JIRA_API_TOKEN = 'ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5';
const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const PROJECT_KEY = 'AV11';

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

function makeJiraRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'aurigraphdlt.atlassian.net',
            path: path,
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`JIRA API Error: ${res.statusCode} - ${body}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function createEpic() {
    console.log('📊 Creating Epic: Real-Time Scalable Node Visualization Demo Application...');
    
    const epicData = {
        fields: {
            project: { key: PROJECT_KEY },
            summary: 'Real-Time Scalable Node Visualization Demo Application',
            description: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `Create a comprehensive demo application showcasing Aurigraph DLT's scalability with configurable nodes (Channel, Validator, Business, API Integration), real-time Vizro visualization, and genuine external data integration from Alpaca and W.com feeds.

Key Features:
• Configurable node types with real-time panel visualization
• Live consensus participation tracking
• Transaction processing visualization
• Data submission monitoring
• API integration nodes with on/off toggle
• Real-time Vizro graph showing:
  - Throughput (TPS)
  - Consensus performance
  - Data feed rates
• Genuine data integration testing with:
  - Alpaca API (market data)
  - W.com feed (weather data)

Success Criteria:
• Real-time node visualization
• Scalability demonstration (1M+ TPS)
• Live API data integration
• Interactive node configuration
• Production-ready demo

Technology Stack:
• Frontend: HTML5, JavaScript, Vizro/D3.js
• Backend: Aurigraph V11 (Java/Quarkus)
• APIs: Alpaca, W.com (OpenWeatherMap)
• WebSocket: Real-time updates`
                            }
                        ]
                    }
                ]
            },
            issuetype: { name: 'Epic' },
            labels: ['demo', 'visualization', 'scalability', 'api-integration', 'real-time']
        }
    };

    const epic = await makeJiraRequest('/rest/api/3/issue', 'POST', epicData);
    console.log(`✅ Epic created: ${epic.key}`);
    return epic.key;
}

async function createStory(epicKey, story) {
    const storyData = {
        fields: {
            project: { key: PROJECT_KEY },
            summary: story.summary,
            description: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: story.description.substring(0, 32000) // JIRA limit
                            }
                        ]
                    }
                ]
            },
            issuetype: { name: 'Task' }, // Use Task instead of Story
            labels: story.labels || [],
            parent: { key: epicKey } // Parent epic link
        }
    };

    const createdStory = await makeJiraRequest('/rest/api/3/issue', 'POST', storyData);
    console.log(`  ✅ Task created: ${createdStory.key} - ${story.summary} (${story.storyPoints} pts)`);
    return createdStory.key;
}

const stories = [
    {
        summary: 'Design Node Architecture and Configuration System',
        description: `*Objective:* Design the architecture for configurable node types and their interaction patterns.

*Node Types:*
1. *Channel Nodes* - Message routing and communication
2. *Validator Nodes* - Consensus participation and block validation
3. *Business Nodes* - Transaction processing and business logic
4. *API Integration Nodes* - External data ingestion (Alpaca, W.com)

*Tasks:*
• Define node state models (idle, active, processing, consensus)
• Design node configuration schema (JSON)
• Create node lifecycle management
• Define inter-node communication protocol
• Design node panel UI/UX mockups

*Acceptance Criteria:*
• Architecture document complete
• Node configuration schema defined
• UI mockups approved
• Communication protocol specified`,
        storyPoints: 5,
        labels: ['architecture', 'design', 'nodes']
    },
    {
        summary: 'Implement Channel Node System',
        description: `*Objective:* Implement Channel Nodes for message routing and network communication.

*Features:*
• Message queue management
• Routing logic
• Load balancing across validators
• Real-time status updates
• Panel visualization (active connections, message rate)

*Technical Details:*
• WebSocket connections for real-time updates
• Message throughput tracking
• Connection pool management
• Status indicators (connected, routing, overload)

*Acceptance Criteria:*
• Channel nodes route messages correctly
• Real-time panel shows message flow
• Load balancing works across nodes
• Status updates in <100ms`,
        storyPoints: 8,
        labels: ['channel-nodes', 'messaging', 'real-time']
    },
    {
        summary: 'Implement Validator Node System with Consensus Visualization',
        description: `*Objective:* Implement Validator Nodes with real-time consensus participation tracking.

*Features:*
• HyperRAFT++ consensus participation
• Leader election visualization
• Vote tracking and display
• Block validation monitoring
• Consensus round visualization

*Panel Display:*
• Node status (follower/candidate/leader)
• Votes received/sent
• Blocks validated
• Consensus participation rate
• Current round number

*Acceptance Criteria:*
• Validators participate in consensus
• Panel shows real-time consensus state
• Leader election is visualized
• Vote counting is accurate
• Block validation tracked`,
        storyPoints: 13,
        labels: ['validator-nodes', 'consensus', 'hyperraft', 'visualization']
    },
    {
        summary: 'Implement Business Node System',
        description: `*Objective:* Implement Business Nodes for transaction processing and business logic execution.

*Features:*
• Transaction processing engine
• Business logic execution
• Smart contract interaction
• Transaction validation
• Processing queue management

*Panel Display:*
• Transactions processed (count)
• Processing rate (TPS)
• Queue depth
• Success/failure rate
• Average processing time

*Acceptance Criteria:*
• Business nodes process transactions
• Panel shows real-time metrics
• Transaction validation works
• Queue management efficient
• Error handling robust`,
        storyPoints: 8,
        labels: ['business-nodes', 'transactions', 'processing']
    },
    {
        summary: 'Implement API Integration Nodes with Alpaca Market Data',
        description: `*Objective:* Implement API Integration Nodes with genuine Alpaca market data feed.

*Alpaca Integration:*
• Real-time stock price feed
• Market data ingestion
• Data transformation to blockchain format
• Rate limiting (200 requests/minute)
• Error handling and retry logic

*Features:*
• On/Off toggle switch
• Data feed rate display
• Last update timestamp
• Connection status
• Data samples display

*Panel Display:*
• Connection status (active/inactive)
• Data feed rate (updates/sec)
• Last data received
• Total records ingested
• API quota usage

*Testing:*
• Test with Alpaca paper trading API
• Verify data accuracy
• Test rate limiting
• Test reconnection logic

*Acceptance Criteria:*
• Alpaca API connected successfully
• Real market data flowing
• Toggle on/off works
• Panel shows live data
• Rate limiting respected
• Error handling tested`,
        storyPoints: 13,
        labels: ['api-integration', 'alpaca', 'market-data', 'real-time']
    },
    {
        summary: 'Implement API Integration Nodes with W.com Weather Feed',
        description: `*Objective:* Implement API Integration Nodes with genuine W.com (OpenWeatherMap) weather data feed.

*W.com Integration:*
• Real-time weather data (temperature, humidity, pressure)
• Multi-location support
• Data transformation to blockchain events
• API key management
• Error handling

*Features:*
• On/Off toggle switch
• Location configuration
• Data feed display
• Update frequency control
• Historical data tracking

*Panel Display:*
• Connection status
• Current weather data
• Update frequency
• Locations monitored
• Data ingestion rate

*Testing:*
• Test with OpenWeatherMap free tier
• Verify data accuracy
• Test multiple locations
• Test error scenarios

*Acceptance Criteria:*
• W.com API connected successfully
• Real weather data flowing
• Toggle on/off works
• Panel shows live weather
• Multiple locations supported
• Data transformation correct`,
        storyPoints: 13,
        labels: ['api-integration', 'weather', 'openweathermap', 'real-time']
    },
    {
        summary: 'Create Real-Time Vizro Graph Visualization',
        description: `*Objective:* Create interactive real-time Vizro graph showing throughput, consensus, and data feed metrics.

*Visualization Components:*

1. *Throughput Graph (TPS)*
   • Real-time transaction throughput
   • Historical trend (last 5 minutes)
   • Peak/average indicators
   • Color-coded zones (green >500K, yellow 100K-500K, red <100K)

2. *Consensus Performance Graph*
   • Consensus rounds per second
   • Block finality time
   • Validator participation rate
   • Leader changes

3. *Data Feed Graph*
   • API integration data rate
   • Alpaca feed rate
   • W.com feed rate
   • Combined data ingestion

*Technical Implementation:*
• Use Vizro or D3.js for graphs
• WebSocket for real-time data
• 60 FPS update rate target
• Smooth transitions
• Responsive design

*Interactivity:*
• Zoom and pan
• Time range selection
• Metric selection
• Export data (CSV/JSON)

*Acceptance Criteria:*
• All 3 graphs display correctly
• Real-time updates <100ms latency
• Smooth 60 FPS rendering
• Interactive controls work
• Responsive on all devices
• Data export functional`,
        storyPoints: 13,
        labels: ['visualization', 'vizro', 'graphs', 'real-time', 'ui']
    },
    {
        summary: 'Create Node Panel UI Components',
        description: `*Objective:* Create beautiful, responsive panel UI components for each node type.

*Panel Features:*
• Clean, modern design
• Color-coded status indicators
• Real-time metric updates
• Node configuration controls
• Activity logs
• Performance graphs (mini)

*Panel Types:*

1. *Channel Node Panel*
   • Active connections
   • Message throughput
   • Routing efficiency

2. *Validator Node Panel*
   • Consensus state
   • Vote tracking
   • Block validation count

3. *Business Node Panel*
   • Transaction count
   • Processing rate
   • Queue depth

4. *API Integration Panel*
   • Connection status
   • Data feed rate
   • Toggle control
   • Last update

*Design Requirements:*
• Consistent styling
• Responsive grid layout
• Dark theme
• Aurigraph branding
• Accessibility (WCAG 2.1)

*Acceptance Criteria:*
• All panel types implemented
• Responsive design works
• Real-time updates functional
• Controls interactive
• Design approved by stakeholders`,
        storyPoints: 8,
        labels: ['ui', 'panels', 'components', 'design']
    },
    {
        summary: 'Implement Node Configuration System',
        description: `*Objective:* Implement dynamic node configuration system allowing users to add/remove/configure nodes.

*Features:*
• Add new nodes of any type
• Remove existing nodes
• Configure node parameters:
  - Channel: max connections, routing algorithm
  - Validator: stake amount, voting power
  - Business: processing capacity, queue size
  - API Integration: API keys, update frequency, endpoints
• Save/load configurations (JSON)
• Preset configurations (demo scenarios)

*UI Components:*
• Node configuration modal
• Drag-and-drop node arrangement
• Configuration templates
• Import/export config

*Acceptance Criteria:*
• Nodes can be added dynamically
• Nodes can be removed safely
• Configuration persists
• Presets available
• Import/export works
• Validation prevents errors`,
        storyPoints: 8,
        labels: ['configuration', 'nodes', 'ui', 'persistence']
    },
    {
        summary: 'Implement Scalability Demonstration Mode',
        description: `*Objective:* Create demonstration modes showcasing Aurigraph DLT scalability from 1K to 2M+ TPS.

*Demo Scenarios:*

1. *Small Scale (1K-10K TPS)*
   • 3 validators, 2 business nodes, 1 channel
   • Clear visualization of each transaction
   • Educational mode

2. *Medium Scale (10K-100K TPS)*
   • 10 validators, 5 business nodes, 3 channels
   • Aggregated metrics
   • Performance focus

3. *Large Scale (100K-500K TPS)*
   • 50 validators, 20 business nodes, 10 channels
   • High-performance visualization
   • Stress test mode

4. *Ultra Scale (500K-2M+ TPS)*
   • 100+ validators, 50+ business nodes, 20+ channels
   • Maximum performance demonstration
   • Production simulation

*Features:*
• One-click scenario launch
• Automatic node provisioning
• Load generation
• Real-time metrics
• Performance comparison

*Acceptance Criteria:*
• All scenarios work correctly
• TPS targets achieved
• Visualization remains responsive
• Metrics accurate
• Demo is impressive`,
        storyPoints: 13,
        labels: ['scalability', 'demo', 'performance', 'scenarios']
    },
    {
        summary: 'Implement WebSocket Real-Time Communication Layer',
        description: `*Objective:* Implement robust WebSocket infrastructure for real-time updates between backend and frontend.

*Features:*
• WebSocket server (Quarkus)
• Client connection management
• Event-driven architecture
• Message broadcasting
• Connection pooling
• Automatic reconnection

*Event Types:*
• Node state changes
• Consensus events
• Transaction events
• API data events
• Metric updates

*Performance Requirements:*
• Support 1000+ concurrent connections
• Message latency <50ms
• Automatic reconnection <1s
• Efficient message serialization (JSON)

*Acceptance Criteria:*
• WebSocket server running
• Client auto-reconnects
• Events broadcast correctly
• Low latency achieved
• Scalable to 1000+ clients
• Error handling robust`,
        storyPoints: 8,
        labels: ['websocket', 'real-time', 'backend', 'communication']
    },
    {
        summary: 'Integrate with Aurigraph V11 Backend',
        description: `*Objective:* Integrate demo app with Aurigraph V11 backend for genuine blockchain operations.

*Integration Points:*
• Transaction submission API
• Consensus monitoring API
• Node management API
• Metrics API
• Health check API

*Features:*
• Real transaction processing
• Actual consensus participation
• Live blockchain state
• Performance metrics from V11
• Health monitoring

*Backend Enhancements:*
• Add demo-specific REST endpoints
• Expose consensus metrics
• Node management endpoints
• Real-time event streaming

*Acceptance Criteria:*
• All API endpoints working
• Real blockchain operations
• Metrics accurate
• Performance acceptable
• Error handling complete`,
        storyPoints: 13,
        labels: ['integration', 'backend', 'v11', 'api']
    },
    {
        summary: 'Create API Integration Testing Suite',
        description: `*Objective:* Create comprehensive testing suite for genuine API integrations (Alpaca, W.com).

*Test Coverage:*

1. *Alpaca API Tests*
   • Connection establishment
   • Authentication
   • Real-time data streaming
   • Rate limiting
   • Error handling
   • Data accuracy
   • Reconnection logic

2. *W.com API Tests*
   • API key validation
   • Data fetching
   • Multi-location queries
   • Update frequency
   • Error scenarios
   • Data transformation

3. *Integration Tests*
   • Data flow end-to-end
   • Blockchain storage
   • Panel updates
   • Toggle functionality
   • Performance under load

*Test Tools:*
• JUnit 5 for Java tests
• Jest for JavaScript tests
• API mocking for offline tests
• Live API tests (separate suite)

*Acceptance Criteria:*
• 95% test coverage
• All API scenarios tested
• Live API tests passing
• Mock tests for CI/CD
• Performance benchmarks met
• Documentation complete`,
        storyPoints: 8,
        labels: ['testing', 'api', 'integration', 'quality']
    },
    {
        summary: 'Create Demo App Documentation and User Guide',
        description: `*Objective:* Create comprehensive documentation and user guide for the demo application.

*Documentation Sections:*

1. *Architecture Overview*
   • System architecture diagram
   • Node types explanation
   • Data flow diagrams
   • Technology stack

2. *User Guide*
   • Getting started
   • Node configuration
   • Demo scenarios
   • API integration setup
   • Troubleshooting

3. *API Documentation*
   • Alpaca integration guide
   • W.com integration guide
   • API key setup
   • Rate limits and quotas

4. *Developer Guide*
   • Code structure
   • Adding new node types
   • Extending visualizations
   • Deployment guide

*Deliverables:*
• README.md
• USER_GUIDE.md
• API_INTEGRATION.md
• DEVELOPER_GUIDE.md
• Architecture diagrams
• Video walkthrough (optional)

*Acceptance Criteria:*
• All documents complete
• Clear instructions
• Screenshots included
• Code examples provided
• Reviewed and approved`,
        storyPoints: 5,
        labels: ['documentation', 'user-guide', 'developer-docs']
    },
    {
        summary: 'Deploy Demo App to Production and Create Deployment Pipeline',
        description: `*Objective:* Deploy demo application to production with automated CI/CD pipeline.

*Deployment Tasks:*
• Docker containerization
• Kubernetes manifests
• Nginx configuration
• SSL/TLS setup
• Domain configuration
• Environment variables

*CI/CD Pipeline:*
• GitHub Actions workflow
• Automated testing
• Build and push Docker images
• Deploy to staging
• Deploy to production
• Health checks
• Rollback capability

*Production Requirements:*
• HTTPS only (enforce)
• High availability (99.9%)
• Auto-scaling
• Monitoring (Prometheus/Grafana)
• Logging (ELK stack)
• Backup strategy

*Acceptance Criteria:*
• Demo app live in production
• CI/CD pipeline working
• HTTPS enforced
• Monitoring active
• Performance targets met
• Zero-downtime deployment`,
        storyPoints: 13,
        labels: ['deployment', 'devops', 'production', 'ci-cd']
    }
];

async function main() {
    try {
        console.log('🚀 Creating JIRA Epic and Stories for Real-Time Scalable Demo App\n');
        
        // Create epic
        const epicKey = await createEpic();
        console.log();
        
        // Create all stories
        console.log(`📝 Creating ${stories.length} stories linked to ${epicKey}...\n`);
        
        const storyKeys = [];
        for (const story of stories) {
            const storyKey = await createStory(epicKey, story);
            storyKeys.push(storyKey);
        }
        
        console.log('\n✅ JIRA Import Complete!\n');
        console.log('📊 Summary:');
        console.log(`   Epic: ${epicKey}`);
        console.log(`   Stories: ${storyKeys.length} created`);
        console.log(`   Total Points: ${stories.reduce((sum, s) => sum + s.storyPoints, 0)}`);
        console.log(`\n🔗 View Epic: ${JIRA_BASE_URL}/browse/${epicKey}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
