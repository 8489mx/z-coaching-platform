import express from "express";
import {
  getSubscriptionOverview,
  renewSubscription,
  updateSubscription
} from "../controllers/subscription.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/overview", requireAuth, requireAdmin, getSubscriptionOverview);
router.put("/renew/:user_id", requireAuth, requireAdmin, renewSubscription);
router.put("/update/:user_id", requireAuth, requireAdmin, updateSubscription);

export default router;
