# RBAC V2 - Next Sprint Enhancements

**Planning Date**: October 12, 2025
**Current Version**: 2.0.0
**Target Version**: 2.1.0 - 3.0.0
**Timeframe**: Next 3 sprints (6 weeks)

---

## 📋 Overview

This document outlines planned enhancements to the RBAC system for upcoming sprints. Enhancements are categorized by priority and sprint allocation.

**Current Status**:
- ✅ Security Grade: B+ (85/100)
- ✅ All critical vulnerabilities fixed
- ✅ Production ready

**Target Status** (After Enhancements):
- 🎯 Security Grade: A (95/100)
- 🎯 Enterprise compliance ready (SOC 2, ISO 27001)
- 🎯 Full feature parity with enterprise auth systems

---

## 🚀 Sprint 1: Backend Integration & CSRF Protection (Week 1-2)

**Goal**: Add backend authentication and CSRF protection
**Priority**: 🔴 CRITICAL
**Estimated Effort**: 40 hours

### 1.1 Backend Password Verification API

**Current Issue**: Passwords only hashed on client-side

**Implementation**:

```javascript
// Backend API endpoint (Node.js/Express example)
app.post('/api/auth/verify-password', async (req, res) => {
    const { email, passwordHash } = req.body;

    // Lookup user in database
    const user = await db.users.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Verify password with bcrypt
    const isValid = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({ token, user: { ...user, passwordHash: undefined } });
});
```

**Frontend Changes**:

```javascript
// In aurigraph-rbac-system-v2.js
async login(email, password) {
    // Hash password client-side
    const passwordHash = await SecureCrypto.hashPassword(password);

    // Send to backend for verification
    const response = await fetch(BACKEND_URL + '/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash })
    });

    if (!response.ok) {
        throw new AuthenticationError('Login failed');
    }

    const { token, user } = await response.json();

    // Store token
    localStorage.setItem('rbac_auth_token', token);
    this.currentUser = new User(user);

    Logger.info('User logged in via backend', { email, role: user.role });
    return this.currentUser;
}
```

**Tasks**:
- [ ] Create backend API endpoints (register, login, verify)
- [ ] Implement bcrypt password hashing on backend
- [ ] Generate JWT tokens for authenticated sessions
- [ ] Update frontend to use backend API
- [ ] Add token refresh mechanism
- [ ] Handle offline mode gracefully
- [ ] Add unit tests for backend API
- [ ] Add integration tests for auth flow

**Acceptance Criteria**:
- Passwords never stored in localStorage
- All authentication happens via backend API
- JWT tokens used for session management
- Tokens expire after 8 hours
- Refresh token mechanism works
- Tests pass with 95% coverage

---

### 1.2 CSRF Protection

**Current Issue**: No CSRF token system

**Implementation**:

```javascript
// Backend: Generate CSRF token
app.get('/api/auth/csrf-token', (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    req.session.csrfToken = token;
    res.json({ csrfToken: token });
});

// Backend: Verify CSRF token
function verifyCsrfToken(req, res, next) {
    const token = req.headers['x-csrf-token'];
    if (token !== req.session.csrfToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
}

app.post('/api/auth/register', verifyCsrfToken, async (req, res) => {
    // Registration logic
});
```

**Frontend Changes**:

```javascript
// In aurigraph-rbac-system-v2.js
class CSRFProtection {
    constructor() {
        this.token = null;
    }

    async fetchToken() {
        const response = await fetch(BACKEND_URL + '/api/auth/csrf-token');
        const { csrfToken } = await response.json();
        this.token = csrfToken;
        sessionStorage.setItem('csrf_token', csrfToken);
    }

    getToken() {
        return this.token || sessionStorage.getItem('csrf_token');
    }

    addToHeaders(headers = {}) {
        return {
            ...headers,
            'X-CSRF-Token': this.getToken()
        };
    }
}

// Usage in state-changing operations
async registerGuest(contactData) {
    await csrfProtection.fetchToken();

    const response = await fetch(BACKEND_URL + '/api/auth/register', {
        method: 'POST',
        headers: csrfProtection.addToHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(contactData)
    });

    // Handle response
}
```

**Tasks**:
- [ ] Create CSRF token generation endpoint
- [ ] Add CSRF verification middleware
- [ ] Update all state-changing endpoints
- [ ] Update frontend to fetch and use CSRF tokens
- [ ] Add CSRF token rotation on login
- [ ] Add tests for CSRF protection
- [ ] Document CSRF flow in integration guide

**Acceptance Criteria**:
- All POST/PUT/DELETE requests require CSRF token
- Tokens rotated on login/logout
- Failed CSRF verification returns 403
- Frontend automatically handles token refresh
- Tests verify CSRF protection works

---

## 🔐 Sprint 2: Email Verification & 2FA (Week 3-4)

**Goal**: Add email verification and two-factor authentication
**Priority**: 🟠 HIGH
**Estimated Effort**: 35 hours

### 2.1 Email Verification System

**Current Issue**: Email addresses not verified

**Implementation**:

```javascript
// Backend: Send verification email
app.post('/api/auth/send-verification', async (req, res) => {
    const { email } = req.body;

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store in database
    await db.verificationTokens.create({
        email,
        token,
        expires,
        type: 'email'
    });

    // Send email
    await emailService.send({
        to: email,
        subject: 'Verify your Aurigraph account',
        html: `
            <h1>Welcome to Aurigraph!</h1>
            <p>Click the link below to verify your email:</p>
            <a href="${process.env.APP_URL}/verify?token=${token}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
        `
    });

    res.json({ message: 'Verification email sent' });
});

// Backend: Verify token
app.get('/api/auth/verify-email', async (req, res) => {
    const { token } = req.query;

    const record = await db.verificationTokens.findOne({ token, type: 'email' });
    if (!record) {
        return res.status(404).json({ error: 'Invalid token' });
    }

    if (Date.now() > record.expires) {
        return res.status(400).json({ error: 'Token expired' });
    }

    // Mark user as verified
    await db.users.update(
        { email: record.email },
        { verified: true, verifiedAt: new Date() }
    );

    // Delete token
    await db.verificationTokens.delete({ token });

    res.json({ message: 'Email verified successfully' });
});
```

**Frontend Changes**:

```javascript
// Email verification page
async function verifyEmail(token) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-email?token=${token}`);

        if (!response.ok) {
            throw new Error('Verification failed');
        }

        showMessage('✅ Email verified! You can now login.', 'success');
        setTimeout(() => {
            window.location.href = '/portal';
        }, 2000);
    } catch (error) {
        showMessage('❌ Verification failed. Token may be invalid or expired.', 'error');
    }
}
```

**Tasks**:
- [ ] Create verification token system
- [ ] Implement email sending service (SendGrid/AWS SES)
- [ ] Create email templates
- [ ] Create verification page UI
- [ ] Add resend verification option
- [ ] Handle expired tokens gracefully
- [ ] Add verification status to user profile
- [ ] Restrict unverified user access
- [ ] Add tests for verification flow

**Acceptance Criteria**:
- Verification email sent on registration
- Email contains secure, unique token
- Token expires after 24 hours
- Users can resend verification email
- Unverified users have limited access
- Tests verify complete flow

---

### 2.2 Two-Factor Authentication (2FA)

**Current Issue**: No 2FA support

**Implementation**:

```javascript
// Backend: Enable 2FA
app.post('/api/auth/2fa/enable', authenticateJWT, async (req, res) => {
    const userId = req.user.id;

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
        name: `Aurigraph (${req.user.email})`,
        issuer: 'Aurigraph DLT'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret (encrypted)
    await db.users.update(
        { id: userId },
        {
            twoFactorSecret: encryptSecret(secret.base32),
            twoFactorEnabled: false // Not enabled until first verification
        }
    );

    res.json({
        secret: secret.base32,
        qrCode
    });
});

// Backend: Verify and activate 2FA
app.post('/api/auth/2fa/verify', authenticateJWT, async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;

    const user = await db.users.findOne({ id: userId });
    const secret = decryptSecret(user.twoFactorSecret);

    const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
    });

    if (!isValid) {
        return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    // Activate 2FA
    await db.users.update({ id: userId }, { twoFactorEnabled: true });

    res.json({ message: '2FA enabled successfully' });
});

// Backend: Login with 2FA
app.post('/api/auth/login', async (req, res) => {
    const { email, password, twoFactorToken } = req.body;

    // Verify password first
    const user = await verifyPassword(email, password);

    if (user.twoFactorEnabled) {
        if (!twoFactorToken) {
            return res.status(200).json({ requiresTwoFactor: true });
        }

        const secret = decryptSecret(user.twoFactorSecret);
        const isValid = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: twoFactorToken
        });

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }
    }

    // Generate token
    const token = generateJWT(user);
    res.json({ token, user });
});
```

**Frontend Changes**:

```javascript
// 2FA Setup UI
class TwoFactorSetup {
    async enable() {
        const response = await fetch(`${BACKEND_URL}/api/auth/2fa/enable`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const { secret, qrCode } = await response.json();

        // Show QR code to user
        showModal({
            title: 'Enable Two-Factor Authentication',
            content: `
                <p>Scan this QR code with your authenticator app:</p>
                <img src="${qrCode}" alt="QR Code" />
                <p>Or enter this code manually: <code>${secret}</code></p>
                <input type="text" id="2fa-code" placeholder="Enter 6-digit code" />
            `,
            onSubmit: async () => {
                const code = document.getElementById('2fa-code').value;
                await this.verify(code);
            }
        });
    }

    async verify(token) {
        const response = await fetch(`${BACKEND_URL}/api/auth/2fa/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            throw new Error('Invalid 2FA code');
        }

        showMessage('✅ 2FA enabled successfully!', 'success');
    }
}
```

**Tasks**:
- [ ] Implement TOTP generation (speakeasy library)
- [ ] Create QR code generation
- [ ] Build 2FA setup UI flow
- [ ] Add 2FA prompt to login flow
- [ ] Create backup codes system
- [ ] Add 2FA status to user profile
- [ ] Allow users to disable 2FA
- [ ] Add tests for 2FA flow
- [ ] Document 2FA setup instructions

**Acceptance Criteria**:
- Users can enable 2FA via settings
- QR code generated for authenticator apps
- 6-digit TOTP codes required at login
- Backup codes provided for recovery
- Users can disable 2FA with verification
- Tests verify complete 2FA flow

---

## 🔒 Sprint 3: Data Encryption & Advanced Features (Week 5-6)

**Goal**: Encrypt localStorage and add advanced security features
**Priority**: 🟡 MEDIUM
**Estimated Effort**: 30 hours

### 3.1 localStorage Encryption

**Current Issue**: User data stored unencrypted in localStorage

**Implementation**:

```javascript
// Encryption wrapper for localStorage
class SecureStorage {
    constructor() {
        this.masterKey = null;
    }

    async initialize() {
        // Generate or retrieve master key from Web Crypto API
        this.masterKey = await this.getMasterKey();
    }

    async getMasterKey() {
        const storedKey = sessionStorage.getItem('master_key');
        if (storedKey) {
            return await crypto.subtle.importKey(
                'jwk',
                JSON.parse(storedKey),
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        }

        // Generate new key
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        // Export and store
        const exportedKey = await crypto.subtle.exportKey('jwk', key);
        sessionStorage.setItem('master_key', JSON.stringify(exportedKey));

        return key;
    }

    async encrypt(data) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(JSON.stringify(data));

        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.masterKey,
            encodedData
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedData), iv.length);

        return btoa(String.fromCharCode(...combined));
    }

    async decrypt(encryptedString) {
        const combined = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            this.masterKey,
            data
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedData));
    }

    async setItem(key, value) {
        const encrypted = await this.encrypt(value);
        localStorage.setItem(key, encrypted);
    }

    async getItem(key) {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return await this.decrypt(encrypted);
    }

    removeItem(key) {
        localStorage.removeItem(key);
    }
}

// Usage
const secureStorage = new SecureStorage();
await secureStorage.initialize();

// Store encrypted data
await secureStorage.setItem('rbac_users', users);

// Retrieve encrypted data
const users = await secureStorage.getItem('rbac_users');
```

**Tasks**:
- [ ] Create SecureStorage wrapper class
- [ ] Implement AES-GCM encryption
- [ ] Update RBAC system to use SecureStorage
- [ ] Handle encryption key lifecycle
- [ ] Add fallback for browsers without Web Crypto API
- [ ] Migrate existing localStorage data
- [ ] Add tests for encryption/decryption
- [ ] Document encryption approach

**Acceptance Criteria**:
- All sensitive data encrypted in localStorage
- AES-256-GCM encryption used
- Encryption keys stored in sessionStorage
- Keys cleared on logout
- Tests verify encryption works correctly

---

### 3.2 Advanced Rate Limiting (IP-based)

**Current Issue**: Rate limiting only by email

**Implementation**:

```javascript
// Backend: IP-based rate limiting with Redis
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const loginLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:login:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.warn('Rate limit exceeded', {
            ip: req.ip,
            endpoint: req.path
        });

        res.status(429).json({
            error: 'Too many attempts',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
    // Login logic
});
```

**Tasks**:
- [ ] Set up Redis for distributed rate limiting
- [ ] Implement IP-based rate limiting middleware
- [ ] Add rate limit headers to responses
- [ ] Create rate limit monitoring dashboard
- [ ] Add CAPTCHA after multiple failed attempts
- [ ] Implement temporary IP bans
- [ ] Add tests for rate limiting
- [ ] Document rate limiting strategy

**Acceptance Criteria**:
- Rate limiting works across multiple servers
- IP addresses tracked accurately
- Rate limit info returned in headers
- Admin can view rate limit violations
- CAPTCHA shown after 3 failed attempts
- Tests verify IP-based limiting works

---

### 3.3 Session Management UI

**Current Issue**: No way to view/manage active sessions

**Implementation**:

```javascript
// Backend: Get user sessions
app.get('/api/auth/sessions', authenticateJWT, async (req, res) => {
    const userId = req.user.id;

    const sessions = await db.sessions.find({ userId }).sort({ lastActivity: -1 });

    res.json({
        sessions: sessions.map(s => ({
            id: s.id,
            device: s.userAgent,
            ip: s.ipAddress,
            location: s.location,
            lastActivity: s.lastActivity,
            createdAt: s.createdAt,
            isCurrent: s.id === req.session.id
        }))
    });
});

// Backend: Revoke session
app.delete('/api/auth/sessions/:sessionId', authenticateJWT, async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.params.sessionId;

    await db.sessions.delete({ id: sessionId, userId });

    res.json({ message: 'Session revoked' });
});
```

**Frontend UI**:

```javascript
// Session management panel
<div class="session-list">
    ${sessions.map(session => `
        <div class="session-item ${session.isCurrent ? 'current' : ''}">
            <div class="session-info">
                <div class="session-device">${session.device}</div>
                <div class="session-location">${session.location}</div>
                <div class="session-time">Last active: ${formatTime(session.lastActivity)}</div>
            </div>
            ${!session.isCurrent ? `
                <button onclick="revokeSession('${session.id}')">Revoke</button>
            ` : `
                <span class="current-badge">Current Session</span>
            `}
        </div>
    `).join('')}
</div>
```

**Tasks**:
- [ ] Create session storage in database
- [ ] Track device info and IP addresses
- [ ] Add geolocation lookup for IPs
- [ ] Build session list UI
- [ ] Implement session revocation
- [ ] Add "Revoke All Other Sessions" button
- [ ] Show session alerts for new devices
- [ ] Add tests for session management
- [ ] Document session management features

**Acceptance Criteria**:
- Users can view all active sessions
- Sessions show device, location, and time
- Users can revoke individual sessions
- Current session cannot be revoked
- New device logins send alerts
- Tests verify session management works

---

## 📊 Success Metrics

Track these metrics after each sprint:

### Security Metrics
- **Security Grade**: Target A (95/100)
- **Known Vulnerabilities**: Target 0 critical, 0 high
- **Authentication Failures**: <0.1% rate
- **Rate Limit Triggers**: <1% of requests

### User Experience Metrics
- **Guest Registration Rate**: >75%
- **Email Verification Rate**: >85%
- **2FA Adoption Rate**: >30%
- **Login Success Rate**: >98%

### Performance Metrics
- **Login Time**: <500ms
- **Registration Time**: <1s
- **Session Load Time**: <100ms
- **API Response Time**: <200ms

### Compliance Metrics
- **Password Strength**: >90% strong passwords
- **Session Timeout Compliance**: 100%
- **Audit Log Coverage**: 100% of sensitive actions
- **Data Encryption**: 100% of sensitive data

---

## 🎯 Roadmap Beyond Sprint 3

### Quarter 2: Enterprise Features

- **OAuth/SAML Integration** - SSO with Google, Microsoft, Okta
- **Role Customization** - Custom roles and permissions
- **Audit Logging** - Complete audit trail for compliance
- **API Keys** - Programmatic access to portal
- **Webhooks** - Event notifications

### Quarter 3: Advanced Security

- **Behavioral Analysis** - Detect suspicious activity patterns
- **Threat Intelligence** - Integration with threat feeds
- **Security Dashboard** - Real-time security monitoring
- **Compliance Reports** - Auto-generated compliance reports
- **Penetration Testing** - Regular security audits

### Quarter 4: Scale & Performance

- **Multi-Region Support** - Deploy across multiple regions
- **Redis Session Storage** - Distributed session management
- **CDN Integration** - Faster static asset delivery
- **Load Balancing** - High availability setup
- **Performance Optimization** - Sub-100ms response times

---

## 📋 Resource Requirements

### Development Resources
- **Backend Developer**: 2 FTE (full-time equivalent)
- **Frontend Developer**: 1 FTE
- **Security Engineer**: 0.5 FTE
- **QA Engineer**: 0.5 FTE

### Infrastructure Resources
- **Redis Server**: For rate limiting and sessions
- **PostgreSQL/MySQL**: For user database
- **Email Service**: SendGrid or AWS SES
- **CDN**: CloudFlare or AWS CloudFront
- **Monitoring**: Datadog or New Relic

### Budget Estimate
- **Development**: $60,000 (3 sprints)
- **Infrastructure**: $500/month
- **Third-party Services**: $200/month
- **Testing & QA**: $10,000
- **Total**: ~$70,000 + $700/month

---

## ✅ Definition of Done

For each enhancement to be considered complete:

- [ ] **Code Complete**: All planned features implemented
- [ ] **Tests Written**: 95% code coverage
- [ ] **Tests Passing**: All tests pass
- [ ] **Security Review**: No critical or high vulnerabilities
- [ ] **Performance Verified**: Meets performance targets
- [ ] **Documentation Updated**: All docs reflect changes
- [ ] **Code Reviewed**: PR approved by 2+ reviewers
- [ ] **QA Tested**: Manual testing completed
- [ ] **Deployed to Staging**: Working in staging environment
- [ ] **Deployed to Production**: Successfully deployed
- [ ] **Monitoring Set Up**: Metrics and alerts configured
- [ ] **User Acceptance**: Stakeholder approval received

---

## 🎉 Conclusion

This roadmap will elevate the RBAC system from **B+ (85/100)** to **A (95/100)** security grade over 3 sprints, adding enterprise-grade features while maintaining excellent user experience.

**Key Outcomes**:
- ✅ Backend authentication with JWT
- ✅ CSRF protection on all state changes
- ✅ Email verification system
- ✅ Two-factor authentication
- ✅ Encrypted localStorage
- ✅ Advanced rate limiting
- ✅ Session management UI

**Target Date**: Week of [6 weeks from now]
**Estimated Cost**: $70,000 + $700/month
**ROI**: Enterprise compliance, reduced security risk, improved user trust

---

**Plan Created**: October 12, 2025
**Created By**: Claude Code
**Status**: 📋 READY FOR REVIEW

---

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*

*Co-Authored-By: Claude <noreply@anthropic.com>*
