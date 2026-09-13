export { IntakeDecisionEngine, evaluateIntake } from "./intake-decision-engine.js";
export { IntakeValidationError } from "./validation/intake-validation-error.js";
export { calculateAgeYears, validateIntake } from "./validation/validate-intake.js";
export { OccupationType } from "./domain/enums.js";
export * from "./domain/enums.js";

// Rule exports keep every decision independently unit-testable and make future
// policy replacement possible without coupling callers to engine internals.
export * from "./rules/safety-rules.js";
export * from "./rules/nutrition-rules.js";
export * from "./rules/training-rules.js";
export * from "./rules/cardio-rules.js";

