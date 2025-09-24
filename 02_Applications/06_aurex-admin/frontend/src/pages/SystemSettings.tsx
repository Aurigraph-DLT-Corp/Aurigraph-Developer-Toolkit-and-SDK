import React from 'react'
import { Cog6ToothIcon, ServerIcon } from '@heroicons/react/24/outline'

const SystemSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-admin-900">System Settings</h1>
          <p className="mt-1 text-sm text-admin-600">
            Configure platform settings and system parameters
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-admin-400" />
          <h3 className="mt-4 text-lg font-medium text-admin-900">System Settings</h3>
          <p className="mt-2 text-admin-600">
            This page will contain system configuration options and settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings