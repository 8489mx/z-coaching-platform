import express from "express";
import { submitIntake, getIntakeSubmission } from "../controllers/intake.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, submitIntake);
router.get("/:id", requireAuth, getIntakeSubmission);

export default router;
