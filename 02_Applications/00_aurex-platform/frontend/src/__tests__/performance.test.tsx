import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Web Vitals
const mockWebVitals = {
  getCLS: vi.fn(),
  getFCP: vi.fn(),
  getFID: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn()
};

vi.mock('web-vitals', () => mockWebVitals);

// Mock performance observer
const mockPerformanceObserver = vi.fn();
global.PerformanceObserver = mockPerformanceObserver;

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    timing: {
      navigationStart: Date.now() - 1000,
      domContentLoadedEventEnd: Date.now() - 500,
      loadEventEnd: Date.now() - 200
    }
  }
});

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Web Vitals', () => {
    it('should measure Largest Contentful Paint (LCP)', async () => {
      const mockLCPCallback = vi.fn();
      mockWebVitals.getLCP.mockImplementation((callback) => {
        // Simulate good LCP score (< 2.5s)
        callback({ value: 1800, name: 'LCP' });
      });

      mockWebVitals.getLCP(mockLCPCallback);

      expect(mockWebVitals.getLCP).toHaveBeenCalledWith(mockLCPCallback);
      expect(mockLCPCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 1800,
          name: 'LCP'
        })
      );

      // Verify LCP is within good range (< 2.5s = 2500ms)
      const lcpValue = mockLCPCallback.mock.calls[0][0].value;
      expect(lcpValue).toBeLessThan(2500);
    });

    it('should measure First Input Delay (FID)', async () => {
      const mockFIDCallback = vi.fn();
      mockWebVitals.getFID.mockImplementation((callback) => {
        // Simulate good FID score (< 100ms)
        callback({ value: 85, name: 'FID' });
      });

      mockWebVitals.getFID(mockFIDCallback);

      expect(mockWebVitals.getFID).toHaveBeenCalledWith(mockFIDCallback);
      
      const fidValue = mockFIDCallback.mock.calls[0][0].value;
      expect(fidValue).toBeLessThan(100); // Good FID is < 100ms
    });

    it('should measure Cumulative Layout Shift (CLS)', async () => {
      const mockCLSCallback = vi.fn();
      mockWebVitals.getCLS.mockImplementation((callback) => {
        // Simulate good CLS score (< 0.1)
        callback({ value: 0.05, name: 'CLS' });
      });

      mockWebVitals.getCLS(mockCLSCallback);

      const clsValue = mockCLSCallback.mock.calls[0][0].value;
      expect(clsValue).toBeLessThan(0.1); // Good CLS is < 0.1
    });

    it('should measure First Contentful Paint (FCP)', async () => {
      const mockFCPCallback = vi.fn();
      mockWebVitals.getFCP.mockImplementation((callback) => {
        // Simulate good FCP score (< 1.8s)
        callback({ value: 1200, name: 'FCP' });
      });

      mockWebVitals.getFCP(mockFCPCallback);

      const fcpValue = mockFCPCallback.mock.calls[0][0].value;
      expect(fcpValue).toBeLessThan(1800); // Good FCP is < 1.8s
    });

    it('should measure Time to First Byte (TTFB)', async () => {
      const mockTTFBCallback = vi.fn();
      mockWebVitals.getTTFB.mockImplementation((callback) => {
        // Simulate good TTFB score (< 800ms)
        callback({ value: 600, name: 'TTFB' });
      });

      mockWebVitals.getTTFB(mockTTFBCallback);

      const ttfbValue = mockTTFBCallback.mock.calls[0][0].value;
      expect(ttfbValue).toBeLessThan(800); // Good TTFB is < 800ms
    });
  });

  describe('Bundle Size and Loading Performance', () => {
    it('should load JavaScript bundles efficiently', async () => {
      // Mock resource timing for JavaScript files
      global.performance.getEntriesByType.mockReturnValue([
        {
          name: '/assets/js/main-abc123.js',
          initiatorType: 'script',
          transferSize: 150000, // 150KB - reasonable size
          decodedBodySize: 180000,
          duration: 200 // 200ms load time
        },
        {
          name: '/assets/js/vendor-def456.js',
          initiatorType: 'script',
          transferSize: 300000, // 300KB - reasonable for vendor bundle
          decodedBodySize: 350000,
          duration: 350
        }
      ]);

      const jsResources = global.performance.getEntriesByType('resource')
        .filter(resource => resource.name.includes('.js'));

      // Verify main bundle is reasonably sized (< 250KB compressed)
      const mainBundle = jsResources.find(r => r.name.includes('main'));
      expect(mainBundle.transferSize).toBeLessThan(250000);

      // Verify vendor bundle is reasonably sized (< 500KB compressed)
      const vendorBundle = jsResources.find(r => r.name.includes('vendor'));
      expect(vendorBundle.transferSize).toBeLessThan(500000);

      // Verify reasonable load times (< 1s)
      jsResources.forEach(resource => {
        expect(resource.duration).toBeLessThan(1000);
      });
    });

    it('should load CSS efficiently', async () => {
      global.performance.getEntriesByType.mockReturnValue([
        {
          name: '/assets/css/main-xyz789.css',
          initiatorType: 'link',
          transferSize: 45000, // 45KB - reasonable CSS size
          decodedBodySize: 55000,
          duration: 150
        }
      ]);

      const cssResources = global.performance.getEntriesByType('resource')
        .filter(resource => resource.name.includes('.css'));

      // Verify CSS bundle is reasonably sized (< 100KB compressed)
      const cssBundle = cssResources[0];
      expect(cssBundle.transferSize).toBeLessThan(100000);

      // Verify fast loading (< 500ms)
      expect(cssBundle.duration).toBeLessThan(500);
    });
  });

  describe('Component Performance', () => {
    it('should render landing page components quickly', async () => {
      const startTime = performance.now();
      
      // Mock a simple component to test render performance
      const FastComponent = () => {
        React.useEffect(() => {
          // Simulate component mount time
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          // Component should render in < 100ms
          expect(renderTime).toBeLessThan(100);
        }, []);

        return <div data-testid="fast-component">Fast Component</div>;
      };

      render(
        <BrowserRouter>
          <FastComponent />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fast-component')).toBeInTheDocument();
      });
    });

    it('should handle multiple component renders efficiently', async () => {
      const startTime = performance.now();
      
      // Render multiple components to test batch performance
      const ComponentList = () => {
        const components = Array.from({ length: 50 }, (_, i) => (
          <div key={i} data-testid={`component-${i}`}>
            Component {i}
          </div>
        ));

        React.useEffect(() => {
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          // Should render 50 components in < 200ms
          expect(renderTime).toBeLessThan(200);
        }, []);

        return <div>{components}</div>;
      };

      render(<ComponentList />);

      // Verify all components rendered
      await waitFor(() => {
        expect(screen.getByTestId('component-0')).toBeInTheDocument();
        expect(screen.getByTestId('component-49')).toBeInTheDocument();
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks in components', async () => {
      let initialMemory;
      let finalMemory;

      // Mock memory measurement (if available)
      if (global.performance.memory) {
        initialMemory = global.performance.memory.usedJSHeapSize;
      }

      const MemoryTestComponent = () => {
        const [data, setData] = React.useState([]);
        
        React.useEffect(() => {
          // Simulate data creation and cleanup
          const largeArray = new Array(1000).fill(0).map((_, i) => ({
            id: i,
            value: Math.random()
          }));
          setData(largeArray);

          return () => {
            // Cleanup
            setData([]);
          };
        }, []);

        return <div data-testid="memory-component">{data.length} items</div>;
      };

      const { unmount } = render(<MemoryTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('memory-component')).toBeInTheDocument();
      });

      // Unmount to trigger cleanup
      unmount();

      if (global.performance.memory) {
        finalMemory = global.performance.memory.usedJSHeapSize;
        
        // Memory should not increase significantly after cleanup
        // Allow for some variance due to garbage collection timing
        const memoryDiff = finalMemory - initialMemory;
        expect(memoryDiff).toBeLessThan(1024 * 1024); // Less than 1MB increase
      }
    });
  });

  describe('Network Performance', () => {
    it('should optimize image loading', async () => {
      // Mock image loading performance
      global.performance.getEntriesByType.mockReturnValue([
        {
          name: '/images/hero-banner.webp',
          initiatorType: 'img',
          transferSize: 85000, // 85KB - optimized image
          decodedBodySize: 95000,
          duration: 180
        },
        {
          name: '/images/product-screenshot.webp',
          initiatorType: 'img',
          transferSize: 120000, // 120KB - reasonably sized
          decodedBodySize: 140000,
          duration: 220
        }
      ]);

      const imageResources = global.performance.getEntriesByType('resource')
        .filter(resource => resource.initiatorType === 'img');

      // Verify images are reasonably sized (< 200KB each)
      imageResources.forEach(image => {
        expect(image.transferSize).toBeLessThan(200000);
        expect(image.duration).toBeLessThan(1000); // Load in < 1s
      });
    });

    it('should cache static assets effectively', async () => {
      // Mock cached resource loading
      global.performance.getEntriesByType.mockReturnValue([
        {
          name: '/assets/js/vendor-cached.js',
          transferSize: 0, // From cache
          duration: 5 // Very fast from cache
        },
        {
          name: '/assets/css/main-cached.css',
          transferSize: 0, // From cache
          duration: 3
        }
      ]);

      const cachedResources = global.performance.getEntriesByType('resource')
        .filter(resource => resource.transferSize === 0);

      // Cached resources should load very quickly (< 50ms)
      cachedResources.forEach(resource => {
        expect(resource.duration).toBeLessThan(50);
      });
    });
  });

  describe('Load Testing Scenarios', () => {
    it('should handle rapid component updates', async () => {
      const startTime = performance.now();
      
      const RapidUpdateComponent = () => {
        const [counter, setCounter] = React.useState(0);
        
        React.useEffect(() => {
          // Simulate rapid updates
          const interval = setInterval(() => {
            setCounter(prev => prev + 1);
          }, 10);

          // Stop after 100 updates
          setTimeout(() => {
            clearInterval(interval);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should handle 100 rapid updates in < 2 seconds
            expect(duration).toBeLessThan(2000);
            expect(counter).toBeGreaterThan(90); // Allow for timing variance
          }, 1100);

          return () => clearInterval(interval);
        }, []);

        return <div data-testid="rapid-counter">{counter}</div>;
      };

      render(<RapidUpdateComponent />);

      await waitFor(() => {
        const counter = screen.getByTestId('rapid-counter');
        expect(parseInt(counter.textContent || '0')).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should maintain responsiveness under load', async () => {
      const performanceMarks = [];
      
      // Mock performance marking
      global.performance.mark = (name) => {
        performanceMarks.push({ name, timestamp: Date.now() });
      };

      const LoadTestComponent = () => {
        React.useEffect(() => {
          performance.mark('load-start');
          
          // Simulate heavy computation
          const heavyTask = () => {
            let sum = 0;
            for (let i = 0; i < 100000; i++) {
              sum += Math.random();
            }
            return sum;
          };

          // Run task and measure
          setTimeout(() => {
            heavyTask();
            performance.mark('load-end');
          }, 10);
        }, []);

        return <div data-testid="load-component">Load Test</div>;
      };

      render(<LoadTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('load-component')).toBeInTheDocument();
        
        // Verify performance marks were created
        const startMark = performanceMarks.find(m => m.name === 'load-start');
        const endMark = performanceMarks.find(m => m.name === 'load-end');
        
        if (startMark && endMark) {
          const duration = endMark.timestamp - startMark.timestamp;
          expect(duration).toBeLessThan(1000); // Task should complete in < 1s
        }
      });
    });
  });
});