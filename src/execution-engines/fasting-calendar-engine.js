/**
 * Calendar-Aware Religious Fasting Engine — backend entry point.
 * Single source of truth lives in the frontend module (client app meals/swaps, coach editor);
 * this file re-exports it for the API (active program fasting context).
 */
export * from '../../frontend/src/utils/fastingCalendarEngine.js';
