# J4C Enhanced Agent Framework v3.0 - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Installation & Setup](#installation--setup)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Examples](#examples)
8. [Best Practices](#best-practices)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The J4C Enhanced Agent Framework v3.0 introduces three revolutionary capabilities that enable AI agents to operate with unprecedented sophistication:

### 1. **Infinite Context Windows**
- **Unlimited context** across multiple agents and sessions
- **Semantic indexing** for fast retrieval
- **Automatic compression** to save memory
- **Cross-agent context sharing** for collaboration
- **Hierarchical storage** (memory → disk → compressed)

### 2. **Chain of Thought Reasoning**
- **Step-by-step reasoning** with full traceability
- **Multiple reasoning strategies** (forward, backward, best-first, etc.)
- **Self-verification** and automatic backtracking
- **Confidence scoring** at each step
- **Visual reasoning trees** for debugging

### 3. **Multiple Mental Models**
- **14 cognitive frameworks** for problem analysis
- **Convergent insights** across models
- **Risk and opportunity identification**
- **Prioritized recommendations**
- **Synthesis of diverse perspectives**

### Why These Enhancements Matter

Traditional AI agents face three critical limitations:

1. **Context Limits**: Fixed window sizes force forgetting important information
2. **Black Box Reasoning**: Opaque decision-making without explanation
3. **Single Perspective**: Limited analysis approaches miss insights

The Enhanced Framework solves these problems comprehensively.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  Enhanced Agent Orchestrator                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Enhanced Agent                           │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │   Infinite   │  │  Chain of    │  │  Mental Model   │ │ │
│  │  │   Context    │  │   Thought    │  │   Analyzer      │ │ │
│  │  │   Manager    │  │   Reasoner   │  │                 │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │         │                  │                   │          │ │
│  │         └──────────────────┴───────────────────┘          │ │
│  │                            │                               │ │
│  │                  ┌─────────▼──────────┐                   │ │
│  │                  │  Task Execution    │                   │ │
│  │                  │  Engine            │                   │ │
│  │                  └────────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Storage Layer   │
                    │  - Context DB    │
                    │  - Reasoning DB  │
                    │  - Analysis DB   │
                    └──────────────────┘
```

### Module Structure

```
j4c_enhanced_agent_framework.ts       # Main integration layer
├── j4c_infinite_context_manager.ts   # Context management
├── j4c_chain_of_thought.ts           # Reasoning engine
└── j4c_mental_models.ts               # Mental model analysis

Integration with existing J4C:
├── j4c_integration_layer.ts          # Base framework
├── j4c_continuous_learning_framework.ts
├── j4c_agent_communication.ts
├── j4c_session_state_manager.ts
└── j4c_multi_session_integration.ts
```

---

## Core Features

### Feature 1: Infinite Context Windows

#### Key Capabilities

✅ **Unlimited Storage**: Store gigabytes of context without memory limits
✅ **Semantic Search**: Query by tags, types, time ranges, priorities
✅ **Automatic Compression**: Reduce storage by 5-10x for old context
✅ **Cross-Agent Sharing**: Share context between collaborating agents
✅ **Smart Eviction**: LRU/priority-based memory management
✅ **Fast Retrieval**: Sub-100ms queries with caching

#### Context Types

- **Code**: Source code, snippets, patches
- **Documentation**: Requirements, specs, guides
- **Conversation**: Agent-user interactions
- **Decision**: Critical choices and rationale
- **Error**: Failures and debugging info
- **Pattern**: Detected patterns and practices
- **Best Practice**: Validated approaches
- **Execution Result**: Task outcomes
- **Analysis**: Investigations and reports
- **Requirement**: User needs and constraints

#### Priority Levels

1. **CRITICAL**: Never evicted (decisions, requirements)
2. **HIGH**: Evict last (active work)
3. **NORMAL**: Standard eviction
4. **LOW**: Evict early (old conversations)
5. **ARCHIVAL**: Compress aggressively

### Feature 2: Chain of Thought Reasoning

#### Reasoning Types

1. **OBSERVATION**: Gather facts
2. **HYPOTHESIS**: Propose explanations
3. **DEDUCTION**: Logical inference
4. **INDUCTION**: Pattern generalization
5. **ABDUCTION**: Best explanation
6. **ANALYSIS**: Break down problem
7. **SYNTHESIS**: Combine insights
8. **EVALUATION**: Assess options
9. **DECISION**: Make choice
10. **VERIFICATION**: Check validity
11. **BACKTRACK**: Revise reasoning

#### Reasoning Strategies

- **FORWARD_CHAIN**: Start from facts → derive conclusion
- **BACKWARD_CHAIN**: Start from goal → find path
- **BIDIRECTIONAL**: Meet in the middle
- **DEPTH_FIRST**: Explore deeply first
- **BREADTH_FIRST**: Explore broadly first
- **BEST_FIRST**: Follow highest confidence
- **MONTE_CARLO**: Sample multiple paths

### Feature 3: Multiple Mental Models

#### 14 Mental Models

1. **First Principles**: Break down to fundamental truths
2. **Systems Thinking**: Analyze interconnections
3. **Lateral Thinking**: Creative alternatives
4. **Inversion**: Think about failure modes
5. **Second Order**: Consider consequences of consequences
6. **Probabilistic**: Reason with uncertainty
7. **Cost-Benefit**: Quantify tradeoffs
8. **Risk Assessment**: Identify and mitigate risks
9. **Pattern Recognition**: Match historical cases
10. **Analogical**: Reason by analogy
11. **Pareto**: Apply 80/20 rule
12. **Occam's Razor**: Prefer simplest explanation
13. **Feedback Loops**: Identify reinforcing/balancing cycles
14. **Constraints**: Work within limits

#### Analysis Outputs

- **Convergent Insights**: Agreed upon by multiple models
- **Divergent Insights**: Conflicting perspectives
- **Emergent Patterns**: Patterns from combination
- **Blind Spots**: What might be missing
- **Meta-Insight**: High-level synthesis
- **Prioritized Recommendations**: With confidence scores
- **Risk Register**: Probability × Impact
- **Opportunity List**: Potential benefits

---

## Installation & Setup

### Prerequisites

```bash
# Node.js 16+ and TypeScript
node --version  # v16.0.0+
npm install -g typescript
```

### Installation

```bash
# 1. Clone or navigate to your J4C project
cd /path/to/your/project

# 2. Install dependencies (if needed)
npm install

# 3. Compile TypeScript
npx tsc j4c_infinite_context_manager.ts
npx tsc j4c_chain_of_thought.ts
npx tsc j4c_mental_models.ts
npx tsc j4c_enhanced_agent_framework.ts
```

### Configuration

Create a configuration file `.j4c/enhanced_config.json`:

```json
{
  "contextManager": {
    "maxActiveMemoryMB": 512,
    "maxDiskStorageGB": 10,
    "compressionThresholdKB": 100,
    "evictionPolicy": "PRIORITY",
    "crossAgentSharing": true
  },
  "reasoner": {
    "maxDepth": 10,
    "maxSteps": 50,
    "defaultStrategy": "BEST_FIRST",
    "enableBacktracking": true,
    "enableVerification": true
  },
  "mentalModels": {
    "enabledModels": [
      "FIRST_PRINCIPLES",
      "SYSTEMS_THINKING",
      "PROBABILISTIC",
      "RISK_ASSESSMENT",
      "COST_BENEFIT"
    ],
    "minModelsRequired": 3,
    "synthesisStrategy": "weighted"
  }
}
```

---

## Usage Guide

### Quick Start

```typescript
import {
  EnhancedAgent,
  EnhancedAgentOrchestrator,
  AgentCapability,
  InteractionMode
} from './j4c_enhanced_agent_framework';

// Create an orchestrator
const orchestrator = new EnhancedAgentOrchestrator();

// Register an enhanced agent
const agent = orchestrator.registerAgent({
  agentId: 'backend-dev-001',
  sessionId: 'session-123',
  capabilities: [
    AgentCapability.CODE_GENERATION,
    AgentCapability.DEBUGGING,
    AgentCapability.TESTING
  ],
  contextConfig: {
    maxActiveMemoryMB: 256,
    enableCrossAgentSharing: true
  },
  reasoningConfig: {
    enableChainOfThought: true,
    defaultStrategy: 'BEST_FIRST',
    maxReasoningDepth: 8
  },
  mentalModelsConfig: {
    enableMultiModelAnalysis: true,
    minModelsRequired: 3
  }
});

// Execute a task with full enhancements
const result = await agent.execute({
  task: 'Implement user authentication with JWT tokens',
  constraints: [
    'Must be secure against common attacks',
    'Should support refresh tokens',
    'Needs to scale to 10k users'
  ],
  goals: [
    'Production-ready implementation',
    'Comprehensive test coverage',
    'Clear documentation'
  ],
  useChainOfThought: true,
  useMentalModels: true,
  includeHistoricalContext: true
});

console.log('Success:', result.success);
console.log('Reasoning confidence:', result.reasoningConfidence);
console.log('Insights:', result.multiModelInsights);
console.log('Recommendations:', result.recommendations);
```

### Execution Modes

#### 1. Simple Mode (No Enhancements)

```typescript
const result = await agent.execute({
  task: 'Fix typo in README.md',
  // useChainOfThought: false (default)
  // useMentalModels: false (default)
});
```

**Use when**: Simple, routine tasks that don't need deep analysis

#### 2. Reasoning Mode

```typescript
const result = await agent.execute({
  task: 'Debug race condition in payment processing',
  useChainOfThought: true,
  reasoningStrategy: 'BACKWARD_CHAIN',
  constraints: ['Cannot reproduce consistently', 'Occurs under high load']
});

// Export reasoning for review
const reasoning = await agent.exportReasoningChains();
console.log(reasoning[0]); // Markdown visualization
```

**Use when**: Complex debugging, algorithmic design, tricky problems

#### 3. Analytical Mode

```typescript
const result = await agent.execute({
  task: 'Design caching strategy for API endpoints',
  useMentalModels: true,
  specificModels: [
    'SYSTEMS_THINKING',
    'COST_BENEFIT',
    'RISK_ASSESSMENT',
    'PARETO'
  ]
});

console.log('Convergent insights:', result.multiModelInsights);
console.log('Top recommendations:', result.recommendations.slice(0, 3));
```

**Use when**: Architecture decisions, tradeoff analysis, planning

#### 4. Comprehensive Mode (All Enhancements)

```typescript
const result = await agent.execute({
  task: 'Migrate from monolith to microservices',
  useChainOfThought: true,
  useMentalModels: true,
  includeHistoricalContext: true,
  constraints: [
    'Zero downtime required',
    'Gradual migration over 6 months',
    'Maintain backward compatibility'
  ],
  goals: [
    'Improved scalability',
    'Better team autonomy',
    'Reduced deployment risk'
  ]
});

// Rich output with all artifacts
console.log('Reasoning chain:', result.reasoningVisualization);
console.log('Mental model analysis:', result.mentalModelAnalysisId);
console.log('Overall confidence:', result.reasoningConfidence);
console.log('Recommendations:', result.recommendations);
```

**Use when**: Critical decisions, major architecture changes, high-stakes work

---

## API Reference

### EnhancedAgent

#### Constructor

```typescript
constructor(config: EnhancedAgentConfig)
```

#### Methods

##### execute()

```typescript
async execute(request: EnhancedExecutionRequest): Promise<EnhancedExecutionResult>
```

Execute a task with optional enhancements.

**Parameters:**
- `request.task` (string): Task description
- `request.constraints` (string[]): Optional constraints
- `request.goals` (string[]): Optional goals
- `request.useChainOfThought` (boolean): Enable reasoning
- `request.useMentalModels` (boolean): Enable analysis
- `request.reasoningStrategy` (ReasoningStrategy): Reasoning approach
- `request.specificModels` (MentalModelType[]): Models to use
- `request.includeHistoricalContext` (boolean): Load history
- `request.shareContextWith` (string[]): Agent IDs to share with

**Returns:** `EnhancedExecutionResult` with:
- `success`: Execution status
- `output`: Result data
- `reasoningChainId`: Chain ID if reasoning used
- `reasoningVisualization`: Visual reasoning tree
- `reasoningConfidence`: Confidence score
- `mentalModelAnalysisId`: Analysis ID
- `multiModelInsights`: Key insights
- `recommendations`: Prioritized actions
- `contextChunkIds`: Stored context IDs
- `durationMs`: Execution time

##### getContextSummary()

```typescript
async getContextSummary(): Promise<ContextSummary>
```

Get agent's context statistics.

##### exportReasoningChains()

```typescript
async exportReasoningChains(): Promise<string[]>
```

Export all reasoning chains to markdown.

##### queryContext()

```typescript
async queryContext(query: ContextQuery): Promise<ContextResult>
```

Query stored context with semantic search.

##### compressOldContext()

```typescript
async compressOldContext(olderThanHours: number): Promise<CompressionResult>
```

Compress context older than specified hours.

### InfiniteContextManager

#### Methods

##### addContext()

```typescript
async addContext(
  agentId: string,
  sessionId: string,
  content: string,
  type: ContextType,
  options?: {
    priority?: ContextPriority;
    semanticTags?: string[];
    references?: string[];
    metadata?: Record<string, any>;
  }
): Promise<string[]>
```

Add content to infinite context window.

##### queryContext()

```typescript
async queryContext(query: ContextQuery): Promise<ContextResult>
```

Query context with semantic search.

**Query options:**
- `agentId`: Filter by agent
- `sessionId`: Filter by session
- `types`: Filter by context types
- `semanticTags`: Filter by tags
- `timeRange`: Filter by timestamp
- `priorityMin`: Minimum priority
- `limit`: Max results
- `includeRelated`: Follow references

##### shareContext()

```typescript
async shareContext(
  fromAgentId: string,
  toAgentId: string,
  chunkIds: string[]
): Promise<void>
```

Share context between agents.

##### compressContext()

```typescript
async compressContext(
  olderThanHours: number,
  minPriority: ContextPriority
): Promise<CompressionStats>
```

Compress old or low-priority context.

##### getStats()

```typescript
getStats(): ContextStats
```

Get context manager statistics.

### ChainOfThoughtReasoner

#### Methods

##### startChain()

```typescript
async startChain(
  agentId: string,
  sessionId: string,
  problem: string,
  goal: string,
  metadata?: Record<string, any>
): Promise<string>
```

Start a new reasoning chain.

##### addThought()

```typescript
async addThought(
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
): Promise<string>
```

Add a reasoning step to chain.

##### reason()

```typescript
async reason(
  chainId: string,
  context: ReasoningContext,
  strategy?: ReasoningStrategy
): Promise<ReasoningChain>
```

Execute automated reasoning with strategy.

##### visualizeChain()

```typescript
visualizeChain(chainId: string): string
```

Generate ASCII tree visualization.

##### exportToMarkdown()

```typescript
exportToMarkdown(chainId: string): string
```

Export chain to markdown format.

### MentalModelAnalyzer

#### Methods

##### analyzeWithMultipleModels()

```typescript
async analyzeWithMultipleModels(
  problem: string,
  context?: {
    domain?: string;
    constraints?: string[];
    goals?: string[];
    currentState?: Record<string, any>;
    evidence?: Evidence[];
  }
): Promise<MultiModelAnalysis>
```

Analyze problem with multiple mental models.

##### applyModel()

```typescript
async applyModel(
  model: MentalModelType,
  problem: string,
  context?: any
): Promise<ModelAnalysis>
```

Apply a specific mental model.

##### exportToMarkdown()

```typescript
exportToMarkdown(analysisId: string): string
```

Export analysis to markdown format.

---

## Examples

### Example 1: Debugging with Chain of Thought

```typescript
import { EnhancedAgent, AgentCapability } from './j4c_enhanced_agent_framework';
import { ThoughtType } from './j4c_chain_of_thought';

const debugAgent = new EnhancedAgent({
  agentId: 'debug-agent-001',
  sessionId: 'debug-session',
  capabilities: [AgentCapability.DEBUGGING],
  reasoningConfig: {
    enableChainOfThought: true,
    defaultStrategy: 'BACKWARD_CHAIN',
    enableBacktracking: true
  }
});

const result = await debugAgent.execute({
  task: 'Fix intermittent database connection timeout in production',
  constraints: [
    'Only happens under load (>1000 req/sec)',
    'Connection pool size is 20',
    'Timeout is set to 30 seconds',
    'No errors in database logs'
  ],
  goals: ['Identify root cause', 'Implement fix', 'Add monitoring'],
  useChainOfThought: true,
  reasoningStrategy: 'BACKWARD_CHAIN',
  includeHistoricalContext: true
});

console.log('='.repeat(80));
console.log('DEBUGGING REASONING CHAIN');
console.log('='.repeat(80));
console.log(result.reasoningVisualization);
console.log('\nConfidence:', (result.reasoningConfidence! * 100).toFixed(1) + '%');
```

**Output:**
```
================================================================================
DEBUGGING REASONING CHAIN
================================================================================
REASONING CHAIN: chain_1234567890_abc123
Problem: Fix intermittent database connection timeout in production
Goal: Identify root cause
Strategy: BACKWARD_CHAIN
================================================================================

├─ [1] OBSERVATION
   Q: What is our goal?
   R: Identifying the target state we want to reach
   C: Goal: Identify root cause
   Confidence: 100.0%

├─ [2] ANALYSIS
   Q: What do we need to achieve the goal?
   R: Working backwards to identify required conditions
   C: Prerequisites identified
   Confidence: 80.0%

   ├─ [3] EVALUATION
      Q: What do we currently have?
      R: Comparing current state to prerequisites
      C: Gaps identified between current and required state
      Confidence: 85.0%

├─ [4] SYNTHESIS
   Q: How do we bridge the gaps?
   R: Synthesizing action plan to reach goal
   C: Action plan created
   Confidence: 75.0%

================================================================================
FINAL CONCLUSION: Action plan created
Overall Confidence: 81.2%
Total Steps: 4
Branches: 1
Backtracks: 0
Duration: 234ms
================================================================================

Confidence: 81.2%
```

### Example 2: Architecture Decision with Mental Models

```typescript
import { EnhancedAgent } from './j4c_enhanced_agent_framework';
import { MentalModelType } from './j4c_mental_models';

const architectAgent = new EnhancedAgent({
  agentId: 'architect-001',
  sessionId: 'architecture-session',
  capabilities: [AgentCapability.ARCHITECTURE],
  mentalModelsConfig: {
    enableMultiModelAnalysis: true,
    defaultModels: [
      MentalModelType.FIRST_PRINCIPLES,
      MentalModelType.SYSTEMS_THINKING,
      MentalModelType.COST_BENEFIT,
      MentalModelType.RISK_ASSESSMENT,
      MentalModelType.SECOND_ORDER
    ],
    minModelsRequired: 5
  }
});

const result = await architectAgent.execute({
  task: 'Choose between serverless (AWS Lambda) vs. traditional servers (EC2) for new microservice',
  context: {
    domain: 'e-commerce',
    currentState: {
      traffic: '10M requests/month',
      peakLoad: '5000 req/sec',
      teamSize: 5,
      budget: '$5000/month'
    }
  },
  constraints: [
    'Must handle 10x growth',
    'Team has limited DevOps experience',
    'Need <100ms p99 latency'
  ],
  goals: [
    'Minimize operational overhead',
    'Optimize costs',
    'Ensure reliability'
  ],
  useMentalModels: true,
  specificModels: [
    MentalModelType.FIRST_PRINCIPLES,
    MentalModelType.SYSTEMS_THINKING,
    MentalModelType.COST_BENEFIT,
    MentalModelType.RISK_ASSESSMENT,
    MentalModelType.SECOND_ORDER,
    MentalModelType.PARETO
  ]
});

console.log('=== CONVERGENT INSIGHTS ===');
result.multiModelInsights?.forEach((insight, idx) => {
  console.log(`${idx + 1}. ${insight}`);
});

console.log('\n=== TOP RECOMMENDATIONS ===');
result.recommendations?.slice(0, 3).forEach((rec, idx) => {
  console.log(`${idx + 1}. [Priority ${rec.priority}/5] ${rec.action}`);
  console.log(`   Impact: ${rec.expectedImpact}, Effort: ${rec.effort}`);
  console.log(`   Supporting models: ${rec.supportingModels.length}`);
});
```

**Output:**
```
=== CONVERGENT INSIGHTS ===
1. Serverless reduces operational complexity significantly
2. Cost scales with usage (better for variable traffic)
3. Cold start latency is a concern for p99 requirement
4. Limited control over infrastructure with serverless
5. Team's limited DevOps skills favor serverless

=== TOP RECOMMENDATIONS ===
1. [Priority 1/5] Use serverless with provisioned concurrency for critical paths
   Impact: high, Effort: medium
   Supporting models: 6

2. [Priority 2/5] Implement hybrid approach: serverless for APIs, EC2 for background jobs
   Impact: high, Effort: high
   Supporting models: 4

3. [Priority 3/5] Start with serverless, monitor cold starts, add provisioning if needed
   Impact: medium, Effort: low
   Supporting models: 5
```

### Example 3: Collaborative Multi-Agent Task

```typescript
import { EnhancedAgentOrchestrator, AgentCapability } from './j4c_enhanced_agent_framework';

const orchestrator = new EnhancedAgentOrchestrator();

// Register multiple agents
const backendAgent = orchestrator.registerAgent({
  agentId: 'backend-dev',
  sessionId: 'collab-session',
  capabilities: [AgentCapability.CODE_GENERATION, AgentCapability.TESTING]
});

const frontendAgent = orchestrator.registerAgent({
  agentId: 'frontend-dev',
  sessionId: 'collab-session',
  capabilities: [AgentCapability.CODE_GENERATION, AgentCapability.DOCUMENTATION]
});

const qaAgent = orchestrator.registerAgent({
  agentId: 'qa-engineer',
  sessionId: 'collab-session',
  capabilities: [AgentCapability.TESTING, AgentCapability.CODE_REVIEW]
});

// Execute collaborative task
const result = await orchestrator.executeCollaborative(
  ['backend-dev', 'frontend-dev', 'qa-engineer'],
  'Implement real-time notifications feature',
  {
    useChainOfThought: true,
    useMentalModels: true,
    shareContextBetweenAgents: true
  }
);

console.log('Collaborative task success:', result.success);
console.log('Total duration:', result.totalDurationMs + 'ms');
console.log('Results per agent:', result.results.length);

result.results.forEach((agentResult, idx) => {
  console.log(`\nAgent ${idx + 1}:`);
  console.log('  Success:', agentResult.success);
  console.log('  Reasoning confidence:', agentResult.reasoningConfidence);
  console.log('  Context shared:', agentResult.contextChunkIds?.length || 0, 'chunks');
});
```

### Example 4: Context Query Across Sessions

```typescript
import { InfiniteContextManager, ContextType, ContextPriority } from './j4c_infinite_context_manager';

const contextMgr = new InfiniteContextManager({
  maxActiveMemoryMB: 512,
  crossAgentSharing: true
});

// Add various types of context
await contextMgr.addContext(
  'backend-dev',
  'session-1',
  'Implemented JWT authentication with refresh tokens...',
  ContextType.CODE,
  {
    priority: ContextPriority.HIGH,
    semanticTags: ['authentication', 'security', 'jwt'],
    metadata: { feature: 'auth', status: 'completed' }
  }
);

// Query context semantically
const authContext = await contextMgr.queryContext({
  semanticTags: ['authentication', 'security'],
  types: [ContextType.CODE, ContextType.DECISION],
  priorityMin: ContextPriority.NORMAL,
  limit: 20,
  includeRelated: true
});

console.log('Found', authContext.chunks.length, 'relevant chunks');
console.log('Retrieval time:', authContext.retrievalTimeMs + 'ms');
console.log('Hit rate:', (authContext.metadata.hitRate * 100).toFixed(1) + '%');

// Get statistics
const stats = contextMgr.getStats();
console.log('\nContext Statistics:');
console.log('Total chunks:', stats.totalChunks);
console.log('Total size:', stats.totalSizeMB.toFixed(2) + 'MB');
console.log('Active memory:', stats.activeMemoryMB.toFixed(2) + 'MB');
console.log('Compression ratio:', stats.compressionRatio.toFixed(2) + 'x');
console.log('Avg access time:', stats.avgAccessTime.toFixed(1) + 'ms');
console.log('Hit rate:', (stats.hitRate * 100).toFixed(1) + '%');
```

---

## Best Practices

### 1. Context Management

#### DO ✅

- Use appropriate **ContextType** for each content
- Set **priority** based on importance (CRITICAL for decisions)
- Add **semantic tags** for better retrieval
- **Compress** context older than 24 hours for non-critical data
- **Share context** between collaborating agents
- Query with **includeRelated: true** for comprehensive results

#### DON'T ❌

- Don't store everything as CRITICAL priority
- Don't skip semantic tags (hurts retrieval)
- Don't forget to compress old context (wastes space)
- Don't query without limits (slow performance)
- Don't share sensitive context across agent boundaries

### 2. Chain of Thought Reasoning

#### DO ✅

- Use **BACKWARD_CHAIN** for goal-oriented problems
- Use **FORWARD_CHAIN** for exploratory analysis
- Use **BEST_FIRST** when you want highest confidence path
- Enable **backtracking** for complex problems
- Enable **verification** for critical decisions
- Export reasoning chains for debugging and auditing
- Set **minConfidence** threshold appropriately

#### DON'T ❌

- Don't use reasoning for trivial tasks (overhead)
- Don't disable verification for important decisions
- Don't ignore low confidence scores
- Don't exceed maxDepth unnecessarily (slow)
- Don't forget to visualize chains for debugging

### 3. Mental Models

#### DO ✅

- Use **3-5 models** for balanced analysis
- Include **RISK_ASSESSMENT** for production changes
- Include **COST_BENEFIT** for resource decisions
- Include **SYSTEMS_THINKING** for architecture
- Include **FIRST_PRINCIPLES** for novel problems
- Review **convergent insights** (high confidence)
- Review **divergent insights** (explore tensions)
- Follow **prioritized recommendations**

#### DON'T ❌

- Don't use all 14 models for simple problems (slow)
- Don't use only 1 model (defeats the purpose)
- Don't ignore warnings and risks
- Don't skip synthesis (loses meta-insights)
- Don't apply models mechanically (context matters)

### 4. Integration with Existing J4C

The enhanced framework integrates seamlessly with existing J4C features:

```typescript
import { J4CIntegrationLayer } from './j4c_integration_layer';
import { EnhancedAgent } from './j4c_enhanced_agent_framework';

// Combine with continuous learning
const j4c = new J4CIntegrationLayer();
const agent = new EnhancedAgent({...});

// Execute with learning feedback
const result = await agent.execute({
  task: 'Implement caching layer',
  useChainOfThought: true,
  useMentalModels: true
});

// Record feedback for continuous learning
await j4c.recordAgentFeedback({
  agentId: agent.config.agentId,
  taskId: 'task-123',
  outcome: 'success',
  qualityScore: 0.9,
  complianceScore: 0.95,
  practicesApplied: ['caching', 'performance'],
  reasoningChainId: result.reasoningChainId,
  mentalModelAnalysisId: result.mentalModelAnalysisId
});
```

---

## Performance Considerations

### Memory Usage

| Component | Memory (MB) | Notes |
|-----------|-------------|-------|
| Context Manager | 512 (default) | Configurable via maxActiveMemoryMB |
| Chain of Thought | 10-50 | Depends on chain depth/steps |
| Mental Models | 20-100 | Depends on number of models |
| **Total** | **~600MB** | Per agent |

**Optimization tips:**
- Reduce `maxActiveMemoryMB` for memory-constrained environments
- Enable compression for old context
- Limit `maxSteps` and `maxDepth` for reasoning
- Use fewer mental models (3-5 instead of all 14)

### Execution Time

| Operation | Time | Notes |
|-----------|------|-------|
| Simple execution | <100ms | No enhancements |
| With reasoning | 1-5s | Depends on strategy/depth |
| With mental models | 2-10s | Depends on number of models |
| Comprehensive | 5-15s | All enhancements |
| Context query | 10-100ms | Depends on index size |
| Context compression | 1-30s | Depends on data size |

**Optimization tips:**
- Use simple mode for routine tasks
- Use reasoning mode only for complex problems
- Use analytical mode for decisions/planning
- Use comprehensive mode sparingly (high-stakes only)
- Enable `parallelExecution` for mental models
- Set appropriate `timeoutMs` values

### Storage

| Data | Size | Location |
|------|------|----------|
| Context chunks | ~1MB per 1000 chunks | `.j4c/context/chunks/` |
| Context indexes | ~100KB per 10000 chunks | `.j4c/context/indexes/` |
| Reasoning chains | ~10KB per chain | `.j4c/reasoning/` |
| Mental model analyses | ~50KB per analysis | `.j4c/mental_models/` |

**Storage management:**
- Run compression regularly (`compressContext()`)
- Clear old context for completed sessions
- Archive reasoning chains periodically
- Set `maxDiskStorageGB` appropriately

---

## Troubleshooting

### Issue: Out of Memory

**Symptoms:** Process crashes with heap out of memory

**Solutions:**
1. Reduce `maxActiveMemoryMB` in context config
2. Run `compressContext()` more frequently
3. Clear context for old sessions: `clearContext(agentId, sessionId)`
4. Reduce number of concurrent agents

### Issue: Slow Query Performance

**Symptoms:** Context queries take >1 second

**Solutions:**
1. Add more specific semantic tags
2. Filter by `agentId` or `sessionId`
3. Set lower `limit` values
4. Use more specific `ContextType` filters
5. Check if indexes are loaded (`loadIndexes()`)

### Issue: Low Reasoning Confidence

**Symptoms:** Reasoning chains return <60% confidence

**Solutions:**
1. Provide more context and evidence
2. Use different reasoning strategy
3. Enable backtracking and verification
4. Break problem into smaller sub-problems
5. Review reasoning visualization for weak steps

### Issue: Contradictory Mental Model Insights

**Symptoms:** Models provide conflicting recommendations

**Solutions:**
1. Review divergent insights carefully (often valuable)
2. Use synthesis meta-insight for balanced view
3. Consider which models are most relevant to domain
4. Add more models to get clearer convergence
5. Consult prioritized recommendations (already synthesized)

### Issue: Context Not Shared Between Agents

**Symptoms:** Agent B cannot access Agent A's context

**Solutions:**
1. Ensure `crossAgentSharing: true` in config
2. Call `shareContext()` explicitly with chunk IDs
3. Use `shareContextWith` in execution request
4. Check that both agents use same orchestrator
5. Verify chunk IDs are valid

---

## Conclusion

The J4C Enhanced Agent Framework v3.0 represents a quantum leap in AI agent capabilities:

- **Infinite context** enables agents to remember and utilize unlimited information
- **Chain of thought** makes reasoning transparent and debuggable
- **Mental models** bring diverse cognitive perspectives to problem-solving

Together, these enhancements create agents that are more capable, more explainable, and more aligned with how humans solve complex problems.

### Next Steps

1. **Start simple**: Use one enhancement at a time
2. **Experiment**: Try different reasoning strategies and mental models
3. **Iterate**: Refine based on results and feedback
4. **Scale**: Gradually enable more enhancements as needed
5. **Contribute**: Share your learnings and improvements

### Resources

- [J4C Base Framework Documentation](./J4C_DOCUMENTATION_INDEX.md)
- [GitHub Repository](https://github.com/your-org/j4c-framework)
- [Examples Repository](./examples/)
- [API Reference](./api/)

### Support

For questions, issues, or contributions:
- GitHub Issues: [Report bugs/requests](https://github.com/your-org/j4c-framework/issues)
- Discord: [Join community](https://discord.gg/j4c-framework)
- Email: support@j4c-framework.dev

---

**J4C Enhanced Agent Framework v3.0** - Built for the future of AI agent development.
