import express from "express";
import { loginFast, loginEmail, registerFast, getProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { intakeRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register-fast", registerFast);
router.post("/login-fast", intakeRateLimiter, loginFast);
router.post("/login-email", loginEmail);
router.get("/profile", requireAuth, getProfile);

export default router;
