package io.aurigraph.v11.crosschain.ccip;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CCIPMessage - CCIP Message Format
 */
class CCIPMessageTest {

    private static final long ETHEREUM_CHAIN_SELECTOR = 5009297550715157269L;
    private static final long ARBITRUM_CHAIN_SELECTOR = 4949039107694359620L;

    private static final String SENDER = "0x742d35Cc6634C0532925a3b8D3Ac8E7b8fe30A4c";
    private static final String RECEIVER = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";

    @Test
    @DisplayName("Should create arbitrary message via constructor")
    void testArbitraryMessageConstructor() {
        byte[] data = "Hello CCIP".getBytes();

        CCIPMessage message = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            data
        );

        assertNotNull(message.getMessageId());
        assertEquals(ETHEREUM_CHAIN_SELECTOR, message.getSourceChainSelector());
        assertEquals(ARBITRUM_CHAIN_SELECTOR, message.getDestinationChainSelector());
        assertEquals(SENDER, message.getSender());
        assertEquals(RECEIVER, message.getReceiver());
        assertArrayEquals(data, message.getData());
        assertEquals(CCIPMessage.MessageType.ARBITRARY_MESSAGE, message.getMessageType());
        assertEquals(CCIPMessage.ExecutionState.UNTOUCHED, message.getExecutionState());
        assertTrue(message.hasData());
        assertFalse(message.hasTokenTransfer());
    }

    @Test
    @DisplayName("Should create token transfer message via constructor")
    void testTokenTransferConstructor() {
        CCIPMessage.TokenAmount token = new CCIPMessage.TokenAmount(
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            BigInteger.valueOf(1000000),
            6,
            "USDC"
        );

        CCIPMessage message = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            List.of(token)
        );

        assertEquals(CCIPMessage.MessageType.TOKEN_TRANSFER, message.getMessageType());
        assertTrue(message.hasTokenTransfer());
        assertFalse(message.hasData());
        assertEquals(1, message.getTokenAmounts().size());
    }

    @Test
    @DisplayName("Should create programmable token transfer via constructor")
    void testProgrammableTokenTransferConstructor() {
        byte[] data = "Execute".getBytes();
        CCIPMessage.TokenAmount token = new CCIPMessage.TokenAmount(
            "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            BigInteger.valueOf(1000000000000000000L),
            18,
            "WETH"
        );

        CCIPMessage message = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            data,
            List.of(token)
        );

        assertEquals(CCIPMessage.MessageType.PROGRAMMABLE_TOKEN_TRANSFER, message.getMessageType());
        assertTrue(message.hasTokenTransfer());
        assertTrue(message.hasData());
    }

    @Test
    @DisplayName("Should create message using builder")
    void testBuilderPattern() {
        CCIPMessage message = new CCIPMessage.Builder()
            .sourceChain(ETHEREUM_CHAIN_SELECTOR, "Ethereum")
            .destinationChain(ARBITRUM_CHAIN_SELECTOR, "Arbitrum One")
            .sender(SENDER)
            .receiver(RECEIVER)
            .data("Test data".getBytes())
            .gasLimit(300000L)
            .allowOutOfOrder(false)
            .build();

        assertNotNull(message.getMessageId());
        assertEquals("Ethereum", message.getSourceChainName());
        assertEquals("Arbitrum One", message.getDestinationChainName());
        assertEquals(300000L, message.getExtraArgs().getGasLimit());
        assertFalse(message.getExtraArgs().isAllowOutOfOrderExecution());
    }

    @Test
    @DisplayName("Should add tokens via builder")
    void testBuilderWithTokens() {
        CCIPMessage message = new CCIPMessage.Builder()
            .sourceChain(ETHEREUM_CHAIN_SELECTOR, "Ethereum")
            .destinationChain(ARBITRUM_CHAIN_SELECTOR, "Arbitrum One")
            .sender(SENDER)
            .receiver(RECEIVER)
            .addToken("0xToken1", BigInteger.valueOf(1000), 18, "TK1")
            .addToken("0xToken2", BigInteger.valueOf(2000), 18, "TK2")
            .build();

        assertEquals(2, message.getTokenAmounts().size());
        assertEquals(CCIPMessage.MessageType.TOKEN_TRANSFER, message.getMessageType());
    }

    @Test
    @DisplayName("Should validate message correctly")
    void testValidation() {
        CCIPMessage validMessage = new CCIPMessage.Builder()
            .sourceChain(ETHEREUM_CHAIN_SELECTOR, "Ethereum")
            .destinationChain(ARBITRUM_CHAIN_SELECTOR, "Arbitrum One")
            .sender(SENDER)
            .receiver(RECEIVER)
            .data("Valid".getBytes())
            .build();

        assertDoesNotThrow(validMessage::validate);
    }

    @Test
    @DisplayName("Should reject same chain source and destination")
    void testRejectSameChain() {
        assertThrows(IllegalStateException.class, () -> {
            new CCIPMessage.Builder()
                .sourceChain(ETHEREUM_CHAIN_SELECTOR, "Ethereum")
                .destinationChain(ETHEREUM_CHAIN_SELECTOR, "Ethereum")
                .sender(SENDER)
                .receiver(RECEIVER)
                .data("Invalid".getBytes())
                .build();
        });
    }

    @Test
    @DisplayName("Should reject message without data or tokens")
    void testRejectEmptyMessage() {
        assertThrows(IllegalStateException.class, () -> {
            new CCIPMessage.Builder()
                .sourceChain(ETHEREUM_CHAIN_SELECTOR, "Ethereum")
                .destinationChain(ARBITRUM_CHAIN_SELECTOR, "Arbitrum One")
                .sender(SENDER)
                .receiver(RECEIVER)
                .build();
        });
    }

    @Test
    @DisplayName("Should serialize and deserialize message")
    void testSerializationDeserialization() {
        CCIPMessage original = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            "Test serialize".getBytes()
        );

        byte[] serialized = original.serialize();
        CCIPMessage deserialized = CCIPMessage.deserialize(serialized);

        assertEquals(original.getMessageId(), deserialized.getMessageId());
        assertEquals(original.getSourceChainSelector(), deserialized.getSourceChainSelector());
        assertEquals(original.getDestinationChainSelector(), deserialized.getDestinationChainSelector());
        assertEquals(original.getSender(), deserialized.getSender());
        assertEquals(original.getReceiver(), deserialized.getReceiver());
    }

    @Test
    @DisplayName("Should calculate token value in USD")
    void testTokenValueCalculation() {
        CCIPMessage.TokenAmount token1 = new CCIPMessage.TokenAmount(
            "0xToken1",
            BigInteger.valueOf(1000000000000000000L), // 1 token with 18 decimals
            18,
            "TK1"
        );
        CCIPMessage.TokenAmount token2 = new CCIPMessage.TokenAmount(
            "0xToken2",
            BigInteger.valueOf(2000000), // 2 tokens with 6 decimals
            6,
            "TK2"
        );

        CCIPMessage message = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            List.of(token1, token2)
        );

        Map<String, BigDecimal> prices = Map.of(
            "0xToken1", new BigDecimal("100"),
            "0xToken2", new BigDecimal("50")
        );

        BigDecimal totalUSD = message.getTotalTokenValueUSD(prices);

        // 1 * 100 + 2 * 50 = 200
        assertEquals(0, totalUSD.compareTo(new BigDecimal("200")));
    }

    @Test
    @DisplayName("Should format token amount correctly")
    void testTokenAmountFormatting() {
        CCIPMessage.TokenAmount token = new CCIPMessage.TokenAmount(
            "0xToken",
            new BigInteger("1500000000000000000"), // 1.5 tokens
            18,
            "TK"
        );

        BigDecimal formatted = token.getFormattedAmount();
        assertEquals(0, formatted.compareTo(new BigDecimal("1.5")));
    }

    @Test
    @DisplayName("Should encode extra args correctly")
    void testExtraArgsEncoding() {
        CCIPMessage.ExtraArgs args = new CCIPMessage.ExtraArgs(500000L, false);

        byte[] encoded = args.encode();

        assertNotNull(encoded);
        assertTrue(encoded.length > 0);
        // Should start with EVMExtraArgsV1 tag: 0x97a657c9
        assertEquals((byte) 0x97, encoded[0]);
        assertEquals((byte) 0xa6, encoded[1]);
        assertEquals((byte) 0x57, encoded[2]);
        assertEquals((byte) 0xc9, encoded[3]);
    }

    @Test
    @DisplayName("Should track execution states")
    void testExecutionStates() {
        CCIPMessage message = new CCIPMessage();

        assertEquals(CCIPMessage.ExecutionState.UNTOUCHED, message.getExecutionState());

        message.setExecutionState(CCIPMessage.ExecutionState.PENDING);
        assertEquals(CCIPMessage.ExecutionState.PENDING, message.getExecutionState());

        message.setExecutionState(CCIPMessage.ExecutionState.SOURCE_CONFIRMED);
        assertEquals(CCIPMessage.ExecutionState.SOURCE_CONFIRMED, message.getExecutionState());

        message.setExecutionState(CCIPMessage.ExecutionState.IN_FLIGHT);
        assertEquals(CCIPMessage.ExecutionState.IN_FLIGHT, message.getExecutionState());

        message.setExecutionState(CCIPMessage.ExecutionState.SUCCESS);
        assertEquals(CCIPMessage.ExecutionState.SUCCESS, message.getExecutionState());
    }

    @Test
    @DisplayName("Should implement equals and hashCode based on messageId")
    void testEqualsAndHashCode() {
        CCIPMessage message1 = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            "Test".getBytes()
        );

        CCIPMessage message2 = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR,
            ARBITRUM_CHAIN_SELECTOR,
            SENDER,
            RECEIVER,
            "Test".getBytes()
        );

        // Different messageIds should not be equal
        assertNotEquals(message1, message2);
        assertNotEquals(message1.hashCode(), message2.hashCode());

        // Same instance should be equal
        assertEquals(message1, message1);
        assertEquals(message1.hashCode(), message1.hashCode());
    }

    @Test
    @DisplayName("Should generate unique message IDs")
    void testUniqueMessageIds() {
        CCIPMessage message1 = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR, ARBITRUM_CHAIN_SELECTOR,
            SENDER, RECEIVER, "Test1".getBytes()
        );
        CCIPMessage message2 = new CCIPMessage(
            ETHEREUM_CHAIN_SELECTOR, ARBITRUM_CHAIN_SELECTOR,
            SENDER, RECEIVER, "Test2".getBytes()
        );

        assertNotEquals(message1.getMessageId(), message2.getMessageId());
        assertTrue(message1.getMessageId().startsWith("CCIP-"));
        assertTrue(message2.getMessageId().startsWith("CCIP-"));
    }
}
