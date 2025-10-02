import React from 'react'
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline'

const Organizations: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-admin-900">Organizations</h1>
          <p className="mt-1 text-sm text-admin-600">
            Manage tenant organizations and their configurations
          </p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Organization
        </button>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-admin-400" />
          <h3 className="mt-4 text-lg font-medium text-admin-900">Organizations Management</h3>
          <p className="mt-2 text-admin-600">
            This page will contain organization management functionality.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Organizations