/**
 * Aurex Sylvagraph - Satellite Imagery Viewer Component
 * Display and interact with satellite imagery and analysis results
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Satellite, Download, Calendar, CloudRain, Eye, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface ProjectBoundary {
  type: string;
  coordinates: number[][][];
}

interface SatelliteImage {
  scene_id: string;
  product_id?: string;
  acquisition_date: string;
  cloud_cover: number;
  download_url?: string;
  rgb_download_url?: string;
  nir_rgb_download_url?: string;
  satellite: string;
  sensor: string;
}

interface VegetationIndices {
  ndvi: {
    mean: number;
    min: number;
    max: number;
    std: number;
  };
  evi: {
    mean: number;
    min: number;
    max: number;
    std: number;
  };
}

interface ChangeDetectionResult {
  total_area_ha: number;
  forest_loss_ha: number;
  forest_gain_ha: number;
  net_change_ha: number;
  forest_loss_percent: number;
  forest_gain_percent: number;
}

interface SatelliteImageryViewerProps {
  projectId: string;
  projectBoundary: ProjectBoundary;
  onImageSelect?: (image: SatelliteImage) => void;
  onAnalysisComplete?: (results: any) => void;
}

const SATELLITE_TYPES = [
  { value: 'landsat_8', label: 'Landsat 8', description: '30m resolution, 16-day revisit' },
  { value: 'landsat_9', label: 'Landsat 9', description: '30m resolution, 16-day revisit' },
  { value: 'sentinel_2', label: 'Sentinel-2', description: '10m resolution, 5-day revisit' }
];

const ANALYSIS_TYPES = [
  { value: 'vegetation_indices', label: 'Vegetation Indices', description: 'NDVI and EVI calculation' },
  { value: 'change_detection', label: 'Change Detection', description: 'Forest change analysis' },
  { value: 'elevation', label: 'Elevation Data', description: 'Topographic information' }
];

export const SatelliteImageryViewer: React.FC<SatelliteImageryViewerProps> = ({
  projectId,
  projectBoundary,
  onImageSelect,
  onAnalysisComplete
}) => {
  const [selectedSatellite, setSelectedSatellite] = useState('sentinel_2');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [cloudCover, setCloudCover] = useState(30);
  
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SatelliteImage | null>(null);
  const [vegetationData, setVegetationData] = useState<VegetationIndices | null>(null);
  const [changeDetectionData, setChangeDetectionData] = useState<ChangeDetectionResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for satellite imagery
  const searchImagery = useCallback(async () => {
    if (!projectBoundary || !projectId) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = selectedSatellite.includes('landsat') 
        ? '/api/v1/remote-sensing/landsat/imagery'
        : '/api/v1/remote-sensing/sentinel2/imagery';

      const response = await fetch(`${endpoint}?project_id=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_boundary: projectBoundary,
          start_date: startDate,
          end_date: endDate,
          cloud_cover_max: cloudCover,
          store_in_ipfs: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch satellite imagery');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.best_image) {
        setImages([data.best_image]);
        setSelectedImage(data.best_image);
        onImageSelect?.(data.best_image);
      } else if (data.status === 'no_data') {
        setImages([]);
        setSelectedImage(null);
        setError('No satellite imagery found for the specified criteria');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search imagery');
      console.error('Error searching imagery:', err);
    } finally {
      setLoading(false);
    }
  }, [projectBoundary, projectId, selectedSatellite, startDate, endDate, cloudCover, onImageSelect]);

  // Calculate vegetation indices
  const calculateVegetationIndices = useCallback(async () => {
    if (!projectBoundary || !selectedImage) return;

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/remote-sensing/vegetation-indices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_boundary: projectBoundary,
          start_date: startDate,
          end_date: endDate,
          satellite_type: selectedSatellite
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate vegetation indices');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setVegetationData({
          ndvi: data.ndvi,
          evi: data.evi
        });
        onAnalysisComplete?.(data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate vegetation indices');
      console.error('Error calculating vegetation indices:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [projectBoundary, selectedImage, startDate, endDate, selectedSatellite, onAnalysisComplete]);

  // Perform change detection
  const performChangeDetection = useCallback(async () => {
    if (!projectBoundary || !projectId) return;

    setAnalyzing(true);
    setError(null);

    try {
      const beforeDate = '2023-01-01';
      const afterDate = endDate;

      const response = await fetch(`/api/v1/remote-sensing/change-detection?project_id=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_boundary: projectBoundary,
          before_date: beforeDate,
          after_date: afterDate,
          satellite_type: selectedSatellite,
          store_results: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to perform change detection');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setChangeDetectionData(data.results);
        onAnalysisComplete?.(data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform change detection');
      console.error('Error performing change detection:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [projectBoundary, projectId, endDate, selectedSatellite, onAnalysisComplete]);

  // Download satellite image
  const downloadImage = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, []);

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Get cloud cover badge color
  const getCloudCoverBadgeColor = (cloudCover: number): string => {
    if (cloudCover <= 5) return 'bg-green-100 text-green-800';
    if (cloudCover <= 15) return 'bg-yellow-100 text-yellow-800';
    if (cloudCover <= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Satellite className="w-5 h-5" />
          Satellite Imagery Search
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satellite Type
            </label>
            <select
              value={selectedSatellite}
              onChange={(e) => setSelectedSatellite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SATELLITE_TYPES.map(sat => (
                <option key={sat.value} value={sat.value}>
                  {sat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Cloud Cover (%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={cloudCover}
              onChange={(e) => setCloudCover(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-500 text-center">{cloudCover}%</div>
          </div>
        </div>

        <Button
          onClick={searchImagery}
          disabled={loading || !projectBoundary}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Searching...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Satellite className="w-4 h-4" />
              Search Satellite Imagery
            </div>
          )}
        </Button>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-700 text-sm">{error}</div>
        </Card>
      )}

      {/* Selected Image Display */}
      {selectedImage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Selected Satellite Image</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Image Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Scene ID:</span>
                  <span className="font-mono">{selectedImage.scene_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Satellite:</span>
                  <span>{selectedImage.satellite}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sensor:</span>
                  <span>{selectedImage.sensor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Acquisition Date:</span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedImage.acquisition_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cloud Cover:</span>
                  <Badge className={getCloudCoverBadgeColor(selectedImage.cloud_cover)}>
                    <CloudRain className="w-3 h-3 mr-1" />
                    {selectedImage.cloud_cover.toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {selectedImage.download_url && (
                  <Button
                    onClick={() => downloadImage(selectedImage.download_url!, `${selectedImage.scene_id}.tif`)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download True Color
                  </Button>
                )}
                {selectedImage.rgb_download_url && (
                  <Button
                    onClick={() => downloadImage(selectedImage.rgb_download_url!, `${selectedImage.scene_id}_rgb.tif`)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download RGB
                  </Button>
                )}
                {selectedImage.nir_rgb_download_url && (
                  <Button
                    onClick={() => downloadImage(selectedImage.nir_rgb_download_url!, `${selectedImage.scene_id}_nir.tif`)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download NIR-RGB
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Analysis Tools</h4>
              <div className="space-y-3">
                <Button
                  onClick={calculateVegetationIndices}
                  disabled={analyzing}
                  variant="outline"
                  className="w-full"
                >
                  {analyzing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  Calculate Vegetation Indices
                </Button>

                <Button
                  onClick={performChangeDetection}
                  disabled={analyzing}
                  variant="outline"
                  className="w-full"
                >
                  {analyzing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Detect Forest Changes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Vegetation Indices Results */}
      {vegetationData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Vegetation Indices Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-700">NDVI (Normalized Difference Vegetation Index)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mean:</span>
                  <span className="font-mono">{vegetationData.ndvi.mean?.toFixed(3) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Range:</span>
                  <span className="font-mono">
                    {vegetationData.ndvi.min?.toFixed(3) || 'N/A'} - {vegetationData.ndvi.max?.toFixed(3) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Std Dev:</span>
                  <span className="font-mono">{vegetationData.ndvi.std?.toFixed(3) || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-blue-700">EVI (Enhanced Vegetation Index)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mean:</span>
                  <span className="font-mono">{vegetationData.evi.mean?.toFixed(3) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Range:</span>
                  <span className="font-mono">
                    {vegetationData.evi.min?.toFixed(3) || 'N/A'} - {vegetationData.evi.max?.toFixed(3) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Std Dev:</span>
                  <span className="font-mono">{vegetationData.evi.std?.toFixed(3) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Change Detection Results */}
      {changeDetectionData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Forest Change Detection Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {changeDetectionData.forest_loss_ha.toFixed(1)} ha
              </div>
              <div className="text-sm text-red-700">Forest Loss</div>
              <div className="text-xs text-gray-600 mt-1">
                {formatPercentage(changeDetectionData.forest_loss_percent / 100)}
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {changeDetectionData.forest_gain_ha.toFixed(1)} ha
              </div>
              <div className="text-sm text-green-700">Forest Gain</div>
              <div className="text-xs text-gray-600 mt-1">
                {formatPercentage(changeDetectionData.forest_gain_percent / 100)}
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className={`text-2xl font-bold ${changeDetectionData.net_change_ha >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {changeDetectionData.net_change_ha >= 0 ? '+' : ''}{changeDetectionData.net_change_ha.toFixed(1)} ha
              </div>
              <div className="text-sm text-blue-700">Net Change</div>
              <div className="text-xs text-gray-600 mt-1">
                Total Area: {changeDetectionData.total_area_ha.toFixed(1)} ha
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SatelliteImageryViewer;