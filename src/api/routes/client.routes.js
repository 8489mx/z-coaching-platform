import express from "express";
import { addClient, getClients, deleteClient, updateClientFeatureFlags } from "../controllers/client.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, requireAdmin, addClient);
router.get("/", requireAuth, requireAdmin, getClients);
router.patch("/:id/feature-flags", requireAuth, requireAdmin, updateClientFeatureFlags);
router.delete("/:id", requireAuth, requireAdmin, deleteClient);

export default router;
