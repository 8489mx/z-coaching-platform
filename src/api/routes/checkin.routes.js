import express from "express";
import {
  submitCheckin,
  getClientCheckins,
  approveCheckin,
  getCoachDigest,
  bulkApproveCheckins,
  updateCheckinMeasurements,
  logWorkout,
  decideDeload,
  unlockClinicalSafety,
  openLateWindow,
  previewAdaptation,
} from "../controllers/checkin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkinRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/", requireAuth, checkinRateLimiter, submitCheckin);
router.get("/digest", requireAuth, getCoachDigest);
router.post("/bulk-approve", requireAuth, bulkApproveCheckins);
router.get("/user/:userId", requireAuth, getClientCheckins);
router.get("/client/:userId", requireAuth, getClientCheckins);
router.put("/:checkinId/measurements", requireAuth, updateCheckinMeasurements);
router.patch("/:checkinId/measurements", requireAuth, updateCheckinMeasurements);
router.post("/:checkinId/approve", requireAuth, approveCheckin);
// P1-B10: coach opens a late window for one cycle (3-segment path: no
// conflict with the 2-segment :checkinId routes or /schedule/:userId GET).
router.post("/schedule/:userId/open-late-window", requireAuth, openLateWindow);
// P1-B10: read-only adaptation preview for the review screen, before approval.
router.post("/:checkinId/adaptation-preview", requireAuth, previewAdaptation);
router.post("/:checkinId/deload-decision", requireAuth, decideDeload);
router.post("/:checkinId/unlock-clinical-safety", requireAuth, unlockClinicalSafety);

// P2-C4: GET /workout-logs/program/:programId and GET /schedule[/:userId]
// are deleted (zero UI callers). Workout-log writes (POST /workout-logs)
// and the late-window POST stay wired.
router.post("/workout-logs", requireAuth, logWorkout);

export default router;
