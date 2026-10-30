import test from 'node:test';
import assert from 'node:assert/strict';

import { getPrehabRoutine } from '../src/execution-engines/postural-prehab-engine.js';
import { calculateEquivalentSwap, getEligibleSwaps } from '../src/execution-engines/food-swap-engine.js';
import { calculateSubscriptionStatus } from '../src/execution-engines/subscription-lifecycle-engine.js';

// Mock Databases for Deterministic Testing
const mockMobilityCatalog = [
  {
    id: 'prehab_rounded_shoulders',
    issue_tag: 'ROUNDED_SHOULDERS',
    name_ar: 'تصحيح انحناء الكتفين',
    target_session: ['PUSH', 'UPPER'],
    duration_minutes: 3,
    exercises: [{ name_ar: 'Banded Pull-Apart', reps: '20' }]
  },
  {
    id: 'prehab_apt',
    issue_tag: 'ANTERIOR_PELVIC_TILT',
    name_ar: 'تعديل ميل الحوض',
    target_session: ['LEGS', 'LOWER'],
    duration_minutes: 4,
    exercises: [{ name_ar: 'Hip Flexor Stretch', reps: '30s' }]
  }
];

const mockFoodCatalog = [
  {
    id: 'chicken_breast',
    name_ar: 'صدور دجاج',
    primary_macro: 'PROTEIN',
    taste_profile: 'MAIN_SAVORY_PROTEIN',
    calories_per_100g: 165,
    protein_per_100g: 31.0,
    carbs_per_100g: 0,
    fats_per_100g: 3.6
  },
  {
    id: 'tilapia_fish',
    name_ar: 'سمك بلطي',
    primary_macro: 'PROTEIN',
    taste_profile: 'MAIN_SAVORY_PROTEIN',
    calories_per_100g: 125,
    protein_per_100g: 26.0,
    carbs_per_100g: 0,
    fats_per_100g: 2.5
  },
  {
    id: 'oats',
    name_ar: 'شوفان',
    primary_macro: 'CARB',
    taste_profile: 'BREAKFAST_SWEET_CARB',
    calories_per_100g: 380,
    protein_per_100g: 13.5,
    carbs_per_100g: 66.0,
    fats_per_100g: 6.5
  }
];

test('Z Coaching Platform - Master Deterministic Engines Suite', async (t) => {

  // 1. Prehab Engine Tests
  await t.test('1. Postural Prehab Engine: injects shoulder prehab before PUSH workouts for clients with rounded shoulders', () => {
    const routine = getPrehabRoutine(['ROUNDED_SHOULDERS'], 'PUSH', mockMobilityCatalog);
    assert.equal(routine.has_prehab, true);
    assert.equal(routine.exercises.length, 1);
    assert.equal(routine.exercises[0].name_ar, 'Banded Pull-Apart');
  });

  await t.test('2. Postural Prehab Engine: ignores upper body prehab on leg day to prevent unnecessary session bloat', () => {
    const routine = getPrehabRoutine(['ROUNDED_SHOULDERS'], 'LEGS', mockMobilityCatalog);
    assert.equal(routine.has_prehab, false);
    assert.equal(routine.exercises.length, 0);
  });

  // 2. Food Swap Engine Tests
  await t.test('3. Food Swap Engine: calculates mathematically equivalent grams between chicken and fish', () => {
    // 150g Chicken (46.5g Protein) -> Tilapia (26g Protein per 100g) -> ~178.8g -> rounded to 180g
    const result = calculateEquivalentSwap({
      sourceFoodId: 'chicken_breast',
      sourceGrams: 150,
      targetFoodId: 'tilapia_fish',
      foodCatalog: mockFoodCatalog
    });

    assert.equal(result.success, true);
    assert.equal(result.target_food.calculated_grams, 180);
    assert.ok(Math.abs(result.macros.protein - 46.8) < 0.5);
  });

  await t.test('4. Food Swap Engine: blocks incompatible swaps (e.g. swapping main chicken with breakfast oats)', () => {
    const result = calculateEquivalentSwap({
      sourceFoodId: 'chicken_breast',
      sourceGrams: 150,
      targetFoodId: 'oats',
      foodCatalog: mockFoodCatalog
    });

    assert.equal(result.success, false);
    assert.equal(result.error_code, 'INCOMPATIBLE_TASTE_PROFILE');
  });

  // 4. Subscription Lifecycle Engine Tests
  await t.test('8. Subscription Lifecycle Engine: accurately accounts for frozen days in final expiration calculations', () => {
    const status = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 30,
      freezeLogs: [{ days: 7 }],
      referenceDate: new Date('2026-08-20')
    });

    // 30 base days + 7 frozen days = 37 total days from Aug 1 -> Expires Sept 7
    assert.equal(status.total_frozen_days, 7);
    assert.ok(status.days_remaining > 15);
    assert.equal(status.status, 'ACTIVE');
  });

  await t.test('9. Subscription Lifecycle Engine: triggers radar alert when remaining days are <= 5', () => {
    const status = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 25,
      freezeLogs: [],
      referenceDate: new Date('2026-08-22') // 21 days passed, 4 remaining
    });

    assert.equal(status.days_remaining, 4);
    assert.equal(status.radar_alert, true);
    assert.equal(status.status, 'EXPIRING_SOON');
  });

});
