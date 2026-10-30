/**
 * Barrel export of the execution engines that are live in the product
 * (imported by the API server or by the client/coach UI). Engines that no
 * production path used were removed; do not re-add an engine here unless a
 * server route or UI screen actually calls it.
 */

// 1. Clinical & Pharmacological Engines
export * from './drug-interaction-firewall.js';
export * from './biomarker-engine.js';

// 2. Nutrition & Metabolism Engines
export * from './food-swap-engine.js';
export * from './kitchen-yield-engine.js';
export * from './metabolic-macro-engine.js';

// 3. Training & Biomechanics Engines
export * from './progressive-overload-engine.js';
export * from './biomechanical-swap-engine.js';
export * from './biomechanics-firewall-engine.js';
export * from './cardio-interference-engine.js';
export * from './cardio-zones-engine.js';
export * from './postural-prehab-engine.js';
export * from './warmup-ladder-engine.js';

// 4. Physiological Buffers & Recovery Engines
export * from './female-cycle-buffer-engine.js';
export * from './circadian-lab-trigger-engine.js';
export * from './circadian-nutrient-timing-engine.js';
export * from './autoregulated-recovery-engine.js';

// 5. Subscription, Lifecycle & Coach Operations Engines
export * from './subscription-lifecycle-engine.js';
export * from './emergency-scenario-engine.js';
export * from './pdf-export-engine.js';
export * from './coach-triage-engine.js';
export * from './onboarding-plan-generator-engine.js';

// 6. Offline Queue (the weekly-audit calculator was retired in S3-4/S4-5)
export * from './offline-sync-engine.js';
