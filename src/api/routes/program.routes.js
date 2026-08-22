import express from "express";
import {
  generateProgram,
  getUserPrograms,
  generateProgramPreview,
  generateAndSaveProgram,
  generateProgramFromSubmission,
  generateProgramForClient,
  evaluateCheckinHandler,
  submitWeeklyCheckin,
  getPendingCheckins,
  approveWeeklyCheckin,
  adaptProgramHandler,
  calculateSwapHandler,
  getActiveProgramByUserId,
  updateCustomProgram,
  getExercisesCatalog,
  getCheckinHistory,
  getSwapCandidatesHandler,
} from "../controllers/program.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", requireAuth, generateProgram);
router.post("/generate-preview", generateProgramPreview); // Unauthenticated route for dashboard testing
router.post("/generate-and-save", generateAndSaveProgram); // Save client & program to MariaDB z
router.post("/generate-from-submission/:submission_id", requireAuth, generateProgramFromSubmission);
router.post("/generate-for-client/:user_id", generateProgramForClient);
router.get("/", requireAuth, getUserPrograms);
router.get("/active/:user_id", getActiveProgramByUserId); // Fetch active program from MariaDB

// Custom Program Editing & Catalog
router.put("/update-custom", updateCustomProgram);
router.get("/exercises-catalog", getExercisesCatalog);

// Check-in & Adaptation V2 endpoints
router.post("/checkin/evaluate", evaluateCheckinHandler);
router.post("/checkin/submit", submitWeeklyCheckin);
router.get("/checkin/pending", getPendingCheckins);
router.get("/checkin/history/:user_id", getCheckinHistory);
router.post("/checkin/approve", approveWeeklyCheckin);
router.post("/adapt", adaptProgramHandler);

// Context-Aware Smart Food Swap V2 endpoints
router.post("/swap-candidates", getSwapCandidatesHandler);
router.post("/swap-food", calculateSwapHandler);

export default router;
