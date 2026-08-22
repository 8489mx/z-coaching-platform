import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING(25),
    allowNull: false,
  },
  package_tier: {
    type: DataTypes.ENUM("ELITE", "MAX"),
    allowNull: false,
  },
  duration_months: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM("INSTAPAY", "VODAFONE_CASH", "CARD", "BANK_TRANSFER"),
    allowNull: false,
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(5),
    defaultValue: "EGP",
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED", "REFUNDED"),
    defaultValue: "PENDING",
    allowNull: false,
  },
  transaction_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  }
}, {
  tableName: "orders",
  timestamps: true,
});

export default Order;
