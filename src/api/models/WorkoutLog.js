import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const WorkoutLog = sequelize.define(
  "WorkoutLog",
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
    program_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    week_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    day_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    session_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_quick_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    logged_exercises: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 60,
    },
    session_rpe: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 8,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "workout_logs",
    timestamps: true,
  }
);

export default WorkoutLog;
