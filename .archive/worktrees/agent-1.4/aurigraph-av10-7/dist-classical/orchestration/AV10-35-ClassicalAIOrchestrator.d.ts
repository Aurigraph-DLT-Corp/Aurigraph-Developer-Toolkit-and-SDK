/**
 * AV10-35: Classical AI Orchestration Platform (CPU/GPU Version)
 *
 * High-performance AI orchestration system using classical computing resources
 * (CPUs and GPUs) without quantum computing dependencies.
 *
 * Performance Targets:
 * - Orchestrate 100+ AI agents simultaneously
 * - GPU acceleration: 100x speedup for ML operations
 * - Decision latency: <100ms for critical paths
 * - Resource efficiency: 85%+ utilization
 * - Fault tolerance: 99.9% availability
 */
import { EventEmitter } from 'events';
export interface ClassicalAIConfig {
    maxAgents: number;
    gpuCount: number;
    cpuCores: number;
    optimizationThreshold: number;
    consensusRequired: number;
    emergencyResponseTime: number;
}
export interface AIAgent {
    id: string;
    name: string;
    type: AgentType;
    capabilities: string[];
    gpuEnabled: boolean;
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
    ML_COMPUTE = "ML_COMPUTE"
}
export declare enum AgentStatus {
    IDLE = "IDLE",
    PROCESSING = "PROCESSING",
    GPU_COMPUTING = "GPU_COMPUTING",
    COLLABORATING = "COLLABORATING",
    ERROR = "ERROR",
    MAINTENANCE = "MAINTENANCE"
}
export interface AgentPerformance {
    tasksCompleted: number;
    successRate: number;
    averageLatency: number;
    gpuUtilization: number;
    accuracy: number;
}
export interface WorkloadItem {
    id: string;
    type: TaskType;
    priority: number;
    requiredCapabilities: string[];
    gpuRequired: boolean;
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
export interface ComputeResource {
    id: string;
    type: 'CPU' | 'GPU' | 'TPU';
    capacity: number;
    available: number;
    memory: number;
    computeUnits: number;
}
export interface OrchestrationStrategy {
    id: string;
    name: string;
    type: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'PRIORITY_BASED' | 'ML_OPTIMIZED';
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
    consensus?: ConsensusResult;
}
export interface ConsensusResult {
    decision: any;
    confidence: number;
    votes: Map<string, any>;
    timestamp: number;
}
export declare class AV10_35_ClassicalAIOrchestrator extends EventEmitter {
    private logger;
    private config;
    private resourceManager;
    private agentCoordinator;
    private orchestrationEngine;
    private initialized;
    private metrics;
    constructor(config?: Partial<ClassicalAIConfig>);
    private setupEventHandlers;
    initialize(): Promise<void>;
    executeGPUTask(task: WorkloadItem): Promise<any>;
    private performGPUComputation;
    orchestrateAICollaboration(taskBatch: WorkloadItem[], constraints?: any): Promise<Map<string, any>>;
    private executeCPUTask;
    achieveConsensus(decision: any, participants: string[]): Promise<ConsensusResult>;
    private updateMetrics;
    getMetrics(): any;
    handleEmergency(emergency: any): Promise<void>;
    shutdown(): Promise<void>;
}
export default AV10_35_ClassicalAIOrchestrator;
//# sourceMappingURL=AV10-35-ClassicalAIOrchestrator.d.ts.map