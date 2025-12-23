# Aurigraph Portal - React Router Architecture Diagrams

## 1. Component Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          React Application Root                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         Redux Provider                             │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │                   NavigationProvider                         │  │  │
│  │  │  ┌────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │              RouterProvider (v6)                      │  │  │  │
│  │  │  │  ┌──────────────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │               MainLayout Component              │  │  │  │  │
│  │  │  │  │  ┌────────────────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │          TopNav (Navigation)              │  │  │  │  │  │
│  │  │  │  │  │  - Menu Items (from routes config)         │  │  │  │  │  │
│  │  │  │  │  │  - User Profile                           │  │  │  │  │  │
│  │  │  │  │  │  - Theme Toggle                           │  │  │  │  │  │
│  │  │  │  │  └────────────────────────────────────────────┘  │  │  │  │  │
│  │  │  │  │                                                   │  │  │  │  │
│  │  │  │  │  ┌────────────────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │       Breadcrumbs Component              │  │  │  │  │  │
│  │  │  │  │  │  - Auto-generated from routes            │  │  │  │  │  │
│  │  │  │  │  │  - Clickable navigation                  │  │  │  │  │  │
│  │  │  │  │  │  - Back/Forward buttons                  │  │  │  │  │  │
│  │  │  │  │  └────────────────────────────────────────────┘  │  │  │  │  │
│  │  │  │  │                                                   │  │  │  │  │
│  │  │  │  │  ┌────────────────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │            Content Area                   │  │  │  │  │  │
│  │  │  │  │  │  ┌──────────────────────────────────────┐ │  │  │  │  │  │
│  │  │  │  │  │  │      Outlet (Route Component)      │ │  │  │  │  │  │
│  │  │  │  │  │  │  - Lazy loaded                     │ │  │  │  │  │  │
│  │  │  │  │  │  │  - Dynamic based on route         │ │  │  │  │  │  │
│  │  │  │  │  │  └──────────────────────────────────┘ │  │  │  │  │  │
│  │  │  │  │  └────────────────────────────────────────┘  │  │  │  │  │
│  │  │  │  │                                               │  │  │  │  │
│  │  │  │  │  ┌────────────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │         Footer Component              │  │  │  │  │  │
│  │  │  │  │  │  - Status info                        │  │  │  │  │  │
│  │  │  │  │  │  - Copyright                          │  │  │  │  │  │
│  │  │  │  │  └────────────────────────────────────────┘  │  │  │  │  │
│  │  │  │  └──────────────────────────────────────────────┘  │  │  │  │  │
│  │  │  └────────────────────────────────────────────────────┘  │  │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │  │
│  └────────────────────────────────────────────────────────────────┘  │  │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2. Route Structure Tree

```
/                                    (Landing Page - Public Layout)
│
├── /blockchain                      (Group - no component)
│   ├── /dashboard                   (Blockchain Dashboard)
│   ├── /transactions                (Transaction Explorer)
│   ├── /transactions/:txHash        (Transaction Detail - Dynamic)
│   ├── /blocks                      (Block Explorer)
│   ├── /blocks/:blockNumber         (Block Detail - Dynamic)
│   ├── /validators                  (Validator Dashboard)
│   ├── /validators/:nodeId          (Validator Detail - Dynamic)
│   ├── /monitoring                  (Network Monitoring)
│   ├── /demo                        (Network Topology)
│   └── /demo-channel                (High-Throughput Demo)
│
├── /rwat                            (Group - RWA Tokenization)
│   ├── /create                      (Create RWAT Token)
│   ├── /standard                    (Standard Tokenization)
│   ├── /standard/:tokenId           (Token Detail - Dynamic)
│   ├── /registry                    (Token Registry)
│   └── /rwa-registry                (RWA Registry)
│
├── /contracts                       (Group - Smart Contracts)
│   ├── /registry                    (Contract Registry)
│   ├── /registry/:contractId        (Contract Detail - Dynamic)
│   ├── /active                      (Active Contracts)
│   └── /ricardian                   (Ricardian Converter)
│
├── /compliance                      (Group - Compliance & Security)
│   ├── /dashboard                   (Compliance Dashboard)
│   ├── /reports                     (Compliance Reports)
│   ├── /security                    (Quantum Security)
│   └── /merkle-tree                 (Merkle Tree Registry)
│
├── /registries                      (Group - Traceability)
│   ├── /assets                      (Asset Traceability)
│   ├── /assets/:assetId             (Asset Detail - Dynamic)
│   ├── /management                  (Traceability Management)
│   ├── /contract-assets             (Contract-Asset Links)
│   └── /registry-management         (Registry Management)
│
├── /ai                              (Group - AI & Optimization)
│   ├── /optimization                (AI Optimization)
│   ├── /metrics                     (AI Metrics)
│   └── /consensus                   (Consensus Tuning)
│
├── /integration                     (Group - Integration)
│   ├── /bridge                      (Cross-Chain Bridge)
│   └── /api                         (API Endpoints)
│
├── /admin                           (Group - Administration)
│   ├── /users                       (User Management)
│   ├── /users/:userId               (User Detail - Dynamic)
│   ├── /settings                    (System Settings)
│   └── /tokens                      (Token Directory)
│
├── /auth                            (Group - Authentication)
│   ├── /login                       (Login Page - Public Layout)
│   ├── /logout                      (Logout Handler)
│   └── /callback                    (OAuth Callback)
│
├── /404                             (Error Page - Minimal Layout)
│
└── /*                               (Catch-all - Redirect to 404)
```

## 3. Navigation Context Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Navigation Context State                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────────┐   │
│  │  Current Route Info  │      │   Breadcrumb Trail       │   │
│  │  ─────────────────   │      │  ──────────────────────  │   │
│  │  - currentPath       │      │  [Home]                  │   │
│  │  - currentRoute      │      │    └─ [Blockchain]       │   │
│  │  - currentSection    │      │        └─ [Transactions] │   │
│  │  - currentCategory   │      │           └─ [TX Hash]   │   │
│  └──────────────────────┘      └──────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────────┐   │
│  │ Active Filters       │      │  Selected Items          │   │
│  │ ──────────────────   │      │  ──────────────────────  │   │
│  │ {                    │      │  {                       │   │
│  │   status: 'pending'  │      │    validators: [node1],  │   │
│  │   type: 'contract'   │      │    contracts: [cx1, cx2] │   │
│  │ }                    │      │  }                       │   │
│  └──────────────────────┘      └──────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────────┐   │
│  │  Navigation History  │      │  Menu UI State           │   │
│  │  ──────────────────  │      │  ──────────────────────  │   │
│  │  ['/']               │      │  isMobileMenuOpen: false │   │
│  │  ['/blockchain']     │      │  expandedMenuSections:   │   │
│  │  ['/blockchain/tx']  │  →   │  [blockchain, admin]     │   │
│  │  (current at index 2)│      │                          │   │
│  └──────────────────────┘      └──────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Dispatched Actions
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Navigation Dispatch Actions                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  navigateTo(path)          goBack()          goForward()        │
│  setFilter(key, value)     toggleSelection() updateBreadcrumbs()│
│  clearAllFilters()         toggleMobileMenu() toggleMenuSection()
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Breadcrumb Generation Flow

```
┌─────────────────────────┐
│   User clicks link or   │
│   types URL address     │
└────────────┬────────────┘
             │
             ▼
     ┌───────────────────────┐
     │  location.pathname    │
     │  e.g., /blockchain/   │
     │        transactions/  │
     │        0x1a2b...      │
     └───────────┬───────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  useBreadcrumbs() hook      │
    │  ─────────────────────────  │
    │  1. Parse pathname segments │
    │  2. Match against routes    │
    │  3. Generate dynamic labels │
    │  4. Apply custom segments   │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  Breadcrumb Array Generated │
    │  ─────────────────────────  │
    │  [                          │
    │    {label: 'Home', path: '/'},
    │    {label: 'Blockchain',    │
    │     path: '/blockchain'},   │
    │    {label: 'Transactions',  │
    │     path: '/blockchain/...'},
    │    {label: 'TX 0x1a2b...',  │
    │     path: '/blockchain/tx/'}│
    │  ]                          │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  Breadcrumbs Component      │
    │  Renders:                   │
    │  Home > Blockchain >        │
    │  Transactions > TX 0x1a2b..│
    │  ─────────────────────────  │
    │  Each item is clickable     │
    └─────────────────────────────┘
```

## 5. Data Flow: Filter State Management

```
Component A                          Navigation Context
──────────────────────           ──────────────────────

1. User sets filter
   │
   ├─→ setFilter('status', 'active')
   │
   └─────────────┬──────────────────┐
                 │                  │
                 ▼                  ▼
             Dispatch Action    Update Context
             SET_FILTER        activeFilters: {
                                 status: 'active'
                               }
                                │
                 ┌──────────────┘
                 │
                 ▼
         Component B (anywhere)
         ├─→ const { activeFilters } = useNavigation()
         └─→ Reads: { status: 'active' }
             Updates UI based on filter
```

## 6. Selection Management Flow

```
Transaction Explorer Component
──────────────────────────────

Table with Checkboxes
│
├─ [✓] TX 1
├─ [✓] TX 2
├─ [ ] TX 3
└─ ...

When user checks/unchecks:
│
▼
toggleSelection('transactions', 'tx-1')
│
▼
Navigation Context dispatches:
  TOGGLE_SELECTION {
    section: 'transactions',
    itemId: 'tx-1'
  }
│
▼
selectedItems updated:
  Map {
    'transactions': ['tx-1', 'tx-2']
  }
│
▼
Components watching selectedItems
get notified & re-render
│
▼
Bulk Actions Available
├─ Delete Selected
├─ Export Selected
└─ Process Selected
```

## 7. Route Configuration Structure

```
PortalRouteObject
├── path: string
│   └── e.g., '/blockchain/transactions'
│
├── element?: ReactNode | Promise<ReactNode>
│   └── Component or lazy() loaded component
│
├── label?: string
│   └── 'Transactions'
│
├── icon?: ReactNode
│   └── <ThunderboltOutlined />
│
├── breadcrumbLabel?: string
│   └── Custom label for breadcrumbs
│
├── breadcrumbFn?: (params) => string
│   └── Dynamic breadcrumb from route params
│
├── layout?: 'admin' | 'public' | 'minimal'
│   ├── admin: Full nav, breadcrumbs, footer
│   ├── public: Minimal nav
│   └── minimal: No nav (error pages)
│
├── category?: string
│   └── 'blockchain' (for grouping)
│
├── hideInMenu?: boolean
│   └── Hide from navigation menu
│
├── hideInBreadcrumb?: boolean
│   └── Don't show in breadcrumb trail
│
├── requiredPermissions?: string[]
│   └── ['blockchain:view', 'transactions:export']
│
├── featureFlag?: string
│   └── 'ai-optimization-v2'
│
├── description?: string
│   └── 'Explore blockchain transactions'
│
└── children?: PortalRouteObject[]
    └── Nested routes
```

## 8. Layout Switching Logic

```
                    ┌──────────────────────┐
                    │   User Navigates     │
                    │   to /blockchain/tx  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Find Route Config    │
                    │ layout: 'admin'      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  MainLayout Component│
                    │  (switch on layout)  │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        case 'admin'   case 'public'  case 'minimal'
        ┌─────────┐   ┌─────────┐    ┌─────────┐
        │ TopNav  │   │ TopNav  │    │         │
        │ Breadcr │   │         │    │         │
        │ Content │   │ Content │    │ Content │
        │ Footer  │   │ Footer  │    │         │
        └─────────┘   └─────────┘    └─────────┘
```

## 9. Type Safety Chain

```
Route Definition          Component Props      Hook Return
─────────────────        ─────────────────    ─────────────

interface                type MyPageProps      const routes = 
PortalRouteObject {        = {                 useBreadcrumbs({
  path: string            params: MyParams      params: {
  element: Comp           breadcrumbs:           txHash: string
  label: string           BreadcrumbItem[]      }
  icon: ReactNode       }                      })
  category: string
  ...
}
     │
     ▼
Routes are type-checked at compile time
Components receive typed props
Hooks return properly typed values
No runtime surprises!
```

## 10. Performance Optimization Flow

```
User Navigates to /contracts/registry
│
├─ Route component is lazy loaded
│  └─ React.lazy(() => import(...))
│
├─ Code bundle is split
│  └─ contracts.chunk.js only loaded on demand
│
├─ Component renders with fallback
│  ├─ While loading: <Loading />
│  └─ After loaded: <ContractRegistry />
│
├─ Breadcrumbs automatically generated
│  └─ No extra API calls
│
└─ User interaction stored in context
   └─ Filters/selections persist on navigation
```

---

**Diagram Version**: 1.0  
**Last Updated**: November 18, 2025
