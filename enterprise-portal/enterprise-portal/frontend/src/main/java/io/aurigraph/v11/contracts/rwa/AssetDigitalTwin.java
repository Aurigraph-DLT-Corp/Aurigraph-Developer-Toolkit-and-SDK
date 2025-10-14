package io.aurigraph.v11.contracts.rwa;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.bouncycastle.crypto.digests.SHA3Digest;
import org.bouncycastle.util.encoders.Hex;

/**
 * Digital Twin representation of Real World Assets
 * Maintains complete asset lifecycle, ownership history, and real-time data
 * Features: Immutable audit trail, IoT integration, AI analytics
 */
public class AssetDigitalTwin {
    
    @JsonProperty("twinId")
    private String twinId;
    
    @JsonProperty("assetId")
    private String assetId;
    
    @JsonProperty("assetType")
    private String assetType;
    
    @JsonProperty("currentOwner")
    private String currentOwner;
    
    @JsonProperty("currentValue")
    private BigDecimal currentValue;
    
    @JsonProperty("createdAt")
    private Instant createdAt;
    
    @JsonProperty("lastUpdated")
    private Instant lastUpdated;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    @JsonProperty("ownershipHistory")
    private final Queue<OwnershipRecord> ownershipHistory;
    
    @JsonProperty("valuationHistory")
    private final Queue<ValuationRecord> valuationHistory;
    
    @JsonProperty("verificationHistory")
    private final Queue<VerificationRecord> verificationHistory;
    
    @JsonProperty("iotData")
    private final Queue<IoTDataPoint> iotData;
    
    @JsonProperty("status")
    private AssetStatus status;
    
    @JsonProperty("certifications")
    private Set<String> certifications;
    
    @JsonProperty("quantumHash")
    private String quantumHash; // Quantum-safe integrity hash
    
    @JsonProperty("version")
    private int version;

    // Default constructor
    public AssetDigitalTwin() {
        this.ownershipHistory = new ConcurrentLinkedQueue<>();
        this.valuationHistory = new ConcurrentLinkedQueue<>();
        this.verificationHistory = new ConcurrentLinkedQueue<>();
        this.iotData = new ConcurrentLinkedQueue<>();
        this.certifications = new HashSet<>();
        this.status = AssetStatus.ACTIVE;
        this.version = 1;
        this.createdAt = Instant.now();
        this.lastUpdated = Instant.now();
    }

    // Builder pattern
    public static AssetDigitalTwinBuilder builder() {
        return new AssetDigitalTwinBuilder();
    }

    /**
     * Record ownership change in immutable history
     */
    public void recordOwnershipChange(String fromOwner, String toOwner, BigDecimal amount) {
        OwnershipRecord record = new OwnershipRecord(
            fromOwner, toOwner, amount, Instant.now(), 
            generateTransactionHash(fromOwner, toOwner, amount)
        );
        
        ownershipHistory.offer(record);
        currentOwner = toOwner;
        lastUpdated = Instant.now();
        version++;
        updateQuantumHash();
    }

    /**
     * Record valuation update from oracles or AI services
     */
    public void recordValuationUpdate(BigDecimal oldValue, BigDecimal newValue, String source) {
        ValuationRecord record = new ValuationRecord(
            oldValue, newValue, source, Instant.now(),
            calculateValueChange(oldValue, newValue)
        );
        
        valuationHistory.offer(record);
        currentValue = newValue;
        lastUpdated = Instant.now();
        version++;
        updateQuantumHash();
    }

    /**
     * Record asset verification (audits, inspections, certifications)
     */
    public void recordVerification(String verificationId, String verifierAddress, 
                                 String verificationResult, Map<String, Object> details) {
        VerificationRecord record = new VerificationRecord(
            verificationId, verifierAddress, verificationResult, 
            details, Instant.now()
        );
        
        verificationHistory.offer(record);
        
        // Add certification if verification passed
        if ("PASSED".equals(verificationResult)) {
            certifications.add(verificationId);
        }
        
        lastUpdated = Instant.now();
        version++;
        updateQuantumHash();
    }

    /**
     * Add IoT sensor data point
     */
    public void addIoTData(String sensorId, String dataType, Object value, 
                          String unit, Map<String, Object> additionalData) {
        IoTDataPoint dataPoint = new IoTDataPoint(
            sensorId, dataType, value, unit, 
            additionalData, Instant.now()
        );
        
        iotData.offer(dataPoint);
        
        // Keep only last 1000 IoT data points for performance
        while (iotData.size() > 1000) {
            iotData.poll();
        }
        
        lastUpdated = Instant.now();
        updateQuantumHash();
    }

    /**
     * Record token burn event
     */
    public void recordBurn(String burnerAddress) {
        status = AssetStatus.BURNED;
        metadata.put("burnedBy", burnerAddress);
        metadata.put("burnedAt", Instant.now().toString());
        lastUpdated = Instant.now();
        version++;
        updateQuantumHash();
    }

    /**
     * Get complete asset audit trail
     */
    public AssetAuditTrail getAuditTrail() {
        return new AssetAuditTrail(
            new ArrayList<>(ownershipHistory),
            new ArrayList<>(valuationHistory),
            new ArrayList<>(verificationHistory),
            new ArrayList<>(iotData)
        );
    }

    /**
     * Verify digital twin integrity
     */
    public boolean verifyIntegrity() {
        String currentHash = calculateQuantumHash();
        return currentHash.equals(quantumHash);
    }

    /**
     * Get asset analytics summary
     */
    public AssetAnalytics getAnalytics() {
        // Calculate ownership duration stats
        Map<String, Long> ownershipDurations = calculateOwnershipDurations();
        
        // Calculate valuation trends
        BigDecimal avgValue = calculateAverageValue();
        BigDecimal maxValue = getMaxValue();
        BigDecimal minValue = getMinValue();
        
        // Calculate verification score
        double verificationScore = calculateVerificationScore();
        
        return new AssetAnalytics(
            ownershipDurations,
            avgValue, maxValue, minValue,
            verificationScore,
            iotData.size(),
            certifications.size()
        );
    }

    // Getters and setters
    public String getTwinId() { return twinId; }
    public void setTwinId(String twinId) { this.twinId = twinId; }
    
    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }
    
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    
    public String getCurrentOwner() { return currentOwner; }
    public void setCurrentOwner(String currentOwner) { this.currentOwner = currentOwner; }
    
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    public AssetStatus getStatus() { return status; }
    public void setStatus(AssetStatus status) { this.status = status; }
    
    public Set<String> getCertifications() { return certifications; }
    public void setCertifications(Set<String> certifications) { this.certifications = certifications; }
    
    public String getQuantumHash() { return quantumHash; }
    public int getVersion() { return version; }
    
    public Queue<OwnershipRecord> getOwnershipHistory() { return new ConcurrentLinkedQueue<>(ownershipHistory); }
    public Queue<ValuationRecord> getValuationHistory() { return new ConcurrentLinkedQueue<>(valuationHistory); }
    public Queue<VerificationRecord> getVerificationHistory() { return new ConcurrentLinkedQueue<>(verificationHistory); }
    public Queue<IoTDataPoint> getIotData() { return new ConcurrentLinkedQueue<>(iotData); }

    // Private helper methods
    
    private void updateQuantumHash() {
        this.quantumHash = calculateQuantumHash();
    }
    
    private String calculateQuantumHash() {
        SHA3Digest digest = new SHA3Digest(512);
        String data = twinId + assetId + assetType + currentOwner + 
                     currentValue + version + ownershipHistory.size() + 
                     valuationHistory.size() + verificationHistory.size();
        byte[] dataBytes = data.getBytes();
        digest.update(dataBytes, 0, dataBytes.length);
        byte[] hash = new byte[64];
        digest.doFinal(hash, 0);
        return Hex.toHexString(hash);
    }
    
    private String generateTransactionHash(String fromOwner, String toOwner, BigDecimal amount) {
        SHA3Digest digest = new SHA3Digest(256);
        String data = fromOwner + toOwner + amount.toString() + System.nanoTime();
        byte[] dataBytes = data.getBytes();
        digest.update(dataBytes, 0, dataBytes.length);
        byte[] hash = new byte[32];
        digest.doFinal(hash, 0);
        return Hex.toHexString(hash);
    }
    
    private BigDecimal calculateValueChange(BigDecimal oldValue, BigDecimal newValue) {
        if (oldValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return newValue.subtract(oldValue).divide(oldValue, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal(100));
    }
    
    private Map<String, Long> calculateOwnershipDurations() {
        Map<String, Long> durations = new HashMap<>();
        Instant lastTime = createdAt;
        String lastOwner = currentOwner;
        
        for (OwnershipRecord record : ownershipHistory) {
            if (lastOwner != null) {
                long duration = record.getTimestamp().toEpochMilli() - lastTime.toEpochMilli();
                durations.merge(lastOwner, duration, Long::sum);
            }
            lastTime = record.getTimestamp();
            lastOwner = record.getToOwner();
        }
        
        // Add current owner duration
        if (lastOwner != null) {
            long duration = Instant.now().toEpochMilli() - lastTime.toEpochMilli();
            durations.merge(lastOwner, duration, Long::sum);
        }
        
        return durations;
    }
    
    private BigDecimal calculateAverageValue() {
        if (valuationHistory.isEmpty()) {
            return currentValue;
        }
        
        BigDecimal sum = BigDecimal.ZERO;
        int count = 0;
        for (ValuationRecord record : valuationHistory) {
            sum = sum.add(record.getNewValue());
            count++;
        }
        
        return sum.divide(new BigDecimal(count), 2, java.math.RoundingMode.HALF_UP);
    }
    
    private BigDecimal getMaxValue() {
        BigDecimal max = currentValue;
        for (ValuationRecord record : valuationHistory) {
            if (record.getNewValue().compareTo(max) > 0) {
                max = record.getNewValue();
            }
        }
        return max;
    }
    
    private BigDecimal getMinValue() {
        BigDecimal min = currentValue;
        for (ValuationRecord record : valuationHistory) {
            if (record.getNewValue().compareTo(min) < 0) {
                min = record.getNewValue();
            }
        }
        return min;
    }
    
    private double calculateVerificationScore() {
        if (verificationHistory.isEmpty()) {
            return 0.0;
        }
        
        long passed = verificationHistory.stream()
            .mapToLong(record -> "PASSED".equals(record.getResult()) ? 1 : 0)
            .sum();
        
        return (double) passed / verificationHistory.size() * 100.0;
    }

    @Override
    public String toString() {
        return String.format("AssetDigitalTwin{id='%s', asset='%s', type='%s', owner='%s', value=%s, status=%s}",
            twinId, assetId, assetType, currentOwner, currentValue, status);
    }

    // Builder class
    public static class AssetDigitalTwinBuilder {
        private AssetDigitalTwin twin = new AssetDigitalTwin();
        
        public AssetDigitalTwinBuilder twinId(String twinId) {
            twin.twinId = twinId;
            return this;
        }
        
        public AssetDigitalTwinBuilder assetId(String assetId) {
            twin.assetId = assetId;
            return this;
        }
        
        public AssetDigitalTwinBuilder assetType(String assetType) {
            twin.assetType = assetType;
            return this;
        }
        
        public AssetDigitalTwinBuilder currentOwner(String currentOwner) {
            twin.currentOwner = currentOwner;
            return this;
        }
        
        public AssetDigitalTwinBuilder currentValue(BigDecimal currentValue) {
            twin.currentValue = currentValue;
            return this;
        }
        
        public AssetDigitalTwinBuilder metadata(Map<String, Object> metadata) {
            twin.metadata = metadata != null ? metadata : new HashMap<>();
            return this;
        }
        
        public AssetDigitalTwin build() {
            // Generate twin ID if not provided
            if (twin.twinId == null) {
                twin.twinId = generateTwinId(twin.assetId, twin.assetType);
            }
            
            // Set defaults
            if (twin.metadata == null) {
                twin.metadata = new HashMap<>();
            }
            
            twin.updateQuantumHash();
            return twin;
        }
        
        private String generateTwinId(String assetId, String assetType) {
            SHA3Digest digest = new SHA3Digest(256);
            String input = assetId + assetType + System.nanoTime();
            byte[] inputBytes = input.getBytes();
            digest.update(inputBytes, 0, inputBytes.length);
            byte[] hash = new byte[32];
            digest.doFinal(hash, 0);
            return "DT-" + Hex.toHexString(hash).substring(0, 16).toUpperCase();
        }
    }
}

// Supporting classes

enum AssetStatus {
    PENDING, ACTIVE, SUSPENDED, BURNED, EXPIRED
}

class OwnershipRecord {
    private final String fromOwner;
    private final String toOwner;
    private final BigDecimal amount;
    private final Instant timestamp;
    private final String transactionHash;

    public OwnershipRecord(String fromOwner, String toOwner, BigDecimal amount, 
                          Instant timestamp, String transactionHash) {
        this.fromOwner = fromOwner;
        this.toOwner = toOwner;
        this.amount = amount;
        this.timestamp = timestamp;
        this.transactionHash = transactionHash;
    }

    // Getters
    public String getFromOwner() { return fromOwner; }
    public String getToOwner() { return toOwner; }
    public BigDecimal getAmount() { return amount; }
    public Instant getTimestamp() { return timestamp; }
    public String getTransactionHash() { return transactionHash; }
}

class ValuationRecord {
    private final BigDecimal oldValue;
    private final BigDecimal newValue;
    private final String source;
    private final Instant timestamp;
    private final BigDecimal changePercent;

    public ValuationRecord(BigDecimal oldValue, BigDecimal newValue, String source, 
                          Instant timestamp, BigDecimal changePercent) {
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.source = source;
        this.timestamp = timestamp;
        this.changePercent = changePercent;
    }

    // Getters
    public BigDecimal getOldValue() { return oldValue; }
    public BigDecimal getNewValue() { return newValue; }
    public String getSource() { return source; }
    public Instant getTimestamp() { return timestamp; }
    public BigDecimal getChangePercent() { return changePercent; }
}

class VerificationRecord {
    private final String verificationId;
    private final String verifierAddress;
    private final String result;
    private final Map<String, Object> details;
    private final Instant timestamp;

    public VerificationRecord(String verificationId, String verifierAddress, String result, 
                             Map<String, Object> details, Instant timestamp) {
        this.verificationId = verificationId;
        this.verifierAddress = verifierAddress;
        this.result = result;
        this.details = details;
        this.timestamp = timestamp;
    }

    // Getters
    public String getVerificationId() { return verificationId; }
    public String getVerifierAddress() { return verifierAddress; }
    public String getResult() { return result; }
    public Map<String, Object> getDetails() { return details; }
    public Instant getTimestamp() { return timestamp; }
}

class IoTDataPoint {
    private final String sensorId;
    private final String dataType;
    private final Object value;
    private final String unit;
    private final Map<String, Object> additionalData;
    private final Instant timestamp;

    public IoTDataPoint(String sensorId, String dataType, Object value, String unit, 
                       Map<String, Object> additionalData, Instant timestamp) {
        this.sensorId = sensorId;
        this.dataType = dataType;
        this.value = value;
        this.unit = unit;
        this.additionalData = additionalData;
        this.timestamp = timestamp;
    }

    // Getters
    public String getSensorId() { return sensorId; }
    public String getDataType() { return dataType; }
    public Object getValue() { return value; }
    public String getUnit() { return unit; }
    public Map<String, Object> getAdditionalData() { return additionalData; }
    public Instant getTimestamp() { return timestamp; }
}

class AssetAuditTrail {
    private final List<OwnershipRecord> ownershipRecords;
    private final List<ValuationRecord> valuationRecords;
    private final List<VerificationRecord> verificationRecords;
    private final List<IoTDataPoint> iotDataPoints;

    public AssetAuditTrail(List<OwnershipRecord> ownershipRecords, 
                          List<ValuationRecord> valuationRecords,
                          List<VerificationRecord> verificationRecords, 
                          List<IoTDataPoint> iotDataPoints) {
        this.ownershipRecords = ownershipRecords;
        this.valuationRecords = valuationRecords;
        this.verificationRecords = verificationRecords;
        this.iotDataPoints = iotDataPoints;
    }

    // Getters
    public List<OwnershipRecord> getOwnershipRecords() { return ownershipRecords; }
    public List<ValuationRecord> getValuationRecords() { return valuationRecords; }
    public List<VerificationRecord> getVerificationRecords() { return verificationRecords; }
    public List<IoTDataPoint> getIotDataPoints() { return iotDataPoints; }
}

class AssetAnalytics {
    private final Map<String, Long> ownershipDurations;
    private final BigDecimal averageValue;
    private final BigDecimal maxValue;
    private final BigDecimal minValue;
    private final double verificationScore;
    private final int iotDataPoints;
    private final int certifications;

    public AssetAnalytics(Map<String, Long> ownershipDurations, BigDecimal averageValue, 
                         BigDecimal maxValue, BigDecimal minValue, double verificationScore,
                         int iotDataPoints, int certifications) {
        this.ownershipDurations = ownershipDurations;
        this.averageValue = averageValue;
        this.maxValue = maxValue;
        this.minValue = minValue;
        this.verificationScore = verificationScore;
        this.iotDataPoints = iotDataPoints;
        this.certifications = certifications;
    }

    // Getters
    public Map<String, Long> getOwnershipDurations() { return ownershipDurations; }
    public BigDecimal getAverageValue() { return averageValue; }
    public BigDecimal getMaxValue() { return maxValue; }
    public BigDecimal getMinValue() { return minValue; }
    public double getVerificationScore() { return verificationScore; }
    public int getIotDataPoints() { return iotDataPoints; }
    public int getCertifications() { return certifications; }
}