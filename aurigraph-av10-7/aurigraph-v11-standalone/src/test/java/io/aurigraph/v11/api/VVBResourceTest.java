package io.aurigraph.v11.api;

import io.aurigraph.v11.token.vvb.*;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * VVBResourceTest - 5 tests covering REST API endpoints
 */
@QuarkusTest
@DisplayName("VVB REST API Tests")
class VVBResourceTest {

    private UUID testVersionId;

    @BeforeEach
    void setUp() {
        testVersionId = UUID.randomUUID();
        RestAssured.basePath = "/api/v12/vvb";
    }

    @Test
    @DisplayName("Should submit validation request")
    void testSubmitValidationRequest() {
        VVBValidationRequest request = new VVBValidationRequest(
            "SECONDARY_TOKEN_CREATE",
            "Test token creation",
            null,
            "TEST_USER"
        );

        given()
            .contentType("application/json")
            .body(request)
            .when()
            .post("/validate")
            .then()
            .statusCode(202)
            .body("status", notNullValue())
            .body("versionId", notNullValue());
    }

    @Test
    @DisplayName("Should approve token version")
    void testApproveTokenVersion() {
        VVBResource.ApprovalRequestDto approvalRequest = new VVBResource.ApprovalRequestDto(
            "VVB_VALIDATOR_1",
            "Approval confirmed"
        );

        given()
            .contentType("application/json")
            .body(approvalRequest)
            .when()
            .post("/" + testVersionId + "/approve")
            .then()
            .statusCode(200)
            .body("status", notNullValue())
            .body("versionId", notNullValue());
    }

    @Test
    @DisplayName("Should reject token version")
    void testRejectTokenVersion() {
        VVBResource.RejectionRequestDto rejectionRequest = new VVBResource.RejectionRequestDto(
            "Compliance failure",
            "VVB_ADMIN_1"
        );

        given()
            .contentType("application/json")
            .body(rejectionRequest)
            .when()
            .post("/" + testVersionId + "/reject")
            .then()
            .statusCode(200)
            .body("status", notNullValue());
    }

    @Test
    @DisplayName("Should retrieve pending approvals")
    void testGetPendingApprovals() {
        given()
            .when()
            .get("/pending")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(0));
    }

    @Test
    @DisplayName("Should get validation statistics")
    void testGetValidationStatistics() {
        given()
            .when()
            .get("/statistics")
            .then()
            .statusCode(200)
            .body("totalDecisions", greaterThanOrEqualTo(0))
            .body("approvedCount", greaterThanOrEqualTo(0))
            .body("rejectedCount", greaterThanOrEqualTo(0));
    }
}
