/**
 * Aurex HydroPulse™ - Sensor Monitoring Dashboard
 * Real-time IoT sensor data visualization and monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  CpuChipIcon,
  BeakerIcon,
  BoltIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, generateMockSensorData } from '../lib/utils';

// Mock sensor data
const mockSensors = [
  {
    id: 'S001',
    name: 'Water Level Monitor Alpha',
    type: 'water_level',
    facility: 'Rice Farm Alpha',
    status: 'active',
    battery: 85,
    signal: 'excellent',
    lastReading: 8.2,
    unit: 'cm',
    lastUpdate: '2024-01-15T10:30:00Z',
    coordinates: { x: 120, y: 80 }
  },
  {
    id: 'S002',
    name: 'Soil Moisture Sensor A1',
    type: 'soil_moisture',
    facility: 'Rice Farm Alpha',
    status: 'active',
    battery: 92,
    signal: 'good',
    lastReading: 65,
    unit: '%',
    lastUpdate: '2024-01-15T10:29:00Z',
    coordinates: { x: 180, y: 120 }
  },
  {
    id: 'S003',
    name: 'pH Monitor Beta',
    type: 'ph_level',
    facility: 'Golden Paddy Fields',
    status: 'warning',
    battery: 45,
    signal: 'fair',
    lastReading: 7.2,
    unit: 'pH',
    lastUpdate: '2024-01-15T10:15:00Z',
    coordinates: { x: 220, y: 160 }
  },
  {
    id: 'S004',
    name: 'Temperature Sensor B2',
    type: 'temperature',
    facility: 'Golden Paddy Fields',
    status: 'active',
    battery: 78,
    signal: 'excellent',
    lastReading: 28.5,
    unit: '°C',
    lastUpdate: '2024-01-15T10:31:00Z',
    coordinates: { x: 140, y: 200 }
  },
  {
    id: 'S005',
    name: 'Water Quality Monitor',
    type: 'water_quality',
    facility: 'Sunrise Rice Cultivation',
    status: 'offline',
    battery: 12,
    signal: 'poor',
    lastReading: null,
    unit: 'ppm',
    lastUpdate: '2024-01-15T08:45:00Z',
    coordinates: { x: 260, y: 100 }
  }
];

// Generate mock historical data
const generateHistoricalData = () => {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toISOString(),
      waterLevel: 8 + Math.sin(i * 0.5) * 2 + Math.random() * 0.5,
      soilMoisture: 60 + Math.cos(i * 0.3) * 10 + Math.random() * 5,
      temperature: 25 + Math.sin(i * 0.2) * 5 + Math.random() * 2,
      ph: 7 + Math.sin(i * 0.1) * 0.5 + Math.random() * 0.2,
    });
  }
  return data;
};

const SensorMonitoring: React.FC = () => {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [historicalData] = useState(generateHistoricalData());
  const [realTimeData, setRealTimeData] = useState(generateMockSensorData());
  const [timeRange, setTimeRange] = useState('24h');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(generateMockSensorData());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSignalIcon = (signal: string) => {
    const baseClass = "h-4 w-4";
    switch (signal) {
      case 'excellent': return <SignalIcon className={`${baseClass} text-green-600`} />;
      case 'good': return <SignalIcon className={`${baseClass} text-blue-600`} />;
      case 'fair': return <SignalIcon className={`${baseClass} text-yellow-600`} />;
      case 'poor': return <SignalIcon className={`${baseClass} text-red-600`} />;
      default: return <SignalIcon className={`${baseClass} text-gray-600`} />;
    }
  };

  const getSensorIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'water_level': return <BeakerIcon className={iconClass} />;
      case 'soil_moisture': return <BeakerIcon className={iconClass} />;
      case 'ph_level': return <BeakerIcon className={iconClass} />;
      case 'temperature': return <BoltIcon className={iconClass} />;
      case 'water_quality': return <BeakerIcon className={iconClass} />;
      default: return <CpuChipIcon className={iconClass} />;
    }
  };

  const activeSensors = mockSensors.filter(s => s.status === 'active').length;
  const warningSensors = mockSensors.filter(s => s.status === 'warning').length;
  const offlineSensors = mockSensors.filter(s => s.status === 'offline').length;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sensor Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time IoT sensor data and device management</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="ghost" size="sm">
            <CpuChipIcon className="w-4 h-4 mr-2" />
            Add Sensor
          </Button>
          <Button size="sm">
            <WifiIcon className="w-4 h-4 mr-2" />
            Sync All
          </Button>
        </div>
      </div>

      {/* Sensor Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Sensors</p>
                <p className="text-2xl font-bold text-green-600">{activeSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Warning Status</p>
                <p className="text-2xl font-bold text-yellow-600">{warningSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Offline Sensors</p>
                <p className="text-2xl font-bold text-red-600">{offlineSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <CpuChipIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sensors</p>
                <p className="text-2xl font-bold text-blue-600">{mockSensors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Data Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Historical Sensor Data</CardTitle>
                <CardDescription>Past 24 hours sensor readings</CardDescription>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(time) => new Date(time).toLocaleString()}
                    formatter={(value, name) => {
                      const units = {
                        waterLevel: 'cm',
                        soilMoisture: '%',
                        temperature: '°C',
                        ph: 'pH'
                      };
                      return [
                        `${Number(value).toFixed(1)} ${units[name as keyof typeof units]}`, 
                        name.replace(/([A-Z])/g, ' $1').toLowerCase()
                      ];
                    }}
                  />
                  <Line type="monotone" dataKey="waterLevel" stroke="#3b82f6" name="waterLevel" />
                  <Line type="monotone" dataKey="soilMoisture" stroke="#10b981" name="soilMoisture" />
                  <Line type="monotone" dataKey="temperature" stroke="#f59e0b" name="temperature" />
                  <Line type="monotone" dataKey="ph" stroke="#8b5cf6" name="ph" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Current Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Current Readings</CardTitle>
            <CardDescription>Live sensor data - updates every 5 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Water Level</p>
                    <p className="text-2xl font-bold text-blue-900">{realTimeData.waterLevel.toFixed(1)} cm</p>
                  </div>
                  <BeakerIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <div className="flex items-center text-xs text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
                    Live
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Soil Moisture</p>
                    <p className="text-2xl font-bold text-green-900">{realTimeData.soilMoisture.toFixed(1)}%</p>
                  </div>
                  <BeakerIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <div className="flex items-center text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                    Live
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Temperature</p>
                    <p className="text-2xl font-bold text-yellow-900">{realTimeData.temperature.toFixed(1)}°C</p>
                  </div>
                  <BoltIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="mt-2">
                  <div className="flex items-center text-xs text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2 animate-pulse" />
                    Live
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">pH Level</p>
                    <p className="text-2xl font-bold text-purple-900">{realTimeData.ph.toFixed(1)}</p>
                  </div>
                  <BeakerIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  <div className="flex items-center text-xs text-purple-600">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-2 animate-pulse" />
                    Live
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Devices</CardTitle>
          <CardDescription>All IoT sensors and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-900">Device</th>
                  <th className="pb-3 font-medium text-gray-900">Type</th>
                  <th className="pb-3 font-medium text-gray-900">Facility</th>
                  <th className="pb-3 font-medium text-gray-900">Status</th>
                  <th className="pb-3 font-medium text-gray-900">Signal</th>
                  <th className="pb-3 font-medium text-gray-900">Battery</th>
                  <th className="pb-3 font-medium text-gray-900">Reading</th>
                  <th className="pb-3 font-medium text-gray-900">Last Update</th>
                  <th className="pb-3 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockSensors.map((sensor) => (
                  <tr key={sensor.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          {getSensorIcon(sensor.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sensor.name}</p>
                          <p className="text-sm text-gray-500">{sensor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="neutral" size="sm">
                        {sensor.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 text-gray-600">{sensor.facility}</td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          sensor.status === 'active' ? 'bg-green-500' :
                          sensor.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className={`text-sm font-medium ${getStatusColor(sensor.status)}`}>
                          {sensor.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        {getSignalIcon(sensor.signal)}
                        <span className="text-sm text-gray-600 ml-1">{sensor.signal}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <BoltIcon className={`h-4 w-4 mr-1 ${
                          sensor.battery > 50 ? 'text-green-600' :
                          sensor.battery > 20 ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                        <span className="text-sm">{sensor.battery}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      {sensor.lastReading !== null ? (
                        <span className="font-medium">
                          {sensor.lastReading} {sensor.unit}
                        </span>
                      ) : (
                        <span className="text-gray-400">No data</span>
                      )}
                    </td>
                    <td className="py-4 text-sm text-gray-500">
                      {formatDate(sensor.lastUpdate)}
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          Configure
                        </Button>
                        <Button variant="ghost" size="sm">
                          History
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorMonitoring;