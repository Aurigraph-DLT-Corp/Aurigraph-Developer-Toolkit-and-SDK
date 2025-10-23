package io.aurigraph.v11.unit;

import io.aurigraph.v11.contracts.ActiveContractService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.List;

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
    @DisplayName("UT-ACS-02: Should list all contracts")
    void testListContracts() {
        assertThatNoException().isThrownBy(() -> {
            var contracts = contractService.listContracts()
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(contracts).isNotNull();
            assertThat(contracts).isInstanceOf(List.class);
        });
    }

    @Test
    @Order(3)
    @DisplayName("UT-ACS-03: Should list contracts by owner")
    void testListContractsByOwner() {
        assertThatNoException().isThrownBy(() -> {
            var contracts = contractService.listContractsByOwner("test-owner")
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(contracts).isNotNull();
            assertThat(contracts).isInstanceOf(List.class);
        });
    }

    @Test
    @Order(4)
    @DisplayName("UT-ACS-04: Should list contracts by type")
    void testListContractsByType() {
        assertThatNoException().isThrownBy(() -> {
            var contracts = contractService.listContractsByType("RICARDIAN")
                    .await().atMost(Duration.ofSeconds(5));
            assertThat(contracts).isNotNull();
            assertThat(contracts).isInstanceOf(List.class);
        });
    }

    @Test
    @Order(5)
    @DisplayName("UT-ACS-05: Should get contract by ID")
    void testGetContract() {
        assertThatCode(() -> {
            contractService.getContract("non-existent-id")
                    .await().atMost(Duration.ofSeconds(5));
        }).doesNotThrowAnyException(); // Will be empty for non-existent contract
    }
}
