/**
 * Custom React Hooks Barrel Export
 */

// Redux hooks
export { useAppDispatch, useAppSelector } from './useRedux';

// WebSocket hook
export { default as useWebSocket } from './useWebSocket';

// Asset Traceability & Registry hooks
export { default as useAssetTraceability } from './useAssetTraceability';
export { default as useRegistry } from './useRegistry';

// TODO: Implement custom hooks in Task 2.5 (Integrate V11 Backend API)
// - useV11Backend: React Query hooks for V11 API
// - useExternalFeeds: Alpaca, Weather, X API integration
