const { evaluateIntake } = require('../src/intake-decision-engine');
const { buildTrainingEngine } = require('../src/training-engine');

// Setup the raw intake for the user's specific scenario
const rawIntake = {
  personal: {
    dateOfBirth: "1990-01-01",
    biologicalSex: "MALE"
  },
  medical: {
    pregnancyStatus: "NONE",
    conditions: [],
    medications: [],
    injuries: [],
    movementRestrictions: [],
    symptoms: [],
    painLevel: 0
  },
  nutrition: {
    primaryGoal: "MUSCLE_GAIN",
    budgetTier: "MEDIUM",
    allergies: [],
    intolerances: [],
    dislikedFoods: [],
    dietaryPreferences: [],
    unavailableEatingWindows: [],
    preferredMealCount: 4
  },
  training: {
    primaryGoal: "HYPERTROPHY",
    availability: {
      location: "GYM",
      preferredDaysPerWeek: 3, // User requested 3 days
      maxDaysPerWeek: 4,
      maxSessionDurationMinutes: 60,
      fixedDays: ["MONDAY", "WEDNESDAY", "FRIDAY"]
    },
    availableEquipment: [], // Empty means default GYM profile applies
    recentTrainingHistory: {
      experienceLevel: "RETURNING_AFTER_BREAK", // User requested returning from break
      monthsContinuousTraining: 0
    },
    additionalSports: []
  }
};

const evaluationContext = {
  assessmentDate: "2026-07-27"
};

try {
  // 1. Run Intake Engine
  const intakeDecision = evaluateIntake(rawIntake, evaluationContext);
  
  // 2. Run Training Engine
  const trainingOutput = buildTrainingEngine(intakeDecision);
  
  // Log the final training schedule
  console.log(JSON.stringify(trainingOutput.weekly_schedule.sessions, null, 2));

} catch (error) {
  console.error("Error:", error.message);
}
