package io.aurigraph.v11.contracts.rwa;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import io.quarkus.logging.Log;
import org.bouncycastle.crypto.digests.SHA3Digest;
import org.bouncycastle.util.encoders.Hex;

/**
 * Digital Twin Service for Real World Assets
 * Creates and manages blockchain-based digital representations of physical assets
 */
@ApplicationScoped
public class DigitalTwinService {

    // Digital twin registry
    private final Map<String, AssetDigitalTwin> digitalTwins = new ConcurrentHashMap<>();
    private final AtomicLong twinCounter = new AtomicLong(0);
    
    // Performance metrics
    private final AtomicLong totalTwinsCreated = new AtomicLong(0);
    private final Map<String, AtomicLong> twinsByType = new ConcurrentHashMap<>();

    /**
     * Create a digital twin for a real-world asset
     */
    public AssetDigitalTwin createDigitalTwin(String assetId, String assetType, Map<String, Object> metadata) {
        String twinId = generateTwinId(assetId, assetType);
        
        AssetDigitalTwin digitalTwin = AssetDigitalTwin.builder()
            .twinId(twinId)
            .assetId(assetId)
            .assetType(assetType)
            .metadata(metadata != null ? new HashMap<>(metadata) : new HashMap<>())
            .createdAt(Instant.now())
            .lastUpdated(Instant.now())
            .status(DigitalTwinStatus.ACTIVE)
            .build();
        
        // Store in registry
        digitalTwins.put(twinId, digitalTwin);
        
        // Update metrics
        totalTwinsCreated.incrementAndGet();
        twinsByType.computeIfAbsent(assetType, k -> new AtomicLong(0)).incrementAndGet();
        
        Log.infof("Created digital twin %s for asset %s of type %s", twinId, assetId, assetType);
        
        return digitalTwin;
    }

    /**
     * Get digital twin by ID
     */
    public Uni<AssetDigitalTwin> getDigitalTwin(String twinId) {
        return Uni.createFrom().item(() -> digitalTwins.get(twinId))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get digital twins by asset type
     */
    public Uni<List<AssetDigitalTwin>> getTwinsByType(String assetType) {
        return Uni.createFrom().item(() -> {
            return digitalTwins.values().stream()
                .filter(twin -> assetType.equals(twin.getAssetType()))
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update digital twin metadata
     */
    public Uni<Boolean> updateTwin(String twinId, Map<String, Object> updates) {
        return Uni.createFrom().item(() -> {
            AssetDigitalTwin twin = digitalTwins.get(twinId);
            if (twin == null) {
                return false;
            }
            
            // Update metadata
            twin.getMetadata().putAll(updates);
            twin.setLastUpdated(Instant.now());
            
            // Record the update
            twin.recordEvent("METADATA_UPDATE", "Metadata updated", updates);
            
            Log.infof("Updated digital twin %s with %d changes", twinId, updates.size());
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Record sensor data for IoT-enabled assets
     */
    public Uni<Boolean> recordSensorData(String twinId, String sensorType, Map<String, Object> data) {
        return Uni.createFrom().item(() -> {
            AssetDigitalTwin twin = digitalTwins.get(twinId);
            if (twin == null) {
                return false;
            }
            
            // Add sensor data to twin
            SensorReading reading = new SensorReading(
                sensorType,
                data,
                Instant.now(),
                generateReadingId()
            );
            
            twin.addSensorReading(reading);
            twin.setLastUpdated(Instant.now());
            
            // Record as event
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("sensorType", sensorType);
            eventData.put("data", data);
            twin.recordEvent("SENSOR_DATA", "Sensor data recorded", eventData);
            
            Log.debugf("Recorded sensor data for twin %s: %s = %s", twinId, sensorType, data);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get asset verification status
     */
    public Uni<AssetVerification> getVerificationStatus(String twinId) {
        return Uni.createFrom().item(() -> {
            AssetDigitalTwin twin = digitalTwins.get(twinId);
            if (twin == null) {
                return new AssetVerification(false, "Twin not found", Collections.emptyList());
            }
            
            List<String> verifications = twin.getVerifications();
            boolean isVerified = !verifications.isEmpty();
            String status = isVerified ? "Asset is verified" : "Asset requires verification";
            
            return new AssetVerification(isVerified, status, verifications);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add verification to digital twin
     */
    public Uni<Boolean> addVerification(String twinId, String verificationType, String verifier, Map<String, Object> evidence) {
        return Uni.createFrom().item(() -> {
            AssetDigitalTwin twin = digitalTwins.get(twinId);
            if (twin == null) {
                return false;
            }
            
            String verification = String.format("%s:%s:%s", verificationType, verifier, Instant.now());
            twin.addVerification(verification);
            
            // Record verification event
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("verificationType", verificationType);
            eventData.put("verifier", verifier);
            eventData.put("evidence", evidence);
            
            twin.recordEvent("VERIFICATION_ADDED", "Asset verification added", eventData);
            twin.setLastUpdated(Instant.now());
            
            Log.infof("Added verification to twin %s: %s by %s", twinId, verificationType, verifier);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get digital twin statistics
     */
    public Uni<DigitalTwinStats> getStats() {
        return Uni.createFrom().item(() -> {
            Map<String, Long> typeDistribution = new HashMap<>();
            int activeCount = 0;
            int totalEvents = 0;
            
            for (AssetDigitalTwin twin : digitalTwins.values()) {
                String type = twin.getAssetType();
                typeDistribution.merge(type, 1L, Long::sum);
                
                if (twin.getStatus() == DigitalTwinStatus.ACTIVE) {
                    activeCount++;
                }
                
                totalEvents += twin.getEvents().size();
            }
            
            return new DigitalTwinStats(
                digitalTwins.size(),
                activeCount,
                typeDistribution,
                totalEvents,
                totalTwinsCreated.get()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Search digital twins by criteria
     */
    public Uni<List<AssetDigitalTwin>> searchTwins(DigitalTwinSearchCriteria criteria) {
        return Uni.createFrom().item(() -> {
            return digitalTwins.values().stream()
                .filter(twin -> matchesCriteria(twin, criteria))
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Archive a digital twin (soft delete)
     */
    public Uni<Boolean> archiveTwin(String twinId) {
        return Uni.createFrom().item(() -> {
            AssetDigitalTwin twin = digitalTwins.get(twinId);
            if (twin == null) {
                return false;
            }
            
            twin.setStatus(DigitalTwinStatus.ARCHIVED);
            twin.setLastUpdated(Instant.now());
            twin.recordEvent("ARCHIVED", "Digital twin archived", Collections.emptyMap());
            
            Log.infof("Archived digital twin %s", twinId);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private String generateTwinId(String assetId, String assetType) {
        SHA3Digest digest = new SHA3Digest(256);
        String input = assetId + assetType + System.nanoTime() + twinCounter.incrementAndGet();
        byte[] inputBytes = input.getBytes();
        digest.update(inputBytes, 0, inputBytes.length);
        byte[] hash = new byte[32];
        digest.doFinal(hash, 0);
        return "DT-" + Hex.toHexString(hash).substring(0, 16).toUpperCase();
    }

    private String generateReadingId() {
        return "READING-" + System.nanoTime();
    }

    private boolean matchesCriteria(AssetDigitalTwin twin, DigitalTwinSearchCriteria criteria) {
        if (criteria.getAssetType() != null && !criteria.getAssetType().equals(twin.getAssetType())) {
            return false;
        }
        
        if (criteria.getStatus() != null && !criteria.getStatus().equals(twin.getStatus())) {
            return false;
        }
        
        if (criteria.getCreatedAfter() != null && twin.getCreatedAt().isBefore(criteria.getCreatedAfter())) {
            return false;
        }
        
        if (criteria.getCreatedBefore() != null && twin.getCreatedAt().isAfter(criteria.getCreatedBefore())) {
            return false;
        }
        
        if (criteria.getMetadataFilters() != null) {
            for (Map.Entry<String, Object> filter : criteria.getMetadataFilters().entrySet()) {
                Object twinValue = twin.getMetadata().get(filter.getKey());
                if (!Objects.equals(twinValue, filter.getValue())) {
                    return false;
                }
            }
        }
        
        return true;
    }
}

// Supporting classes

class SensorReading {
    private final String sensorType;
    private final Map<String, Object> data;
    private final Instant timestamp;
    private final String readingId;

    public SensorReading(String sensorType, Map<String, Object> data, Instant timestamp, String readingId) {
        this.sensorType = sensorType;
        this.data = new HashMap<>(data);
        this.timestamp = timestamp;
        this.readingId = readingId;
    }

    public String getSensorType() { return sensorType; }
    public Map<String, Object> getData() { return data; }
    public Instant getTimestamp() { return timestamp; }
    public String getReadingId() { return readingId; }

    @Override
    public String toString() {
        return String.format("SensorReading{type='%s', timestamp=%s, data=%s}", 
            sensorType, timestamp, data);
    }
}

class AssetVerification {
    private final boolean verified;
    private final String status;
    private final List<String> verifications;

    public AssetVerification(boolean verified, String status, List<String> verifications) {
        this.verified = verified;
        this.status = status;
        this.verifications = new ArrayList<>(verifications);
    }

    public boolean isVerified() { return verified; }
    public String getStatus() { return status; }
    public List<String> getVerifications() { return verifications; }
}

class DigitalTwinStats {
    private final int totalTwins;
    private final int activeTwins;
    private final Map<String, Long> typeDistribution;
    private final int totalEvents;
    private final long totalTwinsCreated;

    public DigitalTwinStats(int totalTwins, int activeTwins, Map<String, Long> typeDistribution, 
                           int totalEvents, long totalTwinsCreated) {
        this.totalTwins = totalTwins;
        this.activeTwins = activeTwins;
        this.typeDistribution = new HashMap<>(typeDistribution);
        this.totalEvents = totalEvents;
        this.totalTwinsCreated = totalTwinsCreated;
    }

    public int getTotalTwins() { return totalTwins; }
    public int getActiveTwins() { return activeTwins; }
    public Map<String, Long> getTypeDistribution() { return typeDistribution; }
    public int getTotalEvents() { return totalEvents; }
    public long getTotalTwinsCreated() { return totalTwinsCreated; }
}

class DigitalTwinSearchCriteria {
    private String assetType;
    private DigitalTwinStatus status;
    private Instant createdAfter;
    private Instant createdBefore;
    private Map<String, Object> metadataFilters;

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    
    public DigitalTwinStatus getStatus() { return status; }
    public void setStatus(DigitalTwinStatus status) { this.status = status; }
    
    public Instant getCreatedAfter() { return createdAfter; }
    public void setCreatedAfter(Instant createdAfter) { this.createdAfter = createdAfter; }
    
    public Instant getCreatedBefore() { return createdBefore; }
    public void setCreatedBefore(Instant createdBefore) { this.createdBefore = createdBefore; }
    
    public Map<String, Object> getMetadataFilters() { return metadataFilters; }
    public void setMetadataFilters(Map<String, Object> metadataFilters) { this.metadataFilters = metadataFilters; }

    public static DigitalTwinSearchCriteria builder() {
        return new DigitalTwinSearchCriteria();
    }

    public DigitalTwinSearchCriteria assetType(String assetType) {
        this.assetType = assetType;
        return this;
    }

    public DigitalTwinSearchCriteria status(DigitalTwinStatus status) {
        this.status = status;
        return this;
    }

    public DigitalTwinSearchCriteria createdAfter(Instant createdAfter) {
        this.createdAfter = createdAfter;
        return this;
    }

    public DigitalTwinSearchCriteria createdBefore(Instant createdBefore) {
        this.createdBefore = createdBefore;
        return this;
    }

    public DigitalTwinSearchCriteria metadataFilter(String key, Object value) {
        if (this.metadataFilters == null) {
            this.metadataFilters = new HashMap<>();
        }
        this.metadataFilters.put(key, value);
        return this;
    }
}

enum DigitalTwinStatus {
    PENDING,    // Being created
    ACTIVE,     // Active and operational
    SUSPENDED,  // Temporarily inactive
    ARCHIVED,   // Soft deleted
    ERROR       // Error state
}