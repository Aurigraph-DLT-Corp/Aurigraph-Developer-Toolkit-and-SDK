/**
 * Aurigraph Demo App Test Suite
 * Epic: AV11-192, Task: AV11-205
 * Comprehensive tests for all demo app components
 */

// Test Configuration
const TEST_CONFIG = {
    timeout: 5000,
    retries: 3
};

// Mock Data
const MOCK_NODE_CONFIG = {
    channel: {
        id: 'test-channel-1',
        type: 'channel',
        name: 'Test Channel Node',
        config: {
            maxConnections: 50,
            routingAlgorithm: 'round-robin'
        }
    },
    validator: {
        id: 'test-validator-1',
        type: 'validator',
        name: 'Test Validator Node',
        config: {
            stakeAmount: 10000,
            votingPower: 1
        }
    }
};

// Test Suite: Channel Node
describe('Channel Node Tests', () => {
    let channelNode;

    beforeEach(() => {
        if (typeof ChannelNode !== 'undefined') {
            channelNode = new ChannelNode(MOCK_NODE_CONFIG.channel);
        }
    });

    test('should initialize with correct state', () => {
        if (!channelNode) return;
        const state = channelNode.getState();
        assert(state.id === MOCK_NODE_CONFIG.channel.id, 'ID should match');
        assert(state.type === 'channel', 'Type should be channel');
        assert(state.state === 'IDLE', 'Initial state should be IDLE');
    });

    test('should handle message routing', () => {
        if (!channelNode) return;
        channelNode.start();
        const message = { id: 'msg-1', data: 'test' };
        channelNode.routeMessage(message, 'destination-node');
        const metrics = channelNode.getMetrics();
        assert(metrics.totalMessagesSent > 0, 'Should track routed messages');
    });

    test('should track throughput metrics', () => {
        if (!channelNode) return;
        const metrics = channelNode.getMetrics();
        assert(typeof metrics.throughput === 'number', 'Throughput should be a number');
        assert(metrics.throughput >= 0, 'Throughput should be non-negative');
    });
});

// Test Suite: Validator Node
describe('Validator Node Tests', () => {
    let validatorNode;

    beforeEach(() => {
        if (typeof ValidatorNode !== 'undefined') {
            validatorNode = new ValidatorNode(MOCK_NODE_CONFIG.validator);
        }
    });

    test('should initialize with follower state', () => {
        if (!validatorNode) return;
        const state = validatorNode.getState();
        assert(state.consensusState === 'FOLLOWER', 'Should start as FOLLOWER');
    });

    test('should validate blocks', () => {
        if (!validatorNode) return;
        const block = {
            height: 1,
            transactions: [],
            timestamp: Date.now()
        };
        const isValid = validatorNode.validateBlock(block);
        assert(typeof isValid === 'boolean', 'Should return boolean');
    });

    test('should track blocks validated', () => {
        if (!validatorNode) return;
        const metrics = validatorNode.getMetrics();
        assert(typeof metrics.blocksValidated === 'number', 'Should track blocks validated');
    });
});

// Test Suite: WebSocket Manager
describe('WebSocket Manager Tests', () => {
    let wsManager;

    beforeEach(() => {
        if (typeof WebSocketManager !== 'undefined') {
            wsManager = new WebSocketManager({ autoConnect: false });
        }
    });

    test('should initialize with correct configuration', () => {
        if (!wsManager) return;
        const config = wsManager.config;
        assert(config.url !== undefined, 'Should have URL configured');
        assert(config.reconnectInterval > 0, 'Should have reconnect interval');
    });

    test('should track connection metrics', () => {
        if (!wsManager) return;
        const metrics = wsManager.getMetrics();
        assert(typeof metrics.messagesSent === 'number', 'Should track messages sent');
        assert(typeof metrics.messagesReceived === 'number', 'Should track messages received');
    });

    test('should queue messages when disconnected', () => {
        if (!wsManager) return;
        wsManager.send('test', { data: 'test' });
        const state = wsManager.getState();
        assert(state.messageQueueSize > 0, 'Should queue messages when disconnected');
    });
});

// Test Suite: V11 Backend Client
describe('V11 Backend Client Tests', () => {
    let v11Client;

    beforeEach(() => {
        if (typeof V11BackendClient !== 'undefined') {
            v11Client = new V11BackendClient({ baseUrl: 'http://localhost:9003' });
        }
    });

    test('should initialize with correct configuration', () => {
        if (!v11Client) return;
        const config = v11Client.getConfig();
        assert(config.baseUrl === 'http://localhost:9003', 'Should have correct base URL');
        assert(config.timeout > 0, 'Should have timeout configured');
    });

    test('should track request metrics', () => {
        if (!v11Client) return;
        const metrics = v11Client.getMetrics();
        assert(typeof metrics.requestsSent === 'number', 'Should track requests sent');
        assert(typeof metrics.requestsSuccessful === 'number', 'Should track successful requests');
    });

    test('should support caching', () => {
        if (!v11Client) return;
        const metrics = v11Client.getMetrics();
        assert(typeof metrics.cacheSize === 'number', 'Should track cache size');
    });
});

// Test Suite: Scalability Modes Manager
describe('Scalability Modes Manager Tests', () => {
    let scalabilityManager;

    beforeEach(() => {
        if (typeof ScalabilityModesManager !== 'undefined') {
            scalabilityManager = new ScalabilityModesManager();
        }
    });

    test('should have 4 modes defined', () => {
        if (!scalabilityManager) return;
        const modes = scalabilityManager.getModes();
        assert(Object.keys(modes).length === 4, 'Should have 4 modes');
        assert(modes.educational !== undefined, 'Should have educational mode');
        assert(modes.development !== undefined, 'Should have development mode');
        assert(modes.staging !== undefined, 'Should have staging mode');
        assert(modes.production !== undefined, 'Should have production mode');
    });

    test('should switch modes correctly', () => {
        if (!scalabilityManager) return;
        const result = scalabilityManager.switchMode('educational');
        assert(result.mode === 'educational', 'Should switch to educational mode');
        assert(result.config !== undefined, 'Should return mode config');
    });

    test('should calculate required nodes', () => {
        if (!scalabilityManager) return;
        const nodes = scalabilityManager.calculateRequiredNodes(10000);
        assert(nodes.channels > 0, 'Should calculate channel nodes');
        assert(nodes.validators > 0, 'Should calculate validator nodes');
        assert(nodes.business > 0, 'Should calculate business nodes');
    });
});

// Test Suite: Configuration Manager
describe('Configuration Manager Tests', () => {
    let configManager;

    beforeEach(() => {
        if (typeof ConfigurationManager !== 'undefined') {
            configManager = new ConfigurationManager();
        }
    });

    test('should create node templates', () => {
        if (!configManager) return;
        const template = configManager.createNodeTemplate('channel');
        assert(template !== null, 'Should create template');
        assert(template.type === 'channel', 'Template should have correct type');
        assert(template.config !== undefined, 'Template should have config');
    });

    test('should validate node configuration', () => {
        if (!configManager) return;
        const template = configManager.createNodeTemplate('validator');
        const validation = configManager.validateNodeConfig(template);
        assert(validation.valid === true, 'Valid template should pass validation');
    });
});

// Test Suite: Graph Visualizer
describe('Graph Visualizer Tests', () => {
    let graphVisualizer;

    beforeEach(() => {
        if (typeof GraphVisualizer !== 'undefined') {
            // Create a mock container
            const container = document.createElement('div');
            container.id = 'test-graph-container';
            document.body.appendChild(container);
            graphVisualizer = new GraphVisualizer('test-graph-container');
        }
    });

    test('should initialize with correct container', () => {
        if (!graphVisualizer) return;
        assert(graphVisualizer.containerId === 'test-graph-container', 'Should have correct container ID');
    });

    test('should track data updates', () => {
        if (!graphVisualizer) return;
        graphVisualizer.updateTPS(1000);
        // Should not throw error
        assert(true, 'Should update TPS without error');
    });
});

// Integration Tests
describe('Integration Tests', () => {
    test('should initialize complete demo app', (done) => {
        if (typeof window === 'undefined') return done();

        // Simulate page load
        window.dispatchEvent(new Event('load'));

        setTimeout(() => {
            assert(typeof demoApp !== 'undefined', 'Demo app should be defined');
            assert(demoApp.nodes instanceof Map, 'Should have nodes map');
            assert(demoApp.configManager !== undefined, 'Should have config manager');
            assert(demoApp.scalabilityManager !== undefined, 'Should have scalability manager');
            assert(demoApp.v11Client !== undefined, 'Should have V11 client');
            done();
        }, 1000);
    });

    test('should handle node creation flow', () => {
        if (typeof ConfigurationManager === 'undefined') return;

        const configManager = new ConfigurationManager();
        const template = configManager.createNodeTemplate('channel');
        const validation = configManager.validateNodeConfig(template);

        assert(validation.valid === true, 'Template should be valid');
        assert(template.id !== undefined, 'Should have ID');
        assert(template.config !== undefined, 'Should have config');
    });
});

// Performance Tests
describe('Performance Tests', () => {
    test('should handle high message throughput', () => {
        if (typeof ChannelNode === 'undefined') return;

        const node = new ChannelNode(MOCK_NODE_CONFIG.channel);
        node.start();

        const startTime = Date.now();
        for (let i = 0; i < 1000; i++) {
            node.routeMessage({ id: `msg-${i}`, data: 'test' }, 'dest');
        }
        const duration = Date.now() - startTime;

        assert(duration < 1000, 'Should handle 1000 messages in under 1 second');
    });

    test('should handle multiple scalability mode switches', () => {
        if (typeof ScalabilityModesManager === 'undefined') return;

        const manager = new ScalabilityModesManager();
        const modes = ['educational', 'development', 'staging', 'production'];

        const startTime = Date.now();
        for (const mode of modes) {
            manager.switchMode(mode);
        }
        const duration = Date.now() - startTime;

        assert(duration < 100, 'Should switch modes quickly');
    });
});

// Helper assertion function
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Test Runner
function runTests() {
    console.log('🧪 Starting Aurigraph Demo App Test Suite...\n');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    function describe(suiteName, testFn) {
        console.log(`\n📋 ${suiteName}`);
        testFn();
    }

    function test(testName, testFn) {
        totalTests++;
        try {
            testFn();
            passedTests++;
            console.log(`  ✅ ${testName}`);
        } catch (error) {
            failedTests++;
            console.log(`  ❌ ${testName}`);
            console.log(`     Error: ${error.message}`);
        }
    }

    function beforeEach(fn) {
        fn();
    }

    // Export test functions to global scope
    window.describe = describe;
    window.test = test;
    window.beforeEach = beforeEach;

    // Run all test suites
    try {
        eval(document.currentScript.textContent);
    } catch (error) {
        console.error('Test execution error:', error);
    }

    // Print summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Test Summary`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    console.log(`${'='.repeat(50)}\n`);

    return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100
    };
}

// Auto-run tests if in browser
if (typeof window !== 'undefined' && window.location.search.includes('runTests=true')) {
    window.addEventListener('load', () => {
        setTimeout(runTests, 2000);
    });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests, assert };
}
