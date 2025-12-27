/**
 * Dashboard Page
 * Live statistics and blockchain metrics
 */

import Head from 'next/head'
import { useEffect, useState } from 'react'

interface BlockchainStats {
  tps: number
  totalTransactions: number
  activeNodes: number
  totalNodes: number
  averageBlockTime: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<BlockchainStats>({
    tps: 0,
    totalTransactions: 0,
    activeNodes: 0,
    totalNodes: 0,
    averageBlockTime: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Fetch from API
        // const response = await fetch('/api/stats')
        // const data = await response.json()
        // setStats(data)

        // Mock data for now
        setStats({
          tps: 1250000,
          totalTransactions: 2500000000,
          activeNodes: 48,
          totalNodes: 48,
          averageBlockTime: 850,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const metrics = [
    { label: 'TPS', value: stats.tps.toLocaleString(), unit: 'tx/s' },
    { label: 'Total Transactions', value: (stats.totalTransactions / 1e9).toFixed(1), unit: 'B' },
    { label: 'Active Nodes', value: stats.activeNodes, unit: `/${stats.totalNodes}` },
    { label: 'Avg Block Time', value: stats.averageBlockTime, unit: 'ms' },
  ]

  return (
    <>
      <Head>
        <title>Dashboard - Aurigraph V11</title>
        <meta name="description" content="Aurigraph V11 blockchain statistics and metrics" />
      </Head>

      <main className="flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
            <p className="text-lg text-indigo-100">
              Real-time Aurigraph V11 blockchain metrics and statistics
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading metrics...</p>
              </div>
            ) : (
              <>
                {/* Metrics Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="bg-white rounded-lg p-6 border border-gray-200">
                      <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-bold text-indigo-600">{metric.value}</span>
                        <span className="ml-2 text-gray-600 text-sm">{metric.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Transaction Volume</h2>
                    <div className="bg-gray-100 h-48 rounded flex items-center justify-center">
                      <p className="text-gray-600">Chart Placeholder</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Network Health</h2>
                    <div className="bg-gray-100 h-48 rounded flex items-center justify-center">
                      <p className="text-gray-600">Chart Placeholder</p>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
                  <h2 className="text-xl font-bold text-blue-900 mb-4">About These Metrics</h2>
                  <p className="text-blue-800">
                    Aurigraph V11 is designed to handle 2M+ transactions per second with sub-second finality.
                    These metrics are updated every 5 seconds and represent real-time blockchain performance.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
