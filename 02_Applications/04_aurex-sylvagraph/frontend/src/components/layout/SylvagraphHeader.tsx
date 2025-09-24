/**
 * Sylvagraph Header - Main navigation and user controls
 */

import React from 'react'
import { Bell, Search, Settings, User, Globe } from 'lucide-react'

export function SylvagraphHeader() {
  return (
    <header className="bg-white/80 dark:bg-forest-900/80 backdrop-blur-sm border-b border-forest-200/50 dark:border-forest-700/50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search and breadcrumbs */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search projects, farmers, or credits..."
              className="pl-10 pr-4 py-2 bg-forest-50/50 dark:bg-forest-800/50 border border-forest-200 dark:border-forest-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        {/* Actions and user menu */}
        <div className="flex items-center space-x-4">
          {/* Global status indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm">
            <Globe className="h-4 w-4" />
            <span>10,247 ha monitored</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-forest-600 dark:text-forest-400 hover:bg-forest-100 dark:hover:bg-forest-800 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-forest-600 dark:text-forest-400 hover:bg-forest-100 dark:hover:bg-forest-800 rounded-lg">
            <Settings className="h-5 w-5" />
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm">
              <p className="font-medium text-forest-900 dark:text-forest-100">Sarah Chen</p>
              <p className="text-forest-600 dark:text-forest-400">Project Manager</p>
            </div>
            <div className="h-10 w-10 bg-forest-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}