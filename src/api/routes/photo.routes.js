import express from "express";
import {
  getUserPhotos,
  uploadUserPhoto,
  deleteUserPhoto
} from "../controllers/photo.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:user_id", requireAuth, getUserPhotos);
router.post("/upload", requireAuth, uploadUserPhoto);
router.delete("/:photo_id", requireAuth, deleteUserPhoto);

export default router;
