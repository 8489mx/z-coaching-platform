import User from "./User.js";
import Program from "./Program.js";
import IntakeSubmission from "./IntakeSubmission.js";

// Setup associations
User.hasMany(Program, { foreignKey: "user_id", as: "programs" });
Program.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(IntakeSubmission, { foreignKey: "user_id", as: "intakeSubmissions" });
IntakeSubmission.belongsTo(User, { foreignKey: "user_id", as: "user" });

export { User, Program, IntakeSubmission };
