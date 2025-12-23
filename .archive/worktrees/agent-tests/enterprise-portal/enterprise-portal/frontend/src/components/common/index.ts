/**
 * Common Components Index
 *
 * Central export point for all common/shared components
 * Makes imports cleaner: import { ErrorBoundary, EmptyState } from '@/components/common'
 */

// Error Boundary
export { default as ErrorBoundary } from './ErrorBoundary';

// Empty States
export {
  default as EmptyState,
  NoDataEmpty,
  FeatureUnavailableEmpty,
  ApiUnavailableEmpty,
  NoResultsEmpty,
  ComingSoonEmpty,
  UnderDevelopmentEmpty,
  ApiErrorEmpty,
} from './EmptyState';
export type { EmptyStateType } from './EmptyState';

// Loading Skeletons
export {
  default as LoadingSkeleton,
  CardSkeleton,
  StatsCardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton,
} from './LoadingSkeleton';
