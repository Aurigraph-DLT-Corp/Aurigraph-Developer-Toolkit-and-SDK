/**
 * TPS Chart Component
 *
 * Real-time line chart showing transactions per second over time
 */

import { Card } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppSelector } from '../../../hooks/useRedux';
import { selectTpsChartData } from '../../../store/selectors';

export const TPSChart = () => {
  const chartData = useAppSelector(selectTpsChartData);

  // Transform data for Recharts
  const data = chartData.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    tps: point.value,
  }));

  return (
    <Card title="Transactions Per Second (TPS)" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.split(':').slice(0, 2).join(':')}
          />
          <YAxis tick={{ fontSize: 12 }} label={{ value: 'TPS', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}
            formatter={(value: number) => [`${value.toFixed(0)} tx/s`, 'TPS']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="tps"
            stroke="#1890ff"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TPSChart;
