import { VizorMonitoringService } from '../monitoring/VizorDashboard';
import { ValidatorOrchestrator } from '../consensus/ValidatorOrchestrator';
import { ChannelManager } from '../network/ChannelManager';
export declare class MonitoringAPIServer {
    private app;
    private logger;
    private vizorEndpoints;
    private server;
    constructor(vizorService: VizorMonitoringService, validatorOrchestrator: ValidatorOrchestrator, channelManager: ChannelManager);
    private setupMiddleware;
    private setupRoutes;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=MonitoringAPIServer.d.ts.map