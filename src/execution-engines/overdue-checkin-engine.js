/**
 * Overdue Check-in & Ghosting Prevention Engine — backend entry point.
 * Single source of truth lives in frontend/src/utils/overdueCheckinEngine.js;
 * this file re-exports it so backend callers and tests exercise the same code.
 */
export * from '../../frontend/src/utils/overdueCheckinEngine.js';
