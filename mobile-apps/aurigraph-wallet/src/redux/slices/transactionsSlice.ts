/**
 * Transactions Redux Slice
 * Manages transaction history and pending transactions
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Transaction {
  hash: string
  from: string
  to: string
  amount: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  nonce: number
  fee?: string
}

export interface TransactionsState {
  items: Transaction[]
  isLoading: boolean
  error: string | null
  filter: 'all' | 'sent' | 'received' | 'pending'
  currentAddress: string | null
}

const initialState: TransactionsState = {
  items: [],
  isLoading: false,
  error: null,
  filter: 'all',
  currentAddress: null,
}

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // Add transaction
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload) // Add to beginning
    },

    // Update transaction status
    updateTransaction: (
      state,
      action: PayloadAction<{
        hash: string
        status: Transaction['status']
      }>
    ) => {
      const transaction = state.items.find((t) => t.hash === action.payload.hash)
      if (transaction) {
        transaction.status = action.payload.status
      }
    },

    // Set transactions list
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.items = action.payload
    },

    // Append transactions (pagination)
    appendTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.items.push(...action.payload)
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Set filter
    setFilter: (state, action: PayloadAction<TransactionsState['filter']>) => {
      state.filter = action.payload
    },

    // Set current address
    setCurrentAddress: (state, action: PayloadAction<string>) => {
      state.currentAddress = action.payload
    },

    // Clear all transactions
    clearTransactions: (state) => {
      state.items = []
      state.error = null
    },

    // Clear error
    clearError: (state) => {
      state.error = null
    },

    // Get filtered transactions
    getFiltered: (state) => {
      if (!state.currentAddress) return
      const address = state.currentAddress

      switch (state.filter) {
        case 'sent':
          return state.items.filter((t) => t.from === address)
        case 'received':
          return state.items.filter((t) => t.to === address)
        case 'pending':
          return state.items.filter((t) => t.status === 'pending')
        default:
          return state.items
      }
    },
  },
})

export const {
  addTransaction,
  updateTransaction,
  setTransactions,
  appendTransactions,
  setLoading,
  setError,
  setFilter,
  setCurrentAddress,
  clearTransactions,
  clearError,
} = transactionsSlice.actions

export default transactionsSlice.reducer
