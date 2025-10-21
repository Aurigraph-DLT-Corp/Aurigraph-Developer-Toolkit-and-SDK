package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.ChainAdapter.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for EthereumAdapter (AV11-49)
 * Tests the complete Ethereum blockchain integration
 */
@QuarkusTest
@DisplayName("Ethereum Adapter Tests")
public class EthereumAdapterTest {

    @Inject
    EthereumAdapter ethereumAdapter;

    private ChainAdapterConfig testConfig;

    @BeforeEach
    void setup() {
        testConfig = new ChainAdapterConfig();
        testConfig.chainId = "1"; // Mainnet
        testConfig.rpcUrl = "https://eth-mainnet.g.alchemy.com/v2/demo";
        testConfig.websocketUrl = "wss://eth-mainnet.g.alchemy.com/v2/demo";
        testConfig.confirmationBlocks = 12;
        testConfig.maxRetries = 3;
        testConfig.timeout = Duration.ofSeconds(30);
        testConfig.enableEvents = true;
    }

    @Test
    @DisplayName("Should return correct chain ID")
    void testGetChainId() {
        String chainId = ethereumAdapter.getChainId();
        assertNotNull(chainId);
        assertEquals("1", chainId);
    }

    @Test
    @DisplayName("Should return Ethereum chain information")
    void testGetChainInfo() {
        ChainInfo info = ethereumAdapter.getChainInfo().await().indefinitely();

        assertNotNull(info);
        assertEquals("1", info.chainId);
        assertEquals("Ethereum Mainnet", info.chainName);
        assertEquals("ETH", info.nativeCurrency);
        assertEquals(18, info.decimals);
        assertEquals(ChainType.MAINNET, info.chainType);
        assertEquals(ConsensusMechanism.PROOF_OF_STAKE, info.consensusMechanism);
        assertTrue(info.supportsEIP1559);
        assertEquals(12000L, info.blockTime);
    }

    @Test
    @DisplayName("Should initialize successfully")
    void testInitialize() {
        Boolean initialized = ethereumAdapter.initialize(testConfig).await().indefinitely();

        assertTrue(initialized);
    }

    @Test
    @DisplayName("Should check connection status")
    void testCheckConnection() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();
        ConnectionStatus status = ethereumAdapter.checkConnection().await().indefinitely();

        assertNotNull(status);
        assertTrue(status.isConnected);
        assertTrue(status.latencyMs > 0);
        assertNotNull(status.nodeVersion);
        assertTrue(status.isSynced);
    }

    @Test
    @DisplayName("Should send transaction")
    void testSendTransaction() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        tx.to = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed0";
        tx.value = new BigDecimal("1000000000000000000"); // 1 ETH
        tx.gasLimit = new BigDecimal("21000");
        tx.gasPrice = new BigDecimal("25000000000"); // 25 Gwei
        tx.transactionType = TransactionType.TRANSFER;

        TransactionOptions options = new TransactionOptions();
        options.waitForConfirmation = false;
        options.requiredConfirmations = 12;

        TransactionResult result = ethereumAdapter.sendTransaction(tx, options).await().indefinitely();

        assertNotNull(result);
        assertNotNull(result.transactionHash);
        assertTrue(result.transactionHash.startsWith("0x"));
        assertNotNull(result.actualGasUsed);
        assertNotNull(result.actualFee);
    }

    @Test
    @DisplayName("Should get transaction status")
    void testGetTransactionStatus() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        // Send a transaction first
        ChainTransaction tx = new ChainTransaction();
        tx.from = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        tx.to = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed0";
        tx.value = new BigDecimal("1000000000000000000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionResult txResult = ethereumAdapter.sendTransaction(tx, new TransactionOptions())
            .await().indefinitely();

        // Get status
        TransactionStatus status = ethereumAdapter.getTransactionStatus(txResult.transactionHash)
            .await().indefinitely();

        assertNotNull(status);
        assertEquals(txResult.transactionHash, status.transactionHash);
        assertNotNull(status.status);
    }

    @Test
    @DisplayName("Should get balance for native ETH")
    void testGetBalanceNative() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        String address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        BigDecimal balance = ethereumAdapter.getBalance(address, null).await().indefinitely();

        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should get balance for ERC-20 token")
    void testGetBalanceERC20() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        String address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        String tokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec70"; // USDT
        BigDecimal balance = ethereumAdapter.getBalance(address, tokenAddress).await().indefinitely();

        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should get multiple balances")
    void testGetBalances() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        String address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        List<String> assets = Arrays.asList(
            null, // ETH
            "0xdAC17F958D2ee523a2206206994597C13D831ec70", // USDT
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB480"  // USDC
        );

        List<AssetBalance> balances = ethereumAdapter.getBalances(address, assets)
            .collect().asList().await().indefinitely();

        assertNotNull(balances);
        assertEquals(3, balances.size());

        balances.forEach(balance -> {
            assertNotNull(balance.balance);
            assertNotNull(balance.assetType);
        });
    }

    @Test
    @DisplayName("Should estimate transaction fee")
    void testEstimateTransactionFee() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.transactionType = TransactionType.TRANSFER;

        FeeEstimate estimate = ethereumAdapter.estimateTransactionFee(tx).await().indefinitely();

        assertNotNull(estimate);
        assertNotNull(estimate.estimatedGas);
        assertEquals(new BigDecimal("21000"), estimate.estimatedGas);
        assertNotNull(estimate.gasPrice);
        assertNotNull(estimate.totalFee);
        assertEquals(FeeSpeed.STANDARD, estimate.feeSpeed);
    }

    @Test
    @DisplayName("Should get network fee information")
    void testGetNetworkFeeInfo() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        NetworkFeeInfo feeInfo = ethereumAdapter.getNetworkFeeInfo().await().indefinitely();

        assertNotNull(feeInfo);
        assertNotNull(feeInfo.safeLowGasPrice);
        assertNotNull(feeInfo.standardGasPrice);
        assertNotNull(feeInfo.fastGasPrice);
        assertNotNull(feeInfo.instantGasPrice);
        assertNotNull(feeInfo.baseFeePerGas);
        assertTrue(feeInfo.networkUtilization >= 0 && feeInfo.networkUtilization <= 1.0);
    }

    @Test
    @DisplayName("Should validate Ethereum address")
    void testValidateAddress() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        // Valid address
        String validAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        AddressValidationResult validResult = ethereumAdapter.validateAddress(validAddress)
            .await().indefinitely();

        assertTrue(validResult.isValid);
        assertEquals(AddressFormat.ETHEREUM_CHECKSUM, validResult.format);

        // Invalid address
        String invalidAddress = "invalid-address";
        AddressValidationResult invalidResult = ethereumAdapter.validateAddress(invalidAddress)
            .await().indefinitely();

        assertFalse(invalidResult.isValid);
    }

    @Test
    @DisplayName("Should get current block height")
    void testGetCurrentBlockHeight() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        Long blockHeight = ethereumAdapter.getCurrentBlockHeight().await().indefinitely();

        assertNotNull(blockHeight);
        assertTrue(blockHeight > 0);
    }

    @Test
    @DisplayName("Should deploy contract")
    void testDeployContract() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        ContractDeployment deployment = new ContractDeployment();
        deployment.bytecode = "0x608060405234801561001057600080fd5b50";
        deployment.constructorData = "";
        deployment.deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
        deployment.gasLimit = new BigDecimal("2000000");
        deployment.verify = false;

        ContractDeploymentResult result = ethereumAdapter.deployContract(deployment).await().indefinitely();

        assertNotNull(result);
        assertNotNull(result.contractAddress);
        assertTrue(result.contractAddress.startsWith("0x"));
        assertTrue(result.success);
        assertNotNull(result.gasUsed);
    }

    @Test
    @DisplayName("Should call contract (read-only)")
    void testCallContractReadOnly() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        ContractFunctionCall call = new ContractFunctionCall();
        call.contractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec70";
        call.functionName = "totalSupply";
        call.functionArgs = Arrays.asList();
        call.isReadOnly = true;

        ContractCallResult result = ethereumAdapter.callContract(call).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.success);
        assertNotNull(result.returnValue);
        assertNull(result.transactionHash);
    }

    @Test
    @DisplayName("Should get adapter statistics")
    void testGetAdapterStatistics() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        AdapterStatistics stats = ethereumAdapter.getAdapterStatistics(Duration.ofMinutes(10))
            .await().indefinitely();

        assertNotNull(stats);
        assertEquals("1", stats.chainId);
        assertTrue(stats.successRate >= 0 && stats.successRate <= 1.0);
    }

    @Test
    @DisplayName("Should configure retry policy")
    void testConfigureRetryPolicy() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        RetryPolicy policy = new RetryPolicy();
        policy.maxRetries = 5;
        policy.initialDelay = Duration.ofSeconds(1);
        policy.backoffMultiplier = 2.0;
        policy.maxDelay = Duration.ofSeconds(30);
        policy.enableExponentialBackoff = true;

        Boolean configured = ethereumAdapter.configureRetryPolicy(policy).await().indefinitely();

        assertTrue(configured);
    }

    @Test
    @DisplayName("Should shutdown gracefully")
    void testShutdown() {
        ethereumAdapter.initialize(testConfig).await().indefinitely();

        Boolean shutdown = ethereumAdapter.shutdown().await().indefinitely();

        assertTrue(shutdown);
    }
}
