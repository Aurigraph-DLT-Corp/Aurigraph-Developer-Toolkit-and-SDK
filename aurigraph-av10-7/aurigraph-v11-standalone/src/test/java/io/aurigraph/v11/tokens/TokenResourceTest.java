package io.aurigraph.v11.tokens;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasKey;

/**
 * Integration tests for TokenResource REST API
 *
 * Tests all 8 token management endpoints:
 * 1. POST /api/v11/tokens/create
 * 2. GET  /api/v11/tokens/list
 * 3. GET  /api/v11/tokens/{tokenId}
 * 4. POST /api/v11/tokens/transfer
 * 5. POST /api/v11/tokens/mint
 * 6. POST /api/v11/tokens/burn
 * 7. GET  /api/v11/tokens/{tokenId}/balance/{address}
 * 8. GET  /api/v11/tokens/stats
 *
 * @version 1.0.0 (Oct 15, 2025)
 * @author Backend Development Agent (BDA)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TokenResourceTest {

    private static String createdTokenId;
    private static String ownerAddress;
    private static String recipientAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

    // ==================== TOKEN CREATION TESTS ====================

    @Test
    @Order(1)
    @DisplayName("Should create a new token successfully")
    public void testCreateToken() {
        String requestBody = """
                {
                    "name": "Test Token",
                    "symbol": "TST",
                    "decimals": 18,
                    "initialSupply": 1000000,
                    "maxSupply": 10000000,
                    "mintable": true,
                    "burnable": true,
                    "pausable": false,
                    "metadata": {
                        "description": "Test token for API testing",
                        "website": "https://test.aurigraph.io",
                        "logo": "https://test.aurigraph.io/logo.png",
                        "tags": ["test", "demo"]
                    }
                }
                """;

        var response = given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .post("/api/v11/tokens/create")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("name", equalTo("Test Token"))
                .body("symbol", equalTo("TST"))
                .body("decimals", equalTo(18))
                .body("totalSupply", equalTo(1000000.0f))
                .body("currentSupply", equalTo(1000000.0f))
                .body("owner", notNullValue())
                .body("contractAddress", notNullValue())
                .body("status", equalTo("active"))
                .body("metadata.description", equalTo("Test token for API testing"))
                .extract();

        createdTokenId = response.path("id");
        ownerAddress = response.path("owner");

        System.out.println("✓ Created token: " + createdTokenId);
        System.out.println("  Owner: " + ownerAddress);
    }

    @Test
    @Order(2)
    @DisplayName("Should fail to create token with invalid data")
    public void testCreateTokenValidation() {
        String invalidRequest = """
                {
                    "name": "",
                    "symbol": "TOOLONGSYMBOL",
                    "decimals": 25,
                    "initialSupply": -100,
                    "mintable": true,
                    "burnable": true,
                    "pausable": false
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(invalidRequest)
                .when()
                .post("/api/v11/tokens/create")
                .then()
                .statusCode(400); // Validation error
    }

    // ==================== TOKEN QUERY TESTS ====================

    @Test
    @Order(3)
    @DisplayName("Should list all tokens")
    public void testListTokens() {
        given()
                .queryParam("page", 0)
                .queryParam("size", 10)
                .when()
                .get("/api/v11/tokens/list")
                .then()
                .statusCode(200)
                .body("$", notNullValue())
                .body("size()", greaterThan(0));

        System.out.println("✓ Listed tokens successfully");
    }

    @Test
    @Order(4)
    @DisplayName("Should get token by ID")
    public void testGetTokenById() {
        if (createdTokenId == null) {
            System.out.println("⚠ Skipping: No token created yet");
            return;
        }

        given()
                .pathParam("tokenId", createdTokenId)
                .when()
                .get("/api/v11/tokens/{tokenId}")
                .then()
                .statusCode(200)
                .body("id", equalTo(createdTokenId))
                .body("name", equalTo("Test Token"))
                .body("symbol", equalTo("TST"));

        System.out.println("✓ Retrieved token: " + createdTokenId);
    }

    @Test
    @Order(5)
    @DisplayName("Should return 404 for non-existent token")
    public void testGetNonExistentToken() {
        given()
                .pathParam("tokenId", "INVALID_TOKEN_ID")
                .when()
                .get("/api/v11/tokens/{tokenId}")
                .then()
                .statusCode(404)
                .body(hasKey("error"));
    }

    // ==================== TOKEN BALANCE TESTS ====================

    @Test
    @Order(6)
    @DisplayName("Should get token balance for address")
    public void testGetBalance() {
        if (createdTokenId == null || ownerAddress == null) {
            System.out.println("⚠ Skipping: No token created yet");
            return;
        }

        given()
                .pathParam("tokenId", createdTokenId)
                .pathParam("address", ownerAddress)
                .when()
                .get("/api/v11/tokens/{tokenId}/balance/{address}")
                .then()
                .statusCode(200)
                .body("tokenId", equalTo(createdTokenId))
                .body("address", equalTo(ownerAddress))
                .body("balance", notNullValue())
                .body("available", notNullValue());

        System.out.println("✓ Retrieved balance for: " + ownerAddress);
    }

    // ==================== TOKEN OPERATION TESTS ====================

    @Test
    @Order(7)
    @DisplayName("Should mint tokens successfully")
    public void testMintTokens() {
        if (createdTokenId == null) {
            System.out.println("⚠ Skipping: No token created yet");
            return;
        }

        String mintRequest = String.format("""
                {
                    "tokenId": "%s",
                    "amount": 50000,
                    "to": "%s",
                    "memo": "Minting additional tokens for testing"
                }
                """, createdTokenId, recipientAddress);

        given()
                .contentType(ContentType.JSON)
                .body(mintRequest)
                .when()
                .post("/api/v11/tokens/mint")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("tokenId", equalTo(createdTokenId))
                .body("type", equalTo("mint"))
                .body("to", equalTo(recipientAddress))
                .body("amount", equalTo(50000.0f))
                .body("status", equalTo("confirmed"))
                .body("transactionHash", notNullValue());

        System.out.println("✓ Minted 50,000 tokens to: " + recipientAddress);
    }

    @Test
    @Order(8)
    @DisplayName("Should transfer tokens successfully")
    public void testTransferTokens() {
        if (createdTokenId == null || ownerAddress == null) {
            System.out.println("⚠ Skipping: No token created yet");
            return;
        }

        String transferRequest = String.format("""
                {
                    "tokenId": "%s",
                    "from": "%s",
                    "to": "%s",
                    "amount": 10000,
                    "memo": "Test transfer"
                }
                """, createdTokenId, ownerAddress, recipientAddress);

        given()
                .contentType(ContentType.JSON)
                .body(transferRequest)
                .when()
                .post("/api/v11/tokens/transfer")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("tokenId", equalTo(createdTokenId))
                .body("type", equalTo("transfer"))
                .body("from", equalTo(ownerAddress))
                .body("to", equalTo(recipientAddress))
                .body("amount", equalTo(10000.0f))
                .body("status", equalTo("confirmed"));

        System.out.println("✓ Transferred 10,000 tokens");
    }

    @Test
    @Order(9)
    @DisplayName("Should burn tokens successfully")
    public void testBurnTokens() {
        if (createdTokenId == null || ownerAddress == null) {
            System.out.println("⚠ Skipping: No token created yet");
            return;
        }

        String burnRequest = String.format("""
                {
                    "tokenId": "%s",
                    "amount": 5000,
                    "from": "%s",
                    "memo": "Burning tokens for deflation"
                }
                """, createdTokenId, ownerAddress);

        given()
                .contentType(ContentType.JSON)
                .body(burnRequest)
                .when()
                .post("/api/v11/tokens/burn")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("tokenId", equalTo(createdTokenId))
                .body("type", equalTo("burn"))
                .body("from", equalTo(ownerAddress))
                .body("amount", equalTo(5000.0f))
                .body("status", equalTo("confirmed"));

        System.out.println("✓ Burned 5,000 tokens");
    }

    @Test
    @Order(10)
    @DisplayName("Should fail to burn more tokens than available")
    public void testBurnInsufficientBalance() {
        if (createdTokenId == null || ownerAddress == null) {
            System.out.println("⚠ Skipping: No token created yet");
            return;
        }

        String burnRequest = String.format("""
                {
                    "tokenId": "%s",
                    "amount": 999999999,
                    "from": "%s"
                }
                """, createdTokenId, ownerAddress);

        given()
                .contentType(ContentType.JSON)
                .body(burnRequest)
                .when()
                .post("/api/v11/tokens/burn")
                .then()
                .statusCode(400)
                .body(hasKey("error"));

        System.out.println("✓ Correctly rejected burn with insufficient balance");
    }

    // ==================== STATISTICS TESTS ====================

    @Test
    @Order(11)
    @DisplayName("Should get token statistics")
    public void testGetStatistics() {
        given()
                .when()
                .get("/api/v11/tokens/stats")
                .then()
                .statusCode(200)
                .body("totalTokens", notNullValue())
                .body("activeTokens", notNullValue())
                .body("totalSupply", notNullValue())
                .body("totalHolders", notNullValue())
                .body("totalTransfers", notNullValue())
                .body("totalMinted", notNullValue())
                .body("totalBurned", notNullValue());

        System.out.println("✓ Retrieved token statistics");
    }

    // ==================== ERROR HANDLING TESTS ====================

    @Test
    @Order(12)
    @DisplayName("Should handle missing required fields")
    public void testMissingRequiredFields() {
        String invalidRequest = """
                {
                    "name": "Test"
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(invalidRequest)
                .when()
                .post("/api/v11/tokens/create")
                .then()
                .statusCode(400);
    }

    @Test
    @Order(13)
    @DisplayName("Should validate transfer amount is positive")
    public void testNegativeTransferAmount() {
        if (createdTokenId == null || ownerAddress == null) {
            System.out.println("⚠ Skipping: No token created yet");
            return;
        }

        String invalidTransfer = String.format("""
                {
                    "tokenId": "%s",
                    "from": "%s",
                    "to": "%s",
                    "amount": -100
                }
                """, createdTokenId, ownerAddress, recipientAddress);

        given()
                .contentType(ContentType.JSON)
                .body(invalidTransfer)
                .when()
                .post("/api/v11/tokens/transfer")
                .then()
                .statusCode(400);
    }

    // ==================== PERFORMANCE TESTS ====================

    @Test
    @Order(14)
    @DisplayName("Should handle large page size efficiently")
    public void testLargePageSize() {
        given()
                .queryParam("page", 0)
                .queryParam("size", 1000)
                .when()
                .get("/api/v11/tokens/list")
                .then()
                .statusCode(200);

        System.out.println("✓ Handled large page size request");
    }
}
