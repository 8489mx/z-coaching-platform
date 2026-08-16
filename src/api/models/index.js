import User from "./User.js";
import Program from "./Program.js";
import IntakeSubmission from "./IntakeSubmission.js";
import CheckinSubmission from "./CheckinSubmission.js";
import ProgressPhoto from "./ProgressPhoto.js";

// Setup associations
User.hasMany(Program, { foreignKey: "user_id", as: "programs" });
Program.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(IntakeSubmission, { foreignKey: "user_id", as: "intakeSubmissions" });
IntakeSubmission.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(CheckinSubmission, { foreignKey: "user_id", as: "checkinSubmissions" });
CheckinSubmission.belongsTo(User, { foreignKey: "user_id", as: "user" });

CheckinSubmission.belongsTo(Program, { foreignKey: "adapted_program_id", as: "adaptedProgram" });

User.hasMany(ProgressPhoto, { foreignKey: "user_id", as: "progressPhotos" });
ProgressPhoto.belongsTo(User, { foreignKey: "user_id", as: "user" });

export { User, Program, IntakeSubmission, CheckinSubmission, ProgressPhoto };
