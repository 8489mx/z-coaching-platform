import {
  ADAPTATION_ENGINE_VERSION,
  AdaptationAction,
  AdaptationReasonCode,
} from "./domain/enums.js";
import { CheckinAnalysisStatus } from "../checkin-engine/index.js";
import { CLINICAL_GUIDELINES } from "../config/clinical-guidelines.js";
import { evaluateJointPainAndFirewall } from "../execution-engines/biomechanics-firewall-engine.js";
import { analyzeBloodworkBiomarkers } from "../execution-engines/biomarker-engine.js";
import {
  rescheduleMissedWorkout,
  calculateTrainingReadiness,
  autoregulateWorkoutSession,
  evaluateCumulativeFatigue
} from "../execution-engines/autoregulated-recovery-engine.js";

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
// Statuses where the measured expenditure may retune calories. Locks (poor adherence, injury, PMS buffer,
// false plateau, desk-job NEAT lock, fatigue refeed) and recomposition success keep their own rules.
// Rapid loss is not one of them: the measured burn aims at the goal's deficit and could cut the
// calories of a client already losing more than 1.5% a week, so rapid loss keeps its +150 rule.
const MAX_KCAL_PER_KG = 55;

const OBSERVED_TDEE_STATUSES = new Set([
  CheckinAnalysisStatus.ON_TRACK,
  CheckinAnalysisStatus.PLATEAU_DETECTED,
  CheckinAnalysisStatus.TRUE_PLATEAU,
  CheckinAnalysisStatus.GAIN_STALL,
]);

export function alignMacrosWithCalories(targetCalories, proteinG, carbsG, fatG, constraints = {}) {
  // 1. Protein is inviolable: never altered to satisfy an energy rounding diff
  const p = Math.max(0, Math.round(proteinG));

  // 2. Computational lower bound for fat (default 20g or client constraint):
  // NOTE: This is strictly an algorithmic guard against zero/negative lipid values during macro alignment.
  // It is NOT a universal dietary target (optimal intake requires ~20-35% energy or 0.6-1.0 g/kg).
  // The client's individualized planned target (fatG) is respected and preserved.
  const minFat = Math.max(15, Number(constraints.min_fat_g ?? constraints.minFatG ?? 20));
  const minCarbs = Math.max(0, Number(constraints.min_carbs_g ?? constraints.minCarbsG ?? 0));

  let f = Math.max(minFat, Math.round(fatG));
  const remainingForCarbs = targetCalories - (p * 4) - (f * 9);

  let alignmentConflict = false;
  let conflictReason = null;
  let c = 0;

  if (remainingForCarbs < minCarbs * 4) {
    c = minCarbs;
    alignmentConflict = true;
    conflictReason = "CALORIC_BUDGET_BELOW_MINIMUM_MACRO_CONSTRAINTS";
  } else {
    c = Math.round(remainingForCarbs / 4);
  }

  const macroSum = p * 4 + c * 4 + f * 9;
  const diff = targetCalories - macroSum;

  return {
    protein: p,
    carbs: c,
    fat: f,
    macroSum,
    diff,
    alignment_conflict: alignmentConflict,
    conflict_reason: conflictReason
  };
}

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
    currentMasterProgram.nutrition_program?.macro_targets?.calories_kcal ||
    currentMasterProgram.nutrition_program?.targets?.calories_kcal ||
    currentMasterProgram.nutrition_program?.targets?.target_calories_kcal ||
    currentMasterProgram.nutrition_program?.targets?.target_calories ||
    currentMasterProgram.nutrition_program?.target_calories_kcal ||
    currentMasterProgram.nutrition?.targets?.calories ||
    energyTargetStage?.target_calories ||
    energyTargetStage?.target_calories_kcal ||
    2000;
  const baseProtein =
    currentMasterProgram.nutrition_program?.macro_targets?.protein_g ||
    currentMasterProgram.nutrition_program?.targets?.protein_g ||
    currentMasterProgram.nutrition?.targets?.protein ||
    macroTargetsStage?.protein?.target_g ||
    macroTargetsStage?.protein_g ||
    160;
  const baseCarbs =
    currentMasterProgram.nutrition_program?.macro_targets?.carbohydrate_g ||
    currentMasterProgram.nutrition_program?.macro_targets?.carb_g ||
    currentMasterProgram.nutrition_program?.targets?.carbohydrate_g ||
    currentMasterProgram.nutrition?.targets?.carbs ||
    macroTargetsStage?.carbohydrate?.target_g ||
    macroTargetsStage?.carbohydrate_g ||
    200;
  const baseFat =
    currentMasterProgram.nutrition_program?.macro_targets?.fat_g ||
    currentMasterProgram.nutrition_program?.targets?.fat_g ||
    currentMasterProgram.nutrition?.targets?.fats ||
    macroTargetsStage?.fat?.target_g ||
    macroTargetsStage?.fat_g ||
    60;
  const baseFiber =
    macroTargetsStage?.fiber_target_g ||
    macroTargetsStage?.fiber_g ||
    currentMasterProgram.nutrition_program?.macro_targets?.fiber_g ||
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


  const consecutiveHighComplianceWeeks = Number(
    options.consecutive_high_compliance_weeks || 
    options.consecutiveHighComplianceWeeks || 
    options.consecutive_deficit_weeks || 
    options.consecutiveDeficitWeeks || 
    checkinAnalysis.consecutive_deficit_weeks || 
    checkinAnalysis.consecutive_high_compliance_weeks || 
    0
  );
  const isDietBreakEligible = (consecutiveHighComplianceWeeks >= 6 && (status === CheckinAnalysisStatus.ON_TRACK || status === CheckinAnalysisStatus.HIGH_FATIGUE_WARNING || status === CheckinAnalysisStatus.PLATEAU_DETECTED || status === "CONFIRMED_PLATEAU"))
    || options.force_diet_break === true
    || checkinAnalysis.is_diet_break === true
    || checkinAnalysis.decision === "SCHEDULE_DIET_BREAK"
    || status === "DIET_BREAK_RECOMMENDED";

  
  const isReverseDieting = options.diet_framework === "REVERSE_DIETING" || options.dietFramework === "REVERSE_DIETING";

  if (isDietBreakEligible) {
    adaptationAction = AdaptationAction.SCHEDULE_DIET_BREAK;
    requiresCoachApproval = true;
    const observedTdee = checkinAnalysis.adaptive_tdee?.ready ? Number(checkinAnalysis.adaptive_tdee.observed_tdee_kcal) : null;
    const planTdee = Number(currentMasterProgram.nutrition_program?.targets?.tdee || currentMasterProgram.nutrition_program?.tdee);
    const maintenanceCalories = Number.isFinite(observedTdee) && observedTdee > baseEnergy
      ? Math.round(observedTdee)
      : (Number.isFinite(planTdee) && planTdee > baseEnergy ? Math.round(planTdee) : Math.round(baseEnergy + 350));

    adaptedCalories = maintenanceCalories;
    const aligned = alignMacrosWithCalories(adaptedCalories, adaptedProtein, adaptedCarbs, adaptedFat);
    adaptedCarbs = aligned.carbs;
    adaptedFat = aligned.fat;
    reasons.push({
      code: AdaptationReasonCode.DIET_BREAK_TRIGGERED_AFTER_COMPLIANCE,
      message_ar: `استراحة دايت مبرمجة (Diet Break)! بعد ${consecutiveHighComplianceWeeks} أسابيع متصلة من الالتزام العالي (≥85%)، تم رفع السعرات إلى حد الصيانة (${adaptedCalories} سعرة) لمدة أسبوع لإعادة تنشيط هرمونات الحرق (Leptin و T3) وإراحة الجهاز العصبي قبل استئناف العجز.`,
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
      const aligned = alignMacrosWithCalories(adaptedCalories, adaptedProtein, adaptedCarbs + 18, adaptedFat);
      adaptedCarbs = aligned.carbs;
      adaptedFat = aligned.fat;
      reasons.push({
        code: AdaptationReasonCode.REVERSE_DIET_SURPLUS_APPLIED || "REVERSE_DIET_SURPLUS_APPLIED",
        message_ar: "محرك الدايت العكسي (Reverse Dieting): استجابة فسيولوجية ممتازة وثبات في الوزن (تغير ≤ 0.3 كجم). تم رفع السعرات بمقدار +75 سعرة حرارية (+18 جم كاربوهيدرات معقدة) لإعادة تنشيط سرعة الحرق تدريجياً دون زيادة دهون.",
        message_en: "Reverse Dieting Engine: Optimal metabolic response (weight delta ≤ 0.3kg). Added +75 kcal (+18g carbs) to progressively restore metabolic rate without fat gain.",
      });
    }
  } else if (
    status === CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION ||
    checkinAnalysis.female_cycle_buffer?.deficit_adjustment_locked ||
    options.is_pms_active === true
  ) {
    adaptationAction = AdaptationAction.MAINTAIN_TRAJECTORY;
    const shouldApplyComfortBuffer = options.apply_pms_comfort_snack === true || checkinAnalysis.female_cycle_buffer?.apply_comfort_snack === true;
    const comfortKcal = shouldApplyComfortBuffer
      ? (Number(checkinAnalysis.female_cycle_buffer?.comfort_snack_added_kcal || checkinAnalysis.female_cycle_buffer?.comfort_snack_recommended_kcal) || 150)
      : 0;
    adaptedCalories = Math.round(baseEnergy + comfortKcal);
    const aligned = alignMacrosWithCalories(adaptedCalories, adaptedProtein, shouldApplyComfortBuffer ? adaptedCarbs + 35 : adaptedCarbs, adaptedFat);
    adaptedCarbs = aligned.carbs;
    adaptedFat = aligned.fat;
    reasons.push({
      code: AdaptationReasonCode.FEMALE_CYCLE_PMS_BUFFER_APPLIED,
      message_ar: shouldApplyComfortBuffer
        ? `صمام أمان الدورة الهرمونية (طور الـ Luteal / PMS): تم قفل خفض السعرات وتفعيل سناك الراحة (+${comfortKcal} سعرة) بتوجيه المدرب لدعم التوازن الهرموني وتهدئة الرغبة في السكريات.`
        : `صمام أمان الدورة الهرمونية (طور الـ Luteal / PMS): تم قفل أي خفض للسعرات لمنع القرارات المتسرعة الناتجة عن الاحتباس المائي الهرموني (${adaptedCalories} سعرة محفوظة). يتوفر اقتراح استرشادي للمدرب بإمكانية سناك مهدئ (+150 سعرة) عند الحاجة.`,
      message_en: shouldApplyComfortBuffer
        ? `Female Cycle PMS Safety Gate: deficit cuts locked and comfort buffer (+${comfortKcal} kcal) applied under coach direction.`
        : `Female Cycle PMS Safety Gate active: deficit cut locked; current baseline (${adaptedCalories} kcal) maintained against fluid retention. Discretionary comfort buffer available for coach review.`,
      deficit_locked: true,
      discretionary_comfort_buffer_available: !shouldApplyComfortBuffer
    });
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
  } else if (checkinAnalysis.adaptive_tdee?.ready === true && OBSERVED_TDEE_STATUSES.has(status)) {
    // Real expenditure is known (>= 2 weeks of trend): the target follows the client's measured response
    // instead of the fixed +-125/+150 rules below. Protein stays; carbs absorb the change, fat only when
    // carbs would drop under 50 g.
    const tdee = checkinAnalysis.adaptive_tdee;
    const newCalories = Math.round(Number(tdee.recommended_target_kcal));
    const delta = newCalories - adaptedCalories;
    let carbDelta = Math.round(delta / 4);
    let fatDelta = 0;
    if (adaptedCarbs + carbDelta < 50) {
      const shortfallKcal = (50 - (adaptedCarbs + carbDelta)) * 4;
      carbDelta = 50 - adaptedCarbs;
      fatDelta = -Math.round(shortfallKcal / 9);
    }
    adaptationAction = AdaptationAction.APPLY_OBSERVED_TDEE;
    adaptedCalories = newCalories;
    const aligned = alignMacrosWithCalories(adaptedCalories, adaptedProtein, adaptedCarbs + carbDelta, adaptedFat);
    adaptedCarbs = aligned.carbs;
    adaptedFat = aligned.fat;

    reasons.push({
      code: AdaptationReasonCode.OBSERVED_TDEE_APPLIED,
      message_ar: tdee.reason_ar,
      message_en: `Observed expenditure ${tdee.observed_tdee_kcal} kcal/day from ${tdee.weeks_used} check-ins (trend ${tdee.weight_trend_kg_per_week} kg/week). Target set to ${newCalories} kcal (step ${delta >= 0 ? "+" : ""}${delta}).`,
    });
  } else if (status === CheckinAnalysisStatus.RAPID_LOSS_WARNING) {
    adaptationAction = AdaptationAction.INCREASE_CALORIES_RAPID_LOSS;
    adaptedCalories += 150;
    adaptedCarbs += 30;
    adaptedFat += 3;

    reasons.push({
      code: AdaptationReasonCode.RAPID_LOSS_SURPLUS_APPLIED,
      message_ar: "معدل النزول سريع (>1.5% أسبوعياً). تمت إضافة 150 سعرة لحماية الكتلة العضلية ومنع الهبوط الأيضي.",
      message_en: "Rapid weight loss rate detected (>1.5%/wk). Added +150 kcal to protect lean mass.",
    });
  } else if (status === CheckinAnalysisStatus.GAIN_STALL) {
    const calDelta = typeof checkinAnalysis.suggested_calorie_delta === "number" && checkinAnalysis.suggested_calorie_delta > 0
      ? checkinAnalysis.suggested_calorie_delta
      : 125;
    const carbDelta = typeof checkinAnalysis.suggested_carb_delta_g === "number" && checkinAnalysis.suggested_carb_delta_g > 0
      ? checkinAnalysis.suggested_carb_delta_g
      : Math.round(calDelta / 4);
    adaptationAction = AdaptationAction.INCREASE_CALORIES_GAIN_STALL;
    adaptedCalories += calDelta;
    adaptedCarbs += carbDelta;
    reasons.push({
      code: AdaptationReasonCode.GAIN_STALL_SURPLUS_APPLIED,
      message_ar: `توقف الزيادة في الوزن مع التزام تام وهدف بناء عضلي. تمت إضافة ${calDelta} سعرة يومياً من الكاربوهيدرات لاستئناف البناء.`,
      message_en: `Muscle-gain stall under full adherence. Added +${calDelta} kcal from carbohydrates to resume gaining.`,
    });
  } else if (
    status === CheckinAnalysisStatus.PLATEAU_DETECTED || 
    status === "TRUE_PLATEAU" || 
    status === "CONFIRMED_PLATEAU" || 
    (typeof checkinAnalysis.suggested_calorie_delta === "number" && checkinAnalysis.suggested_calorie_delta < 0) ||
    (typeof checkinAnalysis.calorie_adjustment === "number" && checkinAnalysis.calorie_adjustment < 0)
  ) {
    const isFemale = options.isFemale ?? checkinAnalysis.is_female ?? (currentMasterProgram.client?.gender === 'female');
    const calorieFloor = isFemale ? 1200 : 1500;
    // 1. Explicit Sign Validation: deficit deltas are negative, cut magnitude is strictly positive
    const rawRequestedDelta = typeof checkinAnalysis.suggested_calorie_delta === "number"
      ? checkinAnalysis.suggested_calorie_delta
      : (typeof checkinAnalysis.calorie_adjustment === "number" ? checkinAnalysis.calorie_adjustment : -125);
    const requestedCutMagnitude = Math.abs(Number(rawRequestedDelta) || 125);
    const availableCut = Math.max(0, adaptedCalories - calorieFloor);

    if (availableCut <= 0 || availableCut < 75) {
      adaptationAction = AdaptationAction.MAINTAIN_TRAJECTORY;
      requiresCoachApproval = true;
      const shouldScheduleRefeed = options.schedule_refeed_day === true || checkinAnalysis.refeed_approved === true;
      const shouldIncreaseSteps = options.increase_steps === true || checkinAnalysis.increase_steps_approved === true;

      if (shouldScheduleRefeed) {
        adaptationAction = AdaptationAction.SCHEDULE_REFEED_DAY;
        refeedConfig = Object.freeze({
        refeed_day: "SATURDAY",
        refeed_calories_kcal: Math.round(adaptedCalories + 350),
        refeed_carbohydrate_g: Math.round(adaptedCarbs + 88),
        purpose_ar: "يوم إعادة شحن عالي الكاربوهيدرات لكسر الثبات الأيضي بأمان دون النزول تحت الحد الفسيولوجي الأدنى للسعرات.",
        purpose_en: "High-carb Refeed Day to safely break metabolic plateau without breaching caloric floor.",
      });
      }

      if (shouldIncreaseSteps) {
        adaptedDailySteps += Number(options.step_increase || 500);
      }
      reasons.push({
        code: AdaptationReasonCode.DIET_BREAK_PLATEAU_BREAKER_APPLIED,
        message_ar: `السعرات الحالية (${adaptedCalories}) بلغت الحد الفسيولوجي الأدنى الآمن (${calorieFloor} سعرة). تم قفل أي خفض إضافي للسعرات لحماية الأمان الأيضي، وتثبيت الخطة الحالية مع تحويلها لمراجعة المدرب لتقييم الالتزام وجودة الوزن والنوم، وبحث خيارات يوم الشحن (Refeed) أو زيادة النشاط دون تجويع.`,
        message_en: `Caloric floor protection active (${calorieFloor} kcal). Calorie cuts prevented; maintained current plan and routed for coach review to evaluate adherence, recovery, and discretionary Refeed or step adjustments.`,
        floor_locked: true,
        effective_delta: 0,
        suggested_coach_options: {
          discretionary_refeed: true,
          discretionary_step_increase: 500,
          verify_measurement_quality: true
        }
      });
    } else {
      adaptationAction = AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU;
      const effectiveCutMagnitude = Math.min(requestedCutMagnitude, availableCut);
      const effectiveSignedDelta = -effectiveCutMagnitude;
      const effectiveCalDelta = effectiveCutMagnitude;


      adaptedCalories -= effectiveCalDelta;
      const aligned = alignMacrosWithCalories(adaptedCalories, adaptedProtein, adaptedCarbs - Math.round(effectiveCalDelta / 4), adaptedFat);
      adaptedCarbs = aligned.carbs;
      adaptedFat = aligned.fat;





      adaptedDailySteps += 500;
      if (effectiveCalDelta < requestedCutMagnitude) {
        requiresCoachApproval = true;
      }
      reasons.push({
        code: AdaptationReasonCode.PLATEAU_DEFICIT_APPLIED,
        message_ar: effectiveCalDelta < requestedCutMagnitude
          ? `ثبات في الوزن مع التزام تام. تم تقييد الخفض عند ${effectiveCalDelta} سعرة يومياً (بدلاً من ${requestedCutMagnitude}) احتراماً لحد الأمان الأدنى (${calorieFloor} سعرة)، مع زيادة النشاط 500 خطوة لكسر الثبات.`
          : `ثبات في الوزن مع التزام تام. تم خفض ${effectiveCalDelta} سعرة يومياً وزيادة النشاط لكسر الثبات.`,
        message_en: effectiveCalDelta < requestedCutMagnitude
          ? `Plateau deficit capped at ${effectiveCalDelta} kcal (instead of requested ${requestedCutMagnitude}) to respect caloric floor (${calorieFloor} kcal). Increased daily steps (+500).`
          : `Weight plateau broken with a moderate ${effectiveCalDelta} kcal reduction.`,
        requested_delta: -requestedCutMagnitude,
        effective_delta: effectiveSignedDelta
      });
    }
  } else {
    adaptationAction = AdaptationAction.MAINTAIN_TRAJECTORY;
    reasons.push({
      code: AdaptationReasonCode.ON_TRACK_MAINTAINED,
      message_ar: "النزول يسير وفق المعدل المثالي. استمرار على نفس الخطة مع التقدم في أسابيع الدورة التدريبية.",
      message_en: "Optimal trajectory maintained. Progressing to the next meso-cycle week.",
    });
  }

  // Ceiling on increases: 55 kcal per kg of body weight. A gain that stalls at that intake is an
  // adherence or measurement question for the coach, not another +125 kcal (a 66 kg client reached
  // 4100 kcal and 745 g of carbohydrate after a year of stalls). Never cuts below the current plan.
  const currentWeightKg = Number(checkinAnalysis.current_average_weight_kg);
  // With high body fat the plan has a reference weight (lean mass at a healthy body fat, or the
  // adjusted weight - the one the protein uses): the ceiling uses it, or 140 kg would allow 7700 kcal.
  const planTargets = currentMasterProgram.nutrition_program?.targets || {};
  const planReferenceKg = Number(planTargets.protein_reference_weight_kg);
  const usesReferenceWeight = Boolean(planTargets.protein_reference_basis) && planTargets.protein_reference_basis !== "TOTAL_BODY_WEIGHT"
    && Number.isFinite(planReferenceKg) && planReferenceKg > 30;
  const ceilingWeightKg = usesReferenceWeight ? Math.min(currentWeightKg, planReferenceKg) : currentWeightKg;
  if (Number.isFinite(currentWeightKg) && currentWeightKg > 30) {
    const ceiling = Math.max(Math.round(ceilingWeightKg * MAX_KCAL_PER_KG), Math.round(baseEnergy));
    if (adaptedCalories > ceiling) {
      adaptedCarbs = Math.max(50, adaptedCarbs - Math.round((adaptedCalories - ceiling) / 4));
      adaptedCalories = ceiling;
      requiresCoachApproval = true;
      reasons.push({
        code: "CALORIE_CEILING_REACHED",
        message_ar: `وصلت السعرات لسقف ${MAX_KCAL_PER_KG} سعرة لكل كجم من ${usesReferenceWeight ? `الوزن المرجعي (${ceilingWeightKg} كجم)` : "الوزن"} (${ceiling} سعرة). لو الوزن لسه ثابت راجع الالتزام الفعلي بالأكل وطريقة الوزن قبل أي زيادة.`,
        message_en: `Calories reached the ${MAX_KCAL_PER_KG} kcal/kg ceiling (${ceiling} kcal). Review real intake and weighing before any further increase.`,
      });
    }
  }


  // A trainee under 18 is never put in a deficit: the first plan starts at maintenance, and a
  // check-in must not walk it down week after week (eight months of stalls took a 14 year old from
  // 2898 kcal to 1623 before this rule - scripts/simulate-long-journeys.mjs JRN_07). Building
  // muscle keeps its surplus; only the cut is refused.
  if (planTargets.clinical_guardrails?.is_young_trainee === true) {
    const maintenance = Number(planTargets.tdee);
    if (Number.isFinite(maintenance) && maintenance > 0 && adaptedCalories < maintenance) {
      adaptedCarbs = Math.max(50, adaptedCarbs + Math.round((maintenance - adaptedCalories) / 4));
      adaptedCalories = Math.round(maintenance);
      reasons.push({
        code: "YOUNG_TRAINEE_NO_DEFICIT",
        message_ar: `متدرب تحت 18 سنة: السعرات رجعت لاحتياجه اليومي (${adaptedCalories} سعرة). الجسم في مرحلة نمو، والوزن بينضبط بالطول والنشاط مش بتقليل الأكل.`,
        message_en: `Under 18: calories held at maintenance (${adaptedCalories} kcal). A growing body is not put in a deficit.`,
      });
    }
  }

  // Diabetes and insulin resistance: every adjustment above keeps carbohydrate within the same share
  // of energy as the first plan; the excess moves to fat, so months of +150 carb steps cannot creep
  // back to a carbohydrate-heavy plan.
  // The excess keeps the day's balance of the first plan (fat at most 35% of energy, IOM AMDR): it
  // goes to protein where a laboratory protein cap allows (up to 2.2 g/kg of reference weight), then
  // to fat up to 35%; what is left is not added and the coach decides. A plan whose balance already
  // put carbohydrate above 45% (a capped protein) keeps that share.
  const guardrails = currentMasterProgram.nutrition_program?.targets?.clinical_guardrails || currentMasterProgram.clinical_guardrails || {};
  let diabeticMacrosBounded = false;
  if (guardrails.hypoglycemia_guard_active === true && adaptedCalories > 0) {
    const baseCarbShare = baseEnergy > 0 ? (baseCarbs * 4) / baseEnergy : 0;
    const refCarbShare = CLINICAL_GUIDELINES.DIABETES.MAX_CARB_ENERGY_SHARE || CLINICAL_GUIDELINES.DIABETES.REFERENCE_CARB_ENERGY_SHARE || 0.45;
    const carbShare = guardrails.kidney_protein_capped === true
      ? Math.max(refCarbShare, baseCarbShare)
      : refCarbShare;
    const maxCarbG = Math.floor((adaptedCalories * carbShare) / 4);
    if (adaptedCarbs > maxCarbG) {
      diabeticMacrosBounded = true;
      let excessKcal = (adaptedCarbs - maxCarbG) * 4;
      adaptedCarbs = maxCarbG;
      if (guardrails.kidney_protein_capped !== true) {
        const referenceKg = Number(guardrails.energy_reference_weight_kg) || currentWeightKg;
        const maxProteinG = Number.isFinite(referenceKg) && referenceKg > 30
          ? Math.round(referenceKg * CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_PROTEIN_PER_KG)
          : adaptedProtein;
        const addProteinG = Math.min(Math.max(0, maxProteinG - adaptedProtein), Math.floor(excessKcal / 4));
        adaptedProtein += addProteinG;
        excessKcal -= addProteinG * 4;
      }
      const fatRoomKcal = Math.max(0, Math.floor(CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_FAT_ENERGY_SHARE * adaptedCalories) - adaptedFat * 9);
      const toFatKcal = Math.min(excessKcal, fatRoomKcal);
      adaptedFat += Math.floor(toFatKcal / 9);
      excessKcal -= toFatKcal;
      if (excessKcal > 0) {
        adaptedCalories = Math.max(Math.round(baseEnergy), adaptedCalories - Math.round(excessKcal));
        requiresCoachApproval = true;
        reasons.push({
          code: "FAT_SHARE_LIMIT_REACHED",
          message_ar: "الزيادة وقفت عند توازن اليوم: النشويات عند سقف السكر والبروتين محدود، وأي زيادة تانية كانت هتبقى دهون فوق 35% من السعرات. قرار أي زيادة للكوتش مع الطبيب.",
          message_en: "Increase held at the day's balance: carbohydrate at the diabetic ceiling and protein capped; more would be fat above 35% of energy.",
        });
      }
    }
  }

  // Clinical Lab Biomarkers Evaluation during Weekly Adaptation
  const clientWeight = Number(
    options.weight_kg ||
    options.weight ||
    checkinAnalysis.weight_kg ||
    checkinAnalysis.current_weight ||
    currentMasterProgram.client?.weight_kg ||
    currentMasterProgram.client?.weight ||
    75
  );
  const clientGender = options.gender || (options.isFemale ? 'FEMALE' : (currentMasterProgram.client?.gender || 'MALE'));

  const activeBiomarkers = {
    ...(currentMasterProgram.biomarker_analysis?.raw_biomarkers || {}),
    ...(currentMasterProgram.nutrition_program?.biomarker_analysis?.raw_biomarkers || {}),
    ...(currentMasterProgram.nutrition_program?.clinical_safety_shield?.raw_biomarkers || {}),
    ...(options.biomarkers || {}),
    ...(options.baseline_biomarkers || {}),
    ...(checkinAnalysis.biomarkers || {}),
    ...(checkinAnalysis.baseline_biomarkers || {}),
  };

  let adaptationBiomarkersResult = null;
  if (Object.keys(activeBiomarkers).length > 0) {
    adaptationBiomarkersResult = analyzeBloodworkBiomarkers({
      body_weight_kg: clientWeight,
      gender: clientGender,
      ...activeBiomarkers
    });

    if (adaptationBiomarkersResult.has_biomarker_flags) {
      const pCap = adaptationBiomarkersResult.dietary_modifications?.protein_cap_g_per_kg;
      if (pCap) {
        const maxSafeProteinG = Math.round(clientWeight * pCap);
        if (adaptedProtein > maxSafeProteinG) {
          adaptedProtein = maxSafeProteinG;
          reasons.push({
            code: AdaptationReasonCode.CLINICAL_BIOMARKER_PROTECTION_APPLIED,
            message_ar: `تطبيق السد الكلوي الصارم للمؤشرات الحيوية: تم تقييد وتحديد سقف البروتين عند ${adaptedProtein} جم (${pCap} جم/كجم) لحماية وظائف الكلى بناءً على الفحوصات المخبرية.`,
            message_en: `Clinical biomarker renal guardrail active: protein capped at ${adaptedProtein}g (${pCap} g/kg).`
          });
        }
      }

      if (options.biomarkers || checkinAnalysis.biomarkers) {
        requiresCoachApproval = true;
        reasons.push({
          code: AdaptationReasonCode.CLINICAL_BIOMARKER_PROTECTION_APPLIED,
          message_ar: `تم رصد فحوصات طبية جديدة أثناء المتابعة (${adaptationBiomarkersResult.flags.map(f => f.biomarker).join('، ')}). تم تفعيل الحماية وتوجيه الخطة لمراجعة المدرب.`,
          message_en: `New clinical biomarkers submitted during checkin. Safety shields active, routed for coach review.`
        });
      }
    }
  }

  // Meso-Cycle Progression extraction & Adaptive Biomechanical Tuning
  const mesoWeeks = currentMasterProgram.training_program?.weeks || [];
  const targetWeekIndex = Math.min(nextWeekNumber - 1, Math.max(0, mesoWeeks.length - 1));
  let adaptedTrainingWeek = mesoWeeks[targetWeekIndex] ? JSON.parse(JSON.stringify(mesoWeeks[targetWeekIndex])) : null;

  // P0 Clinical Safety: Lock and suspend all physical training sessions on cardiac emergency or clinical lockout
  if (checkinAnalysis.training_locked === true || status === CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG) {
    adaptedTrainingWeek = null;
    reasons.push({
      code: "CLINICAL_TRAINING_LOCKOUT",
      message_ar: "تم إيقاف وتعليق كافة الحصص التدريبية بموجب قفل السلامة السريرية الطارئة (أعراض قلبية أو إغماء مرتبطة بالمجهود).",
      message_en: "All workout sessions suspended under clinical emergency lockout."
    });
  }

  let isDeloadRecommended = false;

  if (adaptedTrainingWeek) {
    // 1. Differentiated Deload & Autoregulation
    const clientExp = String(
      options.experience ||
      checkinAnalysis.experience ||
      currentMasterProgram.client?.experience ||
      currentMasterProgram.training_program?.experience ||
      "BEGINNER"
    ).toUpperCase();
    const isClientAdvanced = clientExp === "ADVANCED";
    const isClientIntermediate = clientExp === "INTERMEDIATE";
    const isClientBeginner = !isClientAdvanced && !isClientIntermediate;

    const accumulatedWeeks = Number(options.weeks_of_accumulated_training || currentWeekNumber || 1);
    const fatigueScore = Number(options.accumulated_fatigue_score || checkinAnalysis.fatigue_score || (status === CheckinAnalysisStatus.HIGH_FATIGUE_WARNING ? 8 : 4));

    const hasInsufficientLogData = options.has_insufficient_training_data === true ||
      checkinAnalysis.has_insufficient_training_data === true ||
      checkinAnalysis.unreliable_training_data === true;

    let isDeloadTriggered = false;

    if (hasInsufficientLogData) {
      // Guard: never infer accumulated fatigue or force deload on incomplete logs
      isDeloadTriggered = false;
      requiresCoachApproval = true;
      reasons.push({
        code: "INSUFFICIENT_TRAINING_LOGS_HOLD",
        message_ar: "بيانات التدريب المسجلة غير كافية لتقييم الإجهاد التراكمي بدقة؛ تم تثبيت الخطة وتوجيه القرار لمراجعة المدرب قبل تعديل الأحمال.",
        message_en: "Insufficient workout logs to reliably determine fatigue accumulation. Preserved training plan and routed for coach review.",
      });
    } else if (options.force_deload === true || options.planned_deload === true || checkinAnalysis.deload_approved === true) {
      isDeloadTriggered = true;
    } else if (
      Number(options.accumulated_fatigue_score || checkinAnalysis.fatigue_score) >= 7 ||
      (accumulatedWeeks >= 4 && (fatigueScore >= 7 || status === CheckinAnalysisStatus.HIGH_FATIGUE_WARNING))
    ) {
      isDeloadTriggered = true;
    } else if (accumulatedWeeks >= 5) {
      if (isClientBeginner && fatigueScore < 6 && options.planned_deload !== true) {
        // Novice without fatigue continues progression/consolidation
        isDeloadTriggered = false;
        adaptedTrainingWeek.phase = "CONSOLIDATION";
        adaptedTrainingWeek.focus_note = "أسبوع تثبيت الأداء للمبتدئ: استمرار التكنيك المحكم والتقدم الآمن دون الحاجة لتفريغ أحمال حاد.";
        reasons.push({
          code: "BEGINNER_CONSOLIDATION_MAINTAINED",
          message_ar: `المتدرب في مرحلة التأسيس (مبتدئ) بمؤشر إجهاد منخفض (${fatigueScore}/10). تم الاستمرار في تثبيت الأداء الحركي دون فرض تفريغ أحمال إجباري.`,
          message_en: `Beginner trainee with low fatigue score (${fatigueScore}/10). Preserved progression and technique consolidation without forced deload.`,
        });
      } else {
        isDeloadTriggered = true;
      }
    }

    if (isDeloadTriggered && !isDietBreakEligible) {
      isDeloadRecommended = true;
      adaptationAction = AdaptationAction.SCHEDULE_DELOAD;
      requiresCoachApproval = true;
      adaptedTrainingWeek.phase = "DELOAD";
      adaptedTrainingWeek.focus_note = isClientAdvanced
        ? "أسبوع تفريغ أحمال تجديدي (Regenerative Deload) لتصفية الإجهاد العصبي المركزي"
        : (isClientIntermediate ? "أسبوع تفريغ أحمال استراتيجي (Strategic Deload) لإراحة المفاصل والأوتار" : "أسبوع تفريغ أحمال خفيف للمبتدئ لتجديد النشاط");
      adaptedTrainingWeek.target_rir = isClientAdvanced ? 4 : 3;

      const deloadVolumeMod = isClientAdvanced ? 0.60 : (isClientIntermediate ? 0.70 : 0.75);

      for (const session of (adaptedTrainingWeek.sessions || [])) {
        for (const ex of (session.exercises || [])) {
          ex.sets = Math.max(2, Math.round(Number(ex.sets || 3) * deloadVolumeMod));
          ex.target_sets = ex.sets;
          ex.rir = adaptedTrainingWeek.target_rir;
          ex.target_rir = adaptedTrainingWeek.target_rir;
        }
      }

      reasons.push({
        code: AdaptationReasonCode.AUTO_DELOAD_FATIGUE_PRESCRIBED,
        message_ar: `أسبوع تفريغ أحمال (${adaptedTrainingWeek.phase}): بعد ${accumulatedWeeks} أسابيع تحميل مع مؤشر إجهاد ${fatigueScore}/10، تم خفض الجولات بنسبة ${Math.round((1 - deloadVolumeMod) * 100)}% وضبط RIR ${adaptedTrainingWeek.target_rir} للتعافي التام.`,
        message_en: `Deload prescribed after ${accumulatedWeeks} consecutive training weeks with fatigue score ${fatigueScore}/10. Sets reduced by ${Math.round((1 - deloadVolumeMod) * 100)}% with RIR ${adaptedTrainingWeek.target_rir}.`,
      });
    }

    // 1b. Female Cycle Luteal/PMS Training Tuning (Unstressed RIR & +30s rest buffer)
    if (!isDeloadRecommended && (status === CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION || checkinAnalysis.female_cycle_buffer?.deficit_adjustment_locked || options.is_pms_active === true)) {
      adaptedTrainingWeek.focus_note = "تخفيف الحمل التدريبي العصبي لمراعاة طور الـ Luteal / PMS (RIR 2-3 وراحة إضافية 30 ثانية)";
      for (const session of (adaptedTrainingWeek.sessions || [])) {
        for (const ex of (session.exercises || [])) {
          ex.rir = Math.min(3, Math.max(2, (Number(ex.rir || 2) + 1)));
          ex.target_rir = ex.rir;
          ex.rest_seconds = Number(ex.rest_seconds || 60) + 30;
          ex.safetyNote = "تخفيف الحمل العصبي ومراعاة طور الدورة الشهرية (RIR 2-3 وراحة إضافية 30 ثانية).";
        }
      }
    }

    // 1c. Missed Workout Dynamic Rescheduling & Recovery Autoregulation (Pillar 7)
    const missedDayIndex = options.missed_day_index !== undefined
      ? options.missed_day_index
      : (options.missed_training_day !== undefined ? options.missed_training_day : checkinAnalysis.missed_workout_day);

    if (missedDayIndex !== undefined && missedDayIndex !== null && Array.isArray(adaptedTrainingWeek.sessions)) {
      const remainingDays = options.remaining_days_in_week !== undefined ? options.remaining_days_in_week : 4;
      const rescheduleResult = rescheduleMissedWorkout({
        sessions: adaptedTrainingWeek.sessions,
        missed_day_index: Number(missedDayIndex),
        remaining_days_in_week: remainingDays,
        trainee_fatigue: options.trainee_fatigue || (fatigueScore >= 7 ? 'HIGH' : 'NORMAL')
      });

      adaptedTrainingWeek.sessions = rescheduleResult.rescheduled_sessions;
      adaptedTrainingWeek.reschedule_info = {
        strategy: rescheduleResult.strategy,
        directive_ar: rescheduleResult.directive_ar
      };

      reasons.push({
        code: "AUTOREGULATED_SCHEDULE_ADAPTED",
        message_ar: rescheduleResult.directive_ar,
        message_en: `Workout schedule autoregulated via ${rescheduleResult.strategy} strategy.`
      });
    }

    // 2. Biomechanical Joint Pain Firewall & Exercise Swapping
    const rawJoint = options.joint_pain_location || options.joint_location || checkinAnalysis.joint_pain_location || checkinAnalysis.joint_pain || (status === CheckinAnalysisStatus.INJURY_FLAGGED ? 'LOWER_BACK' : null);
    const painScore = Number(options.pain_score || checkinAnalysis.pain_score || (status === CheckinAnalysisStatus.INJURY_FLAGGED ? 6 : 0));

    let jointSwappedExercises = [];

    if (rawJoint && painScore >= 3) {
      let normalizedJoint = String(rawJoint).toUpperCase();
      if (normalizedJoint.includes('BACK') || normalizedJoint.includes('ظهر') || normalizedJoint.includes('قطنية')) normalizedJoint = 'LOWER_BACK';
      else if (normalizedJoint.includes('SHOULDER') || normalizedJoint.includes('كتف')) normalizedJoint = 'SHOULDER';
      else if (normalizedJoint.includes('KNEE') || normalizedJoint.includes('ركبة')) normalizedJoint = 'KNEE_PATELLAR';
      else if (normalizedJoint.includes('ELBOW') || normalizedJoint.includes('كوع')) normalizedJoint = 'ELBOW';

      const firewallResult = evaluateJointPainAndFirewall({
        jointLocation: normalizedJoint,
        painScore
      });

      if (firewallResult.firewall_active && Array.isArray(firewallResult.forbidden_movements)) {
        const forbiddenSet = new Set(firewallResult.forbidden_movements.map(m => String(m).toUpperCase()));
        const availableSwaps = firewallResult.immediate_swaps || [];

        for (const session of (adaptedTrainingWeek.sessions || [])) {
          session.exercises = (session.exercises || []).map((ex, exIdx) => {
            const code = String(ex.code || ex.exercise_code || ex.id || '').toUpperCase();
            const isForbidden = forbiddenSet.has(code) || Array.from(forbiddenSet).some(f => code.includes(f) || f.includes(code));
            if (isForbidden && availableSwaps.length > 0) {
              const swapIdx = exIdx % availableSwaps.length;
              const chosenSwap = availableSwaps[swapIdx];

              jointSwappedExercises.push({
                original_code: code,
                original_name: ex.name_ar || ex.name || code,
                swapped_code: chosenSwap.id,
                swapped_name_ar: chosenSwap.name_ar,
                biomechanical_advantage_ar: chosenSwap.biomechanical_advantage_ar
              });

              return {
                ...ex,
                id: `swap_${chosenSwap.id}_${exIdx}`,
                code: chosenSwap.id.toUpperCase(),
                name: chosenSwap.name_ar,
                name_ar: chosenSwap.name_ar,
                name_en: chosenSwap.name_ar,
                is_biomechanical_swap: true,
                original_exercise_code: code,
                biomechanical_advantage_ar: chosenSwap.biomechanical_advantage_ar,
                safetyNote: `بديل بيوميكانيكي آمن لحماية المفصل: ${chosenSwap.biomechanical_advantage_ar}`,
                prescription: {
                  ...(ex.prescription || {}),
                  sets: ex.sets || 3,
                  target_rir: Math.max(2, Number(ex.rir || 2)),
                  clinical_notes_ar: chosenSwap.biomechanical_advantage_ar
                }
              };
            }
            return ex;
          });
        }

        if (jointSwappedExercises.length > 0) {
          adaptationAction = AdaptationAction.SUBSTITUTE_INJURED_EXERCISE;
          requiresCoachApproval = true;
          reasons.push({
            code: AdaptationReasonCode.BIOMECHANICAL_INJURY_FIREWALL_SWAPPED,
            message_ar: `تفعيل جدار حماية المفصل (${normalizedJoint}): تم استبدال ${jointSwappedExercises.length} تمرين ذي حمل قصي بالبدائل البيوميكانيكية الآمنة لحماية المفصل وتسريع الاستشفاء.`,
            message_en: `Biomechanical firewall activated for ${normalizedJoint}: safely substituted ${jointSwappedExercises.length} contraindicated exercises.`,
            swaps: jointSwappedExercises
          });
        }
      }
    }
  }

  // Post-Adjustment Invariant: Strict Calorie Floor Guard & Exact Macro Alignment
  const clientIsFemale = options.isFemale ?? checkinAnalysis.is_female ?? (currentMasterProgram.client?.gender === 'female');
  const finalCalorieFloor = clientIsFemale ? 1200 : 1500;
  if (adaptedCalories < finalCalorieFloor) {
    adaptedCalories = finalCalorieFloor;
  }

  if (!diabeticMacrosBounded && guardrails.hypoglycemia_guard_active !== true) {
    const finalAligned = alignMacrosWithCalories(adaptedCalories, adaptedProtein, adaptedCarbs, adaptedFat);
    adaptedProtein = finalAligned.protein;
    adaptedCarbs = finalAligned.carbs;
    adaptedFat = finalAligned.fat;
  }

  return Object.freeze({
    engine_version: ADAPTATION_ENGINE_VERSION,
    source_program_version: currentMasterProgram.engine_version,
    adapted_week_number: nextWeekNumber,
    adaptation_action: adaptationAction,
    adaptation_reasons: Object.freeze(reasons),
    is_deload_recommended: isDeloadRecommended,
    is_diet_break_recommended: isDietBreakEligible,
    adapted_nutrition: Object.freeze({
      target_calories_kcal: adaptedCalories,
      protein_g: adaptedProtein,
      carbohydrate_g: adaptedCarbs,
      fat_g: adaptedFat,
      fiber_g: Math.max(baseFiber, adaptationBiomarkersResult?.dietary_modifications?.min_fiber_g || 0),
      refeed_config: refeedConfig,
      biomarker_analysis: adaptationBiomarkersResult || currentMasterProgram.biomarker_analysis || null,
      clinical_safety_shield: (adaptationBiomarkersResult?.has_biomarker_flags ? adaptationBiomarkersResult : currentMasterProgram.clinical_safety_shield) || null,
    }),
    adapted_training_week: adaptedTrainingWeek ? Object.freeze(adaptedTrainingWeek) : null,
    adapted_cardio: Object.freeze({
      daily_step_target: adaptedDailySteps,
      sessions: Object.freeze(baseCardioSessions),
    }),
    requires_coach_approval: requiresCoachApproval,
    biomarker_analysis: adaptationBiomarkersResult || currentMasterProgram.biomarker_analysis || null,
    clinical_safety_shield: (adaptationBiomarkersResult?.has_biomarker_flags ? adaptationBiomarkersResult : currentMasterProgram.clinical_safety_shield) || null,
  });
}
