package io.aurigraph.v11.contracts;

import io.aurigraph.v11.tokens.TokenManagementService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Token Binding Service for ActiveContracts
 *
 * Manages the binding of tokens to ActiveContracts for:
 * - Primary asset tokens (main tokenized asset)
 * - Secondary tokens (revenue shares, royalties, rights)
 * - Composite tokens (bundles of related tokens)
 * - Token ownership verification
 * - Token locking during contract execution
 *
 * @version 12.0.0
 * @since 2025-12-21
 */
@ApplicationScoped
public class TokenBindingService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TokenBindingService.class);

    @Inject
    ActiveContractService contractService;

    @Inject
    TokenManagementService tokenManagementService;

    // In-memory storage for token bindings (will be migrated to LevelDB)
    private final Map<String, List<TokenBinding>> contractBindings = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> lockedTokens = new ConcurrentHashMap<>();

    // Performance metrics
    private final AtomicLong bindingsCreated = new AtomicLong(0);
    private final AtomicLong tokensLocked = new AtomicLong(0);
    private final AtomicLong tokensReleased = new AtomicLong(0);
    private final AtomicLong ownershipVerifications = new AtomicLong(0);

    // Virtual thread executor for high concurrency
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    /**
     * Token types supported for binding
     */
    public enum TokenType {
        PRIMARY,      // Main asset token (e.g., real estate deed)
        SECONDARY,    // Revenue shares, royalties, rights
        COMPOSITE,    // Bundle of multiple tokens
        GOVERNANCE,   // Voting/governance tokens
        UTILITY,      // Access/utility tokens
        SECURITY      // Securities-backed tokens
    }

    /**
     * Token binding status
     */
    public enum BindingStatus {
        PENDING,     // Binding requested but not confirmed
        ACTIVE,      // Token is actively bound to contract
        LOCKED,      // Token is locked for contract execution
        RELEASED,    // Token has been released from contract
        REVOKED      // Binding has been revoked
    }

    // ==================== PRIMARY TOKEN BINDING ====================

    /**
     * Bind a primary asset token to a contract
     *
     * @param contractId Contract ID
     * @param tokenId Token ID to bind
     * @param stakeholder Stakeholder address owning the token
     * @return TokenBinding result
     */
    public Uni<TokenBinding> bindPrimaryToken(String contractId, String tokenId, String stakeholder) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Binding primary token {} to contract {} for stakeholder {}",
                tokenId, contractId, stakeholder);

            // Verify contract exists
            validateContract(contractId);

            // Verify token ownership
            verifyOwnership(tokenId, stakeholder);

            // Create binding
            TokenBinding binding = new TokenBinding();
            binding.setBindingId(generateBindingId());
            binding.setContractId(contractId);
            binding.setTokenId(tokenId);
            binding.setTokenType(TokenType.PRIMARY);
            binding.setStakeholder(stakeholder);
            binding.setPercentage(BigDecimal.valueOf(100)); // Primary tokens are 100%
            binding.setStatus(BindingStatus.ACTIVE);
            binding.setCreatedAt(Instant.now());
            binding.setUpdatedAt(Instant.now());

            // Store binding
            contractBindings.computeIfAbsent(contractId, k -> new ArrayList<>()).add(binding);
            bindingsCreated.incrementAndGet();

            LOGGER.info("Primary token binding created: {}", binding.getBindingId());
            return binding;
        }).runSubscriptionOn(executor);
    }

    // ==================== SECONDARY TOKEN BINDING ====================

    /**
     * Bind a secondary token to a contract (revenue share, rights, etc.)
     *
     * @param contractId Contract ID
     * @param tokenId Token ID to bind
     * @param stakeholder Stakeholder address
     * @param percentage Percentage share (0-100)
     * @return TokenBinding result
     */
    public Uni<TokenBinding> bindSecondaryToken(
            String contractId,
            String tokenId,
            String stakeholder,
            BigDecimal percentage
    ) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Binding secondary token {} to contract {} for stakeholder {} with {}%",
                tokenId, contractId, stakeholder, percentage);

            // Validate percentage
            if (percentage.compareTo(BigDecimal.ZERO) <= 0 ||
                percentage.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new TokenBindingException("Invalid percentage: must be between 0 and 100");
            }

            // Verify contract exists
            validateContract(contractId);

            // Verify token ownership
            verifyOwnership(tokenId, stakeholder);

            // Check total percentage doesn't exceed 100%
            validateSecondaryPercentage(contractId, percentage);

            // Create binding
            TokenBinding binding = new TokenBinding();
            binding.setBindingId(generateBindingId());
            binding.setContractId(contractId);
            binding.setTokenId(tokenId);
            binding.setTokenType(TokenType.SECONDARY);
            binding.setStakeholder(stakeholder);
            binding.setPercentage(percentage);
            binding.setStatus(BindingStatus.ACTIVE);
            binding.setCreatedAt(Instant.now());
            binding.setUpdatedAt(Instant.now());

            // Store binding
            contractBindings.computeIfAbsent(contractId, k -> new ArrayList<>()).add(binding);
            bindingsCreated.incrementAndGet();

            LOGGER.info("Secondary token binding created: {}", binding.getBindingId());
            return binding;
        }).runSubscriptionOn(executor);
    }

    // ==================== COMPOSITE TOKEN BINDING ====================

    /**
     * Bind a composite token bundle to a contract
     *
     * @param contractId Contract ID
     * @param compositeTokenId Composite token identifier
     * @param componentTokens List of component token IDs
     * @return TokenBinding result
     */
    public Uni<TokenBinding> bindCompositeToken(
            String contractId,
            String compositeTokenId,
            List<String> componentTokens
    ) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Binding composite token {} with {} components to contract {}",
                compositeTokenId, componentTokens.size(), contractId);

            // Verify contract exists
            validateContract(contractId);

            // Validate component tokens exist
            if (componentTokens == null || componentTokens.isEmpty()) {
                throw new TokenBindingException("Composite token must have at least one component");
            }

            // Create binding
            TokenBinding binding = new TokenBinding();
            binding.setBindingId(generateBindingId());
            binding.setContractId(contractId);
            binding.setTokenId(compositeTokenId);
            binding.setTokenType(TokenType.COMPOSITE);
            binding.setComponentTokens(new ArrayList<>(componentTokens));
            binding.setStatus(BindingStatus.ACTIVE);
            binding.setCreatedAt(Instant.now());
            binding.setUpdatedAt(Instant.now());

            // Store binding
            contractBindings.computeIfAbsent(contractId, k -> new ArrayList<>()).add(binding);
            bindingsCreated.incrementAndGet();

            LOGGER.info("Composite token binding created: {} with {} components",
                binding.getBindingId(), componentTokens.size());
            return binding;
        }).runSubscriptionOn(executor);
    }

    // ==================== TOKEN OWNERSHIP VERIFICATION ====================

    /**
     * Verify that a party owns the required tokens for a contract
     *
     * @param contractId Contract ID
     * @param partyId Party/stakeholder address
     * @return OwnershipVerification result
     */
    public Uni<OwnershipVerification> verifyTokenOwnership(String contractId, String partyId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Verifying token ownership for party {} in contract {}", partyId, contractId);

            // Get all bindings for this contract and party
            List<TokenBinding> bindings = contractBindings.getOrDefault(contractId, new ArrayList<>())
                .stream()
                .filter(b -> partyId.equals(b.getStakeholder()))
                .collect(Collectors.toList());

            if (bindings.isEmpty()) {
                return new OwnershipVerification(
                    contractId,
                    partyId,
                    false,
                    "No token bindings found for this party",
                    new ArrayList<>(),
                    Instant.now()
                );
            }

            // Verify each binding
            List<TokenVerificationResult> results = new ArrayList<>();
            boolean allVerified = true;

            for (TokenBinding binding : bindings) {
                boolean verified = verifyOwnershipInternal(binding.getTokenId(), partyId);
                results.add(new TokenVerificationResult(
                    binding.getTokenId(),
                    binding.getTokenType(),
                    verified,
                    verified ? "Ownership verified" : "Ownership verification failed"
                ));
                if (!verified) {
                    allVerified = false;
                }
            }

            ownershipVerifications.incrementAndGet();

            return new OwnershipVerification(
                contractId,
                partyId,
                allVerified,
                allVerified ? "All token ownerships verified" : "Some token verifications failed",
                results,
                Instant.now()
            );
        }).runSubscriptionOn(executor);
    }

    // ==================== TOKEN BINDINGS QUERY ====================

    /**
     * Get all token bindings for a contract
     *
     * @param contractId Contract ID
     * @return List of token bindings
     */
    public Uni<List<TokenBinding>> getTokenBindings(String contractId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Getting token bindings for contract {}", contractId);
            return new ArrayList<>(contractBindings.getOrDefault(contractId, new ArrayList<>()));
        });
    }

    /**
     * Get token bindings by type
     *
     * @param contractId Contract ID
     * @param tokenType Token type filter
     * @return Filtered list of token bindings
     */
    public Uni<List<TokenBinding>> getTokenBindingsByType(String contractId, TokenType tokenType) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Getting {} token bindings for contract {}", tokenType, contractId);
            return contractBindings.getOrDefault(contractId, new ArrayList<>())
                .stream()
                .filter(b -> b.getTokenType() == tokenType)
                .collect(Collectors.toList());
        });
    }

    // ==================== TOKEN LOCKING ====================

    /**
     * Lock all tokens bound to a contract for contract duration
     *
     * @param contractId Contract ID
     * @return LockResult
     */
    public Uni<LockResult> lockTokens(String contractId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Locking tokens for contract {}", contractId);

            List<TokenBinding> bindings = contractBindings.getOrDefault(contractId, new ArrayList<>());
            if (bindings.isEmpty()) {
                return new LockResult(
                    contractId,
                    false,
                    "No tokens to lock",
                    new ArrayList<>(),
                    Instant.now()
                );
            }

            Set<String> locked = new HashSet<>();
            List<String> failedLocks = new ArrayList<>();

            for (TokenBinding binding : bindings) {
                try {
                    // Update binding status
                    binding.setStatus(BindingStatus.LOCKED);
                    binding.setLockedAt(Instant.now());
                    binding.setUpdatedAt(Instant.now());
                    locked.add(binding.getTokenId());
                    tokensLocked.incrementAndGet();
                } catch (Exception e) {
                    LOGGER.error("Failed to lock token {}: {}", binding.getTokenId(), e.getMessage());
                    failedLocks.add(binding.getTokenId());
                }
            }

            // Store locked tokens
            lockedTokens.put(contractId, locked);

            boolean success = failedLocks.isEmpty();
            LOGGER.info("Token locking {}: {} tokens locked, {} failed",
                success ? "successful" : "partially failed", locked.size(), failedLocks.size());

            return new LockResult(
                contractId,
                success,
                success ? "All tokens locked successfully" : "Some tokens failed to lock",
                new ArrayList<>(locked),
                Instant.now()
            );
        }).runSubscriptionOn(executor);
    }

    // ==================== TOKEN RELEASE ====================

    /**
     * Release all locked tokens for a contract
     *
     * @param contractId Contract ID
     * @return ReleaseResult
     */
    public Uni<ReleaseResult> releaseTokens(String contractId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Releasing tokens for contract {}", contractId);

            List<TokenBinding> bindings = contractBindings.getOrDefault(contractId, new ArrayList<>());
            Set<String> lockedSet = lockedTokens.getOrDefault(contractId, new HashSet<>());

            if (bindings.isEmpty() || lockedSet.isEmpty()) {
                return new ReleaseResult(
                    contractId,
                    true,
                    "No locked tokens to release",
                    new ArrayList<>(),
                    Instant.now()
                );
            }

            List<String> released = new ArrayList<>();
            List<String> failedReleases = new ArrayList<>();

            for (TokenBinding binding : bindings) {
                if (binding.getStatus() == BindingStatus.LOCKED) {
                    try {
                        binding.setStatus(BindingStatus.RELEASED);
                        binding.setReleasedAt(Instant.now());
                        binding.setUpdatedAt(Instant.now());
                        released.add(binding.getTokenId());
                        tokensReleased.incrementAndGet();
                    } catch (Exception e) {
                        LOGGER.error("Failed to release token {}: {}", binding.getTokenId(), e.getMessage());
                        failedReleases.add(binding.getTokenId());
                    }
                }
            }

            // Clear locked tokens
            lockedTokens.remove(contractId);

            boolean success = failedReleases.isEmpty();
            LOGGER.info("Token release {}: {} tokens released, {} failed",
                success ? "successful" : "partially failed", released.size(), failedReleases.size());

            return new ReleaseResult(
                contractId,
                success,
                success ? "All tokens released successfully" : "Some tokens failed to release",
                released,
                Instant.now()
            );
        }).runSubscriptionOn(executor);
    }

    // ==================== METRICS ====================

    /**
     * Get service metrics
     *
     * @return Metrics map
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("bindingsCreated", bindingsCreated.get());
        metrics.put("tokensLocked", tokensLocked.get());
        metrics.put("tokensReleased", tokensReleased.get());
        metrics.put("ownershipVerifications", ownershipVerifications.get());
        metrics.put("totalContractsWithBindings", contractBindings.size());
        metrics.put("totalActiveBindings", contractBindings.values().stream()
            .mapToLong(List::size)
            .sum());
        metrics.put("timestamp", Instant.now());
        return metrics;
    }

    // ==================== HELPER METHODS ====================

    private void validateContract(String contractId) {
        // Contract existence check - in production, query contract service
        if (contractId == null || contractId.trim().isEmpty()) {
            throw new TokenBindingException("Contract ID is required");
        }
    }

    private void verifyOwnership(String tokenId, String stakeholder) {
        // In production, verify via TokenManagementService
        if (tokenId == null || tokenId.trim().isEmpty()) {
            throw new TokenBindingException("Token ID is required");
        }
        if (stakeholder == null || stakeholder.trim().isEmpty()) {
            throw new TokenBindingException("Stakeholder address is required");
        }
        // Additional ownership verification can be added here
    }

    private boolean verifyOwnershipInternal(String tokenId, String owner) {
        // Mock verification - in production, check actual token balances
        return tokenId != null && owner != null;
    }

    private void validateSecondaryPercentage(String contractId, BigDecimal newPercentage) {
        BigDecimal totalPercentage = contractBindings.getOrDefault(contractId, new ArrayList<>())
            .stream()
            .filter(b -> b.getTokenType() == TokenType.SECONDARY)
            .map(TokenBinding::getPercentage)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPercentage.add(newPercentage).compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new TokenBindingException(
                "Total secondary token percentage would exceed 100%: current=" +
                totalPercentage + ", new=" + newPercentage);
        }
    }

    private String generateBindingId() {
        return "TB-" + UUID.randomUUID().toString();
    }

    // ==================== DATA MODELS ====================

    /**
     * Token binding entity
     */
    public static class TokenBinding {
        private String bindingId;
        private String contractId;
        private String tokenId;
        private TokenType tokenType;
        private String stakeholder;
        private BigDecimal percentage;
        private List<String> componentTokens; // For composite tokens
        private BindingStatus status;
        private Instant createdAt;
        private Instant updatedAt;
        private Instant lockedAt;
        private Instant releasedAt;
        private Map<String, Object> metadata = new HashMap<>();

        // Getters and setters
        public String getBindingId() { return bindingId; }
        public void setBindingId(String bindingId) { this.bindingId = bindingId; }

        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }

        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }

        public TokenType getTokenType() { return tokenType; }
        public void setTokenType(TokenType tokenType) { this.tokenType = tokenType; }

        public String getStakeholder() { return stakeholder; }
        public void setStakeholder(String stakeholder) { this.stakeholder = stakeholder; }

        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }

        public List<String> getComponentTokens() { return componentTokens; }
        public void setComponentTokens(List<String> componentTokens) { this.componentTokens = componentTokens; }

        public BindingStatus getStatus() { return status; }
        public void setStatus(BindingStatus status) { this.status = status; }

        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

        public Instant getLockedAt() { return lockedAt; }
        public void setLockedAt(Instant lockedAt) { this.lockedAt = lockedAt; }

        public Instant getReleasedAt() { return releasedAt; }
        public void setReleasedAt(Instant releasedAt) { this.releasedAt = releasedAt; }

        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    /**
     * Ownership verification result
     */
    public record OwnershipVerification(
        String contractId,
        String partyId,
        boolean verified,
        String message,
        List<TokenVerificationResult> tokenResults,
        Instant timestamp
    ) {}

    /**
     * Token verification result
     */
    public record TokenVerificationResult(
        String tokenId,
        TokenType tokenType,
        boolean verified,
        String message
    ) {}

    /**
     * Token lock result
     */
    public record LockResult(
        String contractId,
        boolean success,
        String message,
        List<String> lockedTokenIds,
        Instant timestamp
    ) {}

    /**
     * Token release result
     */
    public record ReleaseResult(
        String contractId,
        boolean success,
        String message,
        List<String> releasedTokenIds,
        Instant timestamp
    ) {}

    /**
     * Primary token bind request
     */
    public record PrimaryBindRequest(
        String tokenId,
        String stakeholder
    ) {}

    /**
     * Secondary token bind request
     */
    public record SecondaryBindRequest(
        String tokenId,
        String stakeholder,
        BigDecimal percentage
    ) {}

    /**
     * Composite token bind request
     */
    public record CompositeBindRequest(
        String compositeTokenId,
        List<String> componentTokens
    ) {}

    /**
     * Verify ownership request
     */
    public record VerifyOwnershipRequest(
        String partyId
    ) {}

    // ==================== EXCEPTIONS ====================

    /**
     * Token binding exception
     */
    public static class TokenBindingException extends RuntimeException {
        public TokenBindingException(String message) {
            super(message);
        }

        public TokenBindingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
