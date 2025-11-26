/**
 * J4C Enhanced Agent Framework - Quick Start Example
 *
 * This is a minimal example to get you started quickly.
 * Run with: npx ts-node j4c_enhanced_quickstart.ts
 */

import {
  InfiniteContextManager,
  ContextType,
  ContextPriority,
} from './j4c_infinite_context_manager';

import {
  ChainOfThoughtReasoner,
  ThoughtType,
} from './j4c_chain_of_thought';

import {
  MentalModelAnalyzer,
  MentalModelType,
} from './j4c_mental_models';

async function quickStart() {
  console.log('\n🚀 J4C Enhanced Agent Framework - Quick Start\n');

  // ============================================================================
  // 1. INFINITE CONTEXT EXAMPLE
  // ============================================================================
  console.log('📦 Example 1: Infinite Context\n');

  const contextMgr = new InfiniteContextManager({
    maxActiveMemoryMB: 128,
  });

  // Add some context
  console.log('Adding context about authentication...');
  await contextMgr.addContext(
    'my-agent',
    'quickstart-session',
    'We implemented JWT authentication with refresh tokens for enhanced security.',
    ContextType.DOCUMENTATION,
    {
      priority: ContextPriority.HIGH,
      semanticTags: ['authentication', 'security', 'jwt'],
    }
  );

  // Query it back
  console.log('Querying context...');
  const results = await contextMgr.queryContext({
    semanticTags: ['authentication'],
    limit: 5,
  });

  console.log(`✅ Found ${results.chunks.length} relevant chunks`);
  console.log(`   Retrieval time: ${results.retrievalTimeMs}ms\n`);

  // ============================================================================
  // 2. CHAIN OF THOUGHT EXAMPLE
  // ============================================================================
  console.log('🧠 Example 2: Chain of Thought Reasoning\n');

  const reasoner = new ChainOfThoughtReasoner({
    maxDepth: 5,
    maxSteps: 10,
  });

  // Start a reasoning chain
  console.log('Starting reasoning chain...');
  const chainId = await reasoner.startChain(
    'my-agent',
    'quickstart-session',
    'API response time is slow',
    'Identify and fix performance issue'
  );

  // Add reasoning steps
  await reasoner.addThought(chainId, {
    type: ThoughtType.OBSERVATION,
    question: 'What do we observe?',
    reasoning: 'API endpoints taking 2-3 seconds to respond',
    conclusion: 'Performance degradation confirmed',
    confidence: 0.95,
  });

  await reasoner.addThought(chainId, {
    type: ThoughtType.HYPOTHESIS,
    question: 'What could be causing this?',
    reasoning: 'Could be database queries, missing indexes, or N+1 queries',
    conclusion: 'Multiple potential causes identified',
    confidence: 0.8,
  });

  await reasoner.addThought(chainId, {
    type: ThoughtType.DECISION,
    question: 'What should we do?',
    reasoning: 'Add database indexes on frequently queried columns',
    conclusion: 'Database optimization recommended',
    confidence: 0.85,
  });

  const chain = reasoner.getChain(chainId);
  console.log(`✅ Reasoning chain complete with ${chain!.steps.length} steps`);
  console.log(`   Overall confidence: ${(chain!.overallConfidence * 100).toFixed(1)}%\n`);

  // ============================================================================
  // 3. MENTAL MODELS EXAMPLE
  // ============================================================================
  console.log('🎯 Example 3: Multiple Mental Models\n');

  const analyzer = new MentalModelAnalyzer({
    enabledModels: [
      MentalModelType.FIRST_PRINCIPLES,
      MentalModelType.COST_BENEFIT,
      MentalModelType.RISK_ASSESSMENT,
    ],
    minModelsRequired: 3,
  });

  console.log('Analyzing with 3 mental models...');
  const analysis = await analyzer.analyzeWithMultipleModels(
    'Should we cache API responses?',
    {
      constraints: ['Low budget', 'Need fast response times'],
      goals: ['Reduce load', 'Improve performance'],
    }
  );

  console.log(`✅ Analysis complete using ${analysis.modelsUsed.length} models`);
  console.log(`   Overall confidence: ${(analysis.overallConfidence * 100).toFixed(1)}%`);
  console.log(`   Recommendations: ${analysis.recommendations.length}`);
  console.log(`   Risks identified: ${analysis.risks.length}\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('=' .repeat(80));
  console.log('✅ Quick Start Complete!\n');
  console.log('You just used all three major enhancements:');
  console.log('  1. ✅ Infinite Context - Store and query unlimited context');
  console.log('  2. ✅ Chain of Thought - Step-by-step reasoning');
  console.log('  3. ✅ Multiple Mental Models - Multi-perspective analysis\n');
  console.log('Next steps:');
  console.log('  • Read J4C_ENHANCED_README.md for more examples');
  console.log('  • Run j4c_enhanced_demo.ts for comprehensive demos');
  console.log('  • Check J4C_ENHANCED_AGENT_DOCUMENTATION.md for API reference');
  console.log('=' .repeat(80) + '\n');
}

// Run the quick start
if (require.main === module) {
  quickStart()
    .then(() => {
      console.log('✨ Quick start completed successfully!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { quickStart };
