// Analytics and tracking utilities
// Initialize analytics
export const initAnalytics = () => {
    // Google Analytics 4
    const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (GA_MEASUREMENT_ID && typeof window !== 'undefined') {
        // Load Google Analytics
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);
        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        window.gtag = function (...args) {
            window.dataLayer.push(args);
        };
        window.gtag('js', new Date().toISOString());
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_title: document.title,
            page_location: window.location.href,
        });
        // Track Core Web Vitals
        trackWebVitals();
    }
    // Initialize other tracking pixels
    initFacebookPixel();
    initLinkedInInsightTag();
    initHotjar();
};
// Track events
export const trackEvent = ({ event, properties = {} }) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event, {
            ...properties,
            page_title: document.title,
            page_location: window.location.href,
        });
    }
    // Track in Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', event, properties);
    }
    // Track in LinkedIn
    if (typeof window !== 'undefined' && window.lintrk) {
        window.lintrk('track', { conversion_id: event });
    }
    // Log for debugging in development
    if (import.meta.env.DEV) {
        console.log('Analytics Event:', { event, properties });
    }
};
// Conversion tracking
export const trackConversion = (conversionType, value) => {
    trackEvent({
        event: 'conversion',
        properties: {
            conversion_type: conversionType,
            value: value,
            currency: 'USD',
        },
    });
};
// Lead tracking
export const trackLead = (leadType, properties = {}) => {
    trackEvent({
        event: 'generate_lead',
        properties: {
            lead_type: leadType,
            ...properties,
        },
    });
};
// Demo request tracking
export const trackDemoRequest = (demoType) => {
    trackEvent({
        event: 'demo_request',
        properties: {
            demo_type: demoType,
        },
    });
    trackConversion('demo_request');
};
// Trial signup tracking
export const trackTrialSignup = (planType) => {
    trackEvent({
        event: 'sign_up',
        properties: {
            method: 'trial',
            plan_type: planType,
        },
    });
    trackConversion('trial_signup');
};
// Contact form tracking
export const trackContactForm = (formType) => {
    trackEvent({
        event: 'contact_form_submit',
        properties: {
            form_type: formType,
        },
    });
    trackConversion('contact_form');
};
// Newsletter signup tracking
export const trackNewsletterSignup = () => {
    trackEvent({
        event: 'newsletter_signup',
        properties: {},
    });
    trackConversion('newsletter_signup');
};
// Download tracking
export const trackDownload = (resourceType, resourceName) => {
    trackEvent({
        event: 'download',
        properties: {
            resource_type: resourceType,
            resource_name: resourceName,
        },
    });
    trackConversion('resource_download');
};
// Page view tracking
export const trackPageView = (pageName, properties = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
            page_title: pageName,
            page_location: window.location.href,
            ...properties,
        });
    }
};
// Scroll depth tracking
export const trackScrollDepth = (depth) => {
    trackEvent({
        event: 'scroll_depth',
        properties: {
            scroll_depth: depth,
        },
    });
};
// Time on page tracking
export const trackTimeOnPage = (timeSpent) => {
    trackEvent({
        event: 'time_on_page',
        properties: {
            time_spent: timeSpent,
        },
    });
};
// CTA click tracking
export const trackCTAClick = (ctaName, ctaLocation) => {
    trackEvent({
        event: 'cta_click',
        properties: {
            cta_name: ctaName,
            cta_location: ctaLocation,
        },
    });
};
// Video engagement tracking
export const trackVideoEngagement = (videoName, action, progress) => {
    trackEvent({
        event: 'video_engagement',
        properties: {
            video_name: videoName,
            action: action,
            progress: progress,
        },
    });
};
// Initialize Facebook Pixel
const initFacebookPixel = () => {
    const FACEBOOK_PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID;
    if (FACEBOOK_PIXEL_ID && typeof window !== 'undefined') {
        (function (f, b, e, v, n, t, s) {
            if (f.fbq)
                return;
            n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq)
                f._fbq = n;
            n.push = n;
            n.loaded = !0;
            n.version = '2.0';
            n.queue = [];
            t = b.createElement(e);
            t.async = !0;
            t.src = v;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        if (window.fbq) {
            window.fbq('init', FACEBOOK_PIXEL_ID);
            window.fbq('track', 'PageView');
        }
    }
};
// Initialize LinkedIn Insight Tag
const initLinkedInInsightTag = () => {
    const LINKEDIN_PARTNER_ID = import.meta.env.VITE_LINKEDIN_PARTNER_ID;
    if (LINKEDIN_PARTNER_ID && typeof window !== 'undefined') {
        window.lintrk = function (a, b) {
            if (window.lintrk?.q) {
                window.lintrk.q.push([a, b]);
            }
        };
        if (window.lintrk) {
            // Initialize queue array for LinkedIn tracking
            window.lintrk.q = [];
        }
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
        document.head.appendChild(script);
        if (window.lintrk) {
            window.lintrk('track', { conversion_id: LINKEDIN_PARTNER_ID });
        }
    }
};
// Initialize Hotjar
const initHotjar = () => {
    const HOTJAR_ID = import.meta.env.VITE_HOTJAR_ID;
    if (HOTJAR_ID && typeof window !== 'undefined') {
        (function (h, o, t, j, a, r) {
            h.hj = h.hj || function () {
                (h.hj.q = h.hj.q || []).push(arguments);
            };
            h._hjSettings = { hjid: HOTJAR_ID, hjsv: 6 };
            a = o.getElementsByTagName('head')[0];
            r = o.createElement('script');
            r.async = 1;
            r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
            a.appendChild(r);
        })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    }
};
// Core Web Vitals tracking
const trackWebVitals = () => {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB }) => {
        onCLS((metric) => trackEvent({ event: 'web_vitals', properties: { metric_name: 'CLS', value: metric.value } }));
        onFCP((metric) => trackEvent({ event: 'web_vitals', properties: { metric_name: 'FCP', value: metric.value } }));
        onLCP((metric) => trackEvent({ event: 'web_vitals', properties: { metric_name: 'LCP', value: metric.value } }));
        onTTFB((metric) => trackEvent({ event: 'web_vitals', properties: { metric_name: 'TTFB', value: metric.value } }));
    }).catch(() => {
        // web-vitals not available, skip tracking
    });
};
