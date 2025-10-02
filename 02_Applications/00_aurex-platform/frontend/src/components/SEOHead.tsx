import React from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  schema?: Record<string, any>;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Aurex Platform | Leading ESG Reporting & DMRV Software Solution',
  description = 'Transform your environmental impact with Aurex\'s intelligent DMRV platform. Monitor water, forests, and carbon with AI-powered precision. Start your free trial today.',
  keywords = [
    'ESG reporting software',
    'DMRV platform',
    'environmental monitoring',
    'carbon tracking',
    'water management',
    'forest monitoring',
    'sustainability reporting',
    'ESG compliance',
    'carbon credits',
    'environmental data',
    'climate technology',
    'green tech platform'
  ],
  ogImage = 'https://dev.aurigraph.io/images/og-aurex-platform.png',
  ogUrl = 'https://dev.aurigraph.io',
  twitterCard = 'summary_large_image',
  canonicalUrl = 'https://dev.aurigraph.io',
  schema
}) => {
  React.useEffect(() => {
    // Set page title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic SEO meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'Aurex');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph meta tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', ogUrl, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:image:alt', `${title} - Aurex Platform`, true);
    updateMetaTag('og:site_name', 'Aurex Platform', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card meta tags
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:site', '@aurex_platform');
    updateMetaTag('twitter:creator', '@aurex_platform');

    // Additional SEO meta tags
    updateMetaTag('application-name', 'Aurex Platform');
    updateMetaTag('theme-color', '#10B981');
    updateMetaTag('msapplication-TileColor', '#10B981');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // JSON-LD Schema
    if (schema) {
      let schemaScript = document.getElementById('schema-json-ld') as HTMLScriptElement;
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        schemaScript.setAttribute('id', 'schema-json-ld');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    }

    // Preload critical resources
    const preloadLink = (href: string, as: string, type?: string) => {
      const existing = document.querySelector(`link[href="${href}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'preload');
        link.setAttribute('href', href);
        link.setAttribute('as', as);
        if (type) link.setAttribute('type', type);
        document.head.appendChild(link);
      }
    };

    // Preload key assets for performance
    preloadLink('/images/hero-banner.webp', 'image');
    preloadLink('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', 'style');

    // Clean up function
    return () => {
      // Note: We don't clean up meta tags on unmount as they should persist
      // This is intentional for SPA navigation
    };
  }, [title, description, keywords, ogImage, ogUrl, twitterCard, canonicalUrl, schema]);

  return null; // This component doesn't render anything visible
};

// Default schema for the homepage
export const createHomePageSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Aurex Platform',
  description: 'Leading ESG reporting and DMRV platform for environmental monitoring and sustainability compliance',
  url: 'https://dev.aurigraph.io',
  logo: 'https://dev.aurigraph.io/images/aurex-logo.png',
  foundingDate: '2023',
  sameAs: [
    'https://linkedin.com/company/aurex-platform',
    'https://twitter.com/aurex_platform',
    'https://github.com/aurex-platform'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-555-123-4567',
    contactType: 'customer service',
    email: 'hello@aurex.com',
    availableLanguage: 'English'
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
    addressLocality: 'San Francisco',
    addressRegion: 'CA'
  },
  offers: {
    '@type': 'Offer',
    name: 'Aurex ESG Platform',
    description: 'Comprehensive DMRV platform for ESG reporting and environmental monitoring',
    category: 'Software as a Service',
    businessFunction: 'https://schema.org/Sell'
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Aurex Product Suite',
    itemListElement: [
      {
        '@type': 'Product',
        name: 'Launchpad - ESG Assessment',
        description: 'Comprehensive ESG assessment and readiness platform'
      },
      {
        '@type': 'Product',
        name: 'HydroPulse - Water Management',
        description: 'Smart water monitoring and management solution'
      },
      {
        '@type': 'Product',
        name: 'Sylvagraph - Forest Monitoring',
        description: 'Satellite-based forest monitoring and deforestation tracking'
      },
      {
        '@type': 'Product',
        name: 'CarbonTrace - Carbon Trading',
        description: 'Carbon credit trading and offset verification platform'
      }
    ]
  }
});

// Create FAQ Schema for better search visibility
export const createFAQSchema = (faqs: Array<{question: string; answer: string}>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

// Create BreadcrumbList Schema
export const createBreadcrumbSchema = (breadcrumbs: Array<{name: string; url: string}>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((breadcrumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: breadcrumb.name,
    item: breadcrumb.url
  }))
});

export default SEOHead;