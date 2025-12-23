/**
 * useRegistry Hook
 *
 * Custom hook for registry API calls and real-time updates
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  REGISTRY_API_ENDPOINTS,
  RegistryType,
  ContractStatus,
  ComplianceStatus,
  ComplianceLevel,
} from '../utils/assetConstants';
import { assetWebSocketClient, RegistryWSMessage, ComplianceWSMessage } from '../services/AssetWebSocketClient';

// Smart Contract interfaces
export interface SmartContract {
  contractId: string;
  name: string;
  address: string;
  codeHash: string;
  status: ContractStatus;
  linkedAssets: string[];
  deployedBy: string;
  deployedAt: string;
  version: string;
  metadata?: Record<string, any>;
}

export interface SmartContractStats {
  total: number;
  active: number;
  deployed: number;
  paused: number;
  deprecated: number;
}

// Compliance interfaces
export interface ComplianceCertification {
  certificationId: string;
  type: string;
  level: ComplianceLevel;
  status: ComplianceStatus;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export interface ComplianceMetrics {
  totalCertifications: number;
  validCertifications: number;
  expiringSoon: number;
  expired: number;
  averageComplianceScore: number;
}

export interface ComplianceAlert {
  alertId: string;
  type: 'expiry_warning' | 'certification_expired' | 'renewal_required' | 'certification_revoked';
  level: 'info' | 'warning' | 'critical';
  certificationId: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// Registry search interfaces
export interface RegistrySearchParams {
  query?: string;
  registryType?: RegistryType;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface RegistrySearchResult {
  results: any[];
  total: number;
  page: number;
  pageSize: number;
  registryType?: RegistryType;
}

export interface UseRegistryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableWebSocket?: boolean;
}

export const useRegistry = (options: UseRegistryOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 15000, enableWebSocket = false } = options;

  // State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [certifications, setCertifications] = useState<ComplianceCertification[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  /**
   * Search across registries
   */
  const searchRegistries = useCallback(async (params: RegistrySearchParams = {}): Promise<RegistrySearchResult> => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.append('query', params.query);
      if (params.registryType) queryParams.append('registryType', params.registryType);
      if (params.status) queryParams.append('status', params.status);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const { data } = await apiClient.get<RegistrySearchResult>(
        `${REGISTRY_API_ENDPOINTS.SEARCH}?${queryParams.toString()}`
      );

      setSearchResults(data.results || []);
      setTotal(data.total || 0);
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to search registries');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get smart contract stats
   */
  const getSmartContractStats = useCallback(async (): Promise<SmartContractStats> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<SmartContractStats>(REGISTRY_API_ENDPOINTS.SMART_CONTRACT_STATS);
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch contract stats');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get smart contracts list
   */
  const getSmartContracts = useCallback(async (page: number = 1, pageSize: number = 20): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<{ contracts: SmartContract[]; total: number }>(
        `${REGISTRY_API_ENDPOINTS.SMART_CONTRACT_LIST}?page=${page}&pageSize=${pageSize}`
      );

      setContracts(data.contracts || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch contracts');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get smart contract details
   */
  const getSmartContractDetails = useCallback(async (contractId: string): Promise<SmartContract> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<SmartContract>(
        REGISTRY_API_ENDPOINTS.SMART_CONTRACT_DETAILS(contractId)
      );
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch contract details');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create smart contract
   */
  const createSmartContract = useCallback(async (contract: Partial<SmartContract>): Promise<SmartContract> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.post<SmartContract>(
        REGISTRY_API_ENDPOINTS.SMART_CONTRACT_CREATE,
        contract
      );
      // Refresh contracts list
      await getSmartContracts();
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to create contract');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getSmartContracts]);

  /**
   * Update smart contract
   */
  const updateSmartContract = useCallback(
    async (contractId: string, updates: Partial<SmartContract>): Promise<SmartContract> => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.put<SmartContract>(
          REGISTRY_API_ENDPOINTS.SMART_CONTRACT_UPDATE(contractId),
          updates
        );
        // Refresh contracts list
        await getSmartContracts();
        return data;
      } catch (err: any) {
        const error = new Error(err.message || 'Failed to update contract');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getSmartContracts]
  );

  /**
   * Get compliance metrics
   */
  const getComplianceMetrics = useCallback(async (): Promise<ComplianceMetrics> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<ComplianceMetrics>(REGISTRY_API_ENDPOINTS.COMPLIANCE_METRICS);
      return data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch compliance metrics');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get compliance certifications list
   */
  const getComplianceCertifications = useCallback(
    async (page: number = 1, pageSize: number = 20): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get<{ certifications: ComplianceCertification[]; total: number }>(
          `${REGISTRY_API_ENDPOINTS.COMPLIANCE_LIST}?page=${page}&pageSize=${pageSize}`
        );

        setCertifications(data.certifications || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        const error = new Error(err.message || 'Failed to fetch certifications');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get compliance alerts
   */
  const getComplianceAlerts = useCallback(async (): Promise<ComplianceAlert[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<{ alerts: ComplianceAlert[] }>(
        REGISTRY_API_ENDPOINTS.COMPLIANCE_ALERTS
      );
      setComplianceAlerts(data.alerts || []);
      return data.alerts || [];
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to fetch compliance alerts');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create compliance certification
   */
  const createComplianceCertification = useCallback(
    async (certification: Partial<ComplianceCertification>): Promise<ComplianceCertification> => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.post<ComplianceCertification>(
          REGISTRY_API_ENDPOINTS.COMPLIANCE_CREATE,
          certification
        );
        // Refresh certifications list
        await getComplianceCertifications();
        return data;
      } catch (err: any) {
        const error = new Error(err.message || 'Failed to create certification');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getComplianceCertifications]
  );

  /**
   * Handle registry WebSocket messages
   */
  const handleRegistryWSMessage = useCallback((message: RegistryWSMessage) => {
    if (message.type === 'connected' || message.type === 'disconnected') {
      return;
    }

    console.log('[useRegistry] Registry WebSocket message:', message);

    // Refresh appropriate data based on registry type
    if (message.registryType === RegistryType.SMART_CONTRACT) {
      getSmartContracts();
    } else if (message.registryType === RegistryType.COMPLIANCE) {
      getComplianceCertifications();
    }
  }, [getSmartContracts, getComplianceCertifications]);

  /**
   * Handle compliance alerts WebSocket messages
   */
  const handleComplianceWSMessage = useCallback((message: ComplianceWSMessage) => {
    if (message.type === 'connected' || message.type === 'disconnected') {
      return;
    }

    console.log('[useRegistry] Compliance WebSocket message:', message);

    // Add new alert to the list
    if (message.type === 'alert' || message.type === 'expiry_warning') {
      setComplianceAlerts((prev) => [
        {
          alertId: `alert-${Date.now()}`,
          type: message.type as any,
          level: message.level,
          timestamp: message.timestamp,
          acknowledged: false,
          ...message.data,
        },
        ...prev,
      ]);
    }

    // Refresh certifications
    getComplianceCertifications();
  }, [getComplianceCertifications]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Refresh based on what's currently loaded
      if (contracts.length > 0) {
        getSmartContracts();
      }
      if (certifications.length > 0) {
        getComplianceCertifications();
      }
      if (complianceAlerts.length > 0) {
        getComplianceAlerts();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, contracts.length, certifications.length, complianceAlerts.length, getSmartContracts, getComplianceCertifications, getComplianceAlerts]);

  /**
   * WebSocket effect for registry updates
   */
  useEffect(() => {
    if (!enableWebSocket) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to smart contract registry
    unsubscribers.push(
      assetWebSocketClient.connectToRegistry(RegistryType.SMART_CONTRACT, handleRegistryWSMessage)
    );

    // Subscribe to compliance registry
    unsubscribers.push(
      assetWebSocketClient.connectToRegistry(RegistryType.COMPLIANCE, handleRegistryWSMessage)
    );

    // Subscribe to compliance alerts
    unsubscribers.push(
      assetWebSocketClient.connectToComplianceAlerts(handleComplianceWSMessage)
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [enableWebSocket, handleRegistryWSMessage, handleComplianceWSMessage]);

  return {
    // State
    searchResults,
    contracts,
    certifications,
    complianceAlerts,
    loading,
    error,
    total,

    // Registry search
    searchRegistries,

    // Smart Contract actions
    getSmartContractStats,
    getSmartContracts,
    getSmartContractDetails,
    createSmartContract,
    updateSmartContract,

    // Compliance actions
    getComplianceMetrics,
    getComplianceCertifications,
    getComplianceAlerts,
    createComplianceCertification,

    // Utility
    setSearchResults,
    setContracts,
    setCertifications,
  };
};

export default useRegistry;
