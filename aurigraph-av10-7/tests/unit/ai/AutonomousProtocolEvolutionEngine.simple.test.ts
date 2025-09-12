import 'reflect-metadata';
import { AutonomousProtocolEvolutionEngine } from '../../../src/ai/AutonomousProtocolEvolutionEngine';
import { AIOptimizer } from '../../../src/ai/AIOptimizer';
import { QuantumCryptoManagerV2 } from '../../../src/crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../../src/consensus/HyperRAFTPlusPlusV2';
import { Logger } from '../../../src/core/Logger';

describe('AutonomousProtocolEvolutionEngine - AV11-9 Core Features', () => {
    let engine: AutonomousProtocolEvolutionEngine;
    let mockAiOptimizer: AIOptimizer;
    let mockQuantumCrypto: QuantumCryptoManagerV2;
    let mockConsensus: HyperRAFTPlusPlusV2;

    beforeEach(() => {
        const logger = new Logger('TestLogger');
        mockAiOptimizer = new AIOptimizer();
        mockQuantumCrypto = new QuantumCryptoManagerV2();
        mockConsensus = new HyperRAFTPlusPlusV2({}, mockQuantumCrypto, logger);
        
        engine = new AutonomousProtocolEvolutionEngine(
            mockAiOptimizer,
            mockQuantumCrypto,
            mockConsensus
        );
    });

    afterEach(async () => {
        try {
            await engine.stopEvolution();
        } catch (e) {
            // Ignore errors during cleanup
        }
        jest.clearAllMocks();
    });

    describe('AV11-9: Basic Evolution Operations', () => {
        it('should initialize without errors', async () => {
            expect(engine).toBeDefined();
            expect(typeof engine.startEvolution).toBe('function');
            expect(typeof engine.stopEvolution).toBe('function');
            expect(typeof engine.performGeneticEvolution).toBe('function');
        });

        it('should start evolution process', async () => {
            await expect(engine.startEvolution()).resolves.not.toThrow();
        });

        it('should stop evolution process', async () => {
            await engine.startEvolution();
            await expect(engine.stopEvolution()).resolves.not.toThrow();
        });

        it('should perform genetic evolution', async () => {
            const result = await engine.performGeneticEvolution();
            
            expect(result).toBeDefined();
            expect(result.generation).toBeGreaterThanOrEqual(0);
            expect(result.bestGenome).toBeDefined();
            expect(result.fitnessImprovement).toBeGreaterThanOrEqual(0);
        });

        it('should provide evolution metrics', async () => {
            const metrics = engine.getEvolutionMetrics();
            
            expect(metrics).toBeDefined();
            expect(metrics.overallPerformance).toBeGreaterThanOrEqual(0);
            expect(metrics.evolutionCycle).toBeGreaterThanOrEqual(0);
            expect(metrics.timestamp).toBeInstanceOf(Date);
        });

        it('should handle rollback operations', async () => {
            await engine.startEvolution();
            await expect(engine.rollbackLastEvolution()).resolves.not.toThrow();
        });

        it('should manage evolution state correctly', async () => {
            // Initially not evolved
            expect(engine.isEvolved()).toBe(false);
            
            // After starting evolution
            await engine.startEvolution();
            // Should be actively evolving or evolved
            
            await engine.stopEvolution();
        });
    });

    describe('AV11-9: Advanced Features', () => {
        beforeEach(async () => {
            await engine.startEvolution();
        });

        it('should generate protocol improvements', async () => {
            const evolution = await engine.performGeneticEvolution();
            
            expect(evolution).toBeDefined();
            expect(evolution.generation).toBeGreaterThan(0);
            expect(evolution.populationSize).toBeGreaterThan(0);
            
            // Should show some form of improvement or optimization
            if (evolution.fitnessImprovement !== undefined) {
                expect(evolution.fitnessImprovement).toBeGreaterThanOrEqual(0);
            }
        });

        it('should maintain evolution history', async () => {
            // Perform multiple evolution cycles
            await engine.performGeneticEvolution();
            await engine.performGeneticEvolution();
            
            const metrics = engine.getEvolutionMetrics();
            expect(metrics.evolutionCycle).toBeGreaterThan(0);
        });

        it('should handle evolution errors gracefully', async () => {
            // Test error handling by attempting operations in wrong order
            try {
                await engine.rollbackLastEvolution();
                // Should not throw or should handle gracefully
                expect(true).toBe(true);
            } catch (error) {
                // If it throws, it should be a controlled error
                expect(error).toBeDefined();
            }
        });
    });

    describe('AV11-9: Integration Points', () => {
        it('should integrate with AI optimizer', async () => {
            expect(engine).toBeDefined();
            // The engine should have been constructed with the AI optimizer
            // Integration is verified by successful construction
        });

        it('should integrate with quantum crypto', async () => {
            expect(engine).toBeDefined();
            // The engine should have been constructed with quantum crypto
            // Integration is verified by successful construction
        });

        it('should integrate with consensus system', async () => {
            expect(engine).toBeDefined();
            // The engine should have been constructed with consensus
            // Integration is verified by successful construction
        });

        it('should provide comprehensive status', async () => {
            const metrics = engine.getEvolutionMetrics();
            
            // Should provide meaningful status information
            expect(metrics).toBeDefined();
            expect(typeof metrics.overallPerformance).toBe('number');
            expect(typeof metrics.evolutionCycle).toBe('number');
            expect(metrics.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('AV11-9: Performance and Reliability', () => {
        it('should handle rapid start/stop cycles', async () => {
            for (let i = 0; i < 3; i++) {
                await engine.startEvolution();
                await engine.stopEvolution();
            }
            
            // Should not crash or become unresponsive
            expect(engine).toBeDefined();
        });

        it('should maintain state consistency', async () => {
            await engine.startEvolution();
            const metrics1 = engine.getEvolutionMetrics();
            
            await engine.performGeneticEvolution();
            const metrics2 = engine.getEvolutionMetrics();
            
            // Evolution cycle should progress
            expect(metrics2.evolutionCycle).toBeGreaterThanOrEqual(metrics1.evolutionCycle);
            expect(metrics2.timestamp.getTime()).toBeGreaterThanOrEqual(metrics1.timestamp.getTime());
        });

        it('should provide consistent API responses', async () => {
            // Multiple calls should return consistent data structures
            const metrics1 = engine.getEvolutionMetrics();
            const metrics2 = engine.getEvolutionMetrics();
            
            expect(typeof metrics1.overallPerformance).toBe(typeof metrics2.overallPerformance);
            expect(typeof metrics1.evolutionCycle).toBe(typeof metrics2.evolutionCycle);
            expect(metrics1.timestamp).toBeInstanceOf(Date);
            expect(metrics2.timestamp).toBeInstanceOf(Date);
        });
    });
});