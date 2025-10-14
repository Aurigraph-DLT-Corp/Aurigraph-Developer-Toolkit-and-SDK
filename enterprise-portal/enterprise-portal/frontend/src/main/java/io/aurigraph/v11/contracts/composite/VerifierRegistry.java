package io.aurigraph.v11.contracts.composite;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import io.quarkus.logging.Log;

/**
 * Verifier Registry - Manages third-party verifiers and verification requests
 * Implements 4-tier verifier system with reputation scoring and automated assignment
 */
@ApplicationScoped
public class VerifierRegistry {
    
    private final Map<String, ThirdPartyVerifier> verifiers = new ConcurrentHashMap<>();
    private final Map<String, VerificationRequest> activeRequests = new ConcurrentHashMap<>();
    private final Map<String, List<String>> verifiersByTier = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> verifierReputation = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong(0);

    public VerifierRegistry() {
        initializeDefaultVerifiers();
    }

    /**
     * Register a new third-party verifier
     */
    public Uni<String> registerVerifier(ThirdPartyVerifier verifier) {
        return Uni.createFrom().item(() -> {
            String verifierId = generateVerifierId(verifier);
            verifier.setVerifierId(verifierId);
            verifier.setRegisteredAt(Instant.now());
            verifier.setStatus(VerifierStatus.PENDING_APPROVAL);
            
            verifiers.put(verifierId, verifier);
            
            // Initialize reputation score
            verifierReputation.put(verifierId, BigDecimal.valueOf(50)); // Start with neutral score
            
            Log.infof("Registered new verifier: %s (%s) - %s", 
                verifier.getName(), verifierId, verifier.getTier());
            
            return verifierId;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Approve a verifier for active duty
     */
    public Uni<Boolean> approveVerifier(String verifierId) {
        return Uni.createFrom().item(() -> {
            ThirdPartyVerifier verifier = verifiers.get(verifierId);
            if (verifier == null) {
                return false;
            }
            
            verifier.setStatus(VerifierStatus.ACTIVE);
            verifier.setApprovedAt(Instant.now());
            
            // Add to tier-based lookup
            String tierKey = verifier.getTier().name();
            verifiersByTier.computeIfAbsent(tierKey, k -> new ArrayList<>()).add(verifierId);
            
            Log.infof("Approved verifier: %s for %s tier", verifier.getName(), verifier.getTier());
            
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Request verification for a composite token
     */
    public Uni<String> requestVerification(String compositeId, String assetType, 
                                         VerificationLevel requiredLevel, int verifierCount) {
        return Uni.createFrom().item(() -> {
            String requestId = generateRequestId(compositeId);
            
            // Find qualified verifiers for the required level
            List<String> qualifiedVerifiers = findQualifiedVerifiers(requiredLevel, assetType, verifierCount);
            
            if (qualifiedVerifiers.size() < verifierCount) {
                throw new InsufficientVerifiersException(
                    String.format("Only %d qualified verifiers available, need %d", 
                        qualifiedVerifiers.size(), verifierCount));
            }
            
            VerificationRequest request = new VerificationRequest(
                requestId,
                compositeId,
                assetType,
                requiredLevel,
                qualifiedVerifiers.subList(0, verifierCount),
                Instant.now()
            );
            
            activeRequests.put(requestId, request);
            
            // Notify assigned verifiers
            for (String verifierId : qualifiedVerifiers.subList(0, verifierCount)) {
                notifyVerifier(verifierId, request);
            }
            
            Log.infof("Created verification request %s for composite %s with %d verifiers", 
                requestId, compositeId, verifierCount);
            
            return requestId;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Submit verification result
     */
    public Uni<Boolean> submitVerificationResult(String requestId, String verifierId, 
                                               VerificationResult result) {
        return Uni.createFrom().item(() -> {
            VerificationRequest request = activeRequests.get(requestId);
            if (request == null) {
                return false;
            }
            
            if (!request.getAssignedVerifiers().contains(verifierId)) {
                throw new UnauthorizedVerifierException("Verifier not assigned to this request");
            }
            
            // Add result to request
            request.addVerificationResult(result);
            
            // Update verifier performance metrics
            updateVerifierPerformance(verifierId, result);
            
            // Check if request is complete
            if (request.isComplete()) {
                processCompletedRequest(request);
            }
            
            Log.infof("Received verification result from %s for request %s", verifierId, requestId);
            
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get verifier statistics
     */
    public Uni<VerifierStats> getVerifierStats() {
        return Uni.createFrom().item(() -> {
            Map<VerifierTier, Integer> tierCounts = new HashMap<>();
            Map<VerifierStatus, Integer> statusCounts = new HashMap<>();
            
            for (ThirdPartyVerifier verifier : verifiers.values()) {
                tierCounts.merge(verifier.getTier(), 1, Integer::sum);
                statusCounts.merge(verifier.getStatus(), 1, Integer::sum);
            }
            
            int activeRequests = (int) this.activeRequests.values().stream()
                .filter(req -> !req.isComplete())
                .count();
            
            return new VerifierStats(
                verifiers.size(),
                tierCounts,
                statusCounts,
                activeRequests,
                calculateAverageReputation()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get verifiers by tier
     */
    public Uni<List<ThirdPartyVerifier>> getVerifiersByTier(VerifierTier tier) {
        return Uni.createFrom().item(() -> {
            List<String> verifierIds = verifiersByTier.getOrDefault(tier.name(), new ArrayList<>());
            
            return verifierIds.stream()
                .map(verifiers::get)
                .filter(Objects::nonNull)
                .filter(v -> v.getStatus() == VerifierStatus.ACTIVE)
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get verifier performance metrics
     */
    public Uni<VerifierPerformance> getVerifierPerformance(String verifierId) {
        return Uni.createFrom().item(() -> {
            ThirdPartyVerifier verifier = verifiers.get(verifierId);
            if (verifier == null) {
                return null;
            }
            
            BigDecimal reputation = verifierReputation.getOrDefault(verifierId, BigDecimal.ZERO);
            
            return new VerifierPerformance(
                verifierId,
                verifier.getName(),
                verifier.getTier(),
                reputation,
                verifier.getCompletedVerifications(),
                verifier.getSuccessRate(),
                verifier.getAverageResponseTime()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private void initializeDefaultVerifiers() {
        // Initialize some default verifiers for testing
        List<ThirdPartyVerifier> defaultVerifiers = Arrays.asList(
            new ThirdPartyVerifier("ACME Appraisals", VerifierTier.TIER_1, "Real Estate", 
                                 "Licensed real estate appraisers", "contact@acme-appraisals.com"),
            new ThirdPartyVerifier("Global Certification Corp", VerifierTier.TIER_2, "Multi-Asset", 
                                 "Regional certification specialists", "info@globalcert.com"),
            new ThirdPartyVerifier("Platinum Valuations", VerifierTier.TIER_3, "High-Value Assets", 
                                 "National certification firm", "contact@platinumval.com"),
            new ThirdPartyVerifier("Big Four Consulting", VerifierTier.TIER_4, "Institutional", 
                                 "Major institutional verification services", "enterprise@bigfour.com")
        );

        for (ThirdPartyVerifier verifier : defaultVerifiers) {
            registerVerifier(verifier).await().indefinitely();
            approveVerifier(verifier.getVerifierId()).await().indefinitely();
        }
    }

    private String generateVerifierId(ThirdPartyVerifier verifier) {
        return String.format("VER-%s-%s-%d",
            verifier.getTier().name().substring(5), // Remove "TIER_"
            verifier.getName().replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(6, verifier.getName().length())),
            System.nanoTime() % 100000);
    }

    private String generateRequestId(String compositeId) {
        return String.format("REQ-%s-%d",
            compositeId.substring(compositeId.lastIndexOf('-') + 1),
            requestCounter.incrementAndGet());
    }

    private List<String> findQualifiedVerifiers(VerificationLevel requiredLevel, String assetType, int count) {
        VerifierTier requiredTier = mapVerificationLevelToTier(requiredLevel);
        
        List<String> candidates = new ArrayList<>();
        
        // Get verifiers from required tier and higher
        for (VerifierTier tier : VerifierTier.values()) {
            if (tier.ordinal() >= requiredTier.ordinal()) {
                List<String> tierVerifiers = verifiersByTier.getOrDefault(tier.name(), new ArrayList<>());
                candidates.addAll(tierVerifiers);
            }
        }
        
        // Filter by asset type specialization and active status
        List<String> qualified = candidates.stream()
            .filter(id -> {
                ThirdPartyVerifier verifier = verifiers.get(id);
                return verifier != null && 
                       verifier.getStatus() == VerifierStatus.ACTIVE &&
                       (verifier.getSpecialization().equals("Multi-Asset") || 
                        verifier.getSpecialization().contains(assetType));
            })
            .toList();
        
        // Sort by reputation score (highest first)
        qualified.sort((id1, id2) -> {
            BigDecimal rep1 = verifierReputation.getOrDefault(id1, BigDecimal.ZERO);
            BigDecimal rep2 = verifierReputation.getOrDefault(id2, BigDecimal.ZERO);
            return rep2.compareTo(rep1);
        });
        
        return qualified;
    }

    private VerifierTier mapVerificationLevelToTier(VerificationLevel level) {
        return switch (level) {
            case NONE, BASIC -> VerifierTier.TIER_1;
            case ENHANCED -> VerifierTier.TIER_2;
            case CERTIFIED -> VerifierTier.TIER_3;
            case INSTITUTIONAL -> VerifierTier.TIER_4;
        };
    }

    private void notifyVerifier(String verifierId, VerificationRequest request) {
        // In a real implementation, this would send notifications via email, API, etc.
        Log.infof("Notifying verifier %s of new verification request %s", verifierId, request.getRequestId());
    }

    private void updateVerifierPerformance(String verifierId, VerificationResult result) {
        ThirdPartyVerifier verifier = verifiers.get(verifierId);
        if (verifier != null) {
            verifier.incrementCompletedVerifications();
            
            // Update reputation based on result quality
            BigDecimal currentReputation = verifierReputation.getOrDefault(verifierId, BigDecimal.valueOf(50));
            BigDecimal adjustment = calculateReputationAdjustment(result);
            BigDecimal newReputation = currentReputation.add(adjustment);
            
            // Keep reputation between 0 and 100
            newReputation = newReputation.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
            verifierReputation.put(verifierId, newReputation);
        }
    }

    private BigDecimal calculateReputationAdjustment(VerificationResult result) {
        // Simple reputation adjustment based on result completeness and timeliness
        BigDecimal adjustment = BigDecimal.valueOf(1); // Base positive adjustment
        
        // Bonus for detailed reports
        if (result.getReportSummary() != null && result.getReportSummary().length() > 100) {
            adjustment = adjustment.add(BigDecimal.valueOf(0.5));
        }
        
        // Bonus for quick response (within 24 hours)
        if (result.getVerifiedAt().isAfter(Instant.now().minusSeconds(24 * 60 * 60))) {
            adjustment = adjustment.add(BigDecimal.valueOf(0.5));
        }
        
        return adjustment;
    }

    private void processCompletedRequest(VerificationRequest request) {
        // Process completed verification request
        Log.infof("Verification request %s completed with %d results", 
            request.getRequestId(), request.getVerificationResults().size());
        
        // Remove from active requests
        activeRequests.remove(request.getRequestId());
    }

    private BigDecimal calculateAverageReputation() {
        if (verifierReputation.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal sum = verifierReputation.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return sum.divide(BigDecimal.valueOf(verifierReputation.size()), 2, java.math.RoundingMode.HALF_UP);
    }

    // Exception classes
    public static class InsufficientVerifiersException extends RuntimeException {
        public InsufficientVerifiersException(String message) { super(message); }
    }
    
    public static class UnauthorizedVerifierException extends RuntimeException {
        public UnauthorizedVerifierException(String message) { super(message); }
    }
}