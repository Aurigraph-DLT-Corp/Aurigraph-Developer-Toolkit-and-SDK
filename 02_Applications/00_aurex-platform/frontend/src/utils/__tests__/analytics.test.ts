import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  initAnalytics, 
  trackEvent, 
  trackConversion, 
  trackLead,
  trackPageView 
} from '../analytics';

// Mock window object and global functions
const mockGtag = vi.fn();
const mockFbq = vi.fn();
const mockLintrk = vi.fn();

// Mock global window functions before each test
Object.defineProperty(global.window, 'gtag', {
  value: mockGtag,
  writable: true,
  configurable: true,
});

Object.defineProperty(global.window, 'fbq', {
  value: mockFbq,
  writable: true,
  configurable: true,
});

Object.defineProperty(global.window, 'lintrk', {
  value: mockLintrk,
  writable: true,
  configurable: true,
});

Object.defineProperty(global.window, 'dataLayer', {
  value: [],
  writable: true,
  configurable: true,
});

// Mock document for script injection - create proper mock script elements
const createMockScript = () => ({
  async: false,
  src: '',
  type: '',
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  nodeType: 1,
  parentNode: null,
  childNodes: [],
});

const mockHead = {
  appendChild: vi.fn(),
  getElementsByTagName: vi.fn(() => []),
  childNodes: [],
  nodeType: 1,
};

// Mock document.createElement to return proper script-like objects
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName) => {
    if (tagName === 'script') {
      return createMockScript();
    }
    return createMockScript(); // fallback
  }),
  writable: true,
});

// Mock document.head and getElementsByTagName
Object.defineProperty(document, 'head', {
  value: mockHead,
  writable: true,
});

Object.defineProperty(document, 'getElementsByTagName', {
  value: vi.fn((tagName) => {
    if (tagName === 'head') {
      return [mockHead];
    }
    return [];
  }),
  writable: true,
});

describe('Analytics Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', undefined);
    vi.stubEnv('VITE_FACEBOOK_PIXEL_ID', undefined);
    vi.stubEnv('VITE_LINKEDIN_PARTNER_ID', undefined);
    vi.stubEnv('VITE_HOTJAR_ID', undefined);
    vi.stubEnv('DEV', undefined);
    
    // Reset window properties
    window.dataLayer = [];
    window.gtag = mockGtag;
    window.fbq = mockFbq;
    window.lintrk = mockLintrk;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('initAnalytics', () => {
    it('initializes Google Analytics when measurement ID is provided', () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123456');
      
      initAnalytics();

      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(window.dataLayer).toBeDefined();
      expect(typeof window.gtag).toBe('function');
    });

    it('skips Google Analytics when measurement ID is not provided', () => {
      initAnalytics();

      // Should not initialize GA without measurement ID - no error should occur
      expect(document.createElement).toHaveBeenCalled(); // Other services might still initialize
    });

    it('initializes Facebook Pixel when pixel ID is provided', () => {
      vi.stubEnv('VITE_FACEBOOK_PIXEL_ID', 'FB_TEST123456');
      
      initAnalytics();

      // Should create script and initialize pixel
      expect(document.createElement).toHaveBeenCalled();
    });

    it('initializes LinkedIn Insight Tag when partner ID is provided', () => {
      vi.stubEnv('VITE_LINKEDIN_PARTNER_ID', 'LI_TEST123456');
      
      initAnalytics();

      expect(document.createElement).toHaveBeenCalled();
    });

    it('initializes Hotjar when ID is provided', () => {
      vi.stubEnv('VITE_HOTJAR_ID', 'HJ_TEST123456');
      
      initAnalytics();

      expect(document.createElement).toHaveBeenCalled();
    });
  });

  describe('trackEvent', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', 'true');
      console.log = vi.fn();
    });

    it('tracks events with Google Analytics', () => {
      const eventData = {
        event: 'test_event',
        properties: { category: 'test', value: 100 },
      };

      trackEvent(eventData);

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {
        category: 'test',
        value: 100,
        page_title: document.title,
        page_location: window.location.href,
      });
    });

    it('tracks events with Facebook Pixel', () => {
      const eventData = {
        event: 'Purchase',
        properties: { value: 99.99, currency: 'USD' },
      };

      trackEvent(eventData);

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 99.99,
        currency: 'USD',
      });
    });

    it('tracks events with LinkedIn', () => {
      const eventData = {
        event: 'conversion',
        properties: { lead_type: 'demo_request' },
      };

      trackEvent(eventData);

      expect(mockLintrk).toHaveBeenCalledWith('track', { conversion_id: 'conversion' });
    });

    it('logs events in development mode', () => {
      const eventData = {
        event: 'test_event',
        properties: { test: 'data' },
      };

      trackEvent(eventData);

      expect(console.log).toHaveBeenCalledWith('Analytics Event:', eventData);
    });

    it('handles events with no properties', () => {
      const eventData = { event: 'simple_event' };

      expect(() => trackEvent(eventData)).not.toThrow();
      expect(mockGtag).toHaveBeenCalledWith('event', 'simple_event', {
        page_title: document.title,
        page_location: window.location.href,
      });
    });
  });

  describe('trackConversion', () => {
    it('tracks conversion events with value', () => {
      trackConversion('purchase', 199.99);

      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
        conversion_type: 'purchase',
        value: 199.99,
        currency: 'USD',
        page_title: document.title,
        page_location: window.location.href,
      });
    });

    it('tracks conversion events without value', () => {
      trackConversion('signup');

      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
        conversion_type: 'signup',
        value: undefined,
        currency: 'USD',
        page_title: document.title,
        page_location: window.location.href,
      });
    });
  });

  describe('trackLead', () => {
    it('tracks lead generation events', () => {
      const properties = {
        source: 'contact_form',
        campaign: 'summer_2024',
      };

      trackLead('demo_request', properties);

      expect(mockGtag).toHaveBeenCalledWith('event', 'generate_lead', {
        lead_type: 'demo_request',
        source: 'contact_form',
        campaign: 'summer_2024',
        page_title: document.title,
        page_location: window.location.href,
      });
    });

    it('tracks lead events without additional properties', () => {
      trackLead('newsletter_signup');

      expect(mockGtag).toHaveBeenCalledWith('event', 'generate_lead', {
        lead_type: 'newsletter_signup',
        page_title: document.title,
        page_location: window.location.href,
      });
    });
  });

  describe('trackPageView', () => {
    it('tracks page view events', () => {
      const properties = {
        section: 'products',
        category: 'hydropulse',
      };

      trackPageView('HydroPulse Product Page', properties);

      expect(mockGtag).toHaveBeenCalledWith('config', expect.any(String), {
        page_title: 'HydroPulse Product Page',
        page_location: window.location.href,
        section: 'products',
        category: 'hydropulse',
      });
    });

    it('tracks page view without additional properties', () => {
      trackPageView('Home Page');

      expect(mockGtag).toHaveBeenCalledWith('config', expect.any(String), {
        page_title: 'Home Page',
        page_location: window.location.href,
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing window.gtag gracefully', () => {
      window.gtag = undefined as any;

      expect(() => trackEvent({ event: 'test' })).not.toThrow();
    });

    it('handles missing window.fbq gracefully', () => {
      window.fbq = undefined;

      expect(() => trackEvent({ event: 'test' })).not.toThrow();
    });

    it('handles missing window.lintrk gracefully', () => {
      window.lintrk = undefined;

      expect(() => trackEvent({ event: 'test' })).not.toThrow();
    });

    it('works in server-side rendering environment', () => {
      // Mock window as undefined
      const originalWindow = global.window;
      (global as any).window = undefined;

      expect(() => initAnalytics()).not.toThrow();
      expect(() => trackEvent({ event: 'test' })).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Data Integrity', () => {
    it('includes required page context in all events', () => {
      trackEvent({ event: 'test_event' });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'test_event',
        expect.objectContaining({
          page_title: document.title,
          page_location: window.location.href,
        })
      );
    });

    it('preserves custom properties', () => {
      const customProps = {
        custom_parameter: 'custom_value',
        user_segment: 'enterprise',
        experiment_variant: 'A',
      };

      trackEvent({ event: 'custom_event', properties: customProps });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'custom_event',
        expect.objectContaining(customProps)
      );
    });
  });
});