/**
 * Sylvagraph Dashboard - Main overview and KPIs
 */

import React from 'react'
import { 
  TreePine, Leaf, Users, TrendingUp, Satellite, 
  DollarSign, MapPin, Activity, BarChart3 
} from 'lucide-react'
import { MetricCard } from '../components/dashboard/MetricCard'
import { ProjectsMap } from '../components/dashboard/ProjectsMap'
import { CarbonSequestrationChart } from '../components/dashboard/CarbonSequestrationChart'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { AlertsList } from '../components/dashboard/AlertsList'

export default function DashboardPage() {
  // Mock data - in real app, this would come from API
  const metrics = [
    {
      title: 'Total Projects',
      value: '247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: TreePine,
      description: 'Active agroforestry projects'
    },
    {
      title: 'Hectares Monitored',
      value: '10,247',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: MapPin,
      description: 'Total area under management'
    },
    {
      title: 'Carbon Credits Generated',
      value: '156,890',
      change: '+15.3%',
      changeType: 'positive' as const,
      icon: Leaf,
      description: 'tCO₂e credits issued'
    },
    {
      title: 'Farmers Enrolled',
      value: '1,847',
      change: '+23%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Active farmer participants'
    },
    {
      title: 'Revenue Generated',
      value: '$2.4M',
      change: '+18.7%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'Total credit sales'
    },
    {
      title: 'Monitoring Sessions',
      value: '1,234',
      change: '+5.1%',
      changeType: 'positive' as const,
      icon: Satellite,
      description: 'Completed this month'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-forest-900 dark:text-forest-100">
              Dashboard Overview
            </h1>
            <p className="text-forest-600 dark:text-forest-400 mt-2">
              Real-time monitoring of your agroforestry ecosystem
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-lg">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Live Monitoring Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects map - takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm h-96">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-forest-900 dark:text-forest-100">
                Global Projects Map
              </h2>
              <button className="text-forest-600 dark:text-forest-400 hover:text-forest-800 dark:hover:text-forest-200">
                <BarChart3 className="h-5 w-5" />
              </button>
            </div>
            <ProjectsMap />
          </div>
        </div>

        {/* Alerts and notifications */}
        <div className="space-y-6">
          <AlertsList />
          <RecentActivity />
        </div>
      </div>

      {/* Carbon sequestration chart */}
      <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-forest-900 dark:text-forest-100 mb-4">
          Carbon Sequestration Trends
        </h2>
        <CarbonSequestrationChart />
      </div>

      {/* Performance insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-forest-900 dark:text-forest-100 mb-4">
            Top Performing Projects
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Amazon Restoration Initiative', location: 'Brazil', credits: '12,450', growth: '+25%' },
              { name: 'Kenya Agroforestry Program', location: 'Kenya', credits: '8,720', growth: '+18%' },
              { name: 'India Bamboo Project', location: 'India', credits: '6,890', growth: '+22%' }
            ].map((project, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-forest-50 dark:bg-forest-800/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-forest-900 dark:text-forest-100">{project.name}</h4>
                  <p className="text-sm text-forest-600 dark:text-forest-400">{project.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-forest-900 dark:text-forest-100">{project.credits} tCO₂e</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{project.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-forest-900 dark:text-forest-100 mb-4">
            Impact Summary
          </h3>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-forest-900 dark:text-forest-100">847,236</p>
                <p className="text-forest-600 dark:text-forest-400">Trees planted this year</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-forest-900 dark:text-forest-100">1,847</p>
                <p className="text-forest-600 dark:text-forest-400">Farmers supported</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-forest-900 dark:text-forest-100">98.2%</p>
                <p className="text-forest-600 dark:text-forest-400">Monitoring accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}