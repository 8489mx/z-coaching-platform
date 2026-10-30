import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateUniversalNutritionTargets } from "../src/master-engine-v2/build-master-engine-v2.js";
import { CLINICAL_GUIDELINES } from "../src/config/clinical-guidelines.js";

describe("Tier CS Clinical Fixes & Verification", () => {
  // "Tier CS-0: Item 1 - Kidney Disease Protein Cap" was here. Declared kidney disease is outside
  // the service now (src/api/services/serviceScope.js): no plan is built for it, so the cap it
  // tested is gone. A protein cap that a client's bloodwork asks for is still carried through the
  // plan and the merge - the subtests further down cover that.

  describe("Tier CS-0: Item 2 - Hypertension & Heart Failure Prevention (Valsalva & Inversion Guard)", () => {
    test("Should clamp minimum RIR >= 2 and exclude contraindicated exercises for trainee with HYPERTENSION", async () => {
      const { completeIntake } = await import("./fixtures/complete-intake.js");
      const { evaluateIntake } = await import("../src/intake-decision-engine/index.js");
      const { buildTrainingMesoCycle } = await import("../src/training-engine-v2/index.js");

      const baseIntake = completeIntake();
      const evaluationContext = { assessmentDate: "2026-08-16" };
      const normalDecision = evaluateIntake(baseIntake, evaluationContext);

      // 1. Normal intermediate trainee without hypertension reaches RIR 1 in Peak Overload week
      const normalMeso = buildTrainingMesoCycle(normalDecision, { rawIntake: baseIntake });
      assert.equal(normalMeso.weeks[3].target_rir, 1, "Normal intermediate peak week should reach RIR 1");
      assert.equal(normalMeso.clinical_guardrails.hypertension_guard_active, false);

      // Normal Day 2 has LEG_PRESS_MACHINE
      const normalDay2 = normalMeso.weeks[0].sessions[1];
      const hasNormalLegPress = normalDay2.exercises.some(e => e.exercise_code === "LEG_PRESS_MACHINE");
      assert.equal(hasNormalLegPress, true, "Normal program should contain Leg Press Machine");

      // 2. Trainee with HYPERTENSION
      const hypertensionIntake = {
        ...baseIntake,
        medical: {
          ...baseIntake.medical,
          conditions: [
            {
              conditionCode: "HYPERTENSION",
              otherConditionText: null,
              stability: "STABLE",
              physicianInstructions: [],
              unclassifiedInstructionsText: null
            }
          ]
        }
      };
      const hyperDecision = evaluateIntake(hypertensionIntake, evaluationContext);
      const hyperMeso = buildTrainingMesoCycle(hyperDecision, { rawIntake: hypertensionIntake });

      // Check clinical guardrail flags
      assert.equal(hyperMeso.clinical_guardrails.hypertension_guard_active, true);
      assert.equal(hyperMeso.clinical_guardrails.min_rir_enforced, 2);
      assert.ok(hyperMeso.clinical_guardrails.valsalva_safety_cue_ar.includes("Valsalva"));

      // Week 3 (normally RIR 1) and Week 4 (normally RIR 0) MUST be clamped to RIR >= 2
      assert.equal(hyperMeso.weeks[2].target_rir, 2, "Week 3 should be clamped to RIR 2");
      assert.equal(hyperMeso.weeks[3].target_rir, 2, "Week 4 Peak Overload should be clamped to RIR 2");
      assert.ok(hyperMeso.weeks[3].focus_note.includes("RIR >= 2"));

      // All exercises across all weeks and sessions MUST NOT contain LEG_PRESS_MACHINE or contraindicated exercises
      hyperMeso.weeks.forEach((week) => {
        week.sessions.forEach((session) => {
          session.exercises.forEach((ex) => {
            assert.notEqual(ex.exercise_code, "LEG_PRESS_MACHINE", "LEG_PRESS_MACHINE must be excluded");
            assert.notEqual(ex.exercise_code, "INCLINE_LEG_PRESS", "INCLINE_LEG_PRESS must be excluded");
            assert.notEqual(ex.exercise_code, "DECLINE_CRUNCH", "DECLINE_CRUNCH must be excluded");
            assert.ok(ex.prescription.target_rir >= 2, `Exercise RIR must be >= 2, got ${ex.prescription.target_rir}`);
            assert.ok(ex.prescription.clinical_valsalva_cue_ar.includes("Valsalva"));
          });
        });
      });
    });
  });

  describe("Tier CS-0: Item 3 - Diabetes & Insulin Resistance Hypoglycemia Guard (ADA Protocol)", () => {
    test("Should include hypoglycemia fast-carb rescue guidance for DIABETES and omit it for normal trainees", async () => {
      const { completeIntake } = await import("./fixtures/complete-intake.js");
      const { buildMasterEngineV2 } = await import("../src/master-engine-v2/index.js");
      const { buildNutritionFoodCatalog } = await import("../src/nutrition-food-catalog/index.js");

      const baseIntake = completeIntake();
      const evaluationContext = { assessmentDate: "2026-08-16" };
      const catalog = buildNutritionFoodCatalog([]);

      // 1. Normal trainee without diabetes: hypoglycemia guard is null / inactive
      const normalPlan = buildMasterEngineV2({
        intake: baseIntake,
        evaluationContext,
        nutritionFoodCatalog: catalog,
      });
      assert.equal(normalPlan.hypoglycemia_guard, null, "Normal plan must not have hypoglycemia guard");
      assert.equal(normalPlan.nutrition_program.hypoglycemia_guard, null);
      assert.equal(normalPlan.nutrition_program.targets.clinical_guardrails.hypoglycemia_guard_active, false);

      // 2. Trainee with DIABETES
      const diabeticIntake = {
        ...baseIntake,
        medical: {
          ...baseIntake.medical,
          conditions: [
            {
              conditionCode: "DIABETES",
              otherConditionText: null,
              stability: "STABLE",
              physicianInstructions: [],
              unclassifiedInstructionsText: null
            }
          ]
        }
      };

      const diabeticPlan = buildMasterEngineV2({
        intake: diabeticIntake,
        evaluationContext,
        nutritionFoodCatalog: catalog,
      });

      assert.notEqual(diabeticPlan.hypoglycemia_guard, null, "Diabetic plan MUST have active hypoglycemia guard");
      assert.equal(diabeticPlan.hypoglycemia_guard.active, true);
      assert.equal(diabeticPlan.hypoglycemia_guard.rescue_carbs_grams, 15);
      assert.equal(diabeticPlan.hypoglycemia_guard.session_threshold_minutes, 45);
      assert.ok(diabeticPlan.hypoglycemia_guard.guidance_ar.includes("15-20"));
      assert.ok(diabeticPlan.hypoglycemia_guard.guidance_ar.includes("كربوهيدرات سريعة"));
      assert.equal(diabeticPlan.nutrition_program.targets.clinical_guardrails.hypoglycemia_guard_active, true);
      assert.equal(diabeticPlan.nutrition_program.targets.clinical_guardrails.hypoglycemia_rescue_carbs_grams, 15);
    });
  });

  describe("Tier CS-0: Item 4 - Asthma & Respiratory Conditions Cardio Restriction (GINA Protocol)", () => {
    test("Should restrict HIIT and enforce Zone 2 LISS cardio for trainee with ASTHMA_OR_RESPIRATORY_CONDITION", async () => {
      const { completeIntake } = await import("./fixtures/complete-intake.js");
      const { buildMasterEngineV2 } = await import("../src/master-engine-v2/index.js");
      const { buildNutritionFoodCatalog } = await import("../src/nutrition-food-catalog/index.js");
      const { getPracticalCardioPrescription, CARDIO_TYPES } = await import("../src/execution-engines/cardio-zones-engine.js");

      // 1. Test practical cardio engine directly
      // When requesting HIIT for an asthma client, it MUST convert to LISS
      const asthmaDirectRx = getPracticalCardioPrescription({
        type: CARDIO_TYPES.HIIT_INTERVALS,
        medicalConditions: ["ASTHMA_OR_RESPIRATORY_CONDITION"],
      });
      assert.equal(asthmaDirectRx.type, CARDIO_TYPES.LISS_TALK_TEST, "Direct cardio rx MUST convert HIIT to LISS for asthma");
      assert.equal(asthmaDirectRx.clinical_guardrails.asthma_hiit_banned, true);
      assert.ok(asthmaDirectRx.clinical_guidance_ar.includes("الربو"));

      // 2. Test in full Master Program
      const baseIntake = completeIntake();
      const evaluationContext = { assessmentDate: "2026-08-16" };
      const catalog = buildNutritionFoodCatalog([]);

      const asthmaIntake = {
        ...baseIntake,
        medical: {
          ...baseIntake.medical,
          conditions: [
            {
              conditionCode: "ASTHMA_OR_RESPIRATORY_CONDITION",
              otherConditionText: null,
              stability: "STABLE",
              physicianInstructions: [],
              unclassifiedInstructionsText: null
            }
          ]
        }
      };

      const asthmaPlan = buildMasterEngineV2({
        intake: asthmaIntake,
        evaluationContext,
        nutritionFoodCatalog: catalog,
      });

      assert.equal(asthmaPlan.cardio_program.clinical_guardrails.asthma_guard_active, true);
      assert.equal(asthmaPlan.cardio_program.clinical_guardrails.hiit_banned, true);
      assert.equal(asthmaPlan.cardio_program.clinical_guardrails.preferred_modality, "LISS_ZONE_2");
      assert.ok(asthmaPlan.cardio_program.clinical_guardrails.guidance_ar.includes("الربو"));

      // Verify each cardio session is safe
      (asthmaPlan.cardio_program.weekly_schedule?.sessions || []).forEach((session) => {
        assert.notEqual(session.modality_type, "HIIT", "No cardio session may be HIIT for asthma");
        assert.notEqual(session.modality_type, "HIIT_INTERVALS");
        assert.equal(session.heart_rate_target.zone, "ZONE_2");
      });
    });
  });

  describe("Tier CS-1: Item 5 - Joint Stress Matrix & Injury Bypass in Exercise Swaps API", () => {
    test("Should pass injury query to API, filter out contraindicated exercises, and annotate joint_stress", async () => {
      const { getExerciseSwapsHandler } = await import("../src/api/controllers/exercise.controller.js");
      const { getSmartExerciseSwaps, getExerciseJointStress, EXERCISE_JOINT_STRESS_MAP } = await import("../src/exercise-swap-engine/index.js");

      // 1. Verify EXERCISE_JOINT_STRESS_MAP covers 6 major joints
      const coveredJoints = new Set();
      Object.values(EXERCISE_JOINT_STRESS_MAP).forEach((stressList) => {
        stressList.forEach((j) => coveredJoints.add(j));
      });
      assert.ok(coveredJoints.has("LOWER_BACK"), "Must cover LOWER_BACK");
      assert.ok(coveredJoints.has("KNEE"), "Must cover KNEE");
      assert.ok(coveredJoints.has("SHOULDER"), "Must cover SHOULDER");
      assert.ok(coveredJoints.has("WRIST"), "Must cover WRIST");
      assert.ok(coveredJoints.has("NECK"), "Must cover NECK");
      assert.ok(coveredJoints.has("HIP"), "Must cover HIP");

      // 2. Unfiltered baseline: DUMBBELL_ROMANIAN_DEADLIFT swaps include BARBELL_ROMANIAN_DEADLIFT
      const baselineSwaps = getSmartExerciseSwaps("DUMBBELL_ROMANIAN_DEADLIFT", { environment: "GYM" });
      const hasBarbellRdl = baselineSwaps.some((s) => s.exercise_code === "BARBELL_ROMANIAN_DEADLIFT");
      assert.equal(hasBarbellRdl, true, "Baseline swaps must include BARBELL_ROMANIAN_DEADLIFT");

      // Verify every returned swap has joint_stress array
      baselineSwaps.forEach((swap) => {
        assert.ok(Array.isArray(swap.joint_stress), `Swap ${swap.exercise_code} must have joint_stress array`);
      });

      // 3. API Call with LOWER_BACK injury: must filter out BARBELL_ROMANIAN_DEADLIFT
      function createMockRes() {
        return {
          statusCode: null,
          data: null,
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(payload) {
            this.data = payload;
            return this;
          },
        };
      }

      const reqWithBackInjury = {
        params: { exercise_code: "DUMBBELL_ROMANIAN_DEADLIFT" },
        query: { environment: "GYM", injury: "LOWER_BACK" },
      };
      const resWithBackInjury = createMockRes();

      await getExerciseSwapsHandler(reqWithBackInjury, resWithBackInjury);

      assert.equal(resWithBackInjury.statusCode, 200);
      assert.ok(resWithBackInjury.data.swaps.length > 0, "Must return safe swaps");

      // Must NOT contain BARBELL_ROMANIAN_DEADLIFT or any LOWER_BACK stressing exercise
      resWithBackInjury.data.swaps.forEach((swap) => {
        assert.notEqual(swap.exercise_code, "BARBELL_ROMANIAN_DEADLIFT", "BARBELL_ROMANIAN_DEADLIFT must be excluded for LOWER_BACK injury");
        assert.ok(!swap.joint_stress.includes("LOWER_BACK"), `Swap ${swap.exercise_code} must not stress LOWER_BACK`);
      });

      // Safe alternatives like CABLE_PULL_THROUGH must remain
      const hasSafeCablePull = resWithBackInjury.data.swaps.some((s) => s.exercise_code === "CABLE_PULL_THROUGH");
      assert.equal(hasSafeCablePull, true, "CABLE_PULL_THROUGH should remain available as back-friendly alternative");

      // 4. API Call with multiple comma-separated injuries: injury=KNEE,LOWER_BACK
      const reqMultiInjury = {
        params: { exercise_code: "DUMBBELL_ROMANIAN_DEADLIFT" },
        query: { environment: "GYM", injury: "KNEE,LOWER_BACK" },
      };
      const resMultiInjury = createMockRes();
      await getExerciseSwapsHandler(reqMultiInjury, resMultiInjury);

      assert.equal(resMultiInjury.statusCode, 200);
      resMultiInjury.data.swaps.forEach((swap) => {
        assert.ok(!swap.joint_stress.includes("LOWER_BACK"), `Swap ${swap.exercise_code} must not stress LOWER_BACK`);
        assert.ok(!swap.joint_stress.includes("KNEE"), `Swap ${swap.exercise_code} must not stress KNEE`);
      });
    });
  });

  describe("Tier CS-2: Item 6 - Glycemic Index & Low-FODMAP Clinical Diet Filters", () => {
    test("Should enforce low-to-medium GI for diabetes and low-FODMAP for IBS in food database and swaps", async () => {
      const {
        FOOD_DATABASE,
        isFoodClinicallySafe,
        getCompatibleSwaps,
        GLYCEMIC_INDEX_LEVELS,
        FODMAP_LEVELS,
      } = await import("../src/execution-engines/food-swap-engine.js");

      // 1. Verify every food item has glycemic_index and fodmap_level populated
      const allFoods = Object.values(FOOD_DATABASE).filter((f) => f && typeof f === "object" && f.code);
      assert.ok(allFoods.length > 50, "Food database must contain catalog items");
      allFoods.forEach((food) => {
        assert.ok(
          food.glycemic_index in GLYCEMIC_INDEX_LEVELS,
          `Food ${food.code} must have valid glycemic_index (got ${food.glycemic_index})`
        );
        assert.ok(
          food.fodmap_level in FODMAP_LEVELS,
          `Food ${food.code} must have valid fodmap_level (got ${food.fodmap_level})`
        );
      });

      // 2. DIABETES: High GI foods must be blocked, Low/Medium GI foods must be safe
      const diabeticProfile = {
        conditions: [{ conditionCode: "DIABETES", stability: "STABLE" }],
      };

      // High GI foods (ADA contraindicated):
      assert.equal(FOOD_DATABASE.TABLE_SUGAR.glycemic_index, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.TABLE_SUGAR, diabeticProfile), false, "Table sugar must be blocked for diabetes");

      assert.equal(FOOD_DATABASE.PURE_BEE_HONEY.glycemic_index, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.PURE_BEE_HONEY, diabeticProfile), false, "Honey must be blocked for diabetes");

      assert.equal(FOOD_DATABASE.RICE_CAKES.glycemic_index, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.RICE_CAKES, diabeticProfile), false, "Rice cakes must be blocked for diabetes");

      assert.equal(FOOD_DATABASE.EGYPTIAN_BALADI_BREAD.glycemic_index, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.EGYPTIAN_BALADI_BREAD, diabeticProfile), false, "Baladi bread must be blocked for diabetes");

      // Low / Medium GI foods (ADA compliant):
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.ROLLED_OATS_RAW, diabeticProfile), true, "Rolled oats must be safe for diabetes");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.BASMATI_RICE_COOKED, diabeticProfile), true, "Basmati rice must be safe for diabetes");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.CHICKEN_BREAST, diabeticProfile), true, "Chicken breast must be safe for diabetes");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.STRAWBERRIES, diabeticProfile), true, "Strawberries must be safe for diabetes");

      // Swapping breakfast carbs for diabetic client MUST NOT return RICE_CAKES or BALADI_BREAD
      const diabeticCarbSwaps = getCompatibleSwaps("ROLLED_OATS_RAW", diabeticProfile);
      assert.ok(diabeticCarbSwaps.length > 0, "Must return compatible carb swaps");
      diabeticCarbSwaps.forEach((swap) => {
        assert.notEqual(swap.glycemic_index, "HIGH", `Swap ${swap.code} must not be HIGH GI for diabetic client`);
      });

      // 3. IBS: High FODMAP foods must be blocked, Low FODMAP foods must be safe (Monash protocol)
      const ibsProfile = {
        conditions: [{ conditionCode: "IBS", stability: "STABLE" }],
      };

      // High FODMAP items (Monash contraindicated):
      assert.equal(FOOD_DATABASE.FAVA_BEANS.fodmap_level, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.FAVA_BEANS, ibsProfile), false, "Fava beans must be blocked for IBS");

      assert.equal(FOOD_DATABASE.COOKED_LENTILS.fodmap_level, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.COOKED_LENTILS, ibsProfile), false, "Lentils must be blocked for IBS");

      assert.equal(FOOD_DATABASE.APPLE.fodmap_level, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.APPLE, ibsProfile), false, "Apples must be blocked for IBS");

      assert.equal(FOOD_DATABASE.WHOLE_WHEAT_TOAST.fodmap_level, "HIGH");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHOLE_WHEAT_TOAST, ibsProfile), false, "Wheat toast must be blocked for IBS");

      // Low FODMAP items (Monash compliant):
      assert.equal(FOOD_DATABASE.BASMATI_RICE_COOKED.fodmap_level, "LOW");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.BASMATI_RICE_COOKED, ibsProfile), true, "Basmati rice must be safe for IBS");

      assert.equal(FOOD_DATABASE.BOILED_POTATOES.fodmap_level, "LOW");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.BOILED_POTATOES, ibsProfile), true, "Boiled potatoes must be safe for IBS");

      assert.equal(FOOD_DATABASE.STRAWBERRIES.fodmap_level, "LOW");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.STRAWBERRIES, ibsProfile), true, "Strawberries must be safe for IBS");

      assert.equal(FOOD_DATABASE.CHICKEN_BREAST.fodmap_level, "LOW");
      assert.equal(isFoodClinicallySafe(FOOD_DATABASE.CHICKEN_BREAST, ibsProfile), true, "Chicken breast must be safe for IBS");

      // Main carb swaps for IBS client MUST NOT return High-FODMAP items
      const ibsCarbSwaps = getCompatibleSwaps("BASMATI_RICE_COOKED", ibsProfile);
      assert.ok(ibsCarbSwaps.length > 0, "Must return compatible main carb swaps");
      ibsCarbSwaps.forEach((swap) => {
        assert.notEqual(swap.fodmap_level, "HIGH", `Swap ${swap.code} must not be HIGH FODMAP for IBS client`);
      });
    });
  });

  describe("Tier CS-3: Item 7 - Dynamic Warmup Contraindication Filtering & Joint Protection", () => {
    test("Should filter out SQUAT_TO_STAND from dynamic warmup for lumbar disc and knee injuries and supply safe replacements", async () => {
      const { buildSessionMobilityProtocol } = await import("../src/mobility-warmup-engine-v2/index.js");

      // 1. Normal trainee (Lower body session): receives standard SQUAT_TO_STAND
      const normalProtocol = buildSessionMobilityProtocol("LOWER_A", [], {});
      const normalHasSquatToStand = normalProtocol.dynamic_warmup.exercises.some((e) => e.id === "SQUAT_TO_STAND");
      assert.equal(normalHasSquatToStand, true, "Normal lower session warmup must contain Squat to Stand");

      // 2. Trainee with Lumbar Disc Herniation (DISC / LUMBAR / HERNIATION)
      const discProtocol = buildSessionMobilityProtocol("LOWER_A", [], {
        conditions: [{ conditionCode: "LUMBAR_DISC_HERNIATION", stability: "STABLE" }],
      });
      const discHasSquatToStand = discProtocol.dynamic_warmup.exercises.some((e) => e.id === "SQUAT_TO_STAND");
      assert.equal(discHasSquatToStand, false, "Lumbar disc client MUST NOT have Squat to Stand in dynamic warmup");

      const discHasBirdDog = discProtocol.dynamic_warmup.exercises.some((e) => e.id === "BIRD_DOG_NEUTRAL_SPINE");
      assert.equal(discHasBirdDog, true, "Lumbar disc client MUST receive neutral Bird Dog as safe stabilizer");
      assert.ok(
        discProtocol.clinical_contraindications_bypassed_ar.some((note) => note.includes("Squat to Stand") && note.includes("Bird Dog"))
      );

      // 3. Trainee with Knee Injury / Patellar Tendonitis (KNEE)
      const kneeProtocol = buildSessionMobilityProtocol("LOWER_A", [], {
        conditions: [{ conditionCode: "PATELLAR_TENDINITIS", stability: "STABLE" }],
      });
      const kneeHasSquatToStand = kneeProtocol.dynamic_warmup.exercises.some((e) => e.id === "SQUAT_TO_STAND");
      assert.equal(kneeHasSquatToStand, false, "Knee injury client MUST NOT have Squat to Stand in dynamic warmup");

      const kneeHasGluteBridge = kneeProtocol.dynamic_warmup.exercises.some((e) => e.id === "GLUTE_BRIDGE_ACTIVATION");
      assert.equal(kneeHasGluteBridge, true, "Knee injury client MUST receive safe Glute Bridge activation");
      assert.ok(
        kneeProtocol.clinical_contraindications_bypassed_ar.some((note) => note.includes("Squat to Stand") && note.includes("الجسر الحوضي"))
      );

      // 4. Trainee with Rotator Cuff Impingement (Upper session)
      const shoulderProtocol = buildSessionMobilityProtocol("UPPER_A", [], {
        conditions: [{ conditionCode: "SHOULDER_IMPINGEMENT", stability: "STABLE" }],
      });
      const shoulderHasArmCircles = shoulderProtocol.dynamic_warmup.exercises.some((e) => e.id === "ARM_CIRCLES_SWINGS");
      assert.equal(shoulderHasArmCircles, false, "Shoulder impingement client MUST NOT have unrestricted arm circles");
      const shoulderHasBandDislocates = shoulderProtocol.dynamic_warmup.exercises.some((e) => e.id === "BANDED_DISLOCATES_GENTLE");
      assert.equal(shoulderHasBandDislocates, true, "Shoulder impingement client MUST receive gentle band dislocates");
    });
  });

  describe("End-to-End Full Journey Check: Medically Complex Trainee", () => {
    // Shared fixtures and setup
    async function createComplexTraineeSetup() {
      const { completeIntake } = await import("./fixtures/complete-intake.js");
      const { evaluateIntake } = await import("../src/intake-decision-engine/index.js");
      const { buildMasterEngineV2 } = await import("../src/master-engine-v2/index.js");
      const { buildNutritionFoodCatalog } = await import("../src/nutrition-food-catalog/index.js");

      const weight = 85;
      const base = completeIntake();
      const complexIntake = {
        ...base,
        body: { ...base.body, weightKg: weight, heightCm: 180 },
        goals: { ...base.goals, primary: "FAT_LOSS" },
        medical: {
          ...base.medical,
          conditions: [

            {
              conditionCode: "HYPERTENSION",
              otherConditionText: null,
              stability: "STABLE",
              physicianInstructions: [],
              unclassifiedInstructionsText: null,
            },
            {
              conditionCode: "DIABETES",
              otherConditionText: null,
              stability: "STABLE",
              physicianInstructions: [],
              unclassifiedInstructionsText: null,
            },
            {
              conditionCode: "ASTHMA_OR_RESPIRATORY_CONDITION",
              otherConditionText: null,
              stability: "STABLE",
              physicianInstructions: [],
              unclassifiedInstructionsText: null,
            },
          ],
        },
        training: {
          ...base.training,
          injuries: [
            {
              area: "LOWER_BACK",
              painLevel: 2,
              movementImpact: "LIMITS",
              worsening: false,
              numbnessOrWeakness: false,
              affectedMovements: [],
              medicalRestrictions: [],
            },
          ],
          medicalMovementRestrictions: [],
        },
      };

      const evaluationContext = { assessmentDate: "2026-08-16" };
      const decision = evaluateIntake(complexIntake, evaluationContext);
      const catalog = buildNutritionFoodCatalog([]);
      const masterPlan = buildMasterEngineV2({
        intake: complexIntake,
        evaluationContext,
        nutritionFoodCatalog: catalog,
      });

      return { complexIntake, evaluationContext, decision, catalog, masterPlan, weight };
    }

    // The kidney half of this subtest left with the case: declared kidney disease is outside the
    // service (src/api/services/serviceScope.js) and no plan is built for it.
    test("E2E Subtest 1: Intake & Dual Concurrency - Diabetes & Hypertension Safeguards Co-exist Seamlessly", async () => {
      const { masterPlan } = await createComplexTraineeSetup();

      // 1. The diabetes guard is on in the same plan
      assert.equal(masterPlan.nutrition_program.targets.clinical_guardrails.hypoglycemia_guard_active, true, "Hypoglycemia guard must be active");
      assert.equal(masterPlan.nutrition_program.targets.clinical_guardrails.kidney_protein_capped, false, "No protein cap without one from the bloodwork");

      // 2. Concurrently, hypertension safeguard is fully active in the exact same plan
      assert.equal(masterPlan.training_program.clinical_guardrails.hypertension_guard_active, true, "Hypertension guard must be active simultaneously");
      assert.equal(masterPlan.training_program.clinical_guardrails.min_rir_enforced, 2, "Minimum RIR enforced must be 2");
      assert.ok(masterPlan.training_program.clinical_guardrails.valsalva_safety_cue_ar.includes("Valsalva"), "Valsalva cue must be present");
    });

    test("E2E Subtest 2: Peak Overload Week 4 Clamping - Hypertensive Trainee Capped at RIR 2 vs Normal Trainee Reaching RIR 0", async () => {
      const { completeIntake } = await import("./fixtures/complete-intake.js");
      const { evaluateIntake } = await import("../src/intake-decision-engine/index.js");
      const { buildTrainingMesoCycle } = await import("../src/training-engine-v2/index.js");

      const evaluationContext = { assessmentDate: "2026-08-16" };

      // Normal Trainee Baseline (No hypertension)
      const normalIntake = completeIntake();
      const normalDecision = evaluateIntake(normalIntake, evaluationContext);
      const normalMeso = buildTrainingMesoCycle(normalDecision, { rawIntake: normalIntake });

      // Hypertensive Trainee
      const hyperIntake = {
        ...normalIntake,
        medical: {
          ...normalIntake.medical,
          conditions: [
            {
              conditionCode: "HYPERTENSION",
              otherConditionText: null,
              stability: "STABLE",
              physicianInstructions: [],
              unclassifiedInstructionsText: null,
            },
          ],
        },
      };
      const hyperDecision = evaluateIntake(hyperIntake, evaluationContext);
      const hyperMeso = buildTrainingMesoCycle(hyperDecision, { rawIntake: hyperIntake });

      // Week 1: Introduction
      assert.equal(normalMeso.weeks[0].target_rir, 3, "Normal Week 1 RIR should be 3");
      assert.equal(hyperMeso.weeks[0].target_rir, 3, "Hypertensive Week 1 RIR should be 3");

      // Week 2: Loading
      assert.equal(normalMeso.weeks[1].target_rir, 2, "Normal Week 2 RIR should be 2");
      assert.equal(hyperMeso.weeks[1].target_rir, 2, "Hypertensive Week 2 RIR should be 2");

      // Week 3: Intensification (Normal drops to 1, Hypertensive clamped to 2)
      assert.equal(normalMeso.weeks[2].target_rir, 1, "Normal Week 3 RIR should drop to 1");
      assert.equal(hyperMeso.weeks[2].target_rir, 2, "Hypertensive Week 3 RIR must be clamped to 2 (>= 2)");

      // Week 4: Peak Overload (Normal intermediate reaches RIR 1, Hypertensive strictly clamped to 2)
      assert.equal(normalMeso.weeks[3].target_rir, 1, "Normal intermediate Week 4 Peak Overload should reach RIR 1");
      assert.equal(hyperMeso.weeks[3].target_rir, 2, "Hypertensive Week 4 Peak Overload MUST be clamped to RIR 2 to prevent arterial pressure spikes");

      // Verify every single exercise in Week 4 for hypertensive trainee has RIR >= 2
      hyperMeso.weeks[3].sessions.forEach((session) => {
        session.exercises.forEach((ex) => {
          assert.ok(ex.prescription.target_rir >= 2, `Exercise ${ex.exercise_code} in Week 4 must have RIR >= 2, got ${ex.prescription.target_rir}`);
        });
      });

      // Week 5: Deload
      assert.equal(normalMeso.weeks[4].target_rir, 3, "Normal intermediate Week 5 Deload RIR should be 3");
      assert.equal(hyperMeso.weeks[4].target_rir, 3, "Hypertensive intermediate Week 5 Deload RIR should be 3");
    });

    test("E2E Subtest 3: Full Mesocycle Session Safety - Elimination of Inversion, Leg Press, Valsalva & Flexion Warmups", async () => {
      const { masterPlan } = await createComplexTraineeSetup();
      const meso = masterPlan.training_program;

      // 1. Contraindicated exercises (LEG_PRESS_MACHINE, INCLINE_LEG_PRESS, DECLINE_CRUNCH, DECLINE_BENCH_PRESS) MUST NOT exist in ANY session of ANY week
      meso.weeks.forEach((week) => {
        week.sessions.forEach((session) => {
          session.exercises.forEach((ex) => {
            assert.notEqual(ex.exercise_code, "LEG_PRESS_MACHINE", "LEG_PRESS_MACHINE must be excluded across entire mesocycle");
            assert.notEqual(ex.exercise_code, "INCLINE_LEG_PRESS", "INCLINE_LEG_PRESS must be excluded across entire mesocycle");
            assert.notEqual(ex.exercise_code, "DECLINE_CRUNCH", "DECLINE_CRUNCH must be excluded across entire mesocycle");
            assert.notEqual(ex.exercise_code, "DECLINE_BENCH_PRESS", "DECLINE_BENCH_PRESS must be excluded across entire mesocycle");
            assert.ok(ex.prescription.clinical_valsalva_cue_ar.includes("Valsalva"), "Every exercise must have clinical Valsalva safety cue");
            assert.ok(ex.prescription.target_rir >= 2, `Target RIR must be >= 2 for all exercises, got ${ex.prescription.target_rir}`);
          });
        });
      });

      // 2. Mobility Warmup: SQUAT_TO_STAND MUST NOT exist for lumbar disc trainee
      meso.weeks.forEach((week) => {
        week.sessions.forEach((session) => {
          if (session.mobility_protocol?.dynamic_warmup?.exercises) {
            session.mobility_protocol.dynamic_warmup.exercises.forEach((dynEx) => {
              assert.notEqual(dynEx.id, "SQUAT_TO_STAND", "No session dynamic warmup may have SQUAT_TO_STAND for lumbar disc client");
            });
          }
        });
      });
    });

    test("E2E Subtest 4: Concurrent Cardio & Diabetes Safeguards - Zone 2 LISS Only, Zero HIIT, Hypoglycemia 15g Fast Carbs", async () => {
      const { masterPlan } = await createComplexTraineeSetup();

      // Cardio: Asthma safeguard enforces Zone 2 LISS, strict ban on HIIT
      assert.equal(masterPlan.cardio_program.clinical_guardrails.hiit_banned, true, "HIIT must be banned for asthma");
      assert.equal(masterPlan.cardio_program.clinical_guardrails.preferred_modality, "LISS_ZONE_2");
      (masterPlan.cardio_program.weekly_schedule?.sessions || []).forEach((session) => {
        assert.notEqual(session.modality_type, "HIIT", "Cardio session modality must not be HIIT");
        assert.notEqual(session.modality_type, "HIIT_INTERVALS", "Cardio session modality must not be HIIT_INTERVALS");
      });

      // Diabetes: Hypoglycemia rescue guidance active with 15g fast-acting carbs
      assert.notEqual(masterPlan.hypoglycemia_guard, null, "Hypoglycemia guard must be present");
      assert.equal(masterPlan.hypoglycemia_guard.active, true, "Hypoglycemia guard must be active");
      assert.equal(masterPlan.hypoglycemia_guard.rescue_carbs_grams, 15, "Rescue carbs must be 15g");
      assert.ok(masterPlan.hypoglycemia_guard.guidance_ar.includes("15-20"), "Rationale must reference Rule of 15 (15-20g fast carbs)");
    });

    test("E2E Subtest 5: Live API Controller Simulation - getExerciseSwapsHandler Filters Lumbar Stress & Joint Contraindications", async () => {
      const { getExerciseSwapsHandler } = await import("../src/api/controllers/exercise.controller.js");

      function createMockRes() {
        return {
          statusCode: null,
          data: null,
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(payload) {
            this.data = payload;
            return this;
          },
        };
      }

      // Request live API swaps for DUMBBELL_ROMANIAN_DEADLIFT with LOWER_BACK injury
      const req = {
        params: { exercise_code: "DUMBBELL_ROMANIAN_DEADLIFT" },
        query: { environment: "GYM", injury: "LOWER_BACK" },
      };
      const res = createMockRes();

      await getExerciseSwapsHandler(req, res);

      assert.equal(res.statusCode, 200, "API must return 200 OK");
      assert.ok(res.data.swaps.length > 0, "API must return alternative swaps");

      // Verify that all returned swaps have safe lower back profile (none of them stress LOWER_BACK)
      res.data.swaps.forEach((swap) => {
        assert.notEqual(swap.exercise_code, "BARBELL_ROMANIAN_DEADLIFT", "BARBELL_ROMANIAN_DEADLIFT must be excluded for back injury");
        assert.ok(
          !swap.joint_stress?.includes("LOWER_BACK"),
          `Swap ${swap.exercise_code} must NOT stress LOWER_BACK for a trainee with lower back injury`
        );
      });
    });

    test("E2E Subtest 6: Follow-up Check-in Merge Engine - Preserves Clinical Protein Cap Under Caloric Deficit Adjustments", async () => {
      const { masterPlan } = await createComplexTraineeSetup();
      const { mergeAdaptedPlanIntoProgram } = await import("../src/api/utils/planMergeEngine.js");

      // A protein cap the bloodwork asked for, the way the engine writes it into the plan.
      const capped = JSON.parse(JSON.stringify(masterPlan));
      capped.nutrition_program.targets.protein_g = 68;
      capped.nutrition_program.targets.clinical_guardrails = {
        ...capped.nutrition_program.targets.clinical_guardrails,
        kidney_protein_capped: true,
        max_protein_g: 68,
      };

      // Simulate follow-up check-in with -150 kcal deficit adjustment
      const mergedProgram = mergeAdaptedPlanIntoProgram(capped, {
        adapted_week_number: 2,
        suggested_calorie_delta: -150,
      });

      // Verify that the merge engine preserved the clinical protein cap
      assert.equal(mergedProgram.nutrition_program.targets.clinical_guardrails.kidney_protein_capped, true, "Protein cap flag must persist after adaptation");
      assert.equal(mergedProgram.nutrition_program.targets.protein_g, 68, "Protein must remain capped at exactly 68g after calorie reduction");
      assert.ok(mergedProgram.nutrition_program.targets.protein_g <= 68, "Protein must never exceed 68g");
      assert.equal(mergedProgram.training_program.weeks.length, masterPlan.training_program.weeks.length, "Mesocycle weeks count must be preserved");
    });

    test("E2E Subtest 7: Zero Emojis Compliance - Master Plan Payload Completely Free of Any Unicode Emojis", async () => {
      const { masterPlan } = await createComplexTraineeSetup();
      const rawJson = JSON.stringify(masterPlan);
      const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

      const hasEmoji = emojiRegex.test(rawJson);
      assert.equal(hasEmoji, false, "Generated master plan JSON payload must contain ZERO emojis");
    });

    test("E2E Subtest 8: Single Source of Truth - src/config/clinical-guidelines.js is the Exclusive Authority (Zero Duplicate Files)", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const { fileURLToPath } = await import("node:url");

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const backendPath = path.resolve(__dirname, "../src/config/clinical-guidelines.js");
      const frontendDuplicatePath = path.resolve(__dirname, "../frontend/src/config/clinical-guidelines.js");

      // 1. Backend master config MUST exist and export CLINICAL_GUIDELINES
      assert.equal(fs.existsSync(backendPath), true, "Master clinical guidelines must exist in src/config/clinical-guidelines.js");
      assert.ok(CLINICAL_GUIDELINES, "CLINICAL_GUIDELINES must be loaded and defined");
      assert.equal(CLINICAL_GUIDELINES.LAB_PROTEIN_CAP.LACTATION_EXTRA_PROTEIN_G, 25);
      assert.equal(CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR, 2);

      // 2. Frontend duplicate file MUST NOT exist on disk (prohibiting dual sources of truth)
      assert.equal(
        fs.existsSync(frontendDuplicatePath),
        false,
        "Duplicate frontend clinical-guidelines.js MUST NOT exist on disk to prevent silent drift"
      );
    });

    test("E2E Subtest 9: Coach Manual Override Safety Check - Warns & Audits Kidney Protein Exceedance in CoachEditor Route", async () => {
      const { updateCustomProgram } = await import("../src/api/controllers/program.controller.js");
      const { User, Program } = await import("../src/api/models/index.js");

      // Save originals
      const origUserFindByPk = User.findByPk;
      const origUserFindOne = User.findOne;
      const origProgramFindOne = Program.findOne;
      const origProgramCreate = Program.create;

      try {
        const mockKidneyUser = {
          id: 999,
          role: "COACH",
          name: "عميل كلى للاختبار",
          weight: 80,
          weight_kg: 80,
          medical_conditions: [{ conditionCode: "KIDNEY_CONDITION" }]
        };

        User.findByPk = async (id) => (Number(id) === 999 ? mockKidneyUser : null);
        User.findOne = async () => null;

        let savedProgramData = null;
        let mockProgramInstance = {
          id: 555,
          user_id: 999,
          program_data: {},
          changed: function() {},
          save: async function() {
            savedProgramData = this.program_data;
            return this;
          }
        };

        Program.findOne = async () => mockProgramInstance;

        // Scenario A: Coach attempts to enter 150g protein (exceeding 80g safe cap)
        const unsafeReq = {
          user: { id: 999 },
          body: {
            user_id: 999,
            program_data: {
              client: { weight_kg: 80, medical_conditions: [{ conditionCode: "KIDNEY_CONDITION" }] },
              clinical_guardrails: { kidney_protein_capped: true, max_protein_g: 80 },
              nutrition: {
                targets: { calories: 2000, protein: 150, carbs: 200, fats: 60 },
                meals: []
              }
            },
            coach_notes: "تعديل يدوي من المدرب",
            publish: false
          }
        };

        let responseA = null;
        const resA = {
          status: (code) => ({
            json: (data) => {
              responseA = { statusCode: code, data };
              return responseA;
            }
          })
        };

        await updateCustomProgram(unsafeReq, resA);

        assert.equal(responseA.statusCode, 200);
        assert.ok(responseA.data.clinical_warning, "Clinical warning must be returned in API response");
        assert.ok(responseA.data.clinical_warning.includes("تنبيه سريري"), "Warning must explicitly mention clinical alert");
        assert.ok(responseA.data.clinical_warning.includes("150"), "Warning must mention entered protein");
        assert.ok(responseA.data.clinical_warning.includes("80"), "Warning must mention safe protein cap");

        // Audit Trail verification in saved program_data
        assert.ok(savedProgramData.clinical_guardrails.coach_override_warning, "Audit trail must record the warning message");
        assert.equal(savedProgramData.clinical_guardrails.coach_override_protein_g, 150, "Audit trail must record the override protein amount");
        assert.ok(savedProgramData.clinical_guardrails.coach_override_at, "Audit trail must record timestamp");

        // Scenario B: Safe update within limits (75g protein <= 80g cap)
        const safeReq = {
          user: { id: 999 },
          body: {
            user_id: 999,
            program_data: {
              client: { weight_kg: 80, medical_conditions: [{ conditionCode: "KIDNEY_CONDITION" }] },
              clinical_guardrails: { kidney_protein_capped: true, max_protein_g: 80 },
              nutrition: {
                targets: { calories: 1800, protein: 75, carbs: 220, fats: 55 },
                meals: []
              }
            },
            publish: false
          }
        };

        let responseB = null;
        const resB = {
          status: (code) => ({
            json: (data) => {
              responseB = { statusCode: code, data };
              return responseB;
            }
          })
        };

        await updateCustomProgram(safeReq, resB);

        assert.equal(responseB.statusCode, 200);
        assert.equal(responseB.data.clinical_warning, null, "Clinical warning must be null for safe protein targets");

        // Scenario C: Hypertension override (Coach manually enters LEG_PRESS_MACHINE or RIR 1)
        const hyperUser = {
          id: 998,
          role: "COACH",
          name: "عميل ضغط للاختبار",
          weight: 85,
          medical_conditions: [{ conditionCode: "HYPERTENSION" }]
        };
        User.findByPk = async (id) => (Number(id) === 998 ? hyperUser : (Number(id) === 999 ? mockKidneyUser : null));

        const unsafeHyperReq = {
          user: { id: 998 },
          body: {
            user_id: 998,
            program_data: {
              client: { weight_kg: 85, medical_conditions: [{ conditionCode: "HYPERTENSION" }] },
              clinical_guardrails: { hypertension_guard_active: true },
              training: {
                weeks: [
                  {
                    week_number: 1,
                    sessions: [
                      {
                        session_number: 1,
                        exercises: [
                          { code: "LEG_PRESS_MACHINE", name_ar: "مكبس أرجل", rir: 1 }
                        ]
                      }
                    ]
                  }
                ]
              }
            },
            publish: false
          }
        };

        let responseC = null;
        const resC = {
          status: (code) => ({
            json: (data) => {
              responseC = { statusCode: code, data };
              return responseC;
            }
          })
        };

        await updateCustomProgram(unsafeHyperReq, resC);

        assert.equal(responseC.statusCode, 200);
        assert.ok(responseC.data.clinical_warning, "Clinical warning must be returned for hypertension violations");
        assert.ok(responseC.data.clinical_warning.includes("ضغط الدم"), "Warning must mention blood pressure");
        assert.equal(savedProgramData.clinical_guardrails.coach_override_hypertension, true);

        // Scenario D: Asthma override (Coach manually enters HIIT cardio)
        const asthmaUser = {
          id: 997,
          role: "COACH",
          name: "عميل ربو للاختبار",
          weight: 70,
          medical_conditions: [{ conditionCode: "ASTHMA_OR_RESPIRATORY_CONDITION" }]
        };
        User.findByPk = async (id) => (Number(id) === 997 ? asthmaUser : (Number(id) === 998 ? hyperUser : mockKidneyUser));

        const unsafeAsthmaReq = {
          user: { id: 997 },
          body: {
            user_id: 997,
            program_data: {
              client: { weight_kg: 70, medical_conditions: [{ conditionCode: "ASTHMA_OR_RESPIRATORY_CONDITION" }] },
              cardio: {
                modality: "HIIT_SPRINT",
                target_heart_rate_zone: "Zone 4 / HIIT"
              }
            },
            publish: false
          }
        };

        let responseD = null;
        const resD = {
          status: (code) => ({
            json: (data) => {
              responseD = { statusCode: code, data };
              return responseD;
            }
          })
        };

        await updateCustomProgram(unsafeAsthmaReq, resD);

        assert.equal(responseD.statusCode, 200);
        assert.ok(responseD.data.clinical_warning, "Clinical warning must be returned for asthma HIIT");
        assert.ok(responseD.data.clinical_warning.includes("الربو"), "Warning must mention asthma");
        assert.equal(savedProgramData.clinical_guardrails.coach_override_asthma, true);
      } finally {
        User.findByPk = origUserFindByPk;
        User.findOne = origUserFindOne;
        Program.findOne = origProgramFindOne;
        Program.create = origProgramCreate;
      }
    });

    test("E2E Subtest 10: Follow-up Check-in Preservation of Coach Documented Overrides - planMergeEngine Respects Active Overrides vs Silent Clamping", async () => {
      const { mergeAdaptedPlanIntoProgram } = await import("../src/api/utils/planMergeEngine.js");

      // Baseline: Trainee with Kidney Condition and documented Coach Override to 150g protein
      const baseProgramWithCoachOverride = {
        client: { weight_kg: 80, medical_conditions: [{ conditionCode: "KIDNEY_CONDITION" }] },
        current_training_week: 1,
        clinical_guardrails: {
          kidney_protein_capped: true,
          max_protein_g: 80,
          coach_override_warning: "تجاوز يدوي معتمد من الكابتن",
          coach_override_protein_g: 150
        },
        nutrition: {
          targets: {
            calories: 2200,
            protein: 150,
            carbs: 250,
            fats: 66,
            clinical_guardrails: {
              kidney_protein_capped: true,
              max_protein_g: 80,
              coach_override_protein_g: 150
            }
          },
          meals: []
        },
        nutrition_program: {
          targets: {
            calories_kcal: 2200,
            protein_g: 150,
            carb_g: 250,
            fat_g: 66,
            clinical_guardrails: {
              kidney_protein_capped: true,
              max_protein_g: 80,
              coach_override_protein_g: 150
            }
          }
        }
      };

      // 1. Weekly check-in triggers a 150 kcal deficit adaptation
      const adaptationResult = {
        suggested_calorie_delta: -150,
        suggested_carb_delta_g: -38,
        adapted_week_number: 2
      };

      const mergedPlan = mergeAdaptedPlanIntoProgram(baseProgramWithCoachOverride, adaptationResult);

      // Verify that the coach's documented override (150g) is preserved and NOT clamped to 80g!
      assert.equal(
        mergedPlan.nutrition.targets.protein,
        150,
        "planMergeEngine must respect the coach's documented protein override (150g) and not reset it to 80g"
      );
      assert.equal(
        mergedPlan.nutrition_program.targets.protein_g,
        150,
        "nutrition_program protein must preserve the 150g coach override"
      );
      // Calorie cut correctly taken from carbohydrates
      assert.equal(mergedPlan.nutrition.targets.calories, 2050, "Calories must be reduced by 150 kcal");
      assert.equal(mergedPlan.nutrition.targets.carbs, 212, "Carbs must be reduced by 38g");

      // 2. Trainee with Kidney Condition WITHOUT a coach override: strict 80g cap MUST be enforced
      const baseProgramWithoutOverride = {
        client: { weight_kg: 80, medical_conditions: [{ conditionCode: "KIDNEY_CONDITION" }] },
        current_training_week: 1,
        clinical_guardrails: {
          kidney_protein_capped: true,
          max_protein_g: 80
        },
        nutrition: {
          targets: {
            calories: 2200,
            protein: 80,
            carbs: 290,
            fats: 66,
            clinical_guardrails: {
              kidney_protein_capped: true,
              max_protein_g: 80
            }
          }
        },
        nutrition_program: {
          targets: {
            calories_kcal: 2200,
            protein_g: 80,
            carb_g: 290,
            fat_g: 66,
            clinical_guardrails: {
              kidney_protein_capped: true,
              max_protein_g: 80
            }
          }
        }
      };

      // If an adaptation engine tries to suggest an unsafe 120g protein
      const unsafeAdaptation = {
        adapted_nutrition: {
          target_calories_kcal: 2000,
          protein_g: 120, // Unsafe for kidney
          carbohydrate_g: 240,
          fat_g: 50
        }
      };

      const mergedDefaultPlan = mergeAdaptedPlanIntoProgram(baseProgramWithoutOverride, unsafeAdaptation);
      assert.equal(
        mergedDefaultPlan.nutrition.targets.protein,
        80,
        "In the absence of a coach override, planMergeEngine must strictly enforce the 80g cap"
      );
    });
  });
});




