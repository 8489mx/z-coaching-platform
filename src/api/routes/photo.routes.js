import express from "express";
import {
  getUserPhotos,
  uploadUserPhoto,
  deleteUserPhoto
} from "../controllers/photo.controller.js";

const router = express.Router();

router.get("/:user_id", getUserPhotos);
router.post("/upload", uploadUserPhoto);
router.delete("/:photo_id", deleteUserPhoto);

export default router;
