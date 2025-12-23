'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DataPoint {
  timestamp: string;
  time: string;
  parallelUniverses: number;
  consciousnessLevel: number;
  coherence: number;
  realityStability: number;
  evolutionGeneration: number;
}

interface VizroRealtimeChartProps {
  title: string;
  dataKey: keyof DataPoint;
  color: string;
  maxDataPoints?: number;
  updateInterval?: number;
  apiEndpoint?: string;
}

export default function VizroRealtimeChart({ 
  title, 
  dataKey, 
  color, 
  maxDataPoints = 50,
  updateInterval = 5000,
  apiEndpoint = 'http://localhost:8081/api/v10/quantum/status'
}: VizroRealtimeChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const result = await response.json();
        const quantumData = result.data;
        
        const newDataPoint: DataPoint = {
          timestamp: new Date().toISOString(),
          time: new Date().toLocaleTimeString(),
          parallelUniverses: quantumData.parallelUniverses || 5,
          consciousnessLevel: (quantumData.consciousnessInterfaces || 0) * 10 + Math.random() * 20,
          coherence: (quantumData.performance?.averageCoherence || 1) * 100,
          realityStability: (quantumData.performance?.realityStability || 1) * 100,
          evolutionGeneration: quantumData.evolutionGeneration || 1
        };

        setData(prevData => {
          const newData = [...prevData, newDataPoint];
          return newData.slice(-maxDataPoints);
        });
        
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    
    intervalRef.current = setInterval(fetchData, updateInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, apiEndpoint]);

  const getGradientId = () => `gradient-${dataKey}-${color.replace('#', '')}`;

  const formatValue = (value: number) => {
    if (dataKey === 'consciousnessLevel' || dataKey === 'coherence' || dataKey === 'realityStability') {
      return `${value.toFixed(1)}%`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm">{`Time: ${label}`}</p>
          <p className="text-white font-semibold">
            {`${title}: ${formatValue(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${getGradientId()})`}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: color,
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {data.length > 0 && (
        <div className="mt-4 flex justify-between text-sm">
          <div className="text-gray-400">
            Current: <span className="text-white font-medium">
              {formatValue(data[data.length - 1][dataKey] as number)}
            </span>
          </div>
          <div className="text-gray-400">
            Points: <span className="text-white">{data.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
