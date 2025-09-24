import React from 'react'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

export function AlertsList() {
  const alerts = [
    { type: 'warning', icon: AlertTriangle, title: 'Deforestation detected', description: 'Amazon project area 12', severity: 'high' },
    { type: 'info', icon: Info, title: 'Satellite update available', description: 'New imagery for 5 projects', severity: 'low' },
    { type: 'success', icon: CheckCircle, title: 'Credits verified', description: '1,250 tCO₂e approved', severity: 'low' },
  ]

  const severityColors = {
    high: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    low: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  }

  return (
    <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-forest-900 dark:text-forest-100 mb-4">System Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className={`p-3 rounded-lg border ${severityColors[alert.severity as keyof typeof severityColors]}`}>
            <div className="flex items-start space-x-3">
              <alert.icon className="h-5 w-5 text-forest-600 dark:text-forest-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-forest-900 dark:text-forest-100">{alert.title}</p>
                <p className="text-xs text-forest-600 dark:text-forest-400">{alert.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}