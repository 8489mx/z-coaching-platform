import { CheckinSubmission, Program, User, WorkoutLog, ProgressPhoto } from "../models/index.js";
import { evaluateCheckin } from "../../checkin-engine/evaluate-checkin.js";
import { estimateAdaptiveTdee } from "../../checkin-engine/adaptive-tdee.js";
import { CheckinAnalysisStatus } from "../../checkin-engine/domain/enums.js";
import { normalizeLoggedExercise, evaluateDeloadTrigger } from "../../training-engine-v2/progression/index.js";
import { loadProgressionState, buildDeloadDecision } from "../services/progressionService.js";
import { saveProgressPhotoToDisk } from "../utils/photoStorage.js";
import { buildAdaptedPlan } from "../../adaptation-engine/build-adapted-plan.js";
import { mergeAdaptedPlanIntoProgram } from "../utils/planMergeEngine.js";
import { resolveClientPrimaryGoal, resolveClientIsFemale } from "./program.controller.js";
import { resolveTrainingCycleStatus } from "../services/trainingCycleService.js";

/**
 * Submit weekly check-in
 */
// Same statuses the adaptation engine lets the measured TDEE retune (see OBSERVED_TDEE_STATUSES).
const ADAPTIVE_TDEE_STATUSES = new Set([
  CheckinAnalysisStatus.ON_TRACK,
  CheckinAnalysisStatus.PLATEAU_DETECTED,
  CheckinAnalysisStatus.TRUE_PLATEAU,
  CheckinAnalysisStatus.GAIN_STALL,
]);

/**
 * The check-in engine rates hunger/energy/sleep on 1-5 (e.g. energy <= 2 = low, hunger >= 4 = high).
 * The web check-in form uses 1-10 sliders and says so with biofeedback_scale: 10; map 1-2 -> 1 ... 9-10 -> 5.
 */
function toEngineScale(value, scale) {
  const n = Number(value);
  if (!Number.isFinite(n)) return n;
  return Number(scale) === 10 ? Math.min(5, Math.max(1, Math.ceil(n / 2))) : n;
}

export async function submitCheckin(req, res) {
  try {
    const {
      user_id,
      client_id,
      week_number,
      weight_kg,
      waist_circumference_cm,
      hip_circumference_cm,
      nutrition_adherence_percent = 100,
      workouts_completed = 0,
      workouts_scheduled = 4,
      biofeedback = {},
      pain_reports = [],
      client_notes = "",
      photos = [],
      // Deep check-in v3: new fields
      lifestyle_variance = "NORMAL_WORK",
      bowel_regularity = "REGULAR",
      sleep_stress_composite = 3,
      menstrual_phase = "NOT_APPLICABLE",
      next_week_travel = false,
      next_week_gym_available = true,
      next_week_realistic_days = null,
      next_week_notes = null,
    } = req.body;

    let targetUserId = user_id || client_id;
    if (!targetUserId) {
      return res.status(400).json({ success: false, error: "user_id is required" });
    }

    // Resolve real user ID if client_code, phone or pk was passed
    const cleanCode = String(targetUserId).replace('#', '').trim();
    let userObj = await User.findOne({ where: { client_code: cleanCode } });
    if (!userObj && !isNaN(cleanCode)) {
      userObj = await User.findByPk(parseInt(cleanCode, 10));
    }
    if (!userObj) {
      userObj = await User.findOne({ where: { phone_number: cleanCode } });
    }
    if (!userObj) {
      return res.status(400).json({ success: false, error: "المستخدم غير موجود، يرجى تقديم معرف صالح" });
    }
    targetUserId = userObj.id;

    // Resolve Trainee Occupational Baseline (for OCCUPATIONAL_NEAT_LOCK)
    const traineeOccupation = req.body.occupation_type || null;

    // Validate weight inputs: require valid positive weight > 20kg
    const parsedWeight = typeof weight_kg === 'number' ? weight_kg : parseFloat(weight_kg);
    const validSingleWeight = !isNaN(parsedWeight) && parsedWeight > 20 && parsedWeight <= 300;
    const validDailyWeights = Array.isArray(req.body.daily_weights_kg) && req.body.daily_weights_kg.length === 7 && req.body.daily_weights_kg.every(w => {
      const nw = typeof w === 'number' ? w : parseFloat(w);
      return !isNaN(nw) && nw > 20 && nw <= 300;
    });

    if (Array.isArray(req.body.daily_weights_kg) && req.body.daily_weights_kg.length !== 7) {
      return res.status(400).json({ success: false, error: "يجب تسجيل أوزان الأيام السبعة كاملة وحقيقية (7 أوزان يومية) لإرسال المتابعة الأسبوعية" });
    }

    if (!validSingleWeight && !validDailyWeights) {
      return res.status(400).json({ success: false, error: "يجب إدخال وزن حقيقي وصالح (> 20 كجم) لإرسال المتابعة" });
    }

    // The web form and the mobile app send no week: the check-in goes to the week after the client's latest one.
    let targetWeekNumber = Number(week_number);
    if (!Number.isInteger(targetWeekNumber) || targetWeekNumber < 1) {
      const lastWeek = await CheckinSubmission.max("week_number", { where: { user_id: targetUserId } });
      targetWeekNumber = (Number(lastWeek) || 0) + 1;
    }

    // Weekly weight = average of the 7 morning weigh-ins when given (less water noise), else the single entry.
    const dailyWeights = validDailyWeights ? req.body.daily_weights_kg.map((w) => Number(w)) : null;
    const weeklyWeight = dailyWeights
      ? Math.round((dailyWeights.reduce((sum, w) => sum + w, 0) / dailyWeights.length) * 100) / 100
      : parsedWeight;
    // Optional: the client's own average daily calories this week (feeds the adaptive TDEE).
    const reportedIntake = Number(req.body.average_daily_calories);
    const reportedIntakeKcal = Number.isFinite(reportedIntake) && reportedIntake >= 800 && reportedIntake <= 6000 ? Math.round(reportedIntake) : null;

    // Prevent duplicate check-in submission for the same trainee and week
    const existingCheckin = await CheckinSubmission.findOne({
      where: {
        user_id: targetUserId,
        week_number: targetWeekNumber,
      },
    });

    if (existingCheckin) {
      return res.status(409).json({
        success: false,
        error: `تم إرسال متابعة الأسبوع (${targetWeekNumber}) مسبقاً، ولا يمكن تسجيل أكثر من متابعة لنفس الأسبوع`,
        code: "DUPLICATE_CHECKIN_SUBMISSION",
        existing_checkin_id: existingCheckin.id,
      });
    }

    // 1. Fetch previous check-in for deltas and consecutive compliance calculation.
    // Ordered by the week they belong to, not by when they were saved: queued check-ins (the mobile
    // app uploads its offline queue in one go) can share a timestamp, and a tie made the engine
    // compare this week with an older one - a normal half-kilo loss read as a rapid-loss alarm.
    const pastCheckins = await CheckinSubmission.findAll({
      where: { user_id: targetUserId },
      order: [["week_number", "DESC"], ["id", "DESC"]],
    });

    const previousCheckin = pastCheckins.length > 0 ? pastCheckins[0] : null;
    const prevWeight = previousCheckin ? previousCheckin.average_weight_kg : null;
    const prevWaist = previousCheckin ? previousCheckin.waist_circumference_cm : null;
    const isConsecutivePlateau = previousCheckin && previousCheckin.analysis_status === "PLATEAU_DETECTED";

    // Calculate consecutive high compliance weeks (>= 85%)
    let consecutiveHighComplianceWeeks = Number(nutrition_adherence_percent) >= 85 ? 1 : 0;
    if (consecutiveHighComplianceWeeks === 1) {
      for (const c of pastCheckins) {
        if (Number(c.nutrition_adherence_percent) >= 85) {
          consecutiveHighComplianceWeeks++;
        } else {
          break;
        }
      }
    }


    // 2. Evaluate with Auto-Regulation Engine
    const primaryGoal = await resolveClientPrimaryGoal(targetUserId);
    const evalInput = {
      primary_goal: primaryGoal,
      weight_kg: weeklyWeight,
      previous_weight_kg: prevWeight,
      waist_circumference_cm: waist_circumference_cm ? Number(waist_circumference_cm) : null,
      previous_waist_circumference_cm: prevWaist,
      hip_circumference_cm: hip_circumference_cm ? Number(hip_circumference_cm) : null,
      nutrition_adherence_percent: Number(nutrition_adherence_percent),
      workouts_completed: Number(workouts_completed),
      workouts_scheduled: Number(workouts_scheduled),
      biofeedback: {
        hunger_level: toEngineScale(biofeedback.hunger_level ?? biofeedback.hungerLevel ?? 2, req.body.biofeedback_scale),
        energy_level: toEngineScale(biofeedback.energy_level ?? biofeedback.energyLevel ?? biofeedback.energy_in_gym ?? 4, req.body.biofeedback_scale),
        sleep_quality: toEngineScale(biofeedback.sleep_quality ?? biofeedback.sleepQuality ?? 4, req.body.biofeedback_scale),
        sleep_hours: Number(biofeedback.sleep_hours ?? biofeedback.sleepHours ?? 7),
        stress_level: Number(biofeedback.stress_level ?? biofeedback.stressLevel ?? 2),
      },
      pain_reports: Array.isArray(pain_reports) ? pain_reports : [],
      is_consecutive_plateau: isConsecutivePlateau,
      // Deep check-in v3 fields
      lifestyle_variance,
      bowel_regularity,
      sleep_stress_composite: Number(sleep_stress_composite) || 3,
      menstrual_phase,
      occupation_type: traineeOccupation,
      next_week_travel: Boolean(next_week_travel),
      next_week_gym_available: next_week_gym_available !== false,
      next_week_realistic_days: next_week_realistic_days ? Number(next_week_realistic_days) : null,
      next_week_notes,
    };

    const baseAnalysis = evaluateCheckin(evalInput);

    // Adaptive TDEE: measured expenditure from this and previous check-ins replaces the formula once
    // 2 weeks of trend exist. The plan target at submission time is stored for later weeks.
    const activeProgram = await Program.findOne({ where: { user_id: targetUserId }, order: [["id", "DESC"]] });
    const programData = activeProgram?.program_data || {};
    const planTargetKcal = Number(
      programData.nutrition?.targets?.calories ||
      programData.nutrition_program?.macro_targets?.calories_kcal ||
      programData.nutrition_program?.targets?.target_calories,
    ) || null;
    const formulaTdeeKcal = Number(programData.nutrition_program?.targets?.tdee) || null;
    const adaptiveTdee = estimateAdaptiveTdee({
      weeks: [
        ...pastCheckins.map((c) => ({
          week_number: c.week_number,
          average_weight_kg: c.average_weight_kg,
          adherence_percent: c.nutrition_adherence_percent,
          planned_target_kcal: c.analysis_output?.plan_target_kcal ?? planTargetKcal,
          reported_intake_kcal: c.analysis_output?.reported_intake_kcal ?? null,
        })),
        {
          week_number: targetWeekNumber,
          average_weight_kg: weeklyWeight,
          adherence_percent: Number(nutrition_adherence_percent),
          planned_target_kcal: planTargetKcal,
          reported_intake_kcal: reportedIntakeKcal,
        },
      ],
      formula_tdee_kcal: formulaTdeeKcal,
      current_target_kcal: planTargetKcal,
      primary_goal: primaryGoal,
      is_female: await resolveClientIsFemale(targetUserId),
    });
    const adaptiveApplies = adaptiveTdee.ready && ADAPTIVE_TDEE_STATUSES.has(baseAnalysis.analysis_status);
    // Early-deload recommendation for the coach (never applied automatically): logged performance
    // dropping on 2+ exercises confirmed by this check-in's fatigue signals, or joint pain >= 7/10.
    const maxPainLevel = (Array.isArray(evalInput.pain_reports) ? evalInput.pain_reports : [])
      .reduce((max, p) => Math.max(max, Number(p?.pain_level ?? p?.score ?? p?.severity) || 0), 0);
    const deloadRecommendation = evaluateDeloadTrigger({
      state: await loadProgressionState(targetUserId),
      biofeedback: evalInput.biofeedback,
      sleep_stress_composite: evalInput.sleep_stress_composite,
      max_pain_level: maxPainLevel,
    });
    const analysisOutput = {
      ...baseAnalysis,
      deload_recommendation: { ...deloadRecommendation, generated_at: new Date().toISOString() },
      plan_target_kcal: planTargetKcal,
      reported_intake_kcal: reportedIntakeKcal,
      adaptive_tdee: adaptiveTdee,
      ...(adaptiveApplies
        ? {
            suggested_calorie_delta: adaptiveTdee.calorie_delta,
            recommendations_ar: [...baseAnalysis.recommendations_ar, adaptiveTdee.reason_ar],
          }
        : {}),
    };

    // 3. Save Checkin Submission
    const checkin = await CheckinSubmission.create({
      user_id: targetUserId,
      week_number: targetWeekNumber,
      daily_weights_kg: dailyWeights || [weeklyWeight],
      average_weight_kg: weeklyWeight,
      weight_change_kg: analysisOutput.weight_change_kg,
      waist_circumference_cm: waist_circumference_cm ? Number(waist_circumference_cm) : null,
      nutrition_adherence_percent: Number(nutrition_adherence_percent),
      workouts_completed: Number(workouts_completed),
      workouts_scheduled: Number(workouts_scheduled),
      biofeedback: evalInput.biofeedback,
      pain_reports: evalInput.pain_reports,
      analysis_status: analysisOutput.analysis_status,
      analysis_output: analysisOutput,
      status: "PENDING_REVIEW",
      lifestyle_variance,
      bowel_regularity,
      sleep_stress_composite: Number(sleep_stress_composite) || 3,
      menstrual_phase,
      next_week_travel: Boolean(next_week_travel),
      next_week_gym_available: next_week_gym_available !== false,
      next_week_realistic_days: next_week_realistic_days ? Number(next_week_realistic_days) : null,
      next_week_notes,
    });

    // 3.1 Save attached progress photos locally to Hostinger file storage
    const savedPhotos = [];
    if (Array.isArray(photos) && photos.length > 0) {
      for (const p of photos) {
        const pUrl = typeof p === 'string' ? p : (p.photo_url || p.data || p.url);
        if (typeof pUrl === 'string' && pUrl.trim()) {
          const pose = (p.pose || 'FRONT').toUpperCase();
          const clientCode = userObj.client_code || userObj.id || targetUserId;
          const savedUrl = saveProgressPhotoToDisk(clientCode, pUrl, targetWeekNumber, pose);
          if (savedUrl) {
            const photoRecord = await ProgressPhoto.create({
              user_id: targetUserId,
              week_number: targetWeekNumber,
              pose,
              photo_url: savedUrl,
              notes: p.notes || null,
            });
            savedPhotos.push(photoRecord);
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Check-in evaluated and saved successfully",
      checkin,
      photos: savedPhotos,
      analysis: analysisOutput,
    });
  } catch (error) {
    if (error?.name === "SequelizeUniqueConstraintError" || error?.original?.code === "ER_DUP_ENTRY" || error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        error: "تم إرسال متابعة لنفس الأسبوع مسبقاً، قيد التفرد يمنع تسجيل متابعة مكررة",
        code: "DUPLICATE_CHECKIN_SUBMISSION",
      });
    }
    console.error("Error evaluating check-in:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Coach decision on an early-deload recommendation: approve (7-day deload window starting now, shown in
 * the client app and used by the post-deload reset) or dismiss. Coaches and admins only.
 */
export async function decideDeload(req, res) {
  try {
    const requester = req.user ? await User.findByPk(req.user.id) : null;
    if (!requester || !['COACH', 'ADMIN'].includes(requester.role)) {
      return res.status(403).json({ success: false, error: "اعتماد الديلود متاح للكوتش فقط" });
    }
    const checkin = await CheckinSubmission.findByPk(req.params.checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: "المتابعة غير موجودة" });
    }
    const recommendation = checkin.analysis_output?.deload_recommendation || {};
    const decision = buildDeloadDecision({
      approved: req.body?.approve === true,
      reason: recommendation.reason || 'PERFORMANCE_FATIGUE',
      affected_exercises: recommendation.affected_exercises || [],
      approved_by: requester.id,
    });
    checkin.analysis_output = { ...(checkin.analysis_output || {}), deload_decision: decision };
    if (typeof checkin.changed === "function") checkin.changed("analysis_output", true);
    await checkin.save();
    return res.status(200).json({ success: true, deload_decision: decision, progression: await loadProgressionState(checkin.user_id) });
  } catch (error) {
    console.error("Error deciding deload:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get client check-in history
 */
export async function getClientCheckins(req, res) {
  try {
    const { userId } = req.params;
    const cleanCode = String(userId).replace('#', '').trim();
    let userObj = await User.findOne({ where: { client_code: cleanCode } });
    if (!userObj && !isNaN(cleanCode)) {
      userObj = await User.findByPk(parseInt(cleanCode, 10));
    }
    const resolvedId = userObj ? userObj.id : (!isNaN(cleanCode) ? parseInt(cleanCode, 10) : null);
    if (!resolvedId) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    // فحص الملكية: المتدرب يطّلع على سجل متابعاته وصوره فقط، والمدرب له حق الوصول لكافة السجلات
    if (req.user && req.user.id !== resolvedId) {
      const requester = await User.findByPk(req.user.id);
      const isCoach = requester && (requester.role === 'COACH' || requester.role === 'ADMIN');
      if (!isCoach) {
        return res.status(403).json({ success: false, error: "غير مصرح لك بعرض متابعات متدرب آخر" });
      }
    }

    const checkins = await CheckinSubmission.findAll({
      where: { user_id: resolvedId },
      order: [["week_number", "DESC"], ["id", "DESC"]],
    });

    const photos = await ProgressPhoto.findAll({
      where: { user_id: resolvedId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      user: userObj,
      checkins,
      photos
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 1-Click Coach Approval and Program Auto-Regulation
 */
export async function approveCheckin(req, res) {
  try {
    const { checkinId } = req.params;
    const { coach_notes, custom_macros } = req.body;

    const checkin = await CheckinSubmission.findByPk(checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: "Check-in not found" });
    }

    const latestProgram = await Program.findOne({
      where: { user_id: checkin.user_id },
      order: [["id", "DESC"]],
    });

    if (latestProgram && latestProgram.program_data) {
      const progData = typeof latestProgram.program_data === "string"
        ? JSON.parse(latestProgram.program_data)
        : JSON.parse(JSON.stringify(latestProgram.program_data));

      let adapted = null;
      try {
        const bio = checkin.biofeedback || {};
        const painReports = Array.isArray(checkin.pain_reports) ? checkin.pain_reports : [];
        const firstPain = painReports[0] || {};
        const jointLocation = firstPain.location || firstPain.joint || bio.joint_pain_location || bio.joint_location || checkin.analysis_output?.joint_pain_location;
        const painScore = firstPain.score || firstPain.severity || bio.pain_score || checkin.analysis_output?.pain_score;
        const fatigueScore = bio.fatigue_score || bio.fatigue || checkin.analysis_output?.fatigue_score;

        // The check-in's week_number counts weeks of the whole subscription; the plan's weeks count
        // weeks of the current cycle. Passing the first as the second made the adaptation append
        // "week 14" to a five-week cycle on every check-in, so the cycle never ended, and turned
        // every week after the first month into a deload. The adapted week is always a week of this
        // cycle, never one past its end.
        const cycle = resolveTrainingCycleStatus(latestProgram);
        const cycleWeek = Math.min(cycle.current_week, Math.max(1, cycle.total_weeks - 1));
        adapted = buildAdaptedPlan({
          currentMasterProgram: progData,
          checkinAnalysis: checkin.analysis_output || {},
          options: {
            currentWeekNumber: cycleWeek,
            joint_pain_location: jointLocation,
            pain_score: painScore,
            accumulated_fatigue_score: fatigueScore,
            weeks_of_accumulated_training: cycle.current_week
          }
        });
      } catch (e) {
        console.warn("buildAdaptedPlan fallback in checkin.controller:", e.message);
      }

      // Safe, Deterministic, and Idempotent Non-Destructive Deep Merge
      const mergedProgramData = mergeAdaptedPlanIntoProgram(
        progData,
        adapted || checkin.analysis_output || {},
        custom_macros
      );

      await latestProgram.update({
        program_data: mergedProgramData,
      });

      checkin.adapted_program_id = latestProgram.id;
    }

    checkin.status = "APPROVED";
    if (coach_notes) checkin.coach_notes = coach_notes;
    await checkin.save();

    return res.status(200).json({
      success: true,
      message: "Check-in approved and program updated successfully",
      checkin,
      program: latestProgram,
    });
  } catch (error) {
    console.error("Error approving check-in:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Log a Workout Session (Supports 1-Tap Quick Complete or Set-by-Set Logging)
 */
export async function logWorkout(req, res) {
  try {
    const {
      user_id,
      program_id,
      week_number = 1,
      day_number = 1,
      session_title,
      is_quick_completed = false,
      logged_exercises = [],
      duration_minutes = 60,
      session_rpe = 8,
      notes = "",
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, error: "user_id is required" });
    }

    // Resolve the client (id, client code or phone) and only let the client or a coach write their logs.
    const cleanCode = String(user_id).replace('#', '').trim();
    let userObj = await User.findOne({ where: { client_code: cleanCode } });
    if (!userObj && !isNaN(cleanCode)) userObj = await User.findByPk(parseInt(cleanCode, 10));
    if (!userObj) userObj = await User.findOne({ where: { phone_number: cleanCode } });
    if (!userObj) {
      return res.status(404).json({ success: false, error: "المستخدم غير موجود" });
    }
    if (!req.user || req.user.id !== userObj.id) {
      const requester = req.user ? await User.findByPk(req.user.id) : null;
      if (!requester || !['COACH', 'ADMIN'].includes(requester.role)) {
        return res.status(403).json({ success: false, error: "غير مصرح لك بتسجيل تمارين لمتدرب آخر" });
      }
    }

    // One summary per exercise (weight, last-set reps, effort); invalid rows are dropped, not stored.
    const cleanExercises = (Array.isArray(logged_exercises) ? logged_exercises : [])
      .map(normalizeLoggedExercise)
      .filter(Boolean);
    if (!is_quick_completed && cleanExercises.length === 0) {
      return res.status(400).json({ success: false, error: "سجّل وزن وعدات تمرين واحد على الأقل" });
    }

    const log = await WorkoutLog.create({
      user_id: userObj.id,
      program_id,
      week_number,
      day_number,
      session_title,
      is_quick_completed: Boolean(is_quick_completed),
      logged_exercises: cleanExercises,
      duration_minutes,
      session_rpe,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: is_quick_completed ? "Workout completed via 1-Tap Quick Complete" : "Workout logged successfully",
      log,
      progression: await loadProgressionState(userObj.id),
    });
  } catch (error) {
    console.error("Error logging workout:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get Workout Logs for a Program (For smart pre-fill)
 */
export async function getWorkoutLogs(req, res) {
  try {
    const { programId } = req.params;
    const logs = await WorkoutLog.findAll({
      where: { program_id: programId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
