# Security Best Practices - Aurigraph V11
## Development Guidelines and Security Checklist

**Version**: 1.0
**Last Updated**: November 25, 2025
**Applies To**: All Aurigraph V11 development teams

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Cryptography](#2-cryptography)
3. [Input Validation](#3-input-validation)
4. [API Security](#4-api-security)
5. [WebSocket Security](#5-websocket-security)
6. [Database Security](#6-database-security)
7. [Session Management](#7-session-management)
8. [Logging & Monitoring](#8-logging--monitoring)
9. [Dependency Management](#9-dependency-management)
10. [Code Review Checklist](#10-code-review-checklist)

---

## 1. Authentication & Authorization

### 1.1 JWT Authentication

**DO**:
```java
// ✅ Use JwtService for token generation
@Inject
JwtService jwtService;

String token = jwtService.generateToken(userId, email, 24 * 60); // 24 hours
```

**DON'T**:
```java
// ❌ Never use placeholder tokens in production
String token = "access_" + UUID.randomUUID().toString();
```

### 1.2 Password Hashing

**DO**:
```java
// ✅ Use BCrypt with proper salt
String hashedPassword = BcryptUtil.bcryptHash(plainPassword);

boolean matches = BcryptUtil.matches(plainPassword, hashedPassword);
```

**DON'T**:
```java
// ❌ Never use weak hashing algorithms
String hash = DigestUtils.md5Hex(password); // INSECURE!
String hash = DigestUtils.sha1Hex(password); // INSECURE!
```

### 1.3 Token Storage

**DO**:
```java
// ✅ Store tokens in database with metadata
authTokenService.storeToken(
    userId,
    email,
    token,
    AuthToken.TokenType.ACCESS,
    expiresAt,
    clientIP,
    userAgent
);
```

**DON'T**:
```java
// ❌ Don't store tokens in cookies without HttpOnly/Secure
response.addCookie(new Cookie("token", jwtToken)); // INSECURE!
```

### 1.4 Authorization Checks

**DO**:
```java
// ✅ Check user permissions before sensitive operations
@RolesAllowed({"ADMIN", "VALIDATOR"})
@POST
@Path("/transfer")
public Response transfer(TransferRequest request) {
    // Sensitive operation
}
```

**DON'T**:
```java
// ❌ Don't skip authorization checks
@POST
@Path("/transfer")
public Response transfer(TransferRequest request) {
    // Missing authorization check!
}
```

---

## 2. Cryptography

### 2.1 Random Number Generation

**DO**:
```java
// ✅ Use SecureRandom for cryptographic operations
private final SecureRandom secureRandom = SecureRandom.getInstanceStrong();

byte[] salt = new byte[32];
secureRandom.nextBytes(salt);
```

**DON'T**:
```java
// ❌ Never use Random for security
Random random = new Random(); // INSECURE!
byte[] salt = new byte[32];
random.nextBytes(salt);
```

### 2.2 Encryption

**DO**:
```java
// ✅ Use AES-256-GCM with proper IV
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
byte[] iv = new byte[12];
secureRandom.nextBytes(iv);
GCMParameterSpec spec = new GCMParameterSpec(128, iv);
cipher.init(Cipher.ENCRYPT_MODE, key, spec);
```

**DON'T**:
```java
// ❌ Don't use ECB mode or weak algorithms
Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding"); // INSECURE!
Cipher cipher = Cipher.getInstance("DES"); // INSECURE!
```

### 2.3 Key Management

**DO**:
```java
// ✅ Use proper key derivation (Argon2id)
Argon2Parameters params = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
    .withMemoryAsKB(65536) // 64 MB
    .withIterations(4)
    .withParallelism(4)
    .withSalt(salt)
    .build();

Argon2BytesGenerator generator = new Argon2BytesGenerator();
generator.init(params);
```

**DON'T**:
```java
// ❌ Don't use weak key derivation
KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 1000, 256); // Too few iterations!
```

### 2.4 Signature Verification

**DO**:
```java
// ✅ Always verify signatures before processing
if (!signatureVerificationService.verifySignature(data, signature, publicKey)) {
    throw new SecurityException("Invalid signature");
}
// Process data
```

**DON'T**:
```java
// ❌ Don't skip signature verification
// Process data without verification - INSECURE!
```

---

## 3. Input Validation

### 3.1 Validate All Inputs

**DO**:
```java
// ✅ Validate input parameters
if (username == null || username.isBlank() || username.length() > 100) {
    return Response.status(Response.Status.BAD_REQUEST)
        .entity(new ErrorResponse("Invalid username"))
        .build();
}
```

**DON'T**:
```java
// ❌ Don't trust user input
String sql = "SELECT * FROM users WHERE username = '" + username + "'"; // SQL INJECTION!
```

### 3.2 Use Bean Validation

**DO**:
```java
// ✅ Use JSR-380 Bean Validation
public class LoginRequest {
    @NotNull
    @Size(min = 3, max = 50)
    private String username;

    @NotNull
    @Size(min = 8, max = 100)
    private String password;
}
```

**DON'T**:
```java
// ❌ Don't skip validation
public class LoginRequest {
    private String username; // No validation!
    private String password; // No validation!
}
```

### 3.3 Sanitize Output

**DO**:
```java
// ✅ Sanitize before displaying
String sanitized = StringEscapeUtils.escapeHtml4(userInput);
```

**DON'T**:
```java
// ❌ Don't display raw user input
return "<div>" + userInput + "</div>"; // XSS vulnerability!
```

### 3.4 Parameterized Queries

**DO**:
```java
// ✅ Use parameterized queries (JPA/Panache)
return find("username = ?1 AND status = ?2", username, status).list();
```

**DON'T**:
```java
// ❌ Never concatenate SQL queries
return entityManager.createQuery(
    "SELECT u FROM User u WHERE username = '" + username + "'" // SQL INJECTION!
).getResultList();
```

---

## 4. API Security

### 4.1 CORS Configuration

**DO**:
```properties
# ✅ Configure CORS with strict origins
quarkus.http.cors=true
quarkus.http.cors.origins=https://dlt.aurigraph.io,https://iam2.aurigraph.io
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.access-control-allow-credentials=true
```

**DON'T**:
```properties
# ❌ Never allow all origins
quarkus.http.cors.origins=* # INSECURE!
```

### 4.2 Rate Limiting

**DO**:
```java
// ✅ Implement rate limiting
@Priority(Priorities.AUTHENTICATION - 1)
public class RateLimitingFilter implements ContainerRequestFilter {

    private static final int MAX_REQUESTS_PER_HOUR = 1000;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if (!rateLimitBucket.allowRequest()) {
            requestContext.abortWith(Response.status(429).build());
        }
    }
}
```

**DON'T**:
```java
// ❌ Don't expose endpoints without rate limiting
@POST
@Path("/login")
public Response login(LoginRequest request) {
    // No rate limiting - vulnerable to brute force!
}
```

### 4.3 Security Headers

**DO**:
```properties
# ✅ Configure security headers
quarkus.http.header."X-Frame-Options".value=DENY
quarkus.http.header."X-Content-Type-Options".value=nosniff
quarkus.http.header."Content-Security-Policy".value=default-src 'self'
quarkus.http.header."Strict-Transport-Security".value=max-age=31536000
```

**DON'T**:
```properties
# ❌ Don't leave security headers unset
# (No configuration = vulnerable to XSS, clickjacking, etc.)
```

### 4.4 API Authentication

**DO**:
```java
// ✅ Require authentication for all endpoints
@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthenticationFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if (!isPublicEndpoint(path)) {
            String token = extractToken(requestContext);
            if (!jwtService.validateToken(token)) {
                requestContext.abortWith(Response.status(401).build());
            }
        }
    }
}
```

**DON'T**:
```java
// ❌ Don't expose sensitive endpoints without authentication
@GET
@Path("/users")
public List<User> getAllUsers() {
    // No authentication check - INSECURE!
}
```

---

## 5. WebSocket Security

### 5.1 WebSocket Authentication

**DO**:
```java
// ✅ Authenticate WebSocket connections
@ServerEndpoint(
    value = "/ws/transactions",
    configurator = AuthenticatedWebSocketConfigurator.class
)
public class TransactionWebSocket {

    @OnOpen
    public void onOpen(Session session) {
        String userId = (String) session.getUserProperties().get("userId");
        if (userId == null) {
            session.close(new CloseReason(UNAUTHORIZED, "Authentication required"));
            return;
        }
    }
}
```

**DON'T**:
```java
// ❌ Don't allow unauthenticated WebSocket connections
@ServerEndpoint("/ws/transactions")
public class TransactionWebSocket {
    @OnOpen
    public void onOpen(Session session) {
        // No authentication check - INSECURE!
    }
}
```

### 5.2 Message Validation

**DO**:
```java
// ✅ Validate WebSocket messages
@OnMessage
public void onMessage(String message, Session session) {
    if (!messageValidator.validateMessage(session.getId(), message)) {
        session.close(new CloseReason(POLICY_VIOLATION, "Invalid message"));
        return;
    }
    // Process message
}
```

**DON'T**:
```java
// ❌ Don't process unvalidated messages
@OnMessage
public void onMessage(String message, Session session) {
    // No validation - vulnerable to DoS!
    JsonObject json = Json.createReader(new StringReader(message)).readObject();
}
```

### 5.3 Connection Limits

**DO**:
```java
// ✅ Limit connections per IP
if (!connectionManager.allowConnection(clientIP, sessionId)) {
    session.close(new CloseReason(TOO_MANY_CONNECTIONS, "Connection limit exceeded"));
    return;
}
```

**DON'T**:
```java
// ❌ Don't allow unlimited connections
@OnOpen
public void onOpen(Session session) {
    // No connection limit - vulnerable to DoS!
}
```

---

## 6. Database Security

### 6.1 SQL Injection Prevention

**DO**:
```java
// ✅ Use Panache parameterized queries
return User.find("username = ?1 AND status = ?2", username, status).list();

// ✅ Use JPA Criteria API
CriteriaBuilder cb = entityManager.getCriteriaBuilder();
CriteriaQuery<User> query = cb.createQuery(User.class);
Root<User> user = query.from(User.class);
query.where(cb.equal(user.get("username"), username));
```

**DON'T**:
```java
// ❌ Never use string concatenation
String sql = "SELECT * FROM users WHERE username = '" + username + "'"; // SQL INJECTION!
entityManager.createNativeQuery(sql).getResultList();
```

### 6.2 Transaction Management

**DO**:
```java
// ✅ Use @Transactional for data operations
@Transactional
public void createTransaction(Transaction tx) {
    tx.persist();
    auditLog.persist();
    // Automatically rolled back on exception
}
```

**DON'T**:
```java
// ❌ Don't forget transaction boundaries
public void createTransaction(Transaction tx) {
    tx.persist(); // No transaction - data inconsistency risk!
}
```

### 6.3 Sensitive Data Encryption

**DO**:
```java
// ✅ Encrypt sensitive data at rest
@Entity
public class User {
    @Column(name = "password_hash")
    private String passwordHash; // Already hashed with BCrypt

    @Column(name = "ssn")
    @Convert(converter = EncryptedStringConverter.class)
    private String ssn; // Encrypted in database
}
```

**DON'T**:
```java
// ❌ Don't store sensitive data in plaintext
@Column(name = "credit_card")
private String creditCard; // INSECURE!
```

---

## 7. Session Management

### 7.1 Secure Cookies

**DO**:
```java
// ✅ Use secure cookie attributes
response.addHeader("Set-Cookie", String.format(
    "session_id=%s; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800",
    sessionId
));
```

**DON'T**:
```java
// ❌ Don't use insecure cookies
Cookie cookie = new Cookie("session_id", sessionId);
response.addCookie(cookie); // No HttpOnly, Secure, SameSite!
```

### 7.2 Session Validation

**DO**:
```java
// ✅ Validate session with IP check
public boolean validateSession(String sessionId, String clientIP) {
    SessionData session = getSession(sessionId);
    if (session == null) return false;

    SessionMetadata metadata = SessionMetadata.findBySessionId(sessionId);
    if (metadata != null && !metadata.getClientIP().equals(clientIP)) {
        LOG.warn("Session IP mismatch - possible hijacking");
        invalidateSession(sessionId);
        return false;
    }
    return true;
}
```

**DON'T**:
```java
// ❌ Don't skip IP validation
public boolean validateSession(String sessionId) {
    return getSession(sessionId) != null; // No IP check!
}
```

### 7.3 Session Timeout

**DO**:
```properties
# ✅ Configure session timeout
quarkus.http.auth.session.timeout=8H
quarkus.http.auth.session.cookie-path=/
quarkus.http.auth.session.cookie-http-only=true
```

**DON'T**:
```properties
# ❌ Don't use long session timeouts
quarkus.http.auth.session.timeout=90D # Too long!
```

---

## 8. Logging & Monitoring

### 8.1 Security Event Logging

**DO**:
```java
// ✅ Log all security events
securityAuditService.logSecurityEvent(
    "AUTHENTICATION_SUCCESS",
    String.format("User %s logged in from IP %s", username, clientIP)
);

securityAuditService.logSecurityViolation(
    "RATE_LIMIT_EXCEEDED",
    clientIP,
    String.format("Exceeded %d attempts", maxAttempts)
);
```

**DON'T**:
```java
// ❌ Don't log sensitive data
LOG.info("User logged in with password: " + password); // INSECURE!
LOG.info("Processing credit card: " + creditCard); // INSECURE!
```

### 8.2 Error Handling

**DO**:
```java
// ✅ Return generic error messages to users
catch (Exception e) {
    LOG.error("Authentication failed", e); // Log details
    return Response.status(401)
        .entity(new ErrorResponse("Invalid credentials")) // Generic message
        .build();
}
```

**DON'T**:
```java
// ❌ Don't expose stack traces to users
catch (Exception e) {
    return Response.status(500)
        .entity(e.getMessage()) // Exposes internal details!
        .build();
}
```

### 8.3 Audit Trail

**DO**:
```java
// ✅ Maintain comprehensive audit trail
@Entity
public class AuditLog {
    private String userId;
    private String action;
    private String resourceType;
    private String resourceId;
    private String clientIP;
    private Instant timestamp;
    private String result;
}
```

**DON'T**:
```java
// ❌ Don't skip audit logging
public void deleteUser(String userId) {
    User.deleteById(userId); // No audit trail!
}
```

---

## 9. Dependency Management

### 9.1 Keep Dependencies Updated

**DO**:
```bash
# ✅ Regularly update dependencies
./mvnw versions:display-dependency-updates
./mvnw versions:use-latest-releases
```

**DON'T**:
```xml
<!-- ❌ Don't use outdated dependencies -->
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk18on</artifactId>
    <version>1.68</version> <!-- Old version with known CVEs! -->
</dependency>
```

### 9.2 OWASP Dependency Check

**DO**:
```bash
# ✅ Run OWASP scan regularly
./mvnw org.owasp:dependency-check-maven:check
```

**DON'T**:
```bash
# ❌ Don't deploy without security scanning
mvn package # No security check!
```

### 9.3 Dependency Exclusions

**DO**:
```xml
<!-- ✅ Exclude vulnerable transitive dependencies -->
<dependency>
    <groupId>some.library</groupId>
    <artifactId>library</artifactId>
    <version>1.0.0</version>
    <exclusions>
        <exclusion>
            <groupId>old.vulnerable</groupId>
            <artifactId>library</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

**DON'T**:
```xml
<!-- ❌ Don't ignore transitive vulnerabilities -->
<dependency>
    <groupId>some.library</groupId>
    <artifactId>library</artifactId>
    <version>1.0.0</version>
    <!-- No exclusions - vulnerable transitive dependencies! -->
</dependency>
```

---

## 10. Code Review Checklist

### Security Checklist for Code Reviews

#### Authentication & Authorization
- [ ] All endpoints require authentication (except public endpoints)
- [ ] Authorization checks before sensitive operations
- [ ] JWT tokens properly validated
- [ ] Passwords hashed with BCrypt
- [ ] Tokens stored securely in database

#### Input Validation
- [ ] All user input validated
- [ ] Bean Validation annotations used
- [ ] Input length limits enforced
- [ ] Special characters sanitized
- [ ] SQL injection prevented (parameterized queries)

#### Cryptography
- [ ] SecureRandom used for random numbers
- [ ] AES-256-GCM used for encryption
- [ ] Proper IV/salt generation
- [ ] Signatures verified before processing
- [ ] Key derivation uses Argon2id

#### API Security
- [ ] CORS properly configured
- [ ] Security headers present
- [ ] Rate limiting implemented
- [ ] CSRF protection for state-changing operations
- [ ] API keys validated

#### WebSocket Security
- [ ] WebSocket connections authenticated
- [ ] Messages validated (size, rate, structure)
- [ ] Connection limits enforced
- [ ] Idle timeout configured

#### Session Management
- [ ] Cookies use HttpOnly, Secure, SameSite
- [ ] Session timeout configured
- [ ] IP validation on session use
- [ ] Session hijacking prevention

#### Database Security
- [ ] Parameterized queries used
- [ ] @Transactional on data operations
- [ ] Sensitive data encrypted at rest
- [ ] No hardcoded credentials

#### Logging & Monitoring
- [ ] Security events logged
- [ ] No sensitive data in logs
- [ ] Error messages generic to users
- [ ] Audit trail maintained

#### Dependencies
- [ ] All dependencies up-to-date
- [ ] OWASP scan passed
- [ ] No known CVEs in dependencies
- [ ] Transitive vulnerabilities excluded

#### Testing
- [ ] Security tests written
- [ ] Edge cases covered
- [ ] Penetration tests passed
- [ ] Test coverage 95%+

---

## Development Workflow

### 1. Before Writing Code

1. Review security requirements
2. Check similar implementations
3. Identify security-sensitive operations
4. Plan security controls

### 2. During Development

1. Follow security best practices
2. Use secure libraries and frameworks
3. Write security tests
4. Document security decisions

### 3. Before Committing

1. Run security linters
2. Check for hardcoded secrets
3. Verify test coverage
4. Run OWASP dependency check

### 4. Code Review

1. Use security checklist
2. Review by security team
3. Address all comments
4. Re-run security tests

### 5. Before Deployment

1. Full security audit
2. Penetration testing
3. Load testing with security checks
4. Final OWASP scan

---

## Security Resources

### Internal Documentation
- [Security Audit Report](SECURITY-AUDIT-REPORT.md)
- [Security Fixes](SECURITY-FIXES.md)
- [Crypto Implementation Guide](docs/crypto/quantum-crypto.md)
- [Authentication Guide](docs/auth/jwt-authentication.md)

### External References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### Training
- OWASP Security Training
- Secure Coding Bootcamp
- Cryptography Fundamentals
- Threat Modeling Workshop

---

## Security Contacts

**Security Team**:
- Email: security@aurigraph.io
- Slack: #security
- Emergency: security-incident@aurigraph.io

**Vulnerability Reporting**:
- Email: security-reports@aurigraph.io
- Bug Bounty: hackerone.com/aurigraph

---

**Document Version**: 1.0
**Last Updated**: November 25, 2025
**Next Review**: February 25, 2026 (90 days)

**Maintained By**: Security Audit Team
**Approved By**: Platform Architect, CTO
