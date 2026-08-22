import express from "express";
import {
  submitCheckin,
  getClientCheckins,
  approveCheckin,
  logWorkout,
  getWorkoutLogs,
} from "../controllers/checkin.controller.js";

const router = express.Router();

router.post("/", submitCheckin);
router.get("/user/:userId", getClientCheckins);
router.post("/:checkinId/approve", approveCheckin);

router.post("/workout-logs", logWorkout);
router.get("/workout-logs/program/:programId", getWorkoutLogs);

export default router;
