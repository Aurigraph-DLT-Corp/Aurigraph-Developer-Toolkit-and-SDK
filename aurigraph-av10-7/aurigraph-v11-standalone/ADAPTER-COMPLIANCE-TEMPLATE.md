# Chain Adapter Compliance Template

**Purpose**: Standardized skeleton for implementing ChainAdapter subclasses
**Status**: Template for Phase 3 remediation and Week 3-4 implementations
**Compliance Target**: 100% ChainAdapter interface compliance

---

## Adapter Implementation Skeleton

```java
package io.aurigraph.v11.bridge.adapter;

import io.aurigraph.v11.bridge.ChainAdapter;
import io.aurigraph.v11.bridge.exception.BridgeException;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Chain adapter for [BLOCKCHAIN_NAME] blockchain
 *
 * Supported Chains (via configuration):
 * - [Chain 1]
 * - [Chain 2]
 * Total: [N] chains
 *
 * Key Features:
 * - Native balance queries
 * - Token/asset support
 * - Transaction submission
 * - Fee estimation
 * - [Blockchain-specific features]
 *
 * Performance Targets:
 * - Balance query: <1000ms
 * - Transaction submit: <2000ms
 * - Chain info: <500ms
 * - Adapter creation: <500µs
 *
 * @author Claude Code - Priority 3 Implementation
 * @version 1.0.0 - [BLOCKCHAIN_NAME] adapter with reactive support
 */
public class [BlockchainName]ChainAdapter extends BaseChainAdapter {

    private static final Logger logger = LoggerFactory.getLogger([BlockchainName]ChainAdapter.class);

    // Constants
    private static final String DEFAULT_RPC_URL = "[INSERT_DEFAULT_RPC]";

    // Settings keys
    private static final String SETTING_KEY_1 = "setting_key_1";
    private static final String SETTING_KEY_2 = "setting_key_2";

    // Default values
    private static final String DEFAULT_SETTING_1 = "default_value_1";

    // RPC client placeholder
    private Object blockchainRpcClient;

    // ============================================================
    // Lifecycle Hooks (Required)
    // ============================================================

    /**
     * Initialize adapter with RPC connection
     */
    @Override
    protected void onInitialize() throws BridgeException {
        try {
            requireInitialized();

            String rpcUrl = getRpcUrl();
            if (rpcUrl == null || rpcUrl.isEmpty()) {
                rpcUrl = DEFAULT_RPC_URL;
            }

            // Get blockchain-specific settings
            String setting1 = getSetting(SETTING_KEY_1, DEFAULT_SETTING_1);

            logger.info("Initialized {}ChainAdapter for chain: {} (RPC: {})",
                getBlockchainName(), getChainName(), rpcUrl);

            // In real implementation:
            // - Create RPC client connection
            // - Set up authentication if needed
            // - Test connection
            // - Load chain metadata

            testChainConnection(rpcUrl);

        } catch (Exception e) {
            throw new BridgeException(
                "Failed to initialize " + getBlockchainName() + "ChainAdapter for " +
                getChainName() + ": " + e.getMessage(),
                e
            );
        }
    }

    /**
     * Test blockchain connection
     */
    private void testChainConnection(String rpcUrl) {
        logger.info("Testing {} chain connection: {}", getBlockchainName(), rpcUrl);
        // Placeholder for connection test
    }

    /**
     * Cleanup blockchain resources on shutdown
     */
    @Override
    protected void onShutdown() {
        if (blockchainRpcClient != null) {
            logger.info("Closing {} RPC connection for chain: {}",
                getBlockchainName(), getChainName());
            // In real implementation: close RPC connection
        }
    }

    // ============================================================
    // Core Interface Methods (Required by ChainAdapter)
    // ============================================================

    /**
     * Get blockchain identifier
     */
    @Override
    public String getChainId() {
        return config.getChainId();
    }

    /**
     * Get comprehensive blockchain information (REACTIVE)
     */
    @Override
    public Uni<ChainInfo> getChainInfo() {
        logOperation("getChainInfo", "");

        return executeWithRetry(() -> {
            // Implement blockchain-specific chain info retrieval
            // Required fields: chainId, chainName, blockTime, etc.

            String chainId = config.getChainId();
            long blockHeight = getCurrentBlockHeight();
            BigDecimal gasPrice = getAverageGasPrice();

            return new ChainAdapter.ChainInfo(
                chainId,
                getChainName(),
                "[NATIVE_CURRENCY]",  // e.g., "ETH", "SOL", "ATOM"
                12,                    // decimals
                getRpcUrl(),
                "[EXPLORER_URL]",
                ChainAdapter.ChainType.MAINNET,
                ChainAdapter.ConsensusMechanism.PROOF_OF_STAKE,
                6000,                  // blockTime in ms
                gasPrice,
                true,                  // supportsEIP1559 (varies)
                new java.util.HashMap<>()  // chainSpecificData
            );

        }, Duration.ofSeconds(15), 3);
    }

    /**
     * Initialize adapter with configuration (REACTIVE)
     */
    @Override
    public Uni<Boolean> initialize(ChainAdapter.ChainAdapterConfig config) {
        return executeWithRetry(() -> {
            // Config validation
            if (config == null || config.rpcUrl == null || config.rpcUrl.isEmpty()) {
                throw new BridgeException("Invalid or missing RPC URL in configuration");
            }

            // Call BaseChainAdapter's initialization
            BaseChainAdapter.super.initialize(
                new io.aurigraph.v11.bridge.model.BridgeChainConfig() {{
                    // Map config to BridgeChainConfig
                }}
            );

            return true;

        }, Duration.ofSeconds(10), 2);
    }

    /**
     * Check blockchain connection status (REACTIVE)
     */
    @Override
    public Uni<ConnectionStatus> checkConnection() {
        logOperation("checkConnection", "");

        return executeWithRetry(() -> {
            long startTime = System.currentTimeMillis();

            // Test RPC connectivity
            // In real impl: make lightweight RPC call (getHealth, getBlock, etc.)
            boolean isConnected = testRpcCall();

            long latency = System.currentTimeMillis() - startTime;

            return new ChainAdapter.ConnectionStatus(
                isConnected,
                latency,
                "[NODE_VERSION]",    // Get from RPC response
                getCurrentBlockHeight(),
                getCurrentBlockHeight() + 1,  // networkBlockHeight
                true,                // isSynced
                null,                // errorMessage (null if healthy)
                System.currentTimeMillis()
            );

        }, Duration.ofSeconds(10), 2);
    }

    /**
     * Get account balance (REACTIVE)
     */
    @Override
    public Uni<BigDecimal> getBalance(String address, String assetIdentifier) {
        logOperation("getBalance", "address=" + address + ", asset=" + assetIdentifier);

        return executeWithRetry(() -> {
            // Validate address format
            if (!isValidAddress(address)) {
                throw new BridgeException("Invalid address for " + getBlockchainName() + ": " + address);
            }

            // Query balance from blockchain
            if (assetIdentifier == null || assetIdentifier.isEmpty()) {
                // Native balance
                return getNativeBalance(address);
            } else {
                // Token/asset balance
                return getTokenBalance(address, assetIdentifier);
            }

        }, Duration.ofSeconds(30), 3);
    }

    /**
     * Send transaction to blockchain (REACTIVE)
     */
    @Override
    public Uni<TransactionResult> sendTransaction(
            ChainAdapter.ChainTransaction transaction,
            ChainAdapter.TransactionOptions transactionOptions) {
        logOperation("sendTransaction", "from=" + transaction.from + ", to=" + transaction.to);

        return executeWithRetry(() -> {
            // Validate transaction
            if (transaction.data == null || transaction.data.isEmpty()) {
                throw new BridgeException("Transaction data required");
            }

            // Submit to blockchain
            String txHash = submitTransaction(transaction);

            // Wait for confirmation if requested
            if (transactionOptions != null && transactionOptions.waitForConfirmation) {
                // Wait for required confirmations
            }

            return new ChainAdapter.TransactionResult(
                txHash,
                ChainAdapter.TransactionExecutionStatus.CONFIRMED,
                getCurrentBlockHeight(),
                "[BLOCK_HASH]",
                new BigDecimal("21000"),  // actualGasUsed
                new BigDecimal("0.1"),    // actualFee
                null,                     // errorMessage
                new java.util.HashMap<>(), // logs
                System.currentTimeMillis() // executionTime
            );

        }, Duration.ofSeconds(30), 3);
    }

    /**
     * Get transaction status (REACTIVE)
     */
    @Override
    public Uni<TransactionStatus> getTransactionStatus(String transactionHash) {
        logOperation("getTransactionStatus", "hash=" + transactionHash);

        return executeWithRetry(() -> {
            // Validate hash format
            if (!isValidTxHash(transactionHash)) {
                throw new BridgeException("Invalid transaction hash: " + transactionHash);
            }

            // Query blockchain for transaction status
            return new ChainAdapter.TransactionStatus(
                transactionHash,
                ChainAdapter.TransactionExecutionStatus.FINALIZED,
                12,                   // confirmations
                1000L,                // blockNumber
                "[BLOCK_HASH]",
                0,                    // transactionIndex
                new BigDecimal("21000"),  // gasUsed
                new BigDecimal("100"),    // effectiveGasPrice
                true,                 // success
                null,                 // errorReason
                System.currentTimeMillis()  // timestamp
            );

        }, Duration.ofSeconds(30), 3);
    }

    /**
     * Wait for transaction confirmation (REACTIVE)
     */
    @Override
    public Uni<ConfirmationResult> waitForConfirmation(
            String transactionHash,
            int requiredConfirmations,
            Duration timeout) {
        logOperation("waitForConfirmation", "hash=" + transactionHash +
            ", requiredConfirmations=" + requiredConfirmations);

        return executeWithRetry(() -> {
            // Poll for confirmations until timeout or required count reached
            long startTime = System.currentTimeMillis();
            int currentConfirmations = 0;

            while (currentConfirmations < requiredConfirmations) {
                if (System.currentTimeMillis() - startTime > timeout.toMillis()) {
                    return new ChainAdapter.ConfirmationResult(
                        transactionHash,
                        false,  // confirmed
                        currentConfirmations,
                        System.currentTimeMillis() - startTime,
                        null,   // finalStatus
                        true,   // timedOut
                        "Confirmation timeout"
                    );
                }

                currentConfirmations = getCurrentConfirmations(transactionHash);
                Thread.sleep(1000);  // Check every 1 second
            }

            return new ChainAdapter.ConfirmationResult(
                transactionHash,
                true,  // confirmed
                currentConfirmations,
                System.currentTimeMillis() - startTime,
                null,  // finalStatus (could fetch from getTransactionStatus)
                false, // timedOut
                null   // errorMessage
            );

        }, timeout, 1);
    }

    /**
     * Estimate transaction fee (REACTIVE)
     */
    @Override
    public Uni<FeeEstimate> estimateTransactionFee(ChainTransaction transaction) {
        logOperation("estimateFee", "from=" + transaction.from);

        return executeWithRetry(() -> {
            // Get network fee data
            BigDecimal gasPrice = getAverageGasPrice();
            BigDecimal estimatedGas = estimateGasUsage(transaction);
            BigDecimal totalFee = estimatedGas.multiply(gasPrice);

            return new ChainAdapter.FeeEstimate(
                estimatedGas,
                gasPrice,
                gasPrice,             // maxFeePerGas
                BigDecimal.ZERO,      // maxPriorityFeePerGas
                totalFee,
                BigDecimal.ZERO,      // totalFeeUSD
                FeeSpeed.STANDARD,
                Duration.ofSeconds(6) // estimatedConfirmationTime
            );

        }, Duration.ofSeconds(20), 3);
    }

    /**
     * Get network fee information (REACTIVE)
     */
    @Override
    public Uni<NetworkFeeInfo> getNetworkFeeInfo() {
        logOperation("getNetworkFeeInfo", "");

        return executeWithRetry(() -> {
            return new ChainAdapter.NetworkFeeInfo(
                new BigDecimal("1.0"),      // safeLowGasPrice
                new BigDecimal("2.0"),      // standardGasPrice
                new BigDecimal("5.0"),      // fastGasPrice
                new BigDecimal("10.0"),     // instantGasPrice
                new BigDecimal("1.0"),      // baseFeePerGas
                0.5,                        // networkUtilization (0-1)
                getCurrentBlockHeight(),
                System.currentTimeMillis()
            );

        }, Duration.ofSeconds(10), 2);
    }

    /**
     * Deploy smart contract (REACTIVE) - Optional
     */
    @Override
    public Uni<ContractDeploymentResult> deployContract(
            ChainAdapter.ContractDeployment contractDeployment) {
        // If blockchain doesn't support contracts, return failure
        return Uni.createFrom().failure(
            new BridgeException("Smart contract deployment not supported on " + getChainName())
        );
    }

    /**
     * Call smart contract (REACTIVE) - Optional
     */
    @Override
    public Uni<ContractCallResult> callContract(
            ChainAdapter.ContractFunctionCall contractCall) {
        // If blockchain doesn't support contracts, return failure
        return Uni.createFrom().failure(
            new BridgeException("Smart contract calls not supported on " + getChainName())
        );
    }

    /**
     * Get block information (REACTIVE)
     */
    @Override
    public Uni<BlockInfo> getBlockInfo(String blockIdentifier) {
        logOperation("getBlockInfo", "blockId=" + blockIdentifier);

        return executeWithRetry(() -> {
            long blockNumber = Long.parseLong(blockIdentifier);

            return new ChainAdapter.BlockInfo(
                blockNumber,
                "[BLOCK_HASH]",
                "[PARENT_HASH]",
                System.currentTimeMillis(),  // timestamp
                "[MINER]",
                new BigDecimal("100"),       // difficulty
                new BigDecimal("1000"),      // totalDifficulty
                1000000,                     // gasLimit
                800000,                      // gasUsed
                100,                         // transactionCount
                new ArrayList<>(),           // transactionHashes
                new java.util.HashMap<>()    // extraData
            );

        }, Duration.ofSeconds(15), 2);
    }

    /**
     * Get current block height (REACTIVE)
     */
    @Override
    public Uni<Long> getCurrentBlockHeight() {
        logOperation("getCurrentBlockHeight", "");

        return executeWithRetry(() -> {
            return getCurrentBlockHeightSync();
        }, Duration.ofSeconds(10), 2);
    }

    /**
     * Validate address format (REACTIVE)
     */
    @Override
    public Uni<AddressValidationResult> validateAddress(String address) {
        logOperation("validateAddress", "address=" + address);

        return Uni.createFrom().item(() -> {
            if (!isValidAddress(address)) {
                return new ChainAdapter.AddressValidationResult(
                    address,
                    false,  // isValid
                    ChainAdapter.AddressFormat.CUSTOM,
                    null,   // normalizedAddress
                    "Invalid address format for " + getBlockchainName()
                );
            }

            return new ChainAdapter.AddressValidationResult(
                address,
                true,   // isValid
                ChainAdapter.AddressFormat.CUSTOM,
                address,  // normalizedAddress
                null    // validationMessage
            );
        });
    }

    /**
     * Subscribe to blockchain events (STREAM) - Optional
     */
    @Override
    public Multi<BlockchainEvent> subscribeToEvents(
            ChainAdapter.EventFilter eventFilter) {
        // If blockchain doesn't support event subscriptions, return empty
        return Multi.createFrom().empty();
    }

    /**
     * Get historical events (STREAM)
     */
    @Override
    public Multi<BlockchainEvent> getHistoricalEvents(
            ChainAdapter.EventFilter eventFilter,
            long fromBlock,
            long toBlock) {
        // If blockchain doesn't support event queries, return empty
        return Multi.createFrom().empty();
    }

    /**
     * Get account balances (STREAM)
     */
    @Override
    public Multi<AssetBalance> getBalances(
            String address,
            List<String> assetIdentifiers) {
        return Multi.createFrom().iterable(() -> {
            List<AssetBalance> balances = new ArrayList<>();

            for (String assetId : assetIdentifiers) {
                try {
                    BigDecimal balance = getBalance(address, assetId)
                        .await().indefinitely();  // Block here (in real impl, avoid blocking)

                    balances.add(new ChainAdapter.AssetBalance(
                        address,
                        assetId,
                        "[SYMBOL]",
                        balance,
                        BigDecimal.ZERO,  // balanceUSD
                        12,               // decimals
                        ChainAdapter.AssetType.NATIVE,
                        System.currentTimeMillis()
                    ));
                } catch (Exception e) {
                    logger.warn("Failed to get balance for asset {}", assetId, e);
                }
            }

            return balances;
        });
    }

    /**
     * Monitor network health (STREAM)
     */
    @Override
    public Multi<NetworkHealth> monitorNetworkHealth(Duration monitoringInterval) {
        // If blockchain doesn't support health monitoring, return empty
        return Multi.createFrom().empty();
    }

    /**
     * Get adapter statistics (REACTIVE)
     */
    @Override
    public Uni<AdapterStatistics> getAdapterStatistics(Duration timeWindow) {
        return Uni.createFrom().item(() -> {
            return new ChainAdapter.AdapterStatistics(
                getChainId(),
                0L,   // totalTransactions
                0L,   // successfulTransactions
                0L,   // failedTransactions
                100.0,  // successRate
                0.0,  // averageTransactionTime
                0.0,  // averageConfirmationTime
                new BigDecimal("0"),  // totalGasUsed
                BigDecimal.ZERO,      // totalFeesSpent
                new java.util.HashMap<>(),  // transactionsByType
                timeWindow.toMillis()
            );
        });
    }

    /**
     * Configure retry policy (REACTIVE)
     */
    @Override
    public Uni<Boolean> configureRetryPolicy(RetryPolicy retryPolicy) {
        // Store retry policy for this adapter
        return Uni.createFrom().item(true);
    }

    /**
     * Shutdown adapter (REACTIVE)
     */
    @Override
    public Uni<Boolean> shutdown() {
        return Uni.createFrom().item(() -> {
            onShutdown();
            return true;
        });
    }

    // ============================================================
    // Helper Methods (Private Utilities)
    // ============================================================

    private String getBlockchainName() {
        return "[BLOCKCHAIN_NAME]";
    }

    private boolean isValidAddress(String address) {
        // Implement blockchain-specific address validation
        return address != null && !address.isEmpty() && address.length() >= 20;
    }

    private boolean isValidTxHash(String txHash) {
        // Implement blockchain-specific transaction hash validation
        return txHash != null && txHash.length() >= 32;
    }

    private BigDecimal getNativeBalance(String address) throws Exception {
        // Implement blockchain-specific native balance query
        return BigDecimal.ZERO;
    }

    private BigDecimal getTokenBalance(String address, String tokenId) throws Exception {
        // Implement blockchain-specific token balance query
        return BigDecimal.ZERO;
    }

    private long getCurrentBlockHeight() throws Exception {
        return getCurrentBlockHeightSync();
    }

    private long getCurrentBlockHeightSync() {
        // Implement blockchain-specific block height query
        return System.currentTimeMillis() / 6000;  // Placeholder
    }

    private BigDecimal getAverageGasPrice() {
        // Implement blockchain-specific gas price query
        return new BigDecimal("2.0");
    }

    private BigDecimal estimateGasUsage(ChainTransaction transaction) {
        // Implement blockchain-specific gas estimation
        return new BigDecimal("21000");
    }

    private int getCurrentConfirmations(String txHash) {
        // Implement blockchain-specific confirmation counting
        return 12;
    }

    private String submitTransaction(ChainAdapter.ChainTransaction transaction) {
        // Implement blockchain-specific transaction submission
        return "TxHash_" + System.currentTimeMillis();
    }

    private boolean testRpcCall() {
        // Implement lightweight RPC connectivity test
        return true;
    }
}
```

---

## Implementation Checklist

### Phase 1: Class Definition
- [ ] Class declaration and package
- [ ] Javadoc with blockchain details
- [ ] Constants definition
- [ ] Fields and logger

### Phase 2: Lifecycle Methods
- [ ] `onInitialize()` - RPC setup, connection test
- [ ] `onShutdown()` - Resource cleanup
- [ ] Helper methods for validation

### Phase 3: Core Methods
- [ ] `getChainId()` - Return chain identifier
- [ ] `getChainInfo()` - Reactive chain information
- [ ] `initialize()` - Reactive config initialization
- [ ] `checkConnection()` - Reactive connection status
- [ ] `getBalance()` - Reactive balance query
- [ ] `sendTransaction()` - Reactive transaction submission
- [ ] `getTransactionStatus()` - Reactive transaction status
- [ ] `waitForConfirmation()` - Reactive confirmation waiting
- [ ] `estimateTransactionFee()` - Reactive fee estimation
- [ ] `getNetworkFeeInfo()` - Reactive network fee info

### Phase 4: Extended Methods
- [ ] `deployContract()` - Contract deployment (or failure)
- [ ] `callContract()` - Contract calls (or failure)
- [ ] `getBlockInfo()` - Reactive block information
- [ ] `getCurrentBlockHeight()` - Reactive block height
- [ ] `validateAddress()` - Reactive address validation

### Phase 5: Optional Methods
- [ ] `subscribeToEvents()` - Event streams (or empty)
- [ ] `getHistoricalEvents()` - Event history (or empty)
- [ ] `getBalances()` - Multi-asset balance streams
- [ ] `monitorNetworkHealth()` - Network health streams (or empty)
- [ ] `getAdapterStatistics()` - Adapter statistics
- [ ] `configureRetryPolicy()` - Retry policy config
- [ ] `shutdown()` - Reactive shutdown

### Phase 6: Testing
- [ ] Unit tests created
- [ ] Integration tests created
- [ ] Compilation passes
- [ ] All tests pass (95%+ coverage target)
- [ ] Performance benchmarks met

---

## Compliance Requirements

### Return Types
- ✅ Core methods: MUST return `Uni<T>` (reactive)
- ✅ String method: May return `String` directly (getChainId)
- ✅ Stream methods: MUST return `Multi<T>` (reactive streams)
- ❌ Never return concrete types (like ChainInfo) directly - always wrap in Uni<T>

### Inner Classes
- ✅ MUST use ChainAdapter.ChainInfo, ChainAdapter.TransactionStatus, etc.
- ❌ MUST NOT define duplicate inner classes in adapter
- ✅ Use fully qualified names (ChainAdapter.ChainInfo)

### Error Handling
- ✅ Throw BridgeException for validation errors
- ✅ Wrap RPC errors in BridgeException with context
- ✅ Return Uni.createFrom().failure() for reactive errors
- ✅ Use logError() for error logging

### Logging
- ✅ Use logOperation() for operation starts
- ✅ Use logError() for error cases
- ✅ Include adapter and chain name in context
- ✅ Use appropriate log levels (debug, warn, error)

### Performance
- ✅ Balance query: <1000ms
- ✅ Transaction submit: <2000ms
- ✅ Chain info: <500ms
- ✅ Adapter creation: <500µs
- ✅ Use timeout + retry for RPC calls

---

## Blockchain-Specific Customization

For each blockchain, customize:

1. **Constants**:
   - `DEFAULT_RPC_URL` - Primary RPC endpoint
   - `SETTING_KEY_*` - Blockchain-specific settings
   - `DEFAULT_SETTING_*` - Default values

2. **Validation**:
   - `isValidAddress()` - Address format validation
   - `isValidTxHash()` - Transaction hash validation

3. **Queries**:
   - `getNativeBalance()` - Native token balance
   - `getTokenBalance()` - Token/asset balance
   - `getCurrentBlockHeight()` - Block height query
   - `getAverageGasPrice()` - Gas price query
   - `estimateGasUsage()` - Gas estimation

4. **Methods**:
   - `submitTransaction()` - Send transaction
   - `getCurrentConfirmations()` - Confirmation counting
   - `testRpcCall()` - Connection test

5. **Unsupported Features**:
   - Return failure for unsupported methods
   - Return empty streams for event/monitoring methods

---

## Example Implementations

### Minimal Adapter (No Contract/Event Support)
- Implement: Core 10 methods
- Optional: Return empty/failure for contracts and events
- Total Lines: 500-600

### Full-Featured Adapter (Contract + Event Support)
- Implement: All 25+ methods
- Include: Event subscriptions, contract deployment
- Total Lines: 1000-1500

### Recommended Starting Point
- Implement core 10 methods first
- Get compilation + basic tests passing
- Add optional methods incrementally
- Final lines: 700-900 per adapter

---

## Success Criteria

Each adapter must:

1. **Compile Without Errors**
   ```bash
   ./mvnw clean compile
   ```

2. **Pass Unit Tests**
   ```bash
   ./mvnw test -Dtest=[AdapterName]Test
   ```

3. **Package Successfully**
   ```bash
   ./mvnw clean package
   ```

4. **Meet Performance Targets**
   - Balance query: <1000ms
   - Transaction: <2000ms
   - Chain info: <500ms

5. **Support Configuration**
   - Load RPC URL from config
   - Support settings/metadata
   - Work with factory pattern

6. **Thread-Safe**
   - No shared mutable state
   - Safe for concurrent access
   - Mutiny handles thread scheduling

---

**Template Created**: November 18, 2025
**Usage**: Phase 3 remediation (Weeks 1-2 adapter fixes) + Phase 3 implementation (Weeks 3-4)
**Status**: Ready for adaptation to specific blockchains
