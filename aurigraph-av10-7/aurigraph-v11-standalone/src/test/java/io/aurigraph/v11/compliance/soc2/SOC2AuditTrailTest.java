package io.aurigraph.v11.compliance.soc2;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SOC 2 Audit Trail
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class SOC2AuditTrailTest {

    @Inject
    SOC2AuditTrail auditTrail;

    private static final String TEST_USER = "test-user-001";
    private static final String TEST_RESOURCE = "test-resource";

    @Test
    @Order(1)
    @DisplayName("Test Security Event Logging - Authentication Success")
    void testAuthenticationSuccessLogging() {
        var event = auditTrail.logAuthentication(
            TEST_USER,
            "PASSWORD",
            true,
            "192.168.1.1",
            "Mozilla/5.0"
        );

        assertNotNull(event);
        assertEquals(TEST_USER, event.getActor());
        assertEquals(SOC2AuditTrail.Severity.INFO, event.getSeverity());
        assertEquals(SOC2AuditTrail.TrustServiceCategory.SECURITY, event.getCategory());
    }

    @Test
    @Order(2)
    @DisplayName("Test Security Event Logging - Authentication Failure")
    void testAuthenticationFailureLogging() {
        var event = auditTrail.logAuthentication(
            TEST_USER,
            "PASSWORD",
            false,
            "192.168.1.1",
            "Mozilla/5.0"
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.Severity.WARNING, event.getSeverity());
    }

    @Test
    @Order(3)
    @DisplayName("Test Authorization Event Logging")
    void testAuthorizationLogging() {
        var event = auditTrail.logAuthorization(
            TEST_USER,
            "admin-console",
            "ADMIN_ACCESS",
            true,
            "Role-based access"
        );

        assertNotNull(event);
        assertEquals(TEST_USER, event.getActor());
        assertEquals(SOC2AuditTrail.TrustServiceCategory.SECURITY, event.getCategory());
    }

    @Test
    @Order(4)
    @DisplayName("Test Data Access Logging")
    void testDataAccessLogging() {
        Map<String, Object> details = new HashMap<>();
        details.put("queryType", "SELECT");

        var event = auditTrail.logDataAccess(
            TEST_USER,
            "user_data",
            "READ",
            100,
            details
        );

        assertNotNull(event);
        assertEquals("user_data", event.getResource());
        assertTrue(event.getDetails().containsKey("queryType"));
    }

    @Test
    @Order(5)
    @DisplayName("Test Availability Event Logging - Health Check")
    void testHealthCheckLogging() {
        var event = auditTrail.logHealthCheck(
            "database-service",
            true,
            99.99,
            50
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.AVAILABILITY, event.getCategory());
        assertEquals(SOC2AuditTrail.Severity.INFO, event.getSeverity());
    }

    @Test
    @Order(6)
    @DisplayName("Test Availability Event Logging - Capacity Warning")
    void testCapacityLogging() {
        var event = auditTrail.logCapacityEvent(
            "disk-storage",
            85.0,
            100.0,
            "GB"
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.AVAILABILITY, event.getCategory());
    }

    @Test
    @Order(7)
    @DisplayName("Test Backup Logging")
    void testBackupLogging() {
        var event = auditTrail.logBackup(
            "FULL",
            "production-database",
            true,
            3600000,
            1024 * 1024 * 1024
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.AVAILABILITY, event.getCategory());
        assertTrue(event.getDetails().containsKey("success"));
    }

    @Test
    @Order(8)
    @DisplayName("Test Processing Integrity - Transaction Logging")
    void testTransactionLogging() {
        var event = auditTrail.logTransactionProcessing(
            "TXN-001",
            "PAYMENT",
            true,
            true,
            150
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.PROCESSING_INTEGRITY, event.getCategory());
    }

    @Test
    @Order(9)
    @DisplayName("Test Processing Integrity - Data Validation")
    void testDataValidationLogging() {
        var event = auditTrail.logDataValidation(
            "user-input",
            "FORM-001",
            true,
            Collections.emptyList()
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.PROCESSING_INTEGRITY, event.getCategory());
    }

    @Test
    @Order(10)
    @DisplayName("Test Confidentiality Event Logging")
    void testConfidentialityLogging() {
        var event = auditTrail.logConfidentialDataAccess(
            TEST_USER,
            "CONFIDENTIAL",
            "READ",
            true
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.CONFIDENTIALITY, event.getCategory());
    }

    @Test
    @Order(11)
    @DisplayName("Test Privacy Event Logging - Data Collection")
    void testPrivacyDataCollectionLogging() {
        var event = auditTrail.logDataCollection(
            "registration-service",
            "user-123",
            List.of("email", "name", "phone"),
            "Account registration",
            true
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.PRIVACY, event.getCategory());
    }

    @Test
    @Order(12)
    @DisplayName("Test Privacy Event Logging - Data Subject Request")
    void testDataSubjectRequestLogging() {
        var event = auditTrail.logDataSubjectRequest(
            "user-456",
            "ACCESS_REQUEST",
            "COMPLETED",
            48
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.PRIVACY, event.getCategory());
    }

    @Test
    @Order(13)
    @DisplayName("Test Control Evidence Recording")
    void testControlEvidenceRecording() {
        Map<String, Object> evidenceData = new HashMap<>();
        evidenceData.put("policyDocument", "access-control-policy-v2.pdf");
        evidenceData.put("lastReviewDate", Instant.now().toString());

        var evidence = auditTrail.recordControlEvidence(
            "CC6.1",
            "User Access Control Policy",
            SOC2AuditTrail.TrustServiceCategory.SECURITY,
            "Access control policy review completed",
            evidenceData
        );

        assertNotNull(evidence);
        assertEquals("CC6.1", evidence.getControlId());
        assertNotNull(evidence.getEvidenceId());
    }

    @Test
    @Order(14)
    @DisplayName("Test Get Events By Category")
    void testGetEventsByCategory() {
        var securityEvents = auditTrail.getEvents(SOC2AuditTrail.TrustServiceCategory.SECURITY);

        assertNotNull(securityEvents);
        assertTrue(securityEvents.size() > 0);

        // All events should be security category
        assertTrue(securityEvents.stream()
            .allMatch(e -> e.getCategory() == SOC2AuditTrail.TrustServiceCategory.SECURITY));
    }

    @Test
    @Order(15)
    @DisplayName("Test Get Events By Time Range")
    void testGetEventsByTimeRange() {
        Instant startTime = Instant.now().minus(Duration.ofHours(1));
        Instant endTime = Instant.now();

        var events = auditTrail.getEvents(
            SOC2AuditTrail.TrustServiceCategory.SECURITY,
            startTime,
            endTime
        );

        assertNotNull(events);
        // All events should be within time range
        assertTrue(events.stream()
            .allMatch(e -> !e.getTimestamp().isBefore(startTime) &&
                          !e.getTimestamp().isAfter(endTime)));
    }

    @Test
    @Order(16)
    @DisplayName("Test Get Events By Actor")
    void testGetEventsByActor() {
        var events = auditTrail.getEventsByActor(TEST_USER);

        assertNotNull(events);
        assertTrue(events.size() > 0);
        assertTrue(events.stream().allMatch(e -> TEST_USER.equals(e.getActor())));
    }

    @Test
    @Order(17)
    @DisplayName("Test SOC 2 Statistics")
    void testSOC2Statistics() {
        var stats = auditTrail.getStats();

        assertNotNull(stats);
        assertTrue(stats.getSecurityEventCount() > 0);
        assertTrue(stats.getAvailabilityEventCount() > 0);
        assertTrue(stats.getProcessingIntegrityEventCount() > 0);
        assertTrue(stats.getConfidentialityEventCount() > 0);
        assertTrue(stats.getPrivacyEventCount() > 0);
        assertTrue(stats.getTotalEventCount() > 0);
    }

    @Test
    @Order(18)
    @DisplayName("Test Audit Report Generation")
    void testAuditReportGeneration() {
        Instant startDate = Instant.now().minus(Duration.ofHours(1));
        Instant endDate = Instant.now();

        var report = auditTrail.generateAuditReport(startDate, endDate);

        assertNotNull(report);
        assertNotNull(report.getReportId());
        assertEquals(startDate, report.getPeriodStart());
        assertEquals(endDate, report.getPeriodEnd());
        assertNotNull(report.getSecurityEvents());
        assertNotNull(report.getAvailabilityEvents());
    }

    @Test
    @Order(19)
    @DisplayName("Test Control Evidence Retrieval By Category")
    void testControlEvidenceByCategory() {
        var evidence = auditTrail.getControlEvidence(SOC2AuditTrail.TrustServiceCategory.SECURITY);

        assertNotNull(evidence);
        assertTrue(evidence.stream()
            .allMatch(e -> e.getCategory() == SOC2AuditTrail.TrustServiceCategory.SECURITY));
    }

    @Test
    @Order(20)
    @DisplayName("Test Crypto Operation Logging")
    void testCryptoOperationLogging() {
        var event = auditTrail.logCryptoOperation(
            TEST_USER,
            "SIGN",
            "ECDSA-P256",
            "key-001",
            true
        );

        assertNotNull(event);
        assertEquals(SOC2AuditTrail.TrustServiceCategory.SECURITY, event.getCategory());
        assertTrue(event.getDetails().containsKey("algorithm"));
    }
}
