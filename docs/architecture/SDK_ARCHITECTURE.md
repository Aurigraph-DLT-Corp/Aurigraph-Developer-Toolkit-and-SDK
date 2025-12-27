# 🛠️ SDK Architecture - Multi-Language Client Libraries

**Document Version**: 1.0
**Status**: ✅ Active
**Epic**: AV11-906
**Team**: @SDKDevTeam

---

## Overview

The Aurigraph V11 SDK provides unified client libraries for TypeScript/JavaScript, Python, and Go, enabling developers to interact with the blockchain through a consistent, idiomatic API across languages.

### Goals
- ✅ Unified API contract across all languages
- ✅ Type-safe interactions with full IDE support
- ✅ Comprehensive error handling and retry logic
- ✅ High-performance async operations
- ✅ Developer-friendly documentation and examples

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                Application Layer                │
│  (Developer's code using SDK)                   │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│        SDK Client Libraries                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │TypeScript│  │ Python   │  │   Go     │      │
│  │/Node.js  │  │(asyncio) │  │(goroutine)      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │
│  ┌────▼─────────────▼─────────────▼────┐        │
│  │      API Client Interface Layer      │        │
│  │  (REST + gRPC + WebSocket support)   │        │
│  └────┬──────────────────────────────────┘       │
│       │                                          │
│  ┌────▼──────────────────────────────────┐       │
│  │   Transport & Protocol Layer          │       │
│  │  (HTTP/2, gRPC, WebSocket, Auth)      │       │
│  └────┬──────────────────────────────────┘       │
│       │                                          │
│  ┌────▼──────────────────────────────────┐       │
│  │  Serialization & Validation           │       │
│  │  (JSON, Protobuf, Type safety)        │       │
│  └────────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│       Aurigraph V11 Backend Services            │
│  (REST API @ https://dlt.aurigraph.io/api/v11) │
│  (gRPC @ dlt.aurigraph.io:9004)                 │
└─────────────────────────────────────────────────┘
```

---

## SDK Module Structure

### TypeScript/JavaScript SDK

**Location**: `/sdks/typescript`

```typescript
aurigraph-sdk-ts/
├── src/
│   ├── index.ts                    # Main export
│   ├── client/
│   │   ├── AurigraphClient.ts      # Main client class
│   │   ├── RestClient.ts           # REST transport
│   │   ├── GrpcClient.ts           # gRPC transport
│   │   └── WebSocketClient.ts      # WebSocket for real-time
│   ├── modules/
│   │   ├── blockchain.ts           # Blockchain operations
│   │   ├── transactions.ts         # Transaction management
│   │   ├── wallet.ts               # Wallet utilities
│   │   ├── contracts.ts            # Smart contracts
│   │   ├── rwa.ts                  # RWA tokenization
│   │   └── consensus.ts            # Consensus queries
│   ├── models/
│   │   ├── Block.ts
│   │   ├── Transaction.ts
│   │   ├── Account.ts
│   │   ├── Contract.ts
│   │   └── types.ts                # All type definitions
│   ├── auth/
│   │   ├── AuthProvider.ts         # Auth abstraction
│   │   ├── JwtAuth.ts              # JWT authentication
│   │   └── KeyManagement.ts        # Key utilities
│   ├── errors/
│   │   ├── AurigraphError.ts       # Base error class
│   │   ├── ValidationError.ts
│   │   ├── NetworkError.ts
│   │   └── AuthenticationError.ts
│   └── utils/
│       ├── retry.ts                # Retry logic
│       ├── http.ts                 # HTTP utilities
│       └── serialization.ts        # Encoding/decoding
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── API_REFERENCE.md
│   └── EXAMPLES.md
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Python SDK

**Location**: `/sdks/python`

```python
aurigraph_sdk/
├── aurigraph/
│   ├── __init__.py                 # Main export
│   ├── client.py                   # Main client
│   ├── transports/
│   │   ├── __init__.py
│   │   ├── rest.py                 # REST client
│   │   ├── grpc.py                 # gRPC client
│   │   └── websocket.py            # WebSocket client
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── blockchain.py           # Blockchain ops
│   │   ├── transactions.py         # Transaction mgmt
│   │   ├── wallet.py               # Wallet utils
│   │   ├── contracts.py            # Smart contracts
│   │   ├── rwa.py                  # RWA tokenization
│   │   └── consensus.py            # Consensus queries
│   ├── models/
│   │   ├── __init__.py
│   │   ├── block.py
│   │   ├── transaction.py
│   │   ├── account.py
│   │   ├── contract.py
│   │   └── types.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── provider.py             # Auth abstraction
│   │   ├── jwt.py                  # JWT auth
│   │   └── keys.py                 # Key management
│   ├── errors.py                   # Exception classes
│   └── utils.py                    # Utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── API_REFERENCE.md
│   └── EXAMPLES.md
├── setup.py
├── pyproject.toml
└── requirements.txt
```

### Go SDK

**Location**: `/sdks/go`

```go
github.com/Aurigraph-DLT-Corp/aurigraph-sdk-go/
├── aurigraph/
│   ├── client.go                   # Main client
│   ├── types.go                    # Type definitions
│   ├── transports/
│   │   ├── rest.go                 # REST client
│   │   ├── grpc.go                 # gRPC client
│   │   └── websocket.go            # WebSocket
│   ├── modules/
│   │   ├── blockchain.go
│   │   ├── transactions.go
│   │   ├── wallet.go
│   │   ├── contracts.go
│   │   ├── rwa.go
│   │   └── consensus.go
│   ├── auth/
│   │   ├── provider.go
│   │   ├── jwt.go
│   │   └── keys.go
│   ├── errors.go                   # Error types
│   └── util.go                     # Utilities
├── tests/
│   ├── unit_test.go
│   ├── integration_test.go
│   └── fixtures.go
├── examples/
│   ├── basic_client.go
│   ├── transactions.go
│   └── wallet.go
├── docs/
│   ├── README.md
│   ├── GETTING_STARTED.md
│   └── API_REFERENCE.md
├── go.mod
├── go.sum
└── Makefile
```

---

## API Contract (Unified Across Languages)

### Core Client Interface

```typescript
// All SDKs implement this contract
interface AurigraphClient {
  // Initialization
  connect(config: ClientConfig): Promise<void>
  disconnect(): Promise<void>

  // Account/Wallet
  getAccount(address: string): Promise<Account>
  getBalance(address: string): Promise<Balance>

  // Transactions
  submitTransaction(tx: Transaction): Promise<TransactionResult>
  getTransaction(hash: string): Promise<Transaction>
  getTransactions(address: string, limit?: number): Promise<Transaction[]>

  // Blockchain
  getBlock(height: number): Promise<Block>
  getBlockByHash(hash: string): Promise<Block>
  getLatestBlock(): Promise<Block>
  getBlockchainStats(): Promise<Stats>

  // Consensus
  getConsensusStatus(): Promise<ConsensusStatus>
  getValidators(): Promise<Validator[]>

  // Smart Contracts
  deployContract(code: string): Promise<ContractDeployment>
  callContract(address: string, method: string, args: any[]): Promise<any>

  // RWA Tokenization
  tokenizeAsset(asset: Asset): Promise<Token>
  getTokenInfo(tokenId: string): Promise<Token>
}
```

---

## Core Features

### 1. Authentication & Authorization
- JWT-based authentication
- API key support (development)
- OAuth2 integration (future)
- Role-based access control (RBAC)

### 2. Transaction Management
- High-level transaction builder
- Automatic fee calculation
- Gas estimation
- Transaction signing (client-side)
- Transaction status tracking

### 3. Wallet Integration
- Key pair generation
- Private key encryption
- Mnemonic seed phrase support
- Multi-sig wallet setup
- Hardware wallet support (future)

### 4. Error Handling
```
AurigraphError (base)
├── ValidationError
├── NetworkError
├── TimeoutError
├── AuthenticationError
├── AuthorizationError
└── ContractExecutionError
```

### 5. Retry Logic
- Exponential backoff
- Circuit breaker pattern
- Configurable retry count
- Rate limiting aware

### 6. Real-time Updates
- WebSocket connections
- Event subscription (transactions, blocks)
- Pub/sub pattern
- Automatic reconnection

---

## Technology Stack

| Component | TypeScript | Python | Go |
|-----------|-----------|--------|-----|
| HTTP Client | Axios | aiohttp | http (stdlib) |
| Type System | TypeScript | Pydantic | Type hints |
| Testing | Jest | pytest | testify |
| Async | Promise | asyncio | goroutines |
| Serialization | JSON + Protobuf | JSON + Protobuf | JSON + Protobuf |
| Package Manager | npm | pip | go mod |

---

## Usage Examples

### TypeScript
```typescript
import { AurigraphClient } from '@aurigraph/sdk'

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io/api/v11',
  apiKey: 'sk_...'
})

await client.connect()

// Get account info
const account = await client.getAccount('auri1...')

// Submit transaction
const tx = await client.submitTransaction({
  from: 'auri1...',
  to: 'auri2...',
  amount: '1000000',
  nonce: 1
})

await client.disconnect()
```

### Python
```python
from aurigraph import AurigraphClient

client = AurigraphClient(
    base_url='https://dlt.aurigraph.io/api/v11',
    api_key='sk_...'
)

await client.connect()

# Get account info
account = await client.get_account('auri1...')

# Submit transaction
tx = await client.submit_transaction({
    'from': 'auri1...',
    'to': 'auri2...',
    'amount': '1000000',
    'nonce': 1
})

await client.disconnect()
```

### Go
```go
package main

import "github.com/Aurigraph-DLT-Corp/aurigraph-sdk-go"

func main() {
    client := aurigraph.NewClient(
        aurigraph.WithBaseURL("https://dlt.aurigraph.io/api/v11"),
        aurigraph.WithAPIKey("sk_..."),
    )

    if err := client.Connect(ctx); err != nil {
        log.Fatal(err)
    }

    // Get account info
    account, err := client.GetAccount(ctx, "auri1...")
    if err != nil {
        log.Fatal(err)
    }

    client.Disconnect()
}
```

---

## Testing Strategy

### Unit Tests
- Individual function testing
- Mock external dependencies
- Target: 80%+ coverage

### Integration Tests
- Test against staging API
- End-to-end transaction flows
- Error scenario handling

### Performance Tests
- Concurrent request handling
- Memory leak detection
- Throughput benchmarks

---

## Deployment & Distribution

### npm (TypeScript/JavaScript)
```bash
npm publish @aurigraph/sdk
```

### PyPI (Python)
```bash
python -m twine upload aurigraph_sdk
```

### Go Module Registry
```bash
git tag v1.0.0 && git push --tags
```

---

## Documentation

- **README.md**: Overview and quick start
- **GETTING_STARTED.md**: Setup instructions
- **API_REFERENCE.md**: Complete API docs
- **EXAMPLES.md**: Code examples for common tasks
- **Changelog**: Version history and breaking changes

---

**Version**: 1.0
**Last Updated**: December 27, 2025
**Status**: ✅ Architecture Approved
