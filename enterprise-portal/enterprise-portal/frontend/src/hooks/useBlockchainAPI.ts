/**
 * useBlockchainAPI Hook
 *
 * Provides a unified interface for blockchain API operations across different
 * blockchain networks and protocols. Handles API calls, error management, and
 * response normalization.
 */

import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { message } from 'antd';

interface APIError {
  message: string;
  code?: string;
  details?: any;
}

interface UseBlockchainAPIReturn {
  loading: boolean;
  error: APIError | null;
  data: any | null;
  callAPI: (
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    params?: any,
    options?: APICallOptions
  ) => Promise<any>;
  clearError: () => void;
}

interface APICallOptions {
  showMessage?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://dlt.aurigraph.io/api/v11';

/**
 * Hook for blockchain API operations
 *
 * @example
 * const { data, loading, error, callAPI } = useBlockchainAPI();
 *
 * // Get ERC20 token balance
 * const balance = await callAPI('post', '/blockchain/erc20/balance', {
 *   contractAddress: '0x...',
 *   walletAddress: '0x...',
 *   chainId: 'ethereum'
 * });
 *
 * // Query blockchain events
 * const events = await callAPI('post', '/blockchain/events/query', {
 *   eventSignatures: ['Transfer(address,address,uint256)'],
 *   contractAddress: '0x...'
 * });
 */
export const useBlockchainAPI = (): UseBlockchainAPIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [data, setData] = useState<any | null>(null);

  const callAPI = useCallback(
    async (
      method: 'get' | 'post' | 'put' | 'delete',
      endpoint: string,
      params?: any,
      options: APICallOptions = {}
    ) => {
      const { showMessage = true, successMessage, errorMessage } = options;

      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE_URL}${endpoint}`;
        let response;

        if (method === 'get') {
          response = await axios.get(url, { params });
        } else if (method === 'post') {
          response = await axios.post(url, params);
        } else if (method === 'put') {
          response = await axios.put(url, params);
        } else if (method === 'delete') {
          response = await axios.delete(url, { params });
        }

        setData(response?.data);

        if (showMessage && successMessage) {
          message.success(successMessage);
        }

        return response?.data;
      } catch (err) {
        const axiosError = err as AxiosError;
        const errorMessage_ =
          errorMessage ||
          (axiosError?.response?.data as any)?.message ||
          axiosError?.message ||
          'API call failed';

        const apiError: APIError = {
          message: errorMessage_,
          code: (axiosError?.response?.status || 500).toString(),
          details: axiosError?.response?.data,
        };

        setError(apiError);

        if (showMessage) {
          message.error(errorMessage_);
        }

        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    data,
    callAPI,
    clearError,
  };
};

/**
 * Hook for ERC20 token operations
 *
 * @example
 * const { getBalance, getTokenDetails } = useERC20();
 *
 * const balance = await getBalance({
 *   tokenAddress: '0x...',
 *   walletAddress: '0x...',
 *   chainId: 'ethereum'
 * });
 */
export const useERC20 = () => {
  const { callAPI, ...rest } = useBlockchainAPI();

  const getTokens = useCallback(
    async (chainId: string) => {
      return callAPI('get', `/blockchain/erc20/tokens?chain=${chainId}`, undefined, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const getBalance = useCallback(
    async (contractAddress: string, walletAddress: string, chainId: string) => {
      return callAPI(
        'post',
        '/blockchain/erc20/balance',
        {
          contractAddress,
          walletAddress,
          chainId,
        },
        {
          showMessage: false,
        }
      );
    },
    [callAPI]
  );

  const getTokenDetails = useCallback(
    async (tokenAddress: string, chainId: string) => {
      return callAPI('get', `/blockchain/erc20/${tokenAddress}?chain=${chainId}`, undefined, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  return {
    getTokens,
    getBalance,
    getTokenDetails,
    ...rest,
  };
};

/**
 * Hook for Bitcoin UTXO operations
 *
 * @example
 * const { getUTXOs, estimateFee } = useBitcoinUTXO();
 *
 * const utxos = await getUTXOs('1A1z7agoat...', 'bitcoin');
 */
export const useBitcoinUTXO = () => {
  const { callAPI, ...rest } = useBlockchainAPI();

  const getUTXOs = useCallback(
    async (address: string, chain: string) => {
      return callAPI('get', `/blockchain/utxo/address/${address}`, { chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const estimateFee = useCallback(
    async (inputCount: number, outputCount: number, isSegWit: boolean, chain: string) => {
      return callAPI(
        'post',
        '/blockchain/utxo/estimate-fee',
        {
          inputCount,
          outputCount,
          isSegWit,
          chain,
        },
        {
          showMessage: false,
        }
      );
    },
    [callAPI]
  );

  const validateAddress = useCallback(
    async (address: string, chain: string) => {
      return callAPI('get', `/blockchain/utxo/validate-address/${address}`, { chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const calculateChange = useCallback(
    async (inputTotal: number, outputs: number[], fee: number) => {
      return callAPI(
        'post',
        '/blockchain/utxo/calculate-change',
        {
          inputTotal,
          outputs,
          fee,
        },
        {
          showMessage: false,
        }
      );
    },
    [callAPI]
  );

  return {
    getUTXOs,
    estimateFee,
    validateAddress,
    calculateChange,
    ...rest,
  };
};

/**
 * Hook for Cosmos chain operations
 *
 * @example
 * const { getAccount, submitTransaction } = useCosmos();
 *
 * const account = await getAccount('cosmos1...', 'cosmoshub');
 */
export const useCosmos = () => {
  const { callAPI, ...rest } = useBlockchainAPI();

  const getAccount = useCallback(
    async (address: string, chain: string) => {
      return callAPI('get', `/blockchain/cosmos/account/${address}`, { chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const validateTransaction = useCallback(
    async (fromAddress: string, toAddress: string, amount: string, denom: string, chain: string) => {
      return callAPI(
        'post',
        '/blockchain/cosmos/validate-tx',
        {
          fromAddress,
          toAddress,
          amount,
          denom,
          chain,
        },
        {
          showMessage: false,
        }
      );
    },
    [callAPI]
  );

  const submitTransaction = useCallback(
    async (tx: any, chain: string) => {
      return callAPI('post', '/blockchain/cosmos/submit-tx', { tx, chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const queryTransactionStatus = useCallback(
    async (txHash: string, chain: string) => {
      return callAPI('get', `/blockchain/cosmos/tx/${txHash}`, { chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  return {
    getAccount,
    validateTransaction,
    submitTransaction,
    queryTransactionStatus,
    ...rest,
  };
};

/**
 * Hook for Solana operations
 *
 * @example
 * const { getAccount, sendTransaction } = useSolana();
 *
 * const account = await getAccount('1XXXXXX...', 'mainnet');
 */
export const useSolana = () => {
  const { callAPI, ...rest } = useBlockchainAPI();

  const getAccount = useCallback(
    async (publicKey: string, cluster: string) => {
      return callAPI('get', `/blockchain/solana/account/${publicKey}`, { cluster }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const sendTransaction = useCallback(
    async (fromPublicKey: string, toPublicKey: string, lamports: number, cluster: string) => {
      return callAPI(
        'post',
        '/blockchain/solana/send-transaction',
        {
          fromPublicKey,
          toPublicKey,
          lamports,
          cluster,
        },
        {
          showMessage: false,
        }
      );
    },
    [callAPI]
  );

  return {
    getAccount,
    sendTransaction,
    ...rest,
  };
};

/**
 * Hook for Substrate operations
 *
 * @example
 * const { getAccount, submitExtrinsic } = useSubstrate();
 *
 * const account = await getAccount('1XXXXXX...', 'polkadot');
 */
export const useSubstrate = () => {
  const { callAPI, ...rest } = useBlockchainAPI();

  const getAccount = useCallback(
    async (address: string, chain: string) => {
      return callAPI('get', `/blockchain/substrate/account/${address}`, { chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const submitExtrinsic = useCallback(
    async (
      senderAddress: string,
      recipientAddress: string,
      amount: string,
      palletName: string,
      functionName: string,
      chain: string
    ) => {
      return callAPI(
        'post',
        '/blockchain/substrate/submit-tx',
        {
          senderAddress,
          recipientAddress,
          amount,
          palletName,
          functionName,
          chain,
        },
        {
          showMessage: false,
        }
      );
    },
    [callAPI]
  );

  const getRuntimeMetadata = useCallback(
    async (chain: string) => {
      return callAPI('get', '/blockchain/substrate/runtime-metadata', { chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  const validateAddress = useCallback(
    async (address: string, chain: string) => {
      return callAPI('get', `/blockchain/substrate/validate-address/${address}`, { chain }, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  return {
    getAccount,
    submitExtrinsic,
    getRuntimeMetadata,
    validateAddress,
    ...rest,
  };
};

/**
 * Hook for blockchain event operations
 *
 * @example
 * const { queryEvents } = useBlockchainEvents();
 *
 * const events = await queryEvents({
 *   eventSignatures: ['Transfer(address,address,uint256)'],
 *   fromBlock: 1000000,
 *   toBlock: 1000100
 * });
 */
export const useBlockchainEvents = () => {
  const { callAPI, ...rest } = useBlockchainAPI();

  const queryEvents = useCallback(
    async (filters: any) => {
      return callAPI('post', '/blockchain/events/query', filters, {
        showMessage: false,
      });
    },
    [callAPI]
  );

  return {
    queryEvents,
    ...rest,
  };
};
