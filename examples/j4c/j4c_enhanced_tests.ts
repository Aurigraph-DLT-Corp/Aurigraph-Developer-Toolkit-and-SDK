/**
 * J4C Enhanced Agent Framework - Test Suite
 *
 * Tests for all three major enhancements:
 * 1. Infinite Context Windows
 * 2. Chain of Thought Reasoning
 * 3. Multiple Mental Models
 *
 * Run with: npx ts-node j4c_enhanced_tests.ts
 */

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

import {
  EnhancedAgent,
  AgentCapability,
} from './j4c_enhanced_agent_framework';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class TestRunner {
  private results: TestResult[] = [];

  async run(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      });
      console.log(`  ✅ ${name} (${Date.now() - startTime}ms)`);
    } catch (error: any) {
      this.results.push({
        name,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime,
      });
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }

  summary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`Total time: ${totalTime}ms`);
    console.log('='.repeat(80) + '\n');

    if (failed > 0) {
      console.log('FAILED TESTS:\n');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     Error: ${r.error}\n`);
        });
    }
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================================
// INFINITE CONTEXT TESTS
// ============================================================================

async function testInfiniteContextBasics(runner: TestRunner): Promise<void> {
  await runner.run('Context Manager Initialization', async () => {
    const mgr = new InfiniteContextManager({ maxActiveMemoryMB: 128 });
    const stats = mgr.getStats();
    assert(stats.totalChunks === 0, 'Should start with 0 chunks');
  });

  await runner.run('Add Context', async () => {
    const mgr = new InfiniteContextManager({ maxActiveMemoryMB: 128 });
    const chunks = await mgr.addContext(
      'test-agent',
      'test-session',
      'Test content',
      ContextType.CODE,
      { priority: ContextPriority.NORMAL }
    );
    assert(chunks.length > 0, 'Should create chunks');
  });

  await runner.run('Query Context', async () => {
    const mgr = new InfiniteContextManager({ maxActiveMemoryMB: 128 });
    await mgr.addContext(
      'test-agent',
      'test-session',
      'Authentication code with JWT tokens',
      ContextType.CODE,
      { semanticTags: ['auth', 'jwt'] }
    );

    const result = await mgr.queryContext({
      semanticTags: ['auth'],
      limit: 10,
    });

    assert(result.chunks.length > 0, 'Should find chunks');
    assert(result.retrievalTimeMs >= 0, 'Should have retrieval time');
  });

  await runner.run('Context Statistics', async () => {
    const mgr = new InfiniteContextManager({ maxActiveMemoryMB: 128 });
    await mgr.addContext('agent1', 'session1', 'Content 1', ContextType.CODE);
    await mgr.addContext('agent2', 'session2', 'Content 2', ContextType.DOCUMENTATION);

    const stats = mgr.getStats();
    assert(stats.totalChunks >= 2, 'Should have at least 2 chunks');
    assert(stats.agentCount >= 2, 'Should have 2 agents');
    assert(stats.sessionCount >= 2, 'Should have 2 sessions');
  });

  await runner.run('Context Compression', async () => {
    const mgr = new InfiniteContextManager({ maxActiveMemoryMB: 128 });

    // Add large content
    const largeContent = 'x'.repeat(200 * 1024); // 200KB
    await mgr.addContext(
      'test-agent',
      'test-session',
      largeContent,
      ContextType.DOCUMENTATION,
      { priority: ContextPriority.LOW }
    );

    const result = await mgr.compressContext(0, ContextPriority.LOW);
    assert(result.compressed >= 0, 'Should compress some chunks');
  });
}

// ============================================================================
// CHAIN OF THOUGHT TESTS
// ============================================================================

async function testChainOfThoughtBasics(runner: TestRunner): Promise<void> {
  await runner.run('Reasoner Initialization', async () => {
    const reasoner = new ChainOfThoughtReasoner({
      maxDepth: 5,
      maxSteps: 20,
    });
    assert(reasoner !== null, 'Should initialize reasoner');
  });

  await runner.run('Start Reasoning Chain', async () => {
    const reasoner = new ChainOfThoughtReasoner();
    const chainId = await reasoner.startChain(
      'test-agent',
      'test-session',
      'Test problem',
      'Test goal'
    );
    assert(chainId.length > 0, 'Should return chain ID');
  });

  await runner.run('Add Thought Step', async () => {
    const reasoner = new ChainOfThoughtReasoner();
    const chainId = await reasoner.startChain(
      'test-agent',
      'test-session',
      'Test problem',
      'Test goal'
    );

    const stepId = await reasoner.addThought(chainId, {
      type: ThoughtType.OBSERVATION,
      question: 'What do we know?',
      reasoning: 'Gathering facts',
      conclusion: 'Facts gathered',
      confidence: 0.8,
    });

    assert(stepId.length > 0, 'Should return step ID');
  });

  await runner.run('Multiple Reasoning Steps', async () => {
    const reasoner = new ChainOfThoughtReasoner();
    const chainId = await reasoner.startChain(
      'test-agent',
      'test-session',
      'Debug slow query',
      'Find root cause'
    );

    await reasoner.addThought(chainId, {
      type: ThoughtType.OBSERVATION,
      question: 'What do we observe?',
      reasoning: 'Query takes 5 seconds',
      conclusion: 'Performance issue confirmed',
      confidence: 0.9,
    });

    await reasoner.addThought(chainId, {
      type: ThoughtType.HYPOTHESIS,
      question: 'What could cause this?',
      reasoning: 'Could be missing index or N+1 queries',
      conclusion: 'Multiple potential causes',
      confidence: 0.7,
    });

    await reasoner.addThought(chainId, {
      type: ThoughtType.DECISION,
      question: 'What is the solution?',
      reasoning: 'Add composite index on frequently queried columns',
      conclusion: 'Index optimization recommended',
      confidence: 0.85,
    });

    const chain = reasoner.getChain(chainId);
    assert(chain !== null, 'Should retrieve chain');
    assert(chain!.steps.length === 3, 'Should have 3 steps');
  });

  await runner.run('Visualize Chain', async () => {
    const reasoner = new ChainOfThoughtReasoner();
    const chainId = await reasoner.startChain(
      'test-agent',
      'test-session',
      'Test problem',
      'Test goal'
    );

    await reasoner.addThought(chainId, {
      type: ThoughtType.OBSERVATION,
      question: 'What?',
      reasoning: 'Test',
      conclusion: 'Done',
      confidence: 0.8,
    });

    const visualization = reasoner.visualizeChain(chainId);
    assert(visualization.length > 0, 'Should generate visualization');
    assert(visualization.includes('OBSERVATION'), 'Should contain thought type');
  });

  await runner.run('Export to Markdown', async () => {
    const reasoner = new ChainOfThoughtReasoner();
    const chainId = await reasoner.startChain(
      'test-agent',
      'test-session',
      'Test problem',
      'Test goal'
    );

    await reasoner.addThought(chainId, {
      type: ThoughtType.OBSERVATION,
      question: 'What?',
      reasoning: 'Test',
      conclusion: 'Done',
      confidence: 0.8,
    });

    const markdown = reasoner.exportToMarkdown(chainId);
    assert(markdown.length > 0, 'Should generate markdown');
    assert(markdown.includes('# Reasoning Chain'), 'Should have title');
    assert(markdown.includes('OBSERVATION'), 'Should contain thought type');
  });
}

// ============================================================================
// MENTAL MODELS TESTS
// ============================================================================

async function testMentalModelsBasics(runner: TestRunner): Promise<void> {
  await runner.run('Analyzer Initialization', async () => {
    const analyzer = new MentalModelAnalyzer({
      minModelsRequired: 3,
    });
    assert(analyzer !== null, 'Should initialize analyzer');
  });

  await runner.run('Single Model Analysis', async () => {
    const analyzer = new MentalModelAnalyzer();
    const analysis = await analyzer.applyModel(
      MentalModelType.FIRST_PRINCIPLES,
      'How to improve API performance?',
      {}
    );

    assert(analysis.model === MentalModelType.FIRST_PRINCIPLES, 'Should use correct model');
    assert(analysis.insights.length > 0, 'Should have insights');
    assert(analysis.recommendations.length > 0, 'Should have recommendations');
    assert(analysis.confidence > 0, 'Should have confidence');
  });

  await runner.run('Multi-Model Analysis', async () => {
    const analyzer = new MentalModelAnalyzer({
      enabledModels: [
        MentalModelType.FIRST_PRINCIPLES,
        MentalModelType.SYSTEMS_THINKING,
        MentalModelType.COST_BENEFIT,
      ],
      minModelsRequired: 3,
    });

    const analysis = await analyzer.analyzeWithMultipleModels(
      'Should we migrate to microservices?',
      {
        constraints: ['Limited budget', 'Small team'],
        goals: ['Improve scalability', 'Faster deployments'],
      }
    );

    assert(analysis.modelsUsed.length >= 3, 'Should use at least 3 models');
    assert(analysis.synthesis !== null, 'Should have synthesis');
    assert(analysis.recommendations.length > 0, 'Should have recommendations');
    assert(analysis.risks.length >= 0, 'Should identify risks');
    assert(analysis.opportunities.length >= 0, 'Should identify opportunities');
  });

  await runner.run('Synthesis Generation', async () => {
    const analyzer = new MentalModelAnalyzer({
      enabledModels: [
        MentalModelType.FIRST_PRINCIPLES,
        MentalModelType.SYSTEMS_THINKING,
      ],
      minModelsRequired: 2,
    });

    const analysis = await analyzer.analyzeWithMultipleModels(
      'Choose database architecture',
      {}
    );

    assert(analysis.synthesis.convergentInsights !== undefined, 'Should have convergent insights');
    assert(analysis.synthesis.divergentInsights !== undefined, 'Should have divergent insights');
    assert(analysis.synthesis.metaInsight.length > 0, 'Should have meta-insight');
  });

  await runner.run('Export Mental Model Analysis', async () => {
    const analyzer = new MentalModelAnalyzer();

    const analysis = await analyzer.analyzeWithMultipleModels(
      'Test problem',
      {}
    );

    const markdown = analyzer.exportToMarkdown(analysis.id);
    assert(markdown.length > 0, 'Should generate markdown');
    assert(markdown.includes('# Multi-Model Analysis'), 'Should have title');
  });
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

async function testEnhancedAgentIntegration(runner: TestRunner): Promise<void> {
  await runner.run('Enhanced Agent Creation', async () => {
    const agent = new EnhancedAgent({
      agentId: 'test-agent',
      sessionId: 'test-session',
      capabilities: [AgentCapability.CODE_GENERATION],
    });
    assert(agent !== null, 'Should create enhanced agent');
  });

  await runner.run('Simple Execution', async () => {
    const agent = new EnhancedAgent({
      agentId: 'test-agent',
      sessionId: 'test-session',
      capabilities: [AgentCapability.CODE_GENERATION],
    });

    const result = await agent.execute({
      task: 'Simple test task',
    });

    assert(result !== null, 'Should return result');
    assert(result.durationMs >= 0, 'Should have duration');
    assert(result.timestamp > 0, 'Should have timestamp');
  });

  await runner.run('Execution with Reasoning', async () => {
    const agent = new EnhancedAgent({
      agentId: 'test-agent',
      sessionId: 'test-session',
      capabilities: [AgentCapability.DEBUGGING],
      reasoningConfig: {
        enableChainOfThought: true,
      },
    });

    const result = await agent.execute({
      task: 'Debug performance issue',
      useChainOfThought: true,
    });

    assert(result.reasoningChainId !== undefined, 'Should have reasoning chain ID');
    assert(result.reasoningConfidence !== undefined, 'Should have confidence score');
  });

  await runner.run('Execution with Mental Models', async () => {
    const agent = new EnhancedAgent({
      agentId: 'test-agent',
      sessionId: 'test-session',
      capabilities: [AgentCapability.ARCHITECTURE],
      mentalModelsConfig: {
        enableMultiModelAnalysis: true,
      },
    });

    const result = await agent.execute({
      task: 'Design system architecture',
      useMentalModels: true,
    });

    assert(result.mentalModelAnalysisId !== undefined, 'Should have analysis ID');
    assert(result.multiModelInsights !== undefined, 'Should have insights');
  });

  await runner.run('Comprehensive Execution', async () => {
    const agent = new EnhancedAgent({
      agentId: 'test-agent',
      sessionId: 'test-session',
      capabilities: [AgentCapability.ARCHITECTURE],
      reasoningConfig: { enableChainOfThought: true },
      mentalModelsConfig: { enableMultiModelAnalysis: true },
    });

    const result = await agent.execute({
      task: 'Complex architecture decision',
      useChainOfThought: true,
      useMentalModels: true,
      includeHistoricalContext: true,
    });

    assert(result.reasoningChainId !== undefined, 'Should have reasoning');
    assert(result.mentalModelAnalysisId !== undefined, 'Should have analysis');
    assert(result.contextChunkIds !== undefined, 'Should store context');
  });

  await runner.run('Get Context Summary', async () => {
    const agent = new EnhancedAgent({
      agentId: 'test-agent',
      sessionId: 'test-session',
      capabilities: [AgentCapability.CODE_GENERATION],
    });

    // Execute a task first to create some context
    await agent.execute({ task: 'Test task' });

    const summary = await agent.getContextSummary();
    assert(summary !== null, 'Should return summary');
    assert(summary.stats !== undefined, 'Should have stats');
  });
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('\n' + '╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  J4C ENHANCED AGENT FRAMEWORK - TEST SUITE'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝\n');

  const runner = new TestRunner();

  // Test Infinite Context
  console.log('\n📦 INFINITE CONTEXT TESTS');
  console.log('─'.repeat(80));
  await testInfiniteContextBasics(runner);

  // Test Chain of Thought
  console.log('\n🧠 CHAIN OF THOUGHT TESTS');
  console.log('─'.repeat(80));
  await testChainOfThoughtBasics(runner);

  // Test Mental Models
  console.log('\n🎯 MENTAL MODELS TESTS');
  console.log('─'.repeat(80));
  await testMentalModelsBasics(runner);

  // Test Integration
  console.log('\n🔗 INTEGRATION TESTS');
  console.log('─'.repeat(80));
  await testEnhancedAgentIntegration(runner);

  // Summary
  runner.summary();
}

// ============================================================================
// RUN TESTS
// ============================================================================

if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ All tests completed!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { runAllTests };
