const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Sort tests to run critical components first
    const testOrder = [
      'crypto',      // Cryptography tests first (foundation)
      'consensus',   // Consensus tests second (core functionality)
      'zk',         // ZK proof tests
      'network',    // Network layer tests
      'ai',         // AI optimization tests
      'crosschain', // Cross-chain bridge tests
      'api',        // API tests
      'monitoring', // Monitoring tests last
    ];

    const sortedTests = tests.sort((testA, testB) => {
      const orderA = this.getTestOrder(testA.path, testOrder);
      const orderB = this.getTestOrder(testB.path, testOrder);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Secondary sort by test type (unit -> integration -> performance)
      const typeOrderA = this.getTestTypeOrder(testA.path);
      const typeOrderB = this.getTestTypeOrder(testB.path);
      
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }
      
      // Tertiary sort alphabetically
      return testA.path.localeCompare(testB.path);
    });

    return sortedTests;
  }

  getTestOrder(testPath, order) {
    for (let i = 0; i < order.length; i++) {
      if (testPath.includes(order[i])) {
        return i;
      }
    }
    return order.length; // Unknown tests run last
  }

  getTestTypeOrder(testPath) {
    if (testPath.includes('/unit/')) return 0;
    if (testPath.includes('/smoke/')) return 1;
    if (testPath.includes('/integration/')) return 2;
    if (testPath.includes('/performance/')) return 3;
    if (testPath.includes('/security/')) return 4;
    if (testPath.includes('/regression/')) return 5;
    return 6;
  }
}

module.exports = CustomSequencer;