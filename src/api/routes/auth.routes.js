import express from "express";
import { loginFast, loginEmail, registerFast, getProfile, deleteAccount } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register-fast", authRateLimiter, registerFast);
router.post("/login-fast", authRateLimiter, loginFast);
router.post("/login-email", authRateLimiter, loginEmail);
router.get("/profile", requireAuth, getProfile);
router.delete("/delete-account", requireAuth, deleteAccount);
router.post("/delete-account", requireAuth, deleteAccount);

export default router;
