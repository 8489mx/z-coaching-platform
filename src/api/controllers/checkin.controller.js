import { CheckinSubmission, Program, User, WorkoutLog, ProgressPhoto } from "../models/index.js";
import { evaluateCheckin } from "../../checkin-engine/evaluate-checkin.js";
import { saveProgressPhotoToDisk } from "../utils/photoStorage.js";
import { buildAdaptedPlan } from "../../adaptation-engine/build-adapted-plan.js";
import { mergeAdaptedPlanIntoProgram } from "../utils/planMergeEngine.js";

/**
 * Submit weekly check-in
 */
export async function submitCheckin(req, res) {
  try {
    const {
      user_id,
      client_id,
      week_number = 1,
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

    // Validate weight inputs: require valid positive weight > 20kg
    const validSingleWeight = typeof weight_kg === 'number' && !isNaN(weight_kg) && weight_kg > 20 && weight_kg <= 300;
    const validDailyWeights = Array.isArray(req.body.daily_weights_kg) && req.body.daily_weights_kg.length === 7 && req.body.daily_weights_kg.every(w => typeof w === 'number' && !isNaN(w) && w > 20 && w <= 300);

    if (Array.isArray(req.body.daily_weights_kg) && req.body.daily_weights_kg.length !== 7) {
      return res.status(400).json({ success: false, error: "يجب تسجيل أوزان الأيام السبعة كاملة وحقيقية (7 أوزان يومية) لإرسال المتابعة الأسبوعية" });
    }

    if (!validSingleWeight && !validDailyWeights) {
      return res.status(400).json({ success: false, error: "يجب إدخال وزن حقيقي وصالح (> 20 كجم) لإرسال المتابعة" });
    }


    // 1. Fetch previous check-in for deltas and consecutive compliance calculation
    const pastCheckins = await CheckinSubmission.findAll({
      where: { user_id: targetUserId },
      order: [["createdAt", "DESC"]],
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
    const evalInput = {
      weight_kg: Number(weight_kg),
      previous_weight_kg: prevWeight,
      waist_circumference_cm: waist_circumference_cm ? Number(waist_circumference_cm) : null,
      previous_waist_circumference_cm: prevWaist,
      hip_circumference_cm: hip_circumference_cm ? Number(hip_circumference_cm) : null,
      nutrition_adherence_percent: Number(nutrition_adherence_percent),
      workouts_completed: Number(workouts_completed),
      workouts_scheduled: Number(workouts_scheduled),
      biofeedback: {
        hunger_level: Number(biofeedback.hunger_level || 2),
        energy_level: Number(biofeedback.energy_level || biofeedback.energy_in_gym || 4),
        sleep_quality: Number(biofeedback.sleep_quality || 4),
        sleep_hours: Number(biofeedback.sleep_hours || 7),
        stress_level: Number(biofeedback.stress_level || 2),
      },
      pain_reports: Array.isArray(pain_reports) ? pain_reports : [],
      is_consecutive_plateau: isConsecutivePlateau,
    };

    const analysisOutput = evaluateCheckin(evalInput);

    // 3. Save Checkin Submission
    const checkin = await CheckinSubmission.create({
      user_id: targetUserId,
      week_number: Number(week_number) || 1,
      daily_weights_kg: [Number(weight_kg)],
      average_weight_kg: Number(weight_kg),
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
    });

    // 3.1 Save attached progress photos locally to Hostinger file storage
    const savedPhotos = [];
    if (Array.isArray(photos) && photos.length > 0) {
      for (const p of photos) {
        const pUrl = typeof p === 'string' ? p : (p.photo_url || p.data || p.url);
        if (typeof pUrl === 'string' && pUrl.trim()) {
          const pose = (p.pose || 'FRONT').toUpperCase();
          const clientCode = userObj.client_code || userObj.id || targetUserId;
          const savedUrl = saveProgressPhotoToDisk(clientCode, pUrl, Number(week_number) || 1, pose);
          if (savedUrl) {
            const photoRecord = await ProgressPhoto.create({
              user_id: targetUserId,
              week_number: Number(week_number) || 1,
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
    console.error("Error evaluating check-in:", error);
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
      order: [["createdAt", "DESC"]],
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
        adapted = buildAdaptedPlan({
          currentMasterProgram: progData,
          checkinAnalysis: checkin.analysis_output || {},
          options: { currentWeekNumber: checkin.week_number || 1 }
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

    const log = await WorkoutLog.create({
      user_id,
      program_id,
      week_number,
      day_number,
      session_title,
      is_quick_completed: Boolean(is_quick_completed),
      logged_exercises,
      duration_minutes,
      session_rpe,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: is_quick_completed ? "Workout completed via 1-Tap Quick Complete" : "Workout logged successfully",
      log,
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
