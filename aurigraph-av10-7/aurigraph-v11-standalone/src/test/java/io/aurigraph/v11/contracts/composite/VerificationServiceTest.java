package io.aurigraph.v11.contracts.composite;

import io.aurigraph.v11.ServiceTestBase;
import io.aurigraph.v11.contracts.composite.VerificationService.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Verification Service inner classes and records
 *
 * Tests the workflow management classes, status enums, and result records.
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Unit Tests)
 * @author Aurigraph V12 Development Team
 */
@DisplayName("Verification Service Unit Tests")
class VerificationServiceTest extends ServiceTestBase {

    @Nested
    @DisplayName("VerificationWorkflow Tests")
    class VerificationWorkflowTests {

        @Test
        @DisplayName("Should create workflow with required parameters")
        void shouldCreateWorkflowWithRequiredParameters() {
            // Given
            String workflowId = "WF-001";
            String compositeId = "CT-001";
            String assetType = "REAL_ESTATE";
            VerificationLevel level = VerificationLevel.BASIC;
            int verifierCount = 3;
            String payerAddress = "0xpayer123";

            // When
            VerificationWorkflow workflow = new VerificationWorkflow(
                workflowId, compositeId, assetType, level, verifierCount, payerAddress
            );

            // Then
            assertNotNull(workflow);
            assertEquals(workflowId, workflow.getWorkflowId());
            assertEquals(compositeId, workflow.getCompositeId());
            assertEquals(assetType, workflow.getAssetType());
            assertEquals(level, workflow.getRequiredLevel());
            assertEquals(verifierCount, workflow.getVerifierCount());
            assertEquals(payerAddress, workflow.getPayerAddress());
            assertEquals(WorkflowStatus.CREATED, workflow.getStatus());
            assertNotNull(workflow.getCreatedAt());
            assertNotNull(workflow.getExpiresAt());
            assertTrue(workflow.getExpiresAt().isAfter(workflow.getCreatedAt()));
        }

        @Test
        @DisplayName("Should track verification results")
        void shouldTrackVerificationResults() {
            // Given
            VerificationWorkflow workflow = createTestWorkflow();
            VerificationResult result = createTestResult("verifier-001", true);

            // When
            workflow.addVerificationResult("verifier-001", result);

            // Then
            assertEquals(1, workflow.getSubmittedCount());
            assertTrue(workflow.hasVerifierSubmitted("verifier-001"));
            assertFalse(workflow.hasVerifierSubmitted("verifier-002"));
        }

        @Test
        @DisplayName("Should calculate positive and negative counts")
        void shouldCalculatePositiveAndNegativeCounts() {
            // Given
            VerificationWorkflow workflow = createTestWorkflow();
            workflow.addVerificationResult("v1", createTestResult("v1", true));
            workflow.addVerificationResult("v2", createTestResult("v2", true));
            workflow.addVerificationResult("v3", createTestResult("v3", false));

            // Then
            assertEquals(3, workflow.getSubmittedCount());
            assertEquals(2, workflow.getPositiveCount());
            assertEquals(1, workflow.getNegativeCount());
        }

        @Test
        @DisplayName("Should update workflow status")
        void shouldUpdateWorkflowStatus() {
            // Given
            VerificationWorkflow workflow = createTestWorkflow();

            // When
            workflow.setStatus(WorkflowStatus.IN_PROGRESS);

            // Then
            assertEquals(WorkflowStatus.IN_PROGRESS, workflow.getStatus());
        }

        @Test
        @DisplayName("Should set completed timestamp and final level")
        void shouldSetCompletedTimestampAndFinalLevel() {
            // Given
            VerificationWorkflow workflow = createTestWorkflow();
            Instant completedAt = Instant.now();
            VerificationLevel finalLevel = VerificationLevel.ENHANCED;

            // When
            workflow.setCompletedAt(completedAt);
            workflow.setFinalLevel(finalLevel);
            workflow.setStatus(WorkflowStatus.COMPLETED);

            // Then
            assertEquals(completedAt, workflow.getCompletedAt());
            assertEquals(finalLevel, workflow.getFinalLevel());
            assertEquals(WorkflowStatus.COMPLETED, workflow.getStatus());
        }

        @Test
        @DisplayName("Should get highest positive verification level")
        void shouldGetHighestPositiveLevel() {
            // Given
            VerificationWorkflow workflow = createTestWorkflow();
            workflow.addVerificationResult("v1", createTestResultWithLevel("v1", true, VerificationLevel.BASIC));
            workflow.addVerificationResult("v2", createTestResultWithLevel("v2", true, VerificationLevel.ENHANCED));
            workflow.addVerificationResult("v3", createTestResultWithLevel("v3", false, VerificationLevel.INSTITUTIONAL));

            // Then
            VerificationLevel highest = workflow.getHighestPositiveLevel();
            assertEquals(VerificationLevel.ENHANCED, highest);
        }

        private VerificationWorkflow createTestWorkflow() {
            return new VerificationWorkflow(
                "WF-TEST-001", "CT-TEST-001", "REAL_ESTATE",
                VerificationLevel.BASIC, 3, "0xpayer"
            );
        }

        private VerificationResult createTestResult(String verifierId, boolean verified) {
            return createTestResultWithLevel(verifierId, verified, VerificationLevel.BASIC);
        }

        private VerificationResult createTestResultWithLevel(String verifierId, boolean verified,
                                                              VerificationLevel level) {
            return new VerificationResult(
                "VR-" + verifierId, verifierId, "CT-TEST-001",
                verified, level, "Test result", Instant.now()
            );
        }
    }

    @Nested
    @DisplayName("WorkflowStatus Tests")
    class WorkflowStatusTests {

        @Test
        @DisplayName("Should have all expected workflow statuses")
        void shouldHaveAllExpectedStatuses() {
            // Given
            WorkflowStatus[] statuses = WorkflowStatus.values();

            // Then
            assertEquals(7, statuses.length);
            assertStatusExists(WorkflowStatus.CREATED);
            assertStatusExists(WorkflowStatus.PENDING_VERIFIERS);
            assertStatusExists(WorkflowStatus.IN_PROGRESS);
            assertStatusExists(WorkflowStatus.COMPLETED);
            assertStatusExists(WorkflowStatus.REJECTED);
            assertStatusExists(WorkflowStatus.CANCELLED);
            assertStatusExists(WorkflowStatus.EXPIRED);
        }

        private void assertStatusExists(WorkflowStatus status) {
            assertNotNull(status);
            assertNotNull(status.name());
        }
    }

    @Nested
    @DisplayName("AuditAction Tests")
    class AuditActionTests {

        @Test
        @DisplayName("Should have all expected audit actions")
        void shouldHaveAllExpectedAuditActions() {
            // Given
            AuditAction[] actions = AuditAction.values();

            // Then
            assertTrue(actions.length >= 5);
            assertActionExists(AuditAction.WORKFLOW_CREATED);
            assertActionExists(AuditAction.VERIFIERS_REQUESTED);
            assertActionExists(AuditAction.RESULT_SUBMITTED);
            assertActionExists(AuditAction.CONSENSUS_REACHED);
        }

        private void assertActionExists(AuditAction action) {
            assertNotNull(action);
            assertNotNull(action.name());
        }
    }

    @Nested
    @DisplayName("AuditEntry Record Tests")
    class AuditEntryTests {

        @Test
        @DisplayName("Should create audit entry record")
        void shouldCreateAuditEntryRecord() {
            // Given
            String entryId = "AE-001";
            String workflowId = "WF-001";
            AuditAction action = AuditAction.WORKFLOW_CREATED;
            String actor = "system";
            String details = "Workflow created successfully";
            Instant timestamp = Instant.now();

            // When
            AuditEntry entry = new AuditEntry(
                entryId, workflowId, action, actor, details, timestamp
            );

            // Then
            assertEquals(entryId, entry.entryId());
            assertEquals(workflowId, entry.workflowId());
            assertEquals(action, entry.action());
            assertEquals(actor, entry.actor());
            assertEquals(details, entry.details());
            assertEquals(timestamp, entry.timestamp());
        }
    }

    @Nested
    @DisplayName("SubmissionResult Record Tests")
    class SubmissionResultTests {

        @Test
        @DisplayName("Should create successful submission result")
        void shouldCreateSuccessfulSubmissionResult() {
            // Given
            ConsensusResult consensus = new ConsensusResult(
                false, null, "Awaiting more submissions"
            );

            // When
            SubmissionResult result = new SubmissionResult(true, "Submitted successfully", consensus);

            // Then
            assertTrue(result.success());
            assertEquals("Submitted successfully", result.message());
            assertNotNull(result.consensus());
            assertFalse(result.consensus().isReached());
        }

        @Test
        @DisplayName("Should create failed submission result")
        void shouldCreateFailedSubmissionResult() {
            // When
            SubmissionResult result = new SubmissionResult(false, "Workflow not found", null);

            // Then
            assertFalse(result.success());
            assertEquals("Workflow not found", result.message());
            assertNull(result.consensus());
        }
    }

    @Nested
    @DisplayName("ConsensusResult Record Tests")
    class ConsensusResultTests {

        @Test
        @DisplayName("Should create consensus reached result")
        void shouldCreateConsensusReachedResult() {
            // When
            ConsensusResult result = new ConsensusResult(
                true, VerificationLevel.ENHANCED, "Consensus achieved with 2/3 verifiers"
            );

            // Then
            assertTrue(result.isReached());
            assertEquals(VerificationLevel.ENHANCED, result.getConsensusLevel());
            assertEquals("Consensus achieved with 2/3 verifiers", result.getMessage());
        }

        @Test
        @DisplayName("Should create consensus not reached result")
        void shouldCreateConsensusNotReachedResult() {
            // When
            ConsensusResult result = new ConsensusResult(
                false, null, "Awaiting more submissions"
            );

            // Then
            assertFalse(result.isReached());
            assertNull(result.getConsensusLevel());
            assertEquals("Awaiting more submissions", result.getMessage());
        }
    }

    @Nested
    @DisplayName("WorkflowStatusResponse Record Tests")
    class WorkflowStatusResponseTests {

        @Test
        @DisplayName("Should create workflow status response")
        void shouldCreateWorkflowStatusResponse() {
            // Given
            Instant createdAt = Instant.now().minusSeconds(3600);
            Instant completedAt = Instant.now();

            // When
            WorkflowStatusResponse response = new WorkflowStatusResponse(
                "WF-001",
                "CT-001",
                WorkflowStatus.COMPLETED,
                VerificationLevel.BASIC,
                3,
                3,
                2,
                1,
                createdAt,
                completedAt,
                VerificationLevel.BASIC,
                100.0
            );

            // Then
            assertEquals("WF-001", response.workflowId());
            assertEquals("CT-001", response.compositeId());
            assertEquals(WorkflowStatus.COMPLETED, response.status());
            assertEquals(VerificationLevel.BASIC, response.requiredLevel());
            assertEquals(3, response.requiredVerifiers());
            assertEquals(3, response.submittedCount());
            assertEquals(2, response.positiveCount());
            assertEquals(1, response.negativeCount());
            assertEquals(createdAt, response.createdAt());
            assertEquals(completedAt, response.completedAt());
            assertEquals(VerificationLevel.BASIC, response.finalLevel());
            assertEquals(100.0, response.progressPercent());
        }
    }

    @Nested
    @DisplayName("VerificationStats Record Tests")
    class VerificationStatsTests {

        @Test
        @DisplayName("Should create verification stats")
        void shouldCreateVerificationStats() {
            // Given
            Map<WorkflowStatus, Long> statusDist = new HashMap<>();
            statusDist.put(WorkflowStatus.COMPLETED, 50L);
            statusDist.put(WorkflowStatus.IN_PROGRESS, 10L);

            Map<VerificationLevel, Long> levelDist = new HashMap<>();
            levelDist.put(VerificationLevel.BASIC, 30L);
            levelDist.put(VerificationLevel.ENHANCED, 20L);

            // When
            VerificationStats stats = new VerificationStats(
                100, 10, 80, statusDist, levelDist, 85.5, 3600000
            );

            // Then
            assertEquals(100, stats.totalWorkflows());
            assertEquals(10, stats.activeWorkflows());
            assertEquals(80, stats.completedWorkflows());
            assertEquals(statusDist, stats.statusDistribution());
            assertEquals(levelDist, stats.levelDistribution());
            assertEquals(85.5, stats.successRate());
            assertEquals(3600000, stats.averageCompletionTimeMs());
        }
    }
}
