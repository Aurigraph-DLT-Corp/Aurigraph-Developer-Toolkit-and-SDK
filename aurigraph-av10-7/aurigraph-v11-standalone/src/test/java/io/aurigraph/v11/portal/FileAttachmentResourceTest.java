package io.aurigraph.v11.portal;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * File Attachment Resource Tests
 *
 * Tests for the File Attachment API endpoints:
 * - Upload with transaction ID
 * - Upload without transaction ID
 * - Get by transaction ID
 * - Get by file ID
 * - Verify hash
 * - Link to transaction
 * - Soft delete
 *
 * @author Testing Agent
 * @version 12.0.0
 * @since AV11-585
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class FileAttachmentResourceTest {

    private static final String BASE_PATH = "/api/v12/attachments";
    private static Path testFile;
    private static String uploadedFileId;
    private static String uploadedHash;
    private static final String TEST_TRANSACTION_ID = "0x1234567890abcdef1234567890abcdef12345678";
    private static final String TEST_TRANSACTION_ID_2 = "0xfedcba0987654321fedcba0987654321fedcba09";

    @BeforeAll
    static void setup() throws IOException {
        // Create a test file
        testFile = Files.createTempFile("test-attachment", ".txt");
        Files.writeString(testFile, "This is test content for file attachment testing.\nLine 2 of content.\nLine 3 with special chars: !@#$%^&*()");
    }

    @AfterAll
    static void cleanup() throws IOException {
        if (testFile != null && Files.exists(testFile)) {
            Files.delete(testFile);
        }
    }

    @Test
    @Order(1)
    @DisplayName("Upload file with transaction ID")
    void testUploadWithTransactionId() {
        Response response = given()
            .multiPart("file", testFile.toFile())
            .multiPart("category", "documents")
            .multiPart("description", "Test attachment for unit test")
            .when()
            .post(BASE_PATH + "/" + TEST_TRANSACTION_ID)
            .then()
            .statusCode(201)
            .contentType(ContentType.JSON)
            .body("fileId", notNullValue())
            .body("sha256Hash", notNullValue())
            .body("transactionId", equalTo(TEST_TRANSACTION_ID))
            .body("category", equalTo("documents"))
            .body("originalName", containsString("test-attachment"))
            .body("verified", equalTo(true))
            .extract().response();

        uploadedFileId = response.jsonPath().getString("fileId");
        uploadedHash = response.jsonPath().getString("sha256Hash");

        assertNotNull(uploadedFileId);
        assertNotNull(uploadedHash);
        assertEquals(64, uploadedHash.length(), "SHA256 hash should be 64 characters");
    }

    @Test
    @Order(2)
    @DisplayName("Get attachment by file ID")
    void testGetByFileId() {
        given()
            .when()
            .get(BASE_PATH + "/" + uploadedFileId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("fileId", equalTo(uploadedFileId))
            .body("sha256Hash", equalTo(uploadedHash))
            .body("transactionId", equalTo(TEST_TRANSACTION_ID))
            .body("downloadUrl", notNullValue());
    }

    @Test
    @Order(3)
    @DisplayName("Get attachments by transaction ID")
    void testGetByTransactionId() {
        given()
            .when()
            .get(BASE_PATH + "/transaction/" + TEST_TRANSACTION_ID)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("transactionId", equalTo(TEST_TRANSACTION_ID))
            .body("count", greaterThanOrEqualTo(1))
            .body("attachments", hasSize(greaterThanOrEqualTo(1)))
            .body("attachments[0].fileId", equalTo(uploadedFileId));
    }

    @Test
    @Order(4)
    @DisplayName("Verify file hash")
    void testVerifyHash() {
        given()
            .when()
            .post(BASE_PATH + "/" + uploadedFileId + "/verify")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("fileId", equalTo(uploadedFileId))
            .body("verified", equalTo(true))
            .body("expectedHash", equalTo(uploadedHash));
    }

    @Test
    @Order(5)
    @DisplayName("Upload file without transaction ID")
    void testUploadWithoutTransactionId() throws IOException {
        Path tempFile = Files.createTempFile("pending-test", ".txt");
        Files.writeString(tempFile, "Pending file content - unique: " + System.currentTimeMillis());

        try {
            Response response = given()
                .multiPart("file", tempFile.toFile())
                .multiPart("category", "data")
                .when()
                .post(BASE_PATH)
                .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("fileId", notNullValue())
                .body("transactionId", nullValue())
                .body("category", equalTo("data"))
                .body("message", containsString("pending"))
                .extract().response();

            String pendingFileId = response.jsonPath().getString("fileId");
            assertNotNull(pendingFileId);
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    @Test
    @Order(6)
    @DisplayName("Link pending attachment to transaction")
    void testLinkToTransaction() throws IOException {
        // First upload a file without transaction
        Path tempFile = Files.createTempFile("link-test", ".txt");
        Files.writeString(tempFile, "Link test content - unique: " + System.currentTimeMillis());

        try {
            Response uploadResponse = given()
                .multiPart("file", tempFile.toFile())
                .multiPart("category", "documents")
                .when()
                .post(BASE_PATH)
                .then()
                .statusCode(201)
                .extract().response();

            String pendingFileId = uploadResponse.jsonPath().getString("fileId");

            // Link to transaction
            given()
                .when()
                .post(BASE_PATH + "/" + pendingFileId + "/link/" + TEST_TRANSACTION_ID_2)
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("fileId", equalTo(pendingFileId))
                .body("transactionId", equalTo(TEST_TRANSACTION_ID_2))
                .body("message", containsString("linked"));

            // Verify it's now linked
            given()
                .when()
                .get(BASE_PATH + "/" + pendingFileId)
                .then()
                .statusCode(200)
                .body("transactionId", equalTo(TEST_TRANSACTION_ID_2));

        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    @Test
    @Order(7)
    @DisplayName("Download attachment file")
    void testDownloadFile() {
        Response response = given()
            .when()
            .get(BASE_PATH + "/" + uploadedFileId + "/download")
            .then()
            .statusCode(200)
            .header("Content-Disposition", containsString("attachment"))
            .header("X-SHA256-Hash", equalTo(uploadedHash))
            .extract().response();

        byte[] content = response.asByteArray();
        assertTrue(content.length > 0, "Downloaded content should not be empty");
    }

    @Test
    @Order(8)
    @DisplayName("Reject invalid file extension")
    void testRejectInvalidExtension() throws IOException {
        Path invalidFile = Files.createTempFile("test", ".exe");
        Files.writeString(invalidFile, "fake exe content");

        try {
            given()
                .multiPart("file", invalidFile.toFile())
                .when()
                .post(BASE_PATH + "/" + TEST_TRANSACTION_ID)
                .then()
                .statusCode(400)
                .body("error", containsString("type not allowed"));
        } finally {
            Files.deleteIfExists(invalidFile);
        }
    }

    @Test
    @Order(9)
    @DisplayName("Handle non-existent file ID")
    void testNotFoundFileId() {
        given()
            .when()
            .get(BASE_PATH + "/non-existent-file-id-12345")
            .then()
            .statusCode(404)
            .body("error", containsString("not found"));
    }

    @Test
    @Order(10)
    @DisplayName("Handle non-existent transaction ID")
    void testEmptyTransactionAttachments() {
        given()
            .when()
            .get(BASE_PATH + "/transaction/0xnonexistent123456789")
            .then()
            .statusCode(200)
            .body("count", equalTo(0))
            .body("attachments", hasSize(0));
    }

    @Test
    @Order(11)
    @DisplayName("Soft delete attachment")
    void testSoftDelete() throws IOException {
        // Upload a file to delete
        Path tempFile = Files.createTempFile("delete-test", ".txt");
        Files.writeString(tempFile, "Delete test content - unique: " + System.currentTimeMillis());

        try {
            Response uploadResponse = given()
                .multiPart("file", tempFile.toFile())
                .when()
                .post(BASE_PATH + "/" + TEST_TRANSACTION_ID)
                .then()
                .statusCode(201)
                .extract().response();

            String deleteFileId = uploadResponse.jsonPath().getString("fileId");

            // Delete it
            given()
                .when()
                .delete(BASE_PATH + "/" + deleteFileId)
                .then()
                .statusCode(200)
                .body("deleted", equalTo(true))
                .body("message", containsString("deleted"));

            // Verify it's not found anymore
            given()
                .when()
                .get(BASE_PATH + "/" + deleteFileId)
                .then()
                .statusCode(404);

        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    @Test
    @Order(12)
    @DisplayName("Duplicate file detection by hash")
    void testDuplicateDetection() {
        // Upload the same file again - should return existing
        Response response = given()
            .multiPart("file", testFile.toFile())
            .multiPart("category", "documents")
            .when()
            .post(BASE_PATH + "/" + TEST_TRANSACTION_ID)
            .then()
            .statusCode(200)  // 200 for existing, not 201
            .body("sha256Hash", equalTo(uploadedHash))
            .body("message", containsString("already exists"))
            .extract().response();
    }

    @Test
    @Order(13)
    @DisplayName("Missing file upload returns error")
    void testMissingFile() {
        given()
            .contentType("multipart/form-data")
            .when()
            .post(BASE_PATH + "/" + TEST_TRANSACTION_ID)
            .then()
            .statusCode(400)
            .body("error", containsString("No file"));
    }

    @Test
    @Order(14)
    @DisplayName("Empty transaction ID returns error")
    void testEmptyTransactionId() {
        given()
            .multiPart("file", testFile.toFile())
            .when()
            .post(BASE_PATH + "/   ")
            .then()
            .statusCode(anyOf(is(400), is(404)));
    }
}
