/**
 * Aurex HydroPulse™ - Facility Management
 * Comprehensive facility monitoring and management interface
 */

import React, { useState } from 'react';
import {
  MapPinIcon,
  CpuChipIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatWaterVolume, formatDate } from '../lib/utils';

// Mock facility data
const mockFacilities = [
  {
    id: 'F001',
    name: 'Rice Farm Alpha',
    location: 'Bago Region, Myanmar',
    area: 15.5,
    farmer: 'Thant Sin',
    status: 'excellent',
    waterLevel: 8.2,
    soilMoisture: 65,
    activeSensors: 12,
    totalSensors: 12,
    lastUpdate: '2024-01-15T10:30:00Z',
    waterSaved: 45000,
    growthStage: 'reproductive',
    coordinates: { lat: 17.3616, lng: 96.4711 }
  },
  {
    id: 'F002',
    name: 'Golden Paddy Fields',
    location: 'Ayeyarwady Region, Myanmar',
    area: 23.8,
    farmer: 'Khin Maung',
    status: 'good',
    waterLevel: 12.5,
    soilMoisture: 58,
    activeSensors: 18,
    totalSensors: 20,
    lastUpdate: '2024-01-15T10:28:00Z',
    waterSaved: 67200,
    growthStage: 'vegetative',
    coordinates: { lat: 16.8661, lng: 94.6734 }
  },
  {
    id: 'F003',
    name: 'Sunrise Rice Cultivation',
    location: 'Mandalay Region, Myanmar',
    area: 12.3,
    farmer: 'Zaw Win',
    status: 'warning',
    waterLevel: 3.1,
    soilMoisture: 42,
    activeSensors: 9,
    totalSensors: 10,
    lastUpdate: '2024-01-15T10:25:00Z',
    waterSaved: 28900,
    growthStage: 'ripening',
    coordinates: { lat: 21.9588, lng: 96.0891 }
  },
  {
    id: 'F004',
    name: 'Green Valley Farm',
    location: 'Yangon Region, Myanmar',
    area: 18.9,
    farmer: 'Mya Thant',
    status: 'excellent',
    waterLevel: 9.8,
    soilMoisture: 72,
    activeSensors: 15,
    totalSensors: 15,
    lastUpdate: '2024-01-15T10:32:00Z',
    waterSaved: 52100,
    growthStage: 'vegetative',
    coordinates: { lat: 16.8409, lng: 96.1735 }
  },
  {
    id: 'F005',
    name: 'Heritage Rice Farm',
    location: 'Sagaing Region, Myanmar',
    area: 31.2,
    farmer: 'Tin Oo',
    status: 'critical',
    waterLevel: 1.8,
    soilMoisture: 38,
    activeSensors: 22,
    totalSensors: 25,
    lastUpdate: '2024-01-15T09:45:00Z',
    waterSaved: 89500,
    growthStage: 'reproductive',
    coordinates: { lat: 22.0968, lng: 95.9928 }
  }
];

const FacilityManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  const filteredFacilities = mockFacilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         facility.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         facility.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || facility.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge variant="success">Excellent</Badge>;
      case 'good':
        return <Badge variant="info">Good</Badge>;
      case 'warning':
        return <Badge variant="warning">Needs Attention</Badge>;
      case 'critical':
        return <Badge variant="danger">Critical</Badge>;
      default:
        return <Badge variant="neutral">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facility Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all water management facilities</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="ghost" size="sm">
            <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
          <Button size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Facility
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities, farmers, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="warning">Needs Attention</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Facility Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Excellent Status</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockFacilities.filter(f => f.status === 'excellent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Good Status</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockFacilities.filter(f => f.status === 'good').length}
                </p>
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
                <p className="text-sm text-gray-600">Need Attention</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mockFacilities.filter(f => f.status === 'warning').length}
                </p>
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
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {mockFacilities.filter(f => f.status === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <Card key={facility.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(facility.status)}
                  <CardTitle className="text-lg">{facility.name}</CardTitle>
                </div>
                {getStatusBadge(facility.status)}
              </div>
              <CardDescription className="flex items-center mt-1">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {facility.location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Farmer and Area Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Farmer</p>
                    <p className="font-medium">{facility.farmer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-medium">{facility.area} hectares</p>
                  </div>
                </div>

                {/* Real-time Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-blue-600 mb-1">
                        <BeakerIcon className="h-3 w-3 mr-1" />
                        Water Level
                      </div>
                      <p className="font-semibold">{facility.waterLevel} cm</p>
                    </div>
                    <div>
                      <div className="flex items-center text-green-600 mb-1">
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
                        </svg>
                        Soil Moisture
                      </div>
                      <p className="font-semibold">{facility.soilMoisture}%</p>
                    </div>
                  </div>
                </div>

                {/* Sensors Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <CpuChipIcon className="h-4 w-4 mr-1" />
                    Sensors: {facility.activeSensors}/{facility.totalSensors}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(facility.lastUpdate)}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Water Saved</span>
                    <span className="font-semibold text-green-600">{formatWaterVolume(facility.waterSaved)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Growth Stage</span>
                    <Badge variant="info" size="sm">{facility.growthStage}</Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button variant="ghost" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredFacilities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or filters to find what you're looking for.
            </p>
            <Button variant="ghost" onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FacilityManagement;