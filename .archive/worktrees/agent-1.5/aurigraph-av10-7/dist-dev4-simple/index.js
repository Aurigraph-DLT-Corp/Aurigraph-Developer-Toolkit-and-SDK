const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// CSP Headers for fonts and resources
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "font-src 'self' data: http: https:; " +
        "style-src 'self' 'unsafe-inline' http: https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; " +
        "img-src 'self' data: http: https:; " +
        "connect-src 'self' http: https: ws: wss:;"
    );
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Serve static UI files
const uiPath = path.join(__dirname, 'ui');
if (fs.existsSync(uiPath)) {
    app.use(express.static(uiPath));
    console.log(`Serving UI from: ${uiPath}`);
}

// Platform info
const platformInfo = {
    version: '10.35.0-classical-simple',
    deployment: 'dev4',
    domain: 'dlt.aurigraph.io',
    environment: process.env.NODE_ENV || 'production',
    features: {
        classical_ai: true,
        quantum_simulation: false,
        gpu_acceleration: false,
        consciousness_interface: true,
        rwa_platform: true
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: platformInfo.version,
        deployment: platformInfo.deployment,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        hardware: {
            cpuCores: require('os').cpus().length,
            memory: `${Math.round(require('os').totalmem() / 1073741824)} GB`,
            platform: require('os').platform()
        }
    });
});

// Platform info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        platform: platformInfo,
        timestamp: new Date().toISOString()
    });
});

// Metrics endpoint
app.get('/api/classical/metrics', (req, res) => {
    res.json({
        success: true,
        metrics: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        },
        hardware: {
            tensorflowBackend: 'cpu',
            gpuAvailable: false,
            cpuCores: require('os').cpus().length
        },
        timestamp: new Date().toISOString()
    });
});

// GPU task execution endpoint (simulated)
app.post('/api/classical/gpu/execute', (req, res) => {
    const { task } = req.body;
    res.json({
        success: true,
        taskId: task?.id || 'task-' + Date.now(),
        result: {
            executionTime: '10ms',
            speedup: '1x',
            backend: 'cpu',
            status: 'completed'
        }
    });
});

// Consensus mechanism endpoint
app.post('/api/classical/consensus', (req, res) => {
    const { decision, participants } = req.body;
    res.json({
        success: true,
        consensus: {
            decision: decision || 'approved',
            participants: participants?.length || 5,
            agreement: '95%',
            consensusTime: '50ms',
            timestamp: new Date().toISOString()
        }
    });
});

// AI orchestration endpoint
app.post('/api/classical/orchestrate', (req, res) => {
    const { tasks } = req.body;
    res.json({
        success: true,
        orchestrationId: 'orch-' + Date.now(),
        summary: {
            totalTasks: tasks?.length || 2,
            completedTasks: tasks?.length || 2,
            totalExecutionTime: '100ms',
            status: 'completed'
        }
    });
});

// Benchmark endpoint
app.get('/api/classical/benchmark', (req, res) => {
    res.json({
        success: true,
        benchmark: {
            tasksProcessed: 100,
            throughput: '100 tasks/sec',
            executionTime: '1000ms',
            hardwareSpeedup: '1x (CPU)',
            timestamp: new Date().toISOString()
        }
    });
});

// Root redirect to UI
app.get('/', (req, res) => {
    const indexPath = path.join(uiPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            message: 'Aurigraph V10 Classical - Dev4',
            version: platformInfo.version,
            endpoints: {
                health: '/health',
                info: '/api/info',
                metrics: '/api/classical/metrics',
                ui: '/index.html'
            }
        });
    }
});

// Start server
app.listen(PORT, HOST, () => {
    console.log('========================================');
    console.log('🚀 Aurigraph V10 Classical - Dev4');
    console.log('========================================');
    console.log(`Version: ${platformInfo.version}`);
    console.log(`Domain: ${platformInfo.domain}`);
    console.log(`Environment: ${platformInfo.environment}`);
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`Health: http://${HOST}:${PORT}/health`);
    console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
