import 'reflect-metadata';
import { CrossChainBridge } from '../../src/crosschain/CrossChainBridge';

describe('Wormhole Bridge Integration', () => {
  let bridge: CrossChainBridge;

  beforeEach(() => {
    bridge = new CrossChainBridge();
  });

  afterEach(async () => {
    await bridge.stop();
  });

  describe('Wormhole Connection', () => {
    it('should connect to Wormhole protocol', async () => {
      await bridge.initialize();
      
      const wormholeStatus = await bridge.getWormholeStatus();
      expect(wormholeStatus.enabled).toBe(true);
      expect(wormholeStatus.status).toBe('connected');
      expect(wormholeStatus.supportedChains).toBeGreaterThan(0);
    });

    it('should check route availability', async () => {
      await bridge.initialize();
      
      const ethereumToPolygon = await bridge.checkWormholeRouteAvailability('ethereum', 'polygon', 'USDC');
      const ethereumToSolana = await bridge.checkWormholeRouteAvailability('ethereum', 'solana', 'USDC');
      
      expect(ethereumToPolygon).toBe(true);
      expect(ethereumToSolana).toBe(true);
    });

    it('should handle unsupported chains gracefully', async () => {
      await bridge.initialize();
      
      const unsupportedRoute = await bridge.checkWormholeRouteAvailability('unsupported-chain', 'ethereum', 'USDC');
      expect(unsupportedRoute).toBe(false);
    });
  });

  describe('Wormhole Bridge Transfers', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should bridge assets using Wormhole', async () => {
      const bridgePromise = bridge.bridgeAsset(
        'ethereum',
        'polygon', 
        'USDC',
        '1000',
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321'
      );

      const tx = await bridgePromise;
      
      expect(tx).toBeDefined();
      expect(tx.sourceChain).toBe('ethereum');
      expect(tx.targetChain).toBe('polygon');
      expect(tx.asset).toBe('USDC');
      expect(tx.amount).toBe('1000');
    });

    it('should fallback to native bridge when Wormhole fails', async () => {
      // Test fallback mechanism
      const tx = await bridge.bridgeAsset(
        'ethereum',
        'unsupported-chain', // This should trigger fallback
        'ETH',
        '0.5',
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321'
      );

      expect(tx).toBeDefined();
      expect(tx.status).toBeDefined();
    });
  });

  describe('Performance with Wormhole', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should maintain high throughput with Wormhole integration', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        bridge.bridgeAsset(
          'ethereum',
          'polygon',
          'USDC',
          `${100 + i}`,
          `0x${i.toString(16).padStart(40, '0')}`,
          `0x${(i + 1000).toString(16).padStart(40, '0')}`
        )
      );

      const results = await Promise.allSettled(promises);
      const duration = Date.now() - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(8); // At least 80% success
      expect(duration).toBeLessThan(10000); // Complete in <10s
    });
  });
});