// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR EVIDENCE UPLOADER
// Sub-Application #13: File Upload Component with Progress Indicators
// Module ID: LAU-MAT-013-FE-EVIDENCE - Evidence Upload Component
// Created: August 7, 2025
// ================================================================================

import React, { useState, useRef, useCallback } from 'react';
import { AssessmentEvidence, EvidenceType } from '../../types/carbonMaturityNavigator';
import carbonMaturityNavigatorApi from '../../services/carbonMaturityNavigatorApi';

interface EvidenceUploaderProps {
  assessmentId: string;
  responseId?: string;
  requiredTypes: EvidenceType[];
  onUploadComplete: (evidence: AssessmentEvidence) => void;
  className?: string;
  maxFileSize?: number; // in MB
  allowMultiple?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  evidenceId?: string;
  error?: string;
}

const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  assessmentId,
  responseId,
  requiredTypes,
  onUploadComplete,
  className = '',
  maxFileSize = 50, // 50MB default
  allowMultiple = true
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    title: '',
    description: '',
    evidenceType: requiredTypes[0] || EvidenceType.OTHER
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported file types
  const supportedTypes = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-excel': '.xls',
    'text/csv': '.csv',
    'image/jpeg': '.jpg, .jpeg',
    'image/png': '.png',
    'image/tiff': '.tiff',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  };

  const evidenceTypeLabels = {
    [EvidenceType.POLICY_DOCUMENT]: 'Policy Document',
    [EvidenceType.PROCEDURE]: 'Procedure',
    [EvidenceType.CERTIFICATION]: 'Certification',
    [EvidenceType.AUDIT_REPORT]: 'Audit Report',
    [EvidenceType.TRAINING_RECORD]: 'Training Record',
    [EvidenceType.MEASUREMENT_DATA]: 'Measurement Data',
    [EvidenceType.VERIFICATION_STATEMENT]: 'Verification Statement',
    [EvidenceType.OTHER]: 'Other'
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (!Object.keys(supportedTypes).includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }

    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback((files: FileList) => {
    if (!allowMultiple && files.length > 1) {
      alert('Only one file can be uploaded at a time');
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert('File validation errors:\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(files);
      setShowForm(true);
      
      // Auto-populate title if only one file
      if (validFiles.length === 1) {
        setEvidenceForm(prev => ({
          ...prev,
          title: validFiles[0].name.replace(/\.[^/.]+$/, "") // Remove extension
        }));
      }
    }
  }, [allowMultiple, maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const uploadFiles = async () => {
    if (!selectedFiles || !evidenceForm.title.trim()) return;

    const filesToUpload = Array.from(selectedFiles);
    
    // Initialize upload progress tracking
    const newUploads: UploadProgress[] = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setUploads(prev => [...prev, ...newUploads]);

    // Process each file
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const uploadIndex = uploads.length + i;

      try {
        // Update progress to show upload started
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, progress: 10 }
            : upload
        ));

        // Prepare evidence data
        const evidenceData = {
          response_id: responseId,
          evidence_type: evidenceForm.evidenceType,
          title: filesToUpload.length === 1 ? evidenceForm.title : `${evidenceForm.title} - ${file.name}`,
          description: evidenceForm.description
        };

        // Upload file
        const uploadResponse = await carbonMaturityNavigatorApi.uploadEvidence(
          assessmentId,
          file,
          evidenceData
        );

        // Update progress to completed
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { 
                ...upload, 
                progress: 100,
                status: 'completed' as const,
                evidenceId: uploadResponse.evidence_id
              }
            : upload
        ));

        // Create evidence object for callback
        const evidence: AssessmentEvidence = {
          id: uploadResponse.evidence_id,
          assessment_id: assessmentId,
          response_id: responseId,
          file_name: uploadResponse.file_name,
          original_filename: file.name,
          file_size: uploadResponse.file_size,
          file_size_mb: uploadResponse.file_size / (1024 * 1024),
          file_type: file.type,
          evidence_type: evidenceForm.evidenceType,
          title: evidenceData.title,
          description: evidenceData.description,
          uploaded_date: new Date().toISOString(),
          uploaded_by: 'current_user_id', // This would come from auth context
          is_validated: false,
          processing_status: uploadResponse.processing_status as any
        };

        onUploadComplete(evidence);

      } catch (error: any) {
        console.error('Upload failed:', error);
        
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { 
                ...upload, 
                status: 'error' as const,
                error: error.message || 'Upload failed'
              }
            : upload
        ));
      }
    }

    // Reset form after all uploads complete
    setTimeout(() => {
      setShowForm(false);
      setSelectedFiles(null);
      setEvidenceForm({
        title: '',
        description: '',
        evidenceType: requiredTypes[0] || EvidenceType.OTHER
      });
      
      // Clear completed uploads after 5 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.status === 'uploading'));
      }, 5000);
    }, 1000);
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-gray-600">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Upload files
            </button>
            <span> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-500">
            {Object.values(supportedTypes).join(', ')} up to {maxFileSize}MB each
          </p>
          <p className="text-xs text-gray-500">
            Required types: {requiredTypes.map(type => evidenceTypeLabels[type]).join(', ')}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          onChange={handleFileInputChange}
          accept={Object.keys(supportedTypes).join(',')}
          className="hidden"
        />
      </div>

      {/* Evidence Form */}
      {showForm && selectedFiles && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Evidence Details</h4>
          
          <div className="space-y-4">
            {/* Selected Files Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Files ({selectedFiles.length})
              </label>
              <div className="space-y-2">
                {Array.from(selectedFiles).map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-900">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence Type *
              </label>
              <select
                value={evidenceForm.evidenceType}
                onChange={(e) => setEvidenceForm(prev => ({ 
                  ...prev, 
                  evidenceType: e.target.value as EvidenceType 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {requiredTypes.map((type) => (
                  <option key={type} value={type}>
                    {evidenceTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={evidenceForm.title}
                onChange={(e) => setEvidenceForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief descriptive title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={evidenceForm.description}
                onChange={(e) => setEvidenceForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional details about this evidence (optional)"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedFiles(null);
                  setEvidenceForm({
                    title: '',
                    description: '',
                    evidenceType: requiredTypes[0] || EvidenceType.OTHER
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={uploadFiles}
                disabled={!evidenceForm.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload {selectedFiles.length === 1 ? 'File' : 'Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
          
          {uploads.map((upload, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {upload.file.name}
                  </span>
                  
                  {upload.status === 'completed' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Uploaded
                    </span>
                  )}
                  
                  {upload.status === 'error' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Failed
                    </span>
                  )}
                </div>
                
                {upload.status !== 'uploading' && (
                  <button
                    onClick={() => removeUpload(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              
              {upload.error && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {upload.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceUploader;