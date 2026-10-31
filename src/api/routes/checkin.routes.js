import express from "express";
import {
  submitCheckin,
  getClientCheckins,
  approveCheckin,
  getCoachDigest,
  bulkApproveCheckins,
  updateCheckinMeasurements,
  logWorkout,
  getWorkoutLogs,
  decideDeload,
  unlockClinicalSafety,
  getCheckinSchedule,
} from "../controllers/checkin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkinRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/", checkinRateLimiter, submitCheckin);
router.get("/digest", requireAuth, getCoachDigest);
router.post("/bulk-approve", requireAuth, bulkApproveCheckins);
router.get("/schedule/:userId", requireAuth, getCheckinSchedule);
router.get("/schedule", requireAuth, getCheckinSchedule);
router.get("/user/:userId", requireAuth, getClientCheckins);
router.get("/client/:userId", requireAuth, getClientCheckins);
router.put("/:checkinId/measurements", requireAuth, updateCheckinMeasurements);
router.patch("/:checkinId/measurements", requireAuth, updateCheckinMeasurements);
router.post("/:checkinId/approve", requireAuth, approveCheckin);
router.post("/:checkinId/deload-decision", requireAuth, decideDeload);
router.post("/:checkinId/unlock-clinical-safety", requireAuth, unlockClinicalSafety);

router.post("/workout-logs", requireAuth, logWorkout);
router.get("/workout-logs/program/:programId", requireAuth, getWorkoutLogs);

export default router;
