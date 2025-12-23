/**
 * Configuration Manager - Dynamic Node Configuration System
 * Epic: AV11-192, Task: AV11-201
 * Handles add/remove nodes, save/load configs, export/import
 */

class ConfigurationManager {
    constructor() {
        this.storageKey = 'aurigraph-demo-config';
        this.configVersion = '1.0';
    }

    /**
     * Get current configuration from node manager
     */
    getCurrentConfiguration(nodeManager) {
        const config = {
            version: this.configVersion,
            timestamp: new Date().toISOString(),
            nodes: []
        };

        nodeManager.forEach(node => {
            const state = node.getState();
            const nodeConfig = {
                id: state.id,
                type: state.type,
                name: state.name,
                enabled: true,
                config: this._extractNodeConfig(node, state.type)
            };
            config.nodes.push(nodeConfig);
        });

        return config;
    }

    /**
     * Extract configuration from a node based on type
     */
    _extractNodeConfig(node, type) {
        const baseConfig = {
            updateInterval: 1000
        };

        if (type === 'channel') {
            return {
                ...baseConfig,
                maxConnections: node.maxConnections || 50,
                routingAlgorithm: node.routingAlgorithm || 'round-robin',
                bufferSize: 5000,
                timeout: 30000
            };
        } else if (type === 'validator') {
            return {
                ...baseConfig,
                stakeAmount: 10000,
                votingPower: 1,
                consensusTimeout: 5000,
                maxBlockSize: 500000
            };
        } else if (type === 'business') {
            return {
                ...baseConfig,
                processingCapacity: 5000,
                queueSize: 10000,
                batchSize: 50,
                parallelThreads: 8
            };
        } else if (type === 'api-integration') {
            const state = node.getState();
            return {
                ...baseConfig,
                provider: state.provider || 'generic',
                apiKey: node.config?.apiKey || 'DEMO_API_KEY',
                apiSecret: node.config?.apiSecret || '',
                endpoint: node.config?.endpoint || '',
                updateFrequency: node.config?.updateFrequency || 1000,
                rateLimit: node.config?.rateLimit || 100,
                retryAttempts: 3,
                locations: node.config?.locations || [],
                topics: node.config?.topics || []
            };
        }

        return baseConfig;
    }

    /**
     * Save configuration to localStorage
     */
    saveConfiguration(nodeManager) {
        const config = this.getCurrentConfiguration(nodeManager);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(config));
            return { success: true, message: 'Configuration saved successfully' };
        } catch (error) {
            return { success: false, message: `Failed to save: ${error.message}` };
        }
    }

    /**
     * Load configuration from localStorage
     */
    loadConfiguration() {
        try {
            const configStr = localStorage.getItem(this.storageKey);
            if (!configStr) {
                return { success: false, message: 'No saved configuration found' };
            }
            const config = JSON.parse(configStr);
            return { success: true, config: config };
        } catch (error) {
            return { success: false, message: `Failed to load: ${error.message}` };
        }
    }

    /**
     * Export configuration as JSON file
     */
    exportConfiguration(nodeManager) {
        const config = this.getCurrentConfiguration(nodeManager);
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aurigraph-config-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, message: 'Configuration exported successfully' };
    }

    /**
     * Import configuration from JSON file
     */
    importConfiguration(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);

                    // Validate configuration
                    if (!config.nodes || !Array.isArray(config.nodes)) {
                        throw new Error('Invalid configuration format');
                    }

                    resolve({ success: true, config: config });
                } catch (error) {
                    reject({ success: false, message: `Import failed: ${error.message}` });
                }
            };

            reader.onerror = () => {
                reject({ success: false, message: 'Failed to read file' });
            };

            reader.readAsText(file);
        });
    }

    /**
     * Apply configuration to create nodes
     */
    applyConfiguration(config, nodeClasses) {
        const nodes = new Map();

        config.nodes.forEach(nodeConfig => {
            let node;

            switch(nodeConfig.type) {
                case 'channel':
                    node = new nodeClasses.ChannelNode(nodeConfig);
                    break;
                case 'validator':
                    node = new nodeClasses.ValidatorNode(nodeConfig);
                    break;
                case 'business':
                    node = new nodeClasses.BusinessNode(nodeConfig);
                    break;
                case 'api-integration':
                    node = new nodeClasses.APIIntegrationNode(nodeConfig);
                    break;
            }

            if (node) {
                nodes.set(nodeConfig.id, node);
            }
        });

        return nodes;
    }

    /**
     * Create a new node configuration template
     */
    createNodeTemplate(type) {
        const baseId = `node-${type}-${Date.now().toString().slice(-6)}`;
        const baseName = this._getNodeTypeName(type);

        const templates = {
            'channel': {
                id: baseId,
                type: 'channel',
                name: `${baseName} ${Math.floor(Math.random() * 1000)}`,
                enabled: true,
                config: {
                    maxConnections: 50,
                    routingAlgorithm: 'round-robin',
                    bufferSize: 5000,
                    timeout: 30000
                }
            },
            'validator': {
                id: baseId,
                type: 'validator',
                name: `${baseName} ${Math.floor(Math.random() * 1000)}`,
                enabled: true,
                config: {
                    stakeAmount: 10000,
                    votingPower: 1,
                    consensusTimeout: 5000,
                    maxBlockSize: 500000
                }
            },
            'business': {
                id: baseId,
                type: 'business',
                name: `${baseName} ${Math.floor(Math.random() * 1000)}`,
                enabled: true,
                config: {
                    processingCapacity: 5000,
                    queueSize: 10000,
                    batchSize: 50,
                    parallelThreads: 8
                }
            },
            'api-integration': {
                id: baseId,
                type: 'api-integration',
                name: 'Custom API Feed',
                enabled: true,
                config: {
                    provider: 'generic',
                    apiKey: 'DEMO_API_KEY',
                    apiSecret: '',
                    endpoint: 'https://api.example.com',
                    updateFrequency: 5000,
                    rateLimit: 100,
                    retryAttempts: 3
                }
            }
        };

        return templates[type] || null;
    }

    /**
     * Get human-readable node type name
     */
    _getNodeTypeName(type) {
        const names = {
            'channel': 'Channel Node',
            'validator': 'Validator Node',
            'business': 'Business Node',
            'api-integration': 'API Integration Node'
        };
        return names[type] || 'Unknown Node';
    }

    /**
     * Validate node configuration
     */
    validateNodeConfig(nodeConfig) {
        const errors = [];

        if (!nodeConfig.id || nodeConfig.id.trim() === '') {
            errors.push('Node ID is required');
        }

        if (!nodeConfig.type || !['channel', 'validator', 'business', 'api-integration'].includes(nodeConfig.type)) {
            errors.push('Invalid node type');
        }

        if (!nodeConfig.name || nodeConfig.name.trim() === '') {
            errors.push('Node name is required');
        }

        if (!nodeConfig.config || typeof nodeConfig.config !== 'object') {
            errors.push('Node configuration is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Clear saved configuration
     */
    clearSavedConfiguration() {
        try {
            localStorage.removeItem(this.storageKey);
            return { success: true, message: 'Saved configuration cleared' };
        } catch (error) {
            return { success: false, message: `Failed to clear: ${error.message}` };
        }
    }

    /**
     * Get list of all saved configurations (for future multi-config support)
     */
    listSavedConfigurations() {
        const configs = [];
        try {
            const config = this.loadConfiguration();
            if (config.success) {
                configs.push({
                    name: 'Default Configuration',
                    timestamp: config.config.timestamp,
                    nodeCount: config.config.nodes.length
                });
            }
        } catch (error) {
            console.error('Failed to list configurations:', error);
        }
        return configs;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigurationManager;
}
