package io.aurigraph.v11.registries.compliance;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for ComplianceRegistryService
 *
 * Tests certification lifecycle, compliance verification, expiry detection,
 * renewal workflows, and compliance scoring.
 *
 * Coverage target: 80%+
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@QuarkusTest
@DisplayName("ComplianceRegistryService Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ComplianceRegistryServiceTest {

    private ComplianceRegistryService service;

    @BeforeEach
    void setUp() {
        service = new ComplianceRegistryService();
    }

    // ==================== ADD CERTIFICATION TESTS ====================

    @Test
    @Order(1)
    @DisplayName("addCertification - Should create certification with valid data")
    void testAddCertification_WhenValidData_ThenSuccess() {
        // Given
        Instant issuance = Instant.now();
        Instant expiry = issuance.plus(365, ChronoUnit.DAYS);

        // When
        ComplianceRegistryEntry result = service.addCertification(
                "entity-001",
                "ISO-27001",
                "ISO",
                "cert-001",
                issuance,
                expiry,
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEntityId()).isEqualTo("entity-001");
        assertThat(result.getCertificationType()).isEqualTo("ISO-27001");
        assertThat(result.getCurrentStatus()).isEqualTo(ComplianceRegistryEntry.CertificationStatus.ACTIVE);
        assertThat(result.getComplianceLevel()).isNotNull();
    }

    @Test
    @Order(2)
    @DisplayName("addCertification - Should throw exception for null entity ID")
    void testAddCertification_WhenNullEntityId_ThenThrowsException() {
        // When/Then
        assertThatThrownBy(() -> {
            service.addCertification(null, "ISO-27001", "ISO", "cert", Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @Order(3)
    @DisplayName("addCertification - Should determine compliance level based on type")
    void testAddCertification_WhenDifferentTypes_ThenDeterminesLevelCorrectly() {
        // ISO certification should be LEVEL_3
        ComplianceRegistryEntry iso = service.addCertification(
                "entity-100", "ISO-27001", "ISO", "cert-100",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();

        // NIST certification should be LEVEL_5
        ComplianceRegistryEntry nist = service.addCertification(
                "entity-101", "NIST-SP800-53", "NIST", "cert-101",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();

        assertThat(iso.getComplianceLevel()).isEqualTo(ComplianceLevelEnum.LEVEL_3);
        assertThat(nist.getComplianceLevel()).isEqualTo(ComplianceLevelEnum.LEVEL_5);
    }

    // ==================== GET CERTIFICATIONS TESTS ====================

    @Test
    @Order(4)
    @DisplayName("getCertifications - Should return all certifications for entity")
    void testGetCertifications_WhenEntityHasCerts_ThenReturnsAll() {
        // Given
        service.addCertification("entity-200", "ISO-27001", "ISO", "cert-200-1",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.addCertification("entity-200", "SOC2-Type-II", "AICPA", "cert-200-2",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<ComplianceRegistryEntry> result = service.getCertifications("entity-200")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).hasSize(2);
    }

    @Test
    @Order(5)
    @DisplayName("getCertifications - Should return empty list for entity without certs")
    void testGetCertifications_WhenNoC erts_ThenReturnsEmpty() {
        // When
        List<ComplianceRegistryEntry> result = service.getCertifications("non-existent-entity")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isEmpty();
    }

    // ==================== VERIFY COMPLIANCE TESTS ====================

    @Test
    @Order(6)
    @DisplayName("verifyCompliance - Should verify entity meets compliance level")
    void testVerifyCompliance_WhenMeetsLevel_ThenReturnsCompliant() {
        // Given
        service.addCertification("entity-300", "ISO-27001", "ISO", "cert-300",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        ComplianceRegistryService.ComplianceVerificationResult result =
                service.verifyCompliance("entity-300", "1")
                        .subscribe().withSubscriber(UniAssertSubscriber.create())
                        .awaitItem()
                        .getItem();

        // Then
        assertThat(result.isCompliant()).isTrue();
        assertThat(result.getComplianceScore()).isGreaterThan(0);
    }

    @Test
    @Order(7)
    @DisplayName("verifyCompliance - Should return non-compliant for entity without certs")
    void testVerifyCompliance_WhenNoCerts_ThenReturnsNonCompliant() {
        // When
        ComplianceRegistryService.ComplianceVerificationResult result =
                service.verifyCompliance("no-certs-entity", "1")
                        .subscribe().withSubscriber(UniAssertSubscriber.create())
                        .awaitItem()
                        .getItem();

        // Then
        assertThat(result.isCompliant()).isFalse();
        assertThat(result.getMessage()).contains("no compliance certifications");
    }

    // ==================== EXPIRED CERTIFICATIONS TESTS ====================

    @Test
    @Order(8)
    @DisplayName("getExpiredCertifications - Should return expired certificates")
    void testGetExpiredCertifications_WhenExpiredExists_ThenReturns() {
        // Given - Create expired certification
        Instant pastDate = Instant.now().minus(10, ChronoUnit.DAYS);
        service.addCertification("entity-400", "Expired-Cert", "Authority", "cert-400",
                pastDate.minus(365, ChronoUnit.DAYS), pastDate, "ACTIVE")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<ComplianceRegistryEntry> result = service.getExpiredCertifications()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).hasSizeGreaterThanOrEqualTo(1);
        assertThat(result).allMatch(ComplianceRegistryEntry::isExpired);
    }

    // ==================== RENEW CERTIFICATION TESTS ====================

    @Test
    @Order(9)
    @DisplayName("renewCertification - Should renew certification with new expiry date")
    void testRenewCertification_WhenValid_ThenRenews() {
        // Given
        ComplianceRegistryEntry cert = service.addCertification(
                "entity-500", "ISO-27001", "ISO", "cert-500",
                Instant.now().minus(300, ChronoUnit.DAYS),
                Instant.now().plus(65, ChronoUnit.DAYS),
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();

        Instant newExpiry = Instant.now().plus(400, ChronoUnit.DAYS);

        // When
        ComplianceRegistryEntry result = service.renewCertification(cert.getCertificationId(), newExpiry)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getExpiryDate()).isEqualTo(newExpiry);
        assertThat(result.getLastRenewalDate()).isNotNull();
        assertThat(result.getCurrentStatus()).isEqualTo(ComplianceRegistryEntry.CertificationStatus.ACTIVE);
    }

    @Test
    @Order(10)
    @DisplayName("renewCertification - Should throw exception for non-existent cert")
    void testRenewCertification_WhenNotExists_ThenThrowsException() {
        // When/Then
        assertThatThrownBy(() -> {
            service.renewCertification("non-existent", Instant.now().plus(365, ChronoUnit.DAYS))
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCauseInstanceOf(IllegalArgumentException.class);
    }

    // ==================== REVOKE CERTIFICATION TESTS ====================

    @Test
    @Order(11)
    @DisplayName("revokeCertification - Should revoke active certification")
    void testRevokeCertification_WhenActive_ThenRevokes() {
        // Given
        ComplianceRegistryEntry cert = service.addCertification(
                "entity-600", "ISO-27001", "ISO", "cert-600",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();

        // When
        ComplianceRegistryEntry result = service.revokeCertification(cert.getCertificationId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getCurrentStatus()).isEqualTo(ComplianceRegistryEntry.CertificationStatus.REVOKED);
    }

    // ==================== GET COMPLIANCE METRICS TESTS ====================

    @Test
    @Order(12)
    @DisplayName("getComplianceMetrics - Should return comprehensive metrics")
    void testGetComplianceMetrics_WhenCalled_ThenReturnsMetrics() {
        // Given
        service.addCertification("entity-700", "ISO-27001", "ISO", "cert-700",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        ComplianceRegistryService.ComplianceMetrics metrics = service.getComplianceMetrics()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics.getTotalCertifications()).isGreaterThan(0);
        assertThat(metrics.getCertificationsByLevel()).isNotEmpty();
        assertThat(metrics.getCertificationsByStatus()).isNotEmpty();
    }

    // ==================== GET CERTIFICATION BY ID TESTS ====================

    @Test
    @Order(13)
    @DisplayName("getCertification - Should return certification by ID")
    void testGetCertification_WhenExists_ThenReturns() {
        // Given
        ComplianceRegistryEntry created = service.addCertification(
                "entity-800", "ISO-27001", "ISO", "cert-800",
                Instant.now(), Instant.now().plus(365, ChronoUnit.DAYS), "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem().getItem();

        // When
        ComplianceRegistryEntry result = service.getCertification("cert-800")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCertificationId()).isEqualTo("cert-800");
    }

    // ==================== GET CERTIFICATIONS IN RENEWAL WINDOW TESTS ====================

    @Test
    @Order(14)
    @DisplayName("getCertificationsInRenewalWindow - Should return certs approaching expiry")
    void testGetCertificationsInRenewalWindow_WhenApproaching_ThenReturns() {
        // Given - Cert expiring in 60 days (within 90-day renewal window)
        service.addCertification(
                "entity-900", "ISO-27001", "ISO", "cert-900",
                Instant.now().minus(305, ChronoUnit.DAYS),
                Instant.now().plus(60, ChronoUnit.DAYS),
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<ComplianceRegistryEntry> result = service.getCertificationsInRenewalWindow()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).hasSizeGreaterThanOrEqualTo(1);
    }

    @Test
    @Order(15)
    @DisplayName("getCertificationsInCriticalWindow - Should return certs in critical renewal window")
    void testGetCertificationsInCriticalWindow_WhenCritical_ThenReturns() {
        // Given - Cert expiring in 15 days (within 30-day critical window)
        service.addCertification(
                "entity-1000", "ISO-27001", "ISO", "cert-1000",
                Instant.now().minus(350, ChronoUnit.DAYS),
                Instant.now().plus(15, ChronoUnit.DAYS),
                "ACTIVE"
        ).subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<ComplianceRegistryEntry> result = service.getCertificationsInCriticalWindow()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).hasSizeGreaterThanOrEqualTo(1);
    }
}
