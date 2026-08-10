import express from "express";
import { addClient, getClients } from "../controllers/client.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only ADMIN should be able to create clients (could add role check middleware later)
router.post("/", requireAuth, addClient);
router.get("/", requireAuth, getClients);

export default router;
