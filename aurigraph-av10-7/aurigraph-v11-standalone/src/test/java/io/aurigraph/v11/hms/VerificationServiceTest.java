package io.aurigraph.v11.hms;

import io.aurigraph.v11.hms.models.VerificationTier;
import io.aurigraph.v11.hms.VerificationService.VerificationStatistics;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for VerificationService
 */
@QuarkusTest
public class VerificationServiceTest {

    @Inject
    VerificationService verificationService;

    private List<VerificationService.VerifierInfo> testVerifiers;

    @BeforeEach
    public void setup() {
        // Create test verifiers
        testVerifiers = new ArrayList<>();

        for (int i = 1; i <= 5; i++) {
            VerificationService.VerifierInfo verifier = new VerificationService.VerifierInfo(
                "VERIFIER-" + i,
                "Verifier " + i,
                "Organization " + i,
                Arrays.asList("Cert-A", "Cert-B"),
                Arrays.asList("Healthcare", "Compliance")
            );
            testVerifiers.add(verifier);

            // Register verifier
            verificationService.registerVerifier(verifier).await().indefinitely();
        }
    }

    @Test
    public void testRegisterVerifier() {
        VerificationService.VerifierInfo newVerifier = new VerificationService.VerifierInfo(
            "VERIFIER-NEW",
            "New Verifier",
            "New Organization",
            Arrays.asList("Cert-X"),
            Arrays.asList("Medical")
        );

        VerificationService.VerifierRegistrationResult result =
            verificationService.registerVerifier(newVerifier).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals("VERIFIER-NEW", result.getVerifierId());
        assertNotNull(result.getTimestamp());
    }

    @Test
    public void testRegisterDuplicateVerifier() {
        // Try to register same verifier twice
        VerificationService.VerifierRegistrationResult result =
            verificationService.registerVerifier(testVerifiers.get(0)).await().indefinitely();

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
    }

    @Test
    public void testRequestVerificationTier1() {
        String assetId = "ASSET-TIER1-001";
        VerificationService.VerificationResult result =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-001",
                VerificationTier.TIER_1
            ).await().indefinitely();

        assertNotNull(result);
        assertEquals(assetId, result.getAssetId());
        assertEquals(1, result.getRequiredVerifiers()); // Tier 1 requires 1 verifier
        assertEquals(0, result.getReceivedVotes());
        assertFalse(result.isConsensusReached());
    }

    @Test
    public void testRequestVerificationTier3() {
        String assetId = "ASSET-TIER3-001";
        VerificationService.VerificationResult result =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-002",
                VerificationTier.TIER_3
            ).await().indefinitely();

        assertNotNull(result);
        assertEquals(3, result.getRequiredVerifiers()); // Tier 3 requires 3 verifiers
    }

    @Test
    public void testSubmitVoteSingleApproval() {
        // Request verification
        String assetId = "ASSET-VOTE-001";
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-001",
                VerificationTier.TIER_1
            ).await().indefinitely();

        String verificationId = verificationResult.getVerificationId();

        // Submit vote
        VerificationService.VoteResult voteResult =
            verificationService.submitVote(
                verificationId,
                "VERIFIER-1",
                true,
                "Approved after review"
            ).await().indefinitely();

        assertNotNull(voteResult);
        assertTrue(voteResult.isSuccess());
        assertEquals(1, voteResult.getVotesReceived());
        assertEquals(1, voteResult.getVotesRequired());
        assertTrue(voteResult.isConsensusReached());
        assertTrue(voteResult.isApproved());
    }

    @Test
    public void testSubmitVoteMultipleVerifiers() {
        // Request Tier 3 verification (requires 3 verifiers)
        String assetId = "ASSET-MULTI-001";
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-002",
                VerificationTier.TIER_3
            ).await().indefinitely();

        String verificationId = verificationResult.getVerificationId();

        // Submit first vote
        VerificationService.VoteResult vote1 =
            verificationService.submitVote(verificationId, "VERIFIER-1", true, "Approved").await().indefinitely();
        assertFalse(vote1.isConsensusReached()); // Not enough votes yet

        // Submit second vote
        VerificationService.VoteResult vote2 =
            verificationService.submitVote(verificationId, "VERIFIER-2", true, "Approved").await().indefinitely();
        assertFalse(vote2.isConsensusReached()); // Still not enough

        // Submit third vote
        VerificationService.VoteResult vote3 =
            verificationService.submitVote(verificationId, "VERIFIER-3", true, "Approved").await().indefinitely();
        assertTrue(vote3.isConsensusReached()); // Now consensus is reached
        assertTrue(vote3.isApproved()); // All approved
    }

    @Test
    public void testConsensusThreshold() {
        // Request Tier 3 verification (requires 3 verifiers, 51% approval)
        String assetId = "ASSET-THRESHOLD-001";
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-003",
                VerificationTier.TIER_3
            ).await().indefinitely();

        String verificationId = verificationResult.getVerificationId();

        // Submit votes: 2 approved, 1 rejected (66.7% approval)
        verificationService.submitVote(verificationId, "VERIFIER-1", true, "Approved").await().indefinitely();
        verificationService.submitVote(verificationId, "VERIFIER-2", true, "Approved").await().indefinitely();
        VerificationService.VoteResult vote3 =
            verificationService.submitVote(verificationId, "VERIFIER-3", false, "Rejected").await().indefinitely();

        assertTrue(vote3.isConsensusReached());
        assertTrue(vote3.isApproved()); // 66.7% > 51% threshold
    }

    @Test
    public void testConsensusRejection() {
        // Request Tier 3 verification
        String assetId = "ASSET-REJECT-001";
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-004",
                VerificationTier.TIER_3
            ).await().indefinitely();

        String verificationId = verificationResult.getVerificationId();

        // Submit votes: 1 approved, 2 rejected (33.3% approval)
        verificationService.submitVote(verificationId, "VERIFIER-1", true, "Approved").await().indefinitely();
        verificationService.submitVote(verificationId, "VERIFIER-2", false, "Rejected").await().indefinitely();
        VerificationService.VoteResult vote3 =
            verificationService.submitVote(verificationId, "VERIFIER-3", false, "Rejected").await().indefinitely();

        assertTrue(vote3.isConsensusReached());
        assertFalse(vote3.isApproved()); // 33.3% < 51% threshold
    }

    @Test
    public void testDuplicateVote() {
        // Request verification
        String assetId = "ASSET-DUP-001";
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-005",
                VerificationTier.TIER_1
            ).await().indefinitely();

        String verificationId = verificationResult.getVerificationId();

        // Submit first vote
        VerificationService.VoteResult vote1 =
            verificationService.submitVote(verificationId, "VERIFIER-1", true, "Approved").await().indefinitely();
        assertTrue(vote1.isSuccess());

        // Try to vote again with same verifier
        VerificationService.VoteResult vote2 =
            verificationService.submitVote(verificationId, "VERIFIER-1", false, "Changed mind").await().indefinitely();
        assertFalse(vote2.isSuccess());
        assertNotNull(vote2.getErrorMessage());
    }

    @Test
    public void testVoteOnNonExistentVerification() {
        VerificationService.VoteResult voteResult =
            verificationService.submitVote(
                "NONEXISTENT-ID",
                "VERIFIER-1",
                true,
                "Approved"
            ).await().indefinitely();

        assertFalse(voteResult.isSuccess());
        assertNotNull(voteResult.getErrorMessage());
    }

    @Test
    public void testGetVerificationDetails() {
        // Request verification and get votes
        String assetId = "ASSET-DETAILS-001";
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-006",
                VerificationTier.TIER_2
            ).await().indefinitely();

        String verificationId = verificationResult.getVerificationId();

        // Submit votes
        verificationService.submitVote(verificationId, "VERIFIER-1", true, "Approved").await().indefinitely();
        verificationService.submitVote(verificationId, "VERIFIER-2", true, "Approved").await().indefinitely();

        // Get details
        VerificationService.VerificationDetails details =
            verificationService.getVerificationDetails(verificationId).await().indefinitely();

        assertNotNull(details);
        assertEquals(verificationId, details.getVerificationId());
        assertEquals(assetId, details.getAssetId());
        assertEquals(VerificationTier.TIER_2, details.getTier());
        assertEquals(2, details.getRequiredVerifiers());
        assertEquals(2, details.getReceivedVotes());
        assertTrue(details.isConsensusReached());
        assertEquals(1.0, details.getApprovalRate(), 0.001); // 100% approval
    }

    @Test
    public void testGetVerificationStatus() {
        String assetId = "ASSET-STATUS-001";

        // Before verification
        VerificationStatus statusBefore = verificationService.getVerificationStatus(assetId);
        assertEquals(VerificationStatus.PENDING, statusBefore);

        // Request and approve verification
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-007",
                VerificationTier.TIER_1
            ).await().indefinitely();

        String verificationId = verificationResult.getVerificationId();
        verificationService.submitVote(verificationId, "VERIFIER-1", true, "Approved").await().indefinitely();

        // After verification
        VerificationStatus statusAfter = verificationService.getVerificationStatus(assetId);
        assertEquals(VerificationStatus.APPROVED, statusAfter);
    }

    @Test
    public void testGetStatistics() {
        // Create some verifications
        for (int i = 0; i < 3; i++) {
            String assetId = "ASSET-STATS-" + i;
            VerificationService.VerificationResult result =
                verificationService.requestVerification(
                    assetId,
                    "REQUESTER-STATS",
                    VerificationTier.TIER_1
                ).await().indefinitely();

            // Approve some, reject others
            boolean approved = i % 2 == 0;
            verificationService.submitVote(
                result.getVerificationId(),
                "VERIFIER-1",
                approved,
                approved ? "Approved" : "Rejected"
            ).await().indefinitely();
        }

        VerificationStatistics stats = verificationService.getStatistics();

        assertNotNull(stats);
        assertTrue(stats.getTotalVerifications() >= 3);
        // Note: getTotalVerifiers() not available in current VerificationStatistics
        assertTrue(stats.getActiveVerifiers() >= 5);
    }

    @Test
    public void testTier4Verification() {
        // Tier 4 requires 5 verifiers
        String assetId = "ASSET-TIER4-001";
        VerificationService.VerificationResult verificationResult =
            verificationService.requestVerification(
                assetId,
                "REQUESTER-TIER4",
                VerificationTier.TIER_4
            ).await().indefinitely();

        assertEquals(5, verificationResult.getRequiredVerifiers());

        String verificationId = verificationResult.getVerificationId();

        // Submit 5 votes
        for (int i = 1; i <= 5; i++) {
            VerificationService.VoteResult voteResult =
                verificationService.submitVote(
                    verificationId,
                    "VERIFIER-" + i,
                    true,
                    "Approved by verifier " + i
                ).await().indefinitely();

            if (i < 5) {
                assertFalse(voteResult.isConsensusReached());
            } else {
                assertTrue(voteResult.isConsensusReached());
                assertTrue(voteResult.isApproved());
            }
        }
    }

    @Test
    public void testVerificationTierByValue() {
        assertEquals(VerificationTier.TIER_1, VerificationTier.getTierByValue(50000));
        assertEquals(VerificationTier.TIER_2, VerificationTier.getTierByValue(500000));
        assertEquals(VerificationTier.TIER_3, VerificationTier.getTierByValue(5000000));
        assertEquals(VerificationTier.TIER_4, VerificationTier.getTierByValue(50000000));
    }
}
