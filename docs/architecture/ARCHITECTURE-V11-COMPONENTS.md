## Component Architecture

### Enterprise Portal (Frontend)

**Technology**: React 18 + TypeScript + Material-UI

**Architecture**:
```
enterprise-portal/
├── src/
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Analytics.tsx   # Analytics view
│   │   ├── dashboards/     # Specialized dashboards
│   │   └── rwa/            # RWA tokenization
│   ├── components/         # Reusable components
│   │   ├── Layout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── MultiChannelDashboard.tsx
│   ├── services/           # API services
│   │   └── api.ts          # Backend API client
│   ├── store/              # State management
│   │   └── slices/
│   └── hooks/              # Custom React hooks
├── public/
└── package.json
```

**Key Features**:
- Real-time data updates (WebSocket + polling)
- Material-UI design system
- Recharts for data visualization
- Axios for HTTP requests
- React Router for navigation

**API Integration**:
- Base URL: `https://dlt.aurigraph.io/api/v11`
- Auto-refresh: 5-second intervals
- Error boundaries for resilience
- Loading states for UX

### IAM Service (Keycloak)

**Purpose**: Identity and Access Management
**Technology**: Keycloak 24.0+
**Port**: 8180

**Features**:
- Multi-realm support (AWD, AurCarbonTrace, AurHydroPulse)
- OAuth 2.0 / OpenID Connect
- Role-based access control (RBAC)
- SSO integration

**Realms**:
- **AWD**: Primary enterprise realm
- **AurCarbonTrace**: Carbon tracking application
- **AurHydroPulse**: Hydro monitoring application
