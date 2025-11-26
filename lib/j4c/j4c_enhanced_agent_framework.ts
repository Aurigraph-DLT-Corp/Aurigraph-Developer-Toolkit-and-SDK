/**
 * J4C Enhanced Agent Framework v3.0
 *
 * Integrates three advanced capabilities:
 * 1. Infinite Context Windows - Unlimited context across multiple agents
 * 2. Chain of Thought Reasoning - Step-by-step explainable reasoning
 * 3. Multiple Mental Models - Analysis through different cognitive lenses
 *
 * This integration layer connects the new frameworks with the existing
 * J4C Agent Framework (continuous learning, communication, sessions, etc.)
 *
 * @module j4c_enhanced_agent_framework
 * @version 3.0.0
 */

import { InfiniteContextManager, ContextType, ContextPriority, ContextQuery } from './j4c_infinite_context_manager';
import { ChainOfThoughtReasoner, ThoughtType, ReasoningStrategy, ReasoningContext } from './j4c_chain_of_thought';
import { MentalModelAnalyzer, MentalModelType } from './j4c_mental_models';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

/**
 * Enhanced agent configuration
 */
interface EnhancedAgentConfig {
  agentId: string;
  sessionId: string;
  capabilities: AgentCapability[];

  // Context management
  contextConfig?: {
    maxActiveMemoryMB?: number;
    enableCrossAgentSharing?: boolean;
    compressionThresholdKB?: number;
  };

  // Reasoning config
  reasoningConfig?: {
    enableChainOfThought?: boolean;
    defaultStrategy?: ReasoningStrategy;
    maxReasoningDepth?: number;
    enableBacktracking?: boolean;
  };

  // Mental models config
  mentalModelsConfig?: {
    enableMultiModelAnalysis?: boolean;
    defaultModels?: MentalModelType[];
    minModelsRequired?: number;
  };
}

/**
 * Agent capability
 */
enum AgentCapability {
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  ARCHITECTURE = 'architecture',
  DOCUMENTATION = 'documentation',
  DEPLOYMENT = 'deployment',
  OPTIMIZATION = 'optimization',
  SECURITY = 'security',
  PLANNING = 'planning',
}

/**
 * Enhanced agent execution request
 */
interface EnhancedExecutionRequest {
  task: string;
  context?: Record<string, any>;
  constraints?: string[];
  goals?: string[];

  // Reasoning preferences
  useChainOfThought?: boolean;
  reasoningStrategy?: ReasoningStrategy;

  // Mental models preferences
  useMentalModels?: boolean;
  specificModels?: MentalModelType[];

  // Context preferences
  includeHistoricalContext?: boolean;
  contextQuery?: ContextQuery;
  shareContextWith?: string[]; // other agent IDs
}

/**
 * Enhanced agent execution result
 */
interface EnhancedExecutionResult {
  success: boolean;
  output: any;

  // Context artifacts
  contextChunkIds?: string[];
  contextStats?: {
    chunksCreated: number;
    totalSizeMB: number;
    retrievalTimeMs: number;
  };

  // Reasoning artifacts
  reasoningChainId?: string;
  reasoningVisualization?: string;
  reasoningConfidence?: number;

  // Mental models artifacts
  mentalModelAnalysisId?: string;
  multiModelInsights?: string[];
  recommendations?: any[];

  // Execution metadata
  durationMs: number;
  timestamp: number;
}

/**
 * Agent interaction mode
 */
enum InteractionMode {
  SIMPLE = 'simple',               // Direct execution, no enhanced features
  REASONING = 'reasoning',         // Use chain of thought
  ANALYTICAL = 'analytical',       // Use mental models
  COMPREHENSIVE = 'comprehensive', // Use all enhancements
}

// ============================================================================
// ENHANCED AGENT
// ============================================================================

export class EnhancedAgent {
  private config: EnhancedAgentConfig;
  private contextManager: InfiniteContextManager;
  private reasoner: ChainOfThoughtReasoner;
  private mentalModelAnalyzer: MentalModelAnalyzer;
  private executionHistory: EnhancedExecutionResult[];
  private interactionMode: InteractionMode;

  constructor(config: EnhancedAgentConfig) {
    this.config = config;
    this.executionHistory = [];
    this.interactionMode = InteractionMode.COMPREHENSIVE;

    // Initialize context manager
    this.contextManager = new InfiniteContextManager(config.contextConfig);

    // Initialize reasoner
    this.reasoner = new ChainOfThoughtReasoner({
      maxDepth: config.reasoningConfig?.maxReasoningDepth || 10,
      strategy: config.reasoningConfig?.defaultStrategy || ReasoningStrategy.BEST_FIRST,
      enableBacktracking: config.reasoningConfig?.enableBacktracking !== false,
    });

    // Initialize mental model analyzer
    this.mentalModelAnalyzer = new MentalModelAnalyzer({
      enabledModels: config.mentalModelsConfig?.defaultModels,
      minModelsRequired: config.mentalModelsConfig?.minModelsRequired || 3,
    });
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Execute a task with enhanced capabilities
   */
  public async execute(request: EnhancedExecutionRequest): Promise<EnhancedExecutionResult> {
    const startTime = Date.now();

    try {
      // Load historical context
      let historicalContext = null;
      if (request.includeHistoricalContext) {
        historicalContext = await this.loadHistoricalContext(request);
      }

      // Determine execution strategy based on request
      let result: EnhancedExecutionResult;

      if (request.useChainOfThought && request.useMentalModels) {
        // Comprehensive mode: reasoning + mental models
        result = await this.executeComprehensive(request, historicalContext);
      } else if (request.useChainOfThought) {
        // Reasoning mode
        result = await this.executeWithReasoning(request, historicalContext);
      } else if (request.useMentalModels) {
        // Analytical mode
        result = await this.executeWithMentalModels(request, historicalContext);
      } else {
        // Simple mode
        result = await this.executeSimple(request, historicalContext);
      }

      result.durationMs = Date.now() - startTime;
      result.timestamp = Date.now();

      // Store execution result in context
      await this.storeExecutionInContext(request, result);

      // Share context if requested
      if (request.shareContextWith && request.shareContextWith.length > 0) {
        await this.shareContextWithAgents(request.shareContextWith, result.contextChunkIds || []);
      }

      // Add to history
      this.executionHistory.push(result);

      return result;
    } catch (error) {
      console.error('Enhanced execution error:', error);
      return {
        success: false,
        output: null,
        durationMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get agent's context summary
   */
  public async getContextSummary(): Promise<any> {
    const stats = this.contextManager.getStats();
    const recentContext = await this.contextManager.getAgentContext(this.config.agentId, 20);

    return {
      stats,
      recentChunks: recentContext.chunks.length,
      totalSize: stats.totalSizeMB,
      compressionRatio: stats.compressionRatio,
      hitRate: stats.hitRate,
    };
  }

  /**
   * Export reasoning chains to markdown
   */
  public async exportReasoningChains(): Promise<string[]> {
    const chains = this.reasoner.getAgentChains(this.config.agentId);
    return chains.map(chain => this.reasoner.exportToMarkdown(chain.id));
  }

  /**
   * Get recent mental model analyses
   */
  public async getRecentAnalyses(limit: number = 5): Promise<any[]> {
    // Would retrieve from mental model analyzer
    return [];
  }

  /**
   * Set interaction mode
   */
  public setInteractionMode(mode: InteractionMode): void {
    this.interactionMode = mode;
  }

  /**
   * Query context across sessions
   */
  public async queryContext(query: ContextQuery): Promise<any> {
    return await this.contextManager.queryContext(query);
  }

  /**
   * Compress old context to save memory
   */
  public async compressOldContext(olderThanHours: number = 24): Promise<any> {
    return await this.contextManager.compressContext(olderThanHours);
  }

  // ==========================================================================
  // EXECUTION MODES
  // ==========================================================================

  private async executeSimple(
    request: EnhancedExecutionRequest,
    historicalContext: any
  ): Promise<EnhancedExecutionResult> {
    // Simple execution without enhanced features
    // This would call the actual agent implementation

    const output = await this.performTask(request.task, {
      ...request.context,
      historicalContext,
    });

    return {
      success: true,
      output,
      durationMs: 0,
      timestamp: Date.now(),
    };
  }

  private async executeWithReasoning(
    request: EnhancedExecutionRequest,
    historicalContext: any
  ): Promise<EnhancedExecutionResult> {
    // Start reasoning chain
    const chainId = await this.reasoner.startChain(
      this.config.agentId,
      this.config.sessionId,
      request.task,
      request.goals?.[0] || 'Complete the task successfully'
    );

    // Build reasoning context
    const reasoningContext: ReasoningContext = {
      problem: request.task,
      goal: request.goals?.[0] || 'Complete task',
      currentState: request.context || {},
      availableEvidence: [],
      constraints: request.constraints || [],
      priorSteps: [],
    };

    // Execute reasoning
    const chain = await this.reasoner.reason(
      chainId,
      reasoningContext,
      request.reasoningStrategy
    );

    // Use reasoning conclusion to guide execution
    const output = await this.performTask(request.task, {
      ...request.context,
      reasoningChain: chain,
      guidedBy: chain.finalConclusion,
    });

    // Visualize reasoning
    const visualization = this.reasoner.visualizeChain(chainId);

    return {
      success: true,
      output,
      reasoningChainId: chainId,
      reasoningVisualization: visualization,
      reasoningConfidence: chain.overallConfidence,
      durationMs: 0,
      timestamp: Date.now(),
    };
  }

  private async executeWithMentalModels(
    request: EnhancedExecutionRequest,
    historicalContext: any
  ): Promise<EnhancedExecutionResult> {
    // Analyze with mental models
    const analysis = await this.mentalModelAnalyzer.analyzeWithMultipleModels(request.task, {
      domain: request.context?.domain,
      constraints: request.constraints,
      goals: request.goals,
      currentState: request.context,
    });

    // Use insights to guide execution
    const output = await this.performTask(request.task, {
      ...request.context,
      mentalModelAnalysis: analysis,
      guidedBy: analysis.synthesis.metaInsight,
      recommendations: analysis.recommendations,
    });

    return {
      success: true,
      output,
      mentalModelAnalysisId: analysis.id,
      multiModelInsights: analysis.synthesis.convergentInsights,
      recommendations: analysis.recommendations,
      durationMs: 0,
      timestamp: Date.now(),
    };
  }

  private async executeComprehensive(
    request: EnhancedExecutionRequest,
    historicalContext: any
  ): Promise<EnhancedExecutionResult> {
    // Step 1: Analyze with mental models to understand the problem deeply
    const analysis = await this.mentalModelAnalyzer.analyzeWithMultipleModels(request.task, {
      domain: request.context?.domain,
      constraints: request.constraints,
      goals: request.goals,
      currentState: request.context,
    });

    // Step 2: Use insights to start reasoning chain
    const chainId = await this.reasoner.startChain(
      this.config.agentId,
      this.config.sessionId,
      request.task,
      request.goals?.[0] || 'Complete task optimally',
      { mentalModelAnalysisId: analysis.id }
    );

    // Build enhanced reasoning context
    const reasoningContext: ReasoningContext = {
      problem: request.task,
      goal: request.goals?.[0] || 'Complete task',
      currentState: {
        ...request.context,
        mentalModelInsights: analysis.synthesis.convergentInsights,
        risks: analysis.risks,
        opportunities: analysis.opportunities,
      },
      availableEvidence: [],
      constraints: [
        ...(request.constraints || []),
        ...analysis.risks.map(r => `Risk: ${r.description}`),
      ],
      priorSteps: [],
    };

    // Step 3: Execute reasoning guided by mental model insights
    const chain = await this.reasoner.reason(chainId, reasoningContext, request.reasoningStrategy);

    // Step 4: Execute task with both reasoning and mental model guidance
    const output = await this.performTask(request.task, {
      ...request.context,
      historicalContext,
      mentalModelAnalysis: analysis,
      reasoningChain: chain,
      guidedBy: {
        reasoning: chain.finalConclusion,
        insights: analysis.synthesis.metaInsight,
        recommendations: analysis.recommendations.slice(0, 3),
      },
    });

    const visualization = this.reasoner.visualizeChain(chainId);

    return {
      success: true,
      output,
      reasoningChainId: chainId,
      reasoningVisualization: visualization,
      reasoningConfidence: chain.overallConfidence,
      mentalModelAnalysisId: analysis.id,
      multiModelInsights: analysis.synthesis.convergentInsights,
      recommendations: analysis.recommendations,
      durationMs: 0,
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // CONTEXT MANAGEMENT
  // ==========================================================================

  private async loadHistoricalContext(request: EnhancedExecutionRequest): Promise<any> {
    const query: ContextQuery = request.contextQuery || {
      agentId: this.config.agentId,
      sessionId: this.config.sessionId,
      limit: 50,
      includeRelated: true,
    };

    const result = await this.contextManager.queryContext(query);

    return {
      chunks: result.chunks,
      totalSize: result.totalSize,
      retrievalTime: result.retrievalTimeMs,
    };
  }

  private async storeExecutionInContext(
    request: EnhancedExecutionRequest,
    result: EnhancedExecutionResult
  ): Promise<void> {
    // Store task description
    const taskChunkIds = await this.contextManager.addContext(
      this.config.agentId,
      this.config.sessionId,
      `Task: ${request.task}\nResult: ${result.success ? 'Success' : 'Failure'}`,
      ContextType.EXECUTION_RESULT,
      {
        priority: ContextPriority.HIGH,
        semanticTags: ['execution', 'task'],
        metadata: {
          success: result.success,
          durationMs: result.durationMs,
        },
      }
    );

    // Store reasoning chain if available
    if (result.reasoningChainId) {
      const chain = this.reasoner.getChain(result.reasoningChainId);
      if (chain) {
        await this.contextManager.addContext(
          this.config.agentId,
          this.config.sessionId,
          JSON.stringify(chain, null, 2),
          ContextType.ANALYSIS,
          {
            priority: ContextPriority.HIGH,
            semanticTags: ['reasoning', 'chain_of_thought'],
            references: taskChunkIds,
          }
        );
      }
    }

    // Store mental model analysis if available
    if (result.mentalModelAnalysisId) {
      const analysis = this.mentalModelAnalyzer.getAnalysis(result.mentalModelAnalysisId);
      if (analysis) {
        await this.contextManager.addContext(
          this.config.agentId,
          this.config.sessionId,
          JSON.stringify(analysis, null, 2),
          ContextType.ANALYSIS,
          {
            priority: ContextPriority.HIGH,
            semanticTags: ['mental_models', 'analysis'],
            references: taskChunkIds,
          }
        );
      }
    }

    result.contextChunkIds = taskChunkIds;
    result.contextStats = {
      chunksCreated: taskChunkIds.length,
      totalSizeMB: 0, // Would calculate
      retrievalTimeMs: 0,
    };
  }

  private async shareContextWithAgents(
    agentIds: string[],
    chunkIds: string[]
  ): Promise<void> {
    for (const targetAgentId of agentIds) {
      await this.contextManager.shareContext(this.config.agentId, targetAgentId, chunkIds);
    }
  }

  // ==========================================================================
  // TASK EXECUTION (PLACEHOLDER)
  // ==========================================================================

  private async performTask(task: string, context: any): Promise<any> {
    // This is a placeholder that would be implemented with actual agent logic
    // In practice, this would call the appropriate agent capability

    return {
      task,
      status: 'completed',
      result: 'Task completed successfully',
      guidedBy: context.guidedBy,
    };
  }
}

// ============================================================================
// AGENT ORCHESTRATOR
// ============================================================================

/**
 * Orchestrates multiple enhanced agents with context sharing
 */
export class EnhancedAgentOrchestrator {
  private agents: Map<string, EnhancedAgent>;
  private sharedContextManager: InfiniteContextManager;

  constructor() {
    this.agents = new Map();
    this.sharedContextManager = new InfiniteContextManager({
      maxActiveMemoryMB: 2048,
      crossAgentSharing: true,
    });
  }

  /**
   * Register an enhanced agent
   */
  public registerAgent(config: EnhancedAgentConfig): EnhancedAgent {
    const agent = new EnhancedAgent(config);
    this.agents.set(config.agentId, agent);
    return agent;
  }

  /**
   * Execute task with agent
   */
  public async executeWithAgent(
    agentId: string,
    request: EnhancedExecutionRequest
  ): Promise<EnhancedExecutionResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return await agent.execute(request);
  }

  /**
   * Execute collaborative task with multiple agents
   */
  public async executeCollaborative(
    agentIds: string[],
    task: string,
    options: {
      useChainOfThought?: boolean;
      useMentalModels?: boolean;
      shareContextBetweenAgents?: boolean;
    } = {}
  ): Promise<any> {
    const results: EnhancedExecutionResult[] = [];

    for (let i = 0; i < agentIds.length; i++) {
      const agentId = agentIds[i];
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      const request: EnhancedExecutionRequest = {
        task: `${task} (Agent ${i + 1} of ${agentIds.length})`,
        useChainOfThought: options.useChainOfThought,
        useMentalModels: options.useMentalModels,
        includeHistoricalContext: true,
        shareContextWith: options.shareContextBetweenAgents ? agentIds.filter(id => id !== agentId) : [],
      };

      const result = await agent.execute(request);
      results.push(result);
    }

    return {
      success: results.every(r => r.success),
      results,
      totalDurationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
    };
  }

  /**
   * Get orchestrator stats
   */
  public getStats(): any {
    const contextStats = this.sharedContextManager.getStats();

    return {
      agentCount: this.agents.size,
      contextStats,
      agents: Array.from(this.agents.keys()),
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  EnhancedAgentConfig,
  AgentCapability,
  EnhancedExecutionRequest,
  EnhancedExecutionResult,
  InteractionMode,
};
