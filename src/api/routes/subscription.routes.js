import express from "express";
import {
  getSubscriptionOverview,
  renewSubscription,
  updateSubscription
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.get("/overview", getSubscriptionOverview);
router.put("/renew/:user_id", renewSubscription);
router.put("/update/:user_id", updateSubscription);

export default router;
