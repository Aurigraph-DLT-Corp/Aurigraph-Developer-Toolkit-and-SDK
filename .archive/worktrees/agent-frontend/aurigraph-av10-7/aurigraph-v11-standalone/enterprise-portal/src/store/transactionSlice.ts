import { createSlice } from '@reduxjs/toolkit'

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    list: [],
    total: 0,
    loading: false,
  },
  reducers: {
    setTransactions: (state, action) => {
      state.list = action.payload.list
      state.total = action.payload.total
    },
  },
})

export const { setTransactions } = transactionSlice.actions
export default transactionSlice.reducer