import test from 'node:test';
import assert from 'node:assert/strict';

// Engines & Adapters
import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { buildMasterEngineV2, resolveOptimalDietFramework } from '../src/master-engine-v2/index.js';
import { evaluateCheckin } from '../src/checkin-engine/index.js';
import { getTorqueMatchedSwaps } from '../frontend/src/utils/biomechanicalSwapEngine.js';
import { 
  FOOD_DATABASE, 
  isFoodClinicallySafe, 
  getCompatibleSwaps, 
  calculateDynamicFoodSwap, 
  formatItemPortionDisplay,
  PORTION_DISPLAY_MODES 
} from '../frontend/src/utils/foodSwapEngine.js';
import { getPrehabRoutine } from '../frontend/src/utils/posturalPrehabEngine.js';
import { getCaffeineCutoffTime } from '../frontend/src/utils/circadianLabTriggerEngine.js';
import { applyEmergencyScenarioAdaptation, TRAVEL_EQUIPMENT_TYPES } from '../frontend/src/utils/emergencyScenarioEngine.js';
import { generateMasterPdfExportData } from '../frontend/src/utils/pdfExportEngine.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load food catalog
let foodCatalogCache = null;
async function loadCatalog() {
  if (!foodCatalogCache) {
    const p = path.join(__dirname, '..', 'data', 'catalogs', 'core-global-food-batch-v1.json');
    const content = await fs.readFile(p, 'utf-8');
    foodCatalogCache = JSON.parse(content);
  }
  return foodCatalogCache;
}

// =========================================================================
// PERSONA 1: كابتن أحمد طارق (رجل - تنشيف، انزلاق L4-L5، حساسية بيض ولاكتوز، صيام متقطع 16/8)
// =========================================================================
test('1. End-to-End Simulation: Persona 1 (Ahmed Tarek - Male, L4-L5 Disc Herniation, Egg & Lactose Allergy, Intermittent Fasting 16/8)', async (t) => {
  const catalog = await loadCatalog();
  const rawIntake = {
    personal: {
      firstName: 'أحمد',
      lastName: 'طارق',
      gender: 'MALE',
      sex: 'MALE',
      age: 34,
      phone: '01011112222'
    },
    body: {
      weightKg: 96,
      heightCm: 178,
      bodyFat: 26
    },
    goals: {
      primary: 'FAT_LOSS'
    },
    medical: {
      hasInjuries: true,
      conditions: [{ conditionCode: 'L4_L5_DISC_HERNIATION', label: 'انزلاق غضروفي قطني L4-L5' }],
      injuries: ['L4_L5_DISC_HERNIATION', 'انزلاق قطني أسفل الظهر'],
      hasCardiovascularIssues: false,
      hasHypertension: false
    },
    nutrition: {
      preferredDietaryFramework: 'AUTO_COACH_MATCH',
      preferredMealCount: 3,
      skipsBreakfast: true,
      prefersFasting: true,
      allergies: [
        { substance: 'EGGS', severity: 'SEVERE' },
        { substance: 'LACTOSE', severity: 'MODERATE' }
      ],
      excludedFoodsList: ['EGGS', 'DAIRY', 'MILK']
    },
    cardio: {
      averageDailySteps: 6000,
      preferredDaysPerWeek: 3
    },
    training: {
      preferredDaysPerWeek: 4,
      experience: 'INTERMEDIATE',
      environment: 'COMMERCIAL_GYM'
    },
    lifestyle: {
      dailyRoutine: 'BUSY_MORNINGS',
      shiftWork: true,
      sleepSchedule: {
        bedtime: '02:00',
        wakeTime: '09:00',
        sleepHours: 7
      }
    }
  };

  // Step 1: Canonical Adaptation & Safety Evaluation
  const canonical = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const evaluationContext = Object.freeze({
    system_time: new Date().toISOString(),
    assessmentDate: new Date().toISOString().split('T')[0]
  });
  const decision = evaluateIntake(canonical, evaluationContext);
  assert.notEqual(decision.plan_status, 'BLOCKED', 'Plan must not be blocked');
  assert.ok(['READY_FOR_DRAFT', 'COACH_REVIEW_REQUIRED'].includes(decision.plan_status), 'Plan must be ready for coach review');

  // Step 2: Diet Framework Resolution
  const framework = resolveOptimalDietFramework(canonical, rawIntake);
  assert.equal(framework.framework, 'INTERMITTENT_FASTING', 'Intermittent fasting should be auto-selected for busy mornings and skipping breakfast');

  // Step 3: Build Master Engine V2
  const masterPlan = buildMasterEngineV2({
    intake: canonical,
    evaluationContext,
    nutritionFoodCatalog: catalog,
    options: {}
  });
  assert.ok(masterPlan, 'Master plan must be generated');

  // Verify Nutrition Targets: Deficit applied for Fat Loss
  const targets = masterPlan.nutrition_program?.macro_targets || masterPlan.nutrition?.targets;
  assert.ok(targets.calories_kcal < 2600, `Calories should be in deficit, received ${targets.calories_kcal}`);
  assert.ok(targets.protein_g >= 180, `Protein should be high for muscle sparing (>= 180g), received ${targets.protein_g}`);

  // Step 4: Clinical Safety Verification for Food Database
  const clientProfile = {
    allergies: ['EGGS', 'LACTOSE'],
    is_lactose_intolerant: true
  };
  // Check egg foods are unsafe
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHOLE_EGGS_BOILED, clientProfile), false, 'Boiled whole eggs must be blocked');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.PASTEURIZED_EGG_WHITES, clientProfile), false, 'Egg whites must be blocked');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.COTTAGE_CHEESE_LIGHT, clientProfile), false, 'Regular cottage cheese must be blocked due to lactose');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.CHICKEN_BREAST, clientProfile), true, 'Chicken breast must be safe');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHITE_FISH_FILLET, clientProfile), true, 'White fish fillet must be safe');

  // Step 5: Verify Compatible Swaps for Chicken Breast (Protein)
  const safeSwaps = getCompatibleSwaps('CHICKEN_BREAST', clientProfile);
  assert.ok(safeSwaps.length > 0, 'Must provide safe protein swaps');
  for (const s of safeSwaps) {
    assert.ok(!s.is_dairy || s.is_low_lactose, `Dairy item ${s.code} should not appear without lactose clearance`);
    assert.ok(!s.code.includes('EGG'), `Egg item ${s.code} should not appear in swaps`);
  }

  // Step 6: Verify Lumbar Spine Protection & Prehab
  const prehab = getPrehabRoutine(['L4_L5_DISC_HERNIATION', 'انزلاق قطني']);
  assert.ok(prehab, 'Must generate prehab routine for lumbar disc');
  assert.ok(prehab.routineNameAr || prehab.exercises, 'Prehab must include exercises');

  // Step 7: Circadian Caffeine Cutoff based on bedtime 02:00
  const caffeineCutoff = getCaffeineCutoffTime('02:00', 6);
  assert.equal(caffeineCutoff.caffeine_cutoff_24h, '20:00', 'Caffeine cutoff should be 20:00 (8:00 PM) for 02:00 AM bedtime with 6h buffer');

  // Step 8: Weekly Check-in Simulation for Ahmed (Week 1 -> Week 2)
  const checkinInput = {
    weight_kg: 94.8, // 1.2 kg loss
    previous_weight_kg: 96.0,
    waist_circumference_cm: 98,
    previous_waist_circumference_cm: 100,
    nutrition_adherence_percent: 95,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: {
      hunger_level: 2,
      energy_level: 4,
      sleep_quality: 4,
      stress_level: 2
    },
    pain_reports: []
  };
  const checkinEval = evaluateCheckin(checkinInput);
  assert.ok(checkinEval.weight_change_kg < 0, 'Weight change must be negative (loss)');
  assert.equal(checkinEval.adherence_tier, 'OPTIMAL', 'Adherence tier should be OPTIMAL');
});

// =========================================================================
// PERSONA 2: أستاذة سارة إبراهيم (سيدة - ريكومب، تكيس مبايض PCOS، مقاومة إنسولين، غدة درقية إلتروكسين، حساسية جلوتين وبحرية، انحشار كتف)
// =========================================================================
test('2. End-to-End Simulation: Persona 2 (Sara Ibrahim - Female, PCOS & Insulin Resistance, Hypothyroid on Eltroxin, Gluten & Seafood Allergy, Shoulder Impingement)', async (t) => {
  const catalog = await loadCatalog();
  const rawIntake = {
    personal: {
      firstName: 'سارة',
      lastName: 'إبراهيم',
      gender: 'FEMALE',
      sex: 'FEMALE',
      age: 29,
      phone: '01033334444'
    },
    body: {
      weightKg: 74,
      heightCm: 162,
      bodyFat: 33
    },
    goals: {
      primary: 'BODY_RECOMPOSITION'
    },
    medical: {
      hasPcos: true,
      hasInsulinResistance: true,
      conditions: [
        { conditionCode: 'PCOS', label: 'متلازمة تكيس المبايض' },
        { conditionCode: 'INSULIN_RESISTANCE', label: 'مقاومة إنسولين' },
        { conditionCode: 'HYPOTHYROIDISM', label: 'خمول الغدة الدرقية' },
        { conditionCode: 'SHOULDER_IMPINGEMENT', label: 'انحشار أوتار الكتف' }
      ],
      medications: ['ELTROXIN 50mcg', 'التروكسين'],
      injuries: ['SHOULDER_IMPINGEMENT', 'ألم في أوتار الكتف عند الرفع للأعلى']
    },
    nutrition: {
      preferredDietaryFramework: 'AUTO_COACH_MATCH',
      preferredMealCount: 3,
      allergies: [
        { substance: 'GLUTEN', severity: 'SEVERE' },
        { substance: 'FISH_SEAFOOD', severity: 'SEVERE' }
      ],
      excludedFoodsList: ['GLUTEN_WHEAT', 'FISH_SEAFOOD']
    },
    cardio: {
      averageDailySteps: 8000,
      preferredDaysPerWeek: 3
    },
    training: {
      preferredDaysPerWeek: 3,
      experience: 'BEGINNER',
      environment: 'COMMERCIAL_GYM'
    },
    lifestyle: {
      dailyRoutine: 'STANDARD_OFFICE',
      sleepSchedule: {
        bedtime: '23:30',
        wakeTime: '07:30',
        sleepHours: 8
      }
    }
  };

  // Step 1: Canonical Adaptation & Evaluation
  const canonical = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const evaluationContext = Object.freeze({
    system_time: new Date().toISOString(),
    assessmentDate: new Date().toISOString().split('T')[0]
  });
  const decision = evaluateIntake(canonical, evaluationContext);
  assert.notEqual(decision.plan_status, 'BLOCKED', 'Plan must not be blocked');
  assert.ok(['READY_FOR_DRAFT', 'COACH_REVIEW_REQUIRED'].includes(decision.plan_status));

  // Step 2: Diet Framework Resolution -> TARGETED_LOW_CARB due to PCOS and Insulin Resistance
  const framework = resolveOptimalDietFramework(canonical, rawIntake);
  assert.equal(framework.framework, 'TARGETED_LOW_CARB', 'Targeted low carb should be auto-selected for PCOS and Insulin Resistance');

  // Step 3: Build Master Program V2
  const masterPlan = buildMasterEngineV2({
    intake: canonical,
    evaluationContext,
    nutritionFoodCatalog: catalog,
    options: {}
  });
  assert.ok(masterPlan);

  // Step 4: Food Safety & Allergen Filters
  const clientProfile = {
    is_celiac: true,
    allergies: ['GLUTEN', 'FISH', 'SEAFOOD']
  };
  // Check gluten foods are blocked
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.EGYPTIAN_BALADI_BREAD, clientProfile), false, 'Baladi bread must be blocked due to gluten');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHOLE_WHEAT_TOAST, clientProfile), false, 'Whole wheat toast must be blocked due to gluten');
  // Check seafood is blocked
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHITE_FISH_FILLET, clientProfile), false, 'Fish fillet must be blocked');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.SHRIMP_GRILLED, clientProfile), false, 'Shrimp must be blocked');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.SALMON_GRILLED, clientProfile), false, 'Salmon must be blocked');
  // Safe gluten-free & non-seafood carbs and proteins
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.BASMATI_RICE_COOKED, clientProfile), true, 'Basmati rice must be safe');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.BOILED_POTATOES, clientProfile), true, 'Boiled potatoes must be safe');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.SWEET_POTATO_BAKED, clientProfile), true, 'Sweet potatoes must be safe');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.CHICKEN_BREAST, clientProfile), true, 'Chicken breast must be safe');

  // Step 5: Dynamic Swap Verification (Carb Swap for Rice)
  const riceSwaps = getCompatibleSwaps('BASMATI_RICE_COOKED', clientProfile);
  assert.ok(riceSwaps.length > 0, 'Must have compatible gluten-free carb swaps');
  for (const item of riceSwaps) {
    assert.equal(item.is_gluten_free, true, `Item ${item.code} must be strictly gluten-free`);
  }

  // Calculate swap: 150g Basmati Rice to Boiled Potatoes
  const potatoSwap = calculateDynamicFoodSwap({
    current_food_code: 'BASMATI_RICE_COOKED',
    target_food_code: 'BOILED_POTATOES',
    current_portion_g: 150,
    clinical_profile: clientProfile
  });
  assert.equal(potatoSwap.success, true, 'Rice to potato swap must succeed');
  assert.ok(potatoSwap.replacement_food.portion_g > 150, 'Potato portion should be larger in volume due to lower carb density');

  // Step 6: Shoulder Impingement Prehab & Biomechanical Swaps
  const shoulderPrehab = getPrehabRoutine(['SHOULDER_IMPINGEMENT', 'انحشار أوتار الكتف']);
  assert.ok(shoulderPrehab, 'Must generate shoulder prehab routine');

  // Step 7: Checkin Simulation (Sara - Stable weight, waist reduction)
  const checkinInput = {
    weight_kg: 73.8, // -0.2 kg (recomp)
    previous_weight_kg: 74.0,
    waist_circumference_cm: 77, // -2 cm (fat loss & muscle gain)
    previous_waist_circumference_cm: 79,
    nutrition_adherence_percent: 90,
    workouts_completed: 3,
    workouts_scheduled: 3,
    biofeedback: {
      hunger_level: 2,
      energy_level: 4,
      sleep_quality: 4,
      stress_level: 2
    }
  };
  const checkinEval = evaluateCheckin(checkinInput);
  assert.equal(checkinEval.adherence_tier, 'OPTIMAL');
  assert.ok(checkinEval.waist_change_cm < 0, 'Waist reduction confirmed during recomp');
});

// =========================================================================
// PERSONA 3: كابتن عمر خالد (رجل - ضخامة عضلية، نقص إنزيم الفوال G6PD، صالة مزدحمة والبدائل التوأم)
// =========================================================================
test('3. End-to-End Simulation: Persona 3 (Omar Khaled - Male, Lean Bulk, G6PD / Favism Deficiency, High Caloric Needs, Biomechanical Twin Swaps)', async (t) => {
  const catalog = await loadCatalog();
  const rawIntake = {
    personal: {
      firstName: 'عمر',
      lastName: 'خالد',
      gender: 'MALE',
      sex: 'MALE',
      age: 25,
      phone: '01055556666'
    },
    body: {
      weightKg: 68,
      heightCm: 182,
      bodyFat: 12
    },
    goals: {
      primary: 'MUSCLE_GAIN'
    },
    medical: {
      hasInjuries: false,
      conditions: [{ conditionCode: 'G6PD', label: 'أنيميا الفول / نقص إنزيم الفوال' }],
      injuries: []
    },
    nutrition: {
      preferredDietaryFramework: 'AUTO_COACH_MATCH',
      preferredMealCount: 4,
      allergies: [
        { substance: 'G6PD_FAVISM', severity: 'CRITICAL' },
        { substance: 'LEGUMES', severity: 'CRITICAL' }
      ],
      excludedFoodsList: ['LEGUMES']
    },
    cardio: {
      averageDailySteps: 12000,
      preferredDaysPerWeek: 2
    },
    training: {
      preferredDaysPerWeek: 5,
      experience: 'ADVANCED',
      environment: 'COMMERCIAL_GYM'
    },
    lifestyle: {
      dailyRoutine: 'ACTIVE_STUDENT_TRAINER',
      sleepSchedule: {
        bedtime: '00:00',
        wakeTime: '08:00',
        sleepHours: 8
      }
    }
  };

  // Step 1: Canonical Adaptation & Evaluation
  const canonical = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const evaluationContext = Object.freeze({
    system_time: new Date().toISOString(),
    assessmentDate: new Date().toISOString().split('T')[0]
  });
  const decision = evaluateIntake(canonical, evaluationContext);
  assert.notEqual(decision.plan_status, 'BLOCKED', 'Plan must not be blocked');
  assert.ok(['READY_FOR_DRAFT', 'COACH_REVIEW_REQUIRED'].includes(decision.plan_status));

  // Step 2: Diet Framework -> Advanced trainee with 5 days training -> CARB_CYCLING
  const framework = resolveOptimalDietFramework(canonical, rawIntake);
  assert.equal(framework.framework, 'CARB_CYCLING', 'Carb cycling should be auto-selected for advanced 5-day training split');

  // Step 3: Build Master Engine V2
  const masterPlan = buildMasterEngineV2({
    intake: canonical,
    evaluationContext,
    nutritionFoodCatalog: catalog,
    options: {}
  });
  assert.ok(masterPlan);

  // Targets: Should reflect surplus for muscle gain
  const targets = masterPlan.nutrition_program?.macro_targets || masterPlan.nutrition?.targets;
  assert.ok(targets.calories_kcal >= 2500, `Caloric surplus required for 182cm active male (>= 2500 kcal), received ${targets.calories_kcal}`);

  // Step 4: Clinical Safety Verification for G6PD (Favism)
  const clientProfile = {
    is_g6pd: true,
    allergies: ['G6PD', 'FAVISM', 'فول', 'بقول']
  };
  // Legumes must be strictly blocked
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.COOKED_FAVA_BEANS, clientProfile), false, 'Fava beans must be strictly blocked for G6PD');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.COOKED_LENTILS, clientProfile), false, 'Lentils must be strictly blocked for G6PD');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.COOKED_CHICKPEAS, clientProfile), false, 'Chickpeas must be strictly blocked for G6PD');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.COOKED_WHITE_BEANS, clientProfile), false, 'White beans must be strictly blocked for G6PD');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.TERMIS_LUPIN_BOILED, clientProfile), false, 'Termis (Lupin) must be blocked for G6PD');
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.NATURAL_PEANUT_BUTTER, clientProfile), false, 'Peanuts must be blocked for G6PD');
  // Meats, Rice, Eggs, Potatoes must be completely safe
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.CHICKEN_BREAST, clientProfile), true);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.LEAN_GROUND_BEEF_95_5, clientProfile), true);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.BASMATI_RICE_COOKED, clientProfile), true);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.RAW_WALNUTS, clientProfile), true, 'Tree nuts like walnuts are safe for G6PD');

  // Step 5: Check compatible swaps for breakfast savory protein
  // If source is Cottage Cheese, Fava beans must NOT be in the options
  const cottageSwaps = getCompatibleSwaps('COTTAGE_CHEESE_LIGHT', clientProfile);
  for (const opt of cottageSwaps) {
    assert.ok(!opt.is_legume, `Option ${opt.code} cannot be a legume for G6PD patient`);
  }

  // Step 6: Biomechanical Twin Machine Swaps
  // Test replacing flat barbell bench press with machine or dumbbell press
  const benchResult = getTorqueMatchedSwaps('BARBELL_BENCH_PRESS');
  assert.ok(benchResult.matched_swaps.length > 0, 'Must have biomechanical swaps for Barbell Bench Press');
  const hasDumbbellOrMachine = benchResult.matched_swaps.some(s => s.name.includes('Dumbbell') || s.name.includes('Machine'));
  assert.ok(hasDumbbellOrMachine, 'Must include Dumbbell or Machine alternatives');

  // Step 7: Weekly Checkin Simulation (Lean Bulk progress)
  const checkinInput = {
    weight_kg: 68.4, // +0.4 kg lean gain
    previous_weight_kg: 68.0,
    waist_circumference_cm: 76,
    previous_waist_circumference_cm: 76,
    nutrition_adherence_percent: 95,
    workouts_completed: 5,
    workouts_scheduled: 5,
    biofeedback: {
      hunger_level: 3,
      energy_level: 5,
      sleep_quality: 5,
      stress_level: 2
    }
  };
  const checkinEval = evaluateCheckin(checkinInput);
  assert.equal(checkinEval.adherence_tier, 'OPTIMAL');
  assert.ok(checkinEval.weight_change_kg > 0, 'Clean surplus gain reflected');
});

// =========================================================================
// PERSONA 4: أستاذة نورهان علي (سيدة - ما بعد تكميم المعدة Bariatric، خشونة ركبة، سفر متكرر، 5 وجبات)
// =========================================================================
test('4. End-to-End Simulation: Persona 4 (Nourhan Ali - Female, Post-Bariatric Sleeve, Patellofemoral Knee Pain, Frequent Travel & 5 Small Meals)', async (t) => {
  const catalog = await loadCatalog();
  const rawIntake = {
    personal: {
      firstName: 'نورهان',
      lastName: 'علي',
      gender: 'FEMALE',
      sex: 'FEMALE',
      age: 38,
      phone: '01077778888'
    },
    body: {
      weightKg: 82,
      heightCm: 166,
      bodyFat: 28
    },
    goals: {
      primary: 'FAT_LOSS'
    },
    medical: {
      hasInjuries: true,
      conditions: [
        { conditionCode: 'BARIATRIC_SURGERY', label: 'تكميم معدة سابقة' },
        { conditionCode: 'PATELLOFEMORAL_KNEE_PAIN', label: 'خشونة صابونة الركبة' }
      ],
      injuries: ['KNEE_PAIN', 'خشونة وألم في الركبة عند الثني الحاد']
    },
    nutrition: {
      preferredDietaryFramework: 'BALANCED_HIGH_PROTEIN',
      preferredMealCount: 5,
      allergies: [],
      excludedFoodsList: []
    },
    cardio: {
      averageDailySteps: 7000,
      preferredDaysPerWeek: 3
    },
    training: {
      preferredDaysPerWeek: 4,
      experience: 'INTERMEDIATE',
      environment: 'HOTEL_OR_HOME_GYM'
    },
    lifestyle: {
      dailyRoutine: 'FREQUENT_TRAVEL',
      sleepSchedule: {
        bedtime: '23:00',
        wakeTime: '07:00',
        sleepHours: 8
      }
    }
  };

  // Step 1: Canonical Adaptation & Evaluation
  const canonical = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const evaluationContext = Object.freeze({
    system_time: new Date().toISOString(),
    assessmentDate: new Date().toISOString().split('T')[0]
  });
  const decision = evaluateIntake(canonical, evaluationContext);
  assert.notEqual(decision.plan_status, 'BLOCKED', 'Plan must not be blocked');
  // A stomach that has been operated on waits for a person: how far past the surgery the client is,
  // and what her surgeon allows, decide the calories and the size of a plate, and the intake asks
  // neither (src/intake-decision-engine/rules/safety-rules.js).
  assert.equal(decision.plan_status, 'MEDICAL_REVIEW_REQUIRED');
  assert.ok(decision.review_flags.some((flag) => flag.code === 'ORGAN_CONDITION_REQUIRES_MEDICAL_REVIEW'));

  // Step 2: Build Master Program V2
  const masterPlan = buildMasterEngineV2({
    intake: canonical,
    evaluationContext,
    nutritionFoodCatalog: catalog,
    options: {}
  });
  assert.ok(masterPlan);

  // Step 3: Bariatric Portion Formatting Verification
  // Bariatric meals must have small, concentrated portions
  const portionDisplay = formatItemPortionDisplay({
    food_code: 'CHICKEN_BREAST',
    amount_g: 110,
    macro_type: 'PROTEIN'
  }, PORTION_DISPLAY_MODES.DUAL);
  assert.ok(portionDisplay.primary_text, 'Portion text must exist');
  assert.ok(portionDisplay.hand_text.includes('كف اليد'), 'Hand portion metric must guide client');

  // Step 4: Knee Pain Joint Safety & Prehab
  const kneePrehab = getPrehabRoutine(['KNEE_PAIN', 'خشونة الركبة']);
  assert.ok(kneePrehab, 'Must generate knee prehab routine');

  // Step 5: Travel Emergency Scenario Adaptation
  // Client is traveling and only has Dumbbells in hotel gym
  const travelAdaptation = applyEmergencyScenarioAdaptation({
    scenario_type: 'TRAVEL',
    equipment_tier: TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM,
    base_sessions_per_week: 4
  });
  assert.equal(travelAdaptation.scenario_applied, 'TRAVEL_MODE', 'Must produce hotel travel adaptation');

  // Step 6: Weekly Checkin Simulation (Nourhan - Healthy weight drop)
  const checkinInput = {
    weight_kg: 81.2, // -0.8 kg
    previous_weight_kg: 82.0,
    waist_circumference_cm: 85,
    previous_waist_circumference_cm: 86.5,
    nutrition_adherence_percent: 92,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: {
      hunger_level: 1,
      energy_level: 4,
      sleep_quality: 4,
      stress_level: 2
    }
  };
  const checkinEval = evaluateCheckin(checkinInput);
  assert.equal(checkinEval.adherence_tier, 'OPTIMAL');
  assert.ok(checkinEval.weight_change_kg < 0);
});

// =========================================================================
// MASTER VERIFICATION: System Robustness, PDF Export & Clinical Zero-Tolerance
// =========================================================================
test('5. Master Verification: Branded PDF Export Structure & Zero Emojis Compliance', () => {
  const dummyProgram = {
    client: {
      name: 'أحمد طارق',
      code: '1001',
      package: 'MAX'
    },
    nutrition: {
      targets: { calories: 2100, protein: 195, carbs: 180, fats: 55 },
      meals: [
        {
          name: 'الوجبة الأولى',
          time: '13:00',
          items: [
            { name: 'صدور دجاج مشوية', amount: '200 جم مطبوخ', calories: 330, protein: 62, carbs: 0, fat: 7 }
          ]
        }
      ]
    },
    training: {
      sessions: [
        {
          name: 'يوم الدفع العلوي',
          exercises: [
            { name: 'دمبل بنش بريس مستوي', sets: 3, reps: '8-10', rest_seconds: 90, cue: 'التحكم بالنزول' }
          ]
        }
      ]
    }
  };

  const pdfData = generateMasterPdfExportData({
    client_name: dummyProgram.client.name,
    client_code: dummyProgram.client.code,
    package_tier: dummyProgram.client.package,
    nutrition_plan: dummyProgram.nutrition,
    workout_plan: dummyProgram.training
  });
  assert.ok(pdfData, 'PDF export data generated');
  assert.equal(pdfData.client.name, 'أحمد طارق');

  // Verify Zero Emojis in output
  const jsonString = JSON.stringify(pdfData);
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.equal(emojiRegex.test(jsonString), false, 'Strict Zero-Emoji compliance violated in PDF data export');
});
