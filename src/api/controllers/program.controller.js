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
import { MASTER_EXERCISE_DICTIONARY } from "../../../src/exercise-catalog-v2/index.js";
import { calculateSmartSwap } from "../../../src/nutrition-swap-engine-v2/calculate-smart-swap.js";
import { listSmartSwapCandidates, getSmartFoodRegistryItem, SMART_SWAP_REGISTRY } from "../../../src/nutrition-swap-engine-v2/swap-pool-registry.js";

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

    if (intakeDecision.plan_status === "BLOCK") {
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
    if (intakeDecision.plan_status === "BLOCK") {
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
    if (intakeDecision.plan_status === "BLOCK") {
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
    if (intakeDecision.plan_status === "BLOCK") {
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
    const { user_id } = req.params;
    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
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
      photos = []
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
      daily_weights_kg: weights,
      previous_week_average_weight_kg: prevAvgWeight,
      waist_circumference_cm: Number(waist_circumference_cm) || null,
      nutrition_adherence_percent: Number(nutrition_adherence_percent) || 95,
      workouts_completed: Number(workouts_completed) || 4,
      workouts_scheduled: Number(workouts_scheduled) || 4,
      biofeedback: biofeedback || { hunger_level: 2, energy_in_gym: 4, sleep_quality: 4, stress_level: 2 },
      pain_reports: pain_reports || []
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
      analysis_status: analysis.status,
      analysis_output: analysis,
      status: "PENDING_REVIEW"
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

export const getActiveProgramByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Look up user by client_code first, then by id, then by phone_number
    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
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
        program.changed("program_data", true);
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
      master_program: program.program_data
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
