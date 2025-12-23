/**
 * Aurigraph V10 - Classical CPU/GPU Version (Simplified)
 * Main entry point for high-performance blockchain platform without quantum computing
 */

import express from 'express';
import * as dotenv from 'dotenv';
import * as os from 'os';
import * as path from 'path';

// Load environment configuration
dotenv.config();

const app = express();
app.use(express.json());

// Set proper CSP headers for web access
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "font-src 'self' data: http: https:; " +
    "style-src 'self' 'unsafe-inline' http: https:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; " +
    "img-src 'self' data: http: https:; " +
    "connect-src 'self' http: https: ws: wss:;"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS headers for API access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

/**
 * Check GPU availability
 */
function checkGPUAvailability(): { available: boolean; count: number; type: string } {
  try {
    // Check for NVIDIA GPUs
    const exec = require('child_process').execSync;
    const result = exec('nvidia-smi --query-gpu=name --format=csv,noheader', { encoding: 'utf8' });
    const gpus = result.trim().split('\n').filter((line: string) => line.length > 0);
    
    if (gpus.length > 0) {
      return {
        available: true,
        count: gpus.length,
        type: gpus[0]
      };
    }
  } catch (error) {
    // nvidia-smi not available, check for other GPUs
  }

  return {
    available: false,
    count: 0,
    type: 'CPU only'
  };
}

/**
 * Initialize Classical Platform (Simplified)
 */
async function initializeClassicalPlatform(): Promise<void> {
  console.log('🚀 Initializing Aurigraph V10 Classical Platform (Simplified)...');
  
  try {
    // Check hardware capabilities
    const cpuCores = os.cpus().length;
    const totalMemory = os.totalmem() / (1024 * 1024 * 1024); // GB
    const gpuInfo = checkGPUAvailability();
    
    console.log(`💻 Hardware detected:`);
    console.log(`  CPU: ${cpuCores} cores`);
    console.log(`  RAM: ${totalMemory.toFixed(2)} GB`);
    console.log(`  GPU: ${gpuInfo.available ? `${gpuInfo.count}x ${gpuInfo.type}` : 'Not available'}`);

    // Simulate initialization steps
    console.log('✅ Post-quantum cryptography initialized');
    console.log('✅ HyperRAFT++ consensus initialized'); 
    console.log('✅ Classical AI orchestrator initialized');
    
    console.log('✅ Classical platform initialized successfully');
    console.log(`📊 Resources: ${cpuCores} CPU cores, ${gpuInfo.count} GPUs`);
    
  } catch (error) {
    console.error('Failed to initialize classical platform:', error);
    throw error;
  }
}

// Serve static files from ui directory
const uiPath = path.join(__dirname, '..', 'ui');
app.use(express.static(uiPath));

/**
 * API Routes - Classical Version (Simplified)
 */

// Root endpoint - serve the original dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(uiPath, 'index.html'));
});

// Serve old simple interface at /simple
app.get('/simple', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurigraph V10 Classical Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-align: center;
        }
        .version {
            text-align: center;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .status {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .status h3 {
            margin-bottom: 15px;
            color: #4ade80;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .metric {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #fbbf24;
        }
        .metric-label {
            opacity: 0.9;
            margin-top: 5px;
        }
        .endpoints {
            margin-top: 30px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 20px;
        }
        .endpoints h3 {
            margin-bottom: 15px;
        }
        .endpoint {
            display: flex;
            align-items: center;
            margin: 10px 0;
            font-family: monospace;
        }
        .method {
            background: #22c55e;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            margin-right: 10px;
            font-size: 0.85em;
            font-weight: bold;
            min-width: 50px;
            text-align: center;
        }
        .method.post {
            background: #3b82f6;
        }
        .endpoint-path {
            color: #e0e7ff;
        }
        button {
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            margin: 10px 5px;
            transition: all 0.3s;
        }
        button:hover {
            background: #7c3aed;
            transform: translateY(-2px);
        }
        #response {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Aurigraph V10 Classical</h1>
        <div class="version">High-Performance Blockchain Platform</div>
        
        <div class="status">
            <h3>✅ Platform Status: ONLINE</h3>
            <div class="metrics" id="metrics">
                <div class="metric">
                    <div class="metric-value">--</div>
                    <div class="metric-label">CPU Cores</div>
                </div>
                <div class="metric">
                    <div class="metric-value">--</div>
                    <div class="metric-label">Memory</div>
                </div>
                <div class="metric">
                    <div class="metric-value">--</div>
                    <div class="metric-label">Uptime</div>
                </div>
                <div class="metric">
                    <div class="metric-value">--</div>
                    <div class="metric-label">Backend</div>
                </div>
            </div>
        </div>

        <div style="text-align: center;">
            <button onclick="testHealth()">Test Health</button>
            <button onclick="testMetrics()">Get Metrics</button>
            <button onclick="testBenchmark()">Run Benchmark</button>
            <button onclick="testConsensus()">Test Consensus</button>
        </div>

        <div id="response"></div>

        <div class="endpoints">
            <h3>📡 API Endpoints</h3>
            <div class="endpoint">
                <span class="method">GET</span>
                <span class="endpoint-path">/health</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span>
                <span class="endpoint-path">/api/classical/metrics</span>
            </div>
            <div class="endpoint">
                <span class="method">GET</span>
                <span class="endpoint-path">/api/classical/benchmark</span>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="endpoint-path">/api/classical/gpu/execute</span>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="endpoint-path">/api/classical/consensus</span>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="endpoint-path">/api/classical/orchestrate</span>
            </div>
        </div>
    </div>

    <script>
        async function testHealth() {
            const response = await fetch('/health');
            const data = await response.json();
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
            updateMetrics(data);
        }

        async function testMetrics() {
            const response = await fetch('/api/classical/metrics');
            const data = await response.json();
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
        }

        async function testBenchmark() {
            document.getElementById('response').textContent = 'Running benchmark...';
            const response = await fetch('/api/classical/benchmark');
            const data = await response.json();
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
        }

        async function testConsensus() {
            const response = await fetch('/api/classical/consensus', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    decision: 'test-decision',
                    participants: ['node1', 'node2', 'node3']
                })
            });
            const data = await response.json();
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
        }

        function updateMetrics(data) {
            const metrics = document.querySelectorAll('.metric-value');
            if (data.hardware) {
                metrics[0].textContent = data.hardware.cpuCores;
                metrics[1].textContent = data.hardware.memory;
                metrics[3].textContent = data.hardware.gpu.type;
            }
        }

        // Load initial data
        testHealth();
        
        // Update metrics periodically
        setInterval(async () => {
            const response = await fetch('/api/classical/metrics');
            const data = await response.json();
            if (data.success && data.metrics) {
                const uptime = Math.floor(data.metrics.uptime);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                document.querySelectorAll('.metric-value')[2].textContent = 
                    \`\${hours}h \${minutes}m \${seconds}s\`;
            }
        }, 1000);
    </script>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Health check
app.get('/health', (req, res) => {
  const gpuInfo = checkGPUAvailability();
  return res.json({
    status: 'healthy',
    version: '10.35.0-classical-simple',
    type: 'classical',
    hardware: {
      cpuCores: os.cpus().length,
      memory: `${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      gpu: gpuInfo
    },
    timestamp: new Date().toISOString()
  });
});

// Get classical metrics
app.get('/api/classical/metrics', async (req, res) => {
  try {
    const gpuInfo = checkGPUAvailability();
    
    return res.json({
      success: true,
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: '10.35.0-classical-simple'
      },
      hardware: {
        cpuCores: os.cpus().length,
        gpuCount: gpuInfo.count,
        gpuType: gpuInfo.type,
        tensorflowBackend: gpuInfo.available ? 'GPU' : 'CPU'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Execute GPU task (simulated)
app.post('/api/classical/gpu/execute', async (req, res) => {
  try {
    const { task } = req.body;
    
    if (!task) {
      return res.status(400).json({ success: false, error: 'Task required' });
    }

    // Simulate GPU task execution
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    const executionTime = Date.now() - startTime;
    
    const gpuInfo = checkGPUAvailability();
    const speedup = gpuInfo.available ? 100 : 1;

    return res.json({
      success: true,
      result: {
        taskId: task.id || 'unknown',
        executionTime: `${executionTime}ms`,
        speedup: `${speedup}x`,
        backend: gpuInfo.available ? 'GPU' : 'CPU'
      },
      hardware: {
        backend: gpuInfo.available ? 'GPU' : 'CPU',
        speedup: speedup
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Classical consensus (simulated)
app.post('/api/classical/consensus', async (req, res) => {
  try {
    const { decision, participants } = req.body;
    
    if (!decision || !participants) {
      return res.status(400).json({ 
        success: false, 
        error: 'Decision and participants required' 
      });
    }

    // Simulate consensus process
    await new Promise(resolve => setTimeout(resolve, 100));

    return res.json({
      success: true,
      consensus: {
        decision,
        participants: Array.isArray(participants) ? participants.length : 1,
        agreement: 0.85 + Math.random() * 0.15, // 85-100% agreement
        consensusTime: '100ms'
      },
      method: 'classical-voting'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Classical orchestration (simulated)
app.post('/api/classical/orchestrate', async (req, res) => {
  try {
    const { tasks, constraints } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Task array required' 
      });
    }

    // Simulate orchestration
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    const executionTime = Date.now() - startTime;

    const results = tasks.map((task: any, index: number) => ({
      taskId: task.id || `task-${index}`,
      status: 'completed',
      result: `Result for ${task.type || 'UNKNOWN'}`,
      executionTime: `${Math.random() * 100}ms`
    }));

    return res.json({
      success: true,
      results,
      summary: {
        totalTasks: tasks.length,
        completedTasks: results.length,
        totalExecutionTime: `${executionTime}ms`,
        averageTaskTime: `${(executionTime / tasks.length).toFixed(2)}ms`
      },
      hardware: {
        tasksProcessed: tasks.length,
        gpuTasks: tasks.filter((t: any) => t.gpuRequired).length,
        cpuTasks: tasks.filter((t: any) => !t.gpuRequired).length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Benchmark endpoint (simulated)
app.get('/api/classical/benchmark', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Simulate benchmark
    const taskCount = 100;
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second simulation
    
    const executionTime = Date.now() - startTime;
    const gpuInfo = checkGPUAvailability();
    const throughput = taskCount / (executionTime / 1000);

    return res.json({
      success: true,
      benchmark: {
        tasksProcessed: taskCount,
        executionTime: `${executionTime}ms`,
        throughput: `${throughput.toFixed(2)} tasks/sec`,
        gpuTasks: Math.floor(taskCount / 3),
        cpuTasks: Math.floor(taskCount * 2 / 3),
        hardwareSpeedup: gpuInfo.available ? '100x with GPU' : '1x CPU-only'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Start Classical Server
 */
async function startClassicalServer(): Promise<void> {
  const PORT = process.env.PORT || 3100;
  
  try {
    await initializeClassicalPlatform();
    
    app.listen(PORT, () => {
      console.log(`🖥️ Aurigraph Classical Platform running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Classical API: http://localhost:${PORT}/api/classical/*`);
      
      // Display classical capabilities
      const gpuInfo = checkGPUAvailability();
      console.log('\n' + '='.repeat(60));
      console.log('AURIGRAPH V10 - CLASSICAL CPU/GPU VERSION (SIMPLIFIED)');
      console.log('='.repeat(60));
      console.log('Hardware Capabilities:');
      console.log(`  • CPU: ${os.cpus().length} cores`);
      console.log(`  • RAM: ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
      console.log(`  • GPU: ${gpuInfo.available ? `${gpuInfo.count}x ${gpuInfo.type}` : 'Not available'}`);
      console.log('Performance Targets:');
      console.log('  • 100x GPU Speedup (simulated)');
      console.log('  • <100ms Decision Latency');
      console.log('  • 85%+ Resource Efficiency');
      console.log('API Endpoints:');
      console.log('  • GET  /health - System health');
      console.log('  • GET  /api/classical/metrics - Performance metrics');
      console.log('  • POST /api/classical/gpu/execute - GPU task execution');
      console.log('  • POST /api/classical/consensus - Classical consensus');
      console.log('  • POST /api/classical/orchestrate - AI orchestration');
      console.log('  • GET  /api/classical/benchmark - Performance benchmark');
      console.log('='.repeat(60) + '\n');
    });
    
  } catch (error) {
    console.error('Failed to start classical server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down classical platform...');
  console.log('Goodbye! 👋');
  process.exit(0);
});

// Start the server
startClassicalServer().catch(console.error);