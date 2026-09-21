import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { CLINICAL_GUIDELINES } from "../src/config/clinical-guidelines.js";

/**
 * A breastfeeding 42 kg client with kidney disease got 34 g of protein a day (the kidney cap alone).
 * Nutrition care for CKD in pregnancy (Eur J Clin Nutr 2020 review): use the adult CKD protein
 * recommendation and add the extra needs of pregnancy; IOM DRI adds 25 g/day in pregnancy and
 * lactation. The kidney cap now keeps that extra.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const targets = (extra) => buildMasterEngineV2({
  intake: {
    gender: "female", age: "28", height_cm: "160", weight_kg: "60", circumferences: { neck_cm: "31", waist_cm: "72", hips_cm: "96" },
    primary_goal: "general_fitness", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected: ["renal"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE", ...extra,
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program.targets;

test("breastfeeding or pregnancy with kidney disease keeps the extra 25 g of protein on top of the kidney cap", () => {
  const extra = CLINICAL_GUIDELINES.KIDNEY.PREGNANCY_LACTATION_EXTRA_PROTEIN_G;
  assert.equal(extra, 25);
  const base = targets({});
  assert.ok(base.clinical_guardrails.kidney_protein_capped, "precondition: kidney cap applies");
  for (const state of [{ female_pregnancy: "BREASTFEEDING" }, { female_pregnancy: "PREGNANT" }]) {
    const t = targets(state);
    assert.equal(t.protein_g, base.protein_g + extra, JSON.stringify(state));
  }
});
