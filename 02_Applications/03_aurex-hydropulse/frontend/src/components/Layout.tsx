/**
 * Aurex HydroPulse™ - Main Layout Component
 * Professional SaaS layout with navigation and branding
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  CpuChipIcon,
  BeakerIcon,
  AcademicCapIcon,
  CogIcon,
  UserCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Facilities', href: '/facilities', icon: ChartBarIcon },
  { name: 'Sensors', href: '/sensors', icon: CpuChipIcon },
  { name: 'Water Quality', href: '/water-quality', icon: BeakerIcon },
  { name: 'AWD Education', href: '/education', icon: AcademicCapIcon },
  { name: 'Conservation', href: '/conservation', icon: CogIcon },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Don't show sidebar on home page
  const isHomePage = location.pathname === '/';

  if (isHomePage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform lg:hidden transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">💧</span>
            </div>
            <div>
              <div className="text-xs text-gray-600 leading-none">Aurex Ecosystem</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">Aurex HydroPulse</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200 shadow-sm">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">💧</span>
              </div>
              <div>
                <div className="text-xs text-gray-600 leading-none">Aurex Ecosystem</div>
                <div className="text-lg font-bold text-gray-900 leading-tight">Aurex HydroPulse</div>
              </div>
            </div>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <UserCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

const SidebarContent: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
              isActive
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
            {item.name}
          </Link>
        );
      })}
      
      {/* Quick Stats in Sidebar */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Quick Stats
        </h3>
        <div className="mt-4 space-y-3">
          <div className="px-3 py-2 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Water Saved</span>
              <span className="text-sm font-semibold text-green-700">2.4M L</span>
            </div>
          </div>
          <div className="px-3 py-2 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Sensors</span>
              <span className="text-sm font-semibold text-blue-700">247</span>
            </div>
          </div>
          <div className="px-3 py-2 bg-purple-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Facilities</span>
              <span className="text-sm font-semibold text-purple-700">18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Support Link */}
      <div className="pt-4 border-t border-gray-200">
        <Link
          to="/support"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Support
        </Link>
      </div>
    </nav>
  );
};

export default Layout;