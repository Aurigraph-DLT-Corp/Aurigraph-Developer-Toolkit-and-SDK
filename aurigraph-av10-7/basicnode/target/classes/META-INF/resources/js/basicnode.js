/**
 * Aurigraph Basic Node Client-Side JavaScript
 */

class BasicNodeDashboard {
    constructor() {
        this.updateInterval = null;
        this.logEntries = [];
        this.init();
    }

    init() {
        console.log('🚀 Initializing Basic Node Dashboard');
        this.startRealTimeUpdates();
        this.loadSettings();
        this.addLogEntry('🚀 Dashboard initialized successfully');
    }

    // Real-time updates
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateNodeStatus();
            this.updateMetrics();
        }, 5000);

        // Initial update
        this.updateNodeStatus();
        this.updateMetrics();
    }

    async updateNodeStatus() {
        try {
            const response = await fetch('/api/node/status');
            if (response.ok) {
                const status = await response.json();
                this.updateStatusDisplay(status);
            } else {
                this.setConnectionStatus('disconnected', 'API Error');
            }
        } catch (error) {
            console.error('Failed to update node status:', error);
            this.setConnectionStatus('disconnected', 'Connection Failed');
        }
    }

    async updateMetrics() {
        try {
            const response = await fetch('/api/node/metrics');
            if (response.ok) {
                const metrics = await response.json();
                this.updateMetricsDisplay(metrics);
            }
        } catch (error) {
            console.error('Failed to update metrics:', error);
        }
    }

    updateStatusDisplay(status) {
        // Update main status
        document.getElementById('nodeStatusText').textContent = status.status;
        document.getElementById('nodeUptime').textContent = this.formatUptime(status.uptime);
        
        // Update platform connection
        const platformText = status.platformConnected ? 
            `✅ Connected (${status.platformVersion || 'AV11-18'})` : 
            '❌ Disconnected';
        document.getElementById('platformConnection').textContent = platformText;
        
        // Update connection indicator
        if (status.platformConnected && status.status === 'RUNNING') {
            this.setConnectionStatus('connected', 'Connected');
        } else if (status.status === 'RUNNING') {
            this.setConnectionStatus('connecting', 'Running (Platform Disconnected)');
        } else {
            this.setConnectionStatus('disconnected', status.status);
        }
        
        // Update transaction count
        document.getElementById('transactionCount').textContent = 
            status.transactionsProcessed || 0;
        
        // Update alerts
        this.updateAlerts(status.alerts || []);
        
        // Add log entry for status changes
        if (this.lastStatus !== status.status) {
            this.addLogEntry(`📊 Status changed to: ${status.status}`);
            this.lastStatus = status.status;
        }
    }

    updateMetricsDisplay(metrics) {
        // Memory usage
        const memoryMB = Math.round(metrics.memoryUsageMB * 10) / 10;
        const memoryPercent = (metrics.memoryUsageMB / 512) * 100;
        
        document.getElementById('memoryUsage').textContent = `${memoryMB} MB`;
        document.getElementById('memoryProgress').style.width = `${Math.min(memoryPercent, 100)}%`;
        
        // Detailed memory
        document.getElementById('detailedMemory').textContent = `${memoryMB} MB`;
        document.getElementById('detailedMemoryProgress').style.width = `${Math.min(memoryPercent, 100)}%`;
        
        // CPU usage
        const cpuPercent = Math.round(metrics.cpuUsagePercent * 10) / 10;
        const cpuBarPercent = (metrics.cpuUsagePercent / 200) * 100;
        
        document.getElementById('cpuUsage').textContent = `${cpuPercent}%`;
        document.getElementById('cpuProgress').style.width = `${Math.min(cpuBarPercent, 100)}%`;
        
        // Detailed CPU
        document.getElementById('detailedCpu').textContent = `${cpuPercent}%`;
        document.getElementById('detailedCpuProgress').style.width = `${Math.min(cpuBarPercent, 100)}%`;
        
        // Performance grade
        const gradeElement = document.getElementById('performanceGrade');
        gradeElement.textContent = metrics.performanceGrade || 'EXCELLENT';
        gradeElement.className = `value grade ${metrics.performanceGrade || 'EXCELLENT'}`;
        
        // Average response time
        document.getElementById('avgResponse').textContent = 
            `${Math.round(metrics.avgResponseTime || 0)}ms`;
        
        // Log performance warnings
        if (memoryMB > 400) {
            this.addLogEntry(`⚠️ High memory usage: ${memoryMB}MB`);
        }
        if (cpuPercent > 150) {
            this.addLogEntry(`⚠️ High CPU usage: ${cpuPercent}%`);
        }
    }

    setConnectionStatus(status, text) {
        const indicator = document.getElementById('nodeStatus');
        const dot = indicator.querySelector('.status-dot');
        const textSpan = indicator.querySelector('.status-text');
        
        dot.className = `status-dot ${status}`;
        textSpan.textContent = text;
    }

    updateAlerts(alerts) {
        const alertsList = document.getElementById('alertsList');
        
        if (alerts.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">✅ No alerts - All systems operational</div>';
        } else {
            alertsList.innerHTML = alerts.map(alert => 
                `<div class="alert-item">⚠️ ${alert}</div>`
            ).join('');
        }
    }

    addLogEntry(message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${message}`;
        
        this.logEntries.unshift(entry);
        if (this.logEntries.length > 50) {
            this.logEntries.pop();
        }
        
        const logContainer = document.getElementById('activityLog');
        if (logContainer) {
            logContainer.innerHTML = this.logEntries.map(entry => 
                `<div class="log-entry">${entry}</div>`
            ).join('');
        }
    }

    // Settings management
    async loadSettings() {
        try {
            const response = await fetch('/api/node/config');
            if (response.ok) {
                const config = await response.json();
                
                document.getElementById('nodeName').value = config.nodeName || '';
                document.getElementById('networkMode').value = config.networkMode || 'mainnet';
                document.getElementById('platformUrl').value = config.platformUrl || 'http://localhost:3018';
                document.getElementById('autoUpdates').checked = config.autoUpdates !== false;
                document.getElementById('enableMonitoring').checked = config.enableMonitoring !== false;
                
                this.addLogEntry('⚙️ Settings loaded from server');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.addLogEntry('❌ Failed to load settings');
        }
    }

    async saveSettings() {
        try {
            const config = {
                nodeName: document.getElementById('nodeName').value,
                networkMode: document.getElementById('networkMode').value,
                platformUrl: document.getElementById('platformUrl').value,
                autoUpdates: document.getElementById('autoUpdates').checked,
                enableMonitoring: document.getElementById('enableMonitoring').checked
            };

            const response = await fetch('/api/node/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.addLogEntry('✅ Settings saved successfully');
                
                // Show success message
                this.showMessage('Settings saved successfully!', 'success');
            } else {
                const error = await response.json();
                this.addLogEntry('❌ Failed to save settings: ' + error.message);
                this.showMessage('Failed to save settings: ' + error.message, 'error');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.addLogEntry('❌ Settings save error: ' + error.message);
            this.showMessage('Error saving settings', 'error');
        }
    }

    // Utility functions
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    showMessage(message, type) {
        // Create and show temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#4CAF50' : '#F44336'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Section navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Mark nav button as active
    event.target.classList.add('active');
}

// Settings functions (global scope for HTML onclick)
function saveSettings() {
    dashboard.saveSettings();
}

function loadSettings() {
    dashboard.loadSettings();
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new BasicNodeDashboard();
});

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
    if (dashboard) {
        dashboard.destroy();
    }
});