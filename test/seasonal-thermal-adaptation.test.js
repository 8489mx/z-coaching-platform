import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSeasonalAdaptation, SEASONAL_ENVIRONMENTS } from '../src/execution-engines/seasonal-thermal-adaptation-engine.js';

describe('Seasonal & Thermal Performance Adaptation Engine Suite', () => {

  test('1. Applies SUMMER_HEAT_HUMIDITY thermal adaptation with elevated hydration & sodium', () => {
    const result = calculateSeasonalAdaptation({
      environment: 'SUMMER_HEAT_HUMIDITY',
      weightKg: 80,
      currentCalories: 2200
    });

    assert.strictEqual(result.environment_id, 'SUMMER_HEAT_HUMIDITY');
    assert.strictEqual(result.thermal_stress, 'HIGH');
    // base hydration 80 * 0.04 = 3.2L + 0.8L = 4.0L
    assert.strictEqual(result.adapted_hydration_liters, 4.0);
    assert.strictEqual(result.sodium_target_mg, 4000);
    assert.strictEqual(result.rest_interval_delta_sec, 25);
    assert.ok(result.training_timing_directive_ar.includes('الصباح الباكر') || result.training_timing_directive_ar.includes('غروب'));
    assert.ok(result.directives.length >= 4);
  });

  test('2. Applies WINTER_COLD environment with extended warmup and thermogenic caloric bump', () => {
    const result = calculateSeasonalAdaptation({
      environment: 'WINTER_COLD',
      weightKg: 75,
      currentCalories: 2000
    });

    assert.strictEqual(result.environment_id, 'WINTER_COLD');
    assert.strictEqual(result.thermal_stress, 'LOW');
    assert.strictEqual(result.warmup_modifier_min, 6);
    assert.strictEqual(result.adapted_calories, 2120);
    assert.ok(result.warmup_directive_ar.includes('إحماء') || result.warmup_directive_ar.includes('السائل الزلالي'));
  });

  test('3. Fallback to TEMPERATE_CONTROLLED when unknown environment is specified', () => {
    const result = calculateSeasonalAdaptation({
      environment: 'UNKNOWN_ENV',
      weightKg: 85,
      currentCalories: 2400
    });

    assert.strictEqual(result.environment_id, 'TEMPERATE_CONTROLLED');
    assert.strictEqual(result.caloric_delta_kcal, 0);
    assert.strictEqual(result.hydration_delta_liters, 0);
  });

});
