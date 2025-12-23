import { createSlice } from '@reduxjs/toolkit'

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    metrics: {
      tps: 0,
      blockHeight: 0,
      activeNodes: 0,
      transactionVolume: '0',
    },
    loading: false,
    error: null,
  },
  reducers: {
    setMetrics: (state, action) => {
      state.metrics = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
  },
})

export const { setMetrics, setLoading } = dashboardSlice.actions
export default dashboardSlice.reducer