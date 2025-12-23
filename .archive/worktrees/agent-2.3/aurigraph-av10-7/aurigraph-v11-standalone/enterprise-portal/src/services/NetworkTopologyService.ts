/**
 * NetworkTopologyService.ts
 * Handles API calls for network topology data
 * API Endpoint: /api/v11/blockchain/network/topology
 */

import apiClient from './api'

export interface Node {
  id: string
  type: 'validator' | 'business' | 'slim'
  name: string
  ip: string
  port: number
  status: 'active' | 'inactive' | 'syncing'
  uptime: number // percentage
  peersConnected: number
  lastUpdate: string
}

export interface Edge {
  source: string
  target: string
  latency: number // milliseconds
  bandwidth: number // Mbps
  status: 'healthy' | 'degraded' | 'down'
}

export interface NetworkTopologyData {
  nodes: Node[]
  edges: Edge[]
  summary: {
    totalNodes: number
    activeNodes: number
    avgLatency: number
    networkHealth: 'excellent' | 'good' | 'fair' | 'poor'
  }
  timestamp: string
}

/**
 * Fetch network topology data from backend API
 * @returns Promise<NetworkTopologyData> Network topology with nodes and connections
 */
export async function fetchNetworkTopology(): Promise<NetworkTopologyData> {
  try {
    const response = await apiClient.get<NetworkTopologyData>(
      '/blockchain/network/topology'
    )
    return response.data
  } catch (error) {
    console.error('[NetworkTopologyService] Error fetching network topology:', error)
    throw error
  }
}

/**
 * Subscribe to real-time network topology updates via WebSocket
 * @param callback Function to call when topology changes
 * @returns Unsubscribe function
 */
export function subscribeToNetworkTopology(
  callback: (data: NetworkTopologyData) => void
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const baseUrl = import.meta.env.PROD ? 'dlt.aurigraph.io' : 'localhost:9003'
  const wsUrl = `${protocol}//${baseUrl}/api/v11/ws/network/topology`

  try {
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[NetworkTopologyService] WebSocket connected for real-time topology')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NetworkTopologyData
        callback(data)
      } catch (error) {
        console.error('[NetworkTopologyService] Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[NetworkTopologyService] WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('[NetworkTopologyService] WebSocket disconnected')
    }

    // Return unsubscribe function
    return () => {
      ws.close()
    }
  } catch (error) {
    console.error('[NetworkTopologyService] Error setting up WebSocket:', error)
    return () => {} // Return no-op unsubscribe
  }
}

/**
 * Get network node details by ID
 * @param nodeId Node identifier
 * @returns Promise<Node> Detailed node information
 */
export async function getNodeDetails(nodeId: string): Promise<Node> {
  try {
    const response = await apiClient.get<Node>(`/blockchain/network/nodes/${nodeId}`)
    return response.data
  } catch (error) {
    console.error(`[NetworkTopologyService] Error fetching node ${nodeId}:`, error)
    throw error
  }
}

/**
 * Get latency metrics between two nodes
 * @param sourceId Source node ID
 * @param targetId Target node ID
 * @returns Promise with latency metrics
 */
export async function getNodeLatency(
  sourceId: string,
  targetId: string
): Promise<{
  latency: number
  jitter: number
  packetLoss: number
  bandwidth: number
}> {
  try {
    const response = await apiClient.get(
      `/blockchain/network/latency?source=${sourceId}&target=${targetId}`
    )
    return response.data
  } catch (error) {
    console.error('[NetworkTopologyService] Error fetching latency metrics:', error)
    throw error
  }
}

/**
 * Get network statistics summary
 * @returns Promise with network stats
 */
export async function getNetworkStats(): Promise<{
  totalNodes: number
  activeNodes: number
  activeValidators: number
  activeBusinessNodes: number
  activeSlimNodes: number
  avgLatency: number
  maxLatency: number
  minLatency: number
  networkHealth: string
}> {
  try {
    const response = await apiClient.get('/blockchain/network/stats')
    return response.data
  } catch (error) {
    console.error('[NetworkTopologyService] Error fetching network stats:', error)
    throw error
  }
}

export default {
  fetchNetworkTopology,
  subscribeToNetworkTopology,
  getNodeDetails,
  getNodeLatency,
  getNetworkStats,
}
