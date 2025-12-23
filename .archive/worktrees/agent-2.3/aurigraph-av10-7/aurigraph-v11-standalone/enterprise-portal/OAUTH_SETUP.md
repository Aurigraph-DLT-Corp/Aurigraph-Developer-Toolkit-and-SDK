# OAuth 2.0 Integration with Keycloak - Enterprise Portal V4.3.2

## Overview

This document outlines the OAuth 2.0 / OpenID Connect integration between the Aurigraph Enterprise Portal and Keycloak (iam2.aurigraph.io).

**Status**: Configuration Ready - Implementation Pending
**Created**: October 19, 2025
**Keycloak Server**: https://iam2.aurigraph.io/

---

## Keycloak Configuration

### Server Details
- **Keycloak URL**: https://iam2.aurigraph.io/
- **Admin Console**: https://iam2.aurigraph.io/admin/
- **Admin Username**: Awdadmin
- **Admin Password**: See `doc/Credentials.md`

### Supported Realms
1. **AWD** (Primary realm for Enterprise Portal)
2. **AurCarbonTrace** (Carbon tracking applications)
3. **AurHydroPulse** (Hydro monitoring applications)

---

## Client Configuration

### Step 1: Create Keycloak Client for Enterprise Portal

1. **Access Keycloak Admin Console**:
   ```bash
   https://iam2.aurigraph.io/admin/master/console/
   ```

2. **Create New Client**:
   - Navigate to: Clients → Create Client
   - **Client ID**: `enterprise-portal`
   - **Client Protocol**: `openid-connect`
   - **Root URL**: `https://dlt.aurigraph.io`

3. **Client Settings**:
   ```json
   {
     "clientId": "enterprise-portal",
     "name": "Aurigraph Enterprise Portal",
     "description": "Enterprise Portal V4.3.2 - DLT Management Dashboard",
     "enabled": true,
     "clientAuthenticatorType": "client-secret",
     "redirectUris": [
       "https://dlt.aurigraph.io/*",
       "https://dlt.aurigraph.io/callback",
       "http://localhost:5173/*",
       "http://localhost:5173/callback"
     ],
     "webOrigins": [
       "https://dlt.aurigraph.io",
       "http://localhost:5173"
     ],
     "publicClient": false,
     "protocol": "openid-connect",
     "standardFlowEnabled": true,
     "implicitFlowEnabled": false,
     "directAccessGrantsEnabled": true,
     "serviceAccountsEnabled": true
   }
   ```

4. **Save and Get Client Secret**:
   - After creating, go to **Credentials** tab
   - Copy the **Client Secret** (will be needed for `.env` configuration)

---

## Frontend Integration (React)

### Step 1: Install Dependencies

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
npm install keycloak-js @react-keycloak/web
```

### Step 2: Create Keycloak Configuration

Create `src/keycloak.ts`:

```typescript
import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloak = new Keycloak({
  url: 'https://iam2.aurigraph.io/',
  realm: 'AWD',
  clientId: 'enterprise-portal',
});

export default keycloak;
```

### Step 3: Create Environment Variables

Create `.env.production`:

```bash
VITE_KEYCLOAK_URL=https://iam2.aurigraph.io/
VITE_KEYCLOAK_REALM=AWD
VITE_KEYCLOAK_CLIENT_ID=enterprise-portal
VITE_API_BASE_URL=https://dlt.aurigraph.io/api/v11
```

Create `.env.development`:

```bash
VITE_KEYCLOAK_URL=https://iam2.aurigraph.io/
VITE_KEYCLOAK_REALM=AWD
VITE_KEYCLOAK_CLIENT_ID=enterprise-portal
VITE_API_BASE_URL=http://localhost:9003/api/v11
```

### Step 4: Update Main App Component

Update `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';
import App from './App';
import './index.css';

const eventLogger = (event: unknown, error: unknown) => {
  console.log('Keycloak event:', event, error);
};

const tokenLogger = (tokens: unknown) => {
  console.log('Keycloak tokens:', tokens);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      }}
      onEvent={eventLogger}
      onTokens={tokenLogger}
    >
      <App />
    </ReactKeycloakProvider>
  </React.StrictMode>
);
```

### Step 5: Create Authentication Context

Create `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  token: string | undefined;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      keycloak.loadUserProfile().then((profile) => {
        setUser(profile);
      });
    }
  }, [initialized, keycloak.authenticated]);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const hasRole = (role: string): boolean => {
    return keycloak.hasRealmRole(role) || keycloak.hasResourceRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!keycloak.authenticated,
        user,
        token: keycloak.token,
        login,
        logout,
        hasRole,
      }}
    >
      {initialized ? children : <div>Loading authentication...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Step 6: Update API Service to Include Auth Token

Update `src/services/api.ts`:

```typescript
import axios from 'axios';
import { keycloak } from '../keycloak';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9003/api/v11';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config) => {
    if (keycloak.token) {
      // Update token if it's about to expire
      if (keycloak.isTokenExpired(5)) {
        try {
          await keycloak.updateToken(5);
        } catch (error) {
          keycloak.login();
          return Promise.reject(error);
        }
      }
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      keycloak.login();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Backend Integration (Quarkus)

### Step 1: Add Quarkus OIDC Extension

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:add-extension -Dextensions="oidc,resteasy-reactive-jackson"
```

### Step 2: Configure application.properties

Add to `src/main/resources/application.properties`:

```properties
# OIDC Configuration
quarkus.oidc.auth-server-url=https://iam2.aurigraph.io/realms/AWD
quarkus.oidc.client-id=enterprise-portal
quarkus.oidc.credentials.secret=${KEYCLOAK_CLIENT_SECRET}
quarkus.oidc.tls.verification=none

# CORS Configuration
quarkus.http.cors=true
quarkus.http.cors.origins=https://dlt.aurigraph.io,http://localhost:5173
quarkus.http.cors.headers=accept,authorization,content-type,x-requested-with
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.exposed-headers=Content-Disposition
quarkus.http.cors.access-control-max-age=24H
quarkus.http.cors.access-control-allow-credentials=true

# Security
quarkus.http.auth.permission.authenticated.paths=/*
quarkus.http.auth.permission.authenticated.policy=authenticated
quarkus.http.auth.permission.public.paths=/api/v11/health,/q/health
quarkus.http.auth.permission.public.policy=permit
```

### Step 3: Protect Endpoints with @RolesAllowed

Update `AurigraphResource.java`:

```java
import jakarta.annotation.security.RolesAllowed;
import jakarta.annotation.security.PermitAll;
import org.eclipse.microprofile.jwt.JsonWebToken;
import jakarta.inject.Inject;

@Path("/api/v11")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AurigraphResource {

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/health")
    @PermitAll
    public Response health() {
        // Public endpoint - no auth required
        return Response.ok(new HealthResponse()).build();
    }

    @GET
    @Path("/stats")
    @RolesAllowed({"user", "admin"})
    public Response getStats() {
        String username = jwt.getName();
        // Protected endpoint - requires authentication
        return Response.ok(new StatsResponse()).build();
    }

    @POST
    @Path("/admin/config")
    @RolesAllowed("admin")
    public Response updateConfig() {
        // Admin-only endpoint
        return Response.ok().build();
    }
}
```

---

## Keycloak Realm Setup

### Create Roles

1. Navigate to **Realm Settings → Roles**
2. Create the following roles:
   - `admin` - Full access to all features
   - `user` - Standard user access
   - `viewer` - Read-only access
   - `operator` - Node management permissions

### Create Users

1. Navigate to **Users → Add User**
2. Create test users with appropriate roles

Example users:
```
Username: admin@aurigraph.io
Role: admin
Email: admin@aurigraph.io

Username: operator@aurigraph.io
Role: operator
Email: operator@aurigraph.io
```

### Configure Role Mappers

1. Navigate to **Clients → enterprise-portal → Client Scopes**
2. Add role mappers to include roles in JWT token

---

## Testing OAuth Integration

### Test 1: Login Flow

```bash
# 1. Access portal
open https://dlt.aurigraph.io

# 2. Should redirect to Keycloak login
# https://iam2.aurigraph.io/realms/AWD/protocol/openid-connect/auth

# 3. After login, redirects back to portal with token
```

### Test 2: API Calls with Token

```javascript
// In browser console after login
const token = keycloak.token;
console.log('Token:', token);

fetch('https://dlt.aurigraph.io/api/v11/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('API Response:', data));
```

### Test 3: Role-Based Access

```typescript
// In React component
import { useAuth } from './contexts/AuthContext';

function AdminPanel() {
  const { hasRole } = useAuth();

  if (!hasRole('admin')) {
    return <div>Access Denied - Admin role required</div>;
  }

  return <div>Admin Panel</div>;
}
```

---

## Security Best Practices

### Token Management
- ✅ Use PKCE flow for browser-based authentication
- ✅ Refresh tokens before expiration (default: 5 minutes)
- ✅ Store tokens securely (memory only, never localStorage)
- ✅ Implement proper logout (clear all tokens)

### CORS Configuration
- ✅ Whitelist specific origins (not wildcard *)
- ✅ Include credentials in CORS requests
- ✅ Restrict allowed methods and headers

### HTTPS Only
- ✅ All OAuth flows must use HTTPS
- ✅ No exceptions for production

---

## Deployment Checklist

### Frontend
- [ ] Install keycloak-js and @react-keycloak/web
- [ ] Create keycloak.ts configuration
- [ ] Update main.tsx with ReactKeycloakProvider
- [ ] Create AuthContext for authentication state
- [ ] Update API service with token interceptor
- [ ] Add .env files with Keycloak configuration
- [ ] Build and deploy updated portal

### Backend
- [ ] Add quarkus-oidc extension
- [ ] Configure application.properties with OIDC settings
- [ ] Set KEYCLOAK_CLIENT_SECRET environment variable
- [ ] Add @RolesAllowed annotations to endpoints
- [ ] Test JWT token validation
- [ ] Deploy updated backend

### Keycloak
- [ ] Create enterprise-portal client in AWD realm
- [ ] Configure redirect URIs and web origins
- [ ] Get client secret and store securely
- [ ] Create roles (admin, user, viewer, operator)
- [ ] Create test users with appropriate roles
- [ ] Configure role mappers for JWT

### Testing
- [ ] Test login/logout flow
- [ ] Verify token refresh works
- [ ] Test role-based access control
- [ ] Verify API calls include Bearer token
- [ ] Test CORS configuration
- [ ] Verify HTTPS-only enforcement

---

## Environment Variables

### Production Server (.env.production)
```bash
VITE_KEYCLOAK_URL=https://iam2.aurigraph.io/
VITE_KEYCLOAK_REALM=AWD
VITE_KEYCLOAK_CLIENT_ID=enterprise-portal
VITE_API_BASE_URL=https://dlt.aurigraph.io/api/v11

# Backend
KEYCLOAK_CLIENT_SECRET=<obtain from Keycloak admin console>
```

### Development (.env.development)
```bash
VITE_KEYCLOAK_URL=https://iam2.aurigraph.io/
VITE_KEYCLOAK_REALM=AWD
VITE_KEYCLOAK_CLIENT_ID=enterprise-portal
VITE_API_BASE_URL=http://localhost:9003/api/v11

# Backend
KEYCLOAK_CLIENT_SECRET=<obtain from Keycloak admin console>
```

---

## Troubleshooting

### Issue: Redirect loop after login
**Solution**: Check redirect URIs in Keycloak client configuration. Must match exactly.

### Issue: CORS errors
**Solution**: Verify web origins in Keycloak and CORS settings in Quarkus application.properties

### Issue: Token validation fails
**Solution**: Check auth-server-url in application.properties. Must be the correct realm URL.

### Issue: Roles not in JWT token
**Solution**: Configure client scope mappers to include realm/client roles in token

---

## Next Steps

1. **Phase 1: Keycloak Setup** (1-2 hours)
   - Create client in AWD realm
   - Configure roles and users
   - Test admin console access

2. **Phase 2: Frontend Integration** (2-3 hours)
   - Install dependencies
   - Implement authentication context
   - Update API service
   - Test login/logout flow

3. **Phase 3: Backend Integration** (2-3 hours)
   - Add OIDC extension
   - Configure endpoint security
   - Test JWT validation
   - Deploy to production

4. **Phase 4: Testing & Documentation** (1-2 hours)
   - Comprehensive testing
   - Update user documentation
   - Create admin guide

**Total Estimated Time**: 6-10 hours

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Status**: Ready for Implementation

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
