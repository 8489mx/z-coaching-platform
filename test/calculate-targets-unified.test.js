/* S4-7: the coach macro calculator must store the backend's universal
   targets, never a second formula's numbers. The calculator page used to run
   the metabolic engine in the browser (additive activity factors, fixed
   2.2 g/kg protein, no calorie floor, no kidney/diabetes guards) and POST the
   result into the stored program through update-custom, where the shape-only
   sync stored it as-is. The unified path is a backend endpoint that loads the
   client's stored intake, evaluates it, and runs the exact function program
   generation uses (calculateUniversalNutritionTargets) with the coach's fresh
   measurements overlaid. These tests prove the pure core of that path in this
   clone: same numbers as generation on the fixture, fresh measurements flow
   through, invalid measurements fail closed without silent fallbacks, and a
   medical-review or blocked intake is refused before any number is computed.
   The HTTP handler itself needs a live database run (role check, intake load,
   scope gate); its wiring is pinned here by source guards only, in the style
   of test/generate-program-medical-review-gate.test.js. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildClientTargets } from "../src/api/utils/calculateClientTargets.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(
  fs.readFileSync(path.join(root, "data/catalogs/core-global-food-batch-v1.json"), "utf8")
);
const EVALUATION_CONTEXT = {
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
};

function generationTargets() {
  const master = buildMasterEngineV2({
    intake: completeIntake(),
    evaluationContext: EVALUATION_CONTEXT,
    nutritionFoodCatalog: CATALOG,
    options: { weeksCount: 5, muscleBias: "QUADS" },
  });
  return master.nutrition_program.targets;
}

const COMPARED_KEYS = [
  "bmr",
  "bmr_formula",
  "activity_factor",
  "tdee",
  "target_calories_kcal",
  "protein_g",
  "carbohydrate_g",
  "fat_g",
  "water_liters",
  "calorie_floor_applied",
];

test("S4-7: calculator targets equal program-generation targets on the same intake", () => {
  const fromGeneration = generationTargets();
  const fromCalculator = buildClientTargets({
    answers: completeIntake(),
    measurements: { weight_kg: 82, height_cm: 178 },
    assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
  });
  assert.equal(fromCalculator.targets.target_source, "UNIVERSAL_TARGETS");
  for (const key of COMPARED_KEYS) {
    assert.deepEqual(
      fromCalculator.targets[key],
      fromGeneration[key],
      `calculator and generation must agree on ${key}`
    );
  }
  assert.equal(fromCalculator.plan_status, "READY_FOR_DRAFT");
  assert.deepEqual(fromCalculator.inputs_used.weight_kg, 82);
  assert.deepEqual(fromCalculator.inputs_used.height_cm, 178);
});

test("S4-7: a fresh weight and a steps override flow through the same engine", () => {
  const base = buildClientTargets({
    answers: completeIntake(),
    measurements: { weight_kg: 82, height_cm: 178 },
    assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
  });
  const heavier = buildClientTargets({
    answers: completeIntake(),
    measurements: { weight_kg: 90, height_cm: 178 },
    assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
  });
  assert.notEqual(heavier.targets.target_calories_kcal, base.targets.target_calories_kcal);
  assert.notEqual(heavier.targets.protein_g, base.targets.protein_g);
  assert.equal(heavier.inputs_used.weight_kg, 90);

  const active = buildClientTargets({
    answers: completeIntake(),
    measurements: { weight_kg: 82, height_cm: 178, average_daily_steps: 12000 },
    assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
  });
  assert.equal(active.targets.activity_factor, 1.7);
  assert.equal(active.inputs_used.average_daily_steps, 12000);
});

test("S4-7: invalid measurements fail closed, never fall back silently", () => {
  const answers = completeIntake();
  // The intake itself carries a weight: a missing coach measurement must
  // still throw rather than silently reuse the stale intake weight.
  assert.throws(
    () => buildClientTargets({ answers, measurements: { height_cm: 178 }, assessmentDate: ASSESSMENT_CONTEXT.assessmentDate }),
    (err) => err.code === "INVALID_MEASUREMENTS"
  );
  assert.throws(
    () => buildClientTargets({ answers, measurements: { weight_kg: 10, height_cm: 178 }, assessmentDate: ASSESSMENT_CONTEXT.assessmentDate }),
    (err) => err.code === "INVALID_MEASUREMENTS"
  );
  assert.throws(
    () => buildClientTargets({ answers, measurements: { weight_kg: 82, height_cm: 0 }, assessmentDate: ASSESSMENT_CONTEXT.assessmentDate }),
    (err) => err.code === "INVALID_MEASUREMENTS"
  );
  assert.throws(
    () => buildClientTargets({ answers, measurements: { weight_kg: 82, height_cm: 178, body_fat_percent: 150 }, assessmentDate: ASSESSMENT_CONTEXT.assessmentDate }),
    (err) => err.code === "INVALID_MEASUREMENTS"
  );
  assert.throws(
    () => buildClientTargets({ answers, measurements: { weight_kg: 82, height_cm: 178, average_daily_steps: -5 }, assessmentDate: ASSESSMENT_CONTEXT.assessmentDate }),
    (err) => err.code === "INVALID_MEASUREMENTS"
  );

  // No date of birth in the intake and no coach age: the engine's silent
  // 28-year-old default must never be reached from this path.
  const noDob = completeIntake();
  delete noDob.personal.dateOfBirth;
  assert.throws(
    () => buildClientTargets({ answers: noDob, measurements: { weight_kg: 82, height_cm: 178 }, assessmentDate: ASSESSMENT_CONTEXT.assessmentDate }),
    (err) => err.code === "INVALID_MEASUREMENTS"
  );
  // With an explicit coach age the same intake computes fine.
  const withAge = buildClientTargets({
    answers: noDob,
    measurements: { weight_kg: 82, height_cm: 178, age: 36 },
    assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
  });
  assert.ok(withAge.targets.target_calories_kcal > 0);
});

test("S4-7: a medical-review intake is refused before any number is computed", () => {
  const answers = completeIntake();
  answers.dangerous_symptoms = ["CHEST_PAIN"];
  assert.throws(
    () =>
      buildClientTargets({
        answers,
        measurements: { weight_kg: 82, height_cm: 178 },
        assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
      }),
    (err) => err.code === "MEDICAL_REVIEW_REQUIRED" && Array.isArray(err.reasons) && err.reasons.length > 0
  );
});

test("S4-7: a blocked intake is refused before any number is computed", () => {
  const answers = completeIntake();
  answers.personal.dateOfBirth = "2015-01-01";
  answers.personal.guardianConsent = null;
  assert.throws(
    () =>
      buildClientTargets({
        answers,
        measurements: { weight_kg: 82, height_cm: 178 },
        assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
      }),
    (err) => err.code === "BLOCKED"
  );
});

test("S4-7: the endpoint is wired coach-only and the page calls it, not the browser engine", () => {
  const routes = fs.readFileSync(path.join(root, "src/api/routes/program.routes.js"), "utf8");
  assert.ok(routes.includes('"/calculate-targets"'), "route must exist");
  assert.ok(routes.includes("calculateTargetsHandler"), "route must use the handler");
  assert.ok(routes.includes("requireAuth"), "route must require auth");

  const controller = fs.readFileSync(
    path.join(root, "src/api/controllers/program.controller.js"),
    "utf8"
  );
  const start = controller.indexOf("export const calculateTargetsHandler =");
  assert.ok(start >= 0, "handler must exist");
  const end = controller.indexOf("export const", start + 10);
  const body = controller.slice(start, end > start ? end : undefined);
  assert.ok(body.includes('["COACH", "ADMIN"]'), "handler must re-read the role and allow COACH/ADMIN only");
  assert.ok(body.includes("buildClientTargets"), "handler must compute through the unified helper");
  assert.ok(body.includes("loadLatestIntakeAnswers"), "handler must load the stored intake");
  assert.ok(body.includes("resolveIntakeMedicalReview"), "handler must run the medical-review gate");
  assert.ok(body.includes("assessServiceScope"), "handler must run the service-scope gate");

  const page = fs.readFileSync(path.join(root, "frontend/src/pages/MacroCalculator.jsx"), "utf8");
  assert.ok(!page.includes("calculateMetabolicMacroProfile"), "page must not call the browser engine");
  assert.ok(!page.includes("metabolicMacroEngine"), "page must not import the browser engine");
  assert.ok(!page.includes("DAILY_ACTIVITY_FACTORS"), "page must not use the browser activity factors");
  assert.ok(!page.includes("GOAL_CALORIE_MULTIPLIERS"), "page must not use the browser goal multipliers");
  assert.ok(page.includes("/programs/calculate-targets"), "page must call the backend endpoint");
  assert.ok(page.includes("/programs/update-custom"), "apply must still save through update-custom");

  // The engine itself stays: a tested pure function with a backend re-export.
  // Only its place on the save path is removed.
  assert.ok(fs.existsSync(path.join(root, "frontend/src/utils/metabolicMacroEngine.js")));
  assert.ok(fs.existsSync(path.join(root, "src/execution-engines/metabolic-macro-engine.js")));
});
