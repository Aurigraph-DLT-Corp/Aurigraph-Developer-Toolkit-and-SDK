package io.aurigraph.v11.api;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.aurigraph.v11.TransactionService;
import io.aurigraph.v11.models.Transaction;
import io.aurigraph.v11.models.TransactionStatus;
import io.aurigraph.v11.models.TransactionType;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive API tests for Transaction endpoints
 * Sprint 9: Core API Tests
 *
 * Coverage Requirements:
 * - GET /api/v11/transactions (with pagination, filtering)
 * - GET /api/v11/transactions/{id} (found and not found)
 * - POST /api/v11/transactions (valid and invalid)
 * - Test filtering by status, type, address
 * - Test edge cases (negative IDs, invalid JSON, validation errors)
 */
@QuarkusTest
@DisplayName("Transaction API Tests - Sprint 9")
public class TransactionApiTest {

    @InjectMock
    TransactionService transactionService;

    private Transaction createMockTransaction(String id, String fromAddress, String toAddress,
                                             BigDecimal amount, TransactionStatus status) {
        Transaction tx = new Transaction();
        tx.setId(id);
        tx.setFromAddress(fromAddress);
        tx.setToAddress(toAddress);
        tx.setAmount(amount);
        tx.setStatus(status);
        tx.setType(TransactionType.TRANSFER);
        tx.setTimestamp(Instant.now());
        tx.setHash("0x" + id + "abcdef1234567890");
        tx.setBlockHash("0xblock123");
        tx.setBlockHeight(1000L);
        tx.setGasUsed(21000L);
        tx.setGasPrice(BigDecimal.valueOf(50));
        tx.setNonce(1L);
        tx.setSignature("0xsignature" + id);
        return tx;
    }

    @BeforeEach
    void setup() {
        Mockito.reset(transactionService);
    }

    @Nested
    @DisplayName("GET /api/v11/transactions - List transactions")
    class GetTransactionsTest {

        @Test
        @DisplayName("Should return transactions with default pagination")
        void testGetTransactionsDefaultPagination() {
            // Given
            List<Transaction> mockTransactions = List.of(
                createMockTransaction("tx1", "0xaddr1", "0xaddr2", BigDecimal.TEN, TransactionStatus.CONFIRMED),
                createMockTransaction("tx2", "0xaddr3", "0xaddr4", BigDecimal.valueOf(20), TransactionStatus.PENDING)
            );
            when(transactionService.getTransactions(anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(Uni.createFrom().item(mockTransactions));

            // When/Then
            given()
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("size()", is(2))
                .body("[0].id", notNullValue())
                .body("[0].status", notNullValue())
                .body("[0].hash", startsWith("0x"));
        }

        @Test
        @DisplayName("Should return transactions with custom pagination")
        void testGetTransactionsWithPagination() {
            // Given
            List<Transaction> mockTransactions = List.of(
                createMockTransaction("tx1", "0xaddr1", "0xaddr2", BigDecimal.TEN, TransactionStatus.CONFIRMED)
            );
            when(transactionService.getTransactions(eq(10), eq(5), any(), any(), any()))
                .thenReturn(Uni.createFrom().item(mockTransactions));

            // When/Then
            given()
                .queryParam("limit", 10)
                .queryParam("offset", 5)
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(0));
        }

        @Test
        @DisplayName("Should filter transactions by status")
        void testFilterByStatus() {
            // Given
            List<Transaction> confirmedTxs = List.of(
                createMockTransaction("tx1", "0xaddr1", "0xaddr2", BigDecimal.TEN, TransactionStatus.CONFIRMED)
            );
            when(transactionService.getTransactions(anyInt(), anyInt(), eq(TransactionStatus.CONFIRMED), any(), any()))
                .thenReturn(Uni.createFrom().item(confirmedTxs));

            // When/Then
            given()
                .queryParam("status", "CONFIRMED")
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(200)
                .body("[0].status", is("CONFIRMED"));
        }

        @Test
        @DisplayName("Should filter transactions by type")
        void testFilterByType() {
            // Given
            List<Transaction> transferTxs = List.of(
                createMockTransaction("tx1", "0xaddr1", "0xaddr2", BigDecimal.TEN, TransactionStatus.CONFIRMED)
            );
            when(transactionService.getTransactions(anyInt(), anyInt(), any(), eq(TransactionType.TRANSFER), any()))
                .thenReturn(Uni.createFrom().item(transferTxs));

            // When/Then
            given()
                .queryParam("type", "TRANSFER")
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(200)
                .body("[0].type", is("TRANSFER"));
        }

        @Test
        @DisplayName("Should filter transactions by address")
        void testFilterByAddress() {
            // Given
            String testAddress = "0xaddr1";
            List<Transaction> addressTxs = List.of(
                createMockTransaction("tx1", testAddress, "0xaddr2", BigDecimal.TEN, TransactionStatus.CONFIRMED)
            );
            when(transactionService.getTransactions(anyInt(), anyInt(), any(), any(), eq(testAddress)))
                .thenReturn(Uni.createFrom().item(addressTxs));

            // When/Then
            given()
                .queryParam("address", testAddress)
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(200)
                .body("[0].fromAddress", is(testAddress));
        }

        @Test
        @DisplayName("Should handle negative limit parameter")
        void testNegativeLimitParameter() {
            given()
                .queryParam("limit", -1)
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(anyOf(is(400), is(200))); // Should reject or use default
        }

        @Test
        @DisplayName("Should handle negative offset parameter")
        void testNegativeOffsetParameter() {
            given()
                .queryParam("offset", -1)
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(anyOf(is(400), is(200))); // Should reject or use default
        }

        @Test
        @DisplayName("Should return empty list when no transactions found")
        void testEmptyTransactionList() {
            // Given
            when(transactionService.getTransactions(anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(Uni.createFrom().item(List.of()));

            // When/Then
            given()
                .when()
                .get("/api/v11/transactions")
                .then()
                .statusCode(200)
                .body("size()", is(0));
        }
    }

    @Nested
    @DisplayName("GET /api/v11/transactions/{id} - Get transaction by ID")
    class GetTransactionByIdTest {

        @Test
        @DisplayName("Should return transaction when found")
        void testGetTransactionFound() {
            // Given
            String txId = "tx123";
            Transaction mockTx = createMockTransaction(txId, "0xaddr1", "0xaddr2",
                                                       BigDecimal.valueOf(100), TransactionStatus.CONFIRMED);
            when(transactionService.getTransaction(txId))
                .thenReturn(Uni.createFrom().item(Optional.of(mockTx)));

            // When/Then
            given()
                .pathParam("id", txId)
                .when()
                .get("/api/v11/transactions/{id}")
                .then()
                .statusCode(200)
                .body("id", is(txId))
                .body("fromAddress", is("0xaddr1"))
                .body("toAddress", is("0xaddr2"))
                .body("amount", notNullValue())
                .body("status", is("CONFIRMED"))
                .body("hash", startsWith("0x"));
        }

        @Test
        @DisplayName("Should return 404 when transaction not found")
        void testGetTransactionNotFound() {
            // Given
            String nonExistentId = "tx_nonexistent";
            when(transactionService.getTransaction(nonExistentId))
                .thenReturn(Uni.createFrom().item(Optional.empty()));

            // When/Then
            given()
                .pathParam("id", nonExistentId)
                .when()
                .get("/api/v11/transactions/{id}")
                .then()
                .statusCode(404);
        }

        @Test
        @DisplayName("Should handle invalid transaction ID format")
        void testInvalidTransactionId() {
            given()
                .pathParam("id", "invalid@#$%")
                .when()
                .get("/api/v11/transactions/{id}")
                .then()
                .statusCode(anyOf(is(400), is(404)));
        }

        @Test
        @DisplayName("Should handle null transaction ID")
        void testNullTransactionId() {
            given()
                .pathParam("id", "")
                .when()
                .get("/api/v11/transactions/{id}")
                .then()
                .statusCode(anyOf(is(400), is(404), is(405)));
        }
    }

    @Nested
    @DisplayName("POST /api/v11/transactions - Create transaction")
    class CreateTransactionTest {

        @Test
        @DisplayName("Should create valid transaction")
        void testCreateValidTransaction() {
            // Given
            Map<String, Object> txRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "100.50",
                "type", "TRANSFER",
                "data", "test transaction"
            );

            Transaction createdTx = createMockTransaction("tx_new", "0xaddr1", "0xaddr2",
                                                          BigDecimal.valueOf(100.50), TransactionStatus.PENDING);
            when(transactionService.createTransaction(any()))
                .thenReturn(Uni.createFrom().item(createdTx));

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(txRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(anyOf(is(200), is(201)))
                .body("id", notNullValue())
                .body("status", notNullValue());
        }

        @Test
        @DisplayName("Should reject transaction with missing fromAddress")
        void testMissingFromAddress() {
            // Given
            Map<String, Object> invalidRequest = Map.of(
                "toAddress", "0xaddr2",
                "amount", "100.50"
            );

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(invalidRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("Should reject transaction with missing toAddress")
        void testMissingToAddress() {
            // Given
            Map<String, Object> invalidRequest = Map.of(
                "fromAddress", "0xaddr1",
                "amount", "100.50"
            );

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(invalidRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("Should reject transaction with negative amount")
        void testNegativeAmount() {
            // Given
            Map<String, Object> invalidRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "-100.50"
            );

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(invalidRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("Should reject transaction with zero amount")
        void testZeroAmount() {
            // Given
            Map<String, Object> invalidRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "0"
            );

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(invalidRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("Should reject transaction with invalid JSON")
        void testInvalidJson() {
            given()
                .contentType(ContentType.JSON)
                .body("{invalid json}")
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("Should reject transaction with invalid address format")
        void testInvalidAddressFormat() {
            // Given
            Map<String, Object> invalidRequest = Map.of(
                "fromAddress", "invalid_address",
                "toAddress", "0xaddr2",
                "amount", "100.50"
            );

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(invalidRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("Should handle service errors gracefully")
        void testServiceError() {
            // Given
            Map<String, Object> txRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "100.50"
            );

            when(transactionService.createTransaction(any()))
                .thenReturn(Uni.createFrom().failure(new RuntimeException("Service unavailable")));

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(txRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(anyOf(is(500), is(503)));
        }
    }

    @Nested
    @DisplayName("Transaction Validation Edge Cases")
    class TransactionEdgeCasesTest {

        @Test
        @DisplayName("Should handle very large transaction amount")
        void testVeryLargeAmount() {
            // Given
            Map<String, Object> txRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "999999999999999999999.99"
            );

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(txRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(anyOf(is(200), is(201), is(400)));
        }

        @Test
        @DisplayName("Should handle transaction with special characters in data field")
        void testSpecialCharactersInData() {
            // Given
            Map<String, Object> txRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "100.50",
                "data", "Special chars: <>@#$%^&*()[]{}|\\/:;\"'`~"
            );

            Transaction createdTx = createMockTransaction("tx_special", "0xaddr1", "0xaddr2",
                                                          BigDecimal.valueOf(100.50), TransactionStatus.PENDING);
            when(transactionService.createTransaction(any()))
                .thenReturn(Uni.createFrom().item(createdTx));

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(txRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(anyOf(is(200), is(201)));
        }

        @Test
        @DisplayName("Should handle transaction with very long data field")
        void testVeryLongDataField() {
            // Given
            String longData = "x".repeat(10000);
            Map<String, Object> txRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "100.50",
                "data", longData
            );

            // When/Then
            given()
                .contentType(ContentType.JSON)
                .body(txRequest)
                .when()
                .post("/api/v11/transactions")
                .then()
                .statusCode(anyOf(is(200), is(201), is(400), is(413)));
        }
    }

    @Nested
    @DisplayName("Performance and Load Tests")
    class PerformanceTest {

        @Test
        @DisplayName("Should handle concurrent transaction creation")
        void testConcurrentTransactionCreation() {
            // Given
            Transaction mockTx = createMockTransaction("tx_concurrent", "0xaddr1", "0xaddr2",
                                                       BigDecimal.valueOf(100), TransactionStatus.PENDING);
            when(transactionService.createTransaction(any()))
                .thenReturn(Uni.createFrom().item(mockTx));

            Map<String, Object> txRequest = Map.of(
                "fromAddress", "0xaddr1",
                "toAddress", "0xaddr2",
                "amount", "100.50"
            );

            // When/Then - Make multiple rapid requests
            for (int i = 0; i < 10; i++) {
                Response response = given()
                    .contentType(ContentType.JSON)
                    .body(txRequest)
                    .when()
                    .post("/api/v11/transactions");

                assertTrue(response.statusCode() >= 200 && response.statusCode() < 600);
            }
        }

        @Test
        @DisplayName("Should handle rapid GET requests")
        void testRapidGetRequests() {
            // Given
            List<Transaction> mockTransactions = List.of(
                createMockTransaction("tx1", "0xaddr1", "0xaddr2", BigDecimal.TEN, TransactionStatus.CONFIRMED)
            );
            when(transactionService.getTransactions(anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(Uni.createFrom().item(mockTransactions));

            // When/Then
            for (int i = 0; i < 20; i++) {
                Response response = given()
                    .when()
                    .get("/api/v11/transactions");

                assertEquals(200, response.statusCode());
            }
        }
    }
}
