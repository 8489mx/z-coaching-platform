import test from "node:test";
import assert from "node:assert/strict";

import { evaluateCardioModality } from "../frontend/src/utils/cardioModalitySafety.js";

/** The coach's cardio choice is judged against the client's injuries, conditions and equipment. */
const ALL = ["incline_treadmill", "elliptical", "stationary_bike", "burpees_bodyweight", "mountain_climbers", "jump_rope", "stairmaster", "rowing_machine", "assault_bike", "brisk_walk"];
const allowed = (profile) => ALL.filter((id) => evaluateCardioModality(id, profile).allowed);

test("a healthy gym client can do anything", () => {
  assert.deepEqual(allowed({ training_environment: "commercial_gym" }), ALL);
});

test("a heavy client with a sore knee, high blood pressure and asthma keeps only low-impact steady cardio", () => {
  const ok = allowed({ injuries: ["knee"], conditions: ["hypertension", "asthma"], bmi: 39, training_environment: "commercial_gym" });
  for (const id of ["burpees_bodyweight", "jump_rope", "stairmaster", "assault_bike"]) assert.ok(!ok.includes(id), id);
  for (const id of ["incline_treadmill", "elliptical", "stationary_bike", "brisk_walk"]) assert.ok(ok.includes(id), id);
});

test("injuries written in Arabic count too, and each block says why", () => {
  const result = evaluateCardioModality("rowing_machine", { injuries: ["ظهر"] });
  assert.equal(result.allowed, false);
  assert.match(result.reasons_ar[0], /الظهر/);
});

test("a bands-only client is not given machines; a home gym only warns", () => {
  assert.deepEqual(allowed({ training_environment: "calisthenics_bands" }).sort(), ["brisk_walk", "burpees_bodyweight", "jump_rope", "mountain_climbers"].sort());
  const homeGym = evaluateCardioModality("stationary_bike", { training_environment: "home_gym" });
  assert.equal(homeGym.allowed, true);
  assert.ok(homeGym.warning_ar);
});

test("pregnancy blocks impact and maximal intensity", () => {
  const ok = allowed({ is_pregnant: true, training_environment: "commercial_gym" });
  for (const id of ["burpees_bodyweight", "jump_rope", "assault_bike", "mountain_climbers"]) assert.ok(!ok.includes(id), id);
  assert.ok(ok.includes("brisk_walk"));
});

test("the plan carries the client's intake summary the coach screens read", async () => {
  const fs = await import("node:fs");
  const { buildMasterEngineV2 } = await import("../src/master-engine-v2/index.js");
  const catalog = JSON.parse(fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"));
  const program = buildMasterEngineV2({
    intake: {
      gender: "male", age: "40", height_cm: "175", weight_kg: "120", circumferences: { neck_cm: "44", waist_cm: "120", hips_cm: "115" },
      primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected: ["hypertension", "asthma"] }, injuries_map: { has_injuries: true, selected_areas: ["knee", "spine_back"] },
      religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
      training_environment: "calisthenics_bands", training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: catalog,
    options: {},
  });
  const profile = program.client_profile;
  assert.deepEqual(profile.injuries, ["knee", "spine_back"]);
  assert.deepEqual(profile.conditions, ["hypertension", "asthma"]);
  assert.equal(profile.training_environment, "calisthenics_bands");
  assert.equal(profile.bmi, 39.2);
  assert.equal(evaluateCardioModality("jump_rope", profile).allowed, false);
});
