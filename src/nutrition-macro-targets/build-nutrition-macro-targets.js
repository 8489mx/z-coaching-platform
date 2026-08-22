import {
  CalorieDirection,
  Sex,
} from "../intake-decision-engine/index.js";
import {
  NUTRITION_ENERGY_TARGET_VERSION,
  NutritionEnergyCalculationMethod,
  NutritionEnergyTargetStatus,
  NutritionPalCategory,
} from "../nutrition-energy-target/index.js";
import { NUTRITION_PLANNING_SNAPSHOT_VERSION } from "../nutrition-planning-snapshot/index.js";
import { NUTRITION_MACRO_TARGETS_VERSION } from "./domain/contracts.js";
import {
  NutritionMacroCalculationPolicy,
  NutritionMacroTargetsStatus,
} from "./domain/enums.js";

const PROTEIN_REFERENCE_WEIGHT_BASIS = Object.freeze({
  ACTUAL_WEIGHT: "ACTUAL_WEIGHT",
  BMI_30_CAPPED_WEIGHT: "BMI_30_CAPPED_WEIGHT",
});

const REASON_MESSAGES = Object.freeze({
  MACRO_TARGETS_WITHHELD_BY_ENERGY_STATUS:
    "Macro targets were withheld because the upstream nutrition energy target is withheld.",
  MACRO_TARGETS_UNAVAILABLE_WITHOUT_CALORIE_TARGET:
    "Macro targets cannot be calculated until a target calorie value is available.",
  MACRO_POLICY_APPLIED:
    "Daily protein, fat, carbohydrate, and fiber targets were calculated using Z Coaching Macro Policy V1.",
  PROTEIN_REFERENCE_WEIGHT_CAPPED:
    "Protein reference weight was capped at the weight corresponding to BMI 30 under Z Coaching Macro Policy V1.",
  PROTEIN_ENERGY_CAP_APPLIED:
    "Protein was capped at 30% of target calories to fit the available energy budget.",
  PROTEIN_TARGET_BELOW_POLICY_MINIMUM_REQUIRES_REVIEW:
    "The energy-capped protein target provides less than 1.2 grams per kilogram of reference weight and requires coach review.",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, path) {
  if (!isObject(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
}

function requireEnum(value, runtimeEnum, enumName, path) {
  if (!Object.values(runtimeEnum).includes(value)) {
    throw new TypeError(`${path} must be a ${enumName}.`);
  }
}

function requirePositiveFiniteNumber(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${path} must be a positive finite number.`);
  }
}

function validateSnapshot(snapshot) {
  requireObject(snapshot, "nutritionPlanningSnapshot");
  if (snapshot.snapshot_version !== NUTRITION_PLANNING_SNAPSHOT_VERSION) {
    throw new TypeError(
      `nutritionPlanningSnapshot.snapshot_version must equal ${NUTRITION_PLANNING_SNAPSHOT_VERSION}.`,
    );
  }

  requireObject(snapshot.client, "nutritionPlanningSnapshot.client");
  if (!Number.isInteger(snapshot.client.age_years) || snapshot.client.age_years < 0) {
    throw new TypeError(
      "nutritionPlanningSnapshot.client.age_years must be a non-negative integer.",
    );
  }
  requireEnum(
    snapshot.client.sex,
    Sex,
    "Sex",
    "nutritionPlanningSnapshot.client.sex",
  );

  requireObject(snapshot.body, "nutritionPlanningSnapshot.body");
  requirePositiveFiniteNumber(
    snapshot.body.height_cm,
    "nutritionPlanningSnapshot.body.height_cm",
  );
  requirePositiveFiniteNumber(
    snapshot.body.weight_kg,
    "nutritionPlanningSnapshot.body.weight_kg",
  );

  requireObject(snapshot.goal, "nutritionPlanningSnapshot.goal");
  requireEnum(
    snapshot.goal.calorie_direction,
    CalorieDirection,
    "CalorieDirection",
    "nutritionPlanningSnapshot.goal.calorie_direction",
  );

  requireObject(snapshot.activity, "nutritionPlanningSnapshot.activity");
  if (
    !Number.isInteger(snapshot.activity.recommended_resistance_days) ||
    snapshot.activity.recommended_resistance_days < 0 ||
    snapshot.activity.recommended_resistance_days > 6
  ) {
    throw new TypeError(
      "nutritionPlanningSnapshot.activity.recommended_resistance_days must be an integer from 0 to 6.",
    );
  }
  if (!Array.isArray(snapshot.activity.additional_sports)) {
    throw new TypeError(
      "nutritionPlanningSnapshot.activity.additional_sports must be an array.",
    );
  }
}

function validateEnergyTarget(snapshot, energyTarget) {
  requireObject(energyTarget, "nutritionEnergyTarget");
  if (energyTarget.energy_target_version !== NUTRITION_ENERGY_TARGET_VERSION) {
    throw new TypeError(
      `nutritionEnergyTarget.energy_target_version must equal ${NUTRITION_ENERGY_TARGET_VERSION}.`,
    );
  }
  if (energyTarget.source_snapshot_version !== snapshot.snapshot_version) {
    throw new TypeError(
      "nutritionEnergyTarget.source_snapshot_version must match nutritionPlanningSnapshot.snapshot_version.",
    );
  }
  requireEnum(
    energyTarget.status,
    NutritionEnergyTargetStatus,
    "NutritionEnergyTargetStatus",
    "nutritionEnergyTarget.status",
  );
  requireEnum(
    energyTarget.calculation_method,
    NutritionEnergyCalculationMethod,
    "NutritionEnergyCalculationMethod",
    "nutritionEnergyTarget.calculation_method",
  );

  requireObject(
    energyTarget.activity_assessment,
    "nutritionEnergyTarget.activity_assessment",
  );
  if (
    energyTarget.activity_assessment.pal_category !== null &&
    !Object.values(NutritionPalCategory).includes(
      energyTarget.activity_assessment.pal_category,
    )
  ) {
    throw new TypeError(
      "nutritionEnergyTarget.activity_assessment.pal_category must be null or a NutritionPalCategory.",
    );
  }
  if (
    typeof energyTarget.activity_assessment.weighted_sport_minutes !==
      "number" ||
    !Number.isFinite(
      energyTarget.activity_assessment.weighted_sport_minutes,
    ) ||
    energyTarget.activity_assessment.weighted_sport_minutes < 0
  ) {
    throw new TypeError(
      "nutritionEnergyTarget.activity_assessment.weighted_sport_minutes must be a non-negative finite number.",
    );
  }

  requireEnum(
    energyTarget.calorie_direction,
    CalorieDirection,
    "CalorieDirection",
    "nutritionEnergyTarget.calorie_direction",
  );
  if (!Array.isArray(energyTarget.constraints)) {
    throw new TypeError("nutritionEnergyTarget.constraints must be an array.");
  }
  if (!Array.isArray(energyTarget.reasons)) {
    throw new TypeError("nutritionEnergyTarget.reasons must be an array.");
  }
  if (typeof energyTarget.calibration_required !== "boolean") {
    throw new TypeError(
      "nutritionEnergyTarget.calibration_required must be a boolean.",
    );
  }
  if (
    energyTarget.target_calories !== null &&
    (!Number.isInteger(energyTarget.target_calories) ||
      energyTarget.target_calories <= 0)
  ) {
    throw new TypeError(
      "nutritionEnergyTarget.target_calories must be null or a positive integer.",
    );
  }

  if (energyTarget.calorie_direction !== snapshot.goal.calorie_direction) {
    throw new TypeError(
      "nutritionEnergyTarget.calorie_direction must match nutritionPlanningSnapshot.goal.calorie_direction.",
    );
  }
  if (
    energyTarget.status === NutritionEnergyTargetStatus.WITHHELD &&
    energyTarget.target_calories !== null
  ) {
    throw new TypeError(
      "A WITHHELD nutrition energy target must have null target_calories.",
    );
  }
  if (
    energyTarget.status === NutritionEnergyTargetStatus.READY &&
    energyTarget.target_calories === null
  ) {
    throw new TypeError(
      "A READY nutrition energy target must have positive integer target_calories.",
    );
  }
  if (
    energyTarget.target_calories !== null &&
    !energyTarget.calibration_required
  ) {
    throw new TypeError(
      "A calorie-bearing nutrition energy target must require calibration.",
    );
  }
}

function roundToNearest5(value) {
  return Math.round(value / 5) * 5;
}

function floorToNearest5(value) {
  return Math.floor(value / 5) * 5;
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function calculateProteinReference(snapshot) {
  const heightMeters = snapshot.body.height_cm / 100;
  const weightAtBmi30 = 30 * heightMeters ** 2;
  const capped = snapshot.body.weight_kg > weightAtBmi30;

  return {
    referenceWeightKg: roundToOneDecimal(
      Math.min(snapshot.body.weight_kg, weightAtBmi30),
    ),
    basis: capped
      ? PROTEIN_REFERENCE_WEIGHT_BASIS.BMI_30_CAPPED_WEIGHT
      : PROTEIN_REFERENCE_WEIGHT_BASIS.ACTUAL_WEIGHT,
    capped,
  };
}

function calculateProteinFactor(snapshot, energyTarget) {
  const resistanceDays = snapshot.activity.recommended_resistance_days;
  const weightedSportMinutes =
    energyTarget.activity_assessment.weighted_sport_minutes;
  const ordinaryTrainingLoad =
    (resistanceDays >= 1 && resistanceDays <= 3) ||
    (weightedSportMinutes > 0 && weightedSportMinutes < 180);
  const highTrainingLoad =
    resistanceDays >= 4 || weightedSportMinutes >= 180;

  let factor = 1.2;
  if (ordinaryTrainingLoad) {
    factor = Math.max(factor, 1.6);
  }
  if (highTrainingLoad) {
    factor = Math.max(factor, 1.8);
  }
  if (energyTarget.calorie_direction === CalorieDirection.DEFICIT) {
    factor = Math.min(factor + 0.2, 2);
  }
  return roundToTwoDecimals(factor);
}

function calculateFiberTarget(snapshot) {
  if (
    snapshot.client.age_years < 19 ||
    ![Sex.MALE, Sex.FEMALE].includes(snapshot.client.sex)
  ) {
    throw new TypeError(
      "A calorie-bearing energy target requires an adult MALE or FEMALE snapshot for fiber calculation.",
    );
  }

  if (snapshot.client.sex === Sex.MALE) {
    return snapshot.client.age_years <= 50 ? 38 : 30;
  }
  return snapshot.client.age_years <= 50 ? 25 : 21;
}

function cloneReasonsWithoutDuplicateCodes(reasons) {
  const clonedReasons = structuredClone(reasons);
  const uniqueReasons = [];
  const reasonCodes = new Set();

  for (const reason of clonedReasons) {
    const code = isObject(reason) && typeof reason.code === "string"
      ? reason.code
      : null;
    if (code !== null && reasonCodes.has(code)) {
      continue;
    }
    if (code !== null) {
      reasonCodes.add(code);
    }
    uniqueReasons.push(reason);
  }

  return { reasons: uniqueReasons, reasonCodes };
}

function addReason(reasons, reasonCodes, code) {
  if (reasonCodes.has(code)) {
    return;
  }
  reasonCodes.add(code);
  reasons.push({ code, message: REASON_MESSAGES[code] });
}

function buildBaseOutput(snapshot, energyTarget, reasons) {
  return {
    macro_targets_version: NUTRITION_MACRO_TARGETS_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    source_energy_target_version: energyTarget.energy_target_version,
    source_energy_status: energyTarget.status,
    status: NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED,
    calculation_policy:
      NutritionMacroCalculationPolicy.Z_COACHING_MACRO_POLICY_V1,
    target_calories: energyTarget.target_calories,
    protein: null,
    fat: null,
    carbohydrate: null,
    fiber_target_g: null,
    macro_calories_total: null,
    calorie_difference: null,
    constraints: energyTarget.constraints,
    reasons,
  };
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}

function finalize(output) {
  return deepFreeze(structuredClone(output));
}

/**
 * Builds immutable daily macro and fiber targets from a Nutrition Planning
 * Snapshot and its already-calculated Nutrition Energy Target.
 *
 * @param {Object} input
 * @param {Object} input.nutritionPlanningSnapshot
 * @param {Object} input.nutritionEnergyTarget
 * @returns {import("./domain/contracts.js").NutritionMacroTargets}
 */
export function buildNutritionMacroTargets({
  nutritionPlanningSnapshot,
  nutritionEnergyTarget,
} = {}) {
  validateSnapshot(nutritionPlanningSnapshot);
  validateEnergyTarget(nutritionPlanningSnapshot, nutritionEnergyTarget);

  const { reasons, reasonCodes } = cloneReasonsWithoutDuplicateCodes(
    nutritionEnergyTarget.reasons,
  );
  const output = buildBaseOutput(
    nutritionPlanningSnapshot,
    nutritionEnergyTarget,
    reasons,
  );

  if (nutritionEnergyTarget.status === NutritionEnergyTargetStatus.WITHHELD) {
    output.status = NutritionMacroTargetsStatus.WITHHELD;
    addReason(
      output.reasons,
      reasonCodes,
      "MACRO_TARGETS_WITHHELD_BY_ENERGY_STATUS",
    );
    return finalize(output);
  }

  if (nutritionEnergyTarget.target_calories === null) {
    output.status = NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(
      output.reasons,
      reasonCodes,
      "MACRO_TARGETS_UNAVAILABLE_WITHOUT_CALORIE_TARGET",
    );
    return finalize(output);
  }

  output.status =
    nutritionEnergyTarget.status === NutritionEnergyTargetStatus.READY
      ? NutritionMacroTargetsStatus.READY
      : NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED;
  addReason(output.reasons, reasonCodes, "MACRO_POLICY_APPLIED");

  const proteinReference = calculateProteinReference(
    nutritionPlanningSnapshot,
  );
  if (proteinReference.capped) {
    addReason(
      output.reasons,
      reasonCodes,
      "PROTEIN_REFERENCE_WEIGHT_CAPPED",
    );
  }

  const proteinFactor = calculateProteinFactor(
    nutritionPlanningSnapshot,
    nutritionEnergyTarget,
  );
  const desiredProteinG = roundToNearest5(
    proteinReference.referenceWeightKg * proteinFactor,
  );
  const wholeGramEnergyCap = Math.floor(
    nutritionEnergyTarget.target_calories * 0.3 / 4,
  );
  const proteinEnergyCapG = floorToNearest5(wholeGramEnergyCap);
  const proteinTargetG = Math.min(desiredProteinG, proteinEnergyCapG);
  const proteinCappedByEnergy = proteinEnergyCapG < desiredProteinG;

  if (proteinCappedByEnergy) {
    addReason(
      output.reasons,
      reasonCodes,
      "PROTEIN_ENERGY_CAP_APPLIED",
    );
  }

  const effectiveProteinFactor =
    proteinTargetG / proteinReference.referenceWeightKg;
  if (proteinCappedByEnergy && effectiveProteinFactor < 1.2) {
    output.status = NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(
      output.reasons,
      reasonCodes,
      "PROTEIN_TARGET_BELOW_POLICY_MINIMUM_REQUIRES_REVIEW",
    );
  }

  const proteinCalories = proteinTargetG * 4;
  const fatTargetG = roundToNearest5(
    nutritionEnergyTarget.target_calories * 0.25 / 9,
  );
  const fatCalories = fatTargetG * 9;
  const remainingCalories =
    nutritionEnergyTarget.target_calories - proteinCalories - fatCalories;
  if (remainingCalories <= 0) {
    throw new TypeError(
      "Macro policy failure: remaining carbohydrate calories must be positive.",
    );
  }

  const carbohydrateTargetG = Math.round(remainingCalories / 4);
  const carbohydrateCalories = carbohydrateTargetG * 4;
  const macroCaloriesTotal =
    proteinCalories + fatCalories + carbohydrateCalories;
  const calorieDifference =
    macroCaloriesTotal - nutritionEnergyTarget.target_calories;
  if (calorieDifference < -2 || calorieDifference > 2) {
    throw new TypeError(
      "Macro policy failure: calorie_difference must be between -2 and 2 kcal.",
    );
  }

  output.protein = {
    target_g: proteinTargetG,
    factor_g_per_kg: roundToTwoDecimals(proteinFactor),
    reference_weight_kg: proteinReference.referenceWeightKg,
    reference_weight_basis: proteinReference.basis,
    energy_cap_g: proteinEnergyCapG,
    capped_by_energy_budget: proteinCappedByEnergy,
    calories: proteinCalories,
    percent_of_calories: roundToOneDecimal(
      proteinCalories / nutritionEnergyTarget.target_calories * 100,
    ),
  };
  output.fat = {
    target_g: fatTargetG,
    calories: fatCalories,
    percent_of_calories: roundToOneDecimal(
      fatCalories / nutritionEnergyTarget.target_calories * 100,
    ),
  };
  output.carbohydrate = {
    target_g: carbohydrateTargetG,
    calories: carbohydrateCalories,
    percent_of_calories: roundToOneDecimal(
      carbohydrateCalories / nutritionEnergyTarget.target_calories * 100,
    ),
  };
  output.fiber_target_g = calculateFiberTarget(nutritionPlanningSnapshot);
  output.macro_calories_total = macroCaloriesTotal;
  output.calorie_difference = calorieDifference;

  return finalize(output);
}
