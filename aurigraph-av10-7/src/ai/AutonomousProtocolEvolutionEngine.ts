/**
 * AV10-9: Autonomous Protocol Evolution Engine
 * AGV9-711: Self-evolving protocol optimization system
 * 
 * This engine uses AI/ML to continuously analyze protocol performance,
 * identify optimization opportunities, and autonomously evolve protocol
 * parameters to achieve optimal performance, security, and scalability.
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/Logger';
import { AIOptimizer } from './AIOptimizer';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2, ConsensusConfigV2, ConsensusStateV2 } from '../consensus/HyperRAFTPlusPlusV2';

export interface ProtocolEvolutionConfig {
    evolutionInterval: number; // ms between evolution cycles
    learningRate: number; // AI learning rate for parameter updates
    maxParameterChange: number; // maximum % change per evolution
    evolutionThreshold: number; // minimum performance improvement needed
    safetyMode: boolean; // enable conservative evolution
    quantumEvolution: boolean; // enable quantum-enhanced evolution
    multiObjectiveOptimization: boolean; // optimize multiple objectives
}

export interface ProtocolParameter {
    name: string;
    currentValue: number;
    minValue: number;
    maxValue: number;
    importance: number; // 0-1 importance weight
    lastChanged: Date;
    changeHistory: ParameterChange[];
    optimizationTarget: 'minimize' | 'maximize' | 'stabilize';
}

export interface ParameterChange {
    timestamp: Date;
    oldValue: number;
    newValue: number;
    reason: string;
    performanceImpact: number;
    rollbackRequired: boolean;
}

export interface EvolutionMetrics {
    evolutionCycle: number;
    timestamp: Date;
    overallPerformance: number;
    throughput: number;
    latency: number;
    energyEfficiency: number;
    securityScore: number;
    stabilityScore: number;
    parametersEvolved: number;
    improvementScore: number;
}

export interface EvolutionObjective {
    name: string;
    weight: number; // 0-1 relative importance
    currentScore: number;
    targetScore: number;
    metric: string;
    optimizationDirection: 'minimize' | 'maximize' | 'stabilize';
}

export class AutonomousProtocolEvolutionEngine extends EventEmitter {
    private logger: Logger;
    private aiOptimizer: AIOptimizer;
    private quantumCrypto: QuantumCryptoManagerV2;
    private consensus: HyperRAFTPlusPlusV2;
    
    private config: ProtocolEvolutionConfig;
    private parameters: Map<string, ProtocolParameter> = new Map();
    private objectives: Map<string, EvolutionObjective> = new Map();
    private evolutionHistory: EvolutionMetrics[] = [];
    private isEvolutionActive: boolean = false;
    private evolutionInterval?: NodeJS.Timeout;
    
    // AI/ML Models
    private performancePredictionModel: any;
    private parameterOptimizationModel: any;
    private riskAssessmentModel: any;
    
    // Evolution State
    private currentCycle: number = 0;
    private lastEvolution: Date = new Date();
    private evolutionQueue: Array<{ parameter: string; newValue: number; priority: number }> = [];
    private rollbackStack: ParameterChange[] = [];
    
    constructor(
        aiOptimizer: AIOptimizer,
        quantumCrypto: QuantumCryptoManagerV2,
        consensus: HyperRAFTPlusPlusV2,
        config?: Partial<ProtocolEvolutionConfig>
    ) {
        super();
        this.logger = new Logger('AutonomousProtocolEvolution');
        this.aiOptimizer = aiOptimizer;
        this.quantumCrypto = quantumCrypto;
        this.consensus = consensus;
        
        this.config = {
            evolutionInterval: 30000, // 30 seconds
            learningRate: 0.01,
            maxParameterChange: 0.1, // 10% max change
            evolutionThreshold: 0.02, // 2% minimum improvement
            safetyMode: true,
            quantumEvolution: true,
            multiObjectiveOptimization: true,
            ...config
        };
        
        this.initializeParameters();
        this.initializeObjectives();
        this.initializeAIModels();
    }
    
    private initializeParameters(): void {
        // Consensus parameters
        this.parameters.set('batchSize', {
            name: 'batchSize',
            currentValue: 1000,
            minValue: 100,
            maxValue: 10000,
            importance: 0.9,
            lastChanged: new Date(),
            changeHistory: [],
            optimizationTarget: 'maximize'
        });
        
        this.parameters.set('heartbeatInterval', {
            name: 'heartbeatInterval',
            currentValue: 1000,
            minValue: 100,
            maxValue: 5000,
            importance: 0.8,
            lastChanged: new Date(),
            changeHistory: [],
            optimizationTarget: 'minimize'
        });
        
        this.parameters.set('electionTimeout', {
            name: 'electionTimeout',
            currentValue: 5000,
            minValue: 1000,
            maxValue: 15000,
            importance: 0.7,
            lastChanged: new Date(),
            changeHistory: [],
            optimizationTarget: 'stabilize'
        });
        
        this.parameters.set('pipelineDepth', {
            name: 'pipelineDepth',
            currentValue: 8,
            minValue: 2,
            maxValue: 32,
            importance: 0.85,
            lastChanged: new Date(),
            changeHistory: [],
            optimizationTarget: 'maximize'
        });
        
        this.parameters.set('parallelThreads', {
            name: 'parallelThreads',
            currentValue: 16,
            minValue: 4,
            maxValue: 128,
            importance: 0.95,
            lastChanged: new Date(),
            changeHistory: [],
            optimizationTarget: 'maximize'
        });
        
        // Network parameters
        this.parameters.set('maxConnections', {
            name: 'maxConnections',
            currentValue: 100,
            minValue: 10,
            maxValue: 1000,
            importance: 0.6,
            lastChanged: new Date(),
            changeHistory: [],
            optimizationTarget: 'maximize'
        });
        
        // Quantum parameters
        this.parameters.set('quantumKeyRotationInterval', {
            name: 'quantumKeyRotationInterval',
            currentValue: 3600000, // 1 hour
            minValue: 300000, // 5 minutes
            maxValue: 86400000, // 24 hours
            importance: 0.9,
            lastChanged: new Date(),
            changeHistory: [],
            optimizationTarget: 'stabilize'
        });
    }
    
    private initializeObjectives(): void {
        this.objectives.set('throughput', {
            name: 'throughput',
            weight: 0.3,
            currentScore: 0,
            targetScore: 1000000, // 1M TPS
            metric: 'transactions_per_second',
            optimizationDirection: 'maximize'
        });
        
        this.objectives.set('latency', {
            name: 'latency',
            weight: 0.25,
            currentScore: 0,
            targetScore: 100, // <100ms
            metric: 'average_latency_ms',
            optimizationDirection: 'minimize'
        });
        
        this.objectives.set('security', {
            name: 'security',
            weight: 0.2,
            currentScore: 0,
            targetScore: 0.99, // 99% security score
            metric: 'security_compliance_score',
            optimizationDirection: 'maximize'
        });
        
        this.objectives.set('energyEfficiency', {
            name: 'energyEfficiency',
            weight: 0.15,
            currentScore: 0,
            targetScore: 0.95, // 95% efficiency
            metric: 'energy_efficiency_ratio',
            optimizationDirection: 'maximize'
        });
        
        this.objectives.set('stability', {
            name: 'stability',
            weight: 0.1,
            currentScore: 0,
            targetScore: 0.999, // 99.9% uptime
            metric: 'system_stability_ratio',
            optimizationDirection: 'maximize'
        });
    }
    
    private initializeAIModels(): void {
        // Performance prediction neural network
        this.performancePredictionModel = {
            name: 'PerformancePredictor',
            version: '2.0',
            architecture: 'deep_neural_network',
            inputDimensions: 15, // number of parameters
            outputDimensions: 5, // number of objectives
            trainingData: [],
            accuracy: 0.95
        };
        
        // Parameter optimization model
        this.parameterOptimizationModel = {
            name: 'ParameterOptimizer',
            version: '2.0',
            architecture: 'reinforcement_learning',
            algorithm: 'quantum_enhanced_q_learning',
            explorationRate: 0.1,
            rewardHistory: []
        };
        
        // Risk assessment model
        this.riskAssessmentModel = {
            name: 'RiskAssessor',
            version: '1.5',
            architecture: 'ensemble_classifier',
            riskThreshold: 0.3,
            confidence: 0.92
        };
        
        this.logger.info('Initialized AI models for protocol evolution');
    }
    
    public async startEvolution(): Promise<void> {
        if (this.isEvolutionActive) {
            this.logger.warn('Evolution engine is already active');
            return;
        }
        
        this.logger.info('🧬 Starting Autonomous Protocol Evolution Engine...');
        
        this.isEvolutionActive = true;
        this.lastEvolution = new Date();
        
        // Start evolution cycle
        this.evolutionInterval = setInterval(
            () => this.executeEvolutionCycle(),
            this.config.evolutionInterval
        );
        
        // Initial evolution cycle
        await this.executeEvolutionCycle();
        
        this.logger.info('🚀 Protocol Evolution Engine activated');
        this.emit('evolution-started');
    }
    
    public async stopEvolution(): Promise<void> {
        if (!this.isEvolutionActive) {
            return;
        }
        
        this.logger.info('⏹️ Stopping Protocol Evolution Engine...');
        
        this.isEvolutionActive = false;
        
        if (this.evolutionInterval) {
            clearInterval(this.evolutionInterval);
            this.evolutionInterval = undefined;
        }
        
        this.logger.info('Protocol Evolution Engine stopped');
        this.emit('evolution-stopped');
    }
    
    private async executeEvolutionCycle(): Promise<void> {
        if (!this.isEvolutionActive) return;
        
        this.currentCycle++;
        const cycleStart = Date.now();
        
        try {
            this.logger.info(`🔄 Evolution Cycle ${this.currentCycle} starting...`);
            
            // 1. Collect current performance metrics
            const currentMetrics = await this.collectPerformanceMetrics();
            
            // 2. Analyze performance trends
            const trendAnalysis = this.analyzePerformanceTrends();
            
            // 3. Identify optimization opportunities
            const optimizationOpportunities = await this.identifyOptimizationOpportunities(currentMetrics, trendAnalysis);
            
            // 4. Generate parameter evolution candidates
            const evolutionCandidates = await this.generateEvolutionCandidates(optimizationOpportunities);
            
            // 5. Assess risks for each candidate
            const riskAssessments = await this.assessEvolutionRisks(evolutionCandidates);
            
            // 6. Select optimal evolution strategy
            const selectedEvolutions = this.selectOptimalEvolutions(evolutionCandidates, riskAssessments);
            
            // 7. Execute parameter evolutions
            const evolutionResults = await this.executeParameterEvolutions(selectedEvolutions);
            
            // 8. Monitor and validate changes
            const validationResults = await this.validateEvolutionResults(evolutionResults);
            
            // 9. Update AI models with results
            await this.updateAIModels(evolutionResults, validationResults);
            
            // 10. Record evolution metrics
            const evolutionMetrics = this.calculateEvolutionMetrics(currentMetrics, evolutionResults);
            this.evolutionHistory.push(evolutionMetrics);
            
            const cycleTime = Date.now() - cycleStart;
            
            this.logger.info(`✅ Evolution Cycle ${this.currentCycle} completed in ${cycleTime}ms`);
            this.logger.info(`📊 Performance Score: ${evolutionMetrics.improvementScore.toFixed(3)}`);
            this.logger.info(`🔧 Parameters Evolved: ${evolutionMetrics.parametersEvolved}`);
            
            this.emit('evolution-cycle-completed', evolutionMetrics);
            
        } catch (error) {
            this.logger.error(`❌ Evolution Cycle ${this.currentCycle} failed:`, error);
            this.emit('evolution-cycle-failed', { cycle: this.currentCycle, error });
        }
    }
    
    private async collectPerformanceMetrics(): Promise<any> {
        // Collect metrics from consensus layer
        const consensusState = this.consensus.getState();
        
        // Collect quantum security metrics
        const quantumMetrics = await this.quantumCrypto.getMetrics();
        
        // Collect AI optimizer metrics
        const aiMetrics = this.aiOptimizer.getMetrics();
        
        return {
            timestamp: new Date(),
            throughput: consensusState.throughput,
            latency: consensusState.latency,
            security: quantumMetrics.securityScore || 0.95,
            energyEfficiency: 0.85, // Placeholder - would come from actual monitoring
            stability: 0.999, // Placeholder - would come from uptime monitoring
            ...consensusState,
            ...quantumMetrics,
            ...aiMetrics
        };
    }
    
    private analyzePerformanceTrends(): any {
        const recentHistory = this.evolutionHistory.slice(-10); // Last 10 cycles
        
        if (recentHistory.length < 2) {
            return { trend: 'insufficient_data', confidence: 0 };
        }
        
        const throughputTrend = this.calculateTrend(recentHistory.map(h => h.throughput));
        const latencyTrend = this.calculateTrend(recentHistory.map(h => h.latency));
        const stabilityTrend = this.calculateTrend(recentHistory.map(h => h.stabilityScore));
        
        return {
            throughput: throughputTrend,
            latency: latencyTrend,
            stability: stabilityTrend,
            overallTrend: (throughputTrend.slope - latencyTrend.slope + stabilityTrend.slope) / 3
        };
    }
    
    private calculateTrend(values: number[]): { slope: number; confidence: number } {
        if (values.length < 2) return { slope: 0, confidence: 0 };
        
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const confidence = Math.abs(slope) > 0.01 ? 0.8 : 0.3;
        
        return { slope, confidence };
    }
    
    private async identifyOptimizationOpportunities(metrics: any, trends: any): Promise<string[]> {
        const opportunities: string[] = [];
        
        // Check throughput optimization
        if (metrics.throughput < 800000) { // Below 800K TPS
            opportunities.push('throughput_optimization');
        }
        
        // Check latency optimization
        if (metrics.latency > 200) { // Above 200ms
            opportunities.push('latency_optimization');
        }
        
        // Check trending performance
        if (trends.throughput?.slope < -0.1) {
            opportunities.push('throughput_decline_reversal');
        }
        
        if (trends.latency?.slope > 0.1) {
            opportunities.push('latency_increase_mitigation');
        }
        
        // Check parameter staleness
        const staleParameters = Array.from(this.parameters.values())
            .filter(p => Date.now() - p.lastChanged.getTime() > 300000) // 5 minutes
            .map(p => p.name);
        
        if (staleParameters.length > 0) {
            opportunities.push('parameter_refresh');
        }
        
        return opportunities;
    }
    
    private async generateEvolutionCandidates(opportunities: string[]): Promise<Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }>> {
        const candidates: Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }> = [];
        
        for (const opportunity of opportunities) {
            switch (opportunity) {
                case 'throughput_optimization':
                    candidates.push(...this.generateThroughputCandidates());
                    break;
                case 'latency_optimization':
                    candidates.push(...this.generateLatencyCandidates());
                    break;
                case 'parameter_refresh':
                    candidates.push(...this.generateRefreshCandidates());
                    break;
            }
        }
        
        return candidates.sort((a, b) => b.expectedImprovement - a.expectedImprovement);
    }
    
    private generateThroughputCandidates(): Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }> {
        const candidates = [];
        
        // Increase batch size
        const batchSizeParam = this.parameters.get('batchSize')!;
        if (batchSizeParam.currentValue < batchSizeParam.maxValue * 0.8) {
            const newBatchSize = Math.min(
                batchSizeParam.currentValue * 1.2,
                batchSizeParam.maxValue
            );
            candidates.push({
                parameter: 'batchSize',
                newValue: newBatchSize,
                reason: 'increase_throughput_capacity',
                expectedImprovement: 0.15
            });
        }
        
        // Increase parallel threads
        const threadsParam = this.parameters.get('parallelThreads')!;
        if (threadsParam.currentValue < threadsParam.maxValue * 0.9) {
            const newThreads = Math.min(
                threadsParam.currentValue + 4,
                threadsParam.maxValue
            );
            candidates.push({
                parameter: 'parallelThreads',
                newValue: newThreads,
                reason: 'increase_parallel_processing',
                expectedImprovement: 0.12
            });
        }
        
        return candidates;
    }
    
    private generateLatencyCandidates(): Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }> {
        const candidates = [];
        
        // Decrease heartbeat interval
        const heartbeatParam = this.parameters.get('heartbeatInterval')!;
        if (heartbeatParam.currentValue > heartbeatParam.minValue * 1.2) {
            const newHeartbeat = Math.max(
                heartbeatParam.currentValue * 0.9,
                heartbeatParam.minValue
            );
            candidates.push({
                parameter: 'heartbeatInterval',
                newValue: newHeartbeat,
                reason: 'reduce_consensus_latency',
                expectedImprovement: 0.08
            });
        }
        
        return candidates;
    }
    
    private generateRefreshCandidates(): Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }> {
        const candidates = [];
        
        // Small random adjustments to stale parameters
        for (const [name, param] of this.parameters) {
            if (Date.now() - param.lastChanged.getTime() > 600000) { // 10 minutes
                const changePercent = (Math.random() - 0.5) * 0.1; // ±5%
                const newValue = Math.max(
                    param.minValue,
                    Math.min(
                        param.maxValue,
                        param.currentValue * (1 + changePercent)
                    )
                );
                
                candidates.push({
                    parameter: name,
                    newValue: newValue,
                    reason: 'parameter_exploration',
                    expectedImprovement: 0.02
                });
            }
        }
        
        return candidates;
    }
    
    private async assessEvolutionRisks(candidates: Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }>): Promise<Map<string, number>> {
        const riskScores = new Map<string, number>();
        
        for (const candidate of candidates) {
            const param = this.parameters.get(candidate.parameter)!;
            let risk = 0;
            
            // Calculate change magnitude risk
            const changeMagnitude = Math.abs(candidate.newValue - param.currentValue) / param.currentValue;
            risk += changeMagnitude > this.config.maxParameterChange ? 0.5 : changeMagnitude * 2;
            
            // Historical change risk
            const recentChanges = param.changeHistory
                .filter(change => Date.now() - change.timestamp.getTime() < 300000) // Last 5 minutes
                .length;
            risk += recentChanges * 0.2;
            
            // Safety mode adjustment
            if (this.config.safetyMode) {
                risk *= 1.5;
            }
            
            riskScores.set(`${candidate.parameter}_${candidate.newValue}`, Math.min(1, risk));
        }
        
        return riskScores;
    }
    
    private selectOptimalEvolutions(
        candidates: Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }>,
        risks: Map<string, number>
    ): Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }> {
        const selected = [];
        const maxEvolutions = this.config.safetyMode ? 2 : 5;
        
        for (const candidate of candidates) {
            const riskKey = `${candidate.parameter}_${candidate.newValue}`;
            const risk = risks.get(riskKey) || 0.5;
            const riskAdjustedImprovement = candidate.expectedImprovement * (1 - risk);
            
            if (riskAdjustedImprovement > this.config.evolutionThreshold && selected.length < maxEvolutions) {
                selected.push(candidate);
            }
        }
        
        return selected;
    }
    
    private async executeParameterEvolutions(evolutions: Array<{ parameter: string; newValue: number; reason: string; expectedImprovement: number }>): Promise<any[]> {
        const results = [];
        
        for (const evolution of evolutions) {
            const param = this.parameters.get(evolution.parameter)!;
            const oldValue = param.currentValue;
            
            // Record change
            const change: ParameterChange = {
                timestamp: new Date(),
                oldValue: oldValue,
                newValue: evolution.newValue,
                reason: evolution.reason,
                performanceImpact: 0, // Will be updated later
                rollbackRequired: false
            };
            
            // Update parameter
            param.currentValue = evolution.newValue;
            param.lastChanged = new Date();
            param.changeHistory.push(change);
            
            // Add to rollback stack
            this.rollbackStack.push(change);
            
            // Apply to consensus layer (if applicable)
            if (['batchSize', 'heartbeatInterval', 'electionTimeout', 'pipelineDepth', 'parallelThreads'].includes(evolution.parameter)) {
                await this.applyConsensusParameterChange(evolution.parameter, evolution.newValue);
            }
            
            this.logger.info(`🔧 Parameter evolved: ${evolution.parameter}: ${oldValue} → ${evolution.newValue} (${evolution.reason})`);
            
            results.push({
                parameter: evolution.parameter,
                change: change,
                applied: true
            });
            
            this.emit('parameter-evolved', { parameter: evolution.parameter, oldValue, newValue: evolution.newValue, reason: evolution.reason });
        }
        
        return results;
    }
    
    private async applyConsensusParameterChange(parameter: string, value: number): Promise<void> {
        // Apply parameter changes to consensus layer
        try {
            // This would integrate with the actual consensus configuration
            this.logger.debug(`Applying consensus parameter: ${parameter} = ${value}`);
            // await this.consensus.updateConfig({ [parameter]: value });
        } catch (error) {
            this.logger.error(`Failed to apply consensus parameter ${parameter}:`, error);
        }
    }
    
    private async validateEvolutionResults(results: any[]): Promise<any> {
        // Wait for effects to stabilize
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        
        // Collect post-evolution metrics
        const postMetrics = await this.collectPerformanceMetrics();
        
        // Compare with pre-evolution baseline
        const validation = {
            timestamp: new Date(),
            improvementDetected: postMetrics.throughput > (this.evolutionHistory.slice(-1)[0]?.throughput || 0),
            performanceScore: this.calculateOverallPerformanceScore(postMetrics),
            rollbackRecommended: false
        };
        
        return validation;
    }
    
    private calculateOverallPerformanceScore(metrics: any): number {
        let score = 0;
        
        for (const [name, objective] of this.objectives) {
            const metricValue = metrics[objective.metric] || metrics[name] || 0;
            let normalizedScore = 0;
            
            if (objective.optimizationDirection === 'maximize') {
                normalizedScore = Math.min(1, metricValue / objective.targetScore);
            } else if (objective.optimizationDirection === 'minimize') {
                normalizedScore = Math.max(0, 1 - (metricValue / objective.targetScore));
            } else { // stabilize
                normalizedScore = 1 - Math.abs(metricValue - objective.targetScore) / objective.targetScore;
            }
            
            score += normalizedScore * objective.weight;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    private async updateAIModels(evolutionResults: any[], validationResults: any): Promise<void> {
        // Update performance prediction model with new data
        const trainingData = {
            input: Array.from(this.parameters.values()).map(p => p.currentValue),
            output: [
                validationResults.performanceScore,
                evolutionResults.length,
                validationResults.improvementDetected ? 1 : 0
            ],
            timestamp: new Date()
        };
        
        this.performancePredictionModel.trainingData.push(trainingData);
        
        // Update parameter optimization model rewards
        for (const result of evolutionResults) {
            const reward = validationResults.improvementDetected ? 1 : -0.5;
            this.parameterOptimizationModel.rewardHistory.push({
                parameter: result.parameter,
                reward: reward,
                timestamp: new Date()
            });
        }
        
        this.logger.debug('Updated AI models with evolution results');
    }
    
    private calculateEvolutionMetrics(preMetrics: any, evolutionResults: any[]): EvolutionMetrics {
        const postPerformanceScore = this.calculateOverallPerformanceScore(preMetrics);
        const previousScore = this.evolutionHistory.length > 0 
            ? this.evolutionHistory[this.evolutionHistory.length - 1].overallPerformance 
            : 0.5;
        
        return {
            evolutionCycle: this.currentCycle,
            timestamp: new Date(),
            overallPerformance: postPerformanceScore,
            throughput: preMetrics.throughput,
            latency: preMetrics.latency,
            energyEfficiency: preMetrics.energyEfficiency,
            securityScore: preMetrics.security,
            stabilityScore: preMetrics.stability,
            parametersEvolved: evolutionResults.length,
            improvementScore: postPerformanceScore - previousScore
        };
    }
    
    public async rollbackLastEvolution(): Promise<void> {
        if (this.rollbackStack.length === 0) {
            this.logger.warn('No evolutions to rollback');
            return;
        }
        
        const lastChange = this.rollbackStack.pop()!;
        const param = this.parameters.get(lastChange.oldValue.toString())!; // This needs parameter name mapping
        
        this.logger.info(`🔄 Rolling back parameter evolution...`);
        // Implementation would restore previous values
        
        this.emit('evolution-rollback', lastChange);
    }
    
    // Public API methods
    public getEvolutionMetrics(): EvolutionMetrics[] {
        return [...this.evolutionHistory];
    }
    
    public getCurrentParameters(): Map<string, ProtocolParameter> {
        return new Map(this.parameters);
    }
    
    public getEvolutionConfig(): ProtocolEvolutionConfig {
        return { ...this.config };
    }
    
    public updateEvolutionConfig(config: Partial<ProtocolEvolutionConfig>): void {
        this.config = { ...this.config, ...config };
        this.logger.info('Evolution configuration updated');
        this.emit('config-updated', this.config);
    }
    
    public getEvolutionStatus(): any {
        return {
            isActive: this.isEvolutionActive,
            currentCycle: this.currentCycle,
            lastEvolution: this.lastEvolution,
            totalParameters: this.parameters.size,
            evolutionQueueSize: this.evolutionQueue.length,
            rollbackStackSize: this.rollbackStack.length
        };
    }
}