# Aurigraph Developer Toolkit - Step-by-Step Instructions

**Last Updated**: October 31, 2025
**Version**: 1.0.0

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [First API Call](#first-api-call)
3. [Query a Transaction](#query-a-transaction)
4. [Send a Transaction](#send-a-transaction)
5. [Subscribe to Events](#subscribe-to-events)
6. [Manage RWA Portfolio](#manage-rwa-portfolio)
7. [Interact with Smart Contracts](#interact-with-smart-contracts)
8. [Build a Complete Application](#build-a-complete-application)

---

## Project Setup

### Step 1: Create Project Directory

```bash
# Create new directory
mkdir my-aurigraph-project
cd my-aurigraph-project

# Initialize npm
npm init -y
```

**What happens**: Creates `package.json` with default settings.

### Step 2: Install Dependencies

```bash
# Install SDK
npm install @aurigraph/sdk

# Install type definitions and development tools
npm install --save-dev typescript ts-node @types/node
```

**What happens**: Adds SDK and TypeScript tools to your project.

### Step 3: Initialize TypeScript

```bash
# Generate tsconfig.json
npx tsc --init
```

**What happens**: Creates TypeScript configuration file. You can use defaults.

### Step 4: Create Environment File

Create `.env` in your project root:

```bash
# Create .env file
touch .env

# Add to .gitignore
echo ".env" >> .gitignore
```

Add to `.env`:

```
AURIGRAPH_BASE_URL=http://localhost:9003
AURIGRAPH_API_KEY=sk_test_your_api_key_here
```

**Important**: Replace with your actual API key!

### Step 5: Verify Setup

```bash
# Check Node version
node --version
# Should be v20.0.0 or higher

# Check npm installed SDK
npm ls @aurigraph/sdk
# Should show the version installed

# Test TypeScript
npx ts-node --version
# Should show version
```

**Checkpoints**:
- ✅ Node.js v20+ installed
- ✅ SDK installed in node_modules
- ✅ .env file created with API key
- ✅ TypeScript configured

---

## First API Call

### Step 1: Create Main File

Create `index.ts`:

```typescript
import { AurigraphClient } from '@aurigraph/sdk';

async function main() {
  console.log('Starting Aurigraph application...');
}

main().catch(console.error);
```

### Step 2: Import dotenv

Update `index.ts`:

```typescript
import dotenv from 'dotenv';
import { AurigraphClient } from '@aurigraph/sdk';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting Aurigraph application...');
}

main().catch(console.error);
```

Install dotenv:

```bash
npm install dotenv
```

### Step 3: Initialize Client

Update `index.ts`:

```typescript
import dotenv from 'dotenv';
import { AurigraphClient } from '@aurigraph/sdk';

dotenv.config();

async function main() {
  console.log('Initializing Aurigraph client...');

  // Create client
  const client = new AurigraphClient({
    baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
    auth: {
      apiKey: process.env.AURIGRAPH_API_KEY
    }
  });

  console.log('✅ Client initialized');
}

main().catch(console.error);
```

### Step 4: Make First API Call

Update `index.ts`:

```typescript
import dotenv from 'dotenv';
import { AurigraphClient } from '@aurigraph/sdk';

dotenv.config();

async function main() {
  console.log('Initializing Aurigraph client...');

  const client = new AurigraphClient({
    baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
    auth: {
      apiKey: process.env.AURIGRAPH_API_KEY
    }
  });

  console.log('✅ Client initialized');

  // Make first API call
  console.log('\nFetching network status...');
  const status = await client.getNetworkStatus();

  console.log('✅ Network Status:');
  console.log('  - Current Height:', status.currentHeight);
  console.log('  - TPS:', status.tps);
  console.log('  - Active Validators:', status.activeValidators);
}

main().catch(console.error);
```

### Step 5: Run Your Application

```bash
# Run with ts-node
npx ts-node index.ts

# Expected output:
# Initializing Aurigraph client...
# ✅ Client initialized
#
# Fetching network status...
# ✅ Network Status:
#   - Current Height: 12345
#   - TPS: 776000
#   - Active Validators: 25
```

**Troubleshooting**:
- `Cannot find module` - Run `npm install`
- `401 Unauthorized` - Check API key in `.env`
- `Connection refused` - Check `AURIGRAPH_BASE_URL`

---

## Query a Transaction

### Step 1: Add Transaction Query Function

Add to `index.ts`:

```typescript
async function queryTransaction(client: AurigraphClient, txHash: string) {
  console.log(`\nQuerying transaction: ${txHash}`);

  try {
    const tx = await client.getTransaction(txHash);

    console.log('✅ Transaction found:');
    console.log('  - Hash:', tx.hash);
    console.log('  - From:', tx.from);
    console.log('  - To:', tx.to);
    console.log('  - Value:', tx.value.toString());
    console.log('  - Status:', tx.status);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}
```

### Step 2: Call from main()

Update the `main()` function:

```typescript
async function main() {
  // ... previous code ...

  // Query a transaction (use a real tx hash)
  const txHash = '0x1234567890123456789012345678901234567890';
  await queryTransaction(client, txHash);
}
```

### Step 3: Handle Errors Properly

Update to catch specific error types:

```typescript
import {
  AurigraphClient,
  AurigraphError,
  AuthError,
  ValidationError
} from '@aurigraph/sdk';

async function queryTransaction(client: AurigraphClient, txHash: string) {
  console.log(`\nQuerying transaction: ${txHash}`);

  try {
    const tx = await client.getTransaction(txHash);

    console.log('✅ Transaction found:');
    console.log('  - Status:', tx.status);

    // Also get receipt
    const receipt = await client.getTransactionReceipt(txHash);
    console.log('  - Block:', receipt.blockNumber);
    console.log('  - Gas Used:', receipt.gasUsed);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('❌ Invalid transaction hash format');
    } else if (error instanceof AuthError) {
      console.error('❌ Authentication failed');
    } else if (error instanceof AurigraphError) {
      console.error('❌ API Error:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}
```

### Step 4: Get Real Transaction Hash

```typescript
// First, get recent transactions from an address
async function getRecentTransactions(
  client: AurigraphClient,
  address: string
) {
  console.log(`\nFetching recent transactions for: ${address}`);

  const result = await client.getTransactions(address, {
    limit: 5
  });

  console.log(`✅ Found ${result.data.length} recent transactions:`);
  result.data.forEach((tx, i) => {
    console.log(`  ${i + 1}. ${tx.hash}`);
  });

  return result.data[0]?.hash;
}
```

### Step 5: Run and Test

```bash
npx ts-node index.ts

# Should show:
# ✅ Network Status:
# ...
#
# Fetching recent transactions for: 0x...
# ✅ Found 5 recent transactions:
#   1. 0xabc...
#   2. 0xdef...
# ...
#
# Querying transaction: 0xabc...
# ✅ Transaction found:
#   - Status: confirmed
#   - Block: 12340
```

---

## Send a Transaction

### Step 1: Add Send Transaction Function

```typescript
async function sendTransaction(client: AurigraphClient) {
  console.log('\nSending transaction...');

  try {
    const txHash = await client.sendTransaction({
      from: '0xYourAddress', // Replace with your address
      to: '0xRecipient',      // Replace with recipient
      value: '1000000000000000000', // 1 token
      data: '0x'
    });

    console.log('✅ Transaction sent:', txHash);
    return txHash;
  } catch (error) {
    console.error('❌ Failed to send:', error);
    throw error;
  }
}
```

### Step 2: Wait for Confirmation

```typescript
async function waitForConfirmation(
  client: AurigraphClient,
  txHash: string,
  maxWaitTime = 60000
) {
  console.log('Waiting for confirmation...');

  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const tx = await client.getTransaction(txHash);

      if (tx.status === 'confirmed') {
        console.log('✅ Confirmed!');
        return tx;
      }

      if (tx.status === 'failed') {
        console.error('❌ Transaction failed');
        return null;
      }

      console.log(`  Attempt ${++attempts}: pending...`);
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.log(`  Attempt ${++attempts}: checking...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.error('❌ Confirmation timeout');
  return null;
}
```

### Step 3: Combine Send and Wait

```typescript
async function sendAndConfirm(client: AurigraphClient) {
  const txHash = await sendTransaction(client);
  const confirmed = await waitForConfirmation(client, txHash);
  return confirmed;
}
```

### Step 4: Add to Main

```typescript
async function main() {
  // ... previous code ...

  // Send a transaction
  console.log('\n=== SENDING TRANSACTION ===');
  const result = await sendAndConfirm(client);

  if (result) {
    console.log('Transaction confirmed!');
  }
}
```

### Step 5: Handle Errors

```typescript
async function sendAndConfirm(client: AurigraphClient) {
  try {
    const txHash = await sendTransaction(client);
    const confirmed = await waitForConfirmation(client, txHash, 120000);

    if (confirmed) {
      console.log('✅ Transaction complete!');
      return confirmed;
    } else {
      console.error('❌ Transaction did not confirm');
      return null;
    }
  } catch (error) {
    console.error('❌ Error during transaction:', error);
    return null;
  }
}
```

---

## Subscribe to Events

### Step 1: Add Event Handler

```typescript
async function subscribeToEvents(client: AurigraphClient) {
  console.log('\nSubscribing to blockchain events...');

  await client.subscribeToEvents({
    eventTypes: [
      'transaction_created',
      'transaction_confirmed',
      'block_created'
    ],
    onEvent: (event) => {
      console.log(`📢 Event: ${event.type}`);
      console.log('  Data:', event.data);
    },
    onError: (error) => {
      console.error('❌ Event error:', error);
    },
    onClose: () => {
      console.log('Connection closed');
    }
  });

  console.log('✅ Listening for events...');
}
```

### Step 2: Filter for Specific Address

```typescript
async function watchAddress(client: AurigraphClient, address: string) {
  console.log(`\nWatching address: ${address}`);

  await client.subscribeToEvents({
    eventTypes: ['transaction_created', 'transaction_confirmed'],
    onEvent: (event) => {
      const { type, data } = event;

      // Check if this transaction involves our address
      if (data.from === address || data.to === address) {
        console.log(`⭐ ${type}`);
        console.log('  Hash:', data.hash);
        console.log('  From:', data.from);
        console.log('  To:', data.to);
      }
    }
  });

  console.log('✅ Watching address for transactions...');
}
```

### Step 3: Add Reconnection Logic

```typescript
async function subscribeWithReconnect(client: AurigraphClient) {
  async function connect() {
    try {
      console.log('Connecting to event stream...');

      await client.subscribeToEvents({
        eventTypes: ['transaction_created', 'block_created'],
        onEvent: (event) => {
          console.log(`📢 ${event.type}`);
        },
        onError: (error) => {
          console.error('❌ Error:', error);
        },
        onClose: () => {
          console.log('Connection lost, reconnecting in 5 seconds...');
          setTimeout(connect, 5000);
        }
      });
    } catch (error) {
      console.error('Connection failed:', error);
      setTimeout(connect, 5000);
    }
  }

  await connect();
}
```

### Step 4: Add to Main

```typescript
async function main() {
  // ... previous code ...

  // Subscribe to events (runs indefinitely)
  console.log('\n=== SUBSCRIBING TO EVENTS ===');
  await subscribeWithReconnect(client);

  // Note: This runs forever. Press Ctrl+C to stop.
}
```

---

## Manage RWA Portfolio

### Step 1: Get Portfolio Overview

```typescript
async function getPortfolioOverview(client: AurigraphClient) {
  console.log('\nFetching RWA portfolio...');

  try {
    const portfolio = await client.getRWAPortfolio();

    console.log('✅ Portfolio Overview:');
    console.log('  - Total Assets:', portfolio.assets.length);
    console.log('  - Total Value:', portfolio.totalValue);

    return portfolio;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}
```

### Step 2: Analyze Assets

```typescript
async function analyzePortfolio(client: AurigraphClient) {
  const portfolio = await getPortfolioOverview(client);

  if (!portfolio) return;

  console.log('\n📊 Asset Breakdown:');

  // Group by type
  const byType = new Map<string, any>();
  portfolio.assets.forEach(asset => {
    const current = byType.get(asset.assetType) || { count: 0, value: 0 };
    current.count++;
    current.value += asset.quantity * asset.unitValue;
    byType.set(asset.assetType, current);
  });

  // Display
  for (const [type, data] of byType.entries()) {
    const percent = (data.value / portfolio.totalValue * 100).toFixed(1);
    console.log(`  ${type}: ${data.count} assets (${percent}%)`);
  }

  // Top 5 assets
  console.log('\n📈 Top 5 Assets:');
  const sorted = portfolio.assets.sort(
    (a, b) => (b.quantity * b.unitValue) - (a.quantity * a.unitValue)
  );

  sorted.slice(0, 5).forEach((asset, i) => {
    const value = asset.quantity * asset.unitValue;
    console.log(`  ${i + 1}. ${asset.name}: $${value.toFixed(2)}`);
  });
}
```

### Step 3: Get Asset Details

```typescript
async function getAssetDetails(client: AurigraphClient, assetId: string) {
  console.log(`\nFetching asset: ${assetId}`);

  try {
    const asset = await client.getRWAAsset(assetId);

    console.log('✅ Asset Details:');
    console.log('  - Name:', asset.name);
    console.log('  - Type:', asset.assetType);
    console.log('  - Status:', asset.status);
    console.log('  - Unit Value:', asset.unitValue);
    console.log('  - Metadata:', asset.metadata);

    return asset;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}
```

### Step 4: Monitor Asset Price

```typescript
async function monitorAssetPrice(client: AurigraphClient, assetId: string) {
  console.log(`\nMonitoring asset: ${assetId}`);

  let lastPrice: number | null = null;

  const interval = setInterval(async () => {
    try {
      const asset = await client.getRWAAsset(assetId);

      if (lastPrice !== null) {
        const change = asset.unitValue - lastPrice;
        const percent = (change / lastPrice * 100).toFixed(2);
        const icon = change > 0 ? '📈' : '📉';

        console.log(
          `${icon} ${asset.name}: $${asset.unitValue.toFixed(2)} (${percent}%)`
        );
      }

      lastPrice = asset.unitValue;
    } catch (error) {
      console.error('Error monitoring:', error);
    }
  }, 30000); // Check every 30 seconds

  // Clean up after 5 minutes
  setTimeout(() => {
    clearInterval(interval);
    console.log('Monitoring stopped');
  }, 5 * 60 * 1000);
}
```

### Step 5: Add to Main

```typescript
async function main() {
  // ... previous code ...

  // Analyze portfolio
  console.log('\n=== RWA PORTFOLIO ANALYSIS ===');
  await analyzePortfolio(client);

  // Get details about first asset
  // await getAssetDetails(client, 'asset-id-123');

  // Monitor an asset
  // await monitorAssetPrice(client, 'asset-id-123');
}
```

---

## Interact with Smart Contracts

### Step 1: Get Contract Info

```typescript
async function getContractInfo(client: AurigraphClient, contractAddress: string) {
  console.log(`\nFetching contract: ${contractAddress}`);

  try {
    const contract = await client.getContract(contractAddress);

    console.log('✅ Contract Info:');
    console.log('  - Address:', contract.address);
    console.log('  - Creator:', contract.creator);
    console.log('  - Is Contract:', contract.isContract);

    return contract;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}
```

### Step 2: Get Contract ABI

```typescript
async function getContractABI(client: AurigraphClient, contractAddress: string) {
  console.log(`\nFetching ABI: ${contractAddress}`);

  try {
    const abi = await client.getContractABI(contractAddress);

    console.log('✅ Contract ABI:');
    console.log(`  - Total items: ${abi.length}`);

    const functions = abi.filter(item => item.type === 'function');
    const events = abi.filter(item => item.type === 'event');

    console.log(`  - Functions: ${functions.length}`);
    console.log(`  - Events: ${events.length}`);

    return abi;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}
```

### Step 3: Call Read-Only Function

```typescript
async function callContractFunction(
  client: AurigraphClient,
  contractAddress: string,
  functionName: string,
  params: any[] = []
) {
  console.log(`\nCalling: ${functionName}`);

  try {
    const result = await client.callContract({
      address: contractAddress,
      functionName,
      params
    });

    console.log('✅ Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}
```

### Step 4: Execute Function (Write)

```typescript
async function executeContractFunction(
  client: AurigraphClient,
  contractAddress: string,
  functionName: string,
  params: any[] = []
) {
  console.log(`\nExecuting: ${functionName}`);

  try {
    const txHash = await client.sendTransaction({
      to: contractAddress,
      functionName,
      params,
      from: '0xYourAddress' // Replace with your address
    });

    console.log('✅ Transaction sent:', txHash);

    // Wait for confirmation
    const result = await waitForConfirmation(client, txHash);
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}
```

### Step 5: Add to Main

```typescript
async function main() {
  // ... previous code ...

  // Smart contract interaction
  console.log('\n=== SMART CONTRACT ===');
  const contractAddress = '0xContractAddress'; // Replace

  // Get info
  // await getContractInfo(client, contractAddress);

  // Get ABI
  // const abi = await getContractABI(client, contractAddress);

  // Call read-only function
  // await callContractFunction(client, contractAddress, 'name');

  // Execute function
  // await executeContractFunction(client, contractAddress, 'transfer', [
  //   '0xRecipient',
  //   '1000000000000000000'
  // ]);
}
```

---

## Build a Complete Application

### Step 1: Create Application Class

```typescript
class AurigraphApp {
  private client: AurigraphClient;

  constructor(client: AurigraphClient) {
    this.client = client;
  }

  async initialize() {
    console.log('Initializing application...');

    const status = await this.client.getNetworkStatus();
    console.log(`✅ Connected to Aurigraph (Height: ${status.currentHeight})`);
  }

  async showMenu() {
    console.log('\n=== AURIGRAPH MENU ===');
    console.log('1. Network Status');
    console.log('2. Query Transaction');
    console.log('3. RWA Portfolio');
    console.log('4. Subscribe to Events');
    console.log('5. Exit');
  }

  async networkStatus() {
    const status = await this.client.getNetworkStatus();
    console.log('Network Status:');
    console.log('  Height:', status.currentHeight);
    console.log('  TPS:', status.tps);
    console.log('  Validators:', status.activeValidators);
  }

  async queryTransaction() {
    const txHash = '0x...'; // Get from user input
    const tx = await this.client.getTransaction(txHash);
    console.log('Transaction:', tx);
  }

  async rwaPortfolio() {
    const portfolio = await this.client.getRWAPortfolio();
    console.log(`Portfolio: ${portfolio.assets.length} assets`);
    console.log('Value:', portfolio.totalValue);
  }

  async subscribeEvents() {
    await this.client.subscribeToEvents({
      onEvent: (event) => {
        console.log(`Event: ${event.type}`);
      }
    });
  }
}
```

### Step 2: Update Main Function

```typescript
async function main() {
  const client = new AurigraphClient({
    baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
    auth: { apiKey: process.env.AURIGRAPH_API_KEY }
  });

  const app = new AurigraphApp(client);

  try {
    await app.initialize();

    // For demo, just show network status
    await app.networkStatus();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
```

### Step 3: Add Error Handling

```typescript
class AurigraphApp {
  // ... previous code ...

  async run() {
    try {
      await this.initialize();

      let running = true;
      while (running) {
        this.showMenu();
        // In real app, read user input and process

        // For now, just demo features
        await this.networkStatus();
        running = false;
      }
    } catch (error) {
      console.error('Application error:', error);
    }
  }
}
```

### Step 4: Test Complete App

```bash
# Run your complete application
npx ts-node index.ts

# Expected output:
# Initializing application...
# ✅ Connected to Aurigraph (Height: 12345)
#
# Network Status:
#   Height: 12345
#   TPS: 776000
#   Validators: 25
```

### Step 5: Deploy

When ready to deploy:

```bash
# Compile TypeScript
npx tsc

# Run compiled JavaScript
node dist/index.js

# Or use ts-node for development
npx ts-node index.ts
```

---

## Next Steps

1. **Expand the application** with more features
2. **Add error handling** for production
3. **Implement logging** for debugging
4. **Add configuration** for different environments
5. **Write tests** for your code
6. **Deploy** to production

See [Developer Tutorial](./DEVELOPER_TUTORIAL.md) for advanced patterns and best practices.

---

*Generated: October 31, 2025*
*Aurigraph Developer Toolkit v1.0.0*
