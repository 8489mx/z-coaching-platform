import express from "express";
import {
  generateProgram,
  getUserPrograms,
  generateProgramPreview,
  generateAndSaveProgram,
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
  getMyCheckinHistory,
  getCyclesNeedingAttention,
  prepareNextCycle,
  runDueCycles,
  calculateTargetsHandler,
} from "../controllers/program.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", requireAuth, generateProgram);
router.post("/generate-preview", requireAuth, generateProgramPreview);
router.post("/generate-and-save", requireAuth, generateAndSaveProgram);
router.get("/", requireAuth, getUserPrograms);
router.get("/cycles/attention", requireAuth, getCyclesNeedingAttention);
router.post("/next-cycle", requireAuth, prepareNextCycle);
router.post("/cycles/run-due", requireAuth, runDueCycles);
router.get("/active", requireAuth, getMyActiveProgram);
router.get("/active/:user_id", requireAuth, getActiveProgramByUserId);
router.put("/fasting-override", requireAuth, setFastingOverride);
router.get("/mobile/:code", requireAuth, getActiveProgramByUserId);

// Custom Program Editing & Catalog
router.put("/update-custom", requireAuth, updateCustomProgram);
// S4-7: unified target calculation for the coach macro calculator (writes nothing).
router.post("/calculate-targets", requireAuth, calculateTargetsHandler);
router.get("/exercises-catalog", getExercisesCatalog);

// Check-in & Adaptation V2 endpoints. S3-4/S4-5: the duplicated submit and
// calculator routes were retired; all check-ins go through POST /api/v1/checkin.
router.get("/checkin/pending", requireAuth, getPendingCheckins);
router.get("/checkin/history", requireAuth, getMyCheckinHistory);
router.get("/checkin/history/:user_id", requireAuth, getCheckinHistory);
router.post("/adapt", requireAuth, adaptProgramHandler);

// Context-Aware Smart Food Swap V2 endpoints
// Signed in: the swaps are filtered by the client's own allergies and conditions.
router.post("/swap-candidates", requireAuth, getSwapCandidatesHandler);
router.post("/swap-food", requireAuth, calculateSwapHandler);

export default router;
