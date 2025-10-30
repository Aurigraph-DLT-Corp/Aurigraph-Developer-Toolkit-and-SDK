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
 * Unit tests for PolkadotAdapter (AV11-51)
 * Tests the complete Polkadot/Substrate blockchain integration
 *
 * Coverage Areas:
 * - Chain initialization and configuration
 * - Extrinsic submission and status tracking
 * - Balance queries (DOT and Asset Hub tokens)
 * - Fee estimation and network fee info
 * - Address validation (SS58 format)
 * - Block info and height queries
 * - Contract deployment (ink! smart contracts)
 * - Contract interaction
 * - XCM (Cross-Consensus Messaging) support
 * - GRANDPA finality
 * - Network health monitoring
 */
@QuarkusTest
@DisplayName("Polkadot Adapter Tests")
public class PolkadotAdapterTest {

    @Inject
    PolkadotAdapter polkadotAdapter;

    private ChainAdapterConfig testConfig;

    @BeforeEach
    void setup() {
        testConfig = new ChainAdapterConfig();
        testConfig.chainId = "polkadot";
        testConfig.rpcUrl = "https://rpc.polkadot.io";
        testConfig.websocketUrl = "wss://rpc.polkadot.io";
        testConfig.confirmationBlocks = 2; // GRANDPA finality is fast
        testConfig.maxRetries = 3;
        testConfig.timeout = Duration.ofSeconds(30);
        testConfig.enableEvents = true;
    }

    @Test
    @DisplayName("Should return correct chain ID")
    void testGetChainId() {
        // Given: PolkadotAdapter is initialized
        String chainId = polkadotAdapter.getChainId();

        // Then: Should return polkadot chain ID
        assertNotNull(chainId);
        assertEquals("polkadot", chainId);
    }

    @Test
    @DisplayName("Should return Polkadot chain information with NPoS consensus")
    void testGetChainInfo() {
        // When: Getting chain information
        ChainInfo info = polkadotAdapter.getChainInfo().await().indefinitely();

        // Then: Should return complete Polkadot chain info
        assertNotNull(info);
        assertEquals("polkadot", info.chainId);
        assertEquals("Polkadot Relay Chain", info.chainName);
        assertEquals("DOT", info.nativeCurrency);
        assertEquals(10, info.decimals); // 10^10 Planck per DOT
        assertEquals(ChainType.MAINNET, info.chainType);
        assertEquals(ConsensusMechanism.NOMINATED_PROOF_OF_STAKE, info.consensusMechanism);
        assertFalse(info.supportsEIP1559); // Substrate doesn't use EIP-1559
        assertEquals(6000L, info.blockTime); // 6 seconds per block

        // Verify Polkadot-specific data
        assertNotNull(info.chainSpecificData);
        assertTrue(info.chainSpecificData.containsKey("ss58Format"));
        assertTrue(info.chainSpecificData.containsKey("xcmEnabled"));
        assertEquals(true, info.chainSpecificData.get("xcmEnabled"));
    }

    @Test
    @DisplayName("Should initialize successfully with Substrate RPC")
    void testInitialize() {
        // When: Initializing adapter with config
        Boolean initialized = polkadotAdapter.initialize(testConfig).await().indefinitely();

        // Then: Should initialize successfully
        assertTrue(initialized);
    }

    @Test
    @DisplayName("Should check connection status with validator info")
    void testCheckConnection() {
        // Given: Adapter is initialized
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Checking connection
        ConnectionStatus status = polkadotAdapter.checkConnection().await().indefinitely();

        // Then: Should return valid connection status
        assertNotNull(status);
        assertTrue(status.isConnected);
        assertTrue(status.latencyMs > 0);
        assertTrue(status.latencyMs < 200); // Should be reasonably fast
        assertNotNull(status.nodeVersion);
        assertTrue(status.nodeVersion.contains("polkadot"));
        assertTrue(status.isSynced);
        assertNull(status.errorMessage);
    }

    @Test
    @DisplayName("Should send extrinsic and return transaction result")
    void testSendTransaction() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Sending a balance transfer extrinsic
        ChainTransaction tx = new ChainTransaction();
        tx.from = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        tx.to = "14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3";
        tx.value = new BigDecimal("100000000000"); // 10 DOT in Planck
        tx.transactionType = TransactionType.TRANSFER;

        TransactionOptions options = new TransactionOptions();
        options.waitForConfirmation = false;
        options.requiredConfirmations = 2;

        TransactionResult result = polkadotAdapter.sendTransaction(tx, options).await().indefinitely();

        // Then: Should return valid transaction result
        assertNotNull(result);
        assertNotNull(result.transactionHash);
        assertTrue(result.transactionHash.startsWith("0x")); // Substrate uses 0x prefix
        assertEquals(66, result.transactionHash.length()); // 0x + 64 hex chars
        assertNotNull(result.actualGasUsed);
        assertNotNull(result.actualFee);

        // Polkadot fees should be reasonable
        assertTrue(result.actualFee.compareTo(new BigDecimal("0.1")) < 0); // Less than 0.1 DOT

        // Should have era and nonce in logs
        assertNotNull(result.logs);
        assertTrue(result.logs.containsKey("era"));
        assertTrue(result.logs.containsKey("nonce"));
    }

    @Test
    @DisplayName("Should get extrinsic status with GRANDPA finality")
    void testGetTransactionStatus() {
        // Given: A submitted extrinsic
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        tx.to = "14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3";
        tx.value = new BigDecimal("100000000000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionResult txResult = polkadotAdapter.sendTransaction(tx, new TransactionOptions())
            .await().indefinitely();

        // When: Getting transaction status
        TransactionStatus status = polkadotAdapter.getTransactionStatus(txResult.transactionHash)
            .await().indefinitely();

        // Then: Should return finalized status
        assertNotNull(status);
        assertEquals(txResult.transactionHash, status.transactionHash);
        assertNotNull(status.status);
        assertEquals(TransactionExecutionStatus.FINALIZED, status.status); // GRANDPA finality
        assertTrue(status.success);
        assertNotNull(status.gasUsed);
    }

    @Test
    @DisplayName("Should wait for confirmation with GRANDPA fast finality")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testWaitForConfirmation() {
        // Given: Initialized adapter and a transaction hash
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        tx.to = "14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3";
        tx.value = new BigDecimal("100000000000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionResult txResult = polkadotAdapter.sendTransaction(tx, new TransactionOptions())
            .await().indefinitely();

        // When: Waiting for confirmation (2 blocks for GRANDPA finality)
        ConfirmationResult confirmation = polkadotAdapter.waitForConfirmation(
            txResult.transactionHash,
            2,
            Duration.ofSeconds(20)
        ).await().indefinitely();

        // Then: Should confirm within GRANDPA finality time (~12 seconds)
        assertNotNull(confirmation);
        assertTrue(confirmation.confirmed);
        assertEquals(txResult.transactionHash, confirmation.transactionHash);
        assertTrue(confirmation.actualConfirmations >= 2);
        assertFalse(confirmation.timedOut);
        assertNotNull(confirmation.finalStatus);

        // GRANDPA finality should be fast (< 15 seconds for 2 blocks)
        assertTrue(confirmation.confirmationTime < 15000);
    }

    @Test
    @DisplayName("Should get balance for native DOT")
    void testGetBalanceNative() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting native DOT balance
        String address = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        BigDecimal balance = polkadotAdapter.getBalance(address, null).await().indefinitely();

        // Then: Should return valid balance
        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should get balance for Asset Hub tokens")
    void testGetBalanceAssetHub() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting Asset Hub token balance
        String address = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        String assetId = "1984"; // USDT on Asset Hub
        BigDecimal balance = polkadotAdapter.getBalance(address, assetId).await().indefinitely();

        // Then: Should return valid balance
        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should get multiple balances including DOT and parachain tokens")
    void testGetBalances() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting multiple balances
        String address = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        List<String> assets = Arrays.asList(
            null,      // DOT
            "1984",    // USDT on Asset Hub
            "2000"     // Other asset
        );

        List<AssetBalance> balances = polkadotAdapter.getBalances(address, assets)
            .collect().asList().await().indefinitely();

        // Then: Should return all balances
        assertNotNull(balances);
        assertEquals(3, balances.size());

        balances.forEach(balance -> {
            assertNotNull(balance.balance);
            assertNotNull(balance.assetType);
            assertNotNull(balance.assetSymbol);
            assertEquals(10, balance.decimals); // Polkadot uses 10 decimals
        });

        // First balance should be native DOT
        assertEquals(AssetType.NATIVE, balances.get(0).assetType);
        assertEquals("DOT", balances.get(0).assetSymbol);
    }

    @Test
    @DisplayName("Should estimate transaction fee based on weight")
    void testEstimateTransactionFee() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Estimating fee for different transaction types
        ChainTransaction transferTx = new ChainTransaction();
        transferTx.transactionType = TransactionType.TRANSFER;

        FeeEstimate transferEstimate = polkadotAdapter.estimateTransactionFee(transferTx)
            .await().indefinitely();

        ChainTransaction stakingTx = new ChainTransaction();
        stakingTx.transactionType = TransactionType.STAKING;

        FeeEstimate stakingEstimate = polkadotAdapter.estimateTransactionFee(stakingTx)
            .await().indefinitely();

        // Then: Should return valid estimates
        assertNotNull(transferEstimate);
        assertNotNull(transferEstimate.estimatedGas);
        assertEquals(new BigDecimal("100000000"), transferEstimate.estimatedGas); // 0.01 DOT in Planck
        assertNotNull(transferEstimate.totalFee);
        assertEquals(FeeSpeed.FAST, transferEstimate.feeSpeed); // GRANDPA is fast
        assertEquals(Duration.ofSeconds(12), transferEstimate.estimatedConfirmationTime); // 2 blocks

        // Staking should have higher fee
        assertTrue(stakingEstimate.estimatedGas.compareTo(transferEstimate.estimatedGas) > 0);
    }

    @Test
    @DisplayName("Should get network fee information")
    void testGetNetworkFeeInfo() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting network fee info
        NetworkFeeInfo feeInfo = polkadotAdapter.getNetworkFeeInfo().await().indefinitely();

        // Then: Should return current fee info
        assertNotNull(feeInfo);
        assertNotNull(feeInfo.safeLowGasPrice);
        assertNotNull(feeInfo.standardGasPrice);
        assertNotNull(feeInfo.fastGasPrice);
        assertNotNull(feeInfo.baseFeePerGas);

        // Polkadot fees are relatively stable
        assertTrue(feeInfo.standardGasPrice.compareTo(new BigDecimal("0.05")) < 0);
        assertTrue(feeInfo.networkUtilization >= 0 && feeInfo.networkUtilization <= 1.0);
        assertTrue(feeInfo.blockNumber > 0);
    }

    @Test
    @DisplayName("Should validate Polkadot address (SS58 format)")
    void testValidateAddress() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Validating valid SS58 address
        String validAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        AddressValidationResult validResult = polkadotAdapter.validateAddress(validAddress)
            .await().indefinitely();

        // Then: Should validate as valid
        assertTrue(validResult.isValid);
        assertEquals(AddressFormat.SUBSTRATE_SS58, validResult.format);
        assertEquals(validAddress, validResult.normalizedAddress);

        // When: Validating invalid address
        String invalidAddress = "0xinvalid-ethereum-address";
        AddressValidationResult invalidResult = polkadotAdapter.validateAddress(invalidAddress)
            .await().indefinitely();

        // Then: Should validate as invalid
        assertFalse(invalidResult.isValid);
        assertNotNull(invalidResult.validationMessage);
    }

    @Test
    @DisplayName("Should get current block height")
    void testGetCurrentBlockHeight() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting current block height
        Long blockHeight = polkadotAdapter.getCurrentBlockHeight().await().indefinitely();

        // Then: Should return valid height
        assertNotNull(blockHeight);
        assertTrue(blockHeight > 0);
        assertTrue(blockHeight > 18000000L); // Recent Polkadot block number
    }

    @Test
    @DisplayName("Should get block information with validator data")
    void testGetBlockInfo() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting block info
        String blockNumber = "18000000";
        BlockInfo info = polkadotAdapter.getBlockInfo(blockNumber).await().indefinitely();

        // Then: Should return complete block info
        assertNotNull(info);
        assertEquals(18000000L, info.blockNumber);
        assertNotNull(info.blockHash);
        assertNotNull(info.parentHash);
        assertTrue(info.blockHash.startsWith("0x"));
        assertNotNull(info.miner); // Validator address
        assertEquals(BigDecimal.ZERO, info.difficulty); // NPoS doesn't use difficulty
        assertTrue(info.transactionCount > 0);

        // Should have Substrate-specific data
        assertNotNull(info.extraData);
        assertTrue(info.extraData.containsKey("stateRoot"));
        assertTrue(info.extraData.containsKey("extrinsicsRoot"));
    }

    @Test
    @DisplayName("Should deploy ink! smart contract")
    void testDeployContract() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Deploying ink! contract
        ContractDeployment deployment = new ContractDeployment();
        deployment.bytecode = "0x00"; // Simplified bytecode
        deployment.constructorData = "";
        deployment.deployer = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        deployment.gasLimit = new BigDecimal("10000000000"); // 1 DOT
        deployment.verify = false;

        ContractDeploymentResult result = polkadotAdapter.deployContract(deployment).await().indefinitely();

        // Then: Should deploy successfully
        assertNotNull(result);
        assertNotNull(result.contractAddress);
        assertTrue(result.contractAddress.length() >= 47); // SS58 address
        assertTrue(result.success);
        assertNotNull(result.gasUsed);
        assertNotNull(result.transactionHash);
    }

    @Test
    @DisplayName("Should call ink! contract (read-only and write)")
    void testCallContract() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Making read-only contract call
        ContractFunctionCall readCall = new ContractFunctionCall();
        readCall.contractAddress = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
        readCall.functionName = "get";
        readCall.functionArgs = Arrays.asList();
        readCall.isReadOnly = true;

        ContractCallResult readResult = polkadotAdapter.callContract(readCall).await().indefinitely();

        // Then: Should return read result without transaction
        assertNotNull(readResult);
        assertTrue(readResult.success);
        assertNotNull(readResult.returnValue);
        assertNull(readResult.transactionHash); // Read-only, no tx
        assertEquals(BigDecimal.ZERO, readResult.gasUsed);

        // When: Making state-changing contract call
        ContractFunctionCall writeCall = new ContractFunctionCall();
        writeCall.contractAddress = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
        writeCall.functionName = "set";
        writeCall.functionArgs = Arrays.asList("100");
        writeCall.isReadOnly = false;
        writeCall.gasLimit = new BigDecimal("500000000"); // 0.05 DOT

        ContractCallResult writeResult = polkadotAdapter.callContract(writeCall).await().indefinitely();

        // Then: Should execute and return transaction
        assertNotNull(writeResult);
        assertTrue(writeResult.success);
        assertNotNull(writeResult.transactionHash);
        assertTrue(writeResult.gasUsed.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Should subscribe to Substrate events")
    void testSubscribeToEvents() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Subscribing to events
        EventFilter filter = new EventFilter();
        filter.contractAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
        filter.eventSignatures = Arrays.asList("Balances.Transfer");

        List<BlockchainEvent> events = polkadotAdapter.subscribeToEvents(filter)
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
            assertEquals("Balances.Transfer", event.eventSignature);
            assertNotNull(event.eventData);
            assertTrue(event.eventData.size() >= 2); // from, to, amount
        });
    }

    @Test
    @DisplayName("Should get historical events from past blocks")
    void testGetHistoricalEvents() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting historical events
        EventFilter filter = new EventFilter();
        filter.eventSignatures = Arrays.asList("Balances.Transfer");

        long fromBlock = 18000000L;
        long toBlock = 18000010L;

        List<BlockchainEvent> events = polkadotAdapter.getHistoricalEvents(filter, fromBlock, toBlock)
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
    @DisplayName("Should monitor network health with validator metrics")
    void testMonitorNetworkHealth() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Monitoring network health
        List<NetworkHealth> healthReports = polkadotAdapter.monitorNetworkHealth(Duration.ofSeconds(3))
            .select().first(2)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(10));

        // Then: Should receive health reports
        assertNotNull(healthReports);
        assertEquals(2, healthReports.size());

        healthReports.forEach(health -> {
            assertTrue(health.isHealthy);
            assertTrue(health.currentBlockHeight > 0);
            assertEquals(6000L, health.averageBlockTime); // 6 seconds
            assertEquals(0.0, health.networkHashRate); // NPoS doesn't use hashrate
            assertTrue(health.activePeers > 0); // Validators
            assertEquals(NetworkStatus.ONLINE, health.status);
            assertTrue(health.healthIssues.isEmpty());
        });
    }

    @Test
    @DisplayName("Should get adapter statistics")
    void testGetAdapterStatistics() {
        // Given: Initialized adapter with some transactions
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Getting statistics
        AdapterStatistics stats = polkadotAdapter.getAdapterStatistics(Duration.ofMinutes(10))
            .await().indefinitely();

        // Then: Should return valid statistics
        assertNotNull(stats);
        assertEquals("polkadot", stats.chainId);
        assertTrue(stats.successRate >= 0 && stats.successRate <= 1.0);
        assertNotNull(stats.transactionsByType);
    }

    @Test
    @DisplayName("Should configure retry policy for Substrate RPC")
    void testConfigureRetryPolicy() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Configuring retry policy
        RetryPolicy policy = new RetryPolicy();
        policy.maxRetries = 5;
        policy.initialDelay = Duration.ofSeconds(1);
        policy.backoffMultiplier = 2.0;
        policy.maxDelay = Duration.ofSeconds(20);
        policy.enableExponentialBackoff = true;
        policy.retryableErrors = Arrays.asList("timeout", "connection_error", "invalid_nonce");

        Boolean configured = polkadotAdapter.configureRetryPolicy(policy).await().indefinitely();

        // Then: Should configure successfully
        assertTrue(configured);
    }

    @Test
    @DisplayName("Should shutdown gracefully")
    void testShutdown() {
        // Given: Initialized adapter
        polkadotAdapter.initialize(testConfig).await().indefinitely();

        // When: Shutting down
        Boolean shutdown = polkadotAdapter.shutdown().await().indefinitely();

        // Then: Should shutdown successfully
        assertTrue(shutdown);
    }

    @Test
    @DisplayName("Should have faster finality than Bitcoin")
    void testFastFinality() {
        // Given: Chain info
        ChainInfo info = polkadotAdapter.getChainInfo().await().indefinitely();

        // Then: Should have fast finality with GRANDPA
        // 6 second block time, 2 blocks for finality = 12 seconds
        assertTrue(info.blockTime <= 6000); // 6 seconds or less

        // GRANDPA finality is much faster than Bitcoin (60 minutes)
        FeeEstimate estimate = polkadotAdapter.estimateTransactionFee(new ChainTransaction())
            .await().indefinitely();
        assertTrue(estimate.estimatedConfirmationTime.getSeconds() < 60); // Much faster than Bitcoin
    }

    @Test
    @DisplayName("Should support XCM for cross-chain communication")
    void testXCMSupport() {
        // Given: Chain info
        ChainInfo info = polkadotAdapter.getChainInfo().await().indefinitely();

        // Then: Should indicate XCM support
        assertNotNull(info.chainSpecificData);
        assertEquals(true, info.chainSpecificData.get("xcmEnabled"));
    }
}
