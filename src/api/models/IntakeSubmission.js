import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const IntakeSubmission = sequelize.define("IntakeSubmission", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  answers: {
    type: DataTypes.JSON, // Stores the raw intake payload
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "PROCESSED", "REJECTED"),
    defaultValue: "PENDING",
    allowNull: false,
  },
}, {
  tableName: "intake_submissions",
  timestamps: true,
});

export default IntakeSubmission;
