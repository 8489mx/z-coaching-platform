/**
 * Biomechanics Firewall Engine — backend entry point.
 * Single source of truth lives in the frontend module (coach editor, check-in review,
 * client exercise swaps); this file re-exports it for the training and adaptation engines.
 */
export * from '../../frontend/src/utils/biomechanicsFirewallEngine.js';
