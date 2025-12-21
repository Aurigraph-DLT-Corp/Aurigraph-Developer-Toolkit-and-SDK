package io.aurigraph.v11.portal;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import jakarta.websocket.Session;
import jakarta.websocket.RemoteEndpoint;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive tests for EnterprisePortalService
 * Sprint 1 - Test Coverage Enhancement (AV11-342)
 * Target: 33% -> 95% coverage
 *
 * Tests cover:
 * - WebSocket connection handling
 * - Dashboard metrics
 * - User management
 * - Configuration management
 * - Alert management
 * - Real-time broadcasting
 */
@DisplayName("EnterprisePortalService Tests")
class EnterprisePortalServiceTest {

    private EnterprisePortalService portalService;

    @BeforeEach
    void setUp() {
        portalService = new EnterprisePortalService();
    }

    @AfterEach
    void tearDown() {
        // Cleanup
    }

    // ============================================
    // DASHBOARD METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Dashboard Metrics Tests")
    class DashboardMetricsTests {

        @Test
        @DisplayName("DashboardMetrics should provide current TPS")
        void dashboardMetricsShouldProvideCurrentTps() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertTrue(metrics.getCurrentTPS() >= 0);
        }

        @Test
        @DisplayName("DashboardMetrics should provide total transactions")
        void dashboardMetricsShouldProvideTotalTransactions() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertTrue(metrics.getTotalTransactions() >= 0);
        }

        @Test
        @DisplayName("DashboardMetrics should provide active validators")
        void dashboardMetricsShouldProvideActiveValidators() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertEquals(10, metrics.getActiveValidators());
        }

        @Test
        @DisplayName("DashboardMetrics should provide chain height")
        void dashboardMetricsShouldProvideChainHeight() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertTrue(metrics.getChainHeight() >= 0);
        }

        @Test
        @DisplayName("DashboardMetrics should provide average block time")
        void dashboardMetricsShouldProvideAverageBlockTime() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertEquals(1.0, metrics.getAverageBlockTime());
        }

        @Test
        @DisplayName("DashboardMetrics should provide network health")
        void dashboardMetricsShouldProvideNetworkHealth() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertEquals("HEALTHY", metrics.getNetworkHealth());
        }

        @Test
        @DisplayName("DashboardMetrics should provide transactions last second")
        void dashboardMetricsShouldProvideTransactionsLastSecond() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertTrue(metrics.getTransactionsLastSecond() >= 0);
        }

        @Test
        @DisplayName("DashboardMetrics should provide memory usage")
        void dashboardMetricsShouldProvideMemoryUsage() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            double memoryUsage = metrics.getMemoryUsage();
            assertTrue(memoryUsage >= 0 && memoryUsage <= 100);
        }

        @Test
        @DisplayName("DashboardMetrics should provide CPU usage")
        void dashboardMetricsShouldProvideCpuUsage() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertEquals(45.0, metrics.getCPUUsage());
        }

        @Test
        @DisplayName("DashboardMetrics should provide transactions by hour")
        void dashboardMetricsShouldProvideTransactionsByHour() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertNotNull(metrics.getTransactionsByHour());
        }

        @Test
        @DisplayName("DashboardMetrics should provide TPS by hour")
        void dashboardMetricsShouldProvideTpsByHour() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertNotNull(metrics.getTPSByHour());
        }

        @Test
        @DisplayName("DashboardMetrics should provide top validators")
        void dashboardMetricsShouldProvideTopValidators() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertNotNull(metrics.getTopValidators());
        }

        @Test
        @DisplayName("DashboardMetrics should provide chain growth")
        void dashboardMetricsShouldProvideChainGrowth() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            assertNotNull(metrics.getChainGrowth());
        }

        @Test
        @DisplayName("DashboardMetrics should provide validator list")
        void dashboardMetricsShouldProvideValidatorList() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            var validators = metrics.getValidatorList();
            assertNotNull(validators);
            assertEquals(10, validators.size());
        }

        @Test
        @DisplayName("DashboardMetrics should provide recent transactions")
        void dashboardMetricsShouldProvideRecentTransactions() {
            EnterprisePortalService.DashboardMetrics metrics = new EnterprisePortalService.DashboardMetrics();
            var transactions = metrics.getRecentTransactions(10);
            assertNotNull(transactions);
        }
    }

    // ============================================
    // USER MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("User Management Tests")
    class UserManagementTests {

        @Test
        @DisplayName("UserManagement should initialize with default admin")
        void userManagementShouldInitializeWithDefaultAdmin() {
            EnterprisePortalService.UserManagement userMgmt = new EnterprisePortalService.UserManagement();
            var users = userMgmt.getAllUsers();

            assertNotNull(users);
            assertFalse(users.isEmpty());
        }

        @Test
        @DisplayName("UserManagement should get all users")
        void userManagementShouldGetAllUsers() {
            EnterprisePortalService.UserManagement userMgmt = new EnterprisePortalService.UserManagement();
            var users = userMgmt.getAllUsers();

            assertTrue(users.size() >= 1);
            assertTrue(users.stream().anyMatch(u -> u.username().equals("admin")));
        }

        @Test
        @DisplayName("UserManagement should authenticate existing user")
        void userManagementShouldAuthenticateExistingUser() {
            EnterprisePortalService.UserManagement userMgmt = new EnterprisePortalService.UserManagement();

            assertTrue(userMgmt.authenticate("admin", "password"));
        }

        @Test
        @DisplayName("UserManagement should not authenticate non-existent user")
        void userManagementShouldNotAuthenticateNonExistentUser() {
            EnterprisePortalService.UserManagement userMgmt = new EnterprisePortalService.UserManagement();

            assertFalse(userMgmt.authenticate("non-existent", "password"));
        }

        @Test
        @DisplayName("UserManagement should check admin permissions")
        void userManagementShouldCheckAdminPermissions() {
            EnterprisePortalService.UserManagement userMgmt = new EnterprisePortalService.UserManagement();

            assertTrue(userMgmt.hasPermission("admin", "any.permission"));
        }

        @Test
        @DisplayName("UserManagement should deny permissions for non-existent user")
        void userManagementShouldDenyPermissionsForNonExistentUser() {
            EnterprisePortalService.UserManagement userMgmt = new EnterprisePortalService.UserManagement();

            assertFalse(userMgmt.hasPermission("non-existent", "any.permission"));
        }
    }

    // ============================================
    // CONFIGURATION MANAGER TESTS
    // ============================================

    @Nested
    @DisplayName("Configuration Manager Tests")
    class ConfigurationManagerTests {

        @Test
        @DisplayName("ConfigurationManager should initialize with defaults")
        void configurationManagerShouldInitializeWithDefaults() {
            EnterprisePortalService.ConfigurationManager configMgr = new EnterprisePortalService.ConfigurationManager();

            assertEquals("2000000", configMgr.getConfig("max_tps"));
            assertEquals("1000", configMgr.getConfig("block_time"));
            assertEquals("5000", configMgr.getConfig("consensus_timeout"));
        }

        @Test
        @DisplayName("ConfigurationManager should update config")
        void configurationManagerShouldUpdateConfig() {
            EnterprisePortalService.ConfigurationManager configMgr = new EnterprisePortalService.ConfigurationManager();

            boolean result = configMgr.updateConfig("new_key", "new_value");

            assertTrue(result);
            assertEquals("new_value", configMgr.getConfig("new_key"));
        }

        @Test
        @DisplayName("ConfigurationManager should reject null key")
        void configurationManagerShouldRejectNullKey() {
            EnterprisePortalService.ConfigurationManager configMgr = new EnterprisePortalService.ConfigurationManager();

            boolean result = configMgr.updateConfig(null, "value");

            assertFalse(result);
        }

        @Test
        @DisplayName("ConfigurationManager should reject empty key")
        void configurationManagerShouldRejectEmptyKey() {
            EnterprisePortalService.ConfigurationManager configMgr = new EnterprisePortalService.ConfigurationManager();

            boolean result = configMgr.updateConfig("", "value");

            assertFalse(result);
        }

        @Test
        @DisplayName("ConfigurationManager should return null for non-existent key")
        void configurationManagerShouldReturnNullForNonExistentKey() {
            EnterprisePortalService.ConfigurationManager configMgr = new EnterprisePortalService.ConfigurationManager();

            assertNull(configMgr.getConfig("non_existent_key"));
        }

        @Test
        @DisplayName("ConfigurationManager should get all configurations")
        void configurationManagerShouldGetAllConfigurations() {
            EnterprisePortalService.ConfigurationManager configMgr = new EnterprisePortalService.ConfigurationManager();

            var allConfigs = configMgr.getAllConfigurations();

            assertNotNull(allConfigs);
            assertTrue(allConfigs.containsKey("max_tps"));
            assertTrue(allConfigs.containsKey("block_time"));
            assertTrue(allConfigs.containsKey("consensus_timeout"));
        }
    }

    // ============================================
    // ALERT MANAGER TESTS
    // ============================================

    @Nested
    @DisplayName("Alert Manager Tests")
    class AlertManagerTests {

        @Test
        @DisplayName("AlertManager should start with no alerts")
        void alertManagerShouldStartWithNoAlerts() {
            EnterprisePortalService.AlertManager alertMgr = new EnterprisePortalService.AlertManager();

            var alerts = alertMgr.getActiveAlerts();
            assertTrue(alerts.isEmpty());
        }

        @Test
        @DisplayName("AlertManager should add alert")
        void alertManagerShouldAddAlert() {
            EnterprisePortalService.AlertManager alertMgr = new EnterprisePortalService.AlertManager();

            alertMgr.addAlert(EnterprisePortalService.AlertLevel.WARNING, "Test alert");

            var alerts = alertMgr.getActiveAlerts();
            assertEquals(1, alerts.size());
        }

        @Test
        @DisplayName("AlertManager should add multiple alerts")
        void alertManagerShouldAddMultipleAlerts() {
            EnterprisePortalService.AlertManager alertMgr = new EnterprisePortalService.AlertManager();

            alertMgr.addAlert(EnterprisePortalService.AlertLevel.INFO, "Info alert");
            alertMgr.addAlert(EnterprisePortalService.AlertLevel.WARNING, "Warning alert");
            alertMgr.addAlert(EnterprisePortalService.AlertLevel.ERROR, "Error alert");
            alertMgr.addAlert(EnterprisePortalService.AlertLevel.CRITICAL, "Critical alert");

            var alerts = alertMgr.getActiveAlerts();
            assertEquals(4, alerts.size());
        }

        @Test
        @DisplayName("Alert should contain all fields")
        void alertShouldContainAllFields() {
            EnterprisePortalService.AlertManager alertMgr = new EnterprisePortalService.AlertManager();

            alertMgr.addAlert(EnterprisePortalService.AlertLevel.ERROR, "Test error message");

            var alerts = alertMgr.getActiveAlerts();
            var alert = alerts.get(0);

            assertNotNull(alert.id());
            assertEquals(EnterprisePortalService.AlertLevel.ERROR, alert.level());
            assertEquals("Test error message", alert.message());
            assertTrue(alert.timestamp() > 0);
        }
    }

    // ============================================
    // DATA CLASSES TESTS
    // ============================================

    @Nested
    @DisplayName("Data Classes Tests")
    class DataClassesTests {

        @Test
        @DisplayName("DashboardData should contain all fields")
        void dashboardDataShouldContainAllFields() {
            EnterprisePortalService.DashboardData data = new EnterprisePortalService.DashboardData(
                100.0, 1000L, 10, 500L, 1.0, "HEALTHY"
            );

            assertEquals(100.0, data.currentTPS());
            assertEquals(1000L, data.totalTransactions());
            assertEquals(10, data.activeValidators());
            assertEquals(500L, data.chainHeight());
            assertEquals(1.0, data.averageBlockTime());
            assertEquals("HEALTHY", data.networkHealth());
        }

        @Test
        @DisplayName("RealtimeMetrics should contain all fields")
        void realtimeMetricsShouldContainAllFields() {
            EnterprisePortalService.RealtimeMetrics metrics = new EnterprisePortalService.RealtimeMetrics(
                500.0, 50L, 60.0, 40.0, System.currentTimeMillis()
            );

            assertEquals(500.0, metrics.tps());
            assertEquals(50L, metrics.transactionsLastSecond());
            assertEquals(60.0, metrics.memoryUsage());
            assertEquals(40.0, metrics.cpuUsage());
            assertTrue(metrics.timestamp() > 0);
        }

        @Test
        @DisplayName("ValidatorInfo should contain all fields")
        void validatorInfoShouldContainAllFields() {
            EnterprisePortalService.ValidatorInfo validator = new EnterprisePortalService.ValidatorInfo(
                "validator-1", 1000000L, true, 100
            );

            assertEquals("validator-1", validator.validatorId());
            assertEquals(1000000L, validator.stakeAmount());
            assertTrue(validator.active());
            assertEquals(100, validator.blocksProduced());
        }

        @Test
        @DisplayName("TransactionInfo should contain all fields")
        void transactionInfoShouldContainAllFields() {
            EnterprisePortalService.TransactionInfo tx = new EnterprisePortalService.TransactionInfo(
                "0x123", "from-addr", "to-addr", 1000L, System.currentTimeMillis()
            );

            assertEquals("0x123", tx.txHash());
            assertEquals("from-addr", tx.from());
            assertEquals("to-addr", tx.to());
            assertEquals(1000L, tx.amount());
            assertTrue(tx.timestamp() > 0);
        }

        @Test
        @DisplayName("UserInfo should contain all fields")
        void userInfoShouldContainAllFields() {
            EnterprisePortalService.UserInfo user = new EnterprisePortalService.UserInfo(
                "testuser", "test@example.com", EnterprisePortalService.UserRole.ADMIN, true
            );

            assertEquals("testuser", user.username());
            assertEquals("test@example.com", user.email());
            assertEquals(EnterprisePortalService.UserRole.ADMIN, user.role());
            assertTrue(user.active());
        }

        @Test
        @DisplayName("PortalRequest should contain fields")
        void portalRequestShouldContainFields() {
            var params = java.util.Map.of("key", "value");
            EnterprisePortalService.PortalRequest request = new EnterprisePortalService.PortalRequest(
                "get_analytics", params
            );

            assertEquals("get_analytics", request.type());
            assertEquals(params, request.params());
        }

        @Test
        @DisplayName("PortalResponse should serialize to JSON")
        void portalResponseShouldSerializeToJson() {
            EnterprisePortalService.PortalResponse response = new EnterprisePortalService.PortalResponse(
                "test_type", "test_data"
            );

            String json = response.toJson();
            assertNotNull(json);
            assertTrue(json.contains("test_type"));
        }
    }

    // ============================================
    // ENUM TESTS
    // ============================================

    @Nested
    @DisplayName("Enum Tests")
    class EnumTests {

        @Test
        @DisplayName("UserRole enum should have all values")
        void userRoleEnumShouldHaveAllValues() {
            EnterprisePortalService.UserRole[] roles = EnterprisePortalService.UserRole.values();

            assertEquals(3, roles.length);
            assertTrue(java.util.Arrays.asList(roles).contains(EnterprisePortalService.UserRole.ADMIN));
            assertTrue(java.util.Arrays.asList(roles).contains(EnterprisePortalService.UserRole.OPERATOR));
            assertTrue(java.util.Arrays.asList(roles).contains(EnterprisePortalService.UserRole.VIEWER));
        }

        @Test
        @DisplayName("AlertLevel enum should have all values")
        void alertLevelEnumShouldHaveAllValues() {
            EnterprisePortalService.AlertLevel[] levels = EnterprisePortalService.AlertLevel.values();

            assertEquals(4, levels.length);
            assertTrue(java.util.Arrays.asList(levels).contains(EnterprisePortalService.AlertLevel.INFO));
            assertTrue(java.util.Arrays.asList(levels).contains(EnterprisePortalService.AlertLevel.WARNING));
            assertTrue(java.util.Arrays.asList(levels).contains(EnterprisePortalService.AlertLevel.ERROR));
            assertTrue(java.util.Arrays.asList(levels).contains(EnterprisePortalService.AlertLevel.CRITICAL));
        }
    }

    // ============================================
    // ANALYTICS DATA TESTS
    // ============================================

    @Nested
    @DisplayName("Analytics Data Tests")
    class AnalyticsDataTests {

        @Test
        @DisplayName("AnalyticsData should contain all fields")
        void analyticsDataShouldContainAllFields() {
            EnterprisePortalService.AnalyticsData analytics = new EnterprisePortalService.AnalyticsData(
                10000L,
                java.util.Map.of("hour1", 100L),
                java.util.Map.of("hour1", 50.0),
                java.util.List.of(),
                java.util.Map.of("day1", 1000L)
            );

            assertEquals(10000L, analytics.totalTransactions());
            assertNotNull(analytics.transactionsByHour());
            assertNotNull(analytics.tpsByHour());
            assertNotNull(analytics.topValidators());
            assertNotNull(analytics.chainGrowth());
        }
    }
}
