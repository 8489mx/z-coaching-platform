export const CHECKIN_ENGINE_VERSION = "checkin-engine-v1";

export const CheckinAnalysisStatus = Object.freeze({
  ON_TRACK: "ON_TRACK",
  PLATEAU_DETECTED: "PLATEAU_DETECTED",
  RAPID_LOSS_WARNING: "RAPID_LOSS_WARNING",
  HIGH_FATIGUE_WARNING: "HIGH_FATIGUE_WARNING",
  POOR_ADHERENCE: "POOR_ADHERENCE",
  INJURY_FLAGGED: "INJURY_FLAGGED",
});

export const AdherenceTier = Object.freeze({
  OPTIMAL: "OPTIMAL",        // >= 85%
  ACCEPTABLE: "ACCEPTABLE",  // 70% - 84%
  LOW: "LOW",                // < 70%
});

export const BiofeedbackAlert = Object.freeze({
  NORMAL: "NORMAL",
  HIGH_HUNGER: "HIGH_HUNGER",
  POOR_SLEEP: "POOR_SLEEP",
  HIGH_STRESS: "HIGH_STRESS",
  LOW_RECOVERY_ENERGY: "LOW_RECOVERY_ENERGY",
});
