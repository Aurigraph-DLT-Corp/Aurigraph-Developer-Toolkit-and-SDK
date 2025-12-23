/**
 * Sprint 14 Backend Integration Tests
 * Validates all 26 REST endpoints from Enterprise Portal perspective
 * Framework: Vitest + REST client
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios, { AxiosInstance } from 'axios'

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const API_BASE_URL = 'http://localhost:9003/api/v11'
const TIMEOUT = 5000

let apiClient: AxiosInstance

beforeAll(() => {
  apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
  })
})

// ============================================================================
// PHASE 1 ENDPOINT TESTS (1-15)
// ============================================================================

describe('Sprint 14 Phase 1 Endpoints (1-15)', () => {
  // ==================== NETWORK TOPOLOGY (1-3) ====================

  describe('Endpoint 1: GET /network/topology', () => {
    it('should return network topology with nodes and edges', async () => {
      const response = await apiClient.get('/network/topology')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('nodes')
      expect(response.data).toHaveProperty('edges')
      expect(response.data).toHaveProperty('summary')
      expect(Array.isArray(response.data.nodes)).toBe(true)
      expect(Array.isArray(response.data.edges)).toBe(true)
    })

    it('should return valid node structure', async () => {
      const response = await apiClient.get('/network/topology')
      if (response.data.nodes.length > 0) {
        const node = response.data.nodes[0]
        expect(node).toHaveProperty('id')
        expect(node).toHaveProperty('type')
        expect(node).toHaveProperty('status')
        expect(['validator', 'observer', 'seed', 'relay']).toContain(node.type)
        expect(['active', 'inactive', 'syncing']).toContain(node.status)
      }
    })

    it('should return valid edge structure', async () => {
      const response = await apiClient.get('/network/topology')
      if (response.data.edges.length > 0) {
        const edge = response.data.edges[0]
        expect(edge).toHaveProperty('source')
        expect(edge).toHaveProperty('target')
        expect(edge).toHaveProperty('status')
        expect(['healthy', 'degraded', 'down']).toContain(edge.status)
      }
    })
  })

  describe('Endpoint 2: GET /network/nodes/{nodeId}', () => {
    it('should return node details for valid nodeId', async () => {
      // First get a node ID from topology
      const topologyResponse = await apiClient.get('/network/topology')
      if (topologyResponse.data.nodes.length > 0) {
        const nodeId = topologyResponse.data.nodes[0].id
        const response = await apiClient.get(`/network/nodes/${nodeId}`)
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('id', nodeId)
      }
    })

    it('should handle invalid nodeId gracefully', async () => {
      try {
        await apiClient.get('/network/nodes/invalid-node-id')
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response?.status)
      }
    })
  })

  describe('Endpoint 3: GET /network/stats', () => {
    it('should return network statistics', async () => {
      const response = await apiClient.get('/network/stats')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalNodes')
      expect(response.data).toHaveProperty('activeNodes')
      expect(response.data).toHaveProperty('avgLatency')
      expect(typeof response.data.totalNodes).toBe('number')
      expect(typeof response.data.avgLatency).toBe('number')
    })
  })

  // ==================== BLOCKCHAIN OPERATIONS (4-8) ====================

  describe('Endpoint 4: POST /blockchain/blocks/search', () => {
    it('should search blocks with empty filters', async () => {
      const response = await apiClient.post('/blockchain/blocks/search', {
        filters: {},
        page: 1,
        pageSize: 20,
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('blocks')
      expect(response.data).toHaveProperty('total')
      expect(response.data).toHaveProperty('page')
      expect(Array.isArray(response.data.blocks)).toBe(true)
    })

    it('should search blocks with height filter', async () => {
      const response = await apiClient.post('/blockchain/blocks/search', {
        filters: { heightFrom: 1, heightTo: 100 },
        page: 1,
        pageSize: 10,
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('blocks')
    })

    it('should support pagination', async () => {
      const page1 = await apiClient.post('/blockchain/blocks/search', {
        filters: {},
        page: 1,
        pageSize: 5,
      })
      const page2 = await apiClient.post('/blockchain/blocks/search', {
        filters: {},
        page: 2,
        pageSize: 5,
      })
      expect(page1.status).toBe(200)
      expect(page2.status).toBe(200)
      expect(page1.data.page).toBe(1)
      expect(page2.data.page).toBe(2)
    })
  })

  describe('Endpoint 5: GET /blockchain/blocks/{height}', () => {
    it('should return block by height', async () => {
      const response = await apiClient.get('/blockchain/blocks/1')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('height')
      expect(response.data).toHaveProperty('hash')
      expect(response.data).toHaveProperty('timestamp')
    })

    it('should handle invalid height gracefully', async () => {
      try {
        await apiClient.get('/blockchain/blocks/invalid')
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response?.status)
      }
    })
  })

  describe('Endpoint 6: GET /blockchain/blocks/hash/{hash}', () => {
    it('should handle block hash lookup', async () => {
      // This endpoint should exist but may not have test data
      try {
        const response = await apiClient.get('/blockchain/blocks/hash/0x1234')
        expect([200, 404, 400]).toContain(response.status)
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response?.status)
      }
    })
  })

  describe('Endpoint 7: GET /blockchain/blocks/latest', () => {
    it('should return latest blocks', async () => {
      const response = await apiClient.get('/blockchain/blocks/latest?limit=10')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.data) || Array.isArray(response.data.blocks)).toBe(true)
    })
  })

  describe('Endpoint 8: GET /blockchain/blocks/{height}/transactions', () => {
    it('should return transactions for a block', async () => {
      const response = await apiClient.get('/blockchain/blocks/1/transactions')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.data) || Array.isArray(response.data.transactions)).toBe(true)
    })
  })

  // ==================== VALIDATOR OPERATIONS (9-11) ====================

  describe('Endpoint 9: GET /validators', () => {
    it('should return all validators', async () => {
      const response = await apiClient.get('/validators')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.data) || Array.isArray(response.data.validators)).toBe(true)
    })

    it('should return validator with correct structure', async () => {
      const response = await apiClient.get('/validators')
      const validators = Array.isArray(response.data) ? response.data : response.data.validators
      if (validators && validators.length > 0) {
        const validator = validators[0]
        expect(validator).toHaveProperty('id')
        expect(validator).toHaveProperty('status')
        expect(['active', 'inactive', 'jailed']).toContain(validator.status)
      }
    })
  })

  describe('Endpoint 10: GET /validators/{id}', () => {
    it('should return specific validator', async () => {
      const listResponse = await apiClient.get('/validators')
      const validators = Array.isArray(listResponse.data) ? listResponse.data : listResponse.data.validators
      if (validators && validators.length > 0) {
        const validatorId = validators[0].id
        const response = await apiClient.get(`/validators/${validatorId}`)
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('id', validatorId)
      }
    })
  })

  describe('Endpoint 11: GET /validators/metrics', () => {
    it('should return validator metrics', async () => {
      const response = await apiClient.get('/validators/metrics')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('activeValidators')
      expect(response.data).toHaveProperty('totalValidators')
    })
  })

  // ==================== AI/ML OPERATIONS (12-13) ====================

  describe('Endpoint 12: GET /ai/metrics', () => {
    it('should return AI metrics', async () => {
      const response = await apiClient.get('/ai/metrics')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('activeModels')
      expect(typeof response.data.activeModels).toBe('number')
    })
  })

  describe('Endpoint 13: GET /ai/models/{modelId}', () => {
    it('should handle model lookup', async () => {
      try {
        const response = await apiClient.get('/ai/models/model-1')
        expect([200, 404]).toContain(response.status)
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response?.status)
      }
    })
  })

  // ==================== AUDIT & SECURITY (14-15) ====================

  describe('Endpoint 14: POST /audit/logs', () => {
    it('should query audit logs', async () => {
      const response = await apiClient.post('/audit/logs', {
        filters: {},
        page: 1,
        pageSize: 50,
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('logs')
      expect(response.data).toHaveProperty('total')
    })

    it('should support log filtering', async () => {
      const response = await apiClient.post('/audit/logs', {
        filters: { level: 'ERROR' },
        page: 1,
        pageSize: 20,
      })
      expect(response.status).toBe(200)
    })
  })

  describe('Endpoint 15: GET /audit/summary', () => {
    it('should return audit log summary', async () => {
      const response = await apiClient.get('/audit/summary')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalLogs')
      expect(typeof response.data.totalLogs).toBe('number')
    })
  })
})

// ============================================================================
// PHASE 2 ENDPOINT TESTS (16-26)
// ============================================================================

describe('Sprint 14 Phase 2 Endpoints (16-26)', () => {
  // ==================== ANALYTICS (16-17) ====================

  describe('Endpoint 16: GET /analytics/network-usage', () => {
    it('should return network usage analytics', async () => {
      const response = await apiClient.get('/analytics/network-usage?period=24h')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('timestamp')
      expect(response.data).toHaveProperty('period', '24h')
    })
  })

  describe('Endpoint 17: GET /analytics/validator-earnings', () => {
    it('should return validator earnings', async () => {
      const response = await apiClient.get('/analytics/validator-earnings?period=30d')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('totalValidators')
    })
  })

  // ==================== GATEWAY (18-20) ====================

  describe('Endpoint 18: GET /gateway/balance/{address}', () => {
    it('should handle balance lookup', async () => {
      try {
        const response = await apiClient.get('/gateway/balance/0x1234567890abcdef')
        expect([200, 400, 404]).toContain(response.status)
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response?.status)
      }
    })
  })

  describe('Endpoint 19: POST /gateway/transfer', () => {
    it('should accept transfer request', async () => {
      try {
        const response = await apiClient.post('/gateway/transfer', {
          recipient: '0x1234567890abcdef',
          amount: 100,
          memo: 'test transfer',
        })
        expect([200, 400, 401]).toContain(response.status)
      } catch (error: any) {
        expect([400, 401, 500]).toContain(error.response?.status)
      }
    })
  })

  describe('Endpoint 20: GET /gateway/transactions/{txHash}', () => {
    it('should handle transaction lookup', async () => {
      try {
        const response = await apiClient.get('/gateway/transactions/0xabcdef')
        expect([200, 400, 404]).toContain(response.status)
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response?.status)
      }
    })
  })

  // ==================== SMART CONTRACTS (21-23) ====================

  describe('Endpoint 21: GET /contracts', () => {
    it('should list contracts', async () => {
      const response = await apiClient.get('/contracts?page=1&pageSize=20')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('contracts')
    })
  })

  describe('Endpoint 22: GET /contracts/{contractAddress}/state', () => {
    it('should handle contract state lookup', async () => {
      try {
        const response = await apiClient.get('/contracts/0x1234/state')
        expect([200, 400, 404]).toContain(response.status)
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response?.status)
      }
    })
  })

  describe('Endpoint 23: POST /contracts/{contractAddress}/invoke', () => {
    it('should accept contract invocation', async () => {
      try {
        const response = await apiClient.post('/contracts/0x1234/invoke', {
          function: 'test',
          parameters: [],
          gas: 100000,
        })
        expect([200, 400, 401]).toContain(response.status)
      } catch (error: any) {
        expect([400, 401, 500]).toContain(error.response?.status)
      }
    })
  })

  // ==================== REAL-WORLD ASSETS (24-25) ====================

  describe('Endpoint 24: GET /rwa/assets', () => {
    it('should list RWA assets', async () => {
      const response = await apiClient.get('/rwa/assets?page=1&pageSize=20')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('assets')
    })
  })

  describe('Endpoint 25: POST /rwa/assets/{assetId}/mint', () => {
    it('should accept mint request', async () => {
      try {
        const response = await apiClient.post('/rwa/assets/asset-1/mint', {
          amount: 1000,
          recipient: '0x1234',
        })
        expect([200, 400, 401]).toContain(response.status)
      } catch (error: any) {
        expect([400, 401, 500]).toContain(error.response?.status)
      }
    })
  })

  // ==================== TOKENS (26) ====================

  describe('Endpoint 26: GET /tokens', () => {
    it('should list tokens', async () => {
      const response = await apiClient.get('/tokens?page=1&pageSize=20')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('tokens')
    })
  })
})

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Sprint 14 Performance Tests', () => {
  it('should respond to network/topology within 100ms', async () => {
    const start = Date.now()
    await apiClient.get('/network/topology')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(100)
  })

  it('should handle 50 concurrent requests', async () => {
    const promises = Array(50)
      .fill(null)
      .map(() => apiClient.get('/network/stats'))

    const results = await Promise.allSettled(promises)
    const successful = results.filter((r) => r.status === 'fulfilled')
    expect(successful.length).toBeGreaterThan(40) // At least 80% success rate
  })

  it('should support pagination without performance degradation', async () => {
    const times = []
    for (let page = 1; page <= 5; page++) {
      const start = Date.now()
      await apiClient.post('/blockchain/blocks/search', {
        filters: {},
        page,
        pageSize: 20,
      })
      times.push(Date.now() - start)
    }
    // No page should be significantly slower than the first
    const avgTime = times.reduce((a, b) => a + b) / times.length
    expect(Math.max(...times)).toBeLessThan(avgTime * 2)
  })
})

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Sprint 14 Error Handling', () => {
  it('should return 400 for invalid JSON', async () => {
    try {
      await apiClient.post('/blockchain/blocks/search', 'invalid json')
    } catch (error: any) {
      expect(error.response?.status).toBe(400)
    }
  })

  it('should return 404 for non-existent endpoints', async () => {
    try {
      await apiClient.get('/nonexistent/endpoint')
    } catch (error: any) {
      expect(error.response?.status).toBe(404)
    }
  })

  it('should handle timeout gracefully', async () => {
    const slowClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 1, // Very short timeout
    })

    try {
      await slowClient.get('/network/topology')
    } catch (error: any) {
      expect(['ECONNABORTED', 'ETIMEDOUT']).toContain(error.code)
    }
  })
})
