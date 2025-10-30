package io.aurigraph.v11.governance;

import io.aurigraph.v11.crypto.DilithiumSignatureService;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for GovernanceService
 *
 * @author SCA (Security & Cryptography Agent)
 * @since Sprint 8 - Governance & Quantum Signing
 */
@QuarkusTest
class GovernanceServiceTest {

    @Inject
    GovernanceService governanceService;

    @InjectMock
    DilithiumSignatureService signatureService;

    @BeforeEach
    void setup() {
        // Mock signature service
        Mockito.when(signatureService.sign(Mockito.any(), Mockito.any()))
               .thenReturn(new byte[]{1, 2, 3, 4});
    }

    @Test
    @DisplayName("Should create proposal successfully")
    void testCreateProposal() {
        // Arrange
        String title = "Test Proposal";
        String description = "Test Description";
        Proposal.ProposalType type = Proposal.ProposalType.TEXT_PROPOSAL;
        String proposer = "proposer-001";
        BigDecimal deposit = new BigDecimal("2000");

        // Act
        Proposal proposal = governanceService.createProposal(
            title, description, type, proposer, deposit, null
        ).await().indefinitely();

        // Assert
        assertNotNull(proposal);
        assertNotNull(proposal.getId());
        assertEquals(title, proposal.getTitle());
        assertEquals(description, proposal.getDescription());
        assertEquals(type, proposal.getType());
        assertEquals(proposer, proposal.getProposer());
        assertEquals(Proposal.ProposalStatus.PENDING, proposal.getStatus());
    }

    @Test
    @DisplayName("Should fail proposal creation with insufficient deposit")
    void testCreateProposalInsufficientDeposit() {
        // Arrange
        BigDecimal insufficientDeposit = new BigDecimal("100");

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
            governanceService.createProposal(
                "Test", "Description", Proposal.ProposalType.TEXT_PROPOSAL,
                "proposer", insufficientDeposit, null
            ).await().indefinitely()
        );
    }

    @Test
    @DisplayName("Should cast vote successfully")
    void testCastVote() {
        // Arrange - Create proposal first
        Proposal proposal = governanceService.createProposal(
            "Test Proposal", "Description", Proposal.ProposalType.TEXT_PROPOSAL,
            "proposer-001", new BigDecimal("2000"), null
        ).await().indefinitely();

        // Manually set to active for voting
        proposal.setStatus(Proposal.ProposalStatus.ACTIVE);
        proposal.setVotingStartTime(Instant.now().minus(Duration.ofHours(1)));
        proposal.setVotingEndTime(Instant.now().plus(Duration.ofDays(7)));

        String voter = "voter-001";
        Vote.VoteOption option = Vote.VoteOption.YES;
        BigDecimal votingPower = new BigDecimal("1000");

        // Act
        Vote vote = governanceService.castVote(
            proposal.getId(), voter, option, votingPower, null
        ).await().indefinitely();

        // Assert
        assertNotNull(vote);
        assertEquals(proposal.getId(), vote.getProposalId());
        assertEquals(voter, vote.getVoter());
        assertEquals(option, vote.getOption());
        assertEquals(votingPower, vote.getVotingPower());
    }

    @Test
    @DisplayName("Should prevent duplicate voting")
    void testPreventDuplicateVoting() {
        // Arrange - Create proposal and cast first vote
        Proposal proposal = governanceService.createProposal(
            "Test Proposal", "Description", Proposal.ProposalType.TEXT_PROPOSAL,
            "proposer-001", new BigDecimal("2000"), null
        ).await().indefinitely();

        proposal.setStatus(Proposal.ProposalStatus.ACTIVE);
        proposal.setVotingStartTime(Instant.now().minus(Duration.ofHours(1)));
        proposal.setVotingEndTime(Instant.now().plus(Duration.ofDays(7)));

        String voter = "voter-001";
        governanceService.castVote(
            proposal.getId(), voter, Vote.VoteOption.YES, new BigDecimal("1000"), null
        ).await().indefinitely();

        // Act & Assert - Try to vote again
        assertThrows(IllegalStateException.class, () ->
            governanceService.castVote(
                proposal.getId(), voter, Vote.VoteOption.NO, new BigDecimal("500"), null
            ).await().indefinitely()
        );
    }

    @Test
    @DisplayName("Should list proposals with filters")
    void testListProposals() {
        // Arrange - Create multiple proposals
        for (int i = 0; i < 5; i++) {
            governanceService.createProposal(
                "Proposal " + i, "Description " + i,
                Proposal.ProposalType.TEXT_PROPOSAL,
                "proposer-" + i, new BigDecimal("2000"), null
            ).await().indefinitely();
        }

        // Act
        List<Proposal> proposals = governanceService.listProposals(
            null, null, 10, 0
        ).await().indefinitely();

        // Assert
        assertTrue(proposals.size() >= 5);
    }

    @Test
    @DisplayName("Should get voting results")
    void testGetVotingResults() {
        // Arrange - Create proposal
        Proposal proposal = governanceService.createProposal(
            "Test Proposal", "Description", Proposal.ProposalType.TEXT_PROPOSAL,
            "proposer-001", new BigDecimal("2000"), null
        ).await().indefinitely();

        proposal.setStatus(Proposal.ProposalStatus.ACTIVE);
        proposal.setVotingStartTime(Instant.now().minus(Duration.ofHours(1)));
        proposal.setVotingEndTime(Instant.now().plus(Duration.ofDays(7)));

        // Cast votes
        governanceService.castVote(
            proposal.getId(), "voter-001", Vote.VoteOption.YES, new BigDecimal("1000"), null
        ).await().indefinitely();

        governanceService.castVote(
            proposal.getId(), "voter-002", Vote.VoteOption.NO, new BigDecimal("500"), null
        ).await().indefinitely();

        // Act
        GovernanceService.VotingResults results = governanceService.getVotingResults(
            proposal.getId()
        ).await().indefinitely();

        // Assert
        assertNotNull(results);
        assertEquals(new BigDecimal("1000"), results.yesVotes());
        assertEquals(new BigDecimal("500"), results.noVotes());
        assertEquals(2, results.totalVoters());
    }

    @Test
    @DisplayName("Should calculate approval percentage correctly")
    void testCalculateApprovalPercentage() {
        // Arrange
        Proposal proposal = new Proposal();
        proposal.setYesVotes(new BigDecimal("700"));
        proposal.setNoVotes(new BigDecimal("200"));
        proposal.setAbstainVotes(new BigDecimal("100"));
        proposal.setVetoVotes(BigDecimal.ZERO);

        // Act
        BigDecimal approval = proposal.getApprovalPercentage();

        // Assert
        assertEquals(0, new BigDecimal("70").compareTo(approval));
    }

    @Test
    @DisplayName("Should check quorum threshold")
    void testCheckQuorumThreshold() {
        // Arrange
        Proposal proposal = new Proposal();
        proposal.setQuorumThreshold(new BigDecimal("40")); // 40%
        proposal.setTotalVotingPower(new BigDecimal("1000"));
        proposal.setYesVotes(new BigDecimal("500")); // 50% participation

        // Act & Assert
        assertTrue(proposal.hasReachedQuorum());
    }

    @Test
    @DisplayName("Should validate proposal has passed")
    void testProposalHasPassed() {
        // Arrange
        Proposal proposal = new Proposal();
        proposal.setQuorumThreshold(new BigDecimal("40"));
        proposal.setApprovalThreshold(new BigDecimal("50"));
        proposal.setVetoThreshold(new BigDecimal("33.4"));
        proposal.setTotalVotingPower(new BigDecimal("1000"));

        // Set votes: 60% yes, 20% no, 20% abstain = 100% participation, 75% approval
        proposal.setYesVotes(new BigDecimal("600"));
        proposal.setNoVotes(new BigDecimal("200"));
        proposal.setAbstainVotes(new BigDecimal("200"));
        proposal.setVetoVotes(BigDecimal.ZERO);

        // Act & Assert
        assertTrue(proposal.hasReachedQuorum());
        assertTrue(proposal.hasPassed());
    }

    @Test
    @DisplayName("Should reject proposal with high veto votes")
    void testProposalRejectedByVeto() {
        // Arrange
        Proposal proposal = new Proposal();
        proposal.setQuorumThreshold(new BigDecimal("40"));
        proposal.setApprovalThreshold(new BigDecimal("50"));
        proposal.setVetoThreshold(new BigDecimal("33.4"));
        proposal.setTotalVotingPower(new BigDecimal("1000"));

        // Set votes with high veto
        proposal.setYesVotes(new BigDecimal("500"));
        proposal.setNoVotes(new BigDecimal("100"));
        proposal.setAbstainVotes(new BigDecimal("50"));
        proposal.setVetoVotes(new BigDecimal("350")); // 35% veto > 33.4% threshold

        // Act & Assert
        assertFalse(proposal.hasPassed());
    }

    @Test
    @DisplayName("Should get governance metrics")
    void testGetGovernanceMetrics() {
        // Act
        GovernanceService.GovernanceMetrics metrics = governanceService.getMetrics();

        // Assert
        assertNotNull(metrics);
        assertTrue(metrics.totalProposals() >= 0);
        assertTrue(metrics.totalVotes() >= 0);
    }
}
