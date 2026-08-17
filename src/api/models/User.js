import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  client_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM("ADMIN", "CLIENT"),
    defaultValue: "CLIENT",
    allowNull: false,
  },
  subscription_package: {
    type: DataTypes.STRING,
    defaultValue: "3_MONTHS_VIP",
    allowNull: true,
  },
  subscription_price: {
    type: DataTypes.FLOAT,
    defaultValue: 2500,
    allowNull: true,
  },
  payment_status: {
    type: DataTypes.STRING,
    defaultValue: "PENDING", // PENDING | PAID | UNPAID
    allowNull: true,
  },
  payment_method: {
    type: DataTypes.STRING,
    defaultValue: "INSTAPAY", // INSTAPAY | VODAFONE_CASH | BANK_TRANSFER | CASH
    allowNull: true,
  },
  plan_approval_status: {
    type: DataTypes.STRING,
    defaultValue: "PENDING_COACH_REVIEW", // PENDING_COACH_REVIEW | DRAFT | APPROVED | PUBLISHED
    allowNull: true,
  },
  subscription_start_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  subscription_status: {
    type: DataTypes.STRING,
    defaultValue: "ACTIVE", // ACTIVE | EXPIRING_SOON | EXPIRED
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "users",
  timestamps: true,
});

export default User;
