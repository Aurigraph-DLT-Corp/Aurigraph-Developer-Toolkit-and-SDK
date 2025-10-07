package io.aurigraph.v11.integration;

import io.aurigraph.v11.contracts.models.AssetType;
import io.aurigraph.v11.tokens.TokenManagementService;
import io.aurigraph.v11.tokens.TokenManagementService.*;
import io.aurigraph.v11.tokens.models.Token;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for TokenManagementService
 *
 * Tests token operations including mint, burn, transfer, RWA tokens, and performance.
 * Target: 20 comprehensive integration tests
 *
 * @version Phase 3 Day 5
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TokenManagementServiceIntegrationTest {

    private static final Logger logger = LoggerFactory.getLogger(TokenManagementServiceIntegrationTest.class);

    @Inject
    TokenManagementService tokenService;

    private String testTokenId;
    private static final String TEST_ADDRESS = "0xTestAddress123";
    private static final String TEST_ADDRESS_2 = "0xTestAddress456";

    // ==================== Service Initialization ====================

    @Test
    @Order(1)
    @DisplayName("TIT-01: Should inject TokenManagementService")
    void testServiceInjection() {
        assertThat(tokenService).isNotNull();
        logger.info("✓ Token service properly injected");
    }

    @Test
    @Order(2)
    @DisplayName("TIT-02: Should initialize with statistics")
    void testInitialStatistics() {
        Map<String, Object> stats = tokenService.getStatistics()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
        assertThat(stats).containsKeys("tokensMinted", "tokensBurned", "transfersCompleted");

        logger.info("✓ Token statistics initialized");
    }

    // ==================== Token Minting ====================

    @Test
    @Order(3)
    @DisplayName("TIT-03: Should create and mint token")
    void testMintToken() {
        // First create an RWA token to mint
        RWATokenRequest createRequest = new RWATokenRequest(
            "TestToken",                        // name
            "TT",                               // symbol
            "0xCreator",                        // owner
            new BigDecimal("1000000"),          // totalSupply
            18,                                 // decimals
            AssetType.COMMODITIES,              // assetType
            "COMMODITY-001",                    // assetId
            new BigDecimal("1.00"),             // assetValue
            "USD",                              // assetCurrency
            true,                               // isMintable
            true,                               // isBurnable
            new BigDecimal("10000000"),         // maxSupply
            false                               // kycRequired
        );

        Token token = tokenService.createRWAToken(createRequest)
            .await().atMost(Duration.ofSeconds(5));

        testTokenId = token.getTokenId();

        // Now mint tokens
        MintRequest mintRequest = new MintRequest(
            testTokenId,
            TEST_ADDRESS,
            new BigDecimal("1000")
        );

        MintResult result = tokenService.mintToken(mintRequest)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(result).isNotNull();
        assertThat(result.tokenId()).isEqualTo(testTokenId);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("1000"));
        assertThat(result.recipientBalance()).isGreaterThanOrEqualTo(new BigDecimal("1000"));
        assertThat(result.transactionHash()).isNotNull();

        logger.info("✓ Minted 1000 tokens to {}", TEST_ADDRESS);
    }

    @Test
    @Order(4)
    @DisplayName("TIT-04: Should mint multiple times")
    void testMultipleMints() {
        for (int i = 0; i < 3; i++) {
            MintRequest request = new MintRequest(
                testTokenId,
                TEST_ADDRESS,
                new BigDecimal("100")
            );

            MintResult result = tokenService.mintToken(request)
                .await().atMost(Duration.ofSeconds(5));

            assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("100"));
        }

        // Verify total balance (1000 from TIT-03 + 300 from this test)
        BigDecimal balance = tokenService.getBalance(TEST_ADDRESS, testTokenId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(balance).isGreaterThanOrEqualTo(new BigDecimal("1300"));

        logger.info("✓ Multiple mints successful, balance: {}", balance);
    }

    @Test
    @Order(5)
    @DisplayName("TIT-05: Should update total supply after minting")
    void testSupplyAfterMint() {
        TokenSupply supply = tokenService.getTotalSupply(testTokenId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(supply).isNotNull();
        assertThat(supply.totalSupply()).isGreaterThan(new BigDecimal("1300"));

        logger.info("✓ Total supply: {}", supply.totalSupply());
    }

    // ==================== Token Burning ====================

    @Test
    @Order(6)
    @DisplayName("TIT-06: Should burn tokens")
    void testBurnToken() {
        BurnRequest request = new BurnRequest(
            testTokenId,
            TEST_ADDRESS,
            new BigDecimal("200")
        );

        BurnResult result = tokenService.burnToken(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(result).isNotNull();
        assertThat(result.tokenId()).isEqualTo(testTokenId);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("200"));

        logger.info("✓ Burned 200 tokens from {}", TEST_ADDRESS);
    }

    @Test
    @Order(7)
    @DisplayName("TIT-07: Should reduce balance after burn")
    void testBalanceAfterBurn() {
        BigDecimal balance = tokenService.getBalance(TEST_ADDRESS, testTokenId)
            .await().atMost(Duration.ofSeconds(5));

        // Should be around 1100 (1300 - 200)
        assertThat(balance).isLessThan(new BigDecimal("1300"));
        assertThat(balance).isGreaterThan(new BigDecimal("1000"));

        logger.info("✓ Balance after burn: {}", balance);
    }

    // ==================== Token Transfers ====================

    @Test
    @Order(8)
    @DisplayName("TIT-08: Should transfer tokens")
    void testTransferToken() {
        TransferRequest request = new TransferRequest(
            testTokenId,
            TEST_ADDRESS,
            TEST_ADDRESS_2,
            new BigDecimal("500")
        );

        TransferResult result = tokenService.transferToken(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(result).isNotNull();
        assertThat(result.tokenId()).isEqualTo(testTokenId);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("500"));
        assertThat(result.transactionHash()).isNotNull();

        logger.info("✓ Transferred 500 tokens from {} to {}", TEST_ADDRESS, TEST_ADDRESS_2);
    }

    @Test
    @Order(9)
    @DisplayName("TIT-09: Should update balances after transfer")
    void testBalancesAfterTransfer() {
        BigDecimal balance1 = tokenService.getBalance(TEST_ADDRESS, testTokenId)
            .await().atMost(Duration.ofSeconds(5));

        BigDecimal balance2 = tokenService.getBalance(TEST_ADDRESS_2, testTokenId)
            .await().atMost(Duration.ofSeconds(5));

        // TEST_ADDRESS should have around 600 left (1100 - 500)
        assertThat(balance1).isLessThan(new BigDecimal("1100"));

        // TEST_ADDRESS_2 should have 500
        assertThat(balance2).isGreaterThanOrEqualTo(new BigDecimal("500"));

        logger.info("✓ Balances: {} = {}, {} = {}", TEST_ADDRESS, balance1, TEST_ADDRESS_2, balance2);
    }

    @Test
    @Order(10)
    @DisplayName("TIT-10: Should handle multiple transfers")
    void testMultipleTransfers() {
        for (int i = 0; i < 3; i++) {
            TransferRequest request = new TransferRequest(
                testTokenId,
                TEST_ADDRESS,
                TEST_ADDRESS_2,
                new BigDecimal("10")
            );

            TransferResult result = tokenService.transferToken(request)
                .await().atMost(Duration.ofSeconds(5));

            assertThat(result).isNotNull();
        }

        logger.info("✓ Multiple transfers successful");
    }

    // ==================== Balance Operations ====================

    @Test
    @Order(11)
    @DisplayName("TIT-11: Should get token balance")
    void testGetBalance() {
        BigDecimal balance = tokenService.getBalance(TEST_ADDRESS, testTokenId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(balance).isNotNull();
        assertThat(balance).isGreaterThanOrEqualTo(BigDecimal.ZERO);

        logger.info("✓ Balance for {}: {}", TEST_ADDRESS, balance);
    }

    @Test
    @Order(12)
    @DisplayName("TIT-12: Should return zero for non-holder")
    void testZeroBalanceForNonHolder() {
        BigDecimal balance = tokenService.getBalance("0xNonHolder", testTokenId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);

        logger.info("✓ Zero balance for non-holder");
    }

    // ==================== Token Holders ====================

    @Test
    @Order(13)
    @DisplayName("TIT-13: Should get token holders")
    void testGetTokenHolders() {
        List<TokenHolder> holders = tokenService.getTokenHolders(testTokenId, 10)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(holders).isNotEmpty();
        assertThat(holders).hasSizeGreaterThanOrEqualTo(2); // At least TEST_ADDRESS and TEST_ADDRESS_2

        logger.info("✓ Found {} token holders", holders.size());
    }

    @Test
    @Order(14)
    @DisplayName("TIT-14: Should verify holder balances")
    void testHolderBalances() {
        List<TokenHolder> holders = tokenService.getTokenHolders(testTokenId, 10)
            .await().atMost(Duration.ofSeconds(5));

        for (TokenHolder holder : holders) {
            assertThat(holder.balance()).isGreaterThan(BigDecimal.ZERO);
        }

        logger.info("✓ All holders have positive balances");
    }

    // ==================== RWA Tokens ====================

    @Test
    @Order(15)
    @DisplayName("TIT-15: Should create RWA token")
    void testCreateRWAToken() {
        RWATokenRequest request = new RWATokenRequest(
            "RealEstateToken",                  // name
            "RET",                              // symbol
            "0xPropertyOwner",                  // owner
            new BigDecimal("1000000"),          // totalSupply
            18,                                 // decimals
            AssetType.REAL_ESTATE,              // assetType
            "PROPERTY-001",                     // assetId
            new BigDecimal("500000.00"),        // assetValue
            "USD",                              // assetCurrency
            false,                              // isMintable
            false,                              // isBurnable
            new BigDecimal("1000000"),          // maxSupply
            true                                // kycRequired
        );

        Token token = tokenService.createRWAToken(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(token).isNotNull();
        assertThat(token.getSymbol()).isEqualTo("RET");
        assertThat(token.getIsRWA()).isTrue();

        logger.info("✓ RWA token created: {}", token.getTokenId());
    }

    @Test
    @Order(16)
    @DisplayName("TIT-16: Should tokenize asset")
    void testTokenizeAsset() {
        AssetTokenizationRequest request = new AssetTokenizationRequest(
            "ArtworkToken",                     // assetName
            "ART",                              // assetSymbol
            "0xArtist",                         // owner
            new BigDecimal("1000"),             // totalSupply
            AssetType.ARTWORK,                  // assetType
            "artwork-001",                      // assetId
            new BigDecimal("100000.00"),        // assetValue
            "USD",                              // assetCurrency
            false,                              // isMintable
            false,                              // isBurnable
            new BigDecimal("1000"),             // maxSupply
            false                               // kycRequired
        );

        Token token = tokenService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(token).isNotNull();
        assertThat(token.getSymbol()).isEqualTo("ART");
        assertThat(token.getIsRWA()).isTrue();

        logger.info("✓ Asset tokenized: {}", token.getTokenId());
    }

    // ==================== Token Listing ====================

    @Test
    @Order(17)
    @DisplayName("TIT-17: Should list all tokens")
    void testListTokens() {
        List<Token> tokens = tokenService.listTokens(0, 10)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(tokens).isNotEmpty();
        logger.info("✓ Found {} tokens", tokens.size());
    }

    // ==================== Statistics ====================

    @Test
    @Order(18)
    @DisplayName("TIT-18: Should track token statistics")
    void testTokenStatistics() {
        Map<String, Object> stats = tokenService.getStatistics()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
        assertThat(stats.get("tokensMinted")).asInstanceOf(LONG).isGreaterThan(0L);
        assertThat(stats.get("transfersCompleted")).asInstanceOf(LONG).isGreaterThan(0L);

        logger.info("✓ Statistics: minted={}, burned={}, transferred={}",
            stats.get("tokensMinted"),
            stats.get("tokensBurned"),
            stats.get("transfersCompleted"));
    }

    // ==================== Performance ====================

    @Test
    @Order(19)
    @DisplayName("TIT-19: Should handle concurrent transfers")
    void testConcurrentTransfers() throws InterruptedException {
        // First mint more tokens for concurrent transfers
        MintRequest mintRequest = new MintRequest(
            testTokenId,
            TEST_ADDRESS,
            new BigDecimal("1000")
        );
        tokenService.mintToken(mintRequest).await().atMost(Duration.ofSeconds(5));

        int concurrentOperations = 10;
        ExecutorService executor = Executors.newFixedThreadPool(5);
        CountDownLatch latch = new CountDownLatch(concurrentOperations);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < concurrentOperations; i++) {
            executor.submit(() -> {
                try {
                    TransferRequest request = new TransferRequest(
                        testTokenId,
                        TEST_ADDRESS,
                        TEST_ADDRESS_2,
                        new BigDecimal("10")
                    );

                    TransferResult result = tokenService.transferToken(request)
                        .await().atMost(Duration.ofSeconds(10));

                    if (result != null) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    logger.error("Concurrent transfer failed", e);
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(successCount.get()).isGreaterThan(7); // 70%+ success rate

        logger.info("✓ Concurrent operations: {}/{} successful", successCount.get(), concurrentOperations);
    }

    @Test
    @Order(20)
    @DisplayName("TIT-20: Should measure transfer performance")
    void testTransferPerformance() {
        // Mint tokens for performance test
        MintRequest mintRequest = new MintRequest(
            testTokenId,
            TEST_ADDRESS,
            new BigDecimal("500")
        );
        tokenService.mintToken(mintRequest).await().atMost(Duration.ofSeconds(5));

        long startTime = System.currentTimeMillis();
        int transfers = 10;

        for (int i = 0; i < transfers; i++) {
            TransferRequest request = new TransferRequest(
                testTokenId,
                TEST_ADDRESS,
                TEST_ADDRESS_2,
                new BigDecimal("5")
            );

            tokenService.transferToken(request)
                .await().atMost(Duration.ofSeconds(5));
        }

        long duration = System.currentTimeMillis() - startTime;
        double transfersPerSecond = (transfers * 1000.0) / duration;

        assertThat(transfersPerSecond).isGreaterThan(1.0);

        logger.info("✓ Executed {} transfers in {}ms ({} transfers/sec)",
            transfers, duration, String.format("%.2f", transfersPerSecond));
    }
}
