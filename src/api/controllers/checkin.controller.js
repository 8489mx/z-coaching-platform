import { CheckinSubmission, Program, User, WorkoutLog, ProgressPhoto } from "../models/index.js";
import { evaluateCheckin } from "../../checkin-engine/evaluate-checkin.js";
import { saveProgressPhotoToDisk } from "../utils/photoStorage.js";
import { buildAdaptedPlan } from "../../adaptation-engine/build-adapted-plan.js";

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
      return res.status(404).json({ success: false, error: "Client not found" });
    }
    targetUserId = userObj.id;


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
          options: {}
        });
      } catch (e) {
        console.warn("buildAdaptedPlan fallback in checkin.controller:", e.message);
      }

      // Determine final nutrition targets (coach custom macros override engine output)
      let finalCalories = adapted?.adapted_nutrition?.target_calories_kcal;
      let finalProtein = adapted?.adapted_nutrition?.protein_g;
      let finalCarbs = adapted?.adapted_nutrition?.carbohydrate_g;
      let finalFats = adapted?.adapted_nutrition?.fat_g;

      if (custom_macros && typeof custom_macros === 'object' && custom_macros.calories) {
        finalCalories = Number(custom_macros.calories);
        finalProtein = Number(custom_macros.protein || finalProtein || 140);
        finalCarbs = Number(custom_macros.carbs || finalCarbs || 200);
        finalFats = Number(custom_macros.fats || finalFats || 50);
      } else if (!finalCalories && checkin.analysis_output?.suggested_calorie_delta) {
        const baseCal = progData.nutrition_program?.macro_targets?.calories_kcal || progData.nutrition?.targets?.calories || 2000;
        finalCalories = baseCal + checkin.analysis_output.suggested_calorie_delta;
        finalCarbs = (progData.nutrition_program?.macro_targets?.carb_g || progData.nutrition?.targets?.carbs || 200) +
          (checkin.analysis_output.suggested_carb_delta_g || Math.round(checkin.analysis_output.suggested_calorie_delta / 4));
        finalProtein = progData.nutrition_program?.macro_targets?.protein_g || progData.nutrition?.targets?.protein || 140;
        finalFats = progData.nutrition_program?.macro_targets?.fat_g || progData.nutrition?.targets?.fats || 50;
      }

      // SMART MERGE: Update nutrition targets INSIDE the existing program WITHOUT destroying meals/exercises
      if (finalCalories) {
        if (!progData.nutrition) progData.nutrition = {};
        if (!progData.nutrition.targets) progData.nutrition.targets = {};
        progData.nutrition.targets.calories = finalCalories;
        progData.nutrition.targets.protein = finalProtein;
        progData.nutrition.targets.carbs = finalCarbs;
        progData.nutrition.targets.fats = finalFats;

        if (!progData.nutrition_program) progData.nutrition_program = {};
        if (!progData.nutrition_program.macro_targets) progData.nutrition_program.macro_targets = {};
        progData.nutrition_program.macro_targets.calories_kcal = finalCalories;
        progData.nutrition_program.macro_targets.protein_g = finalProtein;
        progData.nutrition_program.macro_targets.carb_g = finalCarbs;
        progData.nutrition_program.macro_targets.fat_g = finalFats;

        if (progData.nutrition_program.targets) {
          progData.nutrition_program.targets.target_calories = finalCalories;
          progData.nutrition_program.targets.target_calories_kcal = finalCalories;
          progData.nutrition_program.targets.calories_kcal = finalCalories;
          progData.nutrition_program.targets.protein_g = finalProtein;
          progData.nutrition_program.targets.total_protein_g = finalProtein;
          progData.nutrition_program.targets.carbohydrate_g = finalCarbs;
          progData.nutrition_program.targets.carb_g = finalCarbs;
          progData.nutrition_program.targets.total_carbs_g = finalCarbs;
          progData.nutrition_program.targets.fat_g = finalFats;
          progData.nutrition_program.targets.total_fat_g = finalFats;
        }

        if (progData.nutrition_program.quantized_plan && progData.nutrition_program.quantized_plan.daily_totals) {
          progData.nutrition_program.quantized_plan.daily_totals.calories_kcal = finalCalories;
          progData.nutrition_program.quantized_plan.daily_totals.protein_g = finalProtein;
          progData.nutrition_program.quantized_plan.daily_totals.carbs_g = finalCarbs;
          progData.nutrition_program.quantized_plan.daily_totals.fat_g = finalFats;
        }
      }

      // Update training week if adaptation engine provided a new one
      if (adapted?.adapted_training_week && progData.training_program && progData.training_program.weeks) {
        const targetIdx = Math.min(
          (adapted.adapted_week_number || 2) - 1,
          progData.training_program.weeks.length - 1
        );
        if (targetIdx >= 0 && targetIdx < progData.training_program.weeks.length) {
          progData.training_program.weeks[targetIdx] = adapted.adapted_training_week;
        }
      }

      // Apply Deload if recommended
      if (checkin.analysis_output?.is_deload_recommended) {
        if (progData.training_program) {
          progData.training_program.is_deload = true;
          progData.training_program.deload_note = "أسبوع تفريغ أحمال تلقائي بناءً على مؤشرات الإجهاد وآلام المفاصل";
        }
      }

      // Update cardio step target if changed
      if (adapted?.adapted_cardio && progData.cardio_program?.prescription) {
        progData.cardio_program.prescription.daily_step_target = adapted.adapted_cardio.daily_step_target;
      }

      // Store adaptation metadata
      progData._last_adaptation = {
        action: adapted?.adaptation_action || 'APPROVED',
        reasons: adapted?.adaptation_reasons || [],
        adapted_week: adapted?.adapted_week_number || checkin.week_number,
        timestamp: new Date().toISOString()
      };

      await latestProgram.update({
        program_data: progData,
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
