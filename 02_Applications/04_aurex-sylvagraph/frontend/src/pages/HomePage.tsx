/**
 * Aurex Sylvagraph™ - Application Home Page
 * Agroforestry Sustainability & Tokenized Carbon Credits Platform
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { 
  TreePine, Satellite, Leaf, Users, BarChart3, CreditCard, 
  ArrowRight, TrendingUp, Globe, Shield 
} from 'lucide-react'

const HomePage: React.FC = () => {
  const quickActions = [
    { name: 'View Dashboard', href: '/dashboard', icon: BarChart3, description: 'See your KPIs and analytics' },
    { name: 'Create Project', href: '/projects/new', icon: TreePine, description: 'Start a new agroforestry project' },
    { name: 'Monitor Activity', href: '/monitoring', icon: Satellite, description: 'Check live monitoring data' },
    { name: 'Manage Credits', href: '/credits', icon: Leaf, description: 'View carbon credit portfolio' }
  ]

  const recentUpdates = [
    { title: 'New satellite imagery available', description: 'Fresh Sentinel-2 data for 15 projects', time: '2 hours ago' },
    { title: '1,250 new credits verified', description: 'VVB approved Amazon Restoration batch', time: '4 hours ago' },
    { title: 'Farmer enrollment milestone', description: '2,000+ farmers now participating', time: '1 day ago' }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-forest-600 to-emerald-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome to Sylvagraph</h1>
            <p className="text-forest-100 text-lg mb-4">
              Your comprehensive agroforestry monitoring and carbon credits platform
            </p>
            <div className="flex items-center space-x-6 text-forest-100">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>247 Active Projects</span>
              </div>
              <div className="flex items-center space-x-2">
                <TreePine className="h-5 w-5" />
                <span>10,247 Hectares</span>
              </div>
              <div className="flex items-center space-x-2">
                <Leaf className="h-5 w-5" />
                <span>156,890 tCO₂e</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <TreePine className="h-32 w-32 text-white/20" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-forest-100 dark:bg-forest-800 rounded-lg flex items-center justify-center group-hover:bg-forest-200 dark:group-hover:bg-forest-700 transition-colors">
                <action.icon className="h-6 w-6 text-forest-600 dark:text-forest-400" />
              </div>
              <ArrowRight className="h-5 w-5 text-forest-400 group-hover:text-forest-600 dark:group-hover:text-forest-300 transition-colors" />
            </div>
            <h3 className="font-semibold text-forest-900 dark:text-forest-100 mb-2">{action.name}</h3>
            <p className="text-forest-600 dark:text-forest-400 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-forest-900 dark:text-forest-100 mb-4">
              Platform Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TreePine className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-semibold text-forest-900 dark:text-forest-100">247</p>
                <p className="text-xs text-forest-600 dark:text-forest-400">Projects</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-semibold text-forest-900 dark:text-forest-100">1,847</p>
                <p className="text-xs text-forest-600 dark:text-forest-400">Farmers</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Satellite className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="font-semibold text-forest-900 dark:text-forest-100">1,234</p>
                <p className="text-xs text-forest-600 dark:text-forest-400">Monitoring</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-semibold text-forest-900 dark:text-forest-100">98.2%</p>
                <p className="text-xs text-forest-600 dark:text-forest-400">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-forest-900 dark:text-forest-100 mb-4">
              Getting Started
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                <div>
                  <p className="font-medium text-forest-900 dark:text-forest-100">Create your first project</p>
                  <p className="text-sm text-forest-600 dark:text-forest-400">Define project boundaries and methodology</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <div>
                  <p className="font-medium text-forest-900 dark:text-forest-100">Onboard farmers</p>
                  <p className="text-sm text-forest-600 dark:text-forest-400">Register farmer participants and assign parcels</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                <div>
                  <p className="font-medium text-forest-900 dark:text-forest-100">Start monitoring</p>
                  <p className="text-sm text-forest-600 dark:text-forest-400">Configure satellite and drone data collection</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-forest-900 dark:text-forest-100 mb-4">Recent Updates</h2>
            <div className="space-y-4">
              {recentUpdates.map((update, index) => (
                <div key={index} className="border-l-4 border-forest-200 dark:border-forest-700 pl-4">
                  <p className="font-medium text-forest-900 dark:text-forest-100">{update.title}</p>
                  <p className="text-sm text-forest-600 dark:text-forest-400">{update.description}</p>
                  <p className="text-xs text-forest-500 dark:text-forest-500 mt-1">{update.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-forest-900 dark:text-forest-100 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-forest-600 dark:text-forest-400">API Services</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forest-600 dark:text-forest-400">Satellite Data</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Updated</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forest-600 dark:text-forest-400">AI Processing</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forest-600 dark:text-forest-400">Blockchain</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
