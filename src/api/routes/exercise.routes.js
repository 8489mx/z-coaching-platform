import express from "express";
import {
  getExercisesList,
  getExerciseSwapsHandler,
  swapProgramExerciseHandler,
  uploadExerciseImage,
} from "../controllers/exercise.controller.js";

const router = express.Router();

router.get("/", getExercisesList);
router.get("/swaps/:exercise_code", getExerciseSwapsHandler);
router.post("/swap-in-program/:programId", swapProgramExerciseHandler);

router.post("/upload-image", uploadExerciseImage);

export default router;

