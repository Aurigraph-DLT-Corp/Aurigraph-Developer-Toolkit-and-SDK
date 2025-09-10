package io.aurigraph.v11.ai;

import java.time.Instant;
import java.util.Map;

/**
 * Result from anomaly detection analysis
 */
public class AnomalyDetectionResult {
    private final boolean anomalyDetected;
    private final double anomalyScore;
    private final String anomalyType;
    private final String description;
    private final Instant timestamp;
    private final Map<String, Object> metadata;
    
    public AnomalyDetectionResult(boolean anomalyDetected, double anomalyScore, 
                                 String anomalyType, String description, 
                                 Map<String, Object> metadata) {
        this.anomalyDetected = anomalyDetected;
        this.anomalyScore = anomalyScore;
        this.anomalyType = anomalyType;
        this.description = description;
        this.metadata = metadata;
        this.timestamp = Instant.now();
    }
    
    public boolean isAnomalyDetected() { return anomalyDetected; }
    public double getAnomalyScore() { return anomalyScore; }
    public String getAnomalyType() { return anomalyType; }
    public String getDescription() { return description; }
    public Instant getTimestamp() { return timestamp; }
    public Map<String, Object> getMetadata() { return metadata; }
    
    // Method aliases expected by the AI components
    public boolean isAnomaly() { return anomalyDetected; }
    public double confidence() { return anomalyScore; }
    public String type() { return anomalyType; }
}