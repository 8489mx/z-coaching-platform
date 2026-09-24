import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adaptIntakePayloadToCanonicalEngine } from "../../intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngineV2 } from "../../../src/master-engine-v2/index.js";
import { evaluateCheckin } from "../../../src/checkin-engine/index.js";
import { buildAdaptedPlan } from "../../../src/adaptation-engine/index.js";
import { User, Program, IntakeSubmission, CheckinSubmission, ProgressPhoto } from "../models/index.js";
import { saveProgressPhotoToDisk } from "../utils/photoStorage.js";
import { Op } from "sequelize";
import { decryptMedicalData } from "../../utils/crypto.js";
import { MASTER_EXERCISE_DICTIONARY } from "../../../src/exercise-catalog-v2/index.js";
import { calculateSmartSwap } from "../../../src/nutrition-swap-engine-v2/calculate-smart-swap.js";
import { listSmartSwapCandidates, getSmartFoodRegistryItem, SMART_SWAP_REGISTRY } from "../../../src/nutrition-swap-engine-v2/swap-pool-registry.js";
import { CLINICAL_GUIDELINES } from "../../config/clinical-guidelines.js";
import { loadProgressionState } from "../services/progressionService.js";
import { resolveFastingContext, FASTING_OVERRIDES, applyFastingToMeals, RAMADAN_CARDIO_GUIDANCE_AR } from "../../execution-engines/fasting-calendar-engine.js";
import { getGulfHeatAdvisory, getPracticalCardioPrescription } from "../../execution-engines/cardio-zones-engine.js";
import { calculateSessionDemand, auditWeeklyMuscleVolume, auditDeficitVolumeShield, evaluateProteinSparingRequirement } from "../utils/trainingNutritionCoupling.js";
import { applyDeloadToSession, READINESS_GUIDANCE_AR } from "../../../src/training-engine-v2/progression/index.js";
import { resolveTrainingCycleStatus, CYCLE_STATUS, resolveSubscriptionState, subscriptionNeedsAttention, startCycleOnPublish } from "../services/trainingCycleService.js";
import { buildNextCycle, resolvePainFlaggedExercises, evaluateAutoPublish } from "../services/nextCycleService.js";
import { isSwapFoodSafe, resolveSwapContext, PLAN_FOOD_TO_REGISTRY } from "../services/liveFoodSwapSafety.js";
import { assessServiceScope, outsideScopeResponse } from "../services/serviceScope.js";
import { isLiveSwapEquivalent, liveSwapOilAddition, liveSwapValueWithOil, liveSwapOilText, liveSwapTargetGrams, liveSwapServingText } from "../services/liveFoodSwapValue.js";
import { isNoSwapFood, NO_SWAP_NOTE_AR } from "../../../frontend/src/utils/swapExchangeRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Food Catalog once on startup for the Nutrition Engine
let nutritionFoodCatalog = null;
const loadFoodCatalog = async () => {
  if (!nutritionFoodCatalog) {
    const catalogPath = path.join(__dirname, "..", "..", "..", "data", "catalogs", "core-global-food-batch-v1.json");
    const data = await fs.readFile(catalogPath, "utf-8");
    nutritionFoodCatalog = JSON.parse(data);
  }
  return nutritionFoodCatalog;
};

// Helper: التحقق من ملكية المشترك لبياناته أو امتلاك صلاحية المدرب/المشرف
async function isAuthorizedUserOrCoach(req, targetUserId) {
  if (!req.user || !req.user.id) return false;
  if (req.user.id === targetUserId) return true;
  const requester = await User.findByPk(req.user.id);
  return !!(requester && (requester.role === 'COACH' || requester.role === 'ADMIN'));
}

export const generateProgram = async (req, res) => {
  try {
    const { meta, options, ...intakePayload } = req.body; // Strip meta/options before validation
    
    if (!req.body) {
      return res.status(400).json({ error: "Invalid intake form data" });
    }

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: (meta && meta.assessmentDate) || new Date().toISOString().split("T")[0]
    });

    // 1. Evaluate Intake
    const intakeDecision = evaluateIntake(intakePayload, evaluationContext);

    if (intakeDecision.plan_status === "BLOCKED") {
      return res.status(400).json({ 
        error: "Intake rejected", 
        reasons: intakeDecision.decision_reasons 
      });
    }

    // 2. Load Catalog
    const catalog = await loadFoodCatalog();

    // 3. Build Master Engine V2
    const masterProgram = buildMasterEngineV2({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog,
      options: options || {}
    });

    // 4. Save to Database
    const savedProgram = await Program.create({
      user_id: req.user.id,
      program_data: masterProgram,
    });

    return res.status(201).json({
      message: "Program generated successfully (V2)",
      program_id: savedProgram.id,
      master_program: masterProgram
    });

  } catch (err) {
    console.error("generateProgram error:", err);
    return res.status(500).json({ 
      error: "Failed to generate program", 
      details: err.message 
    });
  }
};

export const generateProgramPreview = async (req, res) => {
  try {
    const { meta, options, ...intakePayload } = req.body;
    
    if (!req.body) {
      return res.status(400).json({ error: "Invalid intake form data" });
    }

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: (meta && meta.assessmentDate) || new Date().toISOString().split("T")[0]
    });

    const canonicalIntake = adaptIntakePayloadToCanonicalEngine(intakePayload);
    const intakeDecision = evaluateIntake(canonicalIntake, evaluationContext);
    if (intakeDecision.plan_status === "BLOCKED") {
      return res.status(400).json({ error: "Intake rejected", reasons: intakeDecision.decision_reasons });
    }

    const catalog = await loadFoodCatalog();
    const masterProgram = buildMasterEngineV2({
      intake: canonicalIntake,
      evaluationContext,
      nutritionFoodCatalog: catalog,
      options: options || {}
    });

    // Skip DB save for preview
    return res.status(200).json({
      message: "Preview program generated successfully (V2)",
      master_program: masterProgram
    });

  } catch (err) {
    console.error("generateProgramPreview error:", err);
    return res.status(500).json({ error: "Failed to generate preview program", details: err.message });
  }
};

export const generateAndSaveProgram = async (req, res) => {
  try {
    const { client_code, phone_number, full_name, email, ...intakePayload } = req.body;
    
    if (!intakePayload || !intakePayload.personal) {
      return res.status(400).json({ error: "Invalid intake form data" });
    }

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: new Date().toISOString().split("T")[0]
    });

    // 1. Evaluate Intake
    const intakeDecision = evaluateIntake(intakePayload, evaluationContext);
    if (intakeDecision.plan_status === "BLOCKED") {
      return res.status(400).json({ error: "Intake rejected", reasons: intakeDecision.decision_reasons });
    }

    // 2. Load Catalog & Build Master Engine V2
    const catalog = await loadFoodCatalog();
    const masterProgram = buildMasterEngineV2({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog,
      options: {}
    });

    // 3. Find or Create User in MariaDB `z`
    const clientName = full_name || `${intakePayload.personal.firstName || ""} ${intakePayload.personal.lastName || ""}`.trim() || "متدرب جديد";
    const clientPhone = phone_number || "01000000000";
    const clientEmail = email || `${intakePayload.personal.firstName?.toLowerCase() || "client"}.${Date.now()}@example.com`;
    const code = client_code || `CLIENT-${Date.now().toString().slice(-4)}`;

    let user = null;
    if (phone_number && phone_number !== "01000000000") {
      user = await User.findOne({ where: { phone_number } });
    }
    if (!user && client_code) {
      user = await User.findOne({ where: { client_code } });
    }

    if (!user) {
      user = await User.create({
        client_code: code,
        full_name: clientName,
        phone_number: clientPhone,
        email: clientEmail,
        role: "CLIENT",
      });
    } else {
      user.full_name = clientName;
      if (clientPhone && user.phone_number === "01000000000") {
        user.phone_number = clientPhone;
      }
      await user.save();
    }

    // 4. Save Intake Submission
    const submission = await IntakeSubmission.create({
      user_id: user.id,
      answers: intakePayload,
      status: "PROCESSED"
    });

    // 5. Save or Update Program
    let program = await Program.findOne({ where: { user_id: user.id } });
    if (program) {
      program.program_data = masterProgram;
      await program.save();
    } else {
      program = await Program.create({
        user_id: user.id,
        program_data: masterProgram
      });
    }

    return res.status(201).json({
      message: "Program generated and saved successfully to MariaDB z",
      user: {
        id: user.id,
        client_code: user.client_code,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number
      },
      submission_id: submission.id,
      program_id: program.id,
      master_program: masterProgram
    });

  } catch (err) {
    console.error("generateAndSaveProgram error:", err);
    return res.status(500).json({ error: "Failed to generate and save program", details: err.message });
  }
};

export const getUserPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({
      where: { user_id: req.user.id },
      order: [["createdAt", "DESC"]]
    });
    
    return res.status(200).json({ programs });
  } catch (err) {
    console.error("getUserPrograms error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const evaluateCheckinHandler = async (req, res) => {
  try {
    const submission = req.body;
    if (!submission) {
      return res.status(400).json({ error: "Missing check-in submission body" });
    }
    const analysis = evaluateCheckin(submission);
    return res.status(200).json({ analysis });
  } catch (err) {
    console.error("evaluateCheckinHandler error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const submitWeeklyCheckin = async (req, res) => {
  try {
    const {
      client_code,
      user_id,
      week_number = 1,
      daily_weights_kg,
      previous_average_weight_kg,
      waist_circumference_cm,
      nutrition_adherence_percent = 100,
      workouts_completed = 4,
      workouts_scheduled = 4,
      biofeedback = {},
      pain_reports = [],
      photos = [],
      // Deep check-in v3 fields
      lifestyle_variance = "NORMAL_WORK",
      bowel_regularity = "REGULAR",
      sleep_stress_composite = 3,
      menstrual_phase = "NOT_APPLICABLE",
      next_week_travel = false,
      next_week_gym_available = true,
      next_week_realistic_days = null,
      next_week_notes = null
    } = req.body;

    // Find User (Strict validation with Zero fallback)
    let user = null;
    const lookupId = user_id || client_code;
    if (!lookupId) {
      return res.status(400).json({ error: "يجب تقديم كود المشترك أو معرف المستخدم الصحيح لإرسال المتابعة" });
    }

    const cleanCode = String(lookupId).replace('#', '').trim();
    user = await User.findOne({ where: { client_code: cleanCode } });
    if (!user && !isNaN(cleanCode)) {
      user = await User.findByPk(parseInt(cleanCode, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: cleanCode } });
    }

    if (!user) {
      return res.status(400).json({ error: "المستخدم غير موجود، يرجى التحقق من معرف المشترك" });
    }

    // Strict 7-Day Weights Validation: Require exactly 7 valid numbers > 20kg (Zero Injected Fake Weights)
    if (
      !Array.isArray(daily_weights_kg) ||
      daily_weights_kg.length !== 7 ||
      daily_weights_kg.some(w => typeof w !== 'number' || isNaN(w) || w <= 20 || w > 300)
    ) {
      return res.status(400).json({
        error: "يجب تسجيل أوزان الأيام السبعة كاملة وحقيقية (7 أوزان يومية صالحة > 20 كجم) لإرسال المتابعة الأسبوعية"
      });
    }

    const weights = daily_weights_kg.map(w => Number(w));

    // Resolve real previous average weight without injecting fake 85.5 kg
    let prevAvgWeight = null;
    if (previous_average_weight_kg && !isNaN(Number(previous_average_weight_kg)) && Number(previous_average_weight_kg) > 20) {
      prevAvgWeight = Number(previous_average_weight_kg);
    } else {
      const pastCheckin = await CheckinSubmission.findOne({
        where: { user_id: user.id },
        order: [["createdAt", "DESC"]]
      });
      prevAvgWeight = pastCheckin ? pastCheckin.average_weight_kg : null;
    }

    const analysis = evaluateCheckin({
      primary_goal: await resolveClientPrimaryGoal(user.id),
      daily_weights_kg: weights,
      previous_week_average_weight_kg: prevAvgWeight,
      waist_circumference_cm: Number(waist_circumference_cm) || null,
      nutrition_adherence_percent: Number(nutrition_adherence_percent) || 95,
      workouts_completed: Number(workouts_completed) || 4,
      workouts_scheduled: Number(workouts_scheduled) || 4,
      biofeedback: biofeedback || { hunger_level: 2, energy_in_gym: 4, sleep_quality: 4, stress_level: 2 },
      pain_reports: pain_reports || [],
      lifestyle_variance,
      bowel_regularity,
      sleep_stress_composite: Number(sleep_stress_composite) || 3,
      menstrual_phase,
      occupation_type: req.body.occupation_type || null,
      next_week_travel: Boolean(next_week_travel),
      next_week_gym_available: next_week_gym_available !== false,
      next_week_realistic_days: next_week_realistic_days ? Number(next_week_realistic_days) : null,
      next_week_notes
    });

    const avgWeight = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 100) / 100;
    const weightChange = prevAvgWeight ? Math.round((avgWeight - prevAvgWeight) * 100) / 100 : null;

    const checkin = await CheckinSubmission.create({
      user_id: user.id,
      week_number: Number(week_number) || 1,
      daily_weights_kg: weights,
      average_weight_kg: avgWeight,
      weight_change_kg: weightChange,
      waist_circumference_cm: Number(waist_circumference_cm) || null,
      nutrition_adherence_percent: Number(nutrition_adherence_percent) || 100,
      workouts_completed: Number(workouts_completed) || 4,
      workouts_scheduled: Number(workouts_scheduled) || 4,
      biofeedback: biofeedback,
      pain_reports: pain_reports,
      analysis_status: analysis.analysis_status || analysis.status || "ON_TRACK",
      analysis_output: analysis,
      status: "PENDING_REVIEW",
      lifestyle_variance,
      bowel_regularity,
      sleep_stress_composite: Number(sleep_stress_composite) || 3,
      menstrual_phase,
      next_week_travel: Boolean(next_week_travel),
      next_week_gym_available: next_week_gym_available !== false,
      next_week_realistic_days: next_week_realistic_days ? Number(next_week_realistic_days) : null,
      next_week_notes
    });

    // Save attached progress photos locally to Hostinger file storage
    const savedPhotos = [];
    if (Array.isArray(photos) && photos.length > 0) {
      for (const p of photos) {
        const pUrl = typeof p === 'string' ? p : (p.photo_url || p.data || p.url);
        if (typeof pUrl === 'string' && pUrl.trim()) {
          const pose = (p.pose || 'FRONT').toUpperCase();
          const targetCode = user.client_code || String(user.id);
          const savedUrl = saveProgressPhotoToDisk(targetCode, pUrl, Number(week_number) || 1, pose);
          if (savedUrl) {
            const photoRecord = await ProgressPhoto.create({
              user_id: user.id,
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
      message: "تم إرسال المتابعة الأسبوعية بنجاح، وهي الآن معلقة في انتظار مراجعة الكابتن",
      checkin_id: checkin.id,
      analysis,
      photos: savedPhotos,
      checkin
    });
  } catch (err) {
    console.error("submitWeeklyCheckin error:", err);
    return res.status(500).json({ error: "فشل إرسال المتابعة", details: err.message });
  }
};

export const getPendingCheckins = async (req, res) => {
  try {
    const checkins = await CheckinSubmission.findAll({
      where: {
        status: { [Op.ne]: "APPROVED" }
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "client_code", "full_name", "phone_number", "email", "subscription_package", "subscription_price", "subscription_status"],
          include: [
            {
              model: ProgressPhoto,
              as: "progressPhotos",
              attributes: ["id", "week_number", "pose", "photo_url", "notes", "createdAt"]
            },
            {
              model: CheckinSubmission,
              as: "checkinSubmissions",
              attributes: ["id", "week_number", "average_weight_kg", "waist_circumference_cm", "nutrition_adherence_percent", "createdAt"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });
    return res.status(200).json({ checkins });
  } catch (err) {
    console.error("getPendingCheckins error:", err);
    return res.status(500).json({ error: "فشل جلب المتابعات", details: err.message });
  }
};

/** GET /api/v1/programs/checkin/history: the signed-in client's own check-ins (mobile app, no id in the URL). */
export const getMyCheckinHistory = async (req, res) => {
  const me = req.user?.id ? await User.findByPk(req.user.id, { attributes: ["id", "client_code"] }).catch(() => null) : null;
  if (!me) return res.status(401).json({ error: "Unauthorized: User account not found" });
  return getCheckinHistory({ user: req.user, params: { user_id: String(me.client_code || me.id) } }, res);
};

export const getCheckinHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // التحقق من الملكية: المتدرب يعرض متابعاته فقط والمدرب يعرض للجميع
    const authorized = await isAuthorizedUserOrCoach(req, user.id);
    if (!authorized) {
      return res.status(403).json({ error: "غير مصرح لك بعرض سجل متابعات متدرب آخر" });
    }

    const checkins = await CheckinSubmission.findAll({
      where: { user_id: user.id },
      order: [["createdAt", "ASC"]]
    });

    return res.status(200).json({ user, checkins });
  } catch (err) {
    console.error("getCheckinHistory error:", err);
    return res.status(500).json({ error: "فشل جلب سجل المتابعات", details: err.message });
  }
};

export const adaptProgramHandler = async (req, res) => {
  try {
    const { current_master_program, checkin_analysis, options } = req.body;
    if (!current_master_program || !checkin_analysis) {
      return res.status(400).json({ error: "current_master_program and checkin_analysis are required." });
    }
    const adaptedProgram = buildAdaptedPlan({
      currentMasterProgram: current_master_program,
      checkinAnalysis: checkin_analysis,
      options: options || {},
    });
    return res.status(200).json({ adapted_program: adaptedProgram });
  } catch (err) {
    console.error("adaptProgramHandler error:", err);
    return res.status(400).json({ error: err.message });
  }
};

const ARABIC_FOOD_CODE_MAP = [
  { keywords: ["قريش", "جبن قريش", "cottage"], code: "CHEESE_COTTAGE_LOW_FAT" },
  { keywords: ["بياض", "egg white"], code: "EGG_WHITE" },
  { keywords: ["بيض", "egg", "eggs"], code: "WHOLE_EGG" },
  { keywords: ["زبادي", "يوناني", "greek yogurt"], code: "YOGURT_GREEK_PLAIN_NONFAT" },
  { keywords: ["واي", "بروتين باودر", "whey"], code: "WHEY_PROTEIN_POWDER" },
  { keywords: ["دجاج", "فراخ", "صدور", "chicken"], code: "CHICKEN_BREAST_COOKED" },
  { keywords: ["لحم", "ستيك", "بقري", "beef", "sirloin"], code: "BEEF_TOP_SIRLOIN_LEAN" },
  { keywords: ["بلطي", "فيليه", "سمك", "tilapia"], code: "TILAPIA_COOKED" },
  { keywords: ["سلمون", "salmon"], code: "SALMON_ATLANTIC_COOKED" },
  { keywords: ["تونة", "تونه", "tuna"], code: "TUNA_CANNED_IN_WATER" },
  { keywords: ["شوفان", "oat", "oats", "oatmeal"], code: "OATS_ROLLED_RAW" },
  { keywords: ["توست", "خبز", "عيش", "toast", "bread"], code: "BREAD_WHOLE_WHEAT" },
  { keywords: ["موز", "banana"], code: "BANANA_RAW" },
  { keywords: ["أرز", "ارز", "رز", "rice"], code: "RICE_WHITE_COOKED" },
  { keywords: ["بطاطس", "potato"], code: "POTATO_BAKED" },
  { keywords: ["بطاطا", "sweet potato"], code: "SWEET_POTATO_BAKED" },
  { keywords: ["مكرونة", "مكرونه", "باستا", "pasta"], code: "PASTA_WHOLE_WHEAT_COOKED" },
  { keywords: ["زيت", "olive oil"], code: "OLIVE_OIL" },
  { keywords: ["فول سوداني", "سوداني", "peanut butter"], code: "PEANUT_BUTTER" },
  { keywords: ["لوز", "مكسرات", "almond", "almonds"], code: "ALMONDS_RAW" }
];

const FOOD_CODE_ALIASES = {
  CHEESE_COTTAGE_LOWFAT: "CHEESE_COTTAGE_LOW_FAT",
  CHEESE_COTTAGE: "CHEESE_COTTAGE_LOW_FAT",
  COTTAGE_CHEESE: "CHEESE_COTTAGE_LOW_FAT",
  EGG_WHOLE: "WHOLE_EGG",
  EGG_WHOLE_COOKED: "WHOLE_EGG",
  EGGS: "WHOLE_EGG",
  EGG_WHITES: "EGG_WHITE",
  GREEK_YOGURT: "YOGURT_GREEK_PLAIN_NONFAT",
  GREEK_YOGURT_PLAIN_NONFAT: "YOGURT_GREEK_PLAIN_NONFAT",
  WHEY_PROTEIN: "WHEY_PROTEIN_POWDER",
  CHICKEN_BREAST: "CHICKEN_BREAST_COOKED",
  BEEF_SIRLOIN: "BEEF_TOP_SIRLOIN_LEAN",
  BEEF_LEAN: "BEEF_TOP_SIRLOIN_LEAN",
  TILAPIA: "TILAPIA_COOKED",
  SALMON: "SALMON_ATLANTIC_COOKED",
  TUNA: "TUNA_CANNED_IN_WATER",
  OATS: "OATS_ROLLED_RAW",
  OATMEAL: "OATS_ROLLED_RAW",
  TOAST_WHOLE_WHEAT: "BREAD_WHOLE_WHEAT",
  WHOLE_WHEAT_BREAD: "BREAD_WHOLE_WHEAT",
  BANANA: "BANANA_RAW",
  WHITE_RICE: "RICE_WHITE_COOKED",
  RICE_WHITE: "RICE_WHITE_COOKED",
  POTATO: "POTATO_BAKED",
  SWEET_POTATO: "SWEET_POTATO_BAKED",
  SWEET_POTATO_COOKED: "SWEET_POTATO_BAKED",
  PASTA_WHOLE_WHEAT: "PASTA_WHOLE_WHEAT_COOKED",
  PASTA_WHOLE_WHEAT_COOKED: "PASTA_WHOLE_WHEAT_COOKED",
  OLIVE_OIL: "OLIVE_OIL",
  PEANUT_BUTTER: "PEANUT_BUTTER",
  ALMONDS: "ALMONDS_RAW",
  ALMONDS_RAW: "ALMONDS_RAW"
};

// An unrecognised food returns null. It used to fall back to "WHOLE_EGG", so rice with an unknown
// code was offered egg swaps.
function normalizeFoodCode(codeOrName) {
  if (!codeOrName) return null;
  const str = String(codeOrName).trim();
  const upper = str.toUpperCase();

  if (FOOD_CODE_ALIASES[upper]) return FOOD_CODE_ALIASES[upper];
  if (PLAN_FOOD_TO_REGISTRY[upper]) return PLAN_FOOD_TO_REGISTRY[upper];

  for (const item of SMART_SWAP_REGISTRY) {
    if (item.food_code === upper) return upper;
  }

  const lower = str.toLowerCase();
  for (const mapping of ARABIC_FOOD_CODE_MAP) {
    for (const kw of mapping.keywords) {
      if (lower.includes(kw)) {
        return mapping.code;
      }
    }
  }

  return null;
}

/** The clinical restrictions of the client a swap request is for (signed-in client, or client_code from a coach). */
async function swapContextFor(req) {
  const requester = req.user?.id ? await User.findByPk(req.user.id).catch(() => null) : null;
  const code = String(req.body?.client_code || "").replace(/^#+/, "").trim();
  const clientForCoach = requester && ["COACH", "ADMIN"].includes(requester.role) && code
    ? await User.findOne({ where: { client_code: code } }).catch(() => null)
    : null;
  return resolveSwapContext({ requester, clientForCoach, loadAnswers: loadLatestIntakeAnswers });
}

/** Meal items the client cannot swap (protein powder) carry the note saying what to do instead. */
function withNoSwapNotes(meals = []) {
  if (!Array.isArray(meals)) return meals;
  return meals.map((meal) => ({
    ...meal,
    items: Array.isArray(meal?.items)
      ? meal.items.map((item) => (isNoSwapFood(item?.code || item?.food_code) && !item.note ? { ...item, note: NO_SWAP_NOTE_AR } : item))
      : meal?.items,
  }));
}

/**
 * The meal a food sits in on the client's active plan (the portion closest to the one asked about
 * when it appears more than once), as a swap-registry meal category; null when not found.
 * The mobile app names no meal, and breakfast bread must not be offered rice.
 */
async function mealCategoryFromClientPlan(userId, registryCode, grams) {
  if (!userId || !registryCode) return null;
  const program = await Program.findOne({ where: { user_id: userId, status: "ACTIVE" }, order: [["id", "DESC"]] }).catch(() => null);
  let data = program?.program_data;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  const meals = data?.nutrition?.meals?.length ? data.nutrition.meals : (data?.nutrition_program?.culinary_meals || []);
  let best = null;
  meals.forEach((meal, index) => {
    for (const item of meal?.items || []) {
      if (normalizeFoodCode(item?.food_code || item?.code) !== registryCode) continue;
      const gap = Math.abs((Number(item.portion_g ?? item.amount) || 0) - (Number(grams) || 0));
      if (!best || gap < best.gap) best = { gap, meal, index };
    }
  });
  if (!best) return null;
  const name = String(best.meal.meal_name_ar || best.meal.title || best.meal.name || "");
  if (/سناك|snack/i.test(name)) return "SNACK";
  if (/فطار|إفطار|افطار|breakfast/i.test(name) || (!name && best.index === 0)) return "BREAKFAST";
  return "MAIN_MEAL";
}

/** The swap registry's meal category for a meal named by the app, or null when none is named. */
function mealCategoryFromContext(mealContext) {
  const context = String(mealContext || "").toUpperCase();
  if (!context) return null;
  if (context === "BREAKFAST") return "BREAKFAST";
  if (context === "SNACK") return "SNACK";
  return "MAIN_MEAL";
}

export const getSwapCandidatesHandler = async (req, res) => {
  try {
    const { food_code, name_ar, meal_context, source_grams } = req.body;
    const normalizedCode = normalizeFoodCode(food_code) || normalizeFoodCode(name_ar);
    if (!normalizedCode) {
      return res.status(200).json({ candidates: [], message_ar: "لا توجد بدائل مسجلة لهذا الصنف." });
    }
    // Protein powder has no swap (owner rule): the client takes it, or tells the coach it ran out.
    if (isNoSwapFood(normalizedCode) || isNoSwapFood(food_code)) {
      return res.status(200).json({ candidates: [], message_ar: NO_SWAP_NOTE_AR });
    }
    const grams = Number(source_grams) || 100;
    const clinicalContext = await swapContextFor(req);
    const mealCategory = mealCategoryFromContext(meal_context)
      || (req.user?.id ? await mealCategoryFromClientPlan(req.user.id, normalizedCode, grams) : null);

    // With no meal named (the mobile app sends none) every food of the same macro type is a
    // candidate; the family rule below keeps only what is eaten the same way.
    let candidates = mealCategory ? listSmartSwapCandidates(normalizedCode, mealCategory) : [];
    if (!candidates || candidates.length === 0) {
      const current = getSmartFoodRegistryItem(normalizedCode);
      if (current) {
        candidates = SMART_SWAP_REGISTRY.filter(
          (item) => item.food_code !== normalizedCode && item.macro_type === current.macro_type
        );
      }
    }

    const currentItem = getSmartFoodRegistryItem(normalizedCode);
    const enrichedCandidates = (candidates || []).map((cand) => {
      let targetGrams = 100;
      let displayAr = `${cand.name_ar}`;
      if (currentItem) {
        try {
          const swapCalc = calculateSmartSwap({
            current_food_code: normalizedCode,
            current_portion_g: grams,
            target_food_code: cand.food_code,
            meal_category: mealCategory && cand.meal_categories?.includes(mealCategory) ? mealCategory : cand.meal_categories?.[0]
          });
          targetGrams = swapCalc.target_food.portion_g;
          displayAr = swapCalc.target_food.serving_display_ar;
        } catch (e) {
          targetGrams = Math.round(grams * (currentItem.primary_nutrient_per_100g / cand.primary_nutrient_per_100g));
          displayAr = `${cand.name_ar} (${targetGrams} جرام)`;
        }
      }
      // Portion from the same food data the value check and the plan use.
      const oneSourceGrams = currentItem ? liveSwapTargetGrams(normalizedCode, grams, cand.food_code, cand.macro_type) : null;
      if (oneSourceGrams) {
        targetGrams = oneSourceGrams;
        displayAr = liveSwapServingText(cand, oneSourceGrams);
      }
      // A leaner swap comes with the missing fat as olive oil, shown in its line.
      const oil = currentItem ? liveSwapOilAddition(normalizedCode, grams, cand.food_code, targetGrams) : 0;
      return {
        food_code: cand.food_code,
        name_ar: cand.name_ar,
        name_en: cand.name_en,
        macro_type: cand.macro_type,
        target_grams: targetGrams,
        oil_addition_g: oil,
        display_ar: `${displayAr}${liveSwapOilText(oil)}`,
        serving_display_ar: `${displayAr}${liveSwapOilText(oil)}`
      };
    });

    // Only what the client's own meal plan could contain: allergies, conditions, and the diabetic
    // potato portion.
    // ...and eaten the same way with about the same energy (swapExchangeRules).
    const safeCandidates = enrichedCandidates.filter((cand) => isSwapFoodSafe(cand.food_code, clinicalContext, cand.target_grams)
      && isLiveSwapEquivalent(normalizedCode, grams, cand.food_code, cand.target_grams));
    return res.status(200).json({ candidates: safeCandidates });
  } catch (err) {
    console.error("getSwapCandidatesHandler error:", err);
    return res.status(500).json({ error: "فشل استرجاع البدائل", details: err.message });
  }
};

export const calculateSwapHandler = async (req, res) => {
  try {
    const {
      source_food_code,
      current_food_code,
      source_grams,
      current_portion_g,
      target_food_code,
      meal_context,
      meal_category,
    } = req.body;

    const fromCode = normalizeFoodCode(source_food_code || current_food_code);
    const toCode = normalizeFoodCode(target_food_code);
    if (!fromCode || !toCode) {
      return res.status(400).json({ error: "صنف غير معروف في قائمة البدائل" });
    }
    if (isNoSwapFood(fromCode) || isNoSwapFood(source_food_code || current_food_code)) {
      return res.status(409).json({ error: NO_SWAP_NOTE_AR, code: "NO_SWAP_FOR_FOOD" });
    }
    const fromGrams = Number(source_grams || current_portion_g) || 100;
    // No meal named: any meal the target food suits (the candidate list was built the same way).
    const category = meal_category || mealCategoryFromContext(meal_context)
      || getSmartFoodRegistryItem(toCode)?.meal_categories?.[0] || "MAIN_MEAL";

    const computed = calculateSmartSwap({
      current_food_code: fromCode,
      current_portion_g: fromGrams,
      target_food_code: toCode,
      meal_category: category,
    });
    // Portion from the same food data the value check and the plan use (as in swap-candidates).
    const oneSourceGrams = liveSwapTargetGrams(fromCode, fromGrams, toCode, computed.macro_type);
    const targetItem = getSmartFoodRegistryItem(toCode);
    const result = oneSourceGrams && targetItem
      ? {
          ...computed,
          target_food: {
            ...computed.target_food,
            portion_g: oneSourceGrams,
            unit_count: Math.round((oneSourceGrams / targetItem.grams_per_household_unit) * 2) / 2,
            serving_display_ar: liveSwapServingText(targetItem, oneSourceGrams),
            serving_display_en: `${oneSourceGrams}g ${targetItem.name_en}`,
          },
        }
      : computed;

    // A target the client's restrictions forbid is refused even when sent directly.
    const clinicalContext = await swapContextFor(req);
    if (!isSwapFoodSafe(toCode, clinicalContext, result.target_food.portion_g)) {
      return res.status(409).json({ error: "البديل ده مش مناسب لحالتك الصحية أو الحساسية المسجلة", code: "SWAP_NOT_CLINICALLY_SAFE" });
    }
    if (!isLiveSwapEquivalent(fromCode, fromGrams, toCode, result.target_food.portion_g)) {
      return res.status(409).json({ error: "البديل ده مش من نفس نوع الأكل أو قيمته مش قريبة؛ اختار بديل من القايمة", code: "SWAP_NOT_EQUIVALENT" });
    }

    // The app shows the new item's calories and macros from these fields (it showed 0 without them),
    // including the olive oil a leaner swap adds.
    const value = liveSwapValueWithOil(fromCode, fromGrams, toCode, result.target_food.portion_g);
    const oil = value?.oil || 0;
    const macros = value ? {
      calories: Math.round(value.kcal),
      protein_g: Math.round(value.protein * 10) / 10,
      carbs_g: Math.round(value.carbs * 10) / 10,
      fat_g: Math.round(value.fat * 10) / 10,
      oil_addition_g: oil,
    } : {};
    const withOil = {
      name_ar: `${result.target_food.name_ar}${liveSwapOilText(oil)}`,
      serving_display_ar: `${result.target_food.serving_display_ar}${liveSwapOilText(oil)}`,
    };

    const swappedFood = {
      food_code: result.target_food.food_code,
      name_ar: withOil.name_ar,
      name_en: result.target_food.name_en,
      grams: result.target_food.portion_g,
      portion_g_rounded: result.target_food.portion_g,
      serving_display_ar: withOil.serving_display_ar,
      serving_display_en: result.target_food.serving_display_en,
      ...macros,
    };

    return res.status(200).json({
      swap: { ...result, target_food: { ...result.target_food, ...withOil, ...macros } },
      swapped_food: swappedFood
    });
  } catch (err) {
    console.error("calculateSwapHandler error:", err);
    return res.status(400).json({ error: err.message });
  }
};

// Reads only the bedtime (HH:MM) from the client's latest intake, for the static caffeine
// cutoff guide in the client app. Never throws; returns null when unavailable.
/**
 * Latest intake answers for a client, decrypted and unwrapped. The public intake endpoint stores the
 * request body minus identity fields, i.e. { answers: { ...form } }, so the form fields sit one level down.
 */
export async function loadLatestIntakeAnswers(userId) {
  const submission = await IntakeSubmission.findOne({
    where: { user_id: userId },
    order: [["id", "DESC"]],
    attributes: ["answers"],
  });
  let stored = submission?.answers;
  if (typeof stored === "string") stored = JSON.parse(stored);
  if (stored && stored._isEncrypted && stored.data) stored = decryptMedicalData(stored.data);
  if (!stored || typeof stored !== "object") return null;
  return stored.answers && typeof stored.answers === "object" ? { ...stored, ...stored.answers } : stored;
}

/** True when the latest intake says the client is female (User has no sex column). */
export async function resolveClientIsFemale(userId) {
  try {
    const answers = await loadLatestIntakeAnswers(userId);
    const sex = String(answers?.gender ?? answers?.personal?.sex ?? answers?.personal?.gender ?? "").toLowerCase();
    return sex === "female";
  } catch {
    return false;
  }
}

const COUNTRY_TIME_ZONES = Object.freeze({
  EG: "Africa/Cairo", SA: "Asia/Riyadh", AE: "Asia/Dubai", KW: "Asia/Kuwait", QA: "Asia/Qatar", BH: "Asia/Bahrain", OM: "Asia/Muscat",
});

/** Country of a client from the phone number (international prefix, or local Egyptian 01 / Gulf 05 formats). */
export function resolveCountryFromPhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "").replace(/^00/, "+");
  const prefixes = [["+20", "EG"], ["+966", "SA"], ["+971", "AE"], ["+965", "KW"], ["+974", "QA"], ["+973", "BH"], ["+968", "OM"]];
  for (const [prefix, country] of prefixes) if (digits.startsWith(prefix)) return country;
  if (/^01\d{9}$/.test(digits)) return "EG";
  if (/^05\d{8}$/.test(digits)) return "SA";
  return null;
}

/**
 * Today's religious fasting context for a client: religion and Christian fasting style from the latest
 * intake, the coach override stored in program_data.fasting_override, and the client's time zone.
 */
export async function resolveClientFastingContext(user, programData = {}, now = new Date()) {
  const answers = (await loadLatestIntakeAnswers(user.id).catch(() => null)) || {};
  const country = resolveCountryFromPhone(user.phone_number);
  const override = Object.values(FASTING_OVERRIDES).includes(programData?.fasting_override) ? programData.fasting_override : FASTING_OVERRIDES.AUTO;
  return {
    ...resolveFastingContext({
      religion: answers.religion,
      christian_fasting_style: answers.christianFastingStyle,
      override,
      date: now,
      time_zone: COUNTRY_TIME_ZONES[country] || COUNTRY_TIME_ZONES.EG,
    }),
    religion: answers.religion || null,
    country_code: country,
  };
}

/** Coach toggle: AUTO (calendar), OFF (client not fasting: illness, travel...), FORCE_ON. Coaches/admins only. */
export const setFastingOverride = async (req, res) => {
  try {
    const requester = req.user ? await User.findByPk(req.user.id) : null;
    if (!requester || !["COACH", "ADMIN"].includes(requester.role)) {
      return res.status(403).json({ error: "تعديل وضع الصيام متاح للكوتش فقط" });
    }
    const { client_code, override } = req.body || {};
    if (!Object.values(FASTING_OVERRIDES).includes(override)) {
      return res.status(400).json({ error: "قيمة غير صالحة. المسموح: AUTO أو OFF أو FORCE_ON" });
    }
    const user = await User.findOne({ where: { client_code: String(client_code || "").replace(/^#+/, "").trim() } });
    if (!user) return res.status(404).json({ error: "المتدرب غير موجود" });
    const program = await Program.findOne({ where: { user_id: user.id }, order: [["id", "DESC"]] });
    if (!program) return res.status(404).json({ error: "لا توجد خطة لهذا المتدرب" });
    program.program_data = { ...(program.program_data || {}), fasting_override: override };
    if (typeof program.changed === "function") program.changed("program_data", true);
    await program.save();
    return res.status(200).json({ fasting_override: override, fasting_context: await resolveClientFastingContext(user, program.program_data) });
  } catch (err) {
    console.error("setFastingOverride error:", err);
    return res.status(500).json({ error: "فشل تعديل وضع الصيام" });
  }
};

export async function resolveClientBedtimeHour(userId) {
  try {
    const answers = await loadLatestIntakeAnswers(userId);
    const bedtime = answers?.sleep_schedule?.bedtime_hour;
    return typeof bedtime === "string" && /^([01]?\d|2[0-3]):[0-5]\d$/.test(bedtime.trim()) ? bedtime.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Canonical primary goal (FAT_LOSS, MUSCLE_GAIN, WEIGHT_MAINTENANCE, ...) from the client's latest intake,
 * so the weekly check-in can tell a fat-loss plateau from a muscle-gain stall. Null when unavailable.
 */
export async function resolveClientPrimaryGoal(userId) {
  try {
    const answers = await loadLatestIntakeAnswers(userId);
    if (!answers) return null;
    // The canonical goal folds recomposition into FAT_LOSS; keep it distinct for the adaptive TDEE (10% deficit).
    const rawGoal = String(answers.goals?.primary ?? answers.primary_goal ?? "").toUpperCase();
    if (rawGoal.includes("RECOMP")) return "BODY_RECOMPOSITION";
    return adaptIntakePayloadToCanonicalEngine(structuredClone(answers)).goals?.primary || null;
  } catch {
    return null;
  }
}

/**
 * Food-relevant clinical constraints from the client's latest intake, for the client app's swap engine
 * (isFoodClinicallySafe): favism/G6PD, gout, celiac, lactose, diabetes, IBS/GI, bariatric surgery and the
 * strict allergy list. Null when no intake is available.
 */
export function deriveClinicalConstraints(answers) {
  if (!answers || typeof answers !== "object") return null;
  const med = answers.medical_conditions && typeof answers.medical_conditions === "object" && !Array.isArray(answers.medical_conditions)
    ? answers.medical_conditions
    : {};
  const selected = new Set((Array.isArray(med.selected) ? med.selected : []).map((s) => String(s).toLowerCase()));
  const allergies = (Array.isArray(answers.strict_allergies) ? answers.strict_allergies : [])
    .map((a) => String(a).toLowerCase())
    .filter((a) => a && a !== "none");
  return {
    is_g6pd: selected.has("favism_g6pd") || med.favism_g6pd === true,
    is_gout: selected.has("gout") || med.gout === true,
    is_celiac: allergies.includes("gluten_celiac"),
    is_lactose_intolerant: allergies.includes("dairy_lactose"),
    is_diabetic: selected.has("diabetes") || med.diabetes?.uses_insulin === true,
    is_ibs: selected.has("gi_tract"),
    is_bariatric: selected.has("bariatric_surgery") || med.bariatric?.is_operated === true,
    has_dumping_syndrome: med.bariatric?.dumping_syndrome === true,
    allergies,
    // The intake's "foods I don't like" labels; the web swap window leaves them out.
    disliked_foods: (Array.isArray(answers.disliked_foods) ? answers.disliked_foods : []).map((f) => String(f)),
  };
}

export async function resolveClientClinicalConstraints(userId) {
  try {
    return deriveClinicalConstraints(await loadLatestIntakeAnswers(userId));
  } catch {
    return null;
  }
}

/**
 * Whether the client's latest intake requires medical review before a plan may be published
 * (kidney/liver disease, dangerous symptoms, injury red flags, unstable conditions).
 */
export async function resolveIntakeMedicalReview(userId) {
  try {
    const answers = await loadLatestIntakeAnswers(userId);
    if (!answers) return { required: false, reasons: [] };
    const decision = evaluateIntake(
      adaptIntakePayloadToCanonicalEngine(structuredClone(answers)),
      { assessmentDate: new Date().toISOString().split("T")[0] },
    );
    const required = decision.plan_status === "MEDICAL_REVIEW_REQUIRED";
    return {
      required,
      reasons: required
        ? (decision.review_flags || []).filter((f) => f.level === "MEDICAL").map((f) => f.code)
        : [],
    };
  } catch {
    // An unreadable intake must not silently allow publishing a medically flagged plan.
    return { required: true, reasons: ["INTAKE_UNREADABLE"] };
  }
}

export const MEDICAL_REVIEW_CONFIRMATION_REQUIRED = "MEDICAL_REVIEW_CONFIRMATION_REQUIRED";

/**
 * POST /api/v1/programs/next-cycle: prepare the client's next training cycle from the one they just
 * finished — same exercises, starting weights taken from their own logs — and save it as a draft.
 * It is never published here: the coach opens it, deals with anything flagged, and publishes.
 * Coaches and admins only.
 */
export const prepareNextCycle = async (req, res) => {
  try {
    const requester = req.user ? await User.findByPk(req.user.id) : null;
    if (!requester || !["COACH", "ADMIN"].includes(requester.role)) {
      return res.status(403).json({ error: "تجهيز الدورة الجديدة متاح للكوتش فقط" });
    }

    const code = String(req.body?.client_code || "").replace(/^#+/, "").trim();
    const user = code ? await User.findOne({ where: { client_code: code } }) : null;
    if (!user) return res.status(404).json({ error: "المتدرب غير موجود" });

    const program = await Program.findOne({ where: { user_id: user.id }, order: [["id", "DESC"]] });
    if (!program) return res.status(404).json({ error: "لا توجد خطة حالية لبناء الدورة التالية منها" });
    if (program.status !== "ACTIVE") {
      return res.status(409).json({ error: "آخر خطة لهذا المتدرب ما زالت مسودة لم تُنشر بعد", code: "DRAFT_ALREADY_PENDING" });
    }

    // A cycle that is still running is not replaced by accident: one wrong click would restart a
    // client in their second week from scratch. Its last week counts as running too: that is the
    // deload week, and a cycle prepared during it starts at once and skips it. The coach is warned a
    // week ahead in the attention list, and can still force it deliberately.
    const currentCycle = resolveTrainingCycleStatus(program);
    if (currentCycle.status !== CYCLE_STATUS.ENDED && req.body?.force !== true) {
      return res.status(409).json({
        error: `الدورة الحالية ما زالت جارية (الأسبوع ${currentCycle.current_week} من ${currentCycle.total_weeks}، تنتهي ${currentCycle.ends_on}).`,
        code: "CYCLE_STILL_RUNNING",
        training_cycle: currentCycle,
        hint_ar: "لو كنت متأكداً من بناء دورة جديدة الآن أرسل force: true.",
      });
    }

    const [progression, checkins, medicalReview] = await Promise.all([
      loadProgressionState(user.id),
      CheckinSubmission.findAll({ where: { user_id: user.id }, order: [["id", "DESC"]], limit: 4, attributes: ["analysis_output", "createdAt"] }),
      resolveIntakeMedicalReview(user.id).catch(() => ({ required: false })),
    ]);

    const { program_data, summary } = buildNextCycle({
      program,
      progression,
      flagged_exercises: resolvePainFlaggedExercises(checkins),
    });

    const decision = evaluateAutoPublish({
      summary,
      medical_review_required: medicalReview?.required === true,
      last_checkin_at: checkins[0]?.createdAt || null,
      deload_active: progression?.deload?.status === "ACTIVE",
      subscription_active: user.subscription_status !== "DEACTIVATED"
        && (!user.subscription_end_date || new Date(user.subscription_end_date).getTime() >= Date.now()),
    });

    const created = await Program.create({
      user_id: user.id,
      program_data,
      status: decision.allowed ? "ACTIVE" : "DRAFT",
    });

    return res.status(201).json({
      message: `${summary.message_ar} ${decision.message_ar}`,
      program_id: created.id,
      client_code: user.client_code,
      published: decision.allowed,
      waiting_reasons_ar: decision.reasons_ar,
      summary,
      previous_cycle: resolveTrainingCycleStatus(program),
    });
  } catch (err) {
    console.error("prepareNextCycle error:", err);
    return res.status(500).json({ error: "فشل تجهيز الدورة التدريبية الجديدة" });
  }
};

/**
 * POST /api/v1/programs/cycles/run-due: go through every client whose cycle has ended or is ending,
 * prepare the next one for each, publish the ones that clear the safety gates and leave the rest as
 * drafts with the reason stated. This is the one action that carries a long subscription forward.
 * Coaches and admins only.
 */
export const runDueCycles = async (req, res) => {
  try {
    const requester = req.user ? await User.findByPk(req.user.id) : null;
    if (!requester || !["COACH", "ADMIN"].includes(requester.role)) {
      return res.status(403).json({ error: "تشغيل الدورات المستحقة متاح للكوتش فقط" });
    }

    const programs = await Program.findAll({
      where: { status: "ACTIVE" },
      order: [["id", "DESC"]],
      include: [{ model: User, as: "user", attributes: ["id", "client_code", "full_name", "subscription_status"] }],
    });

    const seen = new Set();
    const published = [];
    const waiting = [];

    for (const program of programs) {
      const client = program.user;
      if (!client || seen.has(client.id)) continue;
      seen.add(client.id);
      if (client.subscription_status === "DEACTIVATED") continue;
      // Only cycles that have ended: one in its last (deload) week is left to finish.
      if (resolveTrainingCycleStatus(program).status !== CYCLE_STATUS.ENDED) continue;

      const pendingDraft = await Program.findOne({ where: { user_id: client.id, status: "DRAFT", id: { [Op.gt]: program.id } }, attributes: ["id"] });
      if (pendingDraft) {
        waiting.push({ client_code: client.client_code, full_name: client.full_name, program_id: pendingDraft.id, reasons_ar: ["مسودة دورة جاهزة بالفعل تنتظر قرارك."] });
        continue;
      }

      const single = { status: 200, body: null };
      const innerRes = { status(c) { single.status = c; return innerRes; }, json(b) { single.body = b; return innerRes; } };
      await prepareNextCycle({ user: req.user, body: { client_code: client.client_code } }, innerRes);
      if (single.status !== 201) continue;

      const entry = {
        client_code: client.client_code,
        full_name: client.full_name,
        program_id: single.body.program_id,
        cycle_number: single.body.summary.cycle_number,
        reasons_ar: single.body.waiting_reasons_ar,
      };
      (single.body.published ? published : waiting).push(entry);
    }

    return res.status(200).json({
      published_count: published.length,
      waiting_count: waiting.length,
      published,
      waiting,
      message_ar: `تم تجهيز ${published.length + waiting.length} دورة: ${published.length} نُشرت تلقائياً و${waiting.length} تنتظر قرارك.`,
    });
  } catch (err) {
    console.error("runDueCycles error:", err);
    return res.status(500).json({ error: "فشل تشغيل الدورات المستحقة" });
  }
};

/**
 * GET /api/v1/programs/cycles/attention: the clients whose training cycle ends within a week or has
 * already ended. This is what stops a client on a long subscription from training a finished plan.
 * Coaches and admins only.
 */
export const getCyclesNeedingAttention = async (req, res) => {
  try {
    const requester = req.user ? await User.findByPk(req.user.id) : null;
    if (!requester || !["COACH", "ADMIN"].includes(requester.role)) {
      return res.status(403).json({ error: "هذه القائمة متاحة للكوتش فقط" });
    }

    const programs = await Program.findAll({
      where: { status: "ACTIVE" },
      order: [["id", "DESC"]],
      include: [{ model: User, as: "user", attributes: ["id", "client_code", "full_name", "subscription_status", "subscription_end_date"] }],
    });

    const seen = new Set();
    const clients = [];
    for (const program of programs) {
      const client = program.user;
      if (!client || seen.has(client.id)) continue;
      seen.add(client.id);
      if (client.subscription_status === "DEACTIVATED") continue;
      const cycle = resolveTrainingCycleStatus(program);
      // One list to look at: a plan that ran out, and a subscription about to, are both things the
      // coach has to act on this week.
      const subscription = resolveSubscriptionState(client);
      const renewalDue = subscriptionNeedsAttention(client);
      if (!cycle.needs_new_cycle && !renewalDue) continue;
      clients.push({
        client_code: client.client_code,
        full_name: client.full_name,
        program_id: program.id,
        ...cycle,
        subscription,
        renewal_due: renewalDue,
      });
    }

    clients.sort((a, b) => a.days_remaining - b.days_remaining);
    return res.status(200).json({
      count: clients.length,
      ended_count: clients.filter((c) => c.status === CYCLE_STATUS.ENDED).length,
      renewal_count: clients.filter((c) => c.renewal_due).length,
      clients,
    });
  } catch (err) {
    console.error("getCyclesNeedingAttention error:", err);
    return res.status(500).json({ error: "فشل جلب قائمة الدورات المنتهية" });
  }
};

/** GET /api/v1/programs/active: the signed-in client's own program (mobile app; no id in the URL). */
export const getMyActiveProgram = async (req, res) => {
  const me = req.user?.id ? await User.findByPk(req.user.id, { attributes: ["id", "client_code"] }).catch(() => null) : null;
  if (!me) return res.status(401).json({ error: "Unauthorized: User account not found" });
  return getActiveProgramByUserId({ user: req.user, params: { user_id: String(me.client_code || me.id) } }, res);
};

export const getActiveProgramByUserId = async (req, res) => {
  try {
    const rawTarget = req.params.user_id || req.params.code || "";
    const rawCode = String(rawTarget).trim();
    const cleanCode = rawCode.replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();

    // 1. Look up user by client_code (clean and raw)
    let user = await User.findOne({ where: { client_code: cleanCode } });
    if (!user && rawCode !== cleanCode) {
      user = await User.findOne({ where: { client_code: rawCode } });
    }

    // 2. Look up user by primary key ID (if numeric)
    if (!user && !isNaN(cleanCode) && cleanCode !== "") {
      user = await User.findByPk(parseInt(cleanCode, 10));
    }

    // 3. Look up user by phone_number
    if (!user) {
      user = await User.findOne({ where: { phone_number: cleanCode } });
    }
    if (!user && rawCode !== cleanCode) {
      user = await User.findOne({ where: { phone_number: rawCode } });
    }

    if (!user) {
      return res.status(404).json({ error: "المتدرب غير موجود" });
    }

    // التحقق من الملكية: المتدرب يطلع على برنامجه فقط والمدرب يطلع على برامج الجميع
    const authorized = await isAuthorizedUserOrCoach(req, user.id);
    if (!authorized) {
      return res.status(403).json({ error: "غير مصرح لك بعرض برنامج متدرب آخر" });
    }

    // The published plan wins over anything newer: a prepared next cycle sits as a DRAFT until the
    // coach releases it, and must never reach the client's app by being the most recent row.
    const clientAttributes = ["id", "client_code", "full_name", "phone_number", "email", "role", "subscription_package", "plan_approval_status"];
    const program =
      (await Program.findOne({
        where: { user_id: user.id, status: "ACTIVE" },
        order: [["id", "DESC"]],
        include: [{ model: User, as: "user", attributes: clientAttributes }],
      })) ||
      (await Program.findOne({
        where: { user_id: user.id },
        order: [["id", "DESC"]],
        include: [{ model: User, as: "user", attributes: clientAttributes }],
      }));
    const pendingDraft = program?.status === "ACTIVE"
      ? await Program.findOne({ where: { user_id: user.id, status: "DRAFT", id: { [Op.gt]: program.id } }, order: [["id", "DESC"]], attributes: ["id"] })
      : null;

    if (!program) {
      return res.status(200).json({
        has_program: false,
        is_pending_review: true,
        plan_approval_status: user.plan_approval_status || "PENDING_COACH_REVIEW",
        program_id: null,
        user: {
          id: user.id,
          client_code: user.client_code,
          full_name: user.full_name || `متدرب #${user.client_code}`,
          phone_number: user.phone_number,
          email: user.email,
          subscription_package: user.subscription_package,
          plan_approval_status: user.plan_approval_status,
          role: user.role
        },
        master_program: null,
        message: "No active program found for this client yet"
      });
    }

    const isApproved = program.status === "ACTIVE" || user.plan_approval_status === "APPROVED";

    const targets = program.program_data?.nutrition?.targets || {};
    const target_macros = {
      calories: Number(targets.calories || 0),
      protein_g: Number(targets.protein || targets.protein_g || 0),
      carbs_g: Number(targets.carbs || targets.carbs_g || 0),
      fat_g: Number(targets.fats || targets.fat_g || 0),
    };

    const nowStr = req.query?.now;
    const now = nowStr ? new Date(nowStr) : new Date();

    const fastingContext = await resolveClientFastingContext(user, program.program_data, now);
    const clinicalConstraints = await resolveClientClinicalConstraints(user.id) || {};
    const meals = withNoSwapNotes(applyFastingToMeals(program.program_data?.nutrition?.meals || [], fastingContext, clinicalConstraints));

    const heatAdvisory = getGulfHeatAdvisory({ country_code: resolveCountryFromPhone(user.phone_number), date: now });
    
    const advisories_ar = [];
    if (fastingContext?.mode === "RAMADAN") advisories_ar.push(RAMADAN_CARDIO_GUIDANCE_AR);
    if (heatAdvisory?.active) advisories_ar.push(heatAdvisory.message_ar);

    const cardioPayload = program.program_data?.cardio || {};
    const answers = (await loadLatestIntakeAnswers(user.id).catch(() => null)) || {};
    const conditions = [
      ...(answers.medical_conditions?.selected || []),
      ...(Array.isArray(answers.dangerous_symptoms) ? answers.dangerous_symptoms.filter((s) => s !== "NONE") : [])
    ];
    // The client's injuries, body and equipment reach the cardio rules (they did not: the BMI and
    // knee/back impact rules never fired), and a steps-only plan is shown as daily walking.
    const injuries = answers.injuries_map?.has_injuries === false ? [] : (answers.injuries_map?.selected_areas || []).filter((a) => a && a !== "none");
    const latestWeight = Number((await CheckinSubmission.findOne({ where: { user_id: user.id }, order: [["week_number", "DESC"], ["id", "DESC"]], attributes: ["average_weight_kg"] }).catch(() => null))?.average_weight_kg);
    const setup = String(answers.training_environment || "").toLowerCase();
    const machinesAvailable = !["calisthenics_bands", "minimal_equipment", "home_gym"].includes(setup);
    const engineStrategy = program.program_data?.cardio_program?.plan_specification?.strategy;
    const cardio = {
      ...getPracticalCardioPrescription({
        ...(["STEPS_ONLY", "NO_ADDITIONAL_CARDIO"].includes(engineStrategy) && !cardioPayload.type ? { type: "RECOVERY_WALK" } : {}),
        ...cardioPayload,
        medicalConditions: [...conditions, ...injuries, ...(answers.is_pregnant === true ? ["PREGNANT"] : [])],
        weight_kg: cardioPayload.weight_kg ?? (Number.isFinite(latestWeight) && latestWeight > 0 ? latestWeight : Number(answers.weight_kg) || null),
        height_cm: cardioPayload.height_cm ?? (Number(answers.height_cm) || null),
        machines_available: cardioPayload.machines_available ?? machinesAvailable,
      }),
      advisories_ar
    };

    const progression = await loadProgressionState(user.id, now);
    const trainingNode = program.program_data?.training || program.program_data?.training_program || {};
    let sessionRaw = null;
    if (Array.isArray(trainingNode.sessions) && trainingNode.sessions.length > 0) {
      sessionRaw = trainingNode.sessions[0];
    } else if (Array.isArray(trainingNode.weeks) && trainingNode.weeks.length > 0 && Array.isArray(trainingNode.weeks[0].sessions) && trainingNode.weeks[0].sessions.length > 0) {
      sessionRaw = trainingNode.weeks[0].sessions[0];
    }
    
    let training_session = sessionRaw ? JSON.parse(JSON.stringify(sessionRaw)) : null;
    if (training_session && progression?.deload?.status === "ACTIVE") {
       training_session = applyDeloadToSession(training_session);
    }

    const client_view = {
      target_macros,
      meals,
      cardio,
      training_session,
      // نص الجاهزية يأتي من المحرك حتى لا يُكتب مرة ثانية داخل التطبيق
      readiness_guidance_ar: READINESS_GUIDANCE_AR,
    };

    return res.status(200).json({
      has_program: isApproved,
      is_pending_review: !isApproved,
      plan_approval_status: user.plan_approval_status || (isApproved ? "APPROVED" : "PENDING_COACH_REVIEW"),
      program_id: program.id,
      version: program.version || 1,
      updated_at: program.updatedAt || program.updated_at,
      user: program.user || user,
      master_program: program.program_data,
      lifestyle: { bedtime_hour: await resolveClientBedtimeHour(user.id) },
      clinical_constraints: await resolveClientClinicalConstraints(user.id),
      progression: await loadProgressionState(user.id),
      training_cycle: resolveTrainingCycleStatus(program),
      pending_draft_id: pendingDraft ? pendingDraft.id : null,
      fasting_context: await resolveClientFastingContext(user, program.program_data),
      heat_advisory: getGulfHeatAdvisory({ country_code: resolveCountryFromPhone(user.phone_number) }),
      client_view
    });
  } catch (err) {
    console.error("getActiveProgramByUserId error:", err);
    return res.status(500).json({ error: "Failed to fetch active program", details: err.message });
  }
};

export const updateCustomProgram = async (req, res) => {
  try {
    const { user_id, client_code, program_data, coach_notes, is_published, publish } = req.body;
    const lookup = user_id || client_code;

    if (!lookup) {
      return res.status(400).json({ error: "user_id or client_code is required" });
    }

    let user = await User.findOne({ where: { client_code: lookup } });
    if (!user && !isNaN(lookup)) {
      user = await User.findByPk(parseInt(lookup, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: lookup } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const shouldPublish = Boolean(is_published || publish);

    // A case outside the service (pregnancy, kidney disease, a diagnosed heart condition...) is not
    // published from the editor either, with or without a medical confirmation.
    if (shouldPublish) {
      const scope = assessServiceScope(await loadLatestIntakeAnswers(user.id).catch(() => null));
      if (!scope.supported) {
        return res.status(422).json(outsideScopeResponse(scope));
      }
    }

    // Medical review gate: a plan for a client flagged for medical review is only published after the
    // coach explicitly confirms the review (medical_review_confirmed: true in the request).
    let medicalReviewConfirmation = null;
    if (shouldPublish) {
      const medicalReview = await resolveIntakeMedicalReview(user.id);
      if (medicalReview.required && req.body.medical_review_confirmed !== true) {
        return res.status(409).json({
          code: MEDICAL_REVIEW_CONFIRMATION_REQUIRED,
          error: "هذا المتدرب يحتاج مراجعة طبية قبل اعتماد الخطة (أمراض كلى أو كبد أو أعراض خطرة أو إصابة بعلامة تحذير). راجع الحالة مع الطبيب المعالج ثم أكد المراجعة لنشر الخطة.",
          reasons: medicalReview.reasons,
        });
      }
      if (medicalReview.required) {
        medicalReviewConfirmation = {
          confirmed: true,
          confirmed_by_user_id: req.user?.id ?? null,
          confirmed_at: new Date().toISOString(),
          reasons: medicalReview.reasons,
        };
      }
    }
    if (medicalReviewConfirmation && program_data && typeof program_data === "object") {
      program_data.medical_review_confirmation = medicalReviewConfirmation;
    }

    // Clinical Guard: Comprehensive Tier CS-0 Check during Coach Manual Updates (Kidney, Hypertension, Asthma, Diabetes)
    const clinicalWarnings = [];
    const userConditions = [
      ...(Array.isArray(user.medical_conditions) ? user.medical_conditions : []),
      ...(Array.isArray(program_data?.client?.injuries) ? program_data.client.injuries : []),
      ...(Array.isArray(program_data?.client?.allergies) ? program_data.client.allergies : []),
      ...(Array.isArray(program_data?.client?.medical_conditions) ? program_data.client.medical_conditions : []),
    ];

    // 1. A protein cap the bloodwork asked for: the coach may still type past it, and that is
    // written into the clinical review log. A declared kidney diagnosis is outside the service
    // and never reaches here (src/api/services/serviceScope.js).
    const cappedProtein = Number(program_data?.clinical_guardrails?.max_protein_g) ||
      Number(program_data?.nutrition?.targets?.clinical_guardrails?.max_protein_g) || 0;
    const hasProteinCap = cappedProtein > 0 && Boolean(
      program_data?.clinical_guardrails?.kidney_protein_capped ||
      program_data?.nutrition?.targets?.clinical_guardrails?.kidney_protein_capped ||
      program_data?.nutrition?.clinical_guardrails?.kidney_protein_capped
    );

    if (hasProteinCap && program_data) {
      const maxAllowedProtein = cappedProtein;

      const targetProtein = Number(program_data?.nutrition?.targets?.protein || program_data?.nutrition?.targets?.protein_g || 0);
      const mealsProtein = (program_data?.nutrition?.meals || []).reduce((sum, m) => sum + (Number(m.macros?.protein) || 0), 0);
      const suppsProtein = (program_data?.cardio?.supplements || []).reduce((sum, s) => sum + (Number(s.protein ?? s.p) || 0), 0);
      const effectiveProtein = Math.max(targetProtein, mealsProtein + suppsProtein);

      if (effectiveProtein > maxAllowedProtein) {
        clinicalWarnings.push(`تنبيه سريري (وظائف الكلى في التحاليل): تم رصد تجاوز يدوي لسقف البروتين (البروتين المسجل: ${effectiveProtein} جم، السقف المحسوب من التحاليل: ${maxAllowedProtein} جم).`);
        if (typeof program_data === "object" && program_data !== null) {
          program_data.clinical_guardrails = {
            ...(program_data.clinical_guardrails || {}),
            kidney_protein_capped: true,
            max_protein_g: maxAllowedProtein,
            coach_override_protein_g: effectiveProtein,
          };
        }
      }
    }

    // 2. Hypertension & Heart Failure Prevention Check (ACSM/AHA)
    const hasHypertension = Boolean(
      program_data?.clinical_guardrails?.hypertension_guard_active ||
      userConditions.some(c => {
        const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
        return /hypertension|ضغط|ارتفاع.*الضغط/i.test(s);
      })
    );

    if (hasHypertension && program_data?.training) {
      const allExercises = [];
      if (Array.isArray(program_data.training.weeks)) {
        program_data.training.weeks.forEach(w => {
          (w.sessions || []).forEach(s => {
            (s.exercises || []).forEach(e => allExercises.push(e));
          });
        });
      }
      if (Array.isArray(program_data.training.sessions)) {
        program_data.training.sessions.forEach(s => {
          (s.exercises || []).forEach(e => allExercises.push(e));
        });
      }

      const bannedList = CLINICAL_GUIDELINES?.HYPERTENSION?.CONTRAINDICATED_EXERCISES || [
        "LEG_PRESS_MACHINE", "INCLINE_LEG_PRESS", "DECLINE_CRUNCH", "DECLINE_BENCH_PRESS", "INVERTED_BODYWEIGHT_ROW"
      ];

      const foundBanned = allExercises.filter(e => {
        const code = String(e.code || e.exercise_code || '');
        return bannedList.includes(code);
      });

      const foundLowRir = allExercises.filter(e => {
        const rir = e.rir ?? e.prescription?.target_rir;
        return rir !== undefined && rir !== null && Number(rir) < (CLINICAL_GUIDELINES?.HYPERTENSION?.MIN_RIR || 2);
      });

      if (foundBanned.length > 0 || foundLowRir.length > 0) {
        const details = [];
        if (foundBanned.length > 0) {
          const names = foundBanned.map(e => e.name_ar || e.name || e.code).slice(0, 3).join('، ');
          details.push(`تمارين محظورة ترفع الضغط الشرياني ومناورة فالسافا: (${names})`);
        }
        if (foundLowRir.length > 0) {
          details.push(`شدة تدريبية قصوى دون الحد الآمن (RIR < 2)`);
        }
        clinicalWarnings.push(`تنبيه سريري (ضغط الدم): تم رصد مخالفة لمعايير ACSM/AHA لمرضى الضغط: ${details.join(' مع ')}.`);
        if (typeof program_data === "object" && program_data !== null) {
          program_data.clinical_guardrails = {
            ...(program_data.clinical_guardrails || {}),
            hypertension_guard_active: true,
            coach_override_hypertension: true,
          };
        }
      }
    }

    // 3. Asthma & Respiratory Conditions Check (GINA Protocol)
    const hasAsthma = Boolean(
      userConditions.some(c => {
        const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
        return /asthma|ربو|تنفسي|respiratory/i.test(s);
      })
    );

    if (hasAsthma && program_data?.cardio) {
      const modality = String(program_data.cardio.modality || '');
      const zone = String(program_data.cardio.target_heart_rate_zone || '');
      const isHiit = /hiit|sprint|كثافة عالية/i.test(modality) || /hiit|zone 4/i.test(zone);

      if (isHiit) {
        clinicalWarnings.push(`تنبيه سريري (الربو): تم رصد كارديو عالي الشدة (HIIT / Zone 4) لمتدرب مصاب بالربو، مما يرفع خطر نوبات تضيق القصبات الهوائية الناجم عن الجهد (EIB) الممنوعة ببروتوكول GINA.`);
        if (typeof program_data === "object" && program_data !== null) {
          program_data.clinical_guardrails = {
            ...(program_data.clinical_guardrails || {}),
            coach_override_asthma: true,
          };
        }
      }
    }

    // 4. Training-Nutrition Dynamic Coupling, Deficit Volume Shield & Volume Landmarks Audit
    if (typeof program_data === "object" && program_data !== null && program_data.training) {
      const activeSessions = (program_data.training.sessions && program_data.training.sessions.length > 0)
        ? program_data.training.sessions
        : (Array.isArray(program_data.training.weeks) && program_data.training.weeks.length > 0)
          ? (program_data.training.weeks[0]?.sessions || [])
          : [];

      if (activeSessions.length > 0) {
        const volumeAudit = auditWeeklyMuscleVolume(activeSessions);
        const sessionDemand = calculateSessionDemand(activeSessions[0]?.exercises || []);

        const targetCalories = Number(program_data.nutrition?.targets?.calories || program_data.nutrition?.energy_target || 2000);
        const clientTdee = Number(user.tdee || program_data.client?.tdee || targetCalories);
        const clientWeight = Number(user.weight || user.weight_kg || program_data.client?.weight_kg || 80);
        const currentProtein = Number(program_data.nutrition?.targets?.protein || 150);

        const deficitShield = auditDeficitVolumeShield({
          sessions: activeSessions,
          targetCalories,
          tdee: clientTdee
        });

        const proteinSparing = evaluateProteinSparingRequirement({
          targetCalories,
          tdee: clientTdee,
          clientWeightKg: clientWeight,
          currentProteinG: currentProtein,
        });

        program_data._training_coupling = {
          session_demand: sessionDemand,
          volume_audit: volumeAudit,
          deficit_volume_shield: deficitShield,
          protein_sparing: proteinSparing,
          last_synced_at: new Date().toISOString()
        };

        if (volumeAudit.has_mrv_exceeded) {
          const mrvWarnings = volumeAudit.warnings.filter(w => w.includes('يتجاوز الحد الأقصى'));
          if (mrvWarnings.length > 0) {
            clinicalWarnings.push(`تنبيه حجم تدريبي: ${mrvWarnings.join(' و ')}`);
          }
        }

        if (deficitShield.requires_volume_consolidation && deficitShield.warnings.length > 0) {
          clinicalWarnings.push(deficitShield.warnings[0]);
        }

        if (proteinSparing.is_deficient) {
          clinicalWarnings.push(proteinSparing.message_ar);
        }
      }
    }

    let clinicalWarning = null;
    if (clinicalWarnings.length > 0) {
      clinicalWarning = clinicalWarnings.join(' — ');
      if (typeof program_data === "object" && program_data !== null) {
        program_data.clinical_guardrails = {
          ...(program_data.clinical_guardrails || {}),
          coach_override_warning: clinicalWarning,
          coach_override_warnings: clinicalWarnings,
          coach_override_at: new Date().toISOString(),
        };
      }
    }

    let program = await Program.findOne({
      where: { user_id: user.id },
      order: [["id", "DESC"]]
    });

    if (!program) {
      program = await Program.create({
        user_id: user.id,
        program_data: shouldPublish ? startCycleOnPublish(program_data || {}) : (program_data || {}),
        status: shouldPublish ? "ACTIVE" : "DRAFT"
      });
    } else {
      if (program_data) {
        // The coach's fasting toggle lives in program_data but is not part of the editor's plan object.
        const previousOverride = program.program_data?.fasting_override;
        if (previousOverride && typeof program_data === "object" && program_data.fasting_override === undefined) {
          program_data.fasting_override = previousOverride;
        }
        program.program_data = program_data;
      }
      if (shouldPublish) {
        // A draft going live starts its cycle today; re-publishing a live plan keeps its dates.
        if (program.status !== "ACTIVE") {
          program.program_data = startCycleOnPublish(program.program_data);
          program.changed("program_data", true);
        }
        program.status = "ACTIVE";
        program.version = (Number(program.version) || 1) + 1;
      }
      await program.save();
    }

    if (coach_notes !== undefined) {
      if (typeof program.program_data === "object" && program.program_data !== null) {
        program.program_data.coach_notes = coach_notes;
        if (typeof program.changed === "function") {
          program.changed("program_data", true);
        }
        await program.save();
      }
    }

    if (shouldPublish) {
      user.plan_approval_status = "APPROVED";
      await user.save();

      await IntakeSubmission.update(
        { status: "APPROVED", coach_notes: coach_notes || "تم اعتماد الخطة ونشرها" },
        { where: { user_id: user.id, status: ["PENDING_COACH_REVIEW", "DRAFT_GENERATED", "IN_PROGRESS"] } }
      );
    }

    return res.status(200).json({
      message: shouldPublish 
        ? "تم اعتماد ونشر خطة المتدرب بنجاح وتفعيلها في التطبيق"
        : "تم تحديث وحفظ مسودة خطة المتدرب بنجاح في MariaDB",
      user,
      program_id: program.id,
      master_program: program.program_data,
      clinical_warning: clinicalWarning
    });
  } catch (err) {
    console.error("updateCustomProgram error:", err);
    return res.status(500).json({ error: "فشل تحديث الخطة", details: err.message });
  }
};

export const getExercisesCatalog = async (req, res) => {
  try {
    const exercises = Object.entries(MASTER_EXERCISE_DICTIONARY).map(([code, info]) => ({
      code,
      name_en: info.name_en || info.en || code,
      name_ar: info.name_ar || info.ar || code,
      muscle: info.muscle || "GENERAL"
    }));
    return res.status(200).json({ exercises });
  } catch (err) {
    console.error("getExercisesCatalog error:", err);
    return res.status(500).json({ error: "فشل تحميل كتالوج التمارين" });
  }
};
