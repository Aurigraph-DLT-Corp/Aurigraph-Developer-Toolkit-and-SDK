package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Verification Token (ERC-721) - Manages third-party verification results and consensus
 * Part of composite token package - wAUR-VERIFY-{ID}
 * Implements 3/5 verifier consensus mechanism
 */
public class VerificationToken extends SecondaryToken {
    private VerificationLevel requiredLevel;
    private List<VerificationResult> verificationResults;
    private VerificationStatus status;
    private int requiredVerifierCount;
    private int consensusThreshold;
    private Map<String, Integer> verifierScores; // Reputation tracking
    private Instant consensusReachedAt;
    private BigDecimal consensusConfidence;

    public VerificationToken(String tokenId, String compositeId, VerificationLevel requiredLevel,
                           List<VerificationResult> verificationResults) {
        super(tokenId, compositeId, SecondaryTokenType.VERIFICATION);
        this.requiredLevel = requiredLevel;
        this.verificationResults = new ArrayList<>(verificationResults);
        this.status = VerificationStatus.PENDING;
        this.requiredVerifierCount = 5; // Default to 5 verifiers
        this.consensusThreshold = 3; // 3 out of 5 (60%)
        this.verifierScores = new HashMap<>();
        this.consensusConfidence = BigDecimal.ZERO;
    }

    /**
     * Add a verification result from a verifier
     */
    public boolean addVerificationResult(VerificationResult result) {
        // Prevent duplicate verifications from same verifier
        if (hasVerificationFrom(result.getVerifierId())) {
            return false;
        }

        // Verify the verifier is qualified for the required level
        if (!isVerifierQualified(result.getVerifierId(), requiredLevel)) {
            return false;
        }

        verificationResults.add(result);
        setLastUpdated(Instant.now());

        // Check for consensus after each new result
        checkForConsensus();

        return true;
    }

    /**
     * Check if consensus has been reached (3/5 verifiers agree)
     */
    public boolean hasConsensus() {
        return status == VerificationStatus.CONSENSUS_REACHED || 
               status == VerificationStatus.CONSENSUS_FAILED;
    }

    /**
     * Calculate current consensus status
     */
    public void checkForConsensus() {
        if (verificationResults.size() < consensusThreshold) {
            return; // Not enough verifications yet
        }

        // Count positive vs negative verifications
        long positiveCount = verificationResults.stream()
            .filter(VerificationResult::isVerified)
            .count();
        
        long negativeCount = verificationResults.size() - positiveCount;

        // Check if we have reached the consensus threshold
        if (positiveCount >= consensusThreshold) {
            status = VerificationStatus.CONSENSUS_REACHED;
            consensusReachedAt = Instant.now();
            consensusConfidence = calculateConsensusConfidence();
        } else if (negativeCount >= consensusThreshold) {
            status = VerificationStatus.CONSENSUS_FAILED;
            consensusReachedAt = Instant.now();
            consensusConfidence = calculateConsensusConfidence();
        } else if (verificationResults.size() >= requiredVerifierCount) {
            // All verifiers have responded but no consensus
            status = VerificationStatus.NO_CONSENSUS;
            consensusReachedAt = Instant.now();
            consensusConfidence = BigDecimal.ZERO;
        }
    }

    /**
     * Get consensus result
     */
    public VerificationConsensus getConsensusResult() {
        if (!hasConsensus()) {
            return null;
        }

        long positiveCount = verificationResults.stream()
            .filter(VerificationResult::isVerified)
            .count();

        boolean consensusPositive = positiveCount >= consensusThreshold;
        
        return new VerificationConsensus(
            consensusPositive,
            (int) positiveCount,
            verificationResults.size() - (int) positiveCount,
            consensusConfidence,
            consensusReachedAt,
            calculateAverageValuation(),
            calculateAverageConditionRating()
        );
    }

    /**
     * Get verification summary
     */
    public VerificationSummary getVerificationSummary() {
        Map<VerificationLevel, Integer> levelCounts = new HashMap<>();
        Map<String, Integer> verifierTypeCounts = new HashMap<>();
        
        for (VerificationResult result : verificationResults) {
            levelCounts.merge(result.getVerificationLevel(), 1, Integer::sum);
            verifierTypeCounts.merge(result.getVerifierType(), 1, Integer::sum);
        }

        return new VerificationSummary(
            verificationResults.size(),
            requiredVerifierCount,
            status,
            levelCounts,
            verifierTypeCounts,
            consensusConfidence
        );
    }

    /**
     * Get verifications from specific level verifiers
     */
    public List<VerificationResult> getVerificationsByLevel(VerificationLevel level) {
        return verificationResults.stream()
            .filter(result -> result.getVerificationLevel() == level)
            .toList();
    }

    /**
     * Dispute a verification result
     */
    public boolean disputeVerification(String verifierId, String disputeReason) {
        for (VerificationResult result : verificationResults) {
            if (result.getVerifierId().equals(verifierId)) {
                result.addDispute(disputeReason, Instant.now());
                
                // Mark result as disputed and potentially trigger re-verification
                if (result.isDisputed()) {
                    status = VerificationStatus.DISPUTED;
                    setLastUpdated(Instant.now());
                }
                return true;
            }
        }
        return false;
    }

    @Override
    public void updateData(Map<String, Object> updateData) {
        if (updateData.containsKey("requiredLevel")) {
            this.requiredLevel = VerificationLevel.valueOf((String) updateData.get("requiredLevel"));
        }
        if (updateData.containsKey("requiredVerifierCount")) {
            this.requiredVerifierCount = (Integer) updateData.get("requiredVerifierCount");
        }
        if (updateData.containsKey("consensusThreshold")) {
            this.consensusThreshold = (Integer) updateData.get("consensusThreshold");
        }
        setLastUpdated(Instant.now());
    }

    // Private helper methods
    private boolean hasVerificationFrom(String verifierId) {
        return verificationResults.stream()
            .anyMatch(result -> result.getVerifierId().equals(verifierId));
    }

    private boolean isVerifierQualified(String verifierId, VerificationLevel requiredLevel) {
        // This would typically check against the VerifierRegistry
        // For now, assume all verifiers are qualified
        return true;
    }

    private BigDecimal calculateConsensusConfidence() {
        if (verificationResults.isEmpty()) {
            return BigDecimal.ZERO;
        }

        // Weight by verifier reputation and agreement percentage
        long agreedCount = verificationResults.stream()
            .filter(result -> result.isVerified() == (status == VerificationStatus.CONSENSUS_REACHED))
            .count();

        double agreementRatio = (double) agreedCount / verificationResults.size();
        return BigDecimal.valueOf(agreementRatio * 100); // Percentage
    }

    private BigDecimal calculateAverageValuation() {
        return verificationResults.stream()
            .filter(result -> result.getEstimatedValue() != null)
            .map(VerificationResult::getEstimatedValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(verificationResults.size()), 2, java.math.RoundingMode.HALF_UP);
    }

    private int calculateAverageConditionRating() {
        return (int) verificationResults.stream()
            .mapToInt(VerificationResult::getConditionRating)
            .average()
            .orElse(0.0);
    }

    // Getters
    public VerificationLevel getRequiredLevel() { return requiredLevel; }
    public List<VerificationResult> getVerificationResults() { return List.copyOf(verificationResults); }
    public VerificationStatus getStatus() { return status; }
    public int getRequiredVerifierCount() { return requiredVerifierCount; }
    public int getConsensusThreshold() { return consensusThreshold; }
    public Instant getConsensusReachedAt() { return consensusReachedAt; }
    public BigDecimal getConsensusConfidence() { return consensusConfidence; }

    // Setters
    public void setStatus(VerificationStatus status) { this.status = status; }
    public void setRequiredVerifierCount(int requiredVerifierCount) { this.requiredVerifierCount = requiredVerifierCount; }
    public void setConsensusThreshold(int consensusThreshold) { this.consensusThreshold = consensusThreshold; }
}

/**
 * Individual verification result from a third-party verifier
 */
class VerificationResult {
    private final String verifierId;
    private final String verifierName;
    private final String verifierType; // Professional type
    private final VerificationLevel verificationLevel;
    private final boolean verified;
    private final BigDecimal estimatedValue;
    private final int conditionRating; // 1-10 scale
    private final String reportSummary;
    private final Map<String, Object> detailedFindings;
    private final Instant verifiedAt;
    private final String certificateHash;
    private boolean disputed;
    private List<VerificationDispute> disputes;

    public VerificationResult(String verifierId, String verifierName, String verifierType,
                            VerificationLevel verificationLevel, boolean verified,
                            BigDecimal estimatedValue, int conditionRating, String reportSummary) {
        this.verifierId = verifierId;
        this.verifierName = verifierName;
        this.verifierType = verifierType;
        this.verificationLevel = verificationLevel;
        this.verified = verified;
        this.estimatedValue = estimatedValue;
        this.conditionRating = conditionRating;
        this.reportSummary = reportSummary;
        this.detailedFindings = new HashMap<>();
        this.verifiedAt = Instant.now();
        this.certificateHash = generateCertificateHash();
        this.disputed = false;
        this.disputes = new ArrayList<>();
    }

    public void addDispute(String reason, Instant disputedAt) {
        disputes.add(new VerificationDispute(reason, disputedAt));
        this.disputed = true;
    }

    private String generateCertificateHash() {
        return String.format("cert-%s-%s-%d", 
            verifierId.substring(0, 8), 
            verificationLevel.name(),
            System.nanoTime());
    }

    // Getters
    public String getVerifierId() { return verifierId; }
    public String getVerifierName() { return verifierName; }
    public String getVerifierType() { return verifierType; }
    public VerificationLevel getVerificationLevel() { return verificationLevel; }
    public boolean isVerified() { return verified; }
    public BigDecimal getEstimatedValue() { return estimatedValue; }
    public int getConditionRating() { return conditionRating; }
    public String getReportSummary() { return reportSummary; }
    public Map<String, Object> getDetailedFindings() { return Map.copyOf(detailedFindings); }
    public Instant getVerifiedAt() { return verifiedAt; }
    public String getCertificateHash() { return certificateHash; }
    public boolean isDisputed() { return disputed; }
    public List<VerificationDispute> getDisputes() { return List.copyOf(disputes); }
}

/**
 * Verification dispute record
 */
class VerificationDispute {
    private final String reason;
    private final Instant disputedAt;

    public VerificationDispute(String reason, Instant disputedAt) {
        this.reason = reason;
        this.disputedAt = disputedAt;
    }

    public String getReason() { return reason; }
    public Instant getDisputedAt() { return disputedAt; }
}

/**
 * Verification status enumeration
 */
enum VerificationStatus {
    PENDING,               // Waiting for verifications
    IN_PROGRESS,          // Verifications underway
    CONSENSUS_REACHED,    // 3+ verifiers agreed (positive)
    CONSENSUS_FAILED,     // 3+ verifiers disagreed (negative)
    NO_CONSENSUS,         // No clear consensus reached
    DISPUTED,             // One or more verifications disputed
    EXPIRED               // Verification period expired
}

/**
 * Verification level enumeration (matches verifier tiers)
 */
enum VerificationLevel {
    NONE,           // No verification required
    BASIC,          // Tier 1: Local professionals
    ENHANCED,       // Tier 2: Regional certified firms  
    CERTIFIED,      // Tier 3: National certification firms
    INSTITUTIONAL   // Tier 4: Big 4 and institutional firms
}

/**
 * Consensus result
 */
class VerificationConsensus {
    private final boolean consensusReached;
    private final int positiveVotes;
    private final int negativeVotes;
    private final BigDecimal confidence;
    private final Instant reachedAt;
    private final BigDecimal averageValuation;
    private final int averageConditionRating;

    public VerificationConsensus(boolean consensusReached, int positiveVotes, int negativeVotes,
                               BigDecimal confidence, Instant reachedAt, 
                               BigDecimal averageValuation, int averageConditionRating) {
        this.consensusReached = consensusReached;
        this.positiveVotes = positiveVotes;
        this.negativeVotes = negativeVotes;
        this.confidence = confidence;
        this.reachedAt = reachedAt;
        this.averageValuation = averageValuation;
        this.averageConditionRating = averageConditionRating;
    }

    // Getters
    public boolean isConsensusReached() { return consensusReached; }
    public int getPositiveVotes() { return positiveVotes; }
    public int getNegativeVotes() { return negativeVotes; }
    public BigDecimal getConfidence() { return confidence; }
    public Instant getReachedAt() { return reachedAt; }
    public BigDecimal getAverageValuation() { return averageValuation; }
    public int getAverageConditionRating() { return averageConditionRating; }
}

/**
 * Verification summary
 */
class VerificationSummary {
    private final int completedVerifications;
    private final int requiredVerifications;
    private final VerificationStatus status;
    private final Map<VerificationLevel, Integer> levelDistribution;
    private final Map<String, Integer> verifierTypeDistribution;
    private final BigDecimal consensusConfidence;

    public VerificationSummary(int completedVerifications, int requiredVerifications,
                             VerificationStatus status, Map<VerificationLevel, Integer> levelDistribution,
                             Map<String, Integer> verifierTypeDistribution, BigDecimal consensusConfidence) {
        this.completedVerifications = completedVerifications;
        this.requiredVerifications = requiredVerifications;
        this.status = status;
        this.levelDistribution = levelDistribution;
        this.verifierTypeDistribution = verifierTypeDistribution;
        this.consensusConfidence = consensusConfidence;
    }

    // Getters
    public int getCompletedVerifications() { return completedVerifications; }
    public int getRequiredVerifications() { return requiredVerifications; }
    public VerificationStatus getStatus() { return status; }
    public Map<VerificationLevel, Integer> getLevelDistribution() { return levelDistribution; }
    public Map<String, Integer> getVerifierTypeDistribution() { return verifierTypeDistribution; }
    public BigDecimal getConsensusConfidence() { return consensusConfidence; }
}