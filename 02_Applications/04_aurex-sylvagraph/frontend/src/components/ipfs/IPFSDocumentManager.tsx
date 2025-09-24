/**
 * Aurex Sylvagraph - IPFS Document Manager Component
 * Upload, download, and manage documents stored in IPFS
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface IPFSFile {
  ipfs_hash: string;
  metadata_hash: string;
  filename: string;
  file_size: number;
  content_type: string;
  document_type: string;
  upload_timestamp: string;
  verification_status?: boolean;
}

interface IPFSDocumentManagerProps {
  projectId: string;
  documentType?: string;
  onUploadComplete?: (file: IPFSFile) => void;
  onDownloadStart?: (hash: string) => void;
}

const DOCUMENT_TYPES = [
  { value: 'general', label: 'General Document' },
  { value: 'monitoring_report', label: 'Monitoring Report' },
  { value: 'compliance', label: 'Compliance Document' },
  { value: 'verification', label: 'Verification Report' },
  { value: 'validation', label: 'Validation Report' },
  { value: 'pdd', label: 'Project Design Document' },
  { value: 'satellite_imagery', label: 'Satellite Imagery' },
  { value: 'drone_data', label: 'Drone Data' },
  { value: 'field_data', label: 'Field Data' }
];

export const IPFSDocumentManager: React.FC<IPFSDocumentManagerProps> = ({
  projectId,
  documentType = 'general',
  onUploadComplete,
  onDownloadStart
}) => {
  const [files, setFiles] = useState<IPFSFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState(documentType);
  
  // Fetch existing files for the project
  const fetchFiles = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/v1/ipfs/project/${projectId}/files?document_type=${selectedDocumentType}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedDocumentType]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      formData.append('document_type', selectedDocumentType);
      formData.append('metadata', JSON.stringify({
        uploaded_by: 'user', // Would be actual user ID
        upload_source: 'web_interface',
        original_filename: file.name
      }));

      const response = await fetch('/api/v1/ipfs/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      const newFile: IPFSFile = {
        ipfs_hash: result.ipfs_hash,
        metadata_hash: result.metadata_hash,
        filename: result.filename,
        file_size: result.file_size,
        content_type: result.content_type,
        document_type: selectedDocumentType,
        upload_timestamp: result.upload_timestamp
      };

      setFiles(prev => [newFile, ...prev]);
      onUploadComplete?.(newFile);

      // Reset file input
      event.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [projectId, selectedDocumentType, onUploadComplete]);

  // Handle file download
  const handleDownload = useCallback(async (ipfsHash: string, filename: string) => {
    try {
      onDownloadStart?.(ipfsHash);
      
      const response = await fetch(`/api/v1/ipfs/download/${ipfsHash}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      console.error('Download error:', err);
    }
  }, [onDownloadStart]);

  // Handle file verification
  const handleVerifyFile = useCallback(async (ipfsHash: string, expectedHash: string) => {
    try {
      const formData = new FormData();
      formData.append('expected_hash', expectedHash);

      const response = await fetch(`/api/v1/ipfs/verify/${ipfsHash}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result = await response.json();
      
      // Update file verification status
      setFiles(prev => prev.map(file => 
        file.ipfs_hash === ipfsHash 
          ? { ...file, verification_status: result.verified }
          : file
      ));

      return result.verified;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      console.error('Verification error:', err);
      return false;
    }
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get document type badge color
  const getDocumentTypeBadgeColor = (type: string): string => {
    const colors = {
      'monitoring_report': 'bg-green-100 text-green-800',
      'compliance': 'bg-blue-100 text-blue-800',
      'verification': 'bg-purple-100 text-purple-800',
      'validation': 'bg-orange-100 text-orange-800',
      'satellite_imagery': 'bg-teal-100 text-teal-800',
      'drone_data': 'bg-indigo-100 text-indigo-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document to IPFS
          </h3>
          
          <select
            value={selectedDocumentType}
            onChange={(e) => setSelectedDocumentType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOCUMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading || !projectId}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer ${uploading || !projectId ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              {uploading ? 'Uploading...' : 'Click to select a file or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              Supports: PDF, DOC, DOCX, TXT, CSV, XLSX, JPG, PNG, TIFF, KML, GeoJSON
            </p>
          </label>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                Uploading to IPFS...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Files List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">IPFS Documents</h3>
          <Button
            onClick={fetchFiles}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No documents found for this project</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.ipfs_hash}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {file.filename}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>{new Date(file.upload_timestamp).toLocaleDateString()}</span>
                      <Badge className={getDocumentTypeBadgeColor(file.document_type)}>
                        {DOCUMENT_TYPES.find(t => t.value === file.document_type)?.label || file.document_type}
                      </Badge>
                      {file.verification_status !== undefined && (
                        <div className="flex items-center gap-1">
                          {file.verification_status ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={file.verification_status ? 'text-green-600' : 'text-red-600'}>
                            {file.verification_status ? 'Verified' : 'Verification Failed'}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      IPFS: {file.ipfs_hash.substring(0, 20)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDownload(file.ipfs_hash, file.filename)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => window.open(`https://ipfs.io/ipfs/${file.ipfs_hash}`, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default IPFSDocumentManager;