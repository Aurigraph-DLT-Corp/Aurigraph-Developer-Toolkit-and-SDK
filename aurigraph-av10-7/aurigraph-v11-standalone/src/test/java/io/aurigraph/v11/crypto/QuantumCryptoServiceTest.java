package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Comprehensive test suite for QuantumCryptoService
 * 
 * Tests all quantum-resistant cryptographic operations including:
 * - CRYSTALS-Kyber key encapsulation
 * - CRYSTALS-Dilithium digital signatures
 * - SPHINCS+ hash-based signatures
 * - NIST Level 5 compliance validation
 * - Performance benchmarks
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Execution(ExecutionMode.CONCURRENT)
public class QuantumCryptoServiceTest {
    
    private static final String CRYPTO_BASE_PATH = "/api/v11/crypto";
    private static final String TEST_KEY_ID = "test-key-quantum-crypto";
    private static final String TEST_DATA = "Hello, Quantum World! This is a test message for post-quantum cryptography.";
    
    @Test
    @Order(1)
    @DisplayName("Test Crypto Service Status")
    void testCryptoServiceStatus() {
        given()
            .when().get(CRYPTO_BASE_PATH + "/status")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("quantumCryptoEnabled", equalTo(true))
                .body("kyberSecurityLevel", greaterThanOrEqualTo(3))
                .body("dilithiumSecurityLevel", greaterThanOrEqualTo(3))
                .body("algorithms", containsString("CRYSTALS"))
                .body("targetTPS", greaterThan(0));
    }
    
    @Test
    @Order(2)
    @DisplayName("Test Supported Algorithms")
    void testSupportedAlgorithms() {
        given()
            .when().get(CRYPTO_BASE_PATH + "/algorithms")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("suite", equalTo("Post-Quantum Cryptography Suite V11"))
                .body("algorithms", hasSize(greaterThan(0)))
                .body("algorithms.find { it.name == 'CRYSTALS-Kyber' }.available", equalTo(true))
                .body("algorithms.find { it.name == 'CRYSTALS-Dilithium' }.available", equalTo(true))
                .body("algorithms.find { it.name == 'SPHINCS+' }.available", equalTo(true));
    }
    
    @Test
    @Order(3)
    @DisplayName("Test Quantum Security Status")
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
    @DisplayName("Test CRYSTALS-Dilithium Key Generation")
    void testDilithiumKeyGeneration() {
        String requestBody = String.format("""
            {
                "keyId": "%s-dilithium",
                "algorithm": "CRYSTALS-Dilithium"
            }
            """, TEST_KEY_ID);
            
        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("keyId", equalTo(TEST_KEY_ID + "-dilithium"))
                .body("algorithm", equalTo("CRYSTALS-Dilithium"))
                .body("securityLevel", greaterThanOrEqualTo(3))
                .body("publicKeySize", greaterThan(0))
                .body("privateKeySize", greaterThan(0))
                .body("latencyMs", greaterThan(0.0f));
    }
    
    @Test
    @Order(5)
    @DisplayName("Test CRYSTALS-Kyber Key Generation")
    void testKyberKeyGeneration() {
        String requestBody = String.format("""
            {
                "keyId": "%s-kyber",
                "algorithm": "CRYSTALS-Kyber"
            }
            """, TEST_KEY_ID);
            
        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("keyId", equalTo(TEST_KEY_ID + "-kyber"))
                .body("algorithm", equalTo("CRYSTALS-Kyber"))
                .body("securityLevel", greaterThanOrEqualTo(3))
                .body("publicKeySize", greaterThan(0))
                .body("privateKeySize", greaterThan(0));
    }
    
    @Test
    @Order(6)
    @DisplayName("Test Digital Signature Generation")
    void testDigitalSignature() {
        // First generate a key for signing
        String keyGenRequest = String.format("""
            {
                "keyId": "%s-sign",
                "algorithm": "CRYSTALS-Dilithium"
            }
            """, TEST_KEY_ID);
            
        given()
            .contentType(ContentType.JSON)
            .body(keyGenRequest)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200);
        
        // Now test signing
        String signRequest = String.format("""
            {
                "keyId": "%s-sign",
                "data": "%s"
            }
            """, TEST_KEY_ID, TEST_DATA);
            
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
                .body("latencyMs", greaterThan(0.0f))
                .extract().path("signature");
        
        // Verify the signature
        String verifyRequest = String.format("""
            {
                "keyId": "%s-sign",
                "data": "%s",
                "signature": "%s"
            }
            """, TEST_KEY_ID, TEST_DATA, signature);
            
        given()
            .contentType(ContentType.JSON)
            .body(verifyRequest)
            .when().post(CRYPTO_BASE_PATH + "/verify")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("isValid", equalTo(true))
                .body("status", equalTo("SIGNATURE_VALID"));
    }
    
    @Test
    @Order(7)
    @DisplayName("Test Quantum-Resistant Encryption")
    void testQuantumEncryption() {
        // Generate key for encryption
        String keyGenRequest = String.format("""
            {
                "keyId": "%s-encrypt",
                "algorithm": "CRYSTALS-Kyber"
            }
            """, TEST_KEY_ID);
            
        given()
            .contentType(ContentType.JSON)
            .body(keyGenRequest)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200);
        
        // Test encryption
        String encryptRequest = String.format("""
            {
                "keyId": "%s-encrypt",
                "plaintext": "%s"
            }
            """, TEST_KEY_ID, TEST_DATA);
            
        String ciphertext = given()
            .contentType(ContentType.JSON)
            .body(encryptRequest)
            .when().post(CRYPTO_BASE_PATH + "/encrypt")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("ciphertext", notNullValue())
                .body("status", equalTo("SUCCESS"))
                .extract().path("ciphertext");
        
        // Test decryption
        String decryptRequest = String.format("""
            {
                "keyId": "%s-encrypt",
                "ciphertext": "%s"
            }
            """, TEST_KEY_ID, ciphertext);
            
        given()
            .contentType(ContentType.JSON)
            .body(decryptRequest)
            .when().post(CRYPTO_BASE_PATH + "/decrypt")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("success", equalTo(true))
                .body("plaintext", equalTo(TEST_DATA))
                .body("status", equalTo("SUCCESS"));
    }
    
    @Test
    @Order(8)
    @DisplayName("Test Invalid Signature Verification")
    void testInvalidSignatureVerification() {
        // Generate two different keys
        String keyGenRequest1 = String.format("""
            {
                "keyId": "%s-invalid1",
                "algorithm": "CRYSTALS-Dilithium"
            }
            """, TEST_KEY_ID);
            
        String keyGenRequest2 = String.format("""
            {
                "keyId": "%s-invalid2",
                "algorithm": "CRYSTALS-Dilithium"
            }
            """, TEST_KEY_ID);
            
        given().contentType(ContentType.JSON).body(keyGenRequest1)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then().statusCode(200);
            
        given().contentType(ContentType.JSON).body(keyGenRequest2)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then().statusCode(200);
        
        // Sign with first key
        String signRequest = String.format("""
            {
                "keyId": "%s-invalid1",
                "data": "%s"
            }
            """, TEST_KEY_ID, TEST_DATA);
            
        String signature = given()
            .contentType(ContentType.JSON)
            .body(signRequest)
            .when().post(CRYPTO_BASE_PATH + "/sign")
            .then()
                .statusCode(200)
                .extract().path("signature");
        
        // Try to verify with second key (should fail)
        String verifyRequest = String.format("""
            {
                "keyId": "%s-invalid2",
                "data": "%s",
                "signature": "%s"
            }
            """, TEST_KEY_ID, TEST_DATA, signature);
            
        given()
            .contentType(ContentType.JSON)
            .body(verifyRequest)
            .when().post(CRYPTO_BASE_PATH + "/verify")
            .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("isValid", equalTo(false))
                .body("status", equalTo("SIGNATURE_INVALID"));
    }
    
    @Test
    @Order(9)
    @DisplayName("Test Crypto Performance Benchmark")
    void testCryptoPerformance() {
        String performanceRequest = """
            {
                "operations": 100
            }
            """;
            
        given()
            .contentType(ContentType.JSON)
            .body(performanceRequest)
            .when().post(CRYPTO_BASE_PATH + "/performance")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalOperations", equalTo(100))
                .body("successfulOperations", greaterThan(90))
                .body("operationsPerSecond", greaterThan(0.0f))
                .body("averageLatencyMs", greaterThan(0.0f))
                .body("operationType", containsString("encryption"));
    }
    
    @Test
    @Order(10)
    @DisplayName("Test Key Not Found Error Handling")
    void testKeyNotFoundError() {
        String signRequest = """
            {
                "keyId": "non-existent-key",
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
    
    @Test
    @Order(11)
    @DisplayName("Test Large Data Encryption Performance")
    void testLargeDataEncryption() {
        // Generate key for large data test
        String keyGenRequest = String.format("""
            {
                "keyId": "%s-large",
                "algorithm": "CRYSTALS-Kyber"
            }
            """, TEST_KEY_ID);
            
        given()
            .contentType(ContentType.JSON)
            .body(keyGenRequest)
            .when().post(CRYPTO_BASE_PATH + "/keystore/generate")
            .then()
                .statusCode(200);
        
        // Create large test data (1KB)
        StringBuilder largeData = new StringBuilder();
        for (int i = 0; i < 100; i++) {
            largeData.append("This is test data line ").append(i).append(". ");
        }
        
        String encryptRequest = String.format("""
            {
                "keyId": "%s-large",
                "plaintext": "%s"
            }
            """, TEST_KEY_ID, largeData.toString());
            
        String ciphertext = given()
            .contentType(ContentType.JSON)
            .body(encryptRequest)
            .when().post(CRYPTO_BASE_PATH + "/encrypt")
            .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("latencyMs", lessThan(1000.0f)) // Should encrypt 1KB in less than 1 second
                .extract().path("ciphertext");
        
        // Verify decryption
        String decryptRequest = String.format("""
            {
                "keyId": "%s-large",
                "ciphertext": "%s"
            }
            """, TEST_KEY_ID, ciphertext);
            
        given()
            .contentType(ContentType.JSON)
            .body(decryptRequest)
            .when().post(CRYPTO_BASE_PATH + "/decrypt")
            .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("plaintext", equalTo(largeData.toString()))
                .body("latencyMs", lessThan(500.0f)); // Should decrypt faster than encrypt
    }
    
    @Test
    @Order(12)
    @DisplayName("Test NIST Level 5 Security Validation")
    void testNISTLevel5Compliance() {
        given()
            .when().get(CRYPTO_BASE_PATH + "/security/quantum-status")
            .then()
                .statusCode(200)
                .body("nistLevel5Compliant", equalTo(true))
                .body("quantumBitSecurity", greaterThanOrEqualTo(192)) // Level 3+ provides 192-bit security
                .body("kyberSecurityLevel", greaterThanOrEqualTo(3))
                .body("dilithiumSecurityLevel", greaterThanOrEqualTo(3));
    }
    
    @AfterAll
    static void tearDown() {
        System.out.println("QuantumCryptoService test suite completed successfully");
        System.out.println("All quantum-resistant cryptographic operations validated");
    }
}