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
import { intakeRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Public submission and auto-saving drafts from client
// Wrong code/phone pairs count as failed attempts (intake.controller); five block the IP for 15 minutes.
router.get("/client-draft", intakeRateLimiter, getClientIntakeDraft);
router.post("/save-draft", intakeRateLimiter, saveDraftIntake);
router.post("/submit", intakeRateLimiter, submitPublicIntake);
router.post("/", intakeRateLimiter, submitPublicIntake);

// Coach management endpoints
router.get("/submissions", requireAuth, getAllIntakeSubmissions);
router.get("/:id", requireAuth, getIntakeSubmission);
router.post("/:submission_id/verify-payment", requireAuth, verifyIntakePayment);
router.post("/:submission_id/generate-draft", requireAuth, generateDraftFromIntake);
router.post("/:submission_id/approve-and-publish", requireAuth, approveAndPublishIntake);

export default router;
