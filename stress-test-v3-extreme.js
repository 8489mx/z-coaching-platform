import { buildMasterEngineV2 } from "./src/master-engine-v2/build-master-engine-v2.js";
import { evaluateCheckin } from "./src/checkin-engine/evaluate-checkin.js";
import { CheckinAnalysisStatus } from "./src/checkin-engine/domain/enums.js";
import { User, CheckinSubmission, Program } from "./src/api/models/index.js";
import sequelize from "./src/api/config/database.js";
import fs from "fs";

// Load Food Catalog
const foodCatalogRaw = fs.readFileSync("./data/catalogs/core-global-food-batch-v1.json", "utf-8");
const nutritionFoodCatalog = JSON.parse(foodCatalogRaw);

export const EXTREME_CLIENTS_V3 = [
  // ---------------------------------------------------------------------------
  // الحالة 1: مازن الدسوقي (26 سنة — نباتي صرف + حساسية صويا ومكسرات — التهاب وتر الرضفة)
  // ---------------------------------------------------------------------------
  {
    case_id: "CASE_1",
    personal: {
      firstName: "مازن",
      lastName: "الدسوقي",
      full_name: "مازن الدسوقي",
      client_code: "CL-MAZEN26",
      phone_number: "01011111111",
      email: "mazen.eldesouki@example.com",
      age: 26,
      sex: "MALE",
    },
    goals: { primary: "BODY_RECOMPOSITION" },
    body: { heightCm: 176, weightKg: 78.0, bodyFat: 18, waistCm: 81, neckCm: 38 },
    nutrition: {
      dietType: "VEGAN",
      budgetTier: "MEDIUM",
      budget: "MEDIUM",
      proteinPowderAvailable: true,
      excludedFoodCodes: ["MEAT", "POULTRY", "BEEF", "CHICKEN", "FISH", "SEAFOOD", "EGGS", "DAIRY", "MILK", "CHEESE", "YOGURT", "SOY", "SOYBEAN", "TOFU", "NUTS", "PEANUTS", "PEANUT", "TREE_NUTS", "ALMONDS"],
      preferredMealCount: 3,
      mealsPerDay: 3,
    },
    training: {
      environment: "GYM",
      location: "GYM",
      equipmentTier: "COMMERCIAL_GYM",
      daysPerWeek: 5,
      preferredDaysPerWeek: 5,
      maxDaysPerWeek: 5,
      splitPreference: "PUSH_PULL_LEGS",
      experience: "INTERMEDIATE",
      selectedInjuries: ["KNEE"],
      injuries: [
        { area: "KNEE", painLevel: 4, affectedMovements: ["SQUAT"], movementImpact: "LIMITS", medicalRestrictions: ["NO_LEG_EXTENSION", "NO_DEEP_QUAD_SQUAT"] }
      ]
    },
    medical: {
      conditions: [],
      injuries: [
        { area: "KNEE", painLevel: 4, affectedMovements: ["SQUAT"], movementImpact: "LIMITS", medicalRestrictions: ["NO_LEG_EXTENSION", "NO_DEEP_QUAD_SQUAT"] }
      ]
    },
    cardio: { dailyStepGoal: 9000, averageDailySteps: 9000 },
    checkin_scenario: {
      weight_kg: 78.0,
      previous_weight_kg: 78.0,
      waist_circumference_cm: 80.2,
      previous_waist_circumference_cm: 81.0,
      nutrition_adherence_percent: 90,
      workouts_completed: 5,
      workouts_scheduled: 5,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7.5, stress_level: 2 },
      pain_reports: [],
    },
    expected_status: CheckinAnalysisStatus.BODY_RECOMP_SUCCESS,
  },

  // ---------------------------------------------------------------------------
  // الحالة 2: داليا القاضي (34 سنة — ما بعد تكميم المعدة + تكيس مبايض — انفصال عضلي بالبطن)
  // ---------------------------------------------------------------------------
  {
    case_id: "CASE_2",
    personal: {
      firstName: "داليا",
      lastName: "القاضي",
      full_name: "داليا القاضي",
      client_code: "CL-DALIA34",
      phone_number: "01022222222",
      email: "dalia.elqadi@example.com",
      age: 34,
      sex: "FEMALE",
    },
    goals: { primary: "FAT_LOSS" },
    body: { heightCm: 160, weightKg: 82.0, bodyFat: 38, waistCm: 96, hipCm: 118, neckCm: 36 },
    nutrition: {
      dietType: "BALANCED",
      budgetTier: "MEDIUM",
      budget: "MEDIUM",
      proteinPowderAvailable: true,
      excludedFoodCodes: ["SUGAR", "SWEETS"],
      preferredMealCount: 5, // 5 small dense meals for post-bariatric sleeve pouch
      mealsPerDay: 5,
    },
    training: {
      environment: "HOME",
      location: "HOME",
      equipmentTier: "BASIC_HOME",
      daysPerWeek: 3,
      preferredDaysPerWeek: 3,
      maxDaysPerWeek: 3,
      splitPreference: "FULL_BODY",
      experience: "BEGINNER",
      selectedInjuries: ["LOWER_BACK"],
      injuries: [
        { area: "LOWER_BACK", painLevel: 3, affectedMovements: ["HINGE"], movementImpact: "LIMITS", medicalRestrictions: ["NO_CRUNCHES", "NO_PLANKS", "NO_SITUPS", "DIASTASIS_RECTI_SAFE"] }
      ]
    },
    medical: {
      conditions: [{ conditionCode: "PCOS", stability: "STABLE" }],
      injuries: [
        { area: "LOWER_BACK", painLevel: 3, affectedMovements: ["HINGE"], movementImpact: "LIMITS", medicalRestrictions: ["NO_CRUNCHES", "NO_PLANKS", "NO_SITUPS", "DIASTASIS_RECTI_SAFE"] }
      ]
    },
    cardio: { dailyStepGoal: 6500, averageDailySteps: 6500 },
    checkin_scenario: {
      weight_kg: 79.2, // -2.8 kg rapid drop (3.4% in 1 week)
      previous_weight_kg: 82.0,
      waist_circumference_cm: 94.5,
      previous_waist_circumference_cm: 96.0,
      nutrition_adherence_percent: 90,
      workouts_completed: 3,
      workouts_scheduled: 3,
      biofeedback: { hunger_level: 3, energy_level: 2, sleep_quality: 3, sleep_hours: 6, stress_level: 3 },
      pain_reports: [],
    },
    expected_status: CheckinAnalysisStatus.RAPID_LOSS_WARNING,
  },

  // ---------------------------------------------------------------------------
  // الحالة 3: المستشار طارق عبد المجيد (58 سنة — نقرس + ضغط دم — انزلاق عنقي C5-C6)
  // ---------------------------------------------------------------------------
  {
    case_id: "CASE_3",
    personal: {
      firstName: "طارق",
      lastName: "عبدالمجيد",
      full_name: "المستشار طارق عبد المجيد",
      client_code: "CL-TAREK58",
      phone_number: "01033333333",
      email: "tarek.abdelmegid@example.com",
      age: 58,
      sex: "MALE",
    },
    goals: { primary: "FAT_LOSS" },
    body: { heightCm: 172, weightKg: 91.0, bodyFat: 29, waistCm: 101, neckCm: 41 },
    nutrition: {
      budgetTier: "LOW", // Economic budget
      budget: "LOW",
      proteinPowderAvailable: false,
      excludedFoodCodes: ["GOUT", "HIGH_URIC_ACID", "LEAN_BEEF", "BEEF", "MEAT", "RED_MEAT", "TILAPIA_FISH", "SALMON_FISH", "CANNED_TUNA", "FISH", "SEAFOOD", "LEGUMES", "LENTIL", "FAVA_BEAN", "LIVER"],
      dietType: "BALANCED",
      preferredMealCount: 3,
      mealsPerDay: 3,
    },
    training: {
      environment: "GYM",
      location: "GYM",
      equipmentTier: "COMMERCIAL_GYM",
      daysPerWeek: 3,
      preferredDaysPerWeek: 3,
      maxDaysPerWeek: 3,
      splitPreference: "FULL_BODY",
      experience: "BEGINNER",
      selectedInjuries: ["NECK"],
      injuries: [
        { area: "NECK", painLevel: 4, affectedMovements: ["OVERHEAD"], movementImpact: "LIMITS", medicalRestrictions: ["NO_BACK_SQUAT", "NO_HEAVY_SHRUGS", "NO_OVERHEAD_CERVICAL_COMPRESSION"] }
      ]
    },
    medical: {
      conditions: [{ conditionCode: "HYPERTENSION", stability: "STABLE" }],
      injuries: [
        { area: "NECK", painLevel: 4, affectedMovements: ["OVERHEAD"], movementImpact: "LIMITS", medicalRestrictions: ["NO_BACK_SQUAT", "NO_HEAVY_SHRUGS", "NO_OVERHEAD_CERVICAL_COMPRESSION"] }
      ]
    },
    cardio: { dailyStepGoal: 7000, averageDailySteps: 7000 },
    checkin_scenario: {
      weight_kg: 91.0,
      previous_weight_kg: 91.0,
      waist_circumference_cm: 101.0,
      previous_waist_circumference_cm: 101.0,
      nutrition_adherence_percent: 95,
      workouts_completed: 3,
      workouts_scheduled: 3,
      is_consecutive_plateau: true,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7, stress_level: 2 },
      pain_reports: [],
    },
    expected_status: CheckinAnalysisStatus.TRUE_PLATEAU,
  },

  // ---------------------------------------------------------------------------
  // الحالة 4: يوسف كمال (29 سنة — صيام متقطع وجبتين — تمزق وتر الكتف وانحشار)
  // ---------------------------------------------------------------------------
  {
    case_id: "CASE_4",
    personal: {
      firstName: "يوسف",
      lastName: "كمال",
      full_name: "يوسف كمال",
      client_code: "CL-YOUSSEF29",
      phone_number: "01044444444",
      email: "youssef.kamal@example.com",
      age: 29,
      sex: "MALE",
    },
    goals: { primary: "FAT_LOSS" },
    body: { heightCm: 185, weightKg: 84.0, bodyFat: 16, waistCm: 82, neckCm: 39 },
    nutrition: {
      budgetTier: "HIGH",
      budget: "HIGH",
      proteinPowderAvailable: true,
      excludedFoodCodes: [],
      dietType: "BALANCED",
      preferredMealCount: 2, // Intermittent Fasting (2 Large Meals)
      mealsPerDay: 2,
    },
    training: {
      environment: "GYM",
      location: "GYM",
      equipmentTier: "COMMERCIAL_GYM",
      daysPerWeek: 4,
      preferredDaysPerWeek: 4,
      maxDaysPerWeek: 4,
      splitPreference: "UPPER_LOWER",
      experience: "ADVANCED",
      selectedInjuries: ["SHOULDER"],
      injuries: [
        { area: "SHOULDER", painLevel: 5, affectedMovements: ["OVERHEAD"], movementImpact: "LIMITS", medicalRestrictions: ["NO_BARBELL_BENCH_PRESS", "NO_HIGH_LATERAL_RAISES", "SCAPULAR_PLANE_ONLY"] }
      ]
    },
    medical: {
      conditions: [],
      injuries: [
        { area: "SHOULDER", painLevel: 5, affectedMovements: ["OVERHEAD"], movementImpact: "LIMITS", medicalRestrictions: ["NO_BARBELL_BENCH_PRESS", "NO_HIGH_LATERAL_RAISES", "SCAPULAR_PLANE_ONLY"] }
      ]
    },
    cardio: { dailyStepGoal: 10000, averageDailySteps: 10000 },
    checkin_scenario: {
      weight_kg: 84.0,
      previous_weight_kg: 84.0,
      waist_circumference_cm: 82.0,
      previous_waist_circumference_cm: 82.0,
      nutrition_adherence_percent: 90,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 3, energy_level: 2, sleep_quality: 1, sleep_hours: 4, stress_level: 4 },
      pain_reports: [{ body_part: "SHOULDER", pain_level: 8 }],
    },
    expected_status: CheckinAnalysisStatus.INJURY_FLAGGED,
  },

  // ---------------------------------------------------------------------------
  // الحالة 5: مروة الألفي (28 سنة — أم مرضعة + حساسية جلوتين وألبان — ارتخاء حوض)
  // ---------------------------------------------------------------------------
  {
    case_id: "CASE_5",
    personal: {
      firstName: "مروة",
      lastName: "الألفي",
      full_name: "مروة الألفي",
      client_code: "CL-MARWA28",
      phone_number: "01055555555",
      email: "marwa.elalfi@example.com",
      age: 28,
      sex: "FEMALE",
      isLactating: true,
    },
    goals: { primary: "FAT_LOSS", isLactating: true },
    body: { heightCm: 163, weightKg: 68.0, bodyFat: 27, waistCm: 76, hipCm: 102, neckCm: 32 },
    nutrition: {
      budgetTier: "MEDIUM",
      budget: "MEDIUM",
      proteinPowderAvailable: false,
      excludedFoodCodes: ["GLUTEN", "WHEAT", "CELIAC", "BREAD", "DAIRY", "MILK", "CHEESE", "YOGURT", "WHEY"],
      dietType: "BALANCED",
      preferredMealCount: 3,
      mealsPerDay: 3,
    },
    training: {
      environment: "HOME",
      location: "HOME",
      equipmentTier: "BASIC_HOME",
      daysPerWeek: 3,
      preferredDaysPerWeek: 3,
      maxDaysPerWeek: 3,
      splitPreference: "FULL_BODY",
      experience: "BEGINNER",
      selectedInjuries: ["LOWER_BACK"],
      injuries: [
        { area: "LOWER_BACK", painLevel: 3, affectedMovements: ["HINGE"], movementImpact: "LIMITS", medicalRestrictions: ["NO_WALKING_LUNGES", "NO_BULGARIAN_SPLIT_SQUATS", "BILATERAL_PELVIC_STABILITY_ONLY"] }
      ]
    },
    medical: {
      pregnancyStatus: "NOT_PREGNANT",
      conditions: [],
      injuries: [
        { area: "LOWER_BACK", painLevel: 3, affectedMovements: ["HINGE"], movementImpact: "LIMITS", medicalRestrictions: ["NO_WALKING_LUNGES", "NO_BULGARIAN_SPLIT_SQUATS", "BILATERAL_PELVIC_STABILITY_ONLY"] }
      ]
    },
    cardio: { dailyStepGoal: 7500, averageDailySteps: 7500 },
    checkin_scenario: {
      weight_kg: 68.0,
      previous_weight_kg: 68.0,
      waist_circumference_cm: 76.0,
      previous_waist_circumference_cm: 76.0,
      nutrition_adherence_percent: 60, // Poor adherence (< 80%)
      workouts_completed: 1,
      workouts_scheduled: 3,
      biofeedback: { hunger_level: 2, energy_level: 3, sleep_quality: 3, sleep_hours: 6, stress_level: 3 },
      pain_reports: [],
    },
    expected_status: CheckinAnalysisStatus.POOR_ADHERENCE,
  },

  // ---------------------------------------------------------------------------
  // الحالة 6: خالد زهران (47 سنة — مناوبات ليلية + ربو صدفي — ميزانية اقتصادية)
  // ---------------------------------------------------------------------------
  {
    case_id: "CASE_6",
    personal: {
      firstName: "خالد",
      lastName: "زهران",
      full_name: "خالد زهران",
      client_code: "CL-KHALED47",
      phone_number: "01066666666",
      email: "khaled.zahran@example.com",
      age: 47,
      sex: "MALE",
    },
    goals: { primary: "FAT_LOSS" },
    body: { heightCm: 179, weightKg: 115.0, bodyFat: 36, waistCm: 116, neckCm: 43 },
    nutrition: {
      budgetTier: "LOW", // Strict low economic budget
      budget: "LOW",
      proteinPowderAvailable: false,
      excludedFoodCodes: ["LEAN_BEEF", "BEEF", "SALMON_FISH", "SMOKED_TURKEY"],
      dietType: "BALANCED",
      preferredMealCount: 3,
      mealsPerDay: 3,
    },
    training: {
      environment: "GYM",
      location: "GYM",
      equipmentTier: "COMMERCIAL_GYM",
      daysPerWeek: 3,
      preferredDaysPerWeek: 3,
      maxDaysPerWeek: 3,
      splitPreference: "FULL_BODY",
      experience: "BEGINNER",
      selectedInjuries: [],
      injuries: []
    },
    medical: {
      conditions: [{ conditionCode: "ASTHMA", stability: "STABLE" }],
      injuries: []
    },
    cardio: { dailyStepGoal: 6000, averageDailySteps: 6000 },
    checkin_scenario: {
      weight_kg: 114.1, // -0.9 kg
      previous_weight_kg: 115.0,
      waist_circumference_cm: 114.5, // -1.5 cm
      previous_waist_circumference_cm: 116.0,
      nutrition_adherence_percent: 90,
      workouts_completed: 3,
      workouts_scheduled: 3,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7, stress_level: 2 },
      pain_reports: [],
    },
    expected_status: CheckinAnalysisStatus.ON_TRACK,
  },
];

async function runExtremeStressTestV3() {
  console.log("================================================================================");
  console.log("🔥 بدء اختبار الإجهاد الاستثنائي V3 (Extreme Edge-Case Stress Test V3)");
  console.log("================================================================================\n");

  await sequelize.sync({ force: true });
  console.log("✓ تم تفريغ قاعدة البيانات بالكامل ومسح كافة السجلات السابقة بنجاح.\n");

  const results = [];

  for (const clientData of EXTREME_CLIENTS_V3) {
    console.log("--------------------------------------------------------------------------------");
    console.log(`▶ معالجة ${clientData.case_id}: ${clientData.personal.full_name} (${clientData.personal.age} سنة | ${clientData.body.weightKg} كجم)`);
    console.log("--------------------------------------------------------------------------------");

    // 1. Create User in DB
    const dbUser = await User.create({
      client_code: clientData.personal.client_code,
      full_name: clientData.personal.full_name,
      phone_number: clientData.personal.phone_number,
      email: clientData.personal.email,
      role: "CLIENT",
      status: "ACTIVE",
    });

    // 2. Generate Master Program V2
    const rawIntake = {
      personal: clientData.personal,
      goals: clientData.goals,
      body: clientData.body,
      lifestyle: { dailyActivity: "LIGHT", sleep: { averageHours: 7, quality: "GOOD" }, stressLevel: "MODERATE" },
      nutrition: clientData.nutrition,
      training: clientData.training,
      medical: clientData.medical,
      cardio: clientData.cardio,
    };

    const evaluationContext = Object.freeze({
      system_time: new Date().toISOString(),
      assessmentDate: new Date().toISOString().split("T")[0],
    });

    const programOutput = buildMasterEngineV2({
      intake: rawIntake,
      evaluationContext,
      nutritionFoodCatalog,
    });

    const targetKcal = programOutput.nutrition_program?.macro_targets?.calories_kcal || programOutput.nutrition_program?.quantized_plan?.daily_totals?.calories_kcal;
    const targetP = programOutput.nutrition_program?.macro_targets?.protein_g || programOutput.nutrition_program?.quantized_plan?.daily_totals?.protein_g;
    const targetC = programOutput.nutrition_program?.macro_targets?.carbohydrate_g || programOutput.nutrition_program?.quantized_plan?.daily_totals?.carbs_g;
    const targetF = programOutput.nutrition_program?.macro_targets?.fat_g || programOutput.nutrition_program?.quantized_plan?.daily_totals?.fat_g;

    const dbProgram = await Program.create({
      user_id: dbUser.id,
      program_data: programOutput,
      status: "ACTIVE",
      version: 1,
    });

    // 3. Evaluate Check-in Scenario
    const checkinSubmission = {
      weight_kg: clientData.checkin_scenario.weight_kg,
      previous_weight_kg: clientData.checkin_scenario.previous_weight_kg,
      waist_circumference_cm: clientData.checkin_scenario.waist_circumference_cm,
      previous_waist_circumference_cm: clientData.checkin_scenario.previous_waist_circumference_cm,
      nutrition_adherence_percent: clientData.checkin_scenario.nutrition_adherence_percent,
      workouts_completed: clientData.checkin_scenario.workouts_completed,
      workouts_scheduled: clientData.checkin_scenario.workouts_scheduled,
      is_consecutive_plateau: Boolean(clientData.checkin_scenario.is_consecutive_plateau),
      biofeedback: clientData.checkin_scenario.biofeedback,
      pain_reports: clientData.checkin_scenario.pain_reports,
    };

    const checkinAnalysis = evaluateCheckin(checkinSubmission);

    if (checkinAnalysis.analysis_status !== clientData.expected_status) {
      throw new Error(`Check-in mismatch for ${clientData.personal.full_name}: Expected ${clientData.expected_status}, got ${checkinAnalysis.analysis_status}`);
    }

    const dbCheckin = await CheckinSubmission.create({
      user_id: dbUser.id,
      week_number: 1,
      daily_weights_kg: [checkinSubmission.weight_kg],
      average_weight_kg: checkinSubmission.weight_kg,
      weight_change_kg: checkinAnalysis.metrics?.weight_change_kg || 0,
      waist_circumference_cm: checkinSubmission.waist_circumference_cm,
      nutrition_adherence_percent: checkinSubmission.nutrition_adherence_percent,
      workouts_completed: checkinSubmission.workouts_completed,
      workouts_scheduled: checkinSubmission.workouts_scheduled,
      biofeedback: checkinSubmission.biofeedback,
      pain_reports: checkinSubmission.pain_reports,
      analysis_status: checkinAnalysis.analysis_status,
      analysis_output: checkinAnalysis,
      coach_notes: checkinAnalysis.recommendations_ar[0] || "",
      status: "APPROVED",
    });

    console.log("✓ تم توليد الخطة واعتماد المتابعة للأسبوع الثاني بنجاح:");
    console.log(`  - السعرات والماكروز: ${targetKcal} kcal (P:${targetP}g, C:${targetC}g, F:${targetF}g) في ${clientData.nutrition.mealsPerDay} وجبات`);
    console.log(`  - التدريب والكارديو: ${clientData.training.daysPerWeek} أيام تمرين | ${clientData.cardio.dailyStepGoal} خطوة يومياً`);
    console.log(`  - نتيجة فحص المتابعة: ${checkinAnalysis.analysis_status} (المتوقع: ${clientData.expected_status})`);
    console.log(`  - توصية المحرك: ${checkinAnalysis.recommendations_ar[0] || ""}`);
    console.log(`  - تعديل السعرات المقترح: ${checkinAnalysis.suggested_calorie_delta} kcal | ديلود: ${checkinAnalysis.is_deload_recommended ? "نعم" : "لا"}`);

    const clientResult = {
      case_id: clientData.case_id,
      name: clientData.personal.full_name,
      age: clientData.personal.age,
      gender: clientData.personal.sex,
      targetKcal,
      targetP,
      targetC,
      targetF,
      meals_count: clientData.nutrition.mealsPerDay,
      meals: (programOutput.nutrition_program?.quantized_plan?.meals || []).map((m) => ({
        meal_name_ar: m.meal_name_ar,
        recipe_title_ar: m.recipe_title_ar,
        calories_kcal: m.actual_macros?.calories_kcal,
        protein_g: m.actual_macros?.protein_g,
        carb_g: m.actual_macros?.carb_g,
        fat_g: m.actual_macros?.fat_g,
        items: (m.items || []).map(
          (it) => `${it.name_ar} [${it.household_measurement}] (${it.calories_kcal} kcal, P:${it.protein_g}g, C:${it.carb_g}g, F:${it.fat_g}g)`
        ),
      })),
      trainingSessions: (programOutput.training_program?.weeks?.[0]?.sessions || []).map((s) => ({
        session_name: s.session_name,
        dynamic_warmup: s.mobility_protocol?.dynamic_warmup?.title_ar || "إحماء ديناميكي",
        exercises: (s.exercises || []).map((e) => `${e.name_ar || e.exercise_code} (${e.prescription?.target_sets || 3} مجموعات × ${e.prescription?.target_reps || "8-12"} تكرار)`),
        static_cooldown: s.mobility_protocol?.static_cooldown?.title_ar || "تهدئة واستطالات",
      })),
      cardio: {
        daily_steps: clientData.cardio.dailyStepGoal,
        sessions_count: programOutput.cardio_program?.weekly_schedule?.sessions?.length || 0,
        hr_zone: `${programOutput.cardio_program?.weekly_schedule?.sessions?.[0]?.heart_rate_target?.target_range_bpm || "120-135 BPM"} (Zone 2)`,
      },
      checkin: {
        status: checkinAnalysis.analysis_status,
        weight_delta: checkinAnalysis.weight_change_kg,
        waist_delta: checkinAnalysis.waist_change_cm,
        adherence: clientData.checkin_scenario.nutrition_adherence_percent,
        suggested_calorie_delta: checkinAnalysis.suggested_calorie_delta,
        is_deload: checkinAnalysis.is_deload_recommended,
        recommendation_ar: checkinAnalysis.recommendations_ar[0] || "",
      },
    };

    results.push(clientResult);
  }

  console.log("\n================================================================================");
  console.log("📊 ملخص نتائج اختبار الإجهاد الاستثنائي V3 لكافة الحالات الـ 6:");
  console.log("================================================================================");

  console.table(
    results.map((r) => ({
      "الحالة": r.name,
      "السعرات": `${r.targetKcal} kcal`,
      "بروتين": `${r.targetP}g`,
      "كارب": `${r.targetC}g`,
      "دهون": `${r.targetF}g`,
      "عدد الوجبات": `${r.meals_count} وجبات`,
      "التدريب": `${r.trainingSessions.length} أيام`,
      "الخطوات": r.cardio.daily_steps,
      "قرار المتابعة": r.checkin.status,
      "تعديل السعرات": `${r.checkin.suggested_calorie_delta >= 0 ? "+" : ""}${r.checkin.suggested_calorie_delta} kcal`,
      "ديلود": r.checkin.is_deload ? "نعم" : "لا",
    }))
  );

  fs.writeFileSync("d:/zcc/stress-test-v3-results.json", JSON.stringify(results, null, 2), "utf8");
  console.log("\n✓ تم حفظ النتائج المفصلة بالكامل في stress-test-v3-results.json بنجاح 100%.\n");
}

runExtremeStressTestV3().catch((err) => {
  console.error("❌ خطأ في اختبار الإجهاد الاستثنائي V3:", err);
  process.exit(1);
});
