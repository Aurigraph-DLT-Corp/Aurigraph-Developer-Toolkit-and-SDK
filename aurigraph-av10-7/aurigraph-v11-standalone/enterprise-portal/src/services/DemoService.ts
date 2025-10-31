// Demo Service - Handles demo registration, management with backend persistence
import axios from 'axios';
import {
  createDemoMerkleTree,
  verifyDemoIntegrity,
  MerkleProof,
  MerkleTree,
} from '../utils/merkleTree';

// API Configuration
const API_BASE_URL = window.location.origin;
const DEMO_API = `${API_BASE_URL}/api/v11/demos`;

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
  status: 'RUNNING' | 'STOPPED' | 'PENDING' | 'ERROR' | 'EXPIRED';
  createdAt: Date;
  lastActivity: Date;
  transactionCount: number;
  merkleRoot: string;
  durationMinutes: number;
  expiresAt: Date;
  isAdminDemo: boolean;
}

export interface MerkleTreeInfo {
  root: string;
  leafCount: number;
  treeDepth: number;
  created: Date;
  verified: boolean;
}

/**
 * Demo Service Class with Backend API Persistence
 */
class DemoServiceClass {
  private merkleTrees: Map<string, MerkleTree> = new Map();
  private demoCache: Map<string, DemoInstance> = new Map();

  /**
   * Map backend response to frontend DemoInstance
   */
  private mapBackendDemo(backendDemo: any): DemoInstance {
    return {
      id: backendDemo.id,
      demoName: backendDemo.demoName,
      userEmail: backendDemo.userEmail,
      userName: backendDemo.userName,
      description: backendDemo.description || '',
      status: backendDemo.status,
      createdAt: new Date(backendDemo.createdAt),
      lastActivity: new Date(backendDemo.lastActivity),
      expiresAt: new Date(backendDemo.expiresAt),
      durationMinutes: backendDemo.durationMinutes,
      isAdminDemo: backendDemo.isAdminDemo,
      transactionCount: backendDemo.transactionCount,
      merkleRoot: backendDemo.merkleRoot,
      channels: JSON.parse(backendDemo.channelsJson || '[]'),
      validators: JSON.parse(backendDemo.validatorsJson || '[]'),
      businessNodes: JSON.parse(backendDemo.businessNodesJson || '[]'),
      slimNodes: JSON.parse(backendDemo.slimNodesJson || '[]'),
    };
  }

  /**
   * Register a new demo with backend persistence
   */
  async registerDemo(
    registration: DemoRegistration,
    durationMinutes?: number,
    isAdmin: boolean = false
  ): Promise<DemoInstance> {
    try {
      // Prepare request body
      const requestBody = {
        demoName: registration.demoName,
        userEmail: registration.userEmail,
        userName: registration.userName,
        description: registration.description,
        channelsJson: JSON.stringify(registration.channels),
        validatorsJson: JSON.stringify(registration.validators),
        businessNodesJson: JSON.stringify(registration.businessNodes),
        slimNodesJson: JSON.stringify(registration.slimNodes),
        merkleRoot: '', // Will be updated after tree generation
      };

      // Create demo via API
      const params: any = {};
      if (durationMinutes) params.durationMinutes = durationMinutes;
      if (isAdmin) params.isAdmin = true;

      const response = await axios.post(DEMO_API, requestBody, { params });
      const demo = this.mapBackendDemo(response.data);

      // Generate Merkle tree locally for visualization
      const { tree, root } = await createDemoMerkleTree(demo);
      this.merkleTrees.set(demo.id, tree);

      // Update merkle root on backend if different
      if (root !== demo.merkleRoot) {
        await axios.put(`${DEMO_API}/${demo.id}`, { merkleRoot: root });
        demo.merkleRoot = root;
      }

      // Cache demo
      this.demoCache.set(demo.id, demo);

      console.log(`✅ Demo registered: ${demo.demoName} (ID: ${demo.id})`);
      console.log(`⏱️ Duration: ${demo.durationMinutes} minutes`);
      console.log(`🌳 Merkle root: ${root}`);

      return demo;
    } catch (error: any) {
      // Graceful fallback: create demo locally if backend unavailable
      if (error.response?.status === 500 || error.response?.status === 404) {
        console.warn('⚠️ Backend demos endpoint not available, creating demo locally:', error.response?.status);

        const demoId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (durationMinutes || 30) * 60000);

        const localDemo: DemoInstance = {
          id: demoId,
          ...registration,
          status: 'RUNNING',
          createdAt: now,
          lastActivity: now,
          expiresAt,
          transactionCount: 0,
          merkleRoot: '',
          durationMinutes: durationMinutes || 30,
          isAdminDemo: isAdmin,
        };

        // Generate Merkle tree locally
        const { tree, root } = await createDemoMerkleTree(localDemo);
        this.merkleTrees.set(demoId, tree);
        localDemo.merkleRoot = root;

        // Cache demo
        this.demoCache.set(demoId, localDemo);

        console.log(`✅ Demo created locally: ${localDemo.demoName} (ID: ${localDemo.id})`);
        console.log(`⏱️ Duration: ${localDemo.durationMinutes} minutes`);
        console.log(`🌳 Merkle root: ${root}`);
        console.log(`ℹ️ Note: Demo stored locally (backend endpoint not available)`);

        return localDemo;
      }

      console.error('Failed to register demo:', error);
      throw new Error(error.response?.data?.error || 'Failed to register demo');
    }
  }

  /**
   * Get all demos from backend
   */
  async getAllDemos(): Promise<DemoInstance[]> {
    try {
      const response = await axios.get(DEMO_API);
      const demos = response.data.map((d: any) => this.mapBackendDemo(d));

      // Update cache
      demos.forEach((demo: DemoInstance) => {
        this.demoCache.set(demo.id, demo);
      });

      return demos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
      // Graceful fallback: if backend endpoint not available, return cached demos
      if (error.response?.status === 500 || error.response?.status === 404) {
        console.warn('⚠️ Backend demos endpoint not available, using cache:', error.response?.status);
        const cachedDemos = Array.from(this.demoCache.values());
        return cachedDemos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      console.error('Failed to fetch demos:', error);
      throw error;
    }
  }

  /**
   * Get active demos (non-expired) from backend
   */
  async getActiveDemos(): Promise<DemoInstance[]> {
    try {
      const response = await axios.get(`${DEMO_API}/active`);
      const demos = response.data.map((d: any) => this.mapBackendDemo(d));

      // Update cache
      demos.forEach((demo: DemoInstance) => {
        this.demoCache.set(demo.id, demo);
      });

      return demos;
    } catch (error) {
      console.error('Failed to fetch active demos:', error);
      throw error;
    }
  }

  /**
   * Get demo by ID from backend
   */
  async getDemo(id: string): Promise<DemoInstance | null> {
    try {
      const response = await axios.get(`${DEMO_API}/${id}`);
      const demo = this.mapBackendDemo(response.data);

      // Update cache
      this.demoCache.set(demo.id, demo);

      return demo;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Failed to fetch demo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get demo from cache (for UI without backend call)
   */
  getCachedDemo(id: string): DemoInstance | undefined {
    return this.demoCache.get(id);
  }

  /**
   * Start a demo
   */
  async startDemo(id: string): Promise<DemoInstance> {
    try {
      const response = await axios.post(`${DEMO_API}/${id}/start`);
      const demo = this.mapBackendDemo(response.data);

      // Update cache
      this.demoCache.set(demo.id, demo);

      console.log(`▶️ Demo started: ${demo.demoName}`);
      return demo;
    } catch (error: any) {
      console.error(`Failed to start demo ${id}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to start demo');
    }
  }

  /**
   * Stop a demo
   */
  async stopDemo(id: string): Promise<DemoInstance> {
    try {
      const response = await axios.post(`${DEMO_API}/${id}/stop`);
      const demo = this.mapBackendDemo(response.data);

      // Update cache
      this.demoCache.set(demo.id, demo);

      console.log(`⏸️ Demo stopped: ${demo.demoName}`);
      return demo;
    } catch (error: any) {
      console.error(`Failed to stop demo ${id}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to stop demo');
    }
  }

  /**
   * Extend demo duration (admin only)
   */
  async extendDemo(id: string, additionalMinutes: number, isAdmin: boolean): Promise<DemoInstance> {
    if (!isAdmin) {
      throw new Error('Only admins can extend demo duration');
    }

    try {
      const response = await axios.post(
        `${DEMO_API}/${id}/extend`,
        null,
        { params: { minutes: additionalMinutes, isAdmin: true } }
      );
      const demo = this.mapBackendDemo(response.data);

      // Update cache
      this.demoCache.set(demo.id, demo);

      console.log(`⏱️ Demo extended: ${demo.demoName} - now expires at ${demo.expiresAt.toLocaleString()}`);
      return demo;
    } catch (error: any) {
      console.error(`Failed to extend demo ${id}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to extend demo');
    }
  }

  /**
   * Add transactions to a demo
   */
  async addTransactions(id: string, count: number = 1, merkleRoot?: string): Promise<DemoInstance> {
    try {
      const params: any = { count };
      if (merkleRoot) params.merkleRoot = merkleRoot;

      const response = await axios.post(`${DEMO_API}/${id}/transactions`, null, { params });
      const demo = this.mapBackendDemo(response.data);

      // Update cache
      this.demoCache.set(demo.id, demo);

      return demo;
    } catch (error: any) {
      console.error(`Failed to add transactions to demo ${id}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to add transactions');
    }
  }

  /**
   * Delete a demo
   */
  async deleteDemo(id: string): Promise<void> {
    try {
      await axios.delete(`${DEMO_API}/${id}`);

      // Remove from cache and Merkle trees
      this.demoCache.delete(id);
      this.merkleTrees.delete(id);

      console.log(`🗑️ Demo deleted: ${id}`);
    } catch (error: any) {
      console.error(`Failed to delete demo ${id}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to delete demo');
    }
  }

  /**
   * Increment transaction count (local cache only, use addTransactions for backend)
   */
  incrementTransactionCount(id: string, count: number = 1): void {
    const demo = this.demoCache.get(id);
    if (demo) {
      demo.transactionCount += count;
      demo.lastActivity = new Date();
    }
  }

  /**
   * Get Merkle tree for a demo (local visualization)
   */
  getMerkleTree(id: string): MerkleTree | undefined {
    return this.merkleTrees.get(id);
  }

  /**
   * Get Merkle tree information
   */
  getMerkleTreeInfo(id: string): MerkleTreeInfo | null {
    const demo = this.demoCache.get(id);
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
   * Verify demo integrity using Merkle tree
   */
  async verifyDemoIntegrity(id: string): Promise<boolean> {
    const demo = this.demoCache.get(id);
    if (!demo) {
      return false;
    }

    return verifyDemoIntegrity(demo);
  }

  /**
   * Get Merkle proof for demo verification
   */
  getMerkleProof(id: string): MerkleProof | null {
    const demo = this.demoCache.get(id);
    const tree = this.merkleTrees.get(id);

    if (!demo || !tree) {
      return null;
    }

    const demoData = JSON.stringify({
      id: demo.id,
      demoName: demo.demoName,
      userEmail: demo.userEmail,
      createdAt: demo.createdAt.toISOString(),
    });

    const leaf = Buffer.from(demoData);
    const proof = tree.getProof(leaf);

    return {
      leaf: leaf.toString('hex'),
      proof: proof.map((p) => ({
        position: p.position,
        data: p.data.toString('hex'),
      })),
      root: demo.merkleRoot,
    };
  }

  /**
   * Initialize with sample data (for development/demo purposes)
   */
  async initializeSampleDemos(): Promise<void> {
    try {
      console.log('📊 Initializing sample demos...');

      const sampleDemos: DemoRegistration[] = [
        {
          demoName: 'Supply Chain Tracking Demo',
          userName: 'Alice Johnson',
          userEmail: 'alice.johnson@enterprise.com',
          description: 'End-to-end supply chain visibility with real-time tracking',
          channels: [
            { id: 'ch1', name: 'Production Channel', type: 'PRIVATE' },
            { id: 'ch2', name: 'Logistics Channel', type: 'CONSORTIUM' },
          ],
          validators: [
            { id: 'v1', name: 'Validator Node 1', type: 'VALIDATOR', endpoint: 'https://validator1.demo', channelId: 'ch1' },
            { id: 'v2', name: 'Validator Node 2', type: 'VALIDATOR', endpoint: 'https://validator2.demo', channelId: 'ch2' },
          ],
          businessNodes: [
            { id: 'b1', name: 'Manufacturer Node', type: 'BUSINESS', endpoint: 'https://manufacturer.demo', channelId: 'ch1' },
            { id: 'b2', name: 'Distributor Node', type: 'BUSINESS', endpoint: 'https://distributor.demo', channelId: 'ch2' },
          ],
          slimNodes: [
            { id: 's1', name: 'Retailer Node', type: 'SLIM', endpoint: 'https://retailer.demo', channelId: 'ch2' },
          ],
        },
        {
          demoName: 'Healthcare Records Management',
          userName: 'Dr. Robert Chen',
          userEmail: 'robert.chen@healthorg.com',
          description: 'Secure patient data sharing across healthcare providers',
          channels: [
            { id: 'hc1', name: 'Patient Records', type: 'PRIVATE' },
          ],
          validators: [
            { id: 'hv1', name: 'Hospital Validator', type: 'VALIDATOR', endpoint: 'https://hospital-val.demo', channelId: 'hc1' },
          ],
          businessNodes: [
            { id: 'hb1', name: 'Primary Care', type: 'BUSINESS', endpoint: 'https://primary-care.demo', channelId: 'hc1' },
            { id: 'hb2', name: 'Specialist Clinic', type: 'BUSINESS', endpoint: 'https://specialist.demo', channelId: 'hc1' },
          ],
          slimNodes: [],
        },
        {
          demoName: 'Financial Settlement Network',
          userName: 'Sarah Martinez',
          userEmail: 'sarah.martinez@fintech.com',
          description: 'Real-time cross-border payment settlement',
          channels: [
            { id: 'fc1', name: 'Payment Channel', type: 'CONSORTIUM' },
          ],
          validators: [
            { id: 'fv1', name: 'Bank Validator 1', type: 'VALIDATOR', endpoint: 'https://bank1-val.demo', channelId: 'fc1' },
            { id: 'fv2', name: 'Bank Validator 2', type: 'VALIDATOR', endpoint: 'https://bank2-val.demo', channelId: 'fc1' },
          ],
          businessNodes: [
            { id: 'fb1', name: 'Bank A Node', type: 'BUSINESS', endpoint: 'https://banka.demo', channelId: 'fc1' },
            { id: 'fb2', name: 'Bank B Node', type: 'BUSINESS', endpoint: 'https://bankb.demo', channelId: 'fc1' },
          ],
          slimNodes: [
            { id: 'fs1', name: 'Payment Provider', type: 'SLIM', endpoint: 'https://payment.demo', channelId: 'fc1' },
          ],
        },
      ];

      // Register sample demos
      for (const demoReg of sampleDemos) {
        try {
          await this.registerDemo(demoReg, 10, false);
        } catch (error) {
          console.warn(`Failed to create sample demo: ${demoReg.demoName}`, error);
        }
      }

      console.log('✅ Sample demos initialized');
    } catch (error) {
      console.error('Failed to initialize sample demos:', error);
    }
  }
}

// Export singleton instance
export const DemoService = new DemoServiceClass();

// Auto-initialize with sample data on load (with retry logic)
let initAttempts = 0;
const maxInitAttempts = 3;
const initWithRetry = async () => {
  try {
    await DemoService.initializeSampleDemos();
    console.log('✅ Demo service initialized successfully');
  } catch (error) {
    initAttempts++;
    if (initAttempts < maxInitAttempts) {
      const retryDelay = Math.pow(2, initAttempts) * 1000; // Exponential backoff
      console.warn(`❌ Demo service initialization failed (attempt ${initAttempts}/${maxInitAttempts}), retrying in ${retryDelay}ms...`);
      setTimeout(initWithRetry, retryDelay);
    } else {
      console.error(`❌ Demo service initialization failed after ${maxInitAttempts} attempts:`, error);
      console.info('💡 The backend database might not be available. Demos will still work but won\'t be persisted.');
    }
  }
};

// Start initialization with 2-second delay to allow app to stabilize
setTimeout(initWithRetry, 2000);
