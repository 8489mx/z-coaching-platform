/**
 * Dynamic API Base URL configuration.
 * Adapts automatically between local development (Vite dev server) and production deployment on Hostinger.
 */
const isDev = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174' || window.location.port === '3001');

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || (
  isDev ? `http://${window.location.hostname}:3000` : ''
);

// Global Fetch Interceptor to inject JWT Token automatically
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  try {
    const originalFetch = window.fetch.bind(window);
    const interceptedFetch = async (...args) => {
      let [resource, config] = args;
      
      // Exclude external URLs (like youtube or whatsapp or third-party APIs) from token injection
      if (typeof resource === 'string' && resource.startsWith('http')) {
        const isOurBackend = (Boolean(API_BASE) && resource.includes(API_BASE)) || 
          (typeof window !== 'undefined' && resource.includes(window.location.hostname));
        if (!isOurBackend) {
          return originalFetch(resource, config);
        }
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
      
      // Handle Global 401 Unauthorized safely without disrupting public or client intake/checkin forms
      if (response.status === 401 && typeof resource === 'string' && !resource.includes('/auth/login') && !resource.includes('/auth/login-fast')) {
        const isPublicOrClientPage = typeof window !== 'undefined' && (
          window.location.pathname.startsWith('/client') ||
          window.location.pathname.startsWith('/check-in') ||
          window.location.pathname.startsWith('/intake') ||
          window.location.pathname.startsWith('/join') ||
          window.location.pathname.startsWith('/pricing') ||
          window.location.pathname.startsWith('/pdf') ||
          window.location.pathname.startsWith('/login')
        );
        if (!isPublicOrClientPage) {
          // Expired or revoked staff session: clear it and send the coach to the email/password login.
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('z_coach_user');
          localStorage.removeItem('z_auth_token');
          localStorage.removeItem('kz_client_token');
          window.location.href = '/login';
        }
      }
      
      return response;
    };

    // Safely assign interceptedFetch to window.fetch
    try {
      Object.defineProperty(window, 'fetch', {
        value: interceptedFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      try {
        window.fetch = interceptedFetch;
      } catch {
        try {
          Object.defineProperty(Object.getPrototypeOf(window), 'fetch', {
            value: interceptedFetch,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch (e) {
          console.warn('Could not override fetch property on window:', e);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to initialize fetch interceptor:', err);
  }
}
