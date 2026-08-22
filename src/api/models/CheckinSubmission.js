import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const CheckinSubmission = sequelize.define(
  "CheckinSubmission",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    week_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    daily_weights_kg: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    average_weight_kg: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    weight_change_kg: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    waist_circumference_cm: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    nutrition_adherence_percent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    workouts_completed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    workouts_scheduled: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    biofeedback: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    pain_reports: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    analysis_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "ON_TRACK",
    },
    analysis_output: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    adapted_program_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    coach_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("PENDING_REVIEW", "APPROVED", "AUTO_APPLIED"),
      allowNull: false,
      defaultValue: "AUTO_APPLIED",
    },
  },
  {
    tableName: "checkin_submissions",
    timestamps: true,
  },
);

export default CheckinSubmission;
