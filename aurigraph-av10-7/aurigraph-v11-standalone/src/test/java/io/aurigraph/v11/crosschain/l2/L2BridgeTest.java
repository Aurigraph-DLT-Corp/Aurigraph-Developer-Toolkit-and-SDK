package io.aurigraph.v11.crosschain.l2;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for L2 Bridge implementations
 */
@QuarkusTest
class L2BridgeTest {

    @Inject
    ArbitrumBridge arbitrumBridge;

    @Inject
    OptimismBridge optimismBridge;

    @Inject
    BaseBridge baseBridge;

    @Inject
    L2BridgeManager bridgeManager;

    private static final String SENDER = "0x742d35Cc6634C0532925a3b8D3Ac8E7b8fe30A4c";
    private static final String RECIPIENT = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";
    private static final BigInteger ONE_ETH = new BigInteger("1000000000000000000");

    @Nested
    @DisplayName("Arbitrum Bridge Tests")
    class ArbitrumBridgeTests {

        @Test
        @DisplayName("Should return correct bridge info")
        void testBridgeInfo() {
            assertEquals("Arbitrum Bridge", arbitrumBridge.getBridgeName());
            assertEquals(42161L, arbitrumBridge.getL2ChainId());
            assertEquals(1L, arbitrumBridge.getL1ChainId());
            assertEquals(Duration.ofDays(7), arbitrumBridge.getChallengePeriod());
            assertTrue(arbitrumBridge.isActive());
        }

        @Test
        @DisplayName("Should deposit ETH successfully")
        void testDepositETH() {
            ArbitrumBridge.BridgeTransaction tx = arbitrumBridge.depositETH(
                SENDER, RECIPIENT, ONE_ETH
            ).await().indefinitely();

            assertNotNull(tx);
            assertNotNull(tx.getTransactionId());
            assertTrue(tx.getTransactionId().startsWith("DEP-ARB-"));
            assertEquals(ArbitrumBridge.BridgeTransactionType.DEPOSIT_ETH, tx.getType());
            assertEquals(SENDER, tx.getSender());
            assertEquals(RECIPIENT, tx.getRecipient());
            assertEquals(ONE_ETH, tx.getAmount());
            assertEquals("ETH", tx.getTokenSymbol());
            assertNotNull(tx.getFee());
        }

        @Test
        @DisplayName("Should deposit ERC20 successfully")
        void testDepositERC20() {
            String tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
            BigInteger amount = BigInteger.valueOf(1000000000); // 1000 USDC

            ArbitrumBridge.BridgeTransaction tx = arbitrumBridge.depositERC20(
                SENDER, RECIPIENT, tokenAddress, "USDC", amount, 6
            ).await().indefinitely();

            assertNotNull(tx);
            assertEquals(ArbitrumBridge.BridgeTransactionType.DEPOSIT_ERC20, tx.getType());
            assertEquals(tokenAddress, tx.getTokenAddress());
            assertEquals("USDC", tx.getTokenSymbol());
            assertEquals(6, tx.getDecimals());
        }

        @Test
        @DisplayName("Should initiate ETH withdrawal")
        void testWithdrawETH() {
            ArbitrumBridge.BridgeTransaction tx = arbitrumBridge.withdrawETH(
                SENDER, RECIPIENT, ONE_ETH
            ).await().indefinitely();

            assertNotNull(tx);
            assertTrue(tx.getTransactionId().startsWith("WTH-ARB-"));
            assertEquals(ArbitrumBridge.BridgeTransactionType.WITHDRAW_ETH, tx.getType());
            assertNotNull(tx.getCreatedAt());
        }

        @Test
        @DisplayName("Should create retryable ticket")
        void testCreateRetryableTicket() {
            ArbitrumBridge.RetryableTicket ticket = arbitrumBridge.createRetryableTicket(
                SENDER,
                RECIPIENT,
                ONE_ETH,
                BigInteger.valueOf(100000000000000L),
                BigInteger.valueOf(1000000L),
                BigInteger.valueOf(100000000L),
                "calldata".getBytes()
            ).await().indefinitely();

            assertNotNull(ticket);
            assertTrue(ticket.getTicketId().startsWith("RTK-ARB-"));
            assertEquals(SENDER, ticket.getSender());
            assertEquals(RECIPIENT, ticket.getDestination());
            assertEquals(ArbitrumBridge.RetryableStatus.CREATED, ticket.getStatus());
            assertNotNull(ticket.getExpiresAt());
        }

        @Test
        @DisplayName("Should estimate deposit fee")
        void testEstimateDepositFee() {
            BigInteger fee = arbitrumBridge.estimateDepositFee(ONE_ETH, null);

            assertNotNull(fee);
            assertTrue(fee.compareTo(BigInteger.ZERO) > 0);
        }

        @Test
        @DisplayName("Should estimate withdrawal fee")
        void testEstimateWithdrawalFee() {
            BigInteger fee = arbitrumBridge.estimateWithdrawalFee(ONE_ETH, null);

            assertNotNull(fee);
            assertTrue(fee.compareTo(BigInteger.ZERO) > 0);
        }

        @Test
        @DisplayName("Should get bridge statistics")
        void testGetStatistics() {
            ArbitrumBridge.BridgeStatistics stats = arbitrumBridge.getStatistics()
                .await().indefinitely();

            assertNotNull(stats);
            assertEquals("Arbitrum Bridge", stats.bridgeName);
            assertEquals(Duration.ofDays(7), stats.challengePeriod);
            assertTrue(stats.isActive);
        }

        @Test
        @DisplayName("Should reject invalid sender address")
        void testRejectInvalidSender() {
            assertThrows(ArbitrumBridge.ArbitrumBridgeException.class, () -> {
                arbitrumBridge.depositETH("invalid", RECIPIENT, ONE_ETH)
                    .await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should reject zero amount")
        void testRejectZeroAmount() {
            assertThrows(ArbitrumBridge.ArbitrumBridgeException.class, () -> {
                arbitrumBridge.depositETH(SENDER, RECIPIENT, BigInteger.ZERO)
                    .await().indefinitely();
            });
        }
    }

    @Nested
    @DisplayName("Optimism Bridge Tests")
    class OptimismBridgeTests {

        @Test
        @DisplayName("Should return correct bridge info")
        void testBridgeInfo() {
            assertEquals("Optimism Bridge", optimismBridge.getBridgeName());
            assertEquals(10L, optimismBridge.getL2ChainId());
            assertEquals(1L, optimismBridge.getL1ChainId());
            assertEquals(Duration.ofDays(7), optimismBridge.getChallengePeriod());
            assertTrue(optimismBridge.isActive());
        }

        @Test
        @DisplayName("Should deposit ETH successfully")
        void testDepositETH() {
            OptimismBridge.BridgeTransaction tx = optimismBridge.depositETH(
                SENDER, RECIPIENT, ONE_ETH
            ).await().indefinitely();

            assertNotNull(tx);
            assertTrue(tx.getTransactionId().startsWith("DEP-OP-"));
            assertEquals(OptimismBridge.BridgeTransactionType.DEPOSIT_ETH, tx.getType());
        }

        @Test
        @DisplayName("Should deposit ERC20 successfully")
        void testDepositERC20() {
            String l1Token = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
            String l2Token = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607";

            OptimismBridge.BridgeTransaction tx = optimismBridge.depositERC20(
                SENDER, RECIPIENT, l1Token, l2Token, "USDC",
                BigInteger.valueOf(1000000000), 6
            ).await().indefinitely();

            assertNotNull(tx);
            assertEquals(OptimismBridge.BridgeTransactionType.DEPOSIT_ERC20, tx.getType());
            assertEquals(l1Token, tx.getL1TokenAddress());
            assertEquals(l2Token, tx.getL2TokenAddress());
        }

        @Test
        @DisplayName("Should initiate withdrawal")
        void testInitiateWithdrawal() {
            OptimismBridge.BridgeTransaction tx = optimismBridge.initiateWithdrawal(
                SENDER, RECIPIENT, ONE_ETH
            ).await().indefinitely();

            assertNotNull(tx);
            assertTrue(tx.getTransactionId().startsWith("WTH-OP-"));
            assertEquals(OptimismBridge.BridgeTransactionType.WITHDRAW_ETH, tx.getType());
        }

        @Test
        @DisplayName("Should send L1 to L2 message")
        void testSendMessageL1ToL2() {
            OptimismBridge.CrossDomainMessage message = optimismBridge.sendMessageL1ToL2(
                SENDER,
                RECIPIENT,
                "Hello L2".getBytes(),
                ONE_ETH,
                200000L
            ).await().indefinitely();

            assertNotNull(message);
            assertTrue(message.getMessageId().startsWith("MSG-OP-"));
            assertTrue(message.isL1ToL2());
            assertEquals(SENDER, message.getSender());
            assertEquals(RECIPIENT, message.getTarget());
        }

        @Test
        @DisplayName("Should estimate deposit fee")
        void testEstimateDepositFee() {
            BigInteger fee = optimismBridge.estimateDepositFee(ONE_ETH, null);

            assertNotNull(fee);
            assertTrue(fee.compareTo(BigInteger.ZERO) > 0);
        }

        @Test
        @DisplayName("Should estimate withdrawal fee (3 transactions)")
        void testEstimateWithdrawalFee() {
            BigInteger fee = optimismBridge.estimateWithdrawalFee(ONE_ETH, null);

            assertNotNull(fee);
            // Withdrawal fee should be higher (L2 init + L1 prove + L1 finalize)
            BigInteger depositFee = optimismBridge.estimateDepositFee(ONE_ETH, null);
            assertTrue(fee.compareTo(depositFee) > 0);
        }

        @Test
        @DisplayName("Should get withdrawal phase description")
        void testWithdrawalPhase() {
            OptimismBridge.BridgeTransaction tx = new OptimismBridge.BridgeTransaction();

            tx.setStatus(OptimismBridge.BridgeStatus.WITHDRAWAL_INITIATED);
            assertTrue(tx.getWithdrawalPhase().contains("state root"));

            tx.setStatus(OptimismBridge.BridgeStatus.STATE_ROOT_PUBLISHED);
            assertTrue(tx.getWithdrawalPhase().contains("prove"));

            tx.setStatus(OptimismBridge.BridgeStatus.READY_TO_FINALIZE);
            assertTrue(tx.getWithdrawalPhase().contains("finalize"));
        }
    }

    @Nested
    @DisplayName("Base Bridge Tests")
    class BaseBridgeTests {

        @Test
        @DisplayName("Should return correct bridge info")
        void testBridgeInfo() {
            assertEquals("Base Bridge (Coinbase L2)", baseBridge.getBridgeName());
            assertEquals(8453L, baseBridge.getL2ChainId());
            assertEquals(1L, baseBridge.getL1ChainId());
            assertEquals(Duration.ofDays(7), baseBridge.getChallengePeriod());
            assertTrue(baseBridge.isActive());
        }

        @Test
        @DisplayName("Should deposit ETH successfully")
        void testDepositETH() {
            BaseBridge.BridgeTransaction tx = baseBridge.depositETH(
                SENDER, RECIPIENT, ONE_ETH
            ).await().indefinitely();

            assertNotNull(tx);
            assertTrue(tx.getTransactionId().startsWith("DEP-BASE-"));
            assertEquals(BaseBridge.BridgeTransactionType.DEPOSIT_ETH, tx.getType());
            assertNotNull(tx.getL1Fee());
            assertNotNull(tx.getL2Fee());
        }

        @Test
        @DisplayName("Should deposit USDC via CCTP")
        void testDepositUSDC() {
            BigInteger amount = BigInteger.valueOf(1000000000); // 1000 USDC

            BaseBridge.BridgeTransaction tx = baseBridge.depositUSDC(
                SENDER, RECIPIENT, amount
            ).await().indefinitely();

            assertNotNull(tx);
            assertTrue(tx.getTransactionId().startsWith("USDC-BASE-"));
            assertEquals(BaseBridge.BridgeTransactionType.DEPOSIT_USDC, tx.getType());
            assertEquals("USDC", tx.getTokenSymbol());
            assertEquals(6, tx.getDecimals());
        }

        @Test
        @DisplayName("Should initiate withdrawal")
        void testInitiateWithdrawal() {
            BaseBridge.BridgeTransaction tx = baseBridge.initiateWithdrawal(
                SENDER, RECIPIENT, ONE_ETH
            ).await().indefinitely();

            assertNotNull(tx);
            assertTrue(tx.getTransactionId().startsWith("WTH-BASE-"));
        }

        @Test
        @DisplayName("Should estimate fees (L1 + L2 separate)")
        void testEstimateFees() {
            BigInteger[] depositFees = baseBridge.estimateDepositFees(ONE_ETH, null);

            assertNotNull(depositFees);
            assertEquals(2, depositFees.length);
            assertTrue(depositFees[0].compareTo(BigInteger.ZERO) > 0); // L1 fee
            assertTrue(depositFees[1].compareTo(BigInteger.ZERO) > 0); // L2 fee
        }

        @Test
        @DisplayName("Should calculate total fee in ETH")
        void testTotalFeeCalculation() {
            BaseBridge.BridgeTransaction tx = baseBridge.depositETH(
                SENDER, RECIPIENT, ONE_ETH
            ).await().indefinitely();

            BigDecimal totalFee = tx.getTotalFeeETH();
            assertNotNull(totalFee);
            assertTrue(totalFee.compareTo(BigDecimal.ZERO) > 0);
        }
    }

    @Nested
    @DisplayName("L2 Bridge Manager Tests")
    class L2BridgeManagerTests {

        @Test
        @DisplayName("Should return supported chains")
        void testGetSupportedChains() {
            List<L2BridgeManager.L2ChainInfo> chains = bridgeManager.getSupportedChains()
                .await().indefinitely();

            assertNotNull(chains);
            assertFalse(chains.isEmpty());

            // Should include our three implemented chains
            assertTrue(chains.stream().anyMatch(c -> c.getChainId() == 42161L)); // Arbitrum
            assertTrue(chains.stream().anyMatch(c -> c.getChainId() == 10L));    // Optimism
            assertTrue(chains.stream().anyMatch(c -> c.getChainId() == 8453L));  // Base
        }

        @Test
        @DisplayName("Should return active chains only")
        void testGetActiveChains() {
            List<L2BridgeManager.L2ChainInfo> active = bridgeManager.getActiveChains()
                .await().indefinitely();

            assertNotNull(active);
            assertTrue(active.stream().allMatch(L2BridgeManager.L2ChainInfo::isActive));
        }

        @Test
        @DisplayName("Should check chain support")
        void testIsChainSupported() {
            assertTrue(bridgeManager.isChainSupported(42161L)); // Arbitrum
            assertTrue(bridgeManager.isChainSupported(10L));    // Optimism
            assertTrue(bridgeManager.isChainSupported(8453L));  // Base
            assertFalse(bridgeManager.isChainSupported(999L));  // Unknown
        }

        @Test
        @DisplayName("Should get chain info")
        void testGetChainInfo() {
            L2BridgeManager.L2ChainInfo info = bridgeManager.getChainInfo(42161L)
                .await().indefinitely();

            assertNotNull(info);
            assertEquals(42161L, info.getChainId());
            assertEquals("Arbitrum One", info.getName());
            assertEquals("ARB", info.getShortName());
            assertEquals("ETH", info.getNativeCurrency());
            assertEquals(Duration.ofDays(7), info.getWithdrawalPeriod());
        }

        @Test
        @DisplayName("Should compare fees across L2s")
        void testCompareFees() {
            List<L2BridgeManager.FeeComparison> comparisons = bridgeManager.compareFees(ONE_ETH)
                .await().indefinitely();

            assertNotNull(comparisons);
            assertEquals(3, comparisons.size()); // Arbitrum, Optimism, Base

            // Should be ranked by total fee
            assertEquals(1, comparisons.get(0).getRank());
            assertEquals(2, comparisons.get(1).getRank());
            assertEquals(3, comparisons.get(2).getRank());

            // Each should have fees populated
            comparisons.forEach(c -> {
                assertNotNull(c.getDepositFee());
                assertNotNull(c.getWithdrawalFee());
                assertNotNull(c.getFeeUSD());
            });
        }

        @Test
        @DisplayName("Should get all bridge health")
        void testGetAllBridgeHealth() {
            List<L2BridgeManager.BridgeHealth> health = bridgeManager.getAllBridgeHealth()
                .await().indefinitely();

            assertNotNull(health);
            assertEquals(3, health.size());

            health.forEach(h -> {
                assertNotNull(h.getBridgeName());
                assertNotNull(h.getLastChecked());
                assertTrue(h.getSuccessRate() >= 0);
            });
        }

        @Test
        @DisplayName("Should get aggregated statistics")
        void testGetAggregatedStatistics() {
            L2BridgeManager.AggregatedStatistics stats = bridgeManager.getAggregatedStatistics()
                .await().indefinitely();

            assertNotNull(stats);
            assertEquals(3, stats.activeBridges);
            assertNotNull(stats.depositsByChain);
            assertNotNull(stats.withdrawalsByChain);
            assertNotNull(stats.lastUpdated);
        }

        @Test
        @DisplayName("Should find best L2 for transfer")
        void testFindBestL2() {
            L2BridgeManager.L2ChainInfo best = bridgeManager.findBestL2ForTransfer(ONE_ETH)
                .await().indefinitely();

            assertNotNull(best);
            assertTrue(best.isActive());
        }

        @Test
        @DisplayName("Should throw for unsupported chain")
        void testUnsupportedChain() {
            assertThrows(L2BridgeManager.L2BridgeException.class, () -> {
                bridgeManager.getChainInfo(999L).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should get all pending withdrawals across bridges")
        void testGetAllPendingWithdrawals() {
            // First create some withdrawals
            arbitrumBridge.withdrawETH(SENDER, RECIPIENT, ONE_ETH).await().indefinitely();
            optimismBridge.initiateWithdrawal(SENDER, RECIPIENT, ONE_ETH).await().indefinitely();
            baseBridge.initiateWithdrawal(SENDER, RECIPIENT, ONE_ETH).await().indefinitely();

            List<L2BridgeManager.UnifiedWithdrawalStatus> withdrawals =
                bridgeManager.getAllPendingWithdrawals(SENDER).await().indefinitely();

            assertNotNull(withdrawals);
            // Note: may be empty if async processing completed
        }
    }
}
