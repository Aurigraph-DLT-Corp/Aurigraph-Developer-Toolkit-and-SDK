/**
 * Subdomain Configuration for Aurex Platform
 * Manages clean subdomain architecture with independent service deployment
 */

// Environment detection
const isDevelopment = import.meta.env.MODE === 'development';
const isSubdomainMode = import.meta.env.VITE_SUBDOMAIN_MODE === 'true';

// Base domain configuration
const BASE_DOMAIN = isDevelopment ? 'localhost' : 'dev.aurigraph.io';
const PROTOCOL = isDevelopment ? 'http' : 'https';

// Port configuration for development
const DEV_PORTS = {
  platform: 3000,
  launchpad: 3001,
  hydropulse: 3002,
  sylvagraph: 3003,
  carbontrace: 3004,
  auth: 8080,
  monitoring: 9090
};

// Subdomain service configuration
export interface SubdomainService {
  name: string;
  subdomain: string;
  url: string;
  apiUrl: string;
  description: string;
  status: 'active' | 'development' | 'maintenance';
}

// Service definitions
export const SUBDOMAIN_SERVICES: Record<string, SubdomainService> = {
  platform: {
    name: 'Main Platform',
    subdomain: isDevelopment ? `localhost:${DEV_PORTS.platform}` : BASE_DOMAIN,
    url: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.platform}` : `${PROTOCOL}://${BASE_DOMAIN}`,
    apiUrl: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.platform}/api` : `${PROTOCOL}://${BASE_DOMAIN}/api`,
    description: 'Central platform and routing hub',
    status: 'active'
  },

  launchpad: {
    name: 'Launchpad ESG Assessment',
    subdomain: isDevelopment ? `localhost:${DEV_PORTS.launchpad}` : `launchpad.${BASE_DOMAIN}`,
    url: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.launchpad}` : `${PROTOCOL}://launchpad.${BASE_DOMAIN}`,
    apiUrl: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.launchpad}/api` : `${PROTOCOL}://launchpad.${BASE_DOMAIN}/api`,
    description: 'ESG assessment and sustainability reporting platform',
    status: 'active'
  },

  hydropulse: {
    name: 'HydroPulse Water Management',
    subdomain: isDevelopment ? `localhost:${DEV_PORTS.hydropulse}` : `hydropulse.${BASE_DOMAIN}`,
    url: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.hydropulse}` : `${PROTOCOL}://hydropulse.${BASE_DOMAIN}`,
    apiUrl: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.hydropulse}/api` : `${PROTOCOL}://hydropulse.${BASE_DOMAIN}/api`,
    description: 'Water management and AWD monitoring platform',
    status: 'active'
  },

  sylvagraph: {
    name: 'Sylvagraph Forest Monitoring',
    subdomain: isDevelopment ? `localhost:${DEV_PORTS.sylvagraph}` : `sylvagraph.${BASE_DOMAIN}`,
    url: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.sylvagraph}` : `${PROTOCOL}://sylvagraph.${BASE_DOMAIN}`,
    apiUrl: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.sylvagraph}/api` : `${PROTOCOL}://sylvagraph.${BASE_DOMAIN}/api`,
    description: 'Forest monitoring and agroforestry platform',
    status: 'active'
  },

  carbontrace: {
    name: 'CarbonTrace Carbon Credits',
    subdomain: isDevelopment ? `localhost:${DEV_PORTS.carbontrace}` : `carbontrace.${BASE_DOMAIN}`,
    url: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.carbontrace}` : `${PROTOCOL}://carbontrace.${BASE_DOMAIN}`,
    apiUrl: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.carbontrace}/api` : `${PROTOCOL}://carbontrace.${BASE_DOMAIN}/api`,
    description: 'Carbon credit trading and blockchain platform',
    status: 'active'
  },

  auth: {
    name: 'Authentication Service',
    subdomain: isDevelopment ? `localhost:${DEV_PORTS.auth}` : `auth.${BASE_DOMAIN}`,
    url: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.auth}` : `${PROTOCOL}://auth.${BASE_DOMAIN}`,
    apiUrl: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.auth}` : `${PROTOCOL}://auth.${BASE_DOMAIN}`,
    description: 'DB-based authentication service',
    status: 'development'
  },

  monitoring: {
    name: 'Monitoring Dashboard',
    subdomain: isDevelopment ? `localhost:${DEV_PORTS.monitoring}` : `monitoring.${BASE_DOMAIN}`,
    url: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.monitoring}` : `${PROTOCOL}://monitoring.${BASE_DOMAIN}`,
    apiUrl: isDevelopment ? `${PROTOCOL}://localhost:${DEV_PORTS.monitoring}/api` : `${PROTOCOL}://monitoring.${BASE_DOMAIN}/api`,
    description: 'Prometheus and Grafana monitoring stack',
    status: 'development'
  }
};

// Current service detection
export const getCurrentService = (): string => {
  if (typeof window === 'undefined') return 'platform';

  const hostname = window.location.hostname;
  const port = window.location.port;

  // Development mode detection
  if (isDevelopment) {
    const currentPort = parseInt(port);
    for (const [key, service] of Object.entries(SUBDOMAIN_SERVICES)) {
      if (service.subdomain.includes(`:${currentPort}`)) {
        return key;
      }
    }
    return 'platform';
  }

  // Production subdomain detection
  if (hostname.includes('.')) {
    const subdomain = hostname.split('.')[0];
    if (SUBDOMAIN_SERVICES[subdomain]) {
      return subdomain;
    }
  }

  return 'platform';
};

// Get service configuration
export const getServiceConfig = (serviceName?: string): SubdomainService => {
  const service = serviceName || getCurrentService();
  return SUBDOMAIN_SERVICES[service] || SUBDOMAIN_SERVICES.platform;
};

// Get API URL for a service
export const getServiceApiUrl = (serviceName: string): string => {
  const service = SUBDOMAIN_SERVICES[serviceName];
  return service ? service.apiUrl : SUBDOMAIN_SERVICES.platform.apiUrl;
};

// Get service URL for navigation
export const getServiceUrl = (serviceName: string, path: string = ''): string => {
  const service = SUBDOMAIN_SERVICES[serviceName];
  if (!service) return SUBDOMAIN_SERVICES.platform.url;

  const baseUrl = service.url;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Cross-service navigation
export const navigateToService = (serviceName: string, path: string = '') => {
  const url = getServiceUrl(serviceName, path);
  window.location.href = url;
};

// CORS origins for API calls
export const getCorsOrigins = (): string[] => {
  return Object.values(SUBDOMAIN_SERVICES).map(service => service.url);
};

// Authentication configuration for subdomains (DB-based)
export const getAuthConfig = () => {
  const currentService = getCurrentService();

  return {
    apiUrl: getServiceApiUrl('platform'),
    redirectUri: getServiceConfig().url,
    postLogoutRedirectUri: getServiceConfig().url,
    service: currentService
  };
};

// Service integration configuration
export const getServiceIntegrations = (serviceName: string): Record<string, string> => {
  const integrations: Record<string, Record<string, string>> = {
    hydropulse: {
      carbontrace: getServiceApiUrl('carbontrace'),
      auth: getServiceApiUrl('auth')
    },
    carbontrace: {
      hydropulse: getServiceApiUrl('hydropulse'),
      auth: getServiceApiUrl('auth')
    },
    launchpad: {
      hydropulse: getServiceApiUrl('hydropulse'),
      carbontrace: getServiceApiUrl('carbontrace'),
      sylvagraph: getServiceApiUrl('sylvagraph'),
      auth: getServiceApiUrl('auth')
    },
    sylvagraph: {
      carbontrace: getServiceApiUrl('carbontrace'),
      auth: getServiceApiUrl('auth')
    }
  };

  return integrations[serviceName] || { auth: getServiceApiUrl('auth') };
};

// Health check URLs
export const getHealthCheckUrls = (): Record<string, string> => {
  const healthUrls: Record<string, string> = {};

  Object.entries(SUBDOMAIN_SERVICES).forEach(([key, service]) => {
    healthUrls[key] = `${service.url}/health`;
  });

  return healthUrls;
};

// Export current service info for debugging
export const getSubdomainInfo = () => {
  return {
    currentService: getCurrentService(),
    currentConfig: getServiceConfig(),
    isDevelopment,
    isSubdomainMode,
    allServices: SUBDOMAIN_SERVICES,
    corsOrigins: getCorsOrigins(),
    authConfig: getAuthConfig()
  };
};

// Default export
export default {
  services: SUBDOMAIN_SERVICES,
  getCurrentService,
  getServiceConfig,
  getServiceApiUrl,
  getServiceUrl,
  navigateToService,
  getCorsOrigins,
  getAuthConfig,
  getServiceIntegrations,
  getHealthCheckUrls,
  getSubdomainInfo
};
