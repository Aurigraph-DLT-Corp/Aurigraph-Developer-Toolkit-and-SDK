# Aurigraph V11 Security Hardening Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-12
**Classification**: Internal - Security Sensitive
**Maintainer**: Security Operations Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [TLS/SSL Configuration](#tlsssl-configuration)
3. [Password Policies](#password-policies)
4. [Key Rotation Procedures](#key-rotation-procedures)
5. [Network Segmentation](#network-segmentation)
6. [Firewall Rules](#firewall-rules)
7. [Security Headers](#security-headers)
8. [Authentication & Authorization](#authentication--authorization)
9. [Quantum Cryptography Hardening](#quantum-cryptography-hardening)
10. [Database Security](#database-security)
11. [API Security](#api-security)
12. [Container Security](#container-security)
13. [Monitoring & Incident Response](#monitoring--incident-response)

---

## Executive Summary

This guide provides comprehensive security hardening procedures for Aurigraph V11, a high-performance blockchain platform targeting 2M+ TPS with quantum-resistant cryptography. The platform processes sensitive financial and real-world asset data, requiring enterprise-grade security controls.

### Security Posture Goals
- **Zero Trust Architecture**: Verify all requests, encrypt all traffic
- **Defense in Depth**: Multiple security layers from network to application
- **Quantum Resistance**: NIST Level 5 post-quantum cryptography
- **Compliance**: GDPR, SOC 2, PCI DSS ready
- **Audit Trail**: Immutable logging for all security events

### Threat Model
- **External Threats**: DDoS, API abuse, cryptographic attacks
- **Internal Threats**: Privilege escalation, data exfiltration
- **Blockchain-Specific**: 51% attacks, double-spending, MEV exploitation
- **Quantum Threats**: Future quantum computer attacks on classical crypto

---

## TLS/SSL Configuration

### 1. Certificate Management

#### Production Certificate Requirements
```yaml
Certificate Authority: Let's Encrypt or DigiCert
Certificate Type: ECC P-384 or RSA 4096-bit minimum
Validity Period: 90 days (auto-renewal)
Subject Alternative Names (SANs):
  - dlt.aurigraph.io
  - iam2.aurigraph.io
  - api.aurigraph.io
  - *.aurigraph.io (wildcard for subdomains)
```

#### Certificate Storage
```bash
# Production certificate paths
/etc/ssl/certs/aurigraph/
├── fullchain.pem          # Certificate + Intermediate CA chain
├── privkey.pem            # Private key (0400 permissions)
├── chain.pem              # Intermediate CA certificates
└── cert.pem               # Server certificate only

# Ownership and Permissions
sudo chown -R root:ssl-cert /etc/ssl/certs/aurigraph/
sudo chmod 750 /etc/ssl/certs/aurigraph/
sudo chmod 400 /etc/ssl/certs/aurigraph/privkey.pem
sudo chmod 644 /etc/ssl/certs/aurigraph/*.pem
```

#### Automated Certificate Renewal (Certbot)
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Request certificate
sudo certbot certonly --nginx \
  -d dlt.aurigraph.io \
  -d iam2.aurigraph.io \
  -d api.aurigraph.io \
  --agree-tos \
  --email security@aurigraph.io \
  --non-interactive

# Auto-renewal cron job (runs twice daily)
sudo crontab -e
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### 2. NGINX TLS Configuration (Reverse Proxy)

#### NGINX Configuration (`/etc/nginx/sites-available/aurigraph-v11`)
```nginx
# Aurigraph V11 HTTPS Configuration
# TLS 1.3 Only with Modern Cipher Suites

upstream v11_backend {
    least_conn;
    server localhost:9003 max_fails=3 fail_timeout=30s;
    server localhost:9004 backup;
    keepalive 256;
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;

    # ============ TLS 1.3 Configuration ============

    # TLS Protocol Versions (1.3 ONLY for maximum security)
    ssl_protocols TLSv1.3;

    # TLS 1.3 Cipher Suites (GCM mode for AEAD)
    ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256;
    ssl_prefer_server_ciphers off; # TLS 1.3 ignores this

    # SSL Certificates
    ssl_certificate /etc/ssl/certs/aurigraph/fullchain.pem;
    ssl_certificate_key /etc/ssl/certs/aurigraph/privkey.pem;
    ssl_trusted_certificate /etc/ssl/certs/aurigraph/chain.pem;

    # OCSP Stapling (certificate revocation check)
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # Session Cache and Timeout
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off; # Disable for forward secrecy

    # ============ Security Headers ============

    # HSTS (HTTP Strict Transport Security) - 2 years
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss://dlt.aurigraph.io; frame-ancestors 'none';" always;

    # XSS Protection
    add_header X-XSS-Protection "1; mode=block" always;

    # Clickjacking Protection
    add_header X-Frame-Options "DENY" always;

    # MIME Sniffing Protection
    add_header X-Content-Type-Options "nosniff" always;

    # Referrer Policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Feature Policy (Permissions Policy)
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;

    # Remove Server Header
    server_tokens off;
    more_clear_headers Server;

    # ============ CORS Configuration ============

    # Allow specific origins only
    set $cors_origin "";
    if ($http_origin ~* (https://dlt\.aurigraph\.io|https://dev4\.aurex\.in)) {
        set $cors_origin $http_origin;
    }

    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    add_header Access-Control-Max-Age 86400 always;

    # Preflight OPTIONS request
    if ($request_method = OPTIONS) {
        return 204;
    }

    # ============ Rate Limiting ============

    # Limit request rate (100 req/min per IP)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    # Limit concurrent connections (50 per IP)
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    limit_conn conn_limit 50;

    # ============ Reverse Proxy Configuration ============

    location /api/v11/ {
        proxy_pass http://v11_backend/api/v11/;

        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # HTTP/2 Backend Support
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer Settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Error Handling
        proxy_intercept_errors on;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
    }

    # WebSocket Support
    location /ws/ {
        proxy_pass http://v11_backend/ws/;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Health Check (bypass rate limiting)
    location /q/health {
        limit_req off;
        limit_conn off;
        proxy_pass http://v11_backend/q/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # Static Assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /var/www/aurigraph/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security.txt (RFC 9116)
    location /.well-known/security.txt {
        alias /var/www/aurigraph/security.txt;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # ============ Logging ============

    access_log /var/log/nginx/aurigraph-access.log combined;
    error_log /var/log/nginx/aurigraph-error.log warn;
}
```

#### NGINX Testing & Deployment
```bash
# Test configuration
sudo nginx -t

# Reload (graceful restart)
sudo systemctl reload nginx

# Verify TLS 1.3
curl -I -v --tlsv1.3 https://dlt.aurigraph.io/api/v11/health

# SSL Labs Test (external validation)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=dlt.aurigraph.io
```

### 3. Quarkus Application TLS Configuration

#### Internal Service TLS (Optional - for service-to-service)
```properties
# application.properties - Enable TLS for internal services (optional)

# HTTPS Configuration (if not using NGINX reverse proxy)
quarkus.http.ssl-port=9443
quarkus.http.ssl.certificate.key-store-file=certs/keystore.p12
quarkus.http.ssl.certificate.key-store-password=${KEYSTORE_PASSWORD}
quarkus.http.ssl.certificate.key-store-file-type=PKCS12
quarkus.http.ssl.protocols=TLSv1.3
quarkus.http.ssl.cipher-suites=TLS_AES_256_GCM_SHA384,TLS_CHACHA20_POLY1305_SHA256

# Redirect HTTP to HTTPS
quarkus.http.insecure-requests=redirect

# gRPC TLS (for inter-service communication)
quarkus.grpc.server.ssl.certificate=/etc/ssl/certs/aurigraph/cert.pem
quarkus.grpc.server.ssl.key=/etc/ssl/certs/aurigraph/privkey.pem
quarkus.grpc.server.ssl.trust-store=/etc/ssl/certs/aurigraph/ca-bundle.crt
quarkus.grpc.server.ssl.client-auth=REQUIRED
```

#### Generate Self-Signed Certificate (Development Only)
```bash
# Generate PKCS12 keystore (development)
keytool -genkeypair \
  -storepass aurigraph@2025 \
  -keyalg RSA \
  -keysize 4096 \
  -dname "CN=localhost, OU=Development, O=Aurigraph, L=San Francisco, ST=CA, C=US" \
  -alias aurigraph-dev \
  -keystore certs/keystore.p12 \
  -storetype PKCS12 \
  -validity 365

# Export certificate
keytool -exportcert \
  -keystore certs/keystore.p12 \
  -alias aurigraph-dev \
  -file certs/aurigraph-dev.crt \
  -storepass aurigraph@2025
```

### 4. TLS Validation Tools

#### SSL Configuration Testing Script
```bash
#!/bin/bash
# ssl-test.sh - Validate TLS configuration

echo "=== Aurigraph TLS Configuration Test ==="

DOMAIN="dlt.aurigraph.io"

# Test TLS 1.3 support
echo "Testing TLS 1.3..."
openssl s_client -connect $DOMAIN:443 -tls1_3 -brief < /dev/null

# Test cipher suites
echo "Testing cipher suites..."
nmap --script ssl-enum-ciphers -p 443 $DOMAIN

# Test certificate validity
echo "Testing certificate..."
echo | openssl s_client -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer

# Test OCSP stapling
echo "Testing OCSP stapling..."
echo | openssl s_client -connect $DOMAIN:443 -status 2>/dev/null | grep "OCSP Response Status"

# Test HSTS header
echo "Testing HSTS header..."
curl -I https://$DOMAIN | grep -i strict-transport-security

# Test HTTP/2 support
echo "Testing HTTP/2..."
curl -I --http2 https://$DOMAIN/api/v11/health

echo "=== Test Complete ==="
```

---

## Password Policies

### 1. User Password Requirements

#### Password Complexity Rules
```yaml
Minimum Length: 14 characters
Maximum Length: 128 characters
Character Requirements:
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 digit (0-9)
  - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

Prohibited:
  - Common passwords (top 10,000 leaked passwords)
  - Sequential characters (abc, 123, qwerty)
  - Repeated characters (aaa, 111)
  - Dictionary words
  - Username or email address
  - Previous 12 passwords

Expiration:
  - Admin accounts: 90 days
  - User accounts: 180 days
  - Service accounts: No expiration (key-based auth)

Lockout Policy:
  - Failed Attempts: 5 consecutive failures
  - Lockout Duration: 30 minutes
  - Account Unlock: Self-service after cooldown or admin intervention
```

#### Password Hashing (Argon2id)
```java
// PasswordHashingService.java
package io.aurigraph.v11.security;

import org.wildfly.security.password.Password;
import org.wildfly.security.password.PasswordFactory;
import org.wildfly.security.password.interfaces.BCryptPassword;
import org.wildfly.security.password.spec.EncryptablePasswordSpec;
import org.wildfly.security.password.spec.IteratedSaltedPasswordAlgorithmSpec;

import jakarta.enterprise.context.ApplicationScoped;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

@ApplicationScoped
public class PasswordHashingService {

    private static final String ALGORITHM = "bcrypt"; // Or Argon2id if available
    private static final int BCRYPT_COST = 12; // 2^12 iterations
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Hash password using BCrypt with cost factor 12
     * Production should use Argon2id (OWASP recommended)
     */
    public String hashPassword(String plainPassword) throws InvalidKeySpecException, NoSuchAlgorithmException {
        byte[] salt = generateSalt();

        PasswordFactory factory = PasswordFactory.getInstance(ALGORITHM);
        IteratedSaltedPasswordAlgorithmSpec spec = new IteratedSaltedPasswordAlgorithmSpec(BCRYPT_COST, salt);
        EncryptablePasswordSpec encryptableSpec = new EncryptablePasswordSpec(plainPassword.toCharArray(), spec);

        BCryptPassword password = (BCryptPassword) factory.generatePassword(encryptableSpec);

        return Base64.getEncoder().encodeToString(password.getHash());
    }

    /**
     * Verify password against stored hash
     */
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        try {
            PasswordFactory factory = PasswordFactory.getInstance(ALGORITHM);
            Password password = factory.translate(createPasswordFromHash(hashedPassword));
            return factory.verify(password, plainPassword.toCharArray());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Generate cryptographically secure salt (16 bytes)
     */
    private byte[] generateSalt() {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return salt;
    }

    /**
     * Check password strength (returns score 0-5)
     */
    public int checkPasswordStrength(String password) {
        int score = 0;

        if (password.length() >= 14) score++;
        if (password.length() >= 20) score++;
        if (password.matches(".*[A-Z].*")) score++;
        if (password.matches(".*[a-z].*")) score++;
        if (password.matches(".*\\d.*")) score++;
        if (password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?].*")) score++;

        // Deduct points for weak patterns
        if (password.matches(".*(?i)(password|admin|user|test).*")) score -= 2;
        if (password.matches(".*(.)\\1{2,}.*")) score--; // Repeated characters

        return Math.max(0, Math.min(5, score));
    }
}
```

### 2. Service Account & API Key Management

#### API Key Requirements
```yaml
Format: aurigraph_v11_prod_<random_32_chars>
Example: aurigraph_v11_prod_7x9k2m5p8n4q6r1t3w5y7a9c

Generation:
  - Algorithm: Cryptographically secure random (SecureRandom)
  - Length: 32 characters (alphanumeric)
  - Prefix: Environment identifier

Storage:
  - Hashed: SHA-256 + Salt before storage
  - Encrypted at Rest: AES-256-GCM
  - Transmission: HTTPS only (TLS 1.3)

Rotation:
  - Production: Every 90 days
  - Development: Every 180 days
  - Emergency: Immediate rotation if compromised

Revocation:
  - Invalidate immediately upon request
  - Grace period: None (instant)
  - Audit log: Record all revocations
```

#### API Key Generation Script
```java
// APIKeyService.java
package io.aurigraph.v11.security;

import jakarta.enterprise.context.ApplicationScoped;
import java.security.SecureRandom;
import java.util.Base64;

@ApplicationScoped
public class APIKeyService {

    private static final String KEY_PREFIX = "aurigraph_v11";
    private static final int KEY_LENGTH = 32;
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Generate new API key with environment prefix
     */
    public String generateAPIKey(String environment) {
        byte[] randomBytes = new byte[KEY_LENGTH];
        RANDOM.nextBytes(randomBytes);

        String randomPart = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(randomBytes)
            .substring(0, KEY_LENGTH);

        return String.format("%s_%s_%s", KEY_PREFIX, environment, randomPart);
    }

    /**
     * Hash API key for storage (SHA-256)
     */
    public String hashAPIKey(String apiKey) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(apiKey.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }

    /**
     * Verify API key against stored hash
     */
    public boolean verifyAPIKey(String providedKey, String storedHash) {
        try {
            String computedHash = hashAPIKey(providedKey);
            return MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8)
            );
        } catch (NoSuchAlgorithmException e) {
            return false;
        }
    }
}
```

### 3. Password Policy Enforcement (Keycloak)

#### Keycloak Password Policy Configuration
```bash
# Access Keycloak Admin Console: https://iam2.aurigraph.io/
# Realm: AWD
# Navigate to: Realm Settings → Login → Password Policy

# Recommended Policy (Add these rules):
- Length(14)                    # Minimum 14 characters
- Uppercase(1)                  # At least 1 uppercase
- Lowercase(1)                  # At least 1 lowercase
- Digits(1)                     # At least 1 digit
- Special Characters(1)         # At least 1 special character
- Not Username                  # Cannot contain username
- Not Email                     # Cannot contain email
- Password History(12)          # Cannot reuse last 12 passwords
- Regular Expression(^(?!.*(.)\1{2}).*$)  # No 3+ repeated characters
- Expire Password(90 days)      # Password expiration
- Hash Algorithm(pbkdf2-sha512) # Strong hashing
- Hash Iterations(210000)       # OWASP recommended iterations
```

---

## Key Rotation Procedures

### 1. TLS Certificate Rotation

#### Automated Rotation (Let's Encrypt)
```bash
#!/bin/bash
# cert-rotate.sh - Automated certificate rotation

DOMAIN="dlt.aurigraph.io"
EMAIL="security@aurigraph.io"
NGINX_SERVICE="nginx"

# Renew certificate
certbot renew --quiet --deploy-hook "systemctl reload $NGINX_SERVICE"

# Verify new certificate
NEW_CERT_DATE=$(echo | openssl s_client -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter)

# Send notification
echo "Certificate rotated for $DOMAIN: $NEW_CERT_DATE" | \
  mail -s "TLS Certificate Rotated" $EMAIL

# Audit log
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) - TLS Certificate Rotated: $DOMAIN" >> /var/log/aurigraph/security-audit.log
```

#### Manual Rotation (Emergency)
```bash
# 1. Generate new CSR
openssl req -new -newkey rsa:4096 -nodes \
  -keyout privkey.pem \
  -out csr.pem \
  -subj "/C=US/ST=CA/L=San Francisco/O=Aurigraph/CN=dlt.aurigraph.io"

# 2. Submit CSR to CA (DigiCert/Let's Encrypt)
# ...

# 3. Receive new certificate and install
sudo cp fullchain.pem /etc/ssl/certs/aurigraph/fullchain.pem.new
sudo cp privkey.pem /etc/ssl/certs/aurigraph/privkey.pem.new
sudo chmod 400 /etc/ssl/certs/aurigraph/privkey.pem.new

# 4. Test configuration
sudo nginx -t

# 5. Reload NGINX (zero downtime)
sudo systemctl reload nginx

# 6. Verify rotation
curl -I https://dlt.aurigraph.io/api/v11/health

# 7. Archive old certificate
sudo mv /etc/ssl/certs/aurigraph/fullchain.pem /var/backups/ssl/fullchain.pem.$(date +%Y%m%d)
sudo mv /etc/ssl/certs/aurigraph/privkey.pem /var/backups/ssl/privkey.pem.$(date +%Y%m%d)
```

### 2. Quantum Cryptography Key Rotation

#### CRYSTALS-Dilithium Key Rotation (Digital Signatures)
```java
// QuantumKeyRotationService.java
package io.aurigraph.v11.crypto;

import io.aurigraph.v11.crypto.QuantumCryptoService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class QuantumKeyRotationService {

    private static final Logger LOG = Logger.getLogger(QuantumKeyRotationService.class);
    private static final Duration ROTATION_INTERVAL = Duration.ofDays(90);

    @Inject
    QuantumCryptoService cryptoService;

    @Inject
    KeyStorageService keyStorage;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    /**
     * Initialize key rotation scheduler
     */
    public void startRotationScheduler() {
        scheduler.scheduleAtFixedRate(
            this::rotateSigningKeys,
            0,
            ROTATION_INTERVAL.toDays(),
            TimeUnit.DAYS
        );
        LOG.info("Quantum key rotation scheduler started (interval: 90 days)");
    }

    /**
     * Rotate CRYSTALS-Dilithium signing keys
     */
    public void rotateSigningKeys() {
        try {
            LOG.info("Starting CRYSTALS-Dilithium key rotation...");

            // 1. Generate new key pair
            var newKeyPair = cryptoService.generateSigningKeyPair();

            // 2. Store new keys in HSM/secure storage
            keyStorage.storeKeyPair("dilithium-signing-key-new", newKeyPair);

            // 3. Grace period: Accept both old and new keys for 24 hours
            scheduler.schedule(() -> {
                // Archive old key
                var oldKeyPair = keyStorage.retrieveKeyPair("dilithium-signing-key");
                keyStorage.archiveKeyPair("dilithium-signing-key-" + Instant.now().toEpochMilli(), oldKeyPair);

                // Promote new key to active
                keyStorage.promoteKeyPair("dilithium-signing-key-new", "dilithium-signing-key");

                LOG.info("CRYSTALS-Dilithium key rotation completed successfully");
            }, 24, TimeUnit.HOURS);

        } catch (Exception e) {
            LOG.error("Key rotation failed", e);
            // Send alert to security team
            alertSecurityTeam("Quantum key rotation failed: " + e.getMessage());
        }
    }

    /**
     * Emergency key rotation (immediate)
     */
    public void emergencyRotation(String reason) {
        LOG.warn("Emergency key rotation triggered: " + reason);
        rotateSigningKeys();
        // Invalidate all old signatures immediately (no grace period)
        keyStorage.invalidateAllOldKeys();
    }

    private void alertSecurityTeam(String message) {
        // Send email/Slack notification
        LOG.error("SECURITY ALERT: " + message);
    }
}
```

### 3. API Key Rotation

#### Scheduled Rotation Procedure
```bash
#!/bin/bash
# api-key-rotate.sh - Rotate API keys every 90 days

ROTATION_INTERVAL=90 # days
DB_QUERY="SELECT api_key_id, created_at FROM api_keys WHERE created_at < NOW() - INTERVAL '$ROTATION_INTERVAL days'"

# Find keys older than 90 days
psql -U aurigraph -d aurigraph_demos -t -c "$DB_QUERY" | while read key_id created_at; do
  echo "Rotating API key: $key_id (created: $created_at)"

  # Generate new key
  NEW_KEY=$(curl -X POST https://dlt.aurigraph.io/api/v11/admin/keys/rotate \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key_id\": \"$key_id\"}")

  # Email user with new key
  echo "Your API key has been rotated. New key: $NEW_KEY" | \
    mail -s "Aurigraph API Key Rotation" user@example.com

  # Audit log
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) - API Key Rotated: $key_id" >> /var/log/aurigraph/security-audit.log
done
```

---

## Network Segmentation

### 1. Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       DMZ (Public Zone)                          │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  NGINX Gateway   │         │  Enterprise      │             │
│  │  Port: 443       │◄───────►│  Portal          │             │
│  │  (TLS Termination│         │  Port: 3000      │             │
│  └────────┬─────────┘         └──────────────────┘             │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │ Firewall (Stateful Inspection)
┌───────────▼──────────────────────────────────────────────────────┐
│                  Application Zone (Internal)                     │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Aurigraph V11   │◄───────►│  IAM (Keycloak)  │             │
│  │  Port: 9003      │         │  Port: 8180      │             │
│  │  (Backend API)   │         │  (OAuth)         │             │
│  └────────┬─────────┘         └──────────────────┘             │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │ Firewall (Database Access Control)
┌───────────▼──────────────────────────────────────────────────────┐
│                    Data Zone (Restricted)                        │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  PostgreSQL      │         │  RocksDB         │             │
│  │  Port: 5432      │         │  (Embedded)      │             │
│  │  (Metadata)      │         │  (State)         │             │
│  └──────────────────┘         └──────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. VLAN Configuration

#### Network Segmentation Table
```yaml
DMZ (VLAN 10):
  Subnet: 10.0.10.0/24
  Gateway: 10.0.10.1
  Services:
    - NGINX Gateway (10.0.10.10)
    - Enterprise Portal (10.0.10.20)
  Access: Public internet (via firewall)

Application Zone (VLAN 20):
  Subnet: 10.0.20.0/24
  Gateway: 10.0.20.1
  Services:
    - Aurigraph V11 Backend (10.0.20.10)
    - IAM Service (10.0.20.20)
    - Oracle Services (10.0.20.30)
  Access: DMZ only (no direct internet)

Data Zone (VLAN 30):
  Subnet: 10.0.30.0/24
  Gateway: 10.0.30.1
  Services:
    - PostgreSQL Primary (10.0.30.10)
    - PostgreSQL Replica (10.0.30.11)
  Access: Application zone only

Management Zone (VLAN 40):
  Subnet: 10.0.40.0/24
  Gateway: 10.0.40.1
  Services:
    - Monitoring (Prometheus/Grafana) (10.0.40.10)
    - Logging (ELK Stack) (10.0.40.20)
    - Backup Server (10.0.40.30)
  Access: Admin VPN only
```

---

## Firewall Rules

### 1. iptables Configuration

#### Comprehensive Firewall Rules
```bash
#!/bin/bash
# iptables-rules.sh - Production firewall configuration

# Flush existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# Default policies (DROP all, allow specific)
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# ============ Loopback Interface ============
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# ============ Established Connections ============
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# ============ ICMP (Ping) ============
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s -j ACCEPT

# ============ SSH (Management - Port 22) ============
# Allow SSH from admin IP only
iptables -A INPUT -p tcp -s 203.0.113.0/24 --dport 22 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# ============ HTTP/HTTPS (Ports 80, 443) ============
# Allow HTTP (redirect to HTTPS)
iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# Allow HTTPS
iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# ============ Aurigraph V11 Backend (Port 9003) ============
# Allow only from NGINX gateway (10.0.10.10)
iptables -A INPUT -p tcp -s 10.0.10.10 --dport 9003 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# ============ gRPC (Port 9004) ============
# Allow only from internal services
iptables -A INPUT -p tcp -s 10.0.20.0/24 --dport 9004 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# ============ PostgreSQL (Port 5432) ============
# Allow only from application zone
iptables -A INPUT -p tcp -s 10.0.20.0/24 --dport 5432 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# ============ Keycloak IAM (Port 8180) ============
# Allow only from NGINX and application zone
iptables -A INPUT -p tcp -s 10.0.10.0/24 --dport 8180 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT
iptables -A INPUT -p tcp -s 10.0.20.0/24 --dport 8180 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT

# ============ DDoS Protection ============
# Limit new connections (SYN flood protection)
iptables -A INPUT -p tcp --syn -m limit --limit 10/s --limit-burst 20 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP

# Limit ICMP flood
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s -j ACCEPT

# Drop invalid packets
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP

# ============ Rate Limiting per IP ============
# Limit connections from single IP (100 concurrent)
iptables -A INPUT -p tcp --dport 443 -m connlimit --connlimit-above 100 --connlimit-mask 32 -j REJECT

# ============ Logging (Blocked Traffic) ============
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables-blocked: " --log-level 7

# ============ Drop All Other Traffic ============
iptables -A INPUT -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4
ip6tables-save > /etc/iptables/rules.v6

echo "Firewall rules applied successfully"
```

### 2. UFW (Uncomplicated Firewall) - Alternative

```bash
#!/bin/bash
# ufw-setup.sh - Simplified firewall using UFW

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# SSH (from admin network only)
ufw allow from 203.0.113.0/24 to any port 22 proto tcp

# HTTP/HTTPS (public)
ufw allow 80/tcp
ufw allow 443/tcp

# Aurigraph V11 (from NGINX only)
ufw allow from 10.0.10.10 to any port 9003 proto tcp

# gRPC (internal services only)
ufw allow from 10.0.20.0/24 to any port 9004 proto tcp

# PostgreSQL (application zone only)
ufw allow from 10.0.20.0/24 to any port 5432 proto tcp

# Keycloak (NGINX + application zone)
ufw allow from 10.0.10.0/24 to any port 8180 proto tcp
ufw allow from 10.0.20.0/24 to any port 8180 proto tcp

# Rate limiting (30 connections/minute per IP)
ufw limit 443/tcp

# Enable UFW
ufw --force enable

# Show status
ufw status verbose
```

### 3. Cloud Provider Firewall (AWS Security Groups)

#### Security Group Configuration (Terraform)
```hcl
# security-groups.tf - AWS Security Groups

resource "aws_security_group" "nginx_gateway" {
  name        = "aurigraph-nginx-gateway"
  description = "NGINX Gateway (DMZ)"
  vpc_id      = aws_vpc.aurigraph.id

  # HTTP (redirect to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS (public)
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH (admin only)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.0/24"] # Admin IP range
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "Aurigraph NGINX Gateway"
  }
}

resource "aws_security_group" "v11_backend" {
  name        = "aurigraph-v11-backend"
  description = "Aurigraph V11 Backend (Application Zone)"
  vpc_id      = aws_vpc.aurigraph.id

  # HTTP/2 from NGINX only
  ingress {
    from_port       = 9003
    to_port         = 9003
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_gateway.id]
  }

  # gRPC from internal services only
  ingress {
    from_port   = 9004
    to_port     = 9004
    protocol    = "tcp"
    cidr_blocks = ["10.0.20.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "Aurigraph V11 Backend"
  }
}

resource "aws_security_group" "postgresql" {
  name        = "aurigraph-postgresql"
  description = "PostgreSQL Database (Data Zone)"
  vpc_id      = aws_vpc.aurigraph.id

  # PostgreSQL from application zone only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.v11_backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "Aurigraph PostgreSQL"
  }
}
```

---

## Security Headers

### 1. HTTP Security Headers (NGINX)

#### Comprehensive Security Headers Configuration
```nginx
# /etc/nginx/conf.d/security-headers.conf

# HSTS (HTTP Strict Transport Security) - Force HTTPS for 2 years
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Content Security Policy (CSP) - Prevent XSS attacks
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' wss://dlt.aurigraph.io https://api.aurigraph.io;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
" always;

# X-Frame-Options - Prevent clickjacking
add_header X-Frame-Options "DENY" always;

# X-Content-Type-Options - Prevent MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# X-XSS-Protection - Enable browser XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer-Policy - Control referrer information
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions-Policy (Feature-Policy) - Disable unnecessary browser features
add_header Permissions-Policy "
  geolocation=(),
  microphone=(),
  camera=(),
  payment=(),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
" always;

# Cross-Origin Policies
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;

# Remove server identification headers
server_tokens off;
more_clear_headers Server;
more_clear_headers X-Powered-By;

# Expect-CT (Certificate Transparency)
add_header Expect-CT "max-age=86400, enforce" always;
```

### 2. Application-Level Security Headers (Quarkus)

#### Quarkus HTTP Security Filter
```java
// SecurityHeadersFilter.java
package io.aurigraph.v11.security;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class SecurityHeadersFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext,
                       ContainerResponseContext responseContext) throws IOException {

        // HSTS (if not behind NGINX)
        responseContext.getHeaders().add(
            "Strict-Transport-Security",
            "max-age=63072000; includeSubDomains; preload"
        );

        // Content Security Policy
        responseContext.getHeaders().add(
            "Content-Security-Policy",
            "default-src 'self'; frame-ancestors 'none'"
        );

        // X-Frame-Options
        responseContext.getHeaders().add("X-Frame-Options", "DENY");

        // X-Content-Type-Options
        responseContext.getHeaders().add("X-Content-Type-Options", "nosniff");

        // X-XSS-Protection
        responseContext.getHeaders().add("X-XSS-Protection", "1; mode=block");

        // Referrer-Policy
        responseContext.getHeaders().add("Referrer-Policy", "strict-origin-when-cross-origin");

        // Remove server identification
        responseContext.getHeaders().remove("Server");
        responseContext.getHeaders().remove("X-Powered-By");
    }
}
```

---

## Authentication & Authorization

### 1. JWT Token Configuration

#### Token Generation & Validation
```java
// JWTService.java
package io.aurigraph.v11.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

@ApplicationScoped
public class JWTService {

    @ConfigProperty(name = "jwt.secret.key")
    String secretKey;

    @ConfigProperty(name = "jwt.expiration.minutes", defaultValue = "60")
    int expirationMinutes;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    /**
     * Generate JWT token with claims
     */
    public String generateToken(String subject, Map<String, Object> claims) {
        Instant now = Instant.now();
        Instant expiration = now.plus(expirationMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
            .setSubject(subject)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(expiration))
            .addClaims(claims)
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
    }

    /**
     * Validate and parse JWT token
     */
    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        Claims claims = validateToken(token);
        return claims.getExpiration().before(new Date());
    }
}
```

### 2. Role-Based Access Control (RBAC)

#### RBAC Configuration
```yaml
# roles.yaml - Define user roles and permissions

roles:
  admin:
    permissions:
      - system:*
      - users:*
      - blockchain:*
      - consensus:*
      - security:*
    description: Full system access

  operator:
    permissions:
      - blockchain:read
      - blockchain:write
      - consensus:read
      - nodes:manage
    description: Blockchain operations

  developer:
    permissions:
      - contracts:deploy
      - contracts:read
      - transactions:submit
      - blockchain:read
    description: Smart contract development

  auditor:
    permissions:
      - blockchain:read
      - transactions:read
      - security:audit
      - logs:read
    description: Read-only audit access

  user:
    permissions:
      - transactions:submit
      - transactions:read:own
      - wallet:manage:own
    description: Standard user access
```

#### RBAC Enforcement Filter
```java
// RBACFilter.java
package io.aurigraph.v11.security;

import jakarta.annotation.Priority;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Provider
@Priority(Priorities.AUTHORIZATION)
public class RBACFilter implements ContainerRequestFilter {

    @Context
    ResourceInfo resourceInfo;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        Method method = resourceInfo.getResourceMethod();

        if (method.isAnnotationPresent(RolesAllowed.class)) {
            RolesAllowed rolesAnnotation = method.getAnnotation(RolesAllowed.class);
            Set<String> rolesSet = new HashSet<>(Arrays.asList(rolesAnnotation.value()));

            // Extract user roles from JWT claims
            String userRole = extractUserRole(requestContext);

            if (!rolesSet.contains(userRole)) {
                requestContext.abortWith(
                    Response.status(Response.Status.FORBIDDEN)
                        .entity("Insufficient permissions")
                        .build()
                );
            }
        }
    }

    private String extractUserRole(ContainerRequestContext context) {
        // Extract from Authorization header (JWT)
        String authHeader = context.getHeaderString("Authorization");
        // Parse JWT and extract role claim
        return "user"; // Placeholder
    }
}
```

---

## Quantum Cryptography Hardening

### 1. CRYSTALS-Dilithium Configuration

#### Production Configuration (`application.properties`)
```properties
# NIST Level 5 Quantum Cryptography (256-bit security)
aurigraph.crypto.dilithium.security-level=5
aurigraph.crypto.dilithium.enabled=true
aurigraph.crypto.dilithium.algorithm=Dilithium5

# HSM Integration for Key Storage
aurigraph.crypto.hsm.enabled=true
aurigraph.crypto.hsm.provider=PKCS11
aurigraph.crypto.hsm.library.path=/usr/lib/softhsm/libsofthsm2.so
aurigraph.crypto.hsm.slot=0
aurigraph.crypto.hsm.pin=${HSM_PIN:changeme}

# Key Rotation
aurigraph.crypto.key.rotation.enabled=true
aurigraph.crypto.key.rotation.interval.days=90
aurigraph.crypto.key.storage.encrypted=true
aurigraph.crypto.key.backup.enabled=true
```

### 2. Secure Key Storage

#### HSM Integration (SoftHSM for Development)
```bash
#!/bin/bash
# hsm-setup.sh - Initialize SoftHSM for development

# Install SoftHSM
sudo apt install softhsm2

# Initialize token
softhsm2-util --init-token --slot 0 --label "Aurigraph-Dev" --so-pin 1234 --pin 5678

# Generate key pair in HSM
pkcs11-tool --module /usr/lib/softhsm/libsofthsm2.so \
  --login --pin 5678 \
  --keypairgen --key-type rsa:4096 \
  --label "aurigraph-signing-key"

# List keys
pkcs11-tool --module /usr/lib/softhsm/libsofthsm2.so \
  --login --pin 5678 \
  --list-objects
```

---

## Database Security

### 1. PostgreSQL Hardening

#### Configuration (`postgresql.conf`)
```conf
# Network Security
listen_addresses = '10.0.30.10'  # Bind to internal IP only
max_connections = 100
ssl = on
ssl_cert_file = '/etc/ssl/certs/postgresql.crt'
ssl_key_file = '/etc/ssl/private/postgresql.key'
ssl_ciphers = 'HIGH:!aNULL:!MD5'
ssl_min_protocol_version = 'TLSv1.3'

# Authentication
password_encryption = scram-sha-256
db_user_namespace = off

# Logging (audit trail)
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'ddl'  # Log schema changes
log_connections = on
log_disconnections = on
log_duration = off
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

#### Access Control (`pg_hba.conf`)
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections (Unix socket)
local   all             postgres                                peer
local   all             all                                     scram-sha-256

# IPv4 internal network only
host    aurigraph_demos aurigraph       10.0.20.0/24            scram-sha-256
host    all             all             10.0.20.0/24            scram-sha-256

# Replication
host    replication     replicator      10.0.30.11/32           scram-sha-256

# Deny all others
host    all             all             0.0.0.0/0               reject
host    all             all             ::/0                    reject
```

### 2. Encryption at Rest

#### Enable Transparent Data Encryption (TDE)
```bash
#!/bin/bash
# postgresql-tde-setup.sh - Enable encryption at rest

# Create encryption key
openssl rand -base64 32 > /var/lib/postgresql/encryption_key

# Set permissions
chmod 400 /var/lib/postgresql/encryption_key
chown postgres:postgres /var/lib/postgresql/encryption_key

# Initialize encrypted cluster
initdb -D /var/lib/postgresql/14/main --data-checksums --wal-segsize=64 --encryption=aes256

# Add to postgresql.conf
echo "data_encryption = on" >> /etc/postgresql/14/main/postgresql.conf
echo "encryption_key_command = 'cat /var/lib/postgresql/encryption_key'" >> /etc/postgresql/14/main/postgresql.conf

# Restart PostgreSQL
systemctl restart postgresql
```

---

## API Security

### 1. Rate Limiting

#### Application-Level Rate Limiting
```java
// RateLimitFilter.java
package io.aurigraph.v11.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Provider
public class RateLimitFilter implements ContainerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String apiKey = extractAPIKey(requestContext);
        Bucket bucket = resolveBucket(apiKey);

        if (bucket.tryConsume(1)) {
            // Request allowed
            return;
        } else {
            // Rate limit exceeded
            requestContext.abortWith(
                Response.status(429)
                    .entity("Rate limit exceeded. Try again later.")
                    .header("X-Rate-Limit-Retry-After-Seconds", "60")
                    .build()
            );
        }
    }

    private Bucket resolveBucket(String apiKey) {
        return cache.computeIfAbsent(apiKey, k -> createNewBucket());
    }

    private Bucket createNewBucket() {
        // 1000 requests per minute (authenticated users)
        Bandwidth limit = Bandwidth.classic(1000, Refill.intervally(1000, Duration.ofMinutes(1)));
        return Bucket4j.builder().addLimit(limit).build();
    }

    private String extractAPIKey(ContainerRequestContext context) {
        // Extract from Authorization header or query parameter
        String authHeader = context.getHeaderString("Authorization");
        return authHeader != null ? authHeader.replace("Bearer ", "") : "anonymous";
    }
}
```

### 2. Input Validation

#### Request Validation Filter
```java
// InputValidationFilter.java
package io.aurigraph.v11.security;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.util.regex.Pattern;

@Provider
public class InputValidationFilter implements ContainerRequestFilter {

    // Prevent SQL injection, XSS, path traversal
    private static final Pattern MALICIOUS_PATTERN = Pattern.compile(
        ".*(<script>|javascript:|onerror=|onload=|;.*--|\\.\\./).*",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String uri = requestContext.getUriInfo().getPath();

        if (MALICIOUS_PATTERN.matcher(uri).matches()) {
            requestContext.abortWith(
                Response.status(400)
                    .entity("Invalid request: potentially malicious input detected")
                    .build()
            );
        }

        // Validate query parameters
        requestContext.getUriInfo().getQueryParameters().forEach((key, values) -> {
            values.forEach(value -> {
                if (MALICIOUS_PATTERN.matcher(value).matches()) {
                    requestContext.abortWith(
                        Response.status(400)
                            .entity("Invalid query parameter: " + key)
                            .build()
                    );
                }
            });
        });
    }
}
```

---

## Container Security

### 1. Docker Security Best Practices

#### Secure Dockerfile
```dockerfile
# Dockerfile - Production-hardened container

# Use minimal base image (distroless)
FROM gcr.io/distroless/java21-debian12:nonroot

# Metadata
LABEL maintainer="security@aurigraph.io"
LABEL version="11.4.4"
LABEL description="Aurigraph V11 Blockchain Platform"

# Run as non-root user
USER nonroot:nonroot

# Copy application
COPY --chown=nonroot:nonroot target/quarkus-app /app

# Expose port (non-privileged)
EXPOSE 9003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/usr/bin/curl", "-f", "http://localhost:9003/q/health"]

# Entry point
ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]
```

#### Docker Compose Security
```yaml
# docker-compose.production.yml - Secure configuration

version: '3.8'

services:
  aurigraph-v11:
    image: aurigraph/v11:11.4.4
    container_name: aurigraph-v11

    # Security options
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

    # Read-only root filesystem
    read_only: true
    tmpfs:
      - /tmp
      - /var/run

    # Resource limits
    mem_limit: 2g
    mem_reservation: 1g
    cpus: '2.0'

    # Network
    networks:
      - aurigraph-internal
    ports:
      - "127.0.0.1:9003:9003"  # Bind to localhost only

    # Environment variables (use secrets)
    environment:
      - QUARKUS_DATASOURCE_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9003/q/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s

networks:
  aurigraph-internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

secrets:
  db_password:
    external: true
```

### 2. Kubernetes Security

#### Pod Security Policy
```yaml
# pod-security-policy.yaml

apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: aurigraph-restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false

  # Required to prevent escalations to root
  requiredDropCapabilities:
    - ALL

  # Allow specific capabilities if needed
  allowedCapabilities:
    - NET_BIND_SERVICE

  # Volume types
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'

  # Host network
  hostNetwork: false
  hostIPC: false
  hostPID: false

  # Run as non-root
  runAsUser:
    rule: 'MustRunAsNonRoot'

  # SELinux
  seLinux:
    rule: 'RunAsAny'

  # Filesystem
  fsGroup:
    rule: 'RunAsAny'

  # Read-only root filesystem
  readOnlyRootFilesystem: true
```

---

## Monitoring & Incident Response

### 1. Security Event Monitoring

#### Audit Logging Configuration
```properties
# application.properties - Security audit logging

# Enable security audit logs
aurigraph.security.audit.enabled=true
aurigraph.security.audit.log-all-requests=false
aurigraph.security.audit.log-failed-auth=true
aurigraph.security.audit.log-admin-actions=true
aurigraph.security.audit.retention-days=365

# Log sensitive events
aurigraph.security.events.track-login=true
aurigraph.security.events.track-logout=true
aurigraph.security.events.track-password-changes=true
aurigraph.security.events.track-role-changes=true
aurigraph.security.events.track-key-rotations=true
```

#### Security Audit Logger
```java
// SecurityAuditLogger.java
package io.aurigraph.v11.security;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.Map;

@ApplicationScoped
public class SecurityAuditLogger {

    private static final Logger LOG = Logger.getLogger("SECURITY_AUDIT");

    public void logAuthAttempt(String username, String ipAddress, boolean success) {
        LOG.infof("AUTH_ATTEMPT | timestamp=%s | user=%s | ip=%s | success=%b",
            Instant.now(), username, ipAddress, success);
    }

    public void logAdminAction(String admin, String action, Map<String, Object> details) {
        LOG.warnf("ADMIN_ACTION | timestamp=%s | admin=%s | action=%s | details=%s",
            Instant.now(), admin, action, details);
    }

    public void logKeyRotation(String keyType, String keyId) {
        LOG.infof("KEY_ROTATION | timestamp=%s | key_type=%s | key_id=%s",
            Instant.now(), keyType, keyId);
    }

    public void logSecurityViolation(String violation, String source, String details) {
        LOG.errorf("SECURITY_VIOLATION | timestamp=%s | violation=%s | source=%s | details=%s",
            Instant.now(), violation, source, details);
    }
}
```

### 2. Intrusion Detection

#### Fail2Ban Configuration
```ini
# /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
banaction = iptables-multiport

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/aurigraph-error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/aurigraph-access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/aurigraph-access.log
maxretry = 2

[aurigraph-api-abuse]
enabled = true
port = http,https
filter = aurigraph-api-abuse
logpath = /var/log/nginx/aurigraph-access.log
maxretry = 10
findtime = 60
bantime = 7200
```

#### Custom Fail2Ban Filter
```ini
# /etc/fail2ban/filter.d/aurigraph-api-abuse.conf

[Definition]
failregex = ^<HOST> .* "(GET|POST|PUT|DELETE) /api/v11/.* HTTP/.*" 429 .*$
            ^<HOST> .* "(GET|POST|PUT|DELETE) /api/v11/.* HTTP/.*" 401 .*$
            ^<HOST> .* "(GET|POST|PUT|DELETE) /api/v11/.* HTTP/.*" 403 .*$

ignoreregex =
```

---

## Incident Response Procedures

### 1. Security Incident Classification

#### Incident Severity Levels
```yaml
P0 (Critical):
  Examples:
    - Data breach (PII/financial data exposed)
    - Quantum key compromise
    - Consensus attack (51% attack)
    - Complete service outage
  Response Time: < 5 minutes
  Escalation: Immediate page-out to on-call security team
  Communication: CEO, CTO, CISO notified immediately

P1 (High):
  Examples:
    - Unauthorized access attempt (successful)
    - DDoS attack impacting service
    - Malware detected
    - Certificate expiration
  Response Time: < 15 minutes
  Escalation: On-call security engineer
  Communication: Security team + management

P2 (Medium):
  Examples:
    - Failed authentication spike
    - Suspicious API usage
    - Security scan alerts
  Response Time: < 1 hour
  Escalation: Security team notification
  Communication: Security team

P3 (Low):
  Examples:
    - Minor configuration drift
    - Non-critical vulnerability
  Response Time: Next business day
  Escalation: Ticket creation
  Communication: Security team (async)
```

### 2. Incident Response Playbook

#### Security Incident Response Script
```bash
#!/bin/bash
# incident-response.sh - Automated incident response

INCIDENT_TYPE=$1
SEVERITY=$2
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

case $SEVERITY in
  P0)
    echo "[$TIMESTAMP] CRITICAL INCIDENT: $INCIDENT_TYPE"

    # 1. Isolate affected systems
    iptables -A INPUT -j DROP  # Block all incoming traffic

    # 2. Capture forensic snapshot
    df -h > /var/log/incident/$TIMESTAMP-disk-usage.txt
    netstat -an > /var/log/incident/$TIMESTAMP-network-connections.txt
    ps aux > /var/log/incident/$TIMESTAMP-processes.txt

    # 3. Alert security team
    curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
      -d "{\"text\": \"🚨 P0 SECURITY INCIDENT: $INCIDENT_TYPE at $TIMESTAMP\"}"

    # 4. Page on-call team
    curl -X POST https://events.pagerduty.com/v2/enqueue \
      -H "Content-Type: application/json" \
      -d "{
        \"routing_key\": \"$PAGERDUTY_KEY\",
        \"event_action\": \"trigger\",
        \"payload\": {
          \"summary\": \"P0 Security Incident: $INCIDENT_TYPE\",
          \"severity\": \"critical\",
          \"source\": \"aurigraph-v11\"
        }
      }"

    # 5. Stop affected services
    docker-compose -f docker-compose.production.yml stop
    ;;

  P1)
    echo "[$TIMESTAMP] HIGH SEVERITY INCIDENT: $INCIDENT_TYPE"

    # Enable additional logging
    echo "aurigraph.log.level=DEBUG" >> /opt/aurigraph/config/application.properties
    systemctl restart aurigraph-v11

    # Notify security team
    mail -s "P1 Security Incident: $INCIDENT_TYPE" security@aurigraph.io < /dev/null
    ;;

  *)
    echo "[$TIMESTAMP] INCIDENT: $INCIDENT_TYPE (Severity: $SEVERITY)"
    # Log to SIEM
    logger -t aurigraph-security "Incident: $INCIDENT_TYPE | Severity: $SEVERITY"
    ;;
esac

# Create incident report
cat <<EOF > /var/log/incident/$TIMESTAMP-incident-report.md
# Security Incident Report

**Incident ID**: INC-$(date +%Y%m%d%H%M%S)
**Timestamp**: $TIMESTAMP
**Type**: $INCIDENT_TYPE
**Severity**: $SEVERITY

## Detection
- Automated alert triggered
- See /var/log/aurigraph/security-audit.log

## Response Actions
- [ ] Isolate affected systems
- [ ] Capture forensic evidence
- [ ] Notify stakeholders
- [ ] Implement containment measures
- [ ] Eradicate threat
- [ ] Restore services
- [ ] Post-incident review

## Next Steps
1. Investigate root cause
2. Implement remediation
3. Update security policies
4. Conduct post-mortem

---
Generated by: incident-response.sh
EOF

echo "Incident report created: /var/log/incident/$TIMESTAMP-incident-report.md"
```

---

## Compliance & Validation

### 1. Security Validation Script

#### Automated Security Scan
```bash
#!/bin/bash
# security-scan.sh - Comprehensive security validation

echo "=== Aurigraph V11 Security Hardening Validation ==="
echo "Scan started: $(date)"

FAILED=0

# Test 1: TLS 1.3 Enforcement
echo -n "Testing TLS 1.3 enforcement... "
if openssl s_client -connect dlt.aurigraph.io:443 -tls1_3 < /dev/null 2>/dev/null | grep -q "TLSv1.3"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 2: Strong Cipher Suites
echo -n "Testing cipher suites... "
if openssl s_client -connect dlt.aurigraph.io:443 -cipher 'TLS_AES_256_GCM_SHA384' < /dev/null 2>/dev/null | grep -q "Cipher"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 3: HSTS Header
echo -n "Testing HSTS header... "
if curl -I https://dlt.aurigraph.io 2>/dev/null | grep -q "Strict-Transport-Security"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 4: CSP Header
echo -n "Testing Content-Security-Policy header... "
if curl -I https://dlt.aurigraph.io 2>/dev/null | grep -q "Content-Security-Policy"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 5: Firewall Rules
echo -n "Testing firewall rules... "
if sudo iptables -L INPUT | grep -q "DROP"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 6: PostgreSQL Encryption
echo -n "Testing PostgreSQL SSL... "
if sudo -u postgres psql -c "SHOW ssl" | grep -q "on"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 7: Container Security
echo -n "Testing container non-root user... "
if docker inspect aurigraph-v11 | grep -q "\"User\": \"nonroot\""; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 8: Rate Limiting
echo -n "Testing API rate limiting... "
for i in {1..150}; do
  curl -s -o /dev/null https://dlt.aurigraph.io/api/v11/health
done
if curl -I https://dlt.aurigraph.io/api/v11/health 2>/dev/null | grep -q "429"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "=== Security Scan Complete ==="
echo "Total Failures: $FAILED"

if [ $FAILED -eq 0 ]; then
  echo "✅ All security checks passed!"
  exit 0
else
  echo "❌ $FAILED security check(s) failed. Review required."
  exit 1
fi
```

---

## Summary Checklist

```yaml
TLS/SSL Configuration:
  - [ ] TLS 1.3 enforced
  - [ ] Strong cipher suites configured
  - [ ] Certificate auto-renewal enabled
  - [ ] OCSP stapling enabled
  - [ ] HSTS header configured (2 years)

Password Policies:
  - [ ] 14+ character minimum
  - [ ] Complexity requirements enforced
  - [ ] Password history (12 passwords)
  - [ ] Bcrypt/Argon2id hashing
  - [ ] Account lockout policy (5 attempts)

Key Rotation:
  - [ ] TLS certificates: 90 days
  - [ ] Quantum keys: 90 days
  - [ ] API keys: 90 days
  - [ ] Automated rotation scripts
  - [ ] HSM integration (production)

Network Segmentation:
  - [ ] DMZ, Application, Data zones defined
  - [ ] VLANs configured
  - [ ] Firewall rules between zones
  - [ ] Internal traffic encrypted

Firewall Rules:
  - [ ] Default deny policy
  - [ ] Whitelist-based access
  - [ ] DDoS protection (rate limiting)
  - [ ] Port-based restrictions
  - [ ] IP-based access control

Security Headers:
  - [ ] HSTS
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Referrer-Policy

Authentication & Authorization:
  - [ ] JWT-based authentication
  - [ ] Role-based access control (RBAC)
  - [ ] OAuth 2.0 / OpenID Connect
  - [ ] Multi-factor authentication (admin)

Quantum Cryptography:
  - [ ] NIST Level 5 (CRYSTALS-Dilithium/Kyber)
  - [ ] HSM for key storage
  - [ ] Automated key rotation
  - [ ] Post-quantum readiness

Database Security:
  - [ ] TLS 1.3 for connections
  - [ ] scram-sha-256 authentication
  - [ ] Network-based access control
  - [ ] Encryption at rest
  - [ ] Audit logging enabled

API Security:
  - [ ] Rate limiting (per IP/key)
  - [ ] Input validation
  - [ ] Output encoding
  - [ ] CORS policies
  - [ ] API key management

Container Security:
  - [ ] Non-root user
  - [ ] Read-only filesystem
  - [ ] Minimal base image (distroless)
  - [ ] Security options (no-new-privileges)
  - [ ] Resource limits

Monitoring & Incident Response:
  - [ ] Security audit logging
  - [ ] Intrusion detection (Fail2Ban)
  - [ ] Incident response playbook
  - [ ] Automated alerting
  - [ ] Forensic logging
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-12
**Next Review**: 2025-12-12
**Maintainer**: Aurigraph Security Team (security@aurigraph.io)

---

Generated with Claude Code - https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>
