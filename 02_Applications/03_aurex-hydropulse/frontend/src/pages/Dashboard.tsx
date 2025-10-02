/**
 * Aurex HydroPulse™ - Executive Dashboard
 * Comprehensive real-time water management overview with KPIs
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  BeakerIcon,
  FireIcon,
  UsersIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatNumber, formatWaterVolume, getStatusColor, generateMockSensorData } from '../lib/utils';

// Mock data for development
const mockWaterUsageData = [
  { month: 'Jan', traditional: 1200, awd: 850, savings: 29 },
  { month: 'Feb', traditional: 1150, awd: 820, savings: 29 },
  { month: 'Mar', traditional: 1300, awd: 910, savings: 30 },
  { month: 'Apr', traditional: 1400, awd: 980, savings: 30 },
  { month: 'May', traditional: 1350, awd: 945, savings: 30 },
  { month: 'Jun', traditional: 1250, awd: 875, savings: 30 },
];

const mockFacilityData = [
  { name: 'Excellent', value: 12, color: '#10b981' },
  { name: 'Good', value: 8, color: '#3b82f6' },
  { name: 'Needs Attention', value: 3, color: '#f59e0b' },
  { name: 'Critical', value: 1, color: '#ef4444' },
];

const mockAlerts = [
  { id: 1, type: 'warning', message: 'Water level low at Facility A-12', time: '2 min ago', facility: 'Rice Farm A-12' },
  { id: 2, type: 'success', message: 'Irrigation cycle completed at B-08', time: '15 min ago', facility: 'Rice Farm B-08' },
  { id: 3, type: 'info', message: 'New sensor deployed at C-15', time: '1 hour ago', facility: 'Rice Farm C-15' },
  { id: 4, type: 'error', message: 'Sensor malfunction at D-03', time: '2 hours ago', facility: 'Rice Farm D-03' },
];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState(generateMockSensorData());

  // Simulate real-time data updates
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    
    const interval = setInterval(() => {
      setRealTimeData(generateMockSensorData());
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Water Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time overview of all facilities and AWD operations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="ghost" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </Button>
          <Button size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Water Saved</p>
                <p className="text-2xl font-bold text-green-600">{formatWaterVolume(2400000)}</p>
                <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BeakerIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Facilities</p>
                <p className="text-2xl font-bold text-blue-600">24</p>
                <p className="text-xs text-gray-500 mt-1">3 new this week</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">IoT Sensors</p>
                <p className="text-2xl font-bold text-purple-600">247</p>
                <p className="text-xs text-gray-500 mt-1">98% operational</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CpuChipIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO₂ Reduced</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(15678)} tons</p>
                <p className="text-xs text-gray-500 mt-1">+8% efficiency</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FireIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Water Usage Comparison</CardTitle>
            <CardDescription>Traditional vs AWD water consumption over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockWaterUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}K L`, 
                      name === 'traditional' ? 'Traditional' : 'AWD Method'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="traditional" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#fecaca" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="awd" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#a7f3d0" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Facility Status */}
        <Card>
          <CardHeader>
            <CardTitle>Facility Health Status</CardTitle>
            <CardDescription>Overall operational status of all facilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockFacilityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {mockFacilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Monitoring and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Data */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Conditions</CardTitle>
            <CardDescription>Live data from active sensors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Avg Water Level</p>
                    <p className="text-2xl font-bold text-blue-900">{realTimeData.waterLevel.toFixed(1)} cm</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BeakerIcon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Soil Moisture</p>
                    <p className="text-2xl font-bold text-green-900">{realTimeData.soilMoisture.toFixed(1)}%</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Temperature</p>
                    <p className="text-2xl font-bold text-yellow-900">{realTimeData.temperature.toFixed(1)}°C</p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">pH Level</p>
                    <p className="text-2xl font-bold text-purple-900">{realTimeData.ph.toFixed(1)}</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BeakerIcon className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest system notifications and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' :
                    alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <p className="text-xs text-gray-500">{alert.facility}</p>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      alert.type === 'error' ? 'danger' :
                      alert.type === 'warning' ? 'warning' :
                      alert.type === 'success' ? 'success' : 'info'
                    }
                    size="sm"
                  >
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;