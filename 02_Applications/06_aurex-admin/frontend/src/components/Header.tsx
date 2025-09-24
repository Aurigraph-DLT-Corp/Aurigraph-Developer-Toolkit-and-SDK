import React from 'react'
import { useLocation } from 'react-router-dom'
import {
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import clsx from 'clsx'

const Header: React.FC = () => {
  const location = useLocation()
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname
    switch (path) {
      case '/dashboard':
        return 'Dashboard'
      case '/users':
        return 'User Management'
      case '/organizations':
        return 'Organizations'
      case '/applications':
        return 'Applications'
      case '/monitoring':
        return 'System Monitoring'
      case '/audit-logs':
        return 'Audit Logs'
      case '/settings':
        return 'System Settings'
      default:
        return 'Admin Dashboard'
    }
  }

  const getPageDescription = () => {
    const path = location.pathname
    switch (path) {
      case '/dashboard':
        return 'Monitor system health and platform metrics'
      case '/users':
        return 'Manage user accounts, roles, and permissions'
      case '/organizations':
        return 'Configure tenant organizations and settings'
      case '/applications':
        return 'Monitor application status and deployments'
      case '/monitoring':
        return 'System performance and infrastructure monitoring'
      case '/audit-logs':
        return 'Security events and user activity tracking'
      case '/settings':
        return 'Platform configuration and system settings'
      default:
        return 'Aurex Platform Administration'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-admin-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Page title and description */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-admin-900 sm:truncate">
            {getPageTitle()}
          </h1>
          <p className="mt-1 text-sm text-admin-500">
            {getPageDescription()}
          </p>
        </div>

        {/* Search and actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-admin-400" />
              </div>
              <input
                type="text"
                placeholder="Search users, logs, applications..."
                className="block w-80 pl-10 pr-3 py-2 border border-admin-300 rounded-lg leading-5 bg-white placeholder-admin-500 focus:outline-none focus:placeholder-admin-400 focus:ring-1 focus:ring-aurex-500 focus:border-aurex-500 text-sm"
              />
            </div>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-admin-400 hover:text-admin-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aurex-500 rounded-lg"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          </button>

          {/* User menu */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aurex-500">
                <span className="sr-only">Open user menu</span>
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-8 w-8 text-admin-400" />
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-admin-900">Admin User</div>
                    <div className="text-xs text-admin-500">System Administrator</div>
                  </div>
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={clsx(
                        active ? 'bg-admin-100' : '',
                        'block px-4 py-2 text-sm text-admin-700'
                      )}
                    >
                      Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={clsx(
                        active ? 'bg-admin-100' : '',
                        'block px-4 py-2 text-sm text-admin-700'
                      )}
                    >
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        active ? 'bg-admin-100' : '',
                        'block w-full text-left px-4 py-2 text-sm text-admin-700'
                      )}
                      onClick={() => {
                        // Handle logout
                        localStorage.removeItem('token')
                        window.location.href = '/login'
                      }}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}

export default Header