// URL Configuration for Different Environments
// Handles localhost vs production URL patterns
// Environment-based URL configuration
const urlConfig = {
    // Development environment - use localhost path-based routing
    development: {
        'platform': 'http://localhost/',
        'launchpad': 'http://localhost/Launchpad',
        'hydropulse': 'http://localhost/Hydropulse',
        'sylvagraph': 'http://localhost/Sylvagraph',
        'carbontrace': 'http://localhost/Carbontrace',
        'admin': 'http://localhost/AurexAdmin',
    },
    // Production environment - use dev.aurigraph.io path-based routing  
    production: {
        'platform': 'https://dev.aurigraph.io/',
        'launchpad': 'https://dev.aurigraph.io/Launchpad',
        'hydropulse': 'https://dev.aurigraph.io/Hydropulse',
        'sylvagraph': 'https://dev.aurigraph.io/Sylvagraph',
        'carbontrace': 'https://dev.aurigraph.io/Carbontrace',
        'admin': 'https://dev.aurigraph.io/AurexAdmin',
    }
};
// Determine current environment
const getCurrentEnvironment = () => {
    // Check if running on localhost/127.0.0.1
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    }
    return 'production';
};
// Get URLs for current environment
export const getAppUrls = () => {
    const env = getCurrentEnvironment();
    return urlConfig[env];
};
// Get specific app URL
export const getAppUrl = (appId) => {
    const urls = getAppUrls();
    return urls[appId] || '#';
};
// Export current environment for debugging
export const currentEnvironment = getCurrentEnvironment();
// Export for debugging
export { urlConfig };
