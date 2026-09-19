import express from "express";
import {
  submitCheckin,
  getClientCheckins,
  approveCheckin,
  logWorkout,
  getWorkoutLogs,
  decideDeload,
} from "../controllers/checkin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkinRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/", checkinRateLimiter, submitCheckin);
router.get("/user/:userId", requireAuth, getClientCheckins);
router.get("/client/:userId", requireAuth, getClientCheckins);
router.post("/:checkinId/approve", requireAuth, approveCheckin);
router.post("/:checkinId/deload-decision", requireAuth, decideDeload);

router.post("/workout-logs", requireAuth, logWorkout);
router.get("/workout-logs/program/:programId", requireAuth, getWorkoutLogs);

export default router;
