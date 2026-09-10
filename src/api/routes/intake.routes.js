import express from "express";
import { 
  getClientIntakeDraft,
  saveDraftIntake,
  submitPublicIntake,
  getAllIntakeSubmissions,
  getIntakeSubmission,
  verifyIntakePayment,
  generateDraftFromIntake,
  approveAndPublishIntake
} from "../controllers/intake.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public submission and auto-saving drafts from client
router.get("/client-draft", getClientIntakeDraft);
router.post("/save-draft", saveDraftIntake);
router.post("/submit", submitPublicIntake);
router.post("/", submitPublicIntake);

// Coach management endpoints
router.get("/submissions", requireAuth, getAllIntakeSubmissions);
router.get("/:id", requireAuth, getIntakeSubmission);
router.post("/:submission_id/verify-payment", requireAuth, verifyIntakePayment);
router.post("/:submission_id/generate-draft", requireAuth, generateDraftFromIntake);
router.post("/:submission_id/approve-and-publish", requireAuth, approveAndPublishIntake);

export default router;
