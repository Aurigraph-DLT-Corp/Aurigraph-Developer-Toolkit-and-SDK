/**
 * NetworkTopologyService
 *
 * API Service for network topology data
 * Endpoint: /api/v11/blockchain/network/topology
 */

export interface NetworkNode {
  id: string;
  name: string;
  type: 'validator' | 'business' | 'slim';
  status: 'active' | 'inactive' | 'syncing';
  latency?: number;
  uptime?: number;
}

export interface NetworkConnection {
  source: string;
  target: string;
  bandwidth?: number;
  latency?: number;
}

export interface NetworkTopologyData {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  timestamp: number;
}

/**
 * Fetch network topology from API
 * @returns Promise<NetworkTopologyData>
 * @throws Error if API call fails
 */
export const getNetworkTopology = async (): Promise<NetworkTopologyData> => {
  try {
    const response = await fetch('/api/v11/blockchain/network/topology');

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: NetworkTopologyData = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch network topology:', error);
    throw error;
  }
};

/**
 * Get node by ID
 * @param nodeId - Node identifier
 * @returns NetworkNode or undefined
 */
export const getNodeById = async (nodeId: string): Promise<NetworkNode | undefined> => {
  try {
    const topology = await getNetworkTopology();
    return topology.nodes.find((node) => node.id === nodeId);
  } catch (error) {
    console.error(`Failed to fetch node ${nodeId}:`, error);
    throw error;
  }
};

/**
 * Get connections for a specific node
 * @param nodeId - Node identifier
 * @returns Array of connected node IDs
 */
export const getNodeConnections = async (nodeId: string): Promise<string[]> => {
  try {
    const topology = await getNetworkTopology();
    const connections = topology.connections
      .filter((conn) => conn.source === nodeId || conn.target === nodeId)
      .map((conn) => (conn.source === nodeId ? conn.target : conn.source));

    return [...new Set(connections)]; // Remove duplicates
  } catch (error) {
    console.error(`Failed to fetch connections for node ${nodeId}:`, error);
    throw error;
  }
};

/**
 * Filter nodes by type
 * @param type - Node type to filter by
 * @returns Array of nodes matching the type
 */
export const filterNodesByType = async (
  type: 'validator' | 'business' | 'slim'
): Promise<NetworkNode[]> => {
  try {
    const topology = await getNetworkTopology();
    return topology.nodes.filter((node) => node.type === type);
  } catch (error) {
    console.error(`Failed to filter nodes by type ${type}:`, error);
    throw error;
  }
};

/**
 * Filter nodes by status
 * @param status - Node status to filter by
 * @returns Array of nodes matching the status
 */
export const filterNodesByStatus = async (
  status: 'active' | 'inactive' | 'syncing'
): Promise<NetworkNode[]> => {
  try {
    const topology = await getNetworkTopology();
    return topology.nodes.filter((node) => node.status === status);
  } catch (error) {
    console.error(`Failed to filter nodes by status ${status}:`, error);
    throw error;
  }
};
