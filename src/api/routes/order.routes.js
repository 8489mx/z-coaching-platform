import express from "express";
import { createOrder, getOrders, activateOrder } from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.post("/:id/activate", activateOrder);

export default router;
