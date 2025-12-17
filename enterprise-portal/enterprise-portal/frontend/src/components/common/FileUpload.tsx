/**
 * FileUpload Component - Enhanced File Upload with Client-Side Validation
 *
 * Features:
 * - Drag and drop file upload
 * - Client-side file type validation
 * - File size validation
 * - SHA256 hash calculation (client-side)
 * - Progress indicator
 * - Transaction ID linking
 * - CDN URL display after upload
 *
 * @author Frontend Development Team
 * @version 12.0.0
 * @since AV11-584
 */

import React, { useState, useCallback, useRef } from 'react';

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',  // Documents
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', // Images
  'json', 'csv', 'xml', 'yaml', 'yml'          // Data
];

// File categories
const FILE_CATEGORIES = [
  { value: 'documents', label: 'Documents' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'images', label: 'Images' },
  { value: 'data', label: 'Data Files' },
  { value: 'assets', label: 'Digital Assets' }
];

// Maximum file size in MB
const MAX_FILE_SIZE_MB = 100;

interface UploadedFile {
  fileId: string;
  originalName: string;
  sha256Hash: string;
  transactionId?: string;
  category: string;
  fileSize: number;
  mimeType?: string;
  cdnUrl?: string;
  downloadUrl: string;
  uploadedAt: string;
  verified: boolean;
}

interface FileUploadProps {
  transactionId?: string;
  onUploadComplete?: (file: UploadedFile) => void;
  onError?: (error: string) => void;
  allowMultiple?: boolean;
  showPreview?: boolean;
  defaultCategory?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  transactionId,
  onUploadComplete,
  onError,
  allowMultiple = false,
  showPreview = true,
  defaultCategory = 'documents',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clientHash, setClientHash] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file extension
  const isValidExtension = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ALLOWED_EXTENSIONS.includes(ext);
  };

  // Validate file size
  const isValidSize = (size: number): boolean => {
    return size <= MAX_FILE_SIZE_MB * 1024 * 1024;
  };

  // Calculate SHA256 hash client-side (optional, for verification)
  const calculateClientHash = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.warn('Client-side hash calculation not supported');
      return '';
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    validateAndSetFiles(files);
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    validateAndSetFiles(files);
  };

  // Validate and set files
  const validateAndSetFiles = async (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!isValidExtension(file.name)) {
        errors.push(`${file.name}: Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
        continue;
      }
      if (!isValidSize(file.size)) {
        errors.push(`${file.name}: File too large. Max size: ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      validFiles.push(file);

      // Calculate client-side hash for first file
      if (validFiles.length === 1) {
        const hash = await calculateClientHash(file);
        setClientHash(hash);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
      onError?.(errors.join('\n'));
    }

    if (!allowMultiple && validFiles.length > 0) {
      setSelectedFiles([validFiles[0]]);
    } else {
      setSelectedFiles(prev => allowMultiple ? [...prev, ...validFiles] : validFiles);
    }
  };

  // Remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
      setClientHash(null);
    }
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'https://dlt.aurigraph.io';
    const totalFiles = selectedFiles.length;
    const uploaded: UploadedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (description) {
        formData.append('description', description);
      }

      try {
        const url = transactionId
          ? `${API_BASE}/api/v12/attachments/${transactionId}`
          : `${API_BASE}/api/v12/attachments`;

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || `Upload failed: ${response.status}`);
        }

        const result: UploadedFile = await response.json();
        uploaded.push(result);
        onUploadComplete?.(result);

        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(`Failed to upload ${file.name}: ${errorMsg}`);
        onError?.(errorMsg);
      }
    }

    setUploadedFiles(prev => [...prev, ...uploaded]);
    setSelectedFiles([]);
    setIsUploading(false);
    setUploadProgress(100);
    setClientHash(null);

    // Reset progress after animation
    setTimeout(() => setUploadProgress(0), 1000);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get file icon based on extension
  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'rtf', 'odt', 'txt'].includes(ext)) return 'doc';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['json', 'csv', 'xml', 'yaml', 'yml'].includes(ext)) return 'data';
    return 'file';
  };

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Category Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          File Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {FILE_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the file..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Transaction ID Display */}
      {transactionId && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Linking to Transaction: <code className="text-xs">{transactionId}</code>
          </span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
          ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple={allowMultiple}
          accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
        />

        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {ALLOWED_EXTENSIONS.join(', ')} up to {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Files</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {getFileIcon(file.name) === 'pdf' && '📄'}
                  {getFileIcon(file.name) === 'doc' && '📝'}
                  {getFileIcon(file.name) === 'image' && '🖼️'}
                  {getFileIcon(file.name) === 'data' && '📊'}
                  {getFileIcon(file.name) === 'file' && '📁'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Client Hash Preview */}
          {clientHash && (
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              <span className="text-gray-500 dark:text-gray-400">SHA256: </span>
              <code className="text-gray-700 dark:text-gray-300 break-all">{clientHash}</code>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={uploadFiles}
            disabled={isUploading}
            className={`
              w-full py-2 px-4 rounded-md font-medium text-white transition-colors
              ${isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </span>
            ) : (
              `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">{file.originalName}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {formatFileSize(file.fileSize)} | {file.category}
                      {file.verified && <span className="ml-2">Verified</span>}
                    </p>
                  </div>
                  <a
                    href={file.cdnUrl || file.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Download
                  </a>
                </div>
                <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">File ID:</span>
                      <code className="ml-1 text-gray-700 dark:text-gray-300">{file.fileId}</code>
                    </div>
                    <div>
                      <span className="text-gray-500">SHA256:</span>
                      <code className="ml-1 text-gray-700 dark:text-gray-300">{file.sha256Hash.substring(0, 16)}...</code>
                    </div>
                    {file.cdnUrl && (
                      <div className="col-span-2">
                        <span className="text-gray-500">CDN:</span>
                        <code className="ml-1 text-gray-700 dark:text-gray-300 break-all">{file.cdnUrl}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
