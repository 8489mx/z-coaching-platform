import express from "express";
import { generateProgram, getUserPrograms } from "../controllers/program.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", requireAuth, generateProgram);
router.get("/", requireAuth, getUserPrograms);

export default router;
