import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.headers.cookie) {
    // S4-8 (Option A): Support coach/admin httpOnly cookies
    const match = req.headers.cookie.match(/(?:^|;\s*)coach_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("FATAL: JWT_SECRET environment variable is not defined");
    return res.status(500).json({ error: "Internal security configuration error" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    if (decoded && decoded.id) {
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'role', 'subscription_status', 'token_version']
      });

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User account not found" });
      }

      if (user.subscription_status === 'DEACTIVATED' || user.subscription_status === 'PERMANENTLY_PURGED') {
        return res.status(403).json({ 
          error: "تم إغلاق هذا الحساب بناءً على طلبكم المسبق لحذف الحساب. يرجى التواصل مع الإدارة." 
        });
      }

      // Option B: Mandatory token_version check strictly tied to sessions
      if (typeof decoded.token_version !== 'number' || decoded.token_version !== user.token_version) {
        return res.status(401).json({ 
          error: "Unauthorized: Session has been revoked or expired. Please log in again." 
        });
      }

      req.dbUser = user;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Token expired or invalid" });
  }
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication" });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User account not found" });
    }

    if (user.role !== "ADMIN" && user.role !== "COACH") {
      return res.status(403).json({ error: "Forbidden: Admin privileges required" });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ error: "Internal authorization error" });
  }
};
