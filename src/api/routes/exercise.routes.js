import express from "express";
import {
  getExercisesList,
  getExerciseSwapsHandler,
  swapProgramExerciseHandler,
  uploadExerciseImage,
  getGymRushCatalogHandler,
  gymRushSwapHandler,
} from "../controllers/exercise.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getExercisesList);
router.get("/swaps/:exercise_code", getExerciseSwapsHandler);
router.post("/swap-in-program/:programId", requireAuth, swapProgramExerciseHandler);

// Gym Rush Equivalence Catalog & Auto-Substitution
router.get("/gym-rush/catalog", getGymRushCatalogHandler);
router.post("/gym-rush/swap/:programId", requireAuth, gymRushSwapHandler);

router.post("/upload-image", requireAuth, uploadExerciseImage);

export default router;
