import { describe, it, expect } from 'vitest';
import { generateRehabAndMobilityRoutine } from '../src/execution-engines/rehab-mobility-engine.js';

describe('Clinical Rehab, Mobility & Postural Engine Suite', () => {

  it('generates lower back prehab (McGill 3) and prohibits loaded spinal flexion', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['LOWER_BACK_PAIN'],
      workoutTarget: 'LOWER'
    });

    expect(routine.prehabWarmup.length).toBeGreaterThanOrEqual(3);
    expect(routine.prehabWarmup.some(e => e.name_ar.includes('Bird-Dog'))).toBe(true);
    expect(routine.postWorkoutStretches.some(e => e.name_ar.includes('Hip Flexor'))).toBe(true);
    expect(routine.prohibitedMovements).toContain('NO_LOADED_SPINAL_FLEXION');
  });

  it('generates shoulder impingement rotator cuff routine', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['SHOULDER_IMPINGEMENT'],
      workoutTarget: 'UPPER'
    });

    expect(routine.prehabWarmup.some(e => e.name_ar.includes('External Rotations'))).toBe(true);
    expect(routine.postWorkoutStretches.some(e => e.name_ar.includes('Doorway Pec Stretch'))).toBe(true);
    expect(routine.prohibitedMovements).toContain('NO_INTERNAL_ROTATION_PRESSING');
  });

  it('generates patellar tendinitis Spanish squat & dorsiflexion prehab', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['PATELLAR_TENDINITIS']
    });

    expect(routine.prehabWarmup.some(e => e.name_ar.includes('Spanish Squat'))).toBe(true);
    expect(routine.prohibitedMovements).toContain('NO_OPEN_CHAIN_LEG_EXTENSION');
  });

  it('generates postural corrections for anterior pelvic tilt & rounded shoulders', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: [],
      posturalIssues: ['ANTERIOR_PELVIC_TILT', 'ROUNDED_SHOULDERS']
    });

    expect(routine.posturalCorrections.some(e => e.name_ar.includes('Deadbug'))).toBe(true);
    expect(routine.posturalCorrections.some(e => e.name_ar.includes('Face Pulls'))).toBe(true);
  });

  it('generates varicose veins legs-up-the-wall post-workout stretch', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['HERNIA_VARICOSE']
    });

    expect(routine.postWorkoutStretches.some(e => e.name_ar.includes('Legs-Up-The-Wall'))).toBe(true);
  });

});
