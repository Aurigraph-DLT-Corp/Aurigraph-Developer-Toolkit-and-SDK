import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from '../store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// WebSocket Hooks
export { useMetricsWebSocket } from './useMetricsWebSocket'
export { useTransactionStream } from './useTransactionStream'
export { useValidatorStream } from './useValidatorStream'
export { useConsensusStream } from './useConsensusStream'
export { useNetworkStream } from './useNetworkStream'