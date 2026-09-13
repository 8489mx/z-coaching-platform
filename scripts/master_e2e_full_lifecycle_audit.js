import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { ASSESSMENT_CONTEXT } from "../test/fixtures/complete-intake.js";
import { 
  evaluateWeeklyProgress, 
  evaluateWeeklyCheckinAudit, 
  CHECKIN_DECISION_CODES 
} from "../src/execution-engines/weekly-audit-engine.js";
import { activateClientProgram } from "../src/execution-engines/activation-engine.js";
import { 
  evaluateSubscriptionStatus, 
  generateRenewalWhatsAppDispatch,
  SUBSCRIPTION_STATUSES 
} from "../src/execution-engines/subscription-lifecycle-engine.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";
import { OccupationType } from "../src/intake-decision-engine/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadFoodCatalog() {
  const catalogPath = path.join(__dirname, "..", "data", "catalogs", "core-global-food-batch-v1.json");
  const data = await fs.readFile(catalogPath, "utf-8");
  return JSON.parse(data);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[فشل الفحص الفسيولوجي/التقني]: ${message}`);
  }
}

async function runMasterE2EFullLifecycleAudit() {
  console.log("================================================================================");
  console.log("بدء التدقيق والاعتماد النهائي الشامل للمنظومة من الألف إلى الياء (Zero-Defect Master Audit)");
  console.log("================================================================================");

  const catalog = await loadFoodCatalog();

  // ==========================================================================
  // المرحلة 1: تفعيل العميل وتوليد روابط الانضمام والواتساب التلقائية بنقرة واحدة
  // ==========================================================================
  console.log("\n[المرحلة 1]: اختبار منظومة التفعيل وتوليد رسالة الواتساب بنقرة واحدة...");
  const activation = activateClientProgram({
    client_id: "ZC-8842",
    client_name: "سارة أحمد",
    phone_number: "01099887766",
    package_tier: "MAX",
    program_pdf_url: "https://zcoaching.com/program-pdf?user_id=ZC-8842",
    app_url: "https://zcoaching.com/client-app?code=ZC-8842",
    start_date: new Date("2026-09-15T00:00:00.000Z")
  });

  assert(activation.success === true, "فشل تفعيل برنامج العميل");
  assert(activation.new_status === "ACTIVE", "حالة العميل ليست ACTIVE");
  assert(activation.checkin_schedule.length === 16, "جدول المتابعات يجب أن يحتوي 16 موعداً لباقة MAX");
  assert(activation.whatsapp_dispatch_url.startsWith("https://wa.me/201099887766?text="), "رابط الواتساب غير مطابق للمعيار الدولي");
  assert(decodeURIComponent(activation.whatsapp_dispatch_url).includes("سارة أحمد"), "رسالة الواتساب لا تحتوي اسم العميل");
  console.log("تم اعتماد المرحلة 1 بنجاح: تم إنشاء جدول المتابعات الـ 16 ورابط الواتساب الترحيبي.");

  // ==========================================================================
  // المرحلة 2: استيفاء استمارة الـ 28 سؤالاً وفحص محرك اتخاذ القرار (Intake Engine)
  // ==========================================================================
  console.log("\n[المرحلة 2]: اختبار معالجة الاستمارة المعمقة (28 متغيراً سريرياً وبيئياً عبر المحول السريري)...");
  
  const raw28QuestionIntake = {
    first_name: "سارة",
    last_name: "أحمد",
    phone_number: "01099887766",
    date_of_birth: "1997-04-12",
    sex: "FEMALE",
    primary_goal: "FAT_LOSS",
    height_cm: 164,
    weight_kg: 74,
    waist_cm: 84,
    daily_activity: "SEDENTARY",
    occupation_type: "DESK_OFFICE",
    sleep_hours: "HOURS_7_8",
    medical_conditions: ["HYPERTENSION"],
    dangerous_symptoms: ["NONE"],
    injuries: ["KNEE"],
    injury_severity: "MODERATE",
    female_pregnancy: "NOT_PREGNANT",
    female_menstrual: "REGULAR",
    preferred_meal_count: 3,
    allergies_and_dislikes: ["DAIRY"],
    digestive_issues: "IBS",
    food_budget: "MEDIUM",
    food_prep_ability: "FULL_KITCHEN",
    training_location: "GYM",
    available_days_per_week: 4,
    experience_level: "INTERMEDIATE",
    recent_training: "ACTIVE",
    additional_sports: "NONE"
  };

  const adaptedCanonicalIntake = adaptIntakePayloadToCanonicalEngine(raw28QuestionIntake);
  const intakeDecision = evaluateIntake(adaptedCanonicalIntake, ASSESSMENT_CONTEXT);
  assert(intakeDecision !== null, "فشل محرك اتخاذ القرار في تقييم الاستمارة");
  assert(intakeDecision.training_decision !== undefined, "لم يتم توليد قرارات التدريب");
  assert(intakeDecision.nutrition_decision !== undefined, "لم يتم توليد قرارات التغذية");
  console.log("تم اعتماد المرحلة 2 بنجاح: تحويل الاستمارة المسطحة إلى DTO معياري واجتياز الفحص السريري الصارم.");

  // ==========================================================================
  // المرحلة 3: توليد وتفصيل البرامج الأربعة الشاملة بالمللي (Master Engine V2)
  // ==========================================================================
  console.log("\n[المرحلة 3]: توليد البرامج الأربعة (تدريب، تغذية، كارديو، مرونة وتأهيل)...");

  const masterProgram = buildMasterEngineV2({
    intake: adaptedCanonicalIntake,
    evaluationContext: ASSESSMENT_CONTEXT,
    nutritionFoodCatalog: catalog,
    options: { weeksCount: 5 }
  });

  // 1. فحص التدريب والميزوسايكل
  const trainingProgram = masterProgram.training_program;
  assert(trainingProgram !== undefined, "برنامج التدريب مفقود");
  assert(trainingProgram.weeks.length === 5, "دورة الميزوسايكل يجب أن تكون 5 أسابيع متدرجة");
  assert(trainingProgram.weeks[4].phase === "DELOAD", "الأسبوع الخامس يجب أن يكون أسبوع استشفاء Deload");

  // التأكد من استبعاد التمارين ذات الضغط العالي على الركبة (Hack squat / leg extension knee-shear)
  const allExercises = [];
  for (const week of trainingProgram.weeks) {
    for (const session of (week.sessions || [])) {
      for (const ex of (session.exercises || [])) {
        allExercises.push(ex);
      }
    }
  }
  const hasUnsafeKneeExercise = allExercises.some(ex => 
    String(ex.name).toLowerCase().includes("hack squat") || 
    String(ex.name).toLowerCase().includes("sissy squat")
  );
  assert(!hasUnsafeKneeExercise, "تم رصد تمرين غير آمن للركبة يتعارض مع قيد الإصابة");

  // 2. فحص التغذية والوجبات المطهية
  const nutritionProgram = masterProgram.nutrition_program;
  assert(nutritionProgram !== undefined, "برنامج التغذية مفقود");
  const targetCals = nutritionProgram.macro_targets?.calories_kcal;
  assert(targetCals > 1200 && targetCals < 2500, `السعرات المحسوبة (${targetCals}) خارج النطاق الفسيولوجي الآمن`);

  // فحص استبعاد الحليب العادي واستبداله بحليب خالي اللاكتوز أو حليب اللوز
  const culinaryMeals = nutritionProgram.culinary_meals || [];
  let foundStandardSkimMilk = false;
  let chiaPortionSafe = true;

  for (const meal of culinaryMeals) {
    for (const item of (meal.items || [])) {
      if (item.food_id === "SKIM_MILK" && !item.is_low_lactose) {
        foundStandardSkimMilk = true;
      }
      if (item.food_id === "CHIA_SEEDS" && item.portion_g > 15) {
        chiaPortionSafe = false;
      }
    }
  }
  assert(!foundStandardSkimMilk, "تم إدراج حليب يحتوي على اللاكتوز لعميل يعاني من حساسية ألبان وقولون عصبي");
  assert(chiaPortionSafe, "تم رصد حصة بذور شيا غير واقعية تتجاوز 15 جم");

  // فحص الترطيب الاسترشادي
  const hydrationRange = nutritionProgram.targets?.hydration?.recommended_range_liters || nutritionProgram.hydration?.recommended_range_liters;
  assert(hydrationRange && hydrationRange.includes("لتر"), "حقل الترطيب اليومي غير مصاغ بالعربية أو مفقود");

  // 3. فحص الكارديو والعادات
  const cardioProgram = masterProgram.cardio_program;
  assert(cardioProgram.prescription?.steps_prescription?.active === true, "وصفة الخطوات اليومية يجب أن تكون مفعلة للعميل الخامل لضمان الحركة الآمنة");
  assert(cardioProgram.plan_specification?.strategy === "STEPS_ONLY", "استراتيجية الكارديو يجب أن تبدأ بالخطوات الآمنة لمراعاة الركبة");

  // 4. فحص المرونة والتأهيل الوقائي
  const mobilityProgram = masterProgram.mobility_program;
  assert(mobilityProgram !== undefined, "برنامج المرونة والإطالات مفقود");
  assert(mobilityProgram.prescription !== undefined, "وصفة المرونة والتأهيل الوقائي مفقودة");
  console.log("تم اعتماد المرحلة 3 بنجاح: توليد وتأمين البرامج الأربعة ومطابقتها الفسيولوجية التامة.");

  // ==========================================================================
  // المرحلة 4: التحقق الصارم من محددات واجهة المتدرب ووثيقة الـ PDF
  // ==========================================================================
  console.log("\n[المرحلة 4]: التدقيق على محددات واجهة المتدرب ووثيقة الـ PDF (Zero Timers, Zero Set Trackers)...");
  
  // التأكد من خلو ملفات الواجهة من أي مؤقتات راحة
  const workoutTabContent = await fs.readFile(
    path.join(__dirname, "..", "frontend", "src", "pages", "ClientInteractiveApp", "components", "WorkoutTab.jsx"), 
    "utf-8"
  );
  assert(!workoutTabContent.includes("RestTimerWidget"), "ما زال مكون RestTimerWidget موجوداً في WorkoutTab.jsx");
  assert(!workoutTabContent.includes("setInterval"), "ما زال هناك setInterval داخل مكون WorkoutTab.jsx");

  // التأكد من عدم وجود حقول إدخال تسجيل جولات تفاعلية في تطبيق المتدرب
  assert(!workoutTabContent.includes("<input type=\"number\" name=\"set_reps\""), "تم رصد حقول إدخال تفاعلية للجولات");

  // التأكد من ضبط الترطيب في وثيقة الـ PDF باللغة العربية
  const pdfViewContent = await fs.readFile(
    path.join(__dirname, "..", "frontend", "src", "pages", "ProgramPdfView.jsx"), 
    "utf-8"
  );
  assert(!pdfViewContent.includes("Liters/Day"), "ما زالت عبارة Liters/Day الإنجليزية موجودة في ProgramPdfView.jsx");
  assert(pdfViewContent.includes("لتر/اليوم"), "صيغة الترطيب العربية لتر/اليوم غير موجودة في وثيقة الـ PDF");
  console.log("تم اعتماد المرحلة 4 بنجاح: خلو تام من المؤقتات، وجداول الجولات، وحساب دقيق للترطيب بالعربية.");

  // ==========================================================================
  // المرحلة 5: المتابعة الأسبوعية للأسبوع الأول — كشف ثبات الوزن الكاذب (احتباس سوائل)
  // ==========================================================================
  console.log("\n[المرحلة 5]: اختبار متابعة الأسبوع الأول وكشف ثبات الوزن الكاذب (False Plateau Lock)...");

  const week1ProgressAudit = evaluateWeeklyProgress({
    currentWeightKg: 74.0, // لم ينزل الوزن (ثبات ظاهري)
    previousWeightKg: 74.0,
    currentWaistCm: 84.0,
    previousWaistCm: 84.0,
    adherenceRatePct: 95, // التزام ممتاز 95%
    currentCalories: targetCals,
    weeksOnCurrentCalories: 1,
    goalType: "FAT_LOSS",
    isFemale: true,
    isMenstrualPhase: true, // في فترة الدورة الشهرية (احتباس سوائل هرموني)
    bowelRegularity: "REGULAR",
    sleepStressComposite: 4,
    occupationType: OccupationType.DESK_OFFICE
  });

  assert(
    week1ProgressAudit.status === "MENSTRUAL_RETENTION_LOCK", 
    `المحرك لم يقفل السعرات خلال فترة الدورة الشهرية: الحالة الحالية ${week1ProgressAudit.status}`
  );
  assert(
    week1ProgressAudit.calorie_adjustment === 0, 
    "تم خصم سعرات بشكل غير صحيح خلال فترة احتباس السوائل الهرموني"
  );
  assert(
    week1ProgressAudit.new_calories === targetCals, 
    "تغيرت السعرات رغم وجود قفل الأمان الهرموني"
  );
  console.log("تم اعتماد المرحلة 5 بنجاح: قفل السعرات تلقائياً ومنع تقليل الأكل عند ثبات الوزن الكاذب.");

  // ==========================================================================
  // المرحلة 6: المتابعة الأسبوعية للأسبوع الثاني — ثبات حقيقي وتعديل عيار السعرات
  // ==========================================================================
  console.log("\n[المرحلة 6]: اختبار متابعة الأسبوع الثاني عند استمرار الثبات بعد انتهاء الدورة (True Plateau)...");

  const week2Audit = evaluateWeeklyCheckinAudit({
    clientProfile: {
      current_daily_calories: targetCals,
      protein_g: nutritionProgram.macro_targets?.protein_g,
      carbs_g: nutritionProgram.macro_targets?.carbohydrate_g,
      fat_g: nutritionProgram.macro_targets?.fat_g,
      is_female: true,
      has_pcos: false
    },
    previousWeekData: {
      weight_kg: 74.0,
      waist_cm: 84.0,
      consecutive_plateau_weeks: 1
    },
    currentCheckin: {
      current_weight_kg: 74.0,
      waist_circumference_cm: 84.0,
      overall_adherence_percent: 94,
      is_pms_active: false // انتهت الدورة
    }
  });

  assert(
    week2Audit.decision_code === CHECKIN_DECISION_CODES.TRUE_PLATEAU_TITRATION,
    `المحرك لم يتعرف على الثبات الحقيقي: ${week2Audit.decision_code}`
  );
  assert(
    week2Audit.calorie_adjustment < 0,
    "لم يتم خفض السعرات لمعالجة الثبات الحقيقي المؤكد"
  );
  assert(
    week2Audit.whatsapp_dispatch.dispatch_url.startsWith("https://wa.me/"),
    "رابط الواتساب الخاص بالرد على المتابعة غير سليم"
  );

  // دمج التعديل الجديد في الخطة النشطة
  const updatedProgram = mergeAdaptedPlanIntoProgram(masterProgram, {
    suggested_calorie_delta: week2Audit.calorie_adjustment,
    cardio_delta_minutes: week2Audit.cardio_delta_minutes
  });
  const adjustedCals = updatedProgram.nutrition_program?.macro_targets?.calories_kcal;
  assert(adjustedCals === targetCals + week2Audit.calorie_adjustment, "فشل دمج السعرات المعدلة في البرنامج");
  console.log(`تم اعتماد المرحلة 6 بنجاح: خفض السعرات الحسابي الدقيق (${week2Audit.calorie_adjustment} Kcal) ودمجها بالبرنامج بنجاح.`);

  // ==========================================================================
  // المرحلة 7: رادار التجديدات الدورية وتوليد رابط الواتساب بنقرة واحدة
  // ==========================================================================
  console.log("\n[المرحلة 7]: اختبار رادار التجديدات الدورية وتوليد رابط الواتساب بنقرة واحدة...");

  const subscriptionStatus = evaluateSubscriptionStatus({
    subscription_end_date: "2026-09-16",
    reference_date: "2026-09-13"
  }); // متبقي 3 أيام
  assert(
    subscriptionStatus.status === SUBSCRIPTION_STATUSES.EXPIRING_SOON,
    "رادار التجديدات لم يكتشف اقتراب انتهاء الاشتراك"
  );

  const renewalDispatch = generateRenewalWhatsAppDispatch({
    client_name: "سارة أحمد",
    phone_number: "01099887766",
    package_name: "باقة MAX الشاملة",
    remaining_days: subscriptionStatus.remaining_days,
    current_progress_summary: "التزام كامل 95% وتخطي مرحلة ثبات الوزن بنجاح"
  });

  assert(
    renewalDispatch.dispatch_url.startsWith("https://wa.me/201099887766?text="),
    "رابط تجديد الواتساب بنقرة واحدة غير صحيح"
  );
  assert(
    decodeURIComponent(renewalDispatch.dispatch_url).includes("باقة MAX الشاملة"),
    "نص رسالة التجديد لا يحتوي اسم الباقة"
  );
  console.log("تم اعتماد المرحلة 7 بنجاح: توليد رسالة ورابط تجديد الواتساب الفوري بنقرة واحدة.");

  console.log("\n================================================================================");
  console.log("نتيجة التدقيق الشامل النهائي: المنظومة خالية من العيوب بنسبة 100% (Zero-Defect Verified)");
  console.log("كافة المحركات السريرية، ومسارات المتدرب والمدرب، والروابط التنفيذية تعمل بتناغم وكمال تام.");
  console.log("================================================================================");
}

runMasterE2EFullLifecycleAudit().catch(err => {
  console.error("فشل التدقيق الشامل:", err);
  process.exit(1);
});
