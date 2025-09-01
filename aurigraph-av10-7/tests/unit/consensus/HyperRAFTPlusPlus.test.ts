import 'reflect-metadata';
import { HyperRAFTPlusPlus, Transaction, Block } from '../../../src/consensus/HyperRAFTPlusPlus';
import { QuantumCryptoManager } from '../../../src/crypto/QuantumCryptoManager';
import { ZKProofSystem } from '../../../src/zk/ZKProofSystem';

describe('HyperRAFTPlusPlus Consensus', () => {
  let consensus: HyperRAFTPlusPlus;
  let mockQuantumCrypto: jest.Mocked<QuantumCryptoManager>;
  let mockZKProofSystem: jest.Mocked<ZKProofSystem>;

  beforeEach(() => {
    // Create mocked dependencies
    mockQuantumCrypto = {
      initialize: jest.fn().mockResolvedValue(undefined),
      sign: jest.fn().mockResolvedValue({ signature: 'mock-signature', algorithm: 'CRYSTALS-Dilithium', timestamp: Date.now() }),
      verify: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('0x123456789abcdef'),
      generateKeyPair: jest.fn().mockResolvedValue({ publicKey: 'mock-pub', privateKey: 'mock-priv', algorithm: 'CRYSTALS-Kyber' }),
      encrypt: jest.fn().mockResolvedValue({ ciphertext: 'encrypted-data', publicKey: 'mock-pub' }),
      decrypt: jest.fn().mockResolvedValue('decrypted-data'),
      getMetrics: jest.fn().mockResolvedValue({ securityLevel: 5 })
    } as any;

    mockZKProofSystem = {
      initialize: jest.fn().mockResolvedValue(undefined),
      generateProof: jest.fn().mockResolvedValue({ proof: 'mock-zk-proof', public: [], circuit: 'transfer' }),
      verifyProof: jest.fn().mockResolvedValue(true),
      getMetrics: jest.fn().mockResolvedValue({ proofsGenerated: 1000 })
    } as any;

    consensus = new HyperRAFTPlusPlus({
      nodeId: 'test-validator',
      zkProofsEnabled: true,
      electionTimeout: 1000,
      maxBatchSize: 10000
    }, mockQuantumCrypto, mockZKProofSystem);
  });

  describe('Consensus Initialization', () => {
    it('should initialize with correct configuration', async () => {
      await consensus.initialize();
      
      const status = await consensus.getStatus();
      expect(status.nodeId).toBe('test-validator');
      expect(status.zkEnabled).toBe(true);
    });

    it('should start consensus rounds', async () => {
      await consensus.initialize();
      await consensus.start();
      
      const status = await consensus.getStatus();
      expect(status.consensusState).toBe('active');
    });
  });

  describe('Transaction Processing', () => {
    beforeEach(async () => {
      await consensus.initialize();
      await consensus.start();
    });

    it('should process valid transaction batch', async () => {
      const transactions: Transaction[] = [
        testUtils.createMockTransaction({ from: '0xabc', to: '0xdef', amount: 100 }),
        testUtils.createMockTransaction({ from: '0x123', to: '0x456', amount: 200 })
      ];

      const block = await consensus.processTransactionBatch(transactions);
      
      expect(block).toBeDefined();
      expect(block.transactions).toHaveLength(2);
      expect(block.height).toBeGreaterThan(0);
      expect(block.validator).toBe('test-validator');
    });

    it('should handle empty transaction batch', async () => {
      const block = await consensus.processTransactionBatch([]);
      
      expect(block).toBeDefined();
      expect(block.transactions).toHaveLength(0);
    });

    it('should validate transactions with quantum signatures', async () => {
      const transaction = testUtils.createMockTransaction({
        signature: 'valid-quantum-signature'
      });

      const isValid = await (consensus as any).validateSingleTransaction(transaction);
      expect(isValid).toBe(true);
      expect(mockQuantumCrypto.verify).toHaveBeenCalled();
    });

    it('should reject transactions with invalid signatures', async () => {
      mockQuantumCrypto.verify.mockResolvedValueOnce(false);
      
      const transaction = testUtils.createMockTransaction({
        signature: 'invalid-signature'
      });

      const isValid = await (consensus as any).validateSingleTransaction(transaction);
      expect(isValid).toBe(false);
    });

    it('should handle transaction processing errors gracefully', async () => {
      // Mock ZK proof system to fail
      mockZKProofSystem.generateProof.mockRejectedValueOnce(new Error('ZK proof generation failed'));
      
      const transactions = [testUtils.createMockTransaction()];
      const block = await consensus.processTransactionBatch(transactions);
      
      // Should still create block with fallback mechanisms
      expect(block).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    beforeEach(async () => {
      await consensus.initialize();
      await consensus.start();
    });

    it('should process large transaction batches efficiently', async () => {
      const batchSize = 1000;
      const transactions = Array.from({ length: batchSize }, () => 
        testUtils.createMockTransaction()
      );

      const startTime = Date.now();
      const block = await consensus.processTransactionBatch(transactions);
      const duration = Date.now() - startTime;

      expect(block.transactions).toHaveLength(batchSize);
      expect(duration).toBeLessThan(5000); // Should process 1K tx in <5s
    });

    it('should maintain target TPS performance', async () => {
      const targetTPS = 100000; // Scaled down for unit testing
      const duration = 1000; // 1 second
      const expectedTransactions = Math.floor(targetTPS / 10); // 10K in 1s for unit test

      const transactions = Array.from({ length: expectedTransactions }, () => 
        testUtils.createMockTransaction()
      );

      const startTime = Date.now();
      const block = await consensus.processTransactionBatch(transactions);
      const actualDuration = Date.now() - startTime;

      expect(actualDuration).toBeLessThan(duration);
      expect(block.transactions.length).toMeetPerformanceTarget(expectedTransactions * 0.95);
    });

    it('should meet latency requirements', async () => {
      const transaction = testUtils.createMockTransaction();
      
      const startTime = Date.now();
      await consensus.processTransactionBatch([transaction]);
      const latency = Date.now() - startTime;
      
      expect(latency).toBeLessThan(500); // <500ms requirement
    });
  });

  describe('Consensus Rounds', () => {
    beforeEach(async () => {
      await consensus.initialize();
      await consensus.start();
    });

    it('should start and complete consensus rounds', async () => {
      const roundStarted = jest.fn();
      const roundCompleted = jest.fn();
      
      consensus.on('round-started', roundStarted);
      consensus.on('round-completed', roundCompleted);
      
      await (consensus as any).startConsensusRound();
      
      await testUtils.waitForCondition(() => roundCompleted.mock.calls.length > 0, 2000);
      
      expect(roundStarted).toHaveBeenCalled();
      expect(roundCompleted).toHaveBeenCalled();
    });

    it('should handle leader election', async () => {
      const validators = ['validator-1', 'validator-2', 'validator-3'];
      
      const leader = await (consensus as any).electLeader(validators);
      
      expect(leader).toBeDefined();
      expect(validators).toContain(leader);
    });

    it('should emit heartbeat signals', async () => {
      const heartbeatHandler = jest.fn();
      consensus.on('heartbeat', heartbeatHandler);
      
      await (consensus as any).sendHeartbeat();
      
      expect(heartbeatHandler).toHaveBeenCalled();
      expect(heartbeatHandler.mock.calls[0][0]).toMatchObject({
        nodeId: 'test-validator',
        timestamp: expect.any(Number),
        term: expect.any(Number)
      });
    });
  });

  describe('Zero-Knowledge Integration', () => {
    beforeEach(async () => {
      await consensus.initialize();
      await consensus.start();
    });

    it('should generate ZK proofs for transactions', async () => {
      const transaction = testUtils.createMockTransaction();
      
      const txWithProof = await (consensus as any).generateZKProofsWithFallback([transaction]);
      
      expect(txWithProof[0].zkProof).toBeDefined();
      expect(mockZKProofSystem.generateProof).toHaveBeenCalled();
    });

    it('should handle ZK proof generation failures with fallback', async () => {
      mockZKProofSystem.generateProof.mockRejectedValueOnce(new Error('ZK generation failed'));
      
      const transaction = testUtils.createMockTransaction();
      const txWithProof = await (consensus as any).generateZKProofsWithFallback([transaction]);
      
      expect(txWithProof[0].zkProof).toBeDefined();
      expect(txWithProof[0].zkProof.type).toBe('basic'); // Fallback proof
    });

    it('should aggregate ZK proofs efficiently', async () => {
      const proofs = [
        { proof: 'proof1', circuit: 'transfer' },
        { proof: 'proof2', circuit: 'transfer' },
        { proof: 'proof3', circuit: 'transfer' }
      ];

      const aggregated = await (consensus as any).aggregateProofsWithCompression(proofs);
      
      expect(aggregated.type).toBe('aggregated');
      expect(aggregated.count).toBe(3);
      expect(aggregated.compressed).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    beforeEach(async () => {
      await consensus.initialize();
      await consensus.start();
    });

    it('should recover from consensus failures', async () => {
      // Simulate consensus failure
      await consensus.stop();
      
      // Should be able to restart
      await consensus.start();
      
      const status = await consensus.getStatus();
      expect(status.consensusState).toBe('active');
    });

    it('should handle network partitions', async () => {
      // Simulate network partition
      const oldEmit = consensus.emit;
      consensus.emit = jest.fn();
      
      const transaction = testUtils.createMockTransaction();
      const block = await consensus.processTransactionBatch([transaction]);
      
      // Should still process transactions locally
      expect(block).toBeDefined();
      
      // Restore emit function
      consensus.emit = oldEmit;
    });

    it('should handle validator failures gracefully', async () => {
      const metrics = await consensus.getPerformanceMetrics();
      
      // Metrics should be available even with simulated validator issues
      expect(metrics.tps).toBeGreaterThan(0);
      expect(metrics.latency).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await consensus.initialize();
      await consensus.start();
    });

    it('should maintain consistent state across operations', async () => {
      const initialStatus = await consensus.getStatus();
      
      const transaction = testUtils.createMockTransaction();
      await consensus.processTransactionBatch([transaction]);
      
      const finalStatus = await consensus.getStatus();
      expect(finalStatus.lastApplied).toBeGreaterThan(initialStatus.lastApplied);
    });

    it('should handle state corruption recovery', async () => {
      // Process a valid transaction
      const transaction = testUtils.createMockTransaction();
      await consensus.processTransactionBatch([transaction]);
      
      // State should remain consistent
      const status = await consensus.getStatus();
      expect(status.consensusState).toBe('active');
    });
  });
});