import express from "express";
import { addClient, getClients, deleteClient } from "../controllers/client.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, addClient);
router.get("/", requireAuth, getClients);
router.delete("/:id", requireAuth, deleteClient);

export default router;
