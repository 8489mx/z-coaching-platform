import express from "express";
import { getExercisesList } from "../controllers/exercise.controller.js";

const router = express.Router();

router.get("/", getExercisesList);

export default router;
