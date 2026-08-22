import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateIntake } from "z-coaching-intake-decision-engine";
import {
  buildNutritionEnergyTarget,
} from "z-coaching-intake-decision-engine/nutrition-energy-target";
import * as nutritionEngineApi from
  "z-coaching-intake-decision-engine/nutrition-engine";
import {
  buildNutritionFoodSelection,
} from "z-coaching-intake-decision-engine/nutrition-food-selection";
import {
  buildNutritionMacroTargets,
} from "z-coaching-intake-decision-engine/nutrition-macro-targets";
import {
  buildNutritionMealAssemblyBlueprint,
} from "z-coaching-intake-decision-engine/nutrition-meal-assembly-blueprint";
import {
  buildNutritionMealDistribution,
} from "z-coaching-intake-decision-engine/nutrition-meal-distribution";
import {
  evaluateNutritionPlanPreflight,
} from "z-coaching-intake-decision-engine/nutrition-plan-preflight";
import {
  buildNutritionPlanningSnapshot,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  buildNutritionPortionSolver,
} from "z-coaching-intake-decision-engine/nutrition-portion-solver";
import {
  buildNutritionSwapEngine,
} from "z-coaching-intake-decision-engine/nutrition-swap-engine";

const {
  NUTRITION_ENGINE_VERSION,
  NutritionEnginePolicy,
  NutritionEngineStatus,
  buildNutritionEngine,
} = nutritionEngineApi;

const STAGE_KEYS = Object.freeze([
  "intake_decision",
  "planning_snapshot",
  "energy_target",
  "macro_targets",
  "meal_distribution",
  "meal_assembly_blueprint",
  "food_selection",
  "portion_solver",
  "swap_engine",
  "plan_preflight",
]);

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

const BASE_INPUTS = Object.freeze({
  intake: readJson(new URL("../examples/full-intake.json", import.meta.url)),
  evaluationContext: readJson(
    new URL("../examples/evaluation-context.json", import.meta.url),
  ),
  nutritionFoodCatalog: readJson(
    new URL(
      "../data/catalogs/core-global-food-batch-v1.json",
      import.meta.url,
    ),
  ),
});

function coreInputs() {
  return structuredClone(BASE_INPUTS);
}

function readyInputs() {
  const inputs = coreInputs();
  inputs.intake.personal.sex = "MALE";
  inputs.intake.nutrition.preferredMealCount = 2;
  inputs.intake.body.weightKg = 50;
  inputs.intake.body.heightCm = 155;
  inputs.intake.lifestyle.dailyActivity = "SEDENTARY";
  return inputs;
}

function withheldInputs() {
  const inputs = coreInputs();
  inputs.intake.medical.dangerousSymptoms.chestPainOrPressure = "YES";
  return inputs;
}

function runPublicPipeline({
  intake,
  evaluationContext,
  nutritionFoodCatalog,
}) {
  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const planningSnapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const energyTarget = buildNutritionEnergyTarget(planningSnapshot);
  const macroTargets = buildNutritionMacroTargets({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionEnergyTarget: energyTarget,
  });
  const mealDistribution = buildNutritionMealDistribution({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionMacroTargets: macroTargets,
  });
  const mealAssemblyBlueprint = buildNutritionMealAssemblyBlueprint({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionMealDistribution: mealDistribution,
  });
  const foodSelection = buildNutritionFoodSelection({
    nutritionPlanningSnapshot: planningSnapshot,
    nutritionMealAssemblyBlueprint: mealAssemblyBlueprint,
    nutritionFoodCatalog,
  });
  const portionSolver = buildNutritionPortionSolver({
    nutritionFoodSelection: foodSelection,
    nutritionFoodCatalog,
  });
  const swapEngine = buildNutritionSwapEngine({
    nutritionFoodSelection: foodSelection,
    nutritionPortionSolver: portionSolver,
    nutritionFoodCatalog,
  });
  const planPreflight = evaluateNutritionPlanPreflight({
    nutritionFoodSelection: foodSelection,
    nutritionPortionSolver: portionSolver,
    nutritionSwapEngine: swapEngine,
    nutritionFoodCatalog,
  });

  return {
    intake_decision: intakeDecision,
    planning_snapshot: planningSnapshot,
    energy_target: energyTarget,
    macro_targets: macroTargets,
    meal_distribution: mealDistribution,
    meal_assembly_blueprint: mealAssemblyBlueprint,
    food_selection: foodSelection,
    portion_solver: portionSolver,
    swap_engine: swapEngine,
    plan_preflight: planPreflight,
  };
}

function assertDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return;
  }
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const key of Reflect.ownKeys(value)) {
    assertDeepFrozen(value[key], seen);
  }
}

function assertSourceVersionLinks(stages) {
  assert.equal(
    stages.food_selection.source_food_catalog_version,
    "nutrition-food-catalog-v1",
  );
  assert.equal(
    stages.portion_solver.source_food_catalog_version,
    stages.food_selection.source_food_catalog_version,
  );
  assert.equal(
    stages.swap_engine.source_food_catalog_version,
    stages.food_selection.source_food_catalog_version,
  );
  assert.equal(
    stages.plan_preflight.source_food_catalog_version,
    stages.food_selection.source_food_catalog_version,
  );
  assert.equal(
    stages.energy_target.source_snapshot_version,
    stages.planning_snapshot.snapshot_version,
  );
  assert.equal(
    stages.macro_targets.source_snapshot_version,
    stages.planning_snapshot.snapshot_version,
  );
  assert.equal(
    stages.macro_targets.source_energy_target_version,
    stages.energy_target.energy_target_version,
  );
  assert.equal(
    stages.meal_distribution.source_snapshot_version,
    stages.planning_snapshot.snapshot_version,
  );
  assert.equal(
    stages.meal_distribution.source_macro_targets_version,
    stages.macro_targets.macro_targets_version,
  );
  assert.equal(
    stages.meal_assembly_blueprint.source_snapshot_version,
    stages.planning_snapshot.snapshot_version,
  );
  assert.equal(
    stages.meal_assembly_blueprint.source_meal_distribution_version,
    stages.meal_distribution.meal_distribution_version,
  );
  assert.equal(
    stages.food_selection.source_snapshot_version,
    stages.planning_snapshot.snapshot_version,
  );
  assert.equal(
    stages.food_selection.source_assembly_blueprint_version,
    stages.meal_assembly_blueprint.assembly_blueprint_version,
  );
  assert.equal(
    stages.portion_solver.source_food_selection_version,
    stages.food_selection.food_selection_version,
  );
  assert.equal(
    stages.swap_engine.source_food_selection_version,
    stages.food_selection.food_selection_version,
  );
  assert.equal(
    stages.swap_engine.source_portion_solver_version,
    stages.portion_solver.portion_solver_version,
  );
  assert.equal(
    stages.plan_preflight.source_food_selection_version,
    stages.food_selection.food_selection_version,
  );
  assert.equal(
    stages.plan_preflight.source_portion_solver_version,
    stages.portion_solver.portion_solver_version,
  );
  assert.equal(
    stages.plan_preflight.source_swap_engine_version,
    stages.swap_engine.swap_engine_version,
  );
}

test("public API exposes only the approved Nutrition Engine entries", async () => {
  assert.deepEqual(Object.keys(nutritionEngineApi).sort(), [
    "NUTRITION_ENGINE_VERSION",
    "NutritionEnginePolicy",
    "NutritionEngineStatus",
    "buildNutritionEngine",
  ]);
  assert.equal(NUTRITION_ENGINE_VERSION, "nutrition-engine-v1");
  assert.deepEqual(Object.values(NutritionEnginePolicy), [
    "Z_COACHING_NUTRITION_ENGINE_V1",
  ]);
  assert.deepEqual(Object.values(NutritionEngineStatus), [
    "READY",
    "REVIEW_REQUIRED",
    "WITHHELD",
  ]);
  assert.equal(Object.isFrozen(NutritionEnginePolicy), true);
  assert.equal(Object.isFrozen(NutritionEngineStatus), true);

  const packageApi = await import(
    "z-coaching-intake-decision-engine/nutrition-engine"
  );
  assert.equal(packageApi.buildNutritionEngine, buildNutritionEngine);
});

test("facade validates only the four required object shells", () => {
  const valid = coreInputs();
  assert.throws(
    () => buildNutritionEngine(),
    { name: "TypeError", message: "inputs must be an object." },
  );
  assert.throws(
    () => buildNutritionEngine([]),
    { name: "TypeError", message: "inputs must be an object." },
  );
  assert.throws(
    () => buildNutritionEngine({ ...valid, intake: null }),
    { name: "TypeError", message: "intake must be an object." },
  );
  assert.throws(
    () => buildNutritionEngine({ ...valid, evaluationContext: "invalid" }),
    { name: "TypeError", message: "evaluationContext must be an object." },
  );
  assert.throws(
    () => buildNutritionEngine({ ...valid, nutritionFoodCatalog: [] }),
    { name: "TypeError", message: "nutritionFoodCatalog must be an object." },
  );
});

test("facade executes all ten public stages in the approved order", () => {
  const result = buildNutritionEngine(coreInputs());
  assert.deepEqual(Object.keys(result.stages), STAGE_KEYS);
  assert.equal(result.stages.intake_decision.plan_status, "READY_FOR_DRAFT");
  assert.equal(
    result.stages.plan_preflight.nutrition_plan_preflight_version,
    "nutrition-plan-preflight-v1",
  );
});

test("every complete public stage output is linked and copied unchanged", () => {
  const inputs = coreInputs();
  const expectedStages = runPublicPipeline(structuredClone(inputs));
  const result = buildNutritionEngine(inputs);

  assert.deepEqual(result.stages, expectedStages);
  assertSourceVersionLinks(result.stages);
  for (const key of STAGE_KEYS) {
    assert.notEqual(result.stages[key], expectedStages[key]);
  }
});

test("output contract contains source versions without embedding the catalog", () => {
  const result = buildNutritionEngine(coreInputs());
  assert.deepEqual(Object.keys(result), [
    "nutrition_engine_version",
    "source_food_catalog_version",
    "status",
    "engine_policy",
    "ready_for_coach_review",
    "stages",
  ]);
  assert.equal(result.nutrition_engine_version, NUTRITION_ENGINE_VERSION);
  assert.equal(result.source_food_catalog_version, "nutrition-food-catalog-v1");
  assert.equal(
    result.engine_policy,
    NutritionEnginePolicy.Z_COACHING_NUTRITION_ENGINE_V1,
  );
  assert.equal("nutritionFoodCatalog" in result, false);
  assert.equal("nutrition_food_catalog" in result.stages, false);
  for (const stage of Object.values(result.stages)) {
    assert.equal("items_count" in stage, false);
    assert.equal("swap_groups" in stage, false);
  }
});

test("a genuinely ready public pipeline propagates READY unchanged", () => {
  const result = buildNutritionEngine(readyInputs());
  assert.equal(result.stages.plan_preflight.status, "READY");
  assert.equal(result.status, NutritionEngineStatus.READY);
  assert.equal(result.ready_for_coach_review, true);
  assert.equal(
    result.ready_for_coach_review,
    result.stages.plan_preflight.ready_for_coach_review,
  );
});

test("Core Global integration retains REVIEW_REQUIRED for fiber_g", () => {
  const result = buildNutritionEngine(coreInputs());
  assert.equal(result.status, NutritionEngineStatus.REVIEW_REQUIRED);
  assert.equal(result.ready_for_coach_review, true);
  assert.equal(result.stages.plan_preflight.status, "REVIEW_REQUIRED");
  assert.deepEqual(
    result.stages.plan_preflight.issues.map((issue) => ({
      code: issue.code,
      source_stage: issue.source_stage,
      meal_sequence: issue.meal_sequence,
      fields: issue.fields,
    })),
    [
      {
        code: "PREFLIGHT_MEAL_TARGET_OUTSIDE_TOLERANCE",
        source_stage: "PORTION_SOLVER",
        meal_sequence: 3,
        fields: ["fiber_g"],
      },
      {
        code: "PREFLIGHT_DAILY_TARGET_OUTSIDE_TOLERANCE",
        source_stage: "PLAN_PREFLIGHT",
        meal_sequence: null,
        fields: ["fiber_g"],
      },
    ],
  );
  assert.equal(
    result.ready_for_coach_review,
    result.stages.plan_preflight.ready_for_coach_review,
  );
});

test("medical-review intake propagates WITHHELD through the full pipeline", () => {
  const result = buildNutritionEngine(withheldInputs());
  assert.equal(result.stages.intake_decision.plan_status,
    "MEDICAL_REVIEW_REQUIRED");
  assert.equal(result.stages.energy_target.status, "WITHHELD");
  assert.equal(result.stages.food_selection.status, "WITHHELD");
  assert.equal(result.stages.portion_solver.status, "WITHHELD");
  assert.equal(result.stages.swap_engine.status, "WITHHELD");
  assert.equal(result.stages.plan_preflight.status, "WITHHELD");
  assert.equal(result.status, NutritionEngineStatus.WITHHELD);
  assert.equal(result.ready_for_coach_review, false);
  assert.equal(
    result.ready_for_coach_review,
    result.stages.plan_preflight.ready_for_coach_review,
  );
});

test("upstream TypeError is exposed without conversion or message loss", () => {
  const inputs = coreInputs();
  inputs.nutritionFoodCatalog.food_catalog_version = "invalid-version";
  assert.throws(
    () => buildNutritionEngine(inputs),
    {
      name: "TypeError",
      message:
        "nutritionFoodCatalog.food_catalog_version must equal nutrition-food-catalog-v1.",
    },
  );
});

test("inputs remain mutable and unchanged while output is deeply frozen", () => {
  const inputs = coreInputs();
  const inputSnapshot = structuredClone(inputs);
  const result = buildNutritionEngine(inputs);

  assert.deepEqual(inputs, inputSnapshot);
  assert.equal(Object.isFrozen(inputs), false);
  assert.equal(Object.isFrozen(inputs.intake), false);
  assert.equal(Object.isFrozen(inputs.evaluationContext), false);
  assert.equal(Object.isFrozen(inputs.nutritionFoodCatalog), false);
  assertDeepFrozen(result);
  assert.throws(() => {
    result.stages.intake_decision.plan_status = "CHANGED";
  }, TypeError);
});

test("changing inputs after execution cannot change the engine output", () => {
  const inputs = coreInputs();
  const result = buildNutritionEngine(inputs);
  const outputSnapshot = structuredClone(result);

  inputs.intake.personal.sex = "MALE";
  inputs.evaluationContext.assessmentDate = "2026-07-19";
  inputs.nutritionFoodCatalog.items[0].name_en = "Changed after run";

  assert.deepEqual(result, outputSnapshot);
});

test("identical inputs produce deterministic outputs", () => {
  const inputs = coreInputs();
  assert.deepEqual(
    buildNutritionEngine(inputs),
    buildNutritionEngine(inputs),
  );
});

test("catalog item order does not change the engine output", () => {
  const forward = coreInputs();
  const reverse = coreInputs();
  reverse.nutritionFoodCatalog.items.reverse();

  assert.deepEqual(
    buildNutritionEngine(forward),
    buildNutritionEngine(reverse),
  );
});
