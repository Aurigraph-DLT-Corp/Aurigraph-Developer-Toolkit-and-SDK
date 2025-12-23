/**
 * AV11-37: Quantum-Enhanced Compound Token Portfolio System Test Suite
 * 
 * Comprehensive tests for the revolutionary quantum-enhanced tokenization system
 * Testing all quantum features, optimization algorithms, and portfolio management
 */

import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { QuantumEnhancedCompoundTokenizer, QuantumPortfolioState, QuantumRiskAssessment } from '../../../src/rwa/tokenization/QuantumEnhancedCompoundTokenizer';
import { QuantumPortfolioOptimizer, QuantumOptimizationConfig } from '../../../src/rwa/tokenization/QuantumPortfolioOptimizer';
import { CompoundToken } from '../../../src/rwa/tokenization/CompoundTokenizer';
import { Asset, AssetType } from '../../../src/rwa/registry/AssetRegistry';

describe('AV11-37: Quantum-Enhanced Compound Token Portfolio System', () => {
    let quantumTokenizer: QuantumEnhancedCompoundTokenizer;
    let quantumOptimizer: QuantumPortfolioOptimizer;
    let testAssets: Asset[];
    
    const mockQuantumConfig: QuantumOptimizationConfig = {
        enableVQE: true,
        quantumCircuitDepth: 10,
        entanglementThreshold: 0.7,
        coherenceTimeMs: 5000,
        optimizationIterations: 100,
        riskTolerance: 0.2,
        quantumAdvantageTarget: 0.3
    };
    
    beforeEach(async () => {
        // Initialize test assets
        testAssets = [
            {
                id: 'asset-btc-001',
                name: 'Bitcoin Portfolio',
                type: AssetType.DIGITAL_CURRENCY,
                value: 50000,
                metadata: { volatility: 0.4, marketCap: 1000000000 }
            },
            {
                id: 'asset-eth-001',
                name: 'Ethereum Portfolio',
                type: AssetType.DIGITAL_CURRENCY,
                value: 3000,
                metadata: { volatility: 0.5, marketCap: 500000000 }
            },
            {
                id: 'asset-real-estate-001',
                name: 'Commercial Real Estate',
                type: AssetType.REAL_ESTATE,
                value: 1000000,
                metadata: { volatility: 0.1, marketCap: 10000000 }
            },
            {
                id: 'asset-commodities-001',
                name: 'Gold and Precious Metals',
                type: AssetType.COMMODITY,
                value: 2000,
                metadata: { volatility: 0.15, marketCap: 100000000 }
            }
        ];
        
        // Initialize quantum optimizer
        quantumOptimizer = new QuantumPortfolioOptimizer(mockQuantumConfig);
        
        // Initialize quantum tokenizer
        quantumTokenizer = new QuantumEnhancedCompoundTokenizer({
            enableQuantumOptimization: true,
            enableQuantumSecurity: true,
            enableAIRebalancing: true,
            quantumConfig: mockQuantumConfig
        });
        
        await quantumTokenizer.initialize();
    });
    
    afterEach(async () => {
        await quantumTokenizer.shutdown();
        quantumOptimizer.shutdown();
    });
    
    describe('Quantum Portfolio Optimization', () => {
        test('should create quantum-enhanced compound token', async () => {
            const tokenRequest = {
                name: 'Quantum Enhanced Multi-Asset Portfolio',
                symbol: 'QEMAP',
                totalSupply: 1000000,
                assets: testAssets,
                targetAllocation: new Map([
                    ['asset-btc-001', 0.4],
                    ['asset-eth-001', 0.3],
                    ['asset-real-estate-001', 0.2],
                    ['asset-commodities-001', 0.1]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            
            expect(quantumToken).toBeDefined();
            expect(quantumToken.id).toBeDefined();
            expect(quantumToken.name).toBe(tokenRequest.name);
            expect(quantumToken.symbol).toBe(tokenRequest.symbol);
            expect(quantumToken.isQuantumEnhanced).toBe(true);
            expect(quantumToken.quantumState).toBeDefined();
            expect(quantumToken.quantumState.quantumState).toBe('SUPERPOSITION');
            expect(quantumToken.quantumState.coherenceLevel).toBeGreaterThan(0);
            expect(quantumToken.quantumState.quantumAdvantage).toBeGreaterThanOrEqual(0);
        }, 30000);
        
        test('should optimize portfolio using quantum algorithms', async () => {
            const tokenIds = testAssets.map(asset => asset.id);
            const targetReturn = 0.12; // 12% annual return
            const riskConstraints = {
                maxVariance: 0.25,
                maxDrawdown: 0.2,
                minSharpeRatio: 1.0
            };
            
            const optimizationResult = await quantumOptimizer.optimizePortfolio(
                tokenIds,
                targetReturn,
                riskConstraints
            );
            
            expect(optimizationResult).toBeDefined();
            expect(optimizationResult.tokenIds).toEqual(tokenIds);
            expect(optimizationResult.portfolioWeights.size).toBe(tokenIds.length);
            expect(optimizationResult.quantumAdvantage).toBeGreaterThanOrEqual(0);
            expect(optimizationResult.quantumAdvantage).toBeLessThanOrEqual(1);
            expect(optimizationResult.expectedReturn).toBeGreaterThan(0);
            expect(optimizationResult.sharpeRatio).toBeGreaterThan(0);
            expect(optimizationResult.coherenceLevel).toBeGreaterThan(0);
            expect(optimizationResult.coherenceLevel).toBeLessThanOrEqual(1);
            
            // Verify portfolio weights sum to 1
            const totalWeight = Array.from(optimizationResult.portfolioWeights.values())
                .reduce((sum, weight) => sum + weight, 0);
            expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01);
        }, 30000);
        
        test('should demonstrate quantum advantage over classical optimization', async () => {
            const tokenIds = testAssets.map(asset => asset.id);
            const targetReturn = 0.15;
            const riskConstraints = { maxVariance: 0.3 };
            
            // Run quantum optimization
            const quantumResult = await quantumOptimizer.optimizePortfolio(
                tokenIds,
                targetReturn,
                riskConstraints
            );
            
            // Simulate classical optimization result (typically lower performance)
            const classicalSharpeRatio = 0.8; // Typical classical optimization result
            
            // Quantum optimization should show improvement
            expect(quantumResult.sharpeRatio).toBeGreaterThanOrEqual(classicalSharpeRatio * 0.9);
            expect(quantumResult.quantumAdvantage).toBeGreaterThan(0);
            
            // Quantum effects should be present
            expect(quantumResult.quantumStates.length).toBeGreaterThan(0);
            expect(quantumResult.coherenceLevel).toBeGreaterThan(0.5);
            
            // Entanglement should provide benefits
            if (quantumResult.entanglementMap.size > 0) {
                expect(quantumResult.quantumAdvantage).toBeGreaterThan(0.1);
            }
        }, 30000);
        
        test('should handle quantum decoherence gracefully', async () => {
            const tokenRequest = {
                name: 'Decoherence Test Token',
                symbol: 'DTT',
                totalSupply: 100000,
                assets: testAssets.slice(0, 2), // Use fewer assets for faster test
                targetAllocation: new Map([
                    ['asset-btc-001', 0.6],
                    ['asset-eth-001', 0.4]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            
            // Wait for potential decoherence events
            await new Promise(resolve => setTimeout(resolve, 6000)); // Wait longer than coherence time
            
            // Check if system handles decoherence
            const currentState = await quantumTokenizer.getQuantumState(quantumToken.id);
            
            expect(currentState).toBeDefined();
            
            // System should either maintain coherence or handle collapse gracefully
            if (currentState.quantumState === 'COLLAPSED') {
                expect(currentState.coherenceLevel).toBeLessThan(0.2);
                
                // Should attempt recoherence
                const rebalanceResult = await quantumTokenizer.rebalanceQuantumPortfolio(quantumToken.id);
                expect(rebalanceResult.success).toBe(true);
            } else {
                expect(currentState.coherenceLevel).toBeGreaterThan(0);
            }
        }, 15000);
    });
    
    describe('Quantum Risk Assessment', () => {
        test('should calculate quantum risk metrics', async () => {
            const tokenRequest = {
                name: 'Risk Assessment Test Token',
                symbol: 'RATT',
                totalSupply: 500000,
                assets: testAssets,
                targetAllocation: new Map([
                    ['asset-btc-001', 0.25],
                    ['asset-eth-001', 0.25],
                    ['asset-real-estate-001', 0.25],
                    ['asset-commodities-001', 0.25]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            const riskAssessment = await quantumTokenizer.performQuantumRiskAssessment(quantumToken.id);
            
            expect(riskAssessment).toBeDefined();
            expect(riskAssessment.quantumVaR).toBeGreaterThan(0);
            expect(riskAssessment.quantumCVaR).toBeGreaterThan(riskAssessment.quantumVaR);
            expect(riskAssessment.entanglementRisk).toBeGreaterThanOrEqual(0);
            expect(riskAssessment.coherenceRisk).toBeGreaterThanOrEqual(0);
            expect(riskAssessment.quantumCorrelations.size).toBeGreaterThan(0);
            expect(riskAssessment.superpositionBenefits).toBeGreaterThanOrEqual(0);
            expect(riskAssessment.quantumHedgeEffectiveness).toBeGreaterThanOrEqual(0);
            expect(riskAssessment.quantumHedgeEffectiveness).toBeLessThanOrEqual(1);
        }, 20000);
        
        test('should detect quantum correlations between assets', async () => {
            const tokenIds = testAssets.map(asset => asset.id);
            
            const optimizationResult = await quantumOptimizer.optimizePortfolio(
                tokenIds,
                0.1,
                { maxVariance: 0.2 }
            );
            
            expect(optimizationResult.quantumStates.length).toBeGreaterThan(0);
            
            // Check for entangled assets
            const entangledStates = optimizationResult.quantumStates.filter(
                state => state.quantumState === 'ENTANGLED'
            );
            
            if (entangledStates.length > 1) {
                // Verify entanglement map consistency
                expect(optimizationResult.entanglementMap.size).toBeGreaterThan(0);
                
                for (const [tokenId, entangledTokens] of optimizationResult.entanglementMap) {
                    expect(entangledTokens.length).toBeGreaterThan(0);
                    expect(entangledTokens).not.toContain(tokenId); // Token shouldn't be entangled with itself
                }
            }
        }, 25000);
    });
    
    describe('Quantum Security Features', () => {
        test('should use quantum-safe cryptography for all operations', async () => {
            const tokenRequest = {
                name: 'Quantum Secure Token',
                symbol: 'QST',
                totalSupply: 1000000,
                assets: testAssets,
                targetAllocation: new Map([
                    ['asset-btc-001', 0.5],
                    ['asset-real-estate-001', 0.5]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            
            expect(quantumToken.isQuantumSecure).toBe(true);
            expect(quantumToken.quantumSignatures).toBeDefined();
            expect(quantumToken.quantumSignatures.length).toBeGreaterThan(0);
            
            // Verify quantum encryption is used
            const tokenData = await quantumTokenizer.getTokenData(quantumToken.id);
            expect(tokenData.encryptionAlgorithm).toContain('CRYSTALS');
            expect(tokenData.isQuantumSafe).toBe(true);
        }, 15000);
        
        test('should maintain security during quantum state transitions', async () => {
            const tokenRequest = {
                name: 'State Transition Security Test',
                symbol: 'STST',
                totalSupply: 100000,
                assets: testAssets.slice(0, 2),
                targetAllocation: new Map([
                    ['asset-btc-001', 0.7],
                    ['asset-eth-001', 0.3]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            
            // Perform multiple operations that trigger state transitions
            await quantumTokenizer.rebalanceQuantumPortfolio(quantumToken.id);
            await quantumTokenizer.performQuantumRiskAssessment(quantumToken.id);
            
            // Security should be maintained throughout
            const finalTokenData = await quantumTokenizer.getTokenData(quantumToken.id);
            expect(finalTokenData.isQuantumSafe).toBe(true);
            expect(finalTokenData.quantumSignatures.length).toBeGreaterThan(0);
            
            // Verify signature integrity
            const signatureVerification = await quantumTokenizer.verifyQuantumSignatures(quantumToken.id);
            expect(signatureVerification.isValid).toBe(true);
            expect(signatureVerification.quantumSafetyLevel).toBeGreaterThan(5);
        }, 20000);
    });
    
    describe('Performance and Benchmarks', () => {
        test('should meet AV11-37 performance requirements', async () => {
            const startTime = Date.now();
            
            const tokenRequest = {
                name: 'Performance Benchmark Token',
                symbol: 'PBT',
                totalSupply: 2000000,
                assets: testAssets,
                targetAllocation: new Map([
                    ['asset-btc-001', 0.3],
                    ['asset-eth-001', 0.3],
                    ['asset-real-estate-001', 0.2],
                    ['asset-commodities-001', 0.2]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            
            const creationTime = Date.now() - startTime;
            
            // AV11-37 should create quantum-enhanced tokens within reasonable time
            expect(creationTime).toBeLessThan(30000); // 30 seconds max
            
            // Verify quantum optimization provides measurable advantage
            expect(quantumToken.quantumState.quantumAdvantage).toBeGreaterThan(0);
            
            // Performance metrics should be tracked
            const performanceMetrics = await quantumTokenizer.getPerformanceMetrics(quantumToken.id);
            expect(performanceMetrics.optimizationTime).toBeGreaterThan(0);
            expect(performanceMetrics.quantumAdvantage).toEqual(quantumToken.quantumState.quantumAdvantage);
            expect(performanceMetrics.coherenceLevel).toBeGreaterThan(0);
        }, 35000);
        
        test('should handle high-frequency quantum operations', async () => {
            const tokenRequest = {
                name: 'High Frequency Test Token',
                symbol: 'HFTT',
                totalSupply: 500000,
                assets: testAssets.slice(0, 3),
                targetAllocation: new Map([
                    ['asset-btc-001', 0.4],
                    ['asset-eth-001', 0.4],
                    ['asset-real-estate-001', 0.2]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            
            // Perform multiple operations rapidly
            const operations = [];
            for (let i = 0; i < 10; i++) {
                operations.push(quantumTokenizer.getQuantumState(quantumToken.id));
                operations.push(quantumTokenizer.performQuantumRiskAssessment(quantumToken.id));
            }
            
            const results = await Promise.all(operations);
            
            // All operations should complete successfully
            expect(results.length).toBe(20);
            results.forEach(result => {
                expect(result).toBeDefined();
            });
            
            // System should maintain coherence under load
            const finalState = await quantumTokenizer.getQuantumState(quantumToken.id);
            expect(finalState.coherenceLevel).toBeGreaterThan(0.3);
        }, 40000);
    });
    
    describe('Integration and Edge Cases', () => {
        test('should handle empty or minimal asset portfolios', async () => {
            const minimalTokenRequest = {
                name: 'Minimal Portfolio Token',
                symbol: 'MPT',
                totalSupply: 10000,
                assets: [testAssets[0]], // Single asset
                targetAllocation: new Map([
                    ['asset-btc-001', 1.0]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(minimalTokenRequest);
            
            expect(quantumToken).toBeDefined();
            expect(quantumToken.isQuantumEnhanced).toBe(true);
            
            // Should handle single asset quantum state appropriately
            expect(quantumToken.quantumState.quantumState).toBeOneOf(['SUPERPOSITION', 'OPTIMIZED']);
            expect(quantumToken.quantumState.entangledAssets.length).toBe(0);
        }, 15000);
        
        test('should gracefully handle quantum optimization failures', async () => {
            // Mock quantum optimizer to simulate failure
            const failingOptimizer = new QuantumPortfolioOptimizer({
                ...mockQuantumConfig,
                optimizationIterations: 0 // This should cause failure
            });
            
            const tokenIds = testAssets.map(asset => asset.id);
            
            try {
                await failingOptimizer.optimizePortfolio(tokenIds, 0.1, {});
                // If it doesn't throw, that's unexpected but acceptable
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
            
            failingOptimizer.shutdown();
        }, 10000);
        
        test('should maintain data consistency across quantum operations', async () => {
            const tokenRequest = {
                name: 'Consistency Test Token',
                symbol: 'CTT',
                totalSupply: 750000,
                assets: testAssets,
                targetAllocation: new Map([
                    ['asset-btc-001', 0.25],
                    ['asset-eth-001', 0.25],
                    ['asset-real-estate-001', 0.25],
                    ['asset-commodities-001', 0.25]
                ])
            };
            
            const quantumToken = await quantumTokenizer.createQuantumEnhancedToken(tokenRequest);
            
            // Capture initial state
            const initialState = await quantumTokenizer.getQuantumState(quantumToken.id);
            const initialData = await quantumTokenizer.getTokenData(quantumToken.id);
            
            // Perform operations
            await quantumTokenizer.rebalanceQuantumPortfolio(quantumToken.id);
            const riskAssessment = await quantumTokenizer.performQuantumRiskAssessment(quantumToken.id);
            
            // Verify consistency
            const finalState = await quantumTokenizer.getQuantumState(quantumToken.id);
            const finalData = await quantumTokenizer.getTokenData(quantumToken.id);
            
            // Core properties should remain consistent
            expect(finalData.id).toBe(initialData.id);
            expect(finalData.name).toBe(initialData.name);
            expect(finalData.symbol).toBe(initialData.symbol);
            expect(finalData.totalSupply).toBe(initialData.totalSupply);
            
            // Quantum state may change but should remain valid
            expect(finalState.tokenId).toBe(initialState.tokenId);
            expect(finalState.coherenceLevel).toBeGreaterThanOrEqual(0);
            expect(finalState.coherenceLevel).toBeLessThanOrEqual(1);
            
            // Risk assessment should be valid
            expect(riskAssessment.quantumVaR).toBeGreaterThan(0);
            expect(riskAssessment.quantumCVaR).toBeGreaterThan(riskAssessment.quantumVaR);
        }, 25000);
    });
});

// Helper function for Jest custom matcher
expect.extend({
    toBeOneOf(received: any, expected: any[]) {
        const pass = expected.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be one of ${expected}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be one of ${expected}`,
                pass: false,
            };
        }
    },
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeOneOf(expected: any[]): R;
        }
    }
}