// Sitemap generation utilities for SEO

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = (urls: SitemapUrl[]): string => {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  const urlEntries = urls.map(url => {
    const urlOpen = '<url>';
    const urlClose = '</url>';
    const loc = `<loc>${url.loc}</loc>`;
    const lastmod = url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : '';
    const changefreq = url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : '';
    const priority = url.priority !== undefined ? `<priority>${url.priority}</priority>` : '';

    return `${urlOpen}${loc}${lastmod}${changefreq}${priority}${urlClose}`;
  }).join('');

  return `${xmlHeader}${urlsetOpen}${urlEntries}${urlsetClose}`;
};

// Default sitemap URLs for Aurex Platform
export const defaultSitemapUrls: SitemapUrl[] = [
  {
    loc: 'https://dev.aurigraph.io',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0
  },
  {
    loc: 'https://dev.aurigraph.io/products',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.9
  },
  {
    loc: 'https://dev.aurigraph.io/solutions',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.9
  },
  {
    loc: 'https://dev.aurigraph.io/pricing',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    loc: 'https://dev.aurigraph.io/about',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    loc: 'https://dev.aurigraph.io/contact',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.8
  }
];

// Generate robots.txt content
export const generateRobotsTxt = (sitemapUrl: string = 'https://dev.aurigraph.io/sitemap.xml'): string => {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${sitemapUrl}

# Block development and test paths
Disallow: /test/
Disallow: /_test/
Disallow: /dev/
Disallow: /__dev/

# Block admin paths
Disallow: /admin/
Disallow: /_admin/

# Block API endpoints from crawling
Disallow: /api/

# Block temp files
Disallow: *.tmp
Disallow: *.log

# Crawl-delay for politeness
Crawl-delay: 1`;
};

// Meta tags configuration for different pages
export const pageMetaConfig = {
  home: {
    title: 'Aurex Platform | Leading ESG Reporting & DMRV Software Solution',
    description: 'Transform your environmental impact with Aurex\'s intelligent DMRV platform. Monitor water, forests, and carbon with AI-powered precision. Start your free trial today.',
    keywords: [
      'ESG reporting software',
      'DMRV platform',
      'environmental monitoring',
      'carbon tracking',
      'water management',
      'forest monitoring',
      'sustainability reporting',
      'ESG compliance'
    ]
  },
  products: {
    title: 'ESG Software Products | Aurex DMRV Platform Suite',
    description: 'Discover Aurex\'s comprehensive DMRV product suite: Launchpad ESG Assessment, HydroPulse Water Management, Sylvagraph Forest Monitoring, and CarbonTrace Trading.',
    keywords: [
      'ESG software products',
      'DMRV solutions',
      'environmental monitoring tools',
      'carbon management software',
      'water monitoring platform',
      'forest tracking system'
    ]
  },
  solutions: {
    title: 'Industry ESG Solutions | Aurex Environmental Monitoring Platform',
    description: 'Tailored ESG solutions for manufacturing, agriculture, mining, and renewable energy sectors. Achieve compliance and sustainability goals with Aurex.',
    keywords: [
      'ESG industry solutions',
      'manufacturing sustainability',
      'agricultural monitoring',
      'mining environmental compliance',
      'renewable energy tracking'
    ]
  },
  pricing: {
    title: 'Aurex Platform Pricing | Flexible ESG Software Plans',
    description: 'Choose the perfect ESG monitoring plan for your business. Transparent pricing, scalable solutions, and comprehensive support. Start your free trial today.',
    keywords: [
      'ESG software pricing',
      'DMRV platform cost',
      'environmental monitoring subscription',
      'sustainability software plans',
      'ESG compliance pricing'
    ]
  },
  about: {
    title: 'About Aurex | Leading ESG Technology Company',
    description: 'Learn about Aurex\'s mission to transform environmental monitoring through AI-powered DMRV technology. Meet our team and discover our sustainability impact.',
    keywords: [
      'Aurex company',
      'ESG technology leader',
      'environmental monitoring company',
      'sustainability technology',
      'DMRV platform provider'
    ]
  },
  contact: {
    title: 'Contact Aurex | Get Started with ESG Monitoring Today',
    description: 'Ready to transform your environmental impact? Contact our ESG experts for a personalized demo and discover how Aurex can help achieve your sustainability goals.',
    keywords: [
      'contact Aurex',
      'ESG software demo',
      'environmental monitoring consultation',
      'sustainability platform support',
      'DMRV solution inquiry'
    ]
  }
};

// SEO utility functions
export const createPageUrl = (path: string, baseUrl: string = 'https://dev.aurigraph.io'): string => {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const formatLastModified = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Generate structured data for different page types
export const generatePageStructuredData = (pageType: keyof typeof pageMetaConfig, additionalData?: Record<string, any>) => {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: createPageUrl(`/${pageType === 'home' ? '' : pageType}`),
    name: pageMetaConfig[pageType].title,
    description: pageMetaConfig[pageType].description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Aurex Platform',
      url: 'https://dev.aurigraph.io'
    },
    ...additionalData
  };

  return baseData;
};