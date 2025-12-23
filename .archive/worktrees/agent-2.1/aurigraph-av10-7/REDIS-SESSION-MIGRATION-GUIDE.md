# Redis Session Migration Guide
## Enable Multi-Node Session Binding (Phase 2)

**Purpose**: Migrate from in-memory ConcurrentHashMap sessions to Redis for multi-node horizontal scaling

**Timeline**: 2-3 hours implementation + testing

---

## Why Redis?

### Current Problem
```java
// SessionService.java - IN-MEMORY ONLY
private static final Map<String, SessionData> sessions = new ConcurrentHashMap<>();

// Node 1: User logs in -> creates session in Node 1's memory
// Node 2: User makes request -> session not found (different memory)
// Result: ❌ "Session expired" error
```

### With Redis
```
Node 1, Node 2, Node 3 → All read/write same Redis instance → ✅ Session works everywhere
```

---

## Step 1: Add Redis Dependency

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/pom.xml`

```xml
<!-- Add inside <dependencies> section -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-redis-client</artifactId>
    <version>3.26.2</version>
</dependency>
```

Run: `./mvnw clean compile`

---

## Step 2: Create RedisSessionService

**File**: `src/main/java/io/aurigraph/v11/session/RedisSessionService.java`

```java
package io.aurigraph.v11.session;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.string.StringCommands;
import io.quarkus.redis.datasource.hash.HashCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

/**
 * RedisSessionService - Session storage in Redis
 * Replaces ConcurrentHashMap for multi-node session binding
 */
@ApplicationScoped
public class RedisSessionService {

    private static final Logger LOG = Logger.getLogger(RedisSessionService.class);

    @Inject
    RedisDataSource redisDataSource;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String SESSION_PREFIX = "session:";
    private static final long SESSION_TIMEOUT_SECONDS = 480 * 60; // 8 hours

    /**
     * Create a new session and store in Redis
     */
    public String createSession(String username, Map<String, Object> userData) {
        try {
            String sessionId = UUID.randomUUID().toString();
            String key = SESSION_PREFIX + sessionId;

            // Create session data
            Map<String, String> sessionData = new HashMap<>();
            sessionData.put("username", username);
            sessionData.put("userData", objectMapper.writeValueAsString(userData));
            sessionData.put("createdAt", String.valueOf(System.currentTimeMillis()));
            sessionData.put("lastAccessedAt", String.valueOf(System.currentTimeMillis()));

            // Store in Redis with 8-hour expiration
            StringCommands<String> stringCommands = redisDataSource.string(String.class);
            stringCommands.setex(key, SESSION_TIMEOUT_SECONDS,
                                 objectMapper.writeValueAsString(sessionData));

            LOG.infof("✅ Session created: %s (user: %s)", sessionId, username);
            return sessionId;
        } catch (Exception e) {
            LOG.errorf(e, "❌ Failed to create session for user %s", username);
            throw new RuntimeException("Session creation failed", e);
        }
    }

    /**
     * Retrieve session from Redis
     */
    public SessionData getSession(String sessionId) {
        try {
            String key = SESSION_PREFIX + sessionId;
            StringCommands<String> stringCommands = redisDataSource.string(String.class);
            String sessionJson = stringCommands.get(key);

            if (sessionJson == null) {
                LOG.debugf("⚠️ Session not found or expired: %s", sessionId);
                return null;
            }

            // Update last accessed time (extend TTL)
            stringCommands.expire(key, SESSION_TIMEOUT_SECONDS);

            // Parse and return
            Map<String, String> sessionMap = objectMapper.readValue(sessionJson,
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});

            return new SessionData(
                sessionId,
                sessionMap.get("username"),
                objectMapper.readValue(sessionMap.get("userData"), Map.class),
                Long.parseLong(sessionMap.get("createdAt")),
                Long.parseLong(sessionMap.get("lastAccessedAt"))
            );
        } catch (Exception e) {
            LOG.debugf(e, "Failed to retrieve session: %s", sessionId);
            return null;
        }
    }

    /**
     * Invalidate (delete) session from Redis
     */
    public void invalidateSession(String sessionId) {
        try {
            String key = SESSION_PREFIX + sessionId;
            redisDataSource.key().del(key);
            LOG.infof("✅ Session invalidated: %s", sessionId);
        } catch (Exception e) {
            LOG.warnf(e, "Failed to invalidate session: %s", sessionId);
        }
    }

    /**
     * Check if session exists and is valid
     */
    public boolean sessionExists(String sessionId) {
        try {
            String key = SESSION_PREFIX + sessionId;
            return redisDataSource.key().exists(key) > 0;
        } catch (Exception e) {
            LOG.debugf(e, "Failed to check session existence: %s", sessionId);
            return false;
        }
    }

    /**
     * Cleanup expired sessions (runs periodically)
     * Note: Redis automatically deletes expired keys, but this can be called for cleanup
     */
    public void cleanupExpiredSessions() {
        // Redis handles this automatically with SETEX expiration
        LOG.debugf("✅ Expired sessions cleaned up by Redis (TTL-based expiration)");
    }

    // ==================== Session Data DTO ====================

    public static class SessionData {
        private String sessionId;
        private String username;
        private Map<String, Object> userData;
        private long createdAt;
        private long lastAccessedAt;

        public SessionData(String sessionId, String username, Map<String, Object> userData,
                          long createdAt, long lastAccessedAt) {
            this.sessionId = sessionId;
            this.username = username;
            this.userData = userData;
            this.createdAt = createdAt;
            this.lastAccessedAt = lastAccessedAt;
        }

        public String getSessionId() { return sessionId; }
        public String getUsername() { return username; }
        public Map<String, Object> getUserData() { return userData; }
        public long getCreatedAt() { return createdAt; }
        public long getLastAccessedAt() { return lastAccessedAt; }
    }
}
```

---

## Step 3: Update SessionService to Use Redis

**File**: `src/main/java/io/aurigraph/v11/session/SessionService.java`

```java
package io.aurigraph.v11.session;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * SessionService - Delegates to Redis-backed sessions
 */
@ApplicationScoped
public class SessionService {

    private static final Logger LOG = Logger.getLogger(SessionService.class);

    @Inject
    RedisSessionService redisSessionService;

    /**
     * Create session (delegates to Redis)
     */
    public String createSession(String username, java.util.Map<String, Object> userData) {
        return redisSessionService.createSession(username, userData);
    }

    /**
     * Get session (delegates to Redis)
     */
    public SessionData getSession(String sessionId) {
        return redisSessionService.getSession(sessionId);
    }

    /**
     * Invalidate session (delegates to Redis)
     */
    public void invalidateSession(String sessionId) {
        redisSessionService.invalidateSession(sessionId);
    }

    /**
     * Check session exists (delegates to Redis)
     */
    public boolean sessionExists(String sessionId) {
        return redisSessionService.sessionExists(sessionId);
    }

    // DTO - pass through
    public static class SessionData {
        private String sessionId;
        private String username;
        private java.util.Map<String, Object> userData;

        public SessionData(String sessionId, String username, java.util.Map<String, Object> userData) {
            this.sessionId = sessionId;
            this.username = username;
            this.userData = userData;
        }

        public String getSessionId() { return sessionId; }
        public String getUsername() { return username; }
        public java.util.Map<String, Object> getUserData() { return userData; }
    }
}
```

---

## Step 4: Configure Redis in application.properties

**File**: `src/main/resources/application.properties`

```properties
# Redis Configuration
quarkus.redis.client-name=aurigraph-cache
quarkus.redis.hosts=redis://localhost:6379
quarkus.redis.timeout=5s
quarkus.redis.max-pool-waiting=12

# Optional: Redis auth (if password required)
# quarkus.redis.password=yourpassword

# Connection pooling
quarkus.redis.client-type=standalone
```

For development (localhost):
```bash
# Docker: Start Redis
docker run -d -p 6379:6379 redis:latest

# Or: Install locally (macOS)
brew install redis
redis-server
```

---

## Step 5: Update LoginResource to Use Redis

**File**: `src/main/java/io/aurigraph/v11/auth/LoginResource.java`

The LoginResource already injects SessionService, so it will automatically use Redis-backed sessions. No changes needed!

```java
@Inject
SessionService sessionService;  // Now uses Redis internally
```

---

## Step 6: Testing

### Test 1: Single Node Session
```bash
# Terminal 1: Start API server
./mvnw quarkus:dev

# Terminal 2: Test session creation
curl -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password"}'
# Response: {"sessionId":"abc-123", "success":true}

# Verify in Redis
redis-cli
> KEYS "session:*"
1) "session:abc-123"
> TTL "session:abc-123"
(integer) 28800  # 8 hours

# Test session retrieval
curl -b "session_id=abc-123" http://localhost:9003/api/v11/login/verify
# Response: {"username":"testuser", ...}
```

### Test 2: Multi-Node Session Binding
```bash
# Step 1: Start Node 1 (port 9003)
./mvnw quarkus:dev

# Step 2: Login on Node 1
curl -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password"}'
# Response: {"sessionId":"session-xyz"}

# Step 3: Start Node 2 (port 9004) in another terminal
QUARKUS_HTTP_PORT=9004 ./mvnw quarkus:dev

# Step 4: Use session from Node 1 on Node 2
curl -b "session_id=session-xyz" http://localhost:9004/api/v11/login/verify
# Response: ✅ {"username":"testuser", ...}
# BEFORE (in-memory): ❌ "Session expired"
# AFTER (Redis): ✅ Works!
```

### Test 3: Session Expiration
```bash
# Create session
curl -X POST http://localhost:9003/api/v11/login/authenticate ...
# Response: {"sessionId":"abc-123"}

# Wait 8 hours (or modify TTL for testing)

# Try to use expired session
curl -b "session_id=abc-123" http://localhost:9003/api/v11/login/verify
# Response: ❌ 401 Unauthorized (session expired)
```

---

## Step 7: Deployment

### Docker Compose Update

**File**: `deployment/docker-compose.yml`

```yaml
version: '3.8'
services:
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - aurigraph

  aurigraph-v11:
    build:
      context: ./aurigraph-av10-7/aurigraph-v11-standalone
    ports:
      - "9003:9003"
    environment:
      QUARKUS_REDIS_HOSTS: redis://redis:6379
    depends_on:
      - redis
    networks:
      - aurigraph

volumes:
  redis-data:

networks:
  aurigraph:
```

Deploy:
```bash
docker-compose up -d
```

---

## Monitoring

### Check Redis Sessions
```bash
# Connect to Redis
redis-cli

# View all active sessions
KEYS "session:*"

# Check specific session
GET "session:abc-123"

# Count sessions
DBSIZE

# Monitor session creation/deletion
MONITOR
```

### Redis Performance
```bash
# Check memory usage
INFO memory

# Check operations per second
INFO stats

# Test latency
redis-benchmark -t get -q
```

---

## Rollback Plan

If Redis migration causes issues:

1. **Immediate**: Restart API servers (sessions lost but service continues)
2. **Short-term**: Revert to in-memory SessionService:
   ```java
   // Comment out Redis injection
   // @Inject RedisSessionService redisSessionService;

   // Re-implement ConcurrentHashMap version
   private static final Map<String, SessionData> sessions = new ConcurrentHashMap<>();
   ```
3. **Git rollback**: `git revert <commit-hash>`

---

## Performance Expectations

| Metric | In-Memory | Redis | Difference |
|--------|-----------|-------|-----------|
| Create Session | < 0.1ms | 1-2ms | +1.9ms |
| Get Session | < 0.05ms | 0.5-1ms | +0.95ms |
| Delete Session | < 0.05ms | 0.5-1ms | +0.95ms |
| Memory per Session | ~1KB | ~0.5KB (Redis) | -50% |
| Multi-node | ❌ No | ✅ Yes | ∞ better |

**Result**: Negligible performance impact, unlimited scalability

---

## Validation Checklist

- [ ] Redis dependency added to pom.xml
- [ ] RedisSessionService created
- [ ] SessionService updated to delegate to Redis
- [ ] Redis configured in application.properties
- [ ] Docker Compose updated with Redis service
- [ ] Local Redis running (docker or brew)
- [ ] Code compiles: `./mvnw clean compile`
- [ ] Tests pass: `./mvnw test`
- [ ] Single-node session test works
- [ ] Multi-node session test works
- [ ] Session expiration works (after 8 hours)
- [ ] Redis memory usage acceptable
- [ ] Monitoring setup verified

---

## Next Steps After Redis Migration

1. **Token Caching** (OPTIONAL): Cache valid tokens in Redis with 5-min TTL
2. **Rate Limiting** (IMPORTANT): Limit login attempts with Redis counters
3. **Session Limits** (OPTIONAL): Limit concurrent sessions per user
4. **Audit Trail** (OPTIONAL): Log all session creation/destruction

---

## Support

If Redis migration fails:
1. Check Redis is running: `redis-cli ping` → should return `PONG`
2. Check config: `grep redis application.properties`
3. Check logs: `./mvnw quarkus:dev` should show Redis connection
4. Verify Maven dependency: `./mvnw dependency:tree | grep redis`

---

**Estimated Time**: 2-3 hours
**Complexity**: Low
**Risk**: Low (rollback to in-memory is simple)
**Impact**: Enables multi-node scaling (unlimited TPS improvement)
