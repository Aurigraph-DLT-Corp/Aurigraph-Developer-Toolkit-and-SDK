import React from 'react'
import { TreePine, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-forest-950 dark:to-emerald-950">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-forest-900 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-forest-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <TreePine className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-forest-900 dark:text-forest-100">
            Welcome to Sylvagraph
          </h2>
          <p className="mt-2 text-forest-600 dark:text-forest-400">
            Agroforestry monitoring and carbon credits platform
          </p>
        </div>
        
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-forest-300">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-400 h-4 w-4" />
                <input
                  type="email"
                  required
                  className="pl-10 w-full px-3 py-2 border border-forest-300 dark:border-forest-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 dark:bg-forest-800 dark:text-forest-100"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-forest-300">Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-400 h-4 w-4" />
                <input
                  type="password"
                  required
                  className="pl-10 w-full px-3 py-2 border border-forest-300 dark:border-forest-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 dark:bg-forest-800 dark:text-forest-100"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-forest-600 hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}