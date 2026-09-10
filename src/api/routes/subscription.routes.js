import express from "express";
import {
  getSubscriptionOverview,
  renewSubscription,
  updateSubscription
} from "../controllers/subscription.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/overview", requireAuth, getSubscriptionOverview);
router.put("/renew/:user_id", requireAuth, renewSubscription);
router.put("/update/:user_id", requireAuth, updateSubscription);

export default router;
