/**
 * Graph Visualizer - Real-Time Data Visualization
 * Epic: AV11-192, Task: AV11-199
 * Uses Chart.js for real-time graph rendering
 */

class GraphVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.charts = new Map();
        this.maxDataPoints = 60; // Keep last 60 data points (1 minute at 1 sec intervals)
        this.updateInterval = null;

        // Data buffers for each chart
        this.dataBuffers = {
            tps: { labels: [], data: [] },
            consensus: { labels: [], data: [] },
            apiFeeds: { labels: [], datasets: [] }
        };
    }

    initialize() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Create graph containers
        container.innerHTML = `
            <div class="graphs-grid">
                <div class="graph-card">
                    <h3>System Throughput (TPS)</h3>
                    <canvas id="tpsChart"></canvas>
                </div>
                <div class="graph-card">
                    <h3>Consensus Performance</h3>
                    <canvas id="consensusChart"></canvas>
                </div>
                <div class="graph-card">
                    <h3>API Data Feeds</h3>
                    <canvas id="apiChart"></canvas>
                </div>
            </div>
        `;

        // Initialize charts
        this._initTPSChart();
        this._initConsensusChart();
        this._initAPIChart();
    }

    _initTPSChart() {
        const ctx = document.getElementById('tpsChart');
        if (!ctx) return;

        this.charts.set('tps', new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Transactions Per Second',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        }));
    }

    _initConsensusChart() {
        const ctx = document.getElementById('consensusChart');
        if (!ctx) return;

        this.charts.set('consensus', new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Blocks Validated',
                        data: [],
                        borderColor: '#9C27B0',
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y',
                        pointRadius: 0
                    },
                    {
                        label: 'Consensus Rounds',
                        data: [],
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y',
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        }));
    }

    _initAPIChart() {
        const ctx = document.getElementById('apiChart');
        if (!ctx) return;

        this.charts.set('api', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        }));
    }

    updateTPSData(tps, timestamp) {
        const timeLabel = new Date(timestamp).toLocaleTimeString();

        this.dataBuffers.tps.labels.push(timeLabel);
        this.dataBuffers.tps.data.push(tps);

        // Keep only last N data points
        if (this.dataBuffers.tps.labels.length > this.maxDataPoints) {
            this.dataBuffers.tps.labels.shift();
            this.dataBuffers.tps.data.shift();
        }

        const chart = this.charts.get('tps');
        if (chart) {
            chart.data.labels = this.dataBuffers.tps.labels;
            chart.data.datasets[0].data = this.dataBuffers.tps.data;
            chart.update('none');
        }
    }

    updateConsensusData(blocksValidated, consensusRounds, timestamp) {
        const timeLabel = new Date(timestamp).toLocaleTimeString();

        this.dataBuffers.consensus.labels.push(timeLabel);

        if (!this.dataBuffers.consensus.blocksValidated) {
            this.dataBuffers.consensus.blocksValidated = [];
            this.dataBuffers.consensus.consensusRounds = [];
        }

        this.dataBuffers.consensus.blocksValidated.push(blocksValidated);
        this.dataBuffers.consensus.consensusRounds.push(consensusRounds);

        // Keep only last N data points
        if (this.dataBuffers.consensus.labels.length > this.maxDataPoints) {
            this.dataBuffers.consensus.labels.shift();
            this.dataBuffers.consensus.blocksValidated.shift();
            this.dataBuffers.consensus.consensusRounds.shift();
        }

        const chart = this.charts.get('consensus');
        if (chart) {
            chart.data.labels = this.dataBuffers.consensus.labels;
            chart.data.datasets[0].data = this.dataBuffers.consensus.blocksValidated;
            chart.data.datasets[1].data = this.dataBuffers.consensus.consensusRounds;
            chart.update('none');
        }
    }

    updateAPIData(apiNodes) {
        const chart = this.charts.get('api');
        if (!chart) return;

        const labels = [];
        const datasets = [
            {
                label: 'API Calls',
                data: [],
                backgroundColor: '#2196F3',
                borderColor: '#1976D2',
                borderWidth: 1
            },
            {
                label: 'Data Points',
                data: [],
                backgroundColor: '#4CAF50',
                borderColor: '#388E3C',
                borderWidth: 1
            }
        ];

        apiNodes.forEach(node => {
            const metrics = node.getMetrics ? node.getMetrics() : node.metrics;
            labels.push(node.name.replace(' Feed', '').replace(' Market Data', '').replace(' Social Feed', ''));
            datasets[0].data.push(metrics.apiCalls || 0);
            datasets[1].data.push(metrics.totalDataPoints || 0);
        });

        chart.data.labels = labels;
        chart.data.datasets = datasets;
        chart.update('none');
    }

    startAutoUpdate(nodeManager) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this._collectAndUpdateData(nodeManager);
        }, 1000);
    }

    _collectAndUpdateData(nodeManager) {
        // Collect TPS data
        let totalTPS = 0;
        const channelNodes = Array.from(nodeManager.values()).filter(n => n.type === 'channel');
        channelNodes.forEach(node => {
            const metrics = node.getMetrics ? node.getMetrics() : node.metrics;
            if (metrics && metrics.throughput) {
                totalTPS += metrics.throughput;
            }
        });
        this.updateTPSData(totalTPS, Date.now());

        // Collect consensus data
        let totalBlocks = 0;
        let totalRounds = 0;
        const validatorNodes = Array.from(nodeManager.values()).filter(n => n.type === 'validator');
        validatorNodes.forEach(node => {
            const metrics = node.getMetrics ? node.getMetrics() : node.metrics;
            if (metrics) {
                totalBlocks += metrics.blocksValidated || 0;
                totalRounds += metrics.consensusRounds || 0;
            }
        });
        this.updateConsensusData(totalBlocks, totalRounds, Date.now());

        // Collect API data
        const apiNodes = Array.from(nodeManager.values()).filter(n => n.type === 'api-integration');
        if (apiNodes.length > 0) {
            this.updateAPIData(apiNodes);
        }
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    clear() {
        this.dataBuffers.tps = { labels: [], data: [] };
        this.dataBuffers.consensus = { labels: [], data: [] };

        this.charts.forEach(chart => {
            chart.data.labels = [];
            chart.data.datasets.forEach(dataset => {
                dataset.data = [];
            });
            chart.update();
        });
    }

    destroy() {
        this.stopAutoUpdate();
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphVisualizer;
}
