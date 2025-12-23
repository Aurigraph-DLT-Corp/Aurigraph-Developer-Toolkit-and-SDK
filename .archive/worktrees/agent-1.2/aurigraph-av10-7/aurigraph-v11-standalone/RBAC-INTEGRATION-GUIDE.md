# Aurigraph V11 RBAC System - Integration Guide

**Complete Role-Based Access Control with Guest User Management**

---

## 📋 Overview

The Aurigraph RBAC system provides:
- ✅ 4-tier role hierarchy (Guest, User, Admin, SuperAdmin)
- ✅ Guest user registration with full contact collection
- ✅ Session management with auto-expiry
- ✅ Feature-level access control
- ✅ Admin panel for user management
- ✅ Demo mode with usage limits
- ✅ Follow-up tracking and analytics
- ✅ CSV export for lead generation

---

## 🎯 User Roles

### 1. Guest (Level 0)
- **Access**: View-only demo mode
- **Limits**:
  - Max 2 business nodes
  - Max 3 ActiveContracts
  - Max 2 slim agents
  - 1-hour session duration
- **Registration Required**: Full contact details
- **Features**: Dashboard, Business Nodes (view), ActiveContracts (view), Slim Agents (view), Analytics (limited)

### 2. User (Level 1)
- **Access**: Full feature access after email verification
- **Limits**:
  - Max 50 business nodes
  - Max 100 ActiveContracts
  - Max 20 slim agents
  - 8-hour session duration
- **Features**: All core features including cross-chain, AI optimization, quantum crypto, HMS integration

### 3. Admin (Level 2)
- **Access**: User management and system configuration
- **Features**: All user features + user management, system config, audit logs

### 4. SuperAdmin (Level 3)
- **Access**: Full system access including RBAC management
- **Features**: All features + RBAC configuration

---

## 🚀 Quick Start

### Step 1: Add Scripts to Your Portal

In your HTML `<head>` section, add:

```html
<!-- RBAC System -->
<script src="aurigraph-rbac-system.js"></script>
```

Before your closing `</body>` tag, add:

```html
<!-- RBAC UI (includes all modals and components) -->
<script src="aurigraph-rbac-ui.html"></script>
```

### Step 2: Initialize (Automatic)

The RBAC system auto-initializes on page load. No manual initialization required!

```javascript
// System automatically creates:
// - window.rbacManager (authentication manager)
// - window.rbacUI (UI controller)
// - window.RBAC_CONFIG (configuration)
```

### Step 3: Protect Features

Wrap your feature code with access checks:

```javascript
// Check access before showing feature
function showBusinessNodes() {
    if (!rbacUI.checkAccess('business_nodes', 'view')) {
        return; // Access denied modal shown automatically
    }

    // Your business nodes code here
    displayBusinessNodesTab();
}

// Check before allowing actions
function createBusinessNode() {
    if (!rbacUI.checkAccess('business_nodes', 'create')) {
        return;
    }

    // Create business node logic
}
```

---

## 🔐 Authentication API

### Register Guest User

```javascript
// Guest registration with full contact collection
const contactData = {
    fullName: 'John Doe',
    email: 'john@company.com',
    phone: '+1 555-123-4567',
    company: 'Acme Corp',
    jobTitle: 'Software Engineer',
    country: 'US',
    useCase: 'Building decentralized supply chain',
    referralSource: 'search',
    newsletterOptIn: true
};

try {
    const guest = rbacManager.registerGuest(contactData);
    console.log('Guest registered:', guest.id);

    // Automatically logged in after registration
    // Guest data saved to localStorage
    // Backend sync triggered (if configured)

} catch (error) {
    console.error('Registration failed:', error.message);
}
```

### Login

```javascript
// Login existing user
try {
    const user = rbacManager.login('john@company.com', 'password');
    console.log('Logged in:', user.fullName);

    // Session created automatically
    // User badge updated

} catch (error) {
    console.error('Login failed:', error.message);
}
```

### Logout

```javascript
// Logout current user
rbacManager.logout();

// Session destroyed
// localStorage cleared
// User redirected to guest registration
```

### Get Current User

```javascript
const user = rbacManager.getCurrentUser();

if (user) {
    console.log('Current user:', user.fullName);
    console.log('Role:', user.role);
    console.log('Email:', user.email);
} else {
    console.log('No user logged in');
}
```

---

## 🛡️ Access Control API

### Check Feature Access

```javascript
// Check if user has access to a feature
const hasAccess = rbacManager.hasAccess('business_nodes', 'create');

if (hasAccess) {
    // User can create business nodes
    showCreateButton();
} else {
    // User cannot create business nodes
    hideCreateButton();
}
```

### Available Features

```javascript
const features = [
    'dashboard',
    'business_nodes',
    'active_contracts',
    'channels',
    'validators',
    'slim_agents',
    'analytics',
    'cross_chain',
    'ai_optimization',
    'quantum_crypto',
    'hms_integration',
    'user_management',    // Admin only
    'system_config',      // Admin only
    'audit_logs',         // Admin only
    'rbac_management'     // SuperAdmin only
];
```

### Available Actions

```javascript
const actions = [
    'view',      // View/read access
    'create',    // Create new items
    'edit',      // Edit existing items
    'delete',    // Delete items
    'deploy',    // Deploy contracts/agents
    'start',     // Start nodes
    'stop',      // Stop nodes
    'configure', // Configure settings
    'export',    // Export data
    'approve',   // Approve users
    'suspend'    // Suspend users
];
```

### Check Role

```javascript
// Check if user is guest
if (rbacManager.isGuest()) {
    console.log('Guest user - show demo limitations');
}

// Check if user is admin
if (rbacManager.isAdmin()) {
    console.log('Admin user - show admin panel');
}
```

### Get Demo Limits

```javascript
const limits = rbacManager.getDemoLimits();

console.log('Max business nodes:', limits.maxBusinessNodes);
console.log('Max contracts:', limits.maxActiveContracts);
console.log('Max agents:', limits.maxSlimAgents);
console.log('Session duration:', limits.sessionDuration);
```

---

## 🎨 UI Components

### User Badge

Fixed badge showing current user (auto-managed):

```javascript
// Update badge after login/logout
rbacUI.updateUserBadge();
```

### Show Modals

```javascript
// Show guest registration
rbacUI.showGuestModal();

// Show login modal
rbacUI.showLoginModal();

// Show user menu
rbacUI.showUserMenu();

// Show admin panel (admin only)
rbacUI.showAdminPanel();

// Show access denied
rbacUI.showAccessDenied('Custom message');
```

### Demo Banner

Shows active demo limits for guests:

```javascript
// Show demo banner
rbacUI.showDemoBanner();
```

---

## 👨‍💻 Admin Functions

### Get All Users

```javascript
if (rbacManager.isAdmin()) {
    const users = rbacManager.getAllUsers();

    users.forEach(user => {
        console.log(`${user.fullName} - ${user.email} - ${user.role}`);
    });
}
```

### Get Guest Logs

```javascript
if (rbacManager.isAdmin()) {
    const guestLogs = rbacManager.getGuestLogs();

    guestLogs.forEach(log => {
        console.log(`Guest: ${log.fullName}`);
        console.log(`Company: ${log.company}`);
        console.log(`Use Case: ${log.useCase}`);
        console.log(`Status: ${log.status}`);
        console.log(`Registered: ${log.registeredAt}`);
        console.log('---');
    });
}
```

### Approve Guest User

```javascript
if (rbacManager.isAdmin()) {
    try {
        const user = rbacManager.approveUser('user_id_here');
        console.log('User approved:', user.email);
        // User role changed from 'guest' to 'user'
        // User now has full access

    } catch (error) {
        console.error('Approval failed:', error.message);
    }
}
```

### Change User Role

```javascript
if (rbacManager.isAdmin()) {
    try {
        const user = rbacManager.updateUserRole('user_id_here', 'admin');
        console.log('User role updated:', user.role);

    } catch (error) {
        console.error('Role update failed:', error.message);
    }
}
```

### Delete User

```javascript
if (rbacManager.isAdmin()) {
    try {
        rbacManager.deleteUser('user_id_here');
        console.log('User deleted');

    } catch (error) {
        console.error('Delete failed:', error.message);
    }
}
```

### Export Guest Data

```javascript
if (rbacManager.isAdmin()) {
    // Downloads CSV file with all guest user data
    rbacManager.exportGuestData();
}
```

---

## 📊 Data Storage

### LocalStorage Keys

```javascript
// User database
localStorage.getItem('aurigraph_users');

// Active sessions
localStorage.getItem('aurigraph_sessions');

// Current session ID
localStorage.getItem('aurigraph_current_session');

// Guest registration logs for follow-up
localStorage.getItem('aurigraph_guest_logs');
```

### Data Structure

```javascript
// User object
{
    id: 'user_1234567890_abc123',
    role: 'guest',
    email: 'john@company.com',
    fullName: 'John Doe',
    phone: '+1 555-123-4567',
    company: 'Acme Corp',
    jobTitle: 'Software Engineer',
    country: 'US',
    useCase: 'Building supply chain solution',
    referralSource: 'search',
    newsletterOptIn: true,
    verified: false,
    createdAt: '2025-10-12T10:30:00.000Z',
    lastLogin: '2025-10-12T10:30:00.000Z',
    loginCount: 1,
    sessionId: 'session_1234567890_xyz789',
    metadata: {}
}
```

---

## 🔌 Backend Integration (Optional)

### Send Guest Data to Backend

```javascript
// Configure backend URL (optional)
window.AURIGRAPH_BACKEND_URL = 'https://api.aurigraph.io';

// System automatically sends guest data to:
// POST ${AURIGRAPH_BACKEND_URL}/api/guests
// Body: User JSON object

// Backend should respond with 200 OK
```

### Example Backend Endpoint (Node.js/Express)

```javascript
app.post('/api/guests', async (req, res) => {
    const guestData = req.body;

    // Save to database
    await db.guests.insert(guestData);

    // Send welcome email
    await sendWelcomeEmail(guestData.email);

    // Add to CRM for follow-up
    await crm.addLead(guestData);

    // Trigger marketing automation
    if (guestData.newsletterOptIn) {
        await newsletter.subscribe(guestData.email);
    }

    res.status(200).json({ success: true });
});
```

---

## 🎯 Integration Examples

### Example 1: Protect Business Nodes Tab

```javascript
function showBusinessNodesTab() {
    // Check access
    if (!rbacManager.hasAccess('business_nodes', 'view')) {
        rbacUI.showAccessDenied('Business Nodes require user registration');
        return;
    }

    // Check demo limits for guests
    if (rbacManager.isGuest()) {
        const limits = rbacManager.getDemoLimits();
        const currentCount = getBusinessNodeCount();

        if (currentCount >= limits.maxBusinessNodes) {
            rbacUI.showAccessDenied(`Demo limit: Maximum ${limits.maxBusinessNodes} business nodes`);
            return;
        }
    }

    // Show business nodes interface
    document.getElementById('businessNodesTab').style.display = 'block';
}

function createBusinessNode() {
    // Check create permission
    if (!rbacManager.hasAccess('business_nodes', 'create')) {
        rbacUI.showAccessDenied('You need full access to create business nodes');
        return;
    }

    // Create node logic
    const node = createNode();
    console.log('Node created:', node.id);
}
```

### Example 2: Conditional UI Elements

```javascript
function renderNavigationMenu() {
    const menu = [];

    // Dashboard (all users)
    if (rbacManager.hasAccess('dashboard', 'view')) {
        menu.push({ name: 'Dashboard', icon: '📊' });
    }

    // Business Nodes (all users, guests view-only)
    if (rbacManager.hasAccess('business_nodes', 'view')) {
        menu.push({
            name: 'Business Nodes',
            icon: '🖥️',
            readonly: rbacManager.isGuest()
        });
    }

    // Channels (registered users only)
    if (rbacManager.hasAccess('channels', 'view')) {
        menu.push({ name: 'Channels', icon: '📡' });
    }

    // Admin Panel (admins only)
    if (rbacManager.isAdmin()) {
        menu.push({ name: 'Admin Panel', icon: '👨‍💻' });
    }

    return menu;
}
```

### Example 3: Feature Gating

```javascript
function deployActiveContract(contractId) {
    // Check deploy permission
    if (!rbacManager.hasAccess('active_contracts', 'deploy')) {
        // Show upgrade prompt
        const message = rbacManager.isGuest()
            ? 'Please register for full access to deploy contracts'
            : 'Contract deployment requires admin approval';

        rbacUI.showAccessDenied(message);
        return;
    }

    // Deploy contract
    deployContract(contractId);
}
```

### Example 4: Session Management

```javascript
// Check session on critical operations
function performCriticalOperation() {
    const sessionId = localStorage.getItem('aurigraph_current_session');

    if (!rbacManager.validateSession(sessionId)) {
        alert('Your session has expired. Please login again.');
        rbacManager.logout();
        rbacUI.showLoginModal();
        return;
    }

    // Perform operation
    executeCriticalOperation();
}

// Auto-refresh session
setInterval(() => {
    const sessionId = localStorage.getItem('aurigraph_current_session');
    if (!rbacManager.validateSession(sessionId)) {
        console.log('Session expired');
        rbacManager.logout();
    }
}, 60000); // Check every minute
```

---

## 🎨 Customization

### Customize Role Colors

Edit `aurigraph-rbac-system.js`:

```javascript
const RBAC_CONFIG = {
    roles: {
        GUEST: {
            // ... other properties
            color: '#YOUR_COLOR_HERE'
        },
        // ... other roles
    }
};
```

### Customize Demo Limits

Edit `aurigraph-rbac-system.js`:

```javascript
demoLimits: {
    guest: {
        maxBusinessNodes: 5,        // Increase from 2
        maxActiveContracts: 10,     // Increase from 3
        maxSlimAgents: 5,           // Increase from 2
        sessionDuration: 7200000,   // 2 hours instead of 1
        features: ['view-only', 'limited-creation']
    }
}
```

### Customize Registration Fields

Edit `aurigraph-rbac-ui.html` guest form section to add/remove fields.

---

## 📈 Analytics & Follow-up

### Export Guest Data

Admins can export all guest user data to CSV:

```javascript
// Click "Export Guest Data" in admin panel
// Or programmatically:
rbacManager.exportGuestData();
```

CSV includes:
- User ID
- Full Name
- Email
- Phone
- Company
- Job Title
- Country
- Use Case
- Referral Source
- Newsletter Opt-in
- Registration Date
- Follow-up Status

### Track User Activity

```javascript
// Log user actions
function logUserAction(action, details) {
    const user = rbacManager.getCurrentUser();
    if (!user) return;

    const log = {
        userId: user.id,
        userEmail: user.email,
        action: action,
        details: details,
        timestamp: new Date().toISOString()
    };

    // Save to localStorage
    const logs = JSON.parse(localStorage.getItem('aurigraph_activity_logs') || '[]');
    logs.push(log);
    localStorage.setItem('aurigraph_activity_logs', JSON.stringify(logs));

    // Send to backend
    if (window.AURIGRAPH_BACKEND_URL) {
        fetch(`${window.AURIGRAPH_BACKEND_URL}/api/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
        });
    }
}

// Usage
logUserAction('business_node_created', { nodeId: 'node123', capacity: 1000 });
logUserAction('contract_deployed', { contractId: 'contract456' });
```

---

## ✅ Testing Checklist

### Guest User Flow
- [ ] Landing on portal shows guest registration modal
- [ ] All required fields validated
- [ ] Guest registered and automatically logged in
- [ ] Demo banner shows with limits
- [ ] Guest can view features (read-only)
- [ ] Guest cannot create/edit (access denied shown)
- [ ] Guest data saved to localStorage
- [ ] Guest data logged for follow-up

### Registered User Flow
- [ ] User can login with email
- [ ] User has full feature access
- [ ] User can create/edit/delete
- [ ] User badge shows correct role
- [ ] Session persists across page refresh
- [ ] Session expires after timeout

### Admin Flow
- [ ] Admin can access admin panel
- [ ] Admin sees user statistics
- [ ] Admin can approve guest users
- [ ] Admin can change user roles
- [ ] Admin can delete users
- [ ] Admin can export guest data to CSV

### Access Control
- [ ] Guests cannot access admin features
- [ ] Users cannot access admin features
- [ ] All features check access before showing
- [ ] Access denied modal shows helpful message
- [ ] Demo limits enforced for guests

---

## 🚀 Production Deployment

### 1. Configure Backend Sync

```javascript
// In portal initialization
window.AURIGRAPH_BACKEND_URL = 'https://api.aurigraph.io';
```

### 2. Set up Email Verification

Implement email verification for new users:
- Send verification email on registration
- User must verify before upgrade to 'user' role

### 3. Implement Password Authentication

Currently demo uses email-only login. Add password:
- Hash passwords (bcrypt)
- Store securely
- Implement forgot password flow

### 4. Set up CRM Integration

Send guest data to your CRM:
- Salesforce
- HubSpot
- Zoho CRM
- Custom CRM

### 5. Configure Newsletter

If `newsletterOptIn` is true, add to mailing list:
- Mailchimp
- SendGrid
- ConvertKit
- Custom solution

### 6. Set up Analytics

Track user behavior:
- Google Analytics
- Mixpanel
- Amplitude
- Custom analytics

---

## 📞 Support

- **Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Email**: support@aurigraph.io
- **JIRA**: https://aurigraphdlt.atlassian.net/

---

**Version**: 1.0.0
**Last Updated**: October 12, 2025
**Author**: Aurigraph DLT Team

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*
