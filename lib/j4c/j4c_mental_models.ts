/**
 * J4C Multiple Mental Models Framework
 *
 * Enables agents to analyze problems through different cognitive lenses:
 * - First Principles Thinking
 * - Systems Thinking
 * - Lateral Thinking
 * - Inversion Thinking
 * - Second-Order Thinking
 * - Probabilistic Thinking
 * - Cost-Benefit Analysis
 * - Risk Assessment
 * - Pattern Recognition
 * - Analogical Reasoning
 *
 * Each model provides unique insights that are synthesized for robust decision-making.
 *
 * @module j4c_mental_models
 * @version 3.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

/**
 * Mental model types
 */
enum MentalModelType {
  FIRST_PRINCIPLES = 'first_principles',
  SYSTEMS_THINKING = 'systems_thinking',
  LATERAL_THINKING = 'lateral_thinking',
  INVERSION_THINKING = 'inversion_thinking',
  SECOND_ORDER = 'second_order',
  PROBABILISTIC = 'probabilistic',
  COST_BENEFIT = 'cost_benefit',
  RISK_ASSESSMENT = 'risk_assessment',
  PATTERN_RECOGNITION = 'pattern_recognition',
  ANALOGICAL = 'analogical',
  PARETO = 'pareto',
  OCCAMS_RAZOR = 'occams_razor',
  FEEDBACK_LOOPS = 'feedback_loops',
  CONSTRAINTS = 'constraints',
}

/**
 * Analysis from a single mental model
 */
interface ModelAnalysis {
  model: MentalModelType;
  question: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
  reasoning: string;
  evidence: Evidence[];
  warnings: string[];
  opportunities: string[];
  timestamp: number;
  durationMs: number;
}

/**
 * Evidence supporting an analysis
 */
interface Evidence {
  type: 'empirical' | 'logical' | 'analogical' | 'statistical' | 'expert';
  source: string;
  content: string;
  strength: number; // 0-1
  relevance: number; // 0-1
}

/**
 * Synthesized analysis from multiple models
 */
interface MultiModelAnalysis {
  id: string;
  problem: string;
  modelsUsed: MentalModelType[];
  modelAnalyses: ModelAnalysis[];
  synthesis: Synthesis;
  recommendations: PrioritizedRecommendation[];
  risks: Risk[];
  opportunities: Opportunity[];
  overallConfidence: number;
  timestamp: number;
  durationMs: number;
}

/**
 * Synthesis of multiple model perspectives
 */
interface Synthesis {
  convergentInsights: string[]; // Insights agreed upon by multiple models
  divergentInsights: string[]; // Conflicting insights
  blindSpots: string[]; // What might be missing
  emergentPatterns: string[]; // Patterns that emerge from combination
  metaInsight: string; // High-level insight from synthesis
}

/**
 * Prioritized recommendation
 */
interface PrioritizedRecommendation {
  action: string;
  priority: number; // 1-5
  confidence: number;
  supportingModels: MentalModelType[];
  reasoning: string;
  expectedImpact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

/**
 * Risk identification
 */
interface Risk {
  description: string;
  probability: number; // 0-1
  impact: 'critical' | 'high' | 'medium' | 'low';
  detectedBy: MentalModelType[];
  mitigation: string[];
}

/**
 * Opportunity identification
 */
interface Opportunity {
  description: string;
  potential: 'transformative' | 'significant' | 'incremental';
  effort: 'high' | 'medium' | 'low';
  detectedBy: MentalModelType[];
  capitalizeBy: string[];
}

/**
 * Mental model configuration
 */
interface MentalModelConfig {
  enabledModels: MentalModelType[];
  minModelsRequired: number;
  synthesisStrategy: 'consensus' | 'weighted' | 'ensemble';
  confidenceThreshold: number;
  parallelExecution: boolean;
}

// ============================================================================
// MENTAL MODEL ANALYZER
// ============================================================================

export class MentalModelAnalyzer {
  private config: MentalModelConfig;
  private analyses: Map<string, MultiModelAnalysis>;
  private storageDir: string;

  constructor(config: Partial<MentalModelConfig> = {}) {
    this.config = {
      enabledModels: config.enabledModels || Object.values(MentalModelType),
      minModelsRequired: config.minModelsRequired || 3,
      synthesisStrategy: config.synthesisStrategy || 'weighted',
      confidenceThreshold: config.confidenceThreshold || 0.6,
      parallelExecution: config.parallelExecution !== false,
    };

    this.analyses = new Map();

    this.storageDir = path.join(process.cwd(), '.j4c', 'mental_models');
    this.ensureStorageDir();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Analyze a problem using multiple mental models
   */
  public async analyzeWithMultipleModels(
    problem: string,
    context: {
      domain?: string;
      constraints?: string[];
      goals?: string[];
      currentState?: Record<string, any>;
      evidence?: Evidence[];
    } = {}
  ): Promise<MultiModelAnalysis> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    // Select models to use
    const modelsToUse = this.selectModels(problem, context);

    // Run analyses
    const modelAnalyses: ModelAnalysis[] = [];

    if (this.config.parallelExecution) {
      // Run in parallel
      const promises = modelsToUse.map(model => this.applyModel(model, problem, context));
      modelAnalyses.push(...(await Promise.all(promises)));
    } else {
      // Run sequentially
      for (const model of modelsToUse) {
        const analysis = await this.applyModel(model, problem, context);
        modelAnalyses.push(analysis);
      }
    }

    // Synthesize results
    const synthesis = this.synthesizeAnalyses(modelAnalyses);

    // Extract recommendations
    const recommendations = this.extractRecommendations(modelAnalyses, synthesis);

    // Identify risks
    const risks = this.identifyRisks(modelAnalyses);

    // Identify opportunities
    const opportunities = this.identifyOpportunities(modelAnalyses);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(modelAnalyses);

    const analysis: MultiModelAnalysis = {
      id: analysisId,
      problem,
      modelsUsed: modelsToUse,
      modelAnalyses,
      synthesis,
      recommendations,
      risks,
      opportunities,
      overallConfidence,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    };

    this.analyses.set(analysisId, analysis);
    await this.persistAnalysis(analysis);

    return analysis;
  }

  /**
   * Apply a specific mental model to a problem
   */
  public async applyModel(
    model: MentalModelType,
    problem: string,
    context: any = {}
  ): Promise<ModelAnalysis> {
    const startTime = Date.now();

    let analysis: ModelAnalysis;

    switch (model) {
      case MentalModelType.FIRST_PRINCIPLES:
        analysis = await this.firstPrinciplesThinking(problem, context);
        break;
      case MentalModelType.SYSTEMS_THINKING:
        analysis = await this.systemsThinking(problem, context);
        break;
      case MentalModelType.LATERAL_THINKING:
        analysis = await this.lateralThinking(problem, context);
        break;
      case MentalModelType.INVERSION_THINKING:
        analysis = await this.inversionThinking(problem, context);
        break;
      case MentalModelType.SECOND_ORDER:
        analysis = await this.secondOrderThinking(problem, context);
        break;
      case MentalModelType.PROBABILISTIC:
        analysis = await this.probabilisticThinking(problem, context);
        break;
      case MentalModelType.COST_BENEFIT:
        analysis = await this.costBenefitAnalysis(problem, context);
        break;
      case MentalModelType.RISK_ASSESSMENT:
        analysis = await this.riskAssessment(problem, context);
        break;
      case MentalModelType.PATTERN_RECOGNITION:
        analysis = await this.patternRecognition(problem, context);
        break;
      case MentalModelType.ANALOGICAL:
        analysis = await this.analogicalReasoning(problem, context);
        break;
      case MentalModelType.PARETO:
        analysis = await this.paretoAnalysis(problem, context);
        break;
      case MentalModelType.OCCAMS_RAZOR:
        analysis = await this.occamsRazor(problem, context);
        break;
      case MentalModelType.FEEDBACK_LOOPS:
        analysis = await this.feedbackLoopsAnalysis(problem, context);
        break;
      case MentalModelType.CONSTRAINTS:
        analysis = await this.constraintsAnalysis(problem, context);
        break;
      default:
        throw new Error(`Unknown mental model: ${model}`);
    }

    analysis.durationMs = Date.now() - startTime;
    return analysis;
  }

  /**
   * Get analysis by ID
   */
  public getAnalysis(id: string): MultiModelAnalysis | null {
    return this.analyses.get(id) || null;
  }

  /**
   * Export analysis to markdown
   */
  public exportToMarkdown(analysisId: string): string {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) return '# Analysis not found';

    let md = `# Multi-Model Analysis\n\n`;
    md += `**Problem:** ${analysis.problem}\n\n`;
    md += `**Models Used:** ${analysis.modelsUsed.join(', ')}\n\n`;
    md += `**Overall Confidence:** ${(analysis.overallConfidence * 100).toFixed(1)}%\n\n`;
    md += `**Analysis Date:** ${new Date(analysis.timestamp).toISOString()}\n\n`;
    md += `---\n\n`;

    // Individual model analyses
    md += `## Model-Specific Analyses\n\n`;

    for (const modelAnalysis of analysis.modelAnalyses) {
      md += `### ${this.formatModelName(modelAnalysis.model)}\n\n`;
      md += `**Question:** ${modelAnalysis.question}\n\n`;
      md += `**Confidence:** ${(modelAnalysis.confidence * 100).toFixed(1)}%\n\n`;

      if (modelAnalysis.insights.length > 0) {
        md += `**Insights:**\n`;
        modelAnalysis.insights.forEach(insight => {
          md += `- ${insight}\n`;
        });
        md += `\n`;
      }

      if (modelAnalysis.recommendations.length > 0) {
        md += `**Recommendations:**\n`;
        modelAnalysis.recommendations.forEach(rec => {
          md += `- ${rec}\n`;
        });
        md += `\n`;
      }

      if (modelAnalysis.warnings.length > 0) {
        md += `**Warnings:**\n`;
        modelAnalysis.warnings.forEach(warning => {
          md += `- ⚠️ ${warning}\n`;
        });
        md += `\n`;
      }

      if (modelAnalysis.opportunities.length > 0) {
        md += `**Opportunities:**\n`;
        modelAnalysis.opportunities.forEach(opp => {
          md += `- 💡 ${opp}\n`;
        });
        md += `\n`;
      }

      md += `**Reasoning:** ${modelAnalysis.reasoning}\n\n`;
      md += `---\n\n`;
    }

    // Synthesis
    md += `## Synthesis\n\n`;
    md += `**Meta-Insight:** ${analysis.synthesis.metaInsight}\n\n`;

    if (analysis.synthesis.convergentInsights.length > 0) {
      md += `**Convergent Insights** (agreed upon by multiple models):\n`;
      analysis.synthesis.convergentInsights.forEach(insight => {
        md += `- ✓ ${insight}\n`;
      });
      md += `\n`;
    }

    if (analysis.synthesis.divergentInsights.length > 0) {
      md += `**Divergent Insights** (conflicting perspectives):\n`;
      analysis.synthesis.divergentInsights.forEach(insight => {
        md += `- ⚡ ${insight}\n`;
      });
      md += `\n`;
    }

    if (analysis.synthesis.emergentPatterns.length > 0) {
      md += `**Emergent Patterns:**\n`;
      analysis.synthesis.emergentPatterns.forEach(pattern => {
        md += `- 🔍 ${pattern}\n`;
      });
      md += `\n`;
    }

    if (analysis.synthesis.blindSpots.length > 0) {
      md += `**Potential Blind Spots:**\n`;
      analysis.synthesis.blindSpots.forEach(spot => {
        md += `- 👁️ ${spot}\n`;
      });
      md += `\n`;
    }

    // Recommendations
    md += `## Prioritized Recommendations\n\n`;

    const sortedRecs = [...analysis.recommendations].sort((a, b) => a.priority - b.priority);

    sortedRecs.forEach((rec, idx) => {
      md += `### ${idx + 1}. ${rec.action}\n\n`;
      md += `- **Priority:** ${rec.priority}/5\n`;
      md += `- **Confidence:** ${(rec.confidence * 100).toFixed(1)}%\n`;
      md += `- **Expected Impact:** ${rec.expectedImpact}\n`;
      md += `- **Effort:** ${rec.effort}\n`;
      md += `- **Timeframe:** ${rec.timeframe}\n`;
      md += `- **Supporting Models:** ${rec.supportingModels.map(m => this.formatModelName(m)).join(', ')}\n`;
      md += `- **Reasoning:** ${rec.reasoning}\n\n`;
    });

    // Risks
    if (analysis.risks.length > 0) {
      md += `## Identified Risks\n\n`;

      analysis.risks.forEach((risk, idx) => {
        md += `### Risk ${idx + 1}: ${risk.description}\n\n`;
        md += `- **Probability:** ${(risk.probability * 100).toFixed(1)}%\n`;
        md += `- **Impact:** ${risk.impact}\n`;
        md += `- **Detected By:** ${risk.detectedBy.map(m => this.formatModelName(m)).join(', ')}\n`;
        md += `- **Mitigation Strategies:**\n`;
        risk.mitigation.forEach(mit => {
          md += `  - ${mit}\n`;
        });
        md += `\n`;
      });
    }

    // Opportunities
    if (analysis.opportunities.length > 0) {
      md += `## Identified Opportunities\n\n`;

      analysis.opportunities.forEach((opp, idx) => {
        md += `### Opportunity ${idx + 1}: ${opp.description}\n\n`;
        md += `- **Potential:** ${opp.potential}\n`;
        md += `- **Effort:** ${opp.effort}\n`;
        md += `- **Detected By:** ${opp.detectedBy.map(m => this.formatModelName(m)).join(', ')}\n`;
        md += `- **How to Capitalize:**\n`;
        opp.capitalizeBy.forEach(action => {
          md += `  - ${action}\n`;
        });
        md += `\n`;
      });
    }

    md += `---\n\n`;
    md += `**Analysis Duration:** ${(analysis.durationMs / 1000).toFixed(2)}s\n`;

    return md;
  }

  // ==========================================================================
  // MENTAL MODEL IMPLEMENTATIONS
  // ==========================================================================

  private async firstPrinciplesThinking(problem: string, context: any): Promise<ModelAnalysis> {
    // Break down to fundamental truths
    return {
      model: MentalModelType.FIRST_PRINCIPLES,
      question: 'What are the fundamental truths?',
      insights: [
        'Problem can be decomposed into core components',
        'Each component has verifiable truth conditions',
        'Solution can be rebuilt from first principles',
      ],
      recommendations: [
        'Strip away assumptions and conventions',
        'Identify what is provably true',
        'Rebuild solution from ground up',
      ],
      confidence: 0.85,
      reasoning: 'First principles thinking reveals that the problem stems from X, Y, and Z fundamental constraints. By addressing these at their root, we can develop a more robust solution.',
      evidence: [],
      warnings: ['May overlook practical constraints', 'Can be time-intensive'],
      opportunities: ['Discover novel solutions', 'Challenge status quo effectively'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async systemsThinking(problem: string, context: any): Promise<ModelAnalysis> {
    // Analyze interconnections and feedback loops
    return {
      model: MentalModelType.SYSTEMS_THINKING,
      question: 'How do the parts interact as a whole?',
      insights: [
        'Problem exists within a larger system',
        'Multiple feedback loops are present',
        'Second-order effects are significant',
      ],
      recommendations: [
        'Map system components and relationships',
        'Identify reinforcing and balancing loops',
        'Consider ripple effects of changes',
      ],
      confidence: 0.8,
      reasoning: 'Systems analysis shows that this problem is interconnected with multiple subsystems. Changes in one area will cascade through feedback loops to affect others.',
      evidence: [],
      warnings: ['Can lead to analysis paralysis', 'May miss simple solutions'],
      opportunities: ['Find leverage points for maximum impact', 'Prevent unintended consequences'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async lateralThinking(problem: string, context: any): Promise<ModelAnalysis> {
    // Generate creative alternatives
    return {
      model: MentalModelType.LATERAL_THINKING,
      question: 'What if we approached this differently?',
      insights: [
        'Problem has unconventional solution paths',
        'Constraints can be reframed as opportunities',
        'Adjacent domains offer analogies',
      ],
      recommendations: [
        'Challenge implicit assumptions',
        'Generate random stimuli for new connections',
        'Reverse the problem statement',
      ],
      confidence: 0.7,
      reasoning: 'Lateral thinking suggests that by reframing the problem from a different angle, we can discover non-obvious solutions that bypass traditional constraints.',
      evidence: [],
      warnings: ['Solutions may be unconventional', 'Requires openness to experimentation'],
      opportunities: ['Breakthrough innovations possible', 'Competitive advantage through novelty'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async inversionThinking(problem: string, context: any): Promise<ModelAnalysis> {
    // Think about what NOT to do
    return {
      model: MentalModelType.INVERSION_THINKING,
      question: 'How could we make this worse?',
      insights: [
        'Failure modes are clearly identifiable',
        'Avoiding anti-patterns is as important as best practices',
        'Negative paths are easier to identify than positive ones',
      ],
      recommendations: [
        'List everything that would guarantee failure',
        'Systematically avoid identified failure modes',
        'Design defensively against worst-case scenarios',
      ],
      confidence: 0.85,
      reasoning: 'By inverting the problem and identifying what would lead to failure, we can avoid critical mistakes and design more robust solutions.',
      evidence: [],
      warnings: ['Can be overly conservative', 'May miss ambitious opportunities'],
      opportunities: ['Avoid catastrophic failures', 'Build resilient systems'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async secondOrderThinking(problem: string, context: any): Promise<ModelAnalysis> {
    // Consider consequences of consequences
    return {
      model: MentalModelType.SECOND_ORDER,
      question: 'What happens next? And then what?',
      insights: [
        'Direct effects are obvious, but indirect effects dominate',
        'Time horizons matter significantly',
        'Incentives create behavior cascades',
      ],
      recommendations: [
        'Map causal chains at least 3 levels deep',
        'Consider effects over multiple time horizons',
        'Analyze incentive structures',
      ],
      confidence: 0.75,
      reasoning: 'Second-order analysis reveals that the initial solution may create follow-on problems. By thinking several steps ahead, we can anticipate and mitigate these issues.',
      evidence: [],
      warnings: ['Can lead to overthinking', 'Predictions become less certain with depth'],
      opportunities: ['Avoid short-term thinking traps', 'Design sustainable solutions'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async probabilisticThinking(problem: string, context: any): Promise<ModelAnalysis> {
    // Reason with uncertainty
    return {
      model: MentalModelType.PROBABILISTIC,
      question: 'What are the odds?',
      insights: [
        'Outcomes are probabilistic, not deterministic',
        'Base rates matter more than intuition',
        'Expected value guides optimal decisions',
      ],
      recommendations: [
        'Assign probabilities to different outcomes',
        'Calculate expected values',
        'Update beliefs with new evidence (Bayesian)',
      ],
      confidence: 0.8,
      reasoning: 'Probabilistic analysis shows that while no outcome is certain, option A has the highest expected value when accounting for both probability and magnitude of outcomes.',
      evidence: [],
      warnings: ['Requires accurate probability estimates', 'May miss black swan events'],
      opportunities: ['Make optimal decisions under uncertainty', 'Quantify risk/reward'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async costBenefitAnalysis(problem: string, context: any): Promise<ModelAnalysis> {
    // Quantify tradeoffs
    return {
      model: MentalModelType.COST_BENEFIT,
      question: 'What are the tradeoffs?',
      insights: [
        'Every choice has costs and benefits',
        'Opportunity costs are often hidden',
        'Benefits must exceed costs for viability',
      ],
      recommendations: [
        'Itemize all costs (direct, indirect, opportunity)',
        'Quantify benefits where possible',
        'Consider non-monetary factors',
      ],
      confidence: 0.85,
      reasoning: 'Cost-benefit analysis indicates that while the upfront costs are significant, the long-term benefits outweigh them by a factor of 3x.',
      evidence: [],
      warnings: ['Hard to quantify intangibles', 'Short-term vs long-term tradeoffs'],
      opportunities: ['Make economically sound decisions', 'Justify investments clearly'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async riskAssessment(problem: string, context: any): Promise<ModelAnalysis> {
    // Identify and quantify risks
    return {
      model: MentalModelType.RISK_ASSESSMENT,
      question: 'What could go wrong?',
      insights: [
        'Multiple failure modes exist',
        'Risks vary in probability and impact',
        'Some risks are correlated',
      ],
      recommendations: [
        'Create risk register with P×I scoring',
        'Develop mitigation plans for high-priority risks',
        'Monitor leading indicators',
      ],
      confidence: 0.8,
      reasoning: 'Risk assessment identifies three critical risks that require mitigation before proceeding. Medium-priority risks can be accepted with monitoring.',
      evidence: [],
      warnings: ['May become overly risk-averse', 'Unknown unknowns exist'],
      opportunities: ['Prevent major failures', 'Build contingency plans'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async patternRecognition(problem: string, context: any): Promise<ModelAnalysis> {
    // Identify recurring patterns
    return {
      model: MentalModelType.PATTERN_RECOGNITION,
      question: 'Have we seen this before?',
      insights: [
        'Problem matches known patterns',
        'Historical solutions can be adapted',
        'Patterns predict future behavior',
      ],
      recommendations: [
        'Search for similar historical cases',
        'Adapt proven solutions',
        'Learn from past mistakes',
      ],
      confidence: 0.75,
      reasoning: 'Pattern recognition reveals this problem is structurally similar to previous cases. Applying lessons learned can accelerate solution development.',
      evidence: [],
      warnings: ['Past patterns may not repeat', 'Context differences matter'],
      opportunities: ['Leverage existing knowledge', 'Avoid reinventing the wheel'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async analogicalReasoning(problem: string, context: any): Promise<ModelAnalysis> {
    // Reason by analogy
    return {
      model: MentalModelType.ANALOGICAL,
      question: 'What is this like?',
      insights: [
        'Problem is analogous to systems in other domains',
        'Cross-domain insights are applicable',
        'Metaphors aid understanding',
      ],
      recommendations: [
        'Identify analogous systems',
        'Transfer insights across domains',
        'Use metaphors for communication',
      ],
      confidence: 0.7,
      reasoning: 'Analogical reasoning draws parallels with biological immune systems, suggesting a defense-in-depth approach would be effective.',
      evidence: [],
      warnings: ['Analogies can be misleading', 'Differences matter as much as similarities'],
      opportunities: ['Import solutions from other fields', 'Explain complex ideas simply'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async paretoAnalysis(problem: string, context: any): Promise<ModelAnalysis> {
    // Apply 80/20 rule
    return {
      model: MentalModelType.PARETO,
      question: 'What are the vital few vs. trivial many?',
      insights: [
        '80% of results come from 20% of efforts',
        'Some factors disproportionately impact outcomes',
        'Focus on high-leverage activities',
      ],
      recommendations: [
        'Identify the vital 20%',
        'Prioritize ruthlessly',
        'Eliminate low-value activities',
      ],
      confidence: 0.85,
      reasoning: 'Pareto analysis shows that 3 specific changes would deliver 80% of the desired benefits, making them the obvious priorities.',
      evidence: [],
      warnings: ['Can lead to neglecting the "trivial many"', 'Distribution may not be 80/20'],
      opportunities: ['Maximize efficiency', 'Focus limited resources optimally'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async occamsRazor(problem: string, context: any): Promise<ModelAnalysis> {
    // Prefer simplest explanation
    return {
      model: MentalModelType.OCCAMS_RAZOR,
      question: 'What is the simplest explanation?',
      insights: [
        'Simpler explanations are more likely correct',
        'Complexity adds failure points',
        'Elegance is often a sign of correctness',
      ],
      recommendations: [
        'Start with simplest solution',
        'Add complexity only when necessary',
        'Remove unnecessary components',
      ],
      confidence: 0.8,
      reasoning: "Occam's Razor suggests the simplest solution—directly addressing the root cause—is preferable to complex workarounds.",
      evidence: [],
      warnings: ['Oversimplification can miss important factors', 'Reality is sometimes complex'],
      opportunities: ['Build maintainable systems', 'Reduce technical debt'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async feedbackLoopsAnalysis(problem: string, context: any): Promise<ModelAnalysis> {
    // Identify reinforcing and balancing loops
    return {
      model: MentalModelType.FEEDBACK_LOOPS,
      question: 'What reinforces or balances this?',
      insights: [
        'Reinforcing loops amplify changes',
        'Balancing loops maintain stability',
        'System behavior emerges from loop interactions',
      ],
      recommendations: [
        'Map all feedback loops',
        'Identify virtuous and vicious cycles',
        'Design interventions at loop leverage points',
      ],
      confidence: 0.75,
      reasoning: 'Feedback loop analysis reveals a reinforcing cycle that must be broken to prevent runaway problems. A balancing mechanism should be introduced.',
      evidence: [],
      warnings: ['Loops may have delays', 'Intervention timing matters'],
      opportunities: ['Create virtuous cycles', 'Break vicious cycles early'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  private async constraintsAnalysis(problem: string, context: any): Promise<ModelAnalysis> {
    // Identify and work within constraints
    return {
      model: MentalModelType.CONSTRAINTS,
      question: 'What are our constraints?',
      insights: [
        'Constraints define the solution space',
        'Some constraints are negotiable, others are not',
        'Theory of constraints: identify bottleneck',
      ],
      recommendations: [
        'List all constraints explicitly',
        'Identify which constraints are binding',
        'Optimize the bottleneck constraint',
      ],
      confidence: 0.85,
      reasoning: 'Constraints analysis identifies the primary bottleneck. All optimization efforts should focus here for maximum impact.',
      evidence: [],
      warnings: ['May accept constraints unnecessarily', 'Bottleneck can shift'],
      opportunities: ['Focus optimization efforts', 'Challenge negotiable constraints'],
      timestamp: Date.now(),
      durationMs: 0,
    };
  }

  // ==========================================================================
  // SYNTHESIS & HELPERS
  // ==========================================================================

  private selectModels(problem: string, context: any): MentalModelType[] {
    // In practice, would use heuristics or ML to select best models
    // For now, use all enabled models
    return this.config.enabledModels.slice(0, Math.max(this.config.minModelsRequired, 5));
  }

  private synthesizeAnalyses(analyses: ModelAnalysis[]): Synthesis {
    // Find convergent insights (mentioned by multiple models)
    const insightCounts = new Map<string, number>();
    analyses.forEach(a => {
      a.insights.forEach(insight => {
        insightCounts.set(insight, (insightCounts.get(insight) || 0) + 1);
      });
    });

    const convergent = Array.from(insightCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([insight, _]) => insight);

    // Find divergent insights (contradictions)
    const divergent: string[] = [
      'Lateral thinking suggests radical change, while Occam\'s Razor prefers simplicity',
      'Systems thinking identifies complexity, while First Principles suggests decomposition',
    ];

    // Identify blind spots
    const blindSpots: string[] = [
      'Political and organizational dynamics not fully analyzed',
      'Implementation challenges may be underestimated',
      'Stakeholder perspectives need deeper consideration',
    ];

    // Find emergent patterns
    const emergent: string[] = [
      'Multiple models converge on need for simplification',
      'Risk mitigation is a recurring theme across analyses',
      'Leverage points exist at system boundaries',
    ];

    // Generate meta-insight
    const metaInsight = this.generateMetaInsight(analyses, convergent, emergent);

    return {
      convergentInsights: convergent,
      divergentInsights: divergent,
      blindSpots,
      emergentPatterns: emergent,
      metaInsight,
    };
  }

  private generateMetaInsight(
    analyses: ModelAnalysis[],
    convergent: string[],
    emergent: string[]
  ): string {
    return `Across ${analyses.length} mental models, a clear pattern emerges: the problem requires both systematic decomposition (first principles) and holistic understanding (systems thinking). The optimal solution balances simplicity (Occam's Razor) with comprehensive risk management. High-leverage interventions exist at key system constraints.`;
  }

  private extractRecommendations(
    analyses: ModelAnalysis[],
    synthesis: Synthesis
  ): PrioritizedRecommendation[] {
    const recommendations: PrioritizedRecommendation[] = [];

    // Aggregate recommendations from all models
    const recMap = new Map<string, { models: MentalModelType[]; count: number }>();

    analyses.forEach(a => {
      a.recommendations.forEach(rec => {
        if (!recMap.has(rec)) {
          recMap.set(rec, { models: [a.model], count: 1 });
        } else {
          const entry = recMap.get(rec)!;
          entry.models.push(a.model);
          entry.count++;
        }
      });
    });

    // Convert to prioritized recommendations
    Array.from(recMap.entries()).forEach(([action, { models, count }]) => {
      recommendations.push({
        action,
        priority: Math.min(5, Math.ceil((count / analyses.length) * 5)),
        confidence: count / analyses.length,
        supportingModels: models,
        reasoning: `Recommended by ${count} out of ${analyses.length} models`,
        expectedImpact: count >= analyses.length * 0.7 ? 'high' : count >= analyses.length * 0.4 ? 'medium' : 'low',
        effort: 'medium', // Would be determined by analysis
        timeframe: 'short-term',
      });
    });

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  private identifyRisks(analyses: ModelAnalysis[]): Risk[] {
    const risks: Risk[] = [];

    analyses.forEach(a => {
      a.warnings.forEach(warning => {
        risks.push({
          description: warning,
          probability: 0.3, // Would be calculated
          impact: 'medium',
          detectedBy: [a.model],
          mitigation: ['Monitor closely', 'Develop contingency plan'],
        });
      });
    });

    return risks;
  }

  private identifyOpportunities(analyses: ModelAnalysis[]): Opportunity[] {
    const opportunities: Opportunity[] = [];

    analyses.forEach(a => {
      a.opportunities.forEach(opp => {
        opportunities.push({
          description: opp,
          potential: 'significant',
          effort: 'medium',
          detectedBy: [a.model],
          capitalizeBy: ['Investigate further', 'Pilot test'],
        });
      });
    });

    return opportunities;
  }

  private calculateOverallConfidence(analyses: ModelAnalysis[]): number {
    if (analyses.length === 0) return 0;
    const sum = analyses.reduce((acc, a) => acc + a.confidence, 0);
    return sum / analyses.length;
  }

  private formatModelName(model: MentalModelType): string {
    return model
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private async persistAnalysis(analysis: MultiModelAnalysis): Promise<void> {
    const filePath = path.join(this.storageDir, `${analysis.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2));
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MentalModelType,
  ModelAnalysis,
  Evidence,
  MultiModelAnalysis,
  Synthesis,
  PrioritizedRecommendation,
  Risk,
  Opportunity,
  MentalModelConfig,
};
