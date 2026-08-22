import express from "express";
import { addClient, getClients } from "../controllers/client.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", addClient);
router.get("/", getClients);

export default router;
