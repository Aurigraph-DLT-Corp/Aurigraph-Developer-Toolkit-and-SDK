/**
 * Aurigraph V11 Enterprise Portal - RBAC System
 * Role-Based Access Control with Guest User Management
 *
 * Features:
 * - Multi-role authentication (Guest, User, Admin, SuperAdmin)
 * - Guest user registration with full contact collection
 * - Session management with localStorage + optional backend
 * - Feature-level access control
 * - Admin panel for user management
 * - Demo mode for guest users
 * - Follow-up tracking and analytics
 */

// ========================================
// RBAC Configuration
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
        // Core Features
        DASHBOARD: { id: 'dashboard', name: 'Dashboard', minLevel: 0 },
        BUSINESS_NODES: { id: 'business_nodes', name: 'Business Nodes', minLevel: 0 },
        ACTIVE_CONTRACTS: { id: 'active_contracts', name: 'ActiveContracts', minLevel: 0 },
        CHANNELS: { id: 'channels', name: 'Channel Management', minLevel: 1 },
        VALIDATORS: { id: 'validators', name: 'Validator Nodes', minLevel: 1 },
        SLIM_AGENTS: { id: 'slim_agents', name: 'Slim Agents', minLevel: 0 },
        ANALYTICS: { id: 'analytics', name: 'Analytics Dashboard', minLevel: 0 },

        // Advanced Features
        CROSS_CHAIN: { id: 'cross_chain', name: 'Cross-Chain Bridge', minLevel: 1 },
        AI_OPTIMIZATION: { id: 'ai_optimization', name: 'AI Optimization', minLevel: 1 },
        QUANTUM_CRYPTO: { id: 'quantum_crypto', name: 'Quantum Cryptography', minLevel: 1 },
        HMS_INTEGRATION: { id: 'hms_integration', name: 'HMS Integration', minLevel: 1 },

        // Admin Features
        USER_MANAGEMENT: { id: 'user_management', name: 'User Management', minLevel: 2 },
        SYSTEM_CONFIG: { id: 'system_config', name: 'System Configuration', minLevel: 2 },
        AUDIT_LOGS: { id: 'audit_logs', name: 'Audit Logs', minLevel: 2 },
        RBAC_MANAGEMENT: { id: 'rbac_management', name: 'RBAC Management', minLevel: 3 }
    },

    permissions: {
        // Guest permissions (view-only demo)
        guest: [
            { feature: 'dashboard', actions: ['view'] },
            { feature: 'business_nodes', actions: ['view'] },
            { feature: 'active_contracts', actions: ['view'] },
            { feature: 'slim_agents', actions: ['view'] },
            { feature: 'analytics', actions: ['view'] }
        ],

        // User permissions (full access to core features)
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

        // Admin permissions (adds user management)
        admin: [
            { feature: 'user_management', actions: ['view', 'create', 'edit', 'delete', 'approve', 'suspend'] },
            { feature: 'system_config', actions: ['view', 'edit'] },
            { feature: 'audit_logs', actions: ['view', 'export'] }
        ],

        // SuperAdmin permissions (full system access)
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
// User Model
// ========================================

class User {
    constructor(data) {
        this.id = data.id || this.generateUserId();
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
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
// RBAC Manager
// ========================================

class RBACManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.sessions = this.loadSessions();
        this.initializeDefaultUsers();
    }

    // ===== User Management =====

    loadUsers() {
        const stored = localStorage.getItem('aurigraph_users');
        if (stored) {
            const users = JSON.parse(stored);
            return users.map(u => new User(u));
        }
        return [];
    }

    saveUsers() {
        localStorage.setItem('aurigraph_users', JSON.stringify(this.users.map(u => u.toJSON())));
    }

    loadSessions() {
        const stored = localStorage.getItem('aurigraph_sessions');
        return stored ? JSON.parse(stored) : {};
    }

    saveSessions() {
        localStorage.setItem('aurigraph_sessions', JSON.stringify(this.sessions));
    }

    initializeDefaultUsers() {
        // Create default admin if no users exist
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
        }
    }

    registerGuest(contactData) {
        // Validate required fields
        const required = ['fullName', 'email', 'phone', 'company'];
        for (const field of required) {
            if (!contactData[field] || contactData[field].trim() === '') {
                throw new Error(`${field} is required`);
            }
        }

        // Check if email already exists
        if (this.users.find(u => u.email === contactData.email)) {
            throw new Error('Email already registered. Please login.');
        }

        // Create guest user
        const guest = new User({
            ...contactData,
            role: 'guest',
            verified: false
        });

        this.users.push(guest);
        this.saveUsers();

        // Log guest registration for follow-up
        this.logGuestRegistration(guest);

        return guest;
    }

    logGuestRegistration(guest) {
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

        // Send to backend if available
        this.sendGuestDataToBackend(guest);
    }

    sendGuestDataToBackend(guest) {
        // Backend integration (optional)
        if (window.AURIGRAPH_BACKEND_URL) {
            fetch(`${window.AURIGRAPH_BACKEND_URL}/api/guests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(guest.toJSON())
            }).catch(err => console.log('Backend sync failed:', err));
        }
    }

    login(email, password = null) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            throw new Error('User not found');
        }

        // For demo, skip password check for guests
        // In production, implement proper password authentication

        user.lastLogin = new Date().toISOString();
        user.loginCount++;

        const sessionId = this.createSession(user);
        user.sessionId = sessionId;

        this.currentUser = user;
        this.saveUsers();

        return user;
    }

    logout() {
        if (this.currentUser && this.currentUser.sessionId) {
            delete this.sessions[this.currentUser.sessionId];
            this.saveSessions();
        }
        this.currentUser = null;
        localStorage.removeItem('aurigraph_current_session');
    }

    createSession(user) {
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

        return sessionId;
    }

    validateSession(sessionId) {
        const session = this.sessions[sessionId];
        if (!session) return false;
        if (Date.now() > session.expiresAt) {
            session.active = false;
            this.saveSessions();
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

    // ===== Access Control =====

    hasAccess(feature, action = 'view') {
        const user = this.getCurrentUser();
        if (!user) return false;

        const roleConfig = RBAC_CONFIG.roles[user.role.toUpperCase()];
        if (!roleConfig) return false;

        const featureConfig = RBAC_CONFIG.features[feature.toUpperCase()];
        if (!featureConfig) return false;

        // Check minimum level
        if (roleConfig.level < featureConfig.minLevel) return false;

        // Check specific permissions
        const permissions = this.getPermissions(user.role);
        const featurePerms = permissions.find(p => p.feature === feature);

        if (!featurePerms) return false;
        return featurePerms.actions.includes(action);
    }

    getPermissions(role) {
        let allPerms = [];

        // Accumulate permissions from lower roles
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

    // ===== Admin Functions =====

    getAllUsers() {
        return this.users.map(u => u.toJSON());
    }

    getGuestLogs() {
        return JSON.parse(localStorage.getItem('aurigraph_guest_logs') || '[]');
    }

    updateUserRole(userId, newRole) {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized: Admin access required');
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.role = newRole;
        this.saveUsers();

        return user;
    }

    approveUser(userId) {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized: Admin access required');
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.verified = true;
        user.role = 'user'; // Promote guest to user
        this.saveUsers();

        return user;
    }

    deleteUser(userId) {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized: Admin access required');
        }

        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();
    }

    exportGuestData() {
        if (!this.isAdmin()) {
            throw new Error('Unauthorized: Admin access required');
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

console.log('✅ Aurigraph RBAC System loaded');
