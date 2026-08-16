import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProgressPhoto = sequelize.define("ProgressPhoto", {
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
    defaultValue: 1,
    allowNull: false,
  },
  pose: {
    type: DataTypes.ENUM("FRONT", "SIDE", "BACK"),
    defaultValue: "FRONT",
    allowNull: false,
  },
  photo_url: {
    type: DataTypes.TEXT("long"), // Support Base64 data URI or local image path
    allowNull: false,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: "progress_photos",
  timestamps: true,
});

export default ProgressPhoto;
