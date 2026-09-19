export const CHECKIN_ENGINE_VERSION = "checkin-engine-v3";

export const CheckinAnalysisStatus = Object.freeze({
  ON_TRACK: "ON_TRACK",
  BODY_RECOMP_SUCCESS: "BODY_RECOMP_SUCCESS",
  PLATEAU_DETECTED: "PLATEAU_DETECTED",
  TRUE_PLATEAU: "TRUE_PLATEAU",
  RAPID_LOSS_WARNING: "RAPID_LOSS_WARNING",
  HIGH_FATIGUE_WARNING: "HIGH_FATIGUE_WARNING",
  DELOAD_RECOMMENDED: "DELOAD_RECOMMENDED",
  REFEED_RECOMMENDED: "REFEED_RECOMMENDED",
  POOR_ADHERENCE: "POOR_ADHERENCE",
  INJURY_FLAGGED: "INJURY_FLAGGED",
  // Deep check-in v3: new decision codes
  FALSE_PLATEAU_DETECTED: "FALSE_PLATEAU_DETECTED",
  OCCUPATIONAL_NEAT_LOCK: "OCCUPATIONAL_NEAT_LOCK",
  TRAVEL_WEEK_PREVIEW: "TRAVEL_WEEK_PREVIEW",
  FEMALE_PMS_WATER_RETENTION: "FEMALE_PMS_WATER_RETENTION",
  // Muscle-gain client whose weight stopped rising under good adherence (needs more energy, not less).
  GAIN_STALL: "GAIN_STALL",
});

export const AdherenceTier = Object.freeze({
  OPTIMAL: "OPTIMAL",        // >= 80% (Strict Adherence Gate)
  LOW: "LOW",                // < 80% (Adherence Gate triggers - no calorie cuts)
});

export const BiofeedbackAlert = Object.freeze({
  NORMAL: "NORMAL",
  HIGH_HUNGER: "HIGH_HUNGER",
  POOR_SLEEP: "POOR_SLEEP",
  HIGH_STRESS: "HIGH_STRESS",
  LOW_RECOVERY_ENERGY: "LOW_RECOVERY_ENERGY",
  JOINT_DISCOMFORT: "JOINT_DISCOMFORT",
});

// Deep check-in v3: Lifestyle Variance classification
export const LifestyleVariance = Object.freeze({
  NORMAL_WORK: "NORMAL_WORK",
  HOME_VACATION: "HOME_VACATION",
  TRAVEL_AWAY: "TRAVEL_AWAY",
  DOUBLED_EFFORT: "DOUBLED_EFFORT",
  SICK_RECOVERY: "SICK_RECOVERY",
});

// Deep check-in v3: Bowel Regularity for False Plateau Triad
export const BowelRegularity = Object.freeze({
  REGULAR: "REGULAR",
  IRREGULAR: "IRREGULAR",
  CONSTIPATED: "CONSTIPATED",
});

// Deep check-in v3: Menstrual Phase for female clients
export const MenstrualPhase = Object.freeze({
  NOT_APPLICABLE: "NOT_APPLICABLE",
  FOLLICULAR: "FOLLICULAR",
  OVULATION: "OVULATION",
  LUTEAL: "LUTEAL",
  MENSTRUATION: "MENSTRUATION",
});
