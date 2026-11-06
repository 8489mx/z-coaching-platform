import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { trainingProfileFromAnswers } from "../src/api/services/clientTrainingProfile.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { getExerciseV2ByCode } from "../src/exercise-catalog-v2/index.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildNutritionEnergyTarget } from "z-coaching-intake-decision-engine/nutrition-energy-target";
import { buildNutritionFoodCatalog } from "z-coaching-intake-decision-engine/nutrition-food-catalog";
import * as foodSelectionApi from "z-coaching-intake-decision-engine/nutrition-food-selection";
import { buildNutritionMacroTargets } from "z-coaching-intake-decision-engine/nutrition-macro-targets";
import { buildNutritionMealAssemblyBlueprint } from "z-coaching-intake-decision-engine/nutrition-meal-assembly-blueprint";
import { buildNutritionMealDistribution } from "z-coaching-intake-decision-engine/nutrition-meal-distribution";
import { buildNutritionPlanningSnapshot } from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";

const { buildNutritionFoodSelection } = foodSelectionApi;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" });
const EVAL_CTX = JSON.parse(readFileSync(new URL("../examples/evaluation-context.json", import.meta.url), "utf8"));
const DAIRY_CODE = /YOGURT|CHEESE|MILK|DAIRY|LABNEH|LABAN|HALLOUMI|MOZZARELLA|COTTAGE_CHEESE|WHEY|GHEE|BUTTER/;
const isDairyCode = (code) => DAIRY_CODE.test(String(code || "").toUpperCase());

// The flat public form payload (same shape the form posts): a 41-year-old man,
// fat loss, intermediate, 4 days a week. The machines-only client is C08.
const FLAT = {
  gender: "male", age: "41", height_cm: "176", weight_kg: "88",
  circumferences: { neck_cm: "40", waist_cm: "96", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM",
  meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
  training_logistics: { days_per_week: 4, experience_level: "intermediate" },
  recent_training: "ACTIVE", training_environment: "commercial_gym",
  strict_allergies: [],
};

// The engine's own rule (build-training-mesocycle.js): the available set always
// adds BODYWEIGHT to the declared equipment.
const MACHINES_AVAILABLE = new Set(["SELECTORIZED_MACHINES", "BODYWEIGHT"]);
function equipmentViolation(code) {
  if (!code || String(code).startsWith("HELD_SLOT")) return null;
  const record = getExerciseV2ByCode(code);
  if (record && !(record.equipment_requirements || []).every((req) => MACHINES_AVAILABLE.has(String(req.equipment_code).toUpperCase()))) {
    return `catalog requires ${(record.equipment_requirements || []).map((r) => r.equipment_code).join(",")}`;
  }
  const named = String(code).toUpperCase();
  for (const [rx, need] of [[/DUMBBELL/, "DUMBBELLS"], [/BARBELL/, "BARBELL_AND_PLATES"], [/CABLE/, "CABLE_STATION"], [/MACHINE/, "SELECTORIZED_MACHINES"], [/SMITH/, "SMITH_MACHINE"]]) {
    if (rx.test(named) && !MACHINES_AVAILABLE.has(need)) return `name implies ${need}`;
  }
  return null;
}
function trainingViolations(program) {
  const weeks = program.training_program?.weeks || [];
  const violations = [];
  let total = 0;
  for (const [wi, week] of weeks.entries()) {
    for (const session of week.sessions || []) {
      for (const ex of session.exercises || []) {
        const code = ex.exercise_code || ex.code;
        if (!code || String(code).startsWith("HELD_SLOT")) continue;
        total++;
        const reason = equipmentViolation(code);
        if (reason) violations.push({ week: wi + 1, code, reason });
      }
    }
  }
  return { total, violations };
}

// --- 1. Machines-only reaches the engine as exactly one piece of equipment ---
test("intake form gaps: machines_only adapts to a gym with selectorized machines only", () => {
  const adapted = adaptIntakePayloadToCanonicalEngine({ ...FLAT, training_environment: "machines_only" });
  assert.equal(adapted.training.location, "GYM", "machines-only is still a gym location");
  assert.deepEqual(
    (adapted.training.equipment || []).map((e) => e.equipmentCode),
    ["SELECTORIZED_MACHINES"],
    "no free weights may be declared for a machines-only client",
  );
});

test("intake form gaps: commercial_gym still adapts to the full room", () => {
  const adapted = adaptIntakePayloadToCanonicalEngine({ ...FLAT, training_environment: "commercial_gym" });
  assert.equal(adapted.training.location, "GYM");
  assert.deepEqual(
    (adapted.training.equipment || []).map((e) => e.equipmentCode),
    ["DUMBBELLS", "BARBELL_AND_PLATES", "CABLE_STATION", "SELECTORIZED_MACHINES", "BODYWEIGHT"],
    "the full-gym default must not shrink",
  );
});

test("intake form gaps: home options still adapt to their own equipment sets", () => {
  const homeGym = adaptIntakePayloadToCanonicalEngine({ ...FLAT, training_environment: "home_gym" });
  assert.equal(homeGym.training.location, "HOME");
  assert.deepEqual(
    (homeGym.training.equipment || []).map((e) => e.equipmentCode),
    ["DUMBBELLS", "ADJUSTABLE_BENCH", "RESISTANCE_BANDS", "BODYWEIGHT"],
  );
  const minimal = adaptIntakePayloadToCanonicalEngine({ ...FLAT, training_environment: "minimal_equipment" });
  assert.equal(minimal.training.location, "HOME");
  assert.deepEqual(
    (minimal.training.equipment || []).map((e) => e.equipmentCode),
    ["DUMBBELLS", "RESISTANCE_BANDS", "BODYWEIGHT"],
  );
  const bands = adaptIntakePayloadToCanonicalEngine({ ...FLAT, training_environment: "calisthenics_bands" });
  assert.equal(bands.training.location, "HOME");
  assert.deepEqual(
    (bands.training.equipment || []).map((e) => e.equipmentCode),
    ["BODYWEIGHT", "RESISTANCE_BANDS"],
  );
});

// --- 2. The lactose tick becomes a real intolerance ---
test("intake form gaps: the dairy_lactose tick becomes a LACTOSE intolerance", () => {
  const adapted = adaptIntakePayloadToCanonicalEngine({ ...FLAT, strict_allergies: ["dairy_lactose"] });
  const intolerances = adapted.nutrition?.intolerances || [];
  const lactose = intolerances.find((i) => String(i.substance).toUpperCase() === "LACTOSE");
  assert.ok(lactose, `intolerances must carry LACTOSE, got: ${JSON.stringify(intolerances)}`);
  assert.equal(lactose.medicallyDiagnosed, false, "a form tick is self-reported, never stamped as diagnosed");
});

test("intake form gaps: a canonical DAIRY_LACTOSE exclusion also becomes a LACTOSE intolerance", () => {
  const adapted = adaptIntakePayloadToCanonicalEngine({
    ...FLAT,
    nutrition: { preferredMealCount: 4, allergies: [], excludedFoodsList: ["DAIRY_LACTOSE"], dislikedFoods: [], digestiveIssues: [], budget: "MEDIUM" },
  });
  const intolerances = adapted.nutrition?.intolerances || [];
  assert.ok(
    intolerances.some((i) => String(i.substance).toUpperCase() === "LACTOSE"),
    `canonical DAIRY_LACTOSE must become a LACTOSE intolerance, got: ${JSON.stringify(intolerances)}`,
  );
});

test("intake form gaps: no dairy tick means no phantom intolerance", () => {
  const adapted = adaptIntakePayloadToCanonicalEngine({ ...FLAT, strict_allergies: ["peanuts_tree_nuts"] });
  assert.deepEqual(adapted.nutrition?.intolerances || [], [], "only a lactose declaration may create a lactose intolerance");
});

// --- 3. The form itself offers the option, and the swap setup knows it ---
test("intake form gaps: the public form offers a machines-only option", () => {
  const form = readFileSync(path.join(ROOT, "frontend/src/pages/FullIntakeForm.jsx"), "utf8");
  assert.ok(form.includes("machines_only"), "FullIntakeForm must offer a machines_only training environment");
  assert.ok(form.includes("جيم أجهزة فقط"), "the machines-only option must carry its Arabic title");
});

test("intake form gaps: the swap engine reads machines_only as a gym setup", () => {
  assert.equal(trainingProfileFromAnswers({ training_environment: "machines_only" }).setup, "GYM");
  assert.equal(trainingProfileFromAnswers({ training_environment: "commercial_gym" }).setup, "GYM");
  assert.equal(trainingProfileFromAnswers({ training_environment: "calisthenics_bands" }).setup, "BANDS");
});

// --- 4. The intolerance layer itself fires in the real pipeline ---
function buildRealPipelineSelection(intake) {
  const intakeDecision = evaluateIntake(intake, EVAL_CTX);
  const snapshot = buildNutritionPlanningSnapshot({ intake, evaluationContext: EVAL_CTX, intakeDecision });
  const energyTarget = buildNutritionEnergyTarget(snapshot);
  const macroTargets = buildNutritionMacroTargets({ nutritionPlanningSnapshot: snapshot, nutritionEnergyTarget: energyTarget });
  const mealDistribution = buildNutritionMealDistribution({ nutritionPlanningSnapshot: snapshot, nutritionMacroTargets: macroTargets });
  const blueprint = buildNutritionMealAssemblyBlueprint({ nutritionPlanningSnapshot: snapshot, nutritionMealDistribution: mealDistribution });
  const selection = buildNutritionFoodSelection({ nutritionPlanningSnapshot: snapshot, nutritionMealAssemblyBlueprint: blueprint, nutritionFoodCatalog: CATALOG });
  return { snapshot, selection };
}

test("intake form gaps: the pipeline rejects dairy with INTOLERANCE_EXCLUDED for a lactose client", () => {
  const catalog = CATALOG.items || CATALOG;
  const foodClassByCode = new Map(catalog.map((item) => [item.food_code, item.food_class]));

  const lactose = buildRealPipelineSelection(
    adaptIntakePayloadToCanonicalEngine({ ...FLAT, strict_allergies: ["dairy_lactose"] }),
  );
  const snapshotIntolerances = lactose.snapshot.food_restrictions?.intolerances || lactose.snapshot.nutrition?.intolerances || [];
  assert.ok(
    snapshotIntolerances.some((i) => String(i.substance || i).toUpperCase() === "LACTOSE"),
    `the snapshot must carry the LACTOSE intolerance, got: ${JSON.stringify(snapshotIntolerances)}`,
  );
  const dairyRejections = lactose.selection.meals
    .flatMap((m) => m.slots || [])
    .flatMap((s) => s.rejected_foods || [])
    .filter((f) => foodClassByCode.get(f.food_code) === "DAIRY_PROTEIN");
  assert.ok(dairyRejections.length > 0, "dairy foods must be rejected from the lactose client's selection");
  for (const rejected of dairyRejections) {
    assert.ok(
      (rejected.reason_codes || []).includes("INTOLERANCE_EXCLUDED"),
      `${rejected.food_code} must be rejected with INTOLERANCE_EXCLUDED, got: ${(rejected.reason_codes || []).join(",")}`,
    );
  }

  // Control: the same client without the tick gets no intolerance rejection.
  const control = buildRealPipelineSelection(adaptIntakePayloadToCanonicalEngine({ ...FLAT }));
  const controlIntolerances = control.snapshot.food_restrictions?.intolerances || control.snapshot.nutrition?.intolerances || [];
  assert.deepEqual(controlIntolerances, [], "the control snapshot must carry no intolerance");
  const controlDairy = control.selection.meals
    .flatMap((m) => m.slots || [])
    .flatMap((s) => s.rejected_foods || [])
    .filter((f) => foodClassByCode.get(f.food_code) === "DAIRY_PROTEIN");
  assert.equal(
    controlDairy.some((f) => (f.reason_codes || []).includes("INTOLERANCE_EXCLUDED")),
    false,
    "the control must reject no dairy food for intolerance",
  );
});

// --- 5. The full engine serves a machines-only program and a dairy-free plan ---
test("intake form gaps: a machines-only client gets zero free-weight exercises across all 5 weeks", () => {
  const program = buildMasterEngineV2({
    intake: { ...FLAT, training_environment: "machines_only" },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const { total, violations } = trainingViolations(program);
  assert.ok(total >= 50, `the plan must actually contain exercises, got ${total}`);
  assert.deepEqual(violations, [], `machines-only plan must need no free weights, got: ${JSON.stringify(violations.slice(0, 8))}`);
});

test("intake form gaps: the same client at a full gym still gets free-weight exercises (control)", () => {
  const program = buildMasterEngineV2({
    intake: { ...FLAT, training_environment: "commercial_gym" },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const { total, violations } = trainingViolations(program);
  assert.ok(total >= 50, `the control plan must actually contain exercises, got ${total}`);
  assert.ok(violations.length > 0, "the full-gym control must still prescribe free-weight work, or the machines test proves nothing");
});

test("intake form gaps: a lactose client gets zero dairy in served meals and swaps", () => {
  const program = buildMasterEngineV2({
    intake: { ...FLAT, strict_allergies: ["dairy_lactose"] },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const meals = program.nutrition_program?.culinary_meals || [];
  assert.ok(meals.length > 0, "the plan must have meals");
  const codes = meals.flatMap((meal) => (meal.items || []).flatMap((item) => [item.food_code, ...(item.swaps || []).map((s) => s.food_code)]));
  const dairy = [...new Set(codes)].filter(isDairyCode);
  assert.deepEqual(dairy, [], `lactose plan must serve and offer no dairy, got: ${dairy.join(", ")}`);

  // Control: the same client without the tick is still served dairy.
  const control = buildMasterEngineV2({
    intake: { ...FLAT, strict_allergies: ["none"] },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const controlMeals = control.nutrition_program?.culinary_meals || [];
  const controlCodes = controlMeals.flatMap((meal) => (meal.items || []).flatMap((item) => [item.food_code, ...(item.swaps || []).map((s) => s.food_code)]));
  assert.ok(
    controlCodes.some(isDairyCode),
    "the control must still serve dairy, or the lactose test proves nothing",
  );
});
