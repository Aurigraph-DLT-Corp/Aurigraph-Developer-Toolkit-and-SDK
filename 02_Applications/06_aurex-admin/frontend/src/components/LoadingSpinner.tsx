import React from 'react'
import clsx from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'spinner border-aurex-600',
          {
            'h-4 w-4': size === 'sm',
            'h-6 w-6': size === 'md',
            'h-8 w-8': size === 'lg',
          }
        )}
      />
    </div>
  )
}

export default LoadingSpinner