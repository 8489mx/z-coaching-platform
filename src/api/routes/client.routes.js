import express from "express";
import { addClient, getClients, deleteClient } from "../controllers/client.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, requireAdmin, addClient);
router.get("/", requireAuth, requireAdmin, getClients);
router.delete("/:id", requireAuth, requireAdmin, deleteClient);

export default router;
