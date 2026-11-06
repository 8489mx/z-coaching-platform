import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// B2-SYNC: server-side record of a single meal completion reported by the
// client app (online, or flushed later from the offline queue). Mirrors
// WorkoutLog: one row per reported completion, idempotent by (user_id,
// action_id) so a retried queue flush never stores the same tap twice.
const MealLog = sequelize.define(
  "MealLog",
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
    // Offline queue action id (act_...). The idempotency key: a replayed
    // flush with the same action_id returns the existing row (200), it
    // never creates a second row.
    action_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    day_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    week_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    meal_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meal_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    logged_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "meal_logs",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "action_id"],
      },
    ],
  }
);

export default MealLog;
