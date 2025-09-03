'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Shield,
  Network,
  Zap,
  Brain,
  Search,
  Settings,
  Activity,
  TrendingUp,
  Atom,
  BarChart3
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/av18', icon: Atom, label: 'AV10-18' },
  { href: '/vizro', icon: BarChart3, label: 'Vizro Analytics' },
  { href: '/security', icon: Shield, label: 'Quantum Security' },
  { href: '/crosschain', icon: Network, label: 'Cross-Chain' },
  { href: '/transactions', icon: Search, label: 'Explorer' },
  { href: '/ai', icon: Brain, label: 'AI Optimizer' },
  { href: '/nodes', icon: Activity, label: 'Validators' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-blue-400 animate-pulse" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AV10-18 Platform
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white quantum-glow'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="status-indicator status-active">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
              Online
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}