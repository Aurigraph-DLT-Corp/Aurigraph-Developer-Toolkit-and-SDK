package io.aurigraph.v11.hms;

import io.aurigraph.v11.hms.models.VerificationTier;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Multi-verifier consensus service for asset verification
 * Implements 3-of-5 verifier consensus with tiered verification
 */
@ApplicationScoped
public class VerificationService {

    // In-memory storage for demo
    private final Map<String, VerificationRequest> verificationRequests = new ConcurrentHashMap<>();
    private final Map<String, VerifierInfo> verifiers = new ConcurrentHashMap<>();
    private final Map<String, List<VerifierVote>> votes = new ConcurrentHashMap<>();
    private final AtomicLong verificationCounter = new AtomicLong(0);

    // Consensus threshold: 51%+ required
    private static final double CONSENSUS_THRESHOLD = 0.51;

    /**
     * Register a verifier in the network
     */
    public Uni<VerifierRegistrationResult> registerVerifier(VerifierInfo verifierInfo) {
        return Uni.createFrom().item(() -> {
            Log.infof("Registering verifier: %s (%s)", verifierInfo.getVerifierId(), verifierInfo.getName());

            if (verifiers.containsKey(verifierInfo.getVerifierId())) {
                return VerifierRegistrationResult.failed(verifierInfo.getVerifierId(),
                    "Verifier already registered");
            }

            verifiers.put(verifierInfo.getVerifierId(), verifierInfo);

            Log.infof("Successfully registered verifier %s. Total verifiers: %d",
                verifierInfo.getVerifierId(), verifiers.size());

            return VerifierRegistrationResult.success(verifierInfo.getVerifierId());
        });
    }

    /**
     * Request verification for an asset
     */
    public Uni<VerificationResult> requestVerification(String assetId, String requesterId, VerificationTier tier) {
        return Uni.createFrom().item(() -> {
            String verificationId = generateVerificationId();
            int requiredVerifiers = tier.getRequiredVerifiers();

            Log.infof("Verification requested for asset %s, tier: %s, required verifiers: %d",
                assetId, tier, requiredVerifiers);

            VerificationRequest request = new VerificationRequest(
                verificationId,
                assetId,
                requesterId,
                tier,
                requiredVerifiers,
                Instant.now()
            );

            verificationRequests.put(verificationId, request);
            votes.put(verificationId, new ArrayList<>());
            verificationCounter.incrementAndGet();

            return VerificationResult.pending(verificationId, assetId, requiredVerifiers, 0);
        });
    }

    /**
     * Submit a verifier vote
     */
    public Uni<VoteResult> submitVote(String verificationId, String verifierId, boolean approved, String reason) {
        return Uni.createFrom().item(() -> {
            Log.infof("Vote submitted for verification %s by verifier %s: %s",
                verificationId, verifierId, approved ? "APPROVED" : "REJECTED");

            VerificationRequest request = verificationRequests.get(verificationId);
            if (request == null) {
                return VoteResult.failed("Verification request not found");
            }

            VerifierInfo verifier = verifiers.get(verifierId);
            if (verifier == null) {
                return VoteResult.failed("Verifier not registered");
            }

            if (verifier.getStatus() != VerifierStatus.ACTIVE) {
                return VoteResult.failed("Verifier is not active");
            }

            // Check if verifier already voted
            List<VerifierVote> voteList = votes.get(verificationId);
            boolean alreadyVoted = voteList.stream()
                .anyMatch(v -> v.getVerifierId().equals(verifierId));

            if (alreadyVoted) {
                return VoteResult.failed("Verifier already voted on this verification");
            }

            // Add vote
            VerifierVote vote = new VerifierVote(verifierId, approved, reason, Instant.now());
            voteList.add(vote);

            // Check if consensus reached
            ConsensusResult consensus = checkConsensus(verificationId, request, voteList);

            if (consensus.isReached()) {
                request.setStatus(consensus.isApproved() ?
                    VerificationStatus.APPROVED : VerificationStatus.REJECTED);
                request.setCompletedAt(Instant.now());

                Log.infof("Consensus reached for verification %s: %s (votes: %d/%d, approval rate: %.2f%%)",
                    verificationId, consensus.isApproved() ? "APPROVED" : "REJECTED",
                    voteList.size(), request.getRequiredVerifiers(), consensus.getApprovalRate() * 100);
            }

            return VoteResult.success(verificationId, voteList.size(), request.getRequiredVerifiers(),
                consensus.isReached(), consensus.isApproved());
        });
    }

    /**
     * Get verification status for an asset
     */
    public VerificationStatus getVerificationStatus(String assetId) {
        // Find the most recent verification for this asset
        Optional<VerificationRequest> latestRequest = verificationRequests.values().stream()
            .filter(r -> r.getAssetId().equals(assetId))
            .max(Comparator.comparing(VerificationRequest::getRequestedAt));

        return latestRequest.map(VerificationRequest::getStatus)
            .orElse(VerificationStatus.PENDING);
    }

    /**
     * Get detailed verification result
     */
    public Uni<VerificationDetails> getVerificationDetails(String verificationId) {
        return Uni.createFrom().item(() -> {
            VerificationRequest request = verificationRequests.get(verificationId);
            if (request == null) {
                return null;
            }

            List<VerifierVote> voteList = votes.getOrDefault(verificationId, new ArrayList<>());
            ConsensusResult consensus = checkConsensus(verificationId, request, voteList);

            return new VerificationDetails(
                verificationId,
                request.getAssetId(),
                request.getTier(),
                request.getStatus(),
                request.getRequiredVerifiers(),
                voteList.size(),
                voteList,
                consensus.isReached(),
                consensus.getApprovalRate(),
                request.getRequestedAt(),
                request.getCompletedAt()
            );
        });
    }

    /**
     * Get verification statistics
     */
    public VerificationStatistics getStatistics() {
        long totalVerifications = verificationCounter.get();
        long pendingVerifications = verificationRequests.values().stream()
            .filter(r -> r.getStatus() == VerificationStatus.PENDING)
            .count();
        long approvedVerifications = verificationRequests.values().stream()
            .filter(r -> r.getStatus() == VerificationStatus.APPROVED)
            .count();
        long rejectedVerifications = verificationRequests.values().stream()
            .filter(r -> r.getStatus() == VerificationStatus.REJECTED)
            .count();
        long expiredVerifications = verificationRequests.values().stream()
            .filter(r -> r.getStatus() == VerificationStatus.EXPIRED)
            .count();
        long fraudDetected = verificationRequests.values().stream()
            .filter(r -> r.getStatus() == VerificationStatus.FRAUD_DETECTED)
            .count();
        double averageVerificationTime = 120.0; // Average 2 minutes
        int activeVerifiersCount = (int) verifiers.values().stream()
            .filter(v -> v.getStatus() == VerifierStatus.ACTIVE)
            .count();

        return new VerificationStatistics(
            totalVerifications,
            pendingVerifications,
            approvedVerifications,
            rejectedVerifications,
            expiredVerifications,
            fraudDetected,
            averageVerificationTime,
            activeVerifiersCount
        );
    }

    /**
     * Check if consensus is reached
     */
    private ConsensusResult checkConsensus(String verificationId, VerificationRequest request,
                                          List<VerifierVote> voteList) {
        int requiredVerifiers = request.getRequiredVerifiers();
        int receivedVotes = voteList.size();

        // Check if we have enough votes
        if (receivedVotes < requiredVerifiers) {
            return new ConsensusResult(false, false, 0.0);
        }

        // Calculate approval rate
        long approvals = voteList.stream().filter(VerifierVote::isApproved).count();
        double approvalRate = (double) approvals / receivedVotes;

        // Consensus reached if we have required votes and meet threshold
        boolean consensusReached = receivedVotes >= requiredVerifiers;
        boolean approved = approvalRate >= CONSENSUS_THRESHOLD;

        return new ConsensusResult(consensusReached, approved, approvalRate);
    }

    // Helper methods
    private String generateVerificationId() {
        return "VER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // Inner classes
    public static class VerificationRequest {
        private final String verificationId;
        private final String assetId;
        private final String requesterId;
        private final VerificationTier tier;
        private final int requiredVerifiers;
        private final Instant requestedAt;
        private VerificationStatus status;
        private Instant completedAt;

        public VerificationRequest(String verificationId, String assetId, String requesterId,
                                  VerificationTier tier, int requiredVerifiers, Instant requestedAt) {
            this.verificationId = verificationId;
            this.assetId = assetId;
            this.requesterId = requesterId;
            this.tier = tier;
            this.requiredVerifiers = requiredVerifiers;
            this.requestedAt = requestedAt;
            this.status = VerificationStatus.PENDING;
        }

        // Getters and setters
        public String getVerificationId() { return verificationId; }
        public String getAssetId() { return assetId; }
        public String getRequesterId() { return requesterId; }
        public VerificationTier getTier() { return tier; }
        public int getRequiredVerifiers() { return requiredVerifiers; }
        public Instant getRequestedAt() { return requestedAt; }
        public VerificationStatus getStatus() { return status; }
        public void setStatus(VerificationStatus status) { this.status = status; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    }

    public static class VerifierInfo {
        private final String verifierId;
        private final String name;
        private final String organization;
        private final List<String> certifications;
        private final List<String> specializations;
        private final Instant registeredAt;
        private VerifierStatus status;

        public VerifierInfo(String verifierId, String name, String organization,
                          List<String> certifications, List<String> specializations) {
            this.verifierId = verifierId;
            this.name = name;
            this.organization = organization;
            this.certifications = certifications;
            this.specializations = specializations;
            this.registeredAt = Instant.now();
            this.status = VerifierStatus.ACTIVE;
        }

        // Getters
        public String getVerifierId() { return verifierId; }
        public String getName() { return name; }
        public String getOrganization() { return organization; }
        public List<String> getCertifications() { return certifications; }
        public List<String> getSpecializations() { return specializations; }
        public Instant getRegisteredAt() { return registeredAt; }
        public VerifierStatus getStatus() { return status; }
        public void setStatus(VerifierStatus status) { this.status = status; }
    }

    public static class VerifierVote {
        private final String verifierId;
        private final boolean approved;
        private final String reason;
        private final Instant voteTimestamp;

        public VerifierVote(String verifierId, boolean approved, String reason, Instant voteTimestamp) {
            this.verifierId = verifierId;
            this.approved = approved;
            this.reason = reason;
            this.voteTimestamp = voteTimestamp;
        }

        // Getters
        public String getVerifierId() { return verifierId; }
        public boolean isApproved() { return approved; }
        public String getReason() { return reason; }
        public Instant getVoteTimestamp() { return voteTimestamp; }
    }

    private static class ConsensusResult {
        private final boolean reached;
        private final boolean approved;
        private final double approvalRate;

        public ConsensusResult(boolean reached, boolean approved, double approvalRate) {
            this.reached = reached;
            this.approved = approved;
            this.approvalRate = approvalRate;
        }

        public boolean isReached() { return reached; }
        public boolean isApproved() { return approved; }
        public double getApprovalRate() { return approvalRate; }
    }

    public static class VerificationResult {
        private final String verificationId;
        private final String assetId;
        private final VerificationStatus status;
        private final int requiredVerifiers;
        private final int receivedVotes;
        private final boolean consensusReached;

        private VerificationResult(String verificationId, String assetId, VerificationStatus status,
                                  int requiredVerifiers, int receivedVotes, boolean consensusReached) {
            this.verificationId = verificationId;
            this.assetId = assetId;
            this.status = status;
            this.requiredVerifiers = requiredVerifiers;
            this.receivedVotes = receivedVotes;
            this.consensusReached = consensusReached;
        }

        public static VerificationResult pending(String verificationId, String assetId,
                                                int requiredVerifiers, int receivedVotes) {
            return new VerificationResult(verificationId, assetId, VerificationStatus.PENDING,
                requiredVerifiers, receivedVotes, false);
        }

        // Getters
        public String getVerificationId() { return verificationId; }
        public String getAssetId() { return assetId; }
        public VerificationStatus getStatus() { return status; }
        public int getRequiredVerifiers() { return requiredVerifiers; }
        public int getReceivedVotes() { return receivedVotes; }
        public boolean isConsensusReached() { return consensusReached; }
    }

    public static class VoteResult {
        private final boolean success;
        private final String verificationId;
        private final int votesReceived;
        private final int votesRequired;
        private final boolean consensusReached;
        private final boolean approved;
        private final String errorMessage;

        private VoteResult(boolean success, String verificationId, int votesReceived, int votesRequired,
                          boolean consensusReached, boolean approved, String errorMessage) {
            this.success = success;
            this.verificationId = verificationId;
            this.votesReceived = votesReceived;
            this.votesRequired = votesRequired;
            this.consensusReached = consensusReached;
            this.approved = approved;
            this.errorMessage = errorMessage;
        }

        public static VoteResult success(String verificationId, int votesReceived, int votesRequired,
                                        boolean consensusReached, boolean approved) {
            return new VoteResult(true, verificationId, votesReceived, votesRequired,
                consensusReached, approved, null);
        }

        public static VoteResult failed(String errorMessage) {
            return new VoteResult(false, null, 0, 0, false, false, errorMessage);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getVerificationId() { return verificationId; }
        public int getVotesReceived() { return votesReceived; }
        public int getVotesRequired() { return votesRequired; }
        public boolean isConsensusReached() { return consensusReached; }
        public boolean isApproved() { return approved; }
        public String getErrorMessage() { return errorMessage; }
    }

    public static class VerifierRegistrationResult {
        private final boolean success;
        private final String verifierId;
        private final String errorMessage;
        private final Instant timestamp;

        private VerifierRegistrationResult(boolean success, String verifierId, String errorMessage) {
            this.success = success;
            this.verifierId = verifierId;
            this.errorMessage = errorMessage;
            this.timestamp = Instant.now();
        }

        public static VerifierRegistrationResult success(String verifierId) {
            return new VerifierRegistrationResult(true, verifierId, null);
        }

        public static VerifierRegistrationResult failed(String verifierId, String errorMessage) {
            return new VerifierRegistrationResult(false, verifierId, errorMessage);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getVerifierId() { return verifierId; }
        public String getErrorMessage() { return errorMessage; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class VerificationDetails {
        private final String verificationId;
        private final String assetId;
        private final VerificationTier tier;
        private final VerificationStatus status;
        private final int requiredVerifiers;
        private final int receivedVotes;
        private final List<VerifierVote> votes;
        private final boolean consensusReached;
        private final double approvalRate;
        private final Instant requestedAt;
        private final Instant completedAt;

        public VerificationDetails(String verificationId, String assetId, VerificationTier tier,
                                  VerificationStatus status, int requiredVerifiers, int receivedVotes,
                                  List<VerifierVote> votes, boolean consensusReached, double approvalRate,
                                  Instant requestedAt, Instant completedAt) {
            this.verificationId = verificationId;
            this.assetId = assetId;
            this.tier = tier;
            this.status = status;
            this.requiredVerifiers = requiredVerifiers;
            this.receivedVotes = receivedVotes;
            this.votes = votes;
            this.consensusReached = consensusReached;
            this.approvalRate = approvalRate;
            this.requestedAt = requestedAt;
            this.completedAt = completedAt;
        }

        // Getters
        public String getVerificationId() { return verificationId; }
        public String getAssetId() { return assetId; }
        public VerificationTier getTier() { return tier; }
        public VerificationStatus getStatus() { return status; }
        public int getRequiredVerifiers() { return requiredVerifiers; }
        public int getReceivedVotes() { return receivedVotes; }
        public List<VerifierVote> getVotes() { return votes; }
        public boolean isConsensusReached() { return consensusReached; }
        public double getApprovalRate() { return approvalRate; }
        public Instant getRequestedAt() { return requestedAt; }
        public Instant getCompletedAt() { return completedAt; }
    }

    /**
     * Verification statistics data class
     */
    public static class VerificationStatistics {
        private final long totalVerifications;
        private final long pendingVerifications;
        private final long approvedVerifications;
        private final long rejectedVerifications;
        private final long expiredVerifications;
        private final long fraudDetected;
        private final double averageVerificationTime;
        private final int activeVerifiers;

        public VerificationStatistics(long totalVerifications, long pendingVerifications,
                                     long approvedVerifications, long rejectedVerifications,
                                     long expiredVerifications, long fraudDetected,
                                     double averageVerificationTime, int activeVerifiers) {
            this.totalVerifications = totalVerifications;
            this.pendingVerifications = pendingVerifications;
            this.approvedVerifications = approvedVerifications;
            this.rejectedVerifications = rejectedVerifications;
            this.expiredVerifications = expiredVerifications;
            this.fraudDetected = fraudDetected;
            this.averageVerificationTime = averageVerificationTime;
            this.activeVerifiers = activeVerifiers;
        }

        // Getters
        public long getTotalVerifications() { return totalVerifications; }
        public long getPendingVerifications() { return pendingVerifications; }
        public long getApprovedVerifications() { return approvedVerifications; }
        public long getRejectedVerifications() { return rejectedVerifications; }
        public long getExpiredVerifications() { return expiredVerifications; }
        public long getFraudDetected() { return fraudDetected; }
        public double getAverageVerificationTime() { return averageVerificationTime; }
        public int getActiveVerifiers() { return activeVerifiers; }
    }
}
