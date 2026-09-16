import {
  ADAPTATION_ENGINE_VERSION,
  AdaptationAction,
  AdaptationReasonCode,
} from "./domain/enums.js";
import { CheckinAnalysisStatus } from "../checkin-engine/index.js";
import { evaluateJointPainAndFirewall } from "../execution-engines/biomechanics-firewall-engine.js";

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
    currentMasterProgram.nutrition_program?.macro_targets?.calories_kcal ||
    currentMasterProgram.nutrition_program?.targets?.calories_kcal ||
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
  } else if (
    status === CheckinAnalysisStatus.PLATEAU_DETECTED || 
    status === "TRUE_PLATEAU" || 
    status === "CONFIRMED_PLATEAU" || 
    (typeof checkinAnalysis.suggested_calorie_delta === "number" && checkinAnalysis.suggested_calorie_delta < 0) ||
    (typeof checkinAnalysis.calorie_adjustment === "number" && checkinAnalysis.calorie_adjustment < 0)
  ) {
    const isFemale = options.isFemale ?? checkinAnalysis.is_female ?? (currentMasterProgram.client?.gender === 'female');
    const calorieFloor = isFemale ? 1200 : 1500;

    if (adaptedCalories - 125 < calorieFloor) {
      adaptationAction = AdaptationAction.SCHEDULE_REFEED_DAY;
      refeedConfig = Object.freeze({
        refeed_day: "SATURDAY",
        refeed_calories_kcal: Math.round(adaptedCalories + 350),
        refeed_carbohydrate_g: Math.round(adaptedCarbs + 80),
        purpose_ar: "يوم إعادة شحن عالي الكاربوهيدرات لكسر الثبات الأيضي بأمان دون النزول تحت الحد الفسيولوجي الأدنى للسعرات.",
        purpose_en: "High-carb Refeed Day to safely break metabolic plateau without breaching caloric floor.",
      });
      adaptedDailySteps += 750;
      reasons.push({
        code: AdaptationReasonCode.DIET_BREAK_PLATEAU_BREAKER_APPLIED,
        message_ar: `السعرات الحالية (${adaptedCalories}) بلغت الحد الفسيولوجي الأدنى الآمن (${calorieFloor} سعرة). تم قفل خفض السعرات لمنع الهبوط الأيضي، وتفعيل يوم شحن (Refeed) وزيادة 750 خطوة يومياً لكسر الثبات.`,
        message_en: `Caloric floor protection active (${calorieFloor} kcal). Calorie cut prevented; scheduled Refeed and increased daily steps (+750) to break plateau safely.`,
      });
    } else {
      adaptationAction = AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU;
      const calDelta = typeof checkinAnalysis.suggested_calorie_delta === "number"
        ? Math.abs(checkinAnalysis.suggested_calorie_delta)
        : (typeof checkinAnalysis.calorie_adjustment === "number" && checkinAnalysis.calorie_adjustment < 0 ? Math.abs(checkinAnalysis.calorie_adjustment) : 125);
      const carbDelta = typeof checkinAnalysis.suggested_carb_delta_g === "number"
        ? Math.abs(checkinAnalysis.suggested_carb_delta_g)
        : Math.round(calDelta / 4);
      adaptedCalories -= calDelta;
      adaptedCarbs -= carbDelta;
      adaptedFat -= 3;    // -27 kcal
      adaptedDailySteps += 500;
      reasons.push({
        code: AdaptationReasonCode.PLATEAU_DEFICIT_APPLIED,
        message_ar: `ثبات في الوزن مع التزام تام. تم خفض ${calDelta} سعرة يومياً وزيادة النشاط لكسر الثبات.`,
        message_en: `Weight plateau broken with a moderate ${calDelta} kcal reduction.`,
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

  // Meso-Cycle Progression extraction & Adaptive Biomechanical Tuning
  const mesoWeeks = currentMasterProgram.training_program?.weeks || [];
  const targetWeekIndex = Math.min(nextWeekNumber - 1, Math.max(0, mesoWeeks.length - 1));
  let adaptedTrainingWeek = mesoWeeks[targetWeekIndex] ? JSON.parse(JSON.stringify(mesoWeeks[targetWeekIndex])) : null;

  let isDeloadRecommended = false;

  if (adaptedTrainingWeek) {
    // 1. Auto-Deload Detection & Volume Reduction
    const accumulatedWeeks = Number(options.weeks_of_accumulated_training || currentWeekNumber || 1);
    const fatigueScore = Number(options.accumulated_fatigue_score || checkinAnalysis.fatigue_score || (status === CheckinAnalysisStatus.HIGH_FATIGUE_WARNING ? 8 : 4));
    const isDeloadTriggered = accumulatedWeeks >= 5 || (accumulatedWeeks >= 4 && (fatigueScore >= 7 || status === CheckinAnalysisStatus.HIGH_FATIGUE_WARNING)) || options.force_deload === true;

    if (isDeloadTriggered && !isDietBreakEligible) {
      isDeloadRecommended = true;
      adaptationAction = AdaptationAction.SCHEDULE_DELOAD;
      adaptedTrainingWeek.phase = "DELOAD";
      adaptedTrainingWeek.focus_note = "أسبوع تفريغ أحمال تلقائي (Auto-Deload) لخفض إجهاد الجهاز العصبي والمفاصل";
      adaptedTrainingWeek.target_rir = 4;

      for (const session of (adaptedTrainingWeek.sessions || [])) {
        for (const ex of (session.exercises || [])) {
          ex.sets = Math.max(2, Math.round(Number(ex.sets || 3) * 0.60));
          ex.target_sets = ex.sets;
          ex.rir = 4;
          ex.target_rir = 4;
        }
      }

      reasons.push({
        code: AdaptationReasonCode.AUTO_DELOAD_FATIGUE_PRESCRIBED,
        message_ar: `أسبوع تفريغ أحمال تلقائي (Deload Week): بعد ${accumulatedWeeks} أسابيع متواصلة من التحميل مع مؤشر إجهاد ${fatigueScore}/10، تم خفض الجولات 40% ورفع RIR إلى 4 للسماح للجهاز العصبي والمفاصل بالتعافي التام.`,
        message_en: `Auto-Deload prescribed after ${accumulatedWeeks} consecutive training weeks with fatigue score ${fatigueScore}/10. Sets reduced by 40% with RIR 4.`,
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
      fiber_g: baseFiber,
      refeed_config: refeedConfig,
    }),
    adapted_training_week: adaptedTrainingWeek ? Object.freeze(adaptedTrainingWeek) : null,
    adapted_cardio: Object.freeze({
      daily_step_target: adaptedDailySteps,
      sessions: Object.freeze(baseCardioSessions),
    }),
    requires_coach_approval: requiresCoachApproval,
  });
}
