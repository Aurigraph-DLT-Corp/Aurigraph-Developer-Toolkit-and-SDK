package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.ChainAdapter.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PolygonAdapter (AV11-53)
 * Tests the complete Polygon (Matic) blockchain integration
 *
 * Coverage Areas:
 * - EVM-compatible chain initialization
 * - Transaction submission with low gas fees
 * - Balance queries (MATIC and ERC-20 tokens)
 * - Fee estimation (Polygon's low fees)
 * - Address validation (Ethereum-compatible addresses)
 * - Block info and height queries
 * - Smart contract deployment and interaction
 * - EIP-1559 support
 * - Proof of Stake consensus
 * - Network health monitoring
 *
 * Note: All 21 tests are enabled and verify PolygonAdapter implementation
 */
@QuarkusTest
@DisplayName("Polygon Adapter Tests")
public class PolygonAdapterTest {

    private PolygonAdapter adapter;
    private ChainAdapterConfig testConfig;

    @BeforeEach
    void setup() {
        adapter = new PolygonAdapter();
        testConfig = new ChainAdapterConfig();
        testConfig.chainId = "137"; // Polygon Mainnet
        testConfig.rpcUrl = "https://polygon-rpc.com";
        testConfig.websocketUrl = "wss://polygon-rpc.com";
        testConfig.confirmationBlocks = 128; // Polygon requires more confirmations
        testConfig.maxRetries = 3;
        testConfig.timeout = Duration.ofSeconds(30);
        testConfig.enableEvents = true;
    }

    @Test
    @DisplayName("Should return correct Polygon chain ID")
    void testGetChainId() {
        String chainId = adapter.getChainId();
        assertEquals("137", chainId, "Chain ID should be 137 for Polygon Mainnet");
    }

    @Test
    @DisplayName("Should return Polygon chain information with PoS consensus")
    void testGetChainInfo() {
        ChainInfo info = adapter.getChainInfo().await().indefinitely();

        assertNotNull(info, "Chain info should not be null");
        assertEquals("137", info.chainId, "Chain ID should be 137");
        assertEquals("Polygon Mainnet", info.chainName, "Chain name should be Polygon Mainnet");
        assertEquals("MATIC", info.nativeCurrency, "Native currency should be MATIC");
        assertEquals(18, info.decimals, "Decimals should be 18");
        assertEquals(ChainType.LAYER2, info.chainType, "Should be Layer 2 chain");
        assertEquals(ConsensusMechanism.PROOF_OF_STAKE, info.consensusMechanism, "Should use PoS");
        assertTrue(info.supportsEIP1559, "Should support EIP-1559");
        assertTrue(info.blockTime > 0, "Block time should be positive");
    }

    @Test
    @DisplayName("Should initialize successfully with Polygon RPC")
    void testInitialize() {
        Boolean result = adapter.initialize(testConfig).await().indefinitely();

        assertTrue(result, "Initialization should succeed");
        // Verify connection after init
        ConnectionStatus status = adapter.checkConnection().await().indefinitely();
        assertTrue(status.isConnected, "Should be connected after initialization");
    }

    @Test
    @DisplayName("Should check connection status")
    void testCheckConnection() {
        adapter.initialize(testConfig).await().indefinitely();
        ConnectionStatus status = adapter.checkConnection().await().indefinitely();

        assertNotNull(status, "Connection status should not be null");
        assertTrue(status.isConnected, "Should be connected");
        assertTrue(status.latencyMs < 100, "Polygon latency should be low");
        assertTrue(status.isSynced, "Node should be synced");
    }

    @Test
    @DisplayName("Should send transaction with low gas fees")
    void testSendTransaction() {
        adapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        tx.to = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed0";
        tx.value = new BigDecimal("1000000000000000000"); // 1 MATIC
        tx.gasLimit = new BigDecimal("21000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionOptions opts = new TransactionOptions();
        opts.waitForConfirmation = false;

        TransactionResult result = adapter.sendTransaction(tx, opts).await().indefinitely();

        assertNotNull(result, "Transaction result should not be null");
        assertNotNull(result.transactionHash, "Transaction hash should be present");
        assertTrue(result.transactionHash.startsWith("0x"), "Hash should be 0x prefixed");
        assertNotNull(result.actualFee, "Actual fee should be calculated");
    }

    @Test
    @DisplayName("Should get transaction status")
    void testGetTransactionStatus() {
        adapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        tx.to = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed0";
        tx.value = BigDecimal.ONE;
        tx.gasLimit = new BigDecimal("21000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionResult txResult = adapter.sendTransaction(tx, new TransactionOptions()).await().indefinitely();
        TransactionStatus status = adapter.getTransactionStatus(txResult.transactionHash).await().indefinitely();

        assertNotNull(status, "Status should not be null");
        assertEquals(txResult.transactionHash, status.transactionHash, "Hashes should match");
        assertTrue(status.confirmations >= 0, "Confirmations should be non-negative");
    }

    @Test
    @DisplayName("Should get balance for native MATIC")
    void testGetBalanceNative() {
        adapter.initialize(testConfig).await().indefinitely();

        String address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        BigDecimal balance = adapter.getBalance(address, null).await().indefinitely();

        assertNotNull(balance, "Balance should not be null");
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0, "Balance should be non-negative");
    }

    @Test
    @DisplayName("Should get balance for ERC-20 tokens on Polygon")
    void testGetBalanceERC20() {
        adapter.initialize(testConfig).await().indefinitely();

        String address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        String usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon
        BigDecimal balance = adapter.getBalance(address, usdcAddress).await().indefinitely();

        assertNotNull(balance, "Token balance should not be null");
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0, "Balance should be non-negative");
    }

    @Test
    @DisplayName("Should get multiple balances efficiently")
    void testGetBalances() {
        adapter.initialize(testConfig).await().indefinitely();

        String address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        List<String> assetIds = Arrays.asList(
            null, // MATIC
            "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
            "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"  // USDT
        );

        List<AssetBalance> balances = adapter.getBalances(address, assetIds)
            .collect().asList()
            .await().indefinitely();

        assertEquals(3, balances.size(), "Should return 3 balances");
        for (AssetBalance bal : balances) {
            assertNotNull(bal.balance, "Balance should not be null");
            assertTrue(bal.balance.compareTo(BigDecimal.ZERO) >= 0, "Balance should be non-negative");
        }
    }

    @Test
    @DisplayName("Should estimate transaction fee (very low on Polygon)")
    void testEstimateTransactionFee() {
        adapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.transactionType = TransactionType.TRANSFER;
        tx.gasLimit = new BigDecimal("21000");

        FeeEstimate estimate = adapter.estimateTransactionFee(tx).await().indefinitely();

        assertNotNull(estimate, "Fee estimate should not be null");
        assertNotNull(estimate.estimatedGas, "Gas estimate should be present");
        assertNotNull(estimate.totalFee, "Total fee should be calculated");
        assertTrue(estimate.totalFee.compareTo(BigDecimal.ZERO) >= 0, "Fee should be non-negative");
    }

    @Test
    @DisplayName("Should get network fee information with EIP-1559 data")
    void testGetNetworkFeeInfo() {
        adapter.initialize(testConfig).await().indefinitely();

        NetworkFeeInfo feeInfo = adapter.getNetworkFeeInfo().await().indefinitely();

        assertNotNull(feeInfo, "Fee info should not be null");
        assertNotNull(feeInfo.safeLowGasPrice, "Safe low gas price should be present");
        assertNotNull(feeInfo.standardGasPrice, "Standard gas price should be present");
        assertNotNull(feeInfo.fastGasPrice, "Fast gas price should be present");
        assertNotNull(feeInfo.baseFeePerGas, "Base fee should be present (EIP-1559)");
    }

    @Test
    @DisplayName("Should validate Ethereum-compatible address")
    void testValidateAddress() {
        adapter.initialize(testConfig).await().indefinitely();

        String validAddr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        String invalidAddr = "invalid-address";

        AddressValidationResult validResult = adapter.validateAddress(validAddr).await().indefinitely();
        assertTrue(validResult.isValid, "Valid address should pass validation");

        AddressValidationResult invalidResult = adapter.validateAddress(invalidAddr).await().indefinitely();
        assertFalse(invalidResult.isValid, "Invalid address should fail validation");
    }

    @Test
    @DisplayName("Should get current block height")
    void testGetCurrentBlockHeight() {
        adapter.initialize(testConfig).await().indefinitely();

        Long blockHeight = adapter.getCurrentBlockHeight().await().indefinitely();

        assertNotNull(blockHeight, "Block height should not be null");
        assertTrue(blockHeight > 0, "Block height should be positive");
    }

    @Test
    @DisplayName("Should deploy smart contract on Polygon")
    void testDeployContract() {
        adapter.initialize(testConfig).await().indefinitely();

        ContractDeployment deployment = new ContractDeployment();
        deployment.bytecode = "0x608060405234801561001057600080fd5b50";
        deployment.deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        deployment.gasLimit = new BigDecimal("2000000");

        ContractDeploymentResult result = adapter.deployContract(deployment).await().indefinitely();

        assertNotNull(result, "Deployment result should not be null");
        assertTrue(result.success, "Deployment should succeed");
        assertNotNull(result.contractAddress, "Contract address should be present");
        assertTrue(result.contractAddress.startsWith("0x"), "Address should be 0x prefixed");
    }

    @Test
    @DisplayName("Should call smart contract (read and write)")
    void testCallContract() {
        adapter.initialize(testConfig).await().indefinitely();

        ContractFunctionCall call = new ContractFunctionCall();
        call.contractAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
        call.functionName = "balanceOf";
        call.caller = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        call.isReadOnly = true;

        ContractCallResult result = adapter.callContract(call).await().indefinitely();

        assertNotNull(result, "Call result should not be null");
        assertTrue(result.success, "Call should succeed");
    }

    @Test
    @DisplayName("Should get adapter statistics")
    void testGetAdapterStatistics() {
        adapter.initialize(testConfig).await().indefinitely();

        // Send a transaction to generate stats
        ChainTransaction tx = new ChainTransaction();
        tx.from = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        tx.to = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed0";
        tx.value = BigDecimal.ONE;
        tx.gasLimit = new BigDecimal("21000");
        tx.transactionType = TransactionType.TRANSFER;
        adapter.sendTransaction(tx, new TransactionOptions()).await().indefinitely();

        AdapterStatistics stats = adapter.getAdapterStatistics(Duration.ofMinutes(1)).await().indefinitely();

        assertNotNull(stats, "Statistics should not be null");
        assertEquals("137", stats.chainId, "Chain ID should match");
        assertTrue(stats.totalTransactions > 0, "Should have transaction count");
    }

    @Test
    @DisplayName("Should configure retry policy")
    void testConfigureRetryPolicy() {
        adapter.initialize(testConfig).await().indefinitely();

        RetryPolicy policy = new RetryPolicy();
        policy.maxRetries = 3;
        policy.initialDelay = Duration.ofMillis(100);
        policy.backoffMultiplier = 2.0;
        policy.maxDelay = Duration.ofSeconds(30);

        Boolean result = adapter.configureRetryPolicy(policy).await().indefinitely();
        assertTrue(result, "Retry policy should be configured successfully");
    }

    @Test
    @DisplayName("Should shutdown gracefully")
    void testShutdown() {
        adapter.initialize(testConfig).await().indefinitely();

        Boolean result = adapter.shutdown().await().indefinitely();
        assertTrue(result, "Shutdown should complete successfully");

        // Verify not connected after shutdown
        Boolean initialized = adapter.initialize(testConfig).await().indefinitely();
        assertTrue(initialized, "Should be able to reinitialize after shutdown");
    }

    @Test
    @DisplayName("Should have faster block times than Ethereum")
    void testFasterBlockTimes() {
        adapter.initialize(testConfig).await().indefinitely();

        ChainInfo info = adapter.getChainInfo().await().indefinitely();
        assertTrue(info.blockTime < 3000, "Polygon block time should be less than 3 seconds");
        assertTrue(info.blockTime > 1000, "Polygon block time should be more than 1 second");
    }

    @Test
    @DisplayName("Should have much lower fees than Ethereum")
    void testLowerFees() {
        adapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.transactionType = TransactionType.TRANSFER;

        FeeEstimate estimate = adapter.estimateTransactionFee(tx).await().indefinitely();
        assertNotNull(estimate.totalFee, "Fee should be calculated");
        // Polygon fees are typically very low (cents, not dollars)
        assertTrue(estimate.totalFee.compareTo(new BigDecimal("0.1")) < 0, "Fee should be very low");
    }

    @Test
    @DisplayName("Should support EIP-1559 transaction type")
    void testEIP1559Support() {
        adapter.initialize(testConfig).await().indefinitely();

        ChainInfo info = adapter.getChainInfo().await().indefinitely();
        assertTrue(info.supportsEIP1559, "Should support EIP-1559");

        ChainTransaction tx = new ChainTransaction();
        tx.transactionType = TransactionType.TRANSFER;

        FeeEstimate estimate = adapter.estimateTransactionFee(tx).await().indefinitely();
        assertNotNull(estimate.maxFeePerGas, "maxFeePerGas should be present");
        assertNotNull(estimate.maxPriorityFeePerGas, "maxPriorityFeePerGas should be present");
    }
}
