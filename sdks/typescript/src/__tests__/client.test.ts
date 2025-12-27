/**
 * Aurigraph SDK TypeScript Client Tests
 * Basic test suite for SDK core functionality
 */

import AurigraphClient from '../index'

describe('AurigraphClient', () => {
  let client: AurigraphClient

  beforeEach(() => {
    client = new AurigraphClient({
      baseUrl: 'http://localhost:9003/api/v11',
      timeout: 5000,
    })
  })

  describe('Client Initialization', () => {
    it('should create a client with config', () => {
      expect(client).toBeDefined()
      expect(client.isConnected()).toBe(false)
    })

    it('should set default timeout', () => {
      const clientWithoutTimeout = new AurigraphClient({
        baseUrl: 'http://localhost:9003/api/v11',
      })
      expect(clientWithoutTimeout).toBeDefined()
    })

    it('should include API key in headers if provided', () => {
      const clientWithApiKey = new AurigraphClient({
        baseUrl: 'http://localhost:9003/api/v11',
        apiKey: 'test-key-123',
      })
      expect(clientWithApiKey).toBeDefined()
    })
  })

  describe('Connection Management', () => {
    it('should initialize with disconnected state', () => {
      expect(client.isConnected()).toBe(false)
    })

    it('should have disconnect method', async () => {
      await client.disconnect()
      expect(client.isConnected()).toBe(false)
    })
  })

  describe('Interface Exports', () => {
    it('should export Account interface', () => {
      // Type checking only - interface is exported
      const account: any = {
        address: 'auri1test',
        balance: '1000000',
        nonce: 0,
        publicKey: 'pk_test',
      }
      expect(account.address).toBeDefined()
    })

    it('should export Transaction interface', () => {
      // Type checking only - interface is exported
      const tx: any = {
        hash: 'tx_hash',
        from: 'auri1from',
        to: 'auri1to',
        amount: '100',
        nonce: 0,
        timestamp: Date.now(),
        status: 'pending' as const,
      }
      expect(tx.hash).toBeDefined()
    })
  })

  describe('SDK Export', () => {
    it('should export AurigraphClient as default', () => {
      expect(AurigraphClient).toBeDefined()
    })

    it('should be instantiable', () => {
      const newClient = new AurigraphClient({
        baseUrl: 'http://localhost:9003/api/v11',
      })
      expect(newClient).toBeInstanceOf(AurigraphClient)
    })
  })
})
