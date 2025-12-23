import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';
import ValidatorPerformanceMonitor from '../../../pages/validators/ValidatorPerformanceMonitor';
import { apiService } from '../../../services/api';

// ============================================================================
// MOCKS
// ============================================================================

// Mock the API service
vi.mock('../../../services/api', () => ({
  apiService: {
    getValidators: vi.fn(),
    getValidatorDetails: vi.fn(),
    getStakingInfo: vi.fn(),
    getNetworkHealth: vi.fn(),
    claimRewards: vi.fn(),
  },
}));

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockValidators = [
  {
    address: 'val1abc123def456',
    name: 'Validator Alpha',
    stake: 5000000,
    uptime: 99.8,
    tps: 15000,
    rewards: 125000,
    status: 'active' as const,
    commission: 5,
    votingPower: 12.5,
    blocksProposed: 5432,
    consensusParticipation: 98.5,
    performanceScore: 95,
    lastActiveTime: Date.now(),
  },
  {
    address: 'val2xyz789ghi012',
    name: 'Validator Beta',
    stake: 3500000,
    uptime: 98.5,
    tps: 12000,
    rewards: 87500,
    status: 'active' as const,
    commission: 7,
    votingPower: 8.75,
    blocksProposed: 4123,
    consensusParticipation: 96.2,
    performanceScore: 88,
    lastActiveTime: Date.now(),
  },
  {
    address: 'val3mno345pqr678',
    name: 'Validator Gamma',
    stake: 2000000,
    uptime: 92.3,
    tps: 8000,
    rewards: 50000,
    status: 'inactive' as const,
    commission: 10,
    votingPower: 5.0,
    blocksProposed: 2876,
    consensusParticipation: 85.0,
    performanceScore: 72,
    lastActiveTime: Date.now() - 3600000,
  },
  {
    address: 'val4stu901vwx234',
    name: 'Validator Delta',
    stake: 1500000,
    uptime: 85.0,
    tps: 5000,
    rewards: 25000,
    status: 'jailed' as const,
    commission: 15,
    votingPower: 3.75,
    blocksProposed: 1543,
    consensusParticipation: 70.0,
    performanceScore: 60,
    lastActiveTime: Date.now() - 7200000,
  },
];

const mockValidatorDetails = {
  validator: mockValidators[0],
  uptimeHistory: [
    { time: '2025-10-01', uptime: 99.5 },
    { time: '2025-10-08', uptime: 99.7 },
    { time: '2025-10-15', uptime: 99.8 },
    { time: '2025-10-22', uptime: 99.9 },
  ],
  blockProposalHistory: [
    { time: 'Week 1', blocks: 1250 },
    { time: 'Week 2', blocks: 1320 },
    { time: 'Week 3', blocks: 1400 },
    { time: 'Week 4', blocks: 1462 },
  ],
  rewardHistory: [
    { time: 'Week 1', amount: 30000 },
    { time: 'Week 2', amount: 31500 },
    { time: 'Week 3', amount: 32000 },
    { time: 'Week 4', amount: 31500 },
  ],
  stakeGrowth: [
    { time: 'Week 1', stake: 4500000 },
    { time: 'Week 2', stake: 4700000 },
    { time: 'Week 3', stake: 4900000 },
    { time: 'Week 4', stake: 5000000 },
  ],
  performanceTrend: [
    { time: 'Week 1', score: 92 },
    { time: 'Week 2', score: 93 },
    { time: 'Week 3', score: 94 },
    { time: 'Week 4', score: 95 },
  ],
};

const mockNetworkHealth = {
  activeValidatorCount: 8,
  totalValidators: 10,
  networkSecurityStatus: 'SECURE',
  decentralizationIndex: 0.85,
  averageUptime: 96.5,
  totalStaked: 12000000,
  validatorDistribution: [
    { region: 'North America', count: 3 },
    { region: 'Europe', count: 3 },
    { region: 'Asia', count: 2 },
    { region: 'Other', count: 2 },
  ],
};

const mockStakingInfo = {
  totalStaked: 12000000,
  totalRewards: 288000,
  apr: 12.5,
  unbondingPeriod: 21,
  minStake: 100000,
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ValidatorPerformanceMonitor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default mock implementations
    (apiService.getValidators as any).mockResolvedValue({ validators: mockValidators });
    (apiService.getValidatorDetails as any).mockResolvedValue(mockValidatorDetails);
    (apiService.getNetworkHealth as any).mockResolvedValue(mockNetworkHealth);
    (apiService.getStakingInfo as any).mockResolvedValue(mockStakingInfo);
    (apiService.claimRewards as any).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<ValidatorPerformanceMonitor />);
      expect(screen.getByText('Validator Performance Monitor')).toBeInTheDocument();
    });

    it('should display the page title', () => {
      render(<ValidatorPerformanceMonitor />);
      expect(screen.getByRole('heading', { name: /Validator Performance Monitor/i })).toBeInTheDocument();
    });

    it('should render validator list section', async () => {
      render(<ValidatorPerformanceMonitor />);
      await waitFor(() => {
        expect(screen.getByText('Validator Network')).toBeInTheDocument();
      });
    });

    it('should render network health section', async () => {
      render(<ValidatorPerformanceMonitor />);
      await waitFor(() => {
        expect(screen.getByText('Network Health Overview')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<ValidatorPerformanceMonitor />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VALIDATOR LIST TESTS
  // ==========================================================================

  describe('Validator List Section', () => {
    it('should display all validators after loading', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
        expect(screen.getByText('Validator Beta')).toBeInTheDocument();
        expect(screen.getByText('Validator Gamma')).toBeInTheDocument();
        expect(screen.getByText('Validator Delta')).toBeInTheDocument();
      });
    });

    it('should display validator status badges', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getAllByText('ACTIVE')).toHaveLength(2);
        expect(screen.getByText('INACTIVE')).toBeInTheDocument();
        expect(screen.getByText('JAILED')).toBeInTheDocument();
      });
    });

    it('should display validator stake amounts', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('5.00M')).toBeInTheDocument();
        expect(screen.getByText('3.50M')).toBeInTheDocument();
        expect(screen.getByText('2.00M')).toBeInTheDocument();
      });
    });

    it('should display validator uptime percentages', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('99.80%')).toBeInTheDocument();
        expect(screen.getByText('98.50%')).toBeInTheDocument();
        expect(screen.getByText('92.30%')).toBeInTheDocument();
      });
    });

    it('should display validator TPS', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('15.0K')).toBeInTheDocument();
        expect(screen.getByText('12.0K')).toBeInTheDocument();
        expect(screen.getByText('8.0K')).toBeInTheDocument();
      });
    });

    it('should display validator rewards', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('125,000 AUR')).toBeInTheDocument();
        expect(screen.getByText('87,500 AUR')).toBeInTheDocument();
      });
    });

    it('should show uptime trend indicators', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        const trendIcons = screen.getAllByTestId('TrendingUpIcon');
        expect(trendIcons.length).toBeGreaterThan(0);
      });
    });

    it('should have refresh button', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // SEARCH AND FILTER TESTS
  // ==========================================================================

  describe('Search and Filtering', () => {
    it('should filter validators by search term (name)', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name or address/i);
      await user.type(searchInput, 'Alpha');

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Validator Beta')).not.toBeInTheDocument();
      });
    });

    it('should filter validators by search term (address)', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name or address/i);
      await user.type(searchInput, 'val1abc');

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Validator Beta')).not.toBeInTheDocument();
      });
    });

    it('should clear search results when search is cleared', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name or address/i);
      await user.type(searchInput, 'Alpha');
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
        expect(screen.getByText('Validator Beta')).toBeInTheDocument();
      });
    });

    it('should filter by active status', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/status filter/i);
      await user.click(statusFilter);

      const activeOption = screen.getByRole('option', { name: /active only/i });
      await user.click(activeOption);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
        expect(screen.getByText('Validator Beta')).toBeInTheDocument();
        expect(screen.queryByText('Validator Gamma')).not.toBeInTheDocument();
        expect(screen.queryByText('Validator Delta')).not.toBeInTheDocument();
      });
    });

    it('should filter by inactive status', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Gamma')).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/status filter/i);
      await user.click(statusFilter);

      const inactiveOption = screen.getByRole('option', { name: /inactive only/i });
      await user.click(inactiveOption);

      await waitFor(() => {
        expect(screen.queryByText('Validator Alpha')).not.toBeInTheDocument();
        expect(screen.getByText('Validator Gamma')).toBeInTheDocument();
      });
    });

    it('should filter by jailed status', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Delta')).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/status filter/i);
      await user.click(statusFilter);

      const jailedOption = screen.getByRole('option', { name: /jailed only/i });
      await user.click(jailedOption);

      await waitFor(() => {
        expect(screen.queryByText('Validator Alpha')).not.toBeInTheDocument();
        expect(screen.getByText('Validator Delta')).toBeInTheDocument();
      });
    });

    it('should show all validators when filter is set to all', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/status filter/i);
      await user.click(statusFilter);
      await user.click(screen.getByRole('option', { name: /active only/i }));

      await user.click(statusFilter);
      await user.click(screen.getByRole('option', { name: /all status/i }));

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
        expect(screen.getByText('Validator Beta')).toBeInTheDocument();
        expect(screen.getByText('Validator Gamma')).toBeInTheDocument();
        expect(screen.getByText('Validator Delta')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // SORTING TESTS
  // ==========================================================================

  describe('Sorting Functionality', () => {
    it('should sort by stake descending by default', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Validator Alpha')).toBeInTheDocument();
      });
    });

    it('should sort by stake ascending when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const stakeHeader = screen.getByText('Stake').closest('div');
      if (stakeHeader) await user.click(stakeHeader);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Validator Delta')).toBeInTheDocument();
      });
    });

    it('should sort by uptime', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const uptimeHeader = screen.getByText('Uptime').closest('div');
      if (uptimeHeader) await user.click(uptimeHeader);

      // Should be in descending order (highest uptime first)
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Validator Alpha')).toBeInTheDocument();
      });
    });

    it('should sort by TPS', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const tpsHeader = screen.getByText('TPS').closest('div');
      if (tpsHeader) await user.click(tpsHeader);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Validator Alpha')).toBeInTheDocument();
      });
    });

    it('should sort by rewards', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const rewardsHeader = screen.getByText('Rewards').closest('div');
      if (rewardsHeader) await user.click(rewardsHeader);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Validator Alpha')).toBeInTheDocument();
      });
    });

    it('should toggle sort order when clicking same column', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const stakeHeader = screen.getByText('Stake').closest('div');

      // First click - ascending
      if (stakeHeader) await user.click(stakeHeader);

      // Second click - descending
      if (stakeHeader) await user.click(stakeHeader);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Validator Alpha')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // PAGINATION TESTS
  // ==========================================================================

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
      });
    });

    it('should show correct number of rows per page (default 10)', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // 1 header row + 4 data rows (we only have 4 validators)
        expect(rows.length).toBe(5);
      });
    });

    it('should change rows per page', async () => {
      const user = userEvent.setup({ delay: null });

      // Add more validators for pagination test
      const manyValidators = Array.from({ length: 30 }, (_, i) => ({
        ...mockValidators[0],
        address: `val${i}`,
        name: `Validator ${i}`,
      }));
      (apiService.getValidators as any).mockResolvedValue({ validators: manyValidators });

      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator 0')).toBeInTheDocument();
      });

      const rowsPerPageButton = screen.getByRole('combobox');
      await user.click(rowsPerPageButton);

      const option25 = screen.getByRole('option', { name: '25' });
      await user.click(option25);

      await waitFor(() => {
        expect(screen.getByText('1–25 of 30')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // NETWORK HEALTH TESTS
  // ==========================================================================

  describe('Network Health Integration', () => {
    it('should display active validator count', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('8 / 10')).toBeInTheDocument();
      });
    });

    it('should display network security status', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('SECURE')).toBeInTheDocument();
      });
    });

    it('should display decentralization index', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText(/Decentralization: 0.85/i)).toBeInTheDocument();
      });
    });

    it('should display average uptime', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('96.50%')).toBeInTheDocument();
      });
    });

    it('should display total staked amount', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('12.00M')).toBeInTheDocument();
      });
    });

    it('should render validator distribution chart', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('should display validator distribution legend', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByTestId('legend')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // VALIDATOR DETAILS DIALOG TESTS
  // ==========================================================================

  describe('Validator Details Dialog', () => {
    it('should open details dialog when view button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Validator Alpha - Performance Details/i)).toBeInTheDocument();
      });
    });

    it('should display validator address in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('val1abc123def456')).toBeInTheDocument();
      });
    });

    it('should display validator commission in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('5%')).toBeInTheDocument();
      });
    });

    it('should display voting power in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('12.50%')).toBeInTheDocument();
      });
    });

    it('should display performance score in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('95/100')).toBeInTheDocument();
      });
    });

    it('should render uptime trend chart in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('30-Day Uptime Trend')).toBeInTheDocument();
        expect(screen.getAllByTestId('area-chart').length).toBeGreaterThan(0);
      });
    });

    it('should render block proposal history chart in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Block Proposal History')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should render reward history chart in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Reward History')).toBeInTheDocument();
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
      });
    });

    it('should render stake growth chart in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Stake Growth')).toBeInTheDocument();
      });
    });

    it('should display claim rewards button in dialog', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /claim rewards/i })).toBeInTheDocument();
      });
    });

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Validator Alpha - Performance Details/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Validator Alpha - Performance Details/i)).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // API INTERACTION TESTS
  // ==========================================================================

  describe('API Interactions', () => {
    it('should call getValidators on mount', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(apiService.getValidators).toHaveBeenCalled();
      });
    });

    it('should call getNetworkHealth on mount', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(apiService.getNetworkHealth).toHaveBeenCalled();
      });
    });

    it('should call getValidatorDetails when viewing details', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(apiService.getValidatorDetails).toHaveBeenCalledWith('val1abc123def456');
      });
    });

    it('should handle API error gracefully', async () => {
      (apiService.getValidators as any).mockRejectedValue(new Error('Network error'));

      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch validators')).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(apiService.getValidators).toHaveBeenCalledTimes(2);
      });
    });

    it('should auto-refresh data every 30 seconds', async () => {
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(apiService.getValidators).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(apiService.getValidators).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==========================================================================
  // USER INTERACTION TESTS
  // ==========================================================================

  describe('User Interactions', () => {
    it('should handle claim rewards action', async () => {
      const user = userEvent.setup({ delay: null });
      const consoleSpy = vi.spyOn(console, 'log');

      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /claim rewards/i })).toBeInTheDocument();
      });

      const claimButton = screen.getByRole('button', { name: /claim rewards/i });
      await user.click(claimButton);

      expect(consoleSpy).toHaveBeenCalledWith('Claiming rewards for validator:', 'val1abc123def456');
      consoleSpy.mockRestore();
    });

    it('should open context menu on more options click', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const moreButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // PERFORMANCE METRICS TESTS
  // ==========================================================================

  describe('Performance Metrics Display', () => {
    it('should display consensus participation in details', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('98.50%')).toBeInTheDocument();
      });
    });

    it('should display total blocks proposed', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ValidatorPerformanceMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTestId('VisibilityIcon');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('5,432')).toBeInTheDocument();
      });
    });
  });
});
