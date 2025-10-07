package io.aurigraph.v11.unit;

import io.aurigraph.v11.contracts.ActiveContractService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for ActiveContractService
 *
 * Tests active contract management functionality.
 *
 * @version 3.10.0 (Phase 4 Day 3-4)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ActiveContractServiceTest {

    @Inject
    ActiveContractService contractService;

    @Test
    @Order(1)
    @DisplayName("UT-ACS-01: Should inject ActiveContractService")
    void testServiceInjection() {
        assertThat(contractService).isNotNull();
    }

    @Test
    @Order(2)
    @DisplayName("UT-ACS-02: Should get service statistics")
    void testGetStatistics() {
        Map<String, Object> stats = contractService.getStatistics()
                .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
        assertThat(stats).containsKeys("contractsCreated", "contractStatistics");
    }

    @Test
    @Order(3)
    @DisplayName("UT-ACS-03: Should list contracts")
    void testListContracts() {
        assertThatNoException().isThrownBy(() -> {
            var contracts = contractService.listContracts(0, 10)
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(contracts).isNotNull();
        });
    }

    @Test
    @Order(4)
    @DisplayName("UT-ACS-04: Should get expired contracts")
    void testGetExpiredContracts() {
        assertThatNoException().isThrownBy(() -> {
            var contracts = contractService.getExpiredContracts()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(contracts).isNotNull();
        });
    }

    @Test
    @Order(5)
    @DisplayName("UT-ACS-05: Should get expiring contracts")
    void testGetExpiringContracts() {
        assertThatNoException().isThrownBy(() -> {
            var contracts = contractService.getExpiringContracts(3600L)
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(contracts).isNotNull();
        });
    }
}
