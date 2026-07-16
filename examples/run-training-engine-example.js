import { readFileSync } from "node:fs";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildTrainingEngine } from "../src/training-engine/index.js";

// Read example data
const intakeJson = readFileSync(new URL("./full-intake.json", import.meta.url), "utf-8");
const contextJson = readFileSync(new URL("./evaluation-context.json", import.meta.url), "utf-8");

const intake = JSON.parse(intakeJson);
const context = JSON.parse(contextJson);

// Step 1: Evaluate intake to get Intake Decision
const intakeDecision = evaluateIntake(intake, context);

// Step 2: Build the full Training Engine output
const engineOutput = buildTrainingEngine(intakeDecision);

// Print the output
console.log(JSON.stringify(engineOutput, null, 2));
