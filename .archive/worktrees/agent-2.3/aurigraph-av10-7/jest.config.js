module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/index-simple.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95
    },
    './src/crypto/': {
      branches: 95,
      functions: 95,
      lines: 98,
      statements: 98
    },
    './src/consensus/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  maxWorkers: '50%',
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/ui/node_modules/'
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/ui/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  testSequencer: '<rootDir>/tests/sequencer.js'
};