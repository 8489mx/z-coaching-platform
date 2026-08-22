/**
 * Dynamic API Base URL configuration.
 * Adapts automatically between local development (Vite dev server) and production deployment on Hostinger.
 */
const isDev = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174' || window.location.port === '3001');

export const API_BASE = import.meta.env.VITE_API_URL || (
  isDev ? `http://${window.location.hostname}:3000` : ''
);
