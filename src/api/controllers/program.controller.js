import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngine } from "../../../src/master-engine/build-master-engine.js";
import { Program, IntakeSubmission } from "../models/index.js";

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
    const { meta, ...intakePayload } = req.body; // Strip meta before validation
    
    if (!req.body) {
      return res.status(400).json({ error: "Invalid intake form data" });
    }

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: (meta && meta.assessmentDate) || new Date().toISOString().split("T")[0]
    });

    // 1. Evaluate Intake
    const intakeDecision = evaluateIntake(intakePayload, evaluationContext);

    if (intakeDecision.plan_status === "BLOCK") {
      return res.status(400).json({ 
        error: "Intake rejected", 
        reasons: intakeDecision.decision_reasons 
      });
    }

    // 2. Load Catalog
    const catalog = await loadFoodCatalog();

    // 3. Build Master Engine
    const masterProgram = buildMasterEngine({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog
    });

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

export const generateProgramPreview = async (req, res) => {
  try {
    const { meta, ...intakePayload } = req.body;
    
    if (!req.body) {
      return res.status(400).json({ error: "Invalid intake form data" });
    }

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: (meta && meta.assessmentDate) || new Date().toISOString().split("T")[0]
    });

    const intakeDecision = evaluateIntake(intakePayload, evaluationContext);
    if (intakeDecision.plan_status === "BLOCK") {
      return res.status(400).json({ error: "Intake rejected", reasons: intakeDecision.decision_reasons });
    }

    const catalog = await loadFoodCatalog();
    const masterProgram = buildMasterEngine({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog
    });

    // Skip DB save for preview
    return res.status(200).json({
      message: "Preview program generated successfully",
      master_program: masterProgram
    });

  } catch (err) {
    console.error("generateProgramPreview error:", err);
    return res.status(500).json({ error: "Failed to generate preview program", details: err.message });
  }
};

export const generateProgramFromSubmission = async (req, res) => {
  try {
    const { submission_id } = req.params;
    
    const submission = await IntakeSubmission.findByPk(submission_id);
    if (!submission) {
      return res.status(404).json({ error: "Intake submission not found" });
    }
    if (submission.status === "PROCESSED") {
      return res.status(400).json({ error: "Intake already processed" });
    }

    const intakePayload = submission.answers;
    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: new Date().toISOString().split("T")[0]
    });

    const intakeDecision = evaluateIntake(intakePayload, evaluationContext);
    if (intakeDecision.plan_status === "BLOCK") {
      submission.status = "REJECTED";
      await submission.save();
      return res.status(400).json({ error: "Intake rejected", reasons: intakeDecision.decision_reasons });
    }

    const catalog = await loadFoodCatalog();
    const masterProgram = buildMasterEngine({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog
    });

    const savedProgram = await Program.create({
      user_id: submission.user_id,
      program_data: masterProgram,
    });

    submission.status = "PROCESSED";
    await submission.save();

    return res.status(201).json({
      message: "Program generated successfully from submission",
      program_id: savedProgram.id,
      master_program: masterProgram
    });
  } catch (err) {
    console.error("generateProgramFromSubmission error:", err);
    return res.status(500).json({ error: "Internal server error" });
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
