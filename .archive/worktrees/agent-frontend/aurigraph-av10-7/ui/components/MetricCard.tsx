'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
  children?: ReactNode;
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className = '',
  children 
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        {trend && (
          <div className={`text-xs ${getTrendColor()}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-400">{subtitle}</div>
        )}
        {children}
      </div>
    </div>
  );
}