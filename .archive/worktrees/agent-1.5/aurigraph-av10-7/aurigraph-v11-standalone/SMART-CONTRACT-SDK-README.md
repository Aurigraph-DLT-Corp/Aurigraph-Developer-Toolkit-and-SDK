# Aurigraph Smart Contract SDK

**Version**: 11.2.1
**Platform**: Aurigraph DLT
**Release Date**: October 12, 2025
**Status**: ✅ Production Ready

---

## 🎯 Overview

The Aurigraph Smart Contract SDK provides a comprehensive interface for deploying, executing, and managing smart contracts on the Aurigraph DLT blockchain platform. Built on top of Quarkus and Java 21, it offers high-performance contract execution with reactive programming patterns.

### Key Features

✅ **Multi-Language Support** - Solidity, Java, JavaScript, WASM, Python
✅ **REST API** - Complete RESTful interface for contract operations
✅ **Java Client Library** - Type-safe SDK for Java applications
✅ **Gas Metering** - Built-in gas calculation and limits
✅ **State Management** - Persistent contract state storage
✅ **Execution History** - Complete audit trail of contract executions
✅ **Pause/Resume** - Contract lifecycle management
✅ **Reactive** - Non-blocking async operations with Mutiny

---

## 📦 Installation

### Maven Dependency

Add to your `pom.xml`:

```xml
<dependency>
    <groupId>io.aurigraph</groupId>
    <artifactId>aurigraph-smart-contract-sdk</artifactId>
    <version>11.2.1</version>
</dependency>
```

### Gradle Dependency

Add to your `build.gradle`:

```gradle
implementation 'io.aurigraph:aurigraph-smart-contract-sdk:11.2.1'
```

---

## 🚀 Quick Start

### 1. Initialize SDK Client

```java
import io.aurigraph.v11.smartcontract.sdk.AurigraphSDKClient;

// Connect to Aurigraph DLT
AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");
```

### 2. Deploy a Smart Contract

```java
import io.aurigraph.v11.smartcontract.SmartContract;
import io.aurigraph.v11.smartcontract.SmartContract.ContractLanguage;

// Create contract
SmartContract contract = new SmartContract(
    "MyToken",                    // Contract name
    sourceCode,                   // Contract source code
    ContractLanguage.JAVA,        // Programming language
    "owner123"                    // Owner address
);

// Deploy contract
SmartContract deployed = client.deployContract(contract).join();
System.out.println("Contract ID: " + deployed.getContractId());
```

### 3. Execute Contract Method

```java
import java.util.Map;

// Prepare parameters
Map<String, Object> params = Map.of(
    "to", "recipient456",
    "amount", 100
);

// Execute method
ContractExecution execution = client.executeContract(
    contractId,
    "transfer",              // Method name
    params,                  // Parameters
    "caller123"              // Caller address
).join();

System.out.println("Execution Status: " + execution.getStatus());
System.out.println("Gas Used: " + execution.getGasUsed());
```

---

## 📚 API Reference

### REST API Endpoints

#### Deploy Contract
```http
POST /api/v11/contracts/deploy
Content-Type: application/json

{
  "name": "MyToken",
  "code": "contract source code...",
  "language": "JAVA",
  "owner": "owner123",
  "version": "1.0.0"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contract deployed successfully",
  "contract": {
    "contractId": "a1b2c3d4-...",
    "name": "MyToken",
    "status": "DEPLOYED",
    "deployedAt": "2025-10-12T18:30:00Z"
  }
}
```

#### Execute Contract
```http
POST /api/v11/contracts/{contractId}/execute
Content-Type: application/json

{
  "method": "transfer",
  "parameters": {
    "to": "recipient456",
    "amount": 100
  },
  "caller": "caller123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contract executed successfully",
  "execution": {
    "executionId": "e1f2g3h4-...",
    "status": "SUCCESS",
    "gasUsed": 21350,
    "executionTimeMs": 45,
    "result": {
      "success": true,
      "transactionHash": "0x..."
    }
  }
}
```

#### Get Contract
```http
GET /api/v11/contracts/{contractId}
```

#### List Contracts
```http
GET /api/v11/contracts
GET /api/v11/contracts?owner=owner123
```

#### Get Execution History
```http
GET /api/v11/contracts/{contractId}/executions
```

#### Pause Contract
```http
POST /api/v11/contracts/{contractId}/pause
```

#### Resume Contract
```http
POST /api/v11/contracts/{contractId}/resume
```

#### SDK Info
```http
GET /api/v11/contracts/sdk/info
```

---

## 💻 SDK Client Methods

### Contract Operations

#### `deployContract(SmartContract contract)`
Deploy a new smart contract to the blockchain.

**Parameters**:
- `contract` - SmartContract object with code, language, and metadata

**Returns**: `CompletableFuture<SmartContract>` - Deployed contract

**Example**:
```java
SmartContract contract = new SmartContract("MyContract", code, ContractLanguage.JAVA, "owner");
SmartContract deployed = client.deployContract(contract).join();
```

---

#### `executeContract(String contractId, String method, Map<String, Object> parameters, String caller)`
Execute a method on a deployed contract.

**Parameters**:
- `contractId` - Contract ID
- `method` - Method name to execute
- `parameters` - Method parameters as Map
- `caller` - Caller address

**Returns**: `CompletableFuture<ContractExecution>` - Execution result

**Example**:
```java
Map<String, Object> params = Map.of("amount", 100);
ContractExecution exec = client.executeContract(
    "contract-id",
    "mint",
    params,
    "caller123"
).join();
```

---

#### `getContract(String contractId)`
Retrieve contract details by ID.

**Returns**: `CompletableFuture<SmartContract>`

---

#### `listContracts()`
List all deployed contracts.

**Returns**: `CompletableFuture<List<SmartContract>>`

---

#### `listContracts(String owner)`
List contracts by owner.

**Returns**: `CompletableFuture<List<SmartContract>>`

---

#### `getExecutionHistory(String contractId)`
Get execution history for a contract.

**Returns**: `CompletableFuture<List<ContractExecution>>`

---

#### `pauseContract(String contractId)`
Pause contract execution.

**Returns**: `CompletableFuture<SmartContract>`

---

#### `resumeContract(String contractId)`
Resume paused contract.

**Returns**: `CompletableFuture<SmartContract>`

---

## 📝 Data Models

### SmartContract

```java
class SmartContract {
    String contractId;           // Unique contract identifier
    String name;                 // Contract name
    String version;              // Contract version
    String owner;                // Owner address
    String code;                 // Contract source code
    ContractLanguage language;   // Programming language
    String abi;                  // Application Binary Interface (JSON)
    String bytecode;             // Compiled bytecode
    Map<String, Object> state;   // Contract state
    ContractStatus status;       // Current status
    Instant createdAt;           // Creation timestamp
    Instant updatedAt;           // Last update timestamp
    Instant deployedAt;          // Deployment timestamp
    ContractMetadata metadata;   // Extended metadata
}
```

**ContractLanguage Enum**:
- `SOLIDITY` - Ethereum-compatible Solidity
- `JAVA` - Native Java contracts
- `JAVASCRIPT` - JavaScript contracts
- `WASM` - WebAssembly contracts
- `PYTHON` - Python contracts (experimental)
- `CUSTOM` - Custom contract language

**ContractStatus Enum**:
- `DRAFT` - Contract being developed
- `COMPILED` - Contract compiled successfully
- `DEPLOYED` - Contract deployed to blockchain
- `ACTIVE` - Contract active and executable
- `PAUSED` - Contract execution paused
- `DEPRECATED` - Contract marked for replacement
- `TERMINATED` - Contract permanently disabled

---

### ContractExecution

```java
class ContractExecution {
    String executionId;          // Execution identifier
    String contractId;           // Contract being executed
    String transactionId;        // Transaction ID
    String caller;               // Caller address
    String method;               // Method name
    Map<String, Object> parameters;  // Method parameters
    Object result;               // Execution result
    ExecutionStatus status;      // Execution status
    Long gasUsed;                // Gas consumed
    Long executionTimeMs;        // Execution time in milliseconds
    String error;                // Error message (if failed)
    String[] logs;               // Execution logs
    Instant startedAt;           // Start timestamp
    Instant completedAt;         // Completion timestamp
    Map<String, Object> stateChanges;  // State modifications
}
```

**ExecutionStatus Enum**:
- `PENDING` - Execution queued
- `RUNNING` - Currently executing
- `SUCCESS` - Completed successfully
- `FAILED` - Execution failed
- `REVERTED` - Transaction reverted
- `TIMEOUT` - Execution timed out

---

### ContractMetadata

```java
class ContractMetadata {
    String description;          // Contract description
    String author;               // Contract author
    String license;              // License type
    String[] tags;               // Tags for categorization
    Long gasLimit;               // Maximum gas limit
    Long gasPrice;               // Gas price per unit
    Long executionCount;         // Total executions
    String lastExecutedAt;       // Last execution timestamp
    ContractPermissions permissions;  // Access control
    Map<String, Object> customFields;  // Custom metadata
}
```

---

## 🔥 Complete Examples

### Example 1: Token Contract

```java
import io.aurigraph.v11.smartcontract.sdk.AurigraphSDKClient;
import io.aurigraph.v11.smartcontract.SmartContract;
import io.aurigraph.v11.smartcontract.SmartContract.ContractLanguage;
import io.aurigraph.v11.smartcontract.ContractExecution;
import java.util.Map;

public class TokenExample {
    public static void main(String[] args) {
        // Initialize client
        AurigraphSDKClient client = new AurigraphSDKClient(
            "https://dlt.aurigraph.io/api/v11"
        );

        // Deploy token contract
        SmartContract token = new SmartContract(
            "AurigraphToken",
            getTokenSourceCode(),
            ContractLanguage.JAVA,
            "deployer123"
        );
        SmartContract deployed = client.deployContract(token).join();
        String contractId = deployed.getContractId();

        System.out.println("✅ Token deployed: " + contractId);

        // Mint tokens
        Map<String, Object> mintParams = Map.of(
            "to", "user123",
            "amount", 1000
        );
        ContractExecution mint = client.executeContract(
            contractId,
            "mint",
            mintParams,
            "deployer123"
        ).join();

        System.out.println("✅ Minted 1000 tokens");

        // Transfer tokens
        Map<String, Object> transferParams = Map.of(
            "to", "user456",
            "amount", 200
        );
        ContractExecution transfer = client.executeContract(
            contractId,
            "transfer",
            transferParams,
            "user123"
        ).join();

        System.out.println("✅ Transferred 200 tokens");
        System.out.println("   Gas used: " + transfer.getGasUsed());

        // Check balance
        Map<String, Object> balanceParams = Map.of("account", "user456");
        ContractExecution balance = client.executeContract(
            contractId,
            "balanceOf",
            balanceParams,
            "anonymous"
        ).join();

        System.out.println("✅ Balance: " + balance.getResult());
    }

    private static String getTokenSourceCode() {
        return """
            contract Token {
                String public name = "AurigraphToken";
                String public symbol = "AGT";
                Map<String, Integer> public balances;

                function mint(String to, int amount) public {
                    balances.put(to, balances.getOrDefault(to, 0) + amount);
                }

                function transfer(String to, int amount) public returns (boolean) {
                    int senderBalance = balances.getOrDefault(msg.sender, 0);
                    require(senderBalance >= amount, "Insufficient balance");

                    balances.put(msg.sender, senderBalance - amount);
                    balances.put(to, balances.getOrDefault(to, 0) + amount);

                    return true;
                }

                function balanceOf(String account) public view returns (int) {
                    return balances.getOrDefault(account, 0);
                }
            }
            """;
    }
}
```

---

### Example 2: NFT Marketplace Contract

```java
public class NFTMarketplaceExample {
    public static void main(String[] args) {
        AurigraphSDKClient client = new AurigraphSDKClient(
            "https://dlt.aurigraph.io/api/v11"
        );

        // Deploy NFT marketplace
        SmartContract marketplace = new SmartContract(
            "NFTMarketplace",
            getNFTMarketplaceCode(),
            ContractLanguage.JAVA,
            "marketplace_owner"
        );
        SmartContract deployed = client.deployContract(marketplace).join();

        // Mint NFT
        Map<String, Object> mintParams = Map.of(
            "tokenId", "NFT-001",
            "owner", "artist123",
            "metadata", Map.of(
                "name", "Digital Artwork #1",
                "image", "ipfs://Qm...",
                "description", "Unique digital art"
            )
        );
        client.executeContract(
            deployed.getContractId(),
            "mint",
            mintParams,
            "artist123"
        ).join();

        // List NFT for sale
        Map<String, Object> listParams = Map.of(
            "tokenId", "NFT-001",
            "price", 1000
        );
        client.executeContract(
            deployed.getContractId(),
            "listForSale",
            listParams,
            "artist123"
        ).join();

        // Purchase NFT
        Map<String, Object> buyParams = Map.of(
            "tokenId", "NFT-001"
        );
        client.executeContract(
            deployed.getContractId(),
            "purchase",
            buyParams,
            "buyer456"
        ).join();

        System.out.println("✅ NFT marketplace transaction complete!");
    }

    private static String getNFTMarketplaceCode() {
        return """
            contract NFTMarketplace {
                Map<String, NFT> public nfts;
                Map<String, Listing> public listings;

                function mint(String tokenId, String owner, Map metadata) public {
                    nfts.put(tokenId, new NFT(tokenId, owner, metadata));
                }

                function listForSale(String tokenId, int price) public {
                    require(nfts.get(tokenId).owner == msg.sender, "Not owner");
                    listings.put(tokenId, new Listing(tokenId, price, msg.sender));
                }

                function purchase(String tokenId) public payable {
                    Listing listing = listings.get(tokenId);
                    require(msg.value >= listing.price, "Insufficient payment");

                    // Transfer ownership
                    nfts.get(tokenId).owner = msg.sender;

                    // Remove listing
                    listings.remove(tokenId);

                    // Transfer funds to seller
                    transfer(listing.seller, listing.price);
                }
            }
            """;
    }
}
```

---

## ⚙️ Configuration

### Application Properties

Add to `application.properties`:

```properties
# Smart Contract Configuration
smartcontract.gas.default-limit=1000000
smartcontract.execution.timeout-ms=30000
smartcontract.storage.backend=leveldb
smartcontract.storage.path=/data/contracts

# Security
smartcontract.require-signature=true
smartcontract.allowed-languages=JAVA,SOLIDITY,JAVASCRIPT
```

---

## 🔒 Security Best Practices

### 1. Contract Validation
Always validate contract code before deployment:
```java
// Check for known vulnerabilities
ContractValidator validator = new ContractValidator();
ValidationResult result = validator.validate(contract);
if (!result.isValid()) {
    throw new SecurityException("Contract validation failed: " + result.getErrors());
}
```

### 2. Access Control
Implement proper permissions:
```java
ContractMetadata metadata = new ContractMetadata();
metadata.getPermissions().setPublic(false);
metadata.getPermissions().setAllowedCallers(new String[]{"user123", "user456"});
contract.setMetadata(metadata);
```

### 3. Gas Limits
Set appropriate gas limits to prevent DoS:
```java
metadata.setGasLimit(500000L);  // Limit execution cost
```

### 4. Input Validation
Validate all parameters:
```java
if (amount <= 0) {
    throw new IllegalArgumentException("Amount must be positive");
}
```

---

## 📊 Performance Considerations

### Async Operations
Use async methods for better performance:
```java
// Parallel contract executions
CompletableFuture<ContractExecution> exec1 = client.executeContract(...);
CompletableFuture<ContractExecution> exec2 = client.executeContract(...);
CompletableFuture<ContractExecution> exec3 = client.executeContract(...);

CompletableFuture.allOf(exec1, exec2, exec3).join();
```

### Batch Operations
Process multiple contracts efficiently:
```java
List<SmartContract> contracts = client.listContracts().join();
List<CompletableFuture<ContractExecution>> futures = contracts.stream()
    .map(c -> client.executeContract(c.getContractId(), "update", params, caller))
    .toList();

CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
```

---

## 🧪 Testing

### Unit Tests
```java
@QuarkusTest
class SmartContractServiceTest {

    @Inject
    SmartContractService service;

    @Test
    void testDeployContract() {
        SmartContract contract = new SmartContract(
            "TestContract",
            "contract code",
            ContractLanguage.JAVA,
            "owner"
        );

        SmartContract deployed = service.deployContract(contract).await().indefinitely();

        assertNotNull(deployed.getContractId());
        assertEquals(ContractStatus.DEPLOYED, deployed.getStatus());
    }

    @Test
    void testExecuteContract() {
        // Deploy contract first
        SmartContract deployed = service.deployContract(contract).await().indefinitely();

        // Execute method
        Map<String, Object> params = Map.of("value", 100);
        ContractExecution execution = service.executeContract(
            deployed.getContractId(),
            "setValue",
            params,
            "caller"
        ).await().indefinitely();

        assertEquals(ExecutionStatus.SUCCESS, execution.getStatus());
        assertTrue(execution.getGasUsed() > 0);
    }
}
```

---

## 📞 Support & Resources

### Documentation
- **Full API Docs**: https://docs.aurigraph.io/smart-contracts
- **GitHub Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Examples**: `/src/main/java/io/aurigraph/v11/smartcontract/examples/`

### Community
- **Discord**: https://discord.gg/aurigraph
- **Forum**: https://forum.aurigraph.io
- **Stack Overflow**: Tag `aurigraph-dlt`

### Issues & Bug Reports
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Security Issues**: security@aurigraph.io

---

## 📄 License

Copyright © 2025 Aurigraph DLT Corp. All Rights Reserved.

---

## 🎉 Changelog

### Version 11.2.1 (2025-10-12)
- ✅ Initial Smart Contract SDK release
- ✅ Multi-language support (Java, Solidity, JavaScript, WASM, Python)
- ✅ Complete REST API
- ✅ Java client library
- ✅ Gas metering and limits
- ✅ State management
- ✅ Execution history
- ✅ Pause/Resume functionality
- ✅ Example contracts (Token, NFT)
- ✅ Comprehensive documentation

---

**Aurigraph Smart Contract SDK v11.2.1**
**Status**: ✅ Production Ready
**Platform**: Aurigraph DLT

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*

*Co-Authored-By: Claude <noreply@anthropic.com>*
