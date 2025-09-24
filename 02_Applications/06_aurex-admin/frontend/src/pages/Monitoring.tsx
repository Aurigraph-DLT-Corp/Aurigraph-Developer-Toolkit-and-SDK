import React from 'react'
import { ChartBarIcon, BellIcon } from '@heroicons/react/24/outline'

const Monitoring: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-admin-900">System Monitoring</h1>
          <p className="mt-1 text-sm text-admin-600">
            Monitor system performance and infrastructure health
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-admin-400" />
          <h3 className="mt-4 text-lg font-medium text-admin-900">System Monitoring</h3>
          <p className="mt-2 text-admin-600">
            This page will contain system monitoring dashboards and alerts.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Monitoring