/**
 * AV10-35: Quantum-Enhanced AI Orchestration Platform
 *
 * Revolutionary quantum-AI orchestration system that coordinates multiple AI agents
 * with quantum computing resources for optimal decision-making and performance.
 *
 * Performance Targets:
 * - Orchestrate 100+ AI agents simultaneously
 * - Quantum speedup: 1000x for optimization problems
 * - Decision latency: <50ms for critical paths
 * - Resource efficiency: 90%+ utilization
 * - Fault tolerance: 99.99% availability
 */
import { EventEmitter } from 'events';
export interface QuantumAIConfig {
    maxAgents: number;
    quantumCores: number;
    parallelUniverses: number;
    optimizationThreshold: number;
    consensusRequired: number;
    emergencyResponseTime: number;
}
export interface AIAgent {
    id: string;
    name: string;
    type: AgentType;
    capabilities: string[];
    quantumEnabled: boolean;
    status: AgentStatus;
    performance: AgentPerformance;
    workload: WorkloadItem[];
}
export declare enum AgentType {
    OPTIMIZATION = "OPTIMIZATION",
    PREDICTION = "PREDICTION",
    ANALYSIS = "ANALYSIS",
    DECISION = "DECISION",
    MONITORING = "MONITORING",
    SECURITY = "SECURITY",
    CONSENSUS = "CONSENSUS",
    QUANTUM = "QUANTUM"
}
export declare enum AgentStatus {
    IDLE = "IDLE",
    PROCESSING = "PROCESSING",
    QUANTUM_COMPUTING = "QUANTUM_COMPUTING",
    COLLABORATING = "COLLABORATING",
    ERROR = "ERROR",
    MAINTENANCE = "MAINTENANCE"
}
export interface AgentPerformance {
    tasksCompleted: number;
    successRate: number;
    averageLatency: number;
    quantumUtilization: number;
    accuracy: number;
}
export interface WorkloadItem {
    id: string;
    type: TaskType;
    priority: number;
    requiredCapabilities: string[];
    quantumRequired: boolean;
    deadline?: number;
    dependencies?: string[];
    result?: any;
}
export declare enum TaskType {
    OPTIMIZATION = "OPTIMIZATION",
    PREDICTION = "PREDICTION",
    CONSENSUS = "CONSENSUS",
    VERIFICATION = "VERIFICATION",
    SIMULATION = "SIMULATION",
    ANALYSIS = "ANALYSIS"
}
export interface QuantumResource {
    id: string;
    type: 'QUBIT' | 'QUANTUM_GATE' | 'QUANTUM_CIRCUIT';
    capacity: number;
    available: number;
    coherenceTime: number;
    fidelity: number;
}
export interface OrchestrationStrategy {
    id: string;
    name: string;
    type: 'GREEDY' | 'OPTIMAL' | 'QUANTUM_ANNEALING' | 'HYBRID';
    parameters: any;
    performance: StrategyPerformance;
}
export interface StrategyPerformance {
    throughput: number;
    latency: number;
    accuracy: number;
    resourceEfficiency: number;
}
export interface CollaborationSession {
    id: string;
    agents: string[];
    task: WorkloadItem;
    strategy: OrchestrationStrategy;
    startTime: number;
    quantumState?: QuantumState;
    consensus?: ConsensusResult;
}
export interface QuantumState {
    superposition: boolean;
    entangled: string[];
    coherence: number;
    measurements: number[];
    fidelity: number;
}
export interface ConsensusResult {
    decision: any;
    confidence: number;
    votes: Map<string, any>;
    timestamp: number;
}
export declare class AV10_35_QuantumAIOrchestrator extends EventEmitter {
    private logger;
    private config;
    private quantumManager;
    private agentCoordinator;
    private orchestrationEngine;
    private quantumCrypto;
    private quantumShard;
    private collectiveIntelligence;
    private initialized;
    private metrics;
    constructor(config?: Partial<QuantumAIConfig>);
    private setupEventHandlers;
    initialize(): Promise<void>;
    executeQuantumTask(task: WorkloadItem): Promise<any>;
    private performQuantumComputation;
    orchestrateAICollaboration(taskBatch: WorkloadItem[], constraints?: any): Promise<Map<string, any>>;
    private executeRegularTask;
    achieveQuantumConsensus(decision: any, participants: string[]): Promise<ConsensusResult>;
    private updateMetrics;
    getMetrics(): any;
    handleEmergency(emergency: any): Promise<void>;
    shutdown(): Promise<void>;
}
export default AV10_35_QuantumAIOrchestrator;
//# sourceMappingURL=AV10-35-QuantumAIOrchestrator.d.ts.map