package io.aurigraph.v11.verification.models;

import java.util.Map;
import java.util.UUID;

/**
 * Request for external verification.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public class VerificationRequest {

    private UUID assetId;
    private VerificationType verificationType;
    private String requesterId;
    private String requesterName;
    private Map<String, Object> verificationData;
    private boolean allowManualBypass;
    private String bypassReason;
    private String jurisdiction;
    private String externalReference;

    public VerificationRequest() {
        this.allowManualBypass = true; // Default to allow for demo
    }

    // Builder pattern
    public static VerificationRequest forAsset(UUID assetId, VerificationType type) {
        VerificationRequest request = new VerificationRequest();
        request.assetId = assetId;
        request.verificationType = type;
        return request;
    }

    public static VerificationRequest forKYC(String userId, Map<String, Object> kycData) {
        VerificationRequest request = new VerificationRequest();
        request.verificationType = VerificationType.KYC;
        request.requesterId = userId;
        request.verificationData = kycData;
        return request;
    }

    public static VerificationRequest forLandRegistry(UUID assetId, String propertyId, String jurisdiction) {
        VerificationRequest request = new VerificationRequest();
        request.assetId = assetId;
        request.verificationType = VerificationType.LAND_REGISTRY;
        request.externalReference = propertyId;
        request.jurisdiction = jurisdiction;
        return request;
    }

    public static VerificationRequest forVVB(UUID assetId, String projectId, String registry) {
        VerificationRequest request = new VerificationRequest();
        request.assetId = assetId;
        request.verificationType = VerificationType.VVB;
        request.externalReference = projectId;
        request.verificationData = Map.of("registry", registry);
        return request;
    }

    // Fluent setters
    public VerificationRequest withRequester(String requesterId, String requesterName) {
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        return this;
    }

    public VerificationRequest withData(Map<String, Object> data) {
        this.verificationData = data;
        return this;
    }

    public VerificationRequest withJurisdiction(String jurisdiction) {
        this.jurisdiction = jurisdiction;
        return this;
    }

    public VerificationRequest withManualBypass(boolean allow, String reason) {
        this.allowManualBypass = allow;
        this.bypassReason = reason;
        return this;
    }

    public VerificationRequest disableManualBypass() {
        this.allowManualBypass = false;
        return this;
    }

    // Getters
    public UUID getAssetId() { return assetId; }
    public VerificationType getVerificationType() { return verificationType; }
    public String getRequesterId() { return requesterId; }
    public String getRequesterName() { return requesterName; }
    public Map<String, Object> getVerificationData() { return verificationData; }
    public boolean isAllowManualBypass() { return allowManualBypass; }
    public String getBypassReason() { return bypassReason; }
    public String getJurisdiction() { return jurisdiction; }
    public String getExternalReference() { return externalReference; }

    // Setters for JSON deserialization
    public void setAssetId(UUID assetId) { this.assetId = assetId; }
    public void setVerificationType(VerificationType verificationType) { this.verificationType = verificationType; }
    public void setRequesterId(String requesterId) { this.requesterId = requesterId; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public void setVerificationData(Map<String, Object> verificationData) { this.verificationData = verificationData; }
    public void setAllowManualBypass(boolean allowManualBypass) { this.allowManualBypass = allowManualBypass; }
    public void setBypassReason(String bypassReason) { this.bypassReason = bypassReason; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
    public void setExternalReference(String externalReference) { this.externalReference = externalReference; }
}
