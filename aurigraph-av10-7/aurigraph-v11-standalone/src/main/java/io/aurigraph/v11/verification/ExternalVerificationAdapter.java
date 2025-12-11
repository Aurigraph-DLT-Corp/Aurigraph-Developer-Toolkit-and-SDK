package io.aurigraph.v11.verification;

import io.aurigraph.v11.verification.models.VerificationRequest;
import io.aurigraph.v11.verification.models.VerificationResult;
import io.aurigraph.v11.verification.models.VerificationType;

import java.util.concurrent.CompletableFuture;

/**
 * Interface for external verification service adapters.
 * Each adapter implements integration with a specific external service.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public interface ExternalVerificationAdapter {

    /**
     * Get the verification type this adapter handles.
     */
    VerificationType getVerificationType();

    /**
     * Check if this adapter supports the given verification type.
     */
    default boolean supports(VerificationType type) {
        return getVerificationType() == type;
    }

    /**
     * Verify synchronously.
     */
    VerificationResult verify(VerificationRequest request);

    /**
     * Verify asynchronously.
     */
    default CompletableFuture<VerificationResult> verifyAsync(VerificationRequest request) {
        return CompletableFuture.supplyAsync(() -> verify(request));
    }

    /**
     * Check the status of a pending verification.
     */
    default VerificationResult checkStatus(String externalId) {
        return VerificationResult.error(getVerificationType(), "Status check not supported");
    }

    /**
     * Check if the external service is available.
     */
    default boolean isAvailable() {
        return true;
    }

    /**
     * Get adapter name for logging.
     */
    default String getName() {
        return getVerificationType().getDisplayName() + " Adapter";
    }
}
