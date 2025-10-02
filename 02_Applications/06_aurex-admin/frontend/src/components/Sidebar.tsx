import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ServerIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'System overview and metrics'
  },
  {
    name: 'Users',
    href: '/users',
    icon: UsersIcon,
    description: 'User management and roles'
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: BuildingOfficeIcon,
    description: 'Tenant and organization management'
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: CpuChipIcon,
    description: 'Platform applications status'
  },
  {
    name: 'Monitoring',
    href: '/monitoring',
    icon: ChartBarIcon,
    description: 'System monitoring and alerts'
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: DocumentTextIcon,
    description: 'Security and activity logs'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'System configuration'
  },
]

const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-admin-200">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ServerIcon className="h-8 w-8 text-aurex-600" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-admin-900">Aurex Admin</h1>
              <p className="text-sm text-admin-500">Platform Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-aurex-50 text-aurex-700 border-r-4 border-aurex-600'
                    : 'text-admin-600 hover:bg-admin-50 hover:text-admin-900'
                )}
                title={item.description}
              >
                <item.icon
                  className={clsx(
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
                    isActive ? 'text-aurex-600' : 'text-admin-400 group-hover:text-admin-500'
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-admin-500 mt-0.5 leading-tight">
                    {item.description}
                  </div>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-admin-200">
          <div className="text-xs text-admin-500">
            <div className="font-medium">Aurex Platform v3.3</div>
            <div className="mt-1">System Administrator</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar