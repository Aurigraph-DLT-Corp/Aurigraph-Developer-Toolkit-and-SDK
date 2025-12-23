package io.aurigraph.v11.integration;

import io.aurigraph.v11.registries.smartcontract.*;
import io.aurigraph.v11.registries.compliance.*;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for multi-registry workflows
 *
 * Tests workflows spanning smart contracts, compliance, and asset linking.
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@QuarkusTest
@DisplayName("Registry Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RegistryIntegrationTest {

    private SmartContractRegistryService contractService;
    private ComplianceRegistryService complianceService;

    @BeforeEach
    void setUp() {
        contractService = new SmartContractRegistryService();
        complianceService = new ComplianceRegistryService();
    }

    @Test
    @Order(1)
    @DisplayName("E2E: Register contract → Link assets → Update status → Search")
    void testCompleteContractLifecycle() {
        // Step 1: Register contract
        SmartContractRegistryEntry contract = contractService.registerContract(
                "integration-contract-001",
                "ERC20 Token Contract",
                "Standard token implementation",
                "0x1234567890abcdef",
                "0xabcdef1234567890",
                "sha256-hash-integration-001",
                "DRAFT"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(contract.getCurrentStatus()).isEqualTo(ContractStatusEnum.DRAFT);

        // Step 2: Link multiple assets
        contractService.linkAsset("integration-contract-001", "asset-A")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        contractService.linkAsset("integration-contract-001", "asset-B")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        contractService.linkAsset("integration-contract-001", "asset-C")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // Step 3: Verify asset links
        Set<String> linkedAssets = contractService.getLinkedAssets("integration-contract-001")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(linkedAssets).containsExactlyInAnyOrder("asset-A", "asset-B", "asset-C");

        // Step 4: Update contract status
        SmartContractRegistryEntry updated = contractService.updateContractStatus(
                "integration-contract-001",
                "DEPLOYED"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(updated.getCurrentStatus()).isEqualTo(ContractStatusEnum.DEPLOYED);

        // Step 5: Search for deployed contracts
        var searchResults = contractService.searchContracts(null, "DEPLOYED", 100, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(searchResults).isNotEmpty();
        assertThat(searchResults.stream().anyMatch(c -> c.getContractId().equals("integration-contract-001")))
                .isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("E2E: Issue certification → Verify compliance → Renew → Check status")
    void testCompleteComplianceLifecycle() {
        // Step 1: Issue initial certification
        Instant issuance = Instant.now();
        Instant expiry = issuance.plus(365, ChronoUnit.DAYS);

        ComplianceRegistryEntry cert = complianceService.addCertification(
                "entity-integration-001",
                "ISO-27001",
                "ISO",
                "cert-integration-001",
                issuance,
                expiry,
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(cert.getCurrentStatus()).isEqualTo(ComplianceRegistryEntry.CertificationStatus.ACTIVE);
        assertThat(cert.getComplianceLevel()).isEqualTo(ComplianceLevelEnum.LEVEL_3);

        // Step 2: Verify compliance
        ComplianceRegistryService.ComplianceVerificationResult verification =
                complianceService.verifyCompliance("entity-integration-001", "3")
                        .subscribe().withSubscriber(UniAssertSubscriber.create())
                        .awaitItem()
                        .getItem();

        assertThat(verification.isCompliant()).isTrue();
        assertThat(verification.getAchievedLevel()).isEqualTo(ComplianceLevelEnum.LEVEL_3);

        // Step 3: Renew certification
        Instant newExpiry = expiry.plus(365, ChronoUnit.DAYS);
        ComplianceRegistryEntry renewed = complianceService.renewCertification(
                "cert-integration-001",
                newExpiry
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(renewed.getExpiryDate()).isEqualTo(newExpiry);
        assertThat(renewed.getLastRenewalDate()).isNotNull();

        // Step 4: Verify still compliant after renewal
        ComplianceRegistryService.ComplianceVerificationResult postRenewal =
                complianceService.verifyCompliance("entity-integration-001", "3")
                        .subscribe().withSubscriber(UniAssertSubscriber.create())
                        .awaitItem()
                        .getItem();

        assertThat(postRenewal.isCompliant()).isTrue();
    }

    @Test
    @Order(3)
    @DisplayName("E2E: Multi-entity compliance with different levels")
    void testMultiEntityComplianceScenario() {
        // Entity A: NIST Level 5
        complianceService.addCertification(
                "entity-A",
                "NIST-SP800-53",
                "NIST",
                "cert-A-1",
                Instant.now(),
                Instant.now().plus(365, ChronoUnit.DAYS),
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // Entity B: ISO Level 3 + SOC2 Level 3
        complianceService.addCertification(
                "entity-B",
                "ISO-27001",
                "ISO",
                "cert-B-1",
                Instant.now(),
                Instant.now().plus(365, ChronoUnit.DAYS),
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        complianceService.addCertification(
                "entity-B",
                "SOC2-Type-II",
                "AICPA",
                "cert-B-2",
                Instant.now(),
                Instant.now().plus(365, ChronoUnit.DAYS),
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // Entity C: KYC Level 2
        complianceService.addCertification(
                "entity-C",
                "KYC-Certified",
                "FinCEN",
                "cert-C-1",
                Instant.now(),
                Instant.now().plus(365, ChronoUnit.DAYS),
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // Verify different compliance levels
        var resultA = complianceService.verifyCompliance("entity-A", "5")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();
        var resultB = complianceService.verifyCompliance("entity-B", "3")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();
        var resultC = complianceService.verifyCompliance("entity-C", "2")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();

        assertThat(resultA.isCompliant()).isTrue();
        assertThat(resultA.getAchievedLevel()).isEqualTo(ComplianceLevelEnum.LEVEL_5);

        assertThat(resultB.isCompliant()).isTrue();
        assertThat(resultB.getAchievedLevel()).isEqualTo(ComplianceLevelEnum.LEVEL_3);

        assertThat(resultC.isCompliant()).isTrue();
        assertThat(resultC.getAchievedLevel()).isEqualTo(ComplianceLevelEnum.LEVEL_2);
    }
}
