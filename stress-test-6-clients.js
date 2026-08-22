import fs from 'fs';
import sequelize from './src/api/config/database.js';
import { User, Program, IntakeSubmission, CheckinSubmission, WorkoutLog } from './src/api/models/index.js';
import { buildMasterEngineV2 } from './src/master-engine-v2/build-master-engine-v2.js';
import { evaluateCheckin } from './src/checkin-engine/evaluate-checkin.js';
import { CheckinAnalysisStatus } from './src/checkin-engine/domain/enums.js';
import { ASSESSMENT_CONTEXT } from './test/fixtures/complete-intake.js';

async function runComprehensiveStressTest() {
  console.log("================================================================================");
  console.log("🔥 بدء اختبار الإجهاد الشامل لـ 6 حالات واقعية معقدة ومتباينة بالكامل");
  console.log("================================================================================\n");

  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  console.log("✓ تم تفريغ قاعدة البيانات بالكامل ومسح كافة السجلات السابقة بنجاح.\n");

  const evaluationContext = Object.freeze({
    system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
    assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
  });
  const nutritionFoodCatalog = JSON.parse(
    fs.readFileSync(new URL('./data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8'),
  );

  const clientsData = [
    // ---------------------------------------------------------------------------
    // الحالة 1: عمر طارق (شاب 21 سنة — متقدم — انزلاق غضروفي L5-S1 — حساسية جلوتين وأسماك — PPL 5 أيام)
    // ---------------------------------------------------------------------------
    {
      case_id: "CASE_1",
      personal: {
        firstName: "عمر",
        lastName: "طارق",
        full_name: "عمر طارق",
        client_code: "CL-OMAR21",
        phone_number: "01011111111",
        email: "omar.tareq@example.com",
        age: 21,
        sex: "MALE",
      },
      goals: { primary: "FAT_LOSS" },
      body: { heightCm: 180, weightKg: 86.0, bodyFat: 19, waistCm: 86, neckCm: 39 },
      nutrition: {
        budgetTier: "HIGH",
        proteinPowderAvailable: false,
        excludedFoodCodes: ["GLUTEN", "FISH", "SEAFOOD", "TILAPIA", "SALMON", "TUNA"],
        dietType: "BALANCED",
        mealsPerDay: 4,
      },
      training: {
        environment: "GYM",
        equipmentTier: "COMMERCIAL_GYM",
        daysPerWeek: 5,
        splitPreference: "PUSH_PULL_LEGS",
        experience: "ADVANCED",
      },
      medical: { injuries: ["L5_S1_HERNIATION_NO_AXIAL_LOADING"] },
      cardio: { dailyStepGoal: 10000 },
      checkin_scenario: {
        weight_kg: 86.0,
        previous_weight_kg: 86.0,
        waist_circumference_cm: 85.0,
        previous_waist_circumference_cm: 86.0,
        nutrition_adherence_percent: 95,
        workouts_completed: 5,
        workouts_scheduled: 5,
        biofeedback: { hunger_level: 3, energy_level: 4, sleep_quality: 4, sleep_hours: 8, stress_level: 2 },
        pain_reports: [],
      },
      expected_status: CheckinAnalysisStatus.BODY_RECOMP_SUCCESS,
    },

    // ---------------------------------------------------------------------------
    // الحالة 2: د. فاروق المهدي (52 سنة — ارتفاع ضغط دم + خشونة ركبة — ميزانية اقتصادية — 3 أيام)
    // ---------------------------------------------------------------------------
    {
      case_id: "CASE_2",
      personal: {
        firstName: "فاروق",
        lastName: "المهدي",
        full_name: "د. فاروق المهدي",
        client_code: "CL-FAROUK52",
        phone_number: "01022222222",
        email: "dr.farouk@example.com",
        age: 52,
        sex: "MALE",
      },
      goals: { primary: "FAT_LOSS" },
      body: { heightCm: 174, weightKg: 94.0, bodyFat: 31, waistCm: 104, neckCm: 41 },
      nutrition: {
        budgetTier: "LOW",
        proteinPowderAvailable: false,
        excludedFoodCodes: [],
        dietType: "BALANCED",
        mealsPerDay: 3,
      },
      training: {
        environment: "GYM",
        equipmentTier: "COMMERCIAL_GYM",
        daysPerWeek: 3,
        splitPreference: "FULL_BODY",
        experience: "BEGINNER",
      },
      medical: { injuries: ["HYPERTENSION", "KNEE_OSTEOARTHRITIS_NO_DEEP_SQUAT"] },
      cardio: { dailyStepGoal: 7000 },
      checkin_scenario: {
        weight_kg: 94.0,
        previous_weight_kg: 94.0,
        waist_circumference_cm: 104.0,
        previous_waist_circumference_cm: 104.0,
        nutrition_adherence_percent: 90,
        workouts_completed: 3,
        workouts_scheduled: 3,
        is_consecutive_plateau: true,
        biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7, stress_level: 2 },
        pain_reports: [],
      },
      expected_status: CheckinAnalysisStatus.TRUE_PLATEAU,
    },

    // ---------------------------------------------------------------------------
    // الحالة 3: ريم عبد الرحمن (فتاة 22 سنة — نحافة 49 كجم — تكيس مبايض + ألم معصم — تمرين منزلي)
    // ---------------------------------------------------------------------------
    {
      case_id: "CASE_3",
      personal: {
        firstName: "ريم",
        lastName: "عبدالرحمن",
        full_name: "ريم عبد الرحمن",
        client_code: "CL-REEM22",
        phone_number: "01033333333",
        email: "reem.abdelrahman@example.com",
        age: 22,
        sex: "FEMALE",
      },
      goals: { primary: "MUSCLE_GAIN" },
      body: { heightCm: 159, weightKg: 49.0, bodyFat: 18, waistCm: 63, hipCm: 88, neckCm: 31 },
      nutrition: {
        budgetTier: "MEDIUM",
        proteinPowderAvailable: false,
        excludedFoodCodes: ["DAIRY", "LACTOSE", "WHEY", "MILK", "CHEESE", "YOGURT"],
        dietType: "BALANCED",
        mealsPerDay: 4,
      },
      training: {
        environment: "HOME",
        equipmentTier: "HOME_DUMBBELLS_ONLY",
        daysPerWeek: 4,
        splitPreference: "UPPER_LOWER",
        experience: "BEGINNER",
      },
      medical: { injuries: ["PCOS", "WRIST_PAIN_NEUTRAL_GRIPS_ONLY"] },
      cardio: { dailyStepGoal: 8000 },
      checkin_scenario: {
        weight_kg: 49.4,
        previous_weight_kg: 49.0,
        waist_circumference_cm: 63.0,
        previous_waist_circumference_cm: 63.0,
        hip_circumference_cm: 88.5,
        previous_hip_circumference_cm: 88.0,
        nutrition_adherence_percent: 95,
        workouts_completed: 4,
        workouts_scheduled: 4,
        biofeedback: { hunger_level: 2, energy_level: 5, sleep_quality: 4, sleep_hours: 8, stress_level: 1 },
        pain_reports: [],
      },
      expected_status: CheckinAnalysisStatus.ON_TRACK,
    },

    // ---------------------------------------------------------------------------
    // الحالة 4: هالة الشريف (سيدة 43 سنة — اختناق وتر الكتف — حساسية بيض وألبان — التزام 65%)
    // ---------------------------------------------------------------------------
    {
      case_id: "CASE_4",
      personal: {
        firstName: "هالة",
        lastName: "الشريف",
        full_name: "هالة الشريف",
        client_code: "CL-HALA43",
        phone_number: "01044444444",
        email: "hala.elsharif@example.com",
        age: 43,
        sex: "FEMALE",
      },
      goals: { primary: "FAT_LOSS" },
      body: { heightCm: 164, weightKg: 74.0, bodyFat: 33, waistCm: 85, hipCm: 106, neckCm: 34 },
      nutrition: {
        budgetTier: "MEDIUM",
        proteinPowderAvailable: false,
        excludedFoodCodes: ["EGGS", "EGG_WHITES", "DAIRY", "MILK", "CHEESE"],
        dietType: "BALANCED",
        mealsPerDay: 3,
      },
      training: {
        environment: "GYM",
        equipmentTier: "COMMERCIAL_GYM",
        daysPerWeek: 4,
        splitPreference: "UPPER_LOWER",
        experience: "INTERMEDIATE",
      },
      medical: { injuries: ["SHOULDER_IMPINGEMENT_NO_OVERHEAD_BARBELL"] },
      cardio: { dailyStepGoal: 8000 },
      checkin_scenario: {
        weight_kg: 74.0,
        previous_weight_kg: 74.0,
        waist_circumference_cm: 85.0,
        previous_waist_circumference_cm: 85.0,
        nutrition_adherence_percent: 65,
        workouts_completed: 2,
        workouts_scheduled: 4,
        biofeedback: { hunger_level: 3, energy_level: 3, sleep_quality: 3, sleep_hours: 6, stress_level: 3 },
        pain_reports: [],
      },
      expected_status: CheckinAnalysisStatus.POOR_ADHERENCE,
    },

    // ---------------------------------------------------------------------------
    // الحالة 5: كابتن كريم المنشاوي (فنون قتالية 27 سنة — 6 أيام — ألم كتف 7/10 وتفريغ أحمال)
    // ---------------------------------------------------------------------------
    {
      case_id: "CASE_5",
      personal: {
        firstName: "كريم",
        lastName: "المنشاوي",
        full_name: "كريم المنشاوي",
        client_code: "CL-MENSHAWY27",
        phone_number: "01055555555",
        email: "kareem.menshawy@example.com",
        age: 27,
        sex: "MALE",
      },
      goals: { primary: "FAT_LOSS" },
      body: { heightCm: 176, weightKg: 78.0, bodyFat: 14, waistCm: 79, neckCm: 38 },
      nutrition: {
        budgetTier: "HIGH",
        proteinPowderAvailable: true,
        excludedFoodCodes: [],
        dietType: "BALANCED",
        mealsPerDay: 3,
      },
      training: {
        environment: "GYM",
        equipmentTier: "COMMERCIAL_GYM",
        daysPerWeek: 6,
        splitPreference: "PUSH_PULL_LEGS",
        experience: "ADVANCED",
      },
      medical: { injuries: ["ROTATOR_CUFF_STRAIN", "MENISCUS_HISTORY"] },
      cardio: { dailyStepGoal: 12000 },
      checkin_scenario: {
        weight_kg: 76.5,
        previous_weight_kg: 78.0,
        waist_circumference_cm: 78.0,
        previous_waist_circumference_cm: 79.0,
        nutrition_adherence_percent: 90,
        workouts_completed: 6,
        workouts_scheduled: 6,
        biofeedback: { hunger_level: 4, energy_level: 2, sleep_quality: 2, sleep_hours: 5.5, stress_level: 4 },
        pain_reports: [{ body_part: "SHOULDER", pain_level: 7, description: "Sharp pain during heavy shoulder presses" }],
      },
      expected_status: CheckinAnalysisStatus.INJURY_FLAGGED,
    },

    // ---------------------------------------------------------------------------
    // الحالة 6: ياسمين فودة (38 سنة — سمنة مفرطة 108 كجم — نزول سريع > 2% أسبوعياً)
    // ---------------------------------------------------------------------------
    {
      case_id: "CASE_6",
      personal: {
        firstName: "ياسمين",
        lastName: "فودة",
        full_name: "ياسمين فودة",
        client_code: "CL-YASMINE38",
        phone_number: "01066666666",
        email: "yasmine.fouda@example.com",
        age: 38,
        sex: "FEMALE",
      },
      goals: { primary: "FAT_LOSS" },
      body: { heightCm: 162, weightKg: 108.0, bodyFat: 44, waistCm: 116, hipCm: 130, neckCm: 37 },
      nutrition: {
        budgetTier: "LOW",
        proteinPowderAvailable: false,
        excludedFoodCodes: ["CHICKEN", "BEEF", "MEAT", "TURKEY"],
        dietType: "BALANCED",
        mealsPerDay: 3,
      },
      training: {
        environment: "HOME",
        equipmentTier: "HOME_BODYWEIGHT_ONLY",
        daysPerWeek: 3,
        splitPreference: "FULL_BODY",
        experience: "BEGINNER",
      },
      medical: { injuries: ["INSULIN_RESISTANCE", "JOINT_HYPER_SENSITIVITY", "POST_CESAREAN"] },
      cardio: { dailyStepGoal: 6000 },
      checkin_scenario: {
        weight_kg: 105.8,
        previous_weight_kg: 108.0,
        waist_circumference_cm: 114.0,
        previous_waist_circumference_cm: 116.0,
        nutrition_adherence_percent: 90,
        workouts_completed: 3,
        workouts_scheduled: 3,
        biofeedback: { hunger_level: 5, energy_level: 2, sleep_quality: 3, sleep_hours: 6.5, stress_level: 3 },
        pain_reports: [],
      },
      expected_status: CheckinAnalysisStatus.RAPID_LOSS_WARNING,
    },
  ];

  const results = [];

  for (const client of clientsData) {
    console.log("--------------------------------------------------------------------------------");
    console.log("▶ معالجة " + client.case_id + ": " + client.personal.full_name + " (" + client.personal.age + " سنة | " + client.body.weightKg + " كجم)");
    console.log("--------------------------------------------------------------------------------");

    // 1. إنشاء المستخدم
    const user = await User.create({
      client_code: client.personal.client_code,
      phone_number: client.personal.phone_number,
      full_name: client.personal.full_name,
      email: client.personal.email,
      password: "pass_" + client.case_id,
      role: "CLIENT",
      subscription_package: "3_MONTHS_VIP",
      payment_status: "PAID",
      status: "ACTIVE",
    });

    // 2. تسجيل الاستمارة
    await IntakeSubmission.create({
      user_id: user.id,
      answers: client,
      status: "APPROVED",
    });

    // 3. بناء الخطة عبر المحرك الماستر V2
    const programOutput = buildMasterEngineV2({
      intake: client,
      evaluationContext,
      nutritionFoodCatalog,
      options: {
        weeksCount: 4,
        splitPreference: client.training.splitPreference,
      }
    });

    const programRecord = await Program.create({
      user_id: user.id,
      program_name: "خطة مخصصة - " + client.personal.full_name,
      program_data: programOutput,
      status: "ACTIVE",
      is_active: true,
    });

    const targetKcal = programOutput.nutrition_program?.quantized_plan?.daily_totals?.calories_kcal || 2000;
    const targetP = programOutput.nutrition_program?.quantized_plan?.daily_totals?.protein_g || 160;
    const targetC = programOutput.nutrition_program?.quantized_plan?.daily_totals?.carbs_g || 200;
    const targetF = programOutput.nutrition_program?.quantized_plan?.daily_totals?.fat_g || 60;
    const meals = programOutput.nutrition_program?.quantized_plan?.meals || [];
    const trainingWeeks = programOutput.training_program?.weeks || [];
    const trainingSessions = trainingWeeks[0]?.sessions || [];
    const cardioSteps = programOutput.cardio_program?.prescription?.daily_step_target || client.cardio.dailyStepGoal;
    const cardioSessions = programOutput.cardio_program?.weekly_schedule?.sessions || [];

    // 4. تقييم المتابعة الأسبوعية بمحرك التعديل التلقائي
    const checkinPayload = {
      ...client.checkin_scenario,
      user_id: user.id,
    };

    const evalOutput = evaluateCheckin(checkinPayload);

    // 5. حفظ المتابعة بقاعدة البيانات
    const checkinRecord = await CheckinSubmission.create({
      user_id: user.id,
      week_number: 1,
      daily_weights_kg: [client.checkin_scenario.weight_kg],
      average_weight_kg: client.checkin_scenario.weight_kg,
      weight_change_kg: evalOutput.weight_change_kg,
      waist_circumference_cm: client.checkin_scenario.waist_circumference_cm,
      nutrition_adherence_percent: client.checkin_scenario.nutrition_adherence_percent,
      workouts_completed: client.checkin_scenario.workouts_completed,
      workouts_scheduled: client.checkin_scenario.workouts_scheduled,
      biofeedback: client.checkin_scenario.biofeedback,
      pain_reports: client.checkin_scenario.pain_reports,
      analysis_status: evalOutput.analysis_status,
      analysis_output: evalOutput,
      status: "PENDING_REVIEW",
    });

    // 6. اعتماد الكوتش للأسبوع الثاني
    const week2ProgData = JSON.parse(JSON.stringify(programRecord.program_data));
    week2ProgData.week_number = 2;
    if (evalOutput.suggested_calorie_delta !== 0) {
      if (week2ProgData.nutrition_program?.macro_targets) {
        week2ProgData.nutrition_program.macro_targets.calories_kcal += evalOutput.suggested_calorie_delta;
      }
    }
    if (evalOutput.is_deload_recommended) {
      if (week2ProgData.training_program) {
        week2ProgData.training_program.is_deload = true;
      }
    }

    const week2Program = await Program.create({
      user_id: user.id,
      program_name: "خطة الأسبوع 2 - " + client.personal.full_name,
      program_data: week2ProgData,
      status: "ACTIVE",
      is_active: true,
    });

    await programRecord.update({ is_active: false, status: "COMPLETED" });
    await checkinRecord.update({ status: "APPROVED", adapted_program_id: week2Program.id });

    console.log("✓ تم توليد الخطة واعتماد المتابعة للأسبوع الثاني بنجاح:");
    console.log("  - السعرات والماكروز: " + targetKcal + " kcal (P:" + targetP + "g, C:" + targetC + "g, F:" + targetF + "g) في " + meals.length + " وجبات");
    console.log("  - التدريب والكارديو: " + trainingSessions.length + " أيام تمرين | " + cardioSteps + " خطوة يومياً");
    console.log("  - نتيجة فحص المتابعة: " + evalOutput.analysis_status + " (المتوقع: " + client.expected_status + ")");
    console.log("  - توصية المحرك: " + evalOutput.recommendations_ar[0]);
    console.log("  - تعديل السعرات المقترح: " + (evalOutput.suggested_calorie_delta > 0 ? "+" : "") + evalOutput.suggested_calorie_delta + " kcal | ديلود: " + (evalOutput.is_deload_recommended ? "نعم" : "لا"));

    results.push({
      case_id: client.case_id,
      name: client.personal.full_name,
      age: client.personal.age,
      gender: client.personal.sex,
      targetKcal,
      targetP,
      targetC,
      targetF,
      meals: meals.map(m => ({
        meal_name_ar: m.meal_name_ar,
        calories_kcal: m.target_macros?.calories_kcal,
        protein_g: m.target_macros?.protein_g,
        carb_g: m.target_macros?.carb_g,
        fat_g: m.target_macros?.fat_g,
        items: m.items?.map(i => i.name_ar + " [" + (i.household_measurement || (i.portion_g + ' جم')) + "] (" + i.calories_kcal + " kcal, P:" + i.protein_g + "g, C:" + i.carb_g + "g, F:" + i.fat_g + "g)"),
      })),
      trainingSessions: trainingSessions.map(s => ({
        session_name: s.session_name || s.session_code,
        dynamic_warmup: s.mobility_protocol?.dynamic_warmup?.title_ar,
        exercises: s.exercises?.map(e => (e.name_ar || e.exercise_code) + " (" + (e.prescription?.sets || 3) + " مجموعات × " + (e.prescription?.target_min || 8) + "-" + (e.prescription?.target_max || 12) + " تكرار)"),
        static_cooldown: s.mobility_protocol?.static_cooldown?.title_ar,
      })),
      cardio: {
        daily_steps: cardioSteps,
        sessions_count: cardioSessions.length,
        hr_zone: cardioSessions[0]?.heart_rate_target?.target_range_bpm || "120-135 BPM (Zone 2)",
      },
      checkin: {
        status: evalOutput.analysis_status,
        weight_delta: evalOutput.weight_change_kg,
        waist_delta: evalOutput.waist_change_cm,
        adherence: client.checkin_scenario.nutrition_adherence_percent,
        suggested_calorie_delta: evalOutput.suggested_calorie_delta,
        is_deload: evalOutput.is_deload_recommended,
        recommendation_ar: evalOutput.recommendations_ar[0],
      },
    });
  }

  console.log("\n================================================================================");
  console.log("📊 ملخص نتائج اختبار الإجهاد الشامل لكافة الحالات الـ 6:");
  console.log("================================================================================");
  console.table(results.map(r => ({
    "الحالة": r.name,
    "السعرات": r.targetKcal + " kcal",
    "بروتين": r.targetP + "g",
    "كارب": r.targetC + "g",
    "دهون": r.targetF + "g",
    "التدريب": r.trainingSessions.length + " أيام",
    "الخطوات": r.cardio.daily_steps,
    "قرار المتابعة": r.checkin.status,
    "تعديل السعرات": (r.checkin.suggested_calorie_delta > 0 ? "+" : "") + r.checkin.suggested_calorie_delta + " kcal",
    "ديلود": r.checkin.is_deload ? "نعم" : "لا",
  })));

  fs.writeFileSync('d:/zcc/stress-test-results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log("\n✓ تم حفظ النتائج المفصلة بالكامل في stress-test-results.json بنجاح 100%.");
}

runComprehensiveStressTest().catch((err) => {
  console.error("❌ خطأ في اختبار الإجهاد:", err);
  process.exit(1);
});
