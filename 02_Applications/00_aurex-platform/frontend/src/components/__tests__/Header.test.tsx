import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  Bars3Icon: () => <div data-testid="bars3-icon">Menu</div>,
  XMarkIcon: () => <div data-testid="xmark-icon">Close</div>,
}));

// Wrapper component for Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Header Component', () => {
  it('renders without crashing', () => {
    render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );
    
    expect(screen.getByText('Aurex')).toBeInTheDocument();
  });

  it('displays main navigation links', () => {
    render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );
    
    // Check for application navigation links based on actual implementation
    expect(screen.getByText('Aurex Platform')).toBeInTheDocument();
    expect(screen.getByText('Aurex Launchpad')).toBeInTheDocument();
    expect(screen.getByText('Aurex HydroPulse')).toBeInTheDocument();
    expect(screen.getByText('Aurex CarbonTrace')).toBeInTheDocument();
  });

  it('displays application descriptions', () => {
    render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );
    
    // Check for application descriptions based on actual implementation
    expect(screen.getByText('ESG Management Platform')).toBeInTheDocument();
    expect(screen.getByText('ESG Assessment & Reporting')).toBeInTheDocument();
    expect(screen.getByText('Water Management System')).toBeInTheDocument();
    expect(screen.getByText('Carbon Trading Platform')).toBeInTheDocument();
  });

  it('contains application navigation links', () => {
    render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );
    
    // Check that the nav contains the expected number of application links
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(4); // 4 applications
    
    // Verify each link has an href attribute
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    
    // Check for navigation links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('has responsive design classes', () => {
    const { container } = render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );
    
    // Check for responsive classes based on actual implementation
    const headerContainer = container.querySelector('.max-w-7xl');
    expect(headerContainer).toBeInTheDocument();
    
    const flexContainer = container.querySelector('.flex.justify-between');
    expect(flexContainer).toBeInTheDocument();
  });

  it('displays brand name', () => {
    render(
      <RouterWrapper>
        <Header />
      </RouterWrapper>
    );
    
    // Check for brand elements based on actual implementation
    expect(screen.getByText('Aurigraph')).toBeInTheDocument();
    expect(screen.getByText('Aurex')).toBeInTheDocument();
  });
});