/**
 * Enhanced Panel UI Components
 * Epic: AV11-192, Task: AV11-200
 * Provides beautiful responsive panels with sparklines and interactive controls
 */

class PanelUIComponents {
    constructor() {
        this.sparklineData = new Map(); // Store sparkline history per node
        this.maxSparklinePoints = 20;   // Keep last 20 data points for sparklines
    }

    /**
     * Render enhanced node panel with sparklines and interactive controls
     */
    renderEnhancedPanel(node, container) {
        const state = node.getState();
        const metrics = node.getMetrics ? node.getMetrics() : node.metrics;
        const nodeId = state.id || node.id;

        // Initialize sparkline data if not exists
        if (!this.sparklineData.has(nodeId)) {
            this.sparklineData.set(nodeId, {
                throughput: [],
                efficiency: [],
                blocks: [],
                transactions: [],
                apiCalls: []
            });
        }

        const sparklines = this.sparklineData.get(nodeId);

        // Update sparkline data based on node type
        this._updateSparklineData(state.type, metrics, sparklines);

        // Create panel element
        const panel = document.createElement('div');
        panel.className = 'enhanced-node-panel';
        panel.setAttribute('data-node-id', nodeId);
        panel.setAttribute('data-node-type', state.type);

        // Get status info
        const statusInfo = this._getStatusInfo(state);

        // Build panel HTML
        panel.innerHTML = `
            ${this._renderPanelHeader(state, statusInfo)}
            ${this._renderStatusSection(statusInfo)}
            ${this._renderMetricsGrid(state.type, metrics, sparklines)}
            ${this._renderControlButtons(nodeId, state.type)}
        `;

        container.appendChild(panel);
    }

    /**
     * Render panel header with node info and badge
     */
    _renderPanelHeader(state, statusInfo) {
        return `
            <div class="panel-header">
                <div class="panel-header-left">
                    <div class="node-icon node-icon-${state.type}">
                        ${this._getNodeIcon(state.type)}
                    </div>
                    <div>
                        <div class="panel-title">${state.name}</div>
                        <div class="panel-subtitle">${this._getSubtitle(state)}</div>
                    </div>
                </div>
                <div class="panel-badge badge-${state.type}">
                    ${state.type.replace('-', ' ')}
                </div>
            </div>
        `;
    }

    /**
     * Render status section with enhanced status indicator
     */
    _renderStatusSection(statusInfo) {
        return `
            <div class="panel-status">
                <div class="status-indicator-enhanced ${statusInfo.class}">
                    <div class="status-pulse"></div>
                    <div class="status-dot"></div>
                </div>
                <div class="status-text">
                    <div class="status-label">Status</div>
                    <div class="status-value">${statusInfo.text}</div>
                </div>
            </div>
        `;
    }

    /**
     * Render metrics grid based on node type
     */
    _renderMetricsGrid(nodeType, metrics, sparklines) {
        let metricsHTML = '';

        if (nodeType === 'channel') {
            metricsHTML = `
                ${this._renderMetricCard('Throughput', `${metrics.throughput || 0} msg/s`, 'throughput', sparklines.throughput, '#2196F3')}
                ${this._renderMetricCard('Connections', `${metrics.activeConnections || 0}`, 'connections', null, '#4CAF50')}
                ${this._renderMetricCard('Messages Sent', (metrics.totalMessagesSent || 0).toLocaleString(), 'messages', null, '#9C27B0')}
                ${this._renderMetricCard('Efficiency', `${metrics.routingEfficiency || 100}%`, 'efficiency', sparklines.efficiency, '#FF9800', true)}
            `;
        } else if (nodeType === 'validator') {
            metricsHTML = `
                ${this._renderMetricCard('Blocks Validated', (metrics.blocksValidated || 0).toLocaleString(), 'blocks', sparklines.blocks, '#9C27B0')}
                ${this._renderMetricCard('Current Term', `${metrics.currentTerm || 0}`, 'term', null, '#2196F3')}
                ${this._renderMetricCard('Votes Received', `${metrics.votesReceived || 0}`, 'votes', null, '#FF9800')}
                ${this._renderMetricCard('Participation', `${metrics.participationRate || 0}%`, 'participation', null, '#4CAF50', true)}
            `;
        } else if (nodeType === 'business') {
            metricsHTML = `
                ${this._renderMetricCard('Transactions', (metrics.transactionsProcessed || 0).toLocaleString(), 'transactions', sparklines.transactions, '#FF9800')}
                ${this._renderMetricCard('Queue Depth', `${metrics.queueDepth || 0}`, 'queue', null, '#2196F3')}
                ${this._renderMetricCard('Success Rate', `${metrics.successRate || 100}%`, 'success', null, '#4CAF50', true)}
                ${this._renderMetricCard('TPS', `${metrics.tps || 0}`, 'tps', null, '#9C27B0')}
            `;
        } else if (nodeType === 'api-integration') {
            metricsHTML = `
                ${this._renderMetricCard('Feed Rate', `${metrics.feedRate || 0} dp/s`, 'feedrate', null, '#00BCD4')}
                ${this._renderMetricCard('API Calls', (metrics.apiCalls || 0).toLocaleString(), 'apicalls', sparklines.apiCalls, '#2196F3')}
                ${this._renderMetricCard('Success Rate', `${metrics.successRate || 100}%`, 'success', null, '#4CAF50', true)}
                ${this._renderMetricCard('Latency', `${metrics.latency || 0}ms`, 'latency', null, '#FF9800')}
            `;
        }

        return `<div class="panel-metrics-grid">${metricsHTML}</div>`;
    }

    /**
     * Render individual metric card with optional sparkline
     */
    _renderMetricCard(label, value, key, sparklineData = null, color = '#2196F3', isPercentage = false) {
        const sparklineHTML = sparklineData && sparklineData.length > 0
            ? `<div class="metric-sparkline">${this._renderSparkline(sparklineData, color)}</div>`
            : '';

        const progressBarHTML = isPercentage && value !== 'N/A'
            ? `<div class="metric-progress-bar">
                   <div class="metric-progress-fill" style="width: ${value}; background: ${color}"></div>
               </div>`
            : '';

        return `
            <div class="metric-card-enhanced" data-metric="${key}">
                <div class="metric-label-enhanced">${label}</div>
                <div class="metric-value-enhanced" style="color: ${color}">${value}</div>
                ${progressBarHTML}
                ${sparklineHTML}
            </div>
        `;
    }

    /**
     * Render SVG sparkline chart
     */
    _renderSparkline(data, color) {
        if (!data || data.length < 2) return '';

        const width = 100;
        const height = 30;
        const padding = 2;

        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;

        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height - ((value - min) / range) * (height - padding * 2) - padding;
            return `${x},${y}`;
        }).join(' ');

        return `
            <svg width="${width}" height="${height}" class="sparkline-svg">
                <polyline
                    fill="none"
                    stroke="${color}"
                    stroke-width="2"
                    points="${points}"
                />
            </svg>
        `;
    }

    /**
     * Render control buttons for panel
     */
    _renderControlButtons(nodeId, nodeType) {
        return `
            <div class="panel-controls">
                <button class="panel-btn panel-btn-details" onclick="window.viewNodeDetails('${nodeId}')">
                    <span class="btn-icon">ℹ️</span>
                    Details
                </button>
                <button class="panel-btn panel-btn-pause" onclick="window.toggleNodePause('${nodeId}')">
                    <span class="btn-icon">⏸️</span>
                    Pause
                </button>
            </div>
        `;
    }

    /**
     * Update sparkline data for a node
     */
    _updateSparklineData(nodeType, metrics, sparklines) {
        if (nodeType === 'channel') {
            this._addSparklinePoint(sparklines.throughput, metrics.throughput || 0);
            this._addSparklinePoint(sparklines.efficiency, metrics.routingEfficiency || 100);
        } else if (nodeType === 'validator') {
            this._addSparklinePoint(sparklines.blocks, metrics.blocksValidated || 0);
        } else if (nodeType === 'business') {
            this._addSparklinePoint(sparklines.transactions, metrics.transactionsProcessed || 0);
        } else if (nodeType === 'api-integration') {
            this._addSparklinePoint(sparklines.apiCalls, metrics.apiCalls || 0);
        }
    }

    /**
     * Add data point to sparkline array
     */
    _addSparklinePoint(sparklineArray, value) {
        sparklineArray.push(value);
        if (sparklineArray.length > this.maxSparklinePoints) {
            sparklineArray.shift();
        }
    }

    /**
     * Get status information for a node
     */
    _getStatusInfo(state) {
        let statusClass = 'status-idle';
        let statusText = state.state || state.consensusState || 'IDLE';

        if (state.type === 'channel') {
            statusClass = `status-${(state.state || 'idle').toLowerCase()}`;
        } else if (state.type === 'validator') {
            statusClass = `status-${(state.consensusState || 'follower').toLowerCase()}`;
        } else if (state.type === 'business') {
            statusClass = state.state === 'PROCESSING' ? 'status-processing' : 'status-idle';
        } else if (state.type === 'api-integration') {
            statusClass = `status-${(state.state || 'disconnected').toLowerCase()}`;
        }

        return { class: statusClass, text: statusText.toUpperCase() };
    }

    /**
     * Get icon for node type
     */
    _getNodeIcon(nodeType) {
        const icons = {
            'channel': '🔀',
            'validator': '✅',
            'business': '💼',
            'api-integration': '🔌'
        };
        return icons[nodeType] || '📦';
    }

    /**
     * Get subtitle for node
     */
    _getSubtitle(state) {
        if (state.type === 'api-integration') {
            return `Provider: ${state.provider || 'N/A'}`;
        }
        return `Node ID: ${state.id}`;
    }

    /**
     * Clear all sparkline data
     */
    clearSparklines() {
        this.sparklineData.clear();
    }
}

// Global functions for panel controls
window.viewNodeDetails = (nodeId) => {
    console.log('View details for node:', nodeId);
    alert(`Node Details: ${nodeId}\n\nFull node details view coming soon!`);
};

window.toggleNodePause = (nodeId) => {
    console.log('Toggle pause for node:', nodeId);
    alert(`Pause/Resume functionality for ${nodeId} coming soon!`);
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelUIComponents;
}
