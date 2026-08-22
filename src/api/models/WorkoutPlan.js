import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const WorkoutPlan = sequelize.define("WorkoutPlan", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  split_name: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  days_per_week: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    allowNull: false,
  },
  schedule_data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  cardio_protocol: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  warmup_mobility: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  }
}, {
  tableName: "workout_plans",
  timestamps: true,
});

export default WorkoutPlan;
