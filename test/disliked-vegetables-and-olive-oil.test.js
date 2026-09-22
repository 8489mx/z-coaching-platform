import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Vegetables and olive oil a client ticked as disliked stayed in the plan's names ("sauteed
 * zucchini, broccoli, carrots"; "extra virgin olive oil"). The plates and the cooking oil stay -
 * the fat budget counts on the oil - but the names now leave the disliked vegetables out and the
 * oil becomes a plain vegetable oil (canola or sunflower: the same 9 kcal per gram).
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" };
const intake = (extra = {}) => ({
  gender: "female", age: "30", height_cm: "165", weight_kg: "75", circumferences: { neck_cm: "33", waist_cm: "80", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
  ...extra,
});
const meals = (extra) => buildMasterEngineV2({ intake: intake(extra), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} }).nutrition_program.culinary_meals;
const names = (list) => list.flatMap((m) => m.items.map((i) => i.name_ar));
const kcal = (list) => list.reduce((s, m) => s + m.items.reduce((t, i) => t + i.calories_kcal, 0), 0);

test("disliked vegetables leave the vegetable plates' names, the plates stay", () => {
  const plain = meals();
  assert.ok(names(plain).some((n) => n.includes("كوسة")), "the plain plan names zucchini");
  const disliked = meals({ disliked_foods: ["كوسة", "بروكلي"] });
  for (const name of names(disliked)) {
    assert.ok(!/كوسة|بروكلي/.test(name.replace(/\(من غير[^)]*\)/g, "")), name);
  }
  assert.equal(disliked.flatMap((m) => m.items).filter((i) => i.category === "VEGGIES").length,
    plain.flatMap((m) => m.items).filter((i) => i.category === "VEGGIES").length);
});

test("disliked olive oil becomes a vegetable oil, same grams and energy", () => {
  const plain = meals();
  const disliked = meals({ disliked_foods: ["زيت زيتون"] });
  for (const name of names(disliked)) assert.ok(!/زيت (ال)?زيتون/.test(name), name);
  assert.ok(disliked.flatMap((m) => m.items).filter((i) => i.food_code === "OLIVE_OIL").every((i) => i.name_ar.includes("زيت نباتي")));
  assert.equal(kcal(disliked), kcal(plain));
});

test("a client with no dislikes keeps the names", () => {
  assert.ok(names(meals()).some((n) => /زيت زيتون/.test(n)));
});
