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
    defaultValue: "1_MONTH",
    allowNull: true,
  },
  subscription_price: {
    type: DataTypes.FLOAT,
    defaultValue: 1500,
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
  }
}, {
  tableName: "users",
  timestamps: true, // adds createdAt and updatedAt
});

export default User;
