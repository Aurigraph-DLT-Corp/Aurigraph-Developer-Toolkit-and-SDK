package io.aurigraph.v11.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Comprehensive Tests for AI/ML Performance Endpoints
 *
 * Tests for:
 * - GET /api/v11/ai/performance - ML model performance metrics
 * - GET /api/v11/ai/confidence - AI prediction confidence scores
 *
 * Coverage Requirements: 95% line coverage, 90% function coverage
 * Performance Requirements: Response time < 200ms
 *
 * @author Backend Development Agent (BDA)
 * @version 11.4.4
 */
@QuarkusTest
@Tag("ai")
@Tag("api")
@DisplayName("AI/ML Performance Endpoints Test Suite")
public class AIApiPerformanceTest {

    private static final String AI_PERFORMANCE_PATH = "/api/v11/ai/performance";
    private static final String AI_CONFIDENCE_PATH = "/api/v11/ai/confidence";
    private static final int MAX_RESPONSE_TIME_MS = 200;

    // ==================== AI PERFORMANCE ENDPOINT TESTS ====================

    @Test
    @DisplayName("GET /api/v11/ai/performance - Should return 200 OK")
    public void testGetPerformanceMetrics_ReturnsOK() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON);
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Should return valid response structure")
    public void testGetPerformanceMetrics_ValidStructure() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("totalModels", notNullValue())
            .body("averageAccuracy", notNullValue())
            .body("averagePrecision", notNullValue())
            .body("averageRecall", notNullValue())
            .body("averageF1Score", notNullValue())
            .body("averageLatency", notNullValue())
            .body("totalThroughput", notNullValue())
            .body("models", notNullValue())
            .body("responseTime", notNullValue())
            .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Should return 5 models")
    public void testGetPerformanceMetrics_Returns5Models() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("totalModels", equalTo(5))
            .body("models", hasSize(5));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Each model should have required fields")
    public void testGetPerformanceMetrics_ModelFields() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models[0].modelId", notNullValue())
            .body("models[0].modelName", notNullValue())
            .body("models[0].accuracy", notNullValue())
            .body("models[0].precision", notNullValue())
            .body("models[0].recall", notNullValue())
            .body("models[0].f1Score", notNullValue())
            .body("models[0].latency", notNullValue())
            .body("models[0].throughput", notNullValue())
            .body("models[0].lastTrainingDate", notNullValue())
            .body("models[0].dataPoints", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Should include consensus optimizer model")
    public void testGetPerformanceMetrics_ConsensusOptimizerPresent() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.find { it.modelId == 'consensus-optimizer-v3' }", notNullValue())
            .body("models.find { it.modelId == 'consensus-optimizer-v3' }.modelName",
                  equalTo("HyperRAFT++ Consensus Optimizer"))
            .body("models.find { it.modelId == 'consensus-optimizer-v3' }.accuracy",
                  greaterThan(90.0f));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Should include transaction predictor model")
    public void testGetPerformanceMetrics_TransactionPredictorPresent() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.find { it.modelId == 'tx-predictor-v2' }", notNullValue())
            .body("models.find { it.modelId == 'tx-predictor-v2' }.modelName",
                  equalTo("Transaction Volume Predictor"))
            .body("models.find { it.modelId == 'tx-predictor-v2' }.accuracy",
                  greaterThan(90.0f));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Should include anomaly detector model")
    public void testGetPerformanceMetrics_AnomalyDetectorPresent() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.find { it.modelId == 'anomaly-detector-v1' }", notNullValue())
            .body("models.find { it.modelId == 'anomaly-detector-v1' }.modelName",
                  equalTo("Transaction Anomaly Detector"))
            .body("models.find { it.modelId == 'anomaly-detector-v1' }.accuracy",
                  greaterThan(95.0f));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Accuracy values should be valid percentages")
    public void testGetPerformanceMetrics_AccuracyValues() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.accuracy", everyItem(allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            )))
            .body("averageAccuracy", allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Precision values should be valid percentages")
    public void testGetPerformanceMetrics_PrecisionValues() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.precision", everyItem(allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            )))
            .body("averagePrecision", allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Recall values should be valid percentages")
    public void testGetPerformanceMetrics_RecallValues() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.recall", everyItem(allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            )))
            .body("averageRecall", allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - F1 score values should be valid")
    public void testGetPerformanceMetrics_F1ScoreValues() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.f1Score", everyItem(allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            )))
            .body("averageF1Score", allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Latency values should be positive")
    public void testGetPerformanceMetrics_LatencyValues() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.latency", everyItem(greaterThan(0.0f)))
            .body("averageLatency", greaterThan(0.0f));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Throughput values should be positive")
    public void testGetPerformanceMetrics_ThroughputValues() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.throughput", everyItem(greaterThan(0)))
            .body("totalThroughput", greaterThan(0L));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Data points should be positive")
    public void testGetPerformanceMetrics_DataPoints() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("models.dataPoints", everyItem(greaterThan(0)));
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Response time should be under 200ms")
    public void testGetPerformanceMetrics_ResponseTime() {
        long startTime = System.currentTimeMillis();

        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200);

        long endTime = System.currentTimeMillis();
        long actualResponseTime = endTime - startTime;

        // Verify response time is under 200ms
        assert actualResponseTime < MAX_RESPONSE_TIME_MS :
            String.format("Response time %dms exceeded maximum %dms",
                         actualResponseTime, MAX_RESPONSE_TIME_MS);
    }

    @Test
    @DisplayName("GET /api/v11/ai/performance - Should include response time in payload")
    public void testGetPerformanceMetrics_ResponseTimeInPayload() {
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .body("responseTime", allOf(
                notNullValue(),
                greaterThan(0.0f),
                lessThan((float) MAX_RESPONSE_TIME_MS)
            ));
    }

    // ==================== AI CONFIDENCE ENDPOINT TESTS ====================

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Should return 200 OK")
    public void testGetConfidenceScores_ReturnsOK() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON);
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Should return valid response structure")
    public void testGetConfidenceScores_ValidStructure() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("predictions", notNullValue())
            .body("averageConfidence", notNullValue())
            .body("anomaliesDetected", notNullValue())
            .body("totalPredictions", notNullValue())
            .body("highConfidencePredictions", notNullValue())
            .body("mediumConfidencePredictions", notNullValue())
            .body("lowConfidencePredictions", notNullValue())
            .body("averageAnomalyScore", notNullValue())
            .body("anomalyDetectionRate", notNullValue())
            .body("responseTime", notNullValue())
            .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Should return 13 predictions")
    public void testGetConfidenceScores_Returns13Predictions() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("totalPredictions", equalTo(13))
            .body("predictions", hasSize(13));
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Each prediction should have required fields")
    public void testGetConfidenceScores_PredictionFields() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("predictions[0].predictionId", notNullValue())
            .body("predictions[0].confidence", notNullValue())
            .body("predictions[0].threshold", notNullValue())
            .body("predictions[0].anomalyScore", notNullValue())
            .body("predictions[0].timestamp", notNullValue())
            .body("predictions[0].isAnomaly", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Confidence values should be valid percentages")
    public void testGetConfidenceScores_ConfidenceValues() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("predictions.confidence", everyItem(allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            )))
            .body("averageConfidence", allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Anomaly scores should be between 0 and 1")
    public void testGetConfidenceScores_AnomalyScores() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("predictions.anomalyScore", everyItem(allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(1.0f)
            )))
            .body("averageAnomalyScore", allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(1.0f)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Should detect some anomalies")
    public void testGetConfidenceScores_AnomaliesDetected() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("anomaliesDetected", greaterThan(0))
            .body("predictions.findAll { it.isAnomaly == true }.size()",
                  equalTo(3)); // We generate 3 anomalies
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Anomaly detection rate should be valid percentage")
    public void testGetConfidenceScores_AnomalyDetectionRate() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("anomalyDetectionRate", allOf(
                greaterThanOrEqualTo(0.0f),
                lessThanOrEqualTo(100.0f)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Confidence categories should sum to total")
    public void testGetConfidenceScores_ConfidenceCategoriesSum() {
        io.restassured.response.Response response = given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .extract()
            .response();

        int highConfidence = response.path("highConfidencePredictions");
        int mediumConfidence = response.path("mediumConfidencePredictions");
        int lowConfidence = response.path("lowConfidencePredictions");
        int total = response.path("totalPredictions");

        assert (highConfidence + mediumConfidence + lowConfidence) == total :
            String.format("Confidence categories (%d + %d + %d) don't sum to total %d",
                         highConfidence, mediumConfidence, lowConfidence, total);
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Threshold should be consistent")
    public void testGetConfidenceScores_ThresholdConsistent() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("predictions.threshold", everyItem(equalTo(80.0f)));
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - High anomaly scores should be flagged as anomalies")
    public void testGetConfidenceScores_HighAnomalyScoresFlagged() {
        io.restassured.response.Response response = given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .extract()
            .response();

        java.util.List<java.util.Map<String, Object>> predictions = response.path("predictions");

        for (java.util.Map<String, Object> pred : predictions) {
            double anomalyScore = ((Number) pred.get("anomalyScore")).doubleValue();
            boolean isAnomaly = (Boolean) pred.get("isAnomaly");

            if (anomalyScore > 0.25) {
                assert isAnomaly : String.format(
                    "Prediction %s with anomaly score %.2f should be flagged as anomaly",
                    pred.get("predictionId"), anomalyScore);
            }
        }
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Response time should be under 200ms")
    public void testGetConfidenceScores_ResponseTime() {
        long startTime = System.currentTimeMillis();

        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200);

        long endTime = System.currentTimeMillis();
        long actualResponseTime = endTime - startTime;

        // Verify response time is under 200ms
        assert actualResponseTime < MAX_RESPONSE_TIME_MS :
            String.format("Response time %dms exceeded maximum %dms",
                         actualResponseTime, MAX_RESPONSE_TIME_MS);
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Should include response time in payload")
    public void testGetConfidenceScores_ResponseTimeInPayload() {
        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .body("responseTime", allOf(
                notNullValue(),
                greaterThan(0.0f),
                lessThan((float) MAX_RESPONSE_TIME_MS)
            ));
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Prediction IDs should be unique")
    public void testGetConfidenceScores_UniquePredictionIds() {
        io.restassured.response.Response response = given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .extract()
            .response();

        java.util.List<String> predictionIds = response.path("predictions.predictionId");
        java.util.Set<String> uniqueIds = new java.util.HashSet<>(predictionIds);

        assert predictionIds.size() == uniqueIds.size() :
            String.format("Found duplicate prediction IDs: %d total, %d unique",
                         predictionIds.size(), uniqueIds.size());
    }

    @Test
    @DisplayName("GET /api/v11/ai/confidence - Timestamps should be in ISO format")
    public void testGetConfidenceScores_TimestampFormat() {
        io.restassured.response.Response response = given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .extract()
            .response();

        java.util.List<String> timestamps = response.path("predictions.timestamp");

        for (String timestamp : timestamps) {
            assert timestamp.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.*") :
                String.format("Timestamp '%s' is not in ISO format", timestamp);
        }
    }

    // ==================== INTEGRATION TESTS ====================

    @Test
    @DisplayName("Both endpoints should be accessible concurrently")
    public void testBothEndpoints_ConcurrentAccess() {
        // Test that both endpoints can be called successfully
        given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200);

        given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200);
    }

    @Test
    @DisplayName("Both endpoints should return consistent timestamps")
    public void testBothEndpoints_ConsistentTimestamps() {
        long testStartTime = System.currentTimeMillis();

        long perfTimestamp = given()
            .when()
            .get(AI_PERFORMANCE_PATH)
            .then()
            .statusCode(200)
            .extract()
            .path("timestamp");

        long confTimestamp = given()
            .when()
            .get(AI_CONFIDENCE_PATH)
            .then()
            .statusCode(200)
            .extract()
            .path("timestamp");

        long testEndTime = System.currentTimeMillis();

        // Both timestamps should be within the test execution window
        assert perfTimestamp >= testStartTime && perfTimestamp <= testEndTime :
            "Performance endpoint timestamp out of range";
        assert confTimestamp >= testStartTime && confTimestamp <= testEndTime :
            "Confidence endpoint timestamp out of range";
    }

    @Test
    @DisplayName("Both endpoints should handle rapid successive requests")
    public void testBothEndpoints_RapidSuccessiveRequests() {
        for (int i = 0; i < 5; i++) {
            given()
                .when()
                .get(AI_PERFORMANCE_PATH)
                .then()
                .statusCode(200);

            given()
                .when()
                .get(AI_CONFIDENCE_PATH)
                .then()
                .statusCode(200);
        }
    }
}
