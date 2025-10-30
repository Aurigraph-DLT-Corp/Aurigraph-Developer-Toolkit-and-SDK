package io.aurigraph.v11.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for EnterpriseSettingsResource
 * Tests the /api/v11/enterprise/advanced-settings endpoint
 */
@QuarkusTest
@DisplayName("Enterprise Settings API Tests")
public class EnterpriseSettingsResourceTest {

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should return 200 with all settings")
    public void testGetAdvancedSettings_Success() {
        given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .body("systemConfiguration", notNullValue())
                .body("securitySettings", notNullValue())
                .body("performanceSettings", notNullValue())
                .body("featureFlags", notNullValue())
                .body("notificationSettings", notNullValue())
                .body("integrationSettings", notNullValue())
                .body("uiSettings", notNullValue())
                .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should have system configuration")
    public void testGetAdvancedSettings_SystemConfiguration() {
        Response response = given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .extract().response();

        Map<String, Object> systemConfig = response.path("systemConfiguration");
        assertNotNull(systemConfig.get("platformVersion"));
        assertNotNull(systemConfig.get("environment"));
        assertNotNull(systemConfig.get("logLevel"));
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should have security settings")
    public void testGetAdvancedSettings_SecuritySettings() {
        Response response = given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .extract().response();

        Map<String, Object> securitySettings = response.path("securitySettings");
        assertNotNull(securitySettings.get("authenticationMethod"));
        assertNotNull(securitySettings.get("sessionTimeout"));
        assertNotNull(securitySettings.get("mfaEnabled"));
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should have performance settings")
    public void testGetAdvancedSettings_PerformanceSettings() {
        Response response = given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .extract().response();

        Map<String, Object> perfSettings = response.path("performanceSettings");
        assertNotNull(perfSettings.get("targetTPS"));
        assertNotNull(perfSettings.get("cacheEnabled"));
        assertNotNull(perfSettings.get("autoScaling"));
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should have feature flags")
    public void testGetAdvancedSettings_FeatureFlags() {
        Response response = given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .extract().response();

        Map<String, Object> featureFlags = response.path("featureFlags");
        assertNotNull(featureFlags.get("aiOptimization"));
        assertNotNull(featureFlags.get("quantumCryptography"));
        assertNotNull(featureFlags.get("carbonTracking"));
    }

    @Test
    @DisplayName("PUT /api/v11/enterprise/advanced-settings - Should update settings")
    public void testUpdateAdvancedSettings_Success() {
        Map<String, Object> updateRequest = Map.of(
            "systemConfiguration", Map.of("logLevel", "WARN"),
            "featureFlags", Map.of("betaFeatures", true)
        );

        given()
            .contentType("application/json")
            .body(updateRequest)
            .when()
                .put("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("message", containsString("Settings updated"))
                .body("updatedCategories", hasSize(2));
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/settings/category/{category} - Should return specific category")
    public void testGetSettingsByCategory_Success() {
        given()
            .pathParam("category", "systemConfiguration")
            .when()
                .get("/api/v11/enterprise/settings/category/{category}")
            .then()
                .statusCode(200)
                .body("category", is("systemConfiguration"))
                .body("settings", notNullValue())
                .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/settings/category/{category} - Should return 404 for invalid category")
    public void testGetSettingsByCategory_NotFound() {
        given()
            .pathParam("category", "nonExistentCategory")
            .when()
                .get("/api/v11/enterprise/settings/category/{category}")
            .then()
                .statusCode(404)
                .body("error", is("Category not found"));
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should have notification settings")
    public void testGetAdvancedSettings_NotificationSettings() {
        Response response = given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .extract().response();

        Map<String, Object> notificationSettings = response.path("notificationSettings");
        assertNotNull(notificationSettings.get("emailEnabled"));
        assertNotNull(notificationSettings.get("alertThresholds"));
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should have integration settings")
    public void testGetAdvancedSettings_IntegrationSettings() {
        Response response = given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .extract().response();

        Map<String, Object> integrationSettings = response.path("integrationSettings");
        assertNotNull(integrationSettings.get("apiGateway"));
        assertNotNull(integrationSettings.get("webhooksEnabled"));
    }

    @Test
    @DisplayName("GET /api/v11/enterprise/advanced-settings - Should have UI settings")
    public void testGetAdvancedSettings_UISettings() {
        Response response = given()
            .when()
                .get("/api/v11/enterprise/advanced-settings")
            .then()
                .statusCode(200)
                .extract().response();

        Map<String, Object> uiSettings = response.path("uiSettings");
        assertNotNull(uiSettings.get("theme"));
        assertNotNull(uiSettings.get("primaryColor"));
        assertNotNull(uiSettings.get("refreshInterval"));
    }
}
