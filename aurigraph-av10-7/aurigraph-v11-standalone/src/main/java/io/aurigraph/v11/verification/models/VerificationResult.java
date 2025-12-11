package io.aurigraph.v11.verification.models;

import java.time.Instant;
import java.util.Map;

/**
 * Result of an external verification request.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public class VerificationResult {

    public enum Status {
        VERIFIED,      // Verification successful
        REJECTED,      // Verification failed
        PENDING,       // Awaiting external response
        ERROR,         // Technical error occurred
        NOT_FOUND,     // Asset/entity not found in registry
        MANUAL_BYPASS  // Manually bypassed for demo
    }

    private Status status;
    private VerificationType verificationType;
    private String externalId;
    private String message;
    private Map<String, Object> data;
    private String verifierId;
    private String verifierName;
    private Instant verifiedAt;
    private double confidenceScore;
    private boolean demoMode;

    // Default constructor
    public VerificationResult() {
        this.verifiedAt = Instant.now();
        this.confidenceScore = 0.0;
        this.demoMode = false;
    }

    // Builder pattern
    public static VerificationResult verified(VerificationType type, String externalId) {
        VerificationResult result = new VerificationResult();
        result.status = Status.VERIFIED;
        result.verificationType = type;
        result.externalId = externalId;
        result.confidenceScore = 1.0;
        return result;
    }

    public static VerificationResult rejected(VerificationType type, String reason) {
        VerificationResult result = new VerificationResult();
        result.status = Status.REJECTED;
        result.verificationType = type;
        result.message = reason;
        result.confidenceScore = 0.0;
        return result;
    }

    public static VerificationResult pending(VerificationType type, String requestId) {
        VerificationResult result = new VerificationResult();
        result.status = Status.PENDING;
        result.verificationType = type;
        result.externalId = requestId;
        return result;
    }

    public static VerificationResult error(VerificationType type, String errorMessage) {
        VerificationResult result = new VerificationResult();
        result.status = Status.ERROR;
        result.verificationType = type;
        result.message = errorMessage;
        return result;
    }

    public static VerificationResult manualBypass(String verifierId, String verifierName, String reason) {
        VerificationResult result = new VerificationResult();
        result.status = Status.MANUAL_BYPASS;
        result.verificationType = VerificationType.MANUAL;
        result.verifierId = verifierId;
        result.verifierName = verifierName;
        result.message = reason;
        result.confidenceScore = 0.8; // Lower confidence for manual
        result.demoMode = true;
        return result;
    }

    // Fluent setters
    public VerificationResult withData(Map<String, Object> data) {
        this.data = data;
        return this;
    }

    public VerificationResult withVerifier(String verifierId, String verifierName) {
        this.verifierId = verifierId;
        this.verifierName = verifierName;
        return this;
    }

    public VerificationResult withConfidence(double score) {
        this.confidenceScore = score;
        return this;
    }

    public VerificationResult withMessage(String message) {
        this.message = message;
        return this;
    }

    // Getters
    public Status getStatus() { return status; }
    public VerificationType getVerificationType() { return verificationType; }
    public String getExternalId() { return externalId; }
    public String getMessage() { return message; }
    public Map<String, Object> getData() { return data; }
    public String getVerifierId() { return verifierId; }
    public String getVerifierName() { return verifierName; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public double getConfidenceScore() { return confidenceScore; }
    public boolean isDemoMode() { return demoMode; }

    public boolean isVerified() {
        return status == Status.VERIFIED || status == Status.MANUAL_BYPASS;
    }
}
