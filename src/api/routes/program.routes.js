import express from "express";
import { generateProgram, getUserPrograms, generateProgramPreview, generateProgramFromSubmission } from "../controllers/program.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", requireAuth, generateProgram);
router.post("/generate-preview", generateProgramPreview); // Unauthenticated route for dashboard testing
router.post("/generate-from-submission/:submission_id", requireAuth, generateProgramFromSubmission);
router.get("/", requireAuth, getUserPrograms);

export default router;
