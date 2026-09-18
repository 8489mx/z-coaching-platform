/**
 * Circadian & Lab Trigger Engine — backend entry point.
 * Single source of truth lives in the frontend module used by the client app
 * (caffeine cutoff default: 8 hours before bedtime); this file re-exports it.
 */
export * from '../../frontend/src/utils/circadianLabTriggerEngine.js';
