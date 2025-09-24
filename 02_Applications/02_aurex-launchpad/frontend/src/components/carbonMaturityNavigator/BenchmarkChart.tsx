// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR BENCHMARK CHART
// Sub-Application #13: Industry Benchmarking Visualization Component
// Module ID: LAU-MAT-013-FE-BENCHMARK - Benchmark Chart Component
// Created: August 7, 2025
// ================================================================================

import React, { useEffect, useRef } from 'react';
import { BenchmarkComparison } from '../../types/carbonMaturityNavigator';

interface BenchmarkChartProps {
  benchmarkData: BenchmarkComparison;
  currentScore: number;
  currentLevel: number;
  className?: string;
}

const BenchmarkChart: React.FC<BenchmarkChartProps> = ({
  benchmarkData,
  currentScore,
  currentLevel,
  className = ''
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const containerWidth = chartRef.current?.offsetWidth || 600;
    canvas.width = containerWidth - 40;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBenchmarkChart(ctx, canvas.width, canvas.height);
  }, [benchmarkData, currentScore, currentLevel]);

  const drawBenchmarkChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const margin = { top: 40, right: 40, bottom: 80, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Sample benchmark data points (in a real implementation, this would come from the API)
    const benchmarkPoints = [
      { percentile: 10, score: 35, level: 1, count: 5 },
      { percentile: 25, score: 48, level: 2, count: 12 },
      { percentile: 50, score: 62, level: 2, count: 25 },
      { percentile: 75, score: 78, level: 3, count: 18 },
      { percentile: 90, score: 89, level: 4, count: 8 },
      { percentile: 95, score: 94, level: 5, count: 3 }
    ];

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical grid lines (percentiles)
    for (let i = 0; i <= 10; i++) {
      const x = margin.left + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines (scores)
    for (let i = 0; i <= 10; i++) {
      const y = margin.top + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X-axis labels (percentiles)
    for (let i = 0; i <= 10; i++) {
      const x = margin.left + (chartWidth / 10) * i;
      const percentile = i * 10;
      ctx.fillText(percentile + '%', x, margin.top + chartHeight + 10);
    }

    // Y-axis labels (scores)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 10; i++) {
      const y = margin.top + chartHeight - (chartHeight / 10) * i;
      const score = i * 10;
      ctx.fillText(score.toString(), margin.left - 10, y);
    }

    // Axis titles
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '14px sans-serif';
    ctx.fillText('Industry Percentile', margin.left + chartWidth / 2, height - 20);

    ctx.save();
    ctx.translate(20, margin.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Maturity Score (%)', 0, 0);
    ctx.restore();

    // Draw benchmark curve
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    benchmarkPoints.forEach((point, index) => {
      const x = margin.left + (chartWidth * point.percentile) / 100;
      const y = margin.top + chartHeight - (chartHeight * point.score) / 100;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw benchmark points
    benchmarkPoints.forEach(point => {
      const x = margin.left + (chartWidth * point.percentile) / 100;
      const y = margin.top + chartHeight - (chartHeight * point.score) / 100;

      // Point circle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Level badge
      ctx.fillStyle = getLevelColor(point.level);
      ctx.beginPath();
      ctx.arc(x, y - 20, 12, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(point.level.toString(), x, y - 20);
    });

    // Draw current position
    const currentX = margin.left + (chartWidth * benchmarkData.percentile_rank) / 100;
    const currentY = margin.top + chartHeight - (chartHeight * currentScore) / 100;

    // Current position highlight
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = 3;
    
    // Draw crosshairs
    ctx.beginPath();
    ctx.moveTo(currentX, margin.top);
    ctx.lineTo(currentX, margin.top + chartHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(margin.left, currentY);
    ctx.lineTo(margin.left + chartWidth, currentY);
    ctx.stroke();

    // Current position marker
    ctx.beginPath();
    ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Current level badge
    ctx.fillStyle = getLevelColor(currentLevel);
    ctx.beginPath();
    ctx.arc(currentX, currentY - 25, 15, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentLevel.toString(), currentX, currentY - 25);

    // Current position label
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Your Position', currentX, currentY + 20);
  };

  const getLevelColor = (level: number): string => {
    const colors = {
      1: '#ef4444', // red
      2: '#f97316', // orange
      3: '#eab308', // yellow
      4: '#3b82f6', // blue
      5: '#10b981'  // green
    };
    return colors[level] || '#6b7280';
  };

  const getLevelName = (level: number): string => {
    const names = {
      1: 'Initial',
      2: 'Managed',
      3: 'Defined',
      4: 'Quantitatively Managed',
      5: 'Optimizing'
    };
    return names[level] || 'Unknown';
  };

  return (
    <div className={className}>
      {/* Benchmark Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Industry Ranking</h3>
          <p className="text-3xl font-bold text-blue-600">
            {benchmarkData.percentile_rank.toFixed(0)}th
          </p>
          <p className="text-sm text-gray-600">Percentile</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Positioning</h3>
          <p className="text-xl font-bold text-green-600">
            {benchmarkData.positioning}
          </p>
          <p className="text-sm text-gray-600">vs Industry Average</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Score vs Mean</h3>
          <p className="text-3xl font-bold text-purple-600">
            {benchmarkData.score_vs_mean > 0 ? '+' : ''}{benchmarkData.score_vs_mean.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">Points difference</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <h3 className="text-lg font-semibent text-gray-900 mb-2">Improvement Gap</h3>
          <p className="text-3xl font-bold text-orange-600">
            {benchmarkData.improvement_potential.points_to_top_quartile?.toFixed(0) || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">Points to top 25%</p>
        </div>
      </div>

      {/* Benchmark Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Industry Benchmark Analysis - {benchmarkData.industry}
        </h3>
        
        <div ref={chartRef} className="w-full overflow-x-auto">
          <canvas ref={canvasRef} className="w-full max-w-full" />
        </div>

        {/* Chart Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>Industry Benchmark Curve</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>Your Position</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-1"></div>
            <span>Level 5</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-1"></div>
            <span>Level 4</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-1"></div>
            <span>Level 3</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-1"></div>
            <span>Level 2</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-1"></div>
            <span>Level 1</span>
          </div>
        </div>
      </div>

      {/* Category Gaps Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Gap Analysis</h3>
        
        <div className="space-y-4">
          {Object.entries(benchmarkData.category_gaps).map(([category, gap]) => (
            <div key={category} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {category.replace('_', ' ')}
                </span>
                <span className={`text-sm font-medium ${
                  gap > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {gap > 0 ? '+' : ''}{gap.toFixed(1)} points
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-3 bg-gray-400"></div>
                </div>
                
                <div
                  className={`h-3 rounded-full ${
                    gap > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.abs(gap)}%`,
                    marginLeft: gap < 0 ? `${50 + gap}%` : '50%'
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Below Average</span>
                <span>Industry Average</span>
                <span>Above Average</span>
              </div>
            </div>
          ))}
        </div>

        {/* Improvement Targets */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Improvement Targets</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">To reach top quartile (75th percentile):</span>
              <p className="text-blue-700">
                +{benchmarkData.improvement_potential.points_to_top_quartile?.toFixed(0) || 0} points needed
              </p>
            </div>
            
            <div>
              <span className="font-medium">To reach top decile (90th percentile):</span>
              <p className="text-blue-700">
                +{benchmarkData.improvement_potential.points_to_top_decile?.toFixed(0) || 0} points needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkChart;