"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalTwinTokenizer = void 0;
const events_1 = require("events");
class DigitalTwinTokenizer extends events_1.EventEmitter {
    constructor(cryptoManager, consensus) {
        super();
        this.twins = new Map();
        this.twinsByAsset = new Map();
        this.iotDevices = new Map();
        this.sensorReadings = new Map();
        this.cryptoManager = cryptoManager;
        this.consensus = consensus;
    }
    async createDigitalTwin(asset, iotDevices) {
        if (asset.verification.status !== 'VERIFIED') {
            throw new Error('Asset must be verified before digital twin creation');
        }
        if (this.twinsByAsset.has(asset.id)) {
            throw new Error('Digital twin already exists for this asset');
        }
        const twinId = this.generateTwinId(asset);
        const tokenId = `DT-${twinId}`;
        // Register IoT devices
        for (const device of iotDevices) {
            this.iotDevices.set(device.deviceId, device);
            this.sensorReadings.set(device.deviceId, []);
        }
        const twin = {
            tokenId,
            assetId: asset.id,
            twinId,
            iotDevices,
            sensorData: [],
            analytics: {
                healthScore: 100,
                performanceIndex: 100,
                efficiencyRating: 100,
                predictiveInsights: [],
                optimizationSuggestions: [],
                riskAssessment: {
                    overallRisk: 'LOW',
                    riskFactors: [],
                    mitigationStrategies: [],
                    insuranceRecommendations: [],
                    lastAssessment: new Date()
                },
                lastAnalysis: new Date()
            },
            performance: {
                uptime: 100,
                efficiency: 100,
                throughput: 0,
                energyConsumption: 0,
                maintenanceCost: 0,
                valueGeneration: asset.valuation.currentValue,
                lastUpdated: new Date()
            },
            maintenance: [],
            created: new Date(),
            lastSync: new Date()
        };
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'DIGITAL_TWIN_CREATION',
            data: { assetId: asset.id, twinId, iotDevices: iotDevices.length },
            timestamp: Date.now()
        });
        this.twins.set(tokenId, twin);
        this.twinsByAsset.set(asset.id, tokenId);
        // Start real-time monitoring
        this.startRealTimeMonitoring(tokenId);
        this.emit('digitalTwinCreated', { tokenId, assetId: asset.id, twinId });
        return tokenId;
    }
    async addSensorReading(deviceId, reading) {
        const device = this.iotDevices.get(deviceId);
        if (!device) {
            throw new Error('IoT device not found');
        }
        const sensorReading = {
            deviceId,
            ...reading,
            processed: false
        };
        // Store reading
        if (!this.sensorReadings.has(deviceId)) {
            this.sensorReadings.set(deviceId, []);
        }
        this.sensorReadings.get(deviceId).push(sensorReading);
        // Find associated twin
        const twin = Array.from(this.twins.values()).find(t => t.iotDevices.some(d => d.deviceId === deviceId));
        if (twin) {
            twin.sensorData.push(sensorReading);
            twin.lastSync = new Date();
            // Check for anomalies
            if (reading.anomaly) {
                await this.handleAnomalyDetection(twin.tokenId, sensorReading);
            }
            // Trigger analytics update
            await this.updateTwinAnalytics(twin.tokenId);
        }
        this.emit('sensorDataReceived', { deviceId, reading: sensorReading });
    }
    async updateTwinAnalytics(tokenId) {
        const twin = this.twins.get(tokenId);
        if (!twin)
            return;
        // Calculate health score based on sensor data
        const healthScore = this.calculateHealthScore(twin);
        // Calculate performance metrics
        const performanceIndex = this.calculatePerformanceIndex(twin);
        // Calculate efficiency rating
        const efficiencyRating = this.calculateEfficiencyRating(twin);
        // Generate predictive insights
        const insights = await this.generatePredictiveInsights(twin);
        // Generate optimization suggestions
        const optimizations = await this.generateOptimizationSuggestions(twin);
        // Update risk assessment
        const riskAssessment = await this.assessRisks(twin);
        twin.analytics = {
            healthScore,
            performanceIndex,
            efficiencyRating,
            predictiveInsights: insights,
            optimizationSuggestions: optimizations,
            riskAssessment,
            lastAnalysis: new Date()
        };
        // Update performance metrics
        twin.performance.lastUpdated = new Date();
        this.emit('analyticsUpdated', { tokenId, analytics: twin.analytics });
    }
    calculateHealthScore(twin) {
        if (twin.sensorData.length === 0)
            return 100;
        let totalScore = 0;
        let scoreCount = 0;
        // Analyze recent sensor data (last 24 hours)
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentData = twin.sensorData.filter(s => s.timestamp > cutoffTime);
        for (const reading of recentData) {
            let deviceScore = 100;
            // Penalize for anomalies
            if (reading.anomaly)
                deviceScore -= 30;
            // Consider data quality
            deviceScore *= (reading.quality / 100);
            totalScore += deviceScore;
            scoreCount++;
        }
        return scoreCount > 0 ? Math.max(0, Math.min(100, totalScore / scoreCount)) : 100;
    }
    calculatePerformanceIndex(twin) {
        // Simulate performance calculation based on sensor data and metrics
        let performanceIndex = 100;
        // Factor in device status
        const activeDevices = twin.iotDevices.filter(d => d.status === 'ACTIVE').length;
        const deviceRatio = activeDevices / twin.iotDevices.length;
        performanceIndex *= deviceRatio;
        // Factor in recent anomalies
        const recentAnomalies = twin.sensorData.filter(s => s.anomaly && s.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        if (recentAnomalies > 0) {
            performanceIndex -= Math.min(40, recentAnomalies * 10);
        }
        return Math.max(0, Math.min(100, performanceIndex));
    }
    calculateEfficiencyRating(twin) {
        // Simulate efficiency calculation
        const baseEfficiency = 90;
        const maintenanceCost = twin.performance.maintenanceCost;
        const valueGeneration = twin.performance.valueGeneration;
        if (valueGeneration > 0) {
            const costRatio = maintenanceCost / valueGeneration;
            return Math.max(20, Math.min(100, baseEfficiency - (costRatio * 100)));
        }
        return baseEfficiency;
    }
    async generatePredictiveInsights(twin) {
        const insights = [];
        // Predictive maintenance insights
        if (twin.analytics.healthScore < 80) {
            insights.push({
                type: 'MAINTENANCE',
                prediction: 'Maintenance required within 30 days based on declining health metrics',
                confidence: 85,
                timeframe: '30 days',
                impact: 'MEDIUM',
                actionRequired: true
            });
        }
        // Performance insights
        if (twin.analytics.performanceIndex < 70) {
            insights.push({
                type: 'PERFORMANCE',
                prediction: 'Performance degradation detected, optimization recommended',
                confidence: 78,
                timeframe: '7 days',
                impact: 'HIGH',
                actionRequired: true
            });
        }
        // Value insights
        const recentValueTrend = this.calculateValueTrend(twin);
        if (recentValueTrend < -5) {
            insights.push({
                type: 'VALUE',
                prediction: 'Asset value declining, intervention may be required',
                confidence: 72,
                timeframe: '14 days',
                impact: 'HIGH',
                actionRequired: true
            });
        }
        return insights;
    }
    async generateOptimizationSuggestions(twin) {
        const suggestions = [];
        // Energy optimization
        if (twin.performance.energyConsumption > 1000) {
            suggestions.push({
                category: 'ENERGY',
                suggestion: 'Install smart energy management system to reduce consumption by 20%',
                potentialSavings: twin.performance.energyConsumption * 0.2 * 0.12, // 20% savings at $0.12/kWh
                implementationCost: 5000,
                paybackPeriod: 18, // months
                priority: 'MEDIUM'
            });
        }
        // Maintenance optimization
        if (twin.maintenance.length > 5) {
            suggestions.push({
                category: 'MAINTENANCE',
                suggestion: 'Implement predictive maintenance schedule to reduce reactive repairs',
                potentialSavings: twin.performance.maintenanceCost * 0.3,
                implementationCost: 3000,
                paybackPeriod: 12,
                priority: 'HIGH'
            });
        }
        return suggestions;
    }
    async assessRisks(twin) {
        const riskFactors = [];
        // Device failure risk
        const inactiveDevices = twin.iotDevices.filter(d => d.status !== 'ACTIVE').length;
        if (inactiveDevices > 0) {
            riskFactors.push({
                type: 'DEVICE_FAILURE',
                description: `${inactiveDevices} IoT devices inactive or in error state`,
                probability: (inactiveDevices / twin.iotDevices.length) * 100,
                impact: 70,
                riskScore: (inactiveDevices / twin.iotDevices.length) * 70
            });
        }
        // Performance risk
        if (twin.analytics.performanceIndex < 60) {
            riskFactors.push({
                type: 'PERFORMANCE_DEGRADATION',
                description: 'Significant performance degradation detected',
                probability: 80,
                impact: 60,
                riskScore: 48
            });
        }
        // Calculate overall risk
        const avgRiskScore = riskFactors.length > 0
            ? riskFactors.reduce((sum, r) => sum + r.riskScore, 0) / riskFactors.length
            : 0;
        let overallRisk = 'LOW';
        if (avgRiskScore > 50)
            overallRisk = 'HIGH';
        else if (avgRiskScore > 25)
            overallRisk = 'MEDIUM';
        return {
            overallRisk,
            riskFactors,
            mitigationStrategies: this.generateMitigationStrategies(riskFactors),
            insuranceRecommendations: this.generateInsuranceRecommendations(riskFactors),
            lastAssessment: new Date()
        };
    }
    generateMitigationStrategies(riskFactors) {
        const strategies = [];
        for (const factor of riskFactors) {
            switch (factor.type) {
                case 'DEVICE_FAILURE':
                    strategies.push('Install redundant IoT devices for critical monitoring points');
                    strategies.push('Implement automated device health monitoring with alerts');
                    break;
                case 'PERFORMANCE_DEGRADATION':
                    strategies.push('Schedule immediate performance optimization review');
                    strategies.push('Implement real-time performance monitoring dashboard');
                    break;
            }
        }
        return Array.from(new Set(strategies)); // Remove duplicates
    }
    generateInsuranceRecommendations(riskFactors) {
        const recommendations = [];
        if (riskFactors.some(r => r.type === 'DEVICE_FAILURE')) {
            recommendations.push('Equipment breakdown insurance for IoT devices');
        }
        if (riskFactors.some(r => r.riskScore > 40)) {
            recommendations.push('Comprehensive asset performance insurance');
        }
        return recommendations;
    }
    calculateValueTrend(twin) {
        // Simulate value trend calculation based on performance metrics
        const currentPerformance = twin.analytics.performanceIndex;
        const previousPerformance = 85; // Simulated historical average
        return ((currentPerformance - previousPerformance) / previousPerformance) * 100;
    }
    startRealTimeMonitoring(tokenId) {
        // Simulate real-time monitoring setup
        setInterval(async () => {
            await this.simulateSensorData(tokenId);
        }, 30000); // Every 30 seconds
    }
    async simulateSensorData(tokenId) {
        const twin = this.twins.get(tokenId);
        if (!twin)
            return;
        for (const device of twin.iotDevices) {
            const reading = this.generateSimulatedReading(device);
            await this.addSensorReading(device.deviceId, reading);
        }
    }
    generateSimulatedReading(device) {
        let value;
        let unit;
        let anomaly = false;
        switch (device.type) {
            case 'TEMPERATURE':
                value = 20 + Math.random() * 10; // 20-30°C
                unit = '°C';
                anomaly = value > 35 || value < 5;
                break;
            case 'HUMIDITY':
                value = 40 + Math.random() * 20; // 40-60%
                unit = '%';
                anomaly = value > 80 || value < 20;
                break;
            case 'PRESSURE':
                value = 1000 + Math.random() * 50; // 1000-1050 hPa
                unit = 'hPa';
                anomaly = value > 1100 || value < 950;
                break;
            case 'VIBRATION':
                value = Math.random() * 10; // 0-10 mm/s
                unit = 'mm/s';
                anomaly = value > 15;
                break;
            case 'ENERGY':
                value = Math.random() * 1000; // 0-1000 kWh
                unit = 'kWh';
                anomaly = value > 1500;
                break;
            default:
                value = Math.random() * 100;
                unit = 'units';
                anomaly = Math.random() < 0.05; // 5% chance of anomaly
        }
        return {
            sensorType: device.type,
            value,
            unit,
            timestamp: new Date(),
            quality: 95 + Math.random() * 5, // 95-100% quality
            anomaly
        };
    }
    async handleAnomalyDetection(tokenId, reading) {
        this.emit('anomalyDetected', { tokenId, deviceId: reading.deviceId, reading });
        // Auto-generate maintenance alert for critical anomalies
        if (reading.value > 100 || reading.quality < 80) {
            await this.schedulePredictiveMaintenance(tokenId, reading);
        }
    }
    async schedulePredictiveMaintenance(tokenId, triggerReading) {
        const twin = this.twins.get(tokenId);
        if (!twin)
            return;
        const maintenanceRecord = {
            id: this.generateMaintenanceId(),
            type: 'PREDICTIVE',
            description: `Anomaly detected in ${triggerReading.sensorType} sensor - preventive maintenance scheduled`,
            cost: 500, // Estimated cost
            duration: 2, // 2 hours
            performer: 'AUTO_SCHEDULED',
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            outcome: 'SCHEDULED'
        };
        twin.maintenance.push(maintenanceRecord);
        this.emit('maintenanceScheduled', { tokenId, maintenanceId: maintenanceRecord.id });
    }
    async getDigitalTwin(tokenId) {
        return this.twins.get(tokenId) || null;
    }
    async getTwinByAsset(assetId) {
        const tokenId = this.twinsByAsset.get(assetId);
        return tokenId ? this.twins.get(tokenId) || null : null;
    }
    async getRealtimeData(tokenId, hours = 24) {
        const twin = this.twins.get(tokenId);
        if (!twin)
            return [];
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        return twin.sensorData.filter(s => s.timestamp > cutoffTime);
    }
    async getTwinAnalytics(tokenId) {
        const twin = this.twins.get(tokenId);
        return twin ? twin.analytics : null;
    }
    async generateTwinReport(tokenId) {
        const twin = this.twins.get(tokenId);
        if (!twin)
            return null;
        return {
            summary: {
                tokenId,
                assetId: twin.assetId,
                healthScore: twin.analytics.healthScore,
                activeDevices: twin.iotDevices.filter(d => d.status === 'ACTIVE').length,
                totalDevices: twin.iotDevices.length,
                lastSync: twin.lastSync
            },
            performance: twin.performance,
            insights: twin.analytics.predictiveInsights,
            recommendations: twin.analytics.optimizationSuggestions,
            risks: twin.analytics.riskAssessment
        };
    }
    generateTwinId(asset) {
        const timestamp = Date.now();
        const hash = this.cryptoManager.hashData(asset.id);
        return `TWIN-${timestamp}-${hash.substring(0, 8)}`;
    }
    generateMaintenanceId() {
        return `MAINT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
}
exports.DigitalTwinTokenizer = DigitalTwinTokenizer;
