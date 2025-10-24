package io.aurigraph.v11.integration;

import java.util.*;
import java.time.Instant;

/**
 * Test Data Factory for Integration Tests
 *
 * Provides factory methods to generate consistent test data
 * across all integration test suites.
 *
 * Coverage: All 26 REST endpoints
 */
public class TestDataBuilder {

    private static final Random random = new Random();

    // ==================== BLOCKCHAIN TEST DATA ====================

    public static String generateTransactionHash() {
        return "0x" + generateHexString(64);
    }

    public static String generateAddress() {
        return "0x" + generateHexString(40);
    }

    public static String generateBlockHash() {
        return "0x" + generateHexString(64);
    }

    public static Map<String, Object> createTransactionSubmitRequest(String from, String to, double amount) {
        Map<String, Object> request = new HashMap<>();
        request.put("from", from != null ? from : generateAddress());
        request.put("to", to != null ? to : generateAddress());
        request.put("amount", amount > 0 ? amount : 1000.0 + random.nextDouble() * 9000.0);
        request.put("gasLimit", 21000 + random.nextInt(100000));
        request.put("gasPrice", 20 + random.nextInt(100));
        request.put("nonce", random.nextInt(1000));
        return request;
    }

    public static Map<String, Object> createInvalidTransactionRequest() {
        Map<String, Object> request = new HashMap<>();
        request.put("from", generateAddress());
        request.put("amount", -100.0); // Invalid negative amount
        return request;
    }

    // ==================== VALIDATOR TEST DATA ====================

    public static String generateValidatorId() {
        return "validator-" + String.format("%03d", random.nextInt(1000));
    }

    public static Map<String, Object> createSlashingRequest(String reason, double amount) {
        Map<String, Object> request = new HashMap<>();
        request.put("reason", reason != null ? reason : "Protocol violation detected");
        request.put("slashAmount", amount > 0 ? amount : 10000.0 + random.nextDouble() * 90000.0);
        request.put("evidence", generateBlockHash());
        request.put("proposer", "governance-committee");
        request.put("timestamp", Instant.now().toEpochMilli());
        return request;
    }

    // ==================== AI/ML TEST DATA ====================

    public static String generateModelId() {
        String[] models = {
            "consensus-optimizer-v3",
            "transaction-predictor-v2",
            "anomaly-detector-v4",
            "load-balancer-v1"
        };
        return models[random.nextInt(models.length)];
    }

    public static Map<String, String> createPredictionQueryParams(String horizon) {
        Map<String, String> params = new HashMap<>();
        params.put("horizon", horizon != null ? horizon : "1h");
        params.put("confidence", "0.8");
        return params;
    }

    // ==================== BRIDGE TEST DATA ====================

    public static Map<String, Object> createBridgeTransferRequest(
            String sourceChain, String destChain, String asset, double amount) {
        Map<String, Object> request = new HashMap<>();
        request.put("sourceChain", sourceChain != null ? sourceChain : "ethereum");
        request.put("destinationChain", destChain != null ? destChain : "polygon");
        request.put("asset", asset != null ? asset : "USDC");
        request.put("amount", amount > 0 ? amount : 1000.0 + random.nextDouble() * 49000.0);
        request.put("senderAddress", generateAddress());
        request.put("recipientAddress", generateAddress());
        request.put("nonce", random.nextInt(10000));
        return request;
    }

    public static Map<String, Object> createInvalidBridgeRequest() {
        Map<String, Object> request = new HashMap<>();
        request.put("sourceChain", "ethereum");
        request.put("amount", -500.0); // Invalid negative amount
        return request;
    }

    // ==================== RWA TEST DATA ====================

    public static Map<String, Object> createPortfolioRebalanceRequest(String userId, String strategy) {
        Map<String, Object> request = new HashMap<>();
        request.put("userId", userId != null ? userId : generateUserId());
        request.put("strategy", strategy != null ? strategy : "BALANCED");
        request.put("riskTolerance", random.nextInt(100));
        request.put("rebalanceThreshold", 5.0 + random.nextDouble() * 10.0);
        return request;
    }

    public static String generateUserId() {
        return "user-" + UUID.randomUUID().toString().substring(0, 8);
    }

    public static String generateAssetId() {
        return "asset-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ==================== CONSENSUS TEST DATA ====================

    public static long generateRoundNumber() {
        return 7000000L + random.nextInt(1000000);
    }

    public static String generateNodeId() {
        return "node-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ==================== GATEWAY TEST DATA ====================

    public static Map<String, Object> createGatewayTransferRequest(
            String from, String to, double amount, String asset) {
        Map<String, Object> request = new HashMap<>();
        request.put("from", from != null ? from : generateAddress());
        request.put("to", to != null ? to : generateAddress());
        request.put("amount", amount > 0 ? amount : 1000.0 + random.nextDouble() * 9000.0);
        request.put("asset", asset != null ? asset : "AUR");
        request.put("memo", "Test transfer " + UUID.randomUUID().toString().substring(0, 8));
        return request;
    }

    // ==================== CONTRACT TEST DATA ====================

    public static String generateContractId() {
        return "contract-" + String.format("%06d", random.nextInt(1000000));
    }

    public static Map<String, Object> createContractInvokeRequest(String method) {
        Map<String, Object> request = new HashMap<>();
        request.put("method", method != null ? method : "transfer");

        Map<String, Object> params = new HashMap<>();
        params.put("to", generateAddress());
        params.put("amount", 1000 + random.nextInt(9000));
        request.put("params", params);

        request.put("gasLimit", 100000 + random.nextInt(500000));
        return request;
    }

    // ==================== GOVERNANCE TEST DATA ====================

    public static Map<String, Object> createGovernanceVoteRequest(
            String proposalId, String voterId, String choice) {
        Map<String, Object> request = new HashMap<>();
        request.put("proposalId", proposalId != null ? proposalId : generateProposalId());
        request.put("voterId", voterId != null ? voterId : generateUserId());
        request.put("choice", choice != null ? choice : randomChoice());
        request.put("votingPower", 100.0 + random.nextDouble() * 9900.0);
        request.put("reason", "Test vote submission");
        return request;
    }

    public static String generateProposalId() {
        return "proposal-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String randomChoice() {
        String[] choices = {"FOR", "AGAINST", "ABSTAIN"};
        return choices[random.nextInt(choices.length)];
    }

    // ==================== UTILITY METHODS ====================

    private static String generateHexString(int length) {
        StringBuilder sb = new StringBuilder();
        String hexChars = "0123456789abcdef";
        for (int i = 0; i < length; i++) {
            sb.append(hexChars.charAt(random.nextInt(16)));
        }
        return sb.toString();
    }

    public static Map<String, String> createPaginationParams(int limit, int offset) {
        Map<String, String> params = new HashMap<>();
        params.put("limit", String.valueOf(limit));
        params.put("offset", String.valueOf(offset));
        return params;
    }

    public static Map<String, String> createTimeRangeParams(String period) {
        Map<String, String> params = new HashMap<>();
        params.put("period", period);
        return params;
    }

    public static Map<String, String> createSeverityFilter(String severity) {
        Map<String, String> params = new HashMap<>();
        params.put("severity", severity);
        params.put("limit", "20");
        return params;
    }

    public static Map<String, String> createAssetTypeFilter(String assetType, String status) {
        Map<String, String> params = new HashMap<>();
        if (assetType != null) {
            params.put("assetType", assetType);
        }
        if (status != null) {
            params.put("status", status);
        }
        return params;
    }

    // ==================== BULK TEST DATA GENERATION ====================

    public static List<Map<String, Object>> generateBulkTransactions(int count) {
        List<Map<String, Object>> transactions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            transactions.add(createTransactionSubmitRequest(null, null, 0));
        }
        return transactions;
    }

    public static List<String> generateValidatorIds(int count) {
        List<String> validators = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            validators.add(generateValidatorId());
        }
        return validators;
    }

    // ==================== RESPONSE VALIDATION HELPERS ====================

    public static boolean isValidTransactionHash(String hash) {
        return hash != null && hash.startsWith("0x") && hash.length() == 66;
    }

    public static boolean isValidAddress(String address) {
        return address != null && address.startsWith("0x") && address.length() == 42;
    }

    public static boolean isValidTimestamp(long timestamp) {
        long now = Instant.now().toEpochMilli();
        // Timestamp should be within reasonable range (past year to now + 1 hour)
        return timestamp > (now - 365L * 24 * 60 * 60 * 1000) &&
               timestamp < (now + 60 * 60 * 1000);
    }
}
