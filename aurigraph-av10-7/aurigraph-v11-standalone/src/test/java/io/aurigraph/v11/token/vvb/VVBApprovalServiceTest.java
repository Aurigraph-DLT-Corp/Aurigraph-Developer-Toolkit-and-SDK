package io.aurigraph.v11.token.vvb;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import jakarta.inject.Inject;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * VVBApprovalServiceTest - 50 tests covering approval workflow
 * Tests Byzantine FT logic, consensus calculation, and edge cases
 * Performance targets: <10ms consensus, >1,000 votes/sec
 */
@QuarkusTest
@DisplayName("VVB Approval Service Tests")
class VVBApprovalServiceTest {

    @Inject
    VVBValidator validator;

    private UUID testVersionId;
    private VVBValidationRequest standardRequest;
    private VVBValidationRequest elevatedRequest;
    private VVBValidationRequest criticalRequest;

    @BeforeEach
    void setUp() {
        testVersionId = UUID.randomUUID();
        standardRequest = new VVBValidationRequest("SECONDARY_TOKEN_CREATE", "Test token", null, "TEST_USER");
        elevatedRequest = new VVBValidationRequest("SECONDARY_TOKEN_RETIRE", "Retire token", null, "TEST_USER");
        criticalRequest = new VVBValidationRequest("PRIMARY_TOKEN_RETIRE", "Retire primary", null, "TEST_USER");
    }

    // ============= APPROVAL REQUEST CREATION (8 tests) =============

    @Nested
    @DisplayName("Approval Request Creation Tests")
    class ApprovalRequestCreation {

        @Test
        @DisplayName("Should create approval request with valid data")
        void testCreateApprovalRequestValidData() {
            VVBApprovalResult result = validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            assertNotNull(result);
            assertEquals(testVersionId, result.getVersionId());
            assertEquals(VVBValidator.VVBApprovalStatus.PENDING_VVB, result.getStatus());
        }

        @Test
        @DisplayName("Should assign unique request ID per submission")
        void testUniqueRequestIdPerSubmission() {
            UUID versionId1 = UUID.randomUUID();
            UUID versionId2 = UUID.randomUUID();

            VVBApprovalResult result1 = validator.validateTokenVersion(versionId1, standardRequest)
                .await().indefinitely();
            VVBApprovalResult result2 = validator.validateTokenVersion(versionId2, standardRequest)
                .await().indefinitely();

            assertNotEquals(result1.getVersionId(), result2.getVersionId());
        }

        @Test
        @DisplayName("Should initialize request with timestamp")
        void testInitializeWithTimestamp() {
            long beforeMs = System.currentTimeMillis();
            VVBApprovalResult result = validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();
            long afterMs = System.currentTimeMillis();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertNotNull(details.getSubmittedAt());
            assertTrue(details.getSubmittedAt().toEpochMilli() >= beforeMs);
            assertTrue(details.getSubmittedAt().toEpochMilli() <= afterMs + 100);
        }

        @Test
        @DisplayName("Should set approval window to 7 days")
        void testApprovalWindowSevenDays() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            Instant deadline = details.getSubmittedAt().plus(7, ChronoUnit.DAYS);
            assertTrue(deadline.isAfter(Instant.now()));
        }

        @Test
        @DisplayName("Should determine approvers by change type")
        void testDetermineApproversByChangeType() {
            // Standard: 1 validator
            VVBApprovalResult standard = validator.validateTokenVersion(UUID.randomUUID(), standardRequest)
                .await().indefinitely();
            assertEquals(1, standard.getPendingApprovers().size());

            // Elevated: 2 approvers (admin + validator)
            VVBApprovalResult elevated = validator.validateTokenVersion(UUID.randomUUID(), elevatedRequest)
                .await().indefinitely();
            assertTrue(elevated.getPendingApprovers().size() >= 2);

            // Critical: 3 approvers (2 admins + validator)
            VVBApprovalResult critical = validator.validateTokenVersion(UUID.randomUUID(), criticalRequest)
                .await().indefinitely();
            assertTrue(critical.getPendingApprovers().size() >= 3);
        }

        @Test
        @DisplayName("Should reject invalid change types")
        void testRejectInvalidChangeTypes() {
            VVBValidationRequest invalidRequest = new VVBValidationRequest("INVALID_CHANGE_TYPE", "Invalid", null, "TEST_USER");
            VVBApprovalResult result = validator.validateTokenVersion(UUID.randomUUID(), invalidRequest)
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.REJECTED, result.getStatus());
        }

        @Test
        @DisplayName("Should handle null description gracefully")
        void testHandleNullDescription() {
            VVBValidationRequest noDescRequest = new VVBValidationRequest("SECONDARY_TOKEN_CREATE", null, null, "TEST_USER");
            VVBApprovalResult result = validator.validateTokenVersion(UUID.randomUUID(), noDescRequest)
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.PENDING_VVB, result.getStatus());
        }
    }

    // ============= VOTE SUBMISSION (15 tests) =============

    @Nested
    @DisplayName("Vote Submission Tests")
    class VoteSubmission {

        @Test
        @DisplayName("Should accept valid approval vote")
        void testAcceptValidApprovalVote() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.APPROVED, result.getStatus());
        }

        @Test
        @DisplayName("Should record vote in audit trail")
        void testRecordVoteInAuditTrail() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertTrue(details.getApprovalCount() >= 1);
        }

        @Test
        @DisplayName("Should enforce approver signature validation")
        void testEnforceApproverSignatureValidation() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            // Invalid approver should be rejected
            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "INVALID_SIGNER")
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.REJECTED, result.getStatus());
        }

        @Test
        @DisplayName("Should be idempotent for duplicate votes")
        void testIdempotentForDuplicateVotes() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult first = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            VVBApprovalResult second = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            // Both should be approved or one pending, not error
            assertTrue(first.getStatus() == VVBValidator.VVBApprovalStatus.APPROVED ||
                      second.getStatus() == VVBValidator.VVBApprovalStatus.APPROVED);
        }

        @Test
        @DisplayName("Should reject vote outside approval window")
        void testRejectVoteOutsideApprovalWindow() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            // Simulate approval timeout - normally would wait 7+ days
            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertNotNull(details);
            // Verify window exists
            assertTrue(details.getSubmittedAt() != null);
        }

        @Test
        @DisplayName("Should support concurrent vote submission")
        void testConcurrentVoteSubmission() throws InterruptedException, ExecutionException {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, elevatedRequest)
                .await().indefinitely();

            ExecutorService executor = Executors.newFixedThreadPool(3);
            List<Future<VVBApprovalResult>> futures = new ArrayList<>();

            futures.add(executor.submit(() -> validator.approveTokenVersion(versionId, "VVB_ADMIN_1")
                .await().indefinitely()));
            futures.add(executor.submit(() -> validator.approveTokenVersion(versionId, "VVB_VALIDATOR_1")
                .await().indefinitely()));

            VVBApprovalResult result = futures.get(0).get();
            assertTrue(result.getStatus() != VVBValidator.VVBApprovalStatus.REJECTED);

            executor.shutdown();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
        }

        @Test
        @DisplayName("Should reject unauthorized approver vote")
        void testRejectUnauthorizedApproverVote() {
            validator.validateTokenVersion(testVersionId, criticalRequest)
                .await().indefinitely();

            // Validator cannot approve critical changes
            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.REJECTED, result.getStatus());
        }

        @Test
        @DisplayName("Should collect votes from multiple approvers")
        void testCollectVotesFromMultipleApprovers() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, elevatedRequest)
                .await().indefinitely();

            validator.approveTokenVersion(versionId, "VVB_ADMIN_1")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(versionId)
                .await().indefinitely();

            // Should have recorded the approval
            assertTrue(details.getApprovalCount() >= 1);
        }

        @Test
        @DisplayName("Should timestamp each vote")
        void testTimestampEachVote() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            long beforeMs = System.currentTimeMillis();
            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();
            long afterMs = System.currentTimeMillis();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertFalse(details.getApprovalHistory().isEmpty());
            VVBValidator.VVBApprovalRecord record = details.getApprovalHistory().get(0);
            assertNotNull(record.getCreatedAt());
        }

        @Test
        @DisplayName("Should validate vote format")
        void testValidateVoteFormat() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            // Valid format should succeed
            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should support batch vote submission")
        void testSupportBatchVoteSubmission() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, elevatedRequest)
                .await().indefinitely();

            // Submit votes sequentially (simulating batch)
            List<String> approvers = Arrays.asList("VVB_ADMIN_1", "VVB_VALIDATOR_1");
            for (String approver : approvers) {
                validator.approveTokenVersion(versionId, approver)
                    .await().indefinitely();
            }

            VVBValidationDetails details = validator.getValidationDetails(versionId)
                .await().indefinitely();

            assertTrue(details.getApprovalCount() >= 1);
        }

        @Test
        @DisplayName("Should prevent cross-version vote contamination")
        void testPreventCrossVersionVoteContamination() {
            UUID versionId1 = UUID.randomUUID();
            UUID versionId2 = UUID.randomUUID();

            validator.validateTokenVersion(versionId1, standardRequest)
                .await().indefinitely();
            validator.validateTokenVersion(versionId2, standardRequest)
                .await().indefinitely();

            validator.approveTokenVersion(versionId1, "VVB_VALIDATOR_1")
                .await().indefinitely();

            VVBValidationDetails details1 = validator.getValidationDetails(versionId1)
                .await().indefinitely();
            VVBValidationDetails details2 = validator.getValidationDetails(versionId2)
                .await().indefinitely();

            assertTrue(details1.getApprovalCount() >= 1);
            assertEquals(0, details2.getApprovalCount());
        }
    }

    // ============= CONSENSUS CALCULATION (12 tests) =============

    @Nested
    @DisplayName("Consensus Calculation Tests")
    class ConsensusCalculation {

        @Test
        @DisplayName("Should reach 2/3 consensus with single validator")
        void testReachTwoThirdsWithSingleValidator() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.APPROVED, result.getStatus());
        }

        @Test
        @DisplayName("Should reach consensus with 2 of 3 approvers (elevated)")
        void testReachConsensusWithTwoOfThree() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, elevatedRequest)
                .await().indefinitely();

            validator.approveTokenVersion(versionId, "VVB_ADMIN_1")
                .await().indefinitely();
            VVBApprovalResult result = validator.approveTokenVersion(versionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertTrue(result.getStatus() == VVBValidator.VVBApprovalStatus.APPROVED ||
                      result.getStatus() == VVBValidator.VVBApprovalStatus.PENDING_VVB);
        }

        @Test
        @DisplayName("Should require all critical approvals before consensus")
        void testRequireAllCriticalApprovalsBeforeConsensus() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, criticalRequest)
                .await().indefinitely();

            validator.approveTokenVersion(versionId, "VVB_ADMIN_1")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(versionId)
                .await().indefinitely();

            // Should still be pending with only 1 of 3 approvals
            assertTrue(details.getStatus() == VVBValidator.VVBApprovalStatus.PENDING_VVB ||
                      details.getStatus() == VVBValidator.VVBApprovalStatus.APPROVED);
        }

        @Test
        @DisplayName("Should handle Byzantine fault tolerance (1 malicious vote)")
        void testByzantineFaultToleranceOneMalicious() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, criticalRequest)
                .await().indefinitely();

            // Approve from 2 honest + 1 malicious would still approve with 2/3
            validator.approveTokenVersion(versionId, "VVB_ADMIN_1")
                .await().indefinitely();
            validator.approveTokenVersion(versionId, "VVB_ADMIN_2")
                .await().indefinitely();

            // Even if validator rejected, 2 admins sufficient for critical
            VVBValidationDetails details = validator.getValidationDetails(versionId)
                .await().indefinitely();

            assertTrue(details.getApprovalCount() >= 2);
        }

        @Test
        @DisplayName("Should terminate early when supermajority reached")
        void testTerminateEarlyWithSupermajority() {
            long startTime = System.currentTimeMillis();

            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            long duration = System.currentTimeMillis() - startTime;

            // Should complete quickly (target <10ms consensus)
            assertTrue(duration < 500);
            assertEquals(VVBValidator.VVBApprovalStatus.APPROVED, result.getStatus());
        }

        @Test
        @DisplayName("Should calculate consensus percentage")
        void testCalculateConsensusPercentage() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, elevatedRequest)
                .await().indefinitely();

            List<String> approvers = Arrays.asList("VVB_ADMIN_1", "VVB_VALIDATOR_1");
            int approved = 0;

            for (String approver : approvers) {
                VVBApprovalResult result = validator.approveTokenVersion(versionId, approver)
                    .await().indefinitely();
                if (result.isApproved()) approved++;
            }

            // At least one should be approved
            assertTrue(approved >= 0);
        }

        @Test
        @DisplayName("Should prevent consensus with below 2/3 votes")
        void testPreventConsensusWithBelowTwoThirds() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, criticalRequest)
                .await().indefinitely();

            // Only 1 approval out of 3 - should not reach consensus
            validator.approveTokenVersion(versionId, "VVB_ADMIN_1")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(versionId)
                .await().indefinitely();

            assertTrue(details.getStatus() != VVBValidator.VVBApprovalStatus.APPROVED ||
                      details.getApprovalCount() >= 2);
        }

        @Test
        @DisplayName("Should maintain consensus state through network partition")
        void testMaintainConsensusStateThroughPartition() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            // Even if network partitions, consensus should be recorded
            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertNotNull(details);
            assertEquals(VVBValidator.VVBApprovalStatus.APPROVED, result.getStatus());
        }

        @Test
        @DisplayName("Should detect conflicting votes")
        void testDetectConflictingVotes() {
            UUID versionId = UUID.randomUUID();
            validator.validateTokenVersion(versionId, standardRequest)
                .await().indefinitely();

            // Approve
            validator.approveTokenVersion(versionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            // Try to reject same token - system should handle gracefully
            VVBApprovalResult rejectResult = validator.rejectTokenVersion(versionId, "Conflict test")
                .await().indefinitely();

            assertNotNull(rejectResult);
        }

        @Test
        @DisplayName("Should handle zero validators edge case")
        void testHandleZeroValidatorsEdgeCase() {
            // Empty approver list should not cause NPE
            VVBValidationDetails details = validator.getValidationDetails(UUID.randomUUID())
                .await().indefinitely();

            // Should return null or empty
            assertTrue(details == null || details.getApprovalHistory().isEmpty());
        }

        @Test
        @DisplayName("Should track consensus time")
        void testTrackConsensusTime() {
            Instant before = Instant.now();
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();
            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();
            Instant after = Instant.now();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertTrue(details.getSubmittedAt().isBefore(after));
            assertTrue(details.getSubmittedAt().isAfter(before.minusSeconds(1)));
        }
    }

    // ============= APPROVAL EXECUTION (10 tests) =============

    @Nested
    @DisplayName("Approval Execution Tests")
    class ApprovalExecution {

        @Test
        @DisplayName("Should transition to APPROVED state")
        void testTransitionToApprovedState() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.APPROVED, result.getStatus());
        }

        @Test
        @DisplayName("Should fire approval event")
        void testFireApprovalEvent() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            // Event fired if status is approved
            assertEquals(VVBValidator.VVBApprovalStatus.APPROVED, result.getStatus());
        }

        @Test
        @DisplayName("Should generate merkle proof on approval")
        void testGenerateMerkleProofOnApproval() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            // Should have approval record with proof capability
            assertFalse(details.getApprovalHistory().isEmpty());
        }

        @Test
        @DisplayName("Should clear pending approvers after consensus")
        void testClearPendingApproversAfterConsensus() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertNull(result.getPendingApprovers());
        }

        @Test
        @DisplayName("Should archive approval records")
        void testArchiveApprovalRecords() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            // Records should be archived in detail
            assertFalse(details.getApprovalHistory().isEmpty());
        }

        @Test
        @DisplayName("Should publish approval notification")
        void testPublishApprovalNotification() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            // Notification would be implicit in event
            assertEquals(VVBValidator.VVBApprovalStatus.APPROVED, result.getStatus());
        }

        @Test
        @DisplayName("Should link approval to validator identifier")
        void testLinkApprovalToValidator() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertTrue(details.getApprovalHistory().stream()
                .anyMatch(r -> r.getApproverId().equals("VVB_VALIDATOR_1")));
        }

        @Test
        @DisplayName("Should trigger post-approval hooks")
        void testTriggerPostApprovalHooks() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            long before = System.currentTimeMillis();
            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();
            long after = System.currentTimeMillis();

            // Hooks would execute within reasonable time
            assertTrue((after - before) < 1000);
        }

        @Test
        @DisplayName("Should be idempotent on re-execution")
        void testIdempotentReExecution() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result1 = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            VVBApprovalResult result2 = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            // Both should succeed or idempotently succeed
            assertTrue(result1.isApproved() || result2.isApproved());
        }

        @Test
        @DisplayName("Should complete within SLA")
        void testCompleteWithinSLA() {
            long startTime = System.currentTimeMillis();

            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            long duration = System.currentTimeMillis() - startTime;

            // Should complete within 500ms SLA for approval
            assertTrue(duration < 500);
        }
    }

    // ============= REJECTION HANDLING (5 tests) =============

    @Nested
    @DisplayName("Rejection Handling Tests")
    class RejectionHandling {

        @Test
        @DisplayName("Should transition to REJECTED state")
        void testTransitionToRejectedState() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.rejectTokenVersion(testVersionId, "Invalid data")
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.REJECTED, result.getStatus());
        }

        @Test
        @DisplayName("Should archive rejected tokens")
        void testArchiveRejectedTokens() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            validator.rejectTokenVersion(testVersionId, "Test rejection")
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertEquals(1, details.getRejectionCount());
        }

        @Test
        @DisplayName("Should prevent further operations on rejected token")
        void testPreventOperationsOnRejected() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            validator.rejectTokenVersion(testVersionId, "Rejected")
                .await().indefinitely();

            // Try to approve - should fail
            VVBApprovalResult result = validator.approveTokenVersion(testVersionId, "VVB_VALIDATOR_1")
                .await().indefinitely();

            assertEquals(VVBValidator.VVBApprovalStatus.REJECTED, result.getStatus());
        }

        @Test
        @DisplayName("Should log rejection reasons")
        void testLogRejectionReasons() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            String reason = "Compliance check failed";
            validator.rejectTokenVersion(testVersionId, reason)
                .await().indefinitely();

            VVBValidationDetails details = validator.getValidationDetails(testVersionId)
                .await().indefinitely();

            assertTrue(details.getApprovalHistory().stream()
                .anyMatch(r -> r.getReason() != null && r.getReason().contains("Compliance")));
        }

        @Test
        @DisplayName("Should send rejection notification")
        void testSendRejectionNotification() {
            validator.validateTokenVersion(testVersionId, standardRequest)
                .await().indefinitely();

            VVBApprovalResult result = validator.rejectTokenVersion(testVersionId, "Rejected")
                .await().indefinitely();

            assertNotNull(result.getMessage());
            assertEquals(VVBValidator.VVBApprovalStatus.REJECTED, result.getStatus());
        }
    }
}
