package io.aurigraph.v11.user;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

/**
 * RoleResourceTest - Integration tests for Role Management API
 *
 * Tests all CRUD operations for role management endpoints.
 * Uses RestAssured for HTTP testing with Quarkus test framework.
 *
 * @author Backend Development Agent (BDA)
 * @since V11.3.1
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RoleResourceTest {

    private static String createdRoleId;

    @Test
    @Order(1)
    @DisplayName("Should list all roles")
    public void testListAllRoles() {
        given()
            .when()
            .get("/api/v11/roles")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(5)) // At least 5 default roles
            .body("find { it.name == 'ADMIN' }", notNullValue())
            .body("find { it.name == 'USER' }", notNullValue())
            .body("find { it.name == 'DEVOPS' }", notNullValue());
    }

    @Test
    @Order(2)
    @DisplayName("Should list system roles only")
    public void testListSystemRoles() {
        given()
            .queryParam("type", "system")
            .when()
            .get("/api/v11/roles")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(5))
            .body("[0].isSystemRole", equalTo(true));
    }

    @Test
    @Order(3)
    @DisplayName("Should create a new custom role")
    public void testCreateRole() {
        String requestBody = """
            {
                "name": "CUSTOM_ROLE",
                "description": "Custom role for testing",
                "permissions": "{\\"transactions\\":[\\"read\\",\\"write\\"],\\"users\\":[\\"read\\"]}"
            }
            """;

        createdRoleId = given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/api/v11/roles")
            .then()
            .statusCode(201)
            .body("name", equalTo("CUSTOM_ROLE"))
            .body("description", equalTo("Custom role for testing"))
            .body("isSystemRole", equalTo(false))
            .body("userCount", equalTo(0))
            .body("id", notNullValue())
            .extract()
            .jsonPath()
            .getString("id");
    }

    @Test
    @Order(4)
    @DisplayName("Should not create role with duplicate name")
    public void testCreateRoleDuplicateName() {
        String requestBody = """
            {
                "name": "CUSTOM_ROLE",
                "description": "Duplicate role",
                "permissions": "{\\"test\\":[\\"read\\"]}"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/api/v11/roles")
            .then()
            .statusCode(400)
            .body("message", containsString("Role already exists"));
    }

    @Test
    @Order(5)
    @DisplayName("Should not create role with invalid name format")
    public void testCreateRoleInvalidName() {
        String requestBody = """
            {
                "name": "invalid-role-name",
                "description": "Invalid name format",
                "permissions": "{\\"test\\":[\\"read\\"]}"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/api/v11/roles")
            .then()
            .statusCode(400)
            .body("message", containsString("Role name must"));
    }

    @Test
    @Order(6)
    @DisplayName("Should not create role with invalid permissions JSON")
    public void testCreateRoleInvalidPermissions() {
        String requestBody = """
            {
                "name": "INVALID_PERMS",
                "description": "Invalid permissions",
                "permissions": "not-valid-json"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/api/v11/roles")
            .then()
            .statusCode(400)
            .body("message", containsString("valid JSON"));
    }

    @Test
    @Order(7)
    @DisplayName("Should get role by ID")
    public void testGetRole() {
        given()
            .when()
            .get("/api/v11/roles/" + createdRoleId)
            .then()
            .statusCode(200)
            .body("id", equalTo(createdRoleId))
            .body("name", equalTo("CUSTOM_ROLE"))
            .body("description", equalTo("Custom role for testing"));
    }

    @Test
    @Order(8)
    @DisplayName("Should update custom role")
    public void testUpdateRole() {
        String requestBody = """
            {
                "description": "Updated description",
                "permissions": "{\\"transactions\\":[\\"read\\"],\\"contracts\\":[\\"read\\",\\"write\\"]}"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .put("/api/v11/roles/" + createdRoleId)
            .then()
            .statusCode(200)
            .body("description", equalTo("Updated description"))
            .body("permissions", containsString("contracts"));
    }

    @Test
    @Order(9)
    @DisplayName("Should not update system role")
    public void testUpdateSystemRole() {
        // Get ADMIN role ID
        String adminRoleId = given()
            .when()
            .get("/api/v11/roles")
            .then()
            .extract()
            .jsonPath()
            .getString("find { it.name == 'ADMIN' }.id");

        String requestBody = """
            {
                "description": "Trying to update system role",
                "permissions": "{\\"test\\":[\\"read\\"]}"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .put("/api/v11/roles/" + adminRoleId)
            .then()
            .statusCode(400)
            .body("message", containsString("Cannot modify system role"));
    }

    @Test
    @Order(10)
    @DisplayName("Should get role permissions")
    public void testGetRolePermissions() {
        given()
            .when()
            .get("/api/v11/roles/" + createdRoleId + "/permissions")
            .then()
            .statusCode(200)
            .body("permissions", notNullValue())
            .body("permissions", containsString("transactions"));
    }

    @Test
    @Order(11)
    @DisplayName("Should check role permission")
    public void testCheckPermission() {
        given()
            .queryParam("resource", "transactions")
            .queryParam("action", "read")
            .when()
            .get("/api/v11/roles/" + createdRoleId + "/permissions/check")
            .then()
            .statusCode(200)
            .body("roleId", equalTo(createdRoleId))
            .body("resource", equalTo("transactions"))
            .body("action", equalTo("read"))
            .body("hasPermission", equalTo(true));
    }

    @Test
    @Order(12)
    @DisplayName("Should return false for non-existent permission")
    public void testCheckPermissionNotGranted() {
        given()
            .queryParam("resource", "admin")
            .queryParam("action", "delete")
            .when()
            .get("/api/v11/roles/" + createdRoleId + "/permissions/check")
            .then()
            .statusCode(200)
            .body("hasPermission", equalTo(false));
    }

    @Test
    @Order(13)
    @DisplayName("Should get role statistics")
    public void testGetRoleStatistics() {
        given()
            .when()
            .get("/api/v11/roles/" + createdRoleId + "/statistics")
            .then()
            .statusCode(200)
            .body("id", equalTo(createdRoleId))
            .body("name", equalTo("CUSTOM_ROLE"))
            .body("userCount", equalTo(0))
            .body("isSystemRole", equalTo(false));
    }

    @Test
    @Order(14)
    @DisplayName("Should list custom roles only")
    public void testListCustomRoles() {
        given()
            .queryParam("type", "custom")
            .when()
            .get("/api/v11/roles")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1))
            .body("find { it.name == 'CUSTOM_ROLE' }", notNullValue());
    }

    @Test
    @Order(15)
    @DisplayName("Should return 404 for non-existent role")
    public void testGetNonExistentRole() {
        given()
            .when()
            .get("/api/v11/roles/00000000-0000-0000-0000-000000000000")
            .then()
            .statusCode(404)
            .body("message", containsString("Role not found"));
    }

    @Test
    @Order(16)
    @DisplayName("Should return 400 for invalid role ID format")
    public void testGetRoleInvalidIdFormat() {
        given()
            .when()
            .get("/api/v11/roles/invalid-id")
            .then()
            .statusCode(400)
            .body("message", containsString("Invalid role ID format"));
    }

    @Test
    @Order(17)
    @DisplayName("Should delete custom role")
    public void testDeleteRole() {
        given()
            .when()
            .delete("/api/v11/roles/" + createdRoleId)
            .then()
            .statusCode(204);

        // Verify role is deleted
        given()
            .when()
            .get("/api/v11/roles/" + createdRoleId)
            .then()
            .statusCode(404);
    }

    @Test
    @Order(18)
    @DisplayName("Should not delete system role")
    public void testDeleteSystemRole() {
        // Get USER role ID
        String userRoleId = given()
            .when()
            .get("/api/v11/roles")
            .then()
            .extract()
            .jsonPath()
            .getString("find { it.name == 'USER' }.id");

        given()
            .when()
            .delete("/api/v11/roles/" + userRoleId)
            .then()
            .statusCode(400)
            .body("message", containsString("Cannot delete system role"));
    }

    @Test
    @Order(19)
    @DisplayName("Should return 400 when checking permission without parameters")
    public void testCheckPermissionMissingParams() {
        given()
            .when()
            .get("/api/v11/roles/" + createdRoleId + "/permissions/check")
            .then()
            .statusCode(400)
            .body("message", containsString("Resource and action query parameters are required"));
    }
}
