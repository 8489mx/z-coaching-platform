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
    // Deep check-in v3: Lifestyle variance classification
    lifestyle_variance: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "NORMAL_WORK",
    },
    // Deep check-in v3: Bowel regularity (False Plateau Triad element)
    bowel_regularity: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "REGULAR",
    },
    // Deep check-in v3: Composite sleep/stress score (1-5)
    sleep_stress_composite: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3,
    },
    // Deep check-in v3: Menstrual phase for female clients
    menstrual_phase: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "NOT_APPLICABLE",
    },
    // Deep check-in v3: Forward-looking — travel next week
    next_week_travel: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    // Deep check-in v3: Forward-looking — gym availability next week
    next_week_gym_available: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    // Deep check-in v3: Forward-looking — realistic training days
    next_week_realistic_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Deep check-in v3: Forward-looking — free text notes
    next_week_notes: {
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
