/**
 * Biomechanical Swap Engine — backend entry point.
 * Single source of truth lives in the frontend module used by the coach editor;
 * this file re-exports it so backend callers and tests exercise the same code.
 */
export * from '../../frontend/src/utils/biomechanicalSwapEngine.js';
