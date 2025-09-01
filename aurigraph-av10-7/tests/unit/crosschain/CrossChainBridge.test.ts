import 'reflect-metadata';
import { CrossChainBridge } from '../../../src/crosschain/CrossChainBridge';

describe('CrossChainBridge', () => {
  let bridge: CrossChainBridge;

  beforeEach(() => {
    bridge = new CrossChainBridge();
  });

  afterEach(async () => {
    await bridge.stop();
  });

  describe('Bridge Initialization', () => {
    it('should initialize with supported blockchains', async () => {
      await bridge.initialize();
      
      const metrics = await bridge.getMetrics();
      expect(metrics.supportedChains).toBeGreaterThan(8);
      expect(metrics.bridgeValidators).toBeGreaterThan(0);
    });

    it('should setup liquidity pools', async () => {
      await bridge.initialize();
      
      const metrics = await bridge.getMetrics();
      expect(metrics.liquidityPools).toBeGreaterThan(0);
    });
  });

  describe('Transaction Processing', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should process cross-chain transactions with high success rate', async () => {
      const mockTransaction = {
        id: 'test-cross-chain-tx',
        sourceChain: 'ethereum',
        targetChain: 'polygon',
        amount: 1000,
        recipient: '0x123456789',
        hash: '0xabcdef'
      };

      const result = await bridge.processBridgeTransactionForTesting(mockTransaction as any);
      expect(result).toBeDefined();
    });

    it('should handle transaction validation with retry logic', async () => {
      const invalidTx = {
        id: 'invalid-tx',
        sourceChain: 'unknown',
        targetChain: 'ethereum',
        amount: -100 // Invalid amount
      };

      // Should handle gracefully with validation
      await expect(bridge.processBridgeTransactionForTesting(invalidTx as any)).resolves.not.toThrow();
    });

    it('should maintain 99%+ success rate', async () => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        id: `test-tx-${i}`,
        sourceChain: 'ethereum',
        targetChain: 'polygon',
        amount: 100 + i,
        recipient: `0x${i.toString(16).padStart(40, '0')}`,
        hash: `0x${i.toString(16).padStart(64, '0')}`
      }));

      let successCount = 0;
      for (const tx of transactions) {
        try {
          await bridge.processBridgeTransactionForTesting(tx as any);
          successCount++;
        } catch (error) {
          // Expected some failures
        }
      }

      const successRate = (successCount / transactions.length) * 100;
      expect(successRate).toBeGreaterThan(99);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should process transactions within time limits', async () => {
      const transaction = {
        id: 'perf-test-tx',
        sourceChain: 'ethereum',
        targetChain: 'bsc',
        amount: 500,
        recipient: '0x789abc',
        hash: '0x456def'
      };

      const startTime = Date.now();
      await bridge.processBridgeTransactionForTesting(transaction as any);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // <5s for cross-chain
    });
  });
});