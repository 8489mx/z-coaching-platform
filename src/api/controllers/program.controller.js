import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adaptIntakePayloadToCanonicalEngine } from "../../intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngine } from "../../../src/master-engine/build-master-engine.js";
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
import { resolveFastingContext, FASTING_OVERRIDES } from "../../execution-engines/fasting-calendar-engine.js";
import { getGulfHeatAdvisory } from "../../execution-engines/cardio-zones-engine.js";
import { calculateSessionDemand, auditWeeklyMuscleVolume, auditDeficitVolumeShield, evaluateProteinSparingRequirement } from "../utils/trainingNutritionCoupling.js";

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

export const generateProgramFromSubmission = async (req, res) => {
  try {
    const { submission_id } = req.params;
    
    const submission = await IntakeSubmission.findByPk(submission_id);
    if (!submission) {
      return res.status(404).json({ error: "Intake submission not found" });
    }
    if (submission.status === "PROCESSED") {
      return res.status(400).json({ error: "Intake already processed" });
    }

    const intakePayload = submission.answers;
    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: new Date().toISOString().split("T")[0]
    });

    const intakeDecision = evaluateIntake(intakePayload, evaluationContext);
    if (intakeDecision.plan_status === "BLOCKED") {
      submission.status = "REJECTED";
      await submission.save();
      return res.status(400).json({ error: "Intake rejected", reasons: intakeDecision.decision_reasons });
    }

    const catalog = await loadFoodCatalog();
    const masterProgram = buildMasterEngine({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog
    });

    const savedProgram = await Program.create({
      user_id: submission.user_id,
      program_data: masterProgram,
    });

    submission.status = "PROCESSED";
    await submission.save();

    return res.status(201).json({
      message: "Program generated successfully from submission",
      program_id: savedProgram.id,
      master_program: masterProgram
    });
  } catch (err) {
    console.error("generateProgramFromSubmission error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const generateProgramForClient = async (req, res) => {
  try {
    const rawTarget = req.params.user_id || req.params.code || "";
    const rawCode = String(rawTarget).trim();
    const cleanCode = rawCode.replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();

    let user = await User.findOne({ where: { client_code: cleanCode } });
    if (!user && rawCode !== cleanCode) {
      user = await User.findOne({ where: { client_code: rawCode } });
    }
    if (!user && !isNaN(cleanCode) && cleanCode !== "") {
      user = await User.findByPk(parseInt(cleanCode, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: cleanCode } });
    }
    if (!user && rawCode !== cleanCode) {
      user = await User.findOne({ where: { phone_number: rawCode } });
    }

    if (!user) {
      return res.status(404).json({ error: "المتدرب غير موجود" });
    }

    let clientIntake = null;
    const latestSubmission = await IntakeSubmission.findOne({
      where: { user_id: user.id },
      order: [["id", "DESC"]]
    });

    if (latestSubmission && latestSubmission.answers) {
      clientIntake = latestSubmission.answers;
    } else {
      const { COMPLETE_INTAKE } = await import("../../../test/fixtures/complete-intake.js");
      clientIntake = {
        ...COMPLETE_INTAKE,
        personal: {
          ...COMPLETE_INTAKE.personal,
          firstName: user.full_name?.split(" ")[0] || `متدرب`,
          lastName: user.full_name?.split(" ")[1] || `${user.client_code}`
        }
      };
    }

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: new Date().toISOString().split("T")[0]
    });

    const catalog = await loadFoodCatalog();
    const masterProgram = buildMasterEngineV2({
      intake: clientIntake,
      evaluationContext,
      nutritionFoodCatalog: catalog,
      options: {}
    });

    const savedProgram = await Program.create({
      user_id: user.id,
      program_data: masterProgram,
    });

    return res.status(201).json({
      message: "تم توليد الخطة الذكية بنجاح",
      program_id: savedProgram.id,
      user: {
        id: user.id,
        client_code: user.client_code,
        full_name: user.full_name || `متدرب #${user.client_code}`,
        phone_number: user.phone_number,
        subscription_package: user.subscription_package,
        role: user.role
      },
      master_program: masterProgram
    });
  } catch (err) {
    console.error("generateProgramForClient error:", err);
    return res.status(500).json({ error: "فشل توليد الخطة", details: err.message });
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

function normalizeFoodCode(codeOrName) {
  if (!codeOrName) return "WHOLE_EGG";
  const str = String(codeOrName).trim();
  const upper = str.toUpperCase();

  if (FOOD_CODE_ALIASES[upper]) return FOOD_CODE_ALIASES[upper];

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

  return "WHOLE_EGG";
}

export const getSwapCandidatesHandler = async (req, res) => {
  try {
    const { food_code, name_ar, meal_context, source_grams } = req.body;
    const normalizedCode = normalizeFoodCode(food_code || name_ar);
    const grams = Number(source_grams) || 100;
    const mealCategory = meal_context === "BREAKFAST" ? "BREAKFAST" : "MAIN_MEAL";

    let candidates = listSmartSwapCandidates(normalizedCode, mealCategory);
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
            meal_category: cand.meal_categories?.[0] || mealCategory
          });
          targetGrams = swapCalc.target_food.portion_g;
          displayAr = swapCalc.target_food.serving_display_ar;
        } catch (e) {
          targetGrams = Math.round(grams * (currentItem.primary_nutrient_per_100g / cand.primary_nutrient_per_100g));
          displayAr = `${cand.name_ar} (${targetGrams} جرام)`;
        }
      }
      return {
        food_code: cand.food_code,
        name_ar: cand.name_ar,
        name_en: cand.name_en,
        macro_type: cand.macro_type,
        target_grams: targetGrams,
        display_ar: displayAr,
        serving_display_ar: displayAr
      };
    });

    return res.status(200).json({ candidates: enrichedCandidates });
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
    const fromGrams = Number(source_grams || current_portion_g) || 100;
    const category = meal_category || (meal_context === "BREAKFAST" ? "BREAKFAST" : "MAIN_MEAL");

    const result = calculateSmartSwap({
      current_food_code: fromCode,
      current_portion_g: fromGrams,
      target_food_code: toCode,
      meal_category: category,
    });

    const swappedFood = {
      food_code: result.target_food.food_code,
      name_ar: result.target_food.name_ar,
      name_en: result.target_food.name_en,
      grams: result.target_food.portion_g,
      portion_g_rounded: result.target_food.portion_g,
      serving_display_ar: result.target_food.serving_display_ar,
      serving_display_en: result.target_food.serving_display_en
    };

    return res.status(200).json({
      swap: result,
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
async function loadLatestIntakeAnswers(userId) {
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
    allergies,
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

    const program = await Program.findOne({
      where: { user_id: user.id },
      order: [["id", "DESC"]],
      include: [{ model: User, as: "user", attributes: ["id", "client_code", "full_name", "phone_number", "email", "role", "subscription_package", "plan_approval_status"] }],
    });

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
      fasting_context: await resolveClientFastingContext(user, program.program_data),
      heat_advisory: getGulfHeatAdvisory({ country_code: resolveCountryFromPhone(user.phone_number) }),
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

    // 1. Kidney Disease Protein Cap Check (KDOQI, CLINICAL_GUIDELINES.KIDNEY.MAX_PROTEIN_PER_KG)
    const hasKidneyCondition = Boolean(
      program_data?.clinical_guardrails?.kidney_protein_capped ||
      program_data?.nutrition?.targets?.clinical_guardrails?.kidney_protein_capped ||
      program_data?.nutrition?.clinical_guardrails?.kidney_protein_capped ||
      userConditions.some(c => {
        const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
        return /kidney|ckd|كلى|قصور.*كلوي|وظائف.*الكلى/i.test(s);
      })
    );

    if (hasKidneyCondition && program_data) {
      const weight = Number(user.weight || user.weight_kg || program_data?.client?.weight_kg || 80);
      const maxAllowedProtein = Number(program_data?.clinical_guardrails?.max_protein_g) ||
        Number(program_data?.nutrition?.targets?.clinical_guardrails?.max_protein_g) ||
        Math.round(weight * CLINICAL_GUIDELINES.KIDNEY.MAX_PROTEIN_PER_KG);

      const targetProtein = Number(program_data?.nutrition?.targets?.protein || program_data?.nutrition?.targets?.protein_g || 0);
      const mealsProtein = (program_data?.nutrition?.meals || []).reduce((sum, m) => sum + (Number(m.macros?.protein) || 0), 0);
      const suppsProtein = (program_data?.cardio?.supplements || []).reduce((sum, s) => sum + (Number(s.protein ?? s.p) || 0), 0);
      const effectiveProtein = Math.max(targetProtein, mealsProtein + suppsProtein);

      if (effectiveProtein > maxAllowedProtein) {
        clinicalWarnings.push(`تنبيه سريري (كلى): تم رصد تجاوز يدوي لسقف البروتين الآمن لمرضى القصور الكلوي (البروتين المسجل: ${effectiveProtein} جم، الحد الأقصى الآمن: ${maxAllowedProtein} جم بمعدل ${CLINICAL_GUIDELINES.KIDNEY.MAX_PROTEIN_PER_KG} جم/كجم بناءً على KDOQI).`);
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
          hasKidneyCondition,
          clinicalGuardrails: program_data.clinical_guardrails
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
        program_data: program_data || {},
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
