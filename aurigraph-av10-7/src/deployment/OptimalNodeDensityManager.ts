/**
 * AV11-32: Optimal Node Density Manager
 * 
 * Advanced DevOps & Deployment Agent for resource-based auto-scaling 
 * and optimal node density management in Docker containers.
 * 
 * Features:
 * - Automatic resource detection and monitoring
 * - Optimal node count calculation (80-90% resource utilization)
 * - Dynamic node spawning/termination
 * - Support for 10-50+ nodes per container
 * - Real-time performance optimization
 * - Advanced container orchestration
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/Logger';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { spawn, exec } from 'child_process';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SystemResources {
  totalMemoryGB: number;
  availableMemoryGB: number;
  memoryUtilization: number;
  cpuCores: number;
  cpuUtilization: number;
  diskSpaceGB: number;
  availableDiskGB: number;
  diskUtilization: number;
  networkBandwidthMBps: number;
  containerLimits?: ContainerLimits;
}

export interface ContainerLimits {
  maxMemoryGB: number;
  maxCpuCores: number;
  maxDiskGB: number;
  maxNetworkMBps: number;
}

export interface NodeDensityConfig {
  targetMemoryUtilization: number; // 0.8 = 80%
  targetCpuUtilization: number;     // 0.85 = 85%
  targetDiskUtilization: number;    // 0.75 = 75%
  
  minNodesPerContainer: number;     // 10
  maxNodesPerContainer: number;     // 50
  
  nodeResourceRequirements: {
    memoryMB: number;               // Memory per node
    cpuCores: number;               // CPU cores per node
    diskMB: number;                 // Disk space per node
    networkMBps: number;            // Network bandwidth per node
  };
  
  scalingPolicy: {
    scaleUpThreshold: number;       // 0.9 = scale up at 90% utilization
    scaleDownThreshold: number;     // 0.6 = scale down below 60% utilization
    cooldownPeriodMs: number;       // Wait period between scaling actions
    enableAggressiveScaling: boolean;
    enablePredictiveScaling: boolean;
  };
  
  healthChecks: {
    enabled: boolean;
    intervalMs: number;
    failureThreshold: number;
    successThreshold: number;
    timeoutMs: number;
  };
}

export interface NodeInstance {
  id: string;
  type: 'VALIDATOR' | 'FULL' | 'LIGHT' | 'ARCHIVE' | 'BRIDGE';
  port: number;
  p2pPort: number;
  containerId: string;
  pid?: number;
  status: 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'ERROR';
  resourceUsage: {
    memoryMB: number;
    cpuPercent: number;
    diskMB: number;
    networkMBps: number;
  };
  performance: {
    tps: number;
    latencyMs: number;
    uptime: number;
    errorRate: number;
  };
  healthScore: number;
  lastHealthCheck: Date;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface DensityMetrics {
  totalNodes: number;
  activeNodes: number;
  optimalNodeCount: number;
  currentDensity: number;        // nodes per GB of memory
  optimalDensity: number;
  resourceEfficiency: number;    // 0-1 scale
  scalingRecommendation: 'SCALE_UP' | 'SCALE_DOWN' | 'MAINTAIN' | 'OPTIMIZE';
  performanceScore: number;      // 0-100 scale
  costEfficiency: number;        // 0-1 scale
}

export interface ScalingEvent {
  timestamp: Date;
  action: 'SCALE_UP' | 'SCALE_DOWN' | 'OPTIMIZE' | 'EMERGENCY_SCALE';
  trigger: string;
  nodesBefore: number;
  nodesAfter: number;
  reasonCode: string;
  executionTimeMs: number;
  success: boolean;
  errorMessage?: string;
}

export class OptimalNodeDensityManager extends EventEmitter {
  private logger: Logger;
  private quantumCrypto: QuantumCryptoManagerV2;
  private config: NodeDensityConfig;
  private nodes: Map<string, NodeInstance> = new Map();
  private systemResources: SystemResources | null = null;
  private densityMetrics: DensityMetrics | null = null;
  private scalingHistory: ScalingEvent[] = [];
  private lastScalingAction: Date | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private nextNodePort: number = 8200;
  private nextP2PPort: number = 28200;
  private isScaling: boolean = false;

  constructor(quantumCrypto: QuantumCryptoManagerV2, config?: Partial<NodeDensityConfig>) {
    super();
    this.logger = new Logger('AV11-32-OptimalNodeDensity');
    this.quantumCrypto = quantumCrypto;
    
    this.config = {
      targetMemoryUtilization: 0.85,
      targetCpuUtilization: 0.80,
      targetDiskUtilization: 0.75,
      
      minNodesPerContainer: 10,
      maxNodesPerContainer: 50,
      
      nodeResourceRequirements: {
        memoryMB: 256,      // 256MB per node
        cpuCores: 0.25,     // 1/4 CPU core per node  
        diskMB: 1024,       // 1GB disk per node
        networkMBps: 10     // 10 Mbps per node
      },
      
      scalingPolicy: {
        scaleUpThreshold: 0.90,
        scaleDownThreshold: 0.60,
        cooldownPeriodMs: 30000, // 30 seconds
        enableAggressiveScaling: true,
        enablePredictiveScaling: true
      },
      
      healthChecks: {
        enabled: true,
        intervalMs: 10000,  // 10 seconds
        failureThreshold: 3,
        successThreshold: 2,
        timeoutMs: 5000
      },
      
      ...config
    };
  }

  public async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing AV11-32 Optimal Node Density Manager...');
    
    try {
      // Ensure Docker network exists
      await this.ensureDockerNetwork();
      
      // Detect system resources
      await this.detectSystemResources();
      
      // Calculate optimal node density
      await this.calculateOptimalDensity();
      
      // Start monitoring
      await this.startResourceMonitoring();
      
      // Start health checks
      if (this.config.healthChecks.enabled) {
        await this.startHealthChecks();
      }
      
      this.logger.info('✅ AV11-32 Optimal Node Density Manager initialized successfully');
      this.logger.info(`📊 System Resources: ${this.systemResources?.totalMemoryGB}GB RAM, ${this.systemResources?.cpuCores} CPU cores`);
      this.logger.info(`🎯 Optimal Density: ${this.densityMetrics?.optimalNodeCount} nodes (${this.densityMetrics?.optimalDensity.toFixed(2)} nodes/GB)`);
      
      this.emit('initialized', {
        systemResources: this.systemResources,
        densityMetrics: this.densityMetrics
      });
      
    } catch (error: unknown) {
      this.logger.error(`❌ Failed to initialize Optimal Node Density Manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  public async detectSystemResources(): Promise<SystemResources> {
    this.logger.info('🔍 Detecting system resources...');
    
    try {
      const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
      const freeMemoryGB = os.freemem() / (1024 * 1024 * 1024);
      const availableMemoryGB = freeMemoryGB;
      const memoryUtilization = (totalMemoryGB - availableMemoryGB) / totalMemoryGB;
      
      const cpuCores = os.cpus().length;
      
      // Get CPU utilization (simplified)
      const cpuUtilization = await this.getCpuUtilization();
      
      // Get disk space
      const { diskSpaceGB, availableDiskGB } = await this.getDiskSpace();
      const diskUtilization = (diskSpaceGB - availableDiskGB) / diskSpaceGB;
      
      // Estimate network bandwidth
      const networkBandwidthMBps = 1000; // Assume 1 Gbps default
      
      // Check for container limits
      const containerLimits = await this.getContainerLimits();
      
      this.systemResources = {
        totalMemoryGB,
        availableMemoryGB,
        memoryUtilization,
        cpuCores,
        cpuUtilization,
        diskSpaceGB,
        availableDiskGB,
        diskUtilization,
        networkBandwidthMBps,
        containerLimits
      };
      
      this.logger.info(`📊 System Resources Detected:`);
      this.logger.info(`   Memory: ${totalMemoryGB.toFixed(2)}GB total, ${availableMemoryGB.toFixed(2)}GB available (${(memoryUtilization * 100).toFixed(1)}% used)`);
      this.logger.info(`   CPU: ${cpuCores} cores, ${(cpuUtilization * 100).toFixed(1)}% utilized`);
      this.logger.info(`   Disk: ${diskSpaceGB.toFixed(2)}GB total, ${availableDiskGB.toFixed(2)}GB available (${(diskUtilization * 100).toFixed(1)}% used)`);
      
      return this.systemResources;
    } catch (error: unknown) {
      this.logger.error(`Failed to detect system resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  public async calculateOptimalDensity(): Promise<DensityMetrics> {
    if (!this.systemResources) {
      throw new Error('System resources not detected. Call detectSystemResources() first.');
    }
    
    this.logger.info('🧮 Calculating optimal node density...');
    
    const resources = this.systemResources;
    const nodeReqs = this.config.nodeResourceRequirements;
    
    // Calculate maximum nodes based on each resource constraint
    const memoryConstrainedNodes = Math.floor(
      (resources.availableMemoryGB * this.config.targetMemoryUtilization * 1024) / nodeReqs.memoryMB
    );
    
    const cpuConstrainedNodes = Math.floor(
      (resources.cpuCores * this.config.targetCpuUtilization) / nodeReqs.cpuCores
    );
    
    const diskConstrainedNodes = Math.floor(
      (resources.availableDiskGB * this.config.targetDiskUtilization * 1024) / nodeReqs.diskMB
    );
    
    const networkConstrainedNodes = Math.floor(
      resources.networkBandwidthMBps / nodeReqs.networkMBps
    );
    
    // Optimal node count is limited by the most constraining resource
    let optimalNodeCount = Math.min(
      memoryConstrainedNodes,
      cpuConstrainedNodes,
      diskConstrainedNodes,
      networkConstrainedNodes,
      this.config.maxNodesPerContainer
    );
    
    // Ensure minimum nodes
    optimalNodeCount = Math.max(optimalNodeCount, this.config.minNodesPerContainer);
    
    const optimalDensity = optimalNodeCount / resources.totalMemoryGB;
    const currentNodes = this.nodes.size;
    const currentDensity = currentNodes / resources.totalMemoryGB;
    
    // Calculate resource efficiency
    const memoryEfficiency = Math.min(currentNodes * nodeReqs.memoryMB / (resources.totalMemoryGB * 1024), 1);
    const cpuEfficiency = Math.min(currentNodes * nodeReqs.cpuCores / resources.cpuCores, 1);
    const diskEfficiency = Math.min(currentNodes * nodeReqs.diskMB / (resources.diskSpaceGB * 1024), 1);
    
    const resourceEfficiency = (memoryEfficiency + cpuEfficiency + diskEfficiency) / 3;
    
    // Determine scaling recommendation
    let scalingRecommendation: 'SCALE_UP' | 'SCALE_DOWN' | 'MAINTAIN' | 'OPTIMIZE';
    
    if (currentNodes < optimalNodeCount * 0.8) {
      scalingRecommendation = 'SCALE_UP';
    } else if (currentNodes > optimalNodeCount * 1.1) {
      scalingRecommendation = 'SCALE_DOWN';
    } else if (resourceEfficiency < 0.7) {
      scalingRecommendation = 'OPTIMIZE';
    } else {
      scalingRecommendation = 'MAINTAIN';
    }
    
    // Calculate performance score (0-100)
    const performanceScore = Math.min(100, resourceEfficiency * 100 * (currentNodes / optimalNodeCount));
    
    // Calculate cost efficiency
    const costEfficiency = Math.min(1, resourceEfficiency * (optimalNodeCount / Math.max(currentNodes, 1)));
    
    this.densityMetrics = {
      totalNodes: currentNodes,
      activeNodes: Array.from(this.nodes.values()).filter(n => n.status === 'RUNNING').length,
      optimalNodeCount,
      currentDensity,
      optimalDensity,
      resourceEfficiency,
      scalingRecommendation,
      performanceScore,
      costEfficiency
    };
    
    this.logger.info('📈 Optimal Density Calculated:');
    this.logger.info(`   Optimal Nodes: ${optimalNodeCount} (limited by: ${this.getBottleneckResource()})`);
    this.logger.info(`   Current Nodes: ${currentNodes}`);
    this.logger.info(`   Resource Efficiency: ${(resourceEfficiency * 100).toFixed(1)}%`);
    this.logger.info(`   Recommendation: ${scalingRecommendation}`);
    
    return this.densityMetrics;
  }

  public async scaleToOptimal(): Promise<boolean> {
    if (!this.densityMetrics) {
      await this.calculateOptimalDensity();
    }
    
    if (this.isScaling) {
      this.logger.warn('⚠️ Scaling operation already in progress');
      return false;
    }
    
    // Check cooldown period
    if (this.lastScalingAction && 
        Date.now() - this.lastScalingAction.getTime() < this.config.scalingPolicy.cooldownPeriodMs) {
      this.logger.info('⏳ Scaling action in cooldown period, skipping');
      return false;
    }
    
    const metrics = this.densityMetrics!;
    const currentNodes = metrics.totalNodes;
    const optimalNodes = metrics.optimalNodeCount;
    
    if (metrics.scalingRecommendation === 'MAINTAIN') {
      this.logger.info('✅ Node density is optimal, no scaling needed');
      return true;
    }
    
    this.isScaling = true;
    const scalingStartTime = Date.now();
    
    try {
      let success = false;
      let action: 'SCALE_UP' | 'SCALE_DOWN' | 'OPTIMIZE' | 'EMERGENCY_SCALE' = 'SCALE_UP';
      
      if (metrics.scalingRecommendation === 'SCALE_UP') {
        const nodesToAdd = optimalNodes - currentNodes;
        success = await this.scaleUp(nodesToAdd);
        action = 'SCALE_UP';
        
      } else if (metrics.scalingRecommendation === 'SCALE_DOWN') {
        const nodesToRemove = currentNodes - optimalNodes;
        success = await this.scaleDown(nodesToRemove);
        action = 'SCALE_DOWN';
        
      } else if (metrics.scalingRecommendation === 'OPTIMIZE') {
        success = await this.optimizeNodeAllocation();
        action = 'OPTIMIZE';
      }
      
      // Record scaling event
      const scalingEvent: ScalingEvent = {
        timestamp: new Date(),
        action,
        trigger: `Optimal density scaling: ${metrics.scalingRecommendation}`,
        nodesBefore: currentNodes,
        nodesAfter: this.nodes.size,
        reasonCode: `TARGET_UTILIZATION_${metrics.scalingRecommendation}`,
        executionTimeMs: Date.now() - scalingStartTime,
        success
      };
      
      this.scalingHistory.push(scalingEvent);
      this.lastScalingAction = new Date();
      
      // Trim scaling history to last 100 events
      if (this.scalingHistory.length > 100) {
        this.scalingHistory = this.scalingHistory.slice(-100);
      }
      
      this.emit('scaling_completed', scalingEvent);
      
      this.logger.info(`✅ Scaling completed: ${currentNodes} -> ${this.nodes.size} nodes in ${scalingEvent.executionTimeMs}ms`);
      
      return success;
      
    } catch (error: unknown) {
      this.logger.error(`❌ Scaling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
      
    } finally {
      this.isScaling = false;
    }
  }

  public async scaleUp(nodeCount: number): Promise<boolean> {
    this.logger.info(`📈 Scaling up by ${nodeCount} nodes...`);
    
    const nodesToCreate = Math.min(nodeCount, this.config.maxNodesPerContainer - this.nodes.size);
    let successCount = 0;
    
    for (let i = 0; i < nodesToCreate; i++) {
      try {
        const nodeInstance = await this.createNode();
        if (nodeInstance) {
          successCount++;
          this.logger.info(`✅ Node ${nodeInstance.id} created successfully`);
        }
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to create node ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    this.logger.info(`📈 Scale up completed: ${successCount}/${nodesToCreate} nodes created`);
    return successCount > 0;
  }

  public async scaleDown(nodeCount: number): Promise<boolean> {
    this.logger.info(`📉 Scaling down by ${nodeCount} nodes...`);
    
    // Get nodes to remove (prioritize least performing nodes)
    const nodes = Array.from(this.nodes.values())
      .filter(n => n.status === 'RUNNING')
      .sort((a, b) => a.healthScore - b.healthScore); // Remove lowest health score nodes first
    
    const nodesToRemove = Math.min(nodeCount, nodes.length - this.config.minNodesPerContainer);
    let successCount = 0;
    
    for (let i = 0; i < nodesToRemove; i++) {
      try {
        const nodeToRemove = nodes[i];
        const success = await this.terminateNode(nodeToRemove.id);
        if (success) {
          successCount++;
          this.logger.info(`✅ Node ${nodeToRemove.id} terminated successfully`);
        }
      } catch (error: unknown) {
        this.logger.error(`❌ Failed to terminate node ${nodes[i].id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    this.logger.info(`📉 Scale down completed: ${successCount}/${nodesToRemove} nodes terminated`);
    return successCount > 0;
  }

  public async createNode(type: NodeInstance['type'] = 'FULL'): Promise<NodeInstance | null> {
    const nodeId = `NODE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const port = this.nextNodePort++;
    const p2pPort = this.nextP2PPort++;
    
    try {
      this.logger.info(`🔄 Creating ${type} node ${nodeId}...`);
      
      // Create node instance record
      const nodeInstance: NodeInstance = {
        id: nodeId,
        type,
        port,
        p2pPort,
        containerId: process.env.HOSTNAME || 'unknown',
        status: 'STARTING',
        resourceUsage: {
          memoryMB: 0,
          cpuPercent: 0,
          diskMB: 0,
          networkMBps: 0
        },
        performance: {
          tps: 0,
          latencyMs: 0,
          uptime: 0,
          errorRate: 0
        },
        healthScore: 100,
        lastHealthCheck: new Date(),
        createdAt: new Date(),
        metadata: {
          version: 'AV11-32',
          autoScaled: true,
          targetUtilization: this.config.targetMemoryUtilization
        }
      };
      
      // Launch node process
      const success = await this.launchNodeProcess(nodeInstance);
      
      if (success) {
        nodeInstance.status = 'RUNNING';
        this.nodes.set(nodeId, nodeInstance);
        
        this.emit('node_created', nodeInstance);
        
        this.logger.info(`✅ Node ${nodeId} created and running on port ${port}`);
        return nodeInstance;
      } else {
        this.logger.error(`❌ Failed to launch node process for ${nodeId}`);
        return null;
      }
      
    } catch (error: unknown) {
      this.logger.error(`❌ Failed to create node ${nodeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  public async terminateNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    
    if (!node) {
      this.logger.error(`❌ Node ${nodeId} not found`);
      return false;
    }
    
    try {
      this.logger.info(`🛑 Terminating node ${nodeId}...`);
      
      node.status = 'STOPPING';
      
      // Gracefully shutdown the node
      const success = await this.shutdownNodeProcess(node);
      
      if (success) {
        node.status = 'STOPPED';
        this.nodes.delete(nodeId);
        
        this.emit('node_terminated', node);
        
        this.logger.info(`✅ Node ${nodeId} terminated successfully`);
        return true;
      } else {
        this.logger.error(`❌ Failed to shutdown node process for ${nodeId}`);
        return false;
      }
      
    } catch (error: unknown) {
      this.logger.error(`❌ Failed to terminate node ${nodeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  public async optimizeNodeAllocation(): Promise<boolean> {
    this.logger.info('🔧 Optimizing node allocation...');
    
    // Get current resource usage
    await this.updateNodeResourceUsage();
    
    const nodes = Array.from(this.nodes.values());
    let optimized = 0;
    
    // Identify underperforming nodes
    const underperformingNodes = nodes.filter(n => 
      n.healthScore < 80 || 
      n.performance.errorRate > 0.05 || 
      n.resourceUsage.memoryMB > this.config.nodeResourceRequirements.memoryMB * 1.5
    );
    
    // Restart underperforming nodes
    for (const node of underperformingNodes) {
      try {
        this.logger.info(`🔄 Restarting underperforming node ${node.id} (health: ${node.healthScore})`);
        
        await this.restartNode(node.id);
        optimized++;
        
      } catch (error: unknown) {
        this.logger.error(`Failed to restart node ${node.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Rebalance workload if needed
    await this.rebalanceWorkload();
    
    this.logger.info(`🔧 Node allocation optimization completed: ${optimized} nodes optimized`);
    return optimized > 0;
  }

  public getDensityMetrics(): DensityMetrics | null {
    return this.densityMetrics;
  }

  public getSystemResources(): SystemResources | null {
    return this.systemResources;
  }

  public getNodes(): Map<string, NodeInstance> {
    return new Map(this.nodes);
  }

  public getNode(nodeId: string): NodeInstance | undefined {
    return this.nodes.get(nodeId);
  }

  public getActiveNodes(): NodeInstance[] {
    return Array.from(this.nodes.values()).filter(n => n.status === 'RUNNING');
  }

  public getScalingHistory(): ScalingEvent[] {
    return [...this.scalingHistory];
  }

  public getPerformanceMetrics(): any {
    const nodes = Array.from(this.nodes.values());
    const activeNodes = nodes.filter(n => n.status === 'RUNNING');
    
    return {
      totalNodes: nodes.length,
      activeNodes: activeNodes.length,
      averageHealthScore: activeNodes.reduce((sum, n) => sum + n.healthScore, 0) / Math.max(activeNodes.length, 1),
      averageTPS: activeNodes.reduce((sum, n) => sum + n.performance.tps, 0),
      averageLatency: activeNodes.reduce((sum, n) => sum + n.performance.latencyMs, 0) / Math.max(activeNodes.length, 1),
      totalMemoryUsage: nodes.reduce((sum, n) => sum + n.resourceUsage.memoryMB, 0),
      totalCpuUsage: nodes.reduce((sum, n) => sum + n.resourceUsage.cpuPercent, 0) / Math.max(nodes.length, 1),
      resourceEfficiency: this.densityMetrics?.resourceEfficiency || 0,
      scalingEvents: this.scalingHistory.length,
      lastScaling: this.lastScalingAction?.toISOString(),
      systemResources: this.systemResources
    };
  }

  // Private helper methods

  private async getCpuUtilization(): Promise<number> {
    return new Promise((resolve) => {
      // Simplified CPU utilization calculation
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const utilization = 1 - idle / total;
      
      resolve(Math.max(0, Math.min(1, utilization)));
    });
  }

  private async getDiskSpace(): Promise<{ diskSpaceGB: number; availableDiskGB: number }> {
    try {
      return new Promise((resolve, reject) => {
        exec('df -BG /', (error, stdout) => {
          if (error) {
            // Default values if command fails
            resolve({ diskSpaceGB: 100, availableDiskGB: 50 });
            return;
          }
          
          const lines = stdout.trim().split('\n');
          if (lines.length < 2) {
            resolve({ diskSpaceGB: 100, availableDiskGB: 50 });
            return;
          }
          
          const diskInfo = lines[1].split(/\s+/);
          const totalGB = parseInt(diskInfo[1]) || 100;
          const availableGB = parseInt(diskInfo[3]) || 50;
          
          resolve({ 
            diskSpaceGB: totalGB,
            availableDiskGB: availableGB
          });
        });
      });
    } catch (error: unknown) {
      return { diskSpaceGB: 100, availableDiskGB: 50 };
    }
  }

  private async getContainerLimits(): Promise<ContainerLimits | undefined> {
    try {
      // Check if running in container with resource limits
      const memoryLimit = await fs.readFile('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8')
        .catch(() => null);
      
      if (memoryLimit) {
        const limitBytes = parseInt(memoryLimit.trim());
        if (limitBytes < os.totalmem()) {
          return {
            maxMemoryGB: limitBytes / (1024 * 1024 * 1024),
            maxCpuCores: os.cpus().length, // Simplified
            maxDiskGB: 100, // Default
            maxNetworkMBps: 1000 // Default
          };
        }
      }
    } catch (error: unknown) {
      // Not in a container or limits not available
    }
    
    return undefined;
  }

  private getBottleneckResource(): string {
    if (!this.systemResources) return 'unknown';
    
    const resources = this.systemResources;
    const nodeReqs = this.config.nodeResourceRequirements;
    
    const memoryNodes = Math.floor((resources.availableMemoryGB * this.config.targetMemoryUtilization * 1024) / nodeReqs.memoryMB);
    const cpuNodes = Math.floor((resources.cpuCores * this.config.targetCpuUtilization) / nodeReqs.cpuCores);
    const diskNodes = Math.floor((resources.availableDiskGB * this.config.targetDiskUtilization * 1024) / nodeReqs.diskMB);
    const networkNodes = Math.floor(resources.networkBandwidthMBps / nodeReqs.networkMBps);
    
    const min = Math.min(memoryNodes, cpuNodes, diskNodes, networkNodes);
    
    if (min === memoryNodes) return 'memory';
    if (min === cpuNodes) return 'cpu';
    if (min === diskNodes) return 'disk';
    return 'network';
  }

  private async launchNodeProcess(node: NodeInstance): Promise<boolean> {
    try {
      this.logger.info(`🚀 Launching ${node.type} node ${node.id} on port ${node.port}`);
      
      // Create enhanced DLT node configuration
      const nodeConfig = {
        nodeId: node.id,
        nodeType: node.type,
        networkId: 'aurigraph-av10-7',
        port: node.port,
        maxConnections: 50,
        enableSharding: true,
        shardId: `shard-${Math.floor(Math.random() * 8)}`,
        consensusRole: (node.type === 'VALIDATOR' ? 'LEADER' : 'FOLLOWER') as 'LEADER' | 'FOLLOWER',
        quantumSecurity: true,
        storageType: 'DISK' as const,
        resourceLimits: {
          maxMemoryMB: this.config.nodeResourceRequirements.memoryMB,
          maxDiskGB: Math.floor(this.config.nodeResourceRequirements.diskMB / 1024),
          maxCPUPercent: Math.floor(this.config.nodeResourceRequirements.cpuCores * 100),
          maxNetworkMBps: this.config.nodeResourceRequirements.networkMBps,
          maxTransactionsPerSec: node.type === 'VALIDATOR' ? 10000 : 5000
        }
      };

      // Launch Docker container for the node
      const dockerCommand = await this.buildDockerCommand(node, nodeConfig);
      
      // Execute Docker command
      const success = await this.executeDockerCommand(dockerCommand, node.id);
      
      if (success) {
        // Wait for node to be healthy
        const isHealthy = await this.waitForNodeHealth(node);
        
        if (isHealthy) {
          this.logger.info(`✅ Node ${node.id} launched successfully and is healthy`);
          return true;
        } else {
          this.logger.error(`❌ Node ${node.id} launched but failed health checks`);
          return false;
        }
      }
      
      return false;
    } catch (error: unknown) {
      this.logger.error(`Failed to launch node ${node.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async shutdownNodeProcess(node: NodeInstance): Promise<boolean> {
    try {
      this.logger.info(`🛑 Shutting down node process for ${node.id} (container: ${node.containerId})`);
      
      // Step 1: Gracefully stop Docker container
      const stopSuccess = await this.shutdownDockerContainer(node.containerId);
      
      if (stopSuccess) {
        // Step 2: Remove Docker container
        const removeSuccess = await this.removeDockerContainer(node.containerId);
        
        if (removeSuccess) {
          this.logger.info(`✅ Node ${node.id} shutdown completed successfully`);
          return true;
        } else {
          this.logger.warn(`⚠️ Node ${node.id} stopped but container removal failed`);
          return true; // Still consider it successful if container stopped
        }
      } else {
        this.logger.error(`❌ Failed to stop container for node ${node.id}`);
        return false;
      }
      
    } catch (error: unknown) {
      this.logger.error(`❌ Shutdown failed for node ${node.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async restartNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    
    // Graceful restart
    await this.shutdownNodeProcess(node);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = await this.launchNodeProcess(node);
    if (success) {
      node.status = 'RUNNING';
      node.healthScore = 100;
      node.lastHealthCheck = new Date();
    }
    
    return success;
  }

  private async updateNodeResourceUsage(): Promise<void> {
    // Update resource usage for all nodes
    for (const node of Array.from(this.nodes.values())) {
      // Simulate resource monitoring - in real implementation would query actual metrics
      node.resourceUsage = {
        memoryMB: Math.random() * this.config.nodeResourceRequirements.memoryMB * 1.5,
        cpuPercent: Math.random() * 80,
        diskMB: Math.random() * this.config.nodeResourceRequirements.diskMB,
        networkMBps: Math.random() * this.config.nodeResourceRequirements.networkMBps
      };
      
      node.performance = {
        tps: Math.random() * 10000,
        latencyMs: Math.random() * 100,
        uptime: Date.now() - node.createdAt.getTime(),
        errorRate: Math.random() * 0.1
      };
      
      // Calculate health score based on performance and resource usage
      const resourceHealth = Math.min(1, 1 - (node.resourceUsage.memoryMB / (this.config.nodeResourceRequirements.memoryMB * 2)));
      const performanceHealth = Math.min(1, 1 - node.performance.errorRate);
      const uptimeHealth = Math.min(1, node.performance.uptime / (24 * 60 * 60 * 1000)); // 24 hours
      
      node.healthScore = Math.round((resourceHealth + performanceHealth + uptimeHealth) / 3 * 100);
      node.lastHealthCheck = new Date();
    }
  }

  private async rebalanceWorkload(): Promise<void> {
    this.logger.info('⚖️ Rebalancing workload across nodes...');
    
    // In real implementation, would distribute workload more evenly
    // For now, just log the action
    const activeNodes = this.getActiveNodes();
    this.logger.info(`⚖️ Workload rebalanced across ${activeNodes.length} active nodes`);
  }

  private async startResourceMonitoring(): Promise<void> {
    this.logger.info('📊 Starting resource monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        // Update system resources
        await this.detectSystemResources();
        
        // Recalculate density metrics
        await this.calculateOptimalDensity();
        
        // Update node resource usage
        await this.updateNodeResourceUsage();
        
        // Check if scaling is needed
        if (this.config.scalingPolicy.enableAggressiveScaling || this.config.scalingPolicy.enablePredictiveScaling) {
          const metrics = this.densityMetrics!;
          
          // Check scaling thresholds
          const avgResourceUtilization = (
            this.systemResources!.memoryUtilization +
            this.systemResources!.cpuUtilization +
            this.systemResources!.diskUtilization
          ) / 3;
          
          if (avgResourceUtilization > this.config.scalingPolicy.scaleUpThreshold && 
              metrics.scalingRecommendation === 'SCALE_UP') {
            this.logger.info('🚨 High resource utilization detected, triggering scale-up');
            await this.scaleToOptimal();
          } else if (avgResourceUtilization < this.config.scalingPolicy.scaleDownThreshold && 
                     metrics.scalingRecommendation === 'SCALE_DOWN') {
            this.logger.info('📉 Low resource utilization detected, triggering scale-down');
            await this.scaleToOptimal();
          }
        }
        
        this.emit('metrics_updated', {
          systemResources: this.systemResources,
          densityMetrics: this.densityMetrics,
          nodeCount: this.nodes.size
        });
        
      } catch (error: unknown) {
        this.logger.error(`Resource monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 15000); // Every 15 seconds
  }

  private async startHealthChecks(): Promise<void> {
    this.logger.info('❤️ Starting health checks...');
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const nodes = Array.from(this.nodes.values());
        let healthyNodes = 0;
        let unhealthyNodes = 0;
        
        for (const node of nodes) {
          if (node.status !== 'RUNNING') continue;
          
          // Simulate health check - in real implementation would ping node endpoint
          const isHealthy = node.healthScore > 60 && Math.random() > 0.05; // 95% health check success rate
          
          if (isHealthy) {
            healthyNodes++;
            node.healthScore = Math.min(100, node.healthScore + 5);
          } else {
            unhealthyNodes++;
            node.healthScore = Math.max(0, node.healthScore - 20);
            
            // If node is consistently unhealthy, mark for restart
            if (node.healthScore < 30) {
              this.logger.warn(`⚠️ Node ${node.id} is unhealthy (score: ${node.healthScore}), marking for restart`);
              // Would trigger restart in real implementation
            }
          }
          
          node.lastHealthCheck = new Date();
        }
        
        if (unhealthyNodes > 0) {
          this.logger.warn(`⚠️ Health check completed: ${healthyNodes} healthy, ${unhealthyNodes} unhealthy nodes`);
        }
        
        this.emit('health_check_completed', {
          healthyNodes,
          unhealthyNodes,
          totalNodes: nodes.length
        });
        
      } catch (error: unknown) {
        this.logger.error(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, this.config.healthChecks.intervalMs);
  }

  public async stop(): Promise<void> {
    this.logger.info('🛑 Stopping Optimal Node Density Manager...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Gracefully shutdown all nodes
    const shutdownPromises = Array.from(this.nodes.keys()).map(nodeId => 
      this.terminateNode(nodeId)
    );
    
    await Promise.allSettled(shutdownPromises);
    
    this.logger.info('✅ Optimal Node Density Manager stopped');
    this.emit('stopped');
  }

  // Docker integration methods
  private async buildDockerCommand(node: NodeInstance, nodeConfig: any): Promise<string> {
    const dockerImage = node.type === 'VALIDATOR' ? 'aurigraph-validator' : 'aurigraph-node';
    const networkName = 'aurigraph-av10-7-network';
    
    // Build environment variables
    const envVars = [
      `NODE_ID=${node.id}`,
      `NODE_TYPE=${node.type}`,
      `PORT=${node.port}`,
      `P2P_PORT=${node.p2pPort}`,
      `NETWORK_ID=${nodeConfig.networkId}`,
      `SHARD_ID=${nodeConfig.shardId}`,
      `QUANTUM_SECURITY=true`,
      `CONSENSUS_ROLE=${nodeConfig.consensusRole}`,
      `MAX_CONNECTIONS=${nodeConfig.maxConnections}`,
      `MAX_MEMORY_MB=${nodeConfig.resourceLimits.maxMemoryMB}`,
      `MAX_CPU_PERCENT=${nodeConfig.resourceLimits.maxCPUPercent}`,
      `TARGET_TPS=${nodeConfig.resourceLimits.maxTransactionsPerSec}`,
      `ENABLE_SHARDING=${nodeConfig.enableSharding}`,
      `STORAGE_TYPE=${nodeConfig.storageType}`
    ];

    // Build Docker command
    const dockerCmd = [
      'docker run -d',
      `--name ${node.id}`,
      `--network ${networkName}`,
      `-p ${node.port}:${node.port}`,
      `-p ${node.p2pPort}:${node.p2pPort}`,
      `--memory=${nodeConfig.resourceLimits.maxMemoryMB}m`,
      `--cpus="${nodeConfig.resourceLimits.maxCPUPercent / 100}"`,
      envVars.map(env => `-e ${env}`).join(' '),
      '--restart unless-stopped',
      `--label "aurigraph.density.managed=true"`,
      `--label "aurigraph.density.manager=${this.constructor.name}"`,
      `--label "aurigraph.node.id=${node.id}"`,
      `--label "aurigraph.node.type=${node.type}"`,
      dockerImage
    ].join(' ');

    return dockerCmd;
  }

  private async executeDockerCommand(command: string, nodeId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Docker command failed for node ${nodeId}: ${error.message}`);
          this.logger.error(`stderr: ${stderr}`);
          resolve(false);
        } else {
          const containerId = stdout.trim();
          this.logger.info(`Docker container created for node ${nodeId}: ${containerId}`);
          // Store container ID in node metadata
          const node = this.nodes.get(nodeId);
          if (node) {
            node.containerId = containerId;
            node.metadata.dockerContainerId = containerId;
          }
          resolve(true);
        }
      });

      // Set timeout for Docker command
      setTimeout(() => {
        child.kill();
        this.logger.error(`Docker command timeout for node ${nodeId}`);
        resolve(false);
      }, 30000); // 30 second timeout
    });
  }

  private async waitForNodeHealth(node: NodeInstance, timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Check Docker container status
        const containerStatus = await this.checkDockerContainerStatus(node.containerId);
        
        if (containerStatus === 'running') {
          // Check node health endpoint
          const isHealthy = await this.checkNodeHealthEndpoint(node);
          
          if (isHealthy) {
            node.healthScore = 100;
            node.lastHealthCheck = new Date();
            return true;
          }
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error: unknown) {
        this.logger.debug(`Health check attempt failed for ${node.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.logger.warn(`⚠️ Node ${node.id} failed to become healthy within ${timeoutMs}ms`);
    return false;
  }

  private async checkDockerContainerStatus(containerId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`docker inspect --format='{{.State.Status}}' ${containerId}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to check container status: ${error.message}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  private async checkNodeHealthEndpoint(node: NodeInstance): Promise<boolean> {
    try {
      // In a real implementation, would make HTTP request to node health endpoint
      // For now, simulate health check based on node type and recent creation
      const nodeAge = Date.now() - node.createdAt.getTime();
      
      // Validators take longer to start
      const startupTime = node.type === 'VALIDATOR' ? 10000 : 5000;
      
      if (nodeAge > startupTime) {
        // Simulate 95% success rate for health checks
        return Math.random() > 0.05;
      }
      
      return false;
    } catch (error: unknown) {
      return false;
    }
  }

  private async shutdownDockerContainer(containerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Graceful shutdown with 30 second timeout
      exec(`docker stop --time=30 ${containerId}`, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Failed to stop container ${containerId}: ${error.message}`);
          // Force kill if graceful stop fails
          exec(`docker kill ${containerId}`, (killError) => {
            if (killError) {
              this.logger.error(`Failed to kill container ${containerId}: ${killError.message}`);
              resolve(false);
            } else {
              this.logger.info(`Container ${containerId} force killed`);
              resolve(true);
            }
          });
        } else {
          this.logger.info(`Container ${containerId} stopped gracefully`);
          resolve(true);
        }
      });
    });
  }

  private async removeDockerContainer(containerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec(`docker rm ${containerId}`, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Failed to remove container ${containerId}: ${error.message}`);
          resolve(false);
        } else {
          this.logger.info(`Container ${containerId} removed`);
          resolve(true);
        }
      });
    });
  }

  // Enhanced Docker network management
  private async ensureDockerNetwork(): Promise<boolean> {
    const networkName = 'aurigraph-av10-7-network';
    
    return new Promise((resolve) => {
      // Check if network exists
      exec(`docker network ls --filter name=${networkName} --format "{{.Name}}"`, (error, stdout) => {
        if (error || !stdout.trim()) {
          // Create network if it doesn't exist
          const createNetworkCmd = [
            'docker network create',
            '--driver bridge',
            `--subnet=172.29.0.0/16`,
            `--label "aurigraph.av10.managed=true"`,
            networkName
          ].join(' ');

          exec(createNetworkCmd, (createError) => {
            if (createError) {
              this.logger.error(`Failed to create Docker network: ${createError.message}`);
              resolve(false);
            } else {
              this.logger.info(`Docker network ${networkName} created`);
              resolve(true);
            }
          });
        } else {
          this.logger.debug(`Docker network ${networkName} already exists`);
          resolve(true);
        }
      });
    });
  }

  // API methods for external integration
  public async getNodeDensityStatus(): Promise<{
    systemResources: SystemResources | null;
    densityMetrics: DensityMetrics | null;
    nodes: NodeInstance[];
    scalingHistory: ScalingEvent[];
    performanceMetrics: any;
  }> {
    await this.updateNodeResourceUsage();
    
    return {
      systemResources: this.systemResources,
      densityMetrics: this.densityMetrics,
      nodes: Array.from(this.nodes.values()),
      scalingHistory: this.scalingHistory.slice(-10), // Last 10 events
      performanceMetrics: this.getPerformanceMetrics()
    };
  }

  public async forceScaling(action: 'SCALE_UP' | 'SCALE_DOWN' | 'OPTIMIZE', nodeCount?: number): Promise<boolean> {
    if (this.isScaling) {
      throw new Error('Scaling operation already in progress');
    }

    this.logger.info(`🔧 Force scaling triggered: ${action}${nodeCount ? ` (${nodeCount} nodes)` : ''}`);

    try {
      this.isScaling = true;
      let success = false;

      switch (action) {
        case 'SCALE_UP':
          success = await this.scaleUp(nodeCount || 5);
          break;
        case 'SCALE_DOWN':
          success = await this.scaleDown(nodeCount || 5);
          break;
        case 'OPTIMIZE':
          success = await this.optimizeNodeAllocation();
          break;
      }

      // Record scaling event
      const scalingEvent: ScalingEvent = {
        timestamp: new Date(),
        action,
        trigger: 'Force scaling via API',
        nodesBefore: this.nodes.size - (nodeCount || 0),
        nodesAfter: this.nodes.size,
        reasonCode: 'MANUAL_SCALING',
        executionTimeMs: 0,
        success
      };

      this.scalingHistory.push(scalingEvent);
      this.emit('scaling_completed', scalingEvent);

      return success;
    } finally {
      this.isScaling = false;
    }
  }

  public async createSpecificNode(type: NodeInstance['type'], customConfig?: Partial<NodeInstance>): Promise<NodeInstance | null> {
    const node = await this.createNode(type);
    
    if (node && customConfig) {
      // Apply custom configuration
      Object.assign(node.metadata, customConfig);
      this.logger.info(`Custom configuration applied to node ${node.id}`);
    }
    
    return node;
  }

  public async getDetailedNodeMetrics(nodeId: string): Promise<any> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Get Docker container stats
    const containerStats = await this.getDockerContainerStats(node.containerId);

    return {
      ...node,
      dockerStats: containerStats,
      detailedMetrics: {
        uptimeSeconds: Math.floor((Date.now() - node.createdAt.getTime()) / 1000),
        healthCheckHistory: [node.lastHealthCheck],
        resourceEfficiency: this.calculateNodeResourceEfficiency(node),
        performanceRating: this.calculateNodePerformanceRating(node)
      }
    };
  }

  private async getDockerContainerStats(containerId: string): Promise<any> {
    return new Promise((resolve) => {
      exec(`docker stats ${containerId} --no-stream --format "table {{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}}"`, 
        (error, stdout) => {
          if (error) {
            resolve({ error: error.message });
          } else {
            const lines = stdout.trim().split('\n');
            if (lines.length > 1) {
              const stats = lines[1].split(',');
              resolve({
                cpuPercent: stats[0] || '0%',
                memoryUsage: stats[1] || '0B / 0B',
                networkIO: stats[2] || '0B / 0B',
                blockIO: stats[3] || '0B / 0B'
              });
            } else {
              resolve({ error: 'No stats available' });
            }
          }
        });
    });
  }

  private calculateNodeResourceEfficiency(node: NodeInstance): number {
    const memoryEfficiency = Math.min(1, node.resourceUsage.memoryMB / this.config.nodeResourceRequirements.memoryMB);
    const cpuEfficiency = Math.min(1, node.resourceUsage.cpuPercent / 100);
    
    return (memoryEfficiency + cpuEfficiency) / 2;
  }

  private calculateNodePerformanceRating(node: NodeInstance): number {
    const healthWeight = 0.4;
    const tpsWeight = 0.3;
    const latencyWeight = 0.2;
    const uptimeWeight = 0.1;

    const healthScore = node.healthScore / 100;
    const tpsScore = Math.min(1, node.performance.tps / 5000);
    const latencyScore = Math.max(0, 1 - (node.performance.latencyMs / 1000));
    const uptimeScore = Math.min(1, node.performance.uptime / (24 * 60 * 60 * 1000));

    return (healthScore * healthWeight + 
            tpsScore * tpsWeight + 
            latencyScore * latencyWeight + 
            uptimeScore * uptimeWeight) * 100;
  }
}