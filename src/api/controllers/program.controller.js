import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngine } from "../../../src/master-engine/build-master-engine.js";
import { Program } from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Food Catalog once on startup for the Nutrition Engine
let nutritionFoodCatalog = null;
const loadFoodCatalog = async () => {
  if (!nutritionFoodCatalog) {
    const catalogPath = path.join(__dirname, "..", "..", "..", "data", "catalogs", "core-global-food-batch-v1.json");
    const data = await fs.readFile(catalogPath, "utf-8");
    nutritionFoodCatalog = JSON.parse(data);
  }
  return nutritionFoodCatalog;
};

export const generateProgram = async (req, res) => {
  try {
    const intakeForm = req.body; // Full intake JSON from Flutter
    
    if (!intakeForm || !intakeForm.meta) {
      return res.status(400).json({ error: "Invalid intake form data" });
    }

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: intakeForm.meta.assessmentDate || new Date().toISOString().split("T")[0]
    });

    // 1. Evaluate Intake
    const intakeDecision = evaluateIntake(intakeForm);

    if (intakeDecision.decision.status === "BLOCK") {
      return res.status(400).json({ 
        error: "Intake rejected", 
        reasons: intakeDecision.decision.reasons 
      });
    }

    // 2. Load Catalog
    const catalog = await loadFoodCatalog();

    // 3. Build Master Engine
    const masterProgram = buildMasterEngine(intakeDecision, evaluationContext, catalog);

    // 4. Save to Database
    const savedProgram = await Program.create({
      user_id: req.user.id,
      program_data: masterProgram,
    });

    return res.status(201).json({
      message: "Program generated successfully",
      program_id: savedProgram.id,
      master_program: masterProgram
    });

  } catch (err) {
    console.error("generateProgram error:", err);
    return res.status(500).json({ 
      error: "Failed to generate program", 
      details: err.message 
    });
  }
};

export const getUserPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({
      where: { user_id: req.user.id },
      order: [["createdAt", "DESC"]]
    });
    
    return res.status(200).json({ programs });
  } catch (err) {
    console.error("getUserPrograms error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
