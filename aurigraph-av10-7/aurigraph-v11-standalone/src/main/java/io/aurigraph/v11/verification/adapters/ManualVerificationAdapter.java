package io.aurigraph.v11.verification.adapters;

import io.aurigraph.v11.verification.ExternalVerificationAdapter;
import io.aurigraph.v11.verification.models.VerificationRequest;
import io.aurigraph.v11.verification.models.VerificationResult;
import io.aurigraph.v11.verification.models.VerificationType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Adapter for Manual Verification bypass.
 * Used for demo purposes when external services are unavailable.
 *
 * This adapter allows authorized users to manually verify assets
 * when automatic verification is not possible or desired.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@ApplicationScoped
@Named("manualVerificationAdapter")
public class ManualVerificationAdapter implements ExternalVerificationAdapter {

    private static final Logger LOG = Logger.getLogger(ManualVerificationAdapter.class);

    @ConfigProperty(name = "verification.manual.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "verification.manual.require-reason", defaultValue = "true")
    boolean requireReason;

    @ConfigProperty(name = "verification.manual.audit-log", defaultValue = "true")
    boolean auditLog;

    @Override
    public VerificationType getVerificationType() {
        return VerificationType.MANUAL;
    }

    @Override
    public boolean isAvailable() {
        return enabled;
    }

    @Override
    public VerificationResult verify(VerificationRequest request) {
        LOG.infof("Manual verification requested for asset: %s by: %s",
                request.getAssetId(), request.getRequesterId());

        if (!enabled) {
            return VerificationResult.error(VerificationType.MANUAL, "Manual verification is disabled");
        }

        // Check if manual bypass is allowed for this request
        if (!request.isAllowManualBypass()) {
            return VerificationResult.rejected(VerificationType.MANUAL,
                    "Manual bypass not allowed for this verification request");
        }

        // Require reason if configured
        if (requireReason && (request.getBypassReason() == null || request.getBypassReason().isEmpty())) {
            return VerificationResult.error(VerificationType.MANUAL,
                    "Bypass reason is required for manual verification");
        }

        // Generate manual verification record
        String verificationId = "MANUAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Map<String, Object> verificationData = new HashMap<>();
        verificationData.put("verificationId", verificationId);
        verificationData.put("verifiedBy", request.getRequesterId());
        verificationData.put("verifierName", request.getRequesterName());
        verificationData.put("verificationTime", LocalDateTime.now().toString());
        verificationData.put("bypassReason", request.getBypassReason());
        verificationData.put("manualOverride", true);
        verificationData.put("originalVerificationType",
                request.getVerificationType() != null ? request.getVerificationType().name() : "UNSPECIFIED");

        // Include any additional verification data from the request
        if (request.getVerificationData() != null) {
            verificationData.put("additionalData", request.getVerificationData());
        }

        // Log for audit if enabled
        if (auditLog) {
            LOG.infof("AUDIT: Manual verification %s approved by %s. Reason: %s",
                    verificationId, request.getRequesterId(), request.getBypassReason());
        }

        return VerificationResult.manualBypass(request.getRequesterId(), request.getRequesterName(), request.getBypassReason())
                .withData(verificationData)
                .withConfidence(0.50) // Lower confidence for manual verification
                .withMessage("Asset manually verified - bypass approved (ID: " + verificationId + ")");
    }

    /**
     * Quick manual approval for demo purposes.
     */
    public VerificationResult quickApprove(UUID assetId, String approverId, String reason) {
        VerificationRequest request = VerificationRequest.forAsset(assetId, VerificationType.MANUAL)
                .withRequester(approverId, "Demo Approver")
                .withManualBypass(true, reason);
        return verify(request);
    }

    /**
     * Bulk manual approval for multiple assets.
     */
    public Map<UUID, VerificationResult> bulkApprove(java.util.List<UUID> assetIds, String approverId, String reason) {
        Map<UUID, VerificationResult> results = new HashMap<>();
        for (UUID assetId : assetIds) {
            results.put(assetId, quickApprove(assetId, approverId, reason));
        }
        return results;
    }
}
