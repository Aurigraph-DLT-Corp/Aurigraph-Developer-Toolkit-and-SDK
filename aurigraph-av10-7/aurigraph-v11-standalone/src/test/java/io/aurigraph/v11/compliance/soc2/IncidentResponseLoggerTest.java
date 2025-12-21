package io.aurigraph.v11.compliance.soc2;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Incident Response Logger
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class IncidentResponseLoggerTest {

    @Inject
    IncidentResponseLogger incidentLogger;

    private static String testIncidentId;

    @Test
    @Order(1)
    @DisplayName("Test Create Security Incident")
    void testCreateSecurityIncident() {
        var incident = incidentLogger.createIncident(
            IncidentResponseLogger.IncidentType.UNAUTHORIZED_ACCESS,
            IncidentResponseLogger.IncidentSeverity.HIGH,
            "Unauthorized Access Attempt Detected",
            "Multiple failed login attempts from suspicious IP address",
            "security-monitor",
            "authentication-service"
        );

        assertNotNull(incident);
        assertNotNull(incident.getIncidentId());
        assertEquals(IncidentResponseLogger.IncidentType.UNAUTHORIZED_ACCESS, incident.getType());
        assertEquals(IncidentResponseLogger.IncidentSeverity.HIGH, incident.getSeverity());
        assertEquals(IncidentResponseLogger.IncidentStatus.REPORTED, incident.getStatus());
        assertNotNull(incident.getReportedAt());
        assertNotNull(incident.getResponseDeadline());
        assertNotNull(incident.getResolutionDeadline());

        testIncidentId = incident.getIncidentId();
    }

    @Test
    @Order(2)
    @DisplayName("Test Assign Incident")
    void testAssignIncident() {
        assertNotNull(testIncidentId);

        incidentLogger.assignIncident(testIncidentId, "security-analyst-1", "incident-manager");

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertEquals("security-analyst-1", incident.get().getAssignedTo());
        assertEquals(IncidentResponseLogger.IncidentStatus.ACKNOWLEDGED, incident.get().getStatus());
    }

    @Test
    @Order(3)
    @DisplayName("Test Update Incident Status")
    void testUpdateIncidentStatus() {
        var update = incidentLogger.updateIncidentStatus(
            testIncidentId,
            IncidentResponseLogger.IncidentStatus.INVESTIGATING,
            "security-analyst-1",
            "Starting investigation"
        );

        assertNotNull(update);
        assertEquals(IncidentResponseLogger.IncidentStatus.ACKNOWLEDGED, update.getPreviousStatus());
        assertEquals(IncidentResponseLogger.IncidentStatus.INVESTIGATING, update.getNewStatus());
    }

    @Test
    @Order(4)
    @DisplayName("Test Add Investigation Finding")
    void testAddInvestigationFinding() {
        incidentLogger.addInvestigationFinding(
            testIncidentId,
            "Source IP identified as known malicious actor",
            "security-analyst-1",
            IncidentResponseLogger.FindingSeverity.HIGH
        );

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertNotNull(incident.get().getInvestigationFindings());
        assertFalse(incident.get().getInvestigationFindings().isEmpty());
    }

    @Test
    @Order(5)
    @DisplayName("Test Add Affected Asset")
    void testAddAffectedAsset() {
        incidentLogger.addAffectedAsset(
            testIncidentId,
            "AUTH-SERVER-01",
            "Application Server",
            "Received brute force attack attempts"
        );

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertFalse(incident.get().getAffectedAssets().isEmpty());
    }

    @Test
    @Order(6)
    @DisplayName("Test Update Impact Assessment")
    void testUpdateImpactAssessment() {
        var assessment = new IncidentResponseLogger.ImpactAssessment();
        assessment.setBusinessImpact("LOW");
        assessment.setDataImpact("NONE");
        assessment.setSystemImpact("MEDIUM");
        assessment.setAffectedUserCount(0);

        incidentLogger.updateImpactAssessment(testIncidentId, assessment, "security-analyst-1");

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertNotNull(incident.get().getImpactAssessment());
        assertEquals("LOW", incident.get().getImpactAssessment().getBusinessImpact());
    }

    @Test
    @Order(7)
    @DisplayName("Test Log Containment Action")
    void testLogContainmentAction() {
        var action = incidentLogger.logContainmentAction(
            testIncidentId,
            "Blocked malicious IP at firewall",
            "security-analyst-1",
            true
        );

        assertNotNull(action);
        assertTrue(action.isSuccessful());

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertEquals(IncidentResponseLogger.IncidentStatus.CONTAINMENT, incident.get().getStatus());
    }

    @Test
    @Order(8)
    @DisplayName("Test Log Eradication Action")
    void testLogEradicationAction() {
        var action = incidentLogger.logEradicationAction(
            testIncidentId,
            "Rotated compromised credentials",
            "security-analyst-1",
            "Verified no unauthorized access"
        );

        assertNotNull(action);
        assertNotNull(action.getVerification());

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertEquals(IncidentResponseLogger.IncidentStatus.ERADICATION, incident.get().getStatus());
    }

    @Test
    @Order(9)
    @DisplayName("Test Log Recovery Action")
    void testLogRecoveryAction() {
        var action = incidentLogger.logRecoveryAction(
            testIncidentId,
            "Restored normal authentication service",
            "security-analyst-1",
            true
        );

        assertNotNull(action);
        assertTrue(action.isVerified());

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertEquals(IncidentResponseLogger.IncidentStatus.RECOVERY, incident.get().getStatus());
    }

    @Test
    @Order(10)
    @DisplayName("Test Resolve Incident")
    void testResolveIncident() {
        incidentLogger.updateIncidentStatus(
            testIncidentId,
            IncidentResponseLogger.IncidentStatus.RESOLVED,
            "security-analyst-1",
            "Incident fully resolved"
        );

        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertEquals(IncidentResponseLogger.IncidentStatus.RESOLVED, incident.get().getStatus());
        assertNotNull(incident.get().getResolvedAt());
        assertNotNull(incident.get().getResolutionTime());
    }

    @Test
    @Order(11)
    @DisplayName("Test Create Post-Mortem Report")
    void testCreatePostMortemReport() {
        var postMortem = incidentLogger.createPostMortem(testIncidentId, "security-analyst-1");

        assertNotNull(postMortem);
        assertEquals(testIncidentId, postMortem.getIncidentId());
        assertNotNull(postMortem.getReportId());
        assertFalse(postMortem.isFinalized());
    }

    @Test
    @Order(12)
    @DisplayName("Test Update Post-Mortem Report")
    void testUpdatePostMortemReport() {
        var updates = new IncidentResponseLogger.PostMortemReport();
        updates.setRootCauseAnalysis("Weak password policy allowed brute force attack");
        updates.setWhatWentWell(List.of("Quick detection", "Effective containment"));
        updates.setWhatWentWrong(List.of("Password policy too lenient"));
        updates.setLessonsLearned(List.of("Implement stronger password policy"));
        updates.setPreventiveMeasures(List.of("Enable account lockout", "Implement MFA"));

        var updated = incidentLogger.updatePostMortem(testIncidentId, updates);

        assertNotNull(updated);
        assertEquals("Weak password policy allowed brute force attack",
            updated.getRootCauseAnalysis());
    }

    @Test
    @Order(13)
    @DisplayName("Test Finalize Post-Mortem Report")
    void testFinalizePostMortemReport() {
        var finalized = incidentLogger.finalizePostMortem(testIncidentId, "security-manager");

        assertTrue(finalized.isFinalized());
        assertEquals("security-manager", finalized.getApprovedBy());

        // Incident should be closed
        var incident = incidentLogger.getIncident(testIncidentId);
        assertTrue(incident.isPresent());
        assertEquals(IncidentResponseLogger.IncidentStatus.CLOSED, incident.get().getStatus());
    }

    @Test
    @Order(14)
    @DisplayName("Test Get Incidents By Status")
    void testGetIncidentsByStatus() {
        var closedIncidents = incidentLogger.getIncidentsByStatus(
            IncidentResponseLogger.IncidentStatus.CLOSED);

        assertNotNull(closedIncidents);
        assertTrue(closedIncidents.stream()
            .allMatch(i -> i.getStatus() == IncidentResponseLogger.IncidentStatus.CLOSED));
    }

    @Test
    @Order(15)
    @DisplayName("Test Get Incidents By Severity")
    void testGetIncidentsBySeverity() {
        var highIncidents = incidentLogger.getIncidentsBySeverity(
            IncidentResponseLogger.IncidentSeverity.HIGH);

        assertNotNull(highIncidents);
        assertTrue(highIncidents.stream()
            .allMatch(i -> i.getSeverity() == IncidentResponseLogger.IncidentSeverity.HIGH));
    }

    @Test
    @Order(16)
    @DisplayName("Test Get Open Incidents")
    void testGetOpenIncidents() {
        var openIncidents = incidentLogger.getOpenIncidents();

        assertNotNull(openIncidents);
        assertTrue(openIncidents.stream()
            .noneMatch(i -> i.getStatus() == IncidentResponseLogger.IncidentStatus.CLOSED ||
                           i.getStatus() == IncidentResponseLogger.IncidentStatus.RESOLVED));
    }

    @Test
    @Order(17)
    @DisplayName("Test Get Incident Statistics")
    void testGetIncidentStatistics() {
        var stats = incidentLogger.getStats();

        assertNotNull(stats);
        assertTrue(stats.getTotalIncidents() > 0);
        assertTrue(stats.getResolvedIncidents() > 0);
        assertNotNull(stats.getBySeverity());
        assertNotNull(stats.getByType());
    }

    @Test
    @Order(18)
    @DisplayName("Test Get Incident Updates")
    void testGetIncidentUpdates() {
        var updates = incidentLogger.getIncidentUpdates(testIncidentId);

        assertNotNull(updates);
        assertFalse(updates.isEmpty());
    }

    @Test
    @Order(19)
    @DisplayName("Test Get Escalation Events")
    void testGetEscalationEvents() {
        var escalations = incidentLogger.getEscalationEvents(testIncidentId);

        assertNotNull(escalations);
        // High severity incident should have initial escalation
        assertFalse(escalations.isEmpty());
    }

    @Test
    @Order(20)
    @DisplayName("Test Critical Incident with Escalation")
    void testCriticalIncidentEscalation() {
        var incident = incidentLogger.createIncident(
            IncidentResponseLogger.IncidentType.DATA_BREACH,
            IncidentResponseLogger.IncidentSeverity.CRITICAL,
            "Potential Data Breach",
            "Unauthorized data access detected",
            "siem-system",
            "database-server"
        );

        assertNotNull(incident);
        assertEquals(IncidentResponseLogger.IncidentSeverity.CRITICAL, incident.getSeverity());

        // Critical incidents should trigger escalation
        var escalations = incidentLogger.getEscalationEvents(incident.getIncidentId());
        assertFalse(escalations.isEmpty());
    }
}
