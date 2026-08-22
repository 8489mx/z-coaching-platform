import {
  ADAPTATION_ENGINE_VERSION,
  AdaptationAction,
  AdaptationReasonCode,
} from "./domain/enums.js";
import { CheckinAnalysisStatus } from "../checkin-engine/index.js";

function requireObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

/**
 * Generates an adapted Master Program for the upcoming week based on check-in biofeedback and weight deltas.
 *
 * @param {Object} inputs
 * @param {Object} inputs.currentMasterProgram - The current active Master Program (V2)
 * @param {import("../checkin-engine/domain/contracts.js").CheckinAnalysisOutput} inputs.checkinAnalysis
 * @param {Object} [inputs.options]
 * @param {number} [inputs.options.currentWeekNumber=1]
 * @returns {import("./domain/contracts.js").AdaptedMasterProgram}
 */
export function buildAdaptedPlan(inputs) {
  requireObject(inputs, "inputs");

  const { currentMasterProgram, checkinAnalysis, options = {} } = inputs;
  requireObject(currentMasterProgram, "currentMasterProgram");
  requireObject(checkinAnalysis, "checkinAnalysis");

  const currentWeekNumber = options.currentWeekNumber || 1;
  const nextWeekNumber = currentWeekNumber + 1;

  // Base Nutrition extraction
  const energyTargetStage = currentMasterProgram.nutrition_program?.stages?.energy_target;
  const macroTargetsStage = currentMasterProgram.nutrition_program?.stages?.macro_targets;

  const baseEnergy =
    energyTargetStage?.target_calories ||
    energyTargetStage?.target_calories_kcal ||
    2000;
  const baseProtein =
    macroTargetsStage?.protein?.target_g ||
    macroTargetsStage?.protein_g ||
    160;
  const baseCarbs =
    macroTargetsStage?.carbohydrate?.target_g ||
    macroTargetsStage?.carbohydrate_g ||
    200;
  const baseFat =
    macroTargetsStage?.fat?.target_g ||
    macroTargetsStage?.fat_g ||
    60;
  const baseFiber =
    macroTargetsStage?.fiber_target_g ||
    macroTargetsStage?.fiber_g ||
    30;

  // Base Cardio extraction
  const baseDailySteps =
    currentMasterProgram.cardio_program?.prescription?.daily_step_target || 8000;
  const baseCardioSessions =
    currentMasterProgram.cardio_program?.weekly_schedule?.sessions || [];

  // Default targets for next week
  let adaptedCalories = Math.round(baseEnergy);
  let adaptedProtein = Math.round(baseProtein);
  let adaptedCarbs = Math.round(baseCarbs);
  let adaptedFat = Math.round(baseFat);
  let adaptedDailySteps = baseDailySteps;
  let refeedConfig = null;

  let adaptationAction = AdaptationAction.MAINTAIN_TRAJECTORY;
  const reasons = [];
  let requiresCoachApproval = false;

  const status = checkinAnalysis.analysis_status;


  const consecutiveHighComplianceWeeks = Number(options.consecutive_high_compliance_weeks || options.consecutiveHighComplianceWeeks || 0);
  const isDietBreakEligible = consecutiveHighComplianceWeeks >= 6 && (status === CheckinAnalysisStatus.ON_TRACK || status === CheckinAnalysisStatus.HIGH_FATIGUE_WARNING || status === CheckinAnalysisStatus.PLATEAU_DETECTED);

  
  const isReverseDieting = options.diet_framework === "REVERSE_DIETING" || options.dietFramework === "REVERSE_DIETING";

  if (isDietBreakEligible) {
    adaptationAction = AdaptationAction.SCHEDULE_DIET_BREAK;
    const maintenanceCalories = Math.round(baseEnergy + 350);
    const maintenanceCarbs = Math.round(baseCarbs + 75);
    adaptedCalories = maintenanceCalories;
    adaptedCarbs = maintenanceCarbs;
    reasons.push({
      code: AdaptationReasonCode.DIET_BREAK_TRIGGERED_AFTER_COMPLIANCE,
      message_ar: "استراحة دايت مبرمجة (Diet Break)! بعد 6 أسابيع متصلة من الالتزام العالي (≥85%)، تم رفع السعرات إلى حد الصيانة (+350 سعرة من الكاربوهيدرات النظيفة) لمدة أسبوع لإعادة تنشيط هرمونات الحرق (Leptin و T3) وإراحة الجهاز العصبي قبل استئناف العجز.",
      message_en: "Adherence-gated Diet Break activated! Following 6 consecutive weeks of high compliance (≥85%), calories increased to maintenance (+350 kcal) for one week to restore leptin, thyroid output, and metabolic rate.",
    });
  } else if (isReverseDieting) {
    adaptationAction = AdaptationAction.INCREASE_CALORIES_REVERSE_DIETING || "INCREASE_CALORIES_REVERSE_DIETING";
    const weightChange = typeof checkinAnalysis.weight_change_kg === "number" ? checkinAnalysis.weight_change_kg : 0;
    if (weightChange > 0.5) {
      // Weight jumped > 0.5kg -> freeze calories for 1 week to allow metabolic adaptation
      reasons.push({
        code: AdaptationReasonCode.REVERSE_DIET_STABILIZATION_MAINTAINED || "REVERSE_DIET_STABILIZATION_MAINTAINED",
        message_ar: "محرك الدايت العكسي (Reverse Dieting): زاد الوزن بمقدار >0.5 كجم هذا الأسبوع، فتم تثبيت السعرات الحالية لأسبوع إضافي للسماح لمعدل الأيض بالاستقرار التام قبل استئناف رفع السعرات.",
        message_en: "Reverse Dieting Engine: Weight increased >0.5kg this week. Calories frozen for one week to stabilize metabolic adaptation before resuming surplus.",
      });
    } else {
      // Weight stable or minor increase <= 0.3kg -> add +75 kcal (+18g carbs)
      adaptedCalories += 75;
      adaptedCarbs += 18;
      reasons.push({
        code: AdaptationReasonCode.REVERSE_DIET_SURPLUS_APPLIED || "REVERSE_DIET_SURPLUS_APPLIED",
        message_ar: "محرك الدايت العكسي (Reverse Dieting): استجابة فسيولوجية ممتازة وثبات في الوزن (تغير ≤ 0.3 كجم). تم رفع السعرات بمقدار +75 سعرة حرارية (+18 جم كاربوهيدرات معقدة) لإعادة تنشيط سرعة الحرق تدريجياً دون زيادة دهون.",
        message_en: "Reverse Dieting Engine: Optimal metabolic response (weight delta ≤ 0.3kg). Added +75 kcal (+18g carbs) to progressively restore metabolic rate without fat gain.",
      });
    }
  } else if (status === CheckinAnalysisStatus.INJURY_FLAGGED) {


    adaptationAction = AdaptationAction.SUBSTITUTE_INJURED_EXERCISE;
    requiresCoachApproval = true;
    reasons.push({
      code: AdaptationReasonCode.INJURY_EXERCISE_MODIFIED,
      message_ar: "تم رصد ألم بالمفاصل. تم تحويل الخطة لمراجعة المدرب لاعتماد التمارين البديلة الآمنة.",
      message_en: "Joint discomfort reported. Forwarded for coach review with safety exercise modifications.",
    });
  } else if (status === CheckinAnalysisStatus.POOR_ADHERENCE) {
    adaptationAction = AdaptationAction.MAINTAIN_TRAJECTORY;
    reasons.push({
      code: AdaptationReasonCode.ADHERENCE_COUNSELING_RECOMMENDED,
      message_ar: "نسبة الالتزام أقل من 70%. تم تثبيت السعرات الحالية والتركيز على تسهيل روتين الوجبات مع المدرب.",
      message_en: "Adherence is below 70%. Maintained current calorie baseline to focus on habit consistency.",
    });
  } else if (status === CheckinAnalysisStatus.HIGH_FATIGUE_WARNING) {
    adaptationAction = AdaptationAction.SCHEDULE_REFEED_DAY;
    refeedConfig = Object.freeze({
      refeed_day: "SATURDAY",
      refeed_calories_kcal: Math.round(adaptedCalories + 400),
      refeed_carbohydrate_g: Math.round(adaptedCarbs + 100),
      purpose_ar: "يوم إعادة شحن عالي الكاربوهيدرات لاستعادة هرمون اللبتين ومخازن الجليكوجين وتخفيف التوتر العصبي.",
      purpose_en: "High-carb Refeed Day to replenish glycogen, restore leptin, and relieve fatigue.",
    });
    reasons.push({
      code: AdaptationReasonCode.REFEED_DAY_PRESCRIBED,
      message_ar: "تمت جدولة يوم إعادة شحن (Refeed) يوم السبت لخفض الإجهاد وتحفيز معدل الأيض دون الإخلال بالعجز الأسبوعي.",
      message_en: "Scheduled a high-carb Refeed Day on Saturday to mitigate fatigue without breaking weekly deficit.",
    });
  } else if (status === CheckinAnalysisStatus.RAPID_LOSS_WARNING) {
    adaptationAction = AdaptationAction.INCREASE_CALORIES_RAPID_LOSS;
    adaptedCalories += 150;
    adaptedCarbs += 30; // +120 kcal
    adaptedFat += 3;    // +27 kcal
    reasons.push({
      code: AdaptationReasonCode.RAPID_LOSS_SURPLUS_APPLIED,
      message_ar: "معدل النزول سريع (>1.5% أسبوعياً). تمت إضافة 150 سعرة لحماية الكتلة العضلية ومنع الهبوط الأيضي.",
      message_en: "Rapid weight loss rate detected (>1.5%/wk). Added +150 kcal to protect lean mass.",
    });
  } else if (status === CheckinAnalysisStatus.PLATEAU_DETECTED) {
    adaptationAction = AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU;
    adaptedCalories -= 125;
    adaptedCarbs -= 25; // -100 kcal
    adaptedFat -= 3;    // -27 kcal
    adaptedDailySteps += 500;
    reasons.push({
      code: AdaptationReasonCode.PLATEAU_DEFICIT_APPLIED,
      message_ar: "ثبات في الوزن مع التزام تام. تم خفض 125 سعرة يومياً من الكارب والدهون وزيادة 500 خطوة لكسر الثبات.",
      message_en: "Weight plateau broken with a moderate 125 kcal reduction and +500 daily step increase.",
    });
  } else {
    adaptationAction = AdaptationAction.MAINTAIN_TRAJECTORY;
    reasons.push({
      code: AdaptationReasonCode.ON_TRACK_MAINTAINED,
      message_ar: "النزول يسير وفق المعدل المثالي. استمرار على نفس الخطة مع التقدم في أسابيع الدورة التدريبية.",
      message_en: "Optimal trajectory maintained. Progressing to the next meso-cycle week.",
    });
  }

  // Meso-Cycle Progression extraction
  const mesoWeeks = currentMasterProgram.training_program?.weeks || [];
  const targetWeekIndex = Math.min(nextWeekNumber - 1, Math.max(0, mesoWeeks.length - 1));
  const adaptedTrainingWeek = mesoWeeks[targetWeekIndex] || null;

  return Object.freeze({
    engine_version: ADAPTATION_ENGINE_VERSION,
    source_program_version: currentMasterProgram.engine_version,
    adapted_week_number: nextWeekNumber,
    adaptation_action: adaptationAction,
    adaptation_reasons: Object.freeze(reasons),
    adapted_nutrition: Object.freeze({
      target_calories_kcal: adaptedCalories,
      protein_g: adaptedProtein,
      carbohydrate_g: adaptedCarbs,
      fat_g: adaptedFat,
      fiber_g: baseFiber,
      refeed_config: refeedConfig,
    }),
    adapted_training_week: adaptedTrainingWeek,
    adapted_cardio: Object.freeze({
      daily_step_target: adaptedDailySteps,
      sessions: Object.freeze(baseCardioSessions),
    }),
    requires_coach_approval: requiresCoachApproval,
  });
}
