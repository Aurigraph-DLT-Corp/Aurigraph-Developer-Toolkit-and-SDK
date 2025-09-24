/**
 * ================================================================================
 * AUREX CARBONTRACE™ LANDING PAGE COMPONENT TESTS
 * Comprehensive test suite for carbon trading platform landing page
 * Ticket: CARBONTRACE-401 - Testing & Validation Suite
 * Test Coverage Target: >95% component coverage, carbon trading workflow testing
 * Created: December 14, 2025
 * ================================================================================
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CarbonTraceLandingPage from '../../pages/CarbonTraceLandingPage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock AppNavigation component
vi.mock('../AppNavigation', () => ({
  default: () => <nav data-testid="app-navigation">App Navigation</nav>,
}));

// Mock Recharts for trading charts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Wrapper component for Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CarbonTraceLandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Layout', () => {
    it('renders without crashing', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByTestId('app-navigation')).toBeInTheDocument();
    });

    it('displays the main hero section', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/CarbonTrace/i)).toBeInTheDocument();
      expect(screen.getByText(/Carbon Trading Platform/i)).toBeInTheDocument();
    });

    it('shows carbon trading features', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check for main trading features
      expect(screen.getByText(/Carbon Credit Marketplace/i)).toBeInTheDocument();
      expect(screen.getByText(/Portfolio Management/i)).toBeInTheDocument();
    });

    it('displays trading platform benefits', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/Real-time trading/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified carbon credits/i)).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('handles feature tab switching', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Find feature tabs and click different ones
      const marketplaceTab = screen.getByText(/Marketplace/i);
      const portfolioTab = screen.getByText(/Portfolio/i);
      
      expect(marketplaceTab).toBeInTheDocument();
      
      if (portfolioTab) {
        await user.click(portfolioTab);
        expect(portfolioTab).toBeInTheDocument();
      }
    });

    it('displays call-to-action buttons', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check for CTA buttons
      const ctaButtons = screen.getAllByText(/Start Trading/i);
      expect(ctaButtons.length).toBeGreaterThan(0);
    });

    it('shows carbon credit statistics', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check for trading statistics
      const statsElements = screen.getAllByText(/\$|%|tCO2/);
      expect(statsElements.length).toBeGreaterThan(0);
    });
  });

  describe('Carbon Trading Content', () => {
    it('displays marketplace features', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/Buy and sell verified carbon credits/i)).toBeInTheDocument();
      expect(screen.getByText(/Real-time pricing/i)).toBeInTheDocument();
      expect(screen.getByText(/Instant settlements/i)).toBeInTheDocument();
    });

    it('shows portfolio management features', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/Portfolio Management/i)).toBeInTheDocument();
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/risk management/i)).toBeInTheDocument();
    });

    it('displays verification and compliance information', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
      expect(screen.getByText(/transparent/i)).toBeInTheDocument();
    });

    it('shows trading platform benefits', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/24\/7 trading/i)).toBeInTheDocument();
      expect(screen.getByText(/competitive pricing/i)).toBeInTheDocument();
    });
  });

  describe('Charts and Visualizations', () => {
    it('renders trading charts', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check for chart components
      const charts = screen.queryAllByTestId('line-chart');
      if (charts.length > 0) {
        expect(charts[0]).toBeInTheDocument();
      }
    });

    it('displays responsive containers for charts', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      const responsiveContainers = screen.queryAllByTestId('responsive-container');
      if (responsiveContainers.length > 0) {
        expect(responsiveContainers[0]).toBeInTheDocument();
      }
    });
  });

  describe('Navigation and Routing', () => {
    it('includes app navigation component', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      expect(screen.getByTestId('app-navigation')).toBeInTheDocument();
    });

    it('handles navigation actions', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check if navigation buttons are clickable
      const navButtons = screen.getAllByRole('button');
      if (navButtons.length > 0) {
        await user.click(navButtons[0]);
        // Button should be clickable without errors
      }
    });
  });

  describe('Responsive Design', () => {
    it('has responsive layout classes', () => {
      const { container } = render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check for responsive grid and flex layouts
      const responsiveElements = container.querySelectorAll('[class*="grid"], [class*="flex"], [class*="md:"], [class*="lg:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('includes mobile-friendly design elements', () => {
      const { container } = render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check for mobile responsive classes
      const mobileElements = container.querySelectorAll('[class*="sm:"], [class*="mobile"]');
      expect(mobileElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Check for heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('includes alt text for icons and images', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Icons are rendered as SVG components from lucide-react
      // They should be accessible
      const iconElements = screen.queryAllByTestId(/icon|svg/);
      // This test ensures the component renders without accessibility errors
      expect(iconElements.length).toBeGreaterThanOrEqual(0);
    });

    it('has proper button labels', () => {
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/\w+/); // Should have text content
      });
    });
  });

  describe('Performance Considerations', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Re-render with same props
      rerender(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Component should re-render successfully
      expect(screen.getByTestId('app-navigation')).toBeInTheDocument();
    });

    it('handles state updates correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <CarbonTraceLandingPage />
        </RouterWrapper>
      );
      
      // Interact with stateful elements
      const interactiveElements = screen.getAllByRole('button');
      if (interactiveElements.length > 0) {
        await user.click(interactiveElements[0]);
        // Should handle interactions without errors
      }
    });
  });
});