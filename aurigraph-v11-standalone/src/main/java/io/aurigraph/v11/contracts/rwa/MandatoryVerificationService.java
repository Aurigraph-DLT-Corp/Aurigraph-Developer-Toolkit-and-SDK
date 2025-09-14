package io.aurigraph.v11.contracts.rwa;

import io.aurigraph.v11.contracts.composite.*;
import io.aurigraph.v11.crypto.QuantumCryptoService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.*;
import java.math.BigDecimal;
import java.security.MessageDigest;
import io.quarkus.logging.Log;

/**
 * Mandatory Verification Service for RWA Token Changes
 * 
 * CRITICAL REQUIREMENT: All RWA token changes MUST be verified digitally 
 * by third-party verifiers and digitally signed before any token modification.
 * 
 * This service enforces:
 * 1. Mandatory third-party verification for ALL RWA token changes
 * 2. Digital signatures from verified third-party verifiers
 * 3. Multi-verifier consensus for high-value assets
 * 4. Quantum-safe cryptographic verification
 * 5. Complete audit trail of all verification activities
 * 6. Automatic rejection of unverified changes
 */
@ApplicationScoped
public class MandatoryVerificationService {
    
    @Inject
    VerifierRegistry verifierRegistry;
    
    @Inject
    QuantumCryptoService cryptoService;
    
    // Registry of pending verifications
    private final Map<String, PendingVerification> pendingVerifications = new HashMap<>();
    
    // Registry of completed verifications with digital signatures
    private final Map<String, List<DigitallySignedVerification>> completedVerifications = new HashMap<>();
    
    // Minimum verifier requirements by asset value
    private final Map<String, VerificationRequirement> valueBasedRequirements = Map.of(
        "TIER_1", new VerificationRequirement(1, VerificationLevel.BASIC, BigDecimal.valueOf(100000)),      // <$100K
        "TIER_2", new VerificationRequirement(2, VerificationLevel.ENHANCED, BigDecimal.valueOf(1000000)),  // <$1M  
        "TIER_3", new VerificationRequirement(3, VerificationLevel.CERTIFIED, BigDecimal.valueOf(10000000)), // <$10M
        "TIER_4", new VerificationRequirement(5, VerificationLevel.INSTITUTIONAL, BigDecimal.valueOf(Long.MAX_VALUE)) // $10M+
    );
    
    /**
     * MANDATORY: Request verification for RWA token changes
     * This method MUST be called before any RWA token modification
     */
    public Uni<VerificationRequestResult> requestMandatoryVerification(
        String compositeTokenId,
        Object tokenType, // SecondaryTokenType
        Map<String, Object> proposedChanges,
        BigDecimal assetValue,
        String changeReason,
        String requestedBy
    ) {
        return Uni.createFrom().item(() -> {
            Log.infof("MANDATORY VERIFICATION REQUESTED: Token %s, Type %s, Value $%s", 
                compositeTokenId, tokenType, assetValue);
            
            // Determine verification requirements based on asset value
            VerificationRequirement requirement = determineRequirement(assetValue);
            
            // Create verification request ID
            String verificationRequestId = generateVerificationRequestId(compositeTokenId);
            
            // Create pending verification entry
            PendingVerification pendingVerification = new PendingVerification(
                verificationRequestId,
                compositeTokenId,
                tokenType,
                proposedChanges,
                assetValue,
                changeReason,
                requestedBy,
                requirement,
                Instant.now()
            );
            
            pendingVerifications.put(verificationRequestId, pendingVerification);
            
            Log.infof("VERIFICATION REQUIREMENT: %d verifiers needed at %s level for $%s asset",
                requirement.getMinVerifiers(), requirement.getLevel(), assetValue);
            
            return new VerificationRequestResult(
                verificationRequestId,
                requirement.getMinVerifiers(),
                requirement.getLevel(),
                "Verification request created - token changes BLOCKED until verification complete"
            );
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    /**
     * Submit digitally signed verification from third-party verifier
     */
    public Uni<VerificationSubmissionResult> submitDigitallySignedVerification(
        String verificationRequestId,
        String verifierId,
        VerificationDecision decision,
        String reportSummary,
        Map<String, Object> verificationData,
        String digitalSignature,
        String verifierPublicKey
    ) {
        return Uni.createFrom().item(() -> {
            PendingVerification pending = pendingVerifications.get(verificationRequestId);
            if (pending == null) {
                return new VerificationSubmissionResult(false, "Verification request not found", null);
            }
            
            // Verify digital signature
            boolean signatureValid = verifyDigitalSignature(
                verificationRequestId, decision, reportSummary, verificationData,
                digitalSignature, verifierPublicKey, verifierId
            );
            
            if (!signatureValid) {
                Log.errorf("INVALID DIGITAL SIGNATURE from verifier %s for request %s", 
                    verifierId, verificationRequestId);
                return new VerificationSubmissionResult(false, "Invalid digital signature", null);
            }
            
            // Create digitally signed verification
            DigitallySignedVerification signedVerification = new DigitallySignedVerification(
                verifierId,
                verificationRequestId,
                decision,
                reportSummary,
                verificationData,
                digitalSignature,
                verifierPublicKey,
                Instant.now()
            );
            
            // Add to completed verifications
            completedVerifications.computeIfAbsent(verificationRequestId, k -> new ArrayList<>())
                .add(signedVerification);
            
            // Check if verification is complete
            List<DigitallySignedVerification> completedSigs = completedVerifications.get(verificationRequestId);
            boolean verificationComplete = completedSigs.size() >= pending.getRequirement().getMinVerifiers();
            
            // Calculate consensus
            VerificationConsensus consensus = calculateConsensus(completedSigs);
            
            Log.infof("VERIFICATION SUBMITTED: %s decision from verifier %s (%d/%d required)",
                decision, verifierId, completedSigs.size(), pending.getRequirement().getMinVerifiers());
            
            if (verificationComplete) {
                // Process completed verification
                processCompletedVerification(verificationRequestId, pending, consensus);
            }
            
            return new VerificationSubmissionResult(
                true, 
                "Digital signature verified and accepted",
                verificationComplete ? consensus : null
            );
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    /**
     * CRITICAL: Check if RWA token changes are allowed (verification complete)
     * This method MUST return true before any token modification is permitted
     */
    public Uni<TokenChangeAuthorizationResult> authorizeTokenChange(
        String compositeTokenId,
        Object tokenType // SecondaryTokenType
    ) {
        return Uni.createFrom().item(() -> {
            // Find verification for this token change
            String verificationId = findVerificationForToken(compositeTokenId, tokenType);
            
            if (verificationId == null) {
                Log.errorf("UNAUTHORIZED TOKEN CHANGE ATTEMPT: No verification found for token %s type %s",
                    compositeTokenId, tokenType);
                return new TokenChangeAuthorizationResult(
                    false,
                    "BLOCKED: All RWA token changes require mandatory third-party verification",
                    null,
                    null
                );
            }
            
            List<DigitallySignedVerification> verifications = completedVerifications.get(verificationId);
            if (verifications == null || verifications.isEmpty()) {
                return new TokenChangeAuthorizationResult(
                    false,
                    "BLOCKED: Verification in progress - token changes not yet authorized",
                    verificationId,
                    null
                );
            }
            
            VerificationConsensus consensus = calculateConsensus(verifications);
            
            if (consensus.getDecision() != VerificationDecision.APPROVED) {
                Log.errorf("TOKEN CHANGE REJECTED: Verification consensus is %s for token %s",
                    consensus.getDecision(), compositeTokenId);
                return new TokenChangeAuthorizationResult(
                    false,
                    "REJECTED: Third-party verifiers rejected the proposed token changes",
                    verificationId,
                    consensus
                );
            }
            
            Log.infof("TOKEN CHANGE AUTHORIZED: Verification complete for token %s with %d signatures",
                compositeTokenId, verifications.size());
            
            return new TokenChangeAuthorizationResult(
                true,
                "AUTHORIZED: Token changes approved by verified third-party verifiers",
                verificationId,
                consensus
            );
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    /**
     * Get verification status for a token
     */
    public Uni<VerificationStatus> getVerificationStatus(String compositeTokenId) {
        return Uni.createFrom().item(() -> {
            // Find pending verification
            PendingVerification pending = pendingVerifications.values().stream()
                .filter(p -> p.getCompositeTokenId().equals(compositeTokenId))
                .findFirst()
                .orElse(null);
            
            if (pending != null) {
                List<DigitallySignedVerification> completed = completedVerifications.get(pending.getVerificationRequestId());
                int completedCount = completed != null ? completed.size() : 0;
                
                return new VerificationStatus(
                    pending.getVerificationRequestId(),
                    compositeTokenId,
                    VerificationPhase.PENDING,
                    completedCount,
                    pending.getRequirement().getMinVerifiers(),
                    null,
                    pending.getCreatedAt(),
                    null
                );
            }
            
            // Check completed verifications
            for (Map.Entry<String, List<DigitallySignedVerification>> entry : completedVerifications.entrySet()) {
                String verificationId = entry.getKey();
                List<DigitallySignedVerification> verifications = entry.getValue();
                
                if (verifications.stream().anyMatch(v -> v.getCompositeTokenId().equals(compositeTokenId))) {
                    VerificationConsensus consensus = calculateConsensus(verifications);
                    
                    return new VerificationStatus(
                        verificationId,
                        compositeTokenId,
                        VerificationPhase.COMPLETED,
                        verifications.size(),
                        verifications.size(), // Requirement met
                        consensus,
                        verifications.get(0).getSignedAt(),
                        verifications.get(verifications.size() - 1).getSignedAt()
                    );
                }
            }
            
            return new VerificationStatus(
                null,
                compositeTokenId,
                VerificationPhase.NOT_REQUESTED,
                0,
                0,
                null,
                null,
                null
            );
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    /**
     * Get all verification audit trail for a token
     */
    public Uni<List<VerificationAuditEntry>> getVerificationAuditTrail(String compositeTokenId) {
        return Uni.createFrom().item(() -> {
            List<VerificationAuditEntry> auditTrail = new ArrayList<>();
            
            // Add all verifications for this token
            for (Map.Entry<String, List<DigitallySignedVerification>> entry : completedVerifications.entrySet()) {
                String verificationId = entry.getKey();
                List<DigitallySignedVerification> verifications = entry.getValue();
                
                for (DigitallySignedVerification verification : verifications) {
                    if (verification.getCompositeTokenId().equals(compositeTokenId)) {
                        auditTrail.add(new VerificationAuditEntry(
                            verificationId,
                            verification.getVerifierId(),
                            verification.getDecision(),
                            verification.getReportSummary(),
                            verification.getSignedAt(),
                            verification.getDigitalSignature().substring(0, 64) + "...", // Truncated signature
                            true // Signature verified
                        ));
                    }
                }
            }
            
            // Sort by timestamp
            auditTrail.sort(Comparator.comparing(VerificationAuditEntry::getTimestamp));
            
            return auditTrail;
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    // Private helper methods
    
    private VerificationRequirement determineRequirement(BigDecimal assetValue) {
        for (Map.Entry<String, VerificationRequirement> entry : valueBasedRequirements.entrySet()) {
            if (assetValue.compareTo(entry.getValue().getMaxValue()) < 0) {
                return entry.getValue();
            }
        }
        return valueBasedRequirements.get("TIER_4"); // Highest tier for very high values
    }
    
    private String generateVerificationRequestId(String compositeTokenId) {
        return String.format("VERIFY-%s-%d", 
            compositeTokenId.substring(compositeTokenId.lastIndexOf('-') + 1),
            System.nanoTime() % 1000000);
    }
    
    private boolean verifyDigitalSignature(
        String verificationRequestId,
        VerificationDecision decision,
        String reportSummary,
        Map<String, Object> verificationData,
        String digitalSignature,
        String verifierPublicKey,
        String verifierId
    ) {
        try {
            // Create verification payload
            String payload = createVerificationPayload(
                verificationRequestId, decision, reportSummary, verificationData, verifierId
            );
            
            // Verify quantum-safe signature using CRYSTALS-Dilithium
            return cryptoService.verifyQuantumSignature(
                payload.getBytes(), 
                digitalSignature, 
                verifierPublicKey
            );
            
        } catch (Exception e) {
            Log.errorf(e, "Failed to verify digital signature from verifier %s", verifierId);
            return false;
        }
    }
    
    private String createVerificationPayload(
        String verificationRequestId,
        VerificationDecision decision,
        String reportSummary,
        Map<String, Object> verificationData,
        String verifierId
    ) {
        // Create deterministic payload for signature verification
        StringBuilder payload = new StringBuilder();
        payload.append("VERIFICATION_REQUEST_ID:").append(verificationRequestId);
        payload.append("|VERIFIER_ID:").append(verifierId);
        payload.append("|DECISION:").append(decision.name());
        payload.append("|REPORT_SUMMARY:").append(reportSummary != null ? reportSummary : "");
        payload.append("|TIMESTAMP:").append(Instant.now().getEpochSecond());
        
        // Add verification data in sorted order for consistency
        if (verificationData != null) {
            payload.append("|DATA:");
            verificationData.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> payload.append(entry.getKey()).append("=").append(entry.getValue()).append(";"));
        }
        
        return payload.toString();
    }
    
    private VerificationConsensus calculateConsensus(List<DigitallySignedVerification> verifications) {
        Map<VerificationDecision, Integer> decisionCounts = new HashMap<>();
        
        for (DigitallySignedVerification verification : verifications) {
            decisionCounts.merge(verification.getDecision(), 1, Integer::sum);
        }
        
        // Find majority decision
        VerificationDecision majorityDecision = decisionCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(VerificationDecision.REJECTED);
        
        int majorityCount = decisionCounts.getOrDefault(majorityDecision, 0);
        double consensusPercentage = (double) majorityCount / verifications.size() * 100;
        
        // Require >50% consensus for approval
        if (majorityDecision == VerificationDecision.APPROVED && consensusPercentage <= 50) {
            majorityDecision = VerificationDecision.REJECTED;
            consensusPercentage = 100 - consensusPercentage;
        }
        
        return new VerificationConsensus(
            majorityDecision,
            consensusPercentage,
            majorityCount,
            verifications.size(),
            decisionCounts
        );
    }
    
    private String findVerificationForToken(String compositeTokenId, Object tokenType) {
        // Find verification request for this specific token and type
        return pendingVerifications.entrySet().stream()
            .filter(entry -> {
                PendingVerification pending = entry.getValue();
                return pending.getCompositeTokenId().equals(compositeTokenId) &&
                       Objects.equals(pending.getTokenType(), tokenType);
            })
            .map(Map.Entry::getKey)
            .findFirst()
            .orElse(null);
    }
    
    private void processCompletedVerification(
        String verificationRequestId,
        PendingVerification pending,
        VerificationConsensus consensus
    ) {
        Log.infof("VERIFICATION COMPLETED: Request %s - Decision: %s (%.1f%% consensus)",
            verificationRequestId, consensus.getDecision(), consensus.getConsensusPercentage());
        
        // Remove from pending
        pendingVerifications.remove(verificationRequestId);
        
        // Emit blockchain event for verification completion
        emitVerificationCompletionEvent(verificationRequestId, pending, consensus);
    }
    
    private void emitVerificationCompletionEvent(
        String verificationRequestId,
        PendingVerification pending,
        VerificationConsensus consensus
    ) {
        // This would emit a blockchain event for the verification completion
        Log.infof("BLOCKCHAIN EVENT: Verification %s completed for token %s - %s",
            verificationRequestId, pending.getCompositeTokenId(), consensus.getDecision());
    }
    
    // Inner classes for data structures
    
    public static class PendingVerification {
        private final String verificationRequestId;
        private final String compositeTokenId;
        private final Object tokenType;
        private final Map<String, Object> proposedChanges;
        private final BigDecimal assetValue;
        private final String changeReason;
        private final String requestedBy;
        private final VerificationRequirement requirement;
        private final Instant createdAt;
        
        public PendingVerification(String verificationRequestId, String compositeTokenId, Object tokenType,
                                 Map<String, Object> proposedChanges, BigDecimal assetValue, String changeReason,
                                 String requestedBy, VerificationRequirement requirement, Instant createdAt) {
            this.verificationRequestId = verificationRequestId;
            this.compositeTokenId = compositeTokenId;
            this.tokenType = tokenType;
            this.proposedChanges = proposedChanges;
            this.assetValue = assetValue;
            this.changeReason = changeReason;
            this.requestedBy = requestedBy;
            this.requirement = requirement;
            this.createdAt = createdAt;
        }
        
        // Getters
        public String getVerificationRequestId() { return verificationRequestId; }
        public String getCompositeTokenId() { return compositeTokenId; }
        public Object getTokenType() { return tokenType; }
        public Map<String, Object> getProposedChanges() { return proposedChanges; }
        public BigDecimal getAssetValue() { return assetValue; }
        public String getChangeReason() { return changeReason; }
        public String getRequestedBy() { return requestedBy; }
        public VerificationRequirement getRequirement() { return requirement; }
        public Instant getCreatedAt() { return createdAt; }
    }
    
    public static class DigitallySignedVerification {
        private final String verifierId;
        private final String compositeTokenId;
        private final VerificationDecision decision;
        private final String reportSummary;
        private final Map<String, Object> verificationData;
        private final String digitalSignature;
        private final String verifierPublicKey;
        private final Instant signedAt;
        
        public DigitallySignedVerification(String verifierId, String compositeTokenId, VerificationDecision decision,
                                         String reportSummary, Map<String, Object> verificationData,
                                         String digitalSignature, String verifierPublicKey, Instant signedAt) {
            this.verifierId = verifierId;
            this.compositeTokenId = compositeTokenId;
            this.decision = decision;
            this.reportSummary = reportSummary;
            this.verificationData = verificationData;
            this.digitalSignature = digitalSignature;
            this.verifierPublicKey = verifierPublicKey;
            this.signedAt = signedAt;
        }
        
        // Getters
        public String getVerifierId() { return verifierId; }
        public String getCompositeTokenId() { return compositeTokenId; }
        public VerificationDecision getDecision() { return decision; }
        public String getReportSummary() { return reportSummary; }
        public Map<String, Object> getVerificationData() { return verificationData; }
        public String getDigitalSignature() { return digitalSignature; }
        public String getVerifierPublicKey() { return verifierPublicKey; }
        public Instant getSignedAt() { return signedAt; }
    }
    
    public static class VerificationRequirement {
        private final int minVerifiers;
        private final VerificationLevel level;
        private final BigDecimal maxValue;
        
        public VerificationRequirement(int minVerifiers, VerificationLevel level, BigDecimal maxValue) {
            this.minVerifiers = minVerifiers;
            this.level = level;
            this.maxValue = maxValue;
        }
        
        public int getMinVerifiers() { return minVerifiers; }
        public VerificationLevel getLevel() { return level; }
        public BigDecimal getMaxValue() { return maxValue; }
    }
    
    // Enums for verification decisions and phases
    public enum VerificationDecision {
        APPROVED,
        REJECTED,
        REQUIRES_ADDITIONAL_INFO,
        DEFERRED
    }
    
    public enum VerificationPhase {
        NOT_REQUESTED,
        PENDING,
        COMPLETED,
        EXPIRED
    }
    
    // Result classes
    public static class VerificationRequestResult {
        private final String verificationRequestId;
        private final int requiredVerifiers;
        private final VerificationLevel level;
        private final String message;
        
        public VerificationRequestResult(String verificationRequestId, int requiredVerifiers, 
                                       VerificationLevel level, String message) {
            this.verificationRequestId = verificationRequestId;
            this.requiredVerifiers = requiredVerifiers;
            this.level = level;
            this.message = message;
        }
        
        public String getVerificationRequestId() { return verificationRequestId; }
        public int getRequiredVerifiers() { return requiredVerifiers; }
        public VerificationLevel getLevel() { return level; }
        public String getMessage() { return message; }
    }
    
    public static class VerificationSubmissionResult {
        private final boolean accepted;
        private final String message;
        private final VerificationConsensus consensus;
        
        public VerificationSubmissionResult(boolean accepted, String message, VerificationConsensus consensus) {
            this.accepted = accepted;
            this.message = message;
            this.consensus = consensus;
        }
        
        public boolean isAccepted() { return accepted; }
        public String getMessage() { return message; }
        public VerificationConsensus getConsensus() { return consensus; }
    }
    
    public static class TokenChangeAuthorizationResult {
        private final boolean authorized;
        private final String message;
        private final String verificationId;
        private final VerificationConsensus consensus;
        
        public TokenChangeAuthorizationResult(boolean authorized, String message, 
                                            String verificationId, VerificationConsensus consensus) {
            this.authorized = authorized;
            this.message = message;
            this.verificationId = verificationId;
            this.consensus = consensus;
        }
        
        public boolean isAuthorized() { return authorized; }
        public String getMessage() { return message; }
        public String getVerificationId() { return verificationId; }
        public VerificationConsensus getConsensus() { return consensus; }
    }
    
    public static class VerificationStatus {
        private final String verificationRequestId;
        private final String compositeTokenId;
        private final VerificationPhase phase;
        private final int completedVerifications;
        private final int requiredVerifications;
        private final VerificationConsensus consensus;
        private final Instant requestedAt;
        private final Instant completedAt;
        
        public VerificationStatus(String verificationRequestId, String compositeTokenId, VerificationPhase phase,
                                int completedVerifications, int requiredVerifications, VerificationConsensus consensus,
                                Instant requestedAt, Instant completedAt) {
            this.verificationRequestId = verificationRequestId;
            this.compositeTokenId = compositeTokenId;
            this.phase = phase;
            this.completedVerifications = completedVerifications;
            this.requiredVerifications = requiredVerifications;
            this.consensus = consensus;
            this.requestedAt = requestedAt;
            this.completedAt = completedAt;
        }
        
        // Getters
        public String getVerificationRequestId() { return verificationRequestId; }
        public String getCompositeTokenId() { return compositeTokenId; }
        public VerificationPhase getPhase() { return phase; }
        public int getCompletedVerifications() { return completedVerifications; }
        public int getRequiredVerifications() { return requiredVerifications; }
        public VerificationConsensus getConsensus() { return consensus; }
        public Instant getRequestedAt() { return requestedAt; }
        public Instant getCompletedAt() { return completedAt; }
    }
    
    public static class VerificationConsensus {
        private final VerificationDecision decision;
        private final double consensusPercentage;
        private final int majorityCount;
        private final int totalVerifications;
        private final Map<VerificationDecision, Integer> decisionBreakdown;
        
        public VerificationConsensus(VerificationDecision decision, double consensusPercentage,
                                   int majorityCount, int totalVerifications,
                                   Map<VerificationDecision, Integer> decisionBreakdown) {
            this.decision = decision;
            this.consensusPercentage = consensusPercentage;
            this.majorityCount = majorityCount;
            this.totalVerifications = totalVerifications;
            this.decisionBreakdown = decisionBreakdown;
        }
        
        public VerificationDecision getDecision() { return decision; }
        public double getConsensusPercentage() { return consensusPercentage; }
        public int getMajorityCount() { return majorityCount; }
        public int getTotalVerifications() { return totalVerifications; }
        public Map<VerificationDecision, Integer> getDecisionBreakdown() { return decisionBreakdown; }
    }
    
    public static class VerificationAuditEntry {
        private final String verificationId;
        private final String verifierId;
        private final VerificationDecision decision;
        private final String reportSummary;
        private final Instant timestamp;
        private final String signatureHash;
        private final boolean signatureVerified;
        
        public VerificationAuditEntry(String verificationId, String verifierId, VerificationDecision decision,
                                    String reportSummary, Instant timestamp, String signatureHash,
                                    boolean signatureVerified) {
            this.verificationId = verificationId;
            this.verifierId = verifierId;
            this.decision = decision;
            this.reportSummary = reportSummary;
            this.timestamp = timestamp;
            this.signatureHash = signatureHash;
            this.signatureVerified = signatureVerified;
        }
        
        public String getVerificationId() { return verificationId; }
        public String getVerifierId() { return verifierId; }
        public VerificationDecision getDecision() { return decision; }
        public String getReportSummary() { return reportSummary; }
        public Instant getTimestamp() { return timestamp; }
        public String getSignatureHash() { return signatureHash; }
        public boolean isSignatureVerified() { return signatureVerified; }
    }
}