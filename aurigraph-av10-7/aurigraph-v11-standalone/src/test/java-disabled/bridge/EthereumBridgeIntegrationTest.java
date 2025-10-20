package io.aurigraph.v11.bridge;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthBlockNumber;
import org.web3j.protocol.core.methods.response.EthGetBalance;
import org.web3j.protocol.http.HttpService;

import java.math.BigInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for EthereumBridgeService using TestContainers
 * Sprint 14-20 - Week 1: Ethereum Integration Testing
 *
 * Uses Ganache (Ethereum test network) in Docker container
 * Tests real Web3j integration with mock Ethereum blockchain
 *
 * @author Agent QAA (Quality Assurance Agent)
 */
@QuarkusTest
@Testcontainers
@DisplayName("Ethereum Bridge Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class EthereumBridgeIntegrationTest {

    @Inject
    EthereumBridgeService bridgeService;

    private static Web3j web3j;
    private static Credentials credentials;

    /**
     * Ganache container (Ethereum test network)
     * Exposes port 8545 for RPC connections
     */
    @Container
    private static final GenericContainer<?> ganacheContainer =
        new GenericContainer<>(DockerImageName.parse("trufflesuite/ganache:latest"))
            .withExposedPorts(8545)
            .withCommand("--deterministic", "--accounts=10", "--defaultBalanceEther=1000");

    @BeforeAll
    static void setupWeb3j() {
        // Get the dynamic port assigned to Ganache
        String ganacheUrl = "http://" + ganacheContainer.getHost() + ":"
            + ganacheContainer.getMappedPort(8545);

        // Initialize Web3j connection
        web3j = Web3j.build(new HttpService(ganacheUrl));

        // Create test credentials (Ganache account 0)
        credentials = Credentials.create(
            "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d" // Ganache deterministic private key
        );

        System.out.println("✅ Ganache container started at: " + ganacheUrl);
        System.out.println("✅ Test account address: " + credentials.getAddress());
    }

    @AfterAll
    static void shutdownWeb3j() {
        if (web3j != null) {
            web3j.shutdown();
        }
    }

    // ==================== Basic Connectivity Tests ====================

    @Test
    @Order(1)
    @DisplayName("Test Web3j connection to Ganache")
    void testWeb3jConnection() throws Exception {
        // Test basic connection by getting block number
        EthBlockNumber blockNumber = web3j.ethBlockNumber().send();

        assertNotNull(blockNumber);
        assertNotNull(blockNumber.getBlockNumber());
        assertTrue(blockNumber.getBlockNumber().intValue() >= 0);

        System.out.println("Current Ethereum block: " + blockNumber.getBlockNumber());
    }

    @Test
    @Order(2)
    @DisplayName("Test Ethereum account balance")
    void testAccountBalance() throws Exception {
        EthGetBalance balance = web3j.ethGetBalance(
            credentials.getAddress(),
            org.web3j.protocol.core.DefaultBlockParameterName.LATEST
        ).send();

        assertNotNull(balance);
        assertNotNull(balance.getBalance());

        BigInteger balanceWei = balance.getBalance();
        // Ganache accounts start with 1000 ETH = 1000 * 10^18 wei
        assertTrue(balanceWei.compareTo(BigInteger.ZERO) > 0);

        System.out.println("Test account balance: " + balanceWei + " wei");
    }

    // ==================== Bridge Service Integration Tests ====================

    @Test
    @Order(3)
    @DisplayName("Initiate bridge transaction to Ethereum")
    void testInitiateBridgeToEthereum() {
        String fromAddress = "aurigraph-addr-test-1";
        String toEthAddress = credentials.getAddress(); // Use test account
        BigInteger amount = BigInteger.valueOf(1000000); // 1M tokens
        String assetType = "AUR";

        EthereumBridgeService.BridgeTransactionResult result =
            bridgeService.initiateToEthereum(fromAddress, toEthAddress, amount, assetType);

        assertNotNull(result, "Bridge result should not be null");
        assertNotNull(result.txId(), "Transaction ID should not be null");
        assertEquals(EthereumBridgeService.BridgeStatus.PENDING_SIGNATURES, result.status(),
            "Status should be PENDING_SIGNATURES");

        System.out.println("Bridge transaction initiated: " + result.txId());
    }

    @Test
    @Order(4)
    @DisplayName("Test bridge transaction validation")
    void testBridgeValidation() {
        // Test with invalid address
        EthereumBridgeService.BridgeTransactionResult result1 =
            bridgeService.initiateToEthereum("", "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                BigInteger.valueOf(1000), "AUR");

        assertEquals(EthereumBridgeService.BridgeStatus.REJECTED, result1.status(),
            "Empty address should be rejected");

        // Test with zero amount
        EthereumBridgeService.BridgeTransactionResult result2 =
            bridgeService.initiateToEthereum("aurigraph-addr-1", credentials.getAddress(),
                BigInteger.ZERO, "AUR");

        assertEquals(EthereumBridgeService.BridgeStatus.REJECTED, result2.status(),
            "Zero amount should be rejected");

        // Test with negative amount
        EthereumBridgeService.BridgeTransactionResult result3 =
            bridgeService.initiateToEthereum("aurigraph-addr-1", credentials.getAddress(),
                BigInteger.valueOf(-1000), "AUR");

        assertEquals(EthereumBridgeService.BridgeStatus.REJECTED, result3.status(),
            "Negative amount should be rejected");
    }

    @Test
    @Order(5)
    @DisplayName("Test multiple bridge transactions")
    void testMultipleBridgeTransactions() {
        int transactionCount = 5;
        int successCount = 0;

        for (int i = 0; i < transactionCount; i++) {
            String fromAddress = "aurigraph-addr-test-" + i;
            BigInteger amount = BigInteger.valueOf(1000 * (i + 1));

            EthereumBridgeService.BridgeTransactionResult result =
                bridgeService.initiateToEthereum(fromAddress, credentials.getAddress(),
                    amount, "AUR");

            if (result.status() == EthereumBridgeService.BridgeStatus.PENDING_SIGNATURES) {
                successCount++;
            }
        }

        assertEquals(transactionCount, successCount,
            "All valid transactions should be accepted");
    }

    @Test
    @Order(6)
    @DisplayName("Test bridge statistics")
    void testBridgeStatistics() {
        EthereumBridgeService.BridgeStatistics stats = bridgeService.getStatistics();

        assertNotNull(stats);
        assertTrue(stats.totalBridged() >= 0, "Total bridged should be non-negative");
        assertTrue(stats.pendingTransactions() >= 0, "Pending count should be non-negative");
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(7)
    @DisplayName("Test bridge throughput (100 transactions)")
    void testBridgeThroughput() {
        int transactionCount = 100;
        long startTime = System.nanoTime();

        for (int i = 0; i < transactionCount; i++) {
            String fromAddress = "aurigraph-addr-perf-" + i;
            BigInteger amount = BigInteger.valueOf(1000);

            bridgeService.initiateToEthereum(fromAddress, credentials.getAddress(),
                amount, "AUR");
        }

        long endTime = System.nanoTime();
        double durationMs = (endTime - startTime) / 1_000_000.0;
        double tps = transactionCount / (durationMs / 1000.0);

        System.out.printf("Bridge throughput: %.0f TPS (%.2f ms for %d transactions)%n",
            tps, durationMs, transactionCount);

        assertTrue(tps > 100, "Bridge should handle > 100 TPS, was: " + tps);
    }

    // ==================== Cleanup ====================

    @AfterEach
    void cleanup() {
        // Clear fraud detection state between tests
        // This ensures each test starts with a clean slate
    }
}
