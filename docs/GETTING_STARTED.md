# Getting Started with Aurigraph SDK

A quick guide to get you up and running with the Aurigraph SDK in 5 minutes.

## Prerequisites

- Node.js 20.0.0 or higher
- npm 9.0.0 or higher
- A text editor (VS Code recommended)

## Installation

### 1. Create a new project

```bash
mkdir my-aurigraph-app
cd my-aurigraph-app
npm init -y
```

### 2. Install Aurigraph SDK

```bash
npm install @aurigraph/sdk dotenv
```

### 3. Install TypeScript (optional but recommended)

```bash
npm install --save-dev typescript ts-node @types/node
npx tsc --init
```

## Your First Script

### 1. Create `.env` file

```env
AURIGRAPH_BASE_URL=http://localhost:9003
AURIGRAPH_API_KEY=your-api-key-here
```

### 2. Create `index.ts` file

```typescript
import dotenv from 'dotenv';
import { AurigraphClient } from '@aurigraph/sdk';

dotenv.config();

async function main() {
  // Initialize client
  const client = new AurigraphClient({
    baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
    auth: {
      apiKey: process.env.AURIGRAPH_API_KEY
    },
    debug: true  // Enable logging
  });

  try {
    // Get network status
    console.log('📊 Getting network status...');
    const status = await client.getNetworkStatus();

    console.log(`
    ✅ Connected to Aurigraph Network
    Block Height: ${status.currentHeight}
    Current TPS: ${status.tps}
    Active Validators: ${status.validators}
    Total Supply: ${status.totalSupply}
    `);

    // Get account balance
    const address = '0x1234567890123456789012345678901234567890';
    console.log(`\n💰 Fetching balance for ${address}...`);
    const balance = await client.getBalance(address);
    console.log(`Balance: ${balance} wei`);

    // Health check
    console.log('\n🏥 Running health check...');
    const health = await client.healthCheck();
    console.log(`Health Status: ${health.status}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
```

### 3. Run the script

```bash
# With ts-node
npx ts-node index.ts

# Or compile and run
npx tsc
node index.js
```

## Common Tasks

### Getting Transactions

```typescript
// Get recent transactions for an address
const address = '0x1234567890123456789012345678901234567890';

const transactions = await client.getTransactions(address, {
  limit: 10,
  sort: 'desc'
});

console.log(`Found ${transactions.total} transactions`);

for (const tx of transactions.data) {
  console.log(`
    Hash: ${tx.hash}
    Status: ${tx.status}
    Value: ${tx.value}
    Block: ${tx.blockNumber || 'Pending'}
  `);
}
```

### Real-Time Events

```typescript
// Subscribe to transaction events
console.log('📡 Listening for transaction events...');

client.subscribeToEvents(
  ['transaction.created', 'transaction.confirmed'],
  (event) => {
    if (event.type === 'transaction.created') {
      console.log(`📤 New transaction: ${event.data.hash}`);
    } else if (event.type === 'transaction.confirmed') {
      console.log(`✅ Confirmed: ${event.data.hash}`);
    }
  },
  (error) => {
    console.error('Stream error:', error.message);
  }
);

// Keep listener running
setTimeout(() => {
  client.close();
}, 60000); // Run for 1 minute
```

### Working with RWA Assets

```typescript
// Get RWA portfolio
const address = '0x1234567890123456789012345678901234567890';
const portfolio = await client.getRWAPortfolio(address);

console.log(`Portfolio Value: $${portfolio.totalValue}`);
console.log(`Total Assets: ${portfolio.assets.length}`);

for (const asset of portfolio.assets) {
  console.log(`
    Name: ${asset.name}
    Symbol: ${asset.symbol}
    Type: ${asset.metadata.assetType}
    Valuation: $${asset.metadata.valuation}
  `);
}
```

### Smart Contract Interaction

```typescript
const contractAddress = '0xcontractAddress';

// Get contract ABI
const abi = await client.getContractABI(contractAddress);
console.log(`Contract has ${abi.length} items in ABI`);

// Call a read-only function
const balance = await client.callContract(
  contractAddress,
  'balanceOf',
  ['0x1234567890123456789012345678901234567890']
);

console.log(`Balance: ${balance}`);
```

## Authentication Methods

### API Key (Recommended for beginners)

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY
  }
});
```

### JWT Token

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    token: process.env.JWT_TOKEN
  }
});
```

### OAuth 2.0

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    oauth: {
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      grantType: 'client_credentials'
    }
  }
});
```

## Error Handling

```typescript
import {
  AurigraphError,
  ValidationError,
  RateLimitError,
  AuthError
} from '@aurigraph/sdk';

try {
  const tx = await client.getTransaction('0xhash');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting
    console.log(`Wait ${error.retryAfter}ms and retry`);
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Invalid input:', error.details);
  } else if (error instanceof AuthError) {
    // Handle auth errors
    console.log('Authentication failed');
  } else if (error instanceof AurigraphError) {
    // Handle API errors
    console.log(`[${error.code}] ${error.message}`);
  }
}
```

## Configuration Options

```typescript
const client = new AurigraphClient({
  // Required
  baseURL: 'http://localhost:9003',
  auth: { apiKey: 'xxx' },

  // Optional
  apiVersion: 'v11',           // Default: v11
  timeout: 30000,              // Default: 30000ms
  debug: false,                // Default: false

  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  },

  // WebSocket configuration
  websocket: {
    enabled: true,
    reconnect: true,
    maxReconnectAttempts: 5
  }
});
```

## Next Steps

1. **Read the full README** - https://github.com/Aurigraph-DLT/aurigraph-sdk
2. **Check examples** - See `/examples` directory
3. **Read Developer Guide** - For detailed workflows
4. **Build your app** - Use SDK in your project

## Troubleshooting

### "Cannot connect to API"

```typescript
// Check your endpoint
console.log(process.env.AURIGRAPH_BASE_URL);

// Test connection
const health = await client.healthCheck();
console.log(health.status);
```

### "Unauthorized" errors

```typescript
// Check your API key
console.log(process.env.AURIGRAPH_API_KEY);

// Verify it's in environment
if (!process.env.AURIGRAPH_API_KEY) {
  console.error('API key not set in environment');
}
```

### "Rate limited"

```typescript
// SDK handles this automatically with exponential backoff
// But you can also implement custom retry logic

async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, error.retryAfter));
      } else {
        throw error;
      }
    }
  }
}

// Usage
const status = await withRetry(() => client.getNetworkStatus());
```

## Resources

- **Main Docs**: https://docs.aurigraph.io
- **GitHub**: https://github.com/Aurigraph-DLT/aurigraph-sdk
- **Issues**: https://github.com/Aurigraph-DLT/aurigraph-sdk/issues
- **Email**: support@aurigraph.io
- **Slack**: https://aurigraph.slack.com

---

**Ready to build? Start with the examples in `/examples` directory!** 🚀
