# V11 Missing API Endpoints
**Priority Guide for Backend Development**

## Summary

The Enterprise Portal and Demo App are now integrated with V11 API, but several endpoints are still missing from the V11 backend. This document lists all required endpoints in priority order.

---

## ✅ Currently Available Endpoints

All these endpoints are **WORKING** in V11 backend:

```
GET  /api/v11/legacy/health                           - Health check
GET  /api/v11/legacy/info                             - System information
GET  /api/v11/legacy/stats                            - Transaction statistics
GET  /api/v11/legacy/system/status                    - Comprehensive system status (PRIMARY ENDPOINT)
GET  /api/v11/legacy/performance                      - Basic performance test
GET  /api/v11/legacy/performance/reactive             - Reactive performance test
POST /api/v11/legacy/performance/ultra-throughput     - Ultra-high throughput test
POST /api/v11/legacy/performance/simd-batch           - SIMD batch test
POST /api/v11/legacy/performance/adaptive-batch       - Adaptive batch test
```

**Key Endpoint**: `/api/v11/legacy/system/status` provides:
- Transaction statistics
- Consensus status
- Crypto status
- Bridge stats
- HMS stats
- AI optimization stats

---

## 🔴 HIGH Priority - Critical for Portal Functionality

### 1. Block Explorer Endpoints

**JIRA**: AV11-177 - Implement Block Explorer API

#### GET `/api/v11/blocks`
**Purpose**: Get list of recent blocks with pagination

**Query Parameters**:
```
?page=1              - Page number (default: 1)
?pageSize=20         - Items per page (default: 20)
?sort=height         - Sort column (default: height)
?direction=desc      - Sort direction (default: desc)
```

**Response**:
```json
{
  "blocks": [
    {
      "height": 1500000,
      "hash": "0x...",
      "timestamp": 1704326400000,
      "validator": "Validator 1",
      "validator_address": "0x...",
      "tx_count": 142,
      "size": 456789,
      "gas_used": 15000000,
      "gas_limit": 30000000,
      "difficulty": 0,
      "nonce": 0,
      "parent_hash": "0x...",
      "state_root": "0x...",
      "transactions_root": "0x...",
      "receipts_root": "0x...",
      "signature": "0x...",
      "extra_data": "0x00"
    }
  ],
  "total": 1500000,
  "page": 1,
  "pageSize": 20,
  "totalPages": 75000
}
```

**Implementation Location**: `AurigraphResource.java`

```java
@GET
@Path("/blocks")
@Produces(MediaType.APPLICATION_JSON)
public BlockListResponse getBlocks(
    @QueryParam("page") @DefaultValue("1") int page,
    @QueryParam("pageSize") @DefaultValue("20") int pageSize,
    @QueryParam("sort") @DefaultValue("height") String sort,
    @QueryParam("direction") @DefaultValue("desc") String direction
) {
    // Get blocks from consensus service
    return consensusService.getBlocks(page, pageSize, sort, direction);
}
```

#### GET `/api/v11/blocks/{height}`
**Purpose**: Get block details by height

**Response**:
```json
{
  "height": 1500000,
  "hash": "0x...",
  "timestamp": 1704326400000,
  "validator": "Validator 1",
  "validator_address": "0x...",
  "tx_count": 142,
  "size": 456789,
  "gas_used": 15000000,
  "gas_limit": 30000000,
  "difficulty": 0,
  "nonce": 0,
  "parent_hash": "0x...",
  "state_root": "0x...",
  "transactions_root": "0x...",
  "receipts_root": "0x...",
  "signature": "0x...",
  "extra_data": "0x00",
  "transactions": [
    {
      "tx_id": "0x...",
      "from_address": "0x...",
      "to_address": "0x...",
      "amount": 100.5,
      "type": "Transfer",
      "status": "Confirmed",
      "timestamp": 1704326400000
    }
  ]
}
```

**Implementation**:
```java
@GET
@Path("/blocks/{height}")
@Produces(MediaType.APPLICATION_JSON)
public Uni<BlockDetail> getBlockByHeight(@PathParam("height") long height) {
    return consensusService.getBlockByHeight(height);
}
```

#### GET `/api/v11/blocks/hash/{hash}`
**Purpose**: Get block details by hash

**Response**: Same as `/blocks/{height}`

**Implementation**:
```java
@GET
@Path("/blocks/hash/{hash}")
@Produces(MediaType.APPLICATION_JSON)
public Uni<BlockDetail> getBlockByHash(@PathParam("hash") String hash) {
    return consensusService.getBlockByHash(hash);
}
```

---

### 2. Transaction Explorer Endpoints

**JIRA**: AV11-178 - Implement Transaction Explorer API

#### GET `/api/v11/transactions/recent`
**Purpose**: Get recent transactions with filtering

**Query Parameters**:
```
?limit=100           - Number of transactions (default: 100)
?type=all           - Filter by type: all|transfer|token|nft|contract
?status=all         - Filter by status: all|pending|confirmed|failed
```

**Response**:
```json
{
  "transactions": [
    {
      "tx_id": "0x...",
      "from_address": "0x...",
      "to_address": "0x...",
      "amount": 100.5,
      "type": "Transfer",
      "status": "Confirmed",
      "timestamp": 1704326400000,
      "block_height": 1500000,
      "gas_used": 21000,
      "gas_price": 50,
      "nonce": 42
    }
  ],
  "total": 1234567
}
```

**Implementation**:
```java
@GET
@Path("/transactions/recent")
@Produces(MediaType.APPLICATION_JSON)
public TransactionListResponse getRecentTransactions(
    @QueryParam("limit") @DefaultValue("100") int limit,
    @QueryParam("type") @DefaultValue("all") String type,
    @QueryParam("status") @DefaultValue("all") String status
) {
    return transactionService.getRecentTransactions(limit, type, status);
}
```

#### GET `/api/v11/transactions/{txId}`
**Purpose**: Get transaction details by ID

**Response**:
```json
{
  "tx_id": "0x...",
  "from_address": "0x...",
  "to_address": "0x...",
  "amount": 100.5,
  "type": "Transfer",
  "status": "Confirmed",
  "timestamp": 1704326400000,
  "block_height": 1500000,
  "block_hash": "0x...",
  "gas_used": 21000,
  "gas_price": 50,
  "gas_limit": 100000,
  "nonce": 42,
  "signature": "0x...",
  "input_data": "0x...",
  "logs": [],
  "receipt": {
    "status": "success",
    "cumulative_gas_used": 21000
  }
}
```

**Implementation**:
```java
@GET
@Path("/transactions/{txId}")
@Produces(MediaType.APPLICATION_JSON)
public Uni<TransactionDetail> getTransactionById(@PathParam("txId") String txId) {
    return transactionService.getTransactionById(txId);
}
```

#### GET `/api/v11/transactions/search`
**Purpose**: Search transactions by various criteria

**Query Parameters**:
```
?query=0x...         - Search by tx ID, address, or hash
?from=address        - Filter by sender address
?to=address          - Filter by recipient address
?minAmount=100       - Minimum amount
?maxAmount=1000      - Maximum amount
?page=1              - Page number
?pageSize=20         - Items per page
```

**Response**: Same as `/transactions/recent` with pagination

---

## 🟡 MEDIUM Priority - Important for Full Functionality

### 3. Validator Information

**JIRA**: AV11-179 - Implement Validator Management API

#### GET `/api/v11/validators`
**Purpose**: Get list of active validators

**Response**:
```json
{
  "validators": [
    {
      "id": "validator-1",
      "address": "0x...",
      "name": "Validator 1",
      "status": "active",
      "stake": 1000000,
      "uptime": 99.9,
      "blocks_validated": 12345,
      "last_active": 1704326400000,
      "commission_rate": 5.0
    }
  ],
  "total": 5,
  "active": 5,
  "inactive": 0
}
```

#### GET `/api/v11/validators/{validatorId}`
**Purpose**: Get detailed validator information

---

### 4. Security & Bridge Metrics

**JIRA**: AV11-180 - Implement Security & Bridge APIs

#### GET `/api/v11/quantum-security`
**Purpose**: Get quantum cryptography metrics

**Response**:
```json
{
  "encryption_level": "NIST Level 5",
  "algorithm": "CRYSTALS-Kyber",
  "signature_algorithm": "CRYSTALS-Dilithium",
  "total_encrypted_transactions": 1234567,
  "quantum_resistant_blocks": 1500000,
  "security_score": 100,
  "last_security_audit": 1704326400000
}
```

#### GET `/api/v11/bridge/stats`
**Purpose**: Get cross-chain bridge statistics

**Response**:
```json
{
  "total_bridges": 5,
  "active_bridges": 5,
  "total_cross_chain_tx": 12345,
  "bridges": [
    {
      "chain": "Ethereum",
      "status": "active",
      "total_transfers": 5432,
      "total_volume": 1234567.89,
      "last_transfer": 1704326400000
    }
  ]
}
```

---

## 🟢 LOW Priority - Nice to Have

### 5. Token, Contract & NFT Management

**JIRA**: AV11-181 - Implement Asset Management APIs

#### GET `/api/v11/tokens`
**Purpose**: Get token list

#### GET `/api/v11/tokens/{tokenId}`
**Purpose**: Get token details

#### GET `/api/v11/contracts`
**Purpose**: Get smart contract list

#### GET `/api/v11/contracts/{contractId}`
**Purpose**: Get contract details

#### GET `/api/v11/nfts`
**Purpose**: Get NFT list with pagination

#### GET `/api/v11/nfts/{nftId}`
**Purpose**: Get NFT details

---

## 📊 Implementation Priority Matrix

| Priority | Endpoint | Impact | Effort | JIRA |
|----------|----------|--------|--------|------|
| 🔴 Critical | `/blocks` | High | Medium | AV11-177 |
| 🔴 Critical | `/blocks/{height}` | High | Low | AV11-177 |
| 🔴 Critical | `/transactions/recent` | High | Medium | AV11-178 |
| 🔴 Critical | `/transactions/{txId}` | High | Low | AV11-178 |
| 🟡 Important | `/validators` | Medium | Medium | AV11-179 |
| 🟡 Important | `/quantum-security` | Medium | Low | AV11-180 |
| 🟡 Important | `/bridge/stats` | Medium | Low | AV11-180 |
| 🟢 Enhancement | `/tokens` | Low | High | AV11-181 |
| 🟢 Enhancement | `/contracts` | Low | High | AV11-181 |
| 🟢 Enhancement | `/nfts` | Low | High | AV11-181 |

---

## 🛠️ Recommended Implementation Order

### Week 1-2: Critical Endpoints (AV11-177, AV11-178)
1. Implement block storage in `ConsensusService`
2. Add `/api/v11/blocks` endpoint
3. Add `/api/v11/blocks/{height}` endpoint
4. Implement transaction history storage
5. Add `/api/v11/transactions/recent` endpoint
6. Add `/api/v11/transactions/{txId}` endpoint

### Week 3-4: Important Endpoints (AV11-179, AV11-180)
1. Enhance validator tracking in `ConsensusService`
2. Add `/api/v11/validators` endpoint
3. Expose quantum security metrics
4. Add `/api/v11/quantum-security` endpoint
5. Expose bridge statistics
6. Add `/api/v11/bridge/stats` endpoint

### Week 5-6: Enhancement Endpoints (AV11-181)
1. Implement token registry
2. Add `/api/v11/tokens` endpoints
3. Implement contract registry
4. Add `/api/v11/contracts` endpoints
5. Implement NFT registry
6. Add `/api/v11/nfts` endpoints

---

## 📝 Code Templates

### Block Endpoint Template

```java
@GET
@Path("/blocks")
@Produces(MediaType.APPLICATION_JSON)
public Uni<BlockListResponse> getBlocks(
    @QueryParam("page") @DefaultValue("1") int page,
    @QueryParam("pageSize") @DefaultValue("20") int pageSize
) {
    return Uni.createFrom().item(() -> {
        // Get blocks from consensus service
        List<Block> blocks = consensusService.getRecentBlocks(page, pageSize);

        // Get total count
        long total = consensusService.getTotalBlockCount();

        return new BlockListResponse(
            blocks,
            total,
            page,
            pageSize,
            (int) Math.ceil((double) total / pageSize)
        );
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}

public record BlockListResponse(
    List<Block> blocks,
    long total,
    int page,
    int pageSize,
    int totalPages
) {}
```

### Transaction Endpoint Template

```java
@GET
@Path("/transactions/recent")
@Produces(MediaType.APPLICATION_JSON)
public Uni<TransactionListResponse> getRecentTransactions(
    @QueryParam("limit") @DefaultValue("100") int limit,
    @QueryParam("type") @DefaultValue("all") String type
) {
    return Uni.createFrom().item(() -> {
        // Get transactions from transaction service
        List<Transaction> transactions = transactionService.getRecentTransactions(limit, type);

        // Get total count
        long total = transactionService.getTotalTransactionCount();

        return new TransactionListResponse(transactions, total);
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}

public record TransactionListResponse(
    List<Transaction> transactions,
    long total
) {}
```

---

## ✅ Testing Checklist

After implementing each endpoint:

- [ ] Unit tests with 95% coverage
- [ ] Integration tests with test data
- [ ] Performance test (handle 1000 req/s)
- [ ] Error handling tests
- [ ] API documentation updated
- [ ] Swagger/OpenAPI spec updated
- [ ] Frontend integration tested
- [ ] Load testing completed

---

## 📚 Additional Resources

### Existing Code References
- **Transaction Service**: `TransactionService.java` (lines 1-500)
- **Consensus Service**: `HyperRAFTConsensusService.java`
- **Current Endpoints**: `AurigraphResource.java` (lines 27-525)

### Data Models Needed
```java
// Block.java
public record Block(
    long height,
    String hash,
    long timestamp,
    String validator,
    String validatorAddress,
    int txCount,
    long size,
    long gasUsed,
    long gasLimit,
    String parentHash,
    String stateRoot,
    String transactionsRoot,
    String receiptsRoot,
    String signature
) {}

// Transaction.java
public record Transaction(
    String txId,
    String fromAddress,
    String toAddress,
    double amount,
    String type,
    String status,
    long timestamp,
    long blockHeight,
    long gasUsed
) {}

// Validator.java
public record Validator(
    String id,
    String address,
    String name,
    String status,
    double stake,
    double uptime,
    long blocksValidated
) {}
```

---

## 🎯 Success Criteria

### For Phase 1 (AV11-177, AV11-178):
- ✅ Block explorer shows live blocks
- ✅ Transaction explorer shows live transactions
- ✅ Block details modal works
- ✅ Transaction details modal works
- ✅ Search functionality works
- ✅ Pagination works correctly

### For Phase 2 (AV11-179, AV11-180):
- ✅ Validator list shows all active validators
- ✅ Security metrics are accurate
- ✅ Bridge stats update in real-time

### For Phase 3 (AV11-181):
- ✅ Token registry is functional
- ✅ Contract explorer works
- ✅ NFT gallery displays correctly

---

**Last Updated**: 2025-10-04
**Maintainer**: V11 Backend Team
**Related**: V11-API-INTEGRATION-REPORT.md
