package io.aurigraph.v11.security;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Bridge Encryption Service
 * Tests cross-chain message encryption with 11 blockchain adapters
 */
@QuarkusTest
@DisplayName("Bridge Encryption Tests")
class BridgeEncryptionTest {

    @Inject
    BridgeEncryptionService bridgeEncryptionService;

    private static final String ETHEREUM = "ethereum";
    private static final String BITCOIN = "bitcoin";
    private static final String SOLANA = "solana";

    @BeforeEach
    void setUp() {
        assertNotNull(bridgeEncryptionService);
    }

    @Test
    @DisplayName("Should encrypt bridge message successfully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptBridgeMessage() {
        String messagePayload = "cross-chain-tx-0x123456";
        String metadata = "priority:high,fee:100gwei";

        String encrypted = bridgeEncryptionService.encryptBridgeMessage(
            ETHEREUM,
            SOLANA,
            messagePayload,
            metadata
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).isNotEqualTo(messagePayload);
    }

    @Test
    @DisplayName("Should decrypt bridge message successfully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testDecryptBridgeMessage() {
        String messagePayload = "cross-chain-transfer-amount:500";
        String metadata = "destination:solana-testnet";

        String encrypted = bridgeEncryptionService.encryptBridgeMessage(
            ETHEREUM,
            SOLANA,
            messagePayload,
            metadata
        ).await().atMost(java.time.Duration.ofSeconds(5));

        String decrypted = bridgeEncryptionService.decryptBridgeMessage(
            encrypted,
            ETHEREUM
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(messagePayload);
    }

    @Test
    @DisplayName("Should support all 11 blockchain adapters")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testAllBlockchainAdapters() {
        String[] blockchains = {
            "ethereum", "bitcoin", "solana", "polygon", "avalanche",
            "arbitrum", "optimism", "fantom", "bsc", "harmony", "ton"
        };

        for (String sourceChain : blockchains) {
            for (String destChain : blockchains) {
                if (!sourceChain.equals(destChain)) {
                    String message = "bridge-msg-" + sourceChain + "-to-" + destChain;
                    String encrypted = bridgeEncryptionService.encryptBridgeMessage(
                        sourceChain,
                        destChain,
                        message,
                        ""
                    ).await().atMost(java.time.Duration.ofSeconds(5));

                    String decrypted = bridgeEncryptionService.decryptBridgeMessage(
                        encrypted,
                        sourceChain
                    ).await().atMost(java.time.Duration.ofSeconds(5));

                    assertThat(decrypted).isEqualTo(message);
                }
            }
        }
    }

    @Test
    @DisplayName("Should encrypt batch of bridge messages")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testEncryptBridgeBatch() {
        List<String> messages = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            messages.add("bridge-msg-" + i + "-0x" + Integer.toHexString(i));
        }

        List<String> encrypted = bridgeEncryptionService.encryptBridgeBatch(
            messages,
            SOLANA
        ).await().atMost(java.time.Duration.ofSeconds(10));

        assertThat(encrypted).hasSize(20);
        assertThat(encrypted).allMatch(e -> e != null && !e.isEmpty());
    }

    @Test
    @DisplayName("Should validate bridge message integrity")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testValidateBridgeMessageIntegrity() {
        String messagePayload = "integrity-test-message";
        String metadata = "version:1";

        String encrypted = bridgeEncryptionService.encryptBridgeMessage(
            ETHEREUM,
            BITCOIN,
            messagePayload,
            metadata
        ).await().atMost(java.time.Duration.ofSeconds(5));

        Boolean isValid = bridgeEncryptionService.validateBridgeMessageIntegrity(
            encrypted,
            "expected-signature"
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should get bridge encryption service status")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testGetBridgeEncryptionStatus() {
        BridgeEncryptionService.BridgeEncryptionStatus status =
            bridgeEncryptionService.getStatus()
                .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(status).isNotNull();
        assertThat(status.serviceName).isEqualTo("BridgeEncryption");
        assertThat(status.operational).isTrue();
        assertThat(status.lastKeyRotation).isGreaterThan(0);
        assertThat(status.timestamp).isGreaterThan(0);
    }

    @Test
    @DisplayName("Should handle long-distance bridge routes")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testLongDistanceBridgeRoutes() {
        // Ethereum -> Bitcoin -> Solana multi-hop
        String hop1Message = "hop1-ethereum-to-bitcoin";
        String encrypted1 = bridgeEncryptionService.encryptBridgeMessage(
            ETHEREUM,
            BITCOIN,
            hop1Message,
            "hop:1"
        ).await().atMost(java.time.Duration.ofSeconds(5));

        String hop2Message = "hop2-bitcoin-to-solana";
        String encrypted2 = bridgeEncryptionService.encryptBridgeMessage(
            BITCOIN,
            SOLANA,
            hop2Message,
            "hop:2"
        ).await().atMost(java.time.Duration.ofSeconds(5));

        String decrypted1 = bridgeEncryptionService.decryptBridgeMessage(
            encrypted1,
            ETHEREUM
        ).await().atMost(java.time.Duration.ofSeconds(5));

        String decrypted2 = bridgeEncryptionService.decryptBridgeMessage(
            encrypted2,
            BITCOIN
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted1).isEqualTo(hop1Message);
        assertThat(decrypted2).isEqualTo(hop2Message);
    }

    @Test
    @DisplayName("Should preserve metadata during encryption")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testMetadataPreservation() {
        String message = "metadata-test-message";
        String metadata = "sender:0x1234567890,receiver:0xABCDEF,amount:1000";

        String encrypted = bridgeEncryptionService.encryptBridgeMessage(
            ETHEREUM,
            POLYGON,
            message,
            metadata
        ).await().atMost(java.time.Duration.ofSeconds(5));

        String decrypted = bridgeEncryptionService.decryptBridgeMessage(
            encrypted,
            ETHEREUM
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(message);
    }

    @Test
    @DisplayName("Should handle concurrent bridge messages")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testConcurrentBridgeMessages() {
        List<java.util.concurrent.CompletableFuture<String>> futures = new ArrayList<>();

        for (int i = 0; i < 50; i++) {
            int finalI = i;
            java.util.concurrent.CompletableFuture<String> future =
                bridgeEncryptionService.encryptBridgeMessage(
                    ETHEREUM,
                    SOLANA,
                    "concurrent-msg-" + i,
                    "seq:" + i
                ).toCompletableFuture();
            futures.add(future);
        }

        java.util.concurrent.CompletableFuture.allOf(
            futures.toArray(new java.util.concurrent.CompletableFuture[0])
        ).join();

        assertThat(futures).allMatch(java.util.concurrent.CompletableFuture::isDone);
    }

    @Test
    @DisplayName("Should handle special characters in messages")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testSpecialCharacterEncryption() {
        String specialMessage = "msg-with-emoji-🔒-and-unicode-中文-and-symbols-@#$%^&*()";

        String encrypted = bridgeEncryptionService.encryptBridgeMessage(
            ETHEREUM,
            SOLANA,
            specialMessage,
            ""
        ).await().atMost(java.time.Duration.ofSeconds(5));

        String decrypted = bridgeEncryptionService.decryptBridgeMessage(
            encrypted,
            ETHEREUM
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(specialMessage);
    }

    private static final String POLYGON = "polygon";
}
