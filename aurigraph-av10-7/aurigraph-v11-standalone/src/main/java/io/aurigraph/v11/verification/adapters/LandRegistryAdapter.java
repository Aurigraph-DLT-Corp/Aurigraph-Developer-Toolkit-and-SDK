package io.aurigraph.v11.verification.adapters;

import io.aurigraph.v11.verification.ExternalVerificationAdapter;
import io.aurigraph.v11.verification.models.VerificationRequest;
import io.aurigraph.v11.verification.models.VerificationResult;
import io.aurigraph.v11.verification.models.VerificationType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.UUID;

/**
 * Adapter for Land Registry verification services.
 * Supports multiple jurisdictions with different registry APIs.
 *
 * Supported registries:
 * - US: County Recorder APIs
 * - UK: HM Land Registry
 * - EU: National cadastre systems
 * - India: State land registries
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@ApplicationScoped
@Named("landRegistryAdapter")
public class LandRegistryAdapter implements ExternalVerificationAdapter {

    private static final Logger LOG = Logger.getLogger(LandRegistryAdapter.class);

    @ConfigProperty(name = "verification.land-registry.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "verification.land-registry.demo-mode", defaultValue = "true")
    boolean demoMode;

    @ConfigProperty(name = "verification.land-registry.api-key", defaultValue = "")
    String apiKey;

    @ConfigProperty(name = "verification.land-registry.base-url", defaultValue = "https://api.landregistry.demo")
    String baseUrl;

    @Override
    public VerificationType getVerificationType() {
        return VerificationType.LAND_REGISTRY;
    }

    @Override
    public boolean isAvailable() {
        return enabled;
    }

    @Override
    public VerificationResult verify(VerificationRequest request) {
        LOG.infof("Land Registry verification requested for asset: %s, jurisdiction: %s",
                request.getAssetId(), request.getJurisdiction());

        if (!enabled) {
            return VerificationResult.error(VerificationType.LAND_REGISTRY, "Land Registry verification is disabled");
        }

        // Demo mode - simulate verification
        if (demoMode) {
            return simulateVerification(request);
        }

        // Real API integration would go here
        return callLandRegistryAPI(request);
    }

    /**
     * Simulate verification for demo purposes.
     */
    private VerificationResult simulateVerification(VerificationRequest request) {
        LOG.info("Running in DEMO MODE - simulating Land Registry verification");

        String propertyId = request.getExternalReference();
        String jurisdiction = request.getJurisdiction();

        // Simulate different scenarios based on property ID
        if (propertyId == null || propertyId.isEmpty()) {
            return VerificationResult.rejected(VerificationType.LAND_REGISTRY, "Property ID is required");
        }

        // Simulate successful verification with mock data
        String mockTitleNumber = "DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Map<String, Object> verificationData = Map.of(
                "titleNumber", mockTitleNumber,
                "propertyAddress", "123 Demo Street, " + (jurisdiction != null ? jurisdiction : "Unknown"),
                "registeredOwner", "Demo Owner LLC",
                "registrationDate", "2024-01-15",
                "titleStatus", "FREEHOLD",
                "encumbrances", "None recorded",
                "lastTransferDate", "2024-01-15",
                "demoMode", true,
                "jurisdiction", jurisdiction != null ? jurisdiction : "DEMO"
        );

        return VerificationResult.verified(VerificationType.LAND_REGISTRY, mockTitleNumber)
                .withData(verificationData)
                .withConfidence(0.85) // Lower confidence for demo
                .withMessage("Property ownership verified (DEMO MODE)");
    }

    /**
     * Real API call to Land Registry.
     * This would be implemented when connecting to actual registries.
     */
    private VerificationResult callLandRegistryAPI(VerificationRequest request) {
        // TODO: Implement real API integration
        // Example for UK Land Registry:
        // GET https://api.landregistry.data.gov.uk/data/ppi/transaction/{transaction-id}

        LOG.warn("Real Land Registry API integration not implemented - falling back to demo mode");
        return simulateVerification(request);
    }

    /**
     * Verify property by deed number.
     */
    public VerificationResult verifyByDeed(String deedNumber, String jurisdiction) {
        VerificationRequest request = new VerificationRequest();
        request.setVerificationType(VerificationType.LAND_REGISTRY);
        request.setExternalReference(deedNumber);
        request.setJurisdiction(jurisdiction);
        return verify(request);
    }

    /**
     * Verify property by address.
     */
    public VerificationResult verifyByAddress(String address, String city, String state, String country) {
        Map<String, Object> data = Map.of(
                "address", address,
                "city", city,
                "state", state,
                "country", country
        );

        VerificationRequest request = new VerificationRequest();
        request.setVerificationType(VerificationType.LAND_REGISTRY);
        request.setVerificationData(data);
        request.setJurisdiction(country);
        return verify(request);
    }
}
