/**
 * Sylvagraph Sidebar - Main navigation menu
 */

import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, BarChart3, Map, Satellite, CreditCard, Users, 
  TreePine, Coins, TrendingUp, Settings, ChevronRight,
  Leaf, Shield, Cloud
} from 'lucide-react'

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { 
    name: 'Projects', 
    href: '/projects', 
    icon: TreePine,
    children: [
      { name: 'All Projects', href: '/projects' },
      { name: 'Create Project', href: '/projects/new' },
      { name: 'Project Analytics', href: '/projects/analytics' },
    ]
  },
  { 
    name: 'Monitoring', 
    href: '/monitoring', 
    icon: Satellite,
    children: [
      { name: 'Live Monitoring', href: '/monitoring' },
      { name: 'Satellite Data', href: '/monitoring/satellite' },
      { name: 'Drone Flights', href: '/monitoring/drone' },
      { name: 'Field Surveys', href: '/monitoring/field' },
    ]
  },
  { 
    name: 'Carbon Credits', 
    href: '/credits', 
    icon: Leaf,
    children: [
      { name: 'Credit Batches', href: '/credits' },
      { name: 'Tokenization', href: '/credits/tokens' },
      { name: 'Registry Integration', href: '/credits/registry' },
      { name: 'Trading', href: '/credits/trading' },
    ]
  },
  { name: 'Farmers', href: '/farmers', icon: Users },
  { 
    name: 'Compliance', 
    href: '/compliance', 
    icon: Shield,
    children: [
      { name: 'DMRV Reports', href: '/compliance/dmrv' },
      { name: 'VVB Portal', href: '/compliance/vvb' },
      { name: 'Methodologies', href: '/compliance/methodologies' },
    ]
  },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function SylvagraphSidebar() {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-64 bg-white/80 dark:bg-forest-900/80 backdrop-blur-sm border-r border-forest-200/50 dark:border-forest-700/50 flex flex-col">
      {/* Logo and brand */}
      <div className="p-6 border-b border-forest-200/50 dark:border-forest-700/50">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-forest-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <TreePine className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-forest-900 dark:text-forest-100">Sylvagraph</h1>
            <p className="text-xs text-forest-600 dark:text-forest-400">Agroforestry Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-forest-100 dark:bg-forest-800 text-forest-900 dark:text-forest-100'
                      : 'text-forest-700 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-800/50'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${
                      expandedItems.includes(item.name) ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
                {expandedItems.includes(item.name) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive(child.href)
                            ? 'bg-forest-100 dark:bg-forest-800 text-forest-900 dark:text-forest-100'
                            : 'text-forest-600 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-800/50'
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-forest-100 dark:bg-forest-800 text-forest-900 dark:text-forest-100'
                    : 'text-forest-700 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-800/50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Status footer */}
      <div className="p-4 border-t border-forest-200/50 dark:border-forest-700/50">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">System Status</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}