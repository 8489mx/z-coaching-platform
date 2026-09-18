/**
 * Food Swap Engine — backend entry point.
 * Single source of truth lives in the frontend module used by the client app;
 * this file re-exports it so the API, tests and UI all run the same code.
 */
export * from '../../frontend/src/utils/foodSwapEngine.js';
