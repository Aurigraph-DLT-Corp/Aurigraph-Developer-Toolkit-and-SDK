import React from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-admin-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="h-20 w-20 text-admin-400" />
        </div>
        
        {/* Error Message */}
        <h1 className="mt-6 text-6xl font-bold text-admin-900">404</h1>
        <h2 className="mt-2 text-2xl font-semibold text-admin-700">
          Page Not Found
        </h2>
        <p className="mt-4 text-admin-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Actions */}
        <div className="mt-8 space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-aurex-600 hover:bg-aurex-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aurex-500 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-sm text-admin-500">
            <button
              onClick={() => window.history.back()}
              className="text-aurex-600 hover:text-aurex-500 font-medium transition-colors"
            >
              ← Go back to previous page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound