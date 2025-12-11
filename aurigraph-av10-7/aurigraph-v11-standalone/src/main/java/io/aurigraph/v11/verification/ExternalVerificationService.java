package io.aurigraph.v11.verification;

import io.aurigraph.v11.verification.adapters.KYCVerificationAdapter;
import io.aurigraph.v11.verification.adapters.LandRegistryAdapter;
import io.aurigraph.v11.verification.adapters.ManualVerificationAdapter;
import io.aurigraph.v11.verification.adapters.VVBVerificationAdapter;
import io.aurigraph.v11.verification.models.VerificationRequest;
import io.aurigraph.v11.verification.models.VerificationResult;
import io.aurigraph.v11.verification.models.VerificationType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Central service for external verification orchestration.
 * Routes verification requests to appropriate adapters.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@ApplicationScoped
public class ExternalVerificationService {

    private static final Logger LOG = Logger.getLogger(ExternalVerificationService.class);

    @Inject
    LandRegistryAdapter landRegistryAdapter;

    @Inject
    KYCVerificationAdapter kycAdapter;

    @Inject
    VVBVerificationAdapter vvbAdapter;

    @Inject
    ManualVerificationAdapter manualAdapter;

    private Map<VerificationType, ExternalVerificationAdapter> adapterMap;

    /**
     * Initialize adapter map lazily.
     */
    private Map<VerificationType, ExternalVerificationAdapter> getAdapterMap() {
        if (adapterMap == null) {
            adapterMap = new EnumMap<>(VerificationType.class);
            adapterMap.put(VerificationType.LAND_REGISTRY, landRegistryAdapter);
            adapterMap.put(VerificationType.KYC, kycAdapter);
            adapterMap.put(VerificationType.VVB, vvbAdapter);
            adapterMap.put(VerificationType.MANUAL, manualAdapter);
        }
        return adapterMap;
    }

    /**
     * Verify using the appropriate adapter based on verification type.
     */
    public VerificationResult verify(VerificationRequest request) {
        VerificationType type = request.getVerificationType();
        LOG.infof("Processing verification request: type=%s, assetId=%s", type, request.getAssetId());

        ExternalVerificationAdapter adapter = getAdapterMap().get(type);

        if (adapter == null) {
            LOG.warnf("No adapter found for verification type: %s", type);
            return VerificationResult.error(type, "No adapter available for " + type.getDisplayName());
        }

        if (!adapter.isAvailable()) {
            LOG.warnf("Adapter not available: %s", adapter.getName());

            // Try manual bypass if allowed
            if (request.isAllowManualBypass()) {
                LOG.info("Attempting manual bypass as adapter is unavailable");
                return manualAdapter.verify(request);
            }

            return VerificationResult.error(type, adapter.getName() + " is currently unavailable");
        }

        try {
            VerificationResult result = adapter.verify(request);
            LOG.infof("Verification completed: type=%s, status=%s", type, result.getStatus());
            return result;
        } catch (Exception e) {
            LOG.errorf(e, "Verification failed: type=%s", type);

            // Try manual bypass on error if allowed
            if (request.isAllowManualBypass()) {
                LOG.info("Attempting manual bypass due to verification error");
                request.withManualBypass(true, "Auto-bypass: " + e.getMessage());
                return manualAdapter.verify(request);
            }

            return VerificationResult.error(type, "Verification failed: " + e.getMessage());
        }
    }

    /**
     * Verify asynchronously.
     */
    public CompletableFuture<VerificationResult> verifyAsync(VerificationRequest request) {
        return CompletableFuture.supplyAsync(() -> verify(request));
    }

    /**
     * Run multiple verifications in parallel.
     */
    public Map<VerificationType, VerificationResult> verifyMultiple(UUID assetId,
            List<VerificationType> types, String requesterId) {

        List<CompletableFuture<Map.Entry<VerificationType, VerificationResult>>> futures = types.stream()
                .map(type -> {
                    VerificationRequest request = VerificationRequest.forAsset(assetId, type)
                            .withRequester(requesterId, null);
                    return verifyAsync(request)
                            .thenApply(result -> Map.entry(type, result));
                })
                .collect(Collectors.toList());

        return futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    /**
     * Check which verification services are available.
     */
    public Map<VerificationType, Boolean> getAvailableServices() {
        Map<VerificationType, Boolean> availability = new EnumMap<>(VerificationType.class);
        for (Map.Entry<VerificationType, ExternalVerificationAdapter> entry : getAdapterMap().entrySet()) {
            availability.put(entry.getKey(), entry.getValue().isAvailable());
        }
        return availability;
    }

    /**
     * Get all available verification types.
     */
    public List<VerificationType> getAvailableVerificationTypes() {
        return getAdapterMap().entrySet().stream()
                .filter(e -> e.getValue().isAvailable())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * Verify with automatic fallback to manual if external service fails.
     */
    public VerificationResult verifyWithFallback(VerificationRequest request) {
        request.withManualBypass(true, "Automatic fallback enabled");
        return verify(request);
    }

    // Convenience methods for specific verification types

    /**
     * Verify land registry ownership.
     */
    public VerificationResult verifyLandRegistry(UUID assetId, String propertyId, String jurisdiction) {
        VerificationRequest request = VerificationRequest.forLandRegistry(assetId, propertyId, jurisdiction);
        return verify(request);
    }

    /**
     * Verify KYC for a user.
     */
    public VerificationResult verifyKYC(String userId, Map<String, Object> kycData) {
        VerificationRequest request = VerificationRequest.forKYC(userId, kycData);
        return verify(request);
    }

    /**
     * Verify carbon credits via VVB.
     */
    public VerificationResult verifyVVB(UUID assetId, String projectId, String registry) {
        VerificationRequest request = VerificationRequest.forVVB(assetId, projectId, registry);
        return verify(request);
    }

    /**
     * Manual verification bypass.
     */
    public VerificationResult manualVerify(UUID assetId, String verifierId, String reason) {
        return manualAdapter.quickApprove(assetId, verifierId, reason);
    }

    /**
     * Get adapter for a specific verification type.
     */
    public Optional<ExternalVerificationAdapter> getAdapter(VerificationType type) {
        return Optional.ofNullable(getAdapterMap().get(type));
    }
}
