/**
 * useAssetTraceability Hook
 *
 * Custom hook for asset traceability API calls and real-time updates
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { ASSET_API_ENDPOINTS, AssetType, AssetStatus } from '../utils/assetConstants';
import { assetWebSocketClient, AssetWSMessage } from '../services/AssetWebSocketClient';

export interface Asset {
  assetId: string;
  assetName: string;
  type: AssetType;
  valuation: number;
  currency: string;
  currentOwner: string;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface OwnershipRecord {
  recordId: string;
  assetId: string;
  previousOwner: string;
  newOwner: string;
  timestamp: string;
  transactionHash?: string;
  transferPrice?: number;
  notes?: string;
}

export interface AssetHistory {
  assetId: string;
  ownershipRecords: OwnershipRecord[];
  auditTrail: Array<{
    action: string;
    actor: string;
    timestamp: string;
    details?: any;
  }>;
}

export interface AssetSearchParams {
  query?: string;
  type?: AssetType;
  status?: AssetStatus;
  owner?: string;
  minValuation?: number;
  maxValuation?: number;
  page?: number;
  pageSize?: number;
}

export interface AssetSearchResult {
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssetTransferRequest {
  assetId: string;
  newOwner: string;
  transferPrice?: number;
  notes?: string;
}

export interface UseAssetTraceabilityOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableWebSocket?: boolean;
}

export const useAssetTraceability = (options: UseAssetTraceabilityOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 10000, enableWebSocket = false } = options;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetHistory, setAssetHistory] = useState<AssetHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  /**
   * Search assets
   */
  const searchAssets = useCallback(async (params: AssetSearchParams = {}): Promise<AssetSearchResult> => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.append('query', params.query);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.owner) queryParams.append('owner', params.owner);
      if (params.minValuation !== undefined) queryParams.append('minValuation', params.minValuation.toString());
      if (params.maxValuation !== undefined) queryParams.append('maxValuation', params.maxValuation.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const { data } = await apiClient.get<AssetSearchResult>(
        `${ASSET_API_ENDPOINTS.SEARCH}?${queryParams.toString()}`
      );

      setAssets(data.assets || []);
      setTotal(data.total || 0);
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to search assets');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get asset details
   */
  const getAsset = useCallback(async (assetId: string): Promise<Asset> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<Asset>(ASSET_API_ENDPOINTS.GET_ASSET(assetId));
      setSelectedAsset(data);
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch asset');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get asset history
   */
  const getAssetHistory = useCallback(async (assetId: string): Promise<AssetHistory> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<AssetHistory>(ASSET_API_ENDPOINTS.GET_HISTORY(assetId));
      setAssetHistory(data);
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch asset history');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Transfer asset
   */
  const transferAsset = useCallback(async (request: AssetTransferRequest): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(ASSET_API_ENDPOINTS.TRANSFER, request);
      // Refresh asset after transfer
      if (selectedAsset?.assetId === request.assetId) {
        await getAsset(request.assetId);
        await getAssetHistory(request.assetId);
      }
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to transfer asset');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedAsset, getAsset, getAssetHistory]);

  /**
   * Get analytics
   */
  const getAnalytics = useCallback(async (): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get(ASSET_API_ENDPOINTS.GET_ANALYTICS);
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch analytics');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh current asset
   */
  const refresh = useCallback(async () => {
    if (selectedAsset) {
      await getAsset(selectedAsset.assetId);
      await getAssetHistory(selectedAsset.assetId);
    }
  }, [selectedAsset, getAsset, getAssetHistory]);

  /**
   * Handle WebSocket messages
   */
  const handleWSMessage = useCallback((message: AssetWSMessage) => {
    if (message.type === 'connected' || message.type === 'disconnected') {
      return;
    }

    console.log('[useAssetTraceability] WebSocket message:', message);

    // Update selected asset if it matches
    if (selectedAsset && message.assetId === selectedAsset.assetId) {
      refresh();
    }

    // Update asset in list
    setAssets((prev) =>
      prev.map((asset) =>
        asset.assetId === message.assetId
          ? { ...asset, ...message.data, updatedAt: message.timestamp }
          : asset
      )
    );
  }, [selectedAsset, refresh]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  /**
   * WebSocket effect
   */
  useEffect(() => {
    if (!enableWebSocket || !selectedAsset) return;

    const unsubscribe = assetWebSocketClient.connectToAssetTraceability(
      selectedAsset.assetId,
      handleWSMessage
    );

    return () => {
      unsubscribe();
    };
  }, [enableWebSocket, selectedAsset, handleWSMessage]);

  return {
    // State
    assets,
    selectedAsset,
    assetHistory,
    loading,
    error,
    total,

    // Actions
    searchAssets,
    getAsset,
    getAssetHistory,
    transferAsset,
    getAnalytics,
    refresh,
    setSelectedAsset,
  };
};

export default useAssetTraceability;
