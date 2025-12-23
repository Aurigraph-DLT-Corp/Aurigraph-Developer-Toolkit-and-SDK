# Aurigraph SDK Developer Guide

Complete guide for developers integrating with Aurigraph DLT V11 platform.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Methods](#authentication-methods)
3. [Common Workflows](#common-workflows)
4. [Advanced Features](#advanced-features)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

```bash
npm install @aurigraph/sdk dotenv
```

### Basic Setup

```typescript
import { AurigraphClient } from '@aurigraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new AurigraphClient({
  baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY
  }
});

// Test connection
const health = await client.healthCheck();
console.log('Connected:', health.status);
```

### Environment Setup

Create `.env` file:

```env
# Network
AURIGRAPH_BASE_URL=http://localhost:9003
AURIGRAPH_API_VERSION=v11

# Authentication
AURIGRAPH_API_KEY=your-api-key-here

# Options
AURIGRAPH_DEBUG=true
AURIGRAPH_TIMEOUT=30000
```

---

## Authentication Methods

### 1. API Key Authentication

**Best for**: Direct server-to-server communication, simple integrations

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY
  }
});
```

**Generate API Key**:
1. Visit https://console.aurigraph.io/api-keys
2. Create new key with desired scopes
3. Copy and store securely

### 2. JWT Token Authentication

**Best for**: Microservices, OAuth integrations

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIs...'
  }
});
```

### 3. OAuth 2.0 Client Credentials

**Best for**: Multi-tenant applications, service-to-service

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    oauth: {
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      grantType: 'client_credentials',
      scope: ['read:transactions', 'write:transactions']
    }
  }
});

// Token is automatically requested and refreshed
```

### 4. Wallet-Based Signing

**Best for**: Transaction signing, cryptographic verification

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    privateKey: process.env.PRIVATE_KEY
  }
});

// Sign a transaction
const txData = '...transaction data...';
const signature = client.authManager.signTransaction(txData);
```

---

## Common Workflows

### Workflow 1: Monitor Account Activity

```typescript
import { AurigraphClient } from '@aurigraph/sdk';

async function monitorAccount(address: string) {
  const client = new AurigraphClient({
    baseURL: 'http://localhost:9003',
    auth: { apiKey: process.env.AURIGRAPH_API_KEY }
  });

  // Get account info
  const account = await client.getAccount(address);
  console.log('Address:', account.address);
  console.log('Balance:', account.balance);
  console.log('Nonce:', account.nonce);

  // Get recent transactions
  const transactions = await client.getTransactions(address, {
    limit: 10,
    sort: 'desc'
  });

  console.log('\nRecent transactions:');
  for (const tx of transactions.data) {
    console.log(`${tx.hash}: ${tx.value} (${tx.status})`);
  }

  // Subscribe to incoming transactions
  client.subscribeToEvents(
    ['transaction.created', 'transaction.confirmed'],
    (event) => {
      if (event.data.from === address || event.data.to === address) {
        console.log(`New transaction: ${event.data.hash}`);
      }
    }
  );
}
```

### Workflow 2: Track RWA Assets

```typescript
async function trackRWAPortfolio(ownerAddress: string) {
  const client = new AurigraphClient({
    baseURL: 'http://localhost:9003',
    auth: { apiKey: process.env.AURIGRAPH_API_KEY }
  });

  // Get portfolio
  const portfolio = await client.getRWAPortfolio(ownerAddress);

  console.log(`Portfolio Value: $${portfolio.totalValue}`);
  console.log(`Assets: ${portfolio.assets.length}`);

  // Analyze by type
  const byType: Record<string, number> = {};
  for (const asset of portfolio.assets) {
    const type = asset.metadata.assetType;
    const value = parseFloat(asset.metadata.valuation);
    byType[type] = (byType[type] || 0) + value;
  }

  console.log('\nBreakdown by type:');
  for (const [type, value] of Object.entries(byType)) {
    const percentage = (value / parseFloat(portfolio.totalValue)) * 100;
    console.log(`${type}: $${value} (${percentage.toFixed(1)}%)`);
  }
}
```

### Workflow 3: Smart Contract Interaction

```typescript
async function interactWithContract() {
  const client = new AurigraphClient({
    baseURL: 'http://localhost:9003',
    auth: { apiKey: process.env.AURIGRAPH_API_KEY }
  });

  const contractAddress = '0x...';

  // Get contract details
  const contract = await client.getContract(contractAddress);
  console.log('Name:', contract.name);
  console.log('Symbol:', contract.symbol);
  console.log('Total Supply:', contract.totalSupply);

  // Get ABI
  const abi = await client.getContractABI(contractAddress);
  const functions = abi.filter(item => item.type === 'function');
  console.log(`Contract has ${functions.length} functions`);

  // Call a function (read-only)
  const balanceOfAddress = '0x1234...';
  const balance = await client.callContract(
    contractAddress,
    'balanceOf',
    [balanceOfAddress]
  );

  console.log(`Balance of ${balanceOfAddress}: ${balance}`);
}
```

### Workflow 4: Validator Monitoring

```typescript
async function monitorValidators() {
  const client = new AurigraphClient({
    baseURL: 'http://localhost:9003',
    auth: { apiKey: process.env.AURIGRAPH_API_KEY }
  });

  // Get active validators
  const validators = await client.listValidators({
    limit: 20,
    sort: 'desc'
  });

  console.log(`Active Validators: ${validators.total}`);

  // Check specific validator
  for (const validator of validators.data.slice(0, 5)) {
    const performance = await client.getValidatorPerformance(validator.address);

    console.log(`\nValidator: ${validator.address}`);
    console.log(`  Status: ${validator.status}`);
    console.log(`  Stake: ${validator.stake}`);
    console.log(`  Uptime: ${performance.uptime}%`);
    console.log(`  Blocks: ${performance.blocksProposed}`);
  }
}
```

---

## Advanced Features

### Real-Time Event Streaming

```typescript
// Subscribe to multiple event types
const eventTypes = [
  'transaction.created',
  'transaction.confirmed',
  'block.created',
  'validator.joined'
];

client.subscribeToEvents(
  eventTypes,
  (event) => {
    console.log(`Event [${event.type}]:`, event.data);

    // Handle specific events
    switch (event.type) {
      case 'transaction.confirmed':
        console.log(`✅ Tx confirmed: ${event.data.hash}`);
        break;

      case 'block.created':
        console.log(`📦 Block #${event.data.number}`);
        break;

      case 'validator.joined':
        console.log(`🎖️ Validator joined: ${event.data.address}`);
        break;
    }
  },
  (error) => {
    console.error(`Stream error: ${error.message}`);
    // Reconnect logic here
  }
);
```

### Pagination and Filtering

```typescript
// Get transactions with pagination
let page = 0;
let hasMore = true;

while (hasMore) {
  const result = await client.getTransactions(
    '0xaddress',
    {
      limit: 50,
      offset: page * 50,
      sort: 'desc',
      filter: {
        status: 'confirmed'
      }
    }
  );

  console.log(`Page ${page}: ${result.data.length} transactions`);
  hasMore = result.hasMore;
  page++;
}
```

### Batch Operations

```typescript
// Get data for multiple addresses
const addresses = [
  '0x1111...',
  '0x2222...',
  '0x3333...'
];

const accounts = await Promise.all(
  addresses.map(addr => client.getAccount(addr))
);

console.log('All accounts:', accounts);
```

### Error Recovery with Retry

```typescript
async function apiCallWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.code === 'RATE_LIMIT_ERROR') {
        const delay = error.retryAfter || (1000 * Math.pow(2, i));
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (i < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, i);
        console.log(`Error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const balance = await apiCallWithRetry(
  () => client.getBalance('0xaddress')
);
```

---

## Error Handling

### Error Types

```typescript
import {
  AurigraphError,
  AuthError,
  ValidationError,
  RateLimitError
} from '@aurigraph/sdk';

try {
  const tx = await client.getTransaction('0xhash');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting
    console.log(`Wait ${error.retryAfter}ms`);
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Invalid input:', error.details);
  } else if (error instanceof AuthError) {
    // Handle authentication errors
    console.log('Auth failed:', error.message);
  } else if (error instanceof AurigraphError) {
    // Handle other API errors
    console.log(`[${error.code}] ${error.message}`);
  } else {
    // Handle unknown errors
    console.error('Unknown error:', error);
  }
}
```

### Global Error Handler

```typescript
client.on('error', (error) => {
  console.error('Global error:', error);

  if (error.code === 'RATE_LIMIT_ERROR') {
    // Implement backoff strategy
  } else if (error.statusCode >= 500) {
    // Handle server errors
  }
});
```

---

## Best Practices

### 1. Security

```typescript
// ❌ DON'T: Hardcode secrets
const apiKey = 'abc123xyz';

// ✅ DO: Use environment variables
const apiKey = process.env.AURIGRAPH_API_KEY;

// ✅ DO: Rotate keys regularly
// Set key expiry and rotation in .env or secrets manager
```

### 2. Connection Management

```typescript
// ✅ DO: Create single instance
const client = new AurigraphClient(config);

// Reuse for all operations
export default client;

// ✅ DO: Clean up on shutdown
process.on('SIGINT', () => {
  client.close();
  process.exit(0);
});
```

### 3. Error Handling

```typescript
// ✅ DO: Handle specific error types
try {
  // Operation
} catch (error) {
  if (error instanceof RateLimitError) {
    // Specific handling
  } else if (error instanceof ValidationError) {
    // Different handling
  }
}

// ✅ DO: Log errors with context
console.error({
  timestamp: new Date().toISOString(),
  error: error.message,
  code: error.code,
  details: error.details
});
```

### 4. Performance

```typescript
// ✅ DO: Batch requests
const addresses = ['0x1', '0x2', '0x3'];
const results = await Promise.all(
  addresses.map(addr => client.getAccount(addr))
);

// ✅ DO: Use pagination for large datasets
const results = await client.getTransactions(address, {
  limit: 1000,
  offset: page * 1000
});

// ✅ DO: Cache frequently accessed data
const cache = new Map();

async function getCachedAccount(address: string) {
  if (cache.has(address)) {
    return cache.get(address);
  }

  const account = await client.getAccount(address);
  cache.set(address, account);
  return account;
}
```

### 5. Testing

```typescript
// ✅ DO: Mock API responses for tests
import { vi } from 'vitest';

vi.mock('@aurigraph/sdk', () => ({
  AurigraphClient: class MockClient {
    async getBalance() {
      return '1000000000000000000';
    }
  }
}));
```

---

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to API

```typescript
// Solution: Check endpoint and network
const health = await client.healthCheck();
console.log(health.status); // Should be 'healthy'

// Check connectivity
const status = await client.getNetworkStatus();
console.log(`Height: ${status.currentHeight}`);
```

### Authentication Errors

**Problem**: "Unauthorized" errors

```typescript
// Solution 1: Check API key
console.log(process.env.AURIGRAPH_API_KEY);

// Solution 2: Verify token not expired
const manager = new AuthManager({ apiKey: 'xxx' });
console.log(manager.getAuthType()); // Should match your auth method

// Solution 3: Refresh token
const newToken = await client.getAuthHeader();
```

### Rate Limiting

**Problem**: "429 Too Many Requests"

```typescript
// Solution: Implement backoff
const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

async function withBackoff(fn: () => Promise<any>) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.code === 'RATE_LIMIT_ERROR') {
        const delay = BASE_DELAY * Math.pow(2, i);
        console.log(`Rate limited. Waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}
```

### WebSocket Connection Issues

**Problem**: Event stream not connecting

```typescript
// Solution: Check WebSocket configuration
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io', // HTTPS for WSS
  websocket: {
    enabled: true,
    reconnect: true,
    maxReconnectAttempts: 5
  }
});

// Debug event stream
client.on('error', (error) => {
  console.error('Stream error:', error.message);
});
```

---

## Support Resources

- **Documentation**: https://docs.aurigraph.io
- **GitHub Issues**: https://github.com/Aurigraph-DLT/Aurigraph-DLT/issues
- **Email**: support@aurigraph.io
- **Slack Community**: https://aurigraph.slack.com
- **Discord**: https://discord.gg/aurigraph

---

**Last Updated**: October 31, 2025
**SDK Version**: 1.0.0
