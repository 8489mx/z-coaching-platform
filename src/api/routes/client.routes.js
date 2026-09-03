import express from "express";
import { addClient, getClients, deleteClient } from "../controllers/client.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", addClient);
router.get("/", getClients);
router.delete("/:id", deleteClient);

export default router;
