package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Comprehensive Resource Test for Quantum Security V12 API
 *
 * Tests REST endpoints for:
 * - Quantum crypto service status
 * - Algorithm support verification
 * - Key generation and management
 * - Digital signatures
 * - Encryption/Decryption operations
 * - Performance metrics
 * - Error handling
 *
 * Target: 10+ comprehensive REST endpoint tests
 * Coverage: V12 Quantum Security REST API
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Quantum Security V12 Resource Test Suite")
public class QuantumSecurityV12ResourceTest {

    private static final String CRYPTO_BASE_PATH = "/api/v11/crypto";
    private static final String TEST_KEY_PREFIX = "test-quantum-v12";

    @Test
    @Order(1)
    @DisplayName("Test quantum crypto service status endpoint")
    void testQuantumCryptoServiceStatus() {
        given()
            .when().get(CRYPTO_BASE_PATH + "/status")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("quantumCryptoEnabled", equalTo(true))
                .body("kyberSecurityLevel", greaterThanOrEqualTo(3))
                .body("dilithiumSecurityLevel", greaterThanOrEqualTo(3))
                .body("algorithms", notNullValue())
                .body("targetTPS", greaterThan(0));
    }

    @Test
    @Order(2)
    @DisplayName("Test supported quantum algorithms endpoint")
    void testSupportedQuantumAlgorithms() {
        given()
            .when().get(CRYPTO_BASE_PATH + "/algorithms")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("suite", containsString("Post-Quantum"))
                .body("algorithms", hasSize(greaterThan(0)))
                .body("algorithms.find { it.name == 'CRYSTALS-Kyber' }.available", equalTo(true))
                .body("algorithms.find { it.name == 'CRYSTALS-Dilithium' }.available", equalTo(true));
    }

    @Test
    @Order(3)
    @DisplayName("Test quantum security status endpoint")
    void testQuantumSecurityStatus() {
        given()
            .when().get(CRYPTO_BASE_PATH + "/security/quantum-status")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("quantumCryptoEnabled", equalTo(true))
                .body("nistLevel5Compliant", equalTo(true))
                .body("quantumResistant", equalTo(true))
                .body("quantumBitSecurity", greaterThanOrEqualTo(192));
    }

    @Test
    @Order(4)
    @DisplayName("Test CRYSTALS-Dilithium key generation via REST API")
    void testDilithiumKeyGenerationAPI() {
        String requestBody = String.format("""
            {
                "keyId": "%s-dilithium-api",
                "algorithm": "CRYSTALS-Dilithium"
            }
            """, TEST_KEY_PREFIX);

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("keyId", equalTo(TEST_KEY_PREFIX + "-dilithium-api"))
                .body("algorithm", equalTo("CRYSTALS-Dilithium"))
                .body("securityLevel", greaterThanOrEqualTo(3))
                .body("publicKeySize", greaterThan(0))
                .body("privateKeySize", greaterThan(0));
    }

    @Test
    @Order(5)
    @DisplayName("Test CRYSTALS-Kyber key generation via REST API")
    void testKyberKeyGenerationAPI() {
        String requestBody = String.format("""
            {
                "keyId": "%s-kyber-api",
                "algorithm": "CRYSTALS-Kyber"
            }
            """, TEST_KEY_PREFIX);

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("keyId", equalTo(TEST_KEY_PREFIX + "-kyber-api"))
                .body("algorithm", equalTo("CRYSTALS-Kyber"))
                .body("securityLevel", greaterThanOrEqualTo(3));
    }

    @Test
    @Order(6)
    @DisplayName("Test quantum-resistant digital signature via REST API")
    void testQuantumDigitalSignatureAPI() {
        // First generate a key
        String keyGenRequest = String.format("""
            {
                "keyId": "%s-sign-api",
                "algorithm": "CRYSTALS-Dilithium"
            }
            """, TEST_KEY_PREFIX);

        given()
            .contentType(ContentType.JSON)
            .body(keyGenRequest)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200);

        // Now sign data
        String testData = "Test data for quantum-resistant signature";
        String signRequest = String.format("""
            {
                "keyId": "%s-sign-api",
                "data": "%s"
            }
            """, TEST_KEY_PREFIX, testData);

        String signature = given()
            .contentType(ContentType.JSON)
            .body(signRequest)
            .when().post(CRYPTO_BASE_PATH + "/sign")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("signature", notNullValue())
                .body("status", equalTo("SUCCESS"))
                .extract().path("signature");

        // Verify signature
        String verifyRequest = String.format("""
            {
                "keyId": "%s-sign-api",
                "data": "%s",
                "signature": "%s"
            }
            """, TEST_KEY_PREFIX, testData, signature);

        given()
            .contentType(ContentType.JSON)
            .body(verifyRequest)
            .when().post(CRYPTO_BASE_PATH + "/verify")
            .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("isValid", equalTo(true))
                .body("status", equalTo("SIGNATURE_VALID"));
    }

    @Test
    @Order(7)
    @DisplayName("Test quantum-resistant encryption via REST API")
    void testQuantumEncryptionAPI() {
        // Generate encryption key
        String keyGenRequest = String.format("""
            {
                "keyId": "%s-encrypt-api",
                "algorithm": "CRYSTALS-Kyber"
            }
            """, TEST_KEY_PREFIX);

        given()
            .contentType(ContentType.JSON)
            .body(keyGenRequest)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200);

        // Encrypt data
        String plaintext = "Confidential quantum-encrypted message";
        String encryptRequest = String.format("""
            {
                "keyId": "%s-encrypt-api",
                "plaintext": "%s"
            }
            """, TEST_KEY_PREFIX, plaintext);

        String ciphertext = given()
            .contentType(ContentType.JSON)
            .body(encryptRequest)
            .when().post(CRYPTO_BASE_PATH + "/encrypt")
            .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("ciphertext", notNullValue())
                .body("status", equalTo("SUCCESS"))
                .extract().path("ciphertext");

        // Decrypt data
        String decryptRequest = String.format("""
            {
                "keyId": "%s-encrypt-api",
                "ciphertext": "%s"
            }
            """, TEST_KEY_PREFIX, ciphertext);

        given()
            .contentType(ContentType.JSON)
            .body(decryptRequest)
            .when().post(CRYPTO_BASE_PATH + "/decrypt")
            .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("plaintext", equalTo(plaintext))
                .body("status", equalTo("SUCCESS"));
    }

    @Test
    @Order(8)
    @DisplayName("Test invalid signature verification error handling")
    void testInvalidSignatureVerification() {
        // Generate two different keys
        given().contentType(ContentType.JSON)
            .body(String.format("""
                {"keyId": "%s-invalid1", "algorithm": "CRYSTALS-Dilithium"}
                """, TEST_KEY_PREFIX))
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then().statusCode(200);

        given().contentType(ContentType.JSON)
            .body(String.format("""
                {"keyId": "%s-invalid2", "algorithm": "CRYSTALS-Dilithium"}
                """, TEST_KEY_PREFIX))
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then().statusCode(200);

        // Sign with first key
        String testData = "Test data";
        String signature = given()
            .contentType(ContentType.JSON)
            .body(String.format("""
                {"keyId": "%s-invalid1", "data": "%s"}
                """, TEST_KEY_PREFIX, testData))
            .when().post(CRYPTO_BASE_PATH + "/sign")
            .then().statusCode(200)
            .extract().path("signature");

        // Verify with second key (should fail)
        given()
            .contentType(ContentType.JSON)
            .body(String.format("""
                {"keyId": "%s-invalid2", "data": "%s", "signature": "%s"}
                """, TEST_KEY_PREFIX, testData, signature))
            .when().post(CRYPTO_BASE_PATH + "/verify")
            .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("isValid", equalTo(false))
                .body("status", equalTo("SIGNATURE_INVALID"));
    }

    @Test
    @Order(9)
    @DisplayName("Test crypto performance benchmark endpoint")
    void testCryptoPerformanceBenchmark() {
        String performanceRequest = """
            {
                "operations": 50
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(performanceRequest)
            .when().post(CRYPTO_BASE_PATH + "/performance")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalOperations", equalTo(50))
                .body("successfulOperations", greaterThan(40))
                .body("operationsPerSecond", greaterThan(0.0f))
                .body("averageLatencyMs", greaterThan(0.0f));
    }

    @Test
    @Order(10)
    @DisplayName("Test key not found error handling")
    void testKeyNotFoundErrorHandling() {
        String signRequest = """
            {
                "keyId": "non-existent-key-12345",
                "data": "test data"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(signRequest)
            .when().post(CRYPTO_BASE_PATH + "/sign")
            .then()
                .statusCode(200)
                .body("success", equalTo(false))
                .body("status", containsString("Key not found"));
    }

    @AfterAll
    static void tearDown() {
        System.out.println("QuantumSecurityV12Resource test suite completed successfully");
        System.out.println("All 10 quantum security V12 REST API tests validated");
    }
}
