import { describe, it, expect } from 'vitest';
import { evaluateReligiousCalendarSchedule, FASTING_TYPES } from '../src/execution-engines/religious-calendar-engine.js';

describe('Religious Calendar & Seasonal Fasting Engine Suite', () => {

  it('generates Ramadan Dry Fasting schedule with Iftar, post-workout dinner, and Suhoor', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'MUSLIM',
      isFastingSeason: true,
      dailyCalories: 2200,
      dailyWaterLiters: 3.5,
      preferredWorkoutTime: 'AFTER_IFTAR'
    });

    expect(schedule.mode).toBe(FASTING_TYPES.RAMADAN_DRY_FASTING);
    expect(schedule.meals_distribution.length).toBe(3);
    expect(schedule.meals_distribution[0].meal_id).toBe('iftar');
    expect(schedule.meals_distribution[2].meal_id).toBe('suhoor');
    expect(schedule.hydration_protocol.total_target_liters).toBe(3.5);
  });

  it('generates Christian Fasting schedule (Pescatarian)', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'CHRISTIAN',
      isFastingSeason: true,
      christianFastingStyle: 'PESCATARIAN_ALLOWED',
      dailyCalories: 2000
    });

    expect(schedule.mode).toBe(FASTING_TYPES.CHRISTIAN_FASTING_PESCATARIAN);
    expect(schedule.meals_distribution.length).toBe(3);
    expect(schedule.supplement_synergy_ar.length).toBeGreaterThan(0);
  });

  it('generates Christian Fasting schedule (Strict Vegan)', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'CHRISTIAN',
      isFastingSeason: true,
      christianFastingStyle: 'STRICT_VEGAN',
      dailyCalories: 1800
    });

    expect(schedule.mode).toBe(FASTING_TYPES.CHRISTIAN_FASTING_STRICT_VEGAN);
    expect(schedule.meals_distribution.length).toBe(3);
  });

  it('falls back to standard non-fasting baseline when not in fasting season', () => {
    const schedule = evaluateReligiousCalendarSchedule({
      religion: 'MUSLIM',
      isFastingSeason: false,
      dailyCalories: 2000
    });

    expect(schedule.mode).toBe(FASTING_TYPES.STANDARD_BASELINE);
    expect(schedule.meals_distribution.length).toBe(4);
  });

});
