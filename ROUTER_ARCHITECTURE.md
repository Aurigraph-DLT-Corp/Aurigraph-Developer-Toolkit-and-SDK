# Aurigraph Portal - React Router v6 Navigation Architecture Proposal

**Status**: Architecture Design  
**Date**: November 2025  
**Portal Version**: v4.6.0+  
**Technology Stack**: React 18 + React Router v6 + Redux Toolkit + Ant Design

---

## Executive Summary

This document provides a comprehensive design for a React Router v6 navigation architecture for the Aurigraph Enterprise Portal. The current implementation uses manual state management with a `switch` statement in `App.tsx`, which limits scalability, deep linking, bookmarking, and SEO optimization. The proposed architecture introduces:

1. **Declarative Route Structure** - Type-safe, hierarchical route definitions
2. **Navigation Context** - Global navigation state for breadcrumbs, filters, and selections
3. **Breadcrumb Strategy** - Automatic breadcrumb generation from route configuration
4. **Layout System** - Per-route layout selection (admin, public, minimal)
5. **Code Splitting** - Lazy-loaded route components for optimal bundle size
6. **Full Type Safety** - End-to-end TypeScript support for routes and navigation

---

## Problem Statement

**Current State:**
- Manual navigation using `switch(activeKey)` in App.tsx
- No URL routing - all navigation via state management
- No deep linking or bookmarking capability
- Breadcrumbs are hardcoded
- Navigation filters not persisted to URL
- SEO challenges (no clean URLs)
- Scalability issues as feature set grows

**Proposed Solution:**
- React Router v6 with declarative routes
- Navigation context for global state
- Auto-generated breadcrumbs from routes
- URL-based navigation with query parameters
- Layout system for different page types
- Clean, bookmarkable URLs

---

## Architecture Components

### 1. Route Structure (3 levels)

**Level 1: Root Routes**
- `/` - Landing page (public)
- `/auth/*` - Authentication (public)
- `/404` - Error page (minimal)

**Level 2: Section Routes** (main categories)
- `/blockchain/*` - Blockchain explorer
- `/rwat/*` - RWAT tokenization
- `/contracts/*` - Smart contracts
- `/compliance/*` - Compliance & security
- `/registries/*` - Registries & traceability
- `/ai/*` - AI & optimization
- `/integration/*` - Cross-chain bridge
- `/admin/*` - Administration

**Level 3: Detail Routes** (specific items)
- `/blockchain/transactions/:txHash`
- `/blockchain/blocks/:blockNumber`
- `/contracts/registry/:contractId`
- etc.

### 2. Navigation Context

**State Shape:**
```typescript
{
  currentPath: string
  currentRoute: PortalRouteObject | null
  currentSection: string  // e.g., 'blockchain'
  breadcrumbs: BreadcrumbItem[]
  activeFilters: Record<string, any>
  selectedItems: Map<string, string[]>
  expandedMenuSections: Set<string>
  isNavigating: boolean
  navigationError: string | null
}
```

**Main Actions:**
- `navigateTo(path, options)` - Navigate to route
- `setFilter(key, value)` - Update active filters
- `toggleSelection(section, itemId)` - Toggle item selection
- `updateBreadcrumbs(breadcrumbs)` - Update breadcrumb trail
- `goBack() / goForward()` - Navigate history

### 3. Breadcrumb Strategy

**Types of Breadcrumbs:**
1. **Static** - Fixed label from route config
2. **Dynamic** - Generated from route parameters
3. **Custom** - Overridden via breadcrumbLabel property

**Example:**
```
Home > Blockchain > Transactions > Transaction 0x1a2b... 
               ^          ^                    ^
            Static    Static              Dynamic (from route param)
```

**Generation:**
- Automatic from `location.pathname`
- Supports dynamic segments with `breadcrumbFn`
- Clickable items navigate back to that route
- "..." for truncation when >5 items

---

## File Structure Overview

```
src/
├── router/
│   ├── routes.ts              # Main route configuration
│   ├── RouteConfig.ts         # Helpers & utilities
│   └── index.ts               # Re-exports
│
├── context/
│   ├── NavigationContext.tsx   # Navigation state & provider
│   └── index.ts               # Re-exports
│
├── hooks/
│   ├── useBreadcrumbs.ts       # Generate breadcrumbs from routes
│   ├── useNavigation.ts        # Access navigation context
│   ├── useRouteParams.ts       # Parse route parameters
│   └── ... (existing)
│
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx      # Main wrapper for all routes
│   │   ├── Breadcrumbs.tsx     # Breadcrumb display component
│   │   ├── TopNav.tsx          # Enhanced top navigation
│   │   ├── PublicLayout.tsx    # For public pages
│   │   └── MinimalLayout.tsx   # For error pages
│   │
│   ├── pages/                  # New page components
│   │   ├── TransactionDetail.tsx
│   │   ├── BlockDetail.tsx
│   │   └── ...
│   │
│   ├── errors/                 # Error pages
│   │   └── NotFound.tsx
│   │
│   └── ... (existing)
│
└── App.tsx                     # Updated to use RouterProvider
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create route configuration file (`src/router/routes.ts`)
- [ ] Create navigation context (`src/context/NavigationContext.tsx`)
- [ ] Create breadcrumb hook (`src/hooks/useBreadcrumbs.ts`)
- [ ] Create main layout component (`src/components/layout/MainLayout.tsx`)
- [ ] Update App.tsx to use BrowserRouter

### Phase 2: Migration (Week 3-4)
- [ ] Migrate route components to route definitions
- [ ] Implement lazy loading with React.lazy()
- [ ] Create error boundary component
- [ ] Update TopNav to use route config for menu items
- [ ] Test navigation and breadcrumbs

### Phase 3: Features (Week 5-6)
- [ ] Implement dynamic breadcrumb labels
- [ ] Add query parameter support for filters
- [ ] Implement route-based analytics
- [ ] Add route transition animations
- [ ] Create ProtectedRoute component for RBAC

### Phase 4: Optimization (Week 7+)
- [ ] Code splitting and route-based chunking
- [ ] Route prefetching
- [ ] Performance monitoring
- [ ] SEO optimization (meta tags)
- [ ] Mobile responsive testing

---

## Key Features

### 1. Type-Safe Routes

```typescript
interface PortalRouteObject extends RouteObject {
  label?: string                    // Menu label
  icon?: ReactNode                 // Menu icon
  breadcrumbLabel?: string         // Custom breadcrumb
  breadcrumbFn?: (params) => string // Dynamic breadcrumb
  layout?: 'admin' | 'public' | 'minimal'
  hideInMenu?: boolean
  requiredPermissions?: string[]
  category?: string
  description?: string
}
```

### 2. Automatic Breadcrumb Generation

```typescript
useBreadcrumbs({
  autoUpdate: true,
  customSegments: { 'validators': 'Validator Nodes' }
})
```

### 3. Filter Persistence

```typescript
const { setFilter, activeFilters } = useNavigation()

// Save filter to context
setFilter('status', 'pending')

// Access in any component
console.log(activeFilters) // { status: 'pending' }
```

### 4. Selection Management

```typescript
const { toggleSelection, selectedItems } = useNavigation()

// Toggle item selection
toggleSelection('validators', 'node-1')

// Access selections
selectedItems.get('validators') // ['node-1', 'node-2']
```

### 5. Layout System

```typescript
// Different layouts for different page types
{
  path: '/auth/login',
  element: <LoginPage />,
  layout: 'public'  // No navigation UI
}

{
  path: '/blockchain/dashboard',
  element: <Dashboard />,
  layout: 'admin'   // Full navigation UI
}

{
  path: '/404',
  element: <NotFound />,
  layout: 'minimal' // Minimal UI
}
```

---

## Benefits

### For Users
- Deep linking and bookmarking
- Browser back/forward buttons work correctly
- Clean, readable URLs
- Better performance with code splitting
- Persistent navigation state (filters, selections)

### For Developers
- Type-safe route definitions
- DRY breadcrumb generation
- Centralized navigation logic
- Easy to add new routes
- Better component organization
- Easier testing with isolated routes

### For Business
- Better SEO with clean URLs
- Better analytics tracking
- Improved user experience
- Better mobile support
- Easier to maintain and extend

---

## Detailed Specifications

### Route Configuration Example

```typescript
{
  path: '/blockchain',
  label: 'Blockchain',
  icon: <BlockOutlined />,
  category: 'blockchain',
  children: [
    {
      path: '/transactions',
      element: lazy(() => import('@/components/TransactionExplorer')),
      label: 'Transactions',
      icon: <ThunderboltOutlined />,
      description: 'Explore blockchain transactions'
    },
    {
      path: '/transactions/:txHash',
      element: lazy(() => import('@/components/TransactionDetail')),
      label: 'Transaction Detail',
      hideInMenu: true,
      breadcrumbFn: (params) => `TX ${params.txHash.slice(0, 8)}...`
    }
  ]
}
```

### Navigation Context Usage

```typescript
import { useNavigation } from '@/context/NavigationContext'

function MyComponent() {
  const { state, navigateTo, setFilter } = useNavigation()

  return (
    <div>
      <p>Current section: {state.currentSection}</p>
      <button onClick={() => setFilter('status', 'active')}>
        Filter by Active
      </button>
    </div>
  )
}
```

### Breadcrumb Hook Usage

```typescript
function MyPage() {
  const breadcrumbs = useBreadcrumbs({
    autoUpdate: true,
    customSegments: {
      'validators': 'Validator Nodes',
      'dashboard': 'Blockchain Dashboard'
    }
  })

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />
      {/* Page content */}
    </div>
  )
}
```

---

## Migration Checklist

- [ ] Install react-router-dom v6 (already in package.json v6.20.0)
- [ ] Create route configuration
- [ ] Create navigation context
- [ ] Create breadcrumb hook
- [ ] Refactor App.tsx
- [ ] Update TopNav component
- [ ] Create layout components
- [ ] Migrate all route components
- [ ] Add lazy loading
- [ ] Test all navigation flows
- [ ] Add analytics tracking
- [ ] SEO optimization
- [ ] Mobile testing
- [ ] Performance optimization

---

## Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Deep linking | No | Yes |
| Bookmarkable URLs | No | Yes |
| Browser history | No | Yes (native) |
| Breadcrumbs | Static only | Auto-generated |
| Code splitting | Manual | Automatic |
| URL structure | Manual | Declarative |
| Type safety | Partial | Complete |
| Menu generation | Manual | From routes |
| SEO | Poor | Good |
| Analytics | Hard | Easy |
| Testability | Hard | Easy |

---

## Next Steps

1. Review and approve architecture design
2. Create detailed implementation specification
3. Set up development environment
4. Begin Phase 1 implementation
5. Weekly progress reviews

---

## References

- React Router v6 Documentation: https://reactrouter.com/
- Current App.tsx: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/App.tsx`
- Current Navigation: Uses manual switch/case in App.tsx
- Redux Store: Already configured with Redux Toolkit

---

## Questions & Considerations

1. **Backward Compatibility**: Need to maintain existing feature flags and demo mode
2. **Mobile Menu**: Should mobile menu state be persisted across navigation?
3. **Query Parameters**: Should filters persist in URL or just in context?
4. **Analytics**: Which router events should trigger analytics?
5. **Authentication**: How to handle protected routes?
6. **Performance**: Should we implement route prefetching?

---

**Document Version**: 1.0  
**Last Updated**: November 18, 2025  
**Author**: Claude Code  
**Status**: Ready for Review
