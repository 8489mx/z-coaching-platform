import test from "node:test";
import assert from "node:assert/strict";

import { generateSmartSwaps } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * Swap household measures were fixed text: potatoes always "about one and a half medium", sweet
 * potato always "one medium", tamees always "a quarter to a third of a loaf", whatever the grams.
 * They now follow the grams (USDA medium potato ~173 g, medium sweet potato ~114 g); tamees shows
 * grams only (no reliable loaf weight).
 */
const desc = (grams, from, to, meal) => generateSmartSwaps("CARBS", grams, from, meal, 5, {}).find((s) => s.food_code === to);

test("a large potato swap says how many potatoes it really is", () => {
  const small = desc(100, "BASMATI_RICE", "ROASTED_POTATOES", "LUNCH");
  const large = desc(450, "BASMATI_RICE", "ROASTED_POTATOES", "LUNCH");
  assert.ok(small && large);
  assert.doesNotMatch(large.household_desc, /ثمرة ونصف/);
  assert.notEqual(small.household_desc.replace(/\d+/g, ""), "", "has text");
  assert.match(large.household_desc, new RegExp(`${large.equivalent_grams} جم`));
  const count = Number((large.household_desc.match(/حوالي ([\d.]+) ثمرة/) || [])[1]);
  assert.ok(Math.abs(count - large.equivalent_grams / 173) <= 0.5, large.household_desc);
});

test("sweet potato and tamees follow the grams too", () => {
  const sweet = desc(400, "BASMATI_RICE", "SWEET_POTATO", "LUNCH");
  const count = Number((sweet.household_desc.match(/حوالي ([\d.]+) ثمرة/) || [])[1]);
  assert.ok(Math.abs(count - sweet.equivalent_grams / 114) <= 0.5, sweet.household_desc);
  const tamees = desc(150, "BALADI_BREAD", "TAMEES_BREAD_WHOLEWHEAT", "BREAKFAST");
  assert.doesNotMatch(tamees.household_desc, /ربع إلى ثلث/);
  assert.match(tamees.household_desc, new RegExp(`${tamees.equivalent_grams} جم`));
});
