import React from 'react';

interface AurexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'mono';
  className?: string;
}

export const AurexLogo: React.FC<AurexLogoProps> = ({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
    xl: 'h-16 w-auto'
  };

  const colorClasses = {
    default: 'text-blue-600',
    white: 'text-white',
    mono: 'text-gray-900'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} ${colorClasses[variant]} font-bold flex items-center`}>
        <svg
          viewBox="0 0 32 32"
          className="h-full w-auto mr-2"
          fill="currentColor"
        >
          <path d="M16 2L8 6v20l8 4 8-4V6L16 2zm6 22l-6 3-6-3V8l6-3 6 3v16z" />
          <circle cx="16" cy="12" r="3" />
          <path d="M16 18l-4 2v4l4-2 4 2v-4l-4-2z" />
        </svg>
        <span className="text-lg font-bold tracking-tight">
          Aurex
        </span>
      </div>
    </div>
  );
};

export default AurexLogo;