import express from "express";
import { 
  saveDraftIntake,
  submitPublicIntake,
  getAllIntakeSubmissions,
  getIntakeSubmission,
  verifyIntakePayment,
  generateDraftFromIntake,
  approveAndPublishIntake
} from "../controllers/intake.controller.js";

const router = express.Router();

// Public submission and auto-saving drafts from client
router.post("/save-draft", saveDraftIntake);
router.post("/submit", submitPublicIntake);
router.post("/", submitPublicIntake);

// Coach management endpoints
router.get("/submissions", getAllIntakeSubmissions);
router.get("/:id", getIntakeSubmission);
router.post("/:submission_id/verify-payment", verifyIntakePayment);
router.post("/:submission_id/generate-draft", generateDraftFromIntake);
router.post("/:submission_id/approve-and-publish", approveAndPublishIntake);

export default router;
