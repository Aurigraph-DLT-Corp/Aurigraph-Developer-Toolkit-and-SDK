/**
 * Typed Redux Hooks
 *
 * Pre-typed versions of useDispatch and useSelector for TypeScript
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

/**
 * Use throughout your app instead of plain `useDispatch`
 * Provides type safety for dispatching actions
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Use throughout your app instead of plain `useSelector`
 * Provides type safety for selecting state
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
