/**
 * Intake Preflight & Biomechanical Clinical Audit Engine — backend entry point.
 * Single source of truth lives in frontend/src/utils/intakePreflightEngine.js;
 * this file re-exports it so backend callers and tests exercise the exact same code.
 */
export * from '../../frontend/src/utils/intakePreflightEngine.js';
