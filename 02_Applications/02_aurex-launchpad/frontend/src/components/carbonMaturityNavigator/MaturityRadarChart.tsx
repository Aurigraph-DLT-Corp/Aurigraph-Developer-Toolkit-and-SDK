// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR RADAR CHART
// Sub-Application #13: Maturity Profile Visualization Component
// Module ID: LAU-MAT-013-FE-RADAR - Maturity Radar Chart Component
// Created: August 7, 2025
// ================================================================================

import React, { useEffect, useRef } from 'react';
import { RadarChartData } from '../../types/carbonMaturityNavigator';

interface MaturityRadarChartProps {
  data: RadarChartData;
  height?: number;
  width?: number;
  className?: string;
}

const MaturityRadarChart: React.FC<MaturityRadarChartProps> = ({
  data,
  height = 320,
  width = 320,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.labels.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const containerWidth = containerRef.current?.offsetWidth || width;
    const canvasSize = Math.min(containerWidth - 40, height);
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart configuration
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    const levels = 5; // 5 maturity levels
    const angleStep = (2 * Math.PI) / data.labels.length;

    // Colors
    const gridColor = '#e5e7eb';
    const labelColor = '#374151';
    const dataColors = data.datasets.map(dataset => dataset.borderColor);

    // Draw grid circles
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= levels; i++) {
      const levelRadius = (radius / levels) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, levelRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw grid lines
    for (let i = 0; i < data.labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = labelColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < data.labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const labelRadius = radius + 25;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      // Multi-line labels for long text
      const label = data.labels[i];
      const words = label.split(' ');
      
      if (words.length > 2) {
        const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        const secondLine = words.slice(Math.ceil(words.length / 2)).join(' ');
        
        ctx.fillText(firstLine, x, y - 8);
        ctx.fillText(secondLine, x, y + 8);
      } else {
        ctx.fillText(label, x, y);
      }
    }

    // Draw level indicators
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = 1; i <= levels; i++) {
      const levelRadius = (radius / levels) * i;
      ctx.fillText(i.toString(), centerX + levelRadius - 10, centerY - 5);
    }

    // Draw data
    data.datasets.forEach((dataset, datasetIndex) => {
      if (!dataset.data.length) return;

      const points: { x: number; y: number }[] = [];
      
      // Calculate points
      for (let i = 0; i < data.labels.length; i++) {
        const value = dataset.data[i] || 0;
        const normalizedValue = Math.min(value / 100, 1) * levels; // Normalize to 0-5 scale
        const angle = i * angleStep - Math.PI / 2;
        const pointRadius = (radius / levels) * normalizedValue;
        
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;
        points.push({ x, y });
      }

      // Draw filled area
      if (dataset.backgroundColor) {
        ctx.fillStyle = dataset.backgroundColor;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.closePath();
        ctx.fill();
      }

      // Draw border
      ctx.strokeStyle = dataset.borderColor;
      ctx.lineWidth = dataset.borderWidth || 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.closePath();
      ctx.stroke();

      // Draw points
      ctx.fillStyle = dataset.borderColor;
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw value labels on points
      ctx.fillStyle = labelColor;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      
      points.forEach((point, i) => {
        const value = dataset.data[i] || 0;
        ctx.fillText(
          value.toFixed(1),
          point.x,
          point.y - 8
        );
      });
    });

    // Draw legend if multiple datasets
    if (data.datasets.length > 1) {
      const legendY = canvas.height - 40;
      let legendX = 20;
      
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      
      data.datasets.forEach((dataset, index) => {
        // Legend color box
        ctx.fillStyle = dataset.borderColor;
        ctx.fillRect(legendX, legendY, 12, 12);
        
        // Legend text
        ctx.fillStyle = labelColor;
        ctx.fillText(dataset.label, legendX + 20, legendY + 8);
        
        legendX += ctx.measureText(dataset.label).width + 40;
      });
    }

  }, [data, height, width]);

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-render on resize
      if (canvasRef.current) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data.labels.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-gray-500 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No data available for chart</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        style={{ maxHeight: height }}
      />
      
      {/* Chart Information */}
      <div className="mt-4 text-center text-sm text-gray-600 max-w-md">
        <p className="mb-2">
          <strong>Maturity Profile:</strong> This radar chart shows your organization's 
          maturity levels across different carbon management categories.
        </p>
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Level 1-2: Basic</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span>Level 3: Defined</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Level 4: Managed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Level 5: Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaturityRadarChart;