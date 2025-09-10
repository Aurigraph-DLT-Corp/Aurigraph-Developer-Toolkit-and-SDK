/**
 * Aurigraph V11 - gRPC Client for Testing
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

// Load proto definitions
const PROTO_PATH = path.join(__dirname, '../../proto/aurigraph.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const aurigraphProto = grpc.loadPackageDefinition(packageDefinition).aurigraph.v10 as any;

/**
 * gRPC Client for testing Aurigraph services
 */
export class AurigraphGrpcClient {
  private client: any;
  private healthClient: any;
  private quantumClient: any;
  private aiClient: any;
  private bridgeClient: any;

  constructor(serverAddress: string = 'localhost:50051') {
    // Create channel credentials
    const credentials = this.createClientCredentials();

    // Initialize service clients
    this.client = new aurigraphProto.AurigraphPlatform(serverAddress, credentials);
    this.quantumClient = new aurigraphProto.QuantumSecurity(serverAddress, credentials);
    this.aiClient = new aurigraphProto.AIOrchestration(serverAddress, credentials);
    this.bridgeClient = new aurigraphProto.CrossChainBridge(serverAddress, credentials);
  }

  private createClientCredentials(): grpc.ChannelCredentials {
    if (process.env.NODE_ENV === 'production') {
      // Production: Use TLS
      const fs = require('fs');
      const rootCert = fs.readFileSync('certs/ca.pem');
      const privateKey = fs.readFileSync('certs/client-key.pem');
      const certChain = fs.readFileSync('certs/client-cert.pem');

      return grpc.credentials.createSsl(rootCert, privateKey, certChain);
    } else {
      // Development: No TLS
      return grpc.credentials.createInsecure();
    }
  }

  /**
   * Test health endpoint
   */
  async getHealth(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetHealth({}, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Test metrics endpoint
   */
  async getMetrics(metricNames: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetMetrics({ metric_names: metricNames }, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Submit a test transaction
   */
  async submitTransaction(txData: {
    from?: string;
    to?: string;
    amount?: number;
    type?: string;
  }): Promise<any> {
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
      this.client.SubmitTransaction(transaction, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Submit batch transactions
   */
  async submitBatchTransactions(count: number = 5): Promise<any> {
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
      }, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Subscribe to blocks (streaming)
   */
  subscribeBlocks(fromBlock: number = 1): grpc.ClientReadableStream<any> {
    return this.client.SubscribeBlocks({
      from_block: fromBlock,
      include_transactions: true
    });
  }

  /**
   * Test quantum key generation
   */
  async generateQuantumKeyPair(algorithm: string = 'CRYSTALS-Kyber'): Promise<any> {
    return new Promise((resolve, reject) => {
      this.quantumClient.GenerateQuantumKeyPair({
        algorithm,
        security_level: 5
      }, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Submit AI task
   */
  async submitAITask(taskType: string = 'OPTIMIZATION'): Promise<any> {
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
      }, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Stream AI task updates
   */
  streamTaskUpdates(taskId: string): grpc.ClientReadableStream<any> {
    return this.aiClient.StreamTaskUpdates({ task_id: taskId });
  }

  /**
   * Test cross-chain bridge
   */
  async initiateBridge(sourceChain: string = 'ethereum', targetChain: string = 'polygon'): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bridgeClient.InitiateBridge({
        source_chain: sourceChain,
        target_chain: targetChain,
        asset: 'USDC',
        amount: 1000.0,
        source_address: '0x1234567890abcdef',
        target_address: '0xfedcba0987654321'
      }, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * List supported chains
   */
  async listSupportedChains(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bridgeClient.ListSupportedChains({ active_only: true }, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Close all connections
   */
  close(): void {
    if (this.client) this.client.close();
    if (this.quantumClient) this.quantumClient.close();
    if (this.aiClient) this.aiClient.close();
    if (this.bridgeClient) this.bridgeClient.close();
  }
}

/**
 * Test runner for gRPC client
 */
export async function runGrpcTests(): Promise<void> {
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
    
    blockStream.on('data', (block: any) => {
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

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error.details || error);
  } finally {
    client.close();
  }
}

// Export for standalone usage
if (require.main === module) {
  runGrpcTests().catch(console.error);
}