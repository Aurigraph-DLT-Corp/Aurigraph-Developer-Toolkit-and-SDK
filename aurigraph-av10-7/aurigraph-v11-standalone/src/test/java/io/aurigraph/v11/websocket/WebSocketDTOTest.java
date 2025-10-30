package io.aurigraph.v11.websocket;

import io.aurigraph.v11.websocket.dto.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for WebSocket DTO classes
 * Tests message serialization, validation, and sample data
 */
@QuarkusTest
class WebSocketDTOTest {

    @Test
    void testMetricsMessageCreation() {
        MetricsMessage message = new MetricsMessage(
            Instant.now(),
            8510000,
            45.2,
            2048,
            256,
            0.001
        );

        assertNotNull(message);
        assertNotNull(message.timestamp());
        assertEquals(8510000, message.tps());
        assertEquals(45.2, message.cpu(), 0.01);
        assertEquals(2048, message.memory());
        assertEquals(256, message.connections());
        assertEquals(0.001, message.errorRate(), 0.0001);
    }

    @Test
    void testMetricsMessageSample() {
        MetricsMessage sample = MetricsMessage.sample();
        assertNotNull(sample);
        assertNotNull(sample.timestamp());
        assertTrue(sample.tps() > 0);
        assertTrue(sample.cpu() >= 0);
        assertTrue(sample.memory() > 0);
        assertTrue(sample.connections() >= 0);
        assertTrue(sample.errorRate() >= 0);
    }

    @Test
    void testTransactionMessageCreation() {
        TransactionMessage message = new TransactionMessage(
            Instant.now(),
            "0xabcd1234",
            "0xfrom",
            "0xto",
            "1000000000000000000",
            "PENDING",
            21000
        );

        assertNotNull(message);
        assertNotNull(message.timestamp());
        assertEquals("0xabcd1234", message.txHash());
        assertEquals("0xfrom", message.from());
        assertEquals("0xto", message.to());
        assertEquals("1000000000000000000", message.value());
        assertEquals("PENDING", message.status());
        assertEquals(21000, message.gasUsed());
    }

    @Test
    void testTransactionMessageSample() {
        TransactionMessage sample = TransactionMessage.sample();
        assertNotNull(sample);
        assertNotNull(sample.timestamp());
        assertNotNull(sample.txHash());
        assertNotNull(sample.from());
        assertNotNull(sample.to());
        assertNotNull(sample.value());
        assertNotNull(sample.status());
        assertTrue(sample.gasUsed() > 0);
    }

    @Test
    void testValidatorMessageCreation() {
        ValidatorMessage message = new ValidatorMessage(
            Instant.now(),
            "0xvalidator",
            "ACTIVE",
            1000000,
            99.95,
            12345
        );

        assertNotNull(message);
        assertNotNull(message.timestamp());
        assertEquals("0xvalidator", message.validator());
        assertEquals("ACTIVE", message.status());
        assertEquals(1000000, message.votingPower());
        assertEquals(99.95, message.uptime(), 0.01);
        assertEquals(12345, message.lastBlockProposed());
    }

    @Test
    void testValidatorMessageSample() {
        ValidatorMessage sample = ValidatorMessage.sample();
        assertNotNull(sample);
        assertNotNull(sample.timestamp());
        assertNotNull(sample.validator());
        assertNotNull(sample.status());
        assertTrue(sample.votingPower() > 0);
        assertTrue(sample.uptime() >= 0 && sample.uptime() <= 100);
        assertTrue(sample.lastBlockProposed() >= 0);
    }

    @Test
    void testConsensusMessageCreation() {
        ConsensusMessage message = new ConsensusMessage(
            Instant.now(),
            "0xleader",
            145,
            3,
            7,
            "COMMITTED",
            0.98,
            156
        );

        assertNotNull(message);
        assertNotNull(message.timestamp());
        assertEquals("0xleader", message.leader());
        assertEquals(145, message.epoch());
        assertEquals(3, message.round());
        assertEquals(7, message.term());
        assertEquals("COMMITTED", message.state());
        assertEquals(0.98, message.performanceScore(), 0.01);
        assertEquals(156, message.activeValidators());
    }

    @Test
    void testConsensusMessageSample() {
        ConsensusMessage sample = ConsensusMessage.sample();
        assertNotNull(sample);
        assertNotNull(sample.timestamp());
        assertNotNull(sample.leader());
        assertTrue(sample.epoch() >= 0);
        assertTrue(sample.round() >= 0);
        assertTrue(sample.term() >= 0);
        assertNotNull(sample.state());
        assertTrue(sample.performanceScore() >= 0 && sample.performanceScore() <= 1);
        assertTrue(sample.activeValidators() > 0);
    }

    @Test
    void testNetworkMessageCreation() {
        NetworkMessage message = new NetworkMessage(
            Instant.now(),
            "peer-123",
            "192.168.1.100",
            true,
            25,
            "11.4.3"
        );

        assertNotNull(message);
        assertNotNull(message.timestamp());
        assertEquals("peer-123", message.peerId());
        assertEquals("192.168.1.100", message.ip());
        assertTrue(message.connected());
        assertEquals(25, message.latency());
        assertEquals("11.4.3", message.version());
    }

    @Test
    void testNetworkMessageSample() {
        NetworkMessage sample = NetworkMessage.sample();
        assertNotNull(sample);
        assertNotNull(sample.timestamp());
        assertNotNull(sample.peerId());
        assertNotNull(sample.ip());
        assertTrue(sample.latency() >= 0);
        assertNotNull(sample.version());
    }

    @Test
    void testMetricsMessageNullTimestamp() {
        MetricsMessage message = new MetricsMessage(
            null, // Should be set to Instant.now()
            8510000,
            45.2,
            2048,
            256,
            0.001
        );

        assertNotNull(message.timestamp());
    }

    @Test
    void testTransactionMessageNullTimestamp() {
        TransactionMessage message = new TransactionMessage(
            null,
            "0xabcd1234",
            "0xfrom",
            "0xto",
            "1000000000000000000",
            "PENDING",
            21000
        );

        assertNotNull(message.timestamp());
    }

    @Test
    void testValidatorMessageNullTimestamp() {
        ValidatorMessage message = new ValidatorMessage(
            null,
            "0xvalidator",
            "ACTIVE",
            1000000,
            99.95,
            12345
        );

        assertNotNull(message.timestamp());
    }

    @Test
    void testConsensusMessageNullTimestamp() {
        ConsensusMessage message = new ConsensusMessage(
            null,
            "0xleader",
            145,
            3,
            7,
            "COMMITTED",
            0.98,
            156
        );

        assertNotNull(message.timestamp());
    }

    @Test
    void testNetworkMessageNullTimestamp() {
        NetworkMessage message = new NetworkMessage(
            null,
            "peer-123",
            "192.168.1.100",
            true,
            25,
            "11.4.3"
        );

        assertNotNull(message.timestamp());
    }
}
