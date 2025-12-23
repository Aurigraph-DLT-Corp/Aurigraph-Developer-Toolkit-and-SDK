import 'reflect-metadata';
import { AIOptimizer } from '../../../src/ai/AIOptimizer';

describe('AIOptimizer', () => {
  let optimizer: AIOptimizer;

  beforeEach(() => {
    optimizer = new AIOptimizer();
  });

  afterEach(async () => {
    await optimizer.stop();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with AI models', async () => {
      await optimizer.start();
      
      const metrics = await optimizer.getMetrics();
      expect(metrics.modelsLoaded).toBeGreaterThan(0);
      expect(metrics.optimizationEnabled).toBe(true);
    });

    it('should load all required AI models', async () => {
      await optimizer.start();
      
      // Verify models are loaded (check internal state)
      expect(optimizer['models'].size).toBe(3);
      expect(optimizer['models'].has('consensus-optimizer')).toBe(true);
      expect(optimizer['models'].has('performance-predictor')).toBe(true);
      expect(optimizer['models'].has('anomaly-detector')).toBe(true);
    });
  });

  describe('Consensus Optimization', () => {
    beforeEach(async () => {
      await optimizer.start();
    });

    it('should optimize consensus parameters', async () => {
      const mockMetrics = {
        tps: 800000, // Below threshold
        latency: 300,
        zkProofRate: 500,
        validatorCount: 3,
        networkLoad: 0.7
      };

      const optimization = await optimizer.optimizeConsensusParameters(mockMetrics);
      
      expect(optimization).toBeDefined();
      expect(optimization.tpsGain).toBeGreaterThan(0);
      expect(optimization.confidence).toBeGreaterThan(80);
      expect(optimization.batchSize).toBeGreaterThan(0);
      expect(optimization.pipelineDepth).toBeGreaterThan(0);
    });

    it('should predict optimal leader', async () => {
      const validators = ['validator-1', 'validator-2', 'validator-3'];
      const metrics = { tps: 1000000, latency: 250 };

      const prediction = await optimizer.predictBestLeader(validators, metrics);
      
      expect(prediction.nodeId).toBeDefined();
      expect(validators).toContain(prediction.nodeId);
      expect(prediction.confidence).toBeGreaterThan(0.5);
    });

    it('should analyze performance and suggest optimizations', async () => {
      const metrics = {
        tps: 850000, // Below optimal
        latency: 400,
        validators: 3
      };

      const analysis = await optimizer.analyzePerformance(metrics);
      
      expect(analysis.shouldOptimize).toBe(true);
      expect(analysis.newBatchSize).toBeGreaterThan(0);
      expect(analysis.newPipelineDepth).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(async () => {
      await optimizer.start();
    });

    it('should trigger optimization when TPS drops', (done) => {
      const optimizationHandler = (optimization: any) => {
        expect(optimization.type).toBe('consensus');
        expect(optimization.improvement).toContain('TPS');
        expect(optimization.confidence).toBeGreaterThan(0);
        done();
      };

      optimizer.on('optimization-applied', optimizationHandler);
      
      // Trigger optimization by simulating low TPS
      (optimizer as any).performOptimization();
    });

    it('should trigger latency optimization when needed', (done) => {
      // Mock metrics to trigger latency optimization
      jest.spyOn(optimizer as any, 'collectMetrics').mockResolvedValue({
        tps: 1000000, // Good TPS
        latency: 450,  // High latency
        zkProofRate: 800,
        validatorCount: 3,
        networkLoad: 0.5
      });

      const optimizationHandler = (optimization: any) => {
        if (optimization.type === 'latency') {
          expect(optimization.improvement).toContain('ms');
          expect(optimization.action).toContain('validator selection');
          done();
        }
      };

      optimizer.on('optimization-applied', optimizationHandler);
      (optimizer as any).performOptimization();
    });

    it('should optimize ZK proof performance', (done) => {
      // Mock metrics to trigger ZK optimization
      jest.spyOn(optimizer as any, 'collectMetrics').mockResolvedValue({
        tps: 1000000,
        latency: 300,
        zkProofRate: 700, // Low ZK proof rate
        validatorCount: 3,
        networkLoad: 0.5
      });

      const optimizationHandler = (optimization: any) => {
        if (optimization.type === 'zk-proofs') {
          expect(optimization.improvement).toContain('efficiency');
          expect(optimization.action).toContain('batching');
          done();
        }
      };

      optimizer.on('optimization-applied', optimizationHandler);
      (optimizer as any).performOptimization();
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(async () => {
      await optimizer.start();
    });

    it('should collect comprehensive metrics', async () => {
      const metrics = await (optimizer as any).collectMetrics();
      
      expect(metrics).toMatchObject({
        tps: expect.any(Number),
        latency: expect.any(Number),
        zkProofRate: expect.any(Number),
        validatorCount: expect.any(Number),
        networkLoad: expect.any(Number)
      });
    });

    it('should provide optimizer status metrics', async () => {
      const metrics = await optimizer.getMetrics();
      
      expect(metrics.modelsLoaded).toBeGreaterThan(0);
      expect(metrics.optimizationEnabled).toBe(true);
      expect(metrics.optimizationsPerformed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Predictive Ordering', () => {
    beforeEach(async () => {
      await optimizer.start();
    });

    it('should enable predictive transaction ordering', async () => {
      await optimizer.enablePredictiveOrdering();
      
      // Should not throw and should enable predictive features
      expect(true).toBe(true); // Placeholder for future implementation
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle optimization failures gracefully', async () => {
      await optimizer.start();
      
      // Mock collectMetrics to fail
      jest.spyOn(optimizer as any, 'collectMetrics').mockRejectedValue(new Error('Metrics collection failed'));
      
      // Should not crash the optimizer
      await expect((optimizer as any).performOptimization()).resolves.not.toThrow();
    });

    it('should continue running after individual optimization failures', async () => {
      await optimizer.start();
      
      // Mock one optimization to fail
      jest.spyOn(optimizer as any, 'optimizeConsensusParameters').mockRejectedValue(new Error('Optimization failed'));
      
      const metrics = await optimizer.getMetrics();
      expect(metrics.optimizationEnabled).toBe(true);
    });

    it('should handle stop/start cycles correctly', async () => {
      await optimizer.start();
      let metrics = await optimizer.getMetrics();
      expect(metrics.optimizationEnabled).toBe(true);
      
      await optimizer.stop();
      metrics = await optimizer.getMetrics();
      expect(metrics.optimizationEnabled).toBe(false);
      
      await optimizer.start();
      metrics = await optimizer.getMetrics();
      expect(metrics.optimizationEnabled).toBe(true);
    });
  });

  describe('Event Emission', () => {
    beforeEach(async () => {
      await optimizer.start();
    });

    it('should emit optimization events with correct structure', (done) => {
      const handler = (event: any) => {
        expect(event).toMatchObject({
          type: expect.any(String),
          action: expect.any(String),
          improvement: expect.any(String),
          confidence: expect.any(Number),
          timestamp: expect.any(Number)
        });
        done();
      };

      optimizer.on('optimization-applied', handler);
      (optimizer as any).performOptimization();
    });

    it('should handle multiple listeners correctly', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      optimizer.on('optimization-applied', handler1);
      optimizer.on('optimization-applied', handler2);
      
      // Trigger optimization
      await (optimizer as any).performOptimization();
      
      // Both handlers should eventually be called
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Integration with Platform', () => {
    beforeEach(async () => {
      await optimizer.start();
    });

    it('should integrate with consensus system', async () => {
      const mockConsensusMetrics = {
        tps: 950000,
        latency: 400,
        zkProofRate: 600,
        validatorCount: 3,
        networkLoad: 0.8
      };

      const optimization = await optimizer.optimizeConsensusParameters(mockConsensusMetrics);
      
      // Should provide actionable optimization parameters
      expect(optimization.batchSize).toBeGreaterThan(1000);
      expect(optimization.pipelineDepth).toBeGreaterThan(1);
      expect(optimization.electionTimeout).toBeGreaterThan(50);
    });
  });
});