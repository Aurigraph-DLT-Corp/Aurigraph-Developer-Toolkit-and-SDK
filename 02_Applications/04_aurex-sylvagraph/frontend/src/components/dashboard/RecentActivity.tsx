import React from 'react'
import { Activity, TreePine, Satellite, Users } from 'lucide-react'

export function RecentActivity() {
  const activities = [
    { icon: TreePine, title: 'New project created', description: 'Amazon Restoration Phase 2', time: '2 hours ago' },
    { icon: Satellite, title: 'Monitoring completed', description: 'Kenya Agroforestry - Satellite analysis', time: '4 hours ago' },
    { icon: Users, title: 'Farmers enrolled', description: '25 new farmers joined Brazil project', time: '6 hours ago' },
  ]

  return (
    <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-forest-900 dark:text-forest-100 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="h-8 w-8 bg-forest-100 dark:bg-forest-800 rounded-full flex items-center justify-center flex-shrink-0">
              <activity.icon className="h-4 w-4 text-forest-600 dark:text-forest-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-forest-900 dark:text-forest-100">{activity.title}</p>
              <p className="text-xs text-forest-600 dark:text-forest-400">{activity.description}</p>
              <p className="text-xs text-forest-500 dark:text-forest-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}