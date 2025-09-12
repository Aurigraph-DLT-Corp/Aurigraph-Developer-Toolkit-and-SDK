import 'reflect-metadata';
import { QuantumShardManager } from '../../../src/consensus/QuantumShardManager';
import { QuantumCryptoManagerV2 } from '../../../src/crypto/QuantumCryptoManagerV2';

describe('QuantumShardManager - AV11-8 Core Features', () => {
    let manager: QuantumShardManager;
    let mockQuantumCrypto: QuantumCryptoManagerV2;

    beforeEach(() => {
        mockQuantumCrypto = new QuantumCryptoManagerV2();
        manager = new QuantumShardManager(mockQuantumCrypto);
    });

    afterEach(async () => {
        try {
            await manager.stop();
        } catch (e) {
            // Ignore errors during cleanup
        }
        jest.clearAllMocks();
    });

    describe('AV11-8: Basic Quantum Shard Operations', () => {
        it('should initialize without errors', async () => {
            expect(manager).toBeDefined();
            expect(typeof manager.start).toBe('function');
            expect(typeof manager.stop).toBe('function');
        });

        it('should start quantum shard manager', async () => {
            await expect(manager.start()).resolves.not.toThrow();
        });

        it('should stop quantum shard manager', async () => {
            await manager.start();
            await expect(manager.stop()).resolves.not.toThrow();
        });

        it('should provide performance metrics', async () => {
            await manager.start();
            const metrics = await manager.getPerformanceMetrics();
            
            expect(metrics).toBeDefined();
            expect(typeof metrics.averageCoherence).toBe('number');
            expect(typeof metrics.processingThroughput).toBe('number');
            expect(typeof metrics.interferenceOptimizationRatio).toBe('number');
        });

        it('should handle shard distribution', async () => {
            await manager.start();
            
            const mockTransaction = {
                id: 'test-tx-001',
                from: 'sender-1',
                to: 'receiver-1',
                amount: 100,
                timestamp: Date.now(),
                signature: 'mock-signature',
                type: 'transfer' as const
            };

            // Should not throw when processing transaction
            await expect(manager.processTransaction(mockTransaction)).resolves.not.toThrow();
        });
    });

    describe('AV11-8: Quantum Enhancement Features', () => {
        beforeEach(async () => {
            await manager.start();
        });

        it('should provide quantum metrics', async () => {
            const metrics = await manager.getPerformanceMetrics();
            
            expect(metrics).toBeDefined();
            expect(metrics.averageCoherence).toBeGreaterThanOrEqual(0);
            expect(metrics.averageCoherence).toBeLessThanOrEqual(1);
            expect(metrics.processingThroughput).toBeGreaterThanOrEqual(0);
            expect(metrics.interferenceOptimizationRatio).toBeGreaterThanOrEqual(0);
            expect(metrics.interferenceOptimizationRatio).toBeLessThanOrEqual(1);
        });

        it('should handle multiple transactions', async () => {
            const transactions = [
                {
                    id: 'batch-tx-1',
                    from: 'sender-1',
                    to: 'receiver-1',
                    amount: 100,
                    timestamp: Date.now(),
                    signature: 'signature-1',
                    type: 'transfer' as const
                },
                {
                    id: 'batch-tx-2',
                    from: 'sender-2',
                    to: 'receiver-2',
                    amount: 200,
                    timestamp: Date.now(),
                    signature: 'signature-2',
                    type: 'transfer' as const
                }
            ];

            for (const tx of transactions) {
                await expect(manager.processTransaction(tx)).resolves.not.toThrow();
            }
        });

        it('should maintain quantum coherence', async () => {
            const metrics1 = await manager.getPerformanceMetrics();
            
            // Process some transactions
            for (let i = 0; i < 5; i++) {
                const tx = {
                    id: `coherence-tx-${i}`,
                    from: `sender-${i}`,
                    to: `receiver-${i}`,
                    amount: 100 + i,
                    timestamp: Date.now(),
                    signature: `signature-${i}`,
                    type: 'transfer' as const
                };
                await manager.processTransaction(tx);
            }

            const metrics2 = await manager.getPerformanceMetrics();
            
            // Coherence should remain within acceptable bounds
            expect(metrics2.averageCoherence).toBeGreaterThan(0.5);
            expect(metrics2.processingThroughput).toBeGreaterThanOrEqual(metrics1.processingThroughput);
        });
    });

    describe('AV11-8: Performance and Scalability', () => {
        beforeEach(async () => {
            await manager.start();
        });

        it('should handle high transaction volumes', async () => {
            const startTime = Date.now();
            const batchSize = 100;
            
            const transactions = Array.from({ length: batchSize }, (_, i) => ({
                id: `perf-tx-${i}`,
                from: `sender-${i % 10}`,
                to: `receiver-${i % 10}`,
                amount: Math.floor(Math.random() * 1000),
                timestamp: Date.now(),
                signature: `signature-${i}`,
                type: 'transfer' as const
            }));

            // Process all transactions
            await Promise.all(transactions.map(tx => manager.processTransaction(tx)));
            
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            const tps = batchSize / (processingTime / 1000);
            
            // Should achieve reasonable throughput
            expect(tps).toBeGreaterThan(10); // Basic performance threshold
            expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
        });

        it('should optimize shard distribution', async () => {
            const initialMetrics = await manager.getPerformanceMetrics();
            
            // Process diverse transactions to trigger optimization
            for (let i = 0; i < 20; i++) {
                const tx = {
                    id: `optimize-tx-${i}`,
                    from: `sender-${i % 5}`,
                    to: `receiver-${i % 7}`,
                    amount: Math.floor(Math.random() * 1000),
                    timestamp: Date.now(),
                    signature: `signature-${i}`,
                    type: 'transfer' as const
                };
                await manager.processTransaction(tx);
            }

            const finalMetrics = await manager.getPerformanceMetrics();
            
            // Optimization should maintain or improve metrics
            expect(finalMetrics.interferenceOptimizationRatio).toBeGreaterThanOrEqual(initialMetrics.interferenceOptimizationRatio - 0.1);
            expect(finalMetrics.averageCoherence).toBeGreaterThan(0.7);
        });

        it('should maintain stable performance over time', async () => {
            const metrics = [];
            
            // Collect metrics over multiple processing cycles
            for (let cycle = 0; cycle < 5; cycle++) {
                // Process some transactions
                for (let i = 0; i < 10; i++) {
                    const tx = {
                        id: `stability-tx-${cycle}-${i}`,
                        from: `sender-${i}`,
                        to: `receiver-${i}`,
                        amount: 100,
                        timestamp: Date.now(),
                        signature: `signature-${cycle}-${i}`,
                        type: 'transfer' as const
                    };
                    await manager.processTransaction(tx);
                }
                
                const cycleMetrics = await manager.getPerformanceMetrics();
                metrics.push(cycleMetrics);
            }
            
            // Performance should remain stable
            metrics.forEach(metric => {
                expect(metric.averageCoherence).toBeGreaterThan(0.6);
                expect(metric.processingThroughput).toBeGreaterThanOrEqual(0);
            });
            
            // No dramatic degradation
            const firstMetric = metrics[0];
            const lastMetric = metrics[metrics.length - 1];
            expect(lastMetric.averageCoherence).toBeGreaterThan(firstMetric.averageCoherence * 0.8);
        });
    });

    describe('AV11-8: Error Handling and Recovery', () => {
        beforeEach(async () => {
            await manager.start();
        });

        it('should handle invalid transactions gracefully', async () => {
            const invalidTx = {
                id: '',
                from: '',
                to: '',
                amount: -100,
                timestamp: 0,
                signature: '',
                type: 'transfer' as const
            };

            // Should handle invalid transaction without crashing
            await expect(manager.processTransaction(invalidTx)).resolves.not.toThrow();
        });

        it('should recover from processing errors', async () => {
            const validTx = {
                id: 'recovery-tx-001',
                from: 'sender-1',
                to: 'receiver-1',
                amount: 100,
                timestamp: Date.now(),
                signature: 'valid-signature',
                type: 'transfer' as const
            };

            // Process a valid transaction after potential errors
            await expect(manager.processTransaction(validTx)).resolves.not.toThrow();
            
            const metrics = await manager.getPerformanceMetrics();
            expect(metrics.averageCoherence).toBeGreaterThan(0.5);
        });

        it('should maintain system stability during stress', async () => {
            // Generate a mix of valid and edge-case transactions
            const transactions = [];
            
            for (let i = 0; i < 50; i++) {
                transactions.push({
                    id: i % 10 === 0 ? '' : `stress-tx-${i}`, // Some invalid IDs
                    from: `sender-${i % 5}`,
                    to: `receiver-${i % 3}`,
                    amount: i % 7 === 0 ? 0 : Math.floor(Math.random() * 1000), // Some zero amounts
                    timestamp: Date.now(),
                    signature: `signature-${i}`,
                    type: 'transfer' as const
                });
            }

            // Process all transactions - should not crash system
            for (const tx of transactions) {
                await manager.processTransaction(tx);
            }

            // System should still be operational
            const finalMetrics = await manager.getPerformanceMetrics();
            expect(finalMetrics.averageCoherence).toBeGreaterThan(0.4); // Reduced but stable
            expect(finalMetrics.processingThroughput).toBeGreaterThanOrEqual(0);
        });
    });
});