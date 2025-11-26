/**
 * J4C Agent Communication Patterns
 *
 * Implements cross-agent communication, message routing, and event distribution
 * for the J4C continuous learning framework. Enables agents to:
 * - Share learning patterns and best practices
 * - Request recommendations from peer agents
 * - Broadcast optimization results
 * - Coordinate on complex tasks
 *
 * @author J4C Framework
 * @version 1.0.0
 */

import * as EventEmitter from 'events';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Message types for inter-agent communication
 */
export enum MessageType {
  LEARNING_PATTERN = 'learning_pattern',
  BEST_PRACTICE_UPDATE = 'best_practice_update',
  RECOMMENDATION_REQUEST = 'recommendation_request',
  RECOMMENDATION_RESPONSE = 'recommendation_response',
  CAPABILITY_UPDATE = 'capability_update',
  PERFORMANCE_REPORT = 'performance_report',
  OPTIMIZATION_ALERT = 'optimization_alert',
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  HEARTBEAT = 'heartbeat',
  ERROR_REPORT = 'error_report',
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

/**
 * Inter-agent communication message
 */
export interface J4CMessage {
  messageId: string;
  type: MessageType;
  priority: MessagePriority;
  sourceAgentId: string;
  sourceAgentName: string;
  targetAgentId?: string; // undefined = broadcast
  targetAgentName?: string;
  timestamp: number;
  expiresAt: number;
  payload: Record<string, any>;
  metadata: {
    correlationId?: string; // For request/response pairs
    retries: number;
    acknowledged: boolean;
  };
}

/**
 * Agent registry entry
 */
export interface AgentRegistration {
  agentId: string;
  agentName: string;
  category: string;
  capabilities: string[];
  version: string;
  lastHeartbeat: number;
  isHealthy: boolean;
  learningProfile: {
    successRate: number;
    qualityScore: number;
    reliabilityScore: number;
  };
}

/**
 * J4C Message Bus - Central communication hub
 */
export class J4CMessageBus extends EventEmitter {
  private messageQueue: Map<string, J4CMessage[]> = new Map();
  private agentRegistry: Map<string, AgentRegistration> = new Map();
  private routingTable: Map<string, string[]> = new Map(); // agent -> subscribed message types
  private messageLog: J4CMessage[] = [];
  private maxQueueSize = 1000;
  private maxMessageAge = 24 * 60 * 60 * 1000; // 24 hours

  private dataDir = path.join(process.cwd(), 'organization', 'agent_communication');
  private registryFile = path.join(this.dataDir, 'agent_registry.json');
  private messageLogFile = path.join(this.dataDir, 'message_log.json');

  constructor() {
    super();
    this.ensureDirectories();
    this.loadRegistry();
    this.startMaintenance();
  }

  /**
   * Register an agent with the message bus
   */
  public registerAgent(registration: AgentRegistration): void {
    this.agentRegistry.set(registration.agentId, {
      ...registration,
      lastHeartbeat: Date.now(),
      isHealthy: true,
    });

    // Initialize message queue for agent
    if (!this.messageQueue.has(registration.agentId)) {
      this.messageQueue.set(registration.agentId, []);
    }

    this.persistRegistry();
    this.emit('agent:registered', registration);

    console.log(`✓ Agent registered: ${registration.agentName} (${registration.agentId})`);
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(agentId: string): void {
    this.agentRegistry.delete(agentId);
    this.persistRegistry();
    this.emit('agent:unregistered', agentId);

    console.log(`✓ Agent unregistered: ${agentId}`);
  }

  /**
   * Send a message to a specific agent
   */
  public sendMessage(message: J4CMessage): boolean {
    if (!this.validateMessage(message)) {
      console.warn(`✗ Invalid message: ${message.messageId}`);
      return false;
    }

    // Check if target agent exists
    if (message.targetAgentId && !this.agentRegistry.has(message.targetAgentId)) {
      console.warn(`✗ Target agent not found: ${message.targetAgentId}`);
      return false;
    }

    // Add to queue
    const targetId = message.targetAgentId;
    if (targetId && this.messageQueue.has(targetId)) {
      const queue = this.messageQueue.get(targetId)!;
      if (queue.length < this.maxQueueSize) {
        queue.push(message);
        this.logMessage(message);
        this.emit('message:sent', message);
        return true;
      }
    }

    return false;
  }

  /**
   * Broadcast a message to all agents
   */
  public broadcastMessage(message: J4CMessage): number {
    let sentCount = 0;

    for (const agentId of this.agentRegistry.keys()) {
      const broadcastMsg = {
        ...message,
        targetAgentId: agentId,
        targetAgentName: this.agentRegistry.get(agentId)?.agentName,
      };

      if (this.sendMessage(broadcastMsg)) {
        sentCount++;
      }
    }

    console.log(`📢 Broadcast message to ${sentCount} agents`);
    this.emit('message:broadcast', { messageId: message.messageId, sentCount });

    return sentCount;
  }

  /**
   * Subscribe agent to message type
   */
  public subscribe(agentId: string, messageTypes: MessageType[]): void {
    if (!this.routingTable.has(agentId)) {
      this.routingTable.set(agentId, []);
    }

    const subscriptions = this.routingTable.get(agentId)!;
    for (const type of messageTypes) {
      if (!subscriptions.includes(type)) {
        subscriptions.push(type);
      }
    }

    console.log(`✓ Agent ${agentId} subscribed to ${messageTypes.length} message types`);
  }

  /**
   * Retrieve messages for an agent
   */
  public getMessages(agentId: string, limit: number = 100): J4CMessage[] {
    const queue = this.messageQueue.get(agentId);
    if (!queue) {
      return [];
    }

    // Filter expired messages and retrieve
    const messages = queue.filter((msg) => msg.expiresAt > Date.now()).slice(0, limit);

    // Remove retrieved messages
    this.messageQueue.set(agentId, queue.slice(messages.length));

    return messages;
  }

  /**
   * Send heartbeat from agent
   */
  public sendHeartbeat(agentId: string): void {
    const registration = this.agentRegistry.get(agentId);
    if (!registration) {
      console.warn(`Heartbeat from unknown agent: ${agentId}`);
      return;
    }

    registration.lastHeartbeat = Date.now();
    registration.isHealthy = true;

    this.emit('agent:heartbeat', agentId);
  }

  /**
   * Get agent registry
   */
  public getAgentRegistry(): AgentRegistration[] {
    return Array.from(this.agentRegistry.values());
  }

  /**
   * Get agent info
   */
  public getAgentInfo(agentId: string): AgentRegistration | undefined {
    return this.agentRegistry.get(agentId);
  }

  /**
   * Get healthy agents
   */
  public getHealthyAgents(): AgentRegistration[] {
    const healthyAgents: AgentRegistration[] = [];

    for (const agent of this.agentRegistry.values()) {
      const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat;
      const isHealthy = timeSinceHeartbeat < 5 * 60 * 1000; // 5 minutes

      if (isHealthy) {
        healthyAgents.push(agent);
      }
    }

    return healthyAgents;
  }

  /**
   * Get message statistics
   */
  public getMessageStats(): Record<string, any> {
    const stats = {
      totalQueued: 0,
      totalLogged: this.messageLog.length,
      agentQueues: {} as Record<string, number>,
      messageTypeDistribution: {} as Record<string, number>,
    };

    // Count queued messages
    for (const [agentId, queue] of this.messageQueue.entries()) {
      stats.agentQueues[agentId] = queue.length;
      stats.totalQueued += queue.length;
    }

    // Count message types in log
    for (const msg of this.messageLog.slice(-1000)) {
      const type = msg.type;
      stats.messageTypeDistribution[type] = (stats.messageTypeDistribution[type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Validate message format
   */
  private validateMessage(message: J4CMessage): boolean {
    if (!message.messageId || !message.type || !message.sourceAgentId) {
      return false;
    }

    if (message.priority < MessagePriority.CRITICAL || message.priority > MessagePriority.LOW) {
      return false;
    }

    if (message.expiresAt <= Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Log message to history
   */
  private logMessage(message: J4CMessage): void {
    this.messageLog.push(message);

    // Keep only recent messages
    if (this.messageLog.length > 10000) {
      this.messageLog = this.messageLog.slice(-5000);
    }

    // Periodically save to disk
    if (this.messageLog.length % 100 === 0) {
      this.persistMessageLog();
    }
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenance(): void {
    // Check agent health every minute
    setInterval(() => {
      this.checkAgentHealth();
    }, 60 * 1000);

    // Clean old messages every hour
    setInterval(() => {
      this.cleanOldMessages();
    }, 60 * 60 * 1000);

    // Persist state every 5 minutes
    setInterval(() => {
      this.persistRegistry();
      this.persistMessageLog();
    }, 5 * 60 * 1000);
  }

  /**
   * Check agent health
   */
  private checkAgentHealth(): void {
    const now = Date.now();
    const healthyThreshold = 5 * 60 * 1000; // 5 minutes

    for (const agent of this.agentRegistry.values()) {
      const timeSinceHeartbeat = now - agent.lastHeartbeat;
      agent.isHealthy = timeSinceHeartbeat < healthyThreshold;

      if (!agent.isHealthy) {
        this.emit('agent:unhealthy', agent.agentId);
      }
    }
  }

  /**
   * Clean old messages
   */
  private cleanOldMessages(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean message log
    const beforeSize = this.messageLog.length;
    this.messageLog = this.messageLog.filter((msg) => msg.expiresAt > now);
    cleanedCount += beforeSize - this.messageLog.length;

    // Clean queues
    for (const queue of this.messageQueue.values()) {
      const beforeQueueSize = queue.length;
      const filtered = queue.filter((msg) => msg.expiresAt > now);
      const removed = beforeQueueSize - filtered.length;
      Object.assign(queue, filtered); // Update in place isn't ideal, reassign
      cleanedCount += removed;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired messages`);
    }
  }

  /**
   * Ensure required directories
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Load registry from disk
   */
  private loadRegistry(): void {
    if (fs.existsSync(this.registryFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.registryFile, 'utf-8'));
        for (const agent of data) {
          this.agentRegistry.set(agent.agentId, agent);
        }
      } catch (error) {
        console.warn('Could not load agent registry');
      }
    }
  }

  /**
   * Persist registry to disk
   */
  private persistRegistry(): void {
    const data = Array.from(this.agentRegistry.values());
    fs.writeFileSync(this.registryFile, JSON.stringify(data, null, 2));
  }

  /**
   * Persist message log to disk
   */
  private persistMessageLog(): void {
    fs.writeFileSync(this.messageLogFile, JSON.stringify(this.messageLog, null, 2));
  }
}

/**
 * Agent communication helper
 */
export class AgentCommunicationHelper {
  constructor(private messageBus: J4CMessageBus) {}

  /**
   * Create a learning pattern message
   */
  public createLearningPatternMessage(
    sourceAgentId: string,
    sourceAgentName: string,
    pattern: Record<string, any>
  ): J4CMessage {
    return {
      messageId: this.generateId(),
      type: MessageType.LEARNING_PATTERN,
      priority: MessagePriority.HIGH,
      sourceAgentId,
      sourceAgentName,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      payload: { pattern },
      metadata: {
        retries: 0,
        acknowledged: false,
      },
    };
  }

  /**
   * Create a recommendation request message
   */
  public createRecommendationRequest(
    sourceAgentId: string,
    sourceAgentName: string,
    targetAgentId: string,
    targetAgentName: string,
    query: Record<string, any>
  ): J4CMessage {
    return {
      messageId: this.generateId(),
      type: MessageType.RECOMMENDATION_REQUEST,
      priority: MessagePriority.NORMAL,
      sourceAgentId,
      sourceAgentName,
      targetAgentId,
      targetAgentName,
      timestamp: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      payload: { query },
      metadata: {
        correlationId: this.generateId(),
        retries: 0,
        acknowledged: false,
      },
    };
  }

  /**
   * Create a capability update message
   */
  public createCapabilityUpdateMessage(
    sourceAgentId: string,
    sourceAgentName: string,
    capabilities: string[]
  ): J4CMessage {
    return {
      messageId: this.generateId(),
      type: MessageType.CAPABILITY_UPDATE,
      priority: MessagePriority.NORMAL,
      sourceAgentId,
      sourceAgentName,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      payload: { capabilities },
      metadata: {
        retries: 0,
        acknowledged: false,
      },
    };
  }

  /**
   * Create a performance report message
   */
  public createPerformanceReportMessage(
    sourceAgentId: string,
    sourceAgentName: string,
    metrics: Record<string, any>
  ): J4CMessage {
    return {
      messageId: this.generateId(),
      type: MessageType.PERFORMANCE_REPORT,
      priority: MessagePriority.NORMAL,
      sourceAgentId,
      sourceAgentName,
      timestamp: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      payload: { metrics },
      metadata: {
        retries: 0,
        acknowledged: false,
      },
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Example usage and testing
 */
if (require.main === module) {
  const messageBus = new J4CMessageBus();
  const helper = new AgentCommunicationHelper(messageBus);

  // Register agents
  const agents: AgentRegistration[] = [
    {
      agentId: 'agent-001',
      agentName: 'CodeReviewAgent',
      category: 'code_quality',
      capabilities: ['code_review', 'compliance_check'],
      version: '1.0.0',
      lastHeartbeat: Date.now(),
      isHealthy: true,
      learningProfile: {
        successRate: 0.92,
        qualityScore: 88,
        reliabilityScore: 95,
      },
    },
    {
      agentId: 'agent-002',
      agentName: 'SecurityAgent',
      category: 'security',
      capabilities: ['vulnerability_scan', 'security_audit'],
      version: '1.0.0',
      lastHeartbeat: Date.now(),
      isHealthy: true,
      learningProfile: {
        successRate: 0.88,
        qualityScore: 85,
        reliabilityScore: 90,
      },
    },
  ];

  for (const agent of agents) {
    messageBus.registerAgent(agent);
  }

  // Send test messages
  const patternMsg = helper.createLearningPatternMessage('agent-001', 'CodeReviewAgent', {
    pattern: 'TypeScript strict mode improves quality',
    frequency: 15,
    confidence: 0.92,
  });

  messageBus.sendMessage(patternMsg);

  const recMsg = helper.createRecommendationRequest('agent-001', 'CodeReviewAgent', 'agent-002', 'SecurityAgent', {
    query: 'Security best practices for authentication',
  });

  messageBus.sendMessage(recMsg);

  // Broadcast capability update
  const capMsg = helper.createCapabilityUpdateMessage('agent-001', 'CodeReviewAgent', [
    'code_review',
    'compliance_check',
    'performance_analysis',
  ]);

  messageBus.broadcastMessage(capMsg);

  // Print stats
  setTimeout(() => {
    console.log('\n📊 Message Bus Statistics:');
    const stats = messageBus.getMessageStats();
    console.log('Total Queued:', stats.totalQueued);
    console.log('Total Logged:', stats.totalLogged);
    console.log('Agent Queues:', stats.agentQueues);
    console.log('Message Types:', stats.messageTypeDistribution);

    console.log('\n👥 Registered Agents:');
    for (const agent of messageBus.getAgentRegistry()) {
      console.log(`- ${agent.agentName} (${agent.agentId})`);
    }
  }, 500);
}

export default J4CMessageBus;
