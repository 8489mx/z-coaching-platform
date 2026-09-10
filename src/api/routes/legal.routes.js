import express from "express";
import { getPrivacyPolicy, getTermsOfService, getDeleteAccountPage } from "../controllers/legal.controller.js";

const router = express.Router();

router.get("/privacy", getPrivacyPolicy);
router.get("/terms", getTermsOfService);
router.get("/delete-account", getDeleteAccountPage);

export default router;
