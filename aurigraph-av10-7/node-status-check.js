#!/usr/bin/env node

const http = require('http');

const nodes = [
    { name: 'Validator-1', port: 8181, type: 'validator' },
    { name: 'Validator-2', port: 8182, type: 'validator' },
    { name: 'Validator-3', port: 8183, type: 'validator' },
    { name: 'Basic-Node-1', port: 8201, type: 'basic' },
    { name: 'Basic-Node-2', port: 8202, type: 'basic' },
    { name: 'Basic-Node-3', port: 8203, type: 'basic' },
    { name: 'Basic-Node-4', port: 8204, type: 'basic' },
    { name: 'Basic-Node-5', port: 8205, type: 'basic' },
];

async function checkNodeHealth(node) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${node.port}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const health = JSON.parse(data);
                    resolve({
                        ...node,
                        status: health.status || 'unknown',
                        nodeId: health.nodeId || 'unknown',
                        timestamp: health.timestamp || 'unknown',
                        reachable: true
                    });
                } catch (e) {
                    resolve({
                        ...node,
                        status: 'error',
                        nodeId: 'unknown',
                        timestamp: 'unknown',
                        reachable: false,
                        error: 'Invalid JSON response'
                    });
                }
            });
        });

        req.on('error', (err) => {
            resolve({
                ...node,
                status: 'unreachable',
                nodeId: 'unknown',
                timestamp: 'unknown',
                reachable: false,
                error: err.message
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                ...node,
                status: 'timeout',
                nodeId: 'unknown',
                timestamp: 'unknown',
                reachable: false,
                error: 'Connection timeout'
            });
        });
    });
}

async function checkAllNodes() {
    console.log('🚀 Aurigraph AV10-7 Node Status Check');
    console.log('=====================================');
    
    const results = await Promise.all(nodes.map(checkNodeHealth));
    
    let healthyNodes = 0;
    let validatorCount = 0;
    let basicNodeCount = 0;
    
    results.forEach(node => {
        const statusIcon = node.status === 'healthy' ? '✅' : '❌';
        const typeIcon = node.type === 'validator' ? '🔷' : '🔹';
        
        console.log(`${statusIcon} ${typeIcon} ${node.name.padEnd(15)} | Port: ${node.port} | Status: ${node.status.padEnd(10)} | Node ID: ${node.nodeId}`);
        
        if (node.status === 'healthy') {
            healthyNodes++;
            if (node.type === 'validator') validatorCount++;
            if (node.type === 'basic') basicNodeCount++;
        }
    });
    
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`Total Nodes:      ${results.length}`);
    console.log(`Healthy Nodes:    ${healthyNodes}`);
    console.log(`Validators:       ${validatorCount}/3`);
    console.log(`Basic Nodes:      ${basicNodeCount}/5`);
    console.log(`Success Rate:     ${Math.round((healthyNodes / results.length) * 100)}%`);
    
    if (healthyNodes === results.length) {
        console.log('\n🎉 All nodes are operational!');
        console.log('🌟 Platform ready for 1M+ TPS operations');
    } else {
        console.log('\n⚠️  Some nodes are not responding');
        console.log('🔧 Check Docker containers and network connectivity');
    }
}

checkAllNodes().catch(console.error);