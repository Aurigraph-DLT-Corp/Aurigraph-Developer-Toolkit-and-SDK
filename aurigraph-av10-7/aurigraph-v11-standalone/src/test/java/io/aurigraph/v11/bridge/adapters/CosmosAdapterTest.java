package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.ChainAdapter.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Timeout;

import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CosmosAdapter (AV11-52)
 * Tests the complete Cosmos Hub/Cosmos SDK blockchain integration
 *
 * Coverage Areas:
 * - Chain initialization and Tendermint configuration
 * - Transaction submission and instant finality
 * - Balance queries (ATOM and IBC tokens)
 * - Fee estimation (gas-based)
 * - Address validation (Bech32 format)
 * - Block info and height queries
 * - CosmWasm contract deployment and interaction
 * - IBC (Inter-Blockchain Communication) support
 * - Tendermint consensus integration
 * - Network health monitoring with validator info
 */
@QuarkusTest
@DisplayName("Cosmos Adapter Tests")
public class CosmosAdapterTest {

    @Inject
    CosmosAdapter cosmosAdapter;

    private ChainAdapterConfig testConfig;

    @BeforeEach
    void setup() {
        testConfig = new ChainAdapterConfig();
        testConfig.chainId = "cosmoshub-4";
        testConfig.rpcUrl = "https://rpc.cosmos.network";
        testConfig.websocketUrl = "wss://rpc.cosmos.network/websocket";
        testConfig.confirmationBlocks = 1; // Tendermint has instant finality
        testConfig.maxRetries = 3;
        testConfig.timeout = Duration.ofSeconds(30);
        testConfig.enableEvents = true;
    }

    @Test
    @DisplayName("Should return correct Cosmos Hub chain ID")
    void testGetChainId() {
        // Given: CosmosAdapter is initialized
        String chainId = cosmosAdapter.getChainId();

        // Then: Should return cosmoshub-4 chain ID
        assertNotNull(chainId);
        assertEquals("cosmoshub-4", chainId);
    }

    @Test
    @DisplayName("Should return Cosmos chain information with Tendermint consensus")
    void testGetChainInfo() {
        // When: Getting chain information
        ChainInfo info = cosmosAdapter.getChainInfo().await().indefinitely();

        // Then: Should return complete Cosmos chain info
        assertNotNull(info);
        assertEquals("cosmoshub-4", info.chainId);
        assertEquals("Cosmos Hub", info.chainName);
        assertEquals("ATOM", info.nativeCurrency);
        assertEquals(6, info.decimals); // 10^6 uatom per ATOM
        assertEquals(ChainType.MAINNET, info.chainType);
        assertEquals(ConsensusMechanism.DELEGATED_PROOF_OF_STAKE, info.consensusMechanism);
        assertFalse(info.supportsEIP1559); // Cosmos doesn't use EIP-1559
        assertEquals(6000L, info.blockTime); // ~6 seconds per block

        // Verify Cosmos-specific data
        assertNotNull(info.chainSpecificData);
        assertTrue(info.chainSpecificData.containsKey("ibcEnabled"));
        assertTrue(info.chainSpecificData.containsKey("maxValidators"));
        assertEquals(true, info.chainSpecificData.get("ibcEnabled"));
        assertEquals(175, info.chainSpecificData.get("maxValidators"));
    }

    @Test
    @DisplayName("Should initialize successfully with Cosmos SDK RPC")
    void testInitialize() {
        // When: Initializing adapter with config
        Boolean initialized = cosmosAdapter.initialize(testConfig).await().indefinitely();

        // Then: Should initialize successfully
        assertTrue(initialized);
    }

    @Test
    @DisplayName("Should check connection status with node version info")
    void testCheckConnection() {
        // Given: Adapter is initialized
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Checking connection
        ConnectionStatus status = cosmosAdapter.checkConnection().await().indefinitely();

        // Then: Should return valid connection status
        assertNotNull(status);
        assertTrue(status.isConnected);
        assertTrue(status.latencyMs > 0);
        assertTrue(status.latencyMs < 150); // Should be reasonably fast
        assertNotNull(status.nodeVersion);
        assertTrue(status.nodeVersion.contains("tendermint") || status.nodeVersion.contains("cosmos"));
        assertTrue(status.isSynced);
        assertNull(status.errorMessage);
    }

    @Test
    @DisplayName("Should send transaction with instant Tendermint finality")
    void testSendTransaction() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Sending an ATOM transfer transaction
        ChainTransaction tx = new ChainTransaction();
        tx.from = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        tx.to = "cosmos1d4kp6uf87vzefq6fmjzj95crqdkz4pxuvf65yh";
        tx.value = new BigDecimal("1000000"); // 1 ATOM in uatom
        tx.transactionType = TransactionType.TRANSFER;

        TransactionOptions options = new TransactionOptions();
        options.waitForConfirmation = true; // Tendermint finality is instant

        TransactionResult result = cosmosAdapter.sendTransaction(tx, options).await().indefinitely();

        // Then: Should return valid transaction result with instant finality
        assertNotNull(result);
        assertNotNull(result.transactionHash);
        assertEquals(64, result.transactionHash.length()); // Tendermint tx hash
        assertNotNull(result.actualGasUsed);
        assertNotNull(result.actualFee);

        // Cosmos fees should be very low
        assertTrue(result.actualFee.compareTo(new BigDecimal("0.01")) < 0); // Less than 0.01 ATOM

        // Should be finalized due to Tendermint instant finality
        assertEquals(TransactionExecutionStatus.FINALIZED, result.status);

        // Should have account sequence in logs
        assertNotNull(result.logs);
        assertTrue(result.logs.containsKey("account_sequence"));
    }

    @Test
    @DisplayName("Should get transaction status with instant finality")
    void testGetTransactionStatus() {
        // Given: A submitted transaction
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        tx.to = "cosmos1d4kp6uf87vzefq6fmjzj95crqdkz4pxuvf65yh";
        tx.value = new BigDecimal("1000000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionResult txResult = cosmosAdapter.sendTransaction(tx, new TransactionOptions())
            .await().indefinitely();

        // When: Getting transaction status
        TransactionStatus status = cosmosAdapter.getTransactionStatus(txResult.transactionHash)
            .await().indefinitely();

        // Then: Should return finalized status (Tendermint instant finality)
        assertNotNull(status);
        assertEquals(txResult.transactionHash, status.transactionHash);
        assertEquals(TransactionExecutionStatus.FINALIZED, status.status);
        assertTrue(status.success);
        assertEquals(1, status.confirmations); // Instant finality
        assertNotNull(status.gasUsed);
    }

    @Test
    @DisplayName("Should wait for confirmation with instant Tendermint finality")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testWaitForConfirmation() {
        // Given: Initialized adapter and a transaction hash
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        tx.to = "cosmos1d4kp6uf87vzefq6fmjzj95crqdkz4pxuvf65yh";
        tx.value = new BigDecimal("1000000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionResult txResult = cosmosAdapter.sendTransaction(tx, new TransactionOptions())
            .await().indefinitely();

        // When: Waiting for confirmation (Tendermint instant finality)
        ConfirmationResult confirmation = cosmosAdapter.waitForConfirmation(
            txResult.transactionHash,
            1,
            Duration.ofSeconds(10)
        ).await().indefinitely();

        // Then: Should confirm almost instantly with Tendermint
        assertNotNull(confirmation);
        assertTrue(confirmation.confirmed);
        assertEquals(txResult.transactionHash, confirmation.transactionHash);
        assertTrue(confirmation.actualConfirmations >= 1);
        assertFalse(confirmation.timedOut);
        assertNotNull(confirmation.finalStatus);

        // Tendermint finality should be very fast (< 7 seconds for 1 block)
        assertTrue(confirmation.confirmationTime < 8000);
    }

    @Test
    @DisplayName("Should get balance for native ATOM")
    void testGetBalanceNative() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting native ATOM balance
        String address = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        BigDecimal balance = cosmosAdapter.getBalance(address, null).await().indefinitely();

        // Then: Should return valid balance
        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should get balance for IBC tokens")
    void testGetBalanceIBC() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting IBC token balance
        String address = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        String ibcDenom = "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2"; // IBC ATOM
        BigDecimal balance = cosmosAdapter.getBalance(address, ibcDenom).await().indefinitely();

        // Then: Should return valid balance
        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should get multiple balances including ATOM and IBC tokens")
    void testGetBalances() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting multiple balances
        String address = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        List<String> assets = Arrays.asList(
            null,      // ATOM
            "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2", // IBC token
            "ibc/14F9BC3E44B8A9C1BE1FB08980FAB87034C9905EF17CF2F5008FC085218811CC"  // Another IBC token
        );

        List<AssetBalance> balances = cosmosAdapter.getBalances(address, assets)
            .collect().asList().await().indefinitely();

        // Then: Should return all balances
        assertNotNull(balances);
        assertEquals(3, balances.size());

        balances.forEach(balance -> {
            assertNotNull(balance.balance);
            assertNotNull(balance.assetType);
            assertNotNull(balance.assetSymbol);
            assertEquals(6, balance.decimals); // Cosmos uses 6 decimals
        });

        // First balance should be native ATOM
        assertEquals(AssetType.NATIVE, balances.get(0).assetType);
        assertEquals("ATOM", balances.get(0).assetSymbol);
    }

    @Test
    @DisplayName("Should estimate transaction fee based on gas")
    void testEstimateTransactionFee() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Estimating fee for different transaction types
        ChainTransaction transferTx = new ChainTransaction();
        transferTx.transactionType = TransactionType.TRANSFER;

        FeeEstimate transferEstimate = cosmosAdapter.estimateTransactionFee(transferTx)
            .await().indefinitely();

        ChainTransaction stakingTx = new ChainTransaction();
        stakingTx.transactionType = TransactionType.STAKING;

        FeeEstimate stakingEstimate = cosmosAdapter.estimateTransactionFee(stakingTx)
            .await().indefinitely();

        // Then: Should return valid estimates
        assertNotNull(transferEstimate);
        assertNotNull(transferEstimate.estimatedGas);
        assertEquals(new BigDecimal("100000"), transferEstimate.estimatedGas); // Gas units
        assertNotNull(transferEstimate.totalFee);
        assertEquals(FeeSpeed.INSTANT, transferEstimate.feeSpeed); // Tendermint is instant
        assertEquals(Duration.ofSeconds(6), transferEstimate.estimatedConfirmationTime); // One block

        // Staking should have higher gas requirement
        assertTrue(stakingEstimate.estimatedGas.compareTo(transferEstimate.estimatedGas) > 0);
    }

    @Test
    @DisplayName("Should get network fee information")
    void testGetNetworkFeeInfo() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting network fee info
        NetworkFeeInfo feeInfo = cosmosAdapter.getNetworkFeeInfo().await().indefinitely();

        // Then: Should return current fee info
        assertNotNull(feeInfo);
        assertNotNull(feeInfo.safeLowGasPrice);
        assertNotNull(feeInfo.standardGasPrice);
        assertNotNull(feeInfo.fastGasPrice);
        assertNotNull(feeInfo.baseFeePerGas);

        // Cosmos fees are low and stable
        assertTrue(feeInfo.standardGasPrice.compareTo(new BigDecimal("0.01")) < 0);
        assertTrue(feeInfo.networkUtilization >= 0 && feeInfo.networkUtilization <= 1.0);
        assertTrue(feeInfo.blockNumber > 0);
    }

    @Test
    @DisplayName("Should validate Cosmos address (Bech32 format)")
    void testValidateAddress() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Validating valid Bech32 address
        String validAddress = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        AddressValidationResult validResult = cosmosAdapter.validateAddress(validAddress)
            .await().indefinitely();

        // Then: Should validate as valid
        assertTrue(validResult.isValid);
        assertEquals(AddressFormat.CUSTOM, validResult.format); // Bech32
        assertEquals(validAddress, validResult.normalizedAddress);

        // When: Validating invalid address
        String invalidAddress = "0xinvalid-ethereum-address";
        AddressValidationResult invalidResult = cosmosAdapter.validateAddress(invalidAddress)
            .await().indefinitely();

        // Then: Should validate as invalid
        assertFalse(invalidResult.isValid);
        assertNotNull(invalidResult.validationMessage);

        // When: Validating address without cosmos prefix
        String invalidPrefix = "osmo1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        AddressValidationResult prefixResult = cosmosAdapter.validateAddress(invalidPrefix)
            .await().indefinitely();

        // Then: Should validate as invalid (wrong chain prefix)
        assertFalse(prefixResult.isValid);
    }

    @Test
    @DisplayName("Should get current block height")
    void testGetCurrentBlockHeight() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting current block height
        Long blockHeight = cosmosAdapter.getCurrentBlockHeight().await().indefinitely();

        // Then: Should return valid height
        assertNotNull(blockHeight);
        assertTrue(blockHeight > 0);
        assertTrue(blockHeight > 18500000L); // Recent Cosmos Hub block number
    }

    @Test
    @DisplayName("Should get block information with proposer data")
    void testGetBlockInfo() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting block info
        String blockNumber = "18500000";
        BlockInfo info = cosmosAdapter.getBlockInfo(blockNumber).await().indefinitely();

        // Then: Should return complete block info
        assertNotNull(info);
        assertEquals(18500000L, info.blockNumber);
        assertNotNull(info.blockHash);
        assertNotNull(info.parentHash);
        assertNotNull(info.miner); // Proposer validator address
        assertTrue(info.miner.startsWith("cosmos")); // Bech32 address
        assertEquals(BigDecimal.ZERO, info.difficulty); // Tendermint doesn't use difficulty
        assertTrue(info.transactionCount >= 0);

        // Should have Tendermint-specific data
        assertNotNull(info.extraData);
        assertTrue(info.extraData.containsKey("proposer"));
        assertTrue(info.extraData.containsKey("validatorSetHash"));
    }

    @Test
    @DisplayName("Should deploy CosmWasm smart contract")
    void testDeployContract() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Deploying CosmWasm contract
        ContractDeployment deployment = new ContractDeployment();
        deployment.bytecode = "contract-wasm-bytecode";
        deployment.constructorData = "{}"; // JSON init msg
        deployment.deployer = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        deployment.gasLimit = new BigDecimal("1000000"); // Gas limit
        deployment.verify = false;

        ContractDeploymentResult result = cosmosAdapter.deployContract(deployment).await().indefinitely();

        // Then: Should deploy successfully
        assertNotNull(result);
        assertNotNull(result.contractAddress);
        assertTrue(result.contractAddress.startsWith("cosmos")); // Bech32 address
        assertTrue(result.success);
        assertNotNull(result.gasUsed);
        assertNotNull(result.transactionHash);
    }

    @Test
    @DisplayName("Should query and execute CosmWasm contract")
    void testCallContract() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Making read-only contract query
        ContractFunctionCall queryCall = new ContractFunctionCall();
        queryCall.contractAddress = "cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr";
        queryCall.functionName = "get_count";
        queryCall.functionArgs = Arrays.asList(); // Query msg as JSON
        queryCall.isReadOnly = true;

        ContractCallResult queryResult = cosmosAdapter.callContract(queryCall).await().indefinitely();

        // Then: Should return query result without transaction
        assertNotNull(queryResult);
        assertTrue(queryResult.success);
        assertNotNull(queryResult.returnValue);
        assertTrue(queryResult.returnValue.toString().contains("balance")); // Mock JSON response
        assertNull(queryResult.transactionHash); // Read-only, no tx
        assertEquals(BigDecimal.ZERO, queryResult.gasUsed);

        // When: Executing state-changing contract call
        ContractFunctionCall executeCall = new ContractFunctionCall();
        executeCall.contractAddress = "cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr";
        executeCall.functionName = "increment";
        executeCall.functionArgs = Arrays.asList(); // Execute msg as JSON
        executeCall.isReadOnly = false;
        executeCall.gasLimit = new BigDecimal("300000");

        ContractCallResult executeResult = cosmosAdapter.callContract(executeCall).await().indefinitely();

        // Then: Should execute and return transaction
        assertNotNull(executeResult);
        assertTrue(executeResult.success);
        assertNotNull(executeResult.transactionHash);
        assertTrue(executeResult.gasUsed.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Should subscribe to Cosmos events via Tendermint WebSocket")
    void testSubscribeToEvents() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Subscribing to events
        EventFilter filter = new EventFilter();
        filter.contractAddress = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        filter.eventSignatures = Arrays.asList("transfer");

        List<BlockchainEvent> events = cosmosAdapter.subscribeToEvents(filter)
            .select().first(3)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(25));

        // Then: Should receive events
        assertNotNull(events);
        assertEquals(3, events.size());

        events.forEach(event -> {
            assertNotNull(event.blockNumber);
            assertNotNull(event.transactionHash);
            assertEquals(EventType.TRANSFER, event.eventType);
            assertEquals("transfer", event.eventSignature);
            assertNotNull(event.eventData);
            assertTrue(event.eventData.size() >= 2); // from, to, amount
        });
    }

    @Test
    @DisplayName("Should get historical events from past blocks")
    void testGetHistoricalEvents() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting historical events
        EventFilter filter = new EventFilter();
        filter.eventSignatures = Arrays.asList("transfer");

        long fromBlock = 18500000L;
        long toBlock = 18500010L;

        List<BlockchainEvent> events = cosmosAdapter.getHistoricalEvents(filter, fromBlock, toBlock)
            .collect().asList()
            .await().indefinitely();

        // Then: Should return historical events
        assertNotNull(events);
        assertTrue(events.size() > 0);

        // All events should be within block range
        events.forEach(event -> {
            assertTrue(event.blockNumber >= fromBlock);
            assertTrue(event.blockNumber <= toBlock);
            assertEquals(EventType.TRANSFER, event.eventType);
        });
    }

    @Test
    @DisplayName("Should monitor network health with validator count")
    void testMonitorNetworkHealth() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Monitoring network health
        List<NetworkHealth> healthReports = cosmosAdapter.monitorNetworkHealth(Duration.ofSeconds(3))
            .select().first(2)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(10));

        // Then: Should receive health reports
        assertNotNull(healthReports);
        assertEquals(2, healthReports.size());

        healthReports.forEach(health -> {
            assertTrue(health.isHealthy);
            assertTrue(health.currentBlockHeight > 0);
            assertEquals(6000L, health.averageBlockTime); // ~6 seconds
            assertEquals(0.0, health.networkHashRate); // Tendermint doesn't use hashrate
            assertEquals(175, health.activePeers); // Max validators
            assertEquals(NetworkStatus.ONLINE, health.status);
            assertTrue(health.healthIssues.isEmpty());
        });
    }

    @Test
    @DisplayName("Should get adapter statistics")
    void testGetAdapterStatistics() {
        // Given: Initialized adapter with some transactions
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting statistics
        AdapterStatistics stats = cosmosAdapter.getAdapterStatistics(Duration.ofMinutes(10))
            .await().indefinitely();

        // Then: Should return valid statistics
        assertNotNull(stats);
        assertEquals("cosmoshub-4", stats.chainId);
        assertTrue(stats.successRate >= 0 && stats.successRate <= 1.0);
        assertNotNull(stats.transactionsByType);
    }

    @Test
    @DisplayName("Should configure retry policy for Cosmos SDK")
    void testConfigureRetryPolicy() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Configuring retry policy
        RetryPolicy policy = new RetryPolicy();
        policy.maxRetries = 3;
        policy.initialDelay = Duration.ofSeconds(1);
        policy.backoffMultiplier = 1.5;
        policy.maxDelay = Duration.ofSeconds(15);
        policy.enableExponentialBackoff = true;
        policy.retryableErrors = Arrays.asList("timeout", "connection_error", "account_sequence_mismatch");

        Boolean configured = cosmosAdapter.configureRetryPolicy(policy).await().indefinitely();

        // Then: Should configure successfully
        assertTrue(configured);
    }

    @Test
    @DisplayName("Should shutdown gracefully")
    void testShutdown() {
        // Given: Initialized adapter
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        // When: Shutting down
        Boolean shutdown = cosmosAdapter.shutdown().await().indefinitely();

        // Then: Should shutdown successfully
        assertTrue(shutdown);
    }

    @Test
    @DisplayName("Should have instant finality with Tendermint")
    void testInstantFinality() {
        // Given: Chain info
        ChainInfo info = cosmosAdapter.getChainInfo().await().indefinitely();

        // When: Sending transaction with wait for confirmation
        cosmosAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "cosmos1sy63lffevueudvvlvh2lf6s387xh9xq72n3fsy";
        tx.to = "cosmos1d4kp6uf87vzefq6fmjzj95crqdkz4pxuvf65yh";
        tx.value = new BigDecimal("1000000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionOptions options = new TransactionOptions();
        options.waitForConfirmation = true;

        TransactionResult result = cosmosAdapter.sendTransaction(tx, options).await().indefinitely();

        // Then: Should be finalized immediately with Tendermint
        assertEquals(TransactionExecutionStatus.FINALIZED, result.status);

        // Tendermint provides instant finality (one block = finalized)
        FeeEstimate estimate = cosmosAdapter.estimateTransactionFee(tx).await().indefinitely();
        assertEquals(FeeSpeed.INSTANT, estimate.feeSpeed);
    }

    @Test
    @DisplayName("Should support IBC protocol for cross-chain transfers")
    void testIBCSupport() {
        // Given: Chain info
        ChainInfo info = cosmosAdapter.getChainInfo().await().indefinitely();

        // Then: Should indicate IBC support
        assertNotNull(info.chainSpecificData);
        assertEquals(true, info.chainSpecificData.get("ibcEnabled"));

        // IBC is a core feature of Cosmos
        String tendermintVersion = (String) info.chainSpecificData.get("tendermintVersion");
        assertNotNull(tendermintVersion);
    }
}
