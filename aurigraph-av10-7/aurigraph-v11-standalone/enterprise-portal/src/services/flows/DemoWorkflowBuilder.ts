// Demo Workflow Builder - Visual flow creation for interactive demos
import { FlowExecutor, FlowNode, FlowContext, FlowExecutionResult, FlowDefinition, FlowType, NodeType } from './FlowEngine';

export enum DemoActionType {
  CREATE_TRANSACTION = 'CREATE_TRANSACTION',
  DEPLOY_CONTRACT = 'DEPLOY_CONTRACT',
  INVOKE_CONTRACT = 'INVOKE_CONTRACT',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  WAIT = 'WAIT',
  VISUALIZE_DATA = 'VISUALIZE_DATA',
  SIMULATE_NETWORK = 'SIMULATE_NETWORK',
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: DemoActionType;
  config: Record<string, any>;
  visualization?: 'chart' | 'network' | 'merkle' | 'timeline';
}

/** Demo Transaction Creator */
export class DemoTransactionExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const txCount = node.config.transactionCount || 1;
    context.log(`Creating ${txCount} demo transactions...`);
    await new Promise(r => setTimeout(r, 100));

    const transactions = Array.from({ length: txCount }, (_, i) => ({
      id: `tx_${Date.now()}_${i}`,
      from: `0x${Math.random().toString(16).substr(2, 40)}`,
      to: `0x${Math.random().toString(16).substr(2, 40)}`,
      amount: Math.floor(Math.random() * 1000) + 1,
      timestamp: new Date(),
    }));

    context.setVariable('demoTransactions', transactions);
    context.log(`✅ Created ${txCount} demo transactions`);

    return {
      success: true,
      output: { transactions, count: txCount },
      logs: [`Created ${txCount} demo transactions`],
    };
  }
}

/** Demo Contract Deployment */
export class DemoContractDeployExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const contractName = node.config.contractName || 'DemoContract';
    context.log(`Deploying demo contract: ${contractName}...`);
    await new Promise(r => setTimeout(r, 150));

    const contract = {
      id: `contract_${Date.now()}`,
      name: contractName,
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      deployedAt: new Date(),
    };

    context.setVariable('demoContract', contract);
    context.log(`✅ Demo contract deployed: ${contract.address}`);

    return {
      success: true,
      output: contract,
      logs: [`Deployed demo contract: ${contractName}`, `Address: ${contract.address}`],
    };
  }
}

/** Demo Message Display */
export class DemoMessageExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const message = node.config.message || 'Demo step completed';
    const duration = node.config.duration || 2000;

    context.log(`Displaying message: "${message}"`);
    await new Promise(r => setTimeout(r, duration));

    return {
      success: true,
      output: { message, displayed: true },
      logs: [`Displayed message: "${message}" for ${duration}ms`],
    };
  }
}

/** Demo Wait/Delay */
export class DemoWaitExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const waitTime = node.config.waitTime || 1000;
    context.log(`Waiting for ${waitTime}ms...`);
    await new Promise(r => setTimeout(r, waitTime));

    context.log(`✅ Wait completed`);
    return {
      success: true,
      output: { waited: waitTime },
      logs: [`Waited ${waitTime}ms`],
    };
  }
}

/** Demo Data Visualization */
export class DemoVisualizeExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const visualizationType = node.config.type || 'chart';
    const data = context.getVariable('visualizationData') || this.generateMockData();

    context.log(`Creating ${visualizationType} visualization...`);
    await new Promise(r => setTimeout(r, 200));

    const visualization = {
      type: visualizationType,
      data,
      timestamp: new Date(),
    };

    context.setVariable('currentVisualization', visualization);
    context.log(`✅ Created ${visualizationType} visualization`);

    return {
      success: true,
      output: visualization,
      logs: [`Created ${visualizationType} visualization with ${data.length} data points`],
    };
  }

  private generateMockData(): any[] {
    return Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: Math.floor(Math.random() * 100),
      label: `Point ${i + 1}`,
    }));
  }
}

/** Demo Network Simulation */
export class DemoNetworkSimulationExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const nodeCount = node.config.nodeCount || 5;
    context.log(`Simulating network with ${nodeCount} nodes...`);
    await new Promise(r => setTimeout(r, 250));

    const network = {
      nodes: Array.from({ length: nodeCount }, (_, i) => ({
        id: `node_${i + 1}`,
        type: i === 0 ? 'leader' : 'follower',
        status: 'active',
      })),
      connections: Array.from({ length: nodeCount - 1 }, (_, i) => ({
        from: 'node_1',
        to: `node_${i + 2}`,
      })),
    };

    context.setVariable('networkSimulation', network);
    context.log(`✅ Network simulation created with ${nodeCount} nodes`);

    return {
      success: true,
      output: network,
      logs: [`Simulated network: ${nodeCount} nodes, ${network.connections.length} connections`],
    };
  }
}

/**
 * Demo Workflow Templates
 */

/** Create Basic Demo Flow */
export function createBasicDemoFlow(title: string): FlowDefinition {
  return {
    id: `demo_${Date.now()}`,
    name: title,
    type: FlowType.DEMO_WORKFLOW,
    description: 'Interactive demo workflow with visualization',
    version: '1.0',
    nodes: [
      { id: 'start', type: NodeType.START, name: 'Start Demo', config: {}, position: { x: 100, y: 200 }, inputs: [], outputs: ['intro'] },
      { id: 'intro', type: NodeType.TASK, name: 'Introduction', config: { message: 'Welcome to the demo!', duration: 2000 }, position: { x: 300, y: 200 }, inputs: ['start'], outputs: ['create_tx'] },
      { id: 'create_tx', type: NodeType.TASK, name: 'Create Transactions', config: { transactionCount: 5 }, position: { x: 500, y: 200 }, inputs: ['intro'], outputs: ['visualize'] },
      { id: 'visualize', type: NodeType.TASK, name: 'Visualize Data', config: { type: 'chart' }, position: { x: 700, y: 200 }, inputs: ['create_tx'], outputs: ['end'] },
      { id: 'end', type: NodeType.END, name: 'Demo Complete', config: {}, position: { x: 900, y: 200 }, inputs: ['visualize'], outputs: [] },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'intro' },
      { id: 'c2', source: 'intro', target: 'create_tx' },
      { id: 'c3', source: 'create_tx', target: 'visualize' },
      { id: 'c4', source: 'visualize', target: 'end' },
    ],
    variables: {},
    metadata: { demoType: 'basic' },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}

/** Create Blockchain Demo Flow */
export function createBlockchainDemoFlow(): FlowDefinition {
  return {
    id: `blockchain_demo_${Date.now()}`,
    name: 'Blockchain Demo Workflow',
    type: FlowType.DEMO_WORKFLOW,
    description: 'Complete blockchain demo with contracts, transactions, and consensus',
    version: '1.0',
    nodes: [
      { id: 'start', type: NodeType.START, name: 'Start', config: {}, position: { x: 100, y: 300 }, inputs: [], outputs: ['network'] },
      { id: 'network', type: NodeType.TASK, name: 'Setup Network', config: { nodeCount: 5 }, position: { x: 300, y: 300 }, inputs: ['start'], outputs: ['deploy'] },
      { id: 'deploy', type: NodeType.TASK, name: 'Deploy Contract', config: { contractName: 'DemoToken' }, position: { x: 500, y: 300 }, inputs: ['network'], outputs: ['wait1'] },
      { id: 'wait1', type: NodeType.TASK, name: 'Wait', config: { waitTime: 1000 }, position: { x: 700, y: 300 }, inputs: ['deploy'], outputs: ['transactions'] },
      { id: 'transactions', type: NodeType.TASK, name: 'Create Transactions', config: { transactionCount: 10 }, position: { x: 900, y: 300 }, inputs: ['wait1'], outputs: ['parallel'] },
      { id: 'parallel', type: NodeType.PARALLEL, name: 'Parallel Demo', config: {}, position: { x: 1100, y: 300 }, inputs: ['transactions'], outputs: ['viz_network', 'viz_merkle'] },
      { id: 'viz_network', type: NodeType.TASK, name: 'Network Viz', config: { type: 'network' }, position: { x: 1300, y: 200 }, inputs: ['parallel'], outputs: ['merge'] },
      { id: 'viz_merkle', type: NodeType.TASK, name: 'Merkle Tree Viz', config: { type: 'merkle' }, position: { x: 1300, y: 400 }, inputs: ['parallel'], outputs: ['merge'] },
      { id: 'merge', type: NodeType.MERGE, name: 'Merge', config: {}, position: { x: 1500, y: 300 }, inputs: ['viz_network', 'viz_merkle'], outputs: ['complete'] },
      { id: 'complete', type: NodeType.TASK, name: 'Demo Complete', config: { message: 'Blockchain demo completed successfully!', duration: 3000 }, position: { x: 1700, y: 300 }, inputs: ['merge'], outputs: ['end'] },
      { id: 'end', type: NodeType.END, name: 'End', config: {}, position: { x: 1900, y: 300 }, inputs: ['complete'], outputs: [] },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'network' },
      { id: 'c2', source: 'network', target: 'deploy' },
      { id: 'c3', source: 'deploy', target: 'wait1' },
      { id: 'c4', source: 'wait1', target: 'transactions' },
      { id: 'c5', source: 'transactions', target: 'parallel' },
      { id: 'c6', source: 'parallel', target: 'viz_network' },
      { id: 'c7', source: 'parallel', target: 'viz_merkle' },
      { id: 'c8', source: 'viz_network', target: 'merge' },
      { id: 'c9', source: 'viz_merkle', target: 'merge' },
      { id: 'c10', source: 'merge', target: 'complete' },
      { id: 'c11', source: 'complete', target: 'end' },
    ],
    variables: {},
    metadata: { demoType: 'blockchain', features: ['network', 'contracts', 'transactions', 'visualization'] },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}

/** Create Interactive Tutorial Flow */
export function createInteractiveTutorialFlow(steps: DemoStep[]): FlowDefinition {
  const nodes: FlowNode[] = [
    {
      id: 'start',
      type: NodeType.START,
      name: 'Start Tutorial',
      config: {},
      position: { x: 100, y: 200 },
      inputs: [],
      outputs: steps.length > 0 ? [steps[0].id] : ['end'],
    },
  ];

  // Add step nodes
  steps.forEach((step, index) => {
    nodes.push({
      id: step.id,
      type: NodeType.TASK,
      name: step.title,
      description: step.description,
      config: { action: step.action, ...step.config },
      position: { x: 300 + index * 200, y: 200 },
      inputs: index === 0 ? ['start'] : [steps[index - 1].id],
      outputs: index < steps.length - 1 ? [steps[index + 1].id] : ['end'],
    });
  });

  // Add end node
  nodes.push({
    id: 'end',
    type: NodeType.END,
    name: 'Tutorial Complete',
    config: {},
    position: { x: 300 + steps.length * 200, y: 200 },
    inputs: steps.length > 0 ? [steps[steps.length - 1].id] : ['start'],
    outputs: [],
  });

  // Create connections
  const connections = [];
  if (steps.length > 0) {
    connections.push({ id: 'c_start', source: 'start', target: steps[0].id });

    steps.forEach((step, index) => {
      if (index < steps.length - 1) {
        connections.push({ id: `c_${index}`, source: step.id, target: steps[index + 1].id });
      } else {
        connections.push({ id: `c_${index}`, source: step.id, target: 'end' });
      }
    });
  } else {
    connections.push({ id: 'c_start', source: 'start', target: 'end' });
  }

  return {
    id: `tutorial_${Date.now()}`,
    name: 'Interactive Tutorial',
    type: FlowType.DEMO_WORKFLOW,
    description: 'Step-by-step interactive tutorial flow',
    version: '1.0',
    nodes,
    connections,
    variables: {},
    metadata: { demoType: 'tutorial', stepCount: steps.length },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}
