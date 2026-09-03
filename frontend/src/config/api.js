/**
 * Dynamic API Base URL configuration.
 * Adapts automatically between local development (Vite dev server) and production deployment on Hostinger.
 */
const isDev = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174' || window.location.port === '3001');

export const API_BASE = import.meta.env.VITE_API_URL || (
  isDev ? `http://${window.location.hostname}:3000` : ''
);


// Global Fetch Interceptor to inject JWT Token automatically
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  // Exclude external URLs (like youtube or whatsapp) from interception
  if (typeof resource === 'string' && resource.startsWith('http') && !resource.includes(API_BASE) && !resource.includes(window.location.hostname)) {
    return originalFetch(resource, config);
  }

  // Inject Authorization Header
  const token = localStorage.getItem('token') || localStorage.getItem('kz_client_token');
  if (token) {
    config = config || {};
    config.headers = config.headers || {};
    // Ensure we don't overwrite it if manually set
    if (!config.headers['Authorization'] && !config.headers.authorization) {
      // If headers is a Headers object
      if (config.headers instanceof Headers) {
        config.headers.append('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  
  const response = await originalFetch(resource, config);
  
  // Handle Global 401 Unauthorized
  if (response.status === 401 && !resource.includes('/auth/login')) {
    localStorage.removeItem('token');
    localStorage.removeItem('kz_client_token');
    window.location.href = '/login'; // Or wherever login is
  }
  
  return response;
};
