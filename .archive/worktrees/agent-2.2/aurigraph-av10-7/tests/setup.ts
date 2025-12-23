import 'reflect-metadata';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
  
  // Mock external dependencies
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Cleanup after all tests
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Global test utilities
global.testUtils = {
  createMockTransaction: (overrides = {}) => ({
    id: `test-tx-${Math.random().toString(36).substr(2, 9)}`,
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    from: `0x${Math.random().toString(16).substr(2, 40)}`,
    to: `0x${Math.random().toString(16).substr(2, 40)}`,
    amount: Math.floor(Math.random() * 1000),
    timestamp: Date.now(),
    data: { type: 'transfer' },
    signature: 'mock-signature',
    ...overrides
  }),
  
  createMockValidator: (id = 'test-validator') => ({
    nodeId: id,
    stake: 1000000,
    channels: ['test-channel'],
    status: 'active',
    performance: {
      tps: 100000,
      latency: 250,
      uptime: 99.9,
      consensusParticipation: 100
    }
  }),
  
  createMockBlock: (transactions = []) => ({
    height: Math.floor(Math.random() * 1000000),
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    previousHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    transactions,
    timestamp: Date.now(),
    validator: 'test-validator',
    consensusProof: {
      stateRoot: 'mock-state-root',
      term: 1,
      signatures: []
    }
  }),
  
  waitForCondition: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  }
};

// Extend Jest matchers for blockchain-specific assertions
expect.extend({
  toBeValidTransaction(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.hash === 'string' &&
      typeof received.timestamp === 'number';
    
    return {
      message: () => `Expected ${received} to be a valid transaction`,
      pass
    };
  },
  
  toHaveQuantumSecurity(received) {
    const pass = received &&
      received.algorithm &&
      ['CRYSTALS-Kyber', 'CRYSTALS-Dilithium', 'SPHINCS+'].includes(received.algorithm);
    
    return {
      message: () => `Expected ${received} to have quantum-safe security`,
      pass
    };
  },
  
  toMeetPerformanceTarget(received, target) {
    const pass = received >= target;
    
    return {
      message: () => `Expected ${received} to meet performance target of ${target}`,
      pass
    };
  }
});

// Type declarations for global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidTransaction(): R;
      toHaveQuantumSecurity(): R;
      toMeetPerformanceTarget(target: number): R;
    }
  }
  
  var testUtils: {
    createMockTransaction: (overrides?: any) => any;
    createMockValidator: (id?: string) => any;
    createMockBlock: (transactions?: any[]) => any;
    waitForCondition: (condition: () => boolean, timeout?: number) => Promise<void>;
  };
}