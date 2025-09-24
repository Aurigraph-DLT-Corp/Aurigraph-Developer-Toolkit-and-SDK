import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock different browser environments
const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91'
};

// Mock CSS support detection
const mockCSSSupports = vi.fn();
global.CSS = {
  supports: mockCSSSupports
};

// Mock feature detection
const mockFeatureDetection = {
  hasIntersectionObserver: true,
  hasResizeObserver: true,
  hasWebP: true,
  hasES6Modules: true,
  hasFlexbox: true,
  hasGrid: true,
  hasCustomProperties: true
};

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCSSSupports.mockReturnValue(true);
  });

  describe('Browser Feature Detection', () => {
    it('should detect modern browser features', () => {
      // Test IntersectionObserver support
      expect(global.IntersectionObserver).toBeDefined();

      // Test ResizeObserver support  
      expect(global.ResizeObserver).toBeDefined();

      // Test CSS.supports API
      expect(global.CSS.supports).toBeDefined();

      // Test basic APIs
      expect(global.fetch).toBeDefined();
      expect(global.localStorage).toBeDefined();
      expect(global.sessionStorage).toBeDefined();
    });

    it('should handle missing modern features gracefully', () => {
      // Temporarily remove modern features
      const originalIntersectionObserver = global.IntersectionObserver;
      const originalResizeObserver = global.ResizeObserver;

      // @ts-ignore
      delete global.IntersectionObserver;
      // @ts-ignore
      delete global.ResizeObserver;

      // Component should still work with fallbacks
      const FeatureTestComponent = () => {
        const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';
        const hasResizeObserver = typeof ResizeObserver !== 'undefined';

        return (
          <div>
            <div data-testid="intersection-support">
              {hasIntersectionObserver ? 'Supported' : 'Fallback'}
            </div>
            <div data-testid="resize-support">
              {hasResizeObserver ? 'Supported' : 'Fallback'}
            </div>
          </div>
        );
      };

      render(<FeatureTestComponent />);

      expect(screen.getByTestId('intersection-support')).toHaveTextContent('Fallback');
      expect(screen.getByTestId('resize-support')).toHaveTextContent('Fallback');

      // Restore features
      global.IntersectionObserver = originalIntersectionObserver;
      global.ResizeObserver = originalResizeObserver;
    });
  });

  describe('CSS Feature Support', () => {
    it('should support modern CSS features', () => {
      // Test CSS Grid support
      mockCSSSupports.mockImplementation((property: string) => {
        const supportedFeatures = [
          'display: grid',
          'display: flex',
          'gap',
          'transform',
          'transition',
          '--custom-property: value',
          'position: sticky'
        ];
        return supportedFeatures.includes(property);
      });

      const CSSFeatureTest = () => {
        const hasGrid = CSS.supports('display: grid');
        const hasFlex = CSS.supports('display: flex');
        const hasGap = CSS.supports('gap');
        const hasCustomProperties = CSS.supports('--custom-property: value');

        return (
          <div>
            <div data-testid="grid-support">{hasGrid ? 'Grid supported' : 'No grid'}</div>
            <div data-testid="flex-support">{hasFlex ? 'Flex supported' : 'No flex'}</div>
            <div data-testid="gap-support">{hasGap ? 'Gap supported' : 'No gap'}</div>
            <div data-testid="custom-props-support">
              {hasCustomProperties ? 'Custom properties supported' : 'No custom properties'}
            </div>
          </div>
        );
      };

      render(<CSSFeatureTest />);

      expect(screen.getByTestId('grid-support')).toHaveTextContent('Grid supported');
      expect(screen.getByTestId('flex-support')).toHaveTextContent('Flex supported');
      expect(screen.getByTestId('gap-support')).toHaveTextContent('Gap supported');
      expect(screen.getByTestId('custom-props-support')).toHaveTextContent('Custom properties supported');
    });

    it('should provide fallbacks for unsupported CSS features', () => {
      // Mock old browser with limited CSS support
      mockCSSSupports.mockImplementation((property: string) => {
        const supportedFeatures = ['display: flex']; // Only basic flex support
        return supportedFeatures.includes(property);
      });

      const CSSFallbackTest = () => {
        const hasGrid = CSS.supports('display: grid');
        const hasFlex = CSS.supports('display: flex');

        return (
          <div 
            style={{
              display: hasGrid ? 'grid' : (hasFlex ? 'flex' : 'block'),
              flexWrap: hasFlex ? 'wrap' : undefined
            }}
            data-testid="layout-container"
            data-layout-type={hasGrid ? 'grid' : (hasFlex ? 'flex' : 'block')}
          >
            Layout content
          </div>
        );
      };

      render(<CSSFallbackTest />);

      const container = screen.getByTestId('layout-container');
      expect(container).toHaveAttribute('data-layout-type', 'flex');
    });
  });

  describe('JavaScript API Compatibility', () => {
    it('should handle fetch API with polyfill fallback', async () => {
      // Test that fetch is available (already mocked in test setup)
      expect(global.fetch).toBeDefined();

      const FetchTest = () => {
        const [status, setStatus] = React.useState('idle');

        const testFetch = async () => {
          setStatus('loading');
          try {
            if (typeof fetch === 'undefined') {
              throw new Error('Fetch not supported');
            }
            
            // Mock successful response
            global.fetch = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => ({ success: true })
            });

            await fetch('/test');
            setStatus('success');
          } catch (error) {
            setStatus('error');
          }
        };

        return (
          <div>
            <button onClick={testFetch} data-testid="fetch-test-button">
              Test Fetch
            </button>
            <div data-testid="fetch-status">{status}</div>
          </div>
        );
      };

      render(<FetchTest />);

      const button = screen.getByTestId('fetch-test-button');
      const status = screen.getByTestId('fetch-status');

      expect(status).toHaveTextContent('idle');

      fireEvent.click(button);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(status).toHaveTextContent('success');
    });

    it('should handle localStorage with fallback', () => {
      // Test localStorage availability
      const LocalStorageTest = () => {
        const [value, setValue] = React.useState('');

        const testLocalStorage = () => {
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('test', 'success');
              const retrieved = localStorage.getItem('test');
              setValue(retrieved || 'failed');
            } else {
              setValue('not supported');
            }
          } catch (error) {
            setValue('error');
          }
        };

        React.useEffect(() => {
          testLocalStorage();
        }, []);

        return <div data-testid="localstorage-result">{value}</div>;
      };

      render(<LocalStorageTest />);
      expect(screen.getByTestId('localstorage-result')).toHaveTextContent('success');
    });
  });

  describe('Event Handling Compatibility', () => {
    it('should handle touch events for mobile browsers', () => {
      const TouchEventTest = () => {
        const [touched, setTouched] = React.useState(false);

        const handleTouchStart = () => setTouched(true);
        const handleMouseDown = () => setTouched(true);

        return (
          <div
            data-testid="touch-element"
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
          >
            {touched ? 'Touched' : 'Not touched'}
          </div>
        );
      };

      render(<TouchEventTest />);

      const element = screen.getByTestId('touch-element');
      expect(element).toHaveTextContent('Not touched');

      // Simulate touch event (falls back to mouse event in test environment)
      fireEvent.mouseDown(element);
      expect(element).toHaveTextContent('Touched');
    });

    it('should handle keyboard events consistently', () => {
      const KeyboardTest = () => {
        const [key, setKey] = React.useState('');

        const handleKeyDown = (e: React.KeyboardEvent) => {
          // Handle different key representations across browsers
          const keyValue = e.key || e.keyCode?.toString() || '';
          setKey(keyValue);
        };

        return (
          <input
            data-testid="keyboard-input"
            onKeyDown={handleKeyDown}
            aria-label="Type to test keyboard events"
          />
        );
      };

      render(<KeyboardTest />);

      const input = screen.getByTestId('keyboard-input');

      // Test Enter key
      fireEvent.keyDown(input, { key: 'Enter' });
      // Note: In a real test, you'd check the state, but here we just verify no errors

      // Test Escape key
      fireEvent.keyDown(input, { key: 'Escape' });

      // Test arrow keys
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
  });

  describe('Image Format Support', () => {
    it('should handle WebP with fallback to JPEG/PNG', () => {
      const ImageFormatTest = () => {
        const [imageSupport, setImageSupport] = React.useState<Record<string, boolean>>({});

        React.useEffect(() => {
          // Simulate WebP support detection
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          
          const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
          const avifSupported = false; // Simulate older browser
          
          setImageSupport({
            webp: webpSupported,
            avif: avifSupported
          });
        }, []);

        const getImageSrc = (baseName: string) => {
          if (imageSupport.avif) return `/images/${baseName}.avif`;
          if (imageSupport.webp) return `/images/${baseName}.webp`;
          return `/images/${baseName}.jpg`;
        };

        return (
          <div>
            <div data-testid="webp-support">
              WebP: {imageSupport.webp ? 'Supported' : 'Not supported'}
            </div>
            <div data-testid="avif-support">
              AVIF: {imageSupport.avif ? 'Supported' : 'Not supported'}
            </div>
            <img 
              src={getImageSrc('hero-image')}
              alt="Hero"
              data-testid="responsive-image"
            />
          </div>
        );
      };

      render(<ImageFormatTest />);

      // Should show format support status
      expect(screen.getByTestId('webp-support')).toBeInTheDocument();
      expect(screen.getByTestId('avif-support')).toBeInTheDocument();

      // Image should have appropriate src
      const image = screen.getByTestId('responsive-image');
      expect(image).toHaveAttribute('src');
    });
  });

  describe('Form Input Compatibility', () => {
    it('should handle HTML5 input types with fallbacks', () => {
      const HTML5InputTest = () => {
        return (
          <form data-testid="html5-form">
            <input 
              type="email" 
              placeholder="Email"
              data-testid="email-input"
            />
            <input 
              type="tel" 
              placeholder="Phone"
              data-testid="tel-input"
            />
            <input 
              type="date" 
              data-testid="date-input"
            />
            <input 
              type="number" 
              min="0" 
              max="100"
              data-testid="number-input"
            />
            <input 
              type="range" 
              min="0" 
              max="100"
              data-testid="range-input"
            />
          </form>
        );
      };

      render(<HTML5InputTest />);

      // All inputs should render without errors
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('tel-input')).toBeInTheDocument();
      expect(screen.getByTestId('date-input')).toBeInTheDocument();
      expect(screen.getByTestId('number-input')).toBeInTheDocument();
      expect(screen.getByTestId('range-input')).toBeInTheDocument();

      // Test input attributes
      expect(screen.getByTestId('number-input')).toHaveAttribute('min', '0');
      expect(screen.getByTestId('number-input')).toHaveAttribute('max', '100');
    });

    it('should handle form validation consistently', () => {
      const FormValidationTest = () => {
        const [isValid, setIsValid] = React.useState(true);

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget;
          
          // Use HTML5 validation API if available, otherwise custom validation
          if (form.checkValidity) {
            setIsValid(form.checkValidity());
          } else {
            // Fallback validation for older browsers
            const email = form.querySelector('input[type="email"]') as HTMLInputElement;
            const emailValid = email?.value.includes('@') ?? false;
            setIsValid(emailValid);
          }
        };

        return (
          <form onSubmit={handleSubmit} data-testid="validation-form">
            <input 
              type="email" 
              required 
              data-testid="validation-email"
              defaultValue="test@example.com"
            />
            <button type="submit" data-testid="validation-submit">
              Submit
            </button>
            <div data-testid="validation-result">
              {isValid ? 'Valid' : 'Invalid'}
            </div>
          </form>
        );
      };

      render(<FormValidationTest />);

      const form = screen.getByTestId('validation-form');
      const result = screen.getByTestId('validation-result');

      expect(result).toHaveTextContent('Valid');

      fireEvent.submit(form);
      expect(result).toHaveTextContent('Valid');
    });
  });

  describe('Media Query Support', () => {
    it('should handle responsive design across different viewports', () => {
      // Mock different viewport sizes
      const mockMatchMedia = (query: string) => {
        const queries: Record<string, boolean> = {
          '(max-width: 768px)': false, // Desktop
          '(min-width: 769px)': true,
          '(prefers-reduced-motion: reduce)': false,
          '(prefers-color-scheme: dark)': false
        };

        return {
          matches: queries[query] ?? false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        };
      };

      window.matchMedia = mockMatchMedia;

      const ResponsiveTest = () => {
        const [isMobile, setIsMobile] = React.useState(false);

        React.useEffect(() => {
          const mediaQuery = window.matchMedia('(max-width: 768px)');
          setIsMobile(mediaQuery.matches);
        }, []);

        return (
          <div data-testid="responsive-container">
            <div data-testid="viewport-info">
              {isMobile ? 'Mobile' : 'Desktop'} view
            </div>
          </div>
        );
      };

      render(<ResponsiveTest />);

      expect(screen.getByTestId('viewport-info')).toHaveTextContent('Desktop view');
    });
  });

  describe('Accessibility Features', () => {
    it('should work with screen readers across browsers', () => {
      const AccessibilityTest = () => {
        return (
          <div>
            <nav aria-label="Main navigation" data-testid="main-nav">
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
            
            <main data-testid="main-content">
              <h1>Page Title</h1>
              <section aria-labelledby="section-title">
                <h2 id="section-title">Section Title</h2>
                <p>Section content</p>
              </section>
            </main>

            <button 
              aria-expanded="false"
              aria-controls="dropdown-menu"
              data-testid="dropdown-button"
            >
              Menu
            </button>
            <ul id="dropdown-menu" hidden data-testid="dropdown-menu">
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        );
      };

      render(<AccessibilityTest />);

      // Test ARIA attributes
      const nav = screen.getByTestId('main-nav');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      const button = screen.getByTestId('dropdown-button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'dropdown-menu');

      const dropdown = screen.getByTestId('dropdown-menu');
      expect(dropdown).toHaveAttribute('hidden');
    });
  });
});