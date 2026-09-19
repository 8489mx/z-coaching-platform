/**
 * Progression & Deload Engine — backend entry point.
 * Single source of truth lives in the frontend module (client app logging card, coach timeline);
 * this file re-exports it for the API (workout logs, active program, check-in deload recommendation).
 */
export * from '../../../frontend/src/utils/progressionEngine.js';
