// Demo Service - Handles demo registration, management, and Merkle tree verification
import {
  createDemoMerkleTree,
  verifyDemoIntegrity,
  MerkleProof,
  MerkleTree,
} from '../utils/merkleTree';

export interface Channel {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'CONSORTIUM';
}

export interface Node {
  id: string;
  name: string;
  type: 'VALIDATOR' | 'BUSINESS' | 'SLIM';
  endpoint: string;
  channelId: string;
}

export interface DemoRegistration {
  userName: string;
  userEmail: string;
  demoName: string;
  description: string;
  channels: Channel[];
  validators: Node[];
  businessNodes: Node[];
  slimNodes: Node[];
}

export interface DemoInstance extends DemoRegistration {
  id: string;
  status: 'RUNNING' | 'STOPPED' | 'PENDING' | 'ERROR';
  createdAt: Date;
  lastActivity: Date;
  transactionCount: number;
  merkleRoot: string;
}

export interface MerkleTreeInfo {
  root: string;
  leafCount: number;
  treeDepth: number;
  created: Date;
  verified: boolean;
}

/**
 * Demo Service Class
 */
class DemoServiceClass {
  private demos: Map<string, DemoInstance> = new Map();
  private merkleTrees: Map<string, MerkleTree> = new Map();

  /**
   * Register a new demo
   */
  async registerDemo(registration: DemoRegistration): Promise<DemoInstance> {
    // Generate unique ID
    const id = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date();

    // Create demo instance
    const demo: DemoInstance = {
      ...registration,
      id,
      status: 'PENDING',
      createdAt,
      lastActivity: createdAt,
      transactionCount: 0,
      merkleRoot: '',
    };

    // Generate Merkle tree and root
    const { tree, root } = await createDemoMerkleTree(demo);
    demo.merkleRoot = root;

    // Store demo and Merkle tree
    this.demos.set(id, demo);
    this.merkleTrees.set(id, tree);

    console.log(`✅ Demo registered: ${demo.demoName} (ID: ${id})`);
    console.log(`🌳 Merkle root: ${root}`);

    return demo;
  }

  /**
   * Get all demos
   */
  getAllDemos(): DemoInstance[] {
    return Array.from(this.demos.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get demo by ID
   */
  getDemo(id: string): DemoInstance | undefined {
    return this.demos.get(id);
  }

  /**
   * Start a demo
   */
  async startDemo(id: string): Promise<DemoInstance> {
    const demo = this.demos.get(id);
    if (!demo) {
      throw new Error(`Demo not found: ${id}`);
    }

    demo.status = 'RUNNING';
    demo.lastActivity = new Date();

    console.log(`▶️ Demo started: ${demo.demoName}`);

    return demo;
  }

  /**
   * Stop a demo
   */
  async stopDemo(id: string): Promise<DemoInstance> {
    const demo = this.demos.get(id);
    if (!demo) {
      throw new Error(`Demo not found: ${id}`);
    }

    demo.status = 'STOPPED';
    demo.lastActivity = new Date();

    console.log(`⏸️ Demo stopped: ${demo.demoName}`);

    return demo;
  }

  /**
   * Delete a demo
   */
  async deleteDemo(id: string): Promise<void> {
    const demo = this.demos.get(id);
    if (!demo) {
      throw new Error(`Demo not found: ${id}`);
    }

    // Stop demo if running
    if (demo.status === 'RUNNING') {
      await this.stopDemo(id);
    }

    // Remove demo and Merkle tree
    this.demos.delete(id);
    this.merkleTrees.delete(id);

    console.log(`🗑️ Demo deleted: ${demo.demoName}`);
  }

  /**
   * Increment transaction count (simulated)
   */
  incrementTransactionCount(id: string, count: number = 1): void {
    const demo = this.demos.get(id);
    if (demo) {
      demo.transactionCount += count;
      demo.lastActivity = new Date();
    }
  }

  /**
   * Get Merkle tree for a demo
   */
  getMerkleTree(id: string): MerkleTree | undefined {
    return this.merkleTrees.get(id);
  }

  /**
   * Get Merkle tree information
   */
  getMerkleTreeInfo(id: string): MerkleTreeInfo | null {
    const demo = this.demos.get(id);
    const tree = this.merkleTrees.get(id);

    if (!demo || !tree) {
      return null;
    }

    const layers = tree.getLayers();

    return {
      root: demo.merkleRoot,
      leafCount: tree.getLeafCount(),
      treeDepth: layers.length,
      created: demo.createdAt,
      verified: true,
    };
  }

  /**
   * Verify demo integrity
   */
  async verifyDemo(id: string): Promise<{ valid: boolean; message: string }> {
    const demo = this.demos.get(id);
    if (!demo) {
      return { valid: false, message: 'Demo not found' };
    }

    const expectedRoot = demo.merkleRoot;
    const { valid, actualRoot } = await verifyDemoIntegrity(demo, expectedRoot);

    if (valid) {
      return {
        valid: true,
        message: 'Demo integrity verified successfully',
      };
    } else {
      return {
        valid: false,
        message: `Integrity check failed. Expected: ${expectedRoot}, Got: ${actualRoot}`,
      };
    }
  }

  /**
   * Get Merkle proof for a specific component (channel or node)
   */
  async getMerkleProof(demoId: string, componentId: string): Promise<MerkleProof | null> {
    const demo = this.demos.get(demoId);
    const tree = this.merkleTrees.get(demoId);

    if (!demo || !tree) {
      return null;
    }

    // Find the leaf index for the component
    // This is simplified - in production, you'd maintain a mapping
    const allComponents = [
      { id: 'demo-config', type: 'config' },
      { id: 'demo-metadata', type: 'metadata' },
      ...demo.channels.map(c => ({ id: c.id, type: 'channel' })),
      ...demo.validators.map(n => ({ id: n.id, type: 'validator' })),
      ...demo.businessNodes.map(n => ({ id: n.id, type: 'business' })),
      ...demo.slimNodes.map(n => ({ id: n.id, type: 'slim' })),
    ];

    const componentIndex = allComponents.findIndex(c => c.id === componentId);
    if (componentIndex === -1) {
      return null;
    }

    return tree.getProof(componentIndex);
  }

  /**
   * Get demo statistics
   */
  getStatistics() {
    const allDemos = this.getAllDemos();

    return {
      totalDemos: allDemos.length,
      runningDemos: allDemos.filter(d => d.status === 'RUNNING').length,
      stoppedDemos: allDemos.filter(d => d.status === 'STOPPED').length,
      pendingDemos: allDemos.filter(d => d.status === 'PENDING').length,
      totalNodes: allDemos.reduce(
        (sum, d) => sum + d.validators.length + d.businessNodes.length + d.slimNodes.length,
        0
      ),
      totalTransactions: allDemos.reduce((sum, d) => sum + d.transactionCount, 0),
      totalChannels: allDemos.reduce((sum, d) => sum + d.channels.length, 0),
    };
  }

  /**
   * Initialize with sample demos (for testing)
   */
  async initializeSampleDemos(): Promise<void> {
    // Sample Demo 1: Public Network
    await this.registerDemo({
      userName: 'Alice Johnson',
      userEmail: 'alice@example.com',
      demoName: 'Public Network Demo',
      description: 'Demonstration of a public blockchain network with multiple validators',
      channels: [
        { id: 'ch1', name: 'Main Channel', type: 'PUBLIC' },
      ],
      validators: [
        { id: 'v1', name: 'Validator-1', type: 'VALIDATOR', endpoint: 'https://val1.demo.io', channelId: 'ch1' },
        { id: 'v2', name: 'Validator-2', type: 'VALIDATOR', endpoint: 'https://val2.demo.io', channelId: 'ch1' },
        { id: 'v3', name: 'Validator-3', type: 'VALIDATOR', endpoint: 'https://val3.demo.io', channelId: 'ch1' },
      ],
      businessNodes: [
        { id: 'b1', name: 'Business-1', type: 'BUSINESS', endpoint: 'https://biz1.demo.io', channelId: 'ch1' },
        { id: 'b2', name: 'Business-2', type: 'BUSINESS', endpoint: 'https://biz2.demo.io', channelId: 'ch1' },
      ],
      slimNodes: [
        { id: 's1', name: 'Slim-1', type: 'SLIM', endpoint: 'https://slim1.demo.io', channelId: 'ch1' },
      ],
    });

    // Sample Demo 2: Consortium Network
    await this.registerDemo({
      userName: 'Bob Smith',
      userEmail: 'bob@example.com',
      demoName: 'Consortium Network Demo',
      description: 'Private consortium network for enterprise use',
      channels: [
        { id: 'ch2', name: 'Enterprise Channel', type: 'CONSORTIUM' },
        { id: 'ch3', name: 'Finance Channel', type: 'PRIVATE' },
      ],
      validators: [
        { id: 'v4', name: 'Enterprise-Validator-1', type: 'VALIDATOR', endpoint: 'https://ent-val1.demo.io', channelId: 'ch2' },
        { id: 'v5', name: 'Enterprise-Validator-2', type: 'VALIDATOR', endpoint: 'https://ent-val2.demo.io', channelId: 'ch2' },
      ],
      businessNodes: [
        { id: 'b3', name: 'Finance-Node-1', type: 'BUSINESS', endpoint: 'https://fin1.demo.io', channelId: 'ch3' },
        { id: 'b4', name: 'Finance-Node-2', type: 'BUSINESS', endpoint: 'https://fin2.demo.io', channelId: 'ch3' },
        { id: 'b5', name: 'Enterprise-Node', type: 'BUSINESS', endpoint: 'https://ent1.demo.io', channelId: 'ch2' },
      ],
      slimNodes: [
        { id: 's2', name: 'Monitor-1', type: 'SLIM', endpoint: 'https://mon1.demo.io', channelId: 'ch2' },
        { id: 's3', name: 'Monitor-2', type: 'SLIM', endpoint: 'https://mon2.demo.io', channelId: 'ch3' },
      ],
    });

    // Start first demo and simulate some transactions
    const demos = this.getAllDemos();
    if (demos.length > 0) {
      await this.startDemo(demos[0].id);
      this.incrementTransactionCount(demos[0].id, 1234);
    }

    console.log(`✅ Initialized ${demos.length} sample demos`);
  }

  /**
   * Clear all demos (for testing)
   */
  clearAllDemos(): void {
    this.demos.clear();
    this.merkleTrees.clear();
    console.log('🗑️ All demos cleared');
  }
}

// Export singleton instance
export const DemoService = new DemoServiceClass();

// Auto-initialize with sample data in both development and production
// This ensures users have demos to view immediately
DemoService.initializeSampleDemos().then(() => {
  console.log('📊 Demo service initialized with sample data');
}).catch(error => {
  console.error('Failed to initialize demo service:', error);
});
