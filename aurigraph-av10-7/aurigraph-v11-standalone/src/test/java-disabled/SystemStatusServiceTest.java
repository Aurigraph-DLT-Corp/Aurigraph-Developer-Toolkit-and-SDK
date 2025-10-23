package io.aurigraph.v11.unit;

import io.aurigraph.v11.system.SystemStatusService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for SystemStatusService
 *
 * Tests system status and health monitoring functionality.
 *
 * @version 3.10.0 (Phase 4 Day 3-4)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SystemStatusServiceTest {

    @Inject
    SystemStatusService systemService;

    @Test
    @Order(1)
    @DisplayName("UT-SSS-01: Should inject SystemStatusService")
    void testServiceInjection() {
        assertThat(systemService).isNotNull();
    }

    @Test
    @Order(2)
    @DisplayName("UT-SSS-02: Should collect system status")
    void testCollectSystemStatus() {
        assertThatNoException().isThrownBy(() -> {
            var status = systemService.collectStatus()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(status).isNotNull();
        });
    }

    @Test
    @Order(3)
    @DisplayName("UT-SSS-03: Should get current status")
    void testGetCurrentStatus() {
        assertThatNoException().isThrownBy(() -> {
            var status = systemService.getCurrentStatus()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(status).isNotNull();
        });
    }

    @Test
    @Order(4)
    @DisplayName("UT-SSS-04: Should perform health check")
    void testPerformHealthCheck() {
        assertThatNoException().isThrownBy(() -> {
            var health = systemService.performHealthCheck()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(health).isNotNull();
        });
    }

    @Test
    @Order(5)
    @DisplayName("UT-SSS-05: Should get health statistics")
    void testGetHealthStatistics() {
        Map<String, Object> stats = systemService.getHealthStatistics()
                .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
    }

    @Test
    @Order(6)
    @DisplayName("UT-SSS-06: Should get service statistics")
    void testGetServiceStatistics() {
        Map<String, Object> stats = systemService.getServiceStatistics()
                .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
    }

    @Test
    @Order(7)
    @DisplayName("UT-SSS-07: Should get healthy nodes")
    void testGetHealthyNodes() {
        assertThatNoException().isThrownBy(() -> {
            var nodes = systemService.getHealthyNodes()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(nodes).isNotNull();
        });
    }

    @Test
    @Order(8)
    @DisplayName("UT-SSS-08: Should get unhealthy nodes")
    void testGetUnhealthyNodes() {
        assertThatNoException().isThrownBy(() -> {
            var nodes = systemService.getUnhealthyNodes()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(nodes).isNotNull();
        });
    }

    @Test
    @Order(9)
    @DisplayName("UT-SSS-09: Should get top performers")
    void testGetTopPerformers() {
        assertThatNoException().isThrownBy(() -> {
            var performers = systemService.getTopPerformers(5)
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(performers).isNotNull();
        });
    }

    @Test
    @Order(10)
    @DisplayName("UT-SSS-10: Should check alerts")
    void testCheckAlerts() {
        assertThatNoException().isThrownBy(() -> {
            var alerts = systemService.checkAlerts()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(alerts).isNotNull();
        });
    }
}
