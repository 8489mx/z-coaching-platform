import { evaluateIntake } from "../intake-decision-engine/index.js";
import { buildTrainingMesoCycle } from "../training-engine-v2/index.js";
import { buildCardioEngine } from "../cardio-engine/index.js";
import { buildMobilityEngine } from "../mobility-engine/index.js";
import { buildNutritionEngine } from "../nutrition-engine/index.js";
import { sanitizeMealPlan } from "../nutrition-meal-context-v2/index.js";
import { quantizeNutritionPlan } from "../nutrition-serving-quantizer-v2/index.js";
import { MASTER_ENGINE_V2_VERSION } from "./domain/enums.js";

function requireObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

function calculateAge(dobString, assessmentDateString) {
  const dob = new Date(dobString);
  const assessDate = new Date(assessmentDateString || new Date().toISOString());
  let age = assessDate.getFullYear() - dob.getFullYear();
  const m = assessDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && assessDate.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(16, Math.min(100, age));
}

/**
 * Builds the comprehensive Master Program V2 with multi-week meso-cycles,
 * practical serving quantization, and Zone 2 cardiovascular heart-rate targets.
 *
 * @param {Object} inputs
 * @param {Object} inputs.intake
 * @param {Object} inputs.evaluationContext
 * @param {Object} inputs.nutritionFoodCatalog
 * @param {Object} [inputs.options]
 * @returns {Object}
 */
import { adaptIntakePayloadToCanonicalEngine } from "../intake-decision-engine/adapters/intake-adapter.js";

export function buildMasterEngineV2(inputs) {
  requireObject(inputs, "inputs");

  const { intake, evaluationContext, nutritionFoodCatalog, options = {} } = inputs;
  requireObject(intake, "intake");
  requireObject(evaluationContext, "evaluationContext");
  requireObject(nutritionFoodCatalog, "nutritionFoodCatalog");

  const canonicalIntake = adaptIntakePayloadToCanonicalEngine(intake);

  // 1. Evaluate Intake
  const intake_decision = evaluateIntake(canonicalIntake, evaluationContext);

  // 2. Training Engine V2 (Multi-Week Meso-Cycle Periodization)
  const training_mesocycle = buildTrainingMesoCycle(intake_decision, {
    weeksCount: options.weeksCount || 5,
    muscleBias: options.muscleBias || null,
  });

  // Base weekly schedule for downstream cardio/mobility dependencies
  const baseWeeklySchedule =
    training_mesocycle.weeks.length > 0 ? training_mesocycle.weeks[0].sessions : [];
  const syntheticWeeklyPlan = {
    schedule_mode: training_mesocycle.schedule_mode,
    sessions: baseWeeklySchedule,
  };

  // 3. Cardio Engine V2 with Zone 2 Target Heart Rates
  const clientAge = canonicalIntake.personal?.dateOfBirth
    ? calculateAge(canonicalIntake.personal.dateOfBirth, evaluationContext.assessmentDate)
    : 30;
  const estimatedMaxHr = Math.round(208 - 0.7 * clientAge);
  const zone2LowBpm = Math.round(0.6 * estimatedMaxHr);
  const zone2HighBpm = Math.round(0.7 * estimatedMaxHr);

  const baseCardioProgram = buildCardioEngine(
    intake_decision,
    canonicalIntake,
    syntheticWeeklyPlan,
  );

  const enrichedCardioSessions = (baseCardioProgram.weekly_schedule?.sessions || []).map(
    (session) =>
      Object.freeze({
        ...session,
        heart_rate_target: {
          estimated_hr_max: estimatedMaxHr,
          zone: "ZONE_2",
          target_range_bpm: `${zone2LowBpm} - ${zone2HighBpm} BPM`,
          target_low_bpm: zone2LowBpm,
          target_high_bpm: zone2HighBpm,
          guidance_ar: `معدل نبضات القلب المستهدف أثناء جلسة الكارديو: بين ${zone2LowBpm} و ${zone2HighBpm} نبضة/دقيقة لحرق الدهون بكفاءة.`,
        },
      }),
  );

  const cardio_program_v2 = Object.freeze({
    ...baseCardioProgram,
    weekly_schedule: Object.freeze({
      ...baseCardioProgram.weekly_schedule,
      sessions: Object.freeze(enrichedCardioSessions),
    }),
  });

  // 4. Mobility Engine V2
  const mobility_program = buildMobilityEngine(intake_decision, syntheticWeeklyPlan);

  // 5. Nutrition Engine V2 with Practical Household Quantization
  const baseNutritionProgram = buildNutritionEngine({
    intake: canonicalIntake,
    evaluationContext,
    nutritionFoodCatalog,
  });

  const portionSolverStage = baseNutritionProgram.stages?.portion_solver;
  const sanitizedMealPlan = portionSolverStage ? sanitizeMealPlan(portionSolverStage, canonicalIntake) : null;
  const quantizedNutrition = sanitizedMealPlan ? quantizeNutritionPlan(sanitizedMealPlan) : null;

  const nutrition_program_v2 = Object.freeze({
    ...baseNutritionProgram,
    sanitized_plan: sanitizedMealPlan,
    quantized_plan: quantizedNutrition,
  });

  return Object.freeze({
    engine_version: MASTER_ENGINE_V2_VERSION,
    intake_decision,
    training_program: training_mesocycle,
    cardio_program: cardio_program_v2,
    mobility_program,
    nutrition_program: nutrition_program_v2,
  });
}
