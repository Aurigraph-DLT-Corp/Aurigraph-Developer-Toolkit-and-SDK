/**
 * Collective Intelligence Network for Aurigraph DLT Platform
 * Implements distributed intelligence across network nodes for consensus optimization,
 * knowledge sharing, collaborative decision making, and emergent behavior patterns.
 *
 * AV10-14: AGV9-716: Collective Intelligence Network Implementation
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { NeuralNetworkEngine } from './NeuralNetworkEngine';
import { AutonomousProtocolEvolutionEngine } from './AutonomousProtocolEvolutionEngine';
export declare enum IntelligenceType {
    CONSENSUS_INTELLIGENCE = "CONSENSUS_INTELLIGENCE",
    SWARM_INTELLIGENCE = "SWARM_INTELLIGENCE",
    DISTRIBUTED_INTELLIGENCE = "DISTRIBUTED_INTELLIGENCE",
    EMERGENT_INTELLIGENCE = "EMERGENT_INTELLIGENCE",
    COLLABORATIVE_INTELLIGENCE = "COLLABORATIVE_INTELLIGENCE",
    PREDICTIVE_INTELLIGENCE = "PREDICTIVE_INTELLIGENCE",
    ADAPTIVE_INTELLIGENCE = "ADAPTIVE_INTELLIGENCE",
    QUANTUM_COLLECTIVE = "QUANTUM_COLLECTIVE"
}
export declare enum NodeRole {
    INTELLIGENCE_LEADER = "INTELLIGENCE_LEADER",
    KNOWLEDGE_AGGREGATOR = "KNOWLEDGE_AGGREGATOR",
    PATTERN_DETECTOR = "PATTERN_DETECTOR",
    DECISION_VALIDATOR = "DECISION_VALIDATOR",
    LEARNING_COORDINATOR = "LEARNING_COORDINATOR",
    CONSENSUS_OPTIMIZER = "CONSENSUS_OPTIMIZER",
    ANOMALY_DETECTOR = "ANOMALY_DETECTOR",
    COLLECTIVE_MEMORY = "COLLECTIVE_MEMORY"
}
export declare enum DecisionType {
    CONSENSUS_PARAMETER = "CONSENSUS_PARAMETER",
    RESOURCE_ALLOCATION = "RESOURCE_ALLOCATION",
    SECURITY_RESPONSE = "SECURITY_RESPONSE",
    PERFORMANCE_OPTIMIZATION = "PERFORMANCE_OPTIMIZATION",
    NETWORK_TOPOLOGY = "NETWORK_TOPOLOGY",
    LEARNING_STRATEGY = "LEARNING_STRATEGY",
    EMERGENCY_RESPONSE = "EMERGENCY_RESPONSE",
    COLLECTIVE_ACTION = "COLLECTIVE_ACTION"
}
export interface IntelligenceNode {
    id: string;
    role: NodeRole;
    capabilities: IntelligenceType[];
    knowledgeBase: Map<string, any>;
    learningModels: string[];
    connections: Set<string>;
    reputation: number;
    contributionScore: number;
    lastActivity: Date;
    isActive: boolean;
    quantumEntangled: boolean;
}
export interface KnowledgeVector {
    id: string;
    type: string;
    data: Float32Array;
    confidence: number;
    source: string;
    timestamp: Date;
    verificationCount: number;
    consensusWeight: number;
    quantumSignature?: string;
}
export interface CollectiveDecision {
    id: string;
    type: DecisionType;
    proposal: any;
    votes: Map<string, {
        support: number;
        confidence: number;
        reasoning: string;
    }>;
    consensus: number;
    implementation: boolean;
    outcome?: any;
    emergentProperties?: Map<string, any>;
    quantumCoherence?: number;
}
export interface SwarmBehavior {
    id: string;
    pattern: 'FLOCKING' | 'FORAGING' | 'CLUSTERING' | 'CONSENSUS' | 'EMERGENCE';
    participants: Set<string>;
    objective: any;
    coordination: Map<string, Float32Array>;
    efficiency: number;
    adaptability: number;
    emergentIntelligence?: number;
}
export interface CollectiveLearning {
    id: string;
    topic: string;
    participants: Set<string>;
    sharedKnowledge: KnowledgeVector[];
    learningObjective: any;
    progress: number;
    convergence: number;
    distributedModel?: any;
    federatedWeights?: Map<string, Float32Array>;
}
export interface EmergentBehavior {
    id: string;
    pattern: string;
    description: string;
    participants: Set<string>;
    properties: Map<string, number>;
    complexity: number;
    stability: number;
    beneficiality: number;
    quantumEntanglement?: number;
}
export interface NetworkTopology {
    nodes: Map<string, IntelligenceNode>;
    connections: Map<string, Set<string>>;
    clusters: Map<string, Set<string>>;
    centralityScores: Map<string, number>;
    informationFlows: Map<string, number>;
    emergentStructures: Set<string>;
}
export declare class CollectiveIntelligenceNetwork extends EventEmitter {
    private logger;
    private quantumCrypto?;
    private neuralNetwork?;
    private protocolEvolution?;
    private nodes;
    private knowledgeBase;
    private activeDecisions;
    private swarmBehaviors;
    private collectiveLearning;
    private emergentBehaviors;
    private topology;
    private consensusThreshold;
    private intelligenceQuorum;
    private learningRate;
    private metrics;
    private isRunning;
    private intelligenceCycle;
    private learningCycle;
    private emergencyCycle;
    constructor(quantumCrypto?: QuantumCryptoManagerV2, neuralNetwork?: NeuralNetworkEngine, protocolEvolution?: AutonomousProtocolEvolutionEngine);
    start(): Promise<void>;
    stop(): Promise<void>;
    private initializeNetwork;
    createIntelligenceNode(id: string, role: NodeRole, capabilities: IntelligenceType[]): Promise<IntelligenceNode>;
    private initializeNodeModels;
    private establishConnections;
    private establishSmallWorldTopology;
    private startIntelligenceCycles;
    private executeIntelligenceCycle;
    private executeLearningCycle;
    private updateNodeActivities;
    private processCollectiveDecisions;
    private implementCollectiveDecision;
    private coordinateSwarmBehaviors;
    private coordinateConsensusSwarm;
    private coordinateForagingSwarm;
    private coordinateClusteringSwarm;
    private coordinateFlockingSwarm;
    private coordinateEmergenceSwarm;
    private optimizeNetworkTopology;
    private calculateCentralityScores;
    private updateInformationFlows;
    private calculateInformationFlow;
    private calculateKnowledgeOverlap;
    private calculateCapabilityOverlap;
    private optimizeConnections;
    private calculateConnectionBenefit;
    private calculateRoleCompatibility;
    private calculateConnectionRedundancy;
    private applyConnectionChanges;
    private shareKnowledge;
    private identifyValuableKnowledge;
    private calculateKnowledgeRelevance;
    private executeKnowledgeTransfer;
    private updateCollectiveLearning;
    private updateLearningProgress;
    private isKnowledgeRelevantToTopic;
    private estimateExpectedKnowledgeForTopic;
    private calculateLearningConvergence;
    private performFederatedLearning;
    private simulateModelWeights;
    private federatedAveraging;
    private updateGlobalModel;
    private validateKnowledge;
    private findKnowledgeValidators;
    private executeKnowledgeValidation;
    private simulateValidation;
    private detectEmergentBehaviors;
    private analyzeNetworkPatterns;
    private detectSynchronization;
    private detectKnowledgeClustering;
    private detectCollectiveDecisionPatterns;
    private detectLearningAcceleration;
    private isEmergentBehavior;
    private assessComplexity;
    private registerEmergentBehavior;
    private assessStability;
    private assessBeneficiality;
    private calculateQuantumEntanglement;
    private updateNetworkMetrics;
    private calculateNodeIQ;
    private calculateNetworkCoherence;
    private calculateNodeSimilarity;
    private calculateEmergentComplexity;
    private updatePerformanceMetrics;
    proposeCollectiveDecision(type: DecisionType, proposal: any, proposer?: string): Promise<string>;
    voteOnDecision(decisionId: string, voterId: string, support: number, confidence: number, reasoning?: string): Promise<boolean>;
    createSwarmBehavior(pattern: 'FLOCKING' | 'FORAGING' | 'CLUSTERING' | 'CONSENSUS' | 'EMERGENCE', objective: any, participants?: string[]): Promise<string>;
    private findSuitableSwarmParticipants;
    createCollectiveLearningSession(topic: string, participants?: string[]): Promise<string>;
    private findSuitableLearningParticipants;
    getNetworkStatus(): any;
    getNodes(): Map<string, IntelligenceNode>;
    getKnowledgeBase(): Map<string, KnowledgeVector>;
    getActiveDecisions(): Map<string, CollectiveDecision>;
    getSwarmBehaviors(): Map<string, SwarmBehavior>;
    getEmergentBehaviors(): Map<string, EmergentBehavior>;
    getNetworkCapabilities(): IntelligenceType[];
    private reallocateNetworkResources;
    private implementSecurityResponse;
    private applyPerformanceOptimization;
    private reconfigureNetworkTopology;
    private updateLearningStrategy;
    private executeCollectiveAction;
    private directKnowledgeForaging;
    private identifyKnowledgeClusters;
    private applyFlockingRules;
    private detectEmergentProperties;
    private calculateEmergentIntelligence;
    private calculateBehaviorStability;
    private assessBehaviorBeneficiality;
    private calculateSwarmEfficiency;
    private initializeCollectiveLearning;
    private setupEmergentBehaviorDetection;
    private finalizeActiveDecisions;
    private persistCollectiveKnowledge;
    private specializedAgents;
    private emergentPatterns;
    private consensusTracker;
    private collaborationEngine;
    initializeSpecializedAgents(): Promise<void>;
    private initializeAgentCollaboration;
    performCollaborativeDecision(decision: CollaborativeDecision): Promise<CollaborativeDecisionResult>;
    private detectEmergentIntelligence;
    private calculateDecisionQualityImprovement;
    performWeeklyEmergenceDetection(): Promise<WeeklyEmergenceReport>;
    getCollectiveIntelligenceStatus(): CollectiveIntelligenceStatus;
    private calculateCrossDomainCorrelation;
    private calculateRecommendationSimilarity;
    private synthesizeEmergentRecommendation;
    private calculateNoveltyScore;
    private analyzeAgentInteractionPatterns;
    private calculateEmergenceScore;
    private detectMetaPatterns;
    private measureKnowledgeGrowth;
}
interface CollaborativeDecision {
    id: string;
    type: string;
    description: string;
    context: any;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    requiredExpertise: string[];
    timestamp: Date;
}
interface AgentDecisionInput {
    agentId: string;
    expertise: string;
    recommendation: string;
    confidence: number;
    reasoning: string;
    supportingData: any;
    riskAssessment: any;
}
interface CollaborativeDecisionResult {
    decision: CollaborativeDecision;
    agentInputs: AgentDecisionInput[];
    collaborationResult: CollaborationResult;
    emergentInsights: EmergentIntelligenceResult;
    consensusResult: ConsensusResult;
    qualityImprovement: number;
    finalRecommendation: string;
    confidence: number;
    decisionTime: number;
    timestamp: Date;
    success: boolean;
}
interface CollaborationResult {
    originalInputs: AgentDecisionInput[];
    synthesizedRecommendation: string;
    synthesisScore: number;
    confidenceDistribution: {
        agentId: string;
        confidence: number;
    }[];
    timestamp: Date;
}
interface EmergentIntelligenceResult {
    patternsDetected: number;
    emergentPatterns: EmergentPattern[];
    novelInsights: NovelInsight[];
    crossDomainConnections: CrossDomainConnection[];
    overallEmergenceScore: number;
    timestamp: Date;
}
interface EmergentPattern {
    type: string;
    description: string;
    strength: number;
    participants: string[];
    timestamp: Date;
}
interface NovelInsight {
    type: string;
    description: string;
    noveltyScore: number;
    recommendation: string;
    contributingAgents: string[];
    timestamp: Date;
}
interface CrossDomainConnection {
    domain1: string;
    domain2: string;
    correlation: number;
    insight: string;
    potential: number;
    timestamp: Date;
}
interface ConsensusResult {
    consensusAchieved: boolean;
    consensusStrength: number;
    finalDecision: string;
    iterations: number;
    participatingAgents: string[];
    timestamp: Date;
}
interface WeeklyEmergenceReport {
    weekStarting: Date;
    emergentPatterns: EmergentPattern[];
    behaviorEvolution: BehaviorEvolution[];
    knowledgeGrowth: KnowledgeGrowthMetric[];
    totalPatternsDetected: number;
    averageEmergenceScore: number;
    detectionTime: number;
    timestamp: Date;
}
interface BehaviorEvolution {
    agentId: string;
    evolutionScore: number;
    newCapabilities: string[];
    improvementAreas: string[];
    adaptationRate: number;
}
interface KnowledgeGrowthMetric {
    agentId: string;
    domain: string;
    knowledgeIncrease: number;
    newCapabilities: string[];
    conceptsLearned: number;
    growthRate: number;
}
interface CollectiveIntelligenceStatus {
    activeAgents: number;
    totalEmergentPatterns: number;
    agentStatuses: Array<{
        agentId: string;
        name: string;
        expertise: string;
        specialization: string;
        decisionWeight: number;
        collaborationCount: number;
        performanceScore: number;
        learningProgress: number;
    }>;
    consensusTracker: string;
    collaborationEngine: string;
    averageAgentPerformance: number;
    emergenceDetectionActive: boolean;
    lastEmergenceDetection: Date | null;
}
export {};
//# sourceMappingURL=CollectiveIntelligenceNetwork.d.ts.map