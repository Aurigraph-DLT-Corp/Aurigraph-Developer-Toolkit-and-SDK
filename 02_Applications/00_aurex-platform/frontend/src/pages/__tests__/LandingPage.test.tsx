import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

// Mock all the section components
vi.mock('../../components/sections/HeroSection', () => ({
  default: () => <section data-testid="hero-section">Hero Section</section>
}));

vi.mock('../../components/sections/ProductShowcase', () => ({
  default: () => <section data-testid="product-showcase">Product Showcase</section>
}));

vi.mock('../../components/sections/BenefitsSection', () => ({
  default: () => <section data-testid="benefits-section">Benefits Section</section>
}));

vi.mock('../../components/sections/IndustrySolutionsSection', () => ({
  default: () => <section data-testid="industry-solutions">Industry Solutions</section>
}));

vi.mock('../../components/sections/PricingSection', () => ({
  default: () => <section data-testid="pricing-section">Pricing Section</section>
}));

vi.mock('../../components/sections/ResourcesSection', () => ({
  default: () => <section data-testid="resources-section">Resources Section</section>
}));

vi.mock('../../components/sections/HowCanWeHelpSection', () => ({
  default: () => <section data-testid="how-can-we-help">How Can We Help</section>
}));

vi.mock('../../components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>
}));

vi.mock('../../hooks/useScrollTo', () => ({
  default: () => vi.fn()
}));

const renderWithRouter = (props = {}) => {
  return render(
    <BrowserRouter>
      <LandingPage {...props} />
    </BrowserRouter>
  );
};

describe('LandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all main sections', () => {
    renderWithRouter();
    
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('product-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('benefits-section')).toBeInTheDocument();
    expect(screen.getByTestId('industry-solutions')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
    expect(screen.getByTestId('resources-section')).toBeInTheDocument();
    expect(screen.getByTestId('how-can-we-help')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = renderWithRouter();
    expect(container).toBeInTheDocument();
  });

  it('handles scrollTo prop correctly', async () => {
    renderWithRouter({ scrollTo: 'pricing' });
    
    // The component should render without errors even with scrollTo prop
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    const { container } = renderWithRouter();
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('includes all required marketing sections', () => {
    renderWithRouter();
    
    // Check for key marketing sections
    const sections = [
      'hero-section',
      'product-showcase',
      'benefits-section',
      'industry-solutions',
      'pricing-section',
      'resources-section',
      'how-can-we-help'
    ];
    
    sections.forEach(sectionId => {
      expect(screen.getByTestId(sectionId)).toBeInTheDocument();
    });
  });

  it('includes footer for contact information', () => {
    renderWithRouter();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('handles scrollTo prop for navigation', () => {
    const scrollTargets = ['products', 'solutions', 'pricing', 'about', 'contact'];
    
    scrollTargets.forEach(target => {
      renderWithRouter({ scrollTo: target });
      // Component should render without errors for each scroll target
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });
  });

  it('maintains proper page structure for SEO', () => {
    const { container } = renderWithRouter();
    
    // Should have a main content area
    expect(container.querySelector('main')).toBeInTheDocument();
    
    // Should have footer
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});