# Agent Sprint 20 Deployment Guide
## Feature Parity & V10 Compatibility (WebSocket, Smart Contracts, RWA)

**Sprint**: 20 (Feature Parity with V10)  
**Duration**: 10 business days  
**Target Dates**: January 16-29, 2026 (Days 11-20 overall)  
**Dependencies**: Sprint 19 completion + Gateway stable (AV11-611, AV11-615)  
**Team Size**: 3 lead agents + 1 coordination agent  
**Total Hours**: 176 person-hours  
**Success Target**: 100% feature parity with V10, zero data loss, canary validated  

---

## 📋 Agent Roster & Responsibilities

### @J4CSmartContractAgent
**Role**: EVM Bytecode Engine Implementation (BOTTLENECK)  
**Hours**: 76 (highest utilization in Sprint 20)  
**Utilization**: 60%  
**Stories**: AV11-618 (Smart Contracts)  
**Critical Path**: Yes (delays entire Sprint 20 by 1 day per day of slip)  

**Key Deliverable**: Working EVM that executes 95% of Ethereum opcodes correctly  
**Blockers to Monitor**: Solidity compiler integration, gas metering accuracy, state persistence  

---

### @J4CWebSocketAgent
**Role**: Real-Time Data Streaming (10K Concurrent)  
**Hours**: 50  
**Utilization**: 50%  
**Stories**: AV11-617 (WebSocket)  
**Critical Path**: Yes (gates push notifications, smart contract events)  

**Key Deliverable**: WebSocket server handling 10K concurrent connections <100ms latency  
**Blockers to Monitor**: Connection pool limits, memory usage, OAuth integration  

---

### @J4CRWAAgent
**Role**: Real-World Asset Tokenization & Oracles  
**Hours**: 50  
**Utilization**: 50%  
**Stories**: AV11-619 (RWA Registry)  
**Critical Path**: No (can run in parallel, less complex than contracts)  

**Key Deliverable**: RWA token issuance, transfer, and oracle price feed integration  
**Blockers to Monitor**: Oracle feed availability, price variance handling, transfer validation  

---

### @J4CCoordinatorAgent
**Role**: Daily Standup & Coordination  
**Hours**: 8  
**Responsibility**: 3-team coordination (vs 4 in Sprint 19)  

---

## 🗓️ Day-by-Day Task Breakdown

### **Days 11-12: Integration Validation & Architecture (Parallel with Sprint 19 tail)** 📋

#### Pre-Sprint Task: Gateway Validation (Day 11)
**All 3 agents**: Validate Sprint 19 deliverables before starting Sprint 20

**Deliverables**:
- [ ] Test REST-to-gRPC gateway with sample requests
- [ ] Verify data sync working (<5 sec lag)
- [ ] Confirm V10-V11 consistency (transactions matching)
- [ ] Review code quality from Sprint 19 (identify any debt)

**Duration**: 4 hours (10:00 AM - 2:00 PM, afternoon slot)  
**Output**: "Sprint 19 gate passed, ready for Sprint 20" confirmation

---

#### Day 11 Task: EVM Architecture Design
**Agent**: @J4CSmartContractAgent  
**Duration**: 8 hours  
**Story**: AV11-618 (Smart Contracts - Phase 1: Architecture)  

**Deliverables**:
- [ ] EVM bytecode engine design document (10 pages)
- [ ] Opcode mapping: Solidity 0.8.x → EVM bytecode → Java implementation
- [ ] Gas metering specification (how to calculate gas for each opcode)
- [ ] State management design (contract storage, memory, stack)
- [ ] Security architecture (overflow checks, stack depth limits)

**Design Decisions to Make**:
```
Question 1: Implement all 256 opcodes or 95% (most common)?
  → Decision: 95% (137 opcodes) covers 99% of Solidity contracts
  → Rationale: 100% implementation takes 60+ hours, 95% takes 40 hours
  → Fallback: Unimplemented opcodes throw "UnsupportedOpcode" exception

Question 2: Gas metering - match Ethereum exactly or approximate?
  → Decision: Match Ethereum gas costs within 1% tolerance
  → Rationale: DeFi protocols depend on accurate gas metering
  → Method: Use Ethereum yellow paper as reference for gas costs

Question 3: Contract storage - in-memory HashMap or persistent database?
  → Decision: Persistent database (RocksDB) with in-memory cache
  → Rationale: Contracts survive node restarts, cache improves latency
  → Implementation: LRU cache (1000 most recent contracts)

Question 4: Thread safety - single-threaded or concurrent execution?
  → Decision: Single-threaded EVM per transaction, concurrent across transactions
  → Rationale: EVM semantics require sequential execution within tx, parallelism across txs
  → Implementation: TransactionExecutor queues contracts for EVM execution
```

**Acceptance Criteria**:
- ✅ Design document reviewed by @J4CSecurityAgent (security aspects)
- ✅ Design document reviewed by @J4CDatabaseAgent (state persistence)
- ✅ Design document reviewed by @J4CConsensusAgent (integration with consensus)
- ✅ All architecture questions answered with clear rationale

**Checkpoint**: Design approved by tech lead by EOD Day 11

---

#### Day 11 Task: WebSocket Protocol Design
**Agent**: @J4CWebSocketAgent  
**Duration**: 8 hours  
**Story**: AV11-617 (WebSocket - Phase 1: Design)  

**Deliverables**:
- [ ] WebSocket message schema specification (JSON format)
- [ ] Connection lifecycle (handshake, authentication, heartbeat, disconnect)
- [ ] Subscription model (how clients subscribe to events)
- [ ] Error handling (timeouts, reconnection, fallback to polling)
- [ ] Scalability plan (connection pooling, memory per connection)

**Message Types to Define**:
```json
Client → Server Messages:
1. SUBSCRIBE
   {"type": "subscribe", "channel": "transactions", "filters": {"from": "alice"}}

2. UNSUBSCRIBE
   {"type": "unsubscribe", "channel": "transactions"}

3. PING (heartbeat)
   {"type": "ping"}

Server → Client Messages:
1. SUBSCRIBE_ACK
   {"type": "subscribed", "channel": "transactions", "subscription_id": "sub-123"}

2. EVENT (pushed update)
   {"type": "event", "channel": "transactions", "data": {...transaction...}}

3. PONG (heartbeat response)
   {"type": "pong"}

4. ERROR
   {"type": "error", "code": "AUTH_FAILED", "message": "Invalid JWT"}
```

**Acceptance Criteria**:
- ✅ Protocol spec reviewed by @J4CNetworkAgent (network aspects)
- ✅ Memory estimation done (10K connections × memory per connection)
- ✅ Latency model calculated (pub/sub latency SLA)

**Checkpoint**: Protocol approved by product owner by EOD Day 11

---

#### Day 11 Task: RWA Registry & Oracle Design
**Agent**: @J4CRWAAgent  
**Duration**: 8 hours  
**Story**: AV11-619 (RWA Registry - Phase 1: Design)  

**Deliverables**:
- [ ] RWA token data model (struct with fields: id, name, symbol, totalSupply, balances)
- [ ] Minting/burning specification (who can mint? conditions?)
- [ ] Oracle integration design (which oracle provider? update frequency?)
- [ ] Price feed schema (how prices stored? validation?)
- [ ] Transfer validation rules (compliance checks, ownership verification)

**RWA Data Model**:
```java
public class RWAToken {
  String tokenId;              // unique identifier
  String name;                 // "Tesla Stock"
  String symbol;               // "TSLA"
  BigInteger totalSupply;      // total tokens issued
  Map<String, BigInteger> balances;  // address -> balance
  String oracleProvider;       // "Chainlink" or "Band Protocol"
  String oraclePriceId;        // oracle identifier for price feed
  BigDecimal currentPrice;     // latest price from oracle
  long lastPriceUpdate;        // timestamp of last price
  
  // Mint new tokens (only by authorized minter)
  void mint(String recipient, BigInteger amount);
  
  // Burn tokens (remove from circulation)
  void burn(String holder, BigInteger amount);
  
  // Transfer tokens with compliance checks
  void transfer(String from, String to, BigInteger amount);
}
```

**Oracle Integration Approach**:
```
Update Frequency: Every 5 minutes (configurable)
Price Validation: If new price deviates >10% from previous, trigger alert
Stale Price Handling: If price >1 hour old, warn users (may use cached price)
Fallback: If oracle unavailable, use last-known price with warning
```

**Acceptance Criteria**:
- ✅ Data model reviewed by @J4CDatabaseAgent (storage)
- ✅ Oracle choice approved by product owner (which provider?)
- ✅ Compliance checks identified by legal team

**Checkpoint**: Design approved by stakeholders by EOD Day 11

---

#### Day 12 Task: Code Skeleton & Integration Prep (All Agents)
**Duration**: 8 hours  

**All 3 agents**:
- [ ] @J4CSmartContractAgent: Create EVM engine code skeleton
- [ ] @J4CWebSocketAgent: Create WebSocket server skeleton
- [ ] @J4CRWAAgent: Create RWA registry skeleton

**Integration Checkpoints Scheduled**:
- Day 12 EOD: All code skeletons compile + pass lint checks
- Day 13: Integration of EVM with transaction service (contracts callable from gateway)
- Day 14: Integration of WebSocket with event bus (push notifications)
- Day 15: Integration of RWA with blockchain state (tokens persist across restarts)

---

### **Days 13-16: Core Implementation (Parallel, 3 Tracks)** 🔧

#### Track 1: EVM Bytecode Engine (Days 13-15, 40 hours)
**Agent**: @J4CSmartContractAgent

---

##### Day 13 Task 1: Core EVM Execution Loop (12 hours)
**Duration**: 12 hours (full day)  

**Deliverable**: EVM can execute bytecode, process stack, memory, storage

**Code Skeleton**:
```java
// src/main/java/io/aurigraph/v11/evm/EVMEngine.java

@ApplicationScoped
public class EVMEngine {
  
  private static final int MAX_STACK_DEPTH = 1024;
  private static final int MAX_MEMORY_SIZE = 32 * 1024 * 1024; // 32 MB
  
  public ExecutionResult execute(Contract contract, byte[] bytecode, byte[] calldata) {
    // Initialize execution state
    ExecutionContext ctx = new ExecutionContext(
        contract,
        bytecode,
        calldata,
        new Stack<>(MAX_STACK_DEPTH),
        new Memory(MAX_MEMORY_SIZE),
        contract.getStorage()
    );
    
    // Execute bytecode sequentially
    while (ctx.programCounter < bytecode.length) {
      byte opcode = bytecode[ctx.programCounter];
      
      // Dispatch to opcode handler
      switch (opcode) {
        case 0x01: // ADD
          handleADD(ctx);
          break;
        case 0x02: // MUL
          handleMUL(ctx);
          break;
        case 0x50: // JUMPI (conditional jump)
          handleJUMPI(ctx);
          break;
        // ... handle all 137 opcodes
        default:
          throw new UnsupportedOpcodeException(opcode);
      }
      
      // Check gas limit
      if (ctx.gasUsed > ctx.gasLimit) {
        throw new OutOfGasException();
      }
      
      ctx.programCounter++;
    }
    
    // Return result (return value, gas used, state changes)
    return new ExecutionResult(
        ctx.returnValue,
        ctx.gasUsed,
        ctx.getStateChanges()
    );
  }
  
  // Opcode handlers
  private void handleADD(ExecutionContext ctx) {
    BigInteger a = ctx.stack.pop();
    BigInteger b = ctx.stack.pop();
    ctx.stack.push(a.add(b).mod(TWO_TO_256)); // EVM uses 256-bit arithmetic
    ctx.gasUsed += 3; // ADD costs 3 gas
  }
  
  // ... similar handlers for all opcodes
}
```

**Acceptance Criteria**:
- ✅ Core execution loop compiles + unit tests pass
- ✅ Can execute simple bytecode (ADD, MUL, MOD)
- ✅ Stack depth limits enforced
- ✅ Gas tracking functional (gas increases with each operation)

**Checkpoint**: Bytecode execution working for 20 basic opcodes by EOD Day 13

---

##### Day 13 Task 2: Memory & Storage Management (12 hours)
**Duration**: 12 hours (overlaps with task 1)  

**Deliverable**: EVM memory and contract storage working

**Code Pattern**:
```java
// src/main/java/io/aurigraph/v11/evm/Memory.java

public class Memory {
  private byte[] data;
  private int size;
  
  public void write(int offset, byte value) {
    // Grow memory if needed
    if (offset >= data.length) {
      growMemory(offset + 1);
    }
    data[offset] = value;
    size = Math.max(size, offset + 1);
  }
  
  public byte read(int offset) {
    if (offset < size) {
      return data[offset];
    }
    return 0; // Uninitialized memory reads as zero
  }
  
  private void growMemory(int newSize) {
    byte[] newData = new byte[Math.max(newSize, data.length * 2)];
    System.arraycopy(data, 0, newData, 0, data.length);
    data = newData;
  }
}

// src/main/java/io/aurigraph/v11/evm/ContractStorage.java

@ApplicationScoped
public class ContractStorage {
  
  @Inject
  RocksDBDatabase db;
  
  public void setStorageAt(String contractAddress, BigInteger key, BigInteger value) {
    String storageKey = contractAddress + ":" + key.toString(16);
    db.put(storageKey.getBytes(), value.toByteArray());
  }
  
  public BigInteger getStorageAt(String contractAddress, BigInteger key) {
    String storageKey = contractAddress + ":" + key.toString(16);
    byte[] bytes = db.get(storageKey.getBytes());
    return bytes != null ? new BigInteger(bytes) : BigInteger.ZERO;
  }
}
```

**Acceptance Criteria**:
- ✅ Memory reads/writes working
- ✅ Memory grows dynamically (no fixed size)
- ✅ Contract storage persists to RocksDB
- ✅ Storage loads correctly on contract reload

**Checkpoint**: Memory + storage tests passing by EOD Day 13

---

##### Day 14 Task 1: Gas Metering (16 hours)
**Duration**: 16 hours (full 2 days of work)  

**Deliverable**: All 137 opcodes have correct gas costs

**Gas Cost Reference** (from Ethereum):
```
Tier 0 (0 gas): STOP, REVERT
Tier 1 (3 gas): ADD, MUL, SUB, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD, etc.
Tier 2 (5 gas): SLOAD (load from contract storage)
Tier 3 (20 gas): SSTORE (write to contract storage)
Tier 4 (high): CALL, DELEGATECALL, STATICCALL (expensive external calls)
```

**Code Pattern**:
```java
// src/main/java/io/aurigraph/v11/evm/GasCalculator.java

public class GasCalculator {
  
  public static int getOpcodeGasCost(byte opcode) {
    switch (opcode) {
      // Tier 0: 0 gas
      case 0x00: return 0; // STOP
      case 0xFD: return 0; // REVERT
      
      // Tier 1: 3 gas
      case 0x01: return 3; // ADD
      case 0x02: return 3; // MUL
      case 0x03: return 3; // SUB
      
      // Tier 2: 5 gas
      case 0x54: return 5; // SLOAD
      
      // Tier 3: 20 gas
      case 0x55: return 20000; // SSTORE (expensive!)
      
      // Tier 4: ~700 gas
      case 0xF1: return 700; // CALL (depends on input)
      
      default: throw new UnsupportedOpcodeException(opcode);
    }
  }
  
  public static int getMemoryGasCost(int newSize) {
    // Memory grows quadratically
    return (newSize * newSize) / 512;
  }
}
```

**Acceptance Criteria**:
- ✅ Gas costs match Ethereum specification (within 1%)
- ✅ Dynamic costs (e.g., SSTORE, CALL) calculated correctly
- ✅ Total gas tracking accurate across multiple operations

**Checkpoint**: Gas metering validated against test cases by EOD Day 14

---

##### Day 15 Task 1: Solidity Test Contracts (12 hours)
**Duration**: 12 hours  

**Deliverable**: EVM can execute real Solidity contracts

**Test Contracts**:
```solidity
// contracts/SimpleAdd.sol - Simplest contract
pragma solidity ^0.8.0;

contract SimpleAdd {
  function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;
  }
}

// contracts/Counter.sol - Storage contract
pragma solidity ^0.8.0;

contract Counter {
  uint256 public count = 0;
  
  function increment() public {
    count += 1;
  }
  
  function decrement() public {
    count -= 1;
  }
  
  function getCount() public view returns (uint256) {
    return count;
  }
}

// contracts/ERC20Simple.sol - Token contract (simplified)
pragma solidity ^0.8.0;

contract ERC20Simple {
  mapping(address => uint256) public balances;
  uint256 public totalSupply;
  
  constructor(uint256 initialSupply) {
    totalSupply = initialSupply;
    balances[msg.sender] = initialSupply;
  }
  
  function transfer(address to, uint256 amount) public {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;
    balances[to] += amount;
  }
}
```

**Compile & Test**:
```bash
# Compile with solc
solc --bin --abi contracts/Counter.sol -o build/

# Load bytecode into V11 EVM
POST /api/v11/contracts/deploy
{
  "bytecode": "60806040...", // compiled bytecode
  "abi": [...],
  "initializer_args": []
}

# Execute contract method (increment)
POST /api/v11/contracts/execute
{
  "contract_address": "0x1234...",
  "method": "increment",
  "args": []
}

# Verify state changed (count incremented)
GET /api/v11/contracts/0x1234.../storage?key=0
# Expected: {"value": "1"}
```

**Acceptance Criteria**:
- ✅ All 3 test contracts deploy and execute
- ✅ Contract state persists (count remains after restart)
- ✅ Gas usage reasonable (not >10x Ethereum)

**Checkpoint**: EVM executing Solidity contracts by EOD Day 15

---

#### Track 2: WebSocket Real-Time Streaming (Days 13-15, 24 hours)
**Agent**: @J4CWebSocketAgent

---

##### Day 13 Task: WebSocket Server Setup (12 hours)
**Duration**: 12 hours  

**Deliverable**: WebSocket server accepting 100 concurrent connections

**Code Skeleton**:
```java
// src/main/java/io/aurigraph/v11/websocket/WebSocketEndpoint.java

@ServerEndpoint("/api/v11/ws")
@ApplicationScoped
public class WebSocketEndpoint {
  
  private static final Set<Session> sessions = ConcurrentHashMap.newKeySet();
  private static final int MAX_CONNECTIONS = 10000;
  
  @OnOpen
  public void onOpen(Session session) {
    if (sessions.size() >= MAX_CONNECTIONS) {
      try {
        session.close(new CloseReason(
            CloseReason.CloseCodes.TOO_BIG,
            "Max connections reached"
        ));
      } catch (IOException e) {
        // Connection already closed
      }
      return;
    }
    
    sessions.add(session);
    logger.info("WebSocket connected: {} (total: {})", session.getId(), sessions.size());
  }
  
  @OnMessage
  public void onMessage(String message, Session session) {
    try {
      // Parse incoming message
      JsonObject json = Json.createReader(new StringReader(message)).readObject();
      String type = json.getString("type");
      
      switch (type) {
        case "subscribe":
          handleSubscribe(json, session);
          break;
        case "unsubscribe":
          handleUnsubscribe(json, session);
          break;
        case "ping":
          sendMessage(session, Json.createObjectBuilder()
              .add("type", "pong")
              .build().toString());
          break;
        default:
          sendMessage(session, Json.createObjectBuilder()
              .add("type", "error")
              .add("message", "Unknown message type: " + type)
              .build().toString());
      }
    } catch (Exception e) {
      logger.error("Error processing message: {}", e.getMessage());
    }
  }
  
  @OnClose
  public void onClose(Session session) {
    sessions.remove(session);
    logger.info("WebSocket closed: {}", session.getId());
  }
  
  @OnError
  public void onError(Session session, Throwable error) {
    logger.error("WebSocket error: {}", error.getMessage());
    try {
      session.close();
    } catch (IOException e) {
      // Already closed
    }
  }
  
  private void sendMessage(Session session, String message) {
    try {
      session.getBasicRemote().sendText(message);
    } catch (IOException e) {
      logger.warn("Failed to send message: {}", e.getMessage());
    }
  }
}
```

**Acceptance Criteria**:
- ✅ WebSocket server starts on port 9003/ws
- ✅ Can accept 100+ concurrent connections
- ✅ No memory leaks with connections opening/closing
- ✅ Basic message handling working

**Checkpoint**: WebSocket server operational with 100 concurrent clients by EOD Day 13

---

##### Day 14 Task: Authentication & Subscription Model (12 hours)
**Duration**: 12 hours  

**Deliverable**: WebSocket clients authenticate via JWT + subscribe to event channels

**Code Pattern**:
```java
// src/main/java/io/aurigraph/v11/websocket/SubscriptionManager.java

@ApplicationScoped
public class SubscriptionManager {
  
  private final Map<String, Set<Session>> subscriptions = new ConcurrentHashMap<>();
  
  public void subscribe(Session session, String channel, JsonObject filters) {
    // Validate JWT (should already be validated at WS handshake)
    String jwt = session.getQueryString(); // Or from headers
    validateJWT(jwt);
    
    subscriptions.computeIfAbsent(channel, k -> ConcurrentHashMap.newKeySet())
        .add(session);
    
    logger.info("Client {} subscribed to {}", session.getId(), channel);
  }
  
  public void publishEvent(String channel, JsonObject event) {
    Set<Session> subscribers = subscriptions.get(channel);
    if (subscribers != null) {
      subscribers.forEach(session -> {
        try {
          session.getBasicRemote().sendText(Json.createObjectBuilder()
              .add("type", "event")
              .add("channel", channel)
              .add("data", event)
              .build().toString());
        } catch (IOException e) {
          logger.warn("Failed to send to {}: {}", session.getId(), e.getMessage());
          subscribers.remove(session); // Remove dead session
        }
      });
    }
  }
  
  private void validateJWT(String jwt) {
    // Validate JWT signature and expiration
    // Throws SecurityException if invalid
  }
}

// Event publishing from transaction service
@Inject
SubscriptionManager subscriptions;

public void submitTransaction(Transaction tx) {
  // ... process transaction ...
  
  // Publish to WebSocket subscribers
  subscriptions.publishEvent("transactions", Json.createObjectBuilder()
      .add("id", tx.getId())
      .add("from", tx.getFrom())
      .add("to", tx.getTo())
      .add("amount", tx.getAmount().toString())
      .add("timestamp", tx.getTimestamp())
      .build());
}
```

**Acceptance Criteria**:
- ✅ JWT validation at WebSocket handshake
- ✅ Clients can subscribe to channels
- ✅ Events published to subscribed clients only
- ✅ <100ms latency for event delivery

**Checkpoint**: WebSocket subscriptions working by EOD Day 14

---

#### Track 3: RWA Registry & Oracle Integration (Days 13-15, 24 hours)
**Agent**: @J4CRWAAgent

---

##### Day 13-14 Task: RWA Token Minting & Transfer (16 hours)
**Duration**: 16 hours (2 days of core work)  

**Deliverable**: Create, transfer, and burn RWA tokens

**Code Skeleton**:
```java
// src/main/java/io/aurigraph/v11/rwa/RWATokenService.java

@ApplicationScoped
public class RWATokenService {
  
  @Inject
  RWARepository rwaRepo;
  
  @Inject
  RWATransactionLog txLog;
  
  @Transactional
  public RWAToken mint(String tokenId, String name, String symbol, 
                       BigInteger initialSupply, String minter) {
    // Validation
    if (initialSupply.signum() <= 0) {
      throw new IllegalArgumentException("Supply must be positive");
    }
    
    // Create token
    RWAToken token = new RWAToken(tokenId, name, symbol);
    token.setTotalSupply(initialSupply);
    token.setBalance(minter, initialSupply);
    
    // Persist to database
    rwaRepo.save(token);
    
    // Log transaction
    txLog.log("MINT", tokenId, minter, "", initialSupply);
    
    return token;
  }
  
  @Transactional
  public void transfer(String tokenId, String from, String to, BigInteger amount) {
    // Validation
    RWAToken token = rwaRepo.findById(tokenId)
        .orElseThrow(() -> new RWATokenNotFoundException(tokenId));
    
    BigInteger fromBalance = token.getBalance(from);
    if (fromBalance.compareTo(amount) < 0) {
      throw new InsufficientBalanceException(from, amount, fromBalance);
    }
    
    // Update balances
    token.setBalance(from, fromBalance.subtract(amount));
    token.setBalance(to, token.getBalance(to).add(amount));
    
    // Persist
    rwaRepo.save(token);
    
    // Log transaction
    txLog.log("TRANSFER", tokenId, from, to, amount);
  }
  
  @Transactional
  public void burn(String tokenId, String holder, BigInteger amount) {
    RWAToken token = rwaRepo.findById(tokenId)
        .orElseThrow(() -> new RWATokenNotFoundException(tokenId));
    
    BigInteger holderBalance = token.getBalance(holder);
    if (holderBalance.compareTo(amount) < 0) {
      throw new InsufficientBalanceException(holder, amount, holderBalance);
    }
    
    // Update token supply and balance
    token.setTotalSupply(token.getTotalSupply().subtract(amount));
    token.setBalance(holder, holderBalance.subtract(amount));
    
    // Persist
    rwaRepo.save(token);
    
    // Log transaction
    txLog.log("BURN", tokenId, holder, "", amount);
  }
}
```

**Acceptance Criteria**:
- ✅ Tokens can be minted by authorized address
- ✅ Tokens can be transferred between addresses
- ✅ Total supply decreases when tokens burned
- ✅ Balances persist across restarts

**Checkpoint**: RWA token operations working by EOD Day 14

---

##### Day 15 Task: Oracle Price Feed Integration (12 hours)
**Duration**: 12 hours  

**Deliverable**: Price feed updates every 5 minutes from oracle provider

**Code Pattern**:
```java
// src/main/java/io/aurigraph/v11/rwa/OraclePriceFeed.java

@ApplicationScoped
public class OraclePriceFeed {
  
  @Inject
  RWATokenService rwaService;
  
  @ConfigProperty(name = "oracle.provider")
  String oracleProvider; // "Chainlink", "Band Protocol", etc.
  
  @ConfigProperty(name = "oracle.api.key")
  String apiKey;
  
  @Scheduled(every = "5m") // Update every 5 minutes
  void updatePrices() {
    try {
      // Fetch prices from oracle
      Map<String, BigDecimal> prices = fetchOraclePrices();
      
      // Update each token with latest price
      prices.forEach((tokenId, price) -> {
        rwaService.updatePrice(tokenId, price);
        logger.info("Updated price for {}: ${}", tokenId, price);
      });
      
    } catch (OracleUnavailableException e) {
      logger.warn("Oracle unavailable: {}", e.getMessage());
      // Use cached price with warning
    }
  }
  
  private Map<String, BigDecimal> fetchOraclePrices() {
    // Call oracle API (example: Chainlink)
    Map<String, BigDecimal> prices = new HashMap<>();
    
    // GET https://oracle-api/prices?tokens=TSLA,AAPL,GOOG
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://api.chainlink.com/prices?tokens=TSLA,AAPL,GOOG"))
        .header("Authorization", "Bearer " + apiKey)
        .GET()
        .build();
    
    HttpResponse<String> response = httpClient.send(request, BodyHandlers.ofString());
    
    // Parse response and return prices
    JsonArray pricesJson = Json.createReader(new StringReader(response.body())).readArray();
    for (JsonObject priceObj : pricesJson.getValuesAs(JsonObject.class)) {
      prices.put(
          priceObj.getString("token_id"),
          new BigDecimal(priceObj.getString("price"))
      );
    }
    
    return prices;
  }
  
  // Monitor price variance
  @Scheduled(every = "1m")
  void monitorPriceVariance() {
    // If price changes >10% from previous, send alert
    List<RWAToken> tokens = rwaService.getAllTokens();
    tokens.forEach(token -> {
      BigDecimal priceChange = calculatePercentChange(
          token.getPreviousPrice(),
          token.getCurrentPrice()
      );
      
      if (priceChange.abs().compareTo(BigDecimal.TEN) > 0) {
        logger.warn("Large price change for {}: {}%", token.getTokenId(), priceChange);
        // Alert users (via WebSocket or notification)
      }
    });
  }
}
```

**Acceptance Criteria**:
- ✅ Prices update from oracle every 5 minutes
- ✅ Stale price warning if >1 hour old
- ✅ Price variance alerts (>10% change)
- ✅ Fallback to cached price if oracle unavailable

**Checkpoint**: Oracle integration working by EOD Day 15

---

### **Days 16-17: Testing & Integration Validation** ✅

#### Testing (Similar to Sprint 19)
**Agent**: @J4CTestingAgent (same process as Days 8-9 of Sprint 19)

**Unit Testing** (Day 16, 8 hours):
- EVM engine: 90% code coverage
- WebSocket server: 85% code coverage
- RWA service: 85% code coverage

**Integration Testing** (Day 16, 8 hours):
- Deploy smart contract via REST → execute via gRPC → EVM executes → state persists
- WebSocket client connects → subscribes to transactions → receives events on submit
- Mint RWA token → transfer to another address → balance updates on both sides

**Load Testing** (Day 17, 8 hours):
- WebSocket: 10K concurrent connections sustained
- Smart contracts: 100 contracts deployed, 10K method calls/sec
- RWA transfers: 1K transfers/sec

---

### **Days 18-19: Canary Deployment & Feature Parity Validation** 🎪

#### Day 18: Canary Deployment (8 hours)
Route 1% traffic to V11, validate smart contracts + WebSocket work correctly

**Test Scenarios**:
- REST request → SmartContract.deploy() → via gateway → EVM executes → state returned ✓
- WebSocket subscribe → transaction submitted → event published → received in <100ms ✓
- RWA mint → balance verified via REST GET endpoint ✓

---

#### Day 19: Feature Parity Validation (8 hours)
Validate ALL V10 features work in V11 via REST gateway

**Feature Checklist**:
- [ ] All transaction types: normal transfer, batch, smart contract call
- [ ] All query endpoints: blocks, transactions, accounts, etc.
- [ ] WebSocket real-time updates working for all event types
- [ ] RWA tokenization: mint, transfer, burn, price queries
- [ ] Error handling: invalid tx rejected, auth failures return 401, etc.

---

### **Day 20: Go/No-Go Gate for Sprint 21 (Final Decision)** 🎯

**Same process as Sprint 19 Day 10 gate:**

```
✅ PASS if ALL of the following are true:

1. Smart Contracts (AV11-618)
   ✓ EVM executes 95% of opcodes correctly
   ✓ Gas metering accurate within 1%
   ✓ State persists across restarts
   ✓ Unit test coverage ≥85%
   ✓ Integration tests 100% passing
   ✓ Security audit: 0 critical, ≤2 high findings

2. WebSocket (AV11-617)
   ✓ 10K concurrent connections sustained
   ✓ <100ms P99 message latency
   ✓ Authentication working (JWT validation)
   ✓ Subscriptions functional
   ✓ Automatic reconnection on failure

3. RWA Registry (AV11-619)
   ✓ Token mint/transfer/burn working
   ✓ Oracle price feed updating every 5 mins
   ✓ Price variance monitoring active
   ✓ Total supply tracking accurate
   ✓ All REST endpoints working

4. Feature Parity (Overall)
   ✓ 100% of V10 features functional in V11
   ✓ Canary test: <0.5% error rate on 1% traffic
   ✓ Load test: 10K WebSocket + 10K contracts/sec
   ✓ Zero data loss verified

→ RESULT: GO for Sprint 21 (performance optimization)
    Sprint 21 kick off Jan 23
    2M+ TPS optimization target
```

---

## 🎓 Key Technical Insights

`★ Insight ─────────────────────────────────────`

**1. EVM Implementation Complexity**: The 40-hour EVM engine effort is justified because smart contracts are non-negotiable for enterprise blockchain. Unlike WebSocket (nice-to-have for real-time) or RWA (business feature), EVM enables DeFi applications. The 95% opcode coverage target balances implementation speed with compatibility—100% coverage takes 60+ hours for 1% additional compatibility.

**2. Parallel Track Interdependencies**: WebSocket and RWA can run fully independent of EVM (Days 13-15 parallel tracks). EVM is on critical path because integration testing (Days 16-17) requires EVM working. WebSocket and RWA integrate later (Day 18-19). This parallelization saves 5 days vs sequential execution.

**3. Oracle as Single Point of Failure**: RWA's oracle price feed is external dependency. Day 15 implements fallback to cached price, but oracle availability remains risk. Mitigation: Choose established oracle provider (Chainlink, Band) with 99.9% uptime SLA.

**4. Security Through Separation**: Smart contracts run in isolated EVM context (no direct database access). RWA tokens use separate database tables. WebSocket can't modify state (read-only). This separation limits blast radius if one component compromised.

`─────────────────────────────────────────────────`

---

## 📊 Sprint 20 Success Metrics (Day 20 Go/No-Go)

| Metric | Day 13 | Day 15 | Day 17 | Day 20 Gate |
|--------|--------|--------|--------|------------|
| EVM opcodes working | 20/137 | 95/137 ✅ | 137/137 ✅ | 137/137 ✅ |
| WebSocket connections | 10 | 100 | 5,000 | 10,000 ✅ |
| RWA tokens deployed | 0 | 3 test | 100 | 100+ ✅ |
| Unit test coverage | 40% | 70% | 85% | ≥85% ✅ |
| Feature parity tests | 30% | 60% | 95% | 100% ✅ |
| Canary error rate | - | - | 0.3% | <0.5% ✅ |

---

## 📞 Risk Mitigation & Escalation

**Risk 1: EVM Gas Metering Inaccurate** (25% probability)
- Mitigation: Extensive testing against Ethereum test cases
- Escalation: If >5% deviation, extend Day 15 by 2 days for debugging

**Risk 2: WebSocket Latency >150ms** (15% probability)
- Mitigation: Load test from Day 14, identify bottleneck early
- Escalation: If latency >200ms, reduce max connections to 5K (acceptable)

**Risk 3: Oracle Price Feed Unavailable** (10% probability)
- Mitigation: Fallback to cached price, manual price updates
- Escalation: Use alternative oracle provider if primary unavailable

**Risk 4: Smart Contract Security Vulnerabilities** (20% probability)
- Mitigation: External security audit by Day 19
- Escalation: If critical vulnerabilities found, extend by 5 days for fixes

---

**Generated**: December 25, 2025  
**For**: Aurigraph V11 Sprint 20 Deployment  
**Status**: 🟢 Ready for Agent Deployment (pending Sprint 19 completion)

