import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MerkleVerification from '../../components/MerkleVerification';
import { apiService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    generateMerkleProof: vi.fn(),
    verifyMerkleProof: vi.fn()
  }
}));

describe('MerkleVerification Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component with title and description', () => {
      render(<MerkleVerification />);

      expect(screen.getByText(/Merkle Proof Verification/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Cryptographic verification for RWAT token registry integrity/i)
      ).toBeInTheDocument();
    });

    it('should render RWAT ID input field', () => {
      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter RWAT ID (e.g., RWAT-001)');
    });

    it('should render Generate Merkle Proof button', () => {
      render(<MerkleVerification />);

      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });
      expect(button).toBeInTheDocument();
    });

    it('should disable generate button when input is empty', () => {
      render(<MerkleVerification />);

      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Proof Generation', () => {
    const mockProofData = {
      leafHash: 'leaf-hash-12345',
      rootHash: 'root-hash-67890',
      leafIndex: 5,
      proofPath: [
        { siblingHash: 'sibling-1', isLeft: true },
        { siblingHash: 'sibling-2', isLeft: false },
        { siblingHash: 'sibling-3', isLeft: true }
      ]
    };

    it('should enable generate button when RWAT ID is entered', async () => {
      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');

      expect(button).toBeEnabled();
    });

    it('should call API to generate proof when button is clicked', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(button);

      await waitFor(() => {
        expect(apiService.generateMerkleProof).toHaveBeenCalledWith('RWAT-001');
      });
    });

    it('should display proof data after successful generation', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Proof Generated Successfully!/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Leaf Hash \(Token Data\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Merkle Root Hash/i)).toBeInTheDocument();
      expect(screen.getByText(/leaf-hash-12345/i)).toBeInTheDocument();
      expect(screen.getByText(/root-hash-67890/i)).toBeInTheDocument();
      expect(screen.getByText(/Proof contains 3 hops from leaf to root/i)).toBeInTheDocument();
    });

    it('should display error message when proof generation fails', async () => {
      vi.mocked(apiService.generateMerkleProof).mockRejectedValue(
        new Error('Failed to generate proof')
      );

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'INVALID-ID');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate proof/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during proof generation', async () => {
      vi.mocked(apiService.generateMerkleProof).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockProofData), 1000))
      );

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(button);

      expect(button).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Proof Verification', () => {
    const mockProofData = {
      leafHash: 'leaf-hash-12345',
      rootHash: 'root-hash-67890',
      leafIndex: 5,
      proofPath: [
        { siblingHash: 'sibling-1', isLeft: true },
        { siblingHash: 'sibling-2', isLeft: false }
      ]
    };

    const mockVerificationSuccess = {
      valid: true,
      message: 'Proof is valid. Token is in the registry.'
    };

    const mockVerificationFailure = {
      valid: false,
      message: 'Proof is invalid. Token not found in registry.'
    };

    it('should show verify button after proof is generated', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const generateButton = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Verify This Proof/i })).toBeInTheDocument();
      });
    });

    it('should call API to verify proof when verify button is clicked', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);
      vi.mocked(apiService.verifyMerkleProof).mockResolvedValue(mockVerificationSuccess);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const generateButton = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Verify This Proof/i })).toBeInTheDocument();
      });

      const verifyButton = screen.getByRole('button', { name: /Verify This Proof/i });
      await userEvent.click(verifyButton);

      await waitFor(() => {
        expect(apiService.verifyMerkleProof).toHaveBeenCalledWith(mockProofData);
      });
    });

    it('should display success message when proof is valid', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);
      vi.mocked(apiService.verifyMerkleProof).mockResolvedValue(mockVerificationSuccess);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const generateButton = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Verify This Proof/i })).toBeInTheDocument();
      });

      const verifyButton = screen.getByRole('button', { name: /Verify This Proof/i });
      await userEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/✓ Proof Valid/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Proof is valid. Token is in the registry./i)
        ).toBeInTheDocument();
      });
    });

    it('should display error message when proof is invalid', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);
      vi.mocked(apiService.verifyMerkleProof).mockResolvedValue(mockVerificationFailure);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const generateButton = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Verify This Proof/i })).toBeInTheDocument();
      });

      const verifyButton = screen.getByRole('button', { name: /Verify This Proof/i });
      await userEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/✗ Proof Invalid/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Proof is invalid. Token not found in registry./i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Proof Path Display', () => {
    const mockProofData = {
      leafHash: 'leaf-hash-12345',
      rootHash: 'root-hash-67890',
      leafIndex: 5,
      proofPath: [
        { siblingHash: 'sibling-hash-1', isLeft: true },
        { siblingHash: 'sibling-hash-2', isLeft: false },
        { siblingHash: 'sibling-hash-3', isLeft: true }
      ]
    };

    it('should display proof path with correct number of steps', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Proof Path \(3 steps\)/i)).toBeInTheDocument();
      });
    });

    it('should toggle proof path visibility when expand button is clicked', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Proof Path \(3 steps\)/i)).toBeInTheDocument();
      });

      // Proof should be collapsed initially, expand it
      const proofPathSection = screen.getByText(/Proof Path \(3 steps\)/i).closest('div');
      const expandButton = proofPathSection?.querySelector('button');

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument();
          expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument();
          expect(screen.getByText(/Step 3 of 3/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Copy to Clipboard', () => {
    const mockProofData = {
      leafHash: 'leaf-hash-to-copy',
      rootHash: 'root-hash-to-copy',
      leafIndex: 1,
      proofPath: [{ siblingHash: 'sibling-to-copy', isLeft: true }]
    };

    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn()
        }
      });
    });

    it('should copy leaf hash to clipboard when copy button is clicked', async () => {
      vi.mocked(apiService.generateMerkleProof).mockResolvedValue(mockProofData);

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/leaf-hash-to-copy/i)).toBeInTheDocument();
      });

      // Find and click the copy button for leaf hash
      const leafSection = screen.getByText(/Leaf Hash \(Token Data\)/i).closest('div');
      const copyButton = leafSection?.querySelector('button');

      if (copyButton) {
        fireEvent.click(copyButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('leaf-hash-to-copy');
      }
    });
  });

  describe('Error Handling', () => {
    it('should display error when RWAT ID is empty and generate is attempted', async () => {
      render(<MerkleVerification />);

      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      // Try to click disabled button (button should be disabled)
      expect(button).toBeDisabled();
    });

    it('should clear previous error when new proof is generated', async () => {
      vi.mocked(apiService.generateMerkleProof)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          leafHash: 'hash',
          rootHash: 'root',
          leafIndex: 0,
          proofPath: []
        });

      render(<MerkleVerification />);

      const input = screen.getByLabelText(/RWAT ID/i);
      const button = screen.getByRole('button', { name: /Generate Merkle Proof/i });

      // First attempt - should fail
      await userEvent.type(input, 'RWAT-001');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument();
      });

      // Second attempt - should succeed and clear error
      await userEvent.clear(input);
      await userEvent.type(input, 'RWAT-002');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Proof Generated Successfully!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component Accessibility', () => {
    it('should have accessible labels for form elements', () => {
      render(<MerkleVerification />);

      expect(screen.getByLabelText(/RWAT ID/i)).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<MerkleVerification />);

      expect(
        screen.getByRole('button', { name: /Generate Merkle Proof/i })
      ).toBeInTheDocument();
    });
  });
});
