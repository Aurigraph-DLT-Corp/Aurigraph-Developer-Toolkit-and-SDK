/**
 * useBlockchainAPI Hook Tests
 *
 * Tests for blockchain API hooks including loading states,
 * error handling, and data caching with React Testing Library
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import {
  useBlockchainAPI,
  useERC20,
  useBitcoinUTXO,
  useCosmos,
  useSolana,
  useSubstrate,
  useBlockchainEvents,
} from '../../hooks/useBlockchainAPI';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock ant design message
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useBlockchainAPI Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useBlockchainAPI());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
      expect(typeof result.current.callAPI).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('GET Requests', () => {
    it('should handle successful GET request', async () => {
      const mockData = { balance: '100.5', token: 'USDT' };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useBlockchainAPI());

      let responseData: any;

      await act(async () => {
        responseData = await result.current.callAPI('get', '/test-endpoint', { param: 'value' });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        { params: { param: 'value' } }
      );

      expect(responseData).toEqual(mockData);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    it('should set loading state during GET request', async () => {
      mockedAxios.get.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
      );

      const { result } = renderHook(() => useBlockchainAPI());

      act(() => {
        result.current.callAPI('get', '/test-endpoint');
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('POST Requests', () => {
    it('should handle successful POST request', async () => {
      const mockData = { transactionId: 'tx123', status: 'confirmed' };
      mockedAxios.post.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useBlockchainAPI());

      let responseData: any;

      await act(async () => {
        responseData = await result.current.callAPI('post', '/submit-tx', {
          from: '0x123',
          to: '0x456',
          amount: '10',
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/submit-tx'),
        { from: '0x123', to: '0x456', amount: '10' }
      );

      expect(responseData).toEqual(mockData);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('PUT Requests', () => {
    it('should handle successful PUT request', async () => {
      const mockData = { updated: true };
      mockedAxios.put.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        await result.current.callAPI('put', '/update-config', { setting: 'value' });
      });

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/update-config'),
        { setting: 'value' }
      );
    });
  });

  describe('DELETE Requests', () => {
    it('should handle successful DELETE request', async () => {
      const mockData = { deleted: true };
      mockedAxios.delete.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        await result.current.callAPI('delete', '/remove-item', { id: '123' });
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/remove-item'),
        { params: { id: '123' } }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        message: 'Request failed',
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        try {
          await result.current.callAPI('get', '/fail-endpoint');
        } catch (error) {
          // Error expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      expect(result.current.error?.message).toBe('Internal Server Error');
      expect(result.current.error?.code).toBe('500');
      expect(result.current.loading).toBe(false);
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        try {
          await result.current.callAPI('get', '/test-endpoint');
        } catch (error) {
          // Error expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      expect(result.current.error?.message).toBe('Network Error');
    });

    it('should clear error state', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Test Error'));

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        try {
          await result.current.callAPI('get', '/fail-endpoint');
        } catch (error) {
          // Error expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Message Display', () => {
    it('should show success message when requested', async () => {
      const { message } = await import('antd');
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        await result.current.callAPI('post', '/test-endpoint', {}, {
          showMessage: true,
          successMessage: 'Operation successful!',
        });
      });

      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('Operation successful!');
      });
    });

    it('should show error message on failure', async () => {
      const { message } = await import('antd');
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: {} },
        message: 'Not found',
      });

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        try {
          await result.current.callAPI('get', '/not-found');
        } catch (error) {
          // Error expected
        }
      });

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled();
      });
    });

    it('should not show messages when showMessage is false', async () => {
      const { message } = await import('antd');
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useBlockchainAPI());

      await act(async () => {
        await result.current.callAPI('get', '/test-endpoint', {}, { showMessage: false });
      });

      expect(message.success).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
    });
  });
});

describe('useERC20 Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get tokens for a chain', async () => {
    const mockTokens = [
      { address: '0x123', symbol: 'USDT', name: 'Tether' },
      { address: '0x456', symbol: 'USDC', name: 'USD Coin' },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockTokens });

    const { result } = renderHook(() => useERC20());

    let tokens: any;

    await act(async () => {
      tokens = await result.current.getTokens('ethereum');
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/blockchain/erc20/tokens'),
      expect.objectContaining({ params: undefined })
    );

    expect(tokens).toEqual(mockTokens);
  });

  it('should get token balance', async () => {
    const mockBalance = { balance: '1000.50', decimals: 6 };
    mockedAxios.post.mockResolvedValueOnce({ data: mockBalance });

    const { result } = renderHook(() => useERC20());

    let balance: any;

    await act(async () => {
      balance = await result.current.getBalance('0xToken', '0xWallet', 'ethereum');
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/blockchain/erc20/balance'),
      { contractAddress: '0xToken', walletAddress: '0xWallet', chainId: 'ethereum' }
    );

    expect(balance).toEqual(mockBalance);
  });

  it('should get token details', async () => {
    const mockDetails = {
      address: '0x123',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      totalSupply: '1000000000',
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockDetails });

    const { result } = renderHook(() => useERC20());

    let details: any;

    await act(async () => {
      details = await result.current.getTokenDetails('0x123', 'ethereum');
    });

    expect(details).toEqual(mockDetails);
  });
});

describe('useBitcoinUTXO Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get UTXOs for an address', async () => {
    const mockUTXOs = [
      { txid: 'abc123', vout: 0, value: 10000, scriptPubKey: 'script1' },
      { txid: 'def456', vout: 1, value: 20000, scriptPubKey: 'script2' },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockUTXOs });

    const { result } = renderHook(() => useBitcoinUTXO());

    let utxos: any;

    await act(async () => {
      utxos = await result.current.getUTXOs('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'bitcoin');
    });

    expect(utxos).toEqual(mockUTXOs);
  });

  it('should estimate transaction fee', async () => {
    const mockFee = { fee: 2500, feeRate: 50, totalBytes: 250 };
    mockedAxios.post.mockResolvedValueOnce({ data: mockFee });

    const { result } = renderHook(() => useBitcoinUTXO());

    let fee: any;

    await act(async () => {
      fee = await result.current.estimateFee(2, 2, true, 'bitcoin');
    });

    expect(fee).toEqual(mockFee);
  });

  it('should validate Bitcoin address', async () => {
    const mockValidation = { valid: true, network: 'mainnet', type: 'p2pkh' };
    mockedAxios.get.mockResolvedValueOnce({ data: mockValidation });

    const { result } = renderHook(() => useBitcoinUTXO());

    let validation: any;

    await act(async () => {
      validation = await result.current.validateAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'bitcoin');
    });

    expect(validation.valid).toBe(true);
  });
});

describe('useCosmos Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get account information', async () => {
    const mockAccount = {
      address: 'cosmos1...',
      balance: [{ denom: 'uatom', amount: '1000000' }],
      sequence: 5,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockAccount });

    const { result } = renderHook(() => useCosmos());

    let account: any;

    await act(async () => {
      account = await result.current.getAccount('cosmos1...', 'cosmoshub');
    });

    expect(account).toEqual(mockAccount);
  });

  it('should submit transaction', async () => {
    const mockResponse = { txhash: 'ABC123', height: 1000, success: true };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useCosmos());

    let response: any;

    await act(async () => {
      response = await result.current.submitTransaction({ type: 'send' }, 'cosmoshub');
    });

    expect(response.success).toBe(true);
  });
});

describe('useSolana Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get Solana account', async () => {
    const mockAccount = {
      pubkey: 'ABC123...',
      lamports: 1000000000,
      owner: 'System Program',
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockAccount });

    const { result } = renderHook(() => useSolana());

    let account: any;

    await act(async () => {
      account = await result.current.getAccount('ABC123...', 'mainnet');
    });

    expect(account).toEqual(mockAccount);
  });

  it('should send Solana transaction', async () => {
    const mockResponse = { signature: 'sig123', success: true };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useSolana());

    let response: any;

    await act(async () => {
      response = await result.current.sendTransaction('from123', 'to456', 1000000, 'mainnet');
    });

    expect(response.success).toBe(true);
  });
});

describe('useSubstrate Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get Substrate account', async () => {
    const mockAccount = {
      address: '5GrwvaEF...',
      balance: { free: 1000000000, reserved: 0 },
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockAccount });

    const { result } = renderHook(() => useSubstrate());

    let account: any;

    await act(async () => {
      account = await result.current.getAccount('5GrwvaEF...', 'polkadot');
    });

    expect(account).toEqual(mockAccount);
  });

  it('should get runtime metadata', async () => {
    const mockMetadata = { version: 9, modules: [] };
    mockedAxios.get.mockResolvedValueOnce({ data: mockMetadata });

    const { result } = renderHook(() => useSubstrate());

    let metadata: any;

    await act(async () => {
      metadata = await result.current.getRuntimeMetadata('polkadot');
    });

    expect(metadata).toEqual(mockMetadata);
  });
});

describe('useBlockchainEvents Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query blockchain events', async () => {
    const mockEvents = [
      {
        signature: 'Transfer(address,address,uint256)',
        from: '0x123',
        to: '0x456',
        value: '1000',
        blockNumber: 12345,
      },
    ];

    mockedAxios.post.mockResolvedValueOnce({ data: mockEvents });

    const { result } = renderHook(() => useBlockchainEvents());

    let events: any;

    await act(async () => {
      events = await result.current.queryEvents({
        eventSignatures: ['Transfer(address,address,uint256)'],
        fromBlock: 12000,
        toBlock: 13000,
      });
    });

    expect(events).toEqual(mockEvents);
  });
});
