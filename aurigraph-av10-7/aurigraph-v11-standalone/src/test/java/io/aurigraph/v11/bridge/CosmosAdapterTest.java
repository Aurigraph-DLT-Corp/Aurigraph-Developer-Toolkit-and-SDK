package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.ChainAdapter;
import io.aurigraph.v11.bridge.adapters.CosmosAdapter;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Cosmos Adapter Test Suite
 *
 * Tests the Cosmos SDK/IBC adapter implementation with:
 * - Adapter initialization and configuration
 * - IBC transfer functionality
 * - Channel management
 *
 * @author Aurigraph V11 Testing Team
 * @version 11.0.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Cosmos Adapter Tests")
public class CosmosAdapterTest {

    @Inject
    CosmosAdapter cosmosAdapter;

    private ChainAdapter.ChainAdapterConfig config;

    @BeforeEach
    void setUp() {
        // Create test configuration
        config = new ChainAdapter.ChainAdapterConfig();
        config.chainId = "cosmoshub-4";
        config.rpcUrl = "https://rpc.cosmos.network";
        config.websocketUrl = "wss://rpc.cosmos.network/websocket";
        config.confirmationBlocks = 1;
        config.maxRetries = 3;
        config.timeout = Duration.ofSeconds(30);
        config.enableEvents = true;
    }

    @Test
    @Order(1)
    @DisplayName("Cosmos Adapter: Initialize adapter with valid configuration")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testCosmosAdapterInitialization() {
        // When
        Boolean initialized = cosmosAdapter.initialize(config).await().indefinitely();

        // Then
        assertTrue(initialized, "Cosmos adapter should initialize successfully");
        assertEquals("cosmoshub-4", cosmosAdapter.getChainId());

        // Verify chain info
        ChainAdapter.ChainInfo info = cosmosAdapter.getChainInfo().await().indefinitely();
        assertNotNull(info);
        assertEquals("ATOM", info.nativeCurrency);
        assertEquals(6, info.decimals);
        assertEquals(ChainAdapter.ChainType.MAINNET, info.chainType);
        assertEquals(ChainAdapter.ConsensusMechanism.DELEGATED_PROOF_OF_STAKE, info.consensusMechanism);
        assertTrue((Boolean) info.chainSpecificData.get("ibcEnabled"),
            "IBC should be enabled");

        // Verify connection
        ChainAdapter.ConnectionStatus status = cosmosAdapter.checkConnection()
            .await().indefinitely();
        assertTrue(status.isConnected, "Adapter should be connected");
        assertTrue(status.latencyMs < 100, "Latency should be reasonable");
        assertTrue(status.isSynced, "Node should be synced");
    }

    @Test
    @Order(2)
    @DisplayName("IBC Transfer: Send basic IBC transfer to another chain")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testIBCTransferBasic() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        String destinationChain = "osmosis";
        String recipient = "osmo1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd";
        BigDecimal amount = new BigDecimal("100.0"); // 100 ATOM

        // When
        ChainAdapter.TransactionResult result = cosmosAdapter.sendIBCTransfer(
            destinationChain,
            recipient,
            amount
        ).await().indefinitely();

        // Then
        assertNotNull(result);
        assertNotNull(result.transactionHash);
        assertEquals(ChainAdapter.TransactionExecutionStatus.FINALIZED, result.status,
            "Tendermint provides instant finality");

        // Verify IBC-specific metadata
        assertNotNull(result.logs);
        assertTrue(result.logs.containsKey("ibcChannel"));
        assertTrue(result.logs.containsKey("destinationChain"));
        assertTrue(result.logs.containsKey("packetSequence"));
        assertEquals("channel-0", result.logs.get("ibcChannel"));
        assertEquals(destinationChain, result.logs.get("destinationChain"));

        // Verify fee is reasonable for IBC transfer
        assertNotNull(result.actualFee);
        assertTrue(result.actualFee.compareTo(BigDecimal.ZERO) > 0);
        assertTrue(result.actualFee.compareTo(new BigDecimal("0.01")) < 0,
            "IBC fee should be less than 0.01 ATOM");
    }

    @Test
    @Order(3)
    @DisplayName("IBC Channel: Verify IBC channel management")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testIBCChannelManagement() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        // When - Test IBC transfer to multiple chains
        String[] destinationChains = {"osmosis", "ethereum", "polkadot"};
        String recipient = "cosmos1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd";
        BigDecimal amount = new BigDecimal("10.0");

        for (String chain : destinationChains) {
            // Then
            ChainAdapter.TransactionResult result = cosmosAdapter.sendIBCTransfer(
                chain, recipient, amount
            ).await().indefinitely();

            assertNotNull(result);
            assertEquals(ChainAdapter.TransactionExecutionStatus.FINALIZED, result.status);

            // Verify channel is established
            String channel = (String) result.logs.get("ibcChannel");
            assertNotNull(channel, "IBC channel should be established for " + chain);
            assertTrue(channel.startsWith("channel-"),
                "Channel should follow IBC naming convention");
        }

        // Test invalid chain
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            cosmosAdapter.sendIBCTransfer(
                "invalid-chain", recipient, amount
            ).await().indefinitely();
        });

        assertTrue(exception.getMessage().contains("No IBC channel found"),
            "Should reject transfers to chains without IBC channels");
    }

    @Test
    @Order(4)
    @DisplayName("Transaction: Send native ATOM transfer")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testNativeATOMTransfer() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        ChainAdapter.ChainTransaction transaction = new ChainAdapter.ChainTransaction();
        transaction.from = "cosmos1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd";
        transaction.to = "cosmos1zrx8l2xg8r2kdfn8jj9zqr8r2kdfn8jj9zqr8r";
        transaction.value = new BigDecimal("50.0");
        transaction.transactionType = ChainAdapter.TransactionType.TRANSFER;

        ChainAdapter.TransactionOptions options = new ChainAdapter.TransactionOptions();
        options.waitForConfirmation = true;
        options.requiredConfirmations = 1;
        options.confirmationTimeout = Duration.ofSeconds(30);

        // When
        ChainAdapter.TransactionResult result = cosmosAdapter.sendTransaction(
            transaction, options
        ).await().indefinitely();

        // Then
        assertNotNull(result);
        assertNotNull(result.transactionHash);
        assertEquals(ChainAdapter.TransactionExecutionStatus.FINALIZED, result.status);

        // Verify fees are reasonable
        assertNotNull(result.actualFee);
        assertTrue(result.actualFee.compareTo(new BigDecimal("0.01")) < 0,
            "Native transfer fee should be less than 0.01 ATOM");

        // Verify transaction status can be queried
        ChainAdapter.TransactionStatus status = cosmosAdapter.getTransactionStatus(
            result.transactionHash
        ).await().indefinitely();

        assertEquals(result.transactionHash, status.transactionHash);
        assertEquals(ChainAdapter.TransactionExecutionStatus.FINALIZED, status.status);
        assertTrue(status.success);
    }

    @Test
    @Order(5)
    @DisplayName("Balance: Query ATOM and IBC token balances")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testBalanceQueries() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();
        String address = "cosmos1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd";

        // When - Query native ATOM balance
        BigDecimal atomBalance = cosmosAdapter.getBalance(address, null)
            .await().indefinitely();

        // Then
        assertNotNull(atomBalance);
        assertTrue(atomBalance.compareTo(BigDecimal.ZERO) >= 0);

        // When - Query IBC token balance
        BigDecimal ibcTokenBalance = cosmosAdapter.getBalance(
            address, "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2"
        ).await().indefinitely();

        // Then
        assertNotNull(ibcTokenBalance);
        assertTrue(ibcTokenBalance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @Order(6)
    @DisplayName("Address Validation: Validate Cosmos Bech32 addresses")
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void testAddressValidation() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        // Valid addresses
        String[] validAddresses = {
            "cosmos1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd",
            "cosmos1zrx8l2xg8r2kdfn8jj9zqr8r2kdfn8jj9zqr8r"
        };

        for (String address : validAddresses) {
            ChainAdapter.AddressValidationResult result = cosmosAdapter.validateAddress(address)
                .await().indefinitely();

            assertTrue(result.isValid, "Address should be valid: " + address);
            assertEquals(address, result.address);
            assertEquals(address, result.normalizedAddress);
        }

        // Invalid addresses
        String[] invalidAddresses = {
            "0x742d35Cc6634C0532925a3b8D3Ac8E7b8fe30A4c", // Ethereum address
            "cosmos123", // Too short
            "osmo1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd" // Wrong prefix
        };

        for (String address : invalidAddresses) {
            ChainAdapter.AddressValidationResult result = cosmosAdapter.validateAddress(address)
                .await().indefinitely();

            assertFalse(result.isValid, "Address should be invalid: " + address);
        }
    }

    @Test
    @Order(7)
    @DisplayName("Fee Estimation: Estimate fees for different transaction types")
    @Timeout(value = 3, unit = TimeUnit.SECONDS)
    void testFeeEstimation() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        // Test different transaction types
        ChainAdapter.TransactionType[] types = {
            ChainAdapter.TransactionType.TRANSFER,
            ChainAdapter.TransactionType.STAKING,
            ChainAdapter.TransactionType.CONTRACT_CALL
        };

        for (ChainAdapter.TransactionType type : types) {
            ChainAdapter.ChainTransaction tx = new ChainAdapter.ChainTransaction();
            tx.from = "cosmos1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd";
            tx.to = "cosmos1zrx8l2xg8r2kdfn8jj9zqr8r2kdfn8jj9zqr8r";
            tx.value = new BigDecimal("100.0");
            tx.transactionType = type;

            // When
            ChainAdapter.FeeEstimate estimate = cosmosAdapter.estimateTransactionFee(tx)
                .await().indefinitely();

            // Then
            assertNotNull(estimate);
            assertNotNull(estimate.estimatedGas);
            assertNotNull(estimate.totalFee);
            assertNotNull(estimate.totalFeeUSD);
            assertEquals(ChainAdapter.FeeSpeed.INSTANT, estimate.feeSpeed,
                "Tendermint provides instant finality");

            // Verify reasonable fee ranges
            assertTrue(estimate.totalFee.compareTo(BigDecimal.ZERO) > 0);
            assertTrue(estimate.totalFee.compareTo(new BigDecimal("0.1")) < 0,
                "Fee should be less than 0.1 ATOM for " + type);
        }
    }

    @Test
    @Order(8)
    @DisplayName("Network Info: Get current network fee information")
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void testNetworkFeeInfo() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        // When
        ChainAdapter.NetworkFeeInfo feeInfo = cosmosAdapter.getNetworkFeeInfo()
            .await().indefinitely();

        // Then
        assertNotNull(feeInfo);
        assertNotNull(feeInfo.safeLowGasPrice);
        assertNotNull(feeInfo.standardGasPrice);
        assertNotNull(feeInfo.fastGasPrice);
        assertNotNull(feeInfo.instantGasPrice);

        // Verify fee ordering
        assertTrue(feeInfo.safeLowGasPrice.compareTo(feeInfo.standardGasPrice) <= 0);
        assertTrue(feeInfo.standardGasPrice.compareTo(feeInfo.fastGasPrice) <= 0);
        assertTrue(feeInfo.fastGasPrice.compareTo(feeInfo.instantGasPrice) <= 0);

        // Verify network utilization
        assertTrue(feeInfo.networkUtilization >= 0.0 && feeInfo.networkUtilization <= 1.0,
            "Network utilization should be between 0 and 1");
    }

    @Test
    @Order(9)
    @DisplayName("Block Info: Query block information")
    @Timeout(value = 3, unit = TimeUnit.SECONDS)
    void testBlockInfo() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        // Get current block height
        Long currentHeight = cosmosAdapter.getCurrentBlockHeight().await().indefinitely();
        assertNotNull(currentHeight);
        assertTrue(currentHeight > 0);

        // Query specific block
        ChainAdapter.BlockInfo blockInfo = cosmosAdapter.getBlockInfo(
            String.valueOf(currentHeight)
        ).await().indefinitely();

        assertNotNull(blockInfo);
        assertEquals(currentHeight, blockInfo.blockNumber);
        assertNotNull(blockInfo.blockHash);
        assertNotNull(blockInfo.parentHash);
        assertNotNull(blockInfo.miner); // Proposer validator
        assertTrue(blockInfo.timestamp > 0);

        // Verify Cosmos-specific data
        assertNotNull(blockInfo.extraData);
        assertTrue(blockInfo.extraData.containsKey("proposer"));
        assertTrue(blockInfo.extraData.containsKey("validatorSetHash"));
    }

    @Test
    @Order(10)
    @DisplayName("Statistics: Get adapter performance statistics")
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void testAdapterStatistics() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        // Execute some transactions to generate statistics
        for (int i = 0; i < 5; i++) {
            ChainAdapter.ChainTransaction tx = new ChainAdapter.ChainTransaction();
            tx.from = "cosmos1qypqxpq9qcrtsqx5mqnrtplrcqchvxlz27y7gd";
            tx.to = "cosmos1zrx8l2xg8r2kdfn8jj9zqr8r2kdfn8jj9zqr8r";
            tx.value = new BigDecimal("10.0");
            tx.transactionType = ChainAdapter.TransactionType.TRANSFER;

            cosmosAdapter.sendTransaction(tx, null).await().indefinitely();
        }

        // When
        ChainAdapter.AdapterStatistics stats = cosmosAdapter.getAdapterStatistics(
            Duration.ofMinutes(10)
        ).await().indefinitely();

        // Then
        assertNotNull(stats);
        assertEquals("cosmoshub-4", stats.chainId);
        assertTrue(stats.totalTransactions >= 5);
        assertTrue(stats.successfulTransactions >= 5);
        assertEquals(0, stats.failedTransactions);
        assertTrue(stats.successRate >= 0.99); // At least 99% success rate
    }

    @Test
    @Order(11)
    @DisplayName("Shutdown: Gracefully shutdown adapter")
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void testAdapterShutdown() {
        // Given
        cosmosAdapter.initialize(config).await().indefinitely();

        ChainAdapter.ConnectionStatus beforeShutdown = cosmosAdapter.checkConnection()
            .await().indefinitely();
        assertTrue(beforeShutdown.isConnected);

        // When
        Boolean shutdownSuccess = cosmosAdapter.shutdown().await().indefinitely();

        // Then
        assertTrue(shutdownSuccess);

        ChainAdapter.ConnectionStatus afterShutdown = cosmosAdapter.checkConnection()
            .await().indefinitely();
        assertFalse(afterShutdown.isConnected);
    }

    @AfterEach
    void tearDown() {
        // Clean up after each test
        try {
            cosmosAdapter.shutdown().await().indefinitely();
        } catch (Exception e) {
            // Ignore shutdown errors in teardown
        }
    }
}
