// Flow Engine - Core workflow orchestration framework
// Supports: Smart Contracts, Transactions, Consensus, Business Process, Data Pipeline, CI/CD, Demo Workflows

export enum FlowType {
  SMART_CONTRACT = 'SMART_CONTRACT',
  TRANSACTION = 'TRANSACTION',
  CONSENSUS = 'CONSENSUS',
  BUSINESS_PROCESS = 'BUSINESS_PROCESS',
  DATA_PIPELINE = 'DATA_PIPELINE',
  CICD_WORKFLOW = 'CICD_WORKFLOW',
  DEMO_WORKFLOW = 'DEMO_WORKFLOW',
}

export enum FlowStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NodeType {
  START = 'START',
  END = 'END',
  TASK = 'TASK',
  DECISION = 'DECISION',
  PARALLEL = 'PARALLEL',
  MERGE = 'MERGE',
  SUBPROCESS = 'SUBPROCESS',
  EVENT = 'EVENT',
  GATEWAY = 'GATEWAY',
}

export interface FlowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  inputs: string[]; // Incoming connection IDs
  outputs: string[]; // Outgoing connection IDs
  status?: FlowStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface FlowConnection {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  condition?: string; // For decision nodes
  label?: string;
}

export interface FlowDefinition {
  id: string;
  name: string;
  type: FlowType;
  description: string;
  version: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  variables: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FlowInstance {
  id: string;
  definitionId: string;
  definition: FlowDefinition;
  status: FlowStatus;
  currentNodes: string[]; // Active node IDs
  executionHistory: FlowExecutionRecord[];
  variables: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  metadata: Record<string, any>;
}

export interface FlowExecutionRecord {
  nodeId: string;
  nodeName: string;
  status: FlowStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  logs: string[];
}

export interface FlowExecutor {
  execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult>;
}

export interface FlowContext {
  instance: FlowInstance;
  variables: Record<string, any>;
  metadata: Record<string, any>;
  log: (message: string) => void;
  getVariable: (key: string) => any;
  setVariable: (key: string, value: any) => void;
}

export interface FlowExecutionResult {
  success: boolean;
  output?: any;
  nextNodes?: string[];
  error?: string;
  logs: string[];
}

/**
 * Core Flow Engine - State machine and execution orchestrator
 */
export class FlowEngine {
  private executors: Map<string, FlowExecutor> = new Map();
  private instances: Map<string, FlowInstance> = new Map();

  /**
   * Register a custom executor for specific node types
   */
  registerExecutor(nodeType: string, executor: FlowExecutor): void {
    this.executors.set(nodeType, executor);
    console.log(`✅ Registered executor for node type: ${nodeType}`);
  }

  /**
   * Create a new flow instance from definition
   */
  createInstance(definition: FlowDefinition, variables?: Record<string, any>): FlowInstance {
    const instance: FlowInstance = {
      id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      definitionId: definition.id,
      definition,
      status: FlowStatus.READY,
      currentNodes: [],
      executionHistory: [],
      variables: variables || {},
      metadata: {},
    };

    this.instances.set(instance.id, instance);
    console.log(`✅ Created flow instance: ${instance.id} (${definition.name})`);
    return instance;
  }

  /**
   * Start flow execution
   */
  async startFlow(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Flow instance not found: ${instanceId}`);
    }

    if (instance.status !== FlowStatus.READY) {
      throw new Error(`Flow cannot be started. Current status: ${instance.status}`);
    }

    instance.status = FlowStatus.RUNNING;
    instance.startTime = new Date();

    // Find START nodes
    const startNodes = instance.definition.nodes.filter((n) => n.type === NodeType.START);
    if (startNodes.length === 0) {
      throw new Error('Flow has no START node');
    }

    console.log(`▶️ Starting flow: ${instance.definition.name}`);

    // Execute START nodes
    for (const startNode of startNodes) {
      await this.executeNode(instance, startNode);
    }
  }

  /**
   * Execute a single flow node
   */
  private async executeNode(instance: FlowInstance, node: FlowNode): Promise<void> {
    console.log(`🔄 Executing node: ${node.name} (${node.type})`);

    const context: FlowContext = {
      instance,
      variables: instance.variables,
      metadata: instance.metadata,
      log: (message: string) => {
        console.log(`  [${node.name}] ${message}`);
      },
      getVariable: (key: string) => instance.variables[key],
      setVariable: (key: string, value: any) => {
        instance.variables[key] = value;
      },
    };

    const record: FlowExecutionRecord = {
      nodeId: node.id,
      nodeName: node.name,
      status: FlowStatus.RUNNING,
      startTime: new Date(),
      logs: [],
    };

    try {
      // Get executor for node type
      const executor = this.executors.get(node.type) || this.getDefaultExecutor(node.type);

      // Execute node
      const result = await executor.execute(node, context);

      record.status = result.success ? FlowStatus.COMPLETED : FlowStatus.FAILED;
      record.endTime = new Date();
      record.duration = record.endTime.getTime() - record.startTime.getTime();
      record.output = result.output;
      record.error = result.error;
      record.logs = result.logs;

      instance.executionHistory.push(record);

      if (result.success) {
        console.log(`✅ Node completed: ${node.name}`);

        // Move to next nodes
        if (result.nextNodes && result.nextNodes.length > 0) {
          for (const nextNodeId of result.nextNodes) {
            const nextNode = instance.definition.nodes.find((n) => n.id === nextNodeId);
            if (nextNode) {
              await this.executeNode(instance, nextNode);
            }
          }
        } else {
          // Follow connections
          const outgoingConnections = instance.definition.connections.filter(
            (c) => c.source === node.id
          );

          for (const conn of outgoingConnections) {
            const nextNode = instance.definition.nodes.find((n) => n.id === conn.target);
            if (nextNode) {
              await this.executeNode(instance, nextNode);
            }
          }
        }

        // Check if flow is complete
        this.checkFlowCompletion(instance);
      } else {
        console.error(`❌ Node failed: ${node.name} - ${result.error}`);
        instance.status = FlowStatus.FAILED;
        instance.error = result.error;
      }
    } catch (error: any) {
      console.error(`❌ Node execution error: ${node.name}`, error);
      record.status = FlowStatus.FAILED;
      record.endTime = new Date();
      record.duration = record.endTime.getTime() - record.startTime.getTime();
      record.error = error.message;
      instance.executionHistory.push(record);
      instance.status = FlowStatus.FAILED;
      instance.error = error.message;
    }
  }

  /**
   * Check if flow execution is complete
   */
  private checkFlowCompletion(instance: FlowInstance): void {
    const endNodes = instance.definition.nodes.filter((n) => n.type === NodeType.END);
    const executedEndNodes = instance.executionHistory.filter(
      (r) => endNodes.some((n) => n.id === r.nodeId) && r.status === FlowStatus.COMPLETED
    );

    if (executedEndNodes.length === endNodes.length) {
      instance.status = FlowStatus.COMPLETED;
      instance.endTime = new Date();
      instance.duration = instance.endTime.getTime() - (instance.startTime?.getTime() || 0);
      console.log(`✅ Flow completed: ${instance.definition.name} (${instance.duration}ms)`);
    }
  }

  /**
   * Get default executor for built-in node types
   */
  private getDefaultExecutor(nodeType: string): FlowExecutor {
    switch (nodeType) {
      case NodeType.START:
        return new StartNodeExecutor();
      case NodeType.END:
        return new EndNodeExecutor();
      case NodeType.TASK:
        return new TaskNodeExecutor();
      case NodeType.DECISION:
        return new DecisionNodeExecutor();
      case NodeType.PARALLEL:
        return new ParallelNodeExecutor();
      case NodeType.MERGE:
        return new MergeNodeExecutor();
      default:
        return new DefaultNodeExecutor();
    }
  }

  /**
   * Get flow instance status
   */
  getInstanceStatus(instanceId: string): FlowInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Pause flow execution
   */
  pauseFlow(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === FlowStatus.RUNNING) {
      instance.status = FlowStatus.PAUSED;
      console.log(`⏸️ Flow paused: ${instance.definition.name}`);
    }
  }

  /**
   * Resume flow execution
   */
  async resumeFlow(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === FlowStatus.PAUSED) {
      instance.status = FlowStatus.RUNNING;
      console.log(`▶️ Flow resumed: ${instance.definition.name}`);
      // Resume from current nodes
      for (const nodeId of instance.currentNodes) {
        const node = instance.definition.nodes.find((n) => n.id === nodeId);
        if (node) {
          await this.executeNode(instance, node);
        }
      }
    }
  }

  /**
   * Cancel flow execution
   */
  cancelFlow(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = FlowStatus.CANCELLED;
      instance.endTime = new Date();
      console.log(`🛑 Flow cancelled: ${instance.definition.name}`);
    }
  }
}

// Default Node Executors

class StartNodeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    context.log('Flow started');
    return {
      success: true,
      logs: ['Flow execution started'],
    };
  }
}

class EndNodeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    context.log('Flow ended');
    return {
      success: true,
      logs: ['Flow execution ended'],
    };
  }
}

class TaskNodeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    context.log(`Executing task: ${node.config.action || 'default'}`);

    // Simulate task execution
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      output: { result: 'Task completed' },
      logs: [`Task ${node.name} executed successfully`],
    };
  }
}

class DecisionNodeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const condition = node.config.condition;
    const result = this.evaluateCondition(condition, context);

    context.log(`Decision: ${condition} = ${result}`);

    const nextNodes = node.config.branches[result ? 'true' : 'false'];

    return {
      success: true,
      nextNodes: nextNodes ? [nextNodes] : [],
      logs: [`Decision evaluated: ${result}`],
    };
  }

  private evaluateCondition(condition: string, context: FlowContext): boolean {
    // Simple condition evaluation (can be enhanced)
    try {
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch {
      return false;
    }
  }
}

class ParallelNodeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    context.log('Starting parallel execution');
    return {
      success: true,
      logs: ['Parallel gateway activated'],
    };
  }
}

class MergeNodeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    context.log('Merging parallel branches');
    return {
      success: true,
      logs: ['Branches merged successfully'],
    };
  }
}

class DefaultNodeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    context.log(`Executing node: ${node.type}`);
    return {
      success: true,
      logs: [`Node ${node.name} executed with default executor`],
    };
  }
}

// Export singleton instance
export const flowEngine = new FlowEngine();
