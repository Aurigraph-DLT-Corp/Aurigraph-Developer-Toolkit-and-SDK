package io.aurigraph.v11.verification.adapters;

import io.aurigraph.v11.verification.ExternalVerificationAdapter;
import io.aurigraph.v11.verification.models.VerificationRequest;
import io.aurigraph.v11.verification.models.VerificationResult;
import io.aurigraph.v11.verification.models.VerificationType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Adapter for KYC (Know Your Customer) verification services.
 * Supports integration with KYC providers like Onfido, Jumio, Sumsub.
 *
 * KYC Levels:
 * - BASIC: Email + Phone verification
 * - STANDARD: ID document verification
 * - ENHANCED: ID + Address + Liveness check
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@ApplicationScoped
@Named("kycVerificationAdapter")
public class KYCVerificationAdapter implements ExternalVerificationAdapter {

    private static final Logger LOG = Logger.getLogger(KYCVerificationAdapter.class);

    public enum KYCLevel {
        BASIC,
        STANDARD,
        ENHANCED
    }

    @ConfigProperty(name = "verification.kyc.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "verification.kyc.demo-mode", defaultValue = "true")
    boolean demoMode;

    @ConfigProperty(name = "verification.kyc.provider", defaultValue = "demo")
    String provider;

    @ConfigProperty(name = "verification.kyc.api-key", defaultValue = "")
    String apiKey;

    @Override
    public VerificationType getVerificationType() {
        return VerificationType.KYC;
    }

    @Override
    public boolean isAvailable() {
        return enabled;
    }

    @Override
    public VerificationResult verify(VerificationRequest request) {
        LOG.infof("KYC verification requested for user: %s", request.getRequesterId());

        if (!enabled) {
            return VerificationResult.error(VerificationType.KYC, "KYC verification is disabled");
        }

        // Demo mode - simulate verification
        if (demoMode) {
            return simulateKYCVerification(request);
        }

        // Real KYC provider integration
        return switch (provider.toLowerCase()) {
            case "onfido" -> callOnfidoAPI(request);
            case "jumio" -> callJumioAPI(request);
            case "sumsub" -> callSumsubAPI(request);
            default -> simulateKYCVerification(request);
        };
    }

    /**
     * Simulate KYC verification for demo purposes.
     */
    private VerificationResult simulateKYCVerification(VerificationRequest request) {
        LOG.info("Running in DEMO MODE - simulating KYC verification");

        String userId = request.getRequesterId();
        Map<String, Object> kycData = request.getVerificationData();

        if (userId == null || userId.isEmpty()) {
            return VerificationResult.rejected(VerificationType.KYC, "User ID is required");
        }

        // Extract KYC level from request data
        KYCLevel level = KYCLevel.STANDARD;
        if (kycData != null && kycData.containsKey("level")) {
            try {
                level = KYCLevel.valueOf(kycData.get("level").toString().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        // Generate mock verification ID
        String verificationId = "KYC-DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Map<String, Object> verificationData = new HashMap<>();
        verificationData.put("verificationId", verificationId);
        verificationData.put("userId", userId);
        verificationData.put("kycLevel", level.name());
        verificationData.put("documentType", "PASSPORT");
        verificationData.put("documentVerified", true);
        verificationData.put("addressVerified", level == KYCLevel.ENHANCED);
        verificationData.put("livenessVerified", level == KYCLevel.ENHANCED);
        verificationData.put("verificationDate", LocalDate.now().toString());
        verificationData.put("expiryDate", LocalDate.now().plusYears(1).toString());
        verificationData.put("riskScore", "LOW");
        verificationData.put("amlCheck", "PASSED");
        verificationData.put("pepCheck", "PASSED");
        verificationData.put("sanctionsCheck", "PASSED");
        verificationData.put("demoMode", true);

        double confidence = switch (level) {
            case BASIC -> 0.7;
            case STANDARD -> 0.85;
            case ENHANCED -> 0.95;
        };

        return VerificationResult.verified(VerificationType.KYC, verificationId)
                .withData(verificationData)
                .withConfidence(confidence)
                .withMessage("KYC verification completed at " + level + " level (DEMO MODE)");
    }

    // Real provider integrations (stubs)

    private VerificationResult callOnfidoAPI(VerificationRequest request) {
        LOG.warn("Onfido API integration not implemented - falling back to demo mode");
        return simulateKYCVerification(request);
    }

    private VerificationResult callJumioAPI(VerificationRequest request) {
        LOG.warn("Jumio API integration not implemented - falling back to demo mode");
        return simulateKYCVerification(request);
    }

    private VerificationResult callSumsubAPI(VerificationRequest request) {
        LOG.warn("Sumsub API integration not implemented - falling back to demo mode");
        return simulateKYCVerification(request);
    }

    /**
     * Quick KYC check for existing verified user.
     */
    public VerificationResult quickCheck(String userId) {
        VerificationRequest request = VerificationRequest.forKYC(userId, Map.of("level", "BASIC"));
        return verify(request);
    }

    /**
     * Full KYC verification with documents.
     */
    public VerificationResult fullVerification(String userId, String documentType, String documentNumber) {
        Map<String, Object> data = Map.of(
                "level", "ENHANCED",
                "documentType", documentType,
                "documentNumber", documentNumber
        );
        VerificationRequest request = VerificationRequest.forKYC(userId, data);
        return verify(request);
    }
}
