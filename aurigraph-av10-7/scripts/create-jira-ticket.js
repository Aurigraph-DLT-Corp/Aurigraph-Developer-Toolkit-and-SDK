#!/usr/bin/env node

/**
 * Create new JIRA ticket for optimal node density in Docker containers
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

// Ticket details for optimal node density
const ticketData = {
  fields: {
    project: {
      key: "AV11"
    },
    summary: "Optimal Node Density in Docker Containers - Resource-Based Auto-Scaling",
    description: `Implement optimal node density calculation for Docker containers to run maximum number of Aurigraph nodes based on available system resources.

## Objective
Configure Docker containers to automatically determine and run the optimal number of Aurigraph basic nodes based on:
- Available system memory
- CPU cores and processing capacity  
- Network bandwidth capabilities
- Storage I/O performance
- Container resource limits

## Technical Requirements

### Resource Detection
- Automatic system resource discovery
- Container limit detection (memory, CPU, network)
- Performance baseline establishment
- Real-time resource monitoring

### Optimal Density Calculation
- Memory per node: 128MB minimum, 256MB optimal
- CPU per node: 0.5-1.0 cores optimal allocation
- Network overhead: 10MB/s per node minimum
- Storage: 1GB per node for logs and data

### Auto-Scaling Features
- Dynamic node spawning based on available resources
- Automatic node termination when resources constrained
- Load-based scaling (scale up under high load)
- Resource pressure detection and response

### Implementation Components
- ResourceCalculator.java - System resource detection
- NodeDensityOptimizer.java - Optimal node count calculation
- AutoScaler.java - Dynamic node management
- ContainerMonitor.java - Container resource tracking

## Acceptance Criteria

### Performance Targets
- Utilize 80-90% of available container memory optimally
- Maintain <100ms response time per node under load
- Support 10-50 nodes per container depending on resources
- Automatic scaling response time <30 seconds

### Resource Optimization
- Memory efficiency: Maximum nodes without OOM errors
- CPU efficiency: Optimal core utilization without thrashing
- Network efficiency: Bandwidth allocation per node
- Storage efficiency: Shared storage optimization

### Management Features
- Real-time optimal density display in web interface
- Manual override for node count limits
- Resource pressure alerts and automatic responses
- Performance metrics per node and container aggregate

## Technical Implementation

### System Resource Detection
\`\`\`java
// Detect container memory limit
long containerMemoryMB = getContainerMemoryLimit();

// Detect available CPU cores
int availableCores = getAvailableCpuCores();

// Calculate optimal node count
int optimalNodes = calculateOptimalNodeCount(containerMemoryMB, availableCores);
\`\`\`

### Dynamic Node Management
\`\`\`java
// Monitor resource usage and adjust node count
if (memoryUsage > 85%) {
    reduceNodeCount();
} else if (memoryUsage < 60% && cpuUsage < 70%) {
    increaseNodeCount();
}
\`\`\`

### Container Optimization Strategies
- Shared JVM instances for memory efficiency
- Connection pooling across nodes
- Shared cache and storage optimization
- Network connection multiplexing

## Expected Outcomes

### Resource Efficiency
- 2-5x increase in node density per container
- 90%+ resource utilization optimization
- Reduced infrastructure costs
- Improved performance per dollar

### Operational Benefits
- Automatic optimal configuration
- Reduced manual tuning requirements
- Better resource utilization
- Improved scalability

## Timeline
- Duration: 4 weeks
- Priority: High - Infrastructure optimization
- Dependencies: AV11-19 basic node implementation

## Related Tickets
- AV11-19: Basic Node Implementation (completed)
- AV11-18: Platform implementation (completed)`,
    issuetype: {
      name: "Task"
    },
    labels: ["docker", "optimization", "auto-scaling", "resource-management"]
  }
};

async function createTicket() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const requestData = JSON.stringify(ticketData);

    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/api/3/issue',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': requestData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log('✅ JIRA ticket created successfully!');
          console.log(`🎯 Ticket Key: ${result.key}`);
          console.log(`📋 Ticket ID: ${result.id}`);
          console.log(`🔗 URL: ${JIRA_BASE_URL}/browse/${result.key}`);
          resolve(result);
        } else {
          console.log(`❌ Failed to create ticket: ${res.statusCode}`);
          try {
            const errorResponse = JSON.parse(data);
            console.log('Error details:', JSON.stringify(errorResponse, null, 2));
          } catch (e) {
            console.log('Raw response:', data);
          }
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎫 Creating JIRA Ticket for Optimal Node Density');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 Project: AV11');
  console.log('📌 Summary: Optimal Node Density in Docker Containers');
  console.log('🎯 Type: Task');
  console.log('⚡ Priority: High');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const result = await createTicket();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 JIRA Ticket Creation Successful!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📝 Ticket: ${result.key}`);
    console.log(`📊 Focus: Resource-based auto-scaling for Docker containers`);
    console.log(`🎯 Goal: Optimal node density with 80-90% resource utilization`);
    console.log(`⏱️ Timeline: 4 weeks implementation`);
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\nFailed to create JIRA ticket:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);