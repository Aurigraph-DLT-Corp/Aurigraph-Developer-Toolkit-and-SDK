/**
 * Utility functions for formatting data
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  AssetStatus,
  ContractStatus,
  ComplianceStatus,
  ComplianceLevel,
} from './assetConstants';

dayjs.extend(relativeTime);

/**
 * Format currency values
 */
export const formatCurrency = (
  value: number | string,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numValue);
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'N/A';
  }

  if (numValue >= 1_000_000_000) {
    return `${(numValue / 1_000_000_000).toFixed(2)}B`;
  }
  if (numValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(2)}M`;
  }
  if (numValue >= 1_000) {
    return `${(numValue / 1_000).toFixed(2)}K`;
  }
  return numValue.toFixed(2);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  if (isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format date to ISO string
 */
export const formatDate = (
  date: Date | string | number,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!date) {
    return 'N/A';
  }
  return dayjs(date).format(format);
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  if (!date) {
    return 'N/A';
  }
  return dayjs(date).fromNow();
};

/**
 * Format ISO date to user-friendly format
 */
export const formatDateTime = (isoString: string): string => {
  if (!isoString) {
    return 'N/A';
  }
  return dayjs(isoString).format('MMM D, YYYY h:mm A');
};

/**
 * Format date only (no time)
 */
export const formatDateOnly = (date: Date | string | number): string => {
  if (!date) {
    return 'N/A';
  }
  return dayjs(date).format('MMM D, YYYY');
};

/**
 * Format asset status with proper casing
 */
export const formatAssetStatus = (status: AssetStatus | string): string => {
  if (!status) {
    return 'Unknown';
  }
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format contract status
 */
export const formatContractStatus = (status: ContractStatus | string): string => {
  if (!status) {
    return 'Unknown';
  }
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format compliance status
 */
export const formatComplianceStatus = (status: ComplianceStatus | string): string => {
  if (!status) {
    return 'Unknown';
  }
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format compliance level
 */
export const formatComplianceLevel = (level: ComplianceLevel | string): string => {
  if (!level) {
    return 'Unknown';
  }
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
};

/**
 * Truncate address/hash for display
 */
export const truncateHash = (hash: string, startChars: number = 6, endChars: number = 4): string => {
  if (!hash || hash.length <= startChars + endChars) {
    return hash;
  }
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
};

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration in milliseconds to human-readable format
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`;
  }
  return `${(ms / 3600000).toFixed(1)}h`;
};

/**
 * Calculate days until expiry
 */
export const daysUntilExpiry = (expiryDate: Date | string): number => {
  if (!expiryDate) {
    return -1;
  }
  const now = dayjs();
  const expiry = dayjs(expiryDate);
  return expiry.diff(now, 'day');
};

/**
 * Check if date is expiring soon (within threshold days)
 */
export const isExpiringSoon = (expiryDate: Date | string, thresholdDays: number = 30): boolean => {
  const days = daysUntilExpiry(expiryDate);
  return days >= 0 && days <= thresholdDays;
};

/**
 * Check if date has expired
 */
export const isExpired = (expiryDate: Date | string): boolean => {
  return daysUntilExpiry(expiryDate) < 0;
};

/**
 * Format blockchain address for display
 */
export const formatAddress = (address: string): string => {
  return truncateHash(address, 8, 6);
};

/**
 * Format transaction hash for display
 */
export const formatTxHash = (hash: string): string => {
  return truncateHash(hash, 10, 8);
};

/**
 * Convert snake_case to Title Case
 */
export const snakeToTitleCase = (str: string): string => {
  if (!str) {
    return '';
  }
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format valuation with currency symbol
 */
export const formatValuation = (
  value: number,
  currency: string = 'USD',
  compact: boolean = false
): string => {
  if (compact && value >= 1000) {
    return `${currency === 'USD' ? '$' : currency} ${formatNumber(value)}`;
  }
  return formatCurrency(value, currency);
};

/**
 * Parse CSV data to array of objects
 */
export const parseCSV = (csvText: string): Record<string, any>[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  const data: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, any> = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    data.push(row);
  }

  return data;
};

/**
 * Convert array of objects to CSV string
 */
export const toCSV = (data: Record<string, any>[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Download data as file
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (data: Record<string, any>[], filename: string): void => {
  const csv = toCSV(data);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
};

/**
 * Format ownership history for timeline display
 */
export const formatOwnershipHistory = (
  records: Array<{
    previousOwner: string;
    newOwner: string;
    timestamp: string;
    transactionHash?: string;
  }>
) => {
  return records.map((record) => ({
    ...record,
    formattedDate: formatDateTime(record.timestamp),
    relativeDate: formatRelativeTime(record.timestamp),
    shortTxHash: record.transactionHash ? formatTxHash(record.transactionHash) : 'N/A',
  }));
};
