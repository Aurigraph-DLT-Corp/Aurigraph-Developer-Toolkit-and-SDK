package io.aurigraph.v11.contracts.rwa;

import jakarta.enterprise.context.ApplicationScoped;
import io.smallrye.mutiny.Uni;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import io.quarkus.logging.Log;

/**
 * Digital Twin Service for Real World Assets
 * Creates and manages digital representations of physical assets
 */
@ApplicationScoped
public class DigitalTwinService {

    private final Map<String, AssetDigitalTwin> digitalTwins = new ConcurrentHashMap<>();

    /**
     * Create digital twin for an asset
     */
    public AssetDigitalTwin createDigitalTwin(String assetId, String assetType, Map<String, Object> metadata) {
        AssetDigitalTwin digitalTwin = AssetDigitalTwin.builder()
            .assetId(assetId)
            .assetType(assetType)
            .metadata(metadata)
            .currentValue(getInitialValue(assetType, metadata))
            .currentOwner(extractOwner(metadata))
            .build();
        
        digitalTwins.put(digitalTwin.getTwinId(), digitalTwin);
        
        Log.infof("Created digital twin %s for asset %s of type %s", 
            digitalTwin.getTwinId(), assetId, assetType);
        
        return digitalTwin;
    }

    /**
     * Create digital twin asynchronously
     */
    public Uni<AssetDigitalTwin> createDigitalTwinAsync(String assetId, String assetType, Map<String, Object> metadata) {
        return Uni.createFrom().item(() -> createDigitalTwin(assetId, assetType, metadata))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get digital twin by ID
     */
    public AssetDigitalTwin getDigitalTwin(String twinId) {
        return digitalTwins.get(twinId);
    }

    /**
     * Update digital twin with IoT data
     */
    public void updateWithIoTData(String twinId, String sensorId, String dataType, 
                                 Object value, String unit, Map<String, Object> additionalData) {
        AssetDigitalTwin twin = digitalTwins.get(twinId);
        if (twin != null) {
            twin.addIoTData(sensorId, dataType, value, unit, additionalData);
            Log.infof("Updated digital twin %s with IoT data from sensor %s", twinId, sensorId);
        }
    }

    /**
     * Record verification for digital twin
     */
    public void recordVerification(String twinId, String verificationId, String verifierAddress,
                                 String result, Map<String, Object> details) {
        AssetDigitalTwin twin = digitalTwins.get(twinId);
        if (twin != null) {
            twin.recordVerification(verificationId, verifierAddress, result, details);
            Log.infof("Recorded verification %s for digital twin %s: %s", 
                verificationId, twinId, result);
        }
    }

    /**
     * Update asset value in digital twin
     */
    public void updateAssetValue(String twinId, BigDecimal newValue, String source) {
        AssetDigitalTwin twin = digitalTwins.get(twinId);
        if (twin != null) {
            BigDecimal oldValue = twin.getCurrentValue();
            twin.recordValuationUpdate(oldValue, newValue, source);
            Log.infof("Updated value for digital twin %s from $%s to $%s (source: %s)", 
                twinId, oldValue, newValue, source);
        }
    }

    /**
     * Get all digital twins for an asset type
     */
    public java.util.List<AssetDigitalTwin> getDigitalTwinsByType(String assetType) {
        return digitalTwins.values().stream()
            .filter(twin -> assetType.equals(twin.getAssetType()))
            .toList();
    }

    /**
     * Get digital twin statistics
     */
    public Map<String, Object> getDigitalTwinStatistics() {
        Map<String, Object> stats = new ConcurrentHashMap<>();
        
        long totalTwins = digitalTwins.size();
        Map<String, Long> typeDistribution = new ConcurrentHashMap<>();
        Map<AssetStatus, Long> statusDistribution = new ConcurrentHashMap<>();
        
        for (AssetDigitalTwin twin : digitalTwins.values()) {
            // Count by type
            typeDistribution.merge(twin.getAssetType(), 1L, Long::sum);
            
            // Count by status
            statusDistribution.merge(twin.getStatus(), 1L, Long::sum);
        }
        
        stats.put("totalDigitalTwins", totalTwins);
        stats.put("typeDistribution", typeDistribution);
        stats.put("statusDistribution", statusDistribution);
        stats.put("lastUpdated", Instant.now());
        
        return stats;
    }

    /**
     * Verify digital twin integrity
     */
    public boolean verifyDigitalTwinIntegrity(String twinId) {
        AssetDigitalTwin twin = digitalTwins.get(twinId);
        return twin != null && twin.verifyIntegrity();
    }

    /**
     * Delete digital twin (burn asset)
     */
    public boolean deleteDigitalTwin(String twinId, String requesterAddress) {
        AssetDigitalTwin twin = digitalTwins.get(twinId);
        if (twin != null) {
            twin.recordBurn(requesterAddress);
            Log.infof("Digital twin %s burned by %s", twinId, requesterAddress);
            return true;
        }
        return false;
    }

    // Private helper methods

    private BigDecimal getInitialValue(String assetType, Map<String, Object> metadata) {
        if (metadata.containsKey("initialValue")) {
            Object value = metadata.get("initialValue");
            if (value instanceof Number) {
                return new BigDecimal(value.toString());
            }
        }
        
        // Default values by asset type
        switch (assetType.toUpperCase()) {
            case "CARBON_CREDIT":
                return new BigDecimal("45.00");
            case "REAL_ESTATE":
                return new BigDecimal("500000.00");
            case "FINANCIAL":
                return new BigDecimal("10000.00");
            case "ARTWORK":
                return new BigDecimal("50000.00");
            case "COMMODITY":
                return new BigDecimal("1000.00");
            default:
                return new BigDecimal("5000.00");
        }
    }

    private String extractOwner(Map<String, Object> metadata) {
        if (metadata.containsKey("owner")) {
            return (String) metadata.get("owner");
        }
        if (metadata.containsKey("ownerAddress")) {
            return (String) metadata.get("ownerAddress");
        }
        return "SYSTEM"; // Default system owner
    }
}