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
    type: DataTypes.STRING,
    defaultValue: "PENDING_COACH_REVIEW", // IN_PROGRESS | PENDING_COACH_REVIEW | PAYMENT_CONFIRMED | DRAFT_GENERATED | APPROVED | REJECTED
    allowNull: false,
  },
  progress_percent: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    allowNull: false,
  },
  coach_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: "intake_submissions",
  timestamps: true,
});

export default IntakeSubmission;
