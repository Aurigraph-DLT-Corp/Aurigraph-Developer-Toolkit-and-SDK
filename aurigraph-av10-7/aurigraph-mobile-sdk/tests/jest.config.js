/**
 * Jest configuration for Aurigraph Mobile SDK Testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/?(*.)(spec|test).(js|jsx|ts|tsx)'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Module paths
  moduleNameMapping: {
    '@aurigraph/(.*)$': '<rootDir>/../$1',
    '@shared/(.*)$': '<rootDir>/../shared/$1',
    '@tests/(.*)$': '<rootDir>/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/setup.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '../ios/Sources/**/*.swift',
    '../android/src/**/*.{java,kt}',
    '../react-native/src/**/*.{ts,tsx}',
    '../flutter/lib/**/*.dart',
    '../shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/__tests__/**',
    '!**/coverage/**',
  ],
  
  coverageReporters: [
    'text',
    'html',
    'lcov',
    'json-summary'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './shared/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Parallel testing
  maxWorkers: '50%',
  
  // Verbose output
  verbose: true,
  
  // Test suites
  projects: [
    // Unit tests
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/unit/**/*.test.{ts,js}'],
      testEnvironment: 'node',
    },
    
    // Integration tests
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/integration/**/*.test.{ts,js}'],
      testEnvironment: 'node',
      testTimeout: 60000,
    },
    
    // End-to-end tests
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/e2e/**/*.test.{ts,js}'],
      testEnvironment: 'node',
      testTimeout: 120000,
    },
    
    // Performance tests
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/performance/**/*.test.{ts,js}'],
      testEnvironment: 'node',
      testTimeout: 300000,
    },
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  
  // Clear mocks
  clearMocks: true,
  
  // Restore mocks
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'junit.xml',
    }],
    ['jest-html-reporter', {
      outputPath: '<rootDir>/test-results/test-report.html',
      pageTitle: 'Aurigraph Mobile SDK Test Results'
    }]
  ]
};