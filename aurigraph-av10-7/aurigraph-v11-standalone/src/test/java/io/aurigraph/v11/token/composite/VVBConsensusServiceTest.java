package io.aurigraph.v11.token.composite;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for VVBConsensusService
 *
 * Tests cover:
 * - VVB verifier registration
 * - Verification request submission
 * - Approval processing
 * - Consensus achievement
 * - Quantum signature validation
 *
 * Target: 40+ tests for VVB consensus
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class VVBConsensusServiceTest {

    @Inject
    VVBConsensusService vvbService;

    @Inject
    CompositeMerkleService merkleService;

    // Test data
    private static String testVerifierId1;
    private static String testVerifierId2;
    private static String testVerifierId3;
    private static String testVerifierId4;

    @BeforeAll
    static void setupTestData() {
        testVerifierId1 = "VVB-" + UUID.randomUUID().toString().substring(0, 8);
        testVerifierId2 = "VVB-" + UUID.randomUUID().toString().substring(0, 8);
        testVerifierId3 = "VVB-" + UUID.randomUUID().toString().substring(0, 8);
        testVerifierId4 = "VVB-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ==================== VERIFIER REGISTRATION TESTS ====================

    @Test
    @Order(1)
    @DisplayName("Test 1: Register new verifier")
    void testRegisterVerifier() {
        String verifierId = "VVB-REG-" + UUID.randomUUID().toString().substring(0, 8);

        VVBConsensusService.VVBVerifier verifier = vvbService.registerVerifier(
                verifierId, "Test Verifier", null
        );

        assertNotNull(verifier);
        assertEquals(verifierId, verifier.verifierId);
        assertEquals("Test Verifier", verifier.name);
        assertNotNull(verifier.keyPair);
        assertEquals(VVBConsensusService.VVBVerifierStatus.ACTIVE, verifier.status);
        assertNotNull(verifier.registeredAt);
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Register multiple verifiers")
    void testRegisterMultipleVerifiers() {
        // Register test verifiers for subsequent tests
        VVBConsensusService.VVBVerifier v1 = vvbService.registerVerifier(testVerifierId1, "Verifier 1", null);
        VVBConsensusService.VVBVerifier v2 = vvbService.registerVerifier(testVerifierId2, "Verifier 2", null);
        VVBConsensusService.VVBVerifier v3 = vvbService.registerVerifier(testVerifierId3, "Verifier 3", null);
        VVBConsensusService.VVBVerifier v4 = vvbService.registerVerifier(testVerifierId4, "Verifier 4", null);

        assertNotNull(v1);
        assertNotNull(v2);
        assertNotNull(v3);
        assertNotNull(v4);
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Reject duplicate verifier ID")
    void testRejectDuplicateVerifier() {
        String verifierId = "VVB-DUP-" + UUID.randomUUID().toString().substring(0, 8);
        vvbService.registerVerifier(verifierId, "First", null);

        assertThrows(IllegalArgumentException.class, () -> {
            vvbService.registerVerifier(verifierId, "Duplicate", null);
        });
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: Get registered verifiers")
    void testGetRegisteredVerifiers() {
        List<VVBConsensusService.VVBVerifier> verifiers = vvbService.getRegisteredVerifiers();

        assertNotNull(verifiers);
        assertFalse(verifiers.isEmpty());
    }

    @Test
    @Order(5)
    @DisplayName("Test 5: Get verifier by ID")
    void testGetVerifierById() {
        VVBConsensusService.VVBVerifier verifier = vvbService.getVerifier(testVerifierId1);

        assertNotNull(verifier);
        assertEquals(testVerifierId1, verifier.verifierId);
    }

    @Test
    @Order(6)
    @DisplayName("Test 6: Get non-existent verifier returns null")
    void testGetNonExistentVerifier() {
        VVBConsensusService.VVBVerifier verifier = vvbService.getVerifier("NON-EXISTENT");

        assertNull(verifier);
    }

    @Test
    @Order(7)
    @DisplayName("Test 7: Deactivate verifier")
    void testDeactivateVerifier() {
        String verifierId = "VVB-DEACT-" + UUID.randomUUID().toString().substring(0, 8);
        vvbService.registerVerifier(verifierId, "Deactivate Test", null);

        vvbService.deactivateVerifier(verifierId);

        VVBConsensusService.VVBVerifier verifier = vvbService.getVerifier(verifierId);
        assertEquals(VVBConsensusService.VVBVerifierStatus.INACTIVE, verifier.status);
    }

    // ==================== VERIFICATION REQUEST TESTS ====================

    @Test
    @Order(10)
    @DisplayName("Test 10: Submit composite token for verification")
    void testSubmitForVerification() {
        CompositeToken composite = createTestCompositeToken();

        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        assertNotNull(request);
        assertNotNull(request.requestId);
        assertTrue(request.requestId.startsWith("VVB-"));
        assertEquals(composite.compositeTokenId, request.compositeTokenId);
        assertEquals(3, request.threshold);
        assertEquals(VVBConsensusService.VerificationStatus.PENDING, request.status);
    }

    @Test
    @Order(11)
    @DisplayName("Test 11: Reject null composite token")
    void testRejectNullCompositeToken() {
        assertThrows(Exception.class, () -> {
            vvbService.submitForVerification(null, 3).await().indefinitely();
        });
    }

    @Test
    @Order(12)
    @DisplayName("Test 12: Reject insufficient verifiers for threshold")
    void testRejectInsufficientVerifiers() {
        CompositeToken composite = createTestCompositeToken();

        // Request threshold higher than registered verifiers
        assertThrows(Exception.class, () -> {
            vvbService.submitForVerification(composite, 100).await().indefinitely();
        });
    }

    @Test
    @Order(13)
    @DisplayName("Test 13: Get pending requests")
    void testGetPendingRequests() {
        CompositeToken composite = createTestCompositeToken();
        vvbService.submitForVerification(composite, 3).await().indefinitely();

        List<VVBConsensusService.VerificationRequest> pending = vvbService.getPendingRequests();

        assertNotNull(pending);
        assertFalse(pending.isEmpty());
    }

    // ==================== APPROVAL PROCESSING TESTS ====================

    @Test
    @Order(20)
    @DisplayName("Test 20: Process single approval")
    void testProcessSingleApproval() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        VVBConsensusService.ApprovalResult result = vvbService.processApproval(
                request.requestId, testVerifierId1, true, "Approved"
        ).await().indefinitely();

        assertNotNull(result);
        assertEquals(request.requestId, result.requestId);
        assertEquals(testVerifierId1, result.verifierId);
        assertTrue(result.approved);
        assertEquals(1, result.currentApprovals);
        assertFalse(result.consensusReached); // Need 3 approvals
    }

    @Test
    @Order(21)
    @DisplayName("Test 21: Process rejection")
    void testProcessRejection() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        VVBConsensusService.ApprovalResult result = vvbService.processApproval(
                request.requestId, testVerifierId1, false, "Rejected - documentation issues"
        ).await().indefinitely();

        assertNotNull(result);
        assertFalse(result.approved);
        assertEquals(1, result.currentRejections);
    }

    @Test
    @Order(22)
    @DisplayName("Test 22: Reach consensus with 3 approvals")
    void testReachConsensus() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        // First two approvals
        vvbService.processApproval(request.requestId, testVerifierId1, true, null).await().indefinitely();
        vvbService.processApproval(request.requestId, testVerifierId2, true, null).await().indefinitely();

        // Third approval should reach consensus
        VVBConsensusService.ApprovalResult result = vvbService.processApproval(
                request.requestId, testVerifierId3, true, null
        ).await().indefinitely();

        assertTrue(result.consensusReached);
        assertEquals(3, result.currentApprovals);
    }

    @Test
    @Order(23)
    @DisplayName("Test 23: Prevent duplicate vote from same verifier")
    void testPreventDuplicateVote() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        vvbService.processApproval(request.requestId, testVerifierId1, true, null).await().indefinitely();

        // Try to vote again
        assertThrows(Exception.class, () -> {
            vvbService.processApproval(request.requestId, testVerifierId1, true, null).await().indefinitely();
        });
    }

    @Test
    @Order(24)
    @DisplayName("Test 24: Reject vote from non-existent verifier")
    void testRejectNonExistentVerifier() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        assertThrows(Exception.class, () -> {
            vvbService.processApproval(request.requestId, "NON-EXISTENT", true, null).await().indefinitely();
        });
    }

    @Test
    @Order(25)
    @DisplayName("Test 25: Reject vote for non-existent request")
    void testRejectNonExistentRequest() {
        assertThrows(Exception.class, () -> {
            vvbService.processApproval("NON-EXISTENT-REQ", testVerifierId1, true, null).await().indefinitely();
        });
    }

    @Test
    @Order(26)
    @DisplayName("Test 26: Reject vote from inactive verifier")
    void testRejectInactiveVerifier() {
        String inactiveVerifierId = "VVB-INACTIVE-" + UUID.randomUUID().toString().substring(0, 8);
        vvbService.registerVerifier(inactiveVerifierId, "Inactive Verifier", null);
        vvbService.deactivateVerifier(inactiveVerifierId);

        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        assertThrows(Exception.class, () -> {
            vvbService.processApproval(request.requestId, inactiveVerifierId, true, null).await().indefinitely();
        });
    }

    // ==================== VERIFICATION STATUS TESTS ====================

    @Test
    @Order(30)
    @DisplayName("Test 30: Get verification status - pending")
    void testGetVerificationStatusPending() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        VVBConsensusService.VerificationStatusResult status = vvbService.getVerificationStatus(
                request.requestId
        ).await().indefinitely();

        assertNotNull(status);
        assertEquals(VVBConsensusService.VerificationStatus.PENDING, status.status);
        assertEquals(0, status.approvalCount);
    }

    @Test
    @Order(31)
    @DisplayName("Test 31: Get verification status - approved")
    void testGetVerificationStatusApproved() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        // Reach consensus
        vvbService.processApproval(request.requestId, testVerifierId1, true, null).await().indefinitely();
        vvbService.processApproval(request.requestId, testVerifierId2, true, null).await().indefinitely();
        vvbService.processApproval(request.requestId, testVerifierId3, true, null).await().indefinitely();

        VVBConsensusService.VerificationStatusResult status = vvbService.getVerificationStatus(
                request.requestId
        ).await().indefinitely();

        assertEquals(VVBConsensusService.VerificationStatus.APPROVED, status.status);
        assertEquals(3, status.approvalCount);
        assertNotNull(status.aggregateSignature);
    }

    @Test
    @Order(32)
    @DisplayName("Test 32: Get status for non-existent request")
    void testGetStatusNonExistentRequest() {
        assertThrows(Exception.class, () -> {
            vvbService.getVerificationStatus("NON-EXISTENT").await().indefinitely();
        });
    }

    // ==================== AGGREGATE SIGNATURE TESTS ====================

    @Test
    @Order(40)
    @DisplayName("Test 40: Verify aggregate signature")
    void testVerifyAggregateSignature() {
        CompositeToken composite = createTestCompositeToken();
        VVBConsensusService.VerificationRequest request = vvbService.submitForVerification(
                composite, 3
        ).await().indefinitely();

        // Reach consensus
        vvbService.processApproval(request.requestId, testVerifierId1, true, null).await().indefinitely();
        vvbService.processApproval(request.requestId, testVerifierId2, true, null).await().indefinitely();
        vvbService.processApproval(request.requestId, testVerifierId3, true, null).await().indefinitely();

        boolean valid = vvbService.verifyAggregateSignature(request.requestId);

        assertTrue(valid);
    }

    @Test
    @Order(41)
    @DisplayName("Test 41: Verify aggregate signature for non-existent request returns false")
    void testVerifyAggregateSignatureNonExistent() {
        boolean valid = vvbService.verifyAggregateSignature("NON-EXISTENT");

        assertFalse(valid);
    }

    // ==================== METRICS TESTS ====================

    @Test
    @Order(50)
    @DisplayName("Test 50: Get VVB metrics")
    void testGetVVBMetrics() {
        VVBConsensusService.VVBMetrics metrics = vvbService.getMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.approvalCount >= 0);
        assertTrue(metrics.consensusCount >= 0);
        assertTrue(metrics.rejectionCount >= 0);
        assertTrue(metrics.activeVerifiers > 0);
    }

    @Test
    @Order(51)
    @DisplayName("Test 51: Metrics toString format")
    void testVVBMetricsToString() {
        VVBConsensusService.VVBMetrics metrics = vvbService.getMetrics();

        String str = metrics.toString();
        assertNotNull(str);
        assertTrue(str.contains("VVBMetrics"));
    }

    // ==================== INNER CLASS TESTS ====================

    @Test
    @Order(60)
    @DisplayName("Test 60: VVBVote structure")
    void testVVBVoteStructure() {
        VVBConsensusService.VVBVote vote = new VVBConsensusService.VVBVote(
                "verifier-1", true, "Test notes", Instant.now()
        );

        assertEquals("verifier-1", vote.verifierId);
        assertTrue(vote.approved);
        assertEquals("Test notes", vote.notes);
        assertNotNull(vote.timestamp);
    }

    @Test
    @Order(61)
    @DisplayName("Test 61: VerificationResult structure")
    void testVerificationResultStructure() {
        VVBConsensusService.VerificationResult result = new VVBConsensusService.VerificationResult(
                "req-1", "CT-123", true, 3, 1, "signature", Instant.now()
        );

        assertEquals("req-1", result.requestId);
        assertEquals("CT-123", result.compositeTokenId);
        assertTrue(result.approved);
        assertEquals(3, result.approvalCount);
        assertEquals(1, result.rejectionCount);
        assertNotNull(result.aggregateSignature);
    }

    @Test
    @Order(62)
    @DisplayName("Test 62: ApprovalResult structure")
    void testApprovalResultStructure() {
        VVBConsensusService.ApprovalResult result = new VVBConsensusService.ApprovalResult(
                "req-1", "verifier-1", true, true, false, 3, 0, 100
        );

        assertEquals("req-1", result.requestId);
        assertEquals("verifier-1", result.verifierId);
        assertTrue(result.approved);
        assertTrue(result.consensusReached);
        assertFalse(result.consensusFailed);
        assertEquals(3, result.currentApprovals);
        assertEquals(100, result.processingTimeMs);
    }

    // ==================== HELPER METHODS ====================

    private CompositeToken createTestCompositeToken() {
        CompositeToken composite = new CompositeToken();
        composite.compositeTokenId = "CT-" + UUID.randomUUID();
        composite.primaryTokenId = "PT-REAL_ESTATE-" + UUID.randomUUID();
        composite.owner = "owner-" + UUID.randomUUID();
        composite.merkleRoot = merkleService.sha256Hash("test-merkle-root");
        composite.digitalTwinHash = merkleService.sha256Hash("test-digital-twin");
        composite.totalValue = new BigDecimal("1000000.00");
        composite.status = CompositeToken.CompositeTokenStatus.CREATED;
        composite.createdAt = Instant.now();
        composite.vvbThreshold = 3;
        return composite;
    }
}
