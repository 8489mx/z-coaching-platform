import express from "express";
import { 
  loginFast, 
  loginEmail, 
  registerFast, 
  getProfile, 
  deleteAccount,
  changePassword,
  logoutAll,
  getCsrfTokenController
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.get("/csrf-token", getCsrfTokenController);
router.post("/register-fast", authRateLimiter, registerFast);
router.post("/login-fast", authRateLimiter, loginFast);
router.post("/login-email", authRateLimiter, loginEmail);
router.get("/profile", requireAuth, getProfile);
router.post("/change-password", requireAuth, authRateLimiter, changePassword);
router.post("/logout-all", requireAuth, logoutAll);
router.delete("/delete-account", requireAuth, deleteAccount);
router.post("/delete-account", requireAuth, deleteAccount);

export default router;

