import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngine } from "../src/master-engine/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { completeIntake, ASSESSMENT_CONTEXT } from "../test/fixtures/complete-intake.js";

// Dummy Client Data
const clientIntakeProfile = completeIntake();

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate
});

const catalogPath = path.join(__dirname, "..", "data", "catalogs", "core-global-food-batch-v1.json");
const nutritionFoodCatalog = JSON.parse(await fs.readFile(catalogPath, "utf-8"));

async function main() {
  try {
    console.log("Starting Master Engine Execution...");
    console.time("Master Engine Execution Time");

    const masterProgram = buildMasterEngine({
      intake: clientIntakeProfile,
      evaluationContext: evaluationContext,
      nutritionFoodCatalog: nutritionFoodCatalog,
    });

    console.timeEnd("Master Engine Execution Time");

    const outputPath = path.join(__dirname, "..", "master_program_output.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(masterProgram, null, 2),
      "utf-8"
    );

    console.log(`\nSuccess! Master program written to: ${outputPath}`);
    console.log(`Training Preflight: ${masterProgram.training_program.preflight_report.plan_status}`);
    console.log(`Cardio Preflight: ${masterProgram.cardio_program.preflight_report.result}`);
    console.log(`Mobility Preflight: ${masterProgram.mobility_program.preflight_report.approval_state}`);
    console.log(`Nutrition Preflight: ${masterProgram.nutrition_program.stages.plan_preflight.status}`);
  } catch (err) {
    console.error("Master Engine failed:", err);
    process.exit(1);
  }
}

main();
