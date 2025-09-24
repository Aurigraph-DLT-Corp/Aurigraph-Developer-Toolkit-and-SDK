// Environment configuration with fallbacks
const config = {
  // API Configuration - Production defaults for dev.aurigraph.io
  API_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://dev.aurigraph.io/api/launchpad/v1' : 'http://localhost:8001/api/v1'),
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://dev.aurigraph.io/api/launchpad' : 'http://localhost:8001'),
  
  // Development Configuration
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true' || import.meta.env.DEV,
  
  // Feature Flags
  ENABLE_AUTH: import.meta.env.VITE_ENABLE_AUTH !== 'false',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  
  // Application Info
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Aurex Launchpad™',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.1.0',
  
  // URLs - Production defaults for dev.aurigraph.io
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || (import.meta.env.PROD ? 'https://dev.aurigraph.io/launchpad' : 'http://localhost:3001'),
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://dev.aurigraph.io/api/launchpad' : 'http://localhost:8001'),
  
  // Runtime environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE || 'development'
};

// Validate critical configuration
const validateConfig = () => {
  const errors = [];
  
  if (!config.API_URL) {
    errors.push('API_URL is required');
  }
  
  if (!config.APP_NAME) {
    errors.push('APP_NAME is required');
  }
  
  if (errors.length > 0) {
    console.error('🚨 Configuration Errors:', errors);
    return false;
  }
  
  return true;
};

// Log configuration in development
if (config.IS_DEV && config.ENABLE_LOGGING) {
  console.log('🔧 Application Configuration:', config);
  validateConfig();
}

export default config;
export { validateConfig };