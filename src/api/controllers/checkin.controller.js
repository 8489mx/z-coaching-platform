import { CheckinSubmission, Program, User, WorkoutLog, ProgressPhoto } from "../models/index.js";
import { evaluateCheckin } from "../../checkin-engine/evaluate-checkin.js";
import { estimateAdaptiveTdee } from "../../checkin-engine/adaptive-tdee.js";
import { CheckinAnalysisStatus } from "../../checkin-engine/domain/enums.js";
import { normalizeLoggedExercise, evaluateDeloadTrigger } from "../../training-engine-v2/progression/index.js";
import { loadProgressionState, buildDeloadDecision } from "../services/progressionService.js";
import { saveProgressPhotoToDisk } from "../utils/photoStorage.js";
import { buildAdaptedPlan } from "../../adaptation-engine/build-adapted-plan.js";
import { mergeAdaptedPlanIntoProgram } from "../utils/planMergeEngine.js";
import { resolveClientPrimaryGoal, resolveClientIsFemale, resolveIntakeMedicalReview } from "./program.controller.js";
import { resolveTrainingCycleStatus } from "../services/trainingCycleService.js";
import { mealCountNoteForCheckin } from "../../checkin-engine/meal-count-note.js";
import { evaluateClientCheckinSchedule } from "../services/checkinScheduleService.js";
import { getActiveClinicalLockout } from "../services/clinicalSafetyService.js";
import { recordAuditEvent } from "../services/auditLog.service.js";
export { getActiveClinicalLockout };

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
 * The plan the client is training and eating on: the newest published one. A newer draft (the next
 * cycle waiting for the coach) is not it; with no published plan at all, the newest plan is used.
 */
async function findPlanInUse(userId) {
  return (await Program.findOne({ where: { user_id: userId, status: "ACTIVE" }, order: [["id", "DESC"]] }))
    || (await Program.findOne({ where: { user_id: userId }, order: [["id", "DESC"]] }));
}

/**
 * The check-in engine rates hunger/energy/sleep on 1-5 (e.g. energy <= 2 = low, hunger >= 4 = high).
 * The web check-in form uses 1-10 sliders and says so with biofeedback_scale: 10; map 1-2 -> 1 ... 9-10 -> 5.
 */
function toEngineScale(value, scale) {
  const n = Number(value);
  if (!Number.isFinite(n)) return n;
  return Number(scale) === 10 ? Math.min(5, Math.max(1, Math.ceil(n / 2))) : n;
}


// getActiveClinicalLockout is imported and re-exported from clinicalSafetyService.js

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
      exertional_chest_pain = false,
      syncope = false,
      concerning_dizziness = false,
      cardiac_symptoms = null,
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

    // -------------------------------------------------------------
    // Tier 0 / Tier 1 Authoritative Server-Side Schedule Guard
    // -------------------------------------------------------------
    const submissionTime = req.body.submission_time ? new Date(req.body.submission_time) : new Date();
    const schedule = await evaluateClientCheckinSchedule(targetUserId, submissionTime);

    // If active program exists, strictly enforce schedule window and cadence
    // In production and live Express HTTP requests, strictly enforced. In direct unit test mocks, enabled when requested.
    const isLiveHttpRequest = Boolean(req.headers || req.app || req.get || req.ip);
    const bypassGuard = req.body.bypass_schedule_guard === true;
    const shouldEnforce = (isLiveHttpRequest || req.body.enforce_schedule_guard === true) && !bypassGuard;

    if (shouldEnforce && schedule.program_id) {
      if (!schedule.allowed) {
        const httpStatus = schedule.code === "DUPLICATE_CHECKIN_SUBMISSION" ? 409 : 403;
        return res.status(httpStatus).json({
          success: false,
          error: schedule.message_ar,
          code: schedule.code,
          schedule: {
            status: schedule.status,
            scheduled_due_date: schedule.scheduled_due_date,
            window_opens_at: schedule.window_opens_at,
            window_closes_at: schedule.window_closes_at,
            expected_week_number: schedule.expected_week_number,
          },
        });
      }
    }

    // Authoritative week_number resolution: server dictates expected cycle week when guard is enforced
    let targetWeekNumber = shouldEnforce && schedule?.program_id
      ? schedule.expected_week_number
      : (Number(week_number) || 0);

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
    // The plan's own goal wins when the engine changed it (bulking with high body fat -> recomposition).
    const planForGoal = await findPlanInUse(targetUserId);
    const primaryGoal = await resolveClientPrimaryGoal(targetUserId)
      .then((intakeGoal) => planForGoal?.program_data?.nutrition_program?.targets?.effective_goal || intakeGoal);
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
      client_notes: client_notes || req.body.notes || "",
      exertional_chest_pain: Boolean(exertional_chest_pain || req.body.exertional_chest_pain),
      syncope: Boolean(syncope || req.body.syncope || req.body.fainting),
      concerning_dizziness: Boolean(concerning_dizziness || req.body.concerning_dizziness),
      cardiac_symptoms: cardiac_symptoms || req.body.cardiac_symptoms || null,
    };

    // Clinical Safety Invariant: Check if trainee has an active clinical lockout from an earlier check-in
    const priorLock = await getActiveClinicalLockout(targetUserId);
    if (priorLock.locked && !evalInput.cardiac_symptoms && !evalInput.exertional_chest_pain) {
      evalInput.has_prior_clinical_lock = true;
      evalInput.prior_clinical_lock_week = priorLock.week_number;
    }

    const baseAnalysis = evaluateCheckin(evalInput);

    // Adaptive TDEE: measured expenditure from this and previous check-ins replaces the formula once
    // 2 weeks of trend exist. The plan target at submission time is stored for later weeks.
    const activeProgram = await findPlanInUse(targetUserId);
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
    // Rapid loss two check-ins running, in a client whose file needs medical review (nursing,
    // pregnancy, kidney or liver disease...), is more than a calorie question: the +150 kcal still
    // applies, and the coach is told to review the case now.
    let clinicalAlert = null;
    if (baseAnalysis.analysis_status === CheckinAnalysisStatus.RAPID_LOSS_WARNING
      && previousCheckin?.analysis_status === CheckinAnalysisStatus.RAPID_LOSS_WARNING) {
      const review = await resolveIntakeMedicalReview(targetUserId).catch(() => ({ required: false }));
      if (review.required) {
        clinicalAlert = {
          code: "REPEATED_RAPID_LOSS_MEDICAL_CLIENT",
          message_ar: "تنبيه طبي: نزول سريع للمتابعة الثانية على التوالي لمتدرب ملفه يستوجب مراجعة طبية. راجع الحالة الآن (الأكل الفعلي، الرضاعة أو الحمل، الأعراض) وتواصل مع الطبيب المعالج إن لزم.",
        };
      }
    }
    const analysisOutput = {
      ...baseAnalysis,
      ...(clinicalAlert
        ? {
            clinical_alert: clinicalAlert,
            requires_coach_review: true,
            coach_action: `${clinicalAlert.message_ar} ${baseAnalysis.coach_action || ""}`.trim(),
          }
        : {}),
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

    // A check-in that takes a three-meal plan past 3200 kcal only rescales the three meals: the coach
    // is told to add a fourth, like the first plan does.
    const mealCountNote = mealCountNoteForCheckin({
      planTargetKcal,
      calorieDelta: adaptiveApplies ? adaptiveTdee.calorie_delta : baseAnalysis.suggested_calorie_delta,
      mealsCount: programData.nutrition_program?.culinary_meals?.length || programData.nutrition_program?.targets?.meals_count,
    });
    if (mealCountNote) {
      analysisOutput.meal_count_note_ar = mealCountNote;
      analysisOutput.coach_action = `${analysisOutput.coach_action || ""} ${mealCountNote}`.trim();
    }

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
    const requester = req.user?.role
      ? req.user
      : (req.user?.id ? await User.findByPk(req.user.id) : null);
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
 * Update and correct check-in measurements with authoritative cascade and audit trail.
 * Solves Competitor Disconnect (WF26-06 to WF26-09 & B-06).
 * Ensures weight, waist, and hip corrections propagate to:
 * 1. CheckinSubmission record and delta calculations.
 * 2. Active Program client_profile (for latest checkin).
 * 3. Audit trail stored in analysis_output.measurement_corrections.
 */
export async function updateCheckinMeasurements(req, res) {
  try {
    if ('user' in req || req.headers) {
      const requester = req.user?.role
        ? req.user
        : (req.user?.id ? await User.findByPk(req.user.id) : null);
      if (requester && !['COACH', 'ADMIN'].includes(requester.role)) {
        return res.status(403).json({ success: false, error: "تعديل القياسات مصرح به للمدربين فقط" });
      }
    }

    const { checkinId } = req.params;
    const checkin = await CheckinSubmission.findByPk(checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: "لم يتم العثور على سجل المتابعة" });
    }

    const {
      average_weight_kg,
      weight_kg,
      waist_circumference_cm,
      hip_circumference_cm,
      daily_weights_kg,
      correction_reason
    } = req.body;

    const newWeightRaw = average_weight_kg !== undefined ? average_weight_kg : weight_kg;
    let parsedWeight = null;
    if (newWeightRaw !== undefined && newWeightRaw !== null) {
      parsedWeight = typeof newWeightRaw === 'number' ? newWeightRaw : parseFloat(newWeightRaw);
      if (isNaN(parsedWeight) || parsedWeight <= 20 || parsedWeight > 300) {
        return res.status(400).json({ success: false, error: "يجب إدخال وزن حقيقي وصالح بين 20 و 300 كجم" });
      }
      parsedWeight = Math.round(parsedWeight * 100) / 100;
    }

    let parsedWaist = undefined;
    if (waist_circumference_cm !== undefined) {
      const pw = typeof waist_circumference_cm === 'number' ? waist_circumference_cm : parseFloat(waist_circumference_cm);
      parsedWaist = (!isNaN(pw) && pw > 0) ? Math.round(pw * 10) / 10 : null;
    }

    let parsedHip = undefined;
    if (hip_circumference_cm !== undefined) {
      const ph = typeof hip_circumference_cm === 'number' ? hip_circumference_cm : parseFloat(hip_circumference_cm);
      parsedHip = (!isNaN(ph) && ph > 0) ? Math.round(ph * 10) / 10 : null;
    }

    const oldWeight = checkin.average_weight_kg;
    const oldWaist = checkin.waist_circumference_cm;
    const effectiveWeight = parsedWeight !== null ? parsedWeight : oldWeight;

    // Load all user checkins to resolve sequence and recompute deltas
    const allCheckins = await CheckinSubmission.findAll({
      where: { user_id: checkin.user_id },
      order: [["week_number", "ASC"]]
    });

    const currentIndex = allCheckins.findIndex(c => c.id === checkin.id);
    const prevCheckin = currentIndex > 0 ? allCheckins[currentIndex - 1] : null;
    const nextCheckin = (currentIndex >= 0 && currentIndex < allCheckins.length - 1) ? allCheckins[currentIndex + 1] : null;
    const isLatest = currentIndex === allCheckins.length - 1 || currentIndex === -1;

    let newWeightDelta = 0;
    if (prevCheckin && prevCheckin.average_weight_kg) {
      newWeightDelta = Math.round((effectiveWeight - prevCheckin.average_weight_kg) * 100) / 100;
    }

    // Apply updates to current checkin
    if (parsedWeight !== null) {
      checkin.average_weight_kg = parsedWeight;
      checkin.weight_change_kg = newWeightDelta;
      if (Array.isArray(daily_weights_kg) && daily_weights_kg.length === 7) {
        checkin.daily_weights_kg = daily_weights_kg.map(w => Number(w));
      } else {
        checkin.daily_weights_kg = [parsedWeight];
      }
    }

    if (parsedWaist !== undefined) {
      checkin.waist_circumference_cm = parsedWaist;
    }

    // Append to immutable audit trail inside analysis_output
    const analysisObj = typeof checkin.analysis_output === 'string'
      ? JSON.parse(checkin.analysis_output)
      : (checkin.analysis_output || {});

    const history = Array.isArray(analysisObj.measurement_corrections)
      ? [...analysisObj.measurement_corrections]
      : [];

    const auditEntry = {
      previous_weight_kg: oldWeight,
      corrected_weight_kg: effectiveWeight,
      previous_waist_cm: oldWaist,
      corrected_waist_cm: checkin.waist_circumference_cm,
      previous_hip_cm: analysisObj.hip_circumference_cm || null,
      corrected_hip_cm: parsedHip !== undefined ? parsedHip : (analysisObj.hip_circumference_cm || null),
      corrected_by: req.user?.id || 'COACH',
      corrected_at: new Date().toISOString(),
      reason: String(correction_reason || 'تصحيح قراءة القياس بواسطة الكوتش').trim()
    };
    history.push(auditEntry);

    analysisObj.measurement_corrections = history;
    analysisObj.is_measurement_corrected = true;
    analysisObj.latest_corrected_weight = effectiveWeight;
    analysisObj.weight_change_kg = newWeightDelta;
    if (parsedWaist !== undefined) analysisObj.waist_circumference_cm = checkin.waist_circumference_cm;
    if (parsedHip !== undefined) analysisObj.hip_circumference_cm = parsedHip;

    checkin.analysis_output = analysisObj;
    checkin.changed('analysis_output', true);
    await checkin.save();

    // Cascade delta to the subsequent checkin if present
    if (nextCheckin && nextCheckin.average_weight_kg) {
      nextCheckin.weight_change_kg = Math.round((nextCheckin.average_weight_kg - effectiveWeight) * 100) / 100;
      const nextAnalysis = typeof nextCheckin.analysis_output === 'string'
        ? JSON.parse(nextCheckin.analysis_output)
        : (nextCheckin.analysis_output || {});
      nextAnalysis.weight_change_kg = nextCheckin.weight_change_kg;
      nextCheckin.analysis_output = nextAnalysis;
      nextCheckin.changed('analysis_output', true);
      await nextCheckin.save();
    }

    // Synchronize Trainee's Active Program client_profile if this is the latest checkin
    let programUpdated = false;
    if (isLatest) {
      const activeProg = await Program.findOne({
        where: { user_id: checkin.user_id, status: "ACTIVE" },
        order: [["id", "DESC"]]
      });
      if (activeProg) {
        const pData = typeof activeProg.program_data === 'string'
          ? JSON.parse(activeProg.program_data)
          : (activeProg.program_data || {});
        if (!pData.client_profile) pData.client_profile = {};
        if (parsedWeight !== null) {
          pData.client_profile.weight = parsedWeight;
          pData.client_profile.weight_kg = parsedWeight;
          pData.client_profile.latest_checkin_weight = parsedWeight;
        }
        if (parsedWaist !== undefined && parsedWaist !== null) {
          pData.client_profile.waist_cm = parsedWaist;
        }
        pData.client_profile.measurement_source = {
          source: 'CHECKIN',
          week_number: checkin.week_number,
          checkin_id: checkin.id,
          is_corrected: true,
          updated_at: auditEntry.corrected_at
        };
        activeProg.program_data = pData;
        activeProg.changed('program_data', true);
        await activeProg.save();
        programUpdated = true;
      }
    }

    recordAuditEvent({
      event: "MEASUREMENT_CORRECTION",
      req,
      status: "SUCCESS",
      userId: req.user?.id || 'COACH',
      userRole: req.user?.role || 'COACH',
      details: {
        checkin_id: checkin.id,
        target_user_id: checkin.user_id,
        previous_weight_kg: oldWeight,
        corrected_weight_kg: effectiveWeight,
        previous_waist_cm: oldWaist,
        corrected_waist_cm: checkin.waist_circumference_cm,
        reason: auditEntry.reason
      }
    });

    return res.status(200).json({
      success: true,
      message: "تم حفظ وتوثيق قياسات المتابعة وتزامنها مع ملف المتدرب بنجاح",
      checkin,
      is_latest_measurement: isLatest,
      program_updated: programUpdated,
      audit: auditEntry
    });
  } catch (error) {
    console.error("Error updating checkin measurements:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 1-Click Coach Approval and Program Auto-Regulation
 */
export async function approveCheckin(req, res) {
  try {
    if ('user' in req || req.headers) {
      const requester = req.user?.role
        ? req.user
        : (req.user?.id ? await User.findByPk(req.user.id) : null);
      if (!requester || !['COACH', 'ADMIN'].includes(requester.role)) {
        return res.status(403).json({ success: false, error: "اعتماد المتابعة متاح للكوتش فقط" });
      }
    }

    const { checkinId } = req.params;
    const {
      coach_notes,
      custom_macros,
      apply_program_adaptation
    } = req.body;

    const checkin = await CheckinSubmission.findByPk(checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: "Check-in not found" });
    }

    const latestProgram = await findPlanInUse(checkin.user_id);

    // الفصل التام بين مراجعة المتابعة وتعديل البرامج:
    // لا يتم تعديل البرنامج إلا بطلب صريح معتمد من المدرب (apply_program_adaptation: true)
    // أو عند إرسال تعديل ماكروز صريح ما لم يحدد المدرب عدم التعديل صراحة (apply_program_adaptation === false)
    const hasCustomMacros = Boolean(custom_macros && typeof custom_macros === "object" && Object.keys(custom_macros).length > 0);
    const alreadyAdaptedForThisCheckin = Boolean(checkin.adapted_program_id);
    const shouldAdaptProgram =
      (apply_program_adaptation === true && (!alreadyAdaptedForThisCheckin || hasCustomMacros)) ||
      (hasCustomMacros && apply_program_adaptation !== false);

    if (shouldAdaptProgram && latestProgram && latestProgram.program_data) {
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
            weeks_of_accumulated_training: cycle.current_week,
            experience:
              progData.training_program?.experience ||
              progData.training_program?.experience_level ||
              progData.training?.experience ||
              progData.training?.experience_level ||
              progData.client_profile?.experience ||
              progData.client_profile?.experience_level ||
              progData.client?.experience ||
              progData.client?.experience_level ||
              progData.intake_decision?.profile?.experience ||
              undefined
          }
        });
      } catch (e) {
        console.warn("buildAdaptedPlan fallback in checkin.controller:", e.message);
      }

      // Safe, Deterministic, and Idempotent Non-Destructive Deep Merge.
      // S3-2: out-of-range custom macros are a coach-facing 400, not a 500:
      // nothing has been written yet at this point, so the coach fixes the
      // numbers and re-approves. Any other merge failure still surfaces as a
      // 500 through the outer handler catch.
      let mergedProgramData;
      try {
        mergedProgramData = mergeAdaptedPlanIntoProgram(
          progData,
          alreadyAdaptedForThisCheckin ? {} : (adapted || checkin.analysis_output || {}),
          custom_macros
        );
      } catch (err) {
        if (err?.code === "CUSTOM_MACROS_OUT_OF_RANGE") {
          return res.status(400).json({ success: false, error: err.message, code: err.code });
        }
        throw err;
      }

      await latestProgram.update({
        program_data: mergedProgramData,
      });

      // The next cycle waiting as a draft was cloned before this check-in: give it the same food
      // targets, so publishing it does not take the client back to last week's calories.
      const waitingDraft = await Program.findOne({ where: { user_id: checkin.user_id, status: "DRAFT" }, order: [["id", "DESC"]] });
      if (waitingDraft && waitingDraft.id !== latestProgram.id && Number(waitingDraft.id) > Number(latestProgram.id) && waitingDraft.program_data) {
        const draftData = JSON.parse(JSON.stringify(waitingDraft.program_data));
        if (mergedProgramData.nutrition) draftData.nutrition = mergedProgramData.nutrition;
        if (mergedProgramData.nutrition_program) draftData.nutrition_program = mergedProgramData.nutrition_program;
        await waitingDraft.update({ program_data: draftData });
      }

      checkin.adapted_program_id = latestProgram.id;
    }

    checkin.status = "APPROVED";
    if (coach_notes) checkin.coach_notes = coach_notes;
    await checkin.save();

    return res.status(200).json({
      success: true,
      message: shouldAdaptProgram
        ? "تم اعتماد المتابعة وتحديث البرنامج التدريبي والغذائي بنجاح"
        : "تم اعتماد المتابعة وحفظ الملاحظات بنجاح دون تعديل البرنامج",
      checkin,
      program: latestProgram,
      program_adapted: shouldAdaptProgram,
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

    // P0 Clinical Safety: Check for active clinical safety lockout (Cardiac / Exertional red flags)
    const clinicalLock = await getActiveClinicalLockout(userObj.id);
    if (clinicalLock.locked) {
      return res.status(403).json({
        success: false,
        code: "CLINICAL_SAFETY_LOCKOUT",
        error: "تم إيقاف تسجيل ومزامنة التمارين وقفل التدريب بقرار أمان سريري (أعراض قلبية أو إغماء مرتبطة بالمجهود). يرجى التوقف الفوري عن المجهود ومراجعة الطبيب المختص وتزويد الكوتش بالتقرير الطبي لإلغاء القفل.",
        details: {
          locked: true,
          locked_since_week: clinicalLock.week_number,
          directive_ar: clinicalLock.directive_ar,
        },
      });
    }
    if (!req.user || req.user.id !== userObj.id) {
      const requester = req.user?.role
      ? req.user
      : (req.user?.id ? await User.findByPk(req.user.id) : null);
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

/**
 * Authoritative Check-in Schedule Query
 * Single Source of Truth for Trainee App and Coach Command Center
 */
export async function getCheckinSchedule(req, res) {
  try {
    const rawTarget = req.params.userId || req.user?.id;
    if (!rawTarget) {
      return res.status(400).json({ success: false, error: "معرف المتدرب مطلوب" });
    }

    const cleanCode = String(rawTarget).replace("#", "").trim();
    let userObj = await User.findOne({ where: { client_code: cleanCode } });
    if (!userObj && !isNaN(cleanCode)) {
      userObj = await User.findByPk(parseInt(cleanCode, 10));
    }
    const resolvedId = userObj ? userObj.id : (!isNaN(cleanCode) ? parseInt(cleanCode, 10) : null);
    if (!resolvedId) {
      return res.status(404).json({ success: false, error: "المتدرب غير موجود" });
    }

    // فحص الملكية ومنع ثغرة IDOR: المتدرب يطّلع على جدوله فقط، والمدرب أو الأدمن له حق الوصول لكافة الجداول
    if (req.user && req.user.id !== resolvedId) {
      const requester = await User.findByPk(req.user.id);
      const isCoachOrAdmin = requester && (requester.role === "COACH" || requester.role === "ADMIN");
      if (!isCoachOrAdmin) {
        return res.status(403).json({ success: false, error: "غير مصرح لك بعرض جدول متابعات متدرب آخر" });
      }
    }

    const schedule = await evaluateClientCheckinSchedule(resolvedId, new Date());
    return res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error("Error retrieving checkin schedule:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}


/**
 * Coach unlock of clinical safety lockout after verified medical clearance.
 * Coaches and Admins only.
 */
export async function unlockClinicalSafety(req, res) {
  try {
    const requester = req.user?.role
      ? req.user
      : (req.user?.id ? await User.findByPk(req.user.id) : null);
    if (!requester || !['COACH', 'ADMIN'].includes(requester.role)) {
      return res.status(403).json({ success: false, error: "إلغاء القفل السريري متاح للكوتش أو المشرف الطبي فقط" });
    }

    const { checkinId } = req.params;
    const { medical_clearance_confirmed, clearance_notes } = req.body;
    const cleanClearanceNotes = String(clearance_notes || "").trim();

    if (medical_clearance_confirmed !== true) {
      return res.status(400).json({
        success: false,
        error: "يجب تأكيد استلام التقرير والتصريح الطبي من الطبيب المعالج لإلغاء القفل السريري (medical_clearance_confirmed: true)",
      });
    }

    const checkin = await CheckinSubmission.findByPk(checkinId);
    if (!checkin) {
      return res.status(404).json({ success: false, error: "سجل المتابعة غير موجود" });
    }
    if (!cleanClearanceNotes) {
      return res.status(400).json({
        success: false,
        error: "يجب تدوين ملاحظات التصريح الطبي وإخلاء المسؤولية قبل فك القفل السريري",
      });
    }

    const updatedAnalysis = {
      ...(checkin.analysis_output || {}),
      training_locked: false,
      clinical_unlock: {
        unlocked: true,
        unlocked_by: requester.id,
        unlocked_by_name: requester.name || requester.username,
        unlocked_at: new Date().toISOString(),
        clearance_notes: String(clearance_notes || "").trim(),
      },
    };

    checkin.analysis_output = updatedAnalysis;
    checkin.changed("analysis_output", true);
    await checkin.save();

    // Complete trainee clearance: unlock any other locked checkin rows for this client
    const allUserCheckins = await CheckinSubmission.findAll({ where: { user_id: checkin.user_id } });
    for (const c of allUserCheckins) {
      if (c.id !== checkin.id && c.analysis_output?.training_locked === true && (!c.analysis_output.clinical_unlock || c.analysis_output.clinical_unlock.unlocked !== true)) {
        c.analysis_output = {
          ...c.analysis_output,
          training_locked: false,
          clinical_unlock: updatedAnalysis.clinical_unlock,
        };
        c.changed("analysis_output", true);
        await c.save();
      }
    }

    recordAuditEvent({
      event: "CLINICAL_LOCKOUT_UNLOCKED",
      req,
      status: "SUCCESS",
      userId: requester.id,
      userRole: requester.role,
      details: {
        checkin_id: checkin.id,
        target_user_id: checkin.user_id,
        unlocked_by_name: requester.name || requester.username,
        clearance_notes: cleanClearanceNotes
      }
    });

    return res.status(200).json({
      success: true,
      message: "تم إلغاء القفل السريري بنجاح بعد توثيق التصريح الطبي",
      clinical_unlock: updatedAnalysis.clinical_unlock,
    });
  } catch (error) {
    console.error("Error in unlockClinicalSafety:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
