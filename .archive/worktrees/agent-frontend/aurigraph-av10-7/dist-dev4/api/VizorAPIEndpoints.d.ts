import express from 'express';
import { VizorMonitoringService } from '../monitoring/VizorDashboard';
import { ValidatorOrchestrator } from '../consensus/ValidatorOrchestrator';
import { ChannelManager } from '../network/ChannelManager';
export declare class VizorAPIEndpoints {
    private logger;
    private vizorService;
    private validatorOrchestrator;
    private channelManager;
    private router;
    constructor(vizorService: VizorMonitoringService, validatorOrchestrator: ValidatorOrchestrator, channelManager: ChannelManager);
    private setupRoutes;
    private getDashboards;
    private getDashboard;
    private getWidgetData;
    private queryMetrics;
    private recordCustomMetric;
    private getValidators;
    private getValidatorStatus;
    private getConsensusRounds;
    private getChannels;
    private getChannelDetails;
    private addUserToChannel;
    private removeUserFromChannel;
    private getRealtimePerformance;
    private getPerformanceHistory;
    private generateReport;
    private exportReport;
    private convertReportToCSV;
    getRouter(): express.Router;
}
//# sourceMappingURL=VizorAPIEndpoints.d.ts.map