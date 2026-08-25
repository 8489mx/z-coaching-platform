import test from 'node:test';
import assert from 'node:assert/strict';

import { generateRehabAndMobilityRoutine } from '../src/execution-engines/rehab-mobility-engine.js';

test('Clinical Mobility, Prehab, Postural Correction & Decompression Engine Suite', async (t) => {

  await t.test('1. Lower back prehab (McGill Protocol) and biomechanical restrictions', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['LOWER_BACK_PAIN']
    });

    assert.ok(routine.prehabWarmup.length >= 3);
    assert.ok(routine.prehabWarmup.some(e => e.name_ar.includes('Bird-Dog')));
    assert.ok(routine.postWorkoutStretches.some(e => e.name_ar.includes('Hip Flexor')));
    assert.ok(routine.biomechanicalRestrictions.includes('NO_AXIAL_LOADING_SQUAT_DEADLIFT'));
  });

  await t.test('2. Shoulder impingement rotator cuff routine', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['SHOULDER_IMPINGEMENT']
    });

    assert.ok(routine.prehabWarmup.some(e => e.name_ar.includes('External Rotations')));
    assert.ok(routine.postWorkoutStretches.some(e => e.name_ar.includes('Doorway Pec Stretch')));
    assert.ok(routine.biomechanicalRestrictions.includes('SCAPULAR_PLANE_PRESSING_ONLY'));
  });

  await t.test('3. Patellar tendinitis Spanish squat prehab and restricts open chain leg extensions', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['PATELLAR_TENDINITIS']
    });

    assert.ok(routine.prehabWarmup.some(e => e.name_ar.includes('Spanish Squat')));
    assert.ok(routine.biomechanicalRestrictions.includes('NO_OPEN_CHAIN_LEG_EXTENSIONS'));
  });

  await t.test('4. Varicose veins legs-up-the-wall stretch and restricts Valsalva', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['HERNIA_VARICOSE']
    });

    assert.ok(routine.postWorkoutStretches.some(e => e.name_ar.includes('Legs-Up-The-Wall')));
    assert.ok(routine.biomechanicalRestrictions.includes('NO_VALSALVA_MANEUVER'));
  });

  await t.test('5. Applies supine hypotensive restrictions for 2nd and 3rd trimester pregnancy', () => {
    const routine = generateRehabAndMobilityRoutine({
      pregnancyTrimester: 'THIRD'
    });

    assert.ok(routine.biomechanicalRestrictions.includes('NO_FLAT_SUPINE_EXERCISES'));
    assert.ok(routine.biomechanicalRestrictions.includes('NO_INTRA_ABDOMINAL_CRUNCHES'));
  });

});
