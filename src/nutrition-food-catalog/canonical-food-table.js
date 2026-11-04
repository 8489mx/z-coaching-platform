/**
 * The one canonical food table (P2-C2).
 *
 * The committed file data/catalogs/core-global-food-batch-v1.json holds two arrays:
 *   - items: the 29 active selection items (P1-B7 values, verbatim). The selection
 *     builder and every existing test keep reading exactly these rows.
 *   - reference_items: the remaining plan foods (culinary entries, swap-registry foods
 *     with no culinary entry, and peanut butter). They are NOT selection items
 *     (is_active false, no selection fields) and never reach the selection builder.
 *
 * Every other food view in the server derives from this table through this module:
 * culinary macros, swap-registry densities, live-swap values, and the safety/plan
 * code maps. Nothing else in the server holds a second copy of a food's macros.
 *
 * Row link fields (all copied from the maps this table replaces, never invented):
 *   - culinary_code: the FOOD_SWAP_DATABASE code for this food, or null.
 *   - plan_registry_twin: the registry code the old PLAN_FOOD_TO_REGISTRY map
 *     pointed to for this plan food, or null when the old map had no entry.
 *   - value_for_registry_codes: registry codes whose live-swap values this row
 *     serves (the old foodMacros resolution, verbatim).
 *   - plan_food_code: the plan food the old REGISTRY_TO_PLAN_FOOD map judged for
 *     safety for each value_for code, or null when the row judges itself.
 *
 * Unknowns stay explicit: reference rows carry available_markets null and
 * logistics null (not yet known), and fiber_g null (no source states fiber for
 * them). A null is never silently treated as zero.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CANONICAL_TABLE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "catalogs",
  "core-global-food-batch-v1.json"
);

const MACRO_FIELDS = ["protein_g", "fat_g", "carbohydrate_g"];

function fail(message) {
  throw new Error("canonical-food-table: " + message);
}

function checkRow(row, seenFoodCodes) {
  if (!row || typeof row.food_code !== "string" || !row.food_code) fail("row without food_code");
  if (seenFoodCodes.has(row.food_code)) fail("duplicate food_code " + row.food_code);
  seenFoodCodes.add(row.food_code);
  const n = row.nutrition_per_100g;
  if (!n || typeof n !== "object") fail("row " + row.food_code + " without nutrition_per_100g");
  for (const field of MACRO_FIELDS) {
    if (typeof n[field] !== "number" || Number.isNaN(n[field])) {
      fail("row " + row.food_code + " without numeric " + field);
    }
  }
  if (n.calories_kcal !== null && (typeof n.calories_kcal !== "number" || Number.isNaN(n.calories_kcal))) {
    fail("row " + row.food_code + " with non-numeric calories_kcal");
  }
  if (n.fiber_g !== null && n.fiber_g !== undefined && (typeof n.fiber_g !== "number" || Number.isNaN(n.fiber_g))) {
    fail("row " + row.food_code + " with non-numeric fiber_g");
  }
  if (!Array.isArray(row.value_for_registry_codes)) fail("row " + row.food_code + " without value_for_registry_codes");
}

/**
 * Pure: build the resolution index for a table object { items, reference_items }.
 * Throws (fail-closed) on any code resolving to two different rows, any duplicate
 * twin, or any row missing its macros. Tests pass a modified table here to prove
 * that a change in the canonical table reaches every derived view.
 */
export function buildCanonicalIndex(table) {
  if (!table || !Array.isArray(table.items) || !Array.isArray(table.reference_items)) {
    fail("table must carry items and reference_items arrays");
  }
  const rows = [...table.items, ...table.reference_items];
  const seenFoodCodes = new Set();
  const byCode = new Map();
  const claim = (code, row) => {
    if (!code) return;
    const key = String(code).toUpperCase();
    const existing = byCode.get(key);
    if (existing && existing !== row) fail("code " + key + " resolves to two rows");
    byCode.set(key, row);
  };
  for (const row of rows) {
    checkRow(row, seenFoodCodes);
    claim(row.food_code, row);
    claim(row.culinary_code, row);
    for (const code of row.value_for_registry_codes) claim(code, row);
  }
  const twins = new Map();
  for (const row of rows) {
    if (!row.plan_registry_twin) continue;
    const key = String(row.plan_registry_twin).toUpperCase();
    if (twins.has(key)) fail("plan_registry_twin " + key + " claimed by two rows");
    twins.set(key, row);
  }

  const resolve = (code) => {
    if (!code) return null;
    return byCode.get(String(code).toUpperCase()) || null;
  };
  const macros = (code) => {
    const row = resolve(code);
    if (!row) return null;
    const n = row.nutrition_per_100g;
    return {
      protein_g: n.protein_g,
      carbohydrate_g: n.carbohydrate_g,
      fat_g: n.fat_g,
      calories_kcal: n.calories_kcal ?? null,
      fiber_g: n.fiber_g ?? null,
    };
  };
  const culinaryCode = (code) => {
    const row = resolve(code);
    return row ? row.culinary_code || null : null;
  };
  const safetyMap = () => {
    const out = {};
    for (const row of rows) {
      for (const code of row.value_for_registry_codes) {
        out[String(code).toUpperCase()] = row.plan_food_code || row.culinary_code || row.food_code;
      }
    }
    return Object.freeze(out);
  };
  const planMap = () => {
    const out = {};
    for (const row of rows) {
      if (row.plan_registry_twin) out[row.culinary_code || row.food_code] = row.plan_registry_twin;
    }
    return Object.freeze(out);
  };
  return Object.freeze({ rows, resolve, macros, culinaryCode, safetyMap, planMap });
}

/**
 * Pure: plain-object derived views for a table, for tests and for the probe.
 * culinary: FOOD_SWAP_DATABASE-shaped macros per culinary code.
 * registryDensities: primary nutrient per registry code (macro type applied by the caller).
 * foodMacros: live-swap-shaped macros per resolvable code.
 */
export function buildViews(table) {
  const index = buildCanonicalIndex(table);
  const culinary = {};
  for (const row of index.rows) {
    if (!row.culinary_code) continue;
    const m = index.macros(row.food_code);
    culinary[row.culinary_code] = {
      protein_per_100g: m.protein_g,
      carb_per_100g: m.carbohydrate_g,
      fat_per_100g: m.fat_g,
      kcal_per_100g: m.calories_kcal,
    };
  }
  const foodMacros = {};
  for (const row of index.rows) {
    const m = index.macros(row.food_code);
    const entry = { protein_per_100g: m.protein_g, carb_per_100g: m.carbohydrate_g, fat_per_100g: m.fat_g };
    foodMacros[row.food_code] = entry;
    if (row.culinary_code) foodMacros[row.culinary_code] = entry;
    for (const code of row.value_for_registry_codes) foodMacros[String(code).toUpperCase()] = entry;
  }
  return Object.freeze({ culinary, foodMacros });
}

let cachedTable = null;
let cachedIndex = null;

/** Load the committed canonical file once; the parsed table (items + reference_items). */
export function loadCanonicalTable() {
  if (!cachedTable) {
    const raw = fs.readFileSync(CANONICAL_TABLE_PATH, "utf8");
    cachedTable = JSON.parse(raw);
    cachedIndex = buildCanonicalIndex(cachedTable);
  }
  return cachedTable;
}

function loadedIndex() {
  if (!cachedIndex) loadCanonicalTable();
  return cachedIndex;
}

/** Resolve any server food code (selection, culinary, or registry) to its row, or null. */
export function resolveFood(code) {
  return loadedIndex().resolve(code);
}

/** Per-100 g macros for any server food code, or null when the code is unknown. */
export function canonicalMacros(code) {
  return loadedIndex().macros(code);
}

/** The FOOD_SWAP_DATABASE code for a food, or null when it has none. */
export function canonicalCulinaryCode(code) {
  return loadedIndex().culinaryCode(code);
}

/** Derived REGISTRY_TO_PLAN_FOOD (safety subjects), including direct-code identities. */
export function canonicalSafetyMap() {
  return loadedIndex().safetyMap();
}

/** Derived PLAN_FOOD_TO_REGISTRY exact entries (approximations live in the fallback). */
export function canonicalPlanMap() {
  return loadedIndex().planMap();
}
