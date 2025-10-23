package io.aurigraph.v11.user;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.greaterThan;

/**
 * UserResourceTest - Integration tests for User Management API
 *
 * Tests all CRUD operations for user management endpoints.
 * Uses RestAssured for HTTP testing with Quarkus test framework.
 *
 * @author Backend Development Agent (BDA)
 * @since V11.3.1
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class UserResourceTest {

    private static String createdUserId;
    private static String adminRoleId;

    @BeforeAll
    public static void setup() {
        // Get ADMIN role ID for tests
        // Note: This is loaded on first test run, not in @BeforeAll
        // to avoid timing issues with Quarkus test startup
    }

    @Test
    @Order(1)
    @DisplayName("Should create a new user")
    public void testCreateUser() {
        // Get ADMIN role ID on first test
        if (adminRoleId == null) {
            adminRoleId = given()
                .when()
                .get("/api/v11/roles")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getString("find { it.name == 'ADMIN' }.id");
        }

        String requestBody = """
            {
                "username": "testuser",
                "email": "testuser@aurigraph.io",
                "password": "Test@1234",
                "roleName": "USER"
            }
            """;

        createdUserId = given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/api/v11/users")
            .then()
            .statusCode(201)
            .body("username", equalTo("testuser"))
            .body("email", equalTo("testuser@aurigraph.io"))
            .body("roleName", equalTo("USER"))
            .body("status", equalTo("ACTIVE"))
            .body("id", notNullValue())
            .extract()
            .jsonPath()
            .getString("id");
    }

    @Test
    @Order(2)
    @DisplayName("Should not create user with duplicate username")
    public void testCreateUserDuplicateUsername() {
        String requestBody = """
            {
                "username": "testuser",
                "email": "different@aurigraph.io",
                "password": "Test@1234",
                "roleName": "USER"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/api/v11/users")
            .then()
            .statusCode(400)
            .body("message", containsString("Username already exists"));
    }

    @Test
    @Order(3)
    @DisplayName("Should not create user with weak password")
    public void testCreateUserWeakPassword() {
        String requestBody = """
            {
                "username": "weakpassuser",
                "email": "weakpass@aurigraph.io",
                "password": "weak",
                "roleName": "USER"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .post("/api/v11/users")
            .then()
            .statusCode(400)
            .body("message", containsString("Password must"));
    }

    @Test
    @Order(4)
    @DisplayName("Should get user by ID")
    public void testGetUser() {
        given()
            .when()
            .get("/api/v11/users/" + createdUserId)
            .then()
            .statusCode(200)
            .body("id", equalTo(createdUserId))
            .body("username", equalTo("testuser"))
            .body("email", equalTo("testuser@aurigraph.io"));
    }

    @Test
    @Order(5)
    @DisplayName("Should list users with pagination")
    public void testListUsers() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 10)
            .when()
            .get("/api/v11/users")
            .then()
            .statusCode(200)
            .body("data", notNullValue())
            .body("page", equalTo(0))
            .body("size", equalTo(10))
            .body("totalCount", greaterThan(0));
    }

    @Test
    @Order(6)
    @DisplayName("Should update user email")
    public void testUpdateUser() {
        String requestBody = """
            {
                "email": "updated@aurigraph.io",
                "roleName": "USER"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .put("/api/v11/users/" + createdUserId)
            .then()
            .statusCode(200)
            .body("email", equalTo("updated@aurigraph.io"))
            .body("username", equalTo("testuser"));
    }

    @Test
    @Order(7)
    @DisplayName("Should update user role")
    public void testUpdateUserRole() {
        String requestBody = """
            {
                "roleName": "DEVOPS"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .put("/api/v11/users/" + createdUserId + "/role")
            .then()
            .statusCode(200)
            .body("roleName", equalTo("DEVOPS"));
    }

    @Test
    @Order(8)
    @DisplayName("Should update user status")
    public void testUpdateUserStatus() {
        String requestBody = """
            {
                "status": "INACTIVE"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .put("/api/v11/users/" + createdUserId + "/status")
            .then()
            .statusCode(200)
            .body("status", equalTo("INACTIVE"));
    }

    @Test
    @Order(9)
    @DisplayName("Should update user password")
    public void testUpdatePassword() {
        String requestBody = """
            {
                "newPassword": "NewPass@5678"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when()
            .put("/api/v11/users/" + createdUserId + "/password")
            .then()
            .statusCode(200)
            .body("message", containsString("Password updated"));
    }

    @Test
    @Order(10)
    @DisplayName("Should authenticate user successfully")
    public void testAuthenticateUser() {
        // First, set user back to ACTIVE
        String statusUpdate = """
            {
                "status": "ACTIVE"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(statusUpdate)
            .when()
            .put("/api/v11/users/" + createdUserId + "/status")
            .then()
            .statusCode(200);

        // Now authenticate with new password
        String authRequest = """
            {
                "username": "testuser",
                "password": "NewPass@5678"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(authRequest)
            .when()
            .post("/api/v11/users/authenticate")
            .then()
            .statusCode(200)
            .body("username", equalTo("testuser"))
            .body("lastLoginAt", notNullValue());
    }

    @Test
    @Order(11)
    @DisplayName("Should not authenticate with wrong password")
    public void testAuthenticateUserWrongPassword() {
        String authRequest = """
            {
                "username": "testuser",
                "password": "WrongPass@1234"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(authRequest)
            .when()
            .post("/api/v11/users/authenticate")
            .then()
            .statusCode(401)
            .body("message", containsString("Invalid username or password"));
    }

    @Test
    @Order(12)
    @DisplayName("Should return 404 for non-existent user")
    public void testGetNonExistentUser() {
        given()
            .when()
            .get("/api/v11/users/00000000-0000-0000-0000-000000000000")
            .then()
            .statusCode(404)
            .body("message", containsString("User not found"));
    }

    @Test
    @Order(13)
    @DisplayName("Should return 400 for invalid user ID format")
    public void testGetUserInvalidIdFormat() {
        given()
            .when()
            .get("/api/v11/users/invalid-id")
            .then()
            .statusCode(400)
            .body("message", containsString("Invalid user ID format"));
    }

    @Test
    @Order(14)
    @DisplayName("Should delete user")
    public void testDeleteUser() {
        given()
            .when()
            .delete("/api/v11/users/" + createdUserId)
            .then()
            .statusCode(204);

        // Verify user is deleted
        given()
            .when()
            .get("/api/v11/users/" + createdUserId)
            .then()
            .statusCode(404);
    }
}
