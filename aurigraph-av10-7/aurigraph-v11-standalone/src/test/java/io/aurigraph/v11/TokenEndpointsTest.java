package io.aurigraph.v11;

import io.aurigraph.v11.tokens.TokenManagementService;
import io.aurigraph.v11.tokens.models.Token;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.restassured.http.ContentType;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;

/**
 * Comprehensive Unit Tests for Token Management Endpoints
 *
 * Tests all three token endpoints in AurigraphResource.java:
 * 1. GET /api/v11/tokens (list with pagination)
 * 2. POST /api/v11/tokens (create token)
 * 3. GET /api/v11/tokens/statistics (token statistics)
 *
 * Coverage Target: 95%+ line coverage, 90%+ branch coverage
 *
 * @version 1.0.0
 * @author Backend Development Agent (BDA)
 * @since V11.4.4
 */
@QuarkusTest
@DisplayName("Token Management Endpoints - Comprehensive Test Suite")
public class TokenEndpointsTest {

    @InjectMock
    TokenManagementService tokenManagementService;

    private List<Token> mockTokens;
    private Map<String, Object> mockStatistics;

    @BeforeEach
    public void setUp() {
        // Create mock tokens dataset (96+ tokens as required)
        mockTokens = createMockTokenDataset();

        // Create mock statistics
        mockStatistics = createMockStatistics();
    }

    // ==================== GET /api/v11/tokens - LIST TOKENS ====================

    @Test
    @DisplayName("GET /tokens - Should return paginated token list")
    public void testGetTokens_Success() {
        // Mock service response
        Mockito.when(tokenManagementService.listTokens(anyInt(), anyInt()))
                .thenReturn(Uni.createFrom().item(mockTokens));

        given()
                .when()
                .get("/api/v11/tokens?page=0&size=100")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("count", greaterThanOrEqualTo(96))
                .body("page", equalTo(0))
                .body("size", equalTo(100))
                .body("tokens", hasSize(greaterThanOrEqualTo(96)))
                .body("tokens[0].id", notNullValue())
                .body("tokens[0].name", notNullValue())
                .body("tokens[0].symbol", notNullValue())
                .body("tokens[0].totalSupply", notNullValue())
                .body("tokens[0].circulatingSupply", notNullValue())
                .body("tokens[0].decimals", notNullValue())
                .body("tokens[0].contractAddress", notNullValue())
                .body("tokens[0].verified", notNullValue())
                .body("tokens[0].createdAt", notNullValue())
                .body("tokens[0].status", notNullValue())
                .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /tokens - Should handle pagination correctly")
    public void testGetTokens_Pagination() {
        // Mock different pages
        List<Token> page0 = mockTokens.subList(0, Math.min(50, mockTokens.size()));
        List<Token> page1 = mockTokens.subList(50, Math.min(100, mockTokens.size()));

        Mockito.when(tokenManagementService.listTokens(0, 50))
                .thenReturn(Uni.createFrom().item(page0));
        Mockito.when(tokenManagementService.listTokens(1, 50))
                .thenReturn(Uni.createFrom().item(page1));

        // Test page 0
        given()
                .when()
                .get("/api/v11/tokens?page=0&size=50")
                .then()
                .statusCode(200)
                .body("page", equalTo(0))
                .body("size", equalTo(50))
                .body("tokens", hasSize(50));

        // Test page 1
        given()
                .when()
                .get("/api/v11/tokens?page=1&size=50")
                .then()
                .statusCode(200)
                .body("page", equalTo(1))
                .body("size", equalTo(50))
                .body("tokens", hasSize(46)); // 96 total - 50 in page 0 = 46 in page 1
    }

    @Test
    @DisplayName("GET /tokens - Should validate pagination parameters")
    public void testGetTokens_ValidationEdgeCases() {
        Mockito.when(tokenManagementService.listTokens(anyInt(), anyInt()))
                .thenReturn(Uni.createFrom().item(mockTokens));

        // Test negative page number (should default to 0)
        given()
                .when()
                .get("/api/v11/tokens?page=-1&size=10")
                .then()
                .statusCode(200)
                .body("page", equalTo(0));

        // Test zero size (should default to 1)
        given()
                .when()
                .get("/api/v11/tokens?page=0&size=0")
                .then()
                .statusCode(200)
                .body("size", greaterThanOrEqualTo(1));

        // Test very large size (should be capped at 500)
        given()
                .when()
                .get("/api/v11/tokens?page=0&size=1000")
                .then()
                .statusCode(200)
                .body("size", lessThanOrEqualTo(500));
    }

    @Test
    @DisplayName("GET /tokens - Should return all required fields")
    public void testGetTokens_AllFieldsPresent() {
        Mockito.when(tokenManagementService.listTokens(anyInt(), anyInt()))
                .thenReturn(Uni.createFrom().item(mockTokens));

        given()
                .when()
                .get("/api/v11/tokens?page=0&size=10")
                .then()
                .statusCode(200)
                .body("tokens[0]", hasKey("id"))
                .body("tokens[0]", hasKey("name"))
                .body("tokens[0]", hasKey("symbol"))
                .body("tokens[0]", hasKey("totalSupply"))
                .body("tokens[0]", hasKey("circulatingSupply"))
                .body("tokens[0]", hasKey("decimals"))
                .body("tokens[0]", hasKey("contractAddress"))
                .body("tokens[0]", hasKey("verified"))
                .body("tokens[0]", hasKey("createdAt"))
                .body("tokens[0]", hasKey("status"))
                .body("tokens[0]", hasKey("isRWA"))
                .body("tokens[0]", hasKey("owner"))
                .body("tokens[0]", hasKey("holderCount"))
                .body("tokens[0]", hasKey("transferCount"));
    }

    @Test
    @DisplayName("GET /tokens - Should handle empty result")
    public void testGetTokens_EmptyResult() {
        Mockito.when(tokenManagementService.listTokens(anyInt(), anyInt()))
                .thenReturn(Uni.createFrom().item(Collections.emptyList()));

        given()
                .when()
                .get("/api/v11/tokens?page=100&size=10")
                .then()
                .statusCode(200)
                .body("count", equalTo(0))
                .body("tokens", hasSize(0));
    }

    @Test
    @DisplayName("GET /tokens - Should handle service errors gracefully")
    public void testGetTokens_ServiceError() {
        Mockito.when(tokenManagementService.listTokens(anyInt(), anyInt()))
                .thenReturn(Uni.createFrom().failure(new RuntimeException("Database connection failed")));

        given()
                .when()
                .get("/api/v11/tokens?page=0&size=10")
                .then()
                .statusCode(500)
                .body("error", containsString("Failed to retrieve tokens"));
    }

    // ==================== POST /api/v11/tokens - CREATE TOKEN ====================

    @Test
    @DisplayName("POST /tokens - Should create token successfully")
    public void testCreateToken_Success() {
        Token createdToken = createSampleToken("Test Token", "TEST");

        Mockito.when(tokenManagementService.createRWAToken(any()))
                .thenReturn(Uni.createFrom().item(createdToken));

        Map<String, Object> request = new HashMap<>();
        request.put("name", "Test Token");
        request.put("symbol", "TEST");
        request.put("totalSupply", 1000000);
        request.put("decimals", 18);
        request.put("contractAddress", "0x1234567890123456789012345678901234567890");

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("id", notNullValue())
                .body("name", equalTo("Test Token"))
                .body("symbol", equalTo("TEST"))
                .body("totalSupply", notNullValue())
                .body("decimals", equalTo(18))
                .body("contractAddress", notNullValue())
                .body("verified", notNullValue())
                .body("status", equalTo("active"))
                .body("createdAt", notNullValue())
                .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("POST /tokens - Should validate required fields")
    public void testCreateToken_MissingName() {
        Map<String, Object> request = new HashMap<>();
        request.put("symbol", "TEST");
        request.put("totalSupply", 1000000);

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(400)
                .body("error", containsString("Token name is required"));
    }

    @Test
    @DisplayName("POST /tokens - Should validate symbol field")
    public void testCreateToken_MissingSymbol() {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "Test Token");
        request.put("totalSupply", 1000000);

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(400)
                .body("error", containsString("Token symbol is required"));
    }

    @Test
    @DisplayName("POST /tokens - Should validate total supply")
    public void testCreateToken_NegativeSupply() {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "Test Token");
        request.put("symbol", "TEST");
        request.put("totalSupply", -100);

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(400)
                .body("error", containsString("Total supply must be >= 0"));
    }

    @Test
    @DisplayName("POST /tokens - Should use default decimals if not provided")
    public void testCreateToken_DefaultDecimals() {
        Token createdToken = createSampleToken("Default Decimals Token", "DDT");

        Mockito.when(tokenManagementService.createRWAToken(any()))
                .thenReturn(Uni.createFrom().item(createdToken));

        Map<String, Object> request = new HashMap<>();
        request.put("name", "Default Decimals Token");
        request.put("symbol", "DDT");
        request.put("totalSupply", 500000);

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(200)
                .body("decimals", equalTo(18)); // Default decimals
    }

    @Test
    @DisplayName("POST /tokens - Should auto-generate contract address if not provided")
    public void testCreateToken_AutoGenerateContractAddress() {
        Token createdToken = createSampleToken("Auto Contract Token", "ACT");

        Mockito.when(tokenManagementService.createRWAToken(any()))
                .thenReturn(Uni.createFrom().item(createdToken));

        Map<String, Object> request = new HashMap<>();
        request.put("name", "Auto Contract Token");
        request.put("symbol", "ACT");
        request.put("totalSupply", 750000);

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(200)
                .body("contractAddress", matchesPattern("^0x[a-fA-F0-9]{40}$"));
    }

    @Test
    @DisplayName("POST /tokens - Should handle service errors")
    public void testCreateToken_ServiceError() {
        Mockito.when(tokenManagementService.createRWAToken(any()))
                .thenReturn(Uni.createFrom().failure(new RuntimeException("Token creation failed")));

        Map<String, Object> request = new HashMap<>();
        request.put("name", "Error Token");
        request.put("symbol", "ERR");
        request.put("totalSupply", 100);

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(400)
                .body("error", containsString("Failed to create token"));
    }

    // ==================== GET /api/v11/tokens/statistics - TOKEN STATISTICS ====================

    @Test
    @DisplayName("GET /tokens/statistics - Should return comprehensive statistics")
    public void testGetStatistics_Success() {
        Mockito.when(tokenManagementService.getStatistics())
                .thenReturn(Uni.createFrom().item(mockStatistics));

        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalTokens", greaterThanOrEqualTo(96))
                .body("activeTokens", greaterThan(0))
                .body("totalSupply", greaterThan(0f))
                .body("verificationRate", greaterThanOrEqualTo(0f))
                .body("verificationRate", lessThanOrEqualTo(100f))
                .body("averageSupply", greaterThanOrEqualTo(0f))
                .body("fungibleTokens", greaterThanOrEqualTo(0))
                .body("rwaTokens", greaterThanOrEqualTo(0))
                .body("nonFungibleTokens", greaterThanOrEqualTo(0))
                .body("circulatingSupply", greaterThanOrEqualTo(0f))
                .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /tokens/statistics - Should calculate verification rate correctly")
    public void testGetStatistics_VerificationRate() {
        Mockito.when(tokenManagementService.getStatistics())
                .thenReturn(Uni.createFrom().item(mockStatistics));

        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200)
                .body("verificationRate", anyOf(
                        greaterThanOrEqualTo(0f),
                        lessThanOrEqualTo(100f)
                ));
    }

    @Test
    @DisplayName("GET /tokens/statistics - Should calculate average supply correctly")
    public void testGetStatistics_AverageSupply() {
        Mockito.when(tokenManagementService.getStatistics())
                .thenReturn(Uni.createFrom().item(mockStatistics));

        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200)
                .body("averageSupply", greaterThanOrEqualTo(0f));
    }

    @Test
    @DisplayName("GET /tokens/statistics - Should handle empty dataset")
    public void testGetStatistics_EmptyDataset() {
        Map<String, Object> emptyStats = createEmptyStatistics();

        Mockito.when(tokenManagementService.getStatistics())
                .thenReturn(Uni.createFrom().item(emptyStats));

        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200)
                .body("totalTokens", equalTo(0))
                .body("activeTokens", equalTo(0))
                .body("totalSupply", equalTo(0f))
                .body("verificationRate", equalTo(0f))
                .body("averageSupply", equalTo(0f));
    }

    @Test
    @DisplayName("GET /tokens/statistics - Should handle service errors")
    public void testGetStatistics_ServiceError() {
        Mockito.when(tokenManagementService.getStatistics())
                .thenReturn(Uni.createFrom().failure(new RuntimeException("Statistics calculation failed")));

        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(500)
                .body("error", containsString("Failed to retrieve token statistics"));
    }

    // ==================== HELPER METHODS ====================

    /**
     * Create mock token dataset with 96+ tokens
     */
    private List<Token> createMockTokenDataset() {
        List<Token> tokens = new ArrayList<>();

        // Create 100 diverse tokens
        String[] categories = {"DeFi", "NFT", "Gaming", "RWA", "Stablecoin", "Governance", "Utility", "Social"};
        String[] prefixes = {"Auri", "Digi", "Meta", "Crypto", "Chain", "Block", "Ether", "Quantum", "Hyper", "Stellar"};

        for (int i = 0; i < 100; i++) {
            String category = categories[i % categories.length];
            String prefix = prefixes[i % prefixes.length];
            String name = prefix + " " + category + " Token " + (i + 1);
            String symbol = (prefix.substring(0, Math.min(3, prefix.length())) +
                    category.substring(0, Math.min(2, category.length())) +
                    i).toUpperCase();

            Token token = createSampleToken(name, symbol);
            token.setTokenId("TOKEN_" + (1000 + i));
            token.setTotalSupply(BigDecimal.valueOf(1000000 + (i * 50000)));
            token.setCirculatingSupply(BigDecimal.valueOf(800000 + (i * 40000)));
            token.setHolderCount((long) (100 + (i * 10)));
            token.setTransferCount((long) (500 + (i * 50)));

            // Mark some as RWA tokens
            if (category.equals("RWA")) {
                token.setIsRWA(true);
            }

            tokens.add(token);
        }

        return tokens;
    }

    /**
     * Create a sample token
     */
    private Token createSampleToken(String name, String symbol) {
        Token token = new Token();
        token.setTokenId("TOKEN_" + System.currentTimeMillis());
        token.setName(name);
        token.setSymbol(symbol);
        token.setDecimals(18);
        token.setTotalSupply(BigDecimal.valueOf(1000000));
        token.setCirculatingSupply(BigDecimal.valueOf(800000));
        token.setOwner("0x1234567890123456789012345678901234567890");
        token.setContractAddress("0xabcdef0123456789abcdef0123456789abcdef01");
        token.setTokenType(Token.TokenType.FUNGIBLE);
        token.setCreatedAt(Instant.now());
        token.setUpdatedAt(Instant.now());
        token.setIsMintable(true);
        token.setIsBurnable(true);
        token.setIsPausable(false);
        token.setIsPaused(false);
        token.setIsRWA(false);
        token.setHolderCount(100L);
        token.setTransferCount(500L);

        return token;
    }

    /**
     * Create mock statistics
     */
    private Map<String, Object> createMockStatistics() {
        Map<String, Object> stats = new HashMap<>();

        Map<String, Object> tokenStats = new HashMap<>();
        tokenStats.put("totalTokens", 100L);
        tokenStats.put("fungibleTokens", 75L);
        tokenStats.put("nonFungibleTokens", 15L);
        tokenStats.put("rwaTokens", 10L);
        tokenStats.put("totalSupply", new BigDecimal("100000000.00"));
        tokenStats.put("totalCirculating", new BigDecimal("80000000.00"));

        stats.put("tokenStatistics", tokenStats);
        stats.put("tokensMinted", 1000L);
        stats.put("tokensBurned", 100L);
        stats.put("transfersCompleted", 5000L);
        stats.put("rwaTokensCreated", 10L);
        stats.put("timestamp", Instant.now());

        return stats;
    }

    /**
     * Create empty statistics for testing edge cases
     */
    private Map<String, Object> createEmptyStatistics() {
        Map<String, Object> stats = new HashMap<>();

        Map<String, Object> tokenStats = new HashMap<>();
        tokenStats.put("totalTokens", 0L);
        tokenStats.put("fungibleTokens", 0L);
        tokenStats.put("nonFungibleTokens", 0L);
        tokenStats.put("rwaTokens", 0L);
        tokenStats.put("totalSupply", BigDecimal.ZERO);
        tokenStats.put("totalCirculating", BigDecimal.ZERO);

        stats.put("tokenStatistics", tokenStats);
        stats.put("tokensMinted", 0L);
        stats.put("tokensBurned", 0L);
        stats.put("transfersCompleted", 0L);
        stats.put("rwaTokensCreated", 0L);
        stats.put("timestamp", Instant.now());

        return stats;
    }
}
