'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useEffect, useState } from 'react';

interface ChartData {
  time: string;
  tps: number;
  latency: number;
  zkProofs: number;
}

export default function PerformanceChart() {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    // Generate realistic performance data
    const generateData = () => {
      const now = new Date();
      const newData: ChartData[] = [];
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        newData.push({
          time: time.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          tps: Math.floor(950000 + Math.random() * 100000),
          latency: Math.floor(200 + Math.random() * 200),
          zkProofs: Math.floor(800 + Math.random() * 400),
        });
      }
      
      setData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-white mb-4">TPS Performance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={[900000, 1100000]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
              formatter={(value: number) => [value.toLocaleString(), 'TPS']}
            />
            <Area
              type="monotone"
              dataKey="tps"
              stroke="#3B82F6"
              fill="url(#tpsGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-white mb-4">Latency</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [`${value}ms`, 'Latency']}
              />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card">
          <h3 className="text-lg font-semibold text-white mb-4">ZK Proofs Generated</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [`${value}/sec`, 'ZK Proofs']}
              />
              <Line 
                type="monotone" 
                dataKey="zkProofs" 
                stroke="#A855F7" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}