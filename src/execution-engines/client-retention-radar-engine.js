/**
 * Client Retention & Renewal Radar Engine — backend entry point.
 * Single source of truth lives in frontend/src/utils/clientRetentionRadarEngine.js;
 * this file re-exports it so backend callers and tests exercise the same code.
 */
export * from '../../frontend/src/utils/clientRetentionRadarEngine.js';
