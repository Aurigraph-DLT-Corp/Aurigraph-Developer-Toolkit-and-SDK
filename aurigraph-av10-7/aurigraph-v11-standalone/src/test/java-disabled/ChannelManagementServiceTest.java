package io.aurigraph.v11.unit;

import io.aurigraph.v11.channels.ChannelManagementService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for ChannelManagementService
 *
 * Simplified integration-style tests that verify service functionality
 * without complex mocking.
 *
 * @version 3.10.1 (Phase 4 Day 3-4 - Fixed)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChannelManagementServiceTest {

    @Inject
    ChannelManagementService channelService;

    // ==================== SERVICE INJECTION ====================

    @Test
    @Order(1)
    @DisplayName("UT-CMS-01: Should inject ChannelManagementService")
    void testServiceInjection() {
        assertThat(channelService).isNotNull();
    }

    // ==================== STATISTICS ====================

    @Test
    @Order(2)
    @DisplayName("UT-CMS-02: Should get service statistics")
    void testGetStatistics() {
        assertThatNoException().isThrownBy(() -> {
            Map<String, Object> stats = channelService.getStatistics()
                    .await().atMost(Duration.ofSeconds(5));

            assertThat(stats).isNotNull();
            assertThat(stats).containsKeys("channelsCreated", "messagesSent",
                    "membersAdded", "channelsClosed", "channelStatistics", "timestamp");
        });
    }

    // ==================== CHANNEL LIST OPERATIONS ====================

    @Test
    @Order(3)
    @DisplayName("UT-CMS-03: Should list channels with pagination")
    void testListChannels() {
        assertThatNoException().isThrownBy(() -> {
            var channels = channelService.listChannels(0, 10)
                    .await().atMost(Duration.ofSeconds(5));

            assertThat(channels).isNotNull();
        });
    }

    @Test
    @Order(4)
    @DisplayName("UT-CMS-04: Should list public channels")
    void testListPublicChannels() {
        assertThatNoException().isThrownBy(() -> {
            var channels = channelService.listPublicChannels()
                    .await().atMost(Duration.ofSeconds(5));

            assertThat(channels).isNotNull();
        });
    }

    // ==================== VERIFICATION ====================

    @Test
    @Order(5)
    @DisplayName("UT-CMS-05: Should verify service is operational")
    void testServiceOperational() {
        assertThat(channelService).isNotNull();

        // Verify we can call statistics without errors
        assertThatNoException().isThrownBy(() -> {
            channelService.getStatistics()
                    .await().atMost(Duration.ofSeconds(5));
        });
    }
}
