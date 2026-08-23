import test from 'node:test';
import assert from 'node:assert/strict';

import { generateRehabAndMobilityRoutine } from '../src/execution-engines/rehab-mobility-engine.js';

test('Clinical Rehab, Mobility & Postural Engine Suite', async (t) => {

  await t.test('1. Generates lower back prehab (McGill 3) and prohibits loaded spinal flexion', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['LOWER_BACK_PAIN'],
      workoutTarget: 'LOWER'
    });

    assert.ok(routine.prehabWarmup.length >= 3);
    assert.ok(routine.prehabWarmup.some(e => e.name_ar.includes('Bird-Dog')));
    assert.ok(routine.postWorkoutStretches.some(e => e.name_ar.includes('Hip Flexor')));
    assert.ok(routine.prohibitedMovements.includes('NO_LOADED_SPINAL_FLEXION'));
  });

  await t.test('2. Generates shoulder impingement rotator cuff routine', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['SHOULDER_IMPINGEMENT'],
      workoutTarget: 'UPPER'
    });

    assert.ok(routine.prehabWarmup.some(e => e.name_ar.includes('External Rotations')));
    assert.ok(routine.postWorkoutStretches.some(e => e.name_ar.includes('Doorway Pec Stretch')));
    assert.ok(routine.prohibitedMovements.includes('NO_INTERNAL_ROTATION_PRESSING'));
  });

  await t.test('3. Generates patellar tendinitis Spanish squat & dorsiflexion prehab', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['PATELLAR_TENDINITIS']
    });

    assert.ok(routine.prehabWarmup.some(e => e.name_ar.includes('Spanish Squat')));
    assert.ok(routine.prohibitedMovements.includes('NO_OPEN_CHAIN_LEG_EXTENSION'));
  });

  await t.test('4. Generates postural corrections for anterior pelvic tilt & rounded shoulders', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: [],
      posturalIssues: ['ANTERIOR_PELVIC_TILT', 'ROUNDED_SHOULDERS']
    });

    assert.ok(routine.posturalCorrections.some(e => e.name_ar.includes('Deadbug')));
    assert.ok(routine.posturalCorrections.some(e => e.name_ar.includes('Face Pulls')));
  });

  await t.test('5. Generates varicose veins legs-up-the-wall post-workout stretch', () => {
    const routine = generateRehabAndMobilityRoutine({
      medicalConditions: ['HERNIA_VARICOSE']
    });

    assert.ok(routine.postWorkoutStretches.some(e => e.name_ar.includes('Legs-Up-The-Wall')));
  });

});
