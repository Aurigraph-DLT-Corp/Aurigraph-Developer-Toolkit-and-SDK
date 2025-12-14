// Merkle Tree Implementation for Demo Registry
// Provides cryptographic verification for demo configurations and transactions

/**
 * Merkle Tree Node
 */
interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

/**
 * Merkle Proof for verification
 */
export interface MerkleProof {
  leaf: string;
  proof: Array<{ hash: string; position: 'left' | 'right' }>;
  root: string;
}

/**
 * SHA-256 hash function using Web Crypto API
 */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Combine two hashes (concatenate and hash)
 */
async function combineHashes(left: string, right: string): Promise<string> {
  return sha256(left + right);
}

/**
 * Merkle Tree class for demo registry verification
 */
export class MerkleTree {
  private leaves: string[];
  private layers: string[][];
  private root: string;

  constructor(leaves: string[]) {
    if (leaves.length === 0) {
      throw new Error('Cannot create Merkle tree with empty leaves');
    }
    this.leaves = leaves;
    this.layers = [];
    this.root = '';
  }

  /**
   * Build the Merkle tree from leaves
   */
  async build(): Promise<void> {
    // First layer is the leaves
    this.layers.push([...this.leaves]);

    // Build tree bottom-up
    let currentLayer = [...this.leaves];

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];

      // Process pairs
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        const combined = await combineHashes(left, right);
        nextLayer.push(combined);
      }

      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    // Root is the last element of the last layer
    this.root = currentLayer[0];
  }

  /**
   * Get the Merkle root hash
   */
  getRoot(): string {
    if (!this.root) {
      throw new Error('Tree not built. Call build() first.');
    }
    return this.root;
  }

  /**
   * Generate Merkle proof for a specific leaf
   */
  async getProof(leafIndex: number): Promise<MerkleProof> {
    if (!this.root) {
      throw new Error('Tree not built. Call build() first.');
    }

    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error('Invalid leaf index');
    }

    const proof: Array<{ hash: string; position: 'left' | 'right' }> = [];
    let currentIndex = leafIndex;

    // Traverse from leaf to root
    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const currentLayer = this.layers[layerIndex];
      const isLeftChild = currentIndex % 2 === 0;
      const siblingIndex = isLeftChild ? currentIndex + 1 : currentIndex - 1;

      if (siblingIndex < currentLayer.length) {
        proof.push({
          hash: currentLayer[siblingIndex],
          position: isLeftChild ? 'right' : 'left',
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf: this.leaves[leafIndex],
      proof,
      root: this.root,
    };
  }

  /**
   * Verify a Merkle proof
   */
  static async verifyProof(proof: MerkleProof): Promise<boolean> {
    let currentHash = proof.leaf;

    // Traverse proof from leaf to root
    for (const proofElement of proof.proof) {
      if (proofElement.position === 'left') {
        currentHash = await combineHashes(proofElement.hash, currentHash);
      } else {
        currentHash = await combineHashes(currentHash, proofElement.hash);
      }
    }

    // Verify computed root matches provided root
    return currentHash === proof.root;
  }

  /**
   * Get all layers (for debugging)
   */
  getLayers(): string[][] {
    return this.layers;
  }

  /**
   * Get number of leaves
   */
  getLeafCount(): number {
    return this.leaves.length;
  }
}

/**
 * Demo Data Hashing Utilities
 */

/**
 * Hash demo configuration
 */
export async function hashDemoConfig(demo: {
  userName: string;
  userEmail: string;
  demoName: string;
  description: string;
  channels: any[];
  validators: any[];
  businessNodes: any[];
  eiNodes: any[];
}): Promise<string> {
  const configString = JSON.stringify({
    userName: demo.userName,
    userEmail: demo.userEmail,
    demoName: demo.demoName,
    description: demo.description,
    channelCount: demo.channels.length,
    validatorCount: demo.validators.length,
    businessNodeCount: demo.businessNodes.length,
    eiNodeCount: demo.eiNodes.length,
  });

  return sha256(configString);
}

/**
 * Hash channel configuration
 */
export async function hashChannel(channel: {
  id: string;
  name: string;
  type: string;
}): Promise<string> {
  return sha256(JSON.stringify(channel));
}

/**
 * Hash node configuration
 */
export async function hashNode(node: {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  channelId: string;
}): Promise<string> {
  return sha256(JSON.stringify(node));
}

/**
 * Hash transaction data
 */
export async function hashTransaction(transaction: {
  id: string;
  timestamp: number;
  type: string;
  data: any;
}): Promise<string> {
  return sha256(JSON.stringify(transaction));
}

/**
 * Create Merkle tree for demo registry
 * Includes demo config, all channels, and all nodes
 */
export async function createDemoMerkleTree(demo: {
  id: string;
  userName: string;
  userEmail: string;
  demoName: string;
  description: string;
  channels: Array<{ id: string; name: string; type: string }>;
  validators: Array<{ id: string; name: string; type: string; endpoint: string; channelId: string }>;
  businessNodes: Array<{ id: string; name: string; type: string; endpoint: string; channelId: string }>;
  eiNodes: Array<{ id: string; name: string; type: string; endpoint: string; channelId: string }>;
  createdAt: Date;
}): Promise<{ tree: MerkleTree; root: string; leaves: string[] }> {
  const leaves: string[] = [];

  // Hash demo configuration
  const demoConfigHash = await hashDemoConfig(demo);
  leaves.push(demoConfigHash);

  // Hash demo metadata
  const metadataHash = await sha256(JSON.stringify({
    id: demo.id,
    createdAt: demo.createdAt.toISOString(),
  }));
  leaves.push(metadataHash);

  // Hash all channels
  for (const channel of demo.channels) {
    const channelHash = await hashChannel(channel);
    leaves.push(channelHash);
  }

  // Hash all nodes
  const allNodes = [...demo.validators, ...demo.businessNodes, ...demo.eiNodes];
  for (const node of allNodes) {
    const nodeHash = await hashNode(node);
    leaves.push(nodeHash);
  }

  // Create and build Merkle tree
  const tree = new MerkleTree(leaves);
  await tree.build();
  const root = tree.getRoot();

  return { tree, root, leaves };
}

/**
 * Verify demo integrity using Merkle root
 */
export async function verifyDemoIntegrity(
  demo: any,
  expectedRoot: string
): Promise<{ valid: boolean; actualRoot: string }> {
  const { root: actualRoot } = await createDemoMerkleTree(demo);

  return {
    valid: actualRoot === expectedRoot,
    actualRoot,
  };
}

/**
 * Generate human-readable Merkle tree visualization
 */
export function visualizeMerkleTree(tree: MerkleTree): string {
  const layers = tree.getLayers();
  let visualization = '';

  layers.forEach((layer, index) => {
    const levelName = index === 0 ? 'Leaves' : index === layers.length - 1 ? 'Root' : `Level ${index}`;
    visualization += `${levelName}:\n`;

    layer.forEach((hash, hashIndex) => {
      const shortHash = `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
      visualization += `  [${hashIndex}] ${shortHash}\n`;
    });

    visualization += '\n';
  });

  return visualization;
}

/**
 * Export Merkle proof for external verification
 */
export function exportMerkleProof(proof: MerkleProof): string {
  return JSON.stringify(proof, null, 2);
}

/**
 * Import Merkle proof from JSON
 */
export function importMerkleProof(json: string): MerkleProof {
  return JSON.parse(json);
}
