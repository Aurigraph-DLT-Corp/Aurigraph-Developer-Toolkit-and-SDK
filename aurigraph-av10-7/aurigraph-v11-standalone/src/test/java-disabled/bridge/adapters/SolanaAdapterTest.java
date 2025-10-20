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
 * Unit tests for SolanaAdapter (AV11-50)
 * Tests the complete Solana blockchain integration
 */
@QuarkusTest
@DisplayName("Solana Adapter Tests")
public class SolanaAdapterTest {

    @Inject
    SolanaAdapter solanaAdapter;

    private ChainAdapterConfig testConfig;

    @BeforeEach
    void setup() {
        testConfig = new ChainAdapterConfig();
        testConfig.chainId = "mainnet-beta";
        testConfig.rpcUrl = "https://api.mainnet-beta.solana.com";
        testConfig.websocketUrl = "wss://api.mainnet-beta.solana.com";
        testConfig.maxRetries = 3;
        testConfig.timeout = Duration.ofSeconds(30);
        testConfig.enableEvents = true;
    }

    @Test
    @DisplayName("Should return correct chain ID")
    void testGetChainId() {
        String chainId = solanaAdapter.getChainId();
        assertNotNull(chainId);
        assertEquals("mainnet-beta", chainId);
    }

    @Test
    @DisplayName("Should return Solana chain information")
    void testGetChainInfo() {
        ChainInfo info = solanaAdapter.getChainInfo().await().indefinitely();

        assertNotNull(info);
        assertEquals("mainnet-beta", info.chainId);
        assertEquals("Solana Mainnet", info.chainName);
        assertEquals("SOL", info.nativeCurrency);
        assertEquals(9, info.decimals);
        assertEquals(ChainType.MAINNET, info.chainType);
        assertEquals(ConsensusMechanism.PROOF_OF_HISTORY, info.consensusMechanism);
        assertFalse(info.supportsEIP1559); // Solana doesn't support EIP-1559
        assertEquals(400L, info.blockTime); // 400ms slot time
    }

    @Test
    @DisplayName("Should initialize successfully")
    void testInitialize() {
        Boolean initialized = solanaAdapter.initialize(testConfig).await().indefinitely();
        assertTrue(initialized);
    }

    @Test
    @DisplayName("Should check connection status")
    void testCheckConnection() {
        solanaAdapter.initialize(testConfig).await().indefinitely();
        ConnectionStatus status = solanaAdapter.checkConnection().await().indefinitely();

        assertNotNull(status);
        assertTrue(status.isConnected);
        assertTrue(status.latencyMs < 100); // Solana should be fast
        assertNotNull(status.nodeVersion);
        assertTrue(status.isSynced);
    }

    @Test
    @DisplayName("Should send transaction with low fees")
    void testSendTransaction() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "7HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnQ";
        tx.to = "8HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnR";
        tx.value = new BigDecimal("1000000000"); // 1 SOL in lamports
        tx.transactionType = TransactionType.TRANSFER;

        TransactionOptions options = new TransactionOptions();
        options.waitForConfirmation = false;

        TransactionResult result = solanaAdapter.sendTransaction(tx, options).await().indefinitely();

        assertNotNull(result);
        assertNotNull(result.transactionHash);
        assertTrue(result.transactionHash.length() > 80); // Solana signatures are ~88 chars
        assertNotNull(result.actualFee);
        // Solana fees should be very low
        assertTrue(result.actualFee.compareTo(new BigDecimal("0.00001")) < 0);
    }

    @Test
    @DisplayName("Should get transaction status")
    void testGetTransactionStatus() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.from = "7HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnQ";
        tx.to = "8HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnR";
        tx.value = new BigDecimal("1000000000");
        tx.transactionType = TransactionType.TRANSFER;

        TransactionResult txResult = solanaAdapter.sendTransaction(tx, new TransactionOptions())
            .await().indefinitely();

        TransactionStatus status = solanaAdapter.getTransactionStatus(txResult.transactionHash)
            .await().indefinitely();

        assertNotNull(status);
        assertEquals(txResult.transactionHash, status.transactionHash);
        assertNotNull(status.status);
    }

    @Test
    @DisplayName("Should get balance for native SOL")
    void testGetBalanceNative() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        String address = "7HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnQ";
        BigDecimal balance = solanaAdapter.getBalance(address, null).await().indefinitely();

        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should get balance for SPL token")
    void testGetBalanceSPL() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        String address = "7HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnQ";
        String tokenMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
        BigDecimal balance = solanaAdapter.getBalance(address, tokenMint).await().indefinitely();

        assertNotNull(balance);
        assertTrue(balance.compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should estimate transaction fee (very low)")
    void testEstimateTransactionFee() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.transactionType = TransactionType.TRANSFER;

        FeeEstimate estimate = solanaAdapter.estimateTransactionFee(tx).await().indefinitely();

        assertNotNull(estimate);
        assertNotNull(estimate.estimatedGas); // In lamports
        assertEquals(new BigDecimal("5000"), estimate.estimatedGas);
        assertNotNull(estimate.totalFee);
        // Solana fees are extremely low
        assertTrue(estimate.totalFee.compareTo(new BigDecimal("0.00001")) < 0);
        assertEquals(FeeSpeed.INSTANT, estimate.feeSpeed); // Solana is always fast
    }

    @Test
    @DisplayName("Should get network fee information (fixed fees)")
    void testGetNetworkFeeInfo() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        NetworkFeeInfo feeInfo = solanaAdapter.getNetworkFeeInfo().await().indefinitely();

        assertNotNull(feeInfo);
        // Solana has fixed fees
        assertEquals(feeInfo.safeLowGasPrice, feeInfo.standardGasPrice);
        assertEquals(feeInfo.standardGasPrice, feeInfo.fastGasPrice);
        assertEquals(feeInfo.fastGasPrice, feeInfo.instantGasPrice);
    }

    @Test
    @DisplayName("Should validate Solana address (Base58)")
    void testValidateAddress() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        // Valid Solana address (Base58)
        String validAddress = "7HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnQ";
        AddressValidationResult validResult = solanaAdapter.validateAddress(validAddress)
            .await().indefinitely();

        assertTrue(validResult.isValid);
        assertEquals(AddressFormat.SOLANA_BASE58, validResult.format);

        // Invalid address
        String invalidAddress = "0xinvalid-ethereum-address";
        AddressValidationResult invalidResult = solanaAdapter.validateAddress(invalidAddress)
            .await().indefinitely();

        assertFalse(invalidResult.isValid);
    }

    @Test
    @DisplayName("Should get current slot (block) height")
    void testGetCurrentBlockHeight() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        Long slot = solanaAdapter.getCurrentBlockHeight().await().indefinitely();

        assertNotNull(slot);
        assertTrue(slot > 0);
        assertTrue(slot > 245000000L); // Recent slot number
    }

    @Test
    @DisplayName("Should deploy Solana program")
    void testDeployProgram() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        ContractDeployment deployment = new ContractDeployment();
        deployment.bytecode = "program-bytecode";
        deployment.deployer = "7HqaMHPfCPSZ6yS3TvCyLnVtaLb6rNRcZrqJuXLkGpnQ";
        deployment.gasLimit = new BigDecimal("50000");
        deployment.verify = false;

        ContractDeploymentResult result = solanaAdapter.deployContract(deployment).await().indefinitely();

        assertNotNull(result);
        assertNotNull(result.contractAddress);
        assertTrue(result.success);
        assertNotNull(result.gasUsed);
    }

    @Test
    @DisplayName("Should invoke Solana program")
    void testInvokeProgram() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        ContractFunctionCall call = new ContractFunctionCall();
        call.contractAddress = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        call.functionName = "transfer";
        call.functionArgs = Arrays.asList();
        call.isReadOnly = false;

        ContractCallResult result = solanaAdapter.callContract(call).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.success);
    }

    @Test
    @DisplayName("Should get adapter statistics")
    void testGetAdapterStatistics() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        AdapterStatistics stats = solanaAdapter.getAdapterStatistics(Duration.ofMinutes(10))
            .await().indefinitely();

        assertNotNull(stats);
        assertEquals("mainnet-beta", stats.chainId);
        assertTrue(stats.successRate >= 0 && stats.successRate <= 1.0);
    }

    @Test
    @DisplayName("Should configure retry policy")
    void testConfigureRetryPolicy() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        RetryPolicy policy = new RetryPolicy();
        policy.maxRetries = 3;
        policy.initialDelay = Duration.ofMillis(500); // Solana is faster
        policy.backoffMultiplier = 1.5;
        policy.maxDelay = Duration.ofSeconds(10);
        policy.enableExponentialBackoff = true;

        Boolean configured = solanaAdapter.configureRetryPolicy(policy).await().indefinitely();

        assertTrue(configured);
    }

    @Test
    @DisplayName("Should shutdown gracefully")
    void testShutdown() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        Boolean shutdown = solanaAdapter.shutdown().await().indefinitely();

        assertTrue(shutdown);
    }

    @Test
    @DisplayName("Should have faster confirmation than Ethereum")
    void testFastConfirmation() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        ChainInfo info = solanaAdapter.getChainInfo().await().indefinitely();

        // Solana block time should be much faster than Ethereum (400ms vs 12s)
        assertTrue(info.blockTime < 1000); // Less than 1 second
        assertEquals(400L, info.blockTime);
    }

    @Test
    @DisplayName("Should have cheaper fees than Ethereum")
    void testCheaperFees() {
        solanaAdapter.initialize(testConfig).await().indefinitely();

        ChainTransaction tx = new ChainTransaction();
        tx.transactionType = TransactionType.TRANSFER;

        FeeEstimate estimate = solanaAdapter.estimateTransactionFee(tx).await().indefinitely();

        // Solana fees should be ~$0.00025 vs Ethereum's $5-50
        assertTrue(estimate.totalFee.compareTo(new BigDecimal("0.001")) < 0);
    }
}
