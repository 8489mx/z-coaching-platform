import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

if (process.env.NODE_ENV === "production") {
  const pwd = String(process.env.DB_PASSWORD || "").trim();
  const weakPasswords = ["123456", "12345678", "123456789", "password", "admin", "root", "toor", "12345", "qwerty", "secret"];
  if (!pwd || pwd.length < 16 || weakPasswords.includes(pwd.toLowerCase()) || pwd.includes("REPLACE_WITH")) {
    throw new Error("FATAL: A cryptographically strong DB_PASSWORD (minimum 16 characters, non-trivial) must be configured in production. Weak or placeholder passwords are strictly forbidden.");
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME || "z",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false, // Set to true to see SQL queries in console
    pool: {
      max: 25,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default sequelize;
