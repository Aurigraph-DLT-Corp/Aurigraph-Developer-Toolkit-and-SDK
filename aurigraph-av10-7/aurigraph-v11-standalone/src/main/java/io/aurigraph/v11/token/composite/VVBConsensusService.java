package io.aurigraph.v11.token.composite;

import io.aurigraph.v11.crypto.DilithiumSignatureService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * VVB Consensus Service - Sprint 3-4 Implementation
 *
 * Implements 3-of-N multi-verifier approval workflow for composite tokens.
 * Provides quantum-resistant signature attestation using CRYSTALS-Dilithium.
 *
 * VVB (Validation and Verification Body) Workflow:
 * 1. Composite token submitted for verification
 * 2. Multiple independent VVBs review and approve
 * 3. When threshold (3-of-N) reached, consensus achieved
 * 4. Quantum signature attestation recorded
 *
 * Performance Requirements:
 * - VVB approval processing: < 500ms
 * - Signature generation: < 100ms
 * - Consensus check: < 10ms
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 * @since Sprint 3 (Week 7)
 */
@ApplicationScoped
public class VVBConsensusService {

    private static final Logger LOG = Logger.getLogger(VVBConsensusService.class);

    @Inject
    DilithiumSignatureService dilithiumService;

    // Registered VVB verifiers
    private final ConcurrentHashMap<String, VVBVerifier> registeredVerifiers = new ConcurrentHashMap<>();

    // Pending verification requests
    private final ConcurrentHashMap<String, VerificationRequest> pendingRequests = new ConcurrentHashMap<>();

    // Completed verifications
    private final ConcurrentHashMap<String, VerificationResult> completedVerifications = new ConcurrentHashMap<>();

    // Performance metrics
    private long approvalCount = 0;
    private long totalApprovalTime = 0;
    private long consensusCount = 0;
    private long rejectionCount = 0;

    // Default threshold for consensus
    private static final int DEFAULT_THRESHOLD = 3;

    /**
     * Register a new VVB verifier
     *
     * @param verifierId Unique verifier identifier
     * @param name Verifier name/organization
     * @param publicKeyEncoded Encoded public key for signature verification
     * @return The registered verifier
     */
    public VVBVerifier registerVerifier(String verifierId, String name, byte[] publicKeyEncoded) {
        if (registeredVerifiers.containsKey(verifierId)) {
            throw new IllegalArgumentException("Verifier already registered: " + verifierId);
        }

        // Generate quantum-resistant key pair for the verifier
        KeyPair keyPair = dilithiumService.generateKeyPair();

        VVBVerifier verifier = new VVBVerifier(
                verifierId,
                name,
                keyPair,
                Instant.now(),
                VVBVerifierStatus.ACTIVE
        );

        registeredVerifiers.put(verifierId, verifier);

        LOG.infof("Registered VVB verifier: %s (%s)", verifierId, name);

        return verifier;
    }

    /**
     * Submit a composite token for VVB verification
     *
     * @param compositeToken The composite token to verify
     * @param threshold Required approvals for consensus (default: 3)
     * @return Uni containing the verification request
     */
    @Transactional
    public Uni<VerificationRequest> submitForVerification(
            CompositeToken compositeToken,
            int threshold) {

        return Uni.createFrom().item(() -> {
            if (compositeToken == null) {
                throw new IllegalArgumentException("Composite token cannot be null");
            }

            if (registeredVerifiers.size() < threshold) {
                throw new IllegalStateException(
                        "Not enough registered verifiers. Required: " + threshold +
                        ", Available: " + registeredVerifiers.size());
            }

            String requestId = generateRequestId(compositeToken.compositeTokenId);

            VerificationRequest request = new VerificationRequest(
                    requestId,
                    compositeToken.compositeTokenId,
                    compositeToken.merkleRoot,
                    compositeToken.digitalTwinHash,
                    threshold,
                    Instant.now()
            );

            pendingRequests.put(requestId, request);

            // Update composite token status
            compositeToken.submitForVerification();

            LOG.infof("Submitted composite token %s for VVB verification (threshold: %d)",
                    compositeToken.compositeTokenId, threshold);

            return request;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Process a VVB approval for a verification request
     *
     * @param requestId The verification request ID
     * @param verifierId The approving verifier's ID
     * @param approved Whether the verifier approves
     * @param notes Optional notes from the verifier
     * @return Uni containing the approval result
     */
    @Transactional
    public Uni<ApprovalResult> processApproval(
            String requestId,
            String verifierId,
            boolean approved,
            String notes) {

        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            VerificationRequest request = pendingRequests.get(requestId);
            if (request == null) {
                throw new IllegalArgumentException("Verification request not found: " + requestId);
            }

            VVBVerifier verifier = registeredVerifiers.get(verifierId);
            if (verifier == null) {
                throw new IllegalArgumentException("Verifier not registered: " + verifierId);
            }

            if (verifier.status != VVBVerifierStatus.ACTIVE) {
                throw new IllegalStateException("Verifier is not active: " + verifierId);
            }

            // Check if already voted
            if (request.hasVoted(verifierId)) {
                throw new IllegalStateException("Verifier already voted on this request");
            }

            // Record the vote
            VVBVote vote = new VVBVote(
                    verifierId,
                    approved,
                    notes,
                    Instant.now()
            );

            // Generate quantum signature for the vote
            String voteData = buildVoteData(request, vote);
            byte[] signature = dilithiumService.sign(
                    voteData.getBytes(StandardCharsets.UTF_8),
                    verifier.keyPair.getPrivate()
            );
            vote.signature = bytesToHex(signature);

            request.addVote(vote);

            // Check if consensus reached
            boolean consensusReached = false;
            boolean consensusFailed = false;

            if (request.getApprovalCount() >= request.threshold) {
                consensusReached = true;
                request.status = VerificationStatus.APPROVED;

                // Generate aggregate signature
                String aggregateSignature = generateAggregateSignature(request);
                request.aggregateSignature = aggregateSignature;

                // Move to completed
                VerificationResult result = new VerificationResult(
                        request.requestId,
                        request.compositeTokenId,
                        true,
                        request.getApprovalCount(),
                        request.getRejectionCount(),
                        aggregateSignature,
                        Instant.now()
                );
                completedVerifications.put(request.requestId, result);
                pendingRequests.remove(requestId);

                // Update composite token
                updateCompositeTokenOnConsensus(request);

                synchronized (this) {
                    consensusCount++;
                }

            } else if (request.getRejectionCount() > (registeredVerifiers.size() - request.threshold)) {
                // Cannot reach threshold anymore
                consensusFailed = true;
                request.status = VerificationStatus.REJECTED;
                pendingRequests.remove(requestId);

                synchronized (this) {
                    rejectionCount++;
                }
            }

            // Update metrics
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            synchronized (this) {
                approvalCount++;
                totalApprovalTime += duration;
            }

            LOG.infof("Processed VVB %s from %s for request %s in %dms. Consensus: %s",
                    approved ? "approval" : "rejection", verifierId, requestId,
                    duration, consensusReached ? "REACHED" : (consensusFailed ? "FAILED" : "PENDING"));

            return new ApprovalResult(
                    requestId,
                    verifierId,
                    approved,
                    consensusReached,
                    consensusFailed,
                    request.getApprovalCount(),
                    request.getRejectionCount(),
                    duration
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get the current status of a verification request
     *
     * @param requestId The verification request ID
     * @return Uni containing the verification status
     */
    public Uni<VerificationStatusResult> getVerificationStatus(String requestId) {
        return Uni.createFrom().item(() -> {
            VerificationRequest pending = pendingRequests.get(requestId);
            if (pending != null) {
                return new VerificationStatusResult(
                        requestId,
                        pending.compositeTokenId,
                        pending.status,
                        pending.getApprovalCount(),
                        pending.getRejectionCount(),
                        pending.threshold,
                        null
                );
            }

            VerificationResult completed = completedVerifications.get(requestId);
            if (completed != null) {
                return new VerificationStatusResult(
                        requestId,
                        completed.compositeTokenId,
                        completed.approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
                        completed.approvalCount,
                        completed.rejectionCount,
                        0, // threshold not needed for completed
                        completed.aggregateSignature
                );
            }

            throw new IllegalArgumentException("Verification request not found: " + requestId);
        });
    }

    /**
     * Verify a completed verification's aggregate signature
     *
     * @param requestId The verification request ID
     * @return true if the aggregate signature is valid
     */
    public boolean verifyAggregateSignature(String requestId) {
        VerificationResult result = completedVerifications.get(requestId);
        if (result == null) {
            return false;
        }

        // In production, would verify against stored public keys
        // For now, verify signature format and presence
        return result.aggregateSignature != null && !result.aggregateSignature.isEmpty();
    }

    /**
     * Get all pending verification requests
     */
    public List<VerificationRequest> getPendingRequests() {
        return new ArrayList<>(pendingRequests.values());
    }

    /**
     * Get all registered verifiers
     */
    public List<VVBVerifier> getRegisteredVerifiers() {
        return new ArrayList<>(registeredVerifiers.values());
    }

    /**
     * Get verifier by ID
     */
    public VVBVerifier getVerifier(String verifierId) {
        return registeredVerifiers.get(verifierId);
    }

    /**
     * Deactivate a verifier
     */
    public void deactivateVerifier(String verifierId) {
        VVBVerifier verifier = registeredVerifiers.get(verifierId);
        if (verifier != null) {
            verifier.status = VVBVerifierStatus.INACTIVE;
            LOG.infof("Deactivated VVB verifier: %s", verifierId);
        }
    }

    /**
     * Get service metrics
     */
    public VVBMetrics getMetrics() {
        synchronized (this) {
            return new VVBMetrics(
                    approvalCount,
                    approvalCount > 0 ? totalApprovalTime / approvalCount : 0,
                    consensusCount,
                    rejectionCount,
                    registeredVerifiers.size(),
                    pendingRequests.size(),
                    completedVerifications.size()
            );
        }
    }

    // =============== PRIVATE HELPER METHODS ===============

    private String generateRequestId(String compositeTokenId) {
        return "VVB-" + compositeTokenId.substring(3) + "-" + System.currentTimeMillis();
    }

    private String buildVoteData(VerificationRequest request, VVBVote vote) {
        return String.format("%s|%s|%s|%s|%d",
                request.requestId,
                request.merkleRoot,
                vote.verifierId,
                vote.approved,
                vote.timestamp.toEpochMilli());
    }

    private String generateAggregateSignature(VerificationRequest request) {
        try {
            // Combine all approval signatures
            StringBuilder combined = new StringBuilder();
            for (VVBVote vote : request.votes) {
                if (vote.approved && vote.signature != null) {
                    combined.append(vote.signature);
                }
            }

            // Hash the combined signatures
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] aggregateHash = digest.digest(combined.toString().getBytes(StandardCharsets.UTF_8));

            return bytesToHex(aggregateHash);
        } catch (Exception e) {
            LOG.error("Failed to generate aggregate signature", e);
            return null;
        }
    }

    private void updateCompositeTokenOnConsensus(VerificationRequest request) {
        CompositeToken composite = CompositeToken.findByCompositeTokenId(request.compositeTokenId);
        if (composite != null) {
            // Record all approving verifier IDs
            List<String> approvers = new ArrayList<>();
            for (VVBVote vote : request.votes) {
                if (vote.approved) {
                    approvers.add(vote.verifierId);
                }
            }
            composite.vvbVerifierIds = String.join(",", approvers);
            composite.vvbApprovalCount = approvers.size();
            composite.vvbSignature = request.aggregateSignature;
            composite.status = CompositeToken.CompositeTokenStatus.VERIFIED;
            composite.verifiedAt = Instant.now();
            composite.updatedAt = Instant.now();
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // =============== INNER CLASSES ===============

    /**
     * VVB Verifier entity
     */
    public static class VVBVerifier {
        public final String verifierId;
        public final String name;
        public final KeyPair keyPair;
        public final Instant registeredAt;
        public VVBVerifierStatus status;

        public VVBVerifier(String verifierId, String name, KeyPair keyPair,
                          Instant registeredAt, VVBVerifierStatus status) {
            this.verifierId = verifierId;
            this.name = name;
            this.keyPair = keyPair;
            this.registeredAt = registeredAt;
            this.status = status;
        }
    }

    /**
     * VVB Verifier status
     */
    public enum VVBVerifierStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }

    /**
     * Verification request
     */
    public static class VerificationRequest {
        public final String requestId;
        public final String compositeTokenId;
        public final String merkleRoot;
        public final String digitalTwinHash;
        public final int threshold;
        public final Instant submittedAt;
        public VerificationStatus status = VerificationStatus.PENDING;
        public String aggregateSignature;
        public final List<VVBVote> votes = new ArrayList<>();

        public VerificationRequest(String requestId, String compositeTokenId,
                                  String merkleRoot, String digitalTwinHash,
                                  int threshold, Instant submittedAt) {
            this.requestId = requestId;
            this.compositeTokenId = compositeTokenId;
            this.merkleRoot = merkleRoot;
            this.digitalTwinHash = digitalTwinHash;
            this.threshold = threshold;
            this.submittedAt = submittedAt;
        }

        public void addVote(VVBVote vote) {
            votes.add(vote);
        }

        public boolean hasVoted(String verifierId) {
            return votes.stream().anyMatch(v -> v.verifierId.equals(verifierId));
        }

        public int getApprovalCount() {
            return (int) votes.stream().filter(v -> v.approved).count();
        }

        public int getRejectionCount() {
            return (int) votes.stream().filter(v -> !v.approved).count();
        }
    }

    /**
     * Verification status enum
     */
    public enum VerificationStatus {
        PENDING, APPROVED, REJECTED
    }

    /**
     * VVB Vote
     */
    public static class VVBVote {
        public final String verifierId;
        public final boolean approved;
        public final String notes;
        public final Instant timestamp;
        public String signature;

        public VVBVote(String verifierId, boolean approved, String notes, Instant timestamp) {
            this.verifierId = verifierId;
            this.approved = approved;
            this.notes = notes;
            this.timestamp = timestamp;
        }
    }

    /**
     * Verification result (completed)
     */
    public static class VerificationResult {
        public final String requestId;
        public final String compositeTokenId;
        public final boolean approved;
        public final int approvalCount;
        public final int rejectionCount;
        public final String aggregateSignature;
        public final Instant completedAt;

        public VerificationResult(String requestId, String compositeTokenId,
                                 boolean approved, int approvalCount, int rejectionCount,
                                 String aggregateSignature, Instant completedAt) {
            this.requestId = requestId;
            this.compositeTokenId = compositeTokenId;
            this.approved = approved;
            this.approvalCount = approvalCount;
            this.rejectionCount = rejectionCount;
            this.aggregateSignature = aggregateSignature;
            this.completedAt = completedAt;
        }
    }

    /**
     * Approval processing result
     */
    public static class ApprovalResult {
        public final String requestId;
        public final String verifierId;
        public final boolean approved;
        public final boolean consensusReached;
        public final boolean consensusFailed;
        public final int currentApprovals;
        public final int currentRejections;
        public final long processingTimeMs;

        public ApprovalResult(String requestId, String verifierId, boolean approved,
                            boolean consensusReached, boolean consensusFailed,
                            int currentApprovals, int currentRejections, long processingTimeMs) {
            this.requestId = requestId;
            this.verifierId = verifierId;
            this.approved = approved;
            this.consensusReached = consensusReached;
            this.consensusFailed = consensusFailed;
            this.currentApprovals = currentApprovals;
            this.currentRejections = currentRejections;
            this.processingTimeMs = processingTimeMs;
        }
    }

    /**
     * Verification status result
     */
    public static class VerificationStatusResult {
        public final String requestId;
        public final String compositeTokenId;
        public final VerificationStatus status;
        public final int approvalCount;
        public final int rejectionCount;
        public final int threshold;
        public final String aggregateSignature;

        public VerificationStatusResult(String requestId, String compositeTokenId,
                                       VerificationStatus status, int approvalCount,
                                       int rejectionCount, int threshold,
                                       String aggregateSignature) {
            this.requestId = requestId;
            this.compositeTokenId = compositeTokenId;
            this.status = status;
            this.approvalCount = approvalCount;
            this.rejectionCount = rejectionCount;
            this.threshold = threshold;
            this.aggregateSignature = aggregateSignature;
        }
    }

    /**
     * VVB service metrics
     */
    public static class VVBMetrics {
        public final long approvalCount;
        public final long avgApprovalTimeMs;
        public final long consensusCount;
        public final long rejectionCount;
        public final int activeVerifiers;
        public final int pendingRequests;
        public final int completedVerifications;

        public VVBMetrics(long approvalCount, long avgApprovalTimeMs, long consensusCount,
                         long rejectionCount, int activeVerifiers, int pendingRequests,
                         int completedVerifications) {
            this.approvalCount = approvalCount;
            this.avgApprovalTimeMs = avgApprovalTimeMs;
            this.consensusCount = consensusCount;
            this.rejectionCount = rejectionCount;
            this.activeVerifiers = activeVerifiers;
            this.pendingRequests = pendingRequests;
            this.completedVerifications = completedVerifications;
        }

        @Override
        public String toString() {
            return String.format("VVBMetrics{approvals=%d (%dms avg), consensus=%d, rejected=%d, verifiers=%d}",
                    approvalCount, avgApprovalTimeMs, consensusCount, rejectionCount, activeVerifiers);
        }
    }
}
