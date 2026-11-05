export {
  ADAPTATION_ENGINE_VERSION,
  AdaptationAction,
  AdaptationReasonCode,
} from "./domain/enums.js";

export { buildAdaptedPlan } from "./build-adapted-plan.js";
export {
  DIET_BREAK_WEEKS,
  DIET_BREAK_MIN_STREAK,
  DIET_BREAK_COOLDOWN_WEEKS,
  advanceDeficitWeeksSinceBreak,
  endDietBreakState,
  isDietBreakGoalEligible,
  isNewDietBreakEligible,
  normalizeGoal as normalizeDietBreakGoal,
  preservedCalorieOffset,
  readAdaptationState,
  resolveDietBreakMaintenance,
  startDietBreakState,
  validateStepTarget,
} from "./diet-break-state.js";
