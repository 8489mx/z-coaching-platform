import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { generateSmartSwaps, buildAllergenContext } from "../src/nutrition-meal-context-v2/index.js";

/**
 * Swap lists put Gulf foods first (hamour, kingfish, camel): an Egyptian client who dislikes tuna
 * got hamour. The client's country (from the phone number, set by generate-draft) now lists the
 * local foods first; foreign ones stay in the list, after them. No country: order unchanged.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" };
const GULF = ["HAMOUR_FISH", "KANAAD_KINGFISH", "CAMEL_MEAT_LEAN"];
const intake = (extra = {}) => ({
  gender: "female", age: "30", height_cm: "165", weight_kg: "75", circumferences: { neck_cm: "33", waist_cm: "80", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
  ...extra,
});
const codes = (list) => list.map((s) => s.food_code);
const index = (list, code) => codes(list).indexOf(code);

test("an Egyptian client sees Egyptian fish before Gulf fish; a Saudi client the other way", () => {
  const eg = generateSmartSwaps("PROTEIN", 160, "CHICKEN_BREAST", "LUNCH", 10, buildAllergenContext({}, { client_country: "EG" }));
  assert.ok(index(eg, "TILAPIA_FISH") < index(eg, "HAMOUR_FISH"), codes(eg).join());
  assert.ok(index(eg, "BOURI_FISH") < index(eg, "KANAAD_KINGFISH"), codes(eg).join());
  assert.ok(eg.some((s) => s.food_code === "HAMOUR_FISH"), "Gulf fish stay in the list");
  const sa = generateSmartSwaps("PROTEIN", 160, "CHICKEN_BREAST", "LUNCH", 10, buildAllergenContext({}, { client_country: "SA" }));
  assert.ok(index(sa, "HAMOUR_FISH") < index(sa, "BOURI_FISH"), codes(sa).join());
});

test("no known country keeps the order", () => {
  assert.deepEqual(codes(generateSmartSwaps("PROTEIN", 160, "CHICKEN_BREAST", "LUNCH", 10, {})),
    codes(generateSmartSwaps("PROTEIN", 160, "CHICKEN_BREAST", "LUNCH", 10, buildAllergenContext({}, {}))));
});

test("an Egyptian client who dislikes chicken and tuna gets no Gulf food in the plan", () => {
  const program = buildMasterEngineV2({ intake: intake({ client_country: "EG", disliked_foods: ["صدور دجاج", "تونة"] }), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} });
  const items = program.nutrition_program.culinary_meals.flatMap((m) => m.items.map((i) => i.food_code));
  for (const code of GULF) assert.ok(!items.includes(code), `${code} in ${items.join(", ")}`);
});

test("generate-draft tells the engine the client's country", () => {
  const src = fs.readFileSync("src/api/controllers/intake.controller.js", "utf8");
  assert.match(src, /client_country: resolveCountryFromPhone\(submission\.user\?\.phone_number\)/);
});
