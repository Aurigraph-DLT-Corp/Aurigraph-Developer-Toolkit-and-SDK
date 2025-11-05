package io.aurigraph.v11.session;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.*;

/**
 * SessionService: Manages user sessions with persistent session tokens
 * Replaces JWT-based approach with stateful session management
 */
@ApplicationScoped
public class SessionService {
    private static final Logger LOG = Logger.getLogger(SessionService.class);

    private final ConcurrentHashMap<String, SessionData> sessions = new ConcurrentHashMap<>();
    private static final long SESSION_TIMEOUT_MINUTES = 480; // 8 hours
    private static final long SESSION_CLEANUP_INTERVAL_MS = 60000; // 1 minute

    public SessionService() {
        // Cleanup thread
        new Thread(this::cleanupExpiredSessions, "SessionCleanupThread").start();
    }

    public String createSession(String username, Map<String, Object> userData) {
        String sessionId = UUID.randomUUID().toString();
        SessionData data = new SessionData(sessionId, username, userData);
        sessions.put(sessionId, data);
        LOG.infof("Session created: %s for user %s", sessionId, username);
        return sessionId;
    }

    public SessionData getSession(String sessionId) {
        SessionData data = sessions.get(sessionId);
        if (data != null && !data.isExpired()) {
            data.updateLastAccessed();
            return data;
        }
        if (data != null) {
            sessions.remove(sessionId);
        }
        return null;
    }

    public void invalidateSession(String sessionId) {
        sessions.remove(sessionId);
        LOG.infof("Session invalidated: %s", sessionId);
    }

    private void cleanupExpiredSessions() {
        while (true) {
            try {
                Thread.sleep(SESSION_CLEANUP_INTERVAL_MS);
                long now = System.currentTimeMillis();
                sessions.entrySet().removeIf(entry ->
                    (now - entry.getValue().getLastAccessedTime()) >
                    TimeUnit.MINUTES.toMillis(SESSION_TIMEOUT_MINUTES)
                );
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    public static class SessionData {
        private final String sessionId;
        private final String username;
        private final Map<String, Object> userData;
        private long lastAccessedTime;
        private final long createdTime;

        public SessionData(String sessionId, String username, Map<String, Object> userData) {
            this.sessionId = sessionId;
            this.username = username;
            this.userData = new HashMap<>(userData);
            this.createdTime = System.currentTimeMillis();
            this.lastAccessedTime = createdTime;
        }

        public void updateLastAccessed() {
            this.lastAccessedTime = System.currentTimeMillis();
        }

        public boolean isExpired() {
            return (System.currentTimeMillis() - lastAccessedTime) >
                   TimeUnit.MINUTES.toMillis(SESSION_TIMEOUT_MINUTES);
        }

        public String getSessionId() { return sessionId; }
        public String getUsername() { return username; }
        public Map<String, Object> getUserData() { return new HashMap<>(userData); }
        public long getLastAccessedTime() { return lastAccessedTime; }
    }
}
