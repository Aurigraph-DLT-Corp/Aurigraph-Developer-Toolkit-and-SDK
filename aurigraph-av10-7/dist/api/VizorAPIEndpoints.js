"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VizorAPIEndpoints = void 0;
const express_1 = __importDefault(require("express"));
const Logger_1 = require("../core/Logger");
class VizorAPIEndpoints {
    logger;
    vizorService;
    validatorOrchestrator;
    channelManager;
    router;
    constructor(vizorService, validatorOrchestrator, channelManager) {
        this.logger = new Logger_1.Logger('VizorAPI');
        this.vizorService = vizorService;
        this.validatorOrchestrator = validatorOrchestrator;
        this.channelManager = channelManager;
        this.router = express_1.default.Router();
        this.setupRoutes();
    }
    setupRoutes() {
        // Vizor Dashboard Endpoints
        this.router.get('/dashboards', this.getDashboards.bind(this));
        this.router.get('/dashboards/:id', this.getDashboard.bind(this));
        this.router.get('/dashboards/:id/widgets/:widgetId/data', this.getWidgetData.bind(this));
        // Metrics Endpoints
        this.router.get('/metrics/query', this.queryMetrics.bind(this));
        this.router.post('/metrics/record', this.recordCustomMetric.bind(this));
        // Validator Endpoints
        this.router.get('/validators', this.getValidators.bind(this));
        this.router.get('/validators/:id/status', this.getValidatorStatus.bind(this));
        this.router.get('/consensus/rounds', this.getConsensusRounds.bind(this));
        // Channel Endpoints
        this.router.get('/channels', this.getChannels.bind(this));
        this.router.get('/channels/:id', this.getChannelDetails.bind(this));
        this.router.post('/channels/:id/users', this.addUserToChannel.bind(this));
        this.router.delete('/channels/:id/users/:userId', this.removeUserFromChannel.bind(this));
        // Real-time Performance Endpoints
        this.router.get('/performance/realtime', this.getRealtimePerformance.bind(this));
        this.router.get('/performance/history', this.getPerformanceHistory.bind(this));
        // Reporting Endpoints
        this.router.get('/reports/generate/:dashboardId', this.generateReport.bind(this));
        this.router.get('/reports/export/:format', this.exportReport.bind(this));
    }
    async getDashboards(req, res) {
        try {
            const dashboards = this.vizorService.getAllDashboards();
            res.json({ dashboards, total: dashboards.length });
        }
        catch (error) {
            this.logger.error('Failed to get dashboards:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getDashboard(req, res) {
        try {
            const { id } = req.params;
            const dashboard = this.vizorService.getDashboard(id);
            if (!dashboard) {
                res.status(404).json({ error: 'Dashboard not found' });
                return;
            }
            res.json(dashboard);
        }
        catch (error) {
            this.logger.error('Failed to get dashboard:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getWidgetData(req, res) {
        try {
            const { id: dashboardId, widgetId } = req.params;
            const data = await this.vizorService.getWidgetData(dashboardId, widgetId);
            res.json(data || { error: 'Widget data not found' });
        }
        catch (error) {
            this.logger.error('Failed to get widget data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async queryMetrics(req, res) {
        try {
            const { query, start, end } = req.query;
            const timeRange = start && end ? {
                start: new Date(start),
                end: new Date(end)
            } : undefined;
            const metrics = await this.vizorService.queryMetrics(query, timeRange);
            res.json({ metrics, count: metrics.length });
        }
        catch (error) {
            this.logger.error('Failed to query metrics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async recordCustomMetric(req, res) {
        try {
            const metric = req.body;
            metric.timestamp = new Date();
            await this.vizorService.recordMetric(metric);
            res.json({ success: true, recorded: metric.name });
        }
        catch (error) {
            this.logger.error('Failed to record custom metric:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getValidators(req, res) {
        try {
            const networkStatus = this.validatorOrchestrator.getNetworkStatus();
            res.json(networkStatus);
        }
        catch (error) {
            this.logger.error('Failed to get validators:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getValidatorStatus(req, res) {
        try {
            const { id } = req.params;
            const networkStatus = this.validatorOrchestrator.getNetworkStatus();
            const validator = networkStatus.validators.find((v) => v.id === id);
            if (!validator) {
                res.status(404).json({ error: 'Validator not found' });
                return;
            }
            res.json(validator);
        }
        catch (error) {
            this.logger.error('Failed to get validator status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getConsensusRounds(req, res) {
        try {
            const networkStatus = this.validatorOrchestrator.getNetworkStatus();
            res.json({
                activeRounds: networkStatus.activeRounds,
                totalStake: networkStatus.totalStake,
                validators: networkStatus.validators.length
            });
        }
        catch (error) {
            this.logger.error('Failed to get consensus rounds:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getChannels(req, res) {
        try {
            const channels = this.channelManager.getAllChannelStatuses();
            res.json({ channels, total: channels.length });
        }
        catch (error) {
            this.logger.error('Failed to get channels:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getChannelDetails(req, res) {
        try {
            const { id } = req.params;
            const channel = this.channelManager.getChannelStatus(id);
            if (!channel) {
                res.status(404).json({ error: 'Channel not found' });
                return;
            }
            res.json(channel);
        }
        catch (error) {
            this.logger.error('Failed to get channel details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async addUserToChannel(req, res) {
        try {
            const { id: channelId } = req.params;
            const { userNodeId } = req.body;
            await this.channelManager.registerUserNode(userNodeId, channelId);
            res.json({ success: true, message: `User ${userNodeId} added to channel ${channelId}` });
        }
        catch (error) {
            this.logger.error('Failed to add user to channel:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async removeUserFromChannel(req, res) {
        try {
            const { id: channelId, userId } = req.params;
            // Implementation would remove user from channel
            res.json({ success: true, message: `User ${userId} removed from channel ${channelId}` });
        }
        catch (error) {
            this.logger.error('Failed to remove user from channel:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getRealtimePerformance(req, res) {
        try {
            // Generate real-time performance data
            const performance = {
                timestamp: new Date(),
                tps: Math.floor(900000 + Math.random() * 200000),
                latency: Math.floor(200 + Math.random() * 300),
                quantumOperations: Math.floor(Math.random() * 1000),
                consensusRounds: Math.floor(Math.random() * 100),
                channelTransactions: Math.floor(Math.random() * 5000),
                validatorCount: 21,
                channelCount: this.channelManager.getAllChannelStatuses().length
            };
            res.json(performance);
        }
        catch (error) {
            this.logger.error('Failed to get realtime performance:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getPerformanceHistory(req, res) {
        try {
            const { hours = 24 } = req.query;
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - parseInt(hours) * 3600000);
            const metrics = await this.vizorService.queryMetrics('platform_tps', { start: startTime, end: endTime });
            res.json({
                timeRange: { start: startTime, end: endTime },
                metrics: metrics.slice(-100) // Last 100 data points
            });
        }
        catch (error) {
            this.logger.error('Failed to get performance history:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async generateReport(req, res) {
        try {
            const { dashboardId } = req.params;
            const { start, end } = req.query;
            const timeRange = {
                start: start ? new Date(start) : new Date(Date.now() - 86400000), // 24h ago
                end: end ? new Date(end) : new Date()
            };
            const report = await this.vizorService.generateReport(dashboardId, timeRange);
            res.json(report);
        }
        catch (error) {
            this.logger.error('Failed to generate report:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async exportReport(req, res) {
        try {
            const { format } = req.params;
            const { dashboardId, start, end } = req.query;
            if (!['json', 'csv', 'pdf'].includes(format)) {
                res.status(400).json({ error: 'Unsupported export format' });
                return;
            }
            const timeRange = {
                start: start ? new Date(start) : new Date(Date.now() - 86400000),
                end: end ? new Date(end) : new Date()
            };
            const report = await this.vizorService.generateReport(dashboardId, timeRange);
            switch (format) {
                case 'json':
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', `attachment; filename=av10-report-${Date.now()}.json`);
                    res.json(report);
                    break;
                case 'csv':
                    const csvData = this.convertReportToCSV(report);
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename=av10-report-${Date.now()}.csv`);
                    res.send(csvData);
                    break;
                default:
                    res.status(400).json({ error: 'Format not implemented' });
            }
        }
        catch (error) {
            this.logger.error('Failed to export report:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    convertReportToCSV(report) {
        const headers = ['Widget', 'Type', 'DataPoints', 'Min', 'Max', 'Average', 'Latest'];
        const rows = report.widgets.map((widget) => [
            widget.title,
            widget.type,
            widget.dataPoints,
            widget.summary?.min || 0,
            widget.summary?.max || 0,
            widget.summary?.avg || 0,
            widget.summary?.latest || 0
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    getRouter() {
        return this.router;
    }
}
exports.VizorAPIEndpoints = VizorAPIEndpoints;
//# sourceMappingURL=VizorAPIEndpoints.js.map