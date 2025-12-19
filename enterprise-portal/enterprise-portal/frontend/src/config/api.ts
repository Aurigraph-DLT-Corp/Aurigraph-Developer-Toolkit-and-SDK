// API Configuration - Always use HTTPS in production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dlt.aurigraph.io';
export const API_V12_URL = `${API_BASE_URL}/api/v12`;
export const API_V11_URL = `${API_BASE_URL}/api/v11`;
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://dlt.aurigraph.io/ws';
