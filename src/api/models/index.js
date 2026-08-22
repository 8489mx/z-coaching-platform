import User from "./User.js";
import Program from "./Program.js";
import IntakeSubmission from "./IntakeSubmission.js";
import CheckinSubmission from "./CheckinSubmission.js";
import ProgressPhoto from "./ProgressPhoto.js";
import WorkoutLog from "./WorkoutLog.js";
import Order from "./Order.js";
import NutritionPlan from "./NutritionPlan.js";
import WorkoutPlan from "./WorkoutPlan.js";
import RateLimitLog from "./RateLimitLog.js";

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

User.hasMany(WorkoutLog, { foreignKey: "user_id", as: "workoutLogs" });
WorkoutLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

Program.hasMany(WorkoutLog, { foreignKey: "program_id", as: "workoutLogs" });
WorkoutLog.belongsTo(Program, { foreignKey: "program_id", as: "program" });

User.hasMany(Order, { foreignKey: "client_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "client_id", as: "client" });

User.hasMany(NutritionPlan, { foreignKey: "user_id", as: "nutritionPlans" });
NutritionPlan.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(WorkoutPlan, { foreignKey: "user_id", as: "workoutPlans" });
WorkoutPlan.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Aliases for seamless schema terminology
const Client = User;

export { 
  User, 
  Client,
  Program, 
  IntakeSubmission, 
  CheckinSubmission, 
  ProgressPhoto, 
  WorkoutLog,
  Order,
  NutritionPlan,
  WorkoutPlan,
  RateLimitLog
};
