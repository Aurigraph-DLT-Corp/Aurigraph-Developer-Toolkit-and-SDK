import { Logger } from '../core/Logger';
import { EventEmitter } from 'events';

export interface VizorMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface VizorDashboard {
  id: string;
  name: string;
  widgets: VizorWidget[];
  refreshInterval: number;
}

export interface VizorWidget {
  id: string;
  type: 'line' | 'bar' | 'gauge' | 'table' | 'heatmap';
  title: string;
  query: string;
  position: { x: number; y: number; width: number; height: number };
}

export class VizorMonitoringService extends EventEmitter {
  private logger: Logger;
  private metrics: Map<string, VizorMetric[]> = new Map();
  private dashboards: Map<string, VizorDashboard> = new Map();
  private metricsBuffer: VizorMetric[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = new Logger('VizorMonitoring');
    this.flushInterval = setInterval(() => this.flushMetrics(), 5000);
    this.setupDefaultDashboards();
  }

  async recordMetric(metric: VizorMetric): Promise<void> {
    try {
      this.metricsBuffer.push(metric);
      
      const existing = this.metrics.get(metric.name) || [];
      existing.push(metric);
      
      // Keep only last 1000 metrics per series
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      this.metrics.set(metric.name, existing);
      
      this.emit('metric', metric);
      
    } catch (error: unknown) {
      this.logger.error('Failed to record Vizor metric:', error);
    }
  }

  async recordConsensusMetrics(validatorId: string, metrics: any): Promise<void> {
    const timestamp = new Date();
    const tags = { validator_id: validatorId, node_type: 'validator' };

    await Promise.all([
      this.recordMetric({
        name: 'consensus_rounds_per_second',
        value: metrics.roundsPerSecond,
        timestamp,
        tags,
        type: 'gauge'
      }),
      this.recordMetric({
        name: 'consensus_latency_ms',
        value: metrics.latencyMs,
        timestamp,
        tags,
        type: 'histogram'
      }),
      this.recordMetric({
        name: 'validator_stake_amount',
        value: metrics.stakeAmount,
        timestamp,
        tags,
        type: 'gauge'
      }),
      this.recordMetric({
        name: 'transactions_validated',
        value: metrics.transactionsValidated,
        timestamp,
        tags,
        type: 'counter'
      })
    ]);
  }

  async recordChannelMetrics(channelId: string, metrics: any): Promise<void> {
    const timestamp = new Date();
    const tags = { channel_id: channelId };

    await Promise.all([
      this.recordMetric({
        name: 'channel_transactions_per_second',
        value: metrics.tps,
        timestamp,
        tags,
        type: 'gauge'
      }),
      this.recordMetric({
        name: 'channel_encryption_operations',
        value: metrics.encryptionOps,
        timestamp,
        tags,
        type: 'counter'
      }),
      this.recordMetric({
        name: 'channel_user_count',
        value: metrics.activeUsers,
        timestamp,
        tags,
        type: 'gauge'
      })
    ]);
  }

  async recordQuantumMetrics(metrics: any): Promise<void> {
    const timestamp = new Date();
    const tags = { security_level: '5' };

    await Promise.all([
      this.recordMetric({
        name: 'quantum_keys_generated',
        value: metrics.keysGenerated,
        timestamp,
        tags,
        type: 'counter'
      }),
      this.recordMetric({
        name: 'quantum_signatures_verified',
        value: metrics.signaturesVerified,
        timestamp,
        tags,
        type: 'counter'
      }),
      this.recordMetric({
        name: 'quantum_encryption_latency_ms',
        value: metrics.encryptionLatency,
        timestamp,
        tags,
        type: 'histogram'
      })
    ]);
  }

  private setupDefaultDashboards(): void {
    // Main Platform Dashboard
    const platformDashboard: VizorDashboard = {
      id: 'platform-overview',
      name: 'AV11-7 Platform Overview',
      refreshInterval: 5000,
      widgets: [
        {
          id: 'tps-chart',
          type: 'line',
          title: 'Transactions Per Second',
          query: 'avg_over_time(platform_tps[5m])',
          position: { x: 0, y: 0, width: 6, height: 4 }
        },
        {
          id: 'consensus-latency',
          type: 'gauge',
          title: 'Consensus Latency',
          query: 'avg(consensus_latency_ms)',
          position: { x: 6, y: 0, width: 3, height: 4 }
        },
        {
          id: 'quantum-security',
          type: 'gauge',
          title: 'Quantum Security Level',
          query: 'quantum_security_level',
          position: { x: 9, y: 0, width: 3, height: 4 }
        },
        {
          id: 'validator-status',
          type: 'table',
          title: 'Validator Status',
          query: 'validator_status',
          position: { x: 0, y: 4, width: 12, height: 6 }
        }
      ]
    };

    // HyperRAFT Consensus Dashboard  
    const consensusDashboard: VizorDashboard = {
      id: 'consensus-monitoring',
      name: 'HyperRAFT Consensus Monitoring',
      refreshInterval: 3000,
      widgets: [
        {
          id: 'consensus-rounds',
          type: 'line',
          title: 'Consensus Rounds/sec',
          query: 'rate(consensus_rounds_per_second[1m])',
          position: { x: 0, y: 0, width: 6, height: 4 }
        },
        {
          id: 'validator-participation',
          type: 'heatmap',
          title: 'Validator Participation',
          query: 'validator_participation_rate by (validator_id)',
          position: { x: 6, y: 0, width: 6, height: 4 }
        },
        {
          id: 'consensus-errors',
          type: 'bar',
          title: 'Consensus Errors',
          query: 'sum(rate(consensus_errors[5m])) by (error_type)',
          position: { x: 0, y: 4, width: 12, height: 4 }
        }
      ]
    };

    // Channel Monitoring Dashboard
    const channelDashboard: VizorDashboard = {
      id: 'channel-monitoring', 
      name: 'Channel Transaction Monitoring',
      refreshInterval: 2000,
      widgets: [
        {
          id: 'channel-tps',
          type: 'line',
          title: 'Channel TPS by Channel ID',
          query: 'channel_transactions_per_second by (channel_id)',
          position: { x: 0, y: 0, width: 8, height: 4 }
        },
        {
          id: 'encryption-performance',
          type: 'gauge',
          title: 'Encryption Performance',
          query: 'avg(encryption_latency_ms)',
          position: { x: 8, y: 0, width: 4, height: 4 }
        },
        {
          id: 'active-channels',
          type: 'table',
          title: 'Active Channels',
          query: 'channel_user_count by (channel_id)',
          position: { x: 0, y: 4, width: 12, height: 6 }
        }
      ]
    };

    this.dashboards.set('platform-overview', platformDashboard);
    this.dashboards.set('consensus-monitoring', consensusDashboard);
    this.dashboards.set('channel-monitoring', channelDashboard);
  }

  getDashboard(id: string): VizorDashboard | undefined {
    return this.dashboards.get(id);
  }

  getAllDashboards(): VizorDashboard[] {
    return Array.from(this.dashboards.values());
  }

  async queryMetrics(query: string, timeRange?: { start: Date; end: Date }): Promise<VizorMetric[]> {
    try {
      // Simple query parser for demo - in production would use proper query engine
      const metricName = query.split('(')[0].replace('avg_over_time', '').replace('rate', '').replace(/[()]/g, '');
      const metrics = this.metrics.get(metricName) || [];
      
      if (timeRange) {
        return metrics.filter(m => 
          m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
        );
      }
      
      return metrics.slice(-100); // Return last 100 points
    } catch (error: unknown) {
      this.logger.error('Failed to query Vizor metrics:', error);
      return [];
    }
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length > 0) {
      this.logger.debug(`Flushing ${this.metricsBuffer.length} Vizor metrics`);
      this.metricsBuffer = [];
    }
  }

  async generateReport(dashboardId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const report: any = {
      dashboard: dashboard.name,
      timeRange,
      generatedAt: new Date(),
      widgets: []
    };

    for (const widget of dashboard.widgets) {
      const metrics = await this.queryMetrics(widget.query, timeRange);
      report.widgets.push({
        title: widget.title,
        type: widget.type,
        dataPoints: metrics.length,
        summary: this.generateWidgetSummary(metrics, widget.type)
      });
    }

    return report;
  }

  private generateWidgetSummary(metrics: VizorMetric[], type: string): any {
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    
    return {
      count: metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1]
    };
  }

  async getWidgetData(dashboardId: string, widgetId: string): Promise<any> {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) return null;

    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return null;

    const metrics = await this.queryMetrics(widget.query);
    
    return {
      widget: widget.title,
      type: widget.type,
      data: metrics.map(m => ({
        timestamp: m.timestamp,
        value: m.value,
        tags: m.tags
      }))
    };
  }

  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.logger.info('Vizor monitoring service stopped');
  }
}