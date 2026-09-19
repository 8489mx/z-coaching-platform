import test from 'node:test';
import assert from 'node:assert/strict';

import {
  orthodoxEaster, copticFastPeriods, ramadanRange, isRamadanDay, localDay, resolveFastingContext,
  isFoodAllowedDuringFast, applyFastingToMeals, FASTING_MODES, FASTING_DIETS,
} from '../src/execution-engines/fasting-calendar-engine.js';
import { FOOD_DATABASE } from '../src/execution-engines/food-swap-engine.js';
import { SEASONAL_FASTING_CALENDAR, getUpcomingFastingAlert } from '../frontend/src/utils/seasonalFastingRadar.js';

const iso = (d) => d.toISOString().slice(0, 10);

test('Orthodox Easter matches the published Coptic dates', () => {
  assert.equal(iso(orthodoxEaster(2024)), '2024-05-05');
  assert.equal(iso(orthodoxEaster(2025)), '2025-04-20');
  assert.equal(iso(orthodoxEaster(2026)), '2026-04-12');
  assert.equal(iso(orthodoxEaster(2027)), '2027-05-02');
});

test('Coptic fasting periods for 2026', () => {
  const byId = Object.fromEntries(copticFastPeriods(2026).map((p) => [p.id, p]));
  assert.deepEqual([iso(byId.JONAH_2026.start), iso(byId.JONAH_2026.end)], ['2026-02-02', '2026-02-04']);
  assert.deepEqual([iso(byId.GREAT_LENT_2026.start), iso(byId.GREAT_LENT_2026.end)], ['2026-02-16', '2026-04-11']);
  assert.deepEqual([iso(byId.APOSTLES_2026.start), iso(byId.APOSTLES_2026.end)], ['2026-06-01', '2026-07-11']);
  assert.deepEqual([iso(byId.VIRGIN_MARY_2026.start), iso(byId.VIRGIN_MARY_2026.end)], ['2026-08-07', '2026-08-21']);
  assert.deepEqual([iso(byId.NATIVITY_2026.start), iso(byId.NATIVITY_2026.end)], ['2026-11-25', '2027-01-06']);
  assert.equal(byId.GREAT_LENT_2026.strict, true);
  assert.equal(byId.NATIVITY_2026.strict, false);
});

test('Ramadan comes from the Umm al-Qura calendar', () => {
  const r = ramadanRange(2026);
  assert.deepEqual([iso(r.start), iso(r.end)], ['2026-02-18', '2026-03-19']);
  assert.equal(isRamadanDay(localDay('2027-02-20T10:00:00Z')), true);
  assert.equal(isRamadanDay(localDay('2027-04-20T10:00:00Z')), false);
});

test('context: religion + date decide the mode; the coach override wins', () => {
  const at = (date, religion, extra = {}) => resolveFastingContext({ religion, date: `${date}T10:00:00Z`, ...extra });
  assert.equal(at('2026-03-01', 'MUSLIM').mode, FASTING_MODES.RAMADAN);
  assert.equal(at('2026-03-01', 'MUSLIM', { override: 'OFF' }).active, false);
  assert.equal(at('2026-05-01', 'MUSLIM').active, false);
  assert.equal(at('2026-05-01', 'MUSLIM', { override: 'FORCE_ON' }).mode, FASTING_MODES.RAMADAN);
  const lent = at('2026-03-01', 'CHRISTIAN');
  assert.equal(lent.mode, FASTING_MODES.CHRISTIAN_FAST);
  assert.equal(lent.diet, FASTING_DIETS.STRICT_VEGAN, 'Great Lent is strict vegan even for fish-allowed clients');
  assert.equal(at('2026-12-01', 'CHRISTIAN').diet, FASTING_DIETS.PESCATARIAN);
  assert.equal(at('2026-12-01', 'CHRISTIAN', { christian_fasting_style: 'STRICT_VEGAN' }).diet, FASTING_DIETS.STRICT_VEGAN);
  assert.equal(at('2026-03-01', 'OTHER').active, false);
});

test('food rules during a Christian fast', () => {
  const vegan = resolveFastingContext({ religion: 'CHRISTIAN', date: '2026-03-01T10:00:00Z' });
  const pesc = resolveFastingContext({ religion: 'CHRISTIAN', date: '2026-12-01T10:00:00Z' });
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.CHICKEN_BREAST, vegan), false);
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.WHOLE_EGG, pesc), false);
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.WHEY_PROTEIN_ISOLATE, pesc), false);
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.WHITE_FISH_FILLET, pesc), true);
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.WHITE_FISH_FILLET, vegan), false);
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.FAVA_BEANS, vegan), true);
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.PEA_RICE_PROTEIN_POWDER, vegan), true);
});

const meal = (items) => ({ id: 'm1', title: 'غداء', items: items.map(([code, amount]) => ({ id: code, code, name: FOOD_DATABASE[code].name_ar, amount, p: 0, c: 0, f: 0, cal: 0 })) });

test('Christian fast replaces animal items with allowed ones of the same macro type', () => {
  const ctx = resolveFastingContext({ religion: 'CHRISTIAN', date: '2026-03-01T10:00:00Z' });
  const [out] = applyFastingToMeals([meal([['CHICKEN_BREAST', 150], ['BASMATI_RICE_COOKED', 150]])], ctx, {});
  const protein = out.items[0];
  assert.notEqual(protein.code, 'CHICKEN_BREAST');
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE[protein.code], ctx), true);
  assert.equal(protein.fasting_substituted_from.code, 'CHICKEN_BREAST');
  assert.equal(out.items[1].code, 'BASMATI_RICE_COOKED', 'plant items stay');
});

test('favism + strict vegan: no safe plant protein, the item is flagged instead of a legume swap', () => {
  const ctx = resolveFastingContext({ religion: 'CHRISTIAN', date: '2026-03-01T10:00:00Z' });
  const [out] = applyFastingToMeals([meal([['CHICKEN_BREAST', 150]])], ctx, { is_g6pd: true });
  const item = out.items[0];
  assert.ok(item.fasting_blocked || !FOOD_DATABASE[item.code].is_legume, `got ${item.code}`);
});

test('Ramadan relabels meals as Iftar / snack / Suhoor with the same foods', () => {
  const ctx = resolveFastingContext({ religion: 'MUSLIM', date: '2026-03-01T10:00:00Z' });
  const meals = [meal([['CHICKEN_BREAST', 150]]), meal([['BASMATI_RICE_COOKED', 100]]), meal([['WHOLE_EGG', 100]])];
  const out = applyFastingToMeals(meals, ctx);
  assert.deepEqual(out.map((m) => m.ramadan_slot), ['IFTAR', 'SNACK', 'SUHOOR']);
  assert.deepEqual(out.map((m) => m.items[0].code), ['CHICKEN_BREAST', 'BASMATI_RICE_COOKED', 'WHOLE_EGG']);
});

test('the seasonal radar is computed, not typed, and prefers Ramadan when fasts overlap', () => {
  assert.ok(SEASONAL_FASTING_CALENDAR.some((s) => s.type === 'ISLAMIC'));
  assert.ok(SEASONAL_FASTING_CALENDAR.some((s) => s.type === 'COPTIC'));
  assert.equal(getUpcomingFastingAlert(new Date(2026, 1, 20)).type, 'ISLAMIC');
  assert.equal(getUpcomingFastingAlert(new Date(2026, 2, 19, 20)).isActive, true, 'last day of Ramadan still active in the evening');
});

test('plant substitutes are capped at a realistic 350 g portion with the protein gap stated', () => {
  const ctx = resolveFastingContext({ religion: 'CHRISTIAN', date: '2026-03-01T10:00:00Z' });
  const [out] = applyFastingToMeals([meal([['CHICKEN_BREAST', 150]])], ctx, {});
  const item = out.items[0];
  assert.ok(item.amount <= 350, `${item.code} ${item.amount} g`);
  if (item.fasting_protein_gap_g) assert.match(item.fasting_note_ar, /ينقص/);
});

test('plant foods with animal-sounding names stay allowed during a strict fast', () => {
  const ctx = resolveFastingContext({ religion: 'CHRISTIAN', date: '2026-03-01T10:00:00Z' });
  for (const code of ['GRILLED_EGGPLANT', 'KABSA_SPICED_RICE', 'NATURAL_PEANUT_BUTTER']) {
    if (FOOD_DATABASE[code]) assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE[code], ctx), true, code);
  }
  assert.equal(isFoodAllowedDuringFast(FOOD_DATABASE.KABSA_CHICKEN, ctx), false);
});
