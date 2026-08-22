import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const NutritionPlan = sequelize.define("NutritionPlan", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  target_calories: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  protein_grams: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  carbs_grams: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fats_grams: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  meals_data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  grocery_list: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  }
}, {
  tableName: "nutrition_plans",
  timestamps: true,
});

export default NutritionPlan;
