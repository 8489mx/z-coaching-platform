import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
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
