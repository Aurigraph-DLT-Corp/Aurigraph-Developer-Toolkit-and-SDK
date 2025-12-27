/**
 * Wallet Redux Slice
 * Manages wallet state (balance, address, etc.)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface WalletState {
  address: string | null
  balance: string
  nonce: number
  publicKey: string | null
  isLoading: boolean
  error: string | null
}

const initialState: WalletState = {
  address: null,
  balance: '0',
  nonce: 0,
  publicKey: null,
  isLoading: false,
  error: null,
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Set wallet address
    setAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload
    },

    // Set wallet balance
    setBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload
    },

    // Set wallet nonce
    setNonce: (state, action: PayloadAction<number>) => {
      state.nonce = action.payload
    },

    // Set public key
    setPublicKey: (state, action: PayloadAction<string>) => {
      state.publicKey = action.payload
    },

    // Update wallet info
    updateWallet: (
      state,
      action: PayloadAction<{
        address?: string
        balance?: string
        nonce?: number
        publicKey?: string
      }>
    ) => {
      const { address, balance, nonce, publicKey } = action.payload
      if (address !== undefined) state.address = address
      if (balance !== undefined) state.balance = balance
      if (nonce !== undefined) state.nonce = nonce
      if (publicKey !== undefined) state.publicKey = publicKey
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Reset wallet
    resetWallet: (state) => {
      state.address = null
      state.balance = '0'
      state.nonce = 0
      state.publicKey = null
      state.isLoading = false
      state.error = null
    },

    // Clear error
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setAddress,
  setBalance,
  setNonce,
  setPublicKey,
  updateWallet,
  setLoading,
  setError,
  resetWallet,
  clearError,
} = walletSlice.actions

export default walletSlice.reducer
