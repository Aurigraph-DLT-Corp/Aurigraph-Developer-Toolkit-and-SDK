# Enterprise Portal v5.0+ Execution Guide

**Quick Reference**: [SPARC-ENTERPRISE-PORTAL-PLAN.md](./SPARC-ENTERPRISE-PORTAL-PLAN.md)

---

## 🚀 Quick Start Commands

### Development Setup
```bash
# Clone and install
cd enterprise-portal/enterprise-portal/frontend
npm install

# Development server (port 3000 locally, aurigraph.io in production)
npm run dev

# Build for production
npm run build

# Run tests
npm run test
npm run test:coverage

# E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

### Docker Deployment
```bash
# Build Docker image
docker build -t aurigraph-portal:v5.0 .

# Run container locally
docker run -p 3000:3000 \
  -e API_BASE_URL=http://localhost:9003 \
  aurigraph-portal:v5.0

# Production deployment
docker push aurigraph-portal:v5.0
docker-compose -f docker-compose.production.yml up -d
```

### Domain Configuration
```bash
# Update environment for domain separation
# .env.production
API_BASE_URL=https://dlt.aurigraph.io/api/v11
PORTAL_URL=https://aurigraph.io
GRAPHQL_ENDPOINT=https://dlt.aurigraph.io/graphql
WEBSOCKET_URL=wss://dlt.aurigraph.io/ws

# .env.staging
API_BASE_URL=https://staging-dlt.aurigraph.io/api/v11
PORTAL_URL=https://staging.aurigraph.io
```

---

## 📋 Phase Breakdown with File Locations

### Phase 1: Foundation & URL Separation (Days 1-5)

#### 1.1 DNS & Deployment Configuration

**Current Structure**:
```
enterprise-portal/
├── deploy-https.sh          ← Update with new domain
├── deploy-https-auto.sh     ← Update with new domain
├── deploy-portal.sh         ← Update with new domain
└── enterprise-portal/frontend/
    └── .env.production      ← Set API_BASE_URL
```

**File Updates Needed**:
1. **enterprise-portal/deploy-https.sh**
   - Update domain from dlt.aurigraph.io to aurigraph.io
   - Keep dlt.aurigraph.io for V11 platform

2. **enterprise-portal/enterprise-portal/frontend/.env.production**
   ```
   VITE_API_BASE_URL=https://dlt.aurigraph.io/api/v11
   VITE_GRAPHQL_ENDPOINT=https://dlt.aurigraph.io/graphql
   VITE_WS_ENDPOINT=wss://dlt.aurigraph.io/ws
   VITE_PORTAL_URL=https://aurigraph.io
   ```

3. **enterprise-portal/enterprise-portal/frontend/vite.config.ts**
   - Update proxy targets if using dev server

**Nginx Configuration** (new file: `nginx.conf`):
```nginx
server {
    listen 443 ssl http2;
    server_name aurigraph.io;

    # Portal frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    # V11 platform
    location /api/ {
        proxy_pass http://localhost:9003;
    }

    location /graphql {
        proxy_pass http://localhost:9003;
    }

    location /ws {
        proxy_pass ws://localhost:9003;
    }
}
```

#### 1.2 Portal Domain Migration

**Key Files to Update**:

1. **src/config/api.ts** (Create if not exists)
   ```typescript
   // Define API endpoints for domain separation
   export const API_CONFIG = {
     // V11 Platform API (dlt.aurigraph.io)
     baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:9003',
     graphqlEndpoint: process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:9003/graphql',
     wsEndpoint: process.env.VITE_WS_ENDPOINT || 'ws://localhost:9003/ws',

     // Portal URLs (aurigraph.io)
     portalURL: process.env.VITE_PORTAL_URL || 'http://localhost:3000',

     // Timeouts
     timeout: 30000,
     retryAttempts: 3,
   };
   ```

2. **src/services/V11BackendService.ts**
   - Update to use API_CONFIG.baseURL
   - Implement error handling for CORS issues
   - Add retry logic for failed requests

3. **vite.config.ts** - Update proxy configuration:
   ```typescript
   export default defineConfig({
     server: {
       proxy: {
         '/api/v11': {
           target: 'http://localhost:9003',
           changeOrigin: true,
           rewrite: (path) => path,
         },
         '/graphql': {
           target: 'http://localhost:9003',
           changeOrigin: true,
         },
       },
     },
   });
   ```

#### 1.3 Security Headers & HTTPS

**Files to Create/Update**:

1. **src/utils/securityHeaders.ts**
   ```typescript
   // Security headers configuration
   export const securityHeaders = {
     'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
     'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
     'X-Content-Type-Options': 'nosniff',
     'X-Frame-Options': 'DENY',
     'X-XSS-Protection': '1; mode=block',
   };
   ```

2. **nginx.conf** - Add security headers:
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-Frame-Options "DENY" always;
   ```

---

### Phase 2: Feature Enhancement (Days 6-12)

#### 2.1 V11 Backend Integration

**New Files to Create**:

1. **src/hooks/useGraphQLSubscription.ts**
   ```typescript
   // Custom hook for GraphQL subscriptions
   export function useGraphQLSubscription(query: string, variables?: Record<string, any>) {
     const [data, setData] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       // WebSocket subscription logic
     }, [query, variables]);

     return { data, loading, error };
   }
   ```

2. **src/components/dashboard/TransactionMonitor.tsx**
   ```typescript
   // Real-time transaction monitoring
   export const TransactionMonitor: React.FC = () => {
     const { data: transactions, loading } = useGraphQLSubscription(
       `subscription {
          transactionAdded {
            id
            status
            timestamp
          }
        }`
     );

     return (
       // Component implementation
     );
   };
   ```

3. **src/components/dashboard/ValidatorStatus.tsx**
4. **src/components/dashboard/ConsensusMetrics.tsx**

**Updated Files**:

1. **src/services/V11BackendService.ts**
   - Add GraphQL query/mutation methods
   - Add subscription manager
   - Add WebSocket connection handling

#### 2.2 RBAC Implementation

**New Store Files**:

1. **src/store/authSlice.ts**
   ```typescript
   // Enhanced with RBAC
   export const authSlice = createSlice({
     name: 'auth',
     initialState: {
       user: null,
       roles: [],
       permissions: [],
       token: null,
     },
     reducers: {
       setUser: (state, action) => { /* ... */ },
       setRoles: (state, action) => { /* ... */ },
       setPermissions: (state, action) => { /* ... */ },
     },
   });
   ```

2. **src/store/rbacSlice.ts**
   ```typescript
   // RBAC configuration
   export const rbacSlice = createSlice({
     name: 'rbac',
     initialState: {
       roles: {},  // Role definitions
       permissions: {},  // Permission definitions
     },
   });
   ```

**New Components**:

1. **src/components/admin/UserManagement.tsx**
2. **src/components/admin/RoleManagement.tsx**
3. **src/components/common/PermissionGate.tsx**
   ```typescript
   // Render component only if user has permission
   export const PermissionGate: React.FC<{
     requiredPermission: string;
     children: React.ReactNode;
   }> = ({ requiredPermission, children }) => {
     const { permissions } = useSelector(selectAuth);
     return permissions.includes(requiredPermission) ? children : null;
   };
   ```

#### 2.3 Analytics & Reporting

**New Services**:

1. **src/services/AnalyticsService.ts**
   - Transaction analytics
   - User behavior tracking
   - Performance metrics aggregation

2. **src/services/ReportService.ts**
   - Report generation
   - Data export (CSV, PDF, JSON)
   - Scheduled reports

**New Components**:

1. **src/components/analytics/AnalyticsDashboard.tsx**
2. **src/components/analytics/ReportBuilder.tsx**
3. **src/components/analytics/DataExport.tsx**

#### 2.4 Performance Optimization

**Vite Configuration Updates** (vite.config.ts):
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['antd', '@ant-design/icons'],
          'charts': ['recharts'],
          'state': ['redux', '@reduxjs/toolkit', 'react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
```

**Service Worker**:
- Create `src/serviceWorker.ts`
- Register in `src/main.tsx`
- Cache strategies for offline support

---

### Phase 3: Testing & Quality (Days 13-17)

#### 3.1 E2E Testing Suite

**Test Files to Create**:
```
tests/e2e/
├── auth.spec.ts
├── dashboard.spec.ts
├── transactions.spec.ts
├── analytics.spec.ts
└── rbac.spec.ts
```

**Example Test** (tests/e2e/auth.spec.ts):
```typescript
import { test, expect } from '@playwright/test';

test('User login and dashboard access', async ({ page }) => {
  await page.goto('https://aurigraph.io');

  // Login
  await page.fill('input[type=email]', 'user@example.com');
  await page.fill('input[type=password]', 'password');
  await page.click('button:has-text("Sign In")');

  // Verify dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

#### 3.2 Unit & Component Testing

**Test Files to Create**:
```
tests/unit/
├── components/
│   ├── TransactionMonitor.spec.tsx
│   ├── AnalyticsDashboard.spec.tsx
│   └── PermissionGate.spec.tsx
├── hooks/
│   ├── useGraphQLSubscription.spec.ts
│   └── useV11Backend.spec.ts
├── services/
│   ├── V11BackendService.spec.ts
│   └── AnalyticsService.spec.ts
└── store/
    ├── authSlice.spec.ts
    └── rbacSlice.spec.ts
```

#### 3.3 Integration Testing

**Staging Environment Setup**:
```bash
# tests/integration/
# Full integration tests against staging V11
```

#### 3.4 Security Testing

**Security Checklist** (tests/security/):
- OWASP Top 10 compliance
- Dependency vulnerability scan
- Authentication testing
- Authorization testing
- Input validation testing

---

### Phase 4: Deployment (Days 18-20)

#### 4.1 Production Deployment

**Docker Setup** (update Dockerfile):
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

**Production Environment Variables**:
- `.env.production` with all secrets managed by environment
- SSL certificates configured
- CDN configuration

#### 4.2 DNS Switch

**Procedure**:
1. Verify all systems on staging
2. Update DNS A records for aurigraph.io
3. Monitor DNS propagation
4. Verify HTTPS working
5. User acceptance testing
6. Monitor logs for errors

---

## 🧪 Testing Commands

```bash
# Unit tests
npm run test

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint

# Full test suite
npm run test:all
```

---

## 📊 File Organization Reference

```
enterprise-portal/
├── SPARC-ENTERPRISE-PORTAL-PLAN.md          ← Main strategic plan
├── ENTERPRISE-PORTAL-EXECUTION-GUIDE.md     ← This file
├── enterprise-portal/frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                      (NEW)
│   │   │   │   ├── UserManagement.tsx
│   │   │   │   ├── RoleManagement.tsx
│   │   │   │   └── PermissionMatrix.tsx
│   │   │   ├── analytics/                  (NEW)
│   │   │   │   ├── AnalyticsDashboard.tsx
│   │   │   │   ├── ReportBuilder.tsx
│   │   │   │   └── DataExport.tsx
│   │   │   ├── dashboard/                  (ENHANCE)
│   │   │   │   ├── TransactionMonitor.tsx  (NEW)
│   │   │   │   ├── ValidatorStatus.tsx     (NEW)
│   │   │   │   └── ConsensusMetrics.tsx    (NEW)
│   │   │   └── common/
│   │   │       └── PermissionGate.tsx      (NEW)
│   │   ├── hooks/
│   │   │   └── useGraphQLSubscription.ts   (NEW)
│   │   ├── services/
│   │   │   ├── V11BackendService.ts        (ENHANCE)
│   │   │   ├── AnalyticsService.ts         (NEW)
│   │   │   └── ReportService.ts            (NEW)
│   │   ├── store/
│   │   │   ├── authSlice.ts                (ENHANCE)
│   │   │   └── rbacSlice.ts                (NEW)
│   │   ├── config/
│   │   │   └── api.ts                      (NEW)
│   │   ├── utils/
│   │   │   └── securityHeaders.ts          (NEW)
│   │   └── serviceWorker.ts                (NEW)
│   ├── tests/
│   │   ├── e2e/
│   │   │   ├── auth.spec.ts
│   │   │   ├── dashboard.spec.ts
│   │   │   ├── transactions.spec.ts
│   │   │   ├── analytics.spec.ts
│   │   │   └── rbac.spec.ts
│   │   ├── unit/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── store/
│   │   ├── integration/
│   │   └── security/
│   ├── .env.production                      (UPDATE)
│   ├── .env.staging                         (UPDATE)
│   ├── vite.config.ts                       (ENHANCE)
│   └── Dockerfile                           (ENHANCE)
├── nginx.conf                               (NEW)
├── deploy-https.sh                          (UPDATE)
├── deploy-https-auto.sh                     (UPDATE)
└── deploy-portal.sh                         (UPDATE)
```

---

## 🔍 Debugging Tips

### Common Issues & Solutions

**Issue: CORS errors when calling V11 API**
```
Solution: Check nginx.conf proxy headers
  - Add 'Access-Control-Allow-Origin: *'
  - Add 'Access-Control-Allow-Credentials: true'
```

**Issue: WebSocket connection fails**
```
Solution: Verify WebSocket endpoint
  - Check wss:// vs ws://
  - Verify nginx grpc_pass configuration
```

**Issue: Performance degradation**
```
Solution: Check bundle size
  - npm run build --analyze
  - Verify code splitting in vite.config.ts
```

**Issue: E2E tests timeout**
```
Solution: Increase timeout or check target service
  - Verify V11 backend is running
  - Check network latency
```

---

## 📞 Support & Escalation

### Team Contacts

- **Frontend Lead**: frontend-design:frontend-design
- **Architecture**: feature-dev:code-architect
- **Testing**: pr-review-toolkit:pr-test-analyzer
- **DevOps**: Platform team
- **V11 Integration**: V11 team

### Quick Communication Channels

- Slack: #aurigraph-portal-dev
- Daily Standup: 9 AM (async updates)
- Architecture Review: Wed 3 PM
- Issues: GitHub Issues with `[portal]` label

---

**Last Updated**: December 26, 2025
**Next Review**: Sprint kickoff
