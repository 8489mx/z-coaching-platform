import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { recordFailedAttempt, resetAttempts } from "../middlewares/rateLimiter.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "super_secret_jwt_key_123", {
    expiresIn: "30d",
  });
};

export const registerFast = async (req, res) => {
  try {
    const { client_code, phone_number, full_name } = req.body;
    
    if (!client_code || !phone_number) {
      return res.status(400).json({ error: "client_code and phone_number are required" });
    }

    const existingUser = await User.findOne({ where: { client_code } });
    if (existingUser) {
      return res.status(400).json({ error: "Client code already registered" });
    }

    const newUser = await User.create({ client_code, phone_number, full_name });
    const token = generateToken(newUser.id);

    return res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error("registerFast error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginFast = async (req, res) => {
  const ip = req.clientIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { client_code, phone_number } = req.body;

    if (!client_code || !phone_number) {
      return res.status(400).json({ error: "يرجى إدخال كود المشترك ورقم الهاتف المسجل معاً" });
    }

    const cleanCode = String(client_code).trim().replace(/^#+/, '').replace(/^client[-_]?/i, '');
    const cleanPhone = String(phone_number).trim();

    // Query user by client_code or id and matching phone
    const user = await User.findOne({ 
      where: { 
        client_code: cleanCode,
        phone_number: cleanPhone
      } 
    }) || await User.findOne({ 
      where: { 
        id: isNaN(parseInt(cleanCode, 10)) ? 0 : parseInt(cleanCode, 10),
        phone_number: cleanPhone
      } 
    });
    
    if (!user) {
      await recordFailedAttempt(ip, client_code);
      return res.status(401).json({ 
        error: "بيانات الدخول غير صحيحة. يرجى التأكد من كتابة كود المشترك ورقم الهاتف المسجل بشكل دقيق." 
      });
    }

    resetAttempts(ip);
    const token = generateToken(user.id);
    return res.status(200).json({ user, token });
  } catch (err) {
    console.error("loginFast error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id);
    return res.status(200).json({ user, token });
  } catch (err) {
    console.error("loginEmail error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
