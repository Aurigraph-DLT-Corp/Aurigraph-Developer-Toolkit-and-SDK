/**
 * J4C Chain of Thought Reasoning Framework
 *
 * Enables agents to perform structured, explainable reasoning with:
 * - Step-by-step thought decomposition
 * - Multi-hop reasoning chains
 * - Self-verification and backtracking
 * - Reasoning visualization and debugging
 * - Confidence scoring per step
 * - Alternative path exploration
 *
 * @module j4c_chain_of_thought
 * @version 3.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

/**
 * A single thought/reasoning step
 */
interface ThoughtStep {
  id: string;
  parentId: string | null;
  depth: number;
  stepNumber: number;
  type: ThoughtType;
  question: string;
  reasoning: string;
  conclusion: string;
  confidence: number; // 0-1
  evidence: Evidence[];
  alternatives: Alternative[];
  verification: Verification | null;
  timestamp: number;
  durationMs: number;
  metadata: Record<string, any>;
}

/**
 * Types of reasoning steps
 */
enum ThoughtType {
  OBSERVATION = 'observation',       // Gather facts
  HYPOTHESIS = 'hypothesis',         // Propose explanation
  DEDUCTION = 'deduction',          // Logical inference
  INDUCTION = 'induction',          // Pattern generalization
  ABDUCTION = 'abduction',          // Best explanation
  ANALYSIS = 'analysis',            // Break down problem
  SYNTHESIS = 'synthesis',          // Combine insights
  EVALUATION = 'evaluation',        // Assess options
  DECISION = 'decision',            // Make choice
  VERIFICATION = 'verification',    // Check validity
  BACKTRACK = 'backtrack',          // Revise reasoning
}

/**
 * Evidence supporting a thought
 */
interface Evidence {
  type: 'code' | 'documentation' | 'execution_result' | 'pattern' | 'best_practice' | 'external';
  source: string;
  content: string;
  confidence: number;
  relevance: number;
}

/**
 * Alternative reasoning path
 */
interface Alternative {
  reasoning: string;
  conclusion: string;
  confidence: number;
  whyNotChosen: string;
}

/**
 * Verification of a thought step
 */
interface Verification {
  method: 'logical' | 'empirical' | 'consensus' | 'best_practice';
  result: 'valid' | 'invalid' | 'uncertain';
  confidence: number;
  feedback: string;
}

/**
 * Complete reasoning chain
 */
interface ReasoningChain {
  id: string;
  agentId: string;
  sessionId: string;
  problem: string;
  goal: string;
  steps: ThoughtStep[];
  finalConclusion: string;
  overallConfidence: number;
  startTime: number;
  endTime: number;
  totalDurationMs: number;
  branchCount: number;
  backtrackCount: number;
  verificationCount: number;
  metadata: Record<string, any>;
}

/**
 * Reasoning strategy
 */
enum ReasoningStrategy {
  FORWARD_CHAIN = 'forward_chain',       // Start from facts, derive conclusion
  BACKWARD_CHAIN = 'backward_chain',     // Start from goal, find path
  BIDIRECTIONAL = 'bidirectional',       // Meet in the middle
  DEPTH_FIRST = 'depth_first',          // Explore deeply first
  BREADTH_FIRST = 'breadth_first',      // Explore broadly first
  BEST_FIRST = 'best_first',            // Follow highest confidence
  MONTE_CARLO = 'monte_carlo',          // Sample multiple paths
}

/**
 * Chain of thought configuration
 */
interface ChainOfThoughtConfig {
  maxDepth: number;
  maxSteps: number;
  minConfidence: number;
  strategy: ReasoningStrategy;
  enableBacktracking: boolean;
  enableVerification: boolean;
  enableAlternatives: boolean;
  pruneThreshold: number;
  timeoutMs: number;
}

/**
 * Reasoning context for a step
 */
interface ReasoningContext {
  problem: string;
  goal: string;
  currentState: Record<string, any>;
  availableEvidence: Evidence[];
  constraints: string[];
  priorSteps: ThoughtStep[];
}

// ============================================================================
// CHAIN OF THOUGHT REASONER
// ============================================================================

export class ChainOfThoughtReasoner {
  private config: ChainOfThoughtConfig;
  private chains: Map<string, ReasoningChain>;
  private activeChainId: string | null;
  private thoughtGraph: Map<string, ThoughtStep>;
  private storageDir: string;

  constructor(config: Partial<ChainOfThoughtConfig> = {}) {
    this.config = {
      maxDepth: config.maxDepth || 10,
      maxSteps: config.maxSteps || 50,
      minConfidence: config.minConfidence || 0.3,
      strategy: config.strategy || ReasoningStrategy.BEST_FIRST,
      enableBacktracking: config.enableBacktracking !== false,
      enableVerification: config.enableVerification !== false,
      enableAlternatives: config.enableAlternatives !== false,
      pruneThreshold: config.pruneThreshold || 0.2,
      timeoutMs: config.timeoutMs || 300000, // 5 minutes
    };

    this.chains = new Map();
    this.activeChainId = null;
    this.thoughtGraph = new Map();

    this.storageDir = path.join(process.cwd(), '.j4c', 'reasoning');
    this.ensureStorageDir();
    this.loadChains();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Start a new reasoning chain
   */
  public async startChain(
    agentId: string,
    sessionId: string,
    problem: string,
    goal: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const chain: ReasoningChain = {
      id: this.generateChainId(),
      agentId,
      sessionId,
      problem,
      goal,
      steps: [],
      finalConclusion: '',
      overallConfidence: 0,
      startTime: Date.now(),
      endTime: 0,
      totalDurationMs: 0,
      branchCount: 0,
      backtrackCount: 0,
      verificationCount: 0,
      metadata,
    };

    this.chains.set(chain.id, chain);
    this.activeChainId = chain.id;

    await this.persistChain(chain);

    return chain.id;
  }

  /**
   * Add a thought step to the active chain
   */
  public async addThought(
    chainId: string,
    thought: {
      type: ThoughtType;
      question: string;
      reasoning: string;
      conclusion: string;
      confidence: number;
      evidence?: Evidence[];
      alternatives?: Alternative[];
      parentId?: string | null;
    }
  ): Promise<string> {
    const chain = this.chains.get(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);

    const startTime = Date.now();

    // Determine parent and depth
    let parentId = thought.parentId !== undefined ? thought.parentId : null;
    let depth = 0;

    if (parentId === null && chain.steps.length > 0) {
      // Auto-link to last step if no parent specified
      parentId = chain.steps[chain.steps.length - 1].id;
    }

    if (parentId) {
      const parent = this.thoughtGraph.get(parentId);
      if (parent) {
        depth = parent.depth + 1;
      }
    }

    // Check depth limit
    if (depth > this.config.maxDepth) {
      throw new Error(`Max depth ${this.config.maxDepth} exceeded`);
    }

    // Check step limit
    if (chain.steps.length >= this.config.maxSteps) {
      throw new Error(`Max steps ${this.config.maxSteps} exceeded`);
    }

    // Create thought step
    const step: ThoughtStep = {
      id: this.generateStepId(),
      parentId,
      depth,
      stepNumber: chain.steps.length + 1,
      type: thought.type,
      question: thought.question,
      reasoning: thought.reasoning,
      conclusion: thought.conclusion,
      confidence: thought.confidence,
      evidence: thought.evidence || [],
      alternatives: thought.alternatives || [],
      verification: null,
      timestamp: Date.now(),
      durationMs: 0,
      metadata: {},
    };

    // Verify if enabled
    if (this.config.enableVerification && thought.type !== ThoughtType.VERIFICATION) {
      step.verification = await this.verifyThought(step, chain);
      chain.verificationCount++;
    }

    // Check if backtracking needed
    if (
      this.config.enableBacktracking &&
      step.verification?.result === 'invalid' &&
      step.confidence < this.config.minConfidence
    ) {
      await this.backtrack(chain, step);
    }

    step.durationMs = Date.now() - startTime;

    // Add to chain
    chain.steps.push(step);
    this.thoughtGraph.set(step.id, step);

    // Track branches
    if (parentId) {
      const siblings = chain.steps.filter(s => s.parentId === parentId);
      if (siblings.length > 1) {
        chain.branchCount++;
      }
    }

    await this.persistChain(chain);

    return step.id;
  }

  /**
   * Execute reasoning with a specific strategy
   */
  public async reason(
    chainId: string,
    context: ReasoningContext,
    strategy?: ReasoningStrategy
  ): Promise<ReasoningChain> {
    const chain = this.chains.get(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);

    const strategyToUse = strategy || this.config.strategy;
    const startTime = Date.now();

    try {
      switch (strategyToUse) {
        case ReasoningStrategy.FORWARD_CHAIN:
          await this.forwardChaining(chain, context);
          break;
        case ReasoningStrategy.BACKWARD_CHAIN:
          await this.backwardChaining(chain, context);
          break;
        case ReasoningStrategy.BEST_FIRST:
          await this.bestFirstReasoning(chain, context);
          break;
        case ReasoningStrategy.DEPTH_FIRST:
          await this.depthFirstReasoning(chain, context);
          break;
        case ReasoningStrategy.BREADTH_FIRST:
          await this.breadthFirstReasoning(chain, context);
          break;
        default:
          await this.bestFirstReasoning(chain, context);
      }

      // Finalize chain
      chain.endTime = Date.now();
      chain.totalDurationMs = chain.endTime - chain.startTime;
      chain.finalConclusion = this.synthesizeConclusion(chain);
      chain.overallConfidence = this.calculateOverallConfidence(chain);

      await this.persistChain(chain);

      return chain;
    } catch (error) {
      console.error('Reasoning error:', error);
      throw error;
    }
  }

  /**
   * Get reasoning chain by ID
   */
  public getChain(chainId: string): ReasoningChain | null {
    return this.chains.get(chainId) || null;
  }

  /**
   * Get all chains for an agent
   */
  public getAgentChains(agentId: string): ReasoningChain[] {
    return Array.from(this.chains.values()).filter(c => c.agentId === agentId);
  }

  /**
   * Visualize reasoning chain as a tree
   */
  public visualizeChain(chainId: string): string {
    const chain = this.chains.get(chainId);
    if (!chain) return 'Chain not found';

    let output = `\n${'='.repeat(80)}\n`;
    output += `REASONING CHAIN: ${chain.id}\n`;
    output += `Problem: ${chain.problem}\n`;
    output += `Goal: ${chain.goal}\n`;
    output += `Strategy: ${this.config.strategy}\n`;
    output += `${'='.repeat(80)}\n\n`;

    // Build tree structure
    const rootSteps = chain.steps.filter(s => s.parentId === null);

    for (const root of rootSteps) {
      output += this.visualizeStep(root, chain, 0);
    }

    output += `\n${'='.repeat(80)}\n`;
    output += `FINAL CONCLUSION: ${chain.finalConclusion}\n`;
    output += `Overall Confidence: ${(chain.overallConfidence * 100).toFixed(1)}%\n`;
    output += `Total Steps: ${chain.steps.length}\n`;
    output += `Branches: ${chain.branchCount}\n`;
    output += `Backtracks: ${chain.backtrackCount}\n`;
    output += `Duration: ${chain.totalDurationMs}ms\n`;
    output += `${'='.repeat(80)}\n`;

    return output;
  }

  /**
   * Export chain to markdown
   */
  public exportToMarkdown(chainId: string): string {
    const chain = this.chains.get(chainId);
    if (!chain) return '# Chain not found';

    let md = `# Reasoning Chain: ${chain.id}\n\n`;
    md += `**Problem:** ${chain.problem}\n\n`;
    md += `**Goal:** ${chain.goal}\n\n`;
    md += `**Strategy:** ${this.config.strategy}\n\n`;
    md += `---\n\n`;

    md += `## Reasoning Steps\n\n`;

    for (let i = 0; i < chain.steps.length; i++) {
      const step = chain.steps[i];
      md += `### Step ${i + 1}: ${step.type}\n\n`;
      md += `**Question:** ${step.question}\n\n`;
      md += `**Reasoning:**\n${step.reasoning}\n\n`;
      md += `**Conclusion:** ${step.conclusion}\n\n`;
      md += `**Confidence:** ${(step.confidence * 100).toFixed(1)}%\n\n`;

      if (step.evidence.length > 0) {
        md += `**Evidence:**\n`;
        step.evidence.forEach((e, idx) => {
          md += `${idx + 1}. [${e.type}] ${e.source} (confidence: ${(e.confidence * 100).toFixed(1)}%)\n`;
        });
        md += `\n`;
      }

      if (step.alternatives.length > 0) {
        md += `**Alternatives Considered:**\n`;
        step.alternatives.forEach((alt, idx) => {
          md += `${idx + 1}. ${alt.conclusion} (confidence: ${(alt.confidence * 100).toFixed(1)}%) - ${alt.whyNotChosen}\n`;
        });
        md += `\n`;
      }

      if (step.verification) {
        md += `**Verification:** ${step.verification.result} (${step.verification.method})\n\n`;
      }

      md += `---\n\n`;
    }

    md += `## Final Conclusion\n\n`;
    md += `${chain.finalConclusion}\n\n`;
    md += `**Overall Confidence:** ${(chain.overallConfidence * 100).toFixed(1)}%\n\n`;
    md += `**Statistics:**\n`;
    md += `- Total Steps: ${chain.steps.length}\n`;
    md += `- Branches: ${chain.branchCount}\n`;
    md += `- Backtracks: ${chain.backtrackCount}\n`;
    md += `- Verifications: ${chain.verificationCount}\n`;
    md += `- Duration: ${(chain.totalDurationMs / 1000).toFixed(2)}s\n`;

    return md;
  }

  // ==========================================================================
  // REASONING STRATEGIES
  // ==========================================================================

  private async forwardChaining(chain: ReasoningChain, context: ReasoningContext): Promise<void> {
    // Start from facts, derive conclusions step by step

    // Step 1: Observe facts
    await this.addThought(chain.id, {
      type: ThoughtType.OBSERVATION,
      question: 'What facts do we have?',
      reasoning: 'Gathering available evidence and facts from context',
      conclusion: `Available evidence: ${context.availableEvidence.length} items`,
      confidence: 0.9,
      evidence: context.availableEvidence,
    });

    // Step 2: Analyze problem
    await this.addThought(chain.id, {
      type: ThoughtType.ANALYSIS,
      question: 'What is the core problem?',
      reasoning: 'Breaking down the problem into components',
      conclusion: 'Problem decomposed into sub-problems',
      confidence: 0.8,
    });

    // Step 3: Hypothesize solutions
    await this.addThought(chain.id, {
      type: ThoughtType.HYPOTHESIS,
      question: 'What are potential solutions?',
      reasoning: 'Generating hypotheses based on evidence and patterns',
      conclusion: 'Multiple solution paths identified',
      confidence: 0.7,
    });

    // Step 4: Deduce implications
    await this.addThought(chain.id, {
      type: ThoughtType.DEDUCTION,
      question: 'What follows logically?',
      reasoning: 'Applying logical rules to derive implications',
      conclusion: 'Logical consequences identified',
      confidence: 0.85,
    });

    // Step 5: Make decision
    await this.addThought(chain.id, {
      type: ThoughtType.DECISION,
      question: 'What is the best solution?',
      reasoning: 'Evaluating options based on evidence and constraints',
      conclusion: 'Best solution selected',
      confidence: 0.75,
    });
  }

  private async backwardChaining(chain: ReasoningChain, context: ReasoningContext): Promise<void> {
    // Start from goal, work backwards to find path

    // Step 1: Define goal
    await this.addThought(chain.id, {
      type: ThoughtType.OBSERVATION,
      question: 'What is our goal?',
      reasoning: 'Identifying the target state we want to reach',
      conclusion: `Goal: ${context.goal}`,
      confidence: 1.0,
    });

    // Step 2: Identify prerequisites
    await this.addThought(chain.id, {
      type: ThoughtType.ANALYSIS,
      question: 'What do we need to achieve the goal?',
      reasoning: 'Working backwards to identify required conditions',
      conclusion: 'Prerequisites identified',
      confidence: 0.8,
    });

    // Step 3: Check current state
    await this.addThought(chain.id, {
      type: ThoughtType.EVALUATION,
      question: 'What do we currently have?',
      reasoning: 'Comparing current state to prerequisites',
      conclusion: 'Gaps identified between current and required state',
      confidence: 0.85,
    });

    // Step 4: Plan steps
    await this.addThought(chain.id, {
      type: ThoughtType.SYNTHESIS,
      question: 'How do we bridge the gaps?',
      reasoning: 'Synthesizing action plan to reach goal',
      conclusion: 'Action plan created',
      confidence: 0.75,
    });
  }

  private async bestFirstReasoning(chain: ReasoningChain, context: ReasoningContext): Promise<void> {
    // Follow highest confidence paths

    const queue: Array<{ stepId: string | null; confidence: number }> = [{ stepId: null, confidence: 1.0 }];
    const visited = new Set<string>();

    while (queue.length > 0 && chain.steps.length < this.config.maxSteps) {
      // Sort by confidence
      queue.sort((a, b) => b.confidence - a.confidence);

      const current = queue.shift()!;
      if (current.stepId && visited.has(current.stepId)) continue;
      if (current.stepId) visited.add(current.stepId);

      // Generate next thought
      const nextThought = await this.generateNextThought(chain, context, current.stepId);
      if (!nextThought) break;

      const stepId = await this.addThought(chain.id, nextThought);

      // Add to queue if confidence is acceptable
      if (nextThought.confidence >= this.config.minConfidence) {
        queue.push({ stepId, confidence: nextThought.confidence });
      }

      // Check if goal reached
      if (this.isGoalReached(chain, context)) {
        break;
      }
    }
  }

  private async depthFirstReasoning(chain: ReasoningChain, context: ReasoningContext): Promise<void> {
    const stack: Array<string | null> = [null];
    const visited = new Set<string>();

    while (stack.length > 0 && chain.steps.length < this.config.maxSteps) {
      const current = stack.pop()!;
      if (current && visited.has(current)) continue;
      if (current) visited.add(current);

      const nextThought = await this.generateNextThought(chain, context, current);
      if (!nextThought) continue;

      const stepId = await this.addThought(chain.id, nextThought);

      if (nextThought.confidence >= this.config.minConfidence) {
        stack.push(stepId);
      }

      if (this.isGoalReached(chain, context)) break;
    }
  }

  private async breadthFirstReasoning(chain: ReasoningChain, context: ReasoningContext): Promise<void> {
    const queue: Array<string | null> = [null];
    const visited = new Set<string>();

    while (queue.length > 0 && chain.steps.length < this.config.maxSteps) {
      const current = queue.shift()!;
      if (current && visited.has(current)) continue;
      if (current) visited.add(current);

      const nextThought = await this.generateNextThought(chain, context, current);
      if (!nextThought) continue;

      const stepId = await this.addThought(chain.id, nextThought);

      if (nextThought.confidence >= this.config.minConfidence) {
        queue.push(stepId);
      }

      if (this.isGoalReached(chain, context)) break;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async generateNextThought(
    chain: ReasoningChain,
    context: ReasoningContext,
    parentStepId: string | null
  ): Promise<{
    type: ThoughtType;
    question: string;
    reasoning: string;
    conclusion: string;
    confidence: number;
    evidence?: Evidence[];
    alternatives?: Alternative[];
    parentId?: string | null;
  } | null> {
    // This is a placeholder that would be implemented with actual reasoning logic
    // In practice, this would use the agent's capabilities to generate thoughts

    const stepCount = chain.steps.length;

    if (stepCount === 0) {
      return {
        type: ThoughtType.OBSERVATION,
        question: 'What is the problem?',
        reasoning: 'Starting by understanding the problem statement',
        conclusion: context.problem,
        confidence: 0.9,
        parentId: parentStepId,
      };
    }

    if (stepCount === 1) {
      return {
        type: ThoughtType.ANALYSIS,
        question: 'How can we break this down?',
        reasoning: 'Analyzing components and relationships',
        conclusion: 'Problem structure identified',
        confidence: 0.8,
        parentId: parentStepId,
      };
    }

    if (stepCount === 2) {
      return {
        type: ThoughtType.HYPOTHESIS,
        question: 'What approach should we take?',
        reasoning: 'Considering available strategies',
        conclusion: 'Strategy selected',
        confidence: 0.7,
        parentId: parentStepId,
      };
    }

    if (stepCount === 3) {
      return {
        type: ThoughtType.DECISION,
        question: 'What is the solution?',
        reasoning: 'Synthesizing insights into final solution',
        conclusion: 'Solution determined',
        confidence: 0.75,
        parentId: parentStepId,
      };
    }

    return null;
  }

  private async verifyThought(step: ThoughtStep, chain: ReasoningChain): Promise<Verification> {
    // Placeholder for verification logic
    // Would check logical consistency, evidence support, etc.

    return {
      method: 'logical',
      result: step.confidence > 0.5 ? 'valid' : 'uncertain',
      confidence: step.confidence,
      feedback: 'Verification passed based on confidence threshold',
    };
  }

  private async backtrack(chain: ReasoningChain, invalidStep: ThoughtStep): Promise<void> {
    // Remove invalid step and its descendants
    const toRemove = new Set<string>();
    toRemove.add(invalidStep.id);

    // Find all descendants
    for (const step of chain.steps) {
      if (step.parentId && toRemove.has(step.parentId)) {
        toRemove.add(step.id);
      }
    }

    // Remove from chain
    chain.steps = chain.steps.filter(s => !toRemove.has(s.id));
    chain.backtrackCount++;

    // Add backtrack marker
    await this.addThought(chain.id, {
      type: ThoughtType.BACKTRACK,
      question: 'Why did we backtrack?',
      reasoning: `Previous reasoning was invalid: ${invalidStep.verification?.feedback}`,
      conclusion: 'Exploring alternative path',
      confidence: 0.6,
      parentId: invalidStep.parentId,
    });
  }

  private isGoalReached(chain: ReasoningChain, context: ReasoningContext): boolean {
    // Check if we have a decision or conclusion
    const lastStep = chain.steps[chain.steps.length - 1];
    return (
      lastStep?.type === ThoughtType.DECISION &&
      lastStep.confidence >= this.config.minConfidence
    );
  }

  private synthesizeConclusion(chain: ReasoningChain): string {
    const decisionSteps = chain.steps.filter(s => s.type === ThoughtType.DECISION);

    if (decisionSteps.length > 0) {
      const bestDecision = decisionSteps.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
      return bestDecision.conclusion;
    }

    const lastStep = chain.steps[chain.steps.length - 1];
    return lastStep?.conclusion || 'No conclusion reached';
  }

  private calculateOverallConfidence(chain: ReasoningChain): number {
    if (chain.steps.length === 0) return 0;

    // Weighted average, with more weight on later steps
    let weightedSum = 0;
    let weightSum = 0;

    chain.steps.forEach((step, idx) => {
      const weight = idx + 1; // Later steps have higher weight
      weightedSum += step.confidence * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? weightedSum / weightSum : 0;
  }

  private visualizeStep(step: ThoughtStep, chain: ReasoningChain, indent: number): string {
    const prefix = '  '.repeat(indent) + '├─ ';
    let output = `${prefix}[${step.stepNumber}] ${step.type.toUpperCase()}\n`;
    output += `${'  '.repeat(indent)}   Q: ${step.question}\n`;
    output += `${'  '.repeat(indent)}   R: ${step.reasoning}\n`;
    output += `${'  '.repeat(indent)}   C: ${step.conclusion}\n`;
    output += `${'  '.repeat(indent)}   Confidence: ${(step.confidence * 100).toFixed(1)}%\n`;

    if (step.verification) {
      output += `${'  '.repeat(indent)}   ✓ ${step.verification.result}\n`;
    }

    output += '\n';

    // Find children
    const children = chain.steps.filter(s => s.parentId === step.id);
    for (const child of children) {
      output += this.visualizeStep(child, chain, indent + 1);
    }

    return output;
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private loadChains(): void {
    // Load existing chains from disk
    // Placeholder implementation
  }

  private async persistChain(chain: ReasoningChain): Promise<void> {
    const filePath = path.join(this.storageDir, `${chain.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(chain, null, 2));
  }

  private generateChainId(): string {
    return `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ThoughtStep,
  ThoughtType,
  Evidence,
  Alternative,
  Verification,
  ReasoningChain,
  ReasoningStrategy,
  ChainOfThoughtConfig,
  ReasoningContext,
};
