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

export const AurexLogo: React.FC<AurexLogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'default',
  width,
  height
}) => {
  // Calculate dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 80, height: 24 };
      case 'md':
        return { width: 120, height: 36 };
      case 'lg':
        return { width: 160, height: 48 };
      case 'xl':
        return { width: 200, height: 60 };
      case 'custom':
        return { width: width || 120, height: height || 36 };
      default:
        return { width: 120, height: 36 };
    }
  };

  const dimensions = getDimensions();

  // Use the actual SVG file
  return (
    <img 
      src="/images/aurex-logo.svg"
      alt="Aurex Logo"
      className={`${className}`}
      style={{ 
        width: `${dimensions.width}px`, 
        height: `${dimensions.height}px`,
        filter: variant === 'white' ? 'brightness(0) saturate(100%) invert(100%)' : 
                variant === 'dark' ? 'brightness(0) saturate(100%)' : 'none'
      }}
    />
  );
};

export default AurexLogo;
