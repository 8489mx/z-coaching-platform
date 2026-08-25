import { describe, it, expect } from 'vitest';
import { generateRehabAndMobilityRoutine } from '../src/execution-engines/rehab-mobility-engine.js';

describe('Clinical Mobility, Prehab, Postural Correction & Decompression Engine Suite', () => {

  it('generates lower back prehab (McGill Protocol) and biomechanical restrictions', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['LOWER_BACK_PAIN']
    });

    expect(routine.prehabWarmup.length).toBeGreaterThanOrEqual(3);
    expect(routine.prehabWarmup.some(e => e.name_ar.includes('Bird-Dog'))).toBe(true);
    expect(routine.postWorkoutStretches.some(e => e.name_ar.includes('Hip Flexor'))).toBe(true);
    expect(routine.biomechanicalRestrictions).toContain('NO_AXIAL_LOADING_SQUAT_DEADLIFT');
  });

  it('generates shoulder impingement rotator cuff routine', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['SHOULDER_IMPINGEMENT']
    });

    expect(routine.prehabWarmup.some(e => e.name_ar.includes('External Rotations'))).toBe(true);
    expect(routine.postWorkoutStretches.some(e => e.name_ar.includes('Doorway Pec Stretch'))).toBe(true);
    expect(routine.biomechanicalRestrictions).toContain('SCAPULAR_PLANE_PRESSING_ONLY');
  });

  it('generates patellar tendinitis Spanish squat prehab and restricts open chain leg extensions', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['PATELLAR_TENDINITIS']
    });

    expect(routine.prehabWarmup.some(e => e.name_ar.includes('Spanish Squat'))).toBe(true);
    expect(routine.biomechanicalRestrictions).toContain('NO_OPEN_CHAIN_LEG_EXTENSIONS');
  });

  it('generates varicose veins legs-up-the-wall stretch and restricts Valsalva', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['HERNIA_VARICOSE']
    });

    expect(routine.postWorkoutStretches.some(e => e.name_ar.includes('Legs-Up-The-Wall'))).toBe(true);
    expect(routine.biomechanicalRestrictions).toContain('NO_VALSALVA_MANEUVER');
  });

  it('applies supine hypotensive restrictions for 2nd and 3rd trimester pregnancy', () => {
    const routine = generateRehabAndMobilityRoutine({
      pregnancyTrimester: 'THIRD'
    });

    expect(routine.biomechanicalRestrictions).toContain('NO_FLAT_SUPINE_EXERCISES');
    expect(routine.biomechanicalRestrictions).toContain('NO_INTRA_ABDOMINAL_CRUNCHES');
  });

});
