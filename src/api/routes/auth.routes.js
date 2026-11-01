import express from "express";
import {
  loginFast,
  loginEmail,
  setClientPassword,
  resetClientPassword,
  getProfile,
  deleteAccount,
  restoreClientAccount,
  changePassword,
  logoutAll,
  logout,
  getCsrfTokenController,
  updatePreferences
} from "../controllers/auth.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.get("/csrf-token", getCsrfTokenController);
router.post("/set-password", authRateLimiter, setClientPassword);
router.post("/reset-client-password", requireAuth, requireAdmin, authRateLimiter, resetClientPassword);
router.post("/login-fast", authRateLimiter, loginFast);
router.post("/login-email", authRateLimiter, loginEmail);
router.get("/profile", requireAuth, getProfile);
router.patch("/preferences", requireAuth, updatePreferences);
router.post("/change-password", requireAuth, authRateLimiter, changePassword);
router.post("/logout-all", requireAuth, logoutAll);
router.post("/logout", logout);
router.post("/restore-client-account", requireAuth, requireAdmin, restoreClientAccount);
router.delete("/delete-account", requireAuth, deleteAccount);
router.post("/delete-account", requireAuth, deleteAccount);

export default router;

