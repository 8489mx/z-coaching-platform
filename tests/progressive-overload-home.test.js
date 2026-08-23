import { describe, it, expect } from 'vitest';
import { resolveExerciseProgressionModel } from '../src/execution-engines/progressive-overload-engine.js';

describe('Non-Load Progressive Overload & Multi-Tool Home Engine Suite', () => {

  it('applies load overload in GYM environment', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'GYM',
      weekNumber: 2,
      currentWeightKg: 80,
      currentReps: 10
    });

    expect(model.strategy).toBe('LOAD_OVERLOAD');
    expect(model.suggestedWeightKg).toBe(82.5);
    expect(model.tempo).toBe('2-0-1-0');
  });

  it('applies accommodating resistance when both dumbbells and bands are available at home', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'HOME',
      availableEquipment: ['DUMBBELLS', 'BANDS'],
      weekNumber: 2,
      currentWeightKg: 20,
      currentReps: 10
    });

    expect(model.strategy).toBe('ACCOMMODATING_RESISTANCE');
    expect(model.tempo).toBe('3-1-1-0');
    expect(model.targetReps).toBe(12);
  });

  it('applies volume and tempo overload when only dumbbells are available at home', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'HOME',
      availableEquipment: ['DUMBBELLS'],
      weekNumber: 2,
      currentWeightKg: 15,
      currentReps: 12
    });

    expect(model.strategy).toBe('VOLUME_AND_TEMPO');
    expect(model.tempo).toBe('4-1-1-0');
    expect(model.restSeconds).toBe(45);
  });

  it('applies biomechanical leverage overload for bodyweight only', () => {
    const model = resolveExerciseProgressionModel({
      environment: 'HOME',
      availableEquipment: ['BODYWEIGHT_ONLY'],
      weekNumber: 2,
      currentWeightKg: 0,
      currentReps: 15
    });

    expect(model.strategy).toBe('BIOMECHANICAL_LEVERAGE');
    expect(model.targetReps).toBe(18);
    expect(model.suggestedWeightKg).toBe(0);
  });

});
