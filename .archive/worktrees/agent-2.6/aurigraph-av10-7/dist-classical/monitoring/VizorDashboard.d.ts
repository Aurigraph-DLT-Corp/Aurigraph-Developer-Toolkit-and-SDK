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
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export declare class VizorMonitoringService extends EventEmitter {
    private logger;
    private metrics;
    private dashboards;
    private metricsBuffer;
    private flushInterval;
    constructor();
    recordMetric(metric: VizorMetric): Promise<void>;
    recordConsensusMetrics(validatorId: string, metrics: any): Promise<void>;
    recordChannelMetrics(channelId: string, metrics: any): Promise<void>;
    recordQuantumMetrics(metrics: any): Promise<void>;
    private setupDefaultDashboards;
    getDashboard(id: string): VizorDashboard | undefined;
    getAllDashboards(): VizorDashboard[];
    queryMetrics(query: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<VizorMetric[]>;
    private flushMetrics;
    generateReport(dashboardId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<any>;
    private generateWidgetSummary;
    getWidgetData(dashboardId: string, widgetId: string): Promise<any>;
    stop(): void;
}
//# sourceMappingURL=VizorDashboard.d.ts.map