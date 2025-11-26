/**
 * J4C Enhanced Agent Framework - Comprehensive Demo
 *
 * This demo showcases all three major enhancements:
 * 1. Infinite Context Windows
 * 2. Chain of Thought Reasoning
 * 3. Multiple Mental Models
 *
 * Run with: npx ts-node j4c_enhanced_demo.ts
 *
 * @module j4c_enhanced_demo
 */

import {
  EnhancedAgent,
  EnhancedAgentOrchestrator,
  AgentCapability,
  InteractionMode,
} from './j4c_enhanced_agent_framework';

import {
  InfiniteContextManager,
  ContextType,
  ContextPriority,
} from './j4c_infinite_context_manager';

import {
  ChainOfThoughtReasoner,
  ThoughtType,
  ReasoningStrategy,
} from './j4c_chain_of_thought';

import {
  MentalModelAnalyzer,
  MentalModelType,
} from './j4c_mental_models';

// ============================================================================
// DEMO SCENARIOS
// ============================================================================

/**
 * Demo 1: Infinite Context Windows
 */
async function demoInfiniteContext() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO 1: INFINITE CONTEXT WINDOWS');
  console.log('='.repeat(80) + '\n');

  const contextMgr = new InfiniteContextManager({
    maxActiveMemoryMB: 256,
    crossAgentSharing: true,
    compressionThresholdKB: 50,
  });

  console.log('📝 Adding diverse context types...\n');

  // Add code context
  const codeChunks = await contextMgr.addContext(
    'backend-dev',
    'session-001',
    `
    // User authentication implementation
    export class AuthService {
      async authenticateUser(email: string, password: string): Promise<TokenPair> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new UnauthorizedError();

        const valid = await this.crypto.verify(password, user.passwordHash);
        if (!valid) throw new UnauthorizedError();

        return this.tokenService.generateTokenPair(user.id);
      }
    }
    `,
    ContextType.CODE,
    {
      priority: ContextPriority.HIGH,
      semanticTags: ['authentication', 'security', 'typescript'],
      metadata: { feature: 'auth', language: 'typescript' },
    }
  );

  console.log(`✅ Added code context: ${codeChunks.length} chunks`);

  // Add decision context
  const decisionChunks = await contextMgr.addContext(
    'architect',
    'session-001',
    `
    Architecture Decision Record: Use JWT for Authentication

    Decision: We will use JWT (JSON Web Tokens) for authentication.

    Rationale:
    - Stateless: No server-side session storage needed
    - Scalable: Works well with microservices and load balancers
    - Standard: Wide adoption and library support

    Risks:
    - Token size: JWTs are larger than session IDs
    - Revocation: Difficult to revoke tokens before expiry

    Mitigation:
    - Use short-lived access tokens (15 min)
    - Implement refresh token rotation
    - Maintain token blacklist for critical revocations
    `,
    ContextType.DECISION,
    {
      priority: ContextPriority.CRITICAL,
      semanticTags: ['architecture', 'authentication', 'jwt'],
      references: codeChunks,
    }
  );

  console.log(`✅ Added decision context: ${decisionChunks.length} chunks`);

  // Add error context
  const errorChunks = await contextMgr.addContext(
    'backend-dev',
    'session-002',
    `
    Error Report: JWT Token Expiry Race Condition

    Symptom: Users occasionally see 401 Unauthorized right after successful login

    Investigation:
    - Happens when token expires during multi-step operation
    - Frontend doesn't refresh token proactively
    - Race condition between expiry and refresh

    Root Cause: Frontend checks token expiry at operation start, but token
    can expire mid-operation (e.g., during file upload).

    Fix: Implement token refresh middleware that proactively refreshes
    tokens within 5 minutes of expiry.
    `,
    ContextType.ERROR,
    {
      priority: ContextPriority.HIGH,
      semanticTags: ['bug', 'authentication', 'race-condition'],
    }
  );

  console.log(`✅ Added error context: ${errorChunks.length} chunks\n`);

  // Query context semantically
  console.log('🔍 Querying context with semantic search...\n');

  const authContext = await contextMgr.queryContext({
    semanticTags: ['authentication'],
    types: [ContextType.CODE, ContextType.DECISION, ContextType.ERROR],
    limit: 10,
    includeRelated: true,
  });

  console.log(`Found ${authContext.chunks.length} chunks related to authentication`);
  console.log(`Retrieval time: ${authContext.retrievalTimeMs}ms`);
  console.log(`Hit rate: ${(authContext.metadata.hitRate * 100).toFixed(1)}%\n`);

  // Show statistics
  const stats = contextMgr.getStats();
  console.log('📊 Context Statistics:');
  console.log(`  Total chunks: ${stats.totalChunks}`);
  console.log(`  Total size: ${stats.totalSizeMB.toFixed(2)}MB`);
  console.log(`  Active memory: ${stats.activeMemoryMB.toFixed(2)}MB`);
  console.log(`  Agents: ${stats.agentCount}`);
  console.log(`  Sessions: ${stats.sessionCount}`);
  console.log(`  Avg access time: ${stats.avgAccessTime.toFixed(1)}ms`);
  console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%\n`);

  // Demonstrate compression
  console.log('🗜️  Compressing old context...');
  const compressed = await contextMgr.compressContext(0.01, ContextPriority.NORMAL);
  console.log(`  Compressed ${compressed.compressed} chunks`);
  console.log(`  Saved ${compressed.savedMB.toFixed(2)}MB\n`);
}

/**
 * Demo 2: Chain of Thought Reasoning
 */
async function demoChainOfThought() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO 2: CHAIN OF THOUGHT REASONING');
  console.log('='.repeat(80) + '\n');

  const reasoner = new ChainOfThoughtReasoner({
    maxDepth: 8,
    maxSteps: 20,
    strategy: ReasoningStrategy.BEST_FIRST,
    enableBacktracking: true,
    enableVerification: true,
  });

  console.log('🧠 Starting reasoning chain for complex problem...\n');

  // Start chain
  const chainId = await reasoner.startChain(
    'backend-dev',
    'reasoning-session',
    'Database queries are slow in production but fast in development',
    'Identify root cause and implement fix'
  );

  console.log(`Created reasoning chain: ${chainId}\n`);

  // Add reasoning steps manually
  console.log('Adding reasoning steps...\n');

  await reasoner.addThought(chainId, {
    type: ThoughtType.OBSERVATION,
    question: 'What facts do we know?',
    reasoning: 'Gathering all available information about the problem',
    conclusion: 'Production has 100x more data, different indexes, connection pool size 20',
    confidence: 0.95,
    evidence: [
      {
        type: 'empirical',
        source: 'database logs',
        content: 'Queries take 5s in prod, 50ms in dev',
        strength: 0.9,
        relevance: 1.0,
      },
      {
        type: 'empirical',
        source: 'database schema',
        content: 'Missing index on user_actions.created_at in production',
        strength: 0.85,
        relevance: 0.9,
      },
    ],
  });

  await reasoner.addThought(chainId, {
    type: ThoughtType.HYPOTHESIS,
    question: 'What could be causing the slowness?',
    reasoning: 'Considering multiple potential causes based on evidence',
    conclusion: 'Missing index on high-cardinality column is likely culprit',
    confidence: 0.8,
    alternatives: [
      {
        reasoning: 'Connection pool exhaustion',
        conclusion: 'Pool size too small for load',
        confidence: 0.6,
        whyNotChosen: 'Monitoring shows pool has available connections',
      },
      {
        reasoning: 'Network latency',
        conclusion: 'High latency between app and database',
        confidence: 0.4,
        whyNotChosen: 'Ping times are consistent <1ms',
      },
    ],
  });

  await reasoner.addThought(chainId, {
    type: ThoughtType.DEDUCTION,
    question: 'What follows logically from missing index?',
    reasoning: 'Without index, database must do full table scan on 10M rows',
    conclusion: 'Query performs O(n) scan instead of O(log n) index lookup',
    confidence: 0.9,
  });

  await reasoner.addThought(chainId, {
    type: ThoughtType.EVALUATION,
    question: 'How can we verify this hypothesis?',
    reasoning: 'Examine query execution plan to confirm table scan',
    conclusion: 'EXPLAIN ANALYZE shows sequential scan on user_actions table',
    confidence: 0.95,
  });

  await reasoner.addThought(chainId, {
    type: ThoughtType.DECISION,
    question: 'What is the best solution?',
    reasoning: 'Add composite index on (user_id, created_at) for optimal performance',
    conclusion: 'CREATE INDEX CONCURRENTLY idx_user_actions_user_created ON user_actions(user_id, created_at)',
    confidence: 0.9,
  });

  console.log('✅ Completed reasoning chain with 5 steps\n');

  // Visualize reasoning
  const visualization = reasoner.visualizeChain(chainId);
  console.log(visualization);

  // Get final chain
  const chain = reasoner.getChain(chainId);
  if (chain) {
    console.log(`\n📈 Chain Statistics:`);
    console.log(`  Total steps: ${chain.steps.length}`);
    console.log(`  Branches: ${chain.branchCount}`);
    console.log(`  Backtracks: ${chain.backtrackCount}`);
    console.log(`  Verifications: ${chain.verificationCount}`);
    console.log(`  Duration: ${chain.totalDurationMs}ms`);
    console.log(`  Overall confidence: ${(chain.overallConfidence * 100).toFixed(1)}%\n`);
  }

  // Export to markdown
  const markdown = reasoner.exportToMarkdown(chainId);
  console.log('📄 Reasoning chain exported to markdown format');
  console.log(`   (${markdown.length} characters)\n`);
}

/**
 * Demo 3: Multiple Mental Models
 */
async function demoMentalModels() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO 3: MULTIPLE MENTAL MODELS');
  console.log('='.repeat(80) + '\n');

  const analyzer = new MentalModelAnalyzer({
    enabledModels: [
      MentalModelType.FIRST_PRINCIPLES,
      MentalModelType.SYSTEMS_THINKING,
      MentalModelType.COST_BENEFIT,
      MentalModelType.RISK_ASSESSMENT,
      MentalModelType.SECOND_ORDER,
      MentalModelType.PARETO,
    ],
    minModelsRequired: 5,
    synthesisStrategy: 'weighted',
  });

  console.log('🎯 Analyzing architecture decision with 6 mental models...\n');

  const problem = `
  Should we migrate our monolithic application to microservices?

  Current state:
  - Monolithic Python app serving 50k users
  - 300k LOC, 15 developers, 6 teams
  - Deploy once per week, takes 2 hours
  - Occasional scalability issues during peak
  - Technical debt from 5 years of development

  Constraints:
  - Must maintain 99.9% uptime
  - Limited budget for infrastructure
  - Team has limited k8s/microservices experience
  - Cannot disrupt ongoing feature development
  `;

  const analysis = await analyzer.analyzeWithMultipleModels(problem, {
    domain: 'software architecture',
    constraints: [
      '99.9% uptime requirement',
      'Limited budget',
      'Team learning curve',
      'Cannot stop feature development',
    ],
    goals: [
      'Improve scalability',
      'Faster deployments',
      'Better team autonomy',
      'Reduce technical debt',
    ],
  });

  console.log(`✅ Analysis complete using ${analysis.modelsUsed.length} models\n`);

  // Show convergent insights
  console.log('🎯 CONVERGENT INSIGHTS (agreed by multiple models):\n');
  analysis.synthesis.convergentInsights.forEach((insight, idx) => {
    console.log(`  ${idx + 1}. ${insight}`);
  });

  // Show divergent insights
  console.log('\n⚡ DIVERGENT INSIGHTS (conflicting perspectives):\n');
  analysis.synthesis.divergentInsights.forEach((insight, idx) => {
    console.log(`  ${idx + 1}. ${insight}`);
  });

  // Show emergent patterns
  console.log('\n🔍 EMERGENT PATTERNS:\n');
  analysis.synthesis.emergentPatterns.forEach((pattern, idx) => {
    console.log(`  ${idx + 1}. ${pattern}`);
  });

  // Show meta-insight
  console.log('\n💡 META-INSIGHT:\n');
  console.log(`  ${analysis.synthesis.metaInsight}\n`);

  // Show top recommendations
  console.log('📋 TOP RECOMMENDATIONS:\n');
  analysis.recommendations.slice(0, 5).forEach((rec, idx) => {
    console.log(`  ${idx + 1}. [P${rec.priority}] ${rec.action}`);
    console.log(`     Impact: ${rec.expectedImpact}, Effort: ${rec.effort}, Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
    console.log(`     Supporting models: ${rec.supportingModels.length}/${analysis.modelsUsed.length}\n`);
  });

  // Show risks
  console.log('⚠️  IDENTIFIED RISKS:\n');
  analysis.risks.slice(0, 3).forEach((risk, idx) => {
    console.log(`  ${idx + 1}. ${risk.description}`);
    console.log(`     Probability: ${(risk.probability * 100).toFixed(0)}%, Impact: ${risk.impact}`);
    console.log(`     Detected by: ${risk.detectedBy.length} model(s)\n`);
  });

  // Show opportunities
  console.log('💎 IDENTIFIED OPPORTUNITIES:\n');
  analysis.opportunities.slice(0, 3).forEach((opp, idx) => {
    console.log(`  ${idx + 1}. ${opp.description}`);
    console.log(`     Potential: ${opp.potential}, Effort: ${opp.effort}\n`);
  });

  // Export to markdown
  const markdown = analyzer.exportToMarkdown(analysis.id);
  console.log(`📄 Analysis exported to markdown (${markdown.length} characters)\n`);

  console.log(`📊 Analysis Statistics:`);
  console.log(`  Models used: ${analysis.modelsUsed.length}`);
  console.log(`  Convergent insights: ${analysis.synthesis.convergentInsights.length}`);
  console.log(`  Recommendations: ${analysis.recommendations.length}`);
  console.log(`  Risks identified: ${analysis.risks.length}`);
  console.log(`  Opportunities: ${analysis.opportunities.length}`);
  console.log(`  Overall confidence: ${(analysis.overallConfidence * 100).toFixed(1)}%`);
  console.log(`  Duration: ${analysis.durationMs}ms\n`);
}

/**
 * Demo 4: Integrated Enhanced Agent
 */
async function demoEnhancedAgent() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO 4: INTEGRATED ENHANCED AGENT (ALL FEATURES)');
  console.log('='.repeat(80) + '\n');

  const orchestrator = new EnhancedAgentOrchestrator();

  const agent = orchestrator.registerAgent({
    agentId: 'full-stack-dev',
    sessionId: 'integrated-session',
    capabilities: [
      AgentCapability.CODE_GENERATION,
      AgentCapability.ARCHITECTURE,
      AgentCapability.TESTING,
      AgentCapability.DEBUGGING,
    ],
    contextConfig: {
      maxActiveMemoryMB: 256,
      enableCrossAgentSharing: true,
    },
    reasoningConfig: {
      enableChainOfThought: true,
      defaultStrategy: ReasoningStrategy.BEST_FIRST,
      maxReasoningDepth: 8,
    },
    mentalModelsConfig: {
      enableMultiModelAnalysis: true,
      defaultModels: [
        MentalModelType.FIRST_PRINCIPLES,
        MentalModelType.SYSTEMS_THINKING,
        MentalModelType.RISK_ASSESSMENT,
        MentalModelType.COST_BENEFIT,
      ],
      minModelsRequired: 4,
    },
  });

  console.log('🤖 Created enhanced agent with all capabilities\n');

  console.log('📋 Executing comprehensive task with ALL enhancements...\n');

  const result = await agent.execute({
    task: 'Design and implement a distributed caching layer for our API',
    context: {
      domain: 'backend',
      currentState: {
        apiLoad: '5000 req/sec',
        responseTime: '200ms p99',
        cacheHitRate: 0,
      },
    },
    constraints: [
      'Must reduce response time to <50ms p99',
      'Budget: $2000/month for infrastructure',
      'Need 99.99% cache consistency',
      'Gradual rollout over 4 weeks',
    ],
    goals: [
      'Improve API response times by 75%',
      'Reduce database load by 80%',
      'Maintain data consistency',
      'Zero downtime deployment',
    ],
    useChainOfThought: true,
    useMentalModels: true,
    reasoningStrategy: ReasoningStrategy.BEST_FIRST,
    specificModels: [
      MentalModelType.FIRST_PRINCIPLES,
      MentalModelType.SYSTEMS_THINKING,
      MentalModelType.RISK_ASSESSMENT,
      MentalModelType.COST_BENEFIT,
      MentalModelType.SECOND_ORDER,
    ],
    includeHistoricalContext: true,
  });

  console.log('✅ Task execution complete!\n');

  console.log('📊 EXECUTION RESULTS:\n');
  console.log(`  Success: ${result.success}`);
  console.log(`  Duration: ${result.durationMs}ms\n`);

  if (result.reasoningChainId) {
    console.log(`🧠 REASONING:`);
    console.log(`  Chain ID: ${result.reasoningChainId}`);
    console.log(`  Confidence: ${((result.reasoningConfidence || 0) * 100).toFixed(1)}%\n`);
  }

  if (result.mentalModelAnalysisId) {
    console.log(`🎯 MENTAL MODEL ANALYSIS:`);
    console.log(`  Analysis ID: ${result.mentalModelAnalysisId}`);
    console.log(`  Key insights: ${(result.multiModelInsights || []).length}`);
    console.log(`  Recommendations: ${(result.recommendations || []).length}\n`);
  }

  if (result.contextChunkIds) {
    console.log(`💾 CONTEXT:`);
    console.log(`  Chunks created: ${result.contextChunkIds.length}`);
    console.log(`  Total size: ${result.contextStats?.totalSizeMB.toFixed(2)}MB\n`);
  }

  // Show insights
  if (result.multiModelInsights && result.multiModelInsights.length > 0) {
    console.log('💡 TOP INSIGHTS:\n');
    result.multiModelInsights.slice(0, 3).forEach((insight, idx) => {
      console.log(`  ${idx + 1}. ${insight}`);
    });
    console.log();
  }

  // Show recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    console.log('📋 TOP RECOMMENDATIONS:\n');
    result.recommendations.slice(0, 3).forEach((rec: any, idx: number) => {
      console.log(`  ${idx + 1}. [P${rec.priority}] ${rec.action}`);
      console.log(`     Impact: ${rec.expectedImpact}, Confidence: ${(rec.confidence * 100).toFixed(0)}%\n`);
    });
  }

  // Get context summary
  const contextSummary = await agent.getContextSummary();
  console.log('📊 AGENT CONTEXT SUMMARY:');
  console.log(`  Total chunks: ${contextSummary.stats.totalChunks}`);
  console.log(`  Total size: ${contextSummary.stats.totalSizeMB.toFixed(2)}MB`);
  console.log(`  Compression ratio: ${contextSummary.stats.compressionRatio.toFixed(2)}x`);
  console.log(`  Hit rate: ${(contextSummary.stats.hitRate * 100).toFixed(1)}%\n`);
}

/**
 * Demo 5: Multi-Agent Collaboration
 */
async function demoCollaboration() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO 5: MULTI-AGENT COLLABORATION WITH CONTEXT SHARING');
  console.log('='.repeat(80) + '\n');

  const orchestrator = new EnhancedAgentOrchestrator();

  console.log('🤖 Registering 3 specialized agents...\n');

  orchestrator.registerAgent({
    agentId: 'architect',
    sessionId: 'collab-session',
    capabilities: [AgentCapability.ARCHITECTURE, AgentCapability.PLANNING],
  });

  orchestrator.registerAgent({
    agentId: 'backend-dev',
    sessionId: 'collab-session',
    capabilities: [AgentCapability.CODE_GENERATION, AgentCapability.TESTING],
  });

  orchestrator.registerAgent({
    agentId: 'qa-engineer',
    sessionId: 'collab-session',
    capabilities: [AgentCapability.TESTING, AgentCapability.CODE_REVIEW],
  });

  console.log('🚀 Executing collaborative task with context sharing...\n');

  const result = await orchestrator.executeCollaborative(
    ['architect', 'backend-dev', 'qa-engineer'],
    'Implement payment processing with Stripe API',
    {
      useChainOfThought: true,
      useMentalModels: true,
      shareContextBetweenAgents: true,
    }
  );

  console.log('✅ Collaborative execution complete!\n');

  console.log('📊 COLLABORATION RESULTS:\n');
  console.log(`  Overall success: ${result.success}`);
  console.log(`  Total duration: ${result.totalDurationMs}ms`);
  console.log(`  Agents participated: ${result.results.length}\n`);

  result.results.forEach((agentResult: any, idx: number) => {
    console.log(`  Agent ${idx + 1}:`);
    console.log(`    Success: ${agentResult.success}`);
    console.log(`    Duration: ${agentResult.durationMs}ms`);
    console.log(`    Reasoning confidence: ${((agentResult.reasoningConfidence || 0) * 100).toFixed(1)}%`);
    console.log(`    Context shared: ${(agentResult.contextChunkIds || []).length} chunks\n`);
  });

  const stats = orchestrator.getStats();
  console.log('🌐 ORCHESTRATOR STATISTICS:');
  console.log(`  Total agents: ${stats.agentCount}`);
  console.log(`  Context chunks: ${stats.contextStats.totalChunks}`);
  console.log(`  Context size: ${stats.contextStats.totalSizeMB.toFixed(2)}MB`);
  console.log(`  Agents: ${stats.agents.join(', ')}\n`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  J4C ENHANCED AGENT FRAMEWORK v3.0 - COMPREHENSIVE DEMO'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  try {
    // Run all demos
    await demoInfiniteContext();
    await demoChainOfThought();
    await demoMentalModels();
    await demoEnhancedAgent();
    await demoCollaboration();

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL DEMOS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80) + '\n');

    console.log('📚 Next Steps:\n');
    console.log('  1. Review the documentation: J4C_ENHANCED_AGENT_DOCUMENTATION.md');
    console.log('  2. Explore the API reference');
    console.log('  3. Build your own enhanced agents');
    console.log('  4. Integrate with existing J4C framework');
    console.log('  5. Share your feedback and improvements\n');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run demos if executed directly
if (require.main === module) {
  main().then(() => {
    console.log('Demo execution finished.');
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  demoInfiniteContext,
  demoChainOfThought,
  demoMentalModels,
  demoEnhancedAgent,
  demoCollaboration,
};
