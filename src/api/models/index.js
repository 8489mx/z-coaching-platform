import User from "./User.js";
import Program from "./Program.js";

// Setup associations
User.hasMany(Program, { foreignKey: "user_id", as: "programs" });
Program.belongsTo(User, { foreignKey: "user_id", as: "user" });

export { User, Program };
