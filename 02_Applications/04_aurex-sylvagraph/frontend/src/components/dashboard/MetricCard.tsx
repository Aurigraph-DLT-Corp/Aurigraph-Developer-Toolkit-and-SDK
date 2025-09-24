import React from 'react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  description: string
}

export function MetricCard({ title, value, change, changeType, icon: Icon, description }: MetricCardProps) {
  const changeColorClass = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-forest-600 dark:text-forest-400'
  }[changeType]

  return (
    <div className="bg-white dark:bg-forest-900 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-forest-600 dark:text-forest-400">{title}</p>
          <p className="text-3xl font-bold text-forest-900 dark:text-forest-100 mt-1">{value}</p>
          <p className="text-xs text-forest-500 dark:text-forest-500 mt-1">{description}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="h-12 w-12 bg-forest-100 dark:bg-forest-800 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-forest-600 dark:text-forest-400" />
          </div>
          <p className={`text-sm font-medium mt-2 ${changeColorClass}`}>
            {change}
          </p>
        </div>
      </div>
    </div>
  )
}