import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RateLimitLog = sequelize.define("RateLimitLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  attempted_code: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  attempt_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  last_attempt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "rate_limit_logs",
  timestamps: false,
});

export default RateLimitLog;
