/**
 * Aurex Sylvagraph - Drone Operations Panel Component
 * Manage drone fleet, flight plans, and imagery collection
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Drone, 
  Calendar, 
  Upload, 
  MapPin, 
  Battery, 
  Camera, 
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface DroneInfo {
  drone_id: string;
  name: string;
  drone_type: string;
  operational_status: string;
  flight_hours_total: number;
  last_flight_date: string | null;
  battery_level?: number;
}

interface FlightPlan {
  flight_id: string;
  flight_name: string;
  project_id: string;
  status: string;
  scheduled_date: string;
  drone_id: string;
  operator_id: string;
  mission_type: string;
  area_hectares: number;
  estimated_duration_minutes: number;
}

interface FlightLog {
  flight_plan_id: string;
  takeoff_time: string;
  landing_time?: string;
  mission_completed: boolean;
  images_captured: number;
  battery_start_percentage: number;
  battery_end_percentage?: number;
}

interface DroneOperationsPanelProps {
  projectId: string;
  onFlightPlanCreated?: (flightPlan: FlightPlan) => void;
  onImageryUploaded?: (imagery: any) => void;
}

export const DroneOperationsPanel: React.FC<DroneOperationsPanelProps> = ({
  projectId,
  onFlightPlanCreated,
  onImageryUploaded
}) => {
  const [drones, setDrones] = useState<DroneInfo[]>([]);
  const [flights, setFlights] = useState<FlightPlan[]>([]);
  const [selectedDrone, setSelectedDrone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fleet' | 'flights' | 'imagery'>('fleet');

  // Flight plan form state
  const [flightForm, setFlightForm] = useState({
    flight_name: '',
    mission_type: 'monitoring',
    scheduled_date: '',
    estimated_duration_minutes: 30,
    flight_altitude_meters: 120,
    area_hectares: 10
  });

  // Fetch drone fleet
  const fetchDrones = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/drones/drones');
      if (!response.ok) throw new Error('Failed to fetch drones');
      
      const data = await response.json();
      setDrones(data.drones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drones');
    }
  }, []);

  // Fetch flight plans
  const fetchFlights = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/drones/flights?project_id=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch flights');
      
      const data = await response.json();
      setFlights(data.flights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flights');
    }
  }, [projectId]);

  useEffect(() => {
    fetchDrones();
    fetchFlights();
  }, [fetchDrones, fetchFlights]);

  // Create flight plan
  const createFlightPlan = useCallback(async () => {
    if (!selectedDrone || !flightForm.flight_name) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/drones/flights/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          flight_id: `FLIGHT_${Date.now()}`,
          flight_name: flightForm.flight_name,
          project_id: projectId,
          drone_id: selectedDrone,
          operator_id: 'PILOT_001', // Would be selected from available operators
          mission_type: flightForm.mission_type,
          mission_objective: `${flightForm.mission_type} mission for project ${projectId}`,
          scheduled_date: flightForm.scheduled_date || new Date().toISOString(),
          estimated_duration_minutes: flightForm.estimated_duration_minutes,
          flight_altitude_meters: flightForm.flight_altitude_meters,
          area_hectares: flightForm.area_hectares,
          boundary_coordinates: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]] // Mock coordinates
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create flight plan');
      }

      const result = await response.json();
      
      const newFlightPlan: FlightPlan = {
        flight_id: result.flight_id,
        flight_name: flightForm.flight_name,
        project_id: projectId,
        status: 'planned',
        scheduled_date: flightForm.scheduled_date || new Date().toISOString(),
        drone_id: selectedDrone,
        operator_id: 'PILOT_001',
        mission_type: flightForm.mission_type,
        area_hectares: flightForm.area_hectares,
        estimated_duration_minutes: flightForm.estimated_duration_minutes
      };

      setFlights(prev => [newFlightPlan, ...prev]);
      onFlightPlanCreated?.(newFlightPlan);

      // Reset form
      setFlightForm({
        flight_name: '',
        mission_type: 'monitoring',
        scheduled_date: '',
        estimated_duration_minutes: 30,
        flight_altitude_meters: 120,
        area_hectares: 10
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flight plan');
    } finally {
      setLoading(false);
    }
  }, [selectedDrone, flightForm, projectId, onFlightPlanCreated]);

  // Upload drone imagery
  const handleImageryUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDrone) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      formData.append('flight_plan_id', 'FLIGHT_001'); // Would be selected from active flights
      formData.append('image_id', `IMG_${Date.now()}`);
      formData.append('sequence_number', '1');
      formData.append('image_type', 'RGB');
      formData.append('camera_model', 'DJI FC6310');
      formData.append('capture_timestamp', new Date().toISOString());
      formData.append('altitude_meters', '120');
      formData.append('latitude', '0');
      formData.append('longitude', '0');
      formData.append('metadata', JSON.stringify({
        drone_id: selectedDrone,
        weather: 'clear',
        wind_speed: 5
      }));

      const response = await fetch('/api/v1/drones/imagery/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload imagery');
      }

      const result = await response.json();
      onImageryUploaded?.(result);

      // Reset file input
      event.target.value = '';

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload imagery');
    } finally {
      setLoading(false);
    }
  }, [selectedDrone, projectId, onImageryUploaded]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'planned':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'completed':
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const MISSION_TYPES = [
    { value: 'monitoring', label: 'Forest Monitoring' },
    { value: 'mapping', label: 'Area Mapping' },
    { value: 'inspection', label: 'Site Inspection' },
    { value: 'surveying', label: 'Land Surveying' },
    { value: 'compliance', label: 'Compliance Check' }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'fleet', label: 'Fleet Management', icon: Drone },
            { id: 'flights', label: 'Flight Plans', icon: Calendar },
            { id: 'imagery', label: 'Imagery Upload', icon: Camera }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-700 text-sm">{error}</div>
        </Card>
      )}

      {/* Fleet Management Tab */}
      {activeTab === 'fleet' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Drone Fleet</h3>
          
          {drones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Drone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No drones registered</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drones.map(drone => (
                <div
                  key={drone.drone_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDrone === drone.drone_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDrone(drone.drone_id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{drone.name}</h4>
                      <p className="text-sm text-gray-600">{drone.drone_type}</p>
                    </div>
                    {getStatusIcon(drone.operational_status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusBadgeColor(drone.operational_status)}>
                        {drone.operational_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flight Hours:</span>
                      <span>{drone.flight_hours_total.toFixed(1)}h</span>
                    </div>
                    {drone.last_flight_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Flight:</span>
                        <span>{new Date(drone.last_flight_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {drone.battery_level !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Battery:</span>
                        <div className="flex items-center gap-1">
                          <Battery className="w-4 h-4" />
                          <span>{drone.battery_level}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Flight Plans Tab */}
      {activeTab === 'flights' && (
        <div className="space-y-6">
          {/* Create Flight Plan */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create Flight Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flight Name
                </label>
                <input
                  type="text"
                  value={flightForm.flight_name}
                  onChange={(e) => setFlightForm(prev => ({ ...prev, flight_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter flight name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mission Type
                </label>
                <select
                  value={flightForm.mission_type}
                  onChange={(e) => setFlightForm(prev => ({ ...prev, mission_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MISSION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="datetime-local"
                  value={flightForm.scheduled_date}
                  onChange={(e) => setFlightForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (hectares)
                </label>
                <input
                  type="number"
                  value={flightForm.area_hectares}
                  onChange={(e) => setFlightForm(prev => ({ ...prev, area_hectares: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>

            <Button
              onClick={createFlightPlan}
              disabled={loading || !selectedDrone || !flightForm.flight_name}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Flight Plan'}
            </Button>
          </Card>

          {/* Flight Plans List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Flight Plans</h3>
            
            {flights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No flight plans found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flights.map(flight => (
                  <div
                    key={flight.flight_id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(flight.status)}
                      <div>
                        <h4 className="font-medium">{flight.flight_name}</h4>
                        <div className="text-sm text-gray-600">
                          {flight.mission_type} • {flight.area_hectares} ha • {flight.estimated_duration_minutes} min
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Scheduled: {new Date(flight.scheduled_date).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusBadgeColor(flight.status)}>
                        {flight.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Imagery Upload Tab */}
      {activeTab === 'imagery' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Drone Imagery</h3>
          
          {!selectedDrone ? (
            <div className="text-center py-8 text-yellow-600 bg-yellow-50 rounded-lg">
              <Drone className="w-12 h-12 mx-auto mb-4" />
              <p>Please select a drone from the Fleet Management tab first</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Selected drone: <strong>{drones.find(d => d.drone_id === selectedDrone)?.name}</strong>
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="imagery-upload"
                  className="hidden"
                  onChange={handleImageryUpload}
                  accept="image/*,video/*"
                  disabled={loading}
                />
                <label
                  htmlFor="imagery-upload"
                  className={`cursor-pointer ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    {loading ? 'Uploading...' : 'Click to upload drone imagery'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: JPG, PNG, TIFF, MP4, MOV
                  </p>
                </label>
              </div>

              {loading && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    Uploading imagery to IPFS...
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DroneOperationsPanel;