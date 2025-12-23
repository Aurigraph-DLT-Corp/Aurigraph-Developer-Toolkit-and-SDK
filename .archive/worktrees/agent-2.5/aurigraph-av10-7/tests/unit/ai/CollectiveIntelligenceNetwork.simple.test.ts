import 'reflect-metadata';
import { CollectiveIntelligenceNetwork } from '../../../src/ai/CollectiveIntelligenceNetwork';
import { Logger } from '../../../src/core/Logger';

describe('CollectiveIntelligenceNetwork - AV11-14 Core Features', () => {
    let network: CollectiveIntelligenceNetwork;

    beforeEach(() => {
        const logger = new Logger('TestLogger');
        network = new CollectiveIntelligenceNetwork(logger);
    });

    afterEach(async () => {
        try {
            await network.stop();
        } catch (e) {
            // Ignore errors during cleanup
        }
        jest.clearAllMocks();
    });

    describe('AV11-14: Basic Network Operations', () => {
        it('should initialize without errors', async () => {
            expect(network).toBeDefined();
            expect(typeof network.start).toBe('function');
            expect(typeof network.stop).toBe('function');
        });

        it('should start collective intelligence network', async () => {
            await expect(network.start()).resolves.not.toThrow();
        });

        it('should stop collective intelligence network', async () => {
            await network.start();
            await expect(network.stop()).resolves.not.toThrow();
        });

        it('should provide network status', async () => {
            await network.start();
            const status = await network.getNetworkStatus();
            
            expect(status).toBeDefined();
            expect(typeof status.activeNodes).toBe('number');
            expect(typeof status.networkEfficiency).toBe('number');
            expect(typeof status.lastDecisionTime).toBe('number');
        });
    });

    describe('AV11-14: Intelligence Network Features', () => {
        beforeEach(async () => {
            await network.start();
        });

        it('should demonstrate collective decision making', async () => {
            const decision = await network.makeCollectiveDecision('test-decision', {
                priority: 'medium',
                timeout: 5000
            });
            
            expect(decision).toBeDefined();
            expect(decision.consensus).toBeDefined();
            expect(decision.confidence).toBeGreaterThanOrEqual(0);
            expect(decision.confidence).toBeLessThanOrEqual(1);
        });

        it('should handle knowledge distribution', async () => {
            const knowledge = {
                domain: 'test-domain',
                content: 'test knowledge',
                confidence: 0.8,
                source: 'test-source'
            };

            await expect(network.distributeKnowledge(knowledge)).resolves.not.toThrow();
        });

        it('should provide network metrics', async () => {
            const metrics = await network.getNetworkMetrics();
            
            expect(metrics).toBeDefined();
            expect(typeof metrics.totalDecisions).toBe('number');
            expect(typeof metrics.averageConsensusTime).toBe('number');
            expect(typeof metrics.networkHealth).toBe('number');
            expect(metrics.networkHealth).toBeGreaterThanOrEqual(0);
            expect(metrics.networkHealth).toBeLessThanOrEqual(1);
        });

        it('should detect emergent patterns', async () => {
            // Generate some network activity
            for (let i = 0; i < 10; i++) {
                await network.makeCollectiveDecision(`decision-${i}`, {
                    priority: 'low',
                    timeout: 1000
                });
            }

            const patterns = await network.detectEmergentPatterns();
            
            expect(patterns).toBeDefined();
            expect(Array.isArray(patterns.patterns)).toBe(true);
            expect(typeof patterns.emergenceLevel).toBe('number');
        });
    });

    describe('AV11-14: Collaborative Intelligence', () => {
        beforeEach(async () => {
            await network.start();
        });

        it('should facilitate knowledge sharing', async () => {
            const knowledgeItems = [
                { domain: 'consensus', content: 'consensus knowledge', confidence: 0.9 },
                { domain: 'security', content: 'security knowledge', confidence: 0.8 },
                { domain: 'performance', content: 'performance knowledge', confidence: 0.7 }
            ];

            for (const knowledge of knowledgeItems) {
                await expect(network.distributeKnowledge({
                    ...knowledge,
                    source: 'test-agent'
                })).resolves.not.toThrow();
            }
        });

        it('should demonstrate swarm intelligence', async () => {
            const swarmBehavior = await network.demonstrateSwarmBehavior();
            
            expect(swarmBehavior).toBeDefined();
            expect(typeof swarmBehavior.coordination).toBe('number');
            expect(typeof swarmBehavior.adaptability).toBe('number');
            expect(typeof swarmBehavior.efficiency).toBe('number');
        });

        it('should handle multiple concurrent decisions', async () => {
            const decisions = await Promise.all([
                network.makeCollectiveDecision('concurrent-decision-1', { priority: 'medium', timeout: 3000 }),
                network.makeCollectiveDecision('concurrent-decision-2', { priority: 'medium', timeout: 3000 }),
                network.makeCollectiveDecision('concurrent-decision-3', { priority: 'medium', timeout: 3000 })
            ]);

            expect(decisions).toHaveLength(3);
            decisions.forEach(decision => {
                expect(decision).toBeDefined();
                expect(decision.consensus).toBeDefined();
                expect(decision.confidence).toBeGreaterThanOrEqual(0);
            });
        });

        it('should optimize collective performance', async () => {
            const initialMetrics = await network.getNetworkMetrics();
            
            // Trigger performance optimization
            await network.optimizeNetworkPerformance();
            
            const optimizedMetrics = await network.getNetworkMetrics();
            
            expect(optimizedMetrics.networkHealth).toBeGreaterThanOrEqual(initialMetrics.networkHealth);
        });
    });

    describe('AV11-14: Learning and Adaptation', () => {
        beforeEach(async () => {
            await network.start();
        });

        it('should learn from decision outcomes', async () => {
            const decision = await network.makeCollectiveDecision('learning-decision', {
                priority: 'high',
                timeout: 5000
            });

            // Provide feedback on decision outcome
            await network.provideFeedback(decision.id, {
                success: true,
                effectiveness: 0.8,
                learningPoints: ['effective collaboration', 'good consensus']
            });

            const metrics = await network.getNetworkMetrics();
            expect(metrics.learningRate).toBeGreaterThan(0);
        });

        it('should adapt to changing conditions', async () => {
            const adaptationResult = await network.adaptToConditions({
                networkLoad: 0.8,
                responseTimeTarget: 1000,
                accuracyRequirement: 0.9
            });

            expect(adaptationResult).toBeDefined();
            expect(adaptationResult.adapted).toBe(true);
            expect(adaptationResult.adaptationStrategies).toBeDefined();
        });

        it('should demonstrate continuous improvement', async () => {
            const baselineMetrics = await network.getNetworkMetrics();
            
            // Simulate learning cycles
            for (let i = 0; i < 5; i++) {
                const decision = await network.makeCollectiveDecision(`improvement-decision-${i}`, {
                    priority: 'medium',
                    timeout: 2000
                });
                
                await network.provideFeedback(decision.id, {
                    success: true,
                    effectiveness: 0.7 + (i * 0.05), // Gradually improving effectiveness
                    learningPoints: [`improvement cycle ${i}`]
                });
            }
            
            const improvedMetrics = await network.getNetworkMetrics();
            
            // Network should show signs of improvement
            expect(improvedMetrics.averageConsensusTime).toBeLessThanOrEqual(baselineMetrics.averageConsensusTime + 1000);
            expect(improvedMetrics.networkHealth).toBeGreaterThanOrEqual(baselineMetrics.networkHealth);
        });
    });

    describe('AV11-14: Performance and Scalability', () => {
        beforeEach(async () => {
            await network.start();
        });

        it('should handle high decision volume', async () => {
            const startTime = Date.now();
            const decisionCount = 50;
            
            const decisions = await Promise.all(
                Array.from({ length: decisionCount }, (_, i) => 
                    network.makeCollectiveDecision(`volume-decision-${i}`, {
                        priority: 'low',
                        timeout: 2000
                    })
                )
            );
            
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            
            expect(decisions).toHaveLength(decisionCount);
            expect(processingTime).toBeLessThan(60000); // Should complete within 1 minute
            
            const successfulDecisions = decisions.filter(d => d.consensus !== undefined);
            expect(successfulDecisions.length).toBeGreaterThan(decisionCount * 0.8); // 80% success rate
        });

        it('should maintain performance under load', async () => {
            // Simulate sustained load
            const loadDuration = 10; // seconds
            const startTime = Date.now();
            const decisions = [];
            
            while (Date.now() - startTime < loadDuration * 1000) {
                const decision = await network.makeCollectiveDecision(`load-decision-${decisions.length}`, {
                    priority: 'medium',
                    timeout: 1000
                });
                decisions.push(decision);
            }
            
            const metrics = await network.getNetworkMetrics();
            
            expect(decisions.length).toBeGreaterThan(5); // Should make multiple decisions
            expect(metrics.networkHealth).toBeGreaterThan(0.6); // Should maintain reasonable health
        });

        it('should scale decision complexity efficiently', async () => {
            const complexDecision = await network.makeCollectiveDecision('complex-decision', {
                priority: 'high',
                timeout: 10000,
                complexity: 'high',
                requiredConsensus: 0.9
            });

            expect(complexDecision).toBeDefined();
            expect(complexDecision.confidence).toBeGreaterThan(0.5);
        });
    });

    describe('AV11-14: Error Handling and Resilience', () => {
        beforeEach(async () => {
            await network.start();
        });

        it('should handle decision timeouts gracefully', async () => {
            const decision = await network.makeCollectiveDecision('timeout-decision', {
                priority: 'low',
                timeout: 1 // Very short timeout
            });

            expect(decision).toBeDefined();
            // Should handle timeout gracefully, either with partial consensus or timeout indication
        });

        it('should recover from knowledge corruption', async () => {
            // Distribute some knowledge
            await network.distributeKnowledge({
                domain: 'test-corruption',
                content: 'initial knowledge',
                confidence: 0.8,
                source: 'test-agent'
            });

            // Simulate corruption recovery
            const recovery = await network.recoverFromKnowledgeCorruption('test-corruption');
            
            expect(recovery).toBeDefined();
            expect(recovery.recovered).toBe(true);
        });

        it('should maintain network stability during node failures', async () => {
            const initialStatus = await network.getNetworkStatus();
            
            // Simulate node failure and recovery
            await network.simulateNodeFailure('test-node-1');
            
            const failureStatus = await network.getNetworkStatus();
            expect(failureStatus.activeNodes).toBeLessThanOrEqual(initialStatus.activeNodes);
            
            // Network should remain operational
            const testDecision = await network.makeCollectiveDecision('failure-test-decision', {
                priority: 'medium',
                timeout: 5000
            });
            
            expect(testDecision).toBeDefined();
            expect(testDecision.consensus).toBeDefined();
        });

        it('should handle invalid knowledge gracefully', async () => {
            const invalidKnowledge = {
                domain: '',
                content: '',
                confidence: -1, // Invalid confidence
                source: ''
            };

            await expect(network.distributeKnowledge(invalidKnowledge)).resolves.not.toThrow();
            
            // Network should still be functional
            const status = await network.getNetworkStatus();
            expect(status.networkEfficiency).toBeGreaterThan(0);
        });
    });
});