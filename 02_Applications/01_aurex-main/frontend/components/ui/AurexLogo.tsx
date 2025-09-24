/**
 * Aurex Logo Component
 * Official Aurigraph Aurex brand logo with consistent styling
 */

import React from 'react';

interface AurexLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  variant?: 'default' | 'white' | 'dark';
  width?: number;
  height?: number;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  custom: ''
};

export const AurexLogo: React.FC<AurexLogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'default',
  width,
  height
}) => {
  const getGradientId = () => `aurex-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const gradientId = getGradientId();

  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          gradient: ['#FFFFFF', '#F8F9FA', '#E9ECEF'],
          stroke: '#FFFFFF',
          fill: '#FFFFFF'
        };
      case 'dark':
        return {
          gradient: ['#1F2937', '#374151', '#4B5563'],
          stroke: '#1F2937',
          fill: '#1F2937'
        };
      default:
        return {
          gradient: ['#F59E0B', '#D97706', '#92400E'],
          stroke: '#F59E0B',
          fill: '#F59E0B'
        };
    }
  };

  const colors = getColors();

  const svgProps = size === 'custom' && width && height 
    ? { width, height, style: { width: `${width}px`, height: `${height}px` } }
    : {};

  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...svgProps}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.gradient[0]} />
          <stop offset="50%" stopColor={colors.gradient[1]} />
          <stop offset="100%" stopColor={colors.gradient[2]} />
        </linearGradient>
      </defs>
      
      {/* Lock/Security Symbol */}
      <g transform="translate(50,50)">
        {/* Lock Body */}
        <rect 
          x="-15" 
          y="-5" 
          width="30" 
          height="25" 
          rx="3" 
          ry="3" 
          fill={`url(#${gradientId})`}
        />
        
        {/* Lock Shackle */}
        <path 
          d="M -10,-5 A 10,10 0 0,1 10,-5 L 10,-15 A 15,15 0 0,0 -10,-15 Z" 
          fill="none" 
          stroke={`url(#${gradientId})`}
          strokeWidth="4" 
          strokeLinecap="round"
        />
        
        {/* Diamond Pattern Inside */}
        <g transform="translate(0,7.5)">
          {/* Outer Diamond */}
          <path 
            d="M 0,-8 L 8,0 L 0,8 L -8,0 Z" 
            fill="white" 
            opacity="0.9"
          />
          
          {/* Inner Diamond */}
          <path 
            d="M 0,-4 L 4,0 L 0,4 L -4,0 Z" 
            fill={`url(#${gradientId})`}
          />
          
          {/* Center Diamond */}
          <path 
            d="M 0,-2 L 2,0 L 0,2 L -2,0 Z" 
            fill="white"
          />
        </g>
      </g>
    </svg>
  );
};

export default AurexLogo;
