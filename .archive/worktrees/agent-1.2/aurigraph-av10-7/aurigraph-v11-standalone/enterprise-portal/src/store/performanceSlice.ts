import { createSlice } from '@reduxjs/toolkit'

const performanceSlice = createSlice({
  name: 'performance',
  initialState: {
    tpsHistory: [],
    latency: 0,
    throughput: 0,
    loading: false,
  },
  reducers: {
    setPerformanceData: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
})

export const { setPerformanceData } = performanceSlice.actions
export default performanceSlice.reducer