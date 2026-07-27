import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { buildTrainingEngine } from '../src/training-engine/index.js';
import { readFileSync } from 'node:fs';

const intakeJson = readFileSync(new URL('../examples/full-intake.json', import.meta.url), 'utf-8');
const contextJson = readFileSync(new URL('../examples/evaluation-context.json', import.meta.url), 'utf-8');

const rawIntake = JSON.parse(intakeJson);
const context = JSON.parse(contextJson);

// Modify for user scenario: 4 days (since 3 days is Full Body), returning from break
rawIntake.training.preferredDaysPerWeek = 4;
rawIntake.training.maxDaysPerWeek = 4;
rawIntake.training.experience = "INTERMEDIATE"; // So they can return from break
rawIntake.training.recentTraining = "NONE_LAST_4_WEEKS"; // returning from break
rawIntake.training.location = "GYM"; // standard gym
rawIntake.training.equipment = []; // standard gym

const intakeDecision = evaluateIntake(rawIntake, context);
const trainingOutput = buildTrainingEngine(intakeDecision);

console.log(JSON.stringify(trainingOutput, null, 2));
