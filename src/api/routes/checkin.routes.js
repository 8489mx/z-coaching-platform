import express from "express";
import {
  submitCheckin,
  getClientCheckins,
  approveCheckin,
  logWorkout,
  getWorkoutLogs,
} from "../controllers/checkin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", submitCheckin);
router.get("/user/:userId", requireAuth, getClientCheckins);
router.get("/client/:userId", requireAuth, getClientCheckins);
router.post("/:checkinId/approve", requireAuth, approveCheckin);

router.post("/workout-logs", requireAuth, logWorkout);
router.get("/workout-logs/program/:programId", requireAuth, getWorkoutLogs);

export default router;
