package io.aurigraph.v11.crosschain.ccip;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CCIPAdapter - Chainlink Cross-Chain Interoperability Protocol
 */
@QuarkusTest
class CCIPAdapterTest {

    @Inject
    CCIPAdapter ccipAdapter;

    private static final long ETHEREUM_CHAIN_SELECTOR = 5009297550715157269L;
    private static final long ARBITRUM_CHAIN_SELECTOR = 4949039107694359620L;
    private static final long OPTIMISM_CHAIN_SELECTOR = 3734403246176062136L;

    private static final String SENDER = "0x742d35Cc6634C0532925a3b8D3Ac8E7b8fe30A4c";
    private static final String RECEIVER = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";

    @BeforeEach
    void setUp() {
        // CCIPAdapter is injected by Quarkus
    }

    @Test
    @DisplayName("Should send arbitrary message between chains")
    void testSendArbitraryMessage() {
        byte[] data = "Hello Cross-Chain".getBytes();

        CCIPMessage message = ccipAdapter.sendData(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            data,
            200000L
        ).await().indefinitely();

        assertNotNull(message);
        assertNotNull(message.getMessageId());
        assertEquals(ETHEREUM_CHAIN_SELECTOR, message.getSourceChainSelector());
        assertEquals(ARBITRUM_CHAIN_SELECTOR, message.getDestinationChainSelector());
        assertEquals(SENDER, message.getSender());
        assertEquals(RECEIVER, message.getReceiver());
        assertEquals(CCIPMessage.MessageType.ARBITRARY_MESSAGE, message.getMessageType());
        assertNotNull(message.getSentAt());
    }

    @Test
    @DisplayName("Should send token transfer message")
    void testSendTokenTransfer() {
        CCIPMessage.TokenAmount token = new CCIPMessage.TokenAmount(
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
            BigInteger.valueOf(1000000000), // 1000 USDC
            6,
            "USDC"
        );

        CCIPMessage message = ccipAdapter.sendTokens(
            ETHEREUM_CHAIN_SELECTOR,
            OPTIMISM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            List.of(token),
            300000L
        ).await().indefinitely();

        assertNotNull(message);
        assertEquals(CCIPMessage.MessageType.TOKEN_TRANSFER, message.getMessageType());
        assertTrue(message.hasTokenTransfer());
        assertFalse(message.hasData());
        assertEquals(1, message.getTokenAmounts().size());
    }

    @Test
    @DisplayName("Should send programmable token transfer")
    void testSendProgrammableTokenTransfer() {
        byte[] data = "Execute swap on destination".getBytes();
        CCIPMessage.TokenAmount token = new CCIPMessage.TokenAmount(
            "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
            BigInteger.valueOf(1000000000000000000L), // 1 ETH
            18,
            "WETH"
        );

        CCIPMessage message = ccipAdapter.sendProgrammableTokenTransfer(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            data,
            List.of(token),
            500000L
        ).await().indefinitely();

        assertNotNull(message);
        assertEquals(CCIPMessage.MessageType.PROGRAMMABLE_TOKEN_TRANSFER, message.getMessageType());
        assertTrue(message.hasTokenTransfer());
        assertTrue(message.hasData());
    }

    @Test
    @DisplayName("Should estimate fee correctly")
    void testEstimateFee() {
        CCIPMessage message = new CCIPMessage.Builder()
            .sourceChain(ETHEREUM_CHAIN_SELECTOR, "Ethereum")
            .destinationChain(ARBITRUM_CHAIN_SELECTOR, "Arbitrum One")
            .sender(SENDER)
            .receiver(RECEIVER)
            .data("Test data".getBytes())
            .gasLimit(200000L)
            .build();

        CCIPAdapter.FeeEstimate estimate = ccipAdapter.estimateFee(message).await().indefinitely();

        assertNotNull(estimate);
        assertTrue(estimate.isValid());
        assertNotNull(estimate.getTotalFee());
        assertTrue(estimate.getTotalFee().compareTo(BigInteger.ZERO) > 0);
        assertNotNull(estimate.getFeeUSD());
    }

    @Test
    @DisplayName("Should check lane support correctly")
    void testLaneSupport() {
        // Ethereum -> Arbitrum should be supported
        assertTrue(ccipAdapter.isLaneSupported(ETHEREUM_CHAIN_SELECTOR, ARBITRUM_CHAIN_SELECTOR));

        // Ethereum -> Optimism should be supported
        assertTrue(ccipAdapter.isLaneSupported(ETHEREUM_CHAIN_SELECTOR, OPTIMISM_CHAIN_SELECTOR));

        // Same chain should not be supported (would throw during message send)
        assertFalse(ccipAdapter.isLaneSupported(ETHEREUM_CHAIN_SELECTOR, ETHEREUM_CHAIN_SELECTOR));
    }

    @Test
    @DisplayName("Should get supported chains")
    void testGetSupportedChains() {
        List<Long> chains = ccipAdapter.getSupportedChains().await().indefinitely();

        assertNotNull(chains);
        assertFalse(chains.isEmpty());
        assertTrue(chains.contains(ETHEREUM_CHAIN_SELECTOR));
        assertTrue(chains.contains(ARBITRUM_CHAIN_SELECTOR));
        assertTrue(chains.contains(OPTIMISM_CHAIN_SELECTOR));
    }

    @Test
    @DisplayName("Should get router address for chain")
    void testGetRouterAddress() {
        String ethRouter = ccipAdapter.getRouterAddress(ETHEREUM_CHAIN_SELECTOR);

        assertNotNull(ethRouter);
        assertTrue(ethRouter.startsWith("0x"));
        assertEquals(42, ethRouter.length()); // 0x + 40 hex chars
    }

    @Test
    @DisplayName("Should get chain name from selector")
    void testGetChainName() {
        assertEquals("Ethereum", ccipAdapter.getChainName(ETHEREUM_CHAIN_SELECTOR));
        assertEquals("Arbitrum One", ccipAdapter.getChainName(ARBITRUM_CHAIN_SELECTOR));
        assertEquals("Optimism", ccipAdapter.getChainName(OPTIMISM_CHAIN_SELECTOR));
    }

    @Test
    @DisplayName("Should track message status")
    void testMessageTracking() {
        byte[] data = "Tracking test".getBytes();

        CCIPMessage sent = ccipAdapter.sendData(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            data,
            200000L
        ).await().indefinitely();

        CCIPMessage retrieved = ccipAdapter.getMessageStatus(sent.getMessageId())
            .await().indefinitely();

        assertNotNull(retrieved);
        assertEquals(sent.getMessageId(), retrieved.getMessageId());
        assertNotNull(retrieved.getExecutionState());
    }

    @Test
    @DisplayName("Should get pending messages")
    void testGetPendingMessages() {
        // Send a message first
        ccipAdapter.sendData(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            "Pending test".getBytes(),
            200000L
        ).await().indefinitely();

        List<CCIPMessage> pending = ccipAdapter.getPendingMessages().await().indefinitely();

        assertNotNull(pending);
        // May or may not have pending messages depending on async processing
    }

    @Test
    @DisplayName("Should get lane status")
    void testGetLaneStatus() {
        CCIPAdapter.LaneStatus status = ccipAdapter.getLaneStatus(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR
        ).await().indefinitely();

        assertNotNull(status);
        assertEquals(ETHEREUM_CHAIN_SELECTOR, status.getSourceChainSelector());
        assertEquals(ARBITRUM_CHAIN_SELECTOR, status.getDestinationChainSelector());
        assertEquals("Ethereum", status.getSourceChainName());
        assertEquals("Arbitrum One", status.getDestinationChainName());
        assertTrue(status.isActive());
    }

    @Test
    @DisplayName("Should get adapter statistics")
    void testGetStatistics() {
        CCIPAdapter.CCIPStatistics stats = ccipAdapter.getStatistics().await().indefinitely();

        assertNotNull(stats);
        assertTrue(stats.supportedChains > 0);
        assertTrue(stats.activeLanes > 0);
        assertTrue(stats.successRate >= 0 && stats.successRate <= 100);
    }

    @Test
    @DisplayName("Should reject invalid message - same source and destination")
    void testRejectSameChainMessage() {
        assertThrows(CCIPAdapter.CCIPException.class, () -> {
            ccipAdapter.sendData(
                ETHEREUM_CHAIN_SELECTOR,
                ETHEREUM_CHAIN_SELECTOR,
                SENDER,
                RECEIVER,
                "Invalid".getBytes(),
                200000L
            ).await().indefinitely();
        });
    }

    @Test
    @DisplayName("Should reject message with unsupported chain")
    void testRejectUnsupportedChain() {
        assertThrows(CCIPAdapter.CCIPException.class, () -> {
            ccipAdapter.sendData(
                999999L, // Invalid chain
                ARBITRUM_CHAIN_SELECTOR,
                SENDER,
                RECEIVER,
                "Invalid".getBytes(),
                200000L
            ).await().indefinitely();
        });
    }
}
