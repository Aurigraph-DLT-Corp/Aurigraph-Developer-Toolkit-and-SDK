"use strict";
/**
 * Aurigraph V10 - gRPC Client for Testing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AurigraphGrpcClient = void 0;
exports.runGrpcTests = runGrpcTests;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path = __importStar(require("path"));
// Load proto definitions
const PROTO_PATH = path.join(__dirname, '../../proto/aurigraph.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const aurigraphProto = grpc.loadPackageDefinition(packageDefinition).aurigraph.v10;
/**
 * gRPC Client for testing Aurigraph services
 */
class AurigraphGrpcClient {
    client;
    healthClient;
    quantumClient;
    aiClient;
    bridgeClient;
    constructor(serverAddress = 'localhost:50051') {
        // Create channel credentials
        const credentials = this.createClientCredentials();
        // Initialize service clients
        this.client = new aurigraphProto.AurigraphPlatform(serverAddress, credentials);
        this.quantumClient = new aurigraphProto.QuantumSecurity(serverAddress, credentials);
        this.aiClient = new aurigraphProto.AIOrchestration(serverAddress, credentials);
        this.bridgeClient = new aurigraphProto.CrossChainBridge(serverAddress, credentials);
    }
    createClientCredentials() {
        if (process.env.NODE_ENV === 'production') {
            // Production: Use TLS
            const fs = require('fs');
            const rootCert = fs.readFileSync('certs/ca.pem');
            const privateKey = fs.readFileSync('certs/client-key.pem');
            const certChain = fs.readFileSync('certs/client-cert.pem');
            return grpc.credentials.createSsl(rootCert, privateKey, certChain);
        }
        else {
            // Development: No TLS
            return grpc.credentials.createInsecure();
        }
    }
    /**
     * Test health endpoint
     */
    async getHealth() {
        return new Promise((resolve, reject) => {
            this.client.GetHealth({}, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * Test metrics endpoint
     */
    async getMetrics(metricNames = []) {
        return new Promise((resolve, reject) => {
            this.client.GetMetrics({ metric_names: metricNames }, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * Submit a test transaction
     */
    async submitTransaction(txData) {
        const transaction = {
            id: `tx_${Date.now()}`,
            from: txData.from || '0x1234567890abcdef',
            to: txData.to || '0xfedcba0987654321',
            amount: txData.amount || 100.0,
            nonce: Math.floor(Math.random() * 1000),
            gas_price: 20.0,
            gas_limit: 21000,
            data: Buffer.from(''),
            timestamp: new Date().toISOString(),
            type: txData.type || 'TRANSFER'
        };
        return new Promise((resolve, reject) => {
            this.client.SubmitTransaction(transaction, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * Submit batch transactions
     */
    async submitBatchTransactions(count = 5) {
        const transactions = [];
        for (let i = 0; i < count; i++) {
            transactions.push({
                id: `tx_batch_${Date.now()}_${i}`,
                from: `0x123456789${i}`,
                to: `0xabcdef${i}`,
                amount: Math.random() * 1000,
                nonce: i,
                gas_price: 20.0,
                gas_limit: 21000,
                type: 'TRANSFER'
            });
        }
        return new Promise((resolve, reject) => {
            this.client.BatchSubmitTransactions({
                transactions,
                atomic: true
            }, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * Subscribe to blocks (streaming)
     */
    subscribeBlocks(fromBlock = 1) {
        return this.client.SubscribeBlocks({
            from_block: fromBlock,
            include_transactions: true
        });
    }
    /**
     * Test quantum key generation
     */
    async generateQuantumKeyPair(algorithm = 'CRYSTALS-Kyber') {
        return new Promise((resolve, reject) => {
            this.quantumClient.GenerateQuantumKeyPair({
                algorithm,
                security_level: 5
            }, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * Submit AI task
     */
    async submitAITask(taskType = 'OPTIMIZATION') {
        return new Promise((resolve, reject) => {
            this.aiClient.SubmitTask({
                task_id: `ai_task_${Date.now()}`,
                type: taskType,
                parameters: {
                    target: 'consensus_optimization',
                    duration: '60'
                },
                priority: 'HIGH',
                timeout_seconds: 300
            }, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * Stream AI task updates
     */
    streamTaskUpdates(taskId) {
        return this.aiClient.StreamTaskUpdates({ task_id: taskId });
    }
    /**
     * Test cross-chain bridge
     */
    async initiateBridge(sourceChain = 'ethereum', targetChain = 'polygon') {
        return new Promise((resolve, reject) => {
            this.bridgeClient.InitiateBridge({
                source_chain: sourceChain,
                target_chain: targetChain,
                asset: 'USDC',
                amount: 1000.0,
                source_address: '0x1234567890abcdef',
                target_address: '0xfedcba0987654321'
            }, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * List supported chains
     */
    async listSupportedChains() {
        return new Promise((resolve, reject) => {
            this.bridgeClient.ListSupportedChains({ active_only: true }, (err, response) => {
                if (err)
                    reject(err);
                else
                    resolve(response);
            });
        });
    }
    /**
     * Close all connections
     */
    close() {
        if (this.client)
            this.client.close();
        if (this.quantumClient)
            this.quantumClient.close();
        if (this.aiClient)
            this.aiClient.close();
        if (this.bridgeClient)
            this.bridgeClient.close();
    }
}
exports.AurigraphGrpcClient = AurigraphGrpcClient;
/**
 * Test runner for gRPC client
 */
async function runGrpcTests() {
    console.log('🧪 Starting gRPC Client Tests...');
    console.log('==================================');
    const client = new AurigraphGrpcClient();
    try {
        // Test 1: Health Check
        console.log('\n1️⃣ Testing Health Check...');
        const health = await client.getHealth();
        console.log('✅ Health:', health.status, health.version);
        // Test 2: Metrics
        console.log('\n2️⃣ Testing Metrics...');
        const metrics = await client.getMetrics(['tps', 'latency']);
        console.log('✅ Metrics received at:', metrics.timestamp);
        // Test 3: Transaction Submission
        console.log('\n3️⃣ Testing Transaction Submission...');
        const txResult = await client.submitTransaction({
            from: '0xtest123',
            to: '0xtest456',
            amount: 500.0
        });
        console.log('✅ Transaction submitted:', txResult.transaction_id, 'Status:', txResult.status);
        // Test 4: Batch Transactions
        console.log('\n4️⃣ Testing Batch Transactions...');
        const batchResult = await client.submitBatchTransactions(3);
        console.log('✅ Batch submitted:', batchResult.batch_id, 'Success:', batchResult.success);
        // Test 5: Quantum Key Generation
        console.log('\n5️⃣ Testing Quantum Key Generation...');
        const keyPair = await client.generateQuantumKeyPair();
        console.log('✅ Quantum key generated:', keyPair.algorithm, 'Level:', keyPair.security_level);
        // Test 6: AI Task
        console.log('\n6️⃣ Testing AI Task Submission...');
        const aiTask = await client.submitAITask('PREDICTION');
        console.log('✅ AI task submitted:', aiTask.task_id, 'Accepted:', aiTask.accepted);
        // Test 7: Cross-chain Bridge
        console.log('\n7️⃣ Testing Cross-chain Bridge...');
        const bridgeResult = await client.initiateBridge('ethereum', 'cosmos');
        console.log('✅ Bridge initiated:', bridgeResult.bridge_id, 'Fee:', bridgeResult.fee);
        // Test 8: List Supported Chains
        console.log('\n8️⃣ Testing Supported Chains...');
        const chains = await client.listSupportedChains();
        console.log('✅ Supported chains:', chains.chains.length);
        // Test 9: Block Streaming (short test)
        console.log('\n9️⃣ Testing Block Streaming (5 blocks)...');
        const blockStream = client.subscribeBlocks(1000);
        let blockCount = 0;
        blockStream.on('data', (block) => {
            console.log(`📦 Block ${block.number}: ${block.hash.substring(0, 10)}... (${block.transactions?.length || 0} txs)`);
            blockCount++;
            if (blockCount >= 5) {
                blockStream.cancel();
            }
        });
        blockStream.on('end', () => {
            console.log('✅ Block streaming test completed');
        });
        // Wait for streaming test
        await new Promise(resolve => setTimeout(resolve, 6000));
        console.log('\n🎉 All gRPC tests completed successfully!');
        console.log('=====================================');
    }
    catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Details:', error.details || error);
    }
    finally {
        client.close();
    }
}
// Export for standalone usage
if (require.main === module) {
    runGrpcTests().catch(console.error);
}
//# sourceMappingURL=client.js.map