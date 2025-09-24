import React from 'react'
import { BarChart3 } from 'lucide-react'

export function CarbonSequestrationChart() {
  return (
    <div className="h-64 bg-forest-50 dark:bg-forest-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 text-forest-400 mx-auto mb-4" />
        <p className="text-forest-600 dark:text-forest-400">Carbon sequestration chart</p>
        <p className="text-sm text-forest-500 dark:text-forest-500">Chart.js or Recharts integration</p>
      </div>
    </div>
  )
}