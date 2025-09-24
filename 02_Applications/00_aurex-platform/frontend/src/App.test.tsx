import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock components to avoid complex rendering during testing
vi.mock('./components/AppNavigation', () => ({
  AppNavigation: () => <nav data-testid="app-navigation">App Navigation</nav>
}));

vi.mock('./pages/LandingPage', () => ({
  default: ({ scrollTo }: { scrollTo?: string }) => (
    <div data-testid="landing-page" data-scroll-to={scrollTo}>Landing Page</div>
  )
}));

vi.mock('./pages/NotFound', () => ({
  default: () => <div data-testid="not-found-page">Not Found</div>
}));

vi.mock('./utils/analytics', () => ({
  initAnalytics: vi.fn()
}));

const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByTestId('app-navigation')).toBeInTheDocument();
  });

  it('renders landing page on root route', () => {
    renderWithRouter(['/']);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders landing page on /full route', () => {
    renderWithRouter(['/full']);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders landing page with scroll target for section routes', async () => {
    renderWithRouter(['/products']);
    
    await waitFor(() => {
      const landingPage = screen.getByTestId('landing-page');
      expect(landingPage).toBeInTheDocument();
      expect(landingPage).toHaveAttribute('data-scroll-to', 'products');
    });
  });

  it('renders not found page for invalid routes', async () => {
    renderWithRouter(['/invalid-route']);
    
    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
  });

  it('has correct navigation for all section routes', async () => {
    const routes = ['/products', '/solutions', '/pricing', '/about', '/contact'];
    
    for (const route of routes) {
      renderWithRouter([route]);
      const expectedScrollTo = route.slice(1); // Remove leading slash
      
      await waitFor(() => {
        const landingPage = screen.getByTestId('landing-page');
        expect(landingPage).toHaveAttribute('data-scroll-to', expectedScrollTo);
      });
    }
  });

  it('includes app navigation on all routes', () => {
    renderWithRouter();
    expect(screen.getByTestId('app-navigation')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = renderWithRouter();
    const appContainer = container.firstChild;
    expect(appContainer).toHaveClass('min-h-screen', 'bg-white');
  });
});