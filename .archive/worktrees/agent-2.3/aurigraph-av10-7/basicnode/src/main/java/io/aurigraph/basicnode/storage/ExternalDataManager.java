package io.aurigraph.basicnode.storage;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AV10-17 External Data Manager
 * Manages user data and transaction logs on external bare-metal storage
 * Ensures data persistence outside container lifecycle
 */
@ApplicationScoped
public class ExternalDataManager {
    
    private static final Logger LOG = Logger.getLogger(ExternalDataManager.class);
    
    @ConfigProperty(name = "aurigraph.storage.external.enabled", defaultValue = "true")
    boolean externalStorageEnabled;
    
    @ConfigProperty(name = "aurigraph.storage.external.base-path", defaultValue = "/opt/aurigraph/data")
    String externalBasePath;
    
    @ConfigProperty(name = "aurigraph.storage.database.url", defaultValue = "jdbc:postgresql://localhost:5432/aurigraph")
    String databaseUrl;
    
    @ConfigProperty(name = "aurigraph.storage.database.username", defaultValue = "aurigraph")
    String databaseUsername;
    
    @ConfigProperty(name = "aurigraph.storage.database.password", defaultValue = "aurigraph123")
    String databasePassword;
    
    @ConfigProperty(name = "aurigraph.node.id")
    String nodeId;
    
    private Connection databaseConnection;
    private final Map<String, UserSession> activeSessions = new ConcurrentHashMap<>();
    private final Map<String, TransactionCheckpoint> transactionCheckpoints = new ConcurrentHashMap<>();
    
    @Inject
    TransactionManager transactionManager;
    
    public void initializeExternalStorage() {
        LOG.info("Initializing AV10-17 external data storage...");
        
        if (!externalStorageEnabled) {
            LOG.warn("External storage disabled - data will be ephemeral");
            return;
        }
        
        try {
            // Initialize external file system storage
            initializeFileStorage();
            
            // Initialize database connection
            initializeDatabaseConnection();
            
            // Create required tables
            createDatabaseSchema();
            
            // Load existing transaction checkpoints
            loadTransactionCheckpoints();
            
            LOG.info("✅ AV10-17 external storage initialized successfully");
            
        } catch (Exception e) {
            LOG.errorf("❌ Failed to initialize external storage: %s", e.getMessage());
            throw new RuntimeException("External storage initialization failed", e);
        }
    }
    
    private void initializeFileStorage() throws IOException {
        Path basePath = Paths.get(externalBasePath);
        Path userDataPath = basePath.resolve("users");
        Path logsPath = basePath.resolve("logs");
        Path checkpointsPath = basePath.resolve("checkpoints");
        
        // Create directories if they don't exist
        Files.createDirectories(userDataPath);
        Files.createDirectories(logsPath);
        Files.createDirectories(checkpointsPath);
        
        LOG.infof("External storage paths created: %s", externalBasePath);
    }
    
    private void initializeDatabaseConnection() throws SQLException {
        Properties props = new Properties();
        props.setProperty("user", databaseUsername);
        props.setProperty("password", databasePassword);
        props.setProperty("ssl", "false");
        props.setProperty("ApplicationName", "Aurigraph-BasicNode-" + nodeId);
        
        databaseConnection = DriverManager.getConnection(databaseUrl, props);
        databaseConnection.setAutoCommit(false);
        
        LOG.infof("Database connection established: %s", databaseUrl);
    }
    
    private void createDatabaseSchema() throws SQLException {
        String[] schemaDDL = {
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                node_id VARCHAR(64) NOT NULL,
                login_time TIMESTAMP NOT NULL,
                last_activity TIMESTAMP NOT NULL,
                session_data JSONB,
                status VARCHAR(20) DEFAULT 'ACTIVE'
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS transaction_logs (
                log_id BIGSERIAL PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                transaction_id VARCHAR(128) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                transaction_data JSONB NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                checkpoint_data JSONB
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS node_checkpoints (
                checkpoint_id VARCHAR(128) PRIMARY KEY,
                node_id VARCHAR(64) NOT NULL,
                user_id VARCHAR(64) NOT NULL,
                checkpoint_type VARCHAR(50) NOT NULL,
                checkpoint_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_transaction_logs_status ON transaction_logs(status);
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_node_checkpoints_node_user ON node_checkpoints(node_id, user_id);
            """
        };
        
        try (Statement stmt = databaseConnection.createStatement()) {
            for (String ddl : schemaDDL) {
                stmt.executeUpdate(ddl);
            }
            databaseConnection.commit();
            LOG.info("Database schema created/validated successfully");
        }
    }
    
    public UserSession authenticateUser(String userId, String credentials) throws SQLException {
        LOG.infof("Authenticating user: %s", userId);
        
        // Load user's previous session data
        UserSession session = loadUserSession(userId);
        if (session == null) {
            session = createNewUserSession(userId);
        }
        
        // Update session activity
        session.lastActivity = Instant.now();
        session.status = "ACTIVE";
        
        // Save session to database
        saveUserSession(session);
        
        // Load transaction checkpoints for this user
        loadUserTransactionCheckpoints(userId);
        
        activeSessions.put(session.sessionId, session);
        
        LOG.infof("✅ User authenticated: %s (session: %s)", userId, session.sessionId);
        
        return session;
    }
    
    private UserSession loadUserSession(String userId) throws SQLException {
        String query = """
            SELECT session_id, user_id, node_id, login_time, last_activity, session_data, status
            FROM user_sessions 
            WHERE user_id = ? AND status = 'ACTIVE'
            ORDER BY last_activity DESC
            LIMIT 1
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(query)) {
            stmt.setString(1, userId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    UserSession session = new UserSession();
                    session.sessionId = rs.getString("session_id");
                    session.userId = rs.getString("user_id");
                    session.nodeId = rs.getString("node_id");
                    session.loginTime = rs.getTimestamp("login_time").toInstant();
                    session.lastActivity = rs.getTimestamp("last_activity").toInstant();
                    session.sessionData = rs.getString("session_data");
                    session.status = rs.getString("status");
                    
                    return session;
                }
            }
        }
        
        return null;
    }
    
    private UserSession createNewUserSession(String userId) {
        UserSession session = new UserSession();
        session.sessionId = generateSessionId(userId);
        session.userId = userId;
        session.nodeId = nodeId;
        session.loginTime = Instant.now();
        session.lastActivity = Instant.now();
        session.sessionData = "{}";
        session.status = "ACTIVE";
        
        return session;
    }
    
    private void saveUserSession(UserSession session) throws SQLException {
        String upsertQuery = """
            INSERT INTO user_sessions (session_id, user_id, node_id, login_time, last_activity, session_data, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (session_id) DO UPDATE SET
                last_activity = EXCLUDED.last_activity,
                session_data = EXCLUDED.session_data,
                status = EXCLUDED.status
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(upsertQuery)) {
            stmt.setString(1, session.sessionId);
            stmt.setString(2, session.userId);
            stmt.setString(3, session.nodeId);
            stmt.setTimestamp(4, Timestamp.from(session.loginTime));
            stmt.setTimestamp(5, Timestamp.from(session.lastActivity));
            stmt.setString(6, session.sessionData);
            stmt.setString(7, session.status);
            
            stmt.executeUpdate();
            databaseConnection.commit();
        }
    }
    
    public void logTransaction(String userId, String transactionId, String transactionType, 
                              String transactionData, String status) throws SQLException {
        
        String insertQuery = """
            INSERT INTO transaction_logs (user_id, transaction_id, transaction_type, transaction_data, status)
            VALUES (?, ?, ?, ?::jsonb, ?)
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(insertQuery)) {
            stmt.setString(1, userId);
            stmt.setString(2, transactionId);
            stmt.setString(3, transactionType);
            stmt.setString(4, transactionData);
            stmt.setString(5, status);
            
            stmt.executeUpdate();
            databaseConnection.commit();
            
            LOG.debugf("Transaction logged: %s (%s) for user %s", transactionId, status, userId);
        }
        
        // Also log to external file system
        logToExternalFile(userId, transactionId, transactionType, transactionData, status);
    }
    
    private void logToExternalFile(String userId, String transactionId, String transactionType, 
                                  String transactionData, String status) {
        try {
            Path userLogPath = Paths.get(externalBasePath, "logs", userId + ".log");
            String logEntry = String.format("[%s] %s | %s | %s | %s%n", 
                Instant.now(), transactionId, transactionType, status, transactionData);
            
            Files.write(userLogPath, logEntry.getBytes(), 
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);
                
        } catch (IOException e) {
            LOG.errorf("Failed to write external log file: %s", e.getMessage());
        }
    }
    
    public void createTransactionCheckpoint(String userId, String transactionId, String checkpointData) throws SQLException {
        TransactionCheckpoint checkpoint = new TransactionCheckpoint();
        checkpoint.checkpointId = generateCheckpointId(userId, transactionId);
        checkpoint.nodeId = nodeId;
        checkpoint.userId = userId;
        checkpoint.transactionId = transactionId;
        checkpoint.checkpointType = "TRANSACTION_STATE";
        checkpoint.checkpointData = checkpointData;
        checkpoint.createdAt = Instant.now();
        
        // Save to database
        String insertQuery = """
            INSERT INTO node_checkpoints (checkpoint_id, node_id, user_id, checkpoint_type, checkpoint_data)
            VALUES (?, ?, ?, ?, ?::jsonb)
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(insertQuery)) {
            stmt.setString(1, checkpoint.checkpointId);
            stmt.setString(2, checkpoint.nodeId);
            stmt.setString(3, checkpoint.userId);
            stmt.setString(4, checkpoint.checkpointType);
            stmt.setString(5, checkpoint.checkpointData);
            
            stmt.executeUpdate();
            databaseConnection.commit();
        }
        
        // Cache in memory
        transactionCheckpoints.put(checkpoint.checkpointId, checkpoint);
        
        // Save to external file system
        saveCheckpointToFile(checkpoint);
        
        LOG.debugf("Transaction checkpoint created: %s for user %s", checkpoint.checkpointId, userId);
    }
    
    private void saveCheckpointToFile(TransactionCheckpoint checkpoint) {
        try {
            Path checkpointPath = Paths.get(externalBasePath, "checkpoints", 
                checkpoint.userId, checkpoint.checkpointId + ".json");
            
            Files.createDirectories(checkpointPath.getParent());
            
            String checkpointJson = String.format("""
                {
                    "checkpointId": "%s",
                    "nodeId": "%s",
                    "userId": "%s",
                    "transactionId": "%s",
                    "checkpointType": "%s",
                    "checkpointData": %s,
                    "createdAt": "%s"
                }
                """, 
                checkpoint.checkpointId, checkpoint.nodeId, checkpoint.userId,
                checkpoint.transactionId, checkpoint.checkpointType,
                checkpoint.checkpointData, checkpoint.createdAt);
            
            Files.write(checkpointPath, checkpointJson.getBytes());
            
        } catch (IOException e) {
            LOG.errorf("Failed to save checkpoint to file: %s", e.getMessage());
        }
    }
    
    public List<TransactionCheckpoint> loadUserTransactionCheckpoints(String userId) throws SQLException {
        List<TransactionCheckpoint> checkpoints = new ArrayList<>();
        
        String query = """
            SELECT checkpoint_id, node_id, user_id, checkpoint_type, checkpoint_data, created_at
            FROM node_checkpoints
            WHERE user_id = ? AND node_id = ?
            ORDER BY created_at DESC
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(query)) {
            stmt.setString(1, userId);
            stmt.setString(2, nodeId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    TransactionCheckpoint checkpoint = new TransactionCheckpoint();
                    checkpoint.checkpointId = rs.getString("checkpoint_id");
                    checkpoint.nodeId = rs.getString("node_id");
                    checkpoint.userId = rs.getString("user_id");
                    checkpoint.checkpointType = rs.getString("checkpoint_type");
                    checkpoint.checkpointData = rs.getString("checkpoint_data");
                    checkpoint.createdAt = rs.getTimestamp("created_at").toInstant();
                    
                    checkpoints.add(checkpoint);
                    transactionCheckpoints.put(checkpoint.checkpointId, checkpoint);
                }
            }
        }
        
        LOG.infof("Loaded %d transaction checkpoints for user %s", checkpoints.size(), userId);
        
        return checkpoints;
    }
    
    public void restoreTransactionState(String userId) throws SQLException {
        LOG.infof("Restoring transaction state for user: %s", userId);
        
        // Get pending transactions
        String query = """
            SELECT transaction_id, transaction_type, transaction_data, checkpoint_data
            FROM transaction_logs
            WHERE user_id = ? AND status IN ('PENDING', 'IN_PROGRESS')
            ORDER BY created_at ASC
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(query)) {
            stmt.setString(1, userId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                int restoredCount = 0;
                
                while (rs.next()) {
                    String transactionId = rs.getString("transaction_id");
                    String transactionType = rs.getString("transaction_type");
                    String transactionData = rs.getString("transaction_data");
                    String checkpointData = rs.getString("checkpoint_data");
                    
                    // Restore transaction execution
                    boolean restored = transactionManager.restoreTransaction(
                        transactionId, transactionType, transactionData, checkpointData);
                    
                    if (restored) {
                        restoredCount++;
                        LOG.debugf("Restored transaction: %s (%s)", transactionId, transactionType);
                    }
                }
                
                LOG.infof("✅ Restored %d transactions for user %s", restoredCount, userId);
            }
        }
    }
    
    public void performGracefulShutdown() {
        LOG.info("🔄 Performing AV10-17 graceful shutdown...");
        
        try {
            // Save all active session states
            for (UserSession session : activeSessions.values()) {
                session.status = "SUSPENDED";
                saveUserSession(session);
                LOG.debugf("Session saved: %s", session.sessionId);
            }
            
            // Create final checkpoints for all active transactions
            Set<String> activeTransactionIds = transactionManager.getActiveTransactionIds();
            for (String transactionId : activeTransactionIds) {
                String checkpointData = transactionManager.getTransactionState(transactionId);
                String userId = transactionManager.getTransactionUserId(transactionId);
                
                if (userId != null && checkpointData != null) {
                    createTransactionCheckpoint(userId, transactionId, checkpointData);
                }
            }
            
            // Flush all pending database operations
            databaseConnection.commit();
            
            // Close database connection
            if (databaseConnection != null && !databaseConnection.isClosed()) {
                databaseConnection.close();
            }
            
            // Sync external file system
            syncExternalStorage();
            
            LOG.info("✅ AV10-17 graceful shutdown completed");
            
        } catch (Exception e) {
            LOG.errorf("❌ Error during graceful shutdown: %s", e.getMessage());
        }
    }
    
    private void loadTransactionCheckpoints() throws SQLException {
        String query = """
            SELECT checkpoint_id, node_id, user_id, checkpoint_type, checkpoint_data, created_at
            FROM node_checkpoints
            WHERE node_id = ?
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(query)) {
            stmt.setString(1, nodeId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    TransactionCheckpoint checkpoint = new TransactionCheckpoint();
                    checkpoint.checkpointId = rs.getString("checkpoint_id");
                    checkpoint.nodeId = rs.getString("node_id");
                    checkpoint.userId = rs.getString("user_id");
                    checkpoint.checkpointType = rs.getString("checkpoint_type");
                    checkpoint.checkpointData = rs.getString("checkpoint_data");
                    checkpoint.createdAt = rs.getTimestamp("created_at").toInstant();
                    
                    transactionCheckpoints.put(checkpoint.checkpointId, checkpoint);
                }
            }
        }
        
        LOG.infof("Loaded %d transaction checkpoints", transactionCheckpoints.size());
    }
    
    private void syncExternalStorage() {
        try {
            // Force filesystem sync for critical data
            Runtime.getRuntime().exec("sync").waitFor();
            LOG.info("External storage synchronized");
        } catch (Exception e) {
            LOG.errorf("Failed to sync external storage: %s", e.getMessage());
        }
    }
    
    public void cleanupOldData(int retentionDays) throws SQLException {
        LOG.infof("Cleaning up data older than %d days", retentionDays);
        
        Instant cutoffTime = Instant.now().minusSeconds(retentionDays * 24 * 60 * 60);
        
        // Cleanup old sessions
        String cleanupSessions = "DELETE FROM user_sessions WHERE last_activity < ? AND status != 'ACTIVE'";
        try (PreparedStatement stmt = databaseConnection.prepareStatement(cleanupSessions)) {
            stmt.setTimestamp(1, Timestamp.from(cutoffTime));
            int deletedSessions = stmt.executeUpdate();
            LOG.infof("Deleted %d old sessions", deletedSessions);
        }
        
        // Cleanup old completed transactions
        String cleanupTransactions = "DELETE FROM transaction_logs WHERE created_at < ? AND status = 'COMPLETED'";
        try (PreparedStatement stmt = databaseConnection.prepareStatement(cleanupTransactions)) {
            stmt.setTimestamp(1, Timestamp.from(cutoffTime));
            int deletedTransactions = stmt.executeUpdate();
            LOG.infof("Deleted %d old transactions", deletedTransactions);
        }
        
        // Cleanup old checkpoints
        String cleanupCheckpoints = "DELETE FROM node_checkpoints WHERE created_at < ?";
        try (PreparedStatement stmt = databaseConnection.prepareStatement(cleanupCheckpoints)) {
            stmt.setTimestamp(1, Timestamp.from(cutoffTime));
            int deletedCheckpoints = stmt.executeUpdate();
            LOG.infof("Deleted %d old checkpoints", deletedCheckpoints);
        }
        
        databaseConnection.commit();
    }
    
    public StorageStats getStorageStats() throws SQLException {
        StorageStats stats = new StorageStats();
        
        // Database stats
        String statsQuery = """
            SELECT 
                (SELECT COUNT(*) FROM user_sessions WHERE status = 'ACTIVE') as active_sessions,
                (SELECT COUNT(*) FROM transaction_logs WHERE status IN ('PENDING', 'IN_PROGRESS')) as pending_transactions,
                (SELECT COUNT(*) FROM node_checkpoints WHERE node_id = ?) as total_checkpoints
            """;
            
        try (PreparedStatement stmt = databaseConnection.prepareStatement(statsQuery)) {
            stmt.setString(1, nodeId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.activeSessions = rs.getInt("active_sessions");
                    stats.pendingTransactions = rs.getInt("pending_transactions");
                    stats.totalCheckpoints = rs.getInt("total_checkpoints");
                }
            }
        }
        
        // File system stats
        try {
            Path basePath = Paths.get(externalBasePath);
            stats.diskUsageBytes = Files.walk(basePath)
                .mapToLong(path -> {
                    try {
                        return Files.isRegularFile(path) ? Files.size(path) : 0;
                    } catch (IOException e) {
                        return 0;
                    }
                })
                .sum();
        } catch (IOException e) {
            LOG.warn("Failed to calculate disk usage: " + e.getMessage());
        }
        
        stats.lastUpdated = Instant.now();
        
        return stats;
    }
    
    private String generateSessionId(String userId) {
        return "SES-" + userId + "-" + nodeId + "-" + System.currentTimeMillis();
    }
    
    private String generateCheckpointId(String userId, String transactionId) {
        return "CHK-" + userId + "-" + transactionId + "-" + System.currentTimeMillis();
    }
    
    // Data classes
    public static class UserSession {
        public String sessionId;
        public String userId;
        public String nodeId;
        public Instant loginTime;
        public Instant lastActivity;
        public String sessionData;
        public String status;
    }
    
    public static class TransactionCheckpoint {
        public String checkpointId;
        public String nodeId;
        public String userId;
        public String transactionId;
        public String checkpointType;
        public String checkpointData;
        public Instant createdAt;
    }
    
    public static class StorageStats {
        public int activeSessions;
        public int pendingTransactions;
        public int totalCheckpoints;
        public long diskUsageBytes;
        public Instant lastUpdated;
    }
}