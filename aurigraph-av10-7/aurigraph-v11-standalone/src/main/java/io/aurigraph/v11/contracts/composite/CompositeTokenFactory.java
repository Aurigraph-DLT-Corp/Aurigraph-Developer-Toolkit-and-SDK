package io.aurigraph.v11.contracts.composite;

import io.aurigraph.v11.contracts.composite.repository.CompositeTokenRepositoryLevelDB;
import io.aurigraph.v11.contracts.composite.repository.SecondaryTokenRepositoryLevelDB;
import io.aurigraph.v11.contracts.erc3643.ERC3643ComplianceModule;
import io.aurigraph.v11.contracts.rwa.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import io.quarkus.logging.Log;
import org.bouncycastle.crypto.digests.SHA3Digest;
import org.bouncycastle.util.encoders.Hex;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Composite Token Factory for Real World Asset Tokenization
 * Creates comprehensive asset packages with primary + secondary tokens
 * Implements ERC-721 (primary) + ERC-1155 (secondary) token architecture
 *
 * Supports both in-memory (for testing) and LevelDB persistence modes.
 *
 * @version 2.0.0 (Dec 5, 2025 - LevelDB Persistence)
 */
@ApplicationScoped
public class CompositeTokenFactory {

    @Inject
    RWATokenizer rwaTokenizer;

    @Inject
    AssetValuationService valuationService;

    @Inject
    DigitalTwinService digitalTwinService;

    @Inject
    VerifierRegistry verifierRegistry;

    @Inject
    CompositeTokenRepositoryLevelDB compositeTokenRepository;

    @Inject
    SecondaryTokenRepositoryLevelDB secondaryTokenRepository;

    // ERC-3643 Compliance Module (optional - injected only when available)
    @Inject
    Instance<ERC3643ComplianceModule> complianceModuleInstance;

    // Configuration for persistence mode
    @ConfigProperty(name = "aurigraph.composite-token.persistence.enabled", defaultValue = "true")
    boolean persistenceEnabled;

    // ERC-3643 compliance enforcement for security token transfers
    @ConfigProperty(name = "aurigraph.erc3643.compliance.enabled", defaultValue = "false")
    boolean erc3643ComplianceEnabled;

    // In-memory fallback registry (used when persistence is disabled or for caching)
    private final Map<String, CompositeToken> compositeTokensCache = new ConcurrentHashMap<>();
    private final Map<String, List<SecondaryToken>> secondaryTokensCache = new ConcurrentHashMap<>();
    private final AtomicLong compositeTokenCounter = new AtomicLong(0);

    // Performance metrics
    private final AtomicLong totalCompositeTokensCreated = new AtomicLong(0);
    private final Map<String, AtomicLong> tokensByAssetType = new ConcurrentHashMap<>();

    /**
     * Create a complete composite token package for a real-world asset
     */
    public Uni<CompositeTokenResult> createCompositeToken(CompositeTokenCreationRequest request) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            String compositeId = generateCompositeTokenId(request);
            
            Log.infof("Creating composite token %s for asset %s of type %s", 
                compositeId, request.getAssetId(), request.getAssetType());
            
            // Step 1: Create primary asset token (ERC-721)
            PrimaryToken primaryToken = createPrimaryToken(compositeId, request);
            
            // Step 2: Create secondary tokens (ERC-1155)
            List<SecondaryToken> secondaryTokenList = createSecondaryTokens(compositeId, request);
            
            // Step 3: Create composite package
            CompositeToken compositeToken = CompositeToken.builder()
                .compositeId(compositeId)
                .assetId(request.getAssetId())
                .assetType(request.getAssetType())
                .primaryToken(primaryToken)
                .secondaryTokens(secondaryTokenList)
                .ownerAddress(request.getOwnerAddress())
                .createdAt(Instant.now())
                .status(CompositeTokenStatus.PENDING_VERIFICATION)
                .verificationLevel(VerificationLevel.NONE)
                .build();
            
            // Step 4: Store in registries (both cache and persistent storage)
            compositeTokensCache.put(compositeId, compositeToken);
            secondaryTokensCache.put(compositeId, secondaryTokenList);

            // Persist to LevelDB if enabled
            if (persistenceEnabled) {
                compositeTokenRepository.persist(compositeToken).await().indefinitely();
                secondaryTokenRepository.persistAll(compositeId, secondaryTokenList).await().indefinitely();
            }
            
            // Step 5: Initialize verification process
            initiateVerificationProcess(compositeToken, request);
            
            // Step 6: Update metrics
            totalCompositeTokensCreated.incrementAndGet();
            tokensByAssetType.computeIfAbsent(request.getAssetType(), k -> new AtomicLong(0)).incrementAndGet();
            
            long endTime = System.nanoTime();
            
            CompositeTokenResult result = new CompositeTokenResult(
                compositeToken, true, "Composite token created successfully", 
                endTime - startTime
            );
            
            Log.infof("Successfully created composite token %s in %d ns", 
                compositeId, endTime - startTime);
            
            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get composite token by ID
     */
    public Uni<CompositeToken> getCompositeToken(String compositeId) {
        // First check cache
        CompositeToken cached = compositeTokensCache.get(compositeId);
        if (cached != null) {
            return Uni.createFrom().item(cached);
        }

        // If not in cache and persistence is enabled, load from LevelDB
        if (persistenceEnabled) {
            return compositeTokenRepository.findByCompositeId(compositeId)
                .map(opt -> {
                    if (opt.isPresent()) {
                        // Cache the loaded token
                        compositeTokensCache.put(compositeId, opt.get());
                        return opt.get();
                    }
                    return null;
                });
        }

        return Uni.createFrom().nullItem();
    }

    /**
     * Update secondary token in composite package
     */
    public Uni<Boolean> updateSecondaryToken(String compositeId, SecondaryTokenType tokenType,
                                           Map<String, Object> updateData) {
        return getSecondaryTokens(compositeId).flatMap(tokens -> {
            if (tokens == null || tokens.isEmpty()) {
                return Uni.createFrom().item(false);
            }

            // Find and update the specific secondary token
            for (SecondaryToken token : tokens) {
                if (token.getTokenType() == tokenType) {
                    token.updateData(updateData);
                    token.setLastUpdated(Instant.now());

                    // Persist the update if enabled
                    if (persistenceEnabled) {
                        return secondaryTokenRepository.persist(token)
                            .map(persisted -> {
                                Log.infof("Updated secondary token %s for composite %s",
                                    tokenType, compositeId);
                                return true;
                            });
                    } else {
                        Log.infof("Updated secondary token %s for composite %s",
                            tokenType, compositeId);
                        return Uni.createFrom().item(true);
                    }
                }
            }

            return Uni.createFrom().item(false);
        });
    }

    /**
     * Add verification result to composite token
     */
    public Uni<Boolean> addVerificationResult(String compositeId, VerificationResult result) {
        return getCompositeToken(compositeId).flatMap(composite -> {
            if (composite == null) {
                return Uni.createFrom().item(false);
            }

            return getSecondaryTokens(compositeId).flatMap(tokens -> {
                for (SecondaryToken token : tokens) {
                    if (token.getTokenType() == SecondaryTokenType.VERIFICATION) {
                        VerificationToken verificationToken = (VerificationToken) token;
                        verificationToken.addVerificationResult(result);

                        // Check if we have reached consensus
                        if (verificationToken.hasConsensus()) {
                            composite.setStatus(CompositeTokenStatus.VERIFIED);
                            composite.setVerificationLevel(result.getVerificationLevel());

                            Log.infof("Composite token %s verified with consensus", compositeId);

                            // Persist updates if enabled
                            if (persistenceEnabled) {
                                return compositeTokenRepository.persist(composite)
                                    .flatMap(ct -> secondaryTokenRepository.persist(verificationToken))
                                    .map(vt -> true);
                            }
                        } else if (persistenceEnabled) {
                            // Just persist the verification token update
                            return secondaryTokenRepository.persist(verificationToken)
                                .map(vt -> true);
                        }

                        return Uni.createFrom().item(true);
                    }
                }
                return Uni.createFrom().item(false);
            });
        });
    }

    /**
     * Transfer ownership of entire composite token package
     *
     * When ERC-3643 compliance is enabled, this method will:
     * 1. Check if both sender and recipient have verified identities
     * 2. Validate required claims (KYC, AML, Accredited Investor, etc.)
     * 3. Enforce country restrictions and transfer limits
     * 4. Only proceed with transfer if all compliance checks pass
     */
    public Uni<Boolean> transferCompositeToken(String compositeId, String fromAddress,
                                             String toAddress) {
        return getCompositeToken(compositeId).flatMap(composite -> {
            if (composite == null) {
                return Uni.createFrom().item(false);
            }

            // Verify current ownership
            if (!fromAddress.equals(composite.getOwnerAddress())) {
                return Uni.createFrom().failure(new UnauthorizedTransferException("Unauthorized transfer attempt"));
            }

            // Ensure token is verified before transfer
            if (composite.getStatus() != CompositeTokenStatus.VERIFIED) {
                return Uni.createFrom().failure(new IllegalStateException("Cannot transfer unverified composite token"));
            }

            // ERC-3643 Compliance Check (if enabled)
            if (erc3643ComplianceEnabled && complianceModuleInstance.isResolvable()) {
                ERC3643ComplianceModule complianceModule = complianceModuleInstance.get();

                // Create transfer request for compliance check
                ERC3643ComplianceModule.TransferRequest transferRequest =
                    new ERC3643ComplianceModule.TransferRequest(
                        compositeId,           // tokenId
                        fromAddress,           // from
                        toAddress,             // to
                        BigDecimal.ONE,        // amount (1 for ERC-721 style tokens)
                        Map.of("transferType", "composite_transfer")  // metadata
                    );

                Log.infof("Checking ERC-3643 compliance for composite token %s transfer from %s to %s",
                    compositeId, fromAddress, toAddress);

                return complianceModule.canTransfer(transferRequest)
                    .flatMap((ERC3643ComplianceModule.TransferValidation result) -> {
                        if (!result.allowed()) {
                            Log.warnf("ERC-3643 compliance check FAILED for composite token %s: %s (reasons: %s)",
                                compositeId, result.message(), String.join(", ", result.failedChecks()));
                            return Uni.createFrom().<Boolean>failure(
                                new ComplianceCheckFailedException(
                                    "ERC-3643 compliance check failed: " + result.message(),
                                    result.failedChecks()
                                )
                            );
                        }

                        Log.infof("ERC-3643 compliance check PASSED for composite token %s (checks: %s)",
                            compositeId, String.join(", ", result.passedChecks()));

                        // Proceed with transfer after compliance check passes
                        return executeTransfer(composite, compositeId, fromAddress, toAddress);
                    });
            }

            // No ERC-3643 compliance required - proceed with transfer directly
            return executeTransfer(composite, compositeId, fromAddress, toAddress);
        });
    }

    /**
     * Execute the actual token transfer after all validations pass
     */
    private Uni<Boolean> executeTransfer(CompositeToken composite, String compositeId,
                                         String fromAddress, String toAddress) {
        // Update ownership in all tokens
        composite.setOwnerAddress(toAddress);
        composite.getPrimaryToken().setOwnerAddress(toAddress);

        return getSecondaryTokens(compositeId).flatMap(tokens -> {
            OwnerToken ownerToken = null;

            // Find and update owner token
            for (SecondaryToken token : tokens) {
                if (token.getTokenType() == SecondaryTokenType.OWNER) {
                    ownerToken = (OwnerToken) token;
                    ownerToken.recordTransfer(fromAddress, toAddress);
                    break;
                }
            }

            Log.infof("Transferred composite token %s from %s to %s",
                compositeId, fromAddress, toAddress);

            // Persist updates if enabled
            if (persistenceEnabled && ownerToken != null) {
                final OwnerToken finalOwnerToken = ownerToken;
                return compositeTokenRepository.persist(composite)
                    .flatMap(ct -> secondaryTokenRepository.persist(finalOwnerToken))
                    .map(ot -> true);
            }

            return Uni.createFrom().item(true);
        });
    }

    /**
     * Get all secondary tokens for a composite token
     */
    public Uni<List<SecondaryToken>> getSecondaryTokens(String compositeId) {
        // First check cache
        List<SecondaryToken> cached = secondaryTokensCache.get(compositeId);
        if (cached != null && !cached.isEmpty()) {
            return Uni.createFrom().item(cached);
        }

        // If not in cache and persistence is enabled, load from LevelDB
        if (persistenceEnabled) {
            return secondaryTokenRepository.findByCompositeId(compositeId)
                .map(tokens -> {
                    if (!tokens.isEmpty()) {
                        // Cache the loaded tokens
                        secondaryTokensCache.put(compositeId, tokens);
                    }
                    return tokens;
                });
        }

        return Uni.createFrom().item(new ArrayList<>());
    }

    /**
     * Get specific secondary token by type
     */
    public Uni<SecondaryToken> getSecondaryToken(String compositeId, SecondaryTokenType tokenType) {
        return getSecondaryTokens(compositeId).map(tokens -> {
            if (tokens == null || tokens.isEmpty()) {
                return null;
            }

            return tokens.stream()
                .filter(token -> token.getTokenType() == tokenType)
                .findFirst()
                .orElse(null);
        });
    }

    /**
     * Get composite tokens by asset type
     */
    public Uni<List<CompositeToken>> getCompositeTokensByType(String assetType) {
        if (persistenceEnabled) {
            return compositeTokenRepository.findByAssetType(assetType);
        }

        return Uni.createFrom().item(() ->
            compositeTokensCache.values().stream()
                .filter(token -> assetType.equals(token.getAssetType()))
                .toList()
        );
    }

    /**
     * Get composite tokens by owner
     */
    public Uni<List<CompositeToken>> getCompositeTokensByOwner(String ownerAddress) {
        if (persistenceEnabled) {
            return compositeTokenRepository.findByOwner(ownerAddress);
        }

        return Uni.createFrom().item(() ->
            compositeTokensCache.values().stream()
                .filter(token -> ownerAddress.equals(token.getOwnerAddress()))
                .toList()
        );
    }

    /**
     * Get factory statistics
     */
    public Uni<CompositeTokenStats> getStats() {
        if (persistenceEnabled) {
            return compositeTokenRepository.getStatistics()
                .map(stats -> new CompositeTokenStats(
                    (int) stats.totalTokens(),
                    stats.byAssetType(),
                    stats.byStatus(),
                    totalCompositeTokensCreated.get(),
                    BigDecimal.ZERO // Value calculation would need async operation
                ));
        }

        return Uni.createFrom().item(() -> {
            Map<String, Long> typeDistribution = new HashMap<>();
            Map<CompositeTokenStatus, Long> statusDistribution = new HashMap<>();

            for (CompositeToken token : compositeTokensCache.values()) {
                // Count by asset type
                String type = token.getAssetTypeString();
                typeDistribution.merge(type, 1L, Long::sum);

                // Count by status
                CompositeTokenStatus status = token.getStatus();
                statusDistribution.merge(status, 1L, Long::sum);
            }

            return new CompositeTokenStats(
                compositeTokensCache.size(),
                typeDistribution,
                statusDistribution,
                totalCompositeTokensCreated.get(),
                calculateTotalValue()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private String generateCompositeTokenId(CompositeTokenCreationRequest request) {
        SHA3Digest digest = new SHA3Digest(256);
        String input = request.getAssetId() + request.getAssetType() + 
                      System.nanoTime() + compositeTokenCounter.incrementAndGet();
        byte[] inputBytes = input.getBytes();
        digest.update(inputBytes, 0, inputBytes.length);
        byte[] hash = new byte[32];
        digest.doFinal(hash, 0);
        return "wAUR-COMPOSITE-" + Hex.toHexString(hash).substring(0, 16).toUpperCase();
    }

    private PrimaryToken createPrimaryToken(String compositeId, CompositeTokenCreationRequest request) {
        String primaryTokenId = compositeId.replace("COMPOSITE", "ASSET");
        
        return PrimaryToken.builder()
            .tokenId(primaryTokenId)
            .compositeId(compositeId)
            .assetId(request.getAssetId())
            .assetType(request.getAssetType())
            .ownerAddress(request.getOwnerAddress())
            .legalTitle(request.getLegalTitle())
            .jurisdiction(request.getJurisdiction())
            .coordinates(request.getCoordinates())
            .fractionalizable(request.isFractionalizable())
            .createdAt(Instant.now())
            .build();
    }

    private List<SecondaryToken> createSecondaryTokens(String compositeId, CompositeTokenCreationRequest request) {
        List<SecondaryToken> tokens = new ArrayList<>();
        
        // 1. Owner Token (ERC-721)
        OwnerToken ownerToken = new OwnerToken(
            compositeId.replace("COMPOSITE", "OWNER"),
            compositeId,
            request.getOwnerAddress(),
            BigDecimal.valueOf(100), // 100% ownership initially
            new ArrayList<>() // Empty transfer history initially
        );
        tokens.add(ownerToken);
        
        // 2. Collateral Token (ERC-1155)
        CollateralToken collateralToken = new CollateralToken(
            compositeId.replace("COMPOSITE", "COLL"),
            compositeId,
            new ArrayList<>() // Empty collateral list initially
        );
        tokens.add(collateralToken);
        
        // 3. Media Token (ERC-1155)
        MediaToken mediaToken = new MediaToken(
            compositeId.replace("COMPOSITE", "MEDIA"),
            compositeId,
            new ArrayList<>() // Empty media list initially
        );
        tokens.add(mediaToken);
        
        // 4. Verification Token (ERC-721)
        VerificationToken verificationToken = new VerificationToken(
            compositeId.replace("COMPOSITE", "VERIFY"),
            compositeId,
            request.getRequiredVerificationLevel(),
            new ArrayList<>() // Empty verification results initially
        );
        tokens.add(verificationToken);
        
        // 5. Valuation Token (ERC-20)
        ValuationToken valuationToken = new ValuationToken(
            compositeId.replace("COMPOSITE", "VALUE"),
            compositeId,
            BigDecimal.ZERO, // Will be updated by valuation service
            new ArrayList<>() // Empty price history initially
        );
        tokens.add(valuationToken);
        
        // 6. Compliance Token (ERC-721)
        ComplianceToken complianceToken = new ComplianceToken(
            compositeId.replace("COMPOSITE", "COMPLY"),
            compositeId,
            ComplianceStatus.PENDING,
            new HashMap<>() // Empty compliance data initially
        );
        tokens.add(complianceToken);
        
        return tokens;
    }

    private void initiateVerificationProcess(CompositeToken compositeToken, CompositeTokenCreationRequest request) {
        // Request verification from appropriate tier verifiers
        VerificationLevel requiredLevel = request.getRequiredVerificationLevel();
        
        verifierRegistry.requestVerification(
            compositeToken.getCompositeId(),
            compositeToken.getAssetTypeString(),
            requiredLevel,
            3 // Number of verifiers required for consensus
        );
        
        Log.infof("Initiated %s verification process for composite token %s", 
            requiredLevel, compositeToken.getCompositeId());
    }

    private BigDecimal calculateTotalValue() {
        return compositeTokensCache.values().stream()
            .map(token -> {
                // Get valuation from valuation token
                List<SecondaryToken> tokens = secondaryTokensCache.get(token.getCompositeId());
                if (tokens != null) {
                    for (SecondaryToken secondaryToken : tokens) {
                        if (secondaryToken.getTokenType() == SecondaryTokenType.VALUATION) {
                            ValuationToken valuationToken = (ValuationToken) secondaryToken;
                            return valuationToken.getCurrentValue();
                        }
                    }
                }
                return BigDecimal.ZERO;
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Exception classes
    public static class UnauthorizedTransferException extends RuntimeException {
        public UnauthorizedTransferException(String message) { super(message); }
    }

    public static class VerificationRequiredException extends RuntimeException {
        public VerificationRequiredException(String message) { super(message); }
    }

    /**
     * Exception thrown when ERC-3643 compliance check fails.
     * Contains detailed information about which compliance checks failed.
     */
    public static class ComplianceCheckFailedException extends RuntimeException {
        private final List<String> failedChecks;

        public ComplianceCheckFailedException(String message, List<String> failedChecks) {
            super(message);
            this.failedChecks = failedChecks != null ? new ArrayList<>(failedChecks) : new ArrayList<>();
        }

        public List<String> getFailedChecks() {
            return Collections.unmodifiableList(failedChecks);
        }
    }
}