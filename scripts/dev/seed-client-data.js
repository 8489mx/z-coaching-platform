import fs from "node:fs";
import sequelize from "../../src/api/config/database.js";
import { User, Program, IntakeSubmission } from "../../src/api/models/index.js";
import { buildMasterEngineV2 } from "../../src/master-engine-v2/index.js";
import { COMPLETE_INTAKE } from "../../test/fixtures/complete-intake.js";

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

async function seedDatabase() {
  await sequelize.authenticate();
  console.log("Connected to MariaDB `z`...");

  // 1. Find or Create User Ahmed Samir
  let user = await User.findOne({ where: { client_code: "CLIENT-AHMED-SAMIR" } });
  if (!user) {
    user = await User.create({
      client_code: "CLIENT-AHMED-SAMIR",
      phone_number: "+201001234567",
      email: "ahmed.samir@example.com",
      full_name: "أحمد سمير",
      role: "CLIENT",
    });
    console.log("✅ User 'أحمد سمير' created with ID:", user.id);
  } else {
    console.log("ℹ️ User 'أحمد سمير' exists with ID:", user.id);
  }

  // 2. Ahmed Samir Intake Payload
  const ahmedIntake = {
    ...COMPLETE_INTAKE,
    personal: {
      ...COMPLETE_INTAKE.personal,
      dateOfBirth: "1995-05-15",
      sex: "MALE",
      residenceCountry: "EG",
    },
    goals: {
      primary: "FAT_LOSS",
      secondaryTraining: "HYPERTROPHY",
    },
    body: {
      ...COMPLETE_INTAKE.body,
      heightCm: 178,
      weightKg: 90.0,
      waistCm: 94.0,
    },
    training: {
      ...COMPLETE_INTAKE.training,
      location: "GYM",
      equipment: [
        { equipmentCode: "BARBELL_AND_PLATES", otherEquipmentText: null, loadCapacity: "HEAVY" },
        { equipmentCode: "SQUAT_RACK", otherEquipmentText: null, loadCapacity: "HEAVY" },
        { equipmentCode: "ADJUSTABLE_BENCH", otherEquipmentText: null, loadCapacity: "HEAVY" },
        { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "HEAVY" },
        { equipmentCode: "CABLE_STATION", otherEquipmentText: null, loadCapacity: "HEAVY" },
      ],
      preferredDaysPerWeek: 4,
      maxDaysPerWeek: 4,
      availableTrainingDays: ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"],
    },
    cardio: {
      ...COMPLETE_INTAKE.cardio,
      averageDailySteps: 8000,
    },
  };

  // 3. Save Intake Submission
  let intakeSub = await IntakeSubmission.findOne({ where: { user_id: user.id } });
  if (!intakeSub) {
    intakeSub = await IntakeSubmission.create({
      user_id: user.id,
      status: "PROCESSED",
      answers: ahmedIntake,
    });
    console.log("✅ Intake submission created with ID:", intakeSub.id);
  }

  // 4. Generate Master Program V2 via Real Engine Pipeline
  const masterProgram = buildMasterEngineV2({
    intake: ahmedIntake,
    evaluationContext: {
      system_time: "2026-08-16T10:00:00.000Z",
      assessmentDate: "2026-08-16",
    },
    nutritionFoodCatalog,
    options: { weeksCount: 5 },
  });

  // 5. Save/Update Program in MariaDB
  let program = await Program.findOne({ where: { user_id: user.id } });
  if (!program) {
    program = await Program.create({
      user_id: user.id,
      program_data: masterProgram,
    });
    console.log("✅ Program created in MariaDB `z` with ID:", program.id);
  } else {
    program.program_data = masterProgram;
    await program.save();
    console.log("✅ Program updated in MariaDB `z` with ID:", program.id);
  }

  console.log("\n🚀 Verification DB Query:");
  const verified = await Program.findOne({
    where: { user_id: user.id },
    include: [{ model: User, as: "user" }]
  });
  console.log("Found Program ID:", verified.id);
  console.log("Associated User:", verified.user.full_name, `(${verified.user.email})`);
  console.log("Weeks Count:", verified.program_data.training_program.weeks.length);
  console.log("Upper A Exercises Count:", verified.program_data.training_program.weeks[0].sessions[0].exercises.length);
  console.log("Quantized Meals Count:", verified.program_data.nutrition_program.quantized_plan.meals.length);
}

seedDatabase()
  .catch(console.error)
  .finally(() => sequelize.close());
