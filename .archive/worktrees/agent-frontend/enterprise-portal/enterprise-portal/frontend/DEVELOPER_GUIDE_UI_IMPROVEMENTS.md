# Developer Guide: UI/UX Improvements Pattern

## Quick Reference for Adding New Dashboard Components

When creating or updating dashboard components, follow this pattern to ensure consistent error handling and user experience.

---

## Pattern: Complete Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { Card, Alert, Button, Typography } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import ErrorBoundary from '../common/ErrorBoundary';
import { StatsCardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { UnderDevelopmentEmpty, ApiErrorEmpty } from '../common/EmptyState';
import { isFeatureEnabled } from '../../config/featureFlags';
import { handleApiError, isNotFoundError, type ApiError } from '../../utils/apiErrorHandler';
import { comprehensivePortalService } from '../../services/ComprehensivePortalService';

const { Text, Title } = Typography;

const YourComponent: React.FC = () => {
  // State
  const [data, setData] = useState<YourDataType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Feature flag
  const isFeatureAvailable = isFeatureEnabled('yourFeatureName');

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // CRITICAL: NO MOCK DATA - Only real backend API
      const apiData = await comprehensivePortalService.getYourData();
      setData(apiData);
    } catch (err) {
      const apiError = handleApiError(err, {
        customMessage: 'Failed to load your data',
      });
      setError(apiError);

      if (isNotFoundError(apiError)) {
        console.warn('Your API endpoint not implemented yet');
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect
  useEffect(() => {
    if (isFeatureAvailable) {
      fetchData();

      const interval = setInterval(() => {
        fetchData();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isFeatureAvailable]);

  // Feature not available
  if (!isFeatureAvailable) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Your Feature Name</Title>
          <Text type="secondary">Your feature description</Text>
          <Card style={{ marginTop: '24px' }}>
            <UnderDevelopmentEmpty
              title="Feature Under Development"
              description="The backend API is currently being developed."
            />
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Loading state (initial load)
  if (loading && data.length === 0) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Your Feature Name</Title>
          <Text type="secondary">Your feature description</Text>
          <div style={{ marginTop: '24px' }}>
            <StatsCardSkeleton count={4} />
            <Card style={{ marginTop: '24px' }}>
              <TableSkeleton rows={10} columns={6} />
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Error state (no data)
  if (error && !loading && data.length === 0) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Your Feature Name</Title>
          <Text type="secondary">Your feature description</Text>
          <Card style={{ marginTop: '24px' }}>
            {isNotFoundError(error) ? (
              <UnderDevelopmentEmpty
                title="API Not Available"
                description="The backend API endpoint is not yet implemented."
                onRetry={fetchData}
              />
            ) : (
              <ApiErrorEmpty
                title="Failed to Load Data"
                description={error.details || 'Unable to fetch data from the backend.'}
                onRetry={fetchData}
              />
            )}
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Success state
  return (
    <ErrorBoundary>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Your Feature Name</Title>
        <Text type="secondary">Your feature description</Text>

        {/* Non-blocking error alert */}
        {error && data.length > 0 && (
          <Alert
            message="Connection Issue"
            description="Unable to fetch latest data. Showing cached data."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            closable
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" onClick={fetchData}>
                Retry
              </Button>
            }
          />
        )}

        {/* Your component content */}
        <Card style={{ marginTop: '24px' }}>
          {/* Your UI here */}
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default YourComponent;
```

---

## Checklist for New Components

### 1. Setup
- [ ] Import ErrorBoundary
- [ ] Import loading skeletons
- [ ] Import empty states
- [ ] Import error handler utilities
- [ ] Import feature flags

### 2. State Management
- [ ] Add `loading` state
- [ ] Add `error` state with ApiError type
- [ ] Add `isFeatureAvailable` feature flag check

### 3. Data Fetching
- [ ] NO MOCK DATA - only real API calls
- [ ] Use `handleApiError()` for error handling
- [ ] Set loading states properly
- [ ] Handle 404 as "under development"

### 4. Render Logic
- [ ] Wrap everything in `<ErrorBoundary>`
- [ ] Show `UnderDevelopmentEmpty` if feature disabled
- [ ] Show loading skeleton on initial load
- [ ] Show error state with retry button
- [ ] Show non-blocking error alert when data exists
- [ ] Render actual content when successful

### 5. Feature Flags
- [ ] Add feature flag to `featureFlags.ts`
- [ ] Set default to `false` if API not ready
- [ ] Check flag before making API calls

### 6. Testing
- [ ] Test with feature flag disabled
- [ ] Test initial loading state
- [ ] Test 404 error (backend off)
- [ ] Test other errors
- [ ] Test retry functionality
- [ ] Test successful data load

---

## API Service Pattern

When adding new API methods to `ComprehensivePortalService.ts`:

```typescript
/**
 * Get your data
 * Connects to YourResource.java
 */
async getYourData(): Promise<YourDataType[]> {
  if (this.demoMode) {
    return []; // Return empty in demo mode (NO MOCK DATA)
  }

  return this.fetchWithRetry<YourDataType[]>(`/api/v11/your-endpoint`);
}
```

---

## Feature Flag Configuration

Add to `featureFlags.ts`:

```typescript
export interface FeatureFlags {
  // ... existing flags
  yourFeatureName: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  // ... existing flags
  yourFeatureName: false, // Set to false until API is ready
};

export const featureFlagLabels: Record<keyof FeatureFlags, string> = {
  // ... existing labels
  yourFeatureName: 'Your Feature Display Name',
};
```

---

## Empty State Usage Guide

### When to Use Each Type

```typescript
// API endpoint returns 404
<UnderDevelopmentEmpty
  title="Feature Under Development"
  description="Backend API is being developed."
/>

// API returns error (5xx, network, etc.)
<ApiErrorEmpty
  title="Failed to Load"
  description="Backend service error."
  onRetry={fetchData}
/>

// No data returned (but API worked)
<NoDataEmpty
  title="No Data Available"
  description="No items to display."
/>

// Search/filter returned nothing
<NoResultsEmpty
  title="No Results Found"
  description="Try different filters."
/>

// Known upcoming feature
<ComingSoonEmpty
  title="Coming Soon"
  description="Expected in next release."
/>
```

---

## Loading Skeleton Guide

### Choose the Right Skeleton

```typescript
// Statistics cards (4 cards in a row)
<StatsCardSkeleton count={4} />

// Table with data
<TableSkeleton rows={10} columns={6} />

// Single card content
<CardSkeleton />

// List of items
<ListSkeleton count={5} />

// Form fields
<FormSkeleton fields={4} />

// Complete dashboard
<DashboardSkeleton />
```

---

## Error Handling Best Practices

### DO ✅

```typescript
// Use the error handler utility
const apiError = handleApiError(err, {
  customMessage: 'Failed to load validators',
});

// Check error type
if (isNotFoundError(apiError)) {
  // Show "under development" message
}

// Provide retry functionality
<Button onClick={fetchData}>Retry</Button>

// Show user-friendly messages
"Feature currently under development"
```

### DON'T ❌

```typescript
// Don't show raw errors to users
console.error(error); // Still log for debugging

// Don't use mock data
const mockData = generateMockData(); // NEVER DO THIS

// Don't show technical error messages
"Error: HTTP 404: Not Found" // Too technical

// Don't leave broken features visible
// Use feature flags to hide them
```

---

## Common Mistakes to Avoid

### 1. Forgetting ErrorBoundary
```typescript
// ❌ BAD
return <div>Content</div>;

// ✅ GOOD
return (
  <ErrorBoundary>
    <div>Content</div>
  </ErrorBoundary>
);
```

### 2. Not Checking Feature Flags
```typescript
// ❌ BAD
useEffect(() => {
  fetchData(); // Always runs
}, []);

// ✅ GOOD
useEffect(() => {
  if (isFeatureAvailable) {
    fetchData(); // Only runs if enabled
  }
}, [isFeatureAvailable]);
```

### 3. Using Mock Data
```typescript
// ❌ BAD
const data = mockData;

// ✅ GOOD
const data = await api.getData(); // Real API only
```

### 4. Not Showing Loading States
```typescript
// ❌ BAD
if (loading) return null;

// ✅ GOOD
if (loading && data.length === 0) {
  return <LoadingSkeleton />;
}
```

### 5. Technical Error Messages
```typescript
// ❌ BAD
<Alert message="HTTP 404: Not Found" />

// ✅ GOOD
<UnderDevelopmentEmpty
  title="Feature Under Development"
  description="Backend API is being developed."
/>
```

---

## Performance Tips

### 1. Polling Frequency
```typescript
// Light data (stats, status): 10-30 seconds
setInterval(fetchStats, 10000);

// Heavy data (tables, charts): 30-60 seconds
setInterval(fetchData, 30000);

// Real-time critical: 5 seconds or WebSocket
setInterval(fetchCritical, 5000);
```

### 2. Conditional Fetching
```typescript
// Don't fetch if feature is disabled
if (isFeatureAvailable) {
  fetchData();
}

// Don't fetch if data exists and error is non-retryable
if (!data || error?.retryable) {
  fetchData();
}
```

### 3. Loading States
```typescript
// Only show skeleton on initial load
if (loading && data.length === 0) {
  return <Skeleton />;
}

// Show spinner for subsequent loads
if (loading && data.length > 0) {
  // Data still visible, just show spinner in corner
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Open component with backend running
  - Should show loading skeleton
  - Should load and display data
- [ ] Stop backend and refresh
  - Should show "Under Development" or error
  - Should not show mock data
  - Should have retry button
- [ ] Click retry button
  - Should show loading
  - Should try to fetch again
- [ ] Set feature flag to `false`
  - Should show "Under Development" immediately
  - Should not make API calls
- [ ] Throw error in component
  - Should be caught by ErrorBoundary
  - Should show fallback UI
  - Should not crash app

### Automated Testing
```typescript
describe('YourComponent', () => {
  it('should show skeleton while loading', () => {
    // Test loading state
  });

  it('should show Under Development on 404', () => {
    // Mock 404 response
    // Verify UnderDevelopmentEmpty shown
  });

  it('should show error on API failure', () => {
    // Mock error response
    // Verify ApiErrorEmpty shown
  });

  it('should retry on button click', () => {
    // Click retry button
    // Verify API called again
  });

  it('should respect feature flags', () => {
    // Set feature flag to false
    // Verify no API calls made
  });
});
```

---

## Documentation Standards

### Component File Header
```typescript
/**
 * Your Component Name
 *
 * Brief description of what this component does
 * Connects to YourResource.java for data
 * NO MOCK DATA - Only real backend API calls
 */
```

### Function Documentation
```typescript
/**
 * Fetch your data from backend API
 * Handles errors gracefully and shows appropriate UI states
 */
const fetchData = async () => {
  // ...
};
```

### State Documentation
```typescript
// Current error state (null if no error)
const [error, setError] = useState<ApiError | null>(null);

// Loading state for API calls
const [loading, setLoading] = useState<boolean>(false);

// Feature availability from feature flags
const isFeatureAvailable = isFeatureEnabled('yourFeature');
```

---

## Migration Guide: Existing Components

If you need to update an existing component that uses mock data:

### Step 1: Add Imports
```typescript
import ErrorBoundary from '../common/ErrorBoundary';
import { StatsCardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { UnderDevelopmentEmpty, ApiErrorEmpty } from '../common/EmptyState';
import { isFeatureEnabled } from '../../config/featureFlags';
import { handleApiError, isNotFoundError, type ApiError } from '../../utils/apiErrorHandler';
```

### Step 2: Add State
```typescript
const [error, setError] = useState<ApiError | null>(null);
const isFeatureAvailable = isFeatureEnabled('yourFeature');
```

### Step 3: Update Fetch Function
```typescript
// OLD
const fetchData = async () => {
  setLoading(true);
  try {
    const mockData = generateMockData();
    setData(mockData);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

// NEW
const fetchData = async () => {
  setLoading(true);
  setError(null);

  try {
    const realData = await api.getData();
    setData(realData);
  } catch (err) {
    const apiError = handleApiError(err, {
      customMessage: 'Failed to load data',
    });
    setError(apiError);

    if (isNotFoundError(apiError)) {
      console.warn('API endpoint not implemented yet');
    }
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Update Render Logic
Add the 4 states (feature disabled, loading, error, success) as shown in the complete pattern above.

### Step 5: Deprecate Mock Data
```typescript
// Mock data generator - DEPRECATED
// CRITICAL: This is NOT used anymore - all data comes from real backend API
const generateMockData = () => {
  // Keep for reference but don't call
};
```

---

## Support and Questions

For questions or issues:
1. Check this guide first
2. Review existing implementations (ValidatorDashboard, AIOptimizationControls)
3. Check the implementation summary (IMPLEMENTATION_SUMMARY_AV11-276.md)
4. Ask the team in Slack #frontend channel

---

**Last Updated:** October 16, 2025
**Maintained By:** Frontend Development Team
**Related Docs:**
- IMPLEMENTATION_SUMMARY_AV11-276.md
- /src/config/featureFlags.ts
- /src/utils/apiErrorHandler.ts
- /src/components/common/
