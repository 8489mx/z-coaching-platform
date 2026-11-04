import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// P2-C7: DB-backed client notification inbox. Replaces the pre-C7 runtime JSON
// file (data/self-hosted-notifications.json), which was invisible to backup and
// survived account purges. Inbox rows ARE included in backups (they are
// client-visible content, not secrets) and ARE erased by account purge.
const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Users", key: "id" },
  },
  client_code: {
    type: DataTypes.STRING,
    allowNull: false,
    // Inbox address: the user's client_code (every user has one, unique).
    // Rows are also addressable by String(user_id) at the route layer, but
    // the stored key is always the client_code.
    index: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "",
  },
  type: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: "GENERAL",
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "notifications",
  timestamps: false,
});

export default Notification;
