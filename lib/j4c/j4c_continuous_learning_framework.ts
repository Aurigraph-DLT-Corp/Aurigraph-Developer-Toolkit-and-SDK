/**
 * J4C Continuous Learning Framework
 *
 * Enables J4C agents to continuously learn from execution patterns,
 * best practices, and organizational feedback using heuristic learning
 * techniques including reinforcement learning, pattern mining, and
 * recommendation optimization.
 *
 * @author J4C Framework
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Agent execution event for learning
 */
interface AgentExecutionEvent {
  agentId: string;
  agentName: string;
  taskId: string;
  timestamp: number;
  duration: number;
  success: boolean;
  outcome: 'success' | 'partial' | 'failure';
  recommendations: string[];
  practicesApplied: string[];
  practicesViolated: string[];
  qualityScore: number;
  complianceScore: number;
  userFeedback?: string;
  feedbackScore?: number; // 1-5 star rating
  lessons: string[];
  context: Record<string, any>;
}

/**
 * Learning pattern detected from events
 */
interface LearningPattern {
  patternId: string;
  type: 'success_pattern' | 'failure_pattern' | 'improvement_opportunity' | 'best_practice';
  frequency: number;
  confidence: number;
  affectedAgents: string[];
  description: string;
  recommendation: string;
  impact: number; // 0-1 scale
  firstSeen: number;
  lastSeen: number;
  evidence: string[];
}

/**
 * Agent learning profile
 */
interface AgentLearningProfile {
  agentId: string;
  agentName: string;
  totalExecutions: number;
  successRate: number;
  averageQualityScore: number;
  averageComplianceScore: number;
  averageExecutionTime: number;
  detectedPatterns: LearningPattern[];
  improvementAreas: string[];
  strengths: string[];
  recommendations: string[];
  lastLearningUpdate: number;
  learningTrend: 'improving' | 'stable' | 'declining';
  trendScore: number; // -1 to 1
}

/**
 * Heuristic learning engine for continuous agent improvement
 */
export class J4CContinuousLearningEngine {
  private executionEvents: AgentExecutionEvent[] = [];
  private detectedPatterns: Map<string, LearningPattern> = new Map();
  private agentProfiles: Map<string, AgentLearningProfile> = new Map();
  private learningDataPath: string = './organization/learning_data';
  private windowSize: number = 100; // Events to analyze in each window

  constructor(dataPath?: string) {
    if (dataPath) {
      this.learningDataPath = dataPath;
    }
    this.ensureDataDirectories();
    this.loadExistingLearningData();
  }

  /**
   * Ensure learning data directories exist
   */
  private ensureDataDirectories(): void {
    const dirs = [
      this.learningDataPath,
      path.join(this.learningDataPath, 'events'),
      path.join(this.learningDataPath, 'patterns'),
      path.join(this.learningDataPath, 'profiles'),
      path.join(this.learningDataPath, 'insights')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Load existing learning data from disk
   */
  private loadExistingLearningData(): void {
    const eventsDir = path.join(this.learningDataPath, 'events');

    if (fs.existsSync(eventsDir)) {
      const files = fs.readdirSync(eventsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = JSON.parse(
              fs.readFileSync(path.join(eventsDir, file), 'utf-8')
            );
            this.executionEvents.push(data);
          } catch (error) {
            console.warn(`Failed to load event file ${file}:`, error);
          }
        }
      }
    }
  }

  /**
   * Record an agent execution event
   */
  public recordExecutionEvent(event: AgentExecutionEvent): void {
    this.executionEvents.push(event);

    // Persist event to disk
    const eventFile = path.join(
      this.learningDataPath,
      'events',
      `${event.taskId}_${event.timestamp}.json`
    );

    fs.writeFileSync(eventFile, JSON.stringify(event, null, 2));

    // Trigger learning analysis on new event
    if (this.executionEvents.length % this.windowSize === 0) {
      this.analyzeAndLearn();
    }
  }

  /**
   * Main learning analysis pipeline
   */
  public analyzeAndLearn(): void {
    console.log('[J4C Learning] Starting continuous learning analysis...');

    // 1. Analyze recent events
    const recentEvents = this.executionEvents.slice(-this.windowSize);

    // 2. Mine patterns
    this.minePatterns(recentEvents);

    // 3. Update agent profiles
    this.updateAgentProfiles(recentEvents);

    // 4. Detect improvement opportunities
    this.detectImprovementOpportunities();

    // 5. Generate recommendations
    this.generateRecommendations();

    // 6. Export learning insights
    this.exportLearningInsights();

    console.log('[J4C Learning] Learning analysis complete');
  }

  /**
   * Mine patterns from execution events
   */
  private minePatterns(events: AgentExecutionEvent[]): void {
    const patterns: Map<string, LearningPattern> = new Map();

    // Group events by characteristics
    const successfulEvents = events.filter(e => e.outcome === 'success');
    const failedEvents = events.filter(e => e.outcome === 'failure');

    // Analyze success patterns
    for (const event of successfulEvents) {
      for (const practice of event.practicesApplied) {
        const patternKey = `success_${practice}`;
        const existing = patterns.get(patternKey);

        if (existing) {
          existing.frequency++;
          existing.evidence.push(event.taskId);
        } else {
          patterns.set(patternKey, {
            patternId: patternKey,
            type: 'success_pattern',
            frequency: 1,
            confidence: this.calculateConfidence(successfulEvents, practice),
            affectedAgents: [event.agentId],
            description: `${event.agentName} successfully applied ${practice}`,
            recommendation: `Encourage use of ${practice} in similar contexts`,
            impact: event.qualityScore * 0.9 + event.complianceScore * 0.1,
            firstSeen: event.timestamp,
            lastSeen: event.timestamp,
            evidence: [event.taskId]
          });
        }
      }
    }

    // Analyze failure patterns and violations
    for (const event of failedEvents) {
      for (const violation of event.practicesViolated) {
        const patternKey = `failure_${violation}`;
        const existing = patterns.get(patternKey);

        if (existing) {
          existing.frequency++;
          existing.evidence.push(event.taskId);
        } else {
          patterns.set(patternKey, {
            patternId: patternKey,
            type: 'failure_pattern',
            frequency: 1,
            confidence: this.calculateConfidence(failedEvents, violation),
            affectedAgents: [event.agentId],
            description: `${event.agentName} violated ${violation}, leading to failure`,
            recommendation: `Implement safeguards against ${violation}`,
            impact: (1 - event.qualityScore) * 0.9,
            firstSeen: event.timestamp,
            lastSeen: event.timestamp,
            evidence: [event.taskId]
          });
        }
      }
    }

    // Store patterns with high confidence
    for (const [key, pattern] of patterns.entries()) {
      if (pattern.confidence > 0.6) {
        this.detectedPatterns.set(key, pattern);
      }
    }
  }

  /**
   * Calculate confidence score for a pattern
   */
  private calculateConfidence(events: AgentExecutionEvent[], practice: string): number {
    if (events.length === 0) return 0;

    const relevantEvents = events.filter(
      e => e.practicesApplied.includes(practice) || e.practicesViolated.includes(practice)
    );

    if (relevantEvents.length === 0) return 0;

    const successCount = relevantEvents.filter(e => e.outcome === 'success').length;
    const baseConfidence = successCount / relevantEvents.length;

    // Boost confidence based on consistency
    const consistencyBonus = relevantEvents.length > 5 ? 0.1 : 0;

    return Math.min(0.99, baseConfidence + consistencyBonus);
  }

  /**
   * Update agent learning profiles
   */
  private updateAgentProfiles(events: AgentExecutionEvent[]): void {
    const agentEvents: Map<string, AgentExecutionEvent[]> = new Map();

    // Group events by agent
    for (const event of events) {
      if (!agentEvents.has(event.agentId)) {
        agentEvents.set(event.agentId, []);
      }
      agentEvents.get(event.agentId)!.push(event);
    }

    // Update profile for each agent
    for (const [agentId, agentExecEvents] of agentEvents.entries()) {
      const profile = this.calculateAgentProfile(agentId, agentExecEvents);
      this.agentProfiles.set(agentId, profile);
    }
  }

  /**
   * Calculate agent learning profile
   */
  private calculateAgentProfile(
    agentId: string,
    events: AgentExecutionEvent[]
  ): AgentLearningProfile {
    if (events.length === 0) {
      return {
        agentId,
        agentName: 'Unknown',
        totalExecutions: 0,
        successRate: 0,
        averageQualityScore: 0,
        averageComplianceScore: 0,
        averageExecutionTime: 0,
        detectedPatterns: [],
        improvementAreas: [],
        strengths: [],
        recommendations: [],
        lastLearningUpdate: Date.now(),
        learningTrend: 'stable',
        trendScore: 0
      };
    }

    const successCount = events.filter(e => e.outcome === 'success').length;
    const qualityScores = events.map(e => e.qualityScore);
    const complianceScores = events.map(e => e.complianceScore);
    const durations = events.map(e => e.duration);

    // Calculate trend
    const recentEvents = events.slice(-Math.ceil(events.length / 3));
    const oldEvents = events.slice(0, Math.ceil(events.length / 3));

    const recentAvgScore = recentEvents.reduce((a, b) => a + b.qualityScore, 0) / recentEvents.length;
    const oldAvgScore = oldEvents.reduce((a, b) => a + b.qualityScore, 0) / oldEvents.length;
    const trendScore = recentAvgScore - oldAvgScore;
    const learningTrend = trendScore > 0.05 ? 'improving' : trendScore < -0.05 ? 'declining' : 'stable';

    // Find patterns affecting this agent
    const affectingPatterns = Array.from(this.detectedPatterns.values()).filter(p =>
      p.affectedAgents.includes(agentId)
    );

    return {
      agentId,
      agentName: events[0]?.agentName || 'Unknown',
      totalExecutions: events.length,
      successRate: successCount / events.length,
      averageQualityScore: qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length,
      averageComplianceScore: complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length,
      averageExecutionTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      detectedPatterns: affectingPatterns,
      improvementAreas: this.identifyImprovementAreas(events),
      strengths: this.identifyStrengths(events),
      recommendations: this.generateAgentRecommendations(events),
      lastLearningUpdate: Date.now(),
      learningTrend,
      trendScore
    };
  }

  /**
   * Identify improvement areas for an agent
   */
  private identifyImprovementAreas(events: AgentExecutionEvent[]): string[] {
    const areas: string[] = [];

    // Check for low compliance
    const avgCompliance = events.reduce((a, b) => a + b.complianceScore, 0) / events.length;
    if (avgCompliance < 0.8) {
      areas.push('Compliance adherence');
    }

    // Check for slow execution
    const avgDuration = events.reduce((a, b) => a + b.duration, 0) / events.length;
    if (avgDuration > 5000) {
      areas.push('Execution speed optimization');
    }

    // Check for frequent violations
    const violationPatterns = Array.from(this.detectedPatterns.values()).filter(
      p => p.type === 'failure_pattern' && p.affectedAgents.includes(events[0].agentId)
    );
    for (const pattern of violationPatterns) {
      areas.push(`Avoid: ${pattern.description}`);
    }

    return areas;
  }

  /**
   * Identify strengths for an agent
   */
  private identifyStrengths(events: AgentExecutionEvent[]): string[] {
    const strengths: string[] = [];

    // High success rate
    const successRate = events.filter(e => e.outcome === 'success').length / events.length;
    if (successRate > 0.8) {
      strengths.push('High success rate');
    }

    // Consistent quality
    const avgQuality = events.reduce((a, b) => a + b.qualityScore, 0) / events.length;
    if (avgQuality > 0.85) {
      strengths.push('High quality output');
    }

    // Fast execution
    const avgDuration = events.reduce((a, b) => a + b.duration, 0) / events.length;
    if (avgDuration < 1000) {
      strengths.push('Fast execution');
    }

    // Good compliance
    const avgCompliance = events.reduce((a, b) => a + b.complianceScore, 0) / events.length;
    if (avgCompliance > 0.85) {
      strengths.push('Strong compliance');
    }

    return strengths;
  }

  /**
   * Generate recommendations for agent improvement
   */
  private generateAgentRecommendations(events: AgentExecutionEvent[]): string[] {
    const recommendations: string[] = [];

    const failedEvents = events.filter(e => e.outcome === 'failure');
    if (failedEvents.length > 0) {
      const commonViolations = this.findCommonViolations(failedEvents);
      for (const violation of commonViolations) {
        recommendations.push(`Focus on avoiding: ${violation}`);
      }
    }

    const improvementAreas = this.identifyImprovementAreas(events);
    for (const area of improvementAreas) {
      recommendations.push(`Improve: ${area}`);
    }

    return recommendations;
  }

  /**
   * Find common violations in failed events
   */
  private findCommonViolations(failedEvents: AgentExecutionEvent[]): string[] {
    const violationCounts: Map<string, number> = new Map();

    for (const event of failedEvents) {
      for (const violation of event.practicesViolated) {
        violationCounts.set(violation, (violationCounts.get(violation) || 0) + 1);
      }
    }

    return Array.from(violationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([violation]) => violation);
  }

  /**
   * Detect improvement opportunities
   */
  private detectImprovementOpportunities(): void {
    const opportunities: LearningPattern[] = [];

    // Compare agent profiles
    const profiles = Array.from(this.agentProfiles.values());

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const profile1 = profiles[i];
        const profile2 = profiles[j];

        // If one agent is faster but same quality, that's an opportunity
        if (profile1.averageExecutionTime > profile2.averageExecutionTime &&
            profile1.averageQualityScore >= profile2.averageQualityScore - 0.05) {
          opportunities.push({
            patternId: `improvement_speed_${profile1.agentId}`,
            type: 'improvement_opportunity',
            frequency: 1,
            confidence: 0.8,
            affectedAgents: [profile1.agentId],
            description: `${profile1.agentName} could learn speed optimization from ${profile2.agentName}`,
            recommendation: `Study ${profile2.agentName}'s execution patterns for speed optimization`,
            impact: 0.7,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            evidence: []
          });
        }
      }
    }

    for (const opportunity of opportunities) {
      this.detectedPatterns.set(opportunity.patternId, opportunity);
    }
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(): void {
    const allRecommendations: string[] = [];

    // From patterns
    for (const pattern of this.detectedPatterns.values()) {
      if (pattern.confidence > 0.8) {
        allRecommendations.push(pattern.recommendation);
      }
    }

    // From agent profiles
    for (const profile of this.agentProfiles.values()) {
      allRecommendations.push(...profile.recommendations);
    }

    // Export recommendations
    const recFile = path.join(this.learningDataPath, 'insights', 'recommendations.json');
    fs.writeFileSync(recFile, JSON.stringify({
      timestamp: Date.now(),
      recommendations: [...new Set(allRecommendations)] // Remove duplicates
    }, null, 2));
  }

  /**
   * Export learning insights
   */
  private exportLearningInsights(): void {
    const insights = {
      timestamp: Date.now(),
      totalEvents: this.executionEvents.length,
      detectedPatterns: Array.from(this.detectedPatterns.values()),
      agentProfiles: Array.from(this.agentProfiles.values()),
      overallTrends: this.calculateOverallTrends(),
      recommendations: this.getTopRecommendations(5)
    };

    const insightFile = path.join(this.learningDataPath, 'insights', 'latest_insights.json');
    fs.writeFileSync(insightFile, JSON.stringify(insights, null, 2));

    // Also export as markdown
    const mdFile = path.join(this.learningDataPath, 'insights', 'LEARNING_INSIGHTS.md');
    fs.writeFileSync(mdFile, this.formatInsightsAsMarkdown(insights));
  }

  /**
   * Calculate overall organizational trends
   */
  private calculateOverallTrends(): Record<string, any> {
    if (this.executionEvents.length === 0) {
      return { status: 'no_data' };
    }

    const recentEvents = this.executionEvents.slice(-100);
    const olderEvents = this.executionEvents.slice(0, Math.min(100, this.executionEvents.length - 100));

    const recentSuccess = recentEvents.filter(e => e.outcome === 'success').length / recentEvents.length;
    const olderSuccess = olderEvents.length > 0
      ? olderEvents.filter(e => e.outcome === 'success').length / olderEvents.length
      : 0;

    const recentQuality = recentEvents.reduce((a, b) => a + b.qualityScore, 0) / recentEvents.length;
    const olderQuality = olderEvents.length > 0
      ? olderEvents.reduce((a, b) => a + b.qualityScore, 0) / olderEvents.length
      : 0;

    return {
      successRateTrend: {
        recent: recentSuccess,
        older: olderSuccess,
        change: recentSuccess - olderSuccess,
        direction: recentSuccess > olderSuccess ? 'improving' : 'declining'
      },
      qualityTrend: {
        recent: recentQuality,
        older: olderQuality,
        change: recentQuality - olderQuality,
        direction: recentQuality > olderQuality ? 'improving' : 'declining'
      },
      topPerformingAgents: this.getTopPerformingAgents(3),
      agentsNeedingSupport: this.getAgentsNeedingSupport(3)
    };
  }

  /**
   * Get top performing agents
   */
  private getTopPerformingAgents(count: number): string[] {
    return Array.from(this.agentProfiles.values())
      .sort((a, b) => (b.successRate + b.averageQualityScore) - (a.successRate + a.averageQualityScore))
      .slice(0, count)
      .map(p => p.agentName);
  }

  /**
   * Get agents needing support
   */
  private getAgentsNeedingSupport(count: number): string[] {
    return Array.from(this.agentProfiles.values())
      .sort((a, b) => (a.successRate + a.averageQualityScore) - (b.successRate + b.averageQualityScore))
      .slice(0, count)
      .map(p => p.agentName);
  }

  /**
   * Get top recommendations
   */
  private getTopRecommendations(count: number): string[] {
    return Array.from(this.detectedPatterns.values())
      .filter(p => p.confidence > 0.7)
      .sort((a, b) => b.impact - a.impact)
      .slice(0, count)
      .map(p => p.recommendation);
  }

  /**
   * Format insights as markdown
   */
  private formatInsightsAsMarkdown(insights: any): string {
    let md = '# J4C Continuous Learning Insights\n\n';
    md += `**Generated**: ${new Date(insights.timestamp).toISOString()}\n`;
    md += `**Total Events Analyzed**: ${insights.totalEvents}\n\n`;

    md += '## Trends\n\n';
    if (insights.overallTrends.successRateTrend) {
      md += `### Success Rate\n`;
      md += `- Recent: ${(insights.overallTrends.successRateTrend.recent * 100).toFixed(1)}%\n`;
      md += `- Direction: ${insights.overallTrends.successRateTrend.direction}\n\n`;
    }

    md += '## Top Performing Agents\n\n';
    for (const agent of insights.overallTrends.topPerformingAgents || []) {
      md += `- ✅ ${agent}\n`;
    }

    md += '\n## Agents Needing Support\n\n';
    for (const agent of insights.overallTrends.agentsNeedingSupport || []) {
      md += `- ⚠️ ${agent}\n`;
    }

    md += '\n## Top Recommendations\n\n';
    for (const rec of insights.recommendations || []) {
      md += `- ${rec}\n`;
    }

    md += '\n## Detected Patterns\n\n';
    for (const pattern of insights.detectedPatterns.slice(0, 5)) {
      md += `### ${pattern.description}\n`;
      md += `- Confidence: ${(pattern.confidence * 100).toFixed(1)}%\n`;
      md += `- Recommendation: ${pattern.recommendation}\n`;
      md += `- Frequency: ${pattern.frequency}\n\n`;
    }

    return md;
  }

  /**
   * Get agent learning profile
   */
  public getAgentProfile(agentId: string): AgentLearningProfile | undefined {
    return this.agentProfiles.get(agentId);
  }

  /**
   * Get all learning insights
   */
  public getLearningInsights(): {
    patterns: LearningPattern[];
    profiles: AgentLearningProfile[];
    trends: Record<string, any>;
  } {
    return {
      patterns: Array.from(this.detectedPatterns.values()),
      profiles: Array.from(this.agentProfiles.values()),
      trends: this.calculateOverallTrends()
    };
  }

  /**
   * Generate learning report
   */
  public generateLearningReport(): string {
    const insights = this.getLearningInsights();
    let report = '# J4C Agent Learning Report\n\n';

    report += `**Report Date**: ${new Date().toISOString()}\n`;
    report += `**Total Execution Events**: ${this.executionEvents.length}\n`;
    report += `**Detected Patterns**: ${insights.patterns.length}\n`;
    report += `**Agent Profiles**: ${insights.profiles.length}\n\n`;

    report += '## Overall Trends\n\n';
    const trends = insights.trends;
    if (trends.successRateTrend) {
      report += `Success Rate: **${(trends.successRateTrend.recent * 100).toFixed(1)}%** (${trends.successRateTrend.direction})\n\n`;
    }

    report += '## Agent Profiles Summary\n\n';
    for (const profile of insights.profiles.slice(0, 10)) {
      report += `### ${profile.agentName}\n`;
      report += `- Success Rate: ${(profile.successRate * 100).toFixed(1)}%\n`;
      report += `- Quality Score: ${(profile.averageQualityScore * 100).toFixed(1)}%\n`;
      report += `- Learning Trend: ${profile.learningTrend} (${(profile.trendScore * 100).toFixed(1)}%)\n`;
      if (profile.strengths.length > 0) {
        report += `- Strengths: ${profile.strengths.join(', ')}\n`;
      }
      report += '\n';
    }

    return report;
  }
}

/**
 * Export for use as module
 */
export default J4CContinuousLearningEngine;

/**
 * CLI interface for testing
 */
if (require.main === module) {
  const engine = new J4CContinuousLearningEngine();

  console.log('\n' + '='.repeat(60));
  console.log('J4C CONTINUOUS LEARNING ENGINE - ACTIVE');
  console.log('='.repeat(60));

  // Example: Record sample execution events
  const sampleEvent: AgentExecutionEvent = {
    agentId: 'agent-001',
    agentName: 'Development Lead',
    taskId: 'task-001',
    timestamp: Date.now(),
    duration: 2500,
    success: true,
    outcome: 'success',
    recommendations: ['Use TypeScript for type safety', 'Add comprehensive tests'],
    practicesApplied: ['strict_typing', 'test_coverage', 'code_review'],
    practicesViolated: [],
    qualityScore: 0.92,
    complianceScore: 0.95,
    userFeedback: 'Excellent work',
    feedbackScore: 5,
    lessons: ['Code review process was effective', 'Testing reduced bugs by 40%'],
    context: { projectType: 'backend', complexity: 'high' }
  };

  engine.recordExecutionEvent(sampleEvent);

  console.log('\n✅ Continuous Learning Engine Ready');
  console.log('   - Monitoring agent execution events');
  console.log('   - Learning from patterns and feedback');
  console.log('   - Generating improvement recommendations');
  console.log('\n' + '='.repeat(60) + '\n');
}
