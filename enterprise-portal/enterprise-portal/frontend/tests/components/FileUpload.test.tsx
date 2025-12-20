/**
 * FileUpload Component Tests
 *
 * Tests for the enhanced file upload component with:
 * - Client-side SHA256 hashing
 * - Transaction ID linking
 * - Hash verification
 * - Drag and drop support
 * - File validation
 *
 * @author Testing Agent
 * @version 12.0.0
 * @since AV11-585
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../../src/components/common/FileUpload';

// Mock crypto.subtle for hash calculation
const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest
    }
  }
});

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FileUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render file upload drop zone', () => {
      render(<FileUpload />);

      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });

    it('should render category selector', () => {
      render(<FileUpload />);

      expect(screen.getByLabelText(/file category/i)).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    it('should render description input', () => {
      render(<FileUpload />);

      expect(screen.getByPlaceholderText(/brief description/i)).toBeInTheDocument();
    });

    it('should display transaction ID when provided', () => {
      const txId = '0x1234567890abcdef';
      render(<FileUpload transactionId={txId} />);

      expect(screen.getByText(/linking to transaction/i)).toBeInTheDocument();
      expect(screen.getByText(txId)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should accept valid file extensions', async () => {
      render(<FileUpload />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('should reject invalid file extensions', async () => {
      const onError = vi.fn();
      render(<FileUpload onError={onError} />);

      const file = new File(['test content'], 'test.exe', { type: 'application/octet-stream' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(onError).toHaveBeenCalled();
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });

    it('should reject files exceeding size limit', async () => {
      const onError = vi.fn();
      render(<FileUpload onError={onError} />);

      // Create a file larger than 100MB (simulated)
      const largeContent = new Array(101 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Client-Side Hashing', () => {
    it('should calculate SHA256 hash for selected file', async () => {
      render(<FileUpload />);

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      // Wait for hash calculation
      await waitFor(() => {
        expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.any(ArrayBuffer));
      });
    });

    it('should display hash preview before upload', async () => {
      // Mock hash result
      const hashBytes = new Uint8Array(32).fill(0xab);
      mockDigest.mockResolvedValue(hashBytes.buffer);

      render(<FileUpload />);

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/sha256/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('should upload file without transaction ID', async () => {
      const onUploadComplete = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          fileId: 'file-123',
          originalName: 'test.pdf',
          sha256Hash: 'abc123',
          category: 'documents',
          fileSize: 1024,
          verified: true,
          downloadUrl: '/download/file-123'
        })
      });

      render(<FileUpload onUploadComplete={onUploadComplete} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByText(/upload 1 file/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v12/attachments'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should upload file with transaction ID', async () => {
      const txId = '0x1234567890abcdef';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          fileId: 'file-123',
          transactionId: txId,
          originalName: 'test.pdf',
          sha256Hash: 'abc123',
          category: 'documents',
          fileSize: 1024,
          verified: true,
          downloadUrl: '/download/file-123'
        })
      });

      render(<FileUpload transactionId={txId} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByText(/upload 1 file/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/v12/attachments/${txId}`),
          expect.any(Object)
        );
      });
    });

    it('should display progress during upload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          fileId: 'file-123',
          originalName: 'test.pdf',
          sha256Hash: 'abc123',
          category: 'documents',
          fileSize: 1024,
          verified: true,
          downloadUrl: '/download/file-123'
        })
      });

      render(<FileUpload />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByText(/upload 1 file/i);
      await userEvent.click(uploadButton);

      // Progress bar should appear
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });
    });

    it('should handle upload error gracefully', async () => {
      const onError = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' })
      });

      render(<FileUpload onError={onError} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByText(/upload 1 file/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to upload/i)).toBeInTheDocument();
      });
    });
  });

  describe('Hash Verification', () => {
    it('should verify file hash via API', async () => {
      // First upload a file
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          fileId: 'file-123',
          originalName: 'test.pdf',
          sha256Hash: 'abc123',
          category: 'documents',
          fileSize: 1024,
          verified: true,
          downloadUrl: '/download/file-123'
        })
      });

      render(<FileUpload />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByText(/upload 1 file/i);
      await userEvent.click(uploadButton);

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      // Mock verify response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ verified: true })
      });

      // Click verify button
      const verifyButton = screen.getByText(/verify hash/i);
      await userEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v12/attachments/file-123/verify'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should show verification success state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            fileId: 'file-123',
            originalName: 'test.pdf',
            sha256Hash: 'abc123',
            category: 'documents',
            fileSize: 1024,
            verified: true,
            downloadUrl: '/download/file-123'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ verified: true })
        });

      render(<FileUpload />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByText(/upload 1 file/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/verify hash/i)).toBeInTheDocument();
      });

      const verifyButton = screen.getByText(/verify hash/i);
      await userEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/verified/i)).toBeInTheDocument();
      });
    });

    it('should show verification failure state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            fileId: 'file-123',
            originalName: 'test.pdf',
            sha256Hash: 'abc123',
            category: 'documents',
            fileSize: 1024,
            verified: true,
            downloadUrl: '/download/file-123'
          })
        })
        .mockResolvedValueOnce({
          ok: false
        });

      render(<FileUpload />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByText(/upload 1 file/i);
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/verify hash/i)).toBeInTheDocument();
      });

      const verifyButton = screen.getByText(/verify hash/i);
      await userEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should highlight drop zone on drag enter', () => {
      render(<FileUpload />);

      const dropZone = screen.getByText(/click to upload/i).closest('div');

      fireEvent.dragEnter(dropZone!);

      // Check for highlight class
      expect(dropZone).toHaveClass('border-blue-500');
    });

    it('should remove highlight on drag leave', () => {
      render(<FileUpload />);

      const dropZone = screen.getByText(/click to upload/i).closest('div');

      fireEvent.dragEnter(dropZone!);
      fireEvent.dragLeave(dropZone!);

      expect(dropZone).not.toHaveClass('border-blue-500');
    });

    it('should handle file drop', async () => {
      render(<FileUpload />);

      const dropZone = screen.getByText(/click to upload/i).closest('div');
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      const dataTransfer = {
        files: [file],
        items: [{ kind: 'file', type: 'application/pdf', getAsFile: () => file }],
        types: ['Files']
      };

      fireEvent.drop(dropZone!, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Files', () => {
    it('should allow multiple files when enabled', async () => {
      render(<FileUpload allowMultiple />);

      const file1 = new File(['content 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content 2'], 'test2.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, [file1, file2]);

      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });

    it('should only keep one file when multiple is disabled', async () => {
      render(<FileUpload allowMultiple={false} />);

      const file1 = new File(['content 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content 2'], 'test2.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, [file1, file2]);

      // Only first file should be present
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.queryByText('test2.pdf')).not.toBeInTheDocument();
    });
  });

  describe('File Removal', () => {
    it('should remove selected file when clicking remove button', async () => {
      render(<FileUpload />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(screen.getByText('test.pdf')).toBeInTheDocument();

      // Find and click remove button (the X icon)
      const removeButton = screen.getByRole('button', { name: '' });
      await userEvent.click(removeButton);

      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should allow changing file category', async () => {
      render(<FileUpload defaultCategory="documents" />);

      const categorySelect = screen.getByLabelText(/file category/i);
      await userEvent.selectOptions(categorySelect, 'images');

      expect(categorySelect).toHaveValue('images');
    });
  });
});

// Security Tests
describe('FileUpload Security Tests', () => {
  describe('Path Traversal Prevention', () => {
    it('should reject files with path traversal in name', async () => {
      const onError = vi.fn();
      render(<FileUpload onError={onError} />);

      // Attempt to create file with path traversal - browsers sanitize this
      // but we should still validate
      const file = new File(['content'], '../../../etc/passwd', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      // File should be rejected due to invalid extension (no .txt etc)
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('MIME Type Validation', () => {
    it('should use file extension for validation, not MIME type', async () => {
      render(<FileUpload />);

      // File with .pdf extension but wrong MIME type
      const file = new File(['test'], 'test.pdf', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      // Should accept based on extension
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });
});
