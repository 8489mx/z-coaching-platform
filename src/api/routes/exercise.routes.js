import express from "express";
import {
  getExercisesList,
  getExerciseSwapsHandler,
  swapProgramExerciseHandler,
  uploadExerciseImage,
} from "../controllers/exercise.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getExercisesList);
router.get("/swaps/:exercise_code", getExerciseSwapsHandler);
router.post("/swap-in-program/:programId", requireAuth, swapProgramExerciseHandler);

router.post("/upload-image", requireAuth, uploadExerciseImage);

export default router;
