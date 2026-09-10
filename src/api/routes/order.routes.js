import express from "express";
import { createOrder, getOrders, activateOrder } from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, createOrder);
router.get("/", requireAuth, getOrders);
router.post("/:id/activate", requireAuth, activateOrder);

export default router;
