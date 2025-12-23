/**
 * Scalability Modes Manager
 * Epic: AV11-192, Task: AV11-202
 * Handles performance scaling scenarios from 1K to 2M+ TPS
 */

class ScalabilityModesManager {
    constructor() {
        this.currentMode = null;
        this.modes = {
            'educational': {
                name: 'Educational Mode (1K-5K TPS)',
                description: 'Perfect for learning and demonstrations',
                targetTPS: 3000,
                transactionBatchSize: 10,
                updateInterval: 100,
                nodeMultiplier: 1,
                displayMetrics: true,
                animationSpeed: 'normal'
            },
            'development': {
                name: 'Development Mode (10K-50K TPS)',
                description: 'Testing and development environment',
                targetTPS: 30000,
                transactionBatchSize: 50,
                updateInterval: 50,
                nodeMultiplier: 2,
                displayMetrics: true,
                animationSpeed: 'fast'
            },
            'staging': {
                name: 'Staging Mode (100K-500K TPS)',
                description: 'Pre-production performance testing',
                targetTPS: 300000,
                transactionBatchSize: 200,
                updateInterval: 25,
                nodeMultiplier: 5,
                displayMetrics: true,
                animationSpeed: 'faster'
            },
            'production': {
                name: 'Production Mode (2M+ TPS)',
                description: 'Maximum performance demonstration',
                targetTPS: 2000000,
                transactionBatchSize: 1000,
                updateInterval: 10,
                nodeMultiplier: 10,
                displayMetrics: false,
                animationSpeed: 'instant'
            }
        };

        this.performanceStats = {
            actualTPS: 0,
            targetTPS: 0,
            efficiency: 0,
            startTime: null,
            totalTransactions: 0
        };
    }

    /**
     * Get all available modes
     */
    getModes() {
        return this.modes;
    }

    /**
     * Get current active mode
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Switch to a different performance mode
     */
    switchMode(modeName) {
        if (!this.modes[modeName]) {
            throw new Error(`Unknown mode: ${modeName}`);
        }

        this.currentMode = modeName;
        const mode = this.modes[modeName];

        this.performanceStats.targetTPS = mode.targetTPS;
        this.performanceStats.startTime = Date.now();
        this.performanceStats.totalTransactions = 0;

        return {
            mode: modeName,
            config: mode,
            message: `Switched to ${mode.name}`
        };
    }

    /**
     * Calculate required nodes for target TPS
     */
    calculateRequiredNodes(targetTPS) {
        const tpsPerChannel = 5000;
        const tpsPerValidator = 10000;
        const tpsPerBusiness = 8000;

        return {
            channels: Math.ceil(targetTPS / tpsPerChannel),
            validators: Math.ceil(targetTPS / tpsPerValidator),
            business: Math.ceil(targetTPS / tpsPerBusiness)
        };
    }

    /**
     * Generate scaled node configuration for current mode
     */
    generateScaledConfiguration() {
        if (!this.currentMode) {
            throw new Error('No mode selected');
        }

        const mode = this.modes[this.currentMode];
        const requiredNodes = this.calculateRequiredNodes(mode.targetTPS);

        const config = {
            version: '1.0',
            mode: this.currentMode,
            targetTPS: mode.targetTPS,
            timestamp: new Date().toISOString(),
            nodes: []
        };

        // Add channel nodes
        for (let i = 0; i < requiredNodes.channels; i++) {
            config.nodes.push({
                id: `channel-${this.currentMode}-${i}`,
                type: 'channel',
                name: `Channel Node ${i + 1}`,
                enabled: true,
                config: {
                    maxConnections: mode.targetTPS > 100000 ? 500 : 100,
                    routingAlgorithm: mode.targetTPS > 100000 ? 'weighted' : 'round-robin',
                    bufferSize: mode.transactionBatchSize * 100,
                    timeout: mode.updateInterval * 2
                }
            });
        }

        // Add validator nodes (ensure odd number for consensus)
        const validatorCount = requiredNodes.validators % 2 === 0
            ? requiredNodes.validators + 1
            : requiredNodes.validators;

        for (let i = 0; i < validatorCount; i++) {
            config.nodes.push({
                id: `validator-${this.currentMode}-${i}`,
                type: 'validator',
                name: `Validator Node ${i + 1}`,
                enabled: true,
                config: {
                    stakeAmount: 10000 * (i + 1),
                    votingPower: 1,
                    consensusTimeout: mode.updateInterval * 10,
                    maxBlockSize: mode.transactionBatchSize * 10
                }
            });
        }

        // Add business nodes
        for (let i = 0; i < requiredNodes.business; i++) {
            config.nodes.push({
                id: `business-${this.currentMode}-${i}`,
                type: 'business',
                name: `Business Node ${i + 1}`,
                enabled: true,
                config: {
                    processingCapacity: mode.transactionBatchSize * 100,
                    queueSize: mode.transactionBatchSize * 200,
                    batchSize: mode.transactionBatchSize,
                    parallelThreads: mode.nodeMultiplier * 8
                }
            });
        }

        return config;
    }

    /**
     * Update performance statistics
     */
    updatePerformanceStats(actualTPS, transactionCount) {
        this.performanceStats.actualTPS = actualTPS;
        this.performanceStats.totalTransactions += transactionCount;

        if (this.performanceStats.targetTPS > 0) {
            this.performanceStats.efficiency =
                (actualTPS / this.performanceStats.targetTPS * 100).toFixed(2);
        }

        return this.performanceStats;
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        if (this.performanceStats.startTime) {
            const elapsedSeconds = (Date.now() - this.performanceStats.startTime) / 1000;
            return {
                ...this.performanceStats,
                elapsedTime: elapsedSeconds.toFixed(2),
                avgTPS: (this.performanceStats.totalTransactions / elapsedSeconds).toFixed(0)
            };
        }
        return this.performanceStats;
    }

    /**
     * Get simulation parameters for current mode
     */
    getSimulationParameters() {
        if (!this.currentMode) {
            return {
                transactionBatchSize: 10,
                updateInterval: 100,
                nodeMultiplier: 1
            };
        }

        const mode = this.modes[this.currentMode];
        return {
            transactionBatchSize: mode.transactionBatchSize,
            updateInterval: mode.updateInterval,
            nodeMultiplier: mode.nodeMultiplier,
            animationSpeed: mode.animationSpeed
        };
    }

    /**
     * Generate load test scenario
     */
    generateLoadTestScenario(durationSeconds = 60) {
        if (!this.currentMode) {
            throw new Error('No mode selected');
        }

        const mode = this.modes[this.currentMode];
        const stepsPerSecond = 1000 / mode.updateInterval;
        const totalSteps = durationSeconds * stepsPerSecond;

        return {
            mode: this.currentMode,
            duration: durationSeconds,
            targetTPS: mode.targetTPS,
            totalSteps: totalSteps,
            transactionsPerStep: Math.ceil(mode.targetTPS / stepsPerSecond),
            expectedTotal: Math.ceil(mode.targetTPS * durationSeconds)
        };
    }

    /**
     * Reset performance statistics
     */
    resetStats() {
        this.performanceStats = {
            actualTPS: 0,
            targetTPS: this.currentMode ? this.modes[this.currentMode].targetTPS : 0,
            efficiency: 0,
            startTime: Date.now(),
            totalTransactions: 0
        };
    }

    /**
     * Get mode recommendations based on system capabilities
     */
    getModeRecommendations(systemCapabilities) {
        const { cpu, memory, network } = systemCapabilities;

        const recommendations = [];

        if (cpu >= 8 && memory >= 16) {
            recommendations.push('production');
        }
        if (cpu >= 4 && memory >= 8) {
            recommendations.push('staging');
        }
        if (cpu >= 2 && memory >= 4) {
            recommendations.push('development');
        }
        recommendations.push('educational');

        return recommendations.map(mode => ({
            mode,
            ...this.modes[mode]
        }));
    }

    /**
     * Export current mode configuration
     */
    exportModeConfig() {
        return {
            currentMode: this.currentMode,
            modeConfig: this.currentMode ? this.modes[this.currentMode] : null,
            performanceStats: this.getPerformanceStats(),
            timestamp: new Date().toISOString()
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScalabilityModesManager;
}
