import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { adaptIntakePayloadToCanonicalEngine } from "../../intake-decision-engine/adapters/intake-adapter.js";
import { buildMasterEngineV2 } from "../../../src/master-engine-v2/index.js";
import { User, Program, IntakeSubmission } from "../models/index.js";
import { encryptMedicalData, decryptMedicalData } from "../../utils/crypto.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let nutritionFoodCatalog = null;
const loadFoodCatalog = async () => {
  if (!nutritionFoodCatalog) {
    const catalogPath = path.join(__dirname, "..", "..", "..", "data", "catalogs", "core-global-food-batch-v1.json");
    const data = await fs.readFile(catalogPath, "utf-8");
    nutritionFoodCatalog = JSON.parse(data);
  }
  return nutritionFoodCatalog;
};

// Helper: Format and decrypt intake submission answers safely
function formatSubmissionWithDecryptedAnswers(submissionInstance) {
  if (!submissionInstance) return null;
  const sub = submissionInstance.toJSON ? submissionInstance.toJSON() : { ...submissionInstance };
  if (sub.answers && sub.answers._isEncrypted && sub.answers.data) {
    try {
      sub.answers = decryptMedicalData(sub.answers.data);
    } catch (e) {
      console.warn("Failed to decrypt submission answers:", e.message);
    }
  }
  return sub;
}

// Helper: Build Explainable AI Safety & Rationale Audit
function generateAiRationaleAudit(intakePayload, masterProgram) {
  const personal = intakePayload.personal || intakePayload.client || {};
  const training = intakePayload.training || {};
  const medical = intakePayload.medical || {};
  const nutrition = intakePayload.nutrition || {};
  const body = intakePayload.body || {};
  const goals = intakePayload.goals || {};
  const cardio = intakePayload.cardio || {};

  const injuryExclusions = [];
  if (medical.conditions && medical.conditions.length > 0) {
    medical.conditions.forEach(c => {
      injuryExclusions.push(`تم تكييف التمارين لتناسب حالة (${c.conditionCode}) واستبعاد الحركات المجهدة للعمود الفقري والمفاصل المتأثرة.`);
    });
  } else {
    injuryExclusions.push("لم يتم تسجيل إصابات أو موانع حركية حرجة؛ البرنامج يعتمد على التمارين الحرة والمركبة بكامل المدى الحركي.");
  }

  const foodExclusions = [];
  const EXCLUSION_LABELS_AR = {
    EGGS: 'البيض ومنتجاته',
    EGG: 'البيض ومنتجاته',
    DAIRY: 'الألبان والأجبان',
    MILK: 'الألبان والأجبان',
    FISH_SEAFOOD: 'الأسماك والمأكولات البحرية والتونة',
    FISH: 'الأسماك والمأكولات البحرية',
    OATS: 'الشوفان',
    OAT: 'الشوفان',
    RED_MEAT: 'اللحوم الحمراء',
    MEAT: 'اللحوم الحمراء',
    PEANUTS_NUTS: 'المكسرات والفول السوداني',
    GLUTEN_WHEAT: 'القمح والجلوتين',
    WHEAT_GLUTEN: 'القمح والجلوتين',
    LEGUMES: 'البقوليات',
    EGGPLANT_VEG: 'الباذنجان والخضار المطبوخ',
    EGGPLANT: 'الباذنجان'
  };

  const excludedItemsList = Array.isArray(nutrition.excludedFoodsList) ? nutrition.excludedFoodsList.filter(f => f !== 'NONE') : [];
  if (excludedItemsList.length > 0) {
    const labels = excludedItemsList.map(code => EXCLUSION_LABELS_AR[code] || code).join("، ");
    foodExclusions.push(`تم استبعاد مسببات الحساسية والممنوعات بالكامل: (${labels}) واستبدالها ببدائل صحية آمنة 100%.`);
  } else if (nutrition.allergies && nutrition.allergies.length > 0) {
    const allergens = nutrition.allergies.map(a => EXCLUSION_LABELS_AR[a.substance] || a.substance).join("، ");
    foodExclusions.push(`تم استبعاد مسببات الحساسية بالكامل: (${allergens}) واستبدالها بمصادر بروتين وكارب آمنة 100%.`);
  }
  if (nutrition.dislikedFoods && nutrition.dislikedFoods.length > 0 && excludedItemsList.length === 0) {
    const disliked = nutrition.dislikedFoods.map(d => d.foodName || d.foodCode || d).join("، ");
    foodExclusions.push(`تم حذف الأطعمة غير المفضلة (${disliked}) من قائمة الوجبات وخيارات التبديل.`);
  }
  if (foodExclusions.length === 0) {
    foodExclusions.push("النظام الغذائي مرن وشامل لجميع مجموعات الطعام الصحية مع خيارات تبديل ذكية متنوعة.");
  }

  const cardioBpm = "120 - 135 bpm";
  const cardioStrategy = `تم تحديد ${cardio.maxSessionsPerWeek || 3} جلسات كارديو أسبوعياً بنطاق نبضات حرق الدهون Zone 2 (${cardioBpm}) بالإضافة إلى مستهدف ${cardio.averageDailySteps || 10000} خطوة يومياً لتحفيز نزول الدهون دون التأثير على الاستشفاء العضلي.`;

  const weight = Number(body.weightKg) || 75;
  const height = Number(body.heightCm) || 175;
  const age = Number(personal.age) || (personal.dateOfBirth ? (new Date().getFullYear() - new Date(personal.dateOfBirth).getFullYear()) : 28);
  const isMale = personal.sex !== 'FEMALE';
  const bodyFat = Number(body.bodyFat) || null;

  // Unify with masterProgram deterministic nutrition targets if available
  const targets = masterProgram?.nutrition_program?.targets || {};
  const macroTargets = masterProgram?.nutrition_program?.macro_targets || {};

  // 1. Calculate / Extract BMR
  let bmr = targets.bmr;
  if (!bmr) {
    if (bodyFat && bodyFat > 0 && bodyFat < 50) {
      const lbm = weight * (1 - bodyFat / 100);
      bmr = Math.round(370 + (21.6 * lbm));
    } else {
      bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161));
    }
  }

  // 2. Activity multiplier & TDEE
  let tdee = targets.tdee;
  if (!tdee) {
    const steps = Number(cardio.averageDailySteps) || 6000;
    const trainDays = Number(training.preferredDaysPerWeek) || 3;
    let activityMultiplier = 1.35;
    if (steps >= 10000) activityMultiplier += 0.15;
    else if (steps >= 7000) activityMultiplier += 0.10;
    if (trainDays >= 4) activityMultiplier += 0.10;
    else if (trainDays >= 3) activityMultiplier += 0.05;
    tdee = Math.round(bmr * (targets.activity_factor || activityMultiplier));
  }

  // 3. Calorie Deficit / Surplus and Target Macros
  const targetCalories = targets.target_calories || macroTargets.calories_kcal || tdee;
  const proteinG = targets.protein_g || macroTargets.protein_g || Math.round(weight * 2.0);
  const fatG = targets.fat_g || macroTargets.fat_g || Math.round((targetCalories * 0.22) / 9);
  const carbG = targets.carbohydrate_g || targets.carb_g || macroTargets.carbohydrate_g || Math.max(0, Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4));
  const proteinPerKg = targets.protein_per_kg || (weight > 0 ? (proteinG / weight).toFixed(1) : 2.0);

  const mealCount = targets.meals_count || Number(nutrition.preferredMealCount) || 3;
  const mealProtein = Math.round(proteinG / mealCount);
  const mealFat = Math.round(fatG / mealCount);
  const mealCarb = Math.round(carbG / mealCount);

  const goalDesc = targets.calorie_adjustment_desc || (goals.primary === 'FAT_LOSS' ? 'عجز 20% للتنشيف' : goals.primary === 'MUSCLE_GAIN' ? 'فائض 10% للبناء العضلي' : 'سعرات صيانة وتثبيت');

  const macroRationale = `سعرات الصيانة (TDEE): ~${tdee} kcal. تم تطبيق ${goalDesc} لتصبح السعرات المستهدفة (${targetCalories} kcal) مقسمة بدقة: بروتين (${proteinG} جم بمعدل ${proteinPerKg} جم/كجم) + دهون صحية (${fatG} جم) + كاربوهيدرات (${carbG} جم). متوسط كل وجبة من الوجبات الـ (${mealCount}): ~${mealProtein} جم بروتين، ~${mealCarb} جم كارب، ~${mealFat} جم دهون مع توزيع الوجبات بما يخدم الشبع والأداء الرياضي.`;

  return {
    injury_exclusions: injuryExclusions,
    food_exclusions: foodExclusions,
    cardio_strategy: cardioStrategy,
    macro_rationale: macroRationale,
    target_calories_calculated: targetCalories,
    tdee_calculated: tdee,
    bmr_calculated: bmr,
    protein_g_calculated: proteinG,
    fat_g_calculated: fatG,
    carb_g_calculated: carbG,
    projected_weekly_change: goals.primary === 'FAT_LOSS' ? '-0.5 إلى -0.8 كجم/أسبوع' : '+0.25 إلى +0.4 كجم/أسبوع'
  };
}

// 0. Fetch existing intake draft or submitted status for client
export const getClientIntakeDraft = async (req, res) => {
  try {
    const rawCode = req.query.code || req.query.client_code || "";
    const rawPhone = req.query.phone || req.query.phone_number || "";
    const clientCode = String(rawCode).trim().replace(/^#+/, '').replace(/^client[-_]?/i, '');
    const cleanPhoneDigits = String(rawPhone).replace(/\D/g, '');

    // إحباط التخمين والتعداد: يلزم تمرير الكود ورقم الهاتف معاً
    if (!clientCode || !cleanPhoneDigits) {
      return res.status(200).json({ user: null, submission: null });
    }

    let user = await User.findOne({ where: { client_code: clientCode, role: 'CLIENT' } }) ||
               await User.findOne({ where: { id: isNaN(parseInt(clientCode, 10)) ? 0 : parseInt(clientCode, 10), role: 'CLIENT' } });

    if (!user) {
      return res.status(200).json({ user: null, submission: null });
    }

    const userPhoneDigits = String(user.phone_number || '').replace(/\D/g, '');
    const isPhoneMatch = (
      user.phone_number === String(rawPhone).trim() ||
      userPhoneDigits === cleanPhoneDigits ||
      (cleanPhoneDigits.length >= 8 && userPhoneDigits.endsWith(cleanPhoneDigits.slice(-8))) ||
      (userPhoneDigits.length >= 8 && cleanPhoneDigits.endsWith(userPhoneDigits.slice(-8)))
    );

    if (!isPhoneMatch) {
      return res.status(200).json({ user: null, submission: null });
    }

    const submission = await IntakeSubmission.findOne({
      where: { user_id: user.id },
      order: [["id", "DESC"]]
    });

    const isSubmitted = submission && ["PENDING_COACH_REVIEW", "DRAFT_GENERATED", "APPROVED"].includes(submission.status);
    const isApproved = submission && submission.status === "APPROVED";

    return res.status(200).json({
      user: {
        id: user.id,
        full_name: user.full_name,
        client_code: user.client_code,
        phone_number: user.phone_number,
        payment_status: user.payment_status
      },
      submission: submission ? formatSubmissionWithDecryptedAnswers(submission) : null,
      isSubmitted,
      isApproved
    });
  } catch (err) {
    console.error("getClientIntakeDraft error:", err);
    return res.status(500).json({ error: "فشل استرجاع بيانات الاستمارة", details: err.message });
  }
};

// 1. Client saves in-progress draft (Auto-save)
export const saveDraftIntake = async (req, res) => {
  try {
    const { client_code, code, phone_number, phone, full_name, progress_percent = 50, ...intakePayload } = req.body;
    const rawCode = client_code || code || "";
    const cleanClientCode = String(rawCode).replace(/^#+/, '').trim();
    const rawPhone = phone_number || phone || intakePayload.personal?.phone || "";
    const cleanPhone = rawPhone.trim() && rawPhone !== "01000000000" ? rawPhone.trim() : null;
    const name = full_name || `${intakePayload.personal?.firstName || ""} ${intakePayload.personal?.lastName || ""}`.trim() || "متدرب جديد (قيد التعبئة)";

    let user = null;
    if (cleanClientCode) {
      user = await User.findOne({ where: { client_code: cleanClientCode, role: 'CLIENT' } });
    }
    if (!user && cleanPhone) {
      user = await User.findOne({ where: { phone_number: cleanPhone, role: 'CLIENT' } });
    }

    if (!user) {
      // Find highest numerical code among CLIENTS (base offset 1000)
      const allClients = await User.findAll({ where: { role: 'CLIENT' }, attributes: ['client_code'] });
      let maxCode = 1000;
      for (const c of allClients) {
        const num = parseInt(c.client_code, 10);
        if (!isNaN(num) && num > maxCode) maxCode = num;
      }
      const nextCode = (maxCode + 1).toString();

      user = await User.create({
        client_code: nextCode,
        phone_number: cleanPhone || `TEMP_${Date.now().toString().slice(-8)}`,
        full_name: name,
        role: 'CLIENT',
        payment_status: 'PENDING',
        plan_approval_status: 'PENDING_COACH_REVIEW'
      });
    }

    let submission = await IntakeSubmission.findOne({
      where: { user_id: user.id },
      order: [["id", "DESC"]]
    });

    if (submission && ["PENDING_COACH_REVIEW", "DRAFT_GENERATED", "APPROVED"].includes(submission.status)) {
      // If already submitted or approved, do NOT overwrite answers via background auto-save
      return res.status(200).json({
        message: "الاستمارة معتمدة بالفعل ومحفوظة",
        client_code: user.client_code,
        submission_id: submission.id,
        isLocked: true,
        status: submission.status,
        progress_percent: 100
      });
    }

    if (!submission) {
      submission = await IntakeSubmission.create({
        user_id: user.id,
        answers: { _isEncrypted: true, data: encryptMedicalData(intakePayload) },
        status: "IN_PROGRESS",
        progress_percent: Math.min(Math.max(Number(progress_percent) || 20, 10), 99)
      });
    } else {
      submission.answers = { _isEncrypted: true, data: encryptMedicalData(intakePayload) };
      submission.progress_percent = Math.min(Math.max(Number(progress_percent) || 20, 10), 99);
      await submission.save();
    }

    return res.status(200).json({
      message: "تم حفظ مسودة الاستمارة تلقائياً",
      client_code: user.client_code,
      submission_id: submission.id,
      progress_percent: submission.progress_percent
    });
  } catch (err) {
    console.error("saveDraftIntake error:", err);
    return res.status(500).json({ error: "فشل حفظ المسودة", details: err.message });
  }
};

// 2. Client completes and submits intake form publicly to coach review queue
export const submitPublicIntake = async (req, res) => {
  try {
    const { client_code, code, phone_number, phone, full_name, ...intakePayload } = req.body;
    const rawCode = client_code || code || "";
    const cleanClientCode = String(rawCode).replace(/^#+/, '').trim();
    const rawPhone = phone_number || phone || intakePayload.personal?.phone || "";
    const cleanPhone = rawPhone.trim() && rawPhone !== "01000000000" ? rawPhone.trim() : null;
    const name = full_name || `${intakePayload.personal?.firstName || ""} ${intakePayload.personal?.lastName || ""}`.trim() || "متدرب جديد";

    let user = null;
    if (cleanClientCode) {
      user = await User.findOne({ where: { client_code: cleanClientCode, role: 'CLIENT' } });
    }
    if (!user && cleanPhone) {
      user = await User.findOne({ where: { phone_number: cleanPhone, role: 'CLIENT' } });
    }

    if (!user) {
      // Find highest numerical code among CLIENTS (base offset 1000)
      const allClients = await User.findAll({ where: { role: 'CLIENT' }, attributes: ['client_code'] });
      let maxCode = 1000;
      for (const c of allClients) {
        const num = parseInt(c.client_code, 10);
        if (!isNaN(num) && num > maxCode) maxCode = num;
      }
      const nextCode = (maxCode + 1).toString();

      user = await User.create({
        client_code: nextCode,
        phone_number: cleanPhone || `TEMP_${Date.now().toString().slice(-8)}`,
        full_name: name,
        role: 'CLIENT',
        payment_status: 'PENDING',
        plan_approval_status: 'PENDING_COACH_REVIEW'
      });
    } else {
      user.full_name = name;
      if (cleanPhone && user.phone_number.startsWith('TEMP_')) {
        user.phone_number = cleanPhone;
      }
      user.plan_approval_status = 'PENDING_COACH_REVIEW';
      await user.save();
    }

    let submission = await IntakeSubmission.findOne({
      where: { user_id: user.id },
      order: [["id", "DESC"]]
    });

    if (!submission || submission.status === 'APPROVED') {
      submission = await IntakeSubmission.create({
        user_id: user.id,
        answers: { _isEncrypted: true, data: encryptMedicalData(intakePayload) },
        status: "PENDING_COACH_REVIEW",
        progress_percent: 100
      });
    } else {
      submission.answers = { _isEncrypted: true, data: encryptMedicalData(intakePayload) };
      submission.status = "PENDING_COACH_REVIEW";
      submission.progress_percent = 100;
      await submission.save();
    }

    return res.status(201).json({
      message: "تم استلام استمارتك بنجاح وإرسالها إلى كابتن كريم زكريا للمراجعة وتصميم الخطة المخصصة",
      client_code: user.client_code,
      user_id: user.id,
      submission_id: submission.id,
      user
    });
  } catch (err) {
    console.error("submitPublicIntake error:", err);
    return res.status(500).json({ error: "فشل إرسال الاستمارة", details: err.message });
  }
};

// 3. Coach fetches all incoming intake applications with progress tracking
export const getAllIntakeSubmissions = async (req, res) => {
  try {
    const submissions = await IntakeSubmission.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "client_code", "full_name", "phone_number", "subscription_package", "subscription_price", "payment_status", "payment_method", "plan_approval_status", "createdAt"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    const formattedSubmissions = submissions.map(formatSubmissionWithDecryptedAnswers);

    return res.status(200).json({ submissions: formattedSubmissions });
  } catch (err) {
    console.error("getAllIntakeSubmissions error:", err);
    return res.status(500).json({ error: "فشل استرجاع الاستمارات", details: err.message });
  }
};

// 4. Coach verifies payment details
export const verifyIntakePayment = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { subscription_package, subscription_price, payment_method, duration_months = 3 } = req.body;

    const submission = await IntakeSubmission.findByPk(submission_id, {
      include: [{ model: User, as: "user" }]
    });

    if (!submission) {
      return res.status(404).json({ error: "الاستمارة غير موجودة" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (Number(duration_months) || 3));

    const user = submission.user;
    if (user) {
      user.payment_status = "PAID";
      user.payment_method = payment_method || "INSTAPAY";
      user.subscription_package = subscription_package || "3_MONTHS_MAX";
      user.subscription_price = Number(subscription_price) || 2500;
      user.subscription_start_date = startDate;
      user.subscription_end_date = endDate;
      user.subscription_status = "ACTIVE";
      await user.save();
    }

    submission.status = "PAYMENT_CONFIRMED";
    await submission.save();

    return res.status(200).json({
      message: "تم تأكيد دفع العميل وتحديث باقة الاشتراك بنجاح",
      submission,
      user
    });
  } catch (err) {
    console.error("verifyIntakePayment error:", err);
    return res.status(500).json({ error: "فشل تأكيد الدفع", details: err.message });
  }
};

// 5. Coach triggers AI generation of program draft with Explainable AI Rationale
export const generateDraftFromIntake = async (req, res) => {
  try {
    const { submission_id } = req.params;

    const submission = await IntakeSubmission.findByPk(submission_id, {
      include: [{ model: User, as: "user" }]
    });

    if (!submission) {
      return res.status(404).json({ error: "الاستمارة غير موجودة" });
    }

    let intakePayload = submission.answers;
    if (intakePayload && intakePayload._isEncrypted) {
      intakePayload = decryptMedicalData(intakePayload.data);
    }
    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: new Date().toISOString().split("T")[0]
    });

    const canonicalIntake = adaptIntakePayloadToCanonicalEngine(intakePayload);
    const intakeDecision = evaluateIntake(canonicalIntake, evaluationContext);
    if (intakeDecision.plan_status === "BLOCK") {
      return res.status(400).json({
        error: "الاستمارة تحتاج مراجعة طبية خاصة لوجود موانع حرجة",
        reasons: intakeDecision.decision_reasons
      });
    }

    const catalog = await loadFoodCatalog();

    const rawProgram = buildMasterEngineV2({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog,
      options: {}
    });

    let rawCalories = rawProgram.nutrition_program?.macro_targets?.calories_kcal || 2000;
    let rawProtein = rawProgram.nutrition_program?.macro_targets?.protein_g || 150;
    let rawCarbs = rawProgram.nutrition_program?.macro_targets?.carbohydrate_g || 150;
    let rawFats = rawProgram.nutrition_program?.macro_targets?.fat_g || 50;

    // Failsafe Bounds
    rawCalories = Math.max(1200, Math.min(rawCalories, 5000));
    rawProtein = Math.max(50, Math.min(rawProtein, 300));
    rawFats = Math.max(30, Math.min(rawFats, 150));
    rawCarbs = Math.max(20, Math.min(rawCarbs, 600));

    const masterProgram = {
      ...rawProgram,
      ai_rationale: generateAiRationaleAudit(intakePayload, rawProgram),
      nutrition: {
        targets: {
          calories: rawCalories,
          protein: rawProtein,
          carbs: rawCarbs,
          fats: rawFats
        },
        meals: rawProgram.nutrition_program?.culinary_meals || []
      },
      training: {
        weeks: rawProgram.training_program?.weeks || [],
        sessions: rawProgram.training_program?.weeks?.[0]?.sessions || []
      }
    };

    // Save as DRAFT program
    const savedProgram = await Program.create({
      user_id: submission.user_id,
      program_data: masterProgram,
      status: "DRAFT",
      version: 1
    });

    submission.status = "DRAFT_GENERATED";
    submission.reviewed_at = new Date();
    await submission.save();

    if (submission.user) {
      submission.user.plan_approval_status = "DRAFT";
      await submission.user.save();
    }

    return res.status(200).json({
      message: "تم بناء مسودة الخطة الذكية بنجاح وجاهزة للتخصيص والمراجعة من الكابتن",
      program_id: savedProgram.id,
      submission_id: submission.id,
      user_id: submission.user?.client_code || submission.user_id,
      master_program: masterProgram
    });
  } catch (err) {
    console.error("generateDraftFromIntake error:", err);
    return res.status(500).json({ error: "فشل توليد مسودة الخطة", details: err.message });
  }
};

// 6. Coach approves and publishes the final program to the client's account
export const approveAndPublishIntake = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { coach_notes } = req.body;

    const submission = await IntakeSubmission.findByPk(submission_id, {
      include: [{ model: User, as: "user" }]
    });

    if (!submission) {
      return res.status(404).json({ error: "الاستمارة غير موجودة" });
    }

    let program = await Program.findOne({
      where: { user_id: submission.user_id },
      order: [["id", "DESC"]]
    });

    if (!program) {
      return res.status(404).json({ error: "لم يتم توليد مسودة خطة لهذا المتدرب بعد" });
    }

    program.status = "ACTIVE";
    if (coach_notes && typeof program.program_data === 'object' && program.program_data !== null) {
      program.program_data.coach_notes = coach_notes;
      program.changed('program_data', true);
    }
    await program.save();

    submission.status = "APPROVED";
    submission.coach_notes = coach_notes || "تم اعتماد وتفعيل الخطة من قبل الكابتن";
    await submission.save();

    if (submission.user) {
      submission.user.plan_approval_status = "APPROVED";
      await submission.user.save();
    }

    return res.status(200).json({
      message: "تم اعتماد ونشر الخطة لحساب المتدرب بنجاح وتفعيلها في الويب وتطبيق الموبايل",
      submission,
      program,
      user: submission.user
    });
  } catch (err) {
    console.error("approveAndPublishIntake error:", err);
    return res.status(500).json({ error: "فشل اعتماد الخطة", details: err.message });
  }
};

export const submitIntake = submitPublicIntake;
export const getIntakeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await IntakeSubmission.findByPk(id, {
      include: [{ model: User, as: "user" }]
    });
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    return res.status(200).json({ submission: formatSubmissionWithDecryptedAnswers(submission) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
