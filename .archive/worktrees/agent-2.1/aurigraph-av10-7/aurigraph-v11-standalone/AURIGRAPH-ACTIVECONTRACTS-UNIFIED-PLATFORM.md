# Aurigraph ActiveContracts - Unified Smart Contract Platform

## Executive Summary

**Aurigraph ActiveContracts** is a unified smart contract platform that combines:
- **Legal Contracts**: Ricardian-style contracts with legal prose + executable code
- **Smart Contract SDK**: Developer-friendly multi-language smart contract deployment
- **RWA Tokenization**: Real-World Asset tokenization (Carbon Credits, Real Estate, Financial Assets)
- **Quantum-Safe Security**: CRYSTALS-Dilithium signatures for post-quantum security
- **Multi-Party Execution**: Support for complex multi-party agreements

## Architecture Overview

### Unified Data Model: `ActiveContract`

The enhanced `ActiveContract` entity combines features from both systems:

```java
public class ActiveContract {
    // Core Identity
    private String contractId;
    private String name;
    private String version;
    private String owner;

    // Legal Contract Features (from Ricardian)
    private String legalText;              // Human-readable legal prose
    private String jurisdiction;           // Legal jurisdiction
    private List<ContractParty> parties;   // Contract parties
    private List<ContractTerm> terms;      // Contract terms
    private List<ContractSignature> signatures; // Quantum-safe signatures

    // Smart Contract Features (from SDK)
    private String code;                   // Executable code
    private ContractLanguage language;     // JAVA, SOLIDITY, JAVASCRIPT, etc.
    private String abi;                    // Application Binary Interface
    private String bytecode;               // Compiled bytecode
    private Map<String, Object> state;     // Contract state

    // Execution & Lifecycle
    private ContractStatus status;         // DRAFT, ACTIVE, PAUSED, etc.
    private List<ContractExecution> executions; // Execution history
    private List<ContractTrigger> triggers; // Event triggers

    // RWA Tokenization
    private String contractType;           // RWA, Carbon, RealEstate, etc.
    private String assetType;              // Asset classification

    // Metadata & Analytics
    private ContractMetadata metadata;
    private double enforceabilityScore;
    private String riskAssessment;
    private List<String> auditTrail;

    // Timestamps
    private Instant createdAt;
    private Instant deployedAt;
    private Instant activatedAt;
    private Instant lastExecutedAt;
}
```

### Unified Service Layer: `ActiveContractService`

Combines functionality from both services:

```java
@ApplicationScoped
public class ActiveContractService {
    // Deployment & Lifecycle
    Uni<ActiveContract> deployContract(ActiveContract contract);
    Uni<ActiveContract> activateContract(String contractId);
    Uni<ActiveContract> pauseContract(String contractId);
    Uni<ActiveContract> resumeContract(String contractId);

    // Execution
    Uni<ContractExecution> executeContract(String contractId, String method,
                                           Map<String, Object> params, String caller);
    Uni<List<ContractExecution>> getExecutionHistory(String contractId);

    // Signatures (Multi-Party)
    Uni<ActiveContract> signContract(String contractId, ContractSignature signature);
    Uni<Boolean> verifySignature(String contractId, String partyAddress);
    Uni<Boolean> isFullySigned(String contractId);

    // State Management
    Uni<ActiveContract> updateContractState(String contractId, Map<String, Object> newState);
    Uni<Map<String, Object>> getContractState(String contractId);

    // Queries
    Uni<ActiveContract> getContract(String contractId);
    Uni<List<ActiveContract>> listContracts();
    Uni<List<ActiveContract>> listContractsByOwner(String owner);
    Uni<List<ActiveContract>> listContractsByType(String contractType);

    // RWA Features
    Uni<ActiveContract> tokenizeAsset(String contractId, AssetTokenizationRequest request);
    Uni<AssetValuation> getAssetValuation(String contractId);

    // Templates & Code Generation
    Uni<ActiveContract> createFromTemplate(String templateId, Map<String, Object> params);
    Uni<String> generateContractCode(ContractType type, Map<String, Object> config);
}
```

### Unified REST API: `ActiveContractResource`

```java
@Path("/api/v11/activecontracts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ActiveContractResource {
    // Deployment
    @POST @Path("/deploy")
    Uni<Response> deployContract(ActiveContract contract);

    @POST @Path("/{contractId}/activate")
    Uni<Response> activateContract(@PathParam("contractId") String contractId);

    // Execution
    @POST @Path("/{contractId}/execute")
    Uni<Response> executeContract(@PathParam("contractId") String contractId,
                                  ExecutionRequest request);

    @GET @Path("/{contractId}/executions")
    Uni<Response> getExecutionHistory(@PathParam("contractId") String contractId);

    // Signatures
    @POST @Path("/{contractId}/sign")
    Uni<Response> signContract(@PathParam("contractId") String contractId,
                               ContractSignature signature);

    @GET @Path("/{contractId}/signatures")
    Uni<Response> getSignatures(@PathParam("contractId") String contractId);

    // Queries
    @GET @Path("/{contractId}")
    Uni<Response> getContract(@PathParam("contractId") String contractId);

    @GET
    Uni<Response> listContracts(@QueryParam("owner") String owner,
                                @QueryParam("type") String type);

    // RWA Features
    @POST @Path("/{contractId}/tokenize")
    Uni<Response> tokenizeAsset(@PathParam("contractId") String contractId,
                                AssetTokenizationRequest request);

    // Templates
    @POST @Path("/from-template/{templateId}")
    Uni<Response> createFromTemplate(@PathParam("templateId") String templateId,
                                     Map<String, Object> params);

    // SDK Info
    @GET @Path("/sdk/info")
    Response getSdkInfo();
}
```

### SDK Client: `AurigraphActiveContractsClient`

Renamed and unified client library:

```java
public class AurigraphActiveContractsClient {
    private final String baseUrl;
    private final HttpClient httpClient;

    // Deployment
    public CompletableFuture<ActiveContract> deployContract(ActiveContract contract);
    public CompletableFuture<ActiveContract> activateContract(String contractId);

    // Execution
    public CompletableFuture<ContractExecution> executeContract(String contractId,
                                                                String method,
                                                                Map<String, Object> params,
                                                                String caller);

    // Signatures
    public CompletableFuture<ActiveContract> signContract(String contractId,
                                                          ContractSignature signature);
    public CompletableFuture<Boolean> isFullySigned(String contractId);

    // Queries
    public CompletableFuture<ActiveContract> getContract(String contractId);
    public CompletableFuture<List<ActiveContract>> listContracts(String owner, String type);

    // RWA Features
    public CompletableFuture<ActiveContract> tokenizeAsset(String contractId,
                                                           AssetTokenizationRequest request);
}
```

## Key Features

### 1. Multi-Language Support
- **Solidity**: Ethereum-compatible smart contracts
- **Java**: Native Quarkus/GraalVM contracts
- **JavaScript**: V8-based execution
- **WebAssembly**: High-performance WASM contracts
- **Python**: AI/ML-focused contracts
- **Custom DSL**: Aurigraph-specific contract language

### 2. Legal Contract Integration
- **Ricardian-style**: Legal prose + executable code
- **Multi-Party**: Support for multiple signers with roles
- **Jurisdiction**: Legal framework specification
- **Terms & Conditions**: Structured contract terms
- **Audit Trail**: Complete execution history

### 3. Quantum-Safe Security
- **CRYSTALS-Dilithium**: Post-quantum digital signatures
- **Multi-Signature**: Threshold and multi-party signatures
- **Witness Support**: Third-party contract witnessing
- **Signature Metadata**: Timestamp, witness, algorithm info

### 4. RWA Tokenization
- **Carbon Credits**: Environmental asset tokenization
- **Real Estate**: Property tokenization
- **Financial Assets**: Securities, bonds, derivatives
- **Supply Chain**: Goods and materials tracking
- **Intellectual Property**: Patents, copyrights, trademarks

### 5. Gas Metering & Performance
- **Gas Calculation**: Based on code complexity and execution time
- **Gas Limits**: Prevent runaway execution
- **Performance Tracking**: Execution time, TPS metrics
- **Optimization**: AI-driven gas optimization

### 6. Contract Lifecycle Management
- **Draft**: Initial contract creation
- **Deployed**: Contract deployed to network
- **Active**: Contract accepting executions
- **Paused**: Temporarily suspended
- **Deprecated**: Marked for replacement
- **Terminated**: Contract ended

### 7. Template System
- **ERC-20**: Fungible token standard
- **ERC-721**: Non-fungible token (NFT) standard
- **ERC-1155**: Multi-token standard
- **Carbon Credit Template**: Pre-built carbon trading contract
- **Real Estate Template**: Property tokenization template
- **Custom Templates**: User-defined templates

## Usage Examples

### Example 1: Deploy Legal Contract with Multi-Party Signatures

```java
AurigraphActiveContractsClient client = new AurigraphActiveContractsClient(
    "https://dlt.aurigraph.io/api/v11"
);

// Create contract with legal text and executable code
ActiveContract contract = ActiveContract.builder()
    .name("Carbon Credit Purchase Agreement")
    .version("1.0.0")
    .owner("buyer_123")
    .contractType("CarbonCredit")
    .jurisdiction("EU")
    .legalText("This agreement outlines the purchase of 1000 carbon credits...")
    .executableCode("function transferCredits(to, amount) { ... }")
    .language(ContractLanguage.JAVASCRIPT)
    .build();

// Add parties
contract.addParty(new ContractParty("buyer_123", "BUYER", true));
contract.addParty(new ContractParty("seller_456", "SELLER", true));
contract.addParty(new ContractParty("witness_789", "WITNESS", false));

// Deploy contract
ActiveContract deployed = client.deployContract(contract).join();
System.out.println("Contract deployed: " + deployed.getContractId());

// Buyer signs
ContractSignature buyerSig = new ContractSignature(
    "buyer_123",
    "DILITHIUM_SIGNATURE_DATA",
    "BUYER_PUBLIC_KEY"
);
client.signContract(deployed.getContractId(), buyerSig).join();

// Seller signs
ContractSignature sellerSig = new ContractSignature(
    "seller_456",
    "DILITHIUM_SIGNATURE_DATA",
    "SELLER_PUBLIC_KEY"
);
client.signContract(deployed.getContractId(), sellerSig).join();

// Check if fully signed
boolean fullyS signed = client.isFullySigned(deployed.getContractId()).join();
if (fullySigned) {
    // Activate contract
    client.activateContract(deployed.getContractId()).join();
    System.out.println("Contract activated!");
}
```

### Example 2: Deploy ERC-20 Token Contract

```java
AurigraphActiveContractsClient client = new AurigraphActiveContractsClient(
    "https://dlt.aurigraph.io/api/v11"
);

// Create ERC-20 token contract
ActiveContract tokenContract = new ActiveContract(
    "AurigraphToken",
    TokenContract.ERC20_CODE,
    ContractLanguage.SOLIDITY,
    "deployer_123"
);

// Set metadata
ContractMetadata metadata = new ContractMetadata();
metadata.setDescription("ERC-20 compliant token on Aurigraph DLT");
metadata.setGasLimit(1000000L);
tokenContract.setMetadata(metadata);

// Deploy
ActiveContract deployed = client.deployContract(tokenContract).join();

// Execute mint function
Map<String, Object> mintParams = Map.of(
    "to", "user_456",
    "amount", 1000000
);
ContractExecution execution = client.executeContract(
    deployed.getContractId(),
    "mint",
    mintParams,
    "deployer_123"
).join();

System.out.println("Minted 1,000,000 tokens!");
System.out.println("Gas used: " + execution.getGasUsed());
```

### Example 3: Tokenize Real Estate Asset

```java
AurigraphActiveContractsClient client = new AurigraphActiveContractsClient(
    "https://dlt.aurigraph.io/api/v11"
);

// Create real estate contract from template
Map<String, Object> params = Map.of(
    "property_address", "123 Main St, New York, NY",
    "property_value", 5000000,
    "token_supply", 10000,
    "token_price", 500
);

ActiveContract realEstateContract = client.createFromTemplate(
    "REAL_ESTATE_TOKENIZATION",
    params
).join();

// Add legal text
realEstateContract.setLegalText(
    "This contract represents fractional ownership of the property at 123 Main St..."
);
realEstateContract.setJurisdiction("New York, USA");

// Deploy
ActiveContract deployed = client.deployContract(realEstateContract).join();

// Tokenize the asset
AssetTokenizationRequest tokenizationRequest = AssetTokenizationRequest.builder()
    .assetId("PROPERTY_123")
    .assetType("RealEstate")
    .valuation(5000000.0)
    .tokenSupply(10000)
    .tokenPrice(500.0)
    .build();

ActiveContract tokenized = client.tokenizeAsset(
    deployed.getContractId(),
    tokenizationRequest
).join();

System.out.println("Real estate asset tokenized!");
System.out.println("10,000 tokens created at $500 each");
```

## Migration Strategy

### Phase 1: Core Unification (Week 1)
- ✅ Enhance `ActiveContract` model with SDK features
- ✅ Create unified `ActiveContractService`
- ✅ Create unified `ActiveContractResource`
- ✅ Update SDK client to `AurigraphActiveContractsClient`

### Phase 2: Feature Integration (Week 2)
- Integrate RWA tokenization from existing service
- Integrate template system
- Integrate gas metering and execution tracking
- Add comprehensive validation

### Phase 3: Testing & Documentation (Week 3)
- Create comprehensive test suite (95% coverage)
- Performance testing (target: 2M+ TPS)
- Update all documentation
- Create migration guide for existing code

### Phase 4: Deployment (Week 4)
- Deploy to dev4 environment
- Integration testing with existing systems
- Performance validation
- Production readiness review

## Performance Targets

- **Deployment**: <100ms per contract
- **Execution**: <50ms per method call
- **Signature Verification**: <20ms per signature
- **Gas Calculation**: <5ms per execution
- **Throughput**: 2M+ TPS (transactions per second)
- **Concurrent Contracts**: 100K+ active contracts

## API Endpoints Summary

```
POST   /api/v11/activecontracts/deploy
POST   /api/v11/activecontracts/{id}/activate
POST   /api/v11/activecontracts/{id}/execute
POST   /api/v11/activecontracts/{id}/sign
POST   /api/v11/activecontracts/{id}/tokenize
GET    /api/v11/activecontracts/{id}
GET    /api/v11/activecontracts/{id}/signatures
GET    /api/v11/activecontracts/{id}/executions
GET    /api/v11/activecontracts
POST   /api/v11/activecontracts/from-template/{templateId}
GET    /api/v11/activecontracts/sdk/info
```

## Next Steps

1. **Enhance ActiveContract Model**: Add SDK fields (language, abi, bytecode, state)
2. **Create Unified Service**: Merge functionality from both services
3. **Create Unified API**: Single REST interface for all operations
4. **Update SDK Client**: Rename and enhance client library
5. **Migrate Existing Code**: Update references to use unified platform
6. **Comprehensive Testing**: Achieve 95%+ test coverage
7. **Documentation**: Update all guides and examples
8. **Performance Tuning**: Optimize for 2M+ TPS target

## Version

- **Platform Version**: 11.3.0
- **API Version**: v11
- **Release Date**: 2025-10-13
- **Status**: Architecture Design Complete, Implementation Starting

---

**Aurigraph ActiveContracts** - The unified smart contract platform for legal agreements, programmable contracts, and real-world asset tokenization with quantum-safe security.
