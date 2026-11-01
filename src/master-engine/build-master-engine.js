import { evaluateIntake } from "../intake-decision-engine/index.js";
import { buildTrainingEngine } from "../training-engine/index.js";
import { buildCardioEngine } from "../cardio-engine/index.js";
import { buildMobilityEngine } from "../mobility-engine/index.js";
import { buildNutritionEngine } from "../nutrition-engine/index.js";
import { MASTER_ENGINE_VERSION } from "./domain/enums.js";

function requireObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

/**
 * @deprecated Legacy Master Engine V1 (R6). Zero production routes use this engine;
 * all live workflows use buildMasterEngineV2 (src/master-engine-v2/index.js).
 * Preserved strictly for historical test compatibility.
 *
 * @param {import("./domain/contracts.js").MasterEngineInput} inputs
 * @returns {import("./domain/contracts.js").MasterProgramResult}
 */
export function buildMasterEngine(inputs) {
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
    console.warn("[DEPRECATED] buildMasterEngine (v1) is deprecated. Use buildMasterEngineV2 instead.");
  }
  requireObject(inputs, "inputs");
  
  const { intake, evaluationContext, nutritionFoodCatalog } = inputs;
  requireObject(intake, "intake");
  requireObject(evaluationContext, "evaluationContext");
  requireObject(nutritionFoodCatalog, "nutritionFoodCatalog");

  // 1. Evaluate Intake
  const intake_decision = evaluateIntake(intake, evaluationContext);

  // 2. Training Engine
  const training_program = buildTrainingEngine(intake_decision);
  const weekly_training_schedule = training_program.weekly_training_plan;

  // 3. Cardio Engine (depends on training days)
  const cardio_program = buildCardioEngine(
    intake_decision,
    intake,
    weekly_training_schedule
  );

  // 4. Mobility Engine (depends on training days)
  const mobility_program = buildMobilityEngine(
    intake_decision,
    weekly_training_schedule
  );

  // 5. Nutrition Engine
  const nutrition_program = buildNutritionEngine({
    intake,
    evaluationContext,
    nutritionFoodCatalog,
  });

  return {
    engine_version: MASTER_ENGINE_VERSION,
    is_deprecated: true,
    intake_decision,
    training_program,
    cardio_program,
    mobility_program,
    nutrition_program,
  };
}
