import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

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
