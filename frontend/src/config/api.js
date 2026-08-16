/**
 * Dynamic API Base URL configuration.
 * Uses window.location.hostname to automatically adapt whether the app is accessed
 * from localhost (127.0.0.1) or from another device on the local network (e.g. 192.168.1.92).
 */
export const API_BASE = `http://${window.location.hostname}:3000`;
