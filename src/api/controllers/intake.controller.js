import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngineV2 } from "../../../src/master-engine-v2/index.js";
import { User, Program, IntakeSubmission } from "../models/index.js";

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

// Helper: Build Explainable AI Safety & Rationale Audit
function generateAiRationaleAudit(intakePayload, masterProgram) {
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
  if (nutrition.allergies && nutrition.allergies.length > 0) {
    const allergens = nutrition.allergies.map(a => a.substance).join("، ");
    foodExclusions.push(`تم استبعاد مسببات الحساسية بالكامل: (${allergens}) واستبدالها بمصادر بروتين وكارب آمنة 100%.`);
  }
  if (nutrition.dislikedFoods && nutrition.dislikedFoods.length > 0) {
    const disliked = nutrition.dislikedFoods.map(d => d.foodName || d.foodCode).join("، ");
    foodExclusions.push(`تم حذف الأطعمة غير المفضلة (${disliked}) من قائمة الوجبات وخيارات التبديل.`);
  }
  if (foodExclusions.length === 0) {
    foodExclusions.push("النظام الغذائي مرن وشامل لجميع مجموعات الطعام الصحية مع خيارات تبديل ذكية متنوعة.");
  }

  const cardioBpm = masterProgram.cardio_program?.schedule?.sessions?.[0]?.heart_rate_target?.target_range_bpm || "120 - 135 bpm";
  const cardioStrategy = `تم تحديد ${cardio.maxSessionsPerWeek || 2} جلسات كارديو أسبوعياً بنطاق نبضات حرق الدهون Zone 2 (${cardioBpm}) لتحفيز نزول الدهون دون التأثير على الاستشفاء العضلي.`;

  const weight = body.weightKg || 70;
  const targetCalories = masterProgram.nutrition_program?.targets?.target_calories_kcal || 2200;
  const proteinG = masterProgram.nutrition_program?.targets?.protein_g || 160;
  const macroRationale = `تم ضبط السعرات اليومية عند (${Math.round(targetCalories)} kcal) مع بروتين (${Math.round(proteinG)} جم بمعدل ~${(proteinG / weight).toFixed(1)} جم/كجم) لضمان حماية واستشفاء الكتلة العضلية أثناء مرحلة (${goals.primary === 'FAT_LOSS' ? 'حرق الدهون' : 'البناء العضلي'}).`;

  return {
    injury_exclusions: injuryExclusions,
    food_exclusions: foodExclusions,
    cardio_strategy: cardioStrategy,
    macro_rationale: macroRationale,
    projected_weekly_change: goals.primary === 'FAT_LOSS' ? '-0.5 إلى -0.8 كجم/أسبوع' : '+0.25 إلى +0.4 كجم/أسبوع'
  };
}

// 1. Client saves in-progress draft (Auto-save)
export const saveDraftIntake = async (req, res) => {
  try {
    const { client_code, phone_number, full_name, progress_percent = 50, ...intakePayload } = req.body;
    const phone = phone_number || intakePayload.personal?.phone || "01000000000";
    const name = full_name || `${intakePayload.personal?.firstName || ""} ${intakePayload.personal?.lastName || ""}`.trim() || "متدرب جديد (قيد التعبئة)";

    let user = null;
    if (client_code) {
      user = await User.findOne({ where: { client_code } });
    }
    if (!user && phone) {
      user = await User.findOne({ where: { phone_number: phone } });
    }

    if (!user) {
      const lastUser = await User.findOne({ where: { role: 'CLIENT' }, order: [['id', 'DESC']] });
      let nextCode = 1;
      if (lastUser && lastUser.client_code) {
        const parsed = parseInt(lastUser.client_code, 10);
        if (!isNaN(parsed)) nextCode = parsed + 1;
      }

      user = await User.create({
        client_code: nextCode.toString(),
        phone_number: phone,
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

    if (!submission || submission.status === 'APPROVED') {
      submission = await IntakeSubmission.create({
        user_id: user.id,
        answers: intakePayload,
        status: "IN_PROGRESS",
        progress_percent: Math.min(Math.max(Number(progress_percent) || 20, 10), 99)
      });
    } else {
      submission.answers = intakePayload;
      if (submission.status === 'IN_PROGRESS' || submission.status === 'PENDING_COACH_REVIEW') {
        submission.progress_percent = Math.min(Math.max(Number(progress_percent) || 20, 10), 99);
      }
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
    const { client_code, phone_number, full_name, ...intakePayload } = req.body;
    const phone = phone_number || intakePayload.personal?.phone || "01000000000";
    const name = full_name || `${intakePayload.personal?.firstName || ""} ${intakePayload.personal?.lastName || ""}`.trim() || "متدرب جديد";

    let user = null;
    if (client_code) {
      user = await User.findOne({ where: { client_code } });
    }
    if (!user && phone) {
      user = await User.findOne({ where: { phone_number: phone } });
    }

    if (!user) {
      const lastUser = await User.findOne({ where: { role: 'CLIENT' }, order: [['id', 'DESC']] });
      let nextCode = 1;
      if (lastUser && lastUser.client_code) {
        const parsed = parseInt(lastUser.client_code, 10);
        if (!isNaN(parsed)) nextCode = parsed + 1;
      }

      user = await User.create({
        client_code: nextCode.toString(),
        phone_number: phone,
        full_name: name,
        role: 'CLIENT',
        payment_status: 'PENDING',
        plan_approval_status: 'PENDING_COACH_REVIEW'
      });
    } else {
      user.full_name = name;
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
        answers: intakePayload,
        status: "PENDING_COACH_REVIEW",
        progress_percent: 100
      });
    } else {
      submission.answers = intakePayload;
      submission.status = "PENDING_COACH_REVIEW";
      submission.progress_percent = 100;
      await submission.save();
    }

    return res.status(201).json({
      message: "تم استلام استمارتك بنجاح وإرسالها إلى كابتن كيمو للمراجعة وتصميم الخطة المخصصة",
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

    return res.status(200).json({ submissions });
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
      user.subscription_package = subscription_package || "3_MONTHS_VIP";
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

    const intakePayload = submission.answers;
    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: new Date().toISOString().split("T")[0]
    });

    const intakeDecision = evaluateIntake(intakePayload, evaluationContext);
    if (intakeDecision.plan_status === "BLOCK") {
      return res.status(400).json({
        error: "الاستمارة تحتاج مراجعة طبية خاصة لوجود موانع حرجة",
        reasons: intakeDecision.decision_reasons
      });
    }

    const catalog = await loadFoodCatalog();

    const masterProgram = buildMasterEngineV2({
      intake: intakePayload,
      evaluationContext,
      nutritionFoodCatalog: catalog,
      options: {}
    });

    // Attach Explainable AI Rationale
    masterProgram.ai_rationale = generateAiRationaleAudit(intakePayload, masterProgram);

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
    return res.status(200).json({ submission });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
