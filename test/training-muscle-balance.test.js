import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Chest had one movement per upper or push day against two for the back: about 6 weekly sets in
 * every split (back 12-16, shoulders up to 19). Weekly sets per muscle drive hypertrophy (>= 10 sets
 * a week: Schoenfeld et al. 2017 dose-response meta-analysis; fractional counting, Pelland et al.
 * 2024: a set counts 1 for the main muscle, 0.5 for a helping one). Chest now gets a second press on
 * UPPER_B and both push days, and a third full-body press; no exercise repeats inside a session.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const MAP = {
  HORIZONTAL_PUSH: { chest: 1 }, HORIZONTAL_PULL: { back: 1 }, VERTICAL_PULL: { back: 1 },
  REAR_DELT: { back: 0.5 }, POSTERIOR_DELTOID: { back: 0.5 },
};
const week1 = (env, days) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "25", height_cm: "180", weight_kg: "80", circumferences: { neck_cm: "38", waist_cm: "82", hips_cm: "95" },
    primary_goal: "lean_bulk", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: env, training_logistics: { days_per_week: days, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).training_program;

test("chest gets a real share of the week in every split from 3 days, and no session repeats an exercise", () => {
  for (const env of ["commercial_gym", "home_gym", "calisthenics_bands"]) {
    for (const days of [3, 4, 5, 6]) {
      const tp = week1(env, days);
      const sets = { chest: 0, back: 0 };
      for (const session of tp.weeks[0].sessions) {
        const codes = session.exercises.map((e) => e.exercise_code);
        assert.equal(new Set(codes).size, codes.length, `${env} ${days}d ${session.session_code}: ${codes.join(",")}`);
        for (const e of session.exercises) for (const [m, w] of Object.entries(MAP[e.slot_code] || {})) sets[m] += (Number(e.sets) || 0) * w;
      }
      assert.ok(sets.chest >= 8.5, `${env} ${days}d ${tp.split_code}: chest ${sets.chest} weekly sets`);
      assert.ok(sets.chest / sets.back >= 0.6, `${env} ${days}d: chest ${sets.chest} vs back ${sets.back}`);
    }
  }
});
