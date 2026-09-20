import express from "express";
import {
  generateProgram,
  getUserPrograms,
  generateProgramPreview,
  generateAndSaveProgram,
  evaluateCheckinHandler,
  submitWeeklyCheckin,
  getPendingCheckins,
  adaptProgramHandler,
  calculateSwapHandler,
  getActiveProgramByUserId,
  updateCustomProgram,
  getExercisesCatalog,
  getCheckinHistory,
  getSwapCandidatesHandler,
  setFastingOverride,
  getMyActiveProgram,
} from "../controllers/program.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", requireAuth, generateProgram);
router.post("/generate-preview", requireAuth, generateProgramPreview);
router.post("/generate-and-save", requireAuth, generateAndSaveProgram);
router.get("/", requireAuth, getUserPrograms);
router.get("/active", requireAuth, getMyActiveProgram);
router.get("/active/:user_id", requireAuth, getActiveProgramByUserId);
router.put("/fasting-override", requireAuth, setFastingOverride);
router.get("/mobile/:code", requireAuth, getActiveProgramByUserId);

// Custom Program Editing & Catalog
router.put("/update-custom", requireAuth, updateCustomProgram);
router.get("/exercises-catalog", getExercisesCatalog);

// Check-in & Adaptation V2 endpoints
router.post("/checkin/evaluate", requireAuth, evaluateCheckinHandler);
router.post("/checkin/submit", requireAuth, submitWeeklyCheckin);
router.get("/checkin/pending", requireAuth, getPendingCheckins);
router.get("/checkin/history/:user_id", requireAuth, getCheckinHistory);
router.post("/adapt", requireAuth, adaptProgramHandler);

// Context-Aware Smart Food Swap V2 endpoints
router.post("/swap-candidates", getSwapCandidatesHandler);
router.post("/swap-food", calculateSwapHandler);

export default router;
