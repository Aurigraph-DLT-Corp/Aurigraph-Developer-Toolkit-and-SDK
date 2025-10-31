# Aurigraph Developer Toolkit - Developer Tutorial

**Last Updated**: October 31, 2025
**Version**: 1.0.0
**Confluence**: https://aurigraphdlt.atlassian.net/wiki/spaces/ADTAS/overview?homepageId=90177973

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [API Fundamentals](#api-fundamentals)
6. [Authentication Patterns](#authentication-patterns)
7. [Transaction Workflows](#transaction-workflows)
8. [Event Streaming](#event-streaming)
9. [Smart Contracts](#smart-contracts)
10. [RWA Management](#rwa-management)
11. [Error Handling](#error-handling)
12. [Best Practices](#best-practices)
13. [Performance Tips](#performance-tips)
14. [Debugging Guide](#debugging-guide)

---

## Introduction

The Aurigraph Developer Toolkit provides a complete TypeScript SDK for building applications on the Aurigraph DLT V11 blockchain platform. This tutorial guides you through building production-ready applications step by step.

### What You'll Learn

- Setting up your development environment
- Authenticating with the Aurigraph network
- Querying blockchain data
- Sending transactions
- Subscribing to real-time events
- Building complete applications

### Target Audience

- JavaScript/TypeScript developers
- Blockchain application developers
- Integration developers
- DevOps engineers

---

## Prerequisites

### Required Knowledge

- JavaScript/TypeScript fundamentals
- Async/await patterns
- REST API concepts
- Basic blockchain concepts

### Required Tools

- Node.js 20.0.0 or higher
- npm or yarn
- Code editor (VS Code recommended)
- Git
- Terminal/Command line experience

### Check Your Setup

```bash
# Verify Node.js version
node --version    # Should be v20.0.0 or higher

# Verify npm version
npm --version     # Should be 10.0.0 or higher

# Check git is installed
git --version
```

---

## Installation & Setup

### Step 1: Create a New Project

```bash
# Create a new directory
mkdir my-aurigraph-app
cd my-aurigraph-app

# Initialize npm project
npm init -y

# Initialize TypeScript project (optional but recommended)
npm install --save-dev typescript ts-node
npx tsc --init
```

### Step 2: Install the SDK

```bash
# Using npm
npm install @aurigraph/sdk

# Or using yarn
yarn add @aurigraph/sdk
```

### Step 3: Create Configuration

Create a `.env` file:

```bash
AURIGRAPH_BASE_URL=http://localhost:9003
AURIGRAPH_API_KEY=your-api-key-here
```

### Step 4: Create Your First Script

Create `index.ts`:

```typescript
import { AurigraphClient } from '@aurigraph/sdk';

const client = new AurigraphClient({
  baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY || 'your-api-key'
  }
});

async function main() {
  try {
    const status = await client.getNetworkStatus();
    console.log('Network Status:', status);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Step 5: Run Your Script

```bash
# Using ts-node
npx ts-node index.ts

# Or compile and run
npx tsc
node index.js
```

---

## Core Concepts

### Client Architecture

The SDK follows a modular architecture:

```
┌─────────────────────────────────────────┐
│      Your Application                   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      AurigraphClient (REST API)         │
│  ├─ Transactions                        │
│  ├─ Blocks                              │
│  ├─ Accounts                            │
│  ├─ Contracts                           │
│  ├─ RWA Assets                          │
│  ├─ Validators                          │
│  ├─ Network Info                        │
│  └─ Events                              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      AuthManager (Credentials)          │
│  ├─ API Key                             │
│  ├─ JWT Token                           │
│  ├─ OAuth 2.0                           │
│  └─ Wallet Signing                      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      HTTP Transport (axios)             │
│  ├─ Request/Response Handling           │
│  ├─ Error Handling                      │
│  ├─ Rate Limiting                       │
│  └─ Retry Logic                         │
└─────────────────────────────────────────┘
```

### Key Classes

**AurigraphClient**
- Main interface for all API operations
- Handles HTTP communication
- Manages event streaming
- Provides 30+ methods

**AuthManager**
- Handles authentication
- Manages credentials securely
- Supports 4 auth methods
- Automatically refreshes tokens

### Event Emitter Pattern

The client extends EventEmitter for event handling:

```typescript
client.on('transaction', (event) => {
  console.log('Transaction event:', event);
});

client.off('transaction', handler);
```

---

## API Fundamentals

### Making API Calls

All API calls are asynchronous and return Promises:

```typescript
// Transaction queries
const tx = await client.getTransaction(txHash);
const txList = await client.getTransactions(address);
const receipt = await client.getTransactionReceipt(txHash);

// Block queries
const block = await client.getBlock(blockNumber);
const latest = await client.getLatestBlock();
const blocks = await client.getBlocks(startBlock, endBlock);

// Account queries
const account = await client.getAccount(address);
const balance = await client.getBalance(address);
const nonce = await client.getNonce(address);

// Contract queries
const contract = await client.getContract(contractAddress);
const abi = await client.getContractABI(contractAddress);
const result = await client.callContract({ ... });

// Network queries
const status = await client.getNetworkStatus();
const metrics = await client.getNetworkMetrics();
const peers = await client.getPeers();
```

### Response Format

All successful responses follow this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  code: string;
  message?: string;
  data?: T;
  meta?: {
    timestamp: number;
    version: string;
    rateLimit?: {
      remaining: number;
      reset: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Error Handling

Errors are typed for proper handling:

```typescript
try {
  const result = await client.getTransaction(txHash);
} catch (error) {
  if (error instanceof AurigraphError) {
    console.error('API Error:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited:', error.retryAfter);
  } else if (error instanceof AuthError) {
    console.error('Auth failed:', error.message);
  }
}
```

---

## Authentication Patterns

### Pattern 1: API Key Authentication

Simplest method for server-to-server communication:

```typescript
const client = new AurigraphClient({
  baseURL: 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY
  }
});

// Now you can use all methods
const status = await client.getNetworkStatus();
```

**Best For**: Development, testing, simple applications

**Security**: Keep API key in environment variables, never commit to git

### Pattern 2: JWT Token Authentication

For token-based authentication with expiry:

```typescript
const client = new AurigraphClient({
  baseURL: 'http://localhost:9003',
  auth: {
    token: process.env.AURIGRAPH_TOKEN
  }
});

// Token is automatically refreshed when expired
const status = await client.getNetworkStatus();
```

**Best For**: Web applications, user-specific access

**Security**: Store tokens securely (not in localStorage in browsers)

### Pattern 3: OAuth 2.0 Client Credentials

For backend service-to-service authentication:

```typescript
const client = new AurigraphClient({
  baseURL: 'http://localhost:9003',
  auth: {
    oauth: {
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      authURL: 'https://auth.aurigraph.io/oauth/authorize',
      tokenURL: 'https://auth.aurigraph.io/oauth/token',
      scopes: ['read', 'write']
    }
  }
});

// Token is obtained and managed automatically
const status = await client.getNetworkStatus();
```

**Best For**: Microservices, enterprise integrations

**Security**: Client secret must be kept private

### Pattern 4: Wallet Signing Authentication

For signing with private keys (transaction-specific):

```typescript
const client = new AurigraphClient({
  baseURL: 'http://localhost:9003',
  auth: {
    privateKey: process.env.PRIVATE_KEY
  }
});

// Sign and send transactions
const txHash = await client.sendTransaction({
  from: '0x...',
  to: '0x...',
  value: '1000000000000000000'
});
```

**Best For**: Transaction signing, wallet applications

**Security**: NEVER expose private keys - keep in secure vaults only

### Switching Authentication at Runtime

```typescript
import { AuthManager } from '@aurigraph/sdk';

const authManager = new AuthManager({
  apiKey: 'initial-key'
});

// Switch to different auth method
const newAuth = new AuthManager({
  token: process.env.JWT_TOKEN
});

client.setAuthManager(newAuth);
```

---

## Transaction Workflows

### Workflow 1: Query Transaction Status

```typescript
async function checkTransaction(txHash: string) {
  try {
    // Get basic transaction info
    const tx = await client.getTransaction(txHash);
    console.log('Transaction:', {
      hash: tx.hash,
      status: tx.status,
      from: tx.from,
      to: tx.to,
      value: tx.value
    });

    // Get receipt details
    const receipt = await client.getTransactionReceipt(txHash);
    console.log('Receipt:', {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      status: receipt.status
    });

    return { tx, receipt };
  } catch (error) {
    console.error('Transaction lookup failed:', error);
  }
}

// Usage
await checkTransaction('0x1234...');
```

### Workflow 2: Send and Wait for Confirmation

```typescript
async function sendAndConfirm(transaction: any, maxWaitTime = 60000) {
  // Step 1: Send transaction
  console.log('Sending transaction...');
  const txHash = await client.sendTransaction(transaction);
  console.log('Transaction sent:', txHash);

  // Step 2: Wait for confirmation
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    const tx = await client.getTransaction(txHash);

    if (tx.status === 'confirmed') {
      console.log('✅ Transaction confirmed!');
      return tx;
    }

    if (tx.status === 'failed') {
      throw new Error('Transaction failed');
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Transaction confirmation timeout');
}

// Usage
const result = await sendAndConfirm({
  from: '0x...',
  to: '0x...',
  value: '1000000000000000000'
});
```

### Workflow 3: Batch Transaction Processing

```typescript
async function processBatchTransactions(transactions: any[]) {
  const results = [];
  const errors = [];

  for (const tx of transactions) {
    try {
      const txHash = await client.sendTransaction(tx);
      results.push({ success: true, hash: txHash });
    } catch (error) {
      errors.push({ success: false, tx, error });
    }
  }

  return { results, errors };
}

// Usage
const { results, errors } = await processBatchTransactions([
  { from: '0x...', to: '0x...', value: '100' },
  { from: '0x...', to: '0x...', value: '200' }
]);

console.log(`✅ ${results.length} successful`);
console.log(`❌ ${errors.length} failed`);
```

### Workflow 4: Transaction Polling with Retry

```typescript
async function pollTransaction(txHash: string, options = {}) {
  const {
    maxRetries = 10,
    retryDelay = 2000,
    timeout = 60000
  } = options;

  let retryCount = 0;
  const startTime = Date.now();

  while (retryCount < maxRetries) {
    try {
      const tx = await client.getTransaction(txHash);

      if (tx.status === 'confirmed' || tx.status === 'failed') {
        return tx;
      }

      retryCount++;
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      if (Date.now() - startTime > timeout) {
        throw new Error('Poll timeout exceeded');
      }
    } catch (error) {
      if (retryCount >= maxRetries) {
        throw error;
      }
      retryCount++;
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## Event Streaming

### Real-Time Event Subscription

```typescript
async function subscribeToEvents() {
  await client.subscribeToEvents({
    eventTypes: ['transaction_created', 'transaction_confirmed', 'block_created'],
    onEvent: (event) => {
      console.log('Event received:', event.type);
      handleEvent(event);
    },
    onError: (error) => {
      console.error('Event error:', error);
    },
    onClose: () => {
      console.log('Connection closed');
      // Attempt reconnection
      reconnect();
    }
  });
}

function handleEvent(event: any) {
  switch (event.type) {
    case 'transaction_created':
      console.log('New transaction:', event.data.hash);
      break;
    case 'transaction_confirmed':
      console.log('Confirmed:', event.data.hash);
      break;
    case 'block_created':
      console.log('New block:', event.data.height);
      break;
  }
}

// Start listening
subscribeToEvents();
```

### Address-Specific Event Monitoring

```typescript
async function watchAddress(address: string) {
  const addresses = new Set([address]);

  await client.subscribeToEvents({
    onEvent: (event) => {
      const { type, data } = event;

      // Check if event involves watched address
      if (
        (type === 'transaction_created' || type === 'transaction_confirmed') &&
        (data.from === address || data.to === address)
      ) {
        console.log(`⭐ Watched address involved in ${type}`);
        console.log('Details:', data);
      }
    }
  });
}

// Watch an address
watchAddress('0x1234567890123456789012345678901234567890');
```

### Event Aggregation

```typescript
class EventAggregator {
  private events: Map<string, any[]> = new Map();
  private batchSize = 100;
  private flushInterval = 5000;

  constructor(private client: AurigraphClient) {
    this.startFlushing();
  }

  async start() {
    await this.client.subscribeToEvents({
      onEvent: (event) => this.aggregate(event),
      onError: (error) => console.error('Event error:', error)
    });
  }

  private aggregate(event: any) {
    const type = event.type;
    if (!this.events.has(type)) {
      this.events.set(type, []);
    }

    const list = this.events.get(type)!;
    list.push(event);

    if (list.length >= this.batchSize) {
      this.flush(type);
    }
  }

  private async flush(type: string) {
    const events = this.events.get(type) || [];
    if (events.length === 0) return;

    console.log(`Flushing ${events.length} ${type} events`);
    // Process events (save to DB, etc.)
    this.events.set(type, []);
  }

  private startFlushing() {
    setInterval(() => {
      for (const [type] of this.events) {
        this.flush(type);
      }
    }, this.flushInterval);
  }
}

// Usage
const aggregator = new EventAggregator(client);
await aggregator.start();
```

---

## Smart Contracts

### Reading Contract Data

```typescript
async function queryContract(contractAddress: string) {
  // Get contract info
  const contract = await client.getContract(contractAddress);
  console.log('Contract:', contract);

  // Get ABI
  const abi = await client.getContractABI(contractAddress);
  console.log('ABI methods:', abi.length);

  // Call a read-only function
  const balance = await client.callContract({
    address: contractAddress,
    functionName: 'balanceOf',
    params: ['0xUserAddress']
  });

  console.log('Balance:', balance);
}

// Usage
await queryContract('0xContractAddress');
```

### Executing Contract Functions

```typescript
async function executeContractFunction(
  contractAddress: string,
  functionName: string,
  params: any[]
) {
  try {
    // Prepare transaction
    const tx = {
      to: contractAddress,
      functionName,
      params,
      from: '0xYourAddress'
    };

    // Send transaction
    const txHash = await client.sendTransaction(tx);
    console.log('Transaction sent:', txHash);

    // Wait for confirmation
    const result = await client.getTransaction(txHash);
    return result;
  } catch (error) {
    console.error('Execution failed:', error);
  }
}

// Usage
await executeContractFunction(
  '0xContractAddress',
  'transfer',
  ['0xRecipient', '1000']
);
```

---

## RWA Management

### Fetch RWA Portfolio

```typescript
async function analyzePortfolio() {
  // Get portfolio
  const portfolio = await client.getRWAPortfolio();

  console.log('Assets in portfolio:', portfolio.assets.length);

  // Analyze by type
  const byType = new Map();
  portfolio.assets.forEach(asset => {
    const count = byType.get(asset.assetType) || 0;
    byType.set(asset.assetType, count + 1);
  });

  console.log('Breakdown by type:');
  for (const [type, count] of byType) {
    console.log(`  ${type}: ${count} assets`);
  }

  return portfolio;
}

// Usage
await analyzePortfolio();
```

### Monitor Specific Asset

```typescript
async function monitorAsset(assetId: string) {
  let lastPrice = null;

  setInterval(async () => {
    try {
      const asset = await client.getRWAAsset(assetId);

      if (lastPrice && asset.unitValue !== lastPrice) {
        const change = asset.unitValue - lastPrice;
        const percent = (change / lastPrice) * 100;
        console.log(`Price changed: ${change > 0 ? '📈' : '📉'} ${percent.toFixed(2)}%`);
      }

      lastPrice = asset.unitValue;
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }, 30000); // Check every 30 seconds
}

// Usage
monitorAsset('asset-123');
```

---

## Error Handling

### Comprehensive Error Handler

```typescript
import {
  AurigraphError,
  AuthError,
  ValidationError,
  RateLimitError
} from '@aurigraph/sdk';

async function safeApiCall(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('❌ Authentication failed');
      // Handle auth error (refresh token, re-authenticate, etc.)
      return null;
    }

    if (error instanceof RateLimitError) {
      console.error(`⏳ Rate limited. Retry after: ${error.retryAfter}s`);
      // Wait and retry
      await new Promise(r => setTimeout(r, error.retryAfter * 1000));
      return await fn();
    }

    if (error instanceof ValidationError) {
      console.error('❌ Validation error:', error.message);
      // Log and handle validation error
      return null;
    }

    if (error instanceof AurigraphError) {
      console.error('❌ API error:', error.message);
      return null;
    }

    // Unknown error
    console.error('❌ Unexpected error:', error);
    throw error;
  }
}

// Usage
const result = await safeApiCall(() => client.getNetworkStatus());
```

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries = 3,
  initialDelay = 1000
) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// Usage
const result = await retryWithBackoff(
  () => client.getTransaction(txHash),
  3,
  1000
);
```

---

## Best Practices

### 1. Environment Configuration

```typescript
// config.ts
export const config = {
  baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
  timeout: parseInt(process.env.REQUEST_TIMEOUT || '10000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY,
    token: process.env.AURIGRAPH_TOKEN,
    oauth: process.env.OAUTH_CONFIG ? JSON.parse(process.env.OAUTH_CONFIG) : undefined
  }
};

// Usage
import { config } from './config';
const client = new AurigraphClient(config);
```

### 2. Singleton Pattern for Client

```typescript
// client.ts
let client: AurigraphClient | null = null;

export function getClient(): AurigraphClient {
  if (!client) {
    client = new AurigraphClient({
      baseURL: process.env.AURIGRAPH_BASE_URL,
      auth: { apiKey: process.env.AURIGRAPH_API_KEY }
    });
  }
  return client;
}

// Usage everywhere
import { getClient } from './client';
const client = getClient();
```

### 3. Request Deduplication

```typescript
class RequestCache {
  private cache = new Map<string, Promise<any>>();
  private ttl = 5000; // 5 seconds

  async get<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = fn().then(
      result => {
        setTimeout(() => this.cache.delete(key), this.ttl);
        return result;
      },
      error => {
        this.cache.delete(key);
        throw error;
      }
    );

    this.cache.set(key, promise);
    return promise;
  }
}

// Usage
const cache = new RequestCache();
const balance = await cache.get(`balance:${address}`, () =>
  client.getBalance(address)
);
```

### 4. Logging Strategy

```typescript
class Logger {
  static info(msg: string, data?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data || '');
  }

  static error(msg: string, error?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error || '');
  }

  static debug(msg: string, data?: any) {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data || '');
    }
  }
}

// Usage
Logger.info('Transaction sent', { hash: txHash });
Logger.error('API call failed', error);
```

---

## Performance Tips

### 1. Batch API Calls

```typescript
// ❌ Bad - Sequential calls
for (const address of addresses) {
  const balance = await client.getBalance(address);
}

// ✅ Good - Parallel calls
const balances = await Promise.all(
  addresses.map(addr => client.getBalance(addr))
);
```

### 2. Use Pagination

```typescript
// ❌ Bad - Fetch all at once
const allTx = await client.getTransactions(address, { limit: 10000 });

// ✅ Good - Paginate
async function fetchAllTransactions(address: string) {
  let transactions = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const batch = await client.getTransactions(address, {
      limit,
      offset
    });

    if (batch.data.length === 0) break;
    transactions.push(...batch.data);
    offset += limit;
  }

  return transactions;
}
```

### 3. Debounce Frequent Requests

```typescript
function debounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  let lastCall: number = 0;

  return (async (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall < delay) {
      clearTimeout(timeoutId);
    }

    lastCall = now;

    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(fn(...args));
      }, delay);
    });
  }) as T;
}

// Usage
const debouncedSearch = debounce(
  (query: string) => client.searchTransactions({ query }),
  300
);
```

### 4. Connection Pooling

```typescript
class ClientPool {
  private clients: AurigraphClient[] = [];

  constructor(poolSize = 5) {
    for (let i = 0; i < poolSize; i++) {
      this.clients.push(new AurigraphClient({
        baseURL: process.env.AURIGRAPH_BASE_URL,
        auth: { apiKey: process.env.AURIGRAPH_API_KEY }
      }));
    }
  }

  getClient(): AurigraphClient {
    return this.clients[Math.floor(Math.random() * this.clients.length)];
  }
}
```

---

## Debugging Guide

### Enable Debug Logging

```typescript
// In your .env
DEBUG=aurigraph:*

// Or in code
process.env.DEBUG = 'aurigraph:*';

const client = new AurigraphClient({
  baseURL: 'http://localhost:9003',
  auth: { apiKey: 'your-key' },
  debug: true
});
```

### Inspect API Requests and Responses

```typescript
client.on('request', (config) => {
  console.log('→ REQUEST:', config.method, config.url);
  console.log('  Headers:', config.headers);
});

client.on('response', (response) => {
  console.log('← RESPONSE:', response.status);
  console.log('  Time:', response.duration, 'ms');
});

client.on('error', (error) => {
  console.log('✗ ERROR:', error.message);
});
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key/token validity, check expiry time |
| 429 Rate Limited | Implement exponential backoff, use request queue |
| Connection refused | Verify base URL, check network connectivity |
| Timeout | Increase timeout value, check network speed |
| Memory leak | Unsubscribe from events, clear intervals |

---

## Next Steps

- Explore the [API Reference](../README.md)
- Review [Example Applications](../examples/)
- Check [Contributing Guidelines](../CONTRIBUTING.md)
- Read [FAQ](#faq)

---

*Generated: October 31, 2025*
*Aurigraph Developer Toolkit v1.0.0*
