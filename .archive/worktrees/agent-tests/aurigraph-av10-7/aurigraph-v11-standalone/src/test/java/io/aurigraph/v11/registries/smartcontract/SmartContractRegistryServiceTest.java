package io.aurigraph.v11.registries.smartcontract;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for SmartContractRegistryService
 *
 * Tests contract registration, asset linking, status transitions,
 * search functionality, statistics, and error handling.
 *
 * Coverage target: 80%+
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@QuarkusTest
@DisplayName("SmartContractRegistryService Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SmartContractRegistryServiceTest {

    private SmartContractRegistryService service;

    @BeforeEach
    void setUp() {
        service = new SmartContractRegistryService();
    }

    // ==================== REGISTER CONTRACT TESTS ====================

    @Test
    @Order(1)
    @DisplayName("registerContract - Should register contract with valid data")
    void testRegisterContract_WhenValidData_ThenSuccess() {
        // When
        SmartContractRegistryEntry result = service.registerContract(
                "contract-001",
                "ERC20 Token",
                "Standard ERC20 implementation",
                "0x1234567890abcdef",
                "0xabcdef1234567890",
                "sha256-hash-001",
                "DRAFT"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContractId()).isEqualTo("contract-001");
        assertThat(result.getContractName()).isEqualTo("ERC20 Token");
        assertThat(result.getCurrentStatus()).isEqualTo(ContractStatusEnum.DRAFT);
        assertThat(result.getRegisteredAt()).isNotNull();
    }

    @Test
    @Order(2)
    @DisplayName("registerContract - Should throw exception for null contract ID")
    void testRegisterContract_WhenNullContractId_ThenThrowsException() {
        // When/Then
        assertThatThrownBy(() -> {
            service.registerContract(null, "Name", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Contract ID cannot be null or empty");
    }

    @Test
    @Order(3)
    @DisplayName("registerContract - Should throw exception for empty contract ID")
    void testRegisterContract_WhenEmptyContractId_ThenThrowsException() {
        // When/Then
        assertThatThrownBy(() -> {
            service.registerContract("", "Name", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @Order(4)
    @DisplayName("registerContract - Should throw exception for duplicate contract ID")
    void testRegisterContract_WhenDuplicateId_ThenThrowsException() {
        // Given
        service.registerContract("duplicate-001", "Name1", "Desc1", "0x123", "0xabc", "hash1", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem();

        // When/Then
        assertThatThrownBy(() -> {
            service.registerContract("duplicate-001", "Name2", "Desc2", "0x456", "0xdef", "hash2", "DRAFT")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Contract already registered");
    }

    @Test
    @Order(5)
    @DisplayName("registerContract - Should throw exception for null contract name")
    void testRegisterContract_WhenNullContractName_ThenThrowsException() {
        // When/Then
        assertThatThrownBy(() -> {
            service.registerContract("contract-005", null, "Desc", "0x123", "0xabc", "hash", "DRAFT")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Contract name cannot be null or empty");
    }

    @Test
    @Order(6)
    @DisplayName("registerContract - Should handle invalid status gracefully")
    void testRegisterContract_WhenInvalidStatus_ThenDefaultsToDraft() {
        // When
        SmartContractRegistryEntry result = service.registerContract(
                "contract-006",
                "Test Contract",
                "Description",
                "0x123",
                "0xabc",
                "hash",
                "INVALID_STATUS"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getCurrentStatus()).isEqualTo(ContractStatusEnum.DRAFT);
    }

    // ==================== GET CONTRACT DETAILS TESTS ====================

    @Test
    @Order(7)
    @DisplayName("getContractDetails - Should retrieve existing contract")
    void testGetContractDetails_WhenExists_ThenReturnsContract() {
        // Given
        service.registerContract("contract-100", "Name", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem();

        // When
        SmartContractRegistryEntry result = service.getContractDetails("contract-100")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContractId()).isEqualTo("contract-100");
    }

    @Test
    @Order(8)
    @DisplayName("getContractDetails - Should throw exception for non-existent contract")
    void testGetContractDetails_WhenNotExists_ThenThrowsException() {
        // When/Then
        assertThatThrownBy(() -> {
            service.getContractDetails("non-existent")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(SmartContractRegistryService.ContractRegistryException.class)
          .hasMessageContaining("Contract not found");
    }

    // ==================== SEARCH CONTRACTS TESTS ====================

    @Test
    @Order(9)
    @DisplayName("searchContracts - Should find contracts by name")
    void testSearchContracts_WhenFilterByName_ThenReturnsMatches() {
        // Given
        service.registerContract("search-001", "ERC20 Token", "Desc", "0x123", "0xabc", "hash1", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.registerContract("search-002", "ERC721 NFT", "Desc", "0x456", "0xdef", "hash2", "DEPLOYED")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.registerContract("search-003", "ERC20 Utility", "Desc", "0x789", "0xghi", "hash3", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<SmartContractRegistryEntry> results = service.searchContracts("ERC20", null, 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSizeGreaterThanOrEqualTo(2);
        assertThat(results).allMatch(c -> c.getContractName().contains("ERC20"));
    }

    @Test
    @Order(10)
    @DisplayName("searchContracts - Should find contracts by status")
    void testSearchContracts_WhenFilterByStatus_ThenReturnsMatches() {
        // Given
        service.registerContract("status-001", "Contract A", "Desc", "0x123", "0xabc", "hash1", "DEPLOYED")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.registerContract("status-002", "Contract B", "Desc", "0x456", "0xdef", "hash2", "DEPLOYED")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.registerContract("status-003", "Contract C", "Desc", "0x789", "0xghi", "hash3", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<SmartContractRegistryEntry> results = service.searchContracts(null, "DEPLOYED", 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSizeGreaterThanOrEqualTo(2);
        assertThat(results).allMatch(c -> c.getCurrentStatus() == ContractStatusEnum.DEPLOYED);
    }

    @Test
    @Order(11)
    @DisplayName("searchContracts - Should support pagination")
    void testSearchContracts_WhenPaginated_ThenReturnsCorrectPage() {
        // Given
        for (int i = 0; i < 5; i++) {
            service.registerContract("page-" + i, "Contract " + i, "Desc", "0x" + i, "0x" + i, "hash" + i, "DRAFT")
                    .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        }

        // When
        List<SmartContractRegistryEntry> results = service.searchContracts(null, null, 2, 2)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSize(2);
    }

    // ==================== ASSET LINKING TESTS ====================

    @Test
    @Order(12)
    @DisplayName("linkAsset - Should link asset to contract")
    void testLinkAsset_WhenValid_ThenLinksAsset() {
        // Given
        service.registerContract("link-001", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        SmartContractRegistryEntry result = service.linkAsset("link-001", "asset-001")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getLinkedAssets()).contains("asset-001");
        assertThat(result.getLinkedAssetCount()).isEqualTo(1);
    }

    @Test
    @Order(13)
    @DisplayName("linkAsset - Should not duplicate already linked asset")
    void testLinkAsset_WhenAlreadyLinked_ThenDoesNotDuplicate() {
        // Given
        service.registerContract("link-002", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.linkAsset("link-002", "asset-002")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        SmartContractRegistryEntry result = service.linkAsset("link-002", "asset-002")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getLinkedAssetCount()).isEqualTo(1);
    }

    @Test
    @Order(14)
    @DisplayName("unlinkAsset - Should unlink asset from contract")
    void testUnlinkAsset_WhenLinked_ThenUnlinks() {
        // Given
        service.registerContract("unlink-001", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.linkAsset("unlink-001", "asset-unlink-001")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        SmartContractRegistryEntry result = service.unlinkAsset("unlink-001", "asset-unlink-001")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getLinkedAssets()).doesNotContain("asset-unlink-001");
        assertThat(result.getLinkedAssetCount()).isEqualTo(0);
    }

    @Test
    @Order(15)
    @DisplayName("getLinkedAssets - Should return all linked assets")
    void testGetLinkedAssets_WhenCalled_ThenReturnsLinkedAssets() {
        // Given
        service.registerContract("assets-001", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.linkAsset("assets-001", "asset-A")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.linkAsset("assets-001", "asset-B")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        Set<String> result = service.getLinkedAssets("assets-001")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).containsExactlyInAnyOrder("asset-A", "asset-B");
    }

    // ==================== STATUS UPDATE TESTS ====================

    @Test
    @Order(16)
    @DisplayName("updateContractStatus - Should update status for valid transition")
    void testUpdateContractStatus_WhenValidTransition_ThenUpdates() {
        // Given
        service.registerContract("status-update-001", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        SmartContractRegistryEntry result = service.updateContractStatus("status-update-001", "DEPLOYED")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getCurrentStatus()).isEqualTo(ContractStatusEnum.DEPLOYED);
    }

    @Test
    @Order(17)
    @DisplayName("updateContractStatus - Should throw exception for invalid status")
    void testUpdateContractStatus_WhenInvalidStatus_ThenThrowsException() {
        // Given
        service.registerContract("status-update-002", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When/Then
        assertThatThrownBy(() -> {
            service.updateContractStatus("status-update-002", "INVALID_STATUS")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(SmartContractRegistryService.ContractRegistryException.class)
          .hasMessageContaining("Invalid status");
    }

    // ==================== REMOVE CONTRACT TESTS ====================

    @Test
    @Order(18)
    @DisplayName("removeContract - Should remove existing contract")
    void testRemoveContract_WhenExists_ThenRemoves() {
        // Given
        service.registerContract("remove-001", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        Boolean result = service.removeContract("remove-001")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isTrue();

        // Verify removed
        assertThatThrownBy(() -> {
            service.getContractDetails("remove-001")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(SmartContractRegistryService.ContractRegistryException.class);
    }

    // ==================== STATISTICS TESTS ====================

    @Test
    @Order(19)
    @DisplayName("getContractStatistics - Should return comprehensive statistics")
    void testGetContractStatistics_WhenCalled_ThenReturnsStats() {
        // Given
        service.registerContract("stats-001", "Contract A", "Desc", "0x123", "0xabc", "hash", "DEPLOYED")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.registerContract("stats-002", "Contract B", "Desc", "0x456", "0xdef", "hash", "AUDITED")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        Map<String, Object> stats = service.getContractStatistics()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(stats).isNotNull();
        assertThat(stats).containsKeys("totalContracts", "activeContracts", "statusBreakdown");
        assertThat(stats.get("totalContracts")).isInstanceOf(Long.class);
    }

    // ==================== AUDIT TRAIL TESTS ====================

    @Test
    @Order(20)
    @DisplayName("getAuditTrail - Should return audit entries for contract")
    void testGetAuditTrail_WhenCalled_ThenReturnsAuditEntries() {
        // Given
        service.registerContract("audit-001", "Contract", "Desc", "0x123", "0xabc", "hash", "DRAFT")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<Map<String, Object>> trail = service.getAuditTrail("audit-001")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(trail).isNotEmpty();
        assertThat(trail.get(0)).containsKeys("operation", "timestamp", "details");
    }
}
