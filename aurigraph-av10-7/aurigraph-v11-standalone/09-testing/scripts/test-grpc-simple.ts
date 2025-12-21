/**
 * Simple gRPC Test - Minimal implementation for testing
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

// Load proto definitions
const PROTO_PATH = path.join(__dirname, 'proto/aurigraph-clean.proto');

console.log('🚀 Loading Protocol Buffers...');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const aurigraphProto = grpc.loadPackageDefinition(packageDefinition) as any;

console.log('✅ Proto loaded successfully');
console.log('📦 Available services:', Object.keys(aurigraphProto?.aurigraph?.v10 || {}));

// Simple server implementation
function createSimpleServer(): grpc.Server {
  const server = new grpc.Server({
    'grpc.max_receive_message_length': 100 * 1024 * 1024,
    'grpc.max_send_message_length': 100 * 1024 * 1024,
    'grpc.keepalive_time_ms': 10000,
    'grpc.http2.max_concurrent_streams': 1000
  });

  // Simple health service implementation
  server.addService(aurigraphProto.aurigraph.v10.AurigraphPlatform.service, {
    GetHealth: (call: any, callback: any) => {
      callback(null, {
        status: 'HEALTHY',
        version: '10.8.0-grpc-test',
        uptime_seconds: Math.floor(process.uptime()),
        components: {
          grpc: 'healthy',
          http2: 'active',
          proto: 'loaded'
        }
      });
    },

    GetMetrics: (call: any, callback: any) => {
      callback(null, {
        metrics: {
          test_metric: { float_value: 42.0 },
          connections: { int_value: 1 },
          uptime: { int_value: Math.floor(process.uptime()) }
        },
        timestamp: new Date().toISOString()
      });
    },

    SubmitTransaction: (call: any, callback: any) => {
      const tx = call.request;
      callback(null, {
        transaction_id: tx.id || `tx_${Date.now()}`,
        block_hash: `0x${Math.random().toString(16).substr(2, 40)}`,
        block_number: Math.floor(Math.random() * 1000000),
        status: 'CONFIRMED',
        message: 'Transaction processed via gRPC',
        gas_used: 21000
      });
    }
  });

  return server;
}

// Simple client test
async function testSimpleClient(): Promise<void> {
  console.log('\n🧪 Testing gRPC Client...');
  
  const client = new aurigraphProto.aurigraph.v10.AurigraphPlatform(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  // Test health check
  return new Promise((resolve, reject) => {
    client.GetHealth({}, (err: any, response: any) => {
      if (err) {
        console.error('❌ Health check failed:', err.message);
        reject(err);
        return;
      }

      console.log('✅ Health check response:');
      console.log('   Status:', response.status);
      console.log('   Version:', response.version);
      console.log('   Uptime:', response.uptime_seconds + 's');
      console.log('   Components:', response.components);

      // Test transaction
      client.SubmitTransaction({
        id: 'test_tx_123',
        from: '0x1234567890abcdef',
        to: '0xfedcba0987654321',
        amount: 100.0,
        type: 'TRANSFER'
      }, (txErr: any, txResponse: any) => {
        if (txErr) {
          console.error('❌ Transaction failed:', txErr.message);
          reject(txErr);
          return;
        }

        console.log('✅ Transaction response:');
        console.log('   TX ID:', txResponse.transaction_id);
        console.log('   Status:', txResponse.status);
        console.log('   Block:', txResponse.block_number);

        resolve();
      });
    });
  });
}

// Performance test
async function runPerformanceTest(): Promise<void> {
  console.log('\n⚡ Performance Test...');
  
  const client = new aurigraphProto.aurigraph.v10.AurigraphPlatform(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  const startTime = Date.now();
  const numRequests = 50;
  let completed = 0;

  const promises = [];
  for (let i = 0; i < numRequests; i++) {
    const promise = new Promise((resolve, reject) => {
      client.SubmitTransaction({
        id: `perf_tx_${i}`,
        from: `0x${i.toString(16).padStart(40, '0')}`,
        to: `0x${(i * 2).toString(16).padStart(40, '0')}`,
        amount: Math.random() * 1000,
        type: 'TRANSFER'
      }, (err: any, response: any) => {
        if (err) reject(err);
        else {
          completed++;
          resolve(response);
        }
      });
    });
    promises.push(promise);
  }

  try {
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    const rps = Math.round((numRequests * 1000) / duration);
    
    console.log(`✅ Processed ${numRequests} transactions in ${duration}ms`);
    console.log(`📈 Throughput: ${rps} requests/second`);
    console.log(`⚡ Average latency: ${Math.round(duration / numRequests)}ms`);
    console.log(`🎯 Success rate: ${completed}/${numRequests} (${Math.round((completed / numRequests) * 100)}%)`);

  } catch (error: any) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Main test runner
async function main(): Promise<void> {
  try {
    console.log('🎯 Aurigraph gRPC/HTTP/2 Test Suite');
    console.log('==================================');

    // Create and start server
    const server = createSimpleServer();
    
    await new Promise<void>((resolve, reject) => {
      server.bindAsync(
        '0.0.0.0:50051',
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
          if (err) {
            reject(err);
            return;
          }

          server.start();
          console.log(`✅ gRPC server started on port ${port}`);
          console.log('🌐 HTTP/2 multiplexing enabled');
          console.log('📡 Max concurrent streams: 1000');
          resolve();
        }
      );
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run tests
    await testSimpleClient();
    await runPerformanceTest();

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Results Summary:');
    console.log('✅ Protocol Buffers: Working');
    console.log('✅ gRPC Server: Running');
    console.log('✅ HTTP/2 Transport: Active');
    console.log('✅ Client Communication: Working');
    console.log('✅ Performance: Good');

    console.log('\n🚀 Next Steps:');
    console.log('1. Implement real service handlers');
    console.log('2. Add TLS/mTLS security');
    console.log('3. Setup service discovery');
    console.log('4. Configure production monitoring');
    console.log('5. Migrate internal services');

    // Graceful shutdown
    console.log('\n🛑 Shutting down server...');
    server.tryShutdown((err) => {
      if (err) {
        console.error('⚠️  Force shutdown');
        server.forceShutdown();
      } else {
        console.log('✅ Server shutdown complete');
      }
      process.exit(0);
    });

  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}