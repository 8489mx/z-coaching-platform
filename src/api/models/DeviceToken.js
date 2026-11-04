import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// P2-C7: real push-device registrations. Replaces the pre-C7 stub that returned
// success without storing anything. One row per device token; re-registering
// the same token upserts (new platform/last-seen) instead of duplicating.
// Device tokens are DELIBERATELY excluded from backups: they are bearer
// credentials for pushing to a device, and apps re-register on every launch,
// so a restore self-heals. They ARE erased by account purge.
const DeviceToken = sequelize.define("DeviceToken", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" },
  },
  client_code: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true,
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
  platform: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  last_seen_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "device_tokens",
  timestamps: false,
});

export default DeviceToken;
