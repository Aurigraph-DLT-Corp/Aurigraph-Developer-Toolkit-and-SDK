/**
 * Aurigraph V11 Enterprise Portal - RBAC System v2 (Refactored)
 * Role-Based Access Control with Enhanced Security
 *
 * Version: 2.0.0
 * Date: October 12, 2025
 *
 * Improvements over v1:
 * - XSS protection with HTML sanitization
 * - Input validation (email, phone, text)
 * - Secure session ID generation
 * - Rate limiting for brute force protection
 * - Structured logging system
 * - Better error handling
 * - Code modularization
 * - Memory leak prevention
 */

'use strict';

// ========================================
// Utility Functions
// ========================================

/**
 * Logger with structured logging levels
 */
const Logger = {
    levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
    currentLevel: window.RBAC_DEBUG ? 3 : 1,

    log(level, message, data = null) {
        if (this.levels[level] <= this.currentLevel) {
            const timestamp = new Date().toISOString();
            const prefix = `[RBAC ${level}] ${timestamp}`;
            const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';

            if (data) {
                console[method](prefix, message, data);
            } else {
                console[method](prefix, message);
            }

            // Optional: Send to backend logging service
            if (window.RBAC_LOG_ENDPOINT && level === 'ERROR') {
                this.sendToBackend(level, message, data);
            }
        }
    },

    sendToBackend(level, message, data) {
        fetch(window.RBAC_LOG_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level, message, data, timestamp: new Date().toISOString() })
        }).catch(() => {}); // Silent fail for logging
    },

    error(message, data) { this.log('ERROR', message, data); },
    warn(message, data) { this.log('WARN', message, data); },
    info(message, data) { this.log('INFO', message, data); },
    debug(message, data) { this.log('DEBUG', message, data); }
};

/**
 * HTML Sanitization to prevent XSS
 */
const Sanitizer = {
    /**
     * Escape HTML special characters
     */
    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Strip all HTML tags
     */
    stripHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    },

    /**
     * Sanitize for safe display
     */
    sanitize(str) {
        return this.escapeHTML(this.stripHTML(str));
    },

    /**
     * Create safe text node
     */
    createTextNode(text) {
        return document.createTextNode(text || '');
    }
};

/**
 * Input Validation
 */
const Validator = {
    /**
     * Validate email format
     */
    email(email) {
        const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!re.test(email)) {
            throw new ValidationError('Invalid email format');
        }
        return email.toLowerCase().trim();
    },

    /**
     * Validate phone number (E.164 format)
     */
    phone(phone) {
        // Remove formatting characters
        const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
        const re = /^\+?[1-9]\d{1,14}$/;

        if (!re.test(cleaned)) {
            throw new ValidationError('Invalid phone number. Use international format: +1234567890');
        }
        return cleaned;
    },

    /**
     * Validate name (no special characters)
     */
    name(name) {
        if (typeof name !== 'string') {
            throw new ValidationError('Name must be a string');
        }

        const trimmed = name.trim();

        if (trimmed.length < 2 || trimmed.length > 100) {
            throw new ValidationError('Name must be between 2 and 100 characters');
        }

        // Allow letters, spaces, hyphens, apostrophes
        const re = /^[a-zA-Z\s\-']+$/;
        if (!re.test(trimmed)) {
            throw new ValidationError('Name contains invalid characters');
        }

        return trimmed;
    },

    /**
     * Validate company name
     */
    company(company) {
        if (typeof company !== 'string') {
            throw new ValidationError('Company must be a string');
        }

        const trimmed = company.trim();

        if (trimmed.length < 2 || trimmed.length > 200) {
            throw new ValidationError('Company name must be between 2 and 200 characters');
        }

        return trimmed;
    },

    /**
     * Validate generic text input
     */
    text(text, minLength = 0, maxLength = 1000) {
        if (typeof text !== 'string') {
            throw new ValidationError('Text must be a string');
        }

        const trimmed = text.trim();

        if (trimmed.length < minLength) {
            throw new ValidationError(`Text must be at least ${minLength} characters`);
        }

        if (trimmed.length > maxLength) {
            throw new ValidationError(`Text must be at most ${maxLength} characters`);
        }

        return trimmed;
    },

    /**
     * Validate country code
     */
    country(country) {
        const validCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'CN', 'IN', 'AU', 'BR', 'other'];
        if (!validCountries.includes(country)) {
            throw new ValidationError('Invalid country code');
        }
        return country;
    }
};

/**
 * Secure Cryptographic Functions
 */
const SecureCrypto = {
    /**
     * Generate secure random session ID
     */
    generateSessionId() {
        if (!window.crypto || !window.crypto.getRandomValues) {
            Logger.error('crypto.getRandomValues not available, falling back to less secure method');
            return 'session_' + Date.now() + '_' + Math.random().toString(36);
        }

        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        return 'session_' + hex;
    },

    /**
     * Generate secure user ID
     */
    generateUserId() {
        if (!window.crypto || !window.crypto.getRandomValues) {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        return 'user_' + hex;
    },

    /**
     * Simple hash function for passwords (client-side)
     * NOTE: In production, use proper password hashing on backend
     */
    async hashPassword(password) {
        if (!window.crypto || !window.crypto.subtle) {
            Logger.warn('crypto.subtle not available, password not hashed');
            return password; // Fallback - NOT SECURE
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            Logger.error('Password hashing failed', error);
            return password; // Fallback
        }
    }
};

/**
 * Rate Limiter for brute force protection
 */
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 60000) {
        this.attempts = new Map();
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    check(key) {
        const now = Date.now();
        const record = this.attempts.get(key) || { count: 0, firstAttempt: now };

        // Reset if window expired
        if (now - record.firstAttempt > this.windowMs) {
            record.count = 1;
            record.firstAttempt = now;
        } else {
            record.count++;
        }

        this.attempts.set(key, record);

        if (record.count > this.maxAttempts) {
            const remainingTime = Math.ceil((this.windowMs - (now - record.firstAttempt)) / 1000);
            throw new RateLimitError(`Too many attempts. Please wait ${remainingTime} seconds.`);
        }

        return true;
    }

    reset(key) {
        this.attempts.delete(key);
    }

    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.attempts.entries()) {
            if (now - record.firstAttempt > this.windowMs) {
                this.attempts.delete(key);
            }
        }
    }
}

/**
 * Custom Error Classes
 */
class RBACError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RBACError';
    }
}

class ValidationError extends RBACError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends RBACError {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends RBACError {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

class RateLimitError extends RBACError {
    constructor(message) {
        super(message);
        this.name = 'RateLimitError';
    }
}

// ========================================
// RBAC Configuration (same as v1)
// ========================================

const RBAC_CONFIG = {
    roles: {
        GUEST: {
            id: 'guest',
            name: 'Guest User',
            level: 0,
            description: 'Limited demo access with registration required',
            color: '#9E9E9E',
            icon: '👤'
        },
        USER: {
            id: 'user',
            name: 'Registered User',
            level: 1,
            description: 'Full feature access after email verification',
            color: '#2196F3',
            icon: '👨‍💼'
        },
        ADMIN: {
            id: 'admin',
            name: 'Administrator',
            level: 2,
            description: 'User management and system configuration',
            color: '#FF9800',
            icon: '👨‍💻'
        },
        SUPERADMIN: {
            id: 'superadmin',
            name: 'Super Administrator',
            level: 3,
            description: 'Full system access and RBAC management',
            color: '#F44336',
            icon: '👨‍🔧'
        }
    },

    features: {
        DASHBOARD: { id: 'dashboard', name: 'Dashboard', minLevel: 0 },
        BUSINESS_NODES: { id: 'business_nodes', name: 'Business Nodes', minLevel: 0 },
        ACTIVE_CONTRACTS: { id: 'active_contracts', name: 'ActiveContracts', minLevel: 0 },
        CHANNELS: { id: 'channels', name: 'Channel Management', minLevel: 1 },
        VALIDATORS: { id: 'validators', name: 'Validator Nodes', minLevel: 1 },
        SLIM_AGENTS: { id: 'slim_agents', name: 'Slim Agents', minLevel: 0 },
        ANALYTICS: { id: 'analytics', name: 'Analytics Dashboard', minLevel: 0 },
        CROSS_CHAIN: { id: 'cross_chain', name: 'Cross-Chain Bridge', minLevel: 1 },
        AI_OPTIMIZATION: { id: 'ai_optimization', name: 'AI Optimization', minLevel: 1 },
        QUANTUM_CRYPTO: { id: 'quantum_crypto', name: 'Quantum Cryptography', minLevel: 1 },
        HMS_INTEGRATION: { id: 'hms_integration', name: 'HMS Integration', minLevel: 1 },
        USER_MANAGEMENT: { id: 'user_management', name: 'User Management', minLevel: 2 },
        SYSTEM_CONFIG: { id: 'system_config', name: 'System Configuration', minLevel: 2 },
        AUDIT_LOGS: { id: 'audit_logs', name: 'Audit Logs', minLevel: 2 },
        RBAC_MANAGEMENT: { id: 'rbac_management', name: 'RBAC Management', minLevel: 3 }
    },

    permissions: {
        guest: [
            { feature: 'dashboard', actions: ['view'] },
            { feature: 'business_nodes', actions: ['view'] },
            { feature: 'active_contracts', actions: ['view'] },
            { feature: 'slim_agents', actions: ['view'] },
            { feature: 'analytics', actions: ['view'] }
        ],
        user: [
            { feature: 'dashboard', actions: ['view', 'create', 'edit', 'delete'] },
            { feature: 'business_nodes', actions: ['view', 'create', 'edit', 'delete', 'start', 'stop'] },
            { feature: 'active_contracts', actions: ['view', 'create', 'edit', 'delete', 'deploy'] },
            { feature: 'channels', actions: ['view', 'create', 'edit', 'delete'] },
            { feature: 'validators', actions: ['view', 'create', 'edit', 'delete'] },
            { feature: 'slim_agents', actions: ['view', 'create', 'edit', 'delete', 'deploy'] },
            { feature: 'analytics', actions: ['view', 'export'] },
            { feature: 'cross_chain', actions: ['view', 'create', 'transfer'] },
            { feature: 'ai_optimization', actions: ['view', 'configure'] },
            { feature: 'quantum_crypto', actions: ['view', 'use'] },
            { feature: 'hms_integration', actions: ['view', 'use'] }
        ],
        admin: [
            { feature: 'user_management', actions: ['view', 'create', 'edit', 'delete', 'approve', 'suspend'] },
            { feature: 'system_config', actions: ['view', 'edit'] },
            { feature: 'audit_logs', actions: ['view', 'export'] }
        ],
        superadmin: [
            { feature: 'rbac_management', actions: ['view', 'create', 'edit', 'delete'] }
        ]
    },

    demoLimits: {
        guest: {
            maxBusinessNodes: 2,
            maxActiveContracts: 3,
            maxSlimAgents: 2,
            sessionDuration: 3600000, // 1 hour
            features: ['view-only', 'limited-creation']
        },
        user: {
            maxBusinessNodes: 50,
            maxActiveContracts: 100,
            maxSlimAgents: 20,
            sessionDuration: 28800000, // 8 hours
            features: ['full-access']
        }
    }
};

// ========================================
// User Model (Enhanced)
// ========================================

class User {
    constructor(data) {
        this.id = data.id || SecureCrypto.generateUserId();
        this.role = data.role || 'guest';
        this.email = data.email || '';
        this.fullName = data.fullName || '';
        this.phone = data.phone || '';
        this.company = data.company || '';
        this.jobTitle = data.jobTitle || '';
        this.country = data.country || '';
        this.useCase = data.useCase || '';
        this.referralSource = data.referralSource || '';
        this.newsletterOptIn = data.newsletterOptIn || false;
        this.verified = data.verified || false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastLogin = data.lastLogin || null;
        this.loginCount = data.loginCount || 0;
        this.sessionId = data.sessionId || null;
        this.metadata = data.metadata || {};

        // Sanitize all text fields
        this.fullName = Sanitizer.sanitize(this.fullName);
        this.company = Sanitizer.sanitize(this.company);
        this.jobTitle = Sanitizer.sanitize(this.jobTitle);
        this.useCase = Sanitizer.sanitize(this.useCase);
    }

    toJSON() {
        return {
            id: this.id,
            role: this.role,
            email: this.email,
            fullName: this.fullName,
            phone: this.phone,
            company: this.company,
            jobTitle: this.jobTitle,
            country: this.country,
            useCase: this.useCase,
            referralSource: this.referralSource,
            newsletterOptIn: this.newsletterOptIn,
            verified: this.verified,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin,
            loginCount: this.loginCount,
            sessionId: this.sessionId,
            metadata: this.metadata
        };
    }
}

// ========================================
// RBAC Manager (Enhanced)
// ========================================

class RBACManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.sessions = {};
        this.rateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute

        this.init();

        // Cleanup rate limiter every 5 minutes
        setInterval(() => this.rateLimiter.cleanup(), 300000);
    }

    init() {
        try {
            this.users = this.loadUsers();
            this.sessions = this.loadSessions();
            this.initializeDefaultUsers();
            Logger.info('RBAC Manager initialized');
        } catch (error) {
            Logger.error('Failed to initialize RBAC Manager', error);
        }
    }

    // ===== Storage Methods (with error handling) =====

    loadUsers() {
        try {
            const stored = localStorage.getItem('aurigraph_users');
            if (stored) {
                const users = JSON.parse(stored);
                return users.map(u => new User(u));
            }
        } catch (error) {
            Logger.error('Failed to load users from storage', error);
        }
        return [];
    }

    saveUsers() {
        try {
            localStorage.setItem('aurigraph_users', JSON.stringify(this.users.map(u => u.toJSON())));
            Logger.debug('Users saved to storage');
        } catch (error) {
            Logger.error('Failed to save users to storage', error);
            throw new RBACError('Failed to save user data');
        }
    }

    loadSessions() {
        try {
            const stored = localStorage.getItem('aurigraph_sessions');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            Logger.error('Failed to load sessions from storage', error);
            return {};
        }
    }

    saveSessions() {
        try {
            localStorage.setItem('aurigraph_sessions', JSON.stringify(this.sessions));
            Logger.debug('Sessions saved to storage');
        } catch (error) {
            Logger.error('Failed to save sessions to storage', error);
        }
    }

    initializeDefaultUsers() {
        if (this.users.length === 0) {
            const admin = new User({
                email: 'admin@aurigraph.io',
                fullName: 'System Administrator',
                role: 'superadmin',
                verified: true,
                company: 'Aurigraph DLT',
                jobTitle: 'Administrator'
            });
            this.users.push(admin);
            this.saveUsers();
            Logger.info('Default admin user created');
        }
    }

    // ===== User Registration (Enhanced with Validation) =====

    registerGuest(contactData) {
        try {
            // Validate all required fields
            const validated = {
                fullName: Validator.name(contactData.fullName),
                email: Validator.email(contactData.email),
                phone: Validator.phone(contactData.phone),
                company: Validator.company(contactData.company),
                jobTitle: contactData.jobTitle ? Validator.text(contactData.jobTitle, 0, 100) : '',
                country: contactData.country ? Validator.country(contactData.country) : '',
                useCase: contactData.useCase ? Validator.text(contactData.useCase, 0, 500) : '',
                referralSource: contactData.referralSource ? Validator.text(contactData.referralSource, 0, 100) : '',
                newsletterOptIn: Boolean(contactData.newsletterOptIn)
            };

            // Check if email already exists
            if (this.users.find(u => u.email === validated.email)) {
                throw new ValidationError('Email already registered. Please login.');
            }

            // Create guest user
            const guest = new User({
                ...validated,
                role: 'guest',
                verified: false
            });

            this.users.push(guest);
            this.saveUsers();
            this.logGuestRegistration(guest);

            Logger.info('Guest user registered', { email: guest.email });
            return guest;

        } catch (error) {
            Logger.error('Guest registration failed', error);
            throw error;
        }
    }

    logGuestRegistration(guest) {
        try {
            const logs = JSON.parse(localStorage.getItem('aurigraph_guest_logs') || '[]');
            logs.push({
                userId: guest.id,
                email: guest.email,
                fullName: guest.fullName,
                phone: guest.phone,
                company: guest.company,
                jobTitle: guest.jobTitle,
                country: guest.country,
                useCase: guest.useCase,
                referralSource: guest.referralSource,
                newsletterOptIn: guest.newsletterOptIn,
                registeredAt: guest.createdAt,
                status: 'pending_followup'
            });
            localStorage.setItem('aurigraph_guest_logs', JSON.stringify(logs));
            this.sendGuestDataToBackend(guest);
        } catch (error) {
            Logger.error('Failed to log guest registration', error);
        }
    }

    sendGuestDataToBackend(guest) {
        if (window.AURIGRAPH_BACKEND_URL) {
            fetch(`${window.AURIGRAPH_BACKEND_URL}/api/guests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(guest.toJSON())
            }).catch(err => Logger.warn('Backend sync failed', err));
        }
    }

    // ===== Authentication (Enhanced with Rate Limiting) =====

    async login(email, password = null) {
        try {
            // Rate limiting
            this.rateLimiter.check(email);

            // Validate email
            email = Validator.email(email);

            const user = this.users.find(u => u.email === email);
            if (!user) {
                throw new AuthenticationError('User not found');
            }

            // TODO: In production, verify password hash here
            if (password) {
                const hashedPassword = await SecureCrypto.hashPassword(password);
                // Compare with stored hash
            }

            user.lastLogin = new Date().toISOString();
            user.loginCount++;

            const sessionId = this.createSession(user);
            user.sessionId = sessionId;

            this.currentUser = user;
            this.saveUsers();

            // Reset rate limiter on successful login
            this.rateLimiter.reset(email);

            Logger.info('User logged in', { email: user.email, role: user.role });
            return user;

        } catch (error) {
            Logger.error('Login failed', { email, error: error.message });
            throw error;
        }
    }

    logout() {
        if (this.currentUser) {
            Logger.info('User logged out', { email: this.currentUser.email });

            if (this.currentUser.sessionId) {
                delete this.sessions[this.currentUser.sessionId];
                this.saveSessions();
            }
            this.currentUser = null;
            localStorage.removeItem('aurigraph_current_session');
        }
    }

    createSession(user) {
        const sessionId = SecureCrypto.generateSessionId();
        const expiresAt = Date.now() + (RBAC_CONFIG.demoLimits[user.role]?.sessionDuration || 3600000);

        this.sessions[sessionId] = {
            userId: user.id,
            role: user.role,
            createdAt: Date.now(),
            expiresAt: expiresAt,
            active: true
        };

        this.saveSessions();
        localStorage.setItem('aurigraph_current_session', sessionId);

        Logger.debug('Session created', { sessionId, userId: user.id });
        return sessionId;
    }

    validateSession(sessionId) {
        const session = this.sessions[sessionId];
        if (!session) {
            Logger.debug('Session not found', { sessionId });
            return false;
        }

        if (Date.now() > session.expiresAt) {
            session.active = false;
            this.saveSessions();
            Logger.debug('Session expired', { sessionId });
            return false;
        }

        return session.active;
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;

        const sessionId = localStorage.getItem('aurigraph_current_session');
        if (sessionId && this.validateSession(sessionId)) {
            const session = this.sessions[sessionId];
            this.currentUser = this.users.find(u => u.id === session.userId);
            return this.currentUser;
        }

        return null;
    }

    // ===== Access Control (same as v1, with logging) =====

    hasAccess(feature, action = 'view') {
        try {
            const user = this.getCurrentUser();
            if (!user) return false;

            const roleConfig = RBAC_CONFIG.roles[user.role.toUpperCase()];
            if (!roleConfig) return false;

            const featureConfig = RBAC_CONFIG.features[feature.toUpperCase()];
            if (!featureConfig) return false;

            if (roleConfig.level < featureConfig.minLevel) return false;

            const permissions = this.getPermissions(user.role);
            const featurePerms = permissions.find(p => p.feature === feature);

            if (!featurePerms) return false;

            const hasAccess = featurePerms.actions.includes(action);

            Logger.debug('Access check', { user: user.email, feature, action, result: hasAccess });
            return hasAccess;

        } catch (error) {
            Logger.error('Access check failed', error);
            return false;
        }
    }

    getPermissions(role) {
        let allPerms = [];

        if (role === 'guest') {
            allPerms = [...RBAC_CONFIG.permissions.guest];
        } else if (role === 'user') {
            allPerms = [...RBAC_CONFIG.permissions.guest, ...RBAC_CONFIG.permissions.user];
        } else if (role === 'admin') {
            allPerms = [...RBAC_CONFIG.permissions.guest, ...RBAC_CONFIG.permissions.user, ...RBAC_CONFIG.permissions.admin];
        } else if (role === 'superadmin') {
            allPerms = [...RBAC_CONFIG.permissions.guest, ...RBAC_CONFIG.permissions.user, ...RBAC_CONFIG.permissions.admin, ...RBAC_CONFIG.permissions.superadmin];
        }

        return allPerms;
    }

    getDemoLimits() {
        const user = this.getCurrentUser();
        if (!user) return RBAC_CONFIG.demoLimits.guest;
        return RBAC_CONFIG.demoLimits[user.role] || RBAC_CONFIG.demoLimits.guest;
    }

    isGuest() {
        const user = this.getCurrentUser();
        return user && user.role === 'guest';
    }

    isAdmin() {
        const user = this.getCurrentUser();
        return user && (user.role === 'admin' || user.role === 'superadmin');
    }

    // ===== Admin Functions (with authorization checks) =====

    getAllUsers() {
        if (!this.isAdmin()) {
            throw new AuthorizationError('Admin access required');
        }
        return this.users.map(u => u.toJSON());
    }

    getGuestLogs() {
        if (!this.isAdmin()) {
            throw new AuthorizationError('Admin access required');
        }
        return JSON.parse(localStorage.getItem('aurigraph_guest_logs') || '[]');
    }

    updateUserRole(userId, newRole) {
        if (!this.isAdmin()) {
            throw new AuthorizationError('Admin access required');
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new RBACError('User not found');
        }

        user.role = newRole;
        this.saveUsers();

        Logger.info('User role updated', { userId, newRole });
        return user;
    }

    approveUser(userId) {
        if (!this.isAdmin()) {
            throw new AuthorizationError('Admin access required');
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new RBACError('User not found');
        }

        user.verified = true;
        user.role = 'user';
        this.saveUsers();

        Logger.info('User approved', { userId, email: user.email });
        return user;
    }

    deleteUser(userId) {
        if (!this.isAdmin()) {
            throw new AuthorizationError('Admin access required');
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new RBACError('User not found');
        }

        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();

        Logger.info('User deleted', { userId, email: user.email });
    }

    exportGuestData() {
        if (!this.isAdmin()) {
            throw new AuthorizationError('Admin access required');
        }

        const guests = this.getGuestLogs();
        const csv = this.convertToCSV(guests);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `aurigraph_guest_users_${Date.now()}.csv`;
        a.click();

        URL.revokeObjectURL(url);

        Logger.info('Guest data exported');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj =>
            Object.values(obj).map(val =>
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
        );

        return [headers, ...rows].join('\n');
    }
}

// ========================================
// Global RBAC Instance
// ========================================

window.RBACManager = RBACManager;
window.rbacManager = new RBACManager();
window.RBAC_CONFIG = RBAC_CONFIG;
window.Logger = Logger;
window.Sanitizer = Sanitizer;
window.Validator = Validator;

Logger.info('✅ Aurigraph RBAC System v2 (Refactored) loaded');
